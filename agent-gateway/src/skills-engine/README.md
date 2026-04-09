# Skills Engine (`src/skills-engine/`)

> **Loads, indexes, searches, and injects skills from the OpenSkills dataset -- 25,000+ agent capabilities with progressive disclosure and context-aware injection.**

---

## Overview

The `SkillsEngine` is a high-capability discovery and injection system that loads agent skills from the [NuralNexus/OpenSkills dataset](https://huggingface.co/datasets/NuralNexus/OpenSkills) containing 25,576 skills across diverse domains. It provides full-text search, category/level filtering, trigger-based matching, and context-aware skill injection into agent system prompts.

The skills engine implements a **progressive disclosure** pattern: rather than loading all 25,000+ skills into every prompt (which would exceed context windows), it indexes skills at startup and only injects the most relevant ones based on the user's query. This enables agents to access a vast capability library while staying within token limits.

Key capabilities:

- **Massive skill library** -- Supports loading 25,000+ SKILL.md files from the OpenSkills dataset.
- **Inverted index search** -- Full-text search across skill names, descriptions, metadata, and content sections.
- **Progressive disclosure** -- Only loads and injects skills relevant to the current query.
- **Category and level filtering** -- Filter skills by domain (e.g., `programming`, `research`) and difficulty (`fundamental`, `intermediate`, `advanced`, `research`).
- **Trigger-based matching** -- Skills can declare trigger keywords/phrases for precise activation.
- **Hot-reload support** -- Watch the skills directory for file changes and update the index in real-time.
- **Prompt injection** -- Generates formatted skill sections ready for injection into agent system prompts.

---

## File Structure

```
skills-engine/
└── index.ts    # SkillsEngine, SearchIndex, frontmatter parser, and skill parser
```

The module contains several internal components within a single file:

| Component | Purpose |
|-----------|---------|
| `SkillsEngine` | Main class: loading, searching, filtering, injection |
| `SearchIndex` | Inverted index for full-text search |
| `parseFrontmatter()` | Minimal YAML frontmatter parser (no dependencies) |
| `parseSkillSections()` | Extracts structured sections from SKILL.md body |
| `SkillMetadata` | Type definition for skill metadata |
| `Skill` | Type definition for a loaded skill with content and sections |

---

## API Reference

### Types

#### `SkillMetadata`

Metadata extracted from a SKILL.md file's YAML frontmatter.

```typescript
interface SkillMetadata {
  name: string;              // Skill name
  description: string;       // Short description
  license: string;           // License identifier
  category?: string;         // Primary category (e.g., 'programming', 'research')
  subcategory?: string;      // Sub-category within the primary category
  domain?: string;           // Domain classification
  level?: 'fundamental' | 'intermediate' | 'advanced' | 'research';
  type?: string;             // Skill type classification
  audience?: string;         // Target audience
  tags?: string[];           // Additional tags for search
  triggers?: string[];       // Trigger keywords/phrases for activation
  [key: string]: any;        // Additional custom metadata fields
}
```

#### `Skill`

A fully loaded skill with metadata, content, and parsed sections.

```typescript
interface Skill {
  id: string;          // Unique identifier (derived from path or metadata name)
  path: string;        // Relative path from skills directory
  metadata: SkillMetadata;
  content: string;     // The skill body text (without frontmatter)
  raw: string;         // The full SKILL.md content including frontmatter
  sections: {
    whatIDo?: string;      // Content under "## What I Do"
    whenToUse?: string;    // Content under "## When To Use"
    keyConcepts?: string;  // Content under "## Key Concepts"
    instructions?: string; // Content under "## Instructions"
    examples?: string;     // Content under "## Examples"
    references?: string;   // Content under "## References"
  };
}
```

#### `SkillSearchResult`

A search result with relevance scoring.

```typescript
interface SkillSearchResult {
  skill: Skill;              // The matched skill
  score: number;             // Relevance score (higher = more relevant)
  matchedTerms: string[];    // Terms from the query that matched
}
```

#### `SkillEngineConfig`

Configuration for the SkillsEngine.

```typescript
interface SkillEngineConfig {
  skillsDir?: string;        // Path to the skills directory (default: `<cwd>/skills`)
  maxSkillsPerPrompt?: number;// Max skills to inject in a single prompt (default: 5)
  watch?: boolean;           // Watch for file changes (default: false)
  cacheInMemory?: boolean;   // Cache loaded skills in memory (default: true)
  buildIndex?: boolean;      // Build search index on load (default: true)
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `skillsDir` | No | `<cwd>/skills` | Path to the directory containing SKILL.md files |
| `maxSkillsPerPrompt` | No | `5` | Maximum number of skills to inject into a single prompt |
| `watch` | No | `false` | Enable hot-reload on file changes |
| `cacheInMemory` | No | `true` | Keep all loaded skills in memory for fast access |
| `buildIndex` | No | `true` | Build the inverted search index during loading |

---

### Factory Function

#### `createSkillsEngine(config?)`

Creates and returns a new `SkillsEngine` instance.

```typescript
function createSkillsEngine(config?: SkillEngineConfig): SkillsEngine
```

**Example:**

```typescript
import { createSkillsEngine } from './skills-engine/index.js';

const engine = createSkillsEngine({
  skillsDir: '/opt/agent-gateway/skills',
  maxSkillsPerPrompt: 3,
  watch: true,
});
```

---

### Class: `SkillsEngine`

Extends `EventEmitter`. Manages skill loading, indexing, searching, and prompt injection.

#### Loading

##### `load()`

Loads all SKILL.md files from the configured skills directory.

```typescript
async load(): Promise<number>
```

**Behavior:**

1. Recursively walks the `skillsDir`, looking for files named `SKILL.md`.
2. Parses each file's YAML frontmatter and body sections.
3. Derives metadata from file path if not present in frontmatter.
4. Builds the inverted search index (if `buildIndex` is true).
5. Starts file watching (if `watch` is true).
6. Returns the total number of loaded skills.

**Emits:** `skills:loaded` with `{ count, duration }`.

**Example:**

```typescript
const count = await engine.load();
console.log(`Loaded ${count} skills`);
// Loaded 25576 skills
```

##### `loadSkillFile(filePath)` (private)

Loads and parses a single SKILL.md file.

```typescript
private loadSkillFile(filePath: string): Skill
```

**Parsing process:**

1. Reads the raw file content.
2. Extracts YAML frontmatter using `parseFrontmatter()`.
3. Parses body sections using `parseSkillSections()`.
4. Derives category/subcategory from directory path if not in metadata.
5. Returns a complete `Skill` object.

---

#### Searching

##### `search(query, options?)`

Searches skills using full-text query matching with optional filters.

```typescript
search(
  query: string,
  options?: {
    limit?: number;
    category?: string;
    level?: string;
  }
): SkillSearchResult[]
```

**Search behavior:**

1. Tokenizes the query into individual terms.
2. Looks up each term in the inverted index.
3. Scores results by number of matched terms and term frequency.
4. Applies category and level filters.
5. Returns sorted by score (highest first).

**Scoring:** `score = termMatches * uniqueMatchedTerms.length`

**Example:**

```typescript
// Search for programming skills
const results = engine.search('python async programming', {
  limit: 10,
  category: 'programming',
});

// Search with level filter
const advanced = engine.search('machine learning', {
  level: 'advanced',
  limit: 5,
});

// Unfiltered search
const all = engine.search('database', { limit: 20 });
```

##### `getByCategory(category, limit?)`

Returns skills belonging to a specific category.

```typescript
getByCategory(category: string, limit?: number): Skill[]
```

Default limit: 100.

**Example:**

```typescript
const programmingSkills = engine.getByCategory('programming', 50);
```

##### `getByTriggers(triggers, limit?)`

Returns skills whose declared triggers match the given terms.

```typescript
getByTriggers(triggers: string[], limit?: number): Skill[]
```

**Behavior:** Case-insensitive partial matching between provided triggers and skill's declared triggers.

**Example:**

```typescript
const triggered = engine.getByTriggers(['git', 'commit', 'push'], 10);
```

##### `getByLevel(level, limit?)`

Returns skills at a specific difficulty level.

```typescript
getByLevel(level: string, limit?: number): Skill[]
```

Valid levels: `'fundamental'`, `'intermediate'`, `'advanced'`, `'research'`.

Default limit: 100.

**Example:**

```typescript
const fundamental = engine.getByLevel('fundamental', 50);
const research = engine.getByLevel('research', 20);
```

---

#### Access

##### `get(id)`

Retrieves a skill by its unique ID.

```typescript
get(id: string): Skill | undefined
```

**Example:**

```typescript
const skill = engine.get('programming/python-async');
if (skill) {
  console.log(skill.metadata.description);
  console.log(skill.sections.whatIDo);
}
```

##### `list(offset?, limit?)`

Lists skills with pagination.

```typescript
list(offset?: number, limit?: number): Skill[]
```

Default offset: 0, default limit: 50.

**Example:**

```typescript
// First page
const page1 = engine.list(0, 50);
// Second page
const page2 = engine.list(50, 50);
```

##### `count()`

Returns the total number of loaded skills.

```typescript
count(): number
```

---

#### Statistics

##### `getCategories()`

Returns skill counts by category, sorted descending.

```typescript
getCategories(): Array<{ category: string; count: number }>
```

**Example:**

```typescript
const categories = engine.getCategories();
// [
//   { category: 'programming', count: 5200 },
//   { category: 'research', count: 3800 },
//   { category: 'data-science', count: 2100 },
//   ...
// ]
```

##### `getLevels()`

Returns skill counts by difficulty level.

```typescript
getLevels(): Array<{ level: string; count: number }>
```

**Example:**

```typescript
const levels = engine.getLevels();
// [
//   { level: 'intermediate', count: 10000 },
//   { level: 'advanced', count: 8000 },
//   { level: 'fundamental', count: 5000 },
//   { level: 'research', count: 2576 },
// ]
```

##### `getStats()`

Returns comprehensive statistics about the loaded skills.

```typescript
getStats(): {
  totalSkills: number;
  searchIndexSize: number;
  byCategory: Array<{ category: string; count: number }>;
  byLevel: Array<{ level: string; count: number }>;
}
```

**Example:**

```typescript
const stats = engine.getStats();
console.log(`Total skills: ${stats.totalSkills}`);
console.log(`Categories: ${stats.byCategory.length}`);
console.log(`Levels:`, stats.byLevel);
```

---

#### Prompt Injection

##### `injectIntoPrompt(userQuery, context?)`

Searches for relevant skills and formats them for injection into a system prompt.

```typescript
injectIntoPrompt(
  userQuery: string,
  context?: {
    category?: string;
    maxSkills?: number;
  }
): string
```

**Behavior:**

1. Searches for skills matching the user query.
2. Takes up to `maxSkills` results (defaults to `config.maxSkillsPerPrompt`).
3. Formats each skill as a Markdown section:
   ```
   ## Skill: <name>
   <whatIDo or description>
   ```
4. Joins all skills with double newlines.
5. Returns an empty string if no skills match.

**Example:**

```typescript
const injected = engine.injectIntoPrompt('How do I implement async retry logic in Python?', {
  category: 'programming',
  maxSkills: 3,
});

// Result:
// ## Skill: Python Async Patterns
// Provides patterns for asynchronous programming in Python including retry, timeout, and circuit breaker patterns...
//
// ## Skill: Error Handling Best Practices
// Covers strategies for robust error handling including retry mechanisms, exponential backoff, and graceful degradation...
//
// ## Skill: Python Decorators
// Explains decorator patterns for cross-cutting concerns like retry, caching, and logging...
```

**Usage in agent prompt:**

```typescript
const systemPrompt = `You are a helpful AI assistant.

${engine.injectIntoPrompt(userQuery, { maxSkills: 5 })}

Answer the user's question using the skills above as context.`;
```

---

#### File Watching

##### `startWatching(dir)` (private)

Starts watching the skills directory for file changes.

```typescript
private startWatching(dir: string): void
```

**Behavior:**

- Uses Node.js `fs.watch` with `recursive: true`.
- On file addition/modification: reloads the skill and adds to the index.
- On file deletion: removes the skill from the internal map.
- Emits `skill:updated` or `skill:removed` events.

##### `stopWatching()`

Stops watching the skills directory.

```typescript
stopWatching(): void
```

##### `clear()`

Clears all loaded skills, search index, and file watchers.

```typescript
clear(): void
```

**Emits:** `skills:cleared`.

---

### Internal Components

#### `SearchIndex`

An inverted index class used internally by `SkillsEngine` for full-text search.

```typescript
class SearchIndex {
  addSkill(skill: Skill): void;
  search(query: string, limit?: number): SkillSearchResult[];
}
```

**Indexing strategy:**

- Extracts terms from: name, description, category, subcategory, domain, level, type, audience, tags, triggers, and content sections.
- Tokenizes text by splitting on whitespace and removing punctuation.
- Filters tokens to length > 2 characters.
- Stores term-to-skillId mappings in a `Map<string, Set<string>>`.

**Search scoring:**

- Each matched term contributes +1 to the skill's score.
- Final score is multiplied by the number of unique matched terms (boosting skills with diverse matches).

#### `parseFrontmatter(content)`

Minimal YAML frontmatter parser.

```typescript
function parseFrontmatter(content: string): {
  metadata: Record<string, any>;
  body: string;
}
```

**Supported YAML features:**

- Flat key-value pairs
- Nested objects (key followed by indented key: value lines)
- Arrays (lines starting with `- `)
- Value types: strings, integers, floats, booleans, null

**Example:**

```yaml
---
name: Python Async Patterns
description: Async programming patterns
license: MIT
category: programming
level: intermediate
tags:
  - python
  - async
  - concurrency
triggers:
  - async
  - await
  - asyncio
---

## What I Do
...
```

#### `parseSkillSections(body)`

Extracts structured sections from the SKILL.md body content.

```typescript
function parseSkillSections(body: string): Skill['sections']
```

**Recognized section headings:**

| Markdown Heading | Section Property |
|-----------------|-----------------|
| `## What I Do` | `whatIDo` |
| `## When To Use` | `whenToUse` |
| `## Key Concepts` | `keyConcepts` |
| `## Instructions` | `instructions` |
| `## Examples` | `examples` |
| `## References` | `references` |

Matching is case-insensitive and uses partial string matching (e.g., `## Key Concepts` matches `keyConcepts`).

---

### Events

| Event | Payload | When |
|-------|---------|------|
| `skills:loaded` | `{ count: number, duration: number }` | After `load()` completes |
| `skills:cleared` | -- | After `clear()` is called |
| `skill:updated` | `Skill` | When a watched SKILL.md file is added or modified |
| `skill:removed` | `Skill` | When a watched SKILL.md file is deleted |

**Example:**

```typescript
engine.on('skills:loaded', ({ count, duration }) => {
  console.log(`Loaded ${count} skills in ${duration}ms`);
});

engine.on('skill:updated', (skill) => {
  console.log(`Skill updated: ${skill.id}`);
});

engine.on('skill:removed', (skill) => {
  console.log(`Skill removed: ${skill.id}`);
});
```

---

## SKILL.md File Format

Skills are stored as `SKILL.md` files with YAML frontmatter and Markdown body:

```markdown
---
name: Python Async Patterns
description: Common async patterns for Python including async/await, asyncio, and concurrent execution
license: MIT
category: programming
subcategory: python
level: intermediate
tags:
  - python
  - async
  - asyncio
  - concurrency
triggers:
  - asyncio
  - async def
  - await
---

## What I Do
This skill covers asynchronous programming patterns in Python, including:
- async/await syntax and semantics
- asyncio event loops and tasks
- Concurrent execution with gather() and create_task()
- Async context managers and iterators

## When To Use
Use this skill when working with async Python code, building
asyncio-based applications, or debugging concurrency issues.

## Key Concepts
### async/await
The `async def` syntax defines a coroutine...

## Examples
```python
import asyncio

async def main():
    tasks = [fetch(url) for url in urls]
    results = await asyncio.gather(*tasks)
```

## References
- Python asyncio documentation
- PEP 492 -- Coroutines with async/await
```
```

### Directory Structure

Skills are organized in a hierarchical directory structure:

```
skills/
├── programming/
│   ├── python/
│   │   └── SKILL.md
│   ├── javascript/
│   │   └── SKILL.md
│   └── SKILL.md
├── research/
│   └── SKILL.md
├── data-science/
│   └── SKILL.md
└── general/
    └── SKILL.md
```

The engine derives category and subcategory from the directory path when not specified in frontmatter.

---

## Configuration Examples

### Basic Setup

```typescript
const engine = createSkillsEngine({
  skillsDir: './skills',
});
await engine.load();
```

### Production Configuration

```typescript
const engine = createSkillsEngine({
  skillsDir: '/opt/agent-gateway/skills',
  maxSkillsPerPrompt: 3,
  watch: false,     // Disable watching in production
  cacheInMemory: true,
  buildIndex: true,
});
const count = await engine.load();
console.log(`Loaded ${count} skills`);
```

### Development with Hot Reload

```typescript
const engine = createSkillsEngine({
  skillsDir: './skills',
  maxSkillsPerPrompt: 5,
  watch: true,      // Enable hot reload
});
engine.on('skill:updated', (skill) => {
  console.log(`New skill available: ${skill.id}`);
});
await engine.load();
```

### Search-Only Mode (No Index)

```typescript
const engine = createSkillsEngine({
  skillsDir: './skills',
  buildIndex: false,  // Skip index building
});
await engine.load();
// search() will return [] without an index
// Use getByCategory(), getByLevel(), get() instead
```

---

## Integration Points

### With Agent Prompt Generation

The primary use case is injecting relevant skills into agent prompts:

```typescript
async function buildPrompt(userQuery: string, engine: SkillsEngine): Promise<string> {
  const skills = engine.injectIntoPrompt(userQuery, { maxSkills: 5 });

  return `You are a helpful AI assistant with specialized skills.
${skills ? `Relevant skills for this query:\n\n${skills}` : ''}

User query: ${userQuery}`;
}
```

### With Providers

Skills-injected prompts are sent to AI providers for response generation:
- [`/home/runner/workspace/agent-gateway/src/providers/openai/`](/home/runner/workspace/agent-gateway/src/providers/openai/)
- [`/home/runner/workspace/agent-gateway/src/providers/anthropic/`](/home/runner/workspace/agent-gateway/src/providers/anthropic/)
- [`/home/runner/workspace/agent-gateway/src/providers/cohere/`](/home/runner/workspace/agent-gateway/src/providers/cohere/)
- [`/home/runner/workspace/agent-gateway/src/providers/groq/`](/home/runner/workspace/agent-gateway/src/providers/groq/)

### With Marketplace

Skills can be packaged and distributed as plugins:
- [`/home/runner/workspace/agent-gateway/src/marketplace/`](/home/runner/workspace/agent-gateway/src/marketplace/)

### With Channels

Skills are channel-agnostic; they enhance prompts regardless of the input channel:
- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Skills directory not found | `load()` returns 0, logs a warning |
| Invalid YAML frontmatter | File is skipped, error logged at debug level |
| Missing SKILL.md sections | Sections default to `undefined`; skill still loads |
| Inaccessible files | Skipped silently (permission errors caught in walkDirectory) |
| Search without index | Returns empty array if `buildIndex` was false |
| File watch errors | Watcher silently ignores parse errors; continues monitoring |

---

## Performance Characteristics

### Loading

- **25,000+ skills**: Loads in a few seconds depending on disk I/O.
- **Inverted index**: Built during loading; adds marginal overhead.
- **Memory usage**: Skills are cached in memory (names, descriptions, and sections are typically small).

### Search

- **Sub-millisecond**: Inverted index lookup is O(number of query terms).
- **Scoring**: Linear in the number of matched skills.
- **Filtering**: Applied after search; category and level filters are fast.

### Prompt Injection

- **O(k * n)** where k = maxSkillsPerPrompt and n = number of matched skills.
- Typically produces 500-2000 characters of injected skill content.

---

## Limitations

- **No stemming/lemmatization** -- The tokenizer performs exact term matching only.
- **No phrase search** -- Queries are tokenized as individual terms, not phrases.
- **No BM25 or TF-IDF** -- Scoring is a simple term frequency with match count boost.
- **No fuzzy matching** -- Typos in search terms will not find relevant skills.
- **YAML parser is minimal** -- Complex YAML structures (anchors, multi-line strings, deeply nested objects) may not parse correctly.
- **No persistence** -- The search index is rebuilt from scratch on each `load()` call.
- **Single-threaded loading** -- Skills are loaded sequentially.
- **No deduplication** -- If two skills have the same `id`, the last one loaded wins.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/) -- AI model providers
- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/) -- Communication channels
- [`/home/runner/workspace/agent-gateway/src/marketplace/`](/home/runner/workspace/agent-gateway/src/marketplace/) -- Plugin marketplace
- [NuralNexus/OpenSkills Dataset](https://huggingface.co/datasets/NuralNexus/OpenSkills) -- Source dataset on Hugging Face
- [SKILL.md Specification](https://github.com/anthropics/skills) -- Anthropic's SKILL.md format reference
- [Progressive Disclosure Pattern](https://en.wikipedia.org/wiki/Progressive_disclosure) -- UX pattern for revealing information gradually
