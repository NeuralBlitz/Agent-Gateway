import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { logger } from '../infra/index.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TodoStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type TodoPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate?: string; // ISO 8601 date string
  category?: string;
  tags?: string[];
  parentId?: string; // for hierarchical sub-todos
  children?: TodoItem[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601;
  completedAt?: string; // ISO 8601
}

export type TodoSortField = 'createdAt' | 'dueDate' | 'priority' | 'title' | 'status';
export type TodoSortOrder = 'asc' | 'desc';

export interface TodoFilter {
  status?: TodoStatus | TodoStatus[];
  priority?: TodoPriority | TodoPriority[];
  category?: string;
  tags?: string[];
  parentId?: string | null; // null for top-level only, string for specific parent, undefined for all
  overdue?: boolean;
  search?: string;
}

export interface TodoSort {
  field: TodoSortField;
  order: TodoSortOrder;
}

export interface TodoStats {
  total: number;
  byStatus: Record<TodoStatus, number>;
  byPriority: Record<TodoPriority, number>;
  overdueCount: number;
  completedCount: number;
  completionRate: number; // percentage 0-100
}

export interface TodoListResult {
  todos: TodoItem[];
  total: number;
  filtered: number;
}

export interface TodoBulkResult {
  affected: number;
  ids: string[];
}

export interface TodoToolResult {
  success: boolean;
  message: string;
  data?: Record<string, any>;
  error?: string;
}

export interface TodoToolConfig {
  /** Path to JSON file for persistence. If omitted, todos are in-memory only. */
  persistencePath?: string;
  /** Auto-save after every mutation (default: true) */
  autoSave?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

let _counter = 0;

function generateId(): string {
  _counter += 1;
  const ts = Date.now().toString(36);
  const seq = _counter.toString(36);
  return `todo_${ts}_${seq}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function isOverdue(todo: TodoItem): boolean {
  if (!todo.dueDate || todo.status === 'completed' || todo.status === 'cancelled') return false;
  return new Date(todo.dueDate) < new Date();
}

function priorityWeight(p: TodoPriority): number {
  switch (p) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
  }
}

function statusWeight(s: TodoStatus): number {
  switch (s) {
    case 'pending': return 1;
    case 'in-progress': return 2;
    case 'completed': return 3;
    case 'cancelled': return 4;
  }
}

function matchesFilter(todo: TodoItem, filter?: TodoFilter): boolean {
  if (!filter) return true;

  if (filter.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    if (!statuses.includes(todo.status)) return false;
  }

  if (filter.priority) {
    const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
    if (!priorities.includes(todo.priority)) return false;
  }

  if (filter.category !== undefined) {
    if (todo.category !== filter.category) return false;
  }

  if (filter.tags && filter.tags.length > 0) {
    const todoTags = todo.tags || [];
    if (!filter.tags.some((t) => todoTags.includes(t))) return false;
  }

  if (filter.parentId !== undefined) {
    if (filter.parentId === null) {
      if (todo.parentId !== undefined && todo.parentId !== null) return false;
    } else {
      if (todo.parentId !== filter.parentId) return false;
    }
  }

  if (filter.overdue) {
    if (!isOverdue(todo)) return false;
  }

  if (filter.search) {
    const q = filter.search.toLowerCase();
    const inTitle = todo.title.toLowerCase().includes(q);
    const inDesc = todo.description?.toLowerCase().includes(q);
    const inTags = (todo.tags || []).some((t) => t.toLowerCase().includes(q));
    const inCat = todo.category?.toLowerCase().includes(q);
    if (!inTitle && !inDesc && !inTags && !inCat) return false;
  }

  return true;
}

function sortTodos(todos: TodoItem[], sort: TodoSort): TodoItem[] {
  return [...todos].sort((a, b) => {
    let cmp = 0;
    switch (sort.field) {
      case 'priority':
        cmp = priorityWeight(a.priority) - priorityWeight(b.priority);
        break;
      case 'status':
        cmp = statusWeight(a.status) - statusWeight(b.status);
        break;
      case 'dueDate': {
        const dA = a.dueDate || '9999-12-31';
        const dB = b.dueDate || '9999-12-31';
        cmp = dA < dB ? -1 : dA > dB ? 1 : 0;
        break;
      }
      case 'title':
        cmp = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
        break;
    }
    return sort.order === 'desc' ? -cmp : cmp;
  });
}

function buildTree(todos: TodoItem[]): TodoItem[] {
  const byId = new Map<string, TodoItem>();
  const roots: TodoItem[] = [];

  for (const t of todos) {
    byId.set(t.id, { ...t, children: [] });
  }

  for (const t of byId.values()) {
    if (t.parentId && byId.has(t.parentId)) {
      byId.get(t.parentId)!.children!.push(t);
    } else {
      roots.push(t);
    }
  }

  return roots;
}

function flattenTree(roots: TodoItem[]): TodoItem[] {
  const result: TodoItem[] = [];
  const stack = [...roots];
  while (stack.length > 0) {
    const node = stack.shift()!;
    const { children, ...rest } = node;
    result.push({ ...rest, children: children && children.length > 0 ? children : undefined });
    if (children) {
      stack.push(...children);
    }
  }
  return result;
}

// ─── TodoTool Class ──────────────────────────────────────────────────────────

export class TodoTool {
  private todos: Map<string, TodoItem> = new Map();
  private config: Required<Omit<TodoToolConfig, 'persistencePath'>> & { persistencePath?: string };

  constructor(config: TodoToolConfig = {}) {
    this.config = {
      persistencePath: config.persistencePath,
      autoSave: config.autoSave ?? true,
    };

    if (this.config.persistencePath) {
      this.load();
    }
  }

  // ── Persistence ──────────────────────────────────────────────────────────

  private load(): void {
    const p = this.config.persistencePath;
    if (!p || !existsSync(p)) return;
    try {
      const raw = readFileSync(p, 'utf-8');
      const data: TodoItem[] = JSON.parse(raw);
      this.todos.clear();
      for (const item of data) {
        this.todos.set(item.id, item);
      }
      logger.info({ count: this.todos.size, path: p }, 'Loaded todos from persistence');
    } catch (err: any) {
      logger.warn({ path: p, error: err.message }, 'Failed to load todos, starting fresh');
    }
  }

  private save(): void {
    const p = this.config.persistencePath;
    if (!p) return;
    try {
      const dir = dirname(p);
      if (dir && !existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.todos.values());
      writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
      logger.debug({ count: data.length, path: p }, 'Saved todos');
    } catch (err: any) {
      logger.error({ path: p, error: err.message }, 'Failed to save todos');
    }
  }

  private maybeSave(): void {
    if (this.config.autoSave) this.save();
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  create(params: {
    title: string;
    description?: string;
    priority?: TodoPriority;
    dueDate?: string;
    category?: string;
    tags?: string[];
    parentId?: string;
  }): TodoToolResult {
    if (!params.title || params.title.trim().length === 0) {
      return { success: false, message: 'Title is required', error: 'TITLE_REQUIRED' };
    }

    if (params.parentId && !this.todos.has(params.parentId)) {
      return { success: false, message: `Parent todo not found: ${params.parentId}`, error: 'PARENT_NOT_FOUND' };
    }

    if (params.dueDate) {
      const d = new Date(params.dueDate);
      if (isNaN(d.getTime())) {
        return { success: false, message: `Invalid due date: ${params.dueDate}`, error: 'INVALID_DATE' };
      }
    }

    const now = nowIso();
    const todo: TodoItem = {
      id: generateId(),
      title: params.title.trim(),
      description: params.description,
      status: 'pending',
      priority: params.priority || 'medium',
      dueDate: params.dueDate,
      category: params.category,
      tags: params.tags,
      parentId: params.parentId,
      createdAt: now,
      updatedAt: now,
    };

    this.todos.set(todo.id, todo);
    this.maybeSave();

    logger.info({ id: todo.id, title: todo.title }, 'Created todo');
    return {
      success: true,
      message: `Created todo: ${todo.title}`,
      data: { todo },
    };
  }

  get(id: string): TodoToolResult {
    const todo = this.todos.get(id);
    if (!todo) {
      return { success: false, message: `Todo not found: ${id}`, error: 'NOT_FOUND' };
    }
    return { success: true, message: 'Todo found', data: { todo } };
  }

  update(id: string, params: {
    title?: string;
    description?: string;
    priority?: TodoPriority;
    status?: TodoStatus;
    dueDate?: string;
    category?: string;
    tags?: string[];
  }): TodoToolResult {
    const existing = this.todos.get(id);
    if (!existing) {
      return { success: false, message: `Todo not found: ${id}`, error: 'NOT_FOUND' };
    }

    if (params.dueDate) {
      const d = new Date(params.dueDate);
      if (isNaN(d.getTime())) {
        return { success: false, message: `Invalid due date: ${params.dueDate}`, error: 'INVALID_DATE' };
      }
    }

    const now = nowIso();
    const updated: TodoItem = {
      ...existing,
      title: params.title !== undefined ? params.title.trim() : existing.title,
      description: params.description !== undefined ? params.description : existing.description,
      priority: params.priority !== undefined ? params.priority : existing.priority,
      status: params.status !== undefined ? params.status : existing.status,
      dueDate: params.dueDate !== undefined ? params.dueDate : existing.dueDate,
      category: params.category !== undefined ? params.category : existing.category,
      tags: params.tags !== undefined ? params.tags : existing.tags,
      updatedAt: now,
    };

    if (params.status === 'completed' && existing.status !== 'completed') {
      updated.completedAt = now;
    } else if (params.status && params.status !== 'completed') {
      updated.completedAt = undefined;
    }

    this.todos.set(id, updated);
    this.maybeSave();

    logger.info({ id, action: 'update' }, 'Updated todo');
    return { success: true, message: `Updated todo: ${updated.title}`, data: { todo: updated } };
  }

  delete(id: string, includeChildren = false): TodoToolResult {
    const existing = this.todos.get(id);
    if (!existing) {
      return { success: false, message: `Todo not found: ${id}`, error: 'NOT_FOUND' };
    }

    const idsToDelete = [id];
    if (includeChildren) {
      for (const t of this.todos.values()) {
        if (t.parentId === id) idsToDelete.push(t.id);
      }
    } else {
      // Orphan children (set parentId to undefined)
      for (const t of this.todos.values()) {
        if (t.parentId === id) {
          t.parentId = undefined;
          t.updatedAt = nowIso();
        }
      }
    }

    for (const delId of idsToDelete) {
      this.todos.delete(delId);
    }
    this.maybeSave();

    logger.info({ id, deleted: idsToDelete.length }, 'Deleted todo(s)');
    return {
      success: true,
      message: `Deleted ${idsToDelete.length} todo(s)`,
      data: { deletedIds: idsToDelete },
    };
  }

  // ── Status helpers ───────────────────────────────────────────────────────

  markComplete(id: string): TodoToolResult {
    return this.update(id, { status: 'completed' });
  }

  markInProgress(id: string): TodoToolResult {
    return this.update(id, { status: 'in-progress' });
  }

  // ── List / Query ─────────────────────────────────────────────────────────

  list(params: {
    filter?: TodoFilter;
    sort?: TodoSort;
    tree?: boolean;
    limit?: number;
    offset?: number;
  } = {}): TodoListResult {
    let items = Array.from(this.todos.values());

    // Apply filter
    if (params.filter) {
      items = items.filter((t) => matchesFilter(t, params.filter));
    }

    const total = items.length;

    // Apply sort
    if (params.sort) {
      items = sortTodos(items, params.sort);
    }

    // Pagination
    const offset = params.offset ?? 0;
    const limit = params.limit ?? items.length;
    items = items.slice(offset, offset + limit);

    // Build tree if requested
    if (params.tree) {
      items = buildTree(items);
    }

    return { todos: items, total, filtered: items.length };
  }

  search(query: string, params?: {
    priority?: TodoPriority | TodoPriority[];
    status?: TodoStatus | TodoStatus[];
    category?: string;
    sort?: TodoSort;
  }): TodoListResult {
    return this.list({
      filter: { search: query, priority: params?.priority, status: params?.status, category: params?.category },
      sort: params?.sort,
    });
  }

  getSubTodos(parentId: string): TodoToolResult {
    const parent = this.todos.get(parentId);
    if (!parent) {
      return { success: false, message: `Todo not found: ${parentId}`, error: 'NOT_FOUND' };
    }
    const children = Array.from(this.todos.values()).filter((t) => t.parentId === parentId);
    return { success: true, message: `Found ${children.length} sub-todo(s)`, data: { todos: children } };
  }

  // ── Statistics ───────────────────────────────────────────────────────────

  stats(): TodoToolResult {
    const all = Array.from(this.todos.values());
    const total = all.length;

    const byStatus: Record<TodoStatus, number> = { pending: 0, 'in-progress': 0, completed: 0, cancelled: 0 };
    const byPriority: Record<TodoPriority, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    let overdueCount = 0;

    for (const t of all) {
      byStatus[t.status] += 1;
      byPriority[t.priority] += 1;
      if (isOverdue(t)) overdueCount += 1;
    }

    const stats: TodoStats = {
      total,
      byStatus,
      byPriority,
      overdueCount,
      completedCount: byStatus.completed,
      completionRate: total > 0 ? Math.round((byStatus.completed / total) * 100) : 0,
    };

    return { success: true, message: 'Todo statistics', data: { stats } };
  }

  // ── Bulk operations ──────────────────────────────────────────────────────

  bulkUpdateStatus(status: TodoStatus, filter?: { category?: string; tags?: string[] }): TodoBulkResult {
    const ids: string[] = [];
    const now = nowIso();

    for (const todo of this.todos.values()) {
      if (filter) {
        if (filter.category && todo.category !== filter.category) continue;
        if (filter.tags && filter.tags.length > 0) {
          const todoTags = todo.tags || [];
          if (!filter.tags.some((t) => todoTags.includes(t))) continue;
        }
      }

      todo.status = status;
      todo.updatedAt = now;
      if (status === 'completed') {
        todo.completedAt = now;
      } else {
        todo.completedAt = undefined;
      }
      ids.push(todo.id);
    }

    this.maybeSave();
    logger.info({ status, count: ids.length }, 'Bulk updated todo status');
    return { affected: ids.length, ids };
  }

  clearCompleted(): TodoBulkResult {
    const ids: string[] = [];
    for (const [id, todo] of this.todos) {
      if (todo.status === 'completed') {
        ids.push(id);
      }
    }
    for (const id of ids) {
      this.todos.delete(id);
    }
    this.maybeSave();
    logger.info({ count: ids.length }, 'Cleared completed todos');
    return { affected: ids.length, ids };
  }

  bulkDeleteByCategory(category: string): TodoBulkResult {
    const ids: string[] = [];
    for (const [id, todo] of this.todos) {
      if (todo.category === category) {
        ids.push(id);
      }
    }
    for (const id of ids) {
      this.todos.delete(id);
    }
    this.maybeSave();
    logger.info({ category, count: ids.length }, 'Bulk deleted todos by category');
    return { affected: ids.length, ids };
  }

  // ── Data access (for export / sync) ──────────────────────────────────────

  exportAll(): TodoItem[] {
    return Array.from(this.todos.values());
  }

  importAll(todos: TodoItem[]): void {
    this.todos.clear();
    for (const t of todos) {
      this.todos.set(t.id, t);
    }
    this.maybeSave();
    logger.info({ count: todos.length }, 'Imported todos');
  }

  count(): number {
    return this.todos.size;
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createTodoTool(config?: TodoToolConfig): TodoTool {
  return new TodoTool(config);
}

// ─── ToolDefinition (OpenAI function-calling format) ────────────────────────

export function createTodoToolDefinition(config?: TodoToolConfig) {
  const tool = new TodoTool(config);

  return {
    name: 'todo',
    description: 'Manage a todo list: create, update, delete, list, search, get stats, and perform bulk operations. Supports priorities, due dates, categories, tags, and hierarchical sub-todos.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'create', 'get', 'update', 'delete',
            'mark_complete', 'mark_in_progress',
            'list', 'search', 'get_subtodos',
            'stats',
            'bulk_update_status', 'clear_completed', 'bulk_delete_by_category',
          ],
          description: 'The todo action to perform',
        },
        // ── create ──────────────────────────────────────────
        id: {
          type: 'string',
          description: 'Todo ID (required for get, update, delete, mark_complete, mark_in_progress, get_subtodos)',
        },
        title: {
          type: 'string',
          description: 'Todo title (required for create)',
        },
        description: {
          type: 'string',
          description: 'Detailed description of the todo',
        },
        priority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Priority level (default: medium)',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO 8601 format (e.g. 2026-04-15T18:00:00Z)',
        },
        category: {
          type: 'string',
          description: 'Category for grouping (e.g. "work", "personal")',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for labeling',
        },
        parentId: {
          type: 'string',
          description: 'Parent todo ID to create a sub-todo',
        },
        includeChildren: {
          type: 'boolean',
          description: 'When deleting, also delete all sub-todos (default: false, orphan them)',
        },
        // ── list filter ─────────────────────────────────────
        filterStatus: {
          type: 'string',
          enum: ['pending', 'in-progress', 'completed', 'cancelled'],
          description: 'Filter by status (for list action)',
        },
        filterPriority: {
          type: 'string',
          enum: ['low', 'medium', 'high', 'critical'],
          description: 'Filter by priority (for list action)',
        },
        filterCategory: {
          type: 'string',
          description: 'Filter by category (for list action)',
        },
        filterTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by tags — must have at least one matching tag',
        },
        filterOverdue: {
          type: 'boolean',
          description: 'Only show overdue todos (for list action)',
        },
        // ── list options ────────────────────────────────────
        tree: {
          type: 'boolean',
          description: 'Return todos as a hierarchical tree (for list action)',
        },
        sortField: {
          type: 'string',
          enum: ['createdAt', 'dueDate', 'priority', 'title', 'status'],
          description: 'Field to sort by',
        },
        sortOrder: {
          type: 'string',
          enum: ['asc', 'desc'],
          description: 'Sort order',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return',
        },
        offset: {
          type: 'number',
          description: 'Number of results to skip (pagination)',
        },
        // ── search ──────────────────────────────────────────
        query: {
          type: 'string',
          description: 'Search query — matches title, description, tags, category (for search action)',
        },
        // ── bulk_update_status ──────────────────────────────
        bulkStatus: {
          type: 'string',
          enum: ['pending', 'in-progress', 'completed', 'cancelled'],
          description: 'Status to set for bulk update',
        },
        bulkCategory: {
          type: 'string',
          description: 'Filter bulk update by category',
        },
        bulkTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter bulk update by tags',
        },
      },
      required: ['action'],
    },
    execute: async (params: Record<string, any>) => {
      const action = params.action as string;

      switch (action) {
        case 'create': {
          if (!params.title) {
            return { success: false, message: 'Title is required for create', error: 'MISSING_TITLE' };
          }
          return tool.create({
            title: params.title as string,
            description: params.description as string | undefined,
            priority: params.priority as TodoPriority | undefined,
            dueDate: params.dueDate as string | undefined,
            category: params.category as string | undefined,
            tags: params.tags as string[] | undefined,
            parentId: params.parentId as string | undefined,
          });
        }

        case 'get': {
          if (!params.id) {
            return { success: false, message: 'ID is required for get', error: 'MISSING_ID' };
          }
          return tool.get(params.id as string);
        }

        case 'update': {
          if (!params.id) {
            return { success: false, message: 'ID is required for update', error: 'MISSING_ID' };
          }
          return tool.update(params.id as string, {
            title: params.title as string | undefined,
            description: params.description as string | undefined,
            priority: params.priority as TodoPriority | undefined,
            status: params.status as TodoStatus | undefined,
            dueDate: params.dueDate as string | undefined,
            category: params.category as string | undefined,
            tags: params.tags as string[] | undefined,
          });
        }

        case 'delete': {
          if (!params.id) {
            return { success: false, message: 'ID is required for delete', error: 'MISSING_ID' };
          }
          return tool.delete(params.id as string, params.includeChildren as boolean | undefined);
        }

        case 'mark_complete': {
          if (!params.id) {
            return { success: false, message: 'ID is required for mark_complete', error: 'MISSING_ID' };
          }
          return tool.markComplete(params.id as string);
        }

        case 'mark_in_progress': {
          if (!params.id) {
            return { success: false, message: 'ID is required for mark_in_progress', error: 'MISSING_ID' };
          }
          return tool.markInProgress(params.id as string);
        }

        case 'list': {
          const filter: TodoFilter = {};
          if (params.filterStatus) filter.status = params.filterStatus as TodoStatus;
          if (params.filterPriority) filter.priority = params.filterPriority as TodoPriority;
          if (params.filterCategory !== undefined) filter.category = params.filterCategory as string;
          if (params.filterTags) filter.tags = params.filterTags as string[];
          if (params.filterOverdue) filter.overdue = true;

          const sort: TodoSort | undefined = params.sortField
            ? { field: params.sortField as TodoSortField, order: (params.sortOrder as TodoSortOrder) || 'asc' }
            : undefined;

          return tool.list({
            filter,
            sort,
            tree: params.tree as boolean | undefined,
            limit: params.limit as number | undefined,
            offset: params.offset as number | undefined,
          });
        }

        case 'search': {
          if (!params.query) {
            return { success: false, message: 'Query is required for search', error: 'MISSING_QUERY' };
          }
          return tool.search(params.query as string, {
            priority: params.filterPriority as TodoPriority | TodoPriority[] | undefined,
            status: params.filterStatus as TodoStatus | TodoStatus[] | undefined,
            category: params.filterCategory as string | undefined,
            sort: params.sortField
              ? { field: params.sortField as TodoSortField, order: (params.sortOrder as TodoSortOrder) || 'asc' }
              : undefined,
          });
        }

        case 'get_subtodos': {
          if (!params.id) {
            return { success: false, message: 'ID is required for get_subtodos', error: 'MISSING_ID' };
          }
          return tool.getSubTodos(params.id as string);
        }

        case 'stats': {
          return tool.stats();
        }

        case 'bulk_update_status': {
          if (!params.bulkStatus) {
            return { success: false, message: 'bulkStatus is required for bulk_update_status', error: 'MISSING_BULK_STATUS' };
          }
          const result = tool.bulkUpdateStatus(params.bulkStatus as TodoStatus, {
            category: params.bulkCategory as string | undefined,
            tags: params.bulkTags as string[] | undefined,
          });
          return { success: true, message: `Updated ${result.affected} todo(s) to ${params.bulkStatus}`, data: { affected: result.affected, ids: result.ids } };
        }

        case 'clear_completed': {
          const result = tool.clearCompleted();
          return { success: true, message: `Cleared ${result.affected} completed todo(s)`, data: { affected: result.affected, ids: result.ids } };
        }

        case 'bulk_delete_by_category': {
          if (!params.category) {
            return { success: false, message: 'Category is required for bulk_delete_by_category', error: 'MISSING_CATEGORY' };
          }
          const result = tool.bulkDeleteByCategory(params.category as string);
          return { success: true, message: `Deleted ${result.affected} todo(s) from category "${params.category}"`, data: { affected: result.affected, ids: result.ids } };
        }

        default:
          return { success: false, message: `Unknown todo action: ${action}`, error: 'UNKNOWN_ACTION' };
      }
    },
  };
}
