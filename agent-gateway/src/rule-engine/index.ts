/**
 * Enterprise Rule Engine
 * Evaluates business rules against data with support for complex conditions,
 * rule chaining, priority ordering, and audit trails.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export type RuleOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'matches' | 'in' | 'notIn' | 'between'
  | 'isNull' | 'isNotNull' | 'isEmpty' | 'isNotEmpty'
  | 'and' | 'or' | 'not';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: any;
  conditions?: RuleCondition[]; // For and/or/not
}

export interface Rule {
  id: string;
  name: string;
  description?: string;
  condition: RuleCondition;
  /** Actions to perform when rule matches */
  actions: Array<{
    type: string;
    params: Record<string, any>;
  }>;
  /** Priority (higher = evaluated first) */
  priority: number;
  /** Whether the rule is active */
  enabled: boolean;
  /** Rule category */
  category?: string;
  /** Tags for organization */
  tags?: string[];
  /** Created timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: Array<{ type: string; params: Record<string, any>; executed: boolean; error?: string }>;
  evaluatedAt: number;
  evaluationTimeMs: number;
}

export interface RuleEngineConfig {
  /** Max execution time per evaluation (ms) */
  timeoutMs?: number;
  /** Whether to stop after first match */
  firstMatch?: boolean;
  /** Max rules to evaluate per evaluation */
  maxRules?: number;
}

export class RuleEngine extends EventEmitter {
  private rules: Map<string, Rule> = new Map();
  private config: Required<RuleEngineConfig>;
  private evaluationHistory: Array<{ ruleId: string; matched: boolean; data: any; timestamp: number }> = [];
  private maxHistory = 10000;

  constructor(config: RuleEngineConfig = {}) {
    super();
    this.config = {
      timeoutMs: config.timeoutMs || 10000,
      firstMatch: config.firstMatch ?? false,
      maxRules: config.maxRules || 1000,
    };
  }

  /** Add or update a rule */
  addRule(rule: Omit<Rule, 'createdAt' | 'updatedAt'>): void {
    const now = Date.now();
    const existing = this.rules.get(rule.id);
    const fullRule: Rule = {
      ...rule,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.rules.set(rule.id, fullRule);
    logger.debug({ ruleId: rule.id, name: rule.name }, 'Rule added');
  }

  /** Remove a rule */
  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  /** Enable/disable a rule */
  toggleRule(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    rule.updatedAt = Date.now();
    return true;
  }

  /** Evaluate all rules against data */
  evaluate(data: Record<string, any>): RuleEvaluationResult[] {
    const results: RuleEvaluationResult[] = [];
    const start = Date.now();

    // Sort rules by priority (descending)
    const sortedRules = Array.from(this.rules.values())
      .filter((r) => r.enabled)
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.config.maxRules);

    for (const rule of sortedRules) {
      if (Date.now() - start > this.config.timeoutMs) {
        logger.warn({ evaluated: results.length }, 'Rule evaluation timeout');
        break;
      }

      const ruleStart = Date.now();
      const matched = this.evaluateCondition(rule.condition, data);

      const result: RuleEvaluationResult = {
        ruleId: rule.id,
        ruleName: rule.name,
        matched,
        actions: [],
        evaluatedAt: Date.now(),
        evaluationTimeMs: Date.now() - ruleStart,
      };

      if (matched) {
        // Execute actions
        for (const action of rule.actions) {
          try {
            this.executeAction(action, data);
            result.actions.push({ type: action.type, params: action.params, executed: true });
          } catch (err: any) {
            result.actions.push({ type: action.type, params: action.params, executed: false, error: err.message });
            logger.error({ ruleId: rule.id, action: action.type, err }, 'Rule action failed');
          }
        }

        this.emit('rule:matched', { rule, data, result });
      }

      results.push(result);

      // Record in history
      this.evaluationHistory.push({ ruleId: rule.id, matched, data, timestamp: Date.now() });
      if (this.evaluationHistory.length > this.maxHistory) {
        this.evaluationHistory.shift();
      }

      // First match mode
      if (this.config.firstMatch && matched) {
        break;
      }
    }

    return results;
  }

  /** Evaluate a single condition against data */
  private evaluateCondition(condition: RuleCondition, data: Record<string, any>): boolean {
    // Handle compound conditions
    if (condition.operator === 'and' && condition.conditions) {
      return condition.conditions.every((c) => this.evaluateCondition(c, data));
    }

    if (condition.operator === 'or' && condition.conditions) {
      return condition.conditions.some((c) => this.evaluateCondition(c, data));
    }

    if (condition.operator === 'not' && condition.conditions) {
      return !condition.conditions.some((c) => this.evaluateCondition(c, data));
    }

    // Get field value (supports nested paths like 'user.profile.age')
    const fieldValue = this.getFieldValue(data, condition.field);

    switch (condition.operator) {
      case 'eq': return fieldValue === condition.value;
      case 'neq': return fieldValue !== condition.value;
      case 'gt': return Number(fieldValue) > Number(condition.value);
      case 'gte': return Number(fieldValue) >= Number(condition.value);
      case 'lt': return Number(fieldValue) < Number(condition.value);
      case 'lte': return Number(fieldValue) <= Number(condition.value);
      case 'contains': return String(fieldValue).includes(String(condition.value));
      case 'notContains': return !String(fieldValue).includes(String(condition.value));
      case 'startsWith': return String(fieldValue).startsWith(String(condition.value));
      case 'endsWith': return String(fieldValue).endsWith(String(condition.value));
      case 'matches': return new RegExp(condition.value).test(String(fieldValue));
      case 'in': return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'notIn': return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'between': {
        const [min, max] = condition.value;
        return Number(fieldValue) >= Number(min) && Number(fieldValue) <= Number(max);
      }
      case 'isNull': return fieldValue === null || fieldValue === undefined;
      case 'isNotNull': return fieldValue !== null && fieldValue !== undefined;
      case 'isEmpty': return !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0) || (typeof fieldValue === 'string' && fieldValue.length === 0);
      case 'isNotEmpty': return fieldValue && (!Array.isArray(fieldValue) || fieldValue.length > 0) && (typeof fieldValue !== 'string' || fieldValue.length > 0);
      default: return false;
    }
  }

  /** Get nested field value from data */
  private getFieldValue(data: Record<string, any>, path: string): any {
    const parts = path.split('.');
    let current: any = data;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  }

  /** Execute a rule action */
  private executeAction(action: { type: string; params: Record<string, any> }, data: Record<string, any>): void {
    switch (action.type) {
      case 'set':
        // Set a field in data
        const target = this.getFieldValue(data, action.params.field) || data;
        const pathParts = action.params.field.split('.');
        let obj = data;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (!obj[pathParts[i]]) obj[pathParts[i]] = {};
          obj = obj[pathParts[i]];
        }
        obj[pathParts[pathParts.length - 1]] = action.params.value;
        break;

      case 'tag':
        if (!data._tags) data._tags = [];
        data._tags.push(action.params.tag);
        break;

      case 'log':
        logger.info({ rule: action.params.message, data }, 'Rule action: log');
        break;

      case 'notify':
        this.emit('rule:notify', { channel: action.params.channel, message: action.params.message, data });
        break;

      case 'reject':
        throw new Error(action.params.reason || 'Rule rejected');

      case 'transform':
        // Apply a transformation function
        if (action.params.transform && typeof action.params.transform === 'function') {
          action.params.transform(data);
        }
        break;

      default:
        this.emit('rule:custom-action', { type: action.type, params: action.params, data });
    }
  }

  /** Get all rules */
  getRules(category?: string): Rule[] {
    const rules = Array.from(this.rules.values());
    return category ? rules.filter((r) => r.category === category) : rules;
  }

  /** Get evaluation history */
  getHistory(ruleId?: string, limit: number = 100): Array<{ ruleId: string; matched: boolean; timestamp: number }> {
    const history = ruleId
      ? this.evaluationHistory.filter((h) => h.ruleId === ruleId)
      : this.evaluationHistory;
    return history.slice(-limit);
  }

  /** Get stats */
  getStats(): {
    totalRules: number;
    enabledRules: number;
    byCategory: Record<string, number>;
    matchRate: number;
  } {
    const rules = Array.from(this.rules.values());
    const byCategory: Record<string, number> = {};
    for (const rule of rules) {
      if (rule.category) byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
    }

    const totalEvaluations = this.evaluationHistory.length;
    const totalMatches = this.evaluationHistory.filter((h) => h.matched).length;

    return {
      totalRules: rules.length,
      enabledRules: rules.filter((r) => r.enabled).length,
      byCategory,
      matchRate: totalEvaluations > 0 ? totalMatches / totalEvaluations : 0,
    };
  }
}

export function createRuleEngine(config?: RuleEngineConfig): RuleEngine {
  return new RuleEngine(config);
}
