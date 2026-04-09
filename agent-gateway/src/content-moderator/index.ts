/**
 * Enterprise Content Moderator
 * Multi-layer content filtering for safety, compliance,
 * and policy enforcement across all agent interactions.
 */

import { logger } from '../infra/index.js';

export type ModerationSeverity = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export interface ModerationResult {
  severity: ModerationSeverity;
  categories: Array<{ name: string; score: number; blocked: boolean }>;
  flagged: boolean;
  blocked: boolean;
  reason?: string;
  redactedText?: string;
}

export interface ModerationConfig {
  /** Block threshold (0-1) */
  blockThreshold?: number;
  /** Flag threshold (0-1) */
  flagThreshold?: number;
  /** Whether to redact PII */
  redactPII?: boolean;
  /** Custom blocked words */
  blockedWords?: string[];
  /** Max content length */
  maxLength?: number;
}

export class ContentModerator {
  private config: Required<ModerationConfig>;
  private blockedWords: Set<string>;

  constructor(config: ModerationConfig = {}) {
    this.config = {
      blockThreshold: config.blockThreshold || 0.8,
      flagThreshold: config.flagThreshold || 0.5,
      redactPII: config.redactPII ?? true,
      blockedWords: config.blockedWords || [],
      maxLength: config.maxLength || 100000,
    };

    this.blockedWords = new Set(this.config.blockedWords.map((w) => w.toLowerCase()));
  }

  /** Moderate text content */
  moderate(text: string): ModerationResult {
    const categories: Array<{ name: string; score: number; blocked: boolean }> = [];

    // Check length
    if (text.length > this.config.maxLength) {
      categories.push({ name: 'excessive_length', score: 1.0, blocked: true });
    }

    // Check blocked words
    const wordScore = this.checkBlockedWords(text);
    if (wordScore > 0) {
      categories.push({ name: 'blocked_words', score: wordScore, blocked: wordScore >= this.config.blockThreshold });
    }

    // Check for prompt injection
    const injectionScore = this.checkPromptInjection(text);
    if (injectionScore > 0) {
      categories.push({ name: 'prompt_injection', score: injectionScore, blocked: injectionScore >= 0.7 });
    }

    // Check for PII
    const piiScore = this.checkPII(text);
    if (piiScore > 0) {
      categories.push({ name: 'pii_detected', score: piiScore, blocked: false });
    }

    // Check for spam patterns
    const spamScore = this.checkSpam(text);
    if (spamScore > 0) {
      categories.push({ name: 'spam', score: spamScore, blocked: spamScore >= this.config.blockThreshold });
    }

    // Determine overall severity
    const maxScore = categories.reduce((max, c) => Math.max(max, c.score), 0);
    const hasBlocked = categories.some((c) => c.blocked);

    let severity: ModerationSeverity = 'safe';
    if (maxScore >= 0.9) severity = 'critical';
    else if (maxScore >= 0.7) severity = 'high';
    else if (maxScore >= 0.5) severity = 'medium';
    else if (maxScore >= 0.3) severity = 'low';

    // Redact PII if configured
    let redactedText: string | undefined;
    if (this.config.redactPII && piiScore > 0) {
      redactedText = this.redactPII(text);
    }

    return {
      severity,
      categories,
      flagged: maxScore >= this.config.flagThreshold,
      blocked: hasBlocked,
      reason: hasBlocked ? categories.find((c) => c.blocked)?.name : undefined,
      redactedText,
    };
  }

  /** Check for blocked words */
  private checkBlockedWords(text: string): number {
    const lower = text.toLowerCase();
    const words = lower.split(/[\s\W]+/);

    let matchCount = 0;
    for (const word of words) {
      if (this.blockedWords.has(word)) matchCount++;
    }

    if (matchCount === 0) return 0;
    return Math.min(1, matchCount / Math.max(1, words.length * 10));
  }

  /** Check for prompt injection patterns */
  private checkPromptInjection(text: string): number {
    const patterns = [
      /ignore\s+(all\s+)?(previous\s+)?(instructions?|rules?|prompts?)/gi,
      /you\s+are\s+(now\s+)?(no\s+longer\s+)?(a|an)?\s*/gi,
      /system\s*[:：]\s*/gi,
      /\[system\]|\[admin\]|\[developer\]/gi,
      /disregard\s+(all\s+)?(previous|above|earlier)/gi,
      /from\s+now\s+on\s*(,|\s)/gi,
      /do\s+not\s+(follow|obey|adhere\s+to)/gi,
      /override\s+(your\s+)?(settings?|rules?|instructions?|guidelines?)/gi,
      /pretend\s+(to\s+be|you\s+are)/gi,
      /act\s+as\s+(if\s+)?(you\s+are|a|an)/gi,
    ];

    let maxScore = 0;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        maxScore = Math.max(maxScore, 0.7);
      }
    }

    return maxScore;
  }

  /** Check for PII patterns */
  private checkPII(text: string): number {
    const patterns = [
      { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, weight: 0.8 },
      { regex: /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, weight: 1.0 }, // SSN
      { regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, weight: 1.0 }, // CC
      { regex: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, weight: 0.6 }, // Phone
    ];

    let totalScore = 0;
    for (const { regex, weight } of patterns) {
      const matches = text.match(regex);
      if (matches) {
        totalScore += Math.min(1, matches.length * weight);
      }
    }

    return Math.min(1, totalScore);
  }

  /** Check for spam patterns */
  private checkSpam(text: string): number {
    // Repetitive content
    const words = text.toLowerCase().split(/\s+/);
    if (words.length > 50) {
      const unique = new Set(words);
      const ratio = unique.size / words.length;
      if (ratio < 0.1) return 0.9;
      if (ratio < 0.2) return 0.6;
    }

    // Excessive caps
    const alpha = text.replace(/[^a-zA-Z]/g, '');
    if (alpha.length > 20) {
      const caps = (alpha.match(/[A-Z]/g) || []).length;
      if (caps / alpha.length > 0.8) return 0.5;
    }

    return 0;
  }

  /** Redact PII from text */
  private redactPII(text: string): string {
    return text
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/g, '[SSN]')
      .replace(/\b(?:\d{4}[-\s]?){3}\d{4}\b/g, '[CREDIT_CARD]')
      .replace(/\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g, '[PHONE]')
      .replace(/\b(?:sk|pk|api)[_-]?[a-zA-Z0-9]{20,}\b/gi, '[API_KEY]');
  }
}

export function createContentModerator(config?: ModerationConfig): ContentModerator {
  return new ContentModerator(config);
}
