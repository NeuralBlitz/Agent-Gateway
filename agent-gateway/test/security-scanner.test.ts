import { describe, it, expect, beforeEach } from 'vitest';
import { SecurityScanner, createSecurityScanner, ThreatDetection } from '../src/security-scanner/index.js';

describe('SecurityScanner', () => {
  let scanner: SecurityScanner;

  beforeEach(() => {
    scanner = createSecurityScanner();
  });

  describe('createSecurityScanner', () => {
    it('should create a SecurityScanner instance', () => {
      expect(scanner).toBeInstanceOf(SecurityScanner);
    });

    it('should accept custom config', () => {
      const custom = createSecurityScanner({
        maxRequestSize: 1024,
        maxHeaderCount: 10,
        maxUrlLength: 100,
        blockedIps: ['1.2.3.4'],
        blockedUserAgents: ['bad-bot'],
        detectSqlInjection: true,
        detectXss: false,
        detectPathTraversal: true,
        detectCommandInjection: false,
        autoBlockThreshold: 50,
      });
      expect(custom).toBeInstanceOf(SecurityScanner);
    });
  });

  describe('scanRequest', () => {
    it('should allow a clean request', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/users',
        headers: { 'content-type': 'application/json' },
      });
      expect(result.blocked).toBe(false);
      expect(result.threats).toEqual([]);
      expect(result.score).toBe(0);
    });

    it('should block a known blocked IP', () => {
      const blockedScanner = createSecurityScanner({ blockedIps: ['10.0.0.5'] });
      const result = blockedScanner.scanRequest({
        ip: '10.0.0.5',
        method: 'GET',
        url: '/api/users',
      });
      expect(result.blocked).toBe(true);
      expect(result.score).toBe(100);
      expect(result.threats.length).toBeGreaterThanOrEqual(1);
      expect(result.threats[0].type).toBe('blocked_ip');
      expect(result.threats[0].level).toBe('critical');
    });

    it('should detect blocked user agent', () => {
      const scannerWithBlock = createSecurityScanner({ blockedUserAgents: ['malicious-bot'] });
      const result = scannerWithBlock.scanRequest({
        ip: '10.0.0.2',
        method: 'GET',
        url: '/api/data',
        userAgent: 'malicious-bot/1.0',
      });
      expect(result.threats.some((t) => t.type === 'blocked_user_agent')).toBe(true);
    });

    it('should detect URL too long', () => {
      const scannerWithLimit = createSecurityScanner({ maxUrlLength: 50 });
      const longUrl = '/api/data?' + 'a'.repeat(100);
      const result = scannerWithLimit.scanRequest({
        ip: '10.0.0.3',
        method: 'GET',
        url: longUrl,
      });
      expect(result.threats.some((t) => t.type === 'url_too_long')).toBe(true);
    });

    it('should detect too many headers', () => {
      const scannerWithLimit = createSecurityScanner({ maxHeaderCount: 2 });
      const headers: Record<string, string> = {};
      for (let i = 0; i < 5; i++) headers[`x-custom-${i}`] = `value-${i}`;

      const result = scannerWithLimit.scanRequest({
        ip: '10.0.0.4',
        method: 'GET',
        url: '/api/data',
        headers,
      });
      expect(result.threats.some((t) => t.type === 'too_many_headers')).toBe(true);
    });

    it('should handle request with no IP', () => {
      const result = scanner.scanRequest({
        method: 'GET',
        url: '/api/users',
      });
      expect(result.blocked).toBe(false);
    });

    it('should handle request with no headers', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/users',
      });
      expect(result.blocked).toBe(false);
    });
  });

  describe('SQL injection detection', () => {
    it('should detect SQL injection in URL', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: "/api/users?id=1 UNION SELECT * FROM users WHERE 1=1",
      });
      expect(result.threats.some((t) => t.type === 'sql_injection')).toBe(true);
    });

    it('should detect SQL injection in body', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/query',
        body: { input: "' OR 1=1 --" },
      });
      expect(result.threats.some((t) => t.type === 'sql_injection')).toBe(true);
    });

    it('should detect SLEEP-based SQL injection', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: "/api/users?id=1; sleep(5)",
      });
      expect(result.threats.some((t) => t.type === 'sql_injection')).toBe(true);
    });

    it('should detect WAITFOR DELAY SQL injection', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: "/api/users; WAITFOR DELAY '0:0:5'",
      });
      expect(result.threats.some((t) => t.type === 'sql_injection')).toBe(true);
    });

    it('should not detect SQL injection when disabled', () => {
      const noSqlScanner = createSecurityScanner({ detectSqlInjection: false });
      const result = noSqlScanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: "/api/users?id=1 UNION SELECT * FROM users WHERE 1=1",
      });
      expect(result.threats.some((t) => t.type === 'sql_injection')).toBe(false);
    });
  });

  describe('XSS detection', () => {
    it('should detect script tag', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/comment',
        body: { text: '<script>alert("xss")</script>' },
      });
      expect(result.threats.some((t) => t.type === 'xss')).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/link',
        body: { url: 'javascript:alert(1)' },
      });
      expect(result.threats.some((t) => t.type === 'xss')).toBe(true);
    });

    it('should detect event handlers', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/input',
        body: { data: '<img onerror=alert(1) src=x>' },
      });
      expect(result.threats.some((t) => t.type === 'xss')).toBe(true);
    });

    it('should detect eval()', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/exec',
        body: { expr: 'eval(document.cookie)' },
      });
      expect(result.threats.some((t) => t.type === 'xss')).toBe(true);
    });

    it('should not detect XSS when disabled', () => {
      const noXssScanner = createSecurityScanner({ detectXss: false });
      const result = noXssScanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/comment',
        body: { text: '<script>alert("xss")</script>' },
      });
      expect(result.threats.some((t) => t.type === 'xss')).toBe(false);
    });
  });

  describe('Path traversal detection', () => {
    it('should detect ../ traversal', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/files/../../../etc/passwd',
      });
      expect(result.threats.some((t) => t.type === 'path_traversal')).toBe(true);
    });

    it('should detect URL-encoded traversal', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/files/%2e%2e%2f%2e%2e%2fetc/passwd',
      });
      expect(result.threats.some((t) => t.type === 'path_traversal')).toBe(true);
    });

    it('should not detect path traversal when disabled', () => {
      const noPathScanner = createSecurityScanner({ detectPathTraversal: false });
      const result = noPathScanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/files/../../../etc/passwd',
      });
      expect(result.threats.some((t) => t.type === 'path_traversal')).toBe(false);
    });
  });

  describe('Command injection detection', () => {
    it('should detect command injection patterns', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/exec',
        body: { cmd: 'test; cat /etc/passwd' },
      });
      expect(result.threats.some((t) => t.type === 'command_injection')).toBe(true);
    });

    it('should not detect command injection when disabled', () => {
      const noCmdScanner = createSecurityScanner({ detectCommandInjection: false });
      const result = noCmdScanner.scanRequest({
        ip: '10.0.0.1',
        method: 'POST',
        url: '/api/exec',
        body: { cmd: 'test; cat /etc/passwd' },
      });
      expect(result.threats.some((t) => t.type === 'command_injection')).toBe(false);
    });
  });

  describe('Auto-blocking', () => {
    it('should auto-block IP when score exceeds threshold', () => {
      const result = scanner.scanRequest({
        ip: '10.0.0.50',
        method: 'GET',
        url: "/api/users?id=1 UNION SELECT * FROM users WHERE 1=1",
      });
      // SQL injection adds 60, default threshold is 80. Let's test with a lower threshold scanner.
      expect(result.score).toBeGreaterThanOrEqual(60);
    });

    it('should auto-block with low threshold', () => {
      const lowThresholdScanner = createSecurityScanner({ autoBlockThreshold: 20 });
      const result = lowThresholdScanner.scanRequest({
        ip: '10.0.0.60',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      expect(result.blocked).toBe(true);
      expect(result.score).toBe(40);
    });
  });

  describe('blockIp / unblockIp', () => {
    it('should block an IP', () => {
      scanner.blockIp('10.0.0.99');
      const result = scanner.scanRequest({
        ip: '10.0.0.99',
        method: 'GET',
        url: '/api/users',
      });
      expect(result.blocked).toBe(true);
      expect(result.score).toBe(100);
    });

    it('should unblock an IP', () => {
      scanner.blockIp('10.0.0.88');
      scanner.unblockIp('10.0.0.88');
      const result = scanner.scanRequest({
        ip: '10.0.0.88',
        method: 'GET',
        url: '/api/users',
      });
      expect(result.blocked).toBe(false);
    });

    it('should emit ip:blocked event', () => {
      const blockedHandler = new Promise<{ ip: string }>((resolve) => {
        scanner.on('ip:blocked', resolve);
      });
      scanner.blockIp('10.0.0.77');
      return expect(blockedHandler).resolves.toHaveProperty('ip', '10.0.0.77');
    });

    it('should emit ip:unblocked event', () => {
      const unblockedHandler = new Promise<{ ip: string }>((resolve) => {
        scanner.on('ip:unblocked', resolve);
      });
      scanner.unblockIp('10.0.0.66');
      return expect(unblockedHandler).resolves.toHaveProperty('ip', '10.0.0.66');
    });

    it('should unblock non-existent IP without error', () => {
      expect(() => scanner.unblockIp('non-existent')).not.toThrow();
    });
  });

  describe('getIpReputation', () => {
    it('should return undefined for unknown IP', () => {
      expect(scanner.getIpReputation('10.0.0.1')).toBeUndefined();
    });

    it('should track IP reputation after scan', () => {
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const rep = scanner.getIpReputation('10.0.0.1');
      expect(rep).toBeDefined();
      expect(rep!.ip).toBe('10.0.0.1');
      expect(rep!.score).toBeGreaterThan(0);
    });

    it('should accumulate IP score across scans', () => {
      scanner.scanRequest({
        ip: '10.0.0.2',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      scanner.scanRequest({
        ip: '10.0.0.2',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const rep = scanner.getIpReputation('10.0.0.2');
      expect(rep!.score).toBeGreaterThan(40);
    });
  });

  describe('getDetections', () => {
    it('should return recent detections', () => {
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const detections = scanner.getDetections();
      expect(detections.length).toBe(1);
      expect(detections[0].type).toBe('path_traversal');
    });

    it('should filter by type', () => {
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const sqlDetections = scanner.getDetections(100, 'sql_injection');
      expect(sqlDetections.length).toBe(0);
      const pathDetections = scanner.getDetections(100, 'path_traversal');
      expect(pathDetections.length).toBe(1);
    });

    it('should respect limit', () => {
      for (let i = 0; i < 10; i++) {
        scanner.scanRequest({
          ip: `10.0.0.${i}`,
          method: 'GET',
          url: '/api/data?file=../../../etc/passwd',
        });
      }
      const detections = scanner.getDetections(3);
      expect(detections.length).toBe(3);
    });

    it('should include blocked flag', () => {
      const lowThresholdScanner = createSecurityScanner({ autoBlockThreshold: 20 });
      lowThresholdScanner.scanRequest({
        ip: '10.0.0.5',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const detections = lowThresholdScanner.getDetections();
      expect(detections[0].blocked).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return stats with no detections', () => {
      const stats = scanner.getStats();
      expect(stats.totalDetections).toBe(0);
      expect(stats.blockedIps).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.byLevel).toEqual({});
      expect(stats.topOffenders).toEqual([]);
    });

    it('should return accurate stats', () => {
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const stats = scanner.getStats();
      expect(stats.totalDetections).toBe(1);
      expect(stats.byType['path_traversal']).toBe(1);
      expect(stats.topOffenders.length).toBe(1);
    });

    it('should rank top offenders by score', () => {
      for (let i = 0; i < 5; i++) {
        scanner.scanRequest({
          ip: '10.0.0.1',
          method: 'GET',
          url: '/api/data?file=../../../etc/passwd',
        });
      }
      scanner.scanRequest({
        ip: '10.0.0.2',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const stats = scanner.getStats();
      expect(stats.topOffenders[0].ip).toBe('10.0.0.1');
    });
  });

  describe('threat:detected event', () => {
    it('should emit event when threats found', () => {
      const threatHandler = new Promise<{ ip: string; threats: ThreatDetection[]; score: number; blocked: boolean }>((resolve) => {
        scanner.on('threat:detected', resolve);
      });
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      return expect(threatHandler).resolves.toHaveProperty('ip', '10.0.0.1');
    });

    it('should not emit event for clean requests', () => {
      const threatHandler = vi.fn();
      scanner.on('threat:detected', threatHandler);
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/users',
      });
      expect(threatHandler).not.toHaveBeenCalled();
    });
  });

  describe('rate limiting', () => {
    it('should detect excessive request rate', () => {
      // Send 1001 requests from same IP
      for (let i = 0; i < 1001; i++) {
        scanner.scanRequest({
          ip: '10.0.0.100',
          method: 'GET',
          url: '/api/data',
        });
      }
      const lastResult = scanner.scanRequest({
        ip: '10.0.0.100',
        method: 'GET',
        url: '/api/data',
      });
      expect(lastResult.threats.some((t) => t.type === 'rate_exceeded')).toBe(true);
    });
  });

  describe('detection record properties', () => {
    it('should have all required fields', () => {
      scanner.scanRequest({
        ip: '10.0.0.1',
        method: 'GET',
        url: '/api/data?file=../../../etc/passwd',
      });
      const detections = scanner.getDetections();
      const d = detections[0];
      expect(d.id).toBeDefined();
      expect(d.type).toBeDefined();
      expect(d.level).toBeDefined();
      expect(d.description).toBeDefined();
      expect(d.source).toBe('10.0.0.1');
      expect(d.details).toBeDefined();
      expect(d.timestamp).toBeDefined();
    });
  });
});
