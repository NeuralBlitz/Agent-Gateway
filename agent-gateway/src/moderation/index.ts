/**
 * Enterprise Content Filtering & Moderation Pipeline
 * Pluggable content filters for input sanitization, toxicity detection,
 * PII redaction, and policy enforcement.
 */

import { logger } from '../infra/index.js';

// --- Types ---

export type FilterSeverity = 'pass' | 'flag' | 'block';

export interface FilterResult {
  /** Whether the content passed */
  severity: FilterSeverity;
  /** Reason for flagging/blocking */
  reason?: string;
  /** Score (0-1, higher = more concerning) */
  score?: number;
  /** Redacted content (if PII was removed) */
  redactedContent?: string;
}

export interface ContentFilter {
  name: string;
  filter(content: string): Promise<FilterResult> | FilterResult;
}

export interface ModerationConfig {
  /** Whether to enable moderation */
  enabled?: boolean;
  /** Block threshold (0-1, default: 0.8) */
  blockThreshold?: number;
  /** Whether to log flagged content */
  logFlagged?: boolean;
  /** PII redaction */
  redactPII?: boolean;
  /** Custom filters */
  filters?: ContentFilter[];
}

// --- Built-in Filters ---

/** Profanity/Toxicity filter using word list */
export class ProfanityFilter implements ContentFilter {
  name = 'profanity';

  // Curated list of common offensive terms
  private blockedWords = new Set([
    // This is intentionally a minimal set — production should use a comprehensive list
    'fuck', 'shit', 'bitch', 'asshole', 'damn', 'hell',
  ]);

  filter(content: string): FilterResult {
    const lower = content.toLowerCase();
    const words = lower.split(/\s+/);

    for (const word of words) {
      // Check exact match and leetspeak variants
      const normalized = word.replace(/[0@!$]/g, (c) => {
        const map: Record<string, string> = { '0': 'o', '@': 'a', '!': 'i', '$': 's' };
        return map[c] || c;
      });

      if (this.blockedWords.has(normalized)) {
        return {
          severity: 'flag',
          reason: `Contains flagged word: ${word}`,
          score: 0.6,
        };
      }
    }

    // Check for excessive capitalization (potential aggression)
    const capsRatio = content.replace(/[^a-zA-Z]/g, '').length > 0
      ? (content.match(/[A-Z]/g)?.length || 0) / content.replace(/[^a-zA-Z]/g, '').length
      : 0;

    if (capsRatio > 0.8 && content.length > 20) {
      return {
        severity: 'flag',
        reason: 'Excessive capitalization (potential aggression)',
        score: 0.4,
      };
    }

    return { severity: 'pass' };
  }
}

/** PII Detection and Redaction */
export class PIIFilter implements ContentFilter {
  name = 'pii';

  private patterns: Array<{ name: string; regex: RegExp; replacement: string }> = [
    { name: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
    { name: 'phone', regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, replacement: '[PHONE_REDACTED]' },
    { name: 'ssn', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
    { name: 'credit_card', regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, replacement: '[CC_REDACTED]' },
    { name: 'ip_address', regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
    { name: 'api_key', regex: /\b(?:sk-|pk-|api[_-]?key)[a-zA-Z0-9]{20,}\b/gi, replacement: '[API_KEY_REDACTED]' },
  ];

  filter(content: string): FilterResult {
    let redacted = content;
    let foundPII = false;
    const piiTypes: string[] = [];

    for (const pattern of this.patterns) {
      const matches = content.match(pattern.regex);
      if (matches && matches.length > 0) {
        foundPII = true;
        redacted = redacted.replace(pattern.regex, pattern.replacement);
        piiTypes.push(pattern.name);
      }
    }

    if (foundPII) {
      return {
        severity: 'flag',
        reason: `Contains PII: ${piiTypes.join(', ')}`,
        score: 0.9,
        redactedContent: redacted,
      };
    }

    return { severity: 'pass' };
  }
}

/** Prompt Injection Detection */
export class PromptInjectionFilter implements ContentFilter {
  name = 'prompt-injection';

  private injectionPatterns = [
    /ignore\s+(all\s+)?(previous\s+)?instructions?/gi,
    /system\s*:/gi,
    /\[system\]/gi,
    /you\s+are\s+now/gi,
    /from\s+now\s+on/gi,
    /disregard\s+(all\s+)?(previous\s+)?(rules?|instructions?|prompts?)/gi,
    /act\s+as\s+(if\s+)?(you\s+are\s+)?/gi,
    /new\s+instructions?/gi,
    /override\s+(your\s+)?(previous\s+)?(settings?|rules?|instructions?)/gi,
    /do\s+not\s+(follow\s+)?(any\s+)?(other\s+)?instructions?/gi,
  ];

  filter(content: string): FilterResult {
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(content)) {
        return {
          severity: 'block',
          reason: 'Potential prompt injection detected',
          score: 0.95,
        };
      }
    }

    return { severity: 'pass' };
  }
}

/** Length/Spam Filter */
export class SpamFilter implements ContentFilter {
  name = 'spam';

  private maxLength: number;
  private minUniqueRatio: number;

  constructor(maxLength: number = 10000, minUniqueRatio: number = 0.1) {
    this.maxLength = maxLength;
    this.minUniqueRatio = minUniqueRatio;
  }

  filter(content: string): FilterResult {
    // Check length
    if (content.length > this.maxLength) {
      return {
        severity: 'block',
        reason: `Content too long: ${content.length} chars (max: ${this.maxLength})`,
        score: 0.7,
      };
    }

    // Check for repetitive content (spam indicator)
    const words = content.toLowerCase().split(/\s+/);
    if (words.length > 50) {
      const uniqueWords = new Set(words);
      const uniqueRatio = uniqueWords.size / words.length;

      if (uniqueRatio < this.minUniqueRatio) {
        return {
          severity: 'flag',
          reason: `Highly repetitive content (unique ratio: ${uniqueRatio.toFixed(2)})`,
          score: 0.5,
        };
      }
    }

    return { severity: 'pass' };
  }
}

// --- Moderation Pipeline ---

export class ModerationPipeline {
  private config: Required<ModerationConfig>;
  private filters: ContentFilter[] = [];

  constructor(config: ModerationConfig = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      blockThreshold: config.blockThreshold || 0.8,
      logFlagged: config.logFlagged ?? true,
      redactPII: config.redactPII ?? true,
      filters: config.filters || [],
    };

    // Add default filters
    this.filters.push(new ProfanityFilter());
    this.filters.push(new PromptInjectionFilter());
    this.filters.push(new SpamFilter());

    if (this.config.redactPII) {
      this.filters.push(new PIIFilter());
    }

    // Add custom filters
    for (const filter of this.config.filters) {
      if (!this.filters.find((f) => f.name === filter.name)) {
        this.filters.push(filter);
      }
    }
  }

  /** Run content through all filters */
  async moderate(content: string): Promise<{
    blocked: boolean;
    flagged: boolean;
    results: FilterResult[];
    processedContent: string;
  }> {
    if (!this.config.enabled) {
      return { blocked: false, flagged: false, results: [], processedContent: content };
    }

    const results: FilterResult[] = [];
    let processedContent = content;
    let maxScore = 0;
    let blocked = false;
    let flagged = false;

    for (const filter of this.filters) {
      try {
        const result = await filter.filter(content);
        results.push(result);

        if (result.score !== undefined) {
          maxScore = Math.max(maxScore, result.score);
        }

        if (result.severity === 'block') {
          blocked = true;
        } else if (result.severity === 'flag') {
          flagged = true;
        }

        if (result.redactedContent) {
          processedContent = result.redactedContent;
        }

        if (this.config.logFlagged && result.severity !== 'pass') {
          logger.warn(
            { filter: filter.name, severity: result.severity, reason: result.reason, score: result.score },
            `Content filter: ${filter.name}`,
          );
        }
      } catch (err: any) {
        logger.error({ filter: filter.name, err }, `Filter error: ${filter.name}`);
      }
    }

    // Auto-block if score exceeds threshold
    if (maxScore >= this.config.blockThreshold) {
      blocked = true;
    }

    return { blocked, flagged, results, processedContent };
  }

  /** Add a filter at runtime */
  addFilter(filter: ContentFilter): void {
    if (!this.filters.find((f) => f.name === filter.name)) {
      this.filters.push(filter);
    }
  }

  /** Remove a filter */
  removeFilter(name: string): boolean {
    const idx = this.filters.findIndex((f) => f.name === name);
    if (idx >= 0) {
      this.filters.splice(idx, 1);
      return true;
    }
    return false;
  }

  /** Get active filter names */
  getFilterNames(): string[] {
    return this.filters.map((f) => f.name);
  }
}

export function createModerationPipeline(config?: ModerationConfig): ModerationPipeline {
  return new ModerationPipeline(config);
}
