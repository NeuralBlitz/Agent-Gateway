import { describe, it, expect } from 'vitest';
import { createRuleEngine } from '../src/rule-engine/index.js';

describe('RuleEngine', () => {
  const engine = createRuleEngine();

  describe('addRule / removeRule', () => {
    it('should add and evaluate a matching rule', () => {
      engine.addRule({
        id: 'r1',
        name: 'age check',
        condition: { field: 'age', operator: 'gt', value: 18 },
        actions: [{ type: 'log', params: { message: 'adult detected' } }],
        priority: 1,
        enabled: true,
      });

      const results = engine.evaluate({ age: 25 });
      const r = results.find(r => r.ruleId === 'r1');
      expect(r?.matched).toBe(true);
    });

    it('should not match when condition is false', () => {
      const results = engine.evaluate({ age: 10 });
      const r = results.find(r => r.ruleId === 'r1');
      expect(r?.matched).toBe(false);
    });

    it('should remove a rule', () => {
      engine.addRule({ id: 'r2', name: 'temp', condition: { field: 'x', operator: 'eq', value: 1 }, actions: [], priority: 1, enabled: true });
      expect(engine.removeRule('r2')).toBe(true);
      expect(engine.removeRule('r2')).toBe(false);
    });
  });

  describe('operators', () => {
    it('should evaluate eq', () => {
      engine.addRule({
        id: 'op-eq', name: 'eq test',
        condition: { field: 'f', operator: 'eq', value: 'foo' },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ f: 'foo' }).find(r => r.ruleId === 'op-eq')?.matched).toBe(true);
      expect(engine.evaluate({ f: 'bar' }).find(r => r.ruleId === 'op-eq')?.matched).toBe(false);
    });

    it('should evaluate gt', () => {
      engine.addRule({
        id: 'op-gt', name: 'gt test',
        condition: { field: 'f', operator: 'gt', value: 5 },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ f: 10 }).find(r => r.ruleId === 'op-gt')?.matched).toBe(true);
    });

    it('should evaluate contains', () => {
      engine.addRule({
        id: 'op-contains', name: 'contains test',
        condition: { field: 'f', operator: 'contains', value: 'hello' },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ f: 'say hello world' }).find(r => r.ruleId === 'op-contains')?.matched).toBe(true);
    });

    it('should evaluate in', () => {
      engine.addRule({
        id: 'op-in', name: 'in test',
        condition: { field: 'f', operator: 'in', value: ['a', 'b'] },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ f: 'a' }).find(r => r.ruleId === 'op-in')?.matched).toBe(true);
    });

    it('should evaluate isNull', () => {
      engine.addRule({
        id: 'op-null', name: 'null test',
        condition: { field: 'f', operator: 'isNull', value: null },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ f: null }).find(r => r.ruleId === 'op-null')?.matched).toBe(true);
    });
  });

  describe('nested conditions', () => {
    it('should evaluate and condition', () => {
      engine.addRule({
        id: 'and-rule', name: 'and test',
        condition: {
          operator: 'and',
          conditions: [
            { field: 'a', operator: 'gt', value: 0 },
            { field: 'b', operator: 'gt', value: 0 },
          ],
        },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ a: 1, b: 2 }).find(r => r.ruleId === 'and-rule')?.matched).toBe(true);
      expect(engine.evaluate({ a: 1, b: -1 }).find(r => r.ruleId === 'and-rule')?.matched).toBe(false);
    });

    it('should evaluate or condition', () => {
      engine.addRule({
        id: 'or-rule', name: 'or test',
        condition: {
          operator: 'or',
          conditions: [
            { field: 'a', operator: 'eq', value: 'x' },
            { field: 'b', operator: 'eq', value: 'y' },
          ],
        },
        actions: [], priority: 1, enabled: true,
      });
      expect(engine.evaluate({ a: 'x', b: 'z' }).find(r => r.ruleId === 'or-rule')?.matched).toBe(true);
    });
  });

  describe('action types', () => {
    it('should execute tag action', () => {
      engine.addRule({
        id: 'tag-action', name: 'tag test',
        condition: { field: 'trigger', operator: 'eq', value: true },
        actions: [{ type: 'tag', params: { tag: 'matched' } }],
        priority: 1, enabled: true,
      });
      const data: Record<string, any> = { trigger: true };
      const results = engine.evaluate(data);
      const r = results.find(r => r.ruleId === 'tag-action');
      expect(r?.matched).toBe(true);
      expect(data._tags).toContain('matched');
    });

    it('should execute reject action', () => {
      engine.addRule({
        id: 'reject-action', name: 'reject test',
        condition: { field: 'blocked', operator: 'eq', value: true },
        actions: [{ type: 'reject', params: { reason: 'blocked content' } }],
        priority: 1, enabled: true,
      });
      const results = engine.evaluate({ blocked: true });
      const r = results.find(r => r.ruleId === 'reject-action');
      expect(r?.matched).toBe(true);
      expect(r?.actions[0].executed).toBe(false);
    });
  });

  describe('toggle and stats', () => {
    it('should toggle a rule', () => {
      engine.addRule({ id: 'toggle-test', name: 'toggle', condition: { field: 'x', operator: 'eq', value: 1 }, actions: [], priority: 1, enabled: true });
      engine.toggleRule('toggle-test', false);
      const results = engine.evaluate({ x: 1 });
      expect(results.find(r => r.ruleId === 'toggle-test')).toBeUndefined();
    });

    it('should return stats', () => {
      const stats = engine.getStats();
      expect(stats.totalRules).toBeGreaterThan(0);
    });
  });
});
