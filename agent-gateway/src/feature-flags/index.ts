/**
 * Enterprise Feature Flags
 * Runtime-toggleable features with per-tenant targeting, rollout percentages,
 * and A/B test support.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export type FeatureFlagType = 'boolean' | 'percentage' | 'variant' | 'json';

export interface FeatureFlag {
  key: string;
  type: FeatureFlagType;
  enabled: boolean;
  /** Description for operators */
  description: string;
  /** Rollout percentage (0-100) for percentage type */
  rolloutPercentage?: number;
  /** Variants for A/B testing */
  variants?: string[];
  /** Default value */
  defaultValue: any;
  /** Per-tenant overrides */
  tenantOverrides?: Record<string, any>;
  /** Targeting rules (simple expression) */
  targetingRules?: Array<{
    attribute: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
    value: any;
    result: any;
  }>;
  /** When the flag was created */
  createdAt: number;
  /** When the flag was last updated */
  updatedAt: number;
}

export interface FlagEvaluationContext {
  tenantId?: string;
  userId?: string;
  channelId?: string;
  [key: string]: any;
}

export class FeatureFlagManager extends EventEmitter {
  private flags: Map<string, FeatureFlag> = new Map();
  private evaluationCount = 0;
  private evaluationLog: Array<{ flag: string; context: FlagEvaluationContext; result: any; timestamp: number }> = [];
  private maxLogSize = 10000;

  constructor() {
    super();
  }

  /** Register a feature flag */
  register(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void {
    const now = Date.now();
    const fullFlag: FeatureFlag = {
      ...flag,
      createdAt: now,
      updatedAt: now,
    };
    this.flags.set(flag.key, fullFlag);
    logger.info({ key: flag.key, enabled: flag.enabled }, `Feature flag registered: ${flag.key}`);
  }

  /** Update a feature flag */
  update(key: string, updates: Partial<FeatureFlag>): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;

    Object.assign(flag, updates, { updatedAt: Date.now() });
    logger.info({ key, changes: Object.keys(updates) }, `Feature flag updated: ${key}`);
    this.emit('flag:updated', { key, updates });
    return true;
  }

  /** Toggle a flag on/off */
  toggle(key: string, enabled: boolean): boolean {
    return this.update(key, { enabled });
  }

  /** Set rollout percentage */
  setRollout(key: string, percentage: number): boolean {
    return this.update(key, { rolloutPercentage: Math.max(0, Math.min(100, percentage)) });
  }

  /** Evaluate a feature flag for a given context */
  evaluate(key: string, context: FlagEvaluationContext = {}): any {
    const flag = this.flags.get(key);
    this.evaluationCount++;

    if (!flag) {
      logger.debug({ key }, 'Feature flag not found, returning null');
      return null;
    }

    if (!flag.enabled) {
      return flag.defaultValue;
    }

    // Check tenant override first
    if (context.tenantId && flag.tenantOverrides?.[context.tenantId] !== undefined) {
      return flag.tenantOverrides[context.tenantId];
    }

    // Check targeting rules
    if (flag.targetingRules) {
      for (const rule of flag.targetingRules) {
        const contextValue = context[rule.attribute];
        if (this.evaluateRule(contextValue, rule.operator, rule.value)) {
          return rule.result;
        }
      }
    }

    // Percentage rollout
    if (flag.type === 'percentage' && flag.rolloutPercentage !== undefined) {
      const hash = this.hashContext(key, context);
      const bucket = hash % 100;
      if (bucket >= flag.rolloutPercentage) {
        return flag.defaultValue;
      }
    }

    // Variant selection (sticky by user)
    if (flag.type === 'variant' && flag.variants && flag.variants.length > 0) {
      const userId = context.userId || context.tenantId || 'anonymous';
      const hash = this.hashContext(key, { userId });
      return flag.variants[hash % flag.variants.length];
    }

    // JSON type — return the default value (which should be an object)
    if (flag.type === 'json') {
      return flag.defaultValue;
    }

    // Boolean
    return true;
  }

  /** Evaluate all flags for a context */
  evaluateAll(context: FlagEvaluationContext = {}): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key] of this.flags) {
      result[key] = this.evaluate(key, context);
    }
    return result;
  }

  /** Get flag definition */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key);
  }

  /** List all flags (without sensitive details) */
  listFlags(): Array<{ key: string; enabled: boolean; type: FeatureFlagType; rolloutPercentage?: number }> {
    return Array.from(this.flags.values()).map((f) => ({
      key: f.key,
      enabled: f.enabled,
      type: f.type,
      rolloutPercentage: f.rolloutPercentage,
    }));
  }

  /** Get evaluation stats */
  getStats(): { totalFlags: number; enabledFlags: number; evaluationCount: number } {
    const enabled = Array.from(this.flags.values()).filter((f) => f.enabled).length;
    return {
      totalFlags: this.flags.size,
      enabledFlags: enabled,
      evaluationCount: this.evaluationCount,
    };
  }

  /** Get recent evaluations */
  getEvaluationLog(limit: number = 100): Array<{ key: string; context: FlagEvaluationContext; result: any; timestamp: number }> {
    return this.evaluationLog.slice(-limit).map((entry) => ({
      key: entry.flag,
      context: entry.context,
      result: entry.result,
      timestamp: entry.timestamp,
    }));
  }

  /** Hash context for consistent rollout */
  private hashContext(key: string, context: FlagEvaluationContext): number {
    const str = `${key}:${JSON.stringify(context)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /** Evaluate a single targeting rule */
  private evaluateRule(contextValue: any, operator: string, ruleValue: any): boolean {
    switch (operator) {
      case 'eq': return contextValue === ruleValue;
      case 'neq': return contextValue !== ruleValue;
      case 'contains': return String(contextValue).includes(String(ruleValue));
      case 'gt': return Number(contextValue) > Number(ruleValue);
      case 'lt': return Number(contextValue) < Number(ruleValue);
      default: return false;
    }
  }
}

export function createFeatureFlagManager(): FeatureFlagManager {
  return new FeatureFlagManager();
}
