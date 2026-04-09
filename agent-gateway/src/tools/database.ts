import { exec } from 'child_process';
import { promisify } from 'util';
import { createClient } from '@libsql/client';
import { logger } from '../infra/index.js';

const execAsync = promisify(exec);

// ─── Types ───────────────────────────────────────────────────────────────────

export type DatabaseType = 'postgres' | 'mysql' | 'sqlite' | 'mongo';

export interface DatabaseConfig {
  /** Database type */
  type: DatabaseType;
  /** Connection string or file path (e.g. "postgresql://user:pass@host:5432/db" or "/path/to/file.sqlite") */
  connectionString: string;
  /** When true, only SELECT / EXPLAIN / DESCRIBE are allowed (default: false) */
  readOnly?: boolean;
  /** Maximum query execution time in milliseconds (default: 30000) */
  maxQueryTime?: number;
  /** Maximum rows returned per query (default: 1000) */
  maxRows?: number;
}

export interface DatabaseResult {
  success: boolean;
  rows?: Record<string, any>[];
  columns?: string[];
  rowCount?: number;
  truncated?: boolean;
  message: string;
  error?: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  rowCount?: number;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  defaultValue?: string;
}

export interface DatabaseStats {
  tableCount: number;
  tables: { name: string; rowCount?: number }[];
  totalRows?: number;
  databaseSize?: string;
  version?: string;
}

export interface WhereClause {
  [key: string]: any;
}

export interface InsertResult {
  success: boolean;
  insertedId?: string | number;
  rowCount?: number;
  message: string;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildWhere(where: WhereClause, dbType: DatabaseType): { condition: string; params: any[] } {
  const entries = Object.entries(where);
  if (entries.length === 0) return { condition: '', params: [] };

  const conditions: string[] = [];
  const params: any[] = [];

  for (const [key, value] of entries) {
    if (value === null) {
      conditions.push(`${key} IS NULL`);
    } else if (Array.isArray(value)) {
      const placeholders = value.map(() => '?').join(', ');
      conditions.push(`${key} IN (${placeholders})`);
      params.push(...value);
    } else {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  }

  return { condition: `WHERE ${conditions.join(' AND ')}`, params };
}

function truncateRows(rows: Record<string, any>[], maxRows: number): { rows: Record<string, any>[]; truncated: boolean } {
  if (rows.length <= maxRows) return { rows, truncated: false };
  return { rows: rows.slice(0, maxRows), truncated: true };
}

function mongoEscape(value: any): string {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === null) return 'null';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function buildMongoFilter(where: WhereClause): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(where)) {
    if (value === null) {
      parts.push(`${key}: null`);
    } else if (Array.isArray(value)) {
      parts.push(`${key}: { $in: [${value.map(mongoEscape).join(', ')}] }`);
    } else {
      parts.push(`${key}: ${mongoEscape(value)}`);
    }
  }
  return parts.length > 0 ? `{ ${parts.join(', ')} }` : '{}';
}

// ─── SQLite engine (uses @libsql/client) ─────────────────────────────────────

class SQLiteEngine {
  private client: ReturnType<typeof createClient>;

  constructor(connectionString: string) {
    this.client = createClient({ url: connectionString.startsWith('file:') ? connectionString : `file:${connectionString}` });
  }

  async query(sql: string, params: any[] = []): Promise<any> {
    const result = await this.client.execute({ sql, args: params });
    const columns = result.columns;
    const rows = result.rows.map((row: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const col of columns) {
        out[col] = row[col];
      }
      return out;
    });
    return { rows, columns };
  }

  close(): void {
    this.client.close();
  }
}

// ─── CLI-based engine (postgres, mysql, mongo) ──────────────────────────────

class CLIEngine {
  private type: DatabaseType;
  private connectionString: string;

  constructor(type: DatabaseType, connectionString: string) {
    this.type = type;
    this.connectionString = connectionString;
  }

  private getCLIArgs(sql: string): { cmd: string; args: string[] } {
    const cs = this.connectionString;

    switch (this.type) {
      case 'postgres': {
        return { cmd: 'psql', args: ['-t', '-A', '-F', '\t', '-c', sql, cs] };
      }
      case 'mysql': {
        return { cmd: 'mysql', args: ['-N', '-B', '-e', sql, cs] };
      }
      case 'mongo': {
        return {
          cmd: 'mongosh',
          args: ['--quiet', '--eval', sql, cs],
        };
      }
      default:
        throw new Error(`Unsupported database type: ${this.type}`);
    }
  }

  async execute(sql: string, timeoutMs: number): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const { cmd, args } = this.getCLIArgs(sql);
    const command = [cmd, ...args.map((a) => (a.includes(' ') ? `"${a}"` : a))].join(' ');

    try {
      const { stdout, stderr } = await execAsync(command, { timeout: timeoutMs, maxBuffer: 50 * 1024 * 1024 });
      return { stdout, stderr, exitCode: 0 };
    } catch (err: any) {
      return {
        stdout: err.stdout || '',
        stderr: err.stderr || '',
        exitCode: err.code === 'ETIMEDOUT' ? -2 : err.status ?? -1,
      };
    }
  }
}

// ─── DatabaseTool Class ──────────────────────────────────────────────────────

export class DatabaseTool {
  private config: Required<DatabaseConfig>;
  private sqliteEngine: SQLiteEngine | null = null;
  private cliEngine: CLIEngine | null = null;

  constructor(config: DatabaseConfig) {
    this.config = {
      type: config.type,
      connectionString: config.connectionString,
      readOnly: config.readOnly ?? false,
      maxQueryTime: config.maxQueryTime ?? 30_000,
      maxRows: config.maxRows ?? 1000,
    };

    if (this.config.type === 'sqlite') {
      this.sqliteEngine = new SQLiteEngine(this.config.connectionString);
    } else {
      this.cliEngine = new CLIEngine(this.config.type, this.config.connectionString);
    }
  }

  // ── Safety ───────────────────────────────────────────────────────────────

  private checkReadOnly(sql: string): DatabaseResult | null {
    if (!this.config.readOnly) return null;

    const normalized = sql.trim().toUpperCase();
    const writeKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE', 'REPLACE', 'MERGE'];
    for (const kw of writeKeywords) {
      if (normalized.startsWith(kw)) {
        return {
          success: false,
          message: `Query blocked in read-only mode: ${kw}`,
          error: 'READ_ONLY_VIOLATION',
        };
      }
    }
    return null;
  }

  private applyRowLimit(rows: Record<string, any>[]): { rows: Record<string, any>[]; truncated: boolean } {
    return truncateRows(rows, this.config.maxRows);
  }

  // ── Core query ───────────────────────────────────────────────────────────

  async query(sql: string, params: any[] = []): Promise<DatabaseResult> {
    const readOnlyViolation = this.checkReadOnly(sql);
    if (readOnlyViolation) return readOnlyViolation;

    logger.debug({ type: this.config.type, sql, params }, 'Executing database query');

    try {
      if (this.sqliteEngine) {
        const { rows, columns } = await this.sqliteEngine.query(sql, params);
        const limited = this.applyRowLimit(rows);
        return {
          success: true,
          rows: limited.rows,
          columns,
          rowCount: limited.rows.length,
          truncated: limited.truncated,
          message: `Query returned ${limited.rows.length} row(s)${limited.truncated ? ` (truncated at ${this.config.maxRows})` : ''}`,
        };
      }

      if (this.cliEngine) {
        const result = await this.cliEngine.execute(sql, this.config.maxQueryTime);
        if (result.exitCode !== 0) {
          return {
            success: false,
            message: `Query failed (exit code ${result.exitCode})`,
            error: result.stderr || result.stdout,
          };
        }

        const rows = this.parseCLIRows(result.stdout);
        const limited = this.applyRowLimit(rows);
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        return {
          success: true,
          rows: limited.rows,
          columns,
          rowCount: limited.rows.length,
          truncated: limited.truncated,
          message: `Query returned ${limited.rows.length} row(s)${limited.truncated ? ` (truncated at ${this.config.maxRows})` : ''}`,
        };
      }

      return { success: false, message: 'No database engine available', error: 'NO_ENGINE' };
    } catch (err: any) {
      logger.error({ error: err.message }, 'Database query failed');
      return { success: false, message: 'Query failed', error: err.message };
    }
  }

  private parseCLIRows(output: string): Record<string, any>[] {
    const lines = output.trim().split('\n').filter((l) => l.length > 0);
    if (lines.length === 0) return [];

    if (this.config.type === 'mongo') {
      try {
        const parsed = JSON.parse(output);
        if (Array.isArray(parsed)) return parsed;
        if (typeof parsed === 'object') return [parsed];
      } catch {
        return [{ output }];
      }
      return [];
    }

    return lines.map((line) => {
      const values = line.split('\t');
      const row: Record<string, any> = {};
      values.forEach((v, i) => {
        row[`col_${i}`] = v.trim();
      });
      return row;
    });
  }

  // ── Describe table ───────────────────────────────────────────────────────

  async describe(table: string): Promise<DatabaseResult> {
    let sql = '';
    switch (this.config.type) {
      case 'postgres':
        sql = `SELECT column_name as "column", data_type as "type", is_nullable as "nullable", column_default as "default", CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as "primaryKey" FROM information_schema.columns LEFT JOIN (SELECT cu.table_name, cu.column_name FROM information_schema.table_constraints tc JOIN information_schema.constraint_column_usage cu ON tc.constraint_name = cu.constraint_name WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = '${table}') pk ON columns.column_name = pk.column_name WHERE table_name = '${table}' AND table_schema = 'public'`;
        break;
      case 'mysql':
        sql = `DESCRIBE \`${table}\``;
        break;
      case 'sqlite':
        sql = `PRAGMA table_info(${table})`;
        break;
      case 'mongo':
        return this.query(`db.getCollection("${table}").findOne()`);
    }

    return this.query(sql);
  }

  // ── List tables ──────────────────────────────────────────────────────────

  async listTables(): Promise<DatabaseResult> {
    let sql = '';
    switch (this.config.type) {
      case 'postgres':
        sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name";
        break;
      case 'mysql':
        sql = 'SHOW TABLES';
        break;
      case 'sqlite':
        sql = "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name";
        break;
      case 'mongo':
        return this.query('db.getCollectionNames()');
    }

    return this.query(sql);
  }

  // ── EXPLAIN ──────────────────────────────────────────────────────────────

  async explain(sql: string): Promise<DatabaseResult> {
    const explainSql = this.config.type === 'mongo'
      ? `db.collection("EXPLAIN_TARGET").find().explain()`
      : `EXPLAIN ${sql}`;
    return this.query(explainSql);
  }

  // ── Insert ───────────────────────────────────────────────────────────────

  async insert(table: string, data: Record<string, any>): Promise<InsertResult> {
    const readOnlyViolation = this.checkReadOnly('INSERT');
    if (readOnlyViolation) return { success: false, message: readOnlyViolation.message, error: readOnlyViolation.error };

    try {
      if (this.sqliteEngine) {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = columns.map(() => '?').join(', ');
        const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

        await this.sqliteEngine.query(sql, values);
        logger.info({ table, columns }, 'Inserted row into SQLite');

        return { success: true, message: `Inserted 1 row into ${table}`, rowCount: 1 };
      }

      // CLI-based
      const columns = Object.keys(data);
      const values = columns.map((c) => {
        const v = data[c];
        if (v === null) return 'NULL';
        if (typeof v === 'number') return String(v);
        if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
        return `'${String(v).replace(/'/g, "''")}'`;
      });

      if (this.config.type === 'mongo') {
        const fields = columns.map((c) => `${c}: ${mongoEscape(data[c])}`).join(', ');
        const mongoScript = `db.getCollection("${table}").insertOne({ ${fields} })`;
        const result = await this.query(mongoScript);
        return { success: result.success, message: result.message, error: result.error };
      }

      const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
      const result = await this.query(sql);
      return { success: result.success, message: result.message, error: result.error, rowCount: result.success ? 1 : undefined };
    } catch (err: any) {
      logger.error({ table, error: err.message }, 'Insert failed');
      return { success: false, message: 'Insert failed', error: err.message };
    }
  }

  // ── Update ───────────────────────────────────────────────────────────────

  async update(table: string, data: Record<string, any>, where: WhereClause = {}): Promise<DatabaseResult> {
    const readOnlyViolation = this.checkReadOnly('UPDATE');
    if (readOnlyViolation) return readOnlyViolation;

    try {
      if (this.sqliteEngine) {
        const setClauses = Object.entries(data).map(([k]) => `${k} = ?`);
        const values = [...Object.values(data), ...Object.values(where)];
        const whereClause = buildWhere(where, 'sqlite');
        const sql = `UPDATE ${table} SET ${setClauses.join(', ')} ${whereClause.condition}`;

        const result = await this.sqliteEngine.query(sql, values);
        logger.info({ table, where }, 'Updated rows in SQLite');

        return { success: true, message: `Updated rows in ${table}`, rowCount: result.rows.length };
      }

      // CLI-based
      const setClauses = Object.entries(data).map(([k, v]) => {
        if (v === null) return `${k} = NULL`;
        if (typeof v === 'number') return `${k} = ${v}`;
        if (typeof v === 'boolean') return `${k} = ${v ? 'TRUE' : 'FALSE'}`;
        return `${k} = '${String(v).replace(/'/g, "''")}'`;
      });

      if (this.config.type === 'mongo') {
        const setFields = Object.entries(data).map(([k, v]) => `$set: { ${k}: ${mongoEscape(v)} }`).join(', ');
        const filter = buildMongoFilter(where);
        const mongoScript = `db.getCollection("${table}").updateMany(${filter}, { ${setFields} })`;
        return this.query(mongoScript);
      }

      const whereClause = buildWhere(where, this.config.type);
      const sql = `UPDATE ${table} SET ${setClauses.join(', ')} ${whereClause.condition}`;
      return this.query(sql);
    } catch (err: any) {
      logger.error({ table, error: err.message }, 'Update failed');
      return { success: false, message: 'Update failed', error: err.message };
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async delete(table: string, where: WhereClause = {}): Promise<DatabaseResult> {
    const readOnlyViolation = this.checkReadOnly('DELETE');
    if (readOnlyViolation) return readOnlyViolation;

    try {
      if (this.sqliteEngine) {
        const whereClause = buildWhere(where, 'sqlite');
        const sql = `DELETE FROM ${table} ${whereClause.condition}`;
        const result = await this.sqliteEngine.query(sql, whereClause.params);
        logger.info({ table, where }, 'Deleted rows from SQLite');
        return { success: true, message: `Deleted rows from ${table}`, rowCount: result.rows.length };
      }

      if (this.config.type === 'mongo') {
        const filter = buildMongoFilter(where);
        const mongoScript = `db.getCollection("${table}").deleteMany(${filter})`;
        return this.query(mongoScript);
      }

      const whereClause = buildWhere(where, this.config.type);
      const sql = `DELETE FROM ${table} ${whereClause.condition}`;
      return this.query(sql);
    } catch (err: any) {
      logger.error({ table, error: err.message }, 'Delete failed');
      return { success: false, message: 'Delete failed', error: err.message };
    }
  }

  // ── Count ────────────────────────────────────────────────────────────────

  async count(table: string, where: WhereClause = {}): Promise<DatabaseResult> {
    try {
      if (this.config.type === 'mongo') {
        const filter = buildMongoFilter(where);
        return this.query(`db.getCollection("${table}").countDocuments(${filter})`);
      }

      const whereClause = buildWhere(where, this.config.type);
      const sql = `SELECT COUNT(*) as "count" FROM ${table} ${whereClause.condition}`;

      if (this.sqliteEngine) {
        const { rows } = await this.sqliteEngine.query(sql, whereClause.params);
        return {
          success: true,
          rows,
          columns: ['count'],
          rowCount: 1,
          message: `Count: ${rows[0]?.count ?? 0}`,
        };
      }

      return this.query(sql);
    } catch (err: any) {
      logger.error({ table, error: err.message }, 'Count failed');
      return { success: false, message: 'Count failed', error: err.message };
    }
  }

  // ── Stats ────────────────────────────────────────────────────────────────

  async getStats(): Promise<DatabaseResult> {
    try {
      const tablesResult = await this.listTables();
      if (!tablesResult.success || !tablesResult.rows) {
        return { success: false, message: 'Failed to list tables', error: tablesResult.error };
      }

      const tableNames = tablesResult.rows.map((r: Record<string, any>) => {
        const keys = Object.keys(r);
        return r[keys[0]];
      });

      const tables: { name: string; rowCount?: number }[] = [];
      let totalRows = 0;

      for (const name of tableNames) {
        const countResult = await this.count(name);
        const rowCount = countResult.success && countResult.rows?.[0]
          ? Number(Object.values(countResult.rows[0])[0])
          : undefined;
        if (rowCount !== undefined) totalRows += rowCount;
        tables.push({ name, rowCount });
      }

      let version: string | undefined;
      let databaseSize: string | undefined;

      if (this.config.type === 'postgres') {
        const verResult = await this.query('SELECT version()');
        version = verResult.success && verResult.rows?.[0] ? String(Object.values(verResult.rows[0])[0]) : undefined;
        const sizeResult = await this.query("SELECT pg_size_pretty(pg_database_size(current_database()))");
        databaseSize = sizeResult.success && sizeResult.rows?.[0] ? String(Object.values(sizeResult.rows[0])[0]) : undefined;
      } else if (this.config.type === 'mysql') {
        const verResult = await this.query('SELECT VERSION()');
        version = verResult.success && verResult.rows?.[0] ? String(Object.values(verResult.rows[0])[0]) : undefined;
      } else if (this.config.type === 'sqlite') {
        const verResult = await this.query('SELECT sqlite_version()');
        version = verResult.success && verResult.rows?.[0] ? String(Object.values(verResult.rows[0])[0]) : undefined;
      }

      const stats: DatabaseStats = {
        tableCount: tables.length,
        tables,
        totalRows,
        databaseSize,
        version,
      };

      return {
        success: true,
        rows: [stats as any],
        columns: ['tableCount', 'tables', 'totalRows', 'databaseSize', 'version'],
        rowCount: 1,
        message: `Database stats: ${tables.length} tables, ~${totalRows} total rows`,
      };
    } catch (err: any) {
      logger.error({ error: err.message }, 'Failed to get stats');
      return { success: false, message: 'Failed to get stats', error: err.message };
    }
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────

  close(): void {
    if (this.sqliteEngine) {
      this.sqliteEngine.close();
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createDatabaseTool(config: DatabaseConfig): DatabaseTool {
  return new DatabaseTool(config);
}

// ─── ToolDefinition ──────────────────────────────────────────────────────────

export function createDatabaseToolDefinition(config: DatabaseConfig) {
  const tool = new DatabaseTool(config);

  return {
    name: 'database',
    description: `Query and manage a ${config.type} database. Supports SELECT, INSERT, UPDATE, DELETE, DESCRIBE, EXPLAIN, and statistics. ${config.readOnly ? 'Read-only mode: only SELECT and EXPLAIN allowed.' : ''}`,
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: [
            'query', 'describe', 'list_tables', 'explain',
            'insert', 'update', 'delete', 'count', 'stats',
          ],
          description: 'The database action to perform',
        },
        sql: {
          type: 'string',
          description: 'SQL query to execute (for query, explain actions)',
        },
        params: {
          type: 'array',
          items: { type: 'string' },
          description: 'Query parameters for prepared statements (SQLite only)',
        },
        table: {
          type: 'string',
          description: 'Table name (for describe, insert, update, delete, count actions)',
        },
        data: {
          type: 'object',
          description: 'Column-value pairs for insert or update actions',
        },
        where: {
          type: 'object',
          description: 'WHERE conditions as key-value pairs (for update, delete, count actions)',
        },
      },
      required: ['action'],
    },
    execute: async (params: Record<string, any>) => {
      const action = params.action as string;

      switch (action) {
        case 'query': {
          if (!params.sql) {
            return { success: false, message: 'SQL is required for query action', error: 'MISSING_SQL' };
          }
          return tool.query(params.sql as string, params.params as any[] | undefined);
        }

        case 'describe': {
          if (!params.table) {
            return { success: false, message: 'Table name is required for describe action', error: 'MISSING_TABLE' };
          }
          return tool.describe(params.table as string);
        }

        case 'list_tables': {
          return tool.listTables();
        }

        case 'explain': {
          if (!params.sql) {
            return { success: false, message: 'SQL is required for explain action', error: 'MISSING_SQL' };
          }
          return tool.explain(params.sql as string);
        }

        case 'insert': {
          if (!params.table) {
            return { success: false, message: 'Table name is required for insert action', error: 'MISSING_TABLE' };
          }
          if (!params.data || typeof params.data !== 'object') {
            return { success: false, message: 'Data (column-value pairs) is required for insert action', error: 'MISSING_DATA' };
          }
          return tool.insert(params.table as string, params.data as Record<string, any>);
        }

        case 'update': {
          if (!params.table) {
            return { success: false, message: 'Table name is required for update action', error: 'MISSING_TABLE' };
          }
          if (!params.data || typeof params.data !== 'object') {
            return { success: false, message: 'Data (column-value pairs) is required for update action', error: 'MISSING_DATA' };
          }
          return tool.update(params.table as string, params.data as Record<string, any>, params.where as WhereClause | undefined);
        }

        case 'delete': {
          if (!params.table) {
            return { success: false, message: 'Table name is required for delete action', error: 'MISSING_TABLE' };
          }
          return tool.delete(params.table as string, params.where as WhereClause | undefined);
        }

        case 'count': {
          if (!params.table) {
            return { success: false, message: 'Table name is required for count action', error: 'MISSING_TABLE' };
          }
          return tool.count(params.table as string, params.where as WhereClause | undefined);
        }

        case 'stats': {
          return tool.getStats();
        }

        default:
          return { success: false, message: `Unknown database action: ${action}`, error: 'UNKNOWN_ACTION' };
      }
    },
  };
}
