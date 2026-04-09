/**
 * Enterprise Security Scanner
 * Request/response inspection, threat detection,
 * IP reputation checking, and automated blocking.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export type ThreatLevel = 'none' | 'low' | 'medium' | 'high' | 'critical';

export interface ThreatDetection {
  id: string;
  type: string;
  level: ThreatLevel;
  description: string;
  source: string;
  details: Record<string, any>;
  timestamp: number;
  blocked: boolean;
}

export interface IpReputation {
  ip: string;
  score: number; // 0-100, higher = more suspicious
  threats: string[];
  country?: string;
  asn?: string;
  lastSeen?: number;
  blocked: boolean;
}

export interface SecurityConfig {
  /** Max request size in bytes */
  maxRequestSize?: number;
  /** Max header count */
  maxHeaderCount?: number;
  /** Max URL length */
  maxUrlLength?: number;
  /** Blocked IP list */
  blockedIps?: string[];
  /** Blocked user agents */
  blockedUserAgents?: string[];
  /** Whether to enable SQL injection detection */
  detectSqlInjection?: boolean;
  /** Whether to enable XSS detection */
  detectXss?: boolean;
  /** Whether to enable path traversal detection */
  detectPathTraversal?: boolean;
  /** Whether to enable command injection detection */
  detectCommandInjection?: boolean;
  /** Threat score threshold for auto-blocking */
  autoBlockThreshold?: number;
}

export class SecurityScanner extends EventEmitter {
  private config: Required<SecurityConfig>;
  private detections: ThreatDetection[] = [];
  private ipReputation: Map<string, IpReputation> = new Map();
  private blockedIps: Set<string>;
  private requestCounts: Map<string, { count: number; windowStart: number }> = new Map();
  private maxDetections = 10000;

  constructor(config: SecurityConfig = {}) {
    super();
    this.config = {
      maxRequestSize: config.maxRequestSize || 10 * 1024 * 1024, // 10MB
      maxHeaderCount: config.maxHeaderCount || 50,
      maxUrlLength: config.maxUrlLength || 2048,
      blockedIps: config.blockedIps || [],
      blockedUserAgents: config.blockedUserAgents || [],
      detectSqlInjection: config.detectSqlInjection ?? true,
      detectXss: config.detectXss ?? true,
      detectPathTraversal: config.detectPathTraversal ?? true,
      detectCommandInjection: config.detectCommandInjection ?? true,
      autoBlockThreshold: config.autoBlockThreshold || 80,
    };

    this.blockedIps = new Set(this.config.blockedIps);
  }

  /** Scan an incoming request */
  scanRequest(req: {
    ip?: string;
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    userAgent?: string;
  }): { blocked: boolean; threats: ThreatDetection[]; score: number } {
    const threats: ThreatDetection[] = [];
    let totalScore = 0;
    const ip = req.ip || 'unknown';

    // Check blocked IP
    if (this.blockedIps.has(ip)) {
      threats.push(this.createDetection('blocked_ip', 'critical', `Blocked IP: ${ip}`, ip, { ip }));
      return { blocked: true, threats, score: 100 };
    }

    // Check blocked user agent
    if (req.userAgent && this.config.blockedUserAgents.some((ua) => req.userAgent!.toLowerCase().includes(ua.toLowerCase()))) {
      threats.push(this.createDetection('blocked_user_agent', 'high', `Blocked user agent: ${req.userAgent}`, ip, { userAgent: req.userAgent }));
      totalScore += 40;
    }

    // Check URL length
    if (req.url && req.url.length > this.config.maxUrlLength) {
      threats.push(this.createDetection('url_too_long', 'medium', `URL exceeds max length (${req.url.length} > ${this.config.maxUrlLength})`, ip, { urlLength: req.url.length }));
      totalScore += 20;
    }

    // Check header count
    if (req.headers && Object.keys(req.headers).length > this.config.maxHeaderCount) {
      threats.push(this.createDetection('too_many_headers', 'low', `Too many headers (${Object.keys(req.headers).length} > ${this.config.maxHeaderCount})`, ip, { headerCount: Object.keys(req.headers).length }));
      totalScore += 10;
    }

    // SQL injection detection
    if (this.config.detectSqlInjection) {
      const sqlThreat = this.detectSqlInjection(req);
      if (sqlThreat) {
        threats.push(sqlThreat);
        totalScore += 60;
      }
    }

    // XSS detection
    if (this.config.detectXss) {
      const xssThreat = this.detectXss(req);
      if (xssThreat) {
        threats.push(xssThreat);
        totalScore += 50;
      }
    }

    // Path traversal detection
    if (this.config.detectPathTraversal) {
      const pathThreat = this.detectPathTraversal(req);
      if (pathThreat) {
        threats.push(pathThreat);
        totalScore += 40;
      }
    }

    // Command injection detection
    if (this.config.detectCommandInjection) {
      const cmdThreat = this.detectCommandInjection(req);
      if (cmdThreat) {
        threats.push(cmdThreat);
        totalScore += 70;
      }
    }

    // Check request rate
    const rateThreat = this.checkRequestRate(ip);
    if (rateThreat) {
      threats.push(rateThreat);
      totalScore += 30;
    }

    // Auto-block if score exceeds threshold
    let blocked = totalScore >= this.config.autoBlockThreshold;
    if (blocked && !this.blockedIps.has(ip)) {
      this.blockedIps.add(ip);
      this.updateIpReputation(ip, totalScore, threats.map((t) => t.type));
      logger.warn({ ip, score: totalScore, threats: threats.map((t) => t.type) }, 'IP auto-blocked');
    }

    // Update IP reputation
    if (!blocked) {
      this.updateIpReputation(ip, totalScore, threats.map((t) => t.type));
    }

    // Store detections
    for (const threat of threats) {
      threat.blocked = blocked;
      this.detections.push(threat);
      if (this.detections.length > this.maxDetections) this.detections.shift();
    }

    if (threats.length > 0) {
      this.emit('threat:detected', { ip, threats, score: totalScore, blocked });
    }

    return { blocked, threats, score: Math.min(100, totalScore) };
  }

  /** Detect SQL injection patterns */
  private detectSqlInjection(req: any): ThreatDetection | null {
    const patterns = [
      /(\b(union|select|insert|update|delete|drop|alter|create|exec|execute)\b.*\b(from|into|table|database|where)\b)/gi,
      /(['"]\s*(or|and)\s+['"]?\d+['"]?\s*=\s*['"]?\d+)/gi,
      /(\bwaitfor\s+delay\b)/gi,
      /(\bsleep\s*\(\s*\d+\s*\))/gi,
      /(--\s*$|\/\*.*\*\/)/gi,
      /(\bbenchmark\s*\()/gi,
    ];

    const content = this.getRequestContent(req);

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return this.createDetection('sql_injection', 'critical', 'SQL injection pattern detected', req.ip || 'unknown', { pattern: pattern.source });
      }
    }

    return null;
  }

  /** Detect XSS patterns */
  private detectXss(req: any): ThreatDetection | null {
    const patterns = [
      /<script[^>]*>/gi,
      /javascript\s*:/gi,
      /on(load|error|click|mouseover|focus|blur|submit|change)\s*=/gi,
      /eval\s*\(/gi,
      /document\.(cookie|write|location)/gi,
      /window\.(location|open|alert)/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
    ];

    const content = this.getRequestContent(req);

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        return this.createDetection('xss', 'high', 'XSS pattern detected', req.ip || 'unknown', { pattern: pattern.source });
      }
    }

    return null;
  }

  /** Detect path traversal */
  private detectPathTraversal(req: any): ThreatDetection | null {
    if (req.url && /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%2e%2e%5c)/i.test(req.url)) {
      return this.createDetection('path_traversal', 'high', 'Path traversal pattern detected', req.ip || 'unknown', { url: req.url });
    }
    return null;
  }

  /** Detect command injection */
  private detectCommandInjection(req: any): ThreatDetection | null {
    const patterns = [
      /[;|`$(){}[\]]/,
      /\b(cat|ls|dir|whoami|id|uname|pwd|wget|curl|nc|bash|sh|cmd|powershell)\b/,
    ];

    const content = this.getRequestContent(req);

    if (patterns[0].test(content) && patterns[1].test(content)) {
      return this.createDetection('command_injection', 'critical', 'Command injection pattern detected', req.ip || 'unknown', {});
    }

    return null;
  }

  /** Check request rate */
  private checkRequestRate(ip: string): ThreatDetection | null {
    const now = Date.now();
    const entry = this.requestCounts.get(ip);

    if (!entry || now - entry.windowStart > 60000) {
      this.requestCounts.set(ip, { count: 1, windowStart: now });
      return null;
    }

    entry.count++;

    if (entry.count > 1000) {
      return this.createDetection('rate_exceeded', 'medium', `Excessive request rate: ${entry.count} req/min`, ip, { count: entry.count });
    }

    return null;
  }

  /** Get request content for scanning */
  private getRequestContent(req: any): string {
    const parts: string[] = [];
    if (req.url) parts.push(req.url);
    if (req.body) {
      if (typeof req.body === 'string') parts.push(req.body);
      else parts.push(JSON.stringify(req.body));
    }
    if (req.headers) parts.push(JSON.stringify(req.headers));
    return parts.join(' ');
  }

  /** Update IP reputation */
  private updateIpReputation(ip: string, score: number, threats: string[]): void {
    const existing = this.ipReputation.get(ip);
    const newScore = existing ? Math.min(100, existing.score + score) : score;
    const allThreats = existing ? [...new Set([...existing.threats, ...threats])] : threats;

    this.ipReputation.set(ip, {
      ip,
      score: newScore,
      threats: allThreats,
      lastSeen: Date.now(),
      blocked: this.blockedIps.has(ip),
    });
  }

  /** Create a threat detection record */
  private createDetection(type: string, level: ThreatLevel, description: string, source: string, details: Record<string, any>): ThreatDetection {
    return {
      id: `threat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      level,
      description,
      source,
      details,
      timestamp: Date.now(),
      blocked: false,
    };
  }

  /** Block an IP */
  blockIp(ip: string): void {
    this.blockedIps.add(ip);
    this.updateIpReputation(ip, 100, ['manual_block']);
    logger.warn({ ip }, 'IP manually blocked');
    this.emit('ip:blocked', { ip });
  }

  /** Unblock an IP */
  unblockIp(ip: string): void {
    this.blockedIps.delete(ip);
    const rep = this.ipReputation.get(ip);
    if (rep) rep.blocked = false;
    logger.info({ ip }, 'IP manually unblocked');
    this.emit('ip:unblocked', { ip });
  }

  /** Get IP reputation */
  getIpReputation(ip: string): IpReputation | undefined {
    return this.ipReputation.get(ip);
  }

  /** Get recent detections */
  getDetections(limit: number = 100, type?: string): ThreatDetection[] {
    let detections = this.detections.slice(-limit);
    if (type) detections = detections.filter((d) => d.type === type);
    return detections;
  }

  /** Get security stats */
  getStats(): {
    totalDetections: number;
    blockedIps: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    topOffenders: Array<{ ip: string; score: number; threats: number }>;
  } {
    const byType: Record<string, number> = {};
    const byLevel: Record<string, number> = {};
    const ipScores: Map<string, { score: number; threats: number }> = new Map();

    for (const detection of this.detections) {
      byType[detection.type] = (byType[detection.type] || 0) + 1;
      byLevel[detection.level] = (byLevel[detection.level] || 0) + 1;

      const ipEntry = ipScores.get(detection.source) || { score: 0, threats: 0 };
      ipEntry.threats++;
      const levelScores: Record<string, number> = { low: 10, medium: 25, high: 50, critical: 75 };
      ipEntry.score += levelScores[detection.level] || 0;
      ipScores.set(detection.source, ipEntry);
    }

    const topOffenders = Array.from(ipScores.entries())
      .map(([ip, data]) => ({ ip, ...data }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      totalDetections: this.detections.length,
      blockedIps: this.blockedIps.size,
      byType,
      byLevel,
      topOffenders,
    };
  }
}

export function createSecurityScanner(config?: SecurityConfig): SecurityScanner {
  return new SecurityScanner(config);
}
