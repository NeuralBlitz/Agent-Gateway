/**
 * Skills Engine — 25,000+ Agent Skills from OpenSkills Dataset
 * Loads, indexes, searches, and injects skills from the NuralNexus/OpenSkills dataset
 * (https://huggingface.co/datasets/NuralNexus/OpenSkills).
 * 
 * Features:
 * - Progressive disclosure: loads skills on-demand via trigger matching
 * - Full-text search across 25,576 skills
 * - Category/level filtering
 * - Context-aware skill injection for agent prompts
 * - Hot-reload on file changes
 */

import { EventEmitter } from 'events';
import { readFileSync, existsSync, readdirSync, statSync, watch } from 'fs';
import { join, resolve, dirname, basename } from 'path';
import { logger } from '../infra/index.js';

// --- Types ---

export interface SkillMetadata {
  name: string;
  description: string;
  license: string;
  category?: string;
  subcategory?: string;
  domain?: string;
  level?: 'fundamental' | 'intermediate' | 'advanced' | 'research';
  type?: string;
  audience?: string;
  tags?: string[];
  triggers?: string[];
  [key: string]: any;
}

export interface Skill {
  id: string;
  path: string;
  metadata: SkillMetadata;
  content: string;
  /** The full SKILL.md content */
  raw: string;
  /** Extracted sections */
  sections: {
    whatIDo?: string;
    whenToUse?: string;
    keyConcepts?: string;
    instructions?: string;
    examples?: string;
    references?: string;
  };
}

export interface SkillSearchResult {
  skill: Skill;
  score: number;
  matchedTerms: string[];
}

export interface SkillEngineConfig {
  /** Path to the skills directory */
  skillsDir?: string;
  /** Max skills to inject in a single prompt */
  maxSkillsPerPrompt?: number;
  /** Whether to watch for file changes */
  watch?: boolean;
  /** Cache loaded skills in memory */
  cacheInMemory?: boolean;
  /** Build search index on load */
  buildIndex?: boolean;
}

// --- YAML Frontmatter Parser (minimal, no deps) ---

function parseFrontmatter(content: string): { metadata: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };

  const yaml = match[1];
  const body = match[2];
  const metadata: Record<string, any> = {};

  // Simple YAML parser for flat/nested structures
  const lines = yaml.split('\n');
  let currentKey: string | null = null;
  let currentObj: any = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Check for key: value
    const kvMatch = trimmed.match(/^(\w[\w-]*):\s*(.+)$/);
    if (kvMatch && !line.startsWith(' ') && !line.startsWith('\t')) {
      const [, key, value] = kvMatch;
      currentKey = key;
      currentObj = null;

      // Try to parse the value
      if (value === '') {
        // Start of a nested object
        currentObj = {};
        metadata[key] = currentObj;
      } else {
        metadata[key] = parseYamlValue(value);
        currentKey = null;
      }
    } else if (currentKey && currentObj !== null && trimmed.startsWith('- ')) {
      // Array item in nested object
      if (!Array.isArray(metadata[currentKey])) metadata[currentKey] = [];
      (metadata[currentKey] as any[]).push(parseYamlValue(trimmed.slice(2)));
    } else if (currentKey && currentObj !== null && trimmed.includes(':')) {
      // Nested key-value
      const [k, ...vParts] = trimmed.split(':');
      currentObj[k.trim()] = parseYamlValue(vParts.join(':').trim());
    } else if (currentKey && metadata[currentKey] === undefined) {
      // Single-value array
      metadata[currentKey] = [parseYamlValue(trimmed)];
    } else if (currentKey && Array.isArray(metadata[currentKey])) {
      (metadata[currentKey] as any[]).push(parseYamlValue(trimmed));
    }
  }

  return { metadata, body };
}

function parseYamlValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null' || value === '~') return null;
  if (/^\d+$/.test(value)) return parseInt(value, 10);
  if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
  // Remove quotes
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1);
  }
  return value;
}

// --- Skill Parser ---

function parseSkillSections(body: string): Skill['sections'] {
  const sections: Skill['sections'] = {};
  const headingRegex = /^## (.+)$/gm;
  let match;
  const positions: Array<{ heading: string; start: number }> = [];

  while ((match = headingRegex.exec(body)) !== null) {
    positions.push({ heading: match[1].trim(), start: match.index });
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const nextStart = positions[i + 1]?.start ?? body.length;
    const content = body.slice(pos.start, nextStart).trim();

    const heading = pos.heading.toLowerCase();
    if (heading.includes('what i do')) sections.whatIDo = content;
    else if (heading.includes('when to use')) sections.whenToUse = content;
    else if (heading.includes('key concept')) sections.keyConcepts = content;
    else if (heading.includes('instruction')) sections.instructions = content;
    else if (heading.includes('example')) sections.examples = content;
    else if (heading.includes('reference')) sections.references = content;
  }

  return sections;
}

// --- Inverted Index for Search ---

class SearchIndex {
  private termToSkills: Map<string, Set<string>> = new Map();
  private skills: Map<string, Skill> = new Map();

  addSkill(skill: Skill): void {
    this.skills.set(skill.id, skill);

    const terms = this.extractTerms(skill);
    for (const term of terms) {
      if (!this.termToSkills.has(term)) {
        this.termToSkills.set(term, new Set());
      }
      this.termToSkills.get(term)!.add(skill.id);
    }
  }

  search(query: string, limit: number = 50): SkillSearchResult[] {
    const queryTerms = this.tokenize(query);
    const scores: Map<string, { score: number; matchedTerms: string[] }> = new Map();

    for (const term of queryTerms) {
      const skillIds = this.termToSkills.get(term);
      if (skillIds) {
        for (const id of skillIds) {
          if (!scores.has(id)) {
            scores.set(id, { score: 0, matchedTerms: [] });
          }
          const entry = scores.get(id)!;
          entry.score += 1;
          entry.matchedTerms.push(term);
        }
      }
    }

    // Boost skills with more matched terms
    for (const [id, entry] of scores) {
      entry.score *= entry.matchedTerms.length;
    }

    return Array.from(scores.entries())
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, limit)
      .map(([id, data]) => ({
        skill: this.skills.get(id)!,
        score: data.score,
        matchedTerms: [...new Set(data.matchedTerms)],
      }));
  }

  private extractTerms(skill: Skill): string[] {
    const terms = new Set<string>();
    const text = [
      skill.metadata.name,
      skill.metadata.description,
      skill.metadata.category,
      skill.metadata.subcategory,
      skill.metadata.domain,
      skill.metadata.level,
      skill.metadata.type,
      skill.metadata.audience,
      ...(skill.metadata.tags || []),
      ...(skill.metadata.triggers || []),
      skill.sections.whatIDo || '',
      skill.sections.whenToUse || '',
      skill.sections.keyConcepts || '',
    ].join(' ').toLowerCase();

    for (const token of this.tokenize(text)) {
      if (token.length > 2) terms.add(token);
    }

    return Array.from(terms);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1);
  }
}

// --- Skills Engine ---

export class SkillsEngine extends EventEmitter {
  private config: Required<SkillEngineConfig>;
  private skills: Map<string, Skill> = new Map();
  private index: SearchIndex | null = null;
  private watchHandle?: ReturnType<typeof watch>;

  constructor(config: SkillEngineConfig = {}) {
    super();
    this.config = {
      skillsDir: config.skillsDir || join(process.cwd(), 'skills'),
      maxSkillsPerPrompt: config.maxSkillsPerPrompt || 5,
      watch: config.watch ?? false,
      cacheInMemory: config.cacheInMemory ?? true,
      buildIndex: config.buildIndex ?? true,
    };
  }

  /** Load all skills from the skills directory */
  async load(): Promise<number> {
    const dir = this.config.skillsDir;
    if (!existsSync(dir)) {
      logger.warn({ dir }, 'Skills directory not found');
      return 0;
    }

    logger.info({ dir }, 'Loading skills...');
    const start = Date.now();
    let count = 0;

    this.walkDirectory(dir, (filePath) => {
      if (basename(filePath) === 'SKILL.md') {
        try {
          const skill = this.loadSkillFile(filePath);
          this.skills.set(skill.id, skill);
          count++;
        } catch (err: any) {
          logger.debug({ path: filePath, error: err.message }, 'Failed to load skill');
        }
      }
    });

    // Build search index
    if (this.config.buildIndex) {
      this.index = new SearchIndex();
      for (const skill of this.skills.values()) {
        this.index.addSkill(skill);
      }
    }

    // Watch for changes
    if (this.config.watch) {
      this.startWatching(dir);
    }

    const duration = Date.now() - start;
    logger.info({ count, duration: `${duration}ms` }, `Loaded ${count} skills`);
    this.emit('skills:loaded', { count, duration });
    return count;
  }

  /** Load a single SKILL.md file */
  private loadSkillFile(filePath: string): Skill {
    const raw = readFileSync(filePath, 'utf-8');
    const { metadata, body } = parseFrontmatter(raw);

    // Extract path-based metadata
    const relPath = filePath.replace(this.config.skillsDir + '/', '');
    const parts = relPath.split('/');

    const skill: Skill = {
      id: metadata.name || parts.slice(0, -1).join('/'),
      path: relPath,
      metadata: {
        name: metadata.name || parts[parts.length - 2] || 'unknown',
        description: metadata.description || '',
        license: metadata.license || 'MIT',
        category: metadata.category || parts[0] || 'general',
        subcategory: metadata.subcategory || parts[1] || '',
        domain: metadata.domain || parts[0] || '',
        level: metadata.level || parts[parts.length - 2] as SkillMetadata['level'],
        type: metadata.type || '',
        audience: metadata.audience || '',
        tags: metadata.tags || [],
        triggers: metadata.triggers || [],
        ...metadata,
      },
      content: body.trim(),
      raw,
      sections: parseSkillSections(body),
    };

    return skill;
  }

  /** Recursively walk directory */
  private walkDirectory(dir: string, callback: (filePath: string) => void): void {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        try {
          const stat = statSync(fullPath);
          if (stat.isDirectory() && !entry.startsWith('.')) {
            this.walkDirectory(fullPath, callback);
          } else if (stat.isFile()) {
            callback(fullPath);
          }
        } catch {
          // Skip inaccessible files
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  /** Search skills */
  search(query: string, options?: { limit?: number; category?: string; level?: string }): SkillSearchResult[] {
    if (!this.index) return [];

    let results = this.index.search(query, options?.limit || 50);

    if (options?.category) {
      results = results.filter((r) => r.skill.metadata.category === options.category);
    }
    if (options?.level) {
      results = results.filter((r) => r.skill.metadata.level === options.level);
    }

    return results;
  }

  /** Get skills by category */
  getByCategory(category: string, limit: number = 100): Skill[] {
    return Array.from(this.skills.values())
      .filter((s) => s.metadata.category === category)
      .slice(0, limit);
  }

  /** Get skills matching triggers */
  getByTriggers(triggers: string[], limit: number = 10): Skill[] {
    const results: Skill[] = [];
    for (const skill of this.skills.values()) {
      const skillTriggers = skill.metadata.triggers || [];
      if (triggers.some((t) => skillTriggers.some((st) => st.toLowerCase().includes(t.toLowerCase())))) {
        results.push(skill);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  /** Get skills by level */
  getByLevel(level: string, limit: number = 100): Skill[] {
    return Array.from(this.skills.values())
      .filter((s) => s.metadata.level === level)
      .slice(0, limit);
  }

  /** Get skill by ID */
  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /** Get all skills (paginated) */
  list(offset: number = 0, limit: number = 50): Skill[] {
    return Array.from(this.skills.values()).slice(offset, offset + limit);
  }

  /** Get total count */
  count(): number {
    return this.skills.size;
  }

  /** Get category counts */
  getCategories(): Array<{ category: string; count: number }> {
    const counts: Map<string, number> = new Map();
    for (const skill of this.skills.values()) {
      const cat = skill.metadata.category || 'uncategorized';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  /** Get level counts */
  getLevels(): Array<{ level: string; count: number }> {
    const counts: Map<string, number> = new Map();
    for (const skill of this.skills.values()) {
      const level = skill.metadata.level || 'unknown';
      counts.set(level, (counts.get(level) || 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([level, count]) => ({ level, count }));
  }

  /** Inject relevant skills into a system prompt */
  injectIntoPrompt(userQuery: string, context?: { category?: string; maxSkills?: number }): string {
    const maxSkills = context?.maxSkills || this.config.maxSkillsPerPrompt;
    const results = this.search(userQuery, { limit: maxSkills, category: context?.category });

    if (results.length === 0) return '';

    const injectedSkills = results
      .slice(0, maxSkills)
      .map((r) => `## Skill: ${r.skill.metadata.name}\n${r.skill.sections.whatIDo || r.skill.metadata.description}`)
      .join('\n\n');

    return injectedSkills;
  }

  /** Watch for file changes */
  private startWatching(dir: string): void {
    if (this.watchHandle) return;

    logger.info({ dir }, 'Watching skills directory for changes');
    this.watchHandle = watch(dir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('SKILL.md')) {
        const filePath = join(dir, filename);
        if (eventType === 'rename' && !existsSync(filePath)) {
          // File deleted
          const deleted = Array.from(this.skills.entries()).find(([, s]) => s.path === filename);
          if (deleted) {
            this.skills.delete(deleted[0]);
            this.emit('skill:removed', deleted[0]);
          }
        } else if (existsSync(filePath)) {
          // File added/changed
          try {
            const skill = this.loadSkillFile(filePath);
            this.skills.set(skill.id, skill);
            if (this.index) this.index.addSkill(skill);
            this.emit('skill:updated', skill);
          } catch {
            // Ignore parse errors
          }
        }
      }
    });
  }

  /** Stop watching */
  stopWatching(): void {
    if (this.watchHandle) {
      this.watchHandle.close();
      this.watchHandle = undefined;
    }
  }

  /** Get stats */
  getStats(): {
    totalSkills: number;
    searchIndexSize: number;
    byCategory: Array<{ category: string; count: number }>;
    byLevel: Array<{ level: string; count: number }>;
  } {
    return {
      totalSkills: this.skills.size,
      searchIndexSize: this.index ? this.skills.size : 0,
      byCategory: this.getCategories(),
      byLevel: this.getLevels(),
    };
  }

  /** Clear all loaded skills */
  clear(): void {
    this.skills.clear();
    this.index = null;
    this.stopWatching();
    this.emit('skills:cleared');
  }
}

export function createSkillsEngine(config?: SkillEngineConfig): SkillsEngine {
  return new SkillsEngine(config);
}
