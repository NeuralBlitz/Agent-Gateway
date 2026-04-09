/**
 * Enterprise API Version Manager
 * Manages multiple API versions simultaneously with deprecation schedules,
 * migration guides, version negotiation, and automatic response transformation.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface ApiVersion {
  version: string;
  /** When this version was released */
  releasedAt: string;
  /** When this version was deprecated */
  deprecatedAt?: string;
  /** When this version will be sunset */
  sunsetAt?: string;
  /** Migration guide URL */
  migrationGuide?: string;
  /** Whether this is the current latest */
  isLatest: boolean;
  /** Breaking changes from previous version */
  breakingChanges?: string[];
  /** New features in this version */
  newFeatures?: string[];
}

export interface VersionedEndpoint {
  path: string;
  method: string;
  /** Minimum version that supports this endpoint */
  minVersion: string;
  /** Maximum version that supports this endpoint */
  maxVersion?: string;
  /** Whether this endpoint is deprecated */
  deprecated?: boolean;
  /** Deprecation message */
  deprecationMessage?: string;
  /** Alternative endpoint */
  alternative?: string;
}

export interface VersionNegotiationResult {
  negotiatedVersion: string;
  source: 'header' | 'path' | 'query' | 'accept' | 'default';
  isDeprecated: boolean;
  sunsetAt?: string;
  migrationGuide?: string;
}

export class ApiVersionManager extends EventEmitter {
  private versions: Map<string, ApiVersion> = new Map();
  private endpoints: Map<string, VersionedEndpoint[]> = new Map();
  private defaultVersion: string;

  constructor(versions: ApiVersion[] = [], defaultVersion?: string) {
    super();
    for (const v of versions) {
      this.versions.set(v.version, v);
    }
    this.defaultVersion = defaultVersion || (versions.find(v => v.isLatest)?.version) || 'v1';
  }

  /** Register an API version */
  registerVersion(version: ApiVersion): void {
    this.versions.set(version.version, version);
    logger.info({ version: version.version, isLatest: version.isLatest }, 'API version registered');
    this.emit('version:registered', version);
  }

  /** Register a versioned endpoint */
  registerEndpoint(endpoint: VersionedEndpoint): void {
    if (!this.endpoints.has(endpoint.path)) {
      this.endpoints.set(endpoint.path, []);
    }
    this.endpoints.get(endpoint.path)!.push(endpoint);
  }

  /** Negotiate API version from request */
  negotiate(req: { headers: Record<string, string>; path: string; query: Record<string, string> }): VersionNegotiationResult {
    // 1. Path-based: /api/v2/...
    const pathMatch = req.path.match(/^\/api\/(v\d+)/);
    if (pathMatch && this.versions.has(pathMatch[1])) {
      const version = this.versions.get(pathMatch[1])!;
      return this.buildResult(pathMatch[1], 'path', version);
    }

    // 2. Header-based: X-API-Version: v2
    const headerVersion = req.headers['x-api-version'];
    if (headerVersion && this.versions.has(headerVersion)) {
      const version = this.versions.get(headerVersion)!;
      return this.buildResult(headerVersion, 'header', version);
    }

    // 3. Accept header: application/vnd.api.v2+json
    const acceptHeader = req.headers['accept'] || '';
    const acceptMatch = acceptHeader.match(/vnd\.api\.(v\d+)\+json/);
    if (acceptMatch && this.versions.has(acceptMatch[1])) {
      const version = this.versions.get(acceptMatch[1])!;
      return this.buildResult(acceptMatch[1], 'accept', version);
    }

    // 4. Query-based: ?version=v2
    const queryVersion = req.query.version || req.query.api_version;
    if (queryVersion && this.versions.has(queryVersion)) {
      const version = this.versions.get(queryVersion)!;
      return this.buildResult(queryVersion, 'query', version);
    }

    // 5. Default to latest
    const latest = this.getLatestVersion();
    return this.buildResult(latest, 'default', this.versions.get(latest)!);
  }

  /** Check if an endpoint is available for a version */
  isEndpointAvailable(path: string, method: string, version: string): { available: boolean; endpoint?: VersionedEndpoint } {
    const endpoints = this.endpoints.get(path) || [];

    for (const endpoint of endpoints) {
      if (endpoint.method.toLowerCase() !== method.toLowerCase() && endpoint.method !== '*') continue;

      if (this.compareVersions(version, endpoint.minVersion) < 0) continue;
      if (endpoint.maxVersion && this.compareVersions(version, endpoint.maxVersion) > 0) continue;

      return { available: true, endpoint };
    }

    return { available: false };
  }

  /** Get deprecation headers for a version */
  getDeprecationHeaders(version: string): Record<string, string> {
    const v = this.versions.get(version);
    if (!v || !v.deprecatedAt) return {};

    const headers: Record<string, string> = {
      'Deprecation': 'true',
      'Sunset': v.sunsetAt || '',
      'Link': v.migrationGuide ? `<${v.migrationGuide}>; rel="deprecation"; title="Migration Guide"` : '',
      'X-API-Deprecated-Since': v.deprecatedAt,
    };

    if (v.sunsetAt) {
      headers['X-API-Sunset'] = v.sunsetAt;
    }

    return headers;
  }

  /** Transform response for version compatibility */
  transformResponse(version: string, data: any, path: string): any {
    const endpoint = this.endpoints.get(path)?.find(e => this.isEndpointAvailable(path, e.method, version).available);

    if (!endpoint) return data;

    // Apply version-specific transformations
    return this.applyTransformations(version, data);
  }

  /** Get all versions */
  getVersions(): ApiVersion[] {
    return Array.from(this.versions.values());
  }

  /** Get latest version */
  getLatestVersion(): string {
    const latest = Array.from(this.versions.values()).find(v => v.isLatest);
    return latest?.version || this.defaultVersion;
  }

  /** Get deprecated versions */
  getDeprecatedVersions(): ApiVersion[] {
    return Array.from(this.versions.values()).filter(v => v.deprecatedAt);
  }

  /** Get sunset versions */
  getSunsetVersions(): ApiVersion[] {
    return Array.from(this.versions.values()).filter(v => v.sunsetAt && new Date(v.sunsetAt) < new Date());
  }

  /** Deprecate a version */
  deprecate(version: string, sunsetAt: string, migrationGuide: string): boolean {
    const v = this.versions.get(version);
    if (!v) return false;

    v.deprecatedAt = new Date().toISOString();
    v.sunsetAt = sunsetAt;
    v.migrationGuide = migrationGuide;
    v.isLatest = false;

    logger.warn({ version, sunsetAt }, `API version deprecated: ${version}`);
    this.emit('version:deprecated', v);
    return true;
  }

  /** Compare versions */
  private compareVersions(a: string, b: string): number {
    const parse = (v: string) => parseInt(v.replace('v', ''), 10);
    return parse(a) - parse(b);
  }

  /** Build negotiation result */
  private buildResult(version: string, source: VersionNegotiationResult['source'], versionInfo: ApiVersion): VersionNegotiationResult {
    return {
      negotiatedVersion: version,
      source,
      isDeprecated: !!versionInfo.deprecatedAt,
      sunsetAt: versionInfo.sunsetAt,
      migrationGuide: versionInfo.migrationGuide,
    };
  }

  /** Apply version-specific transformations */
  private applyTransformations(version: string, data: any): any {
    // Common transformations for older versions
    const versionNum = parseInt(version.replace('v', ''), 10);

    if (versionNum <= 1) {
      // v1 compatibility: flatten nested responses
      if (data && typeof data === 'object') {
        if (data.data !== undefined && data.meta !== undefined) {
          // In v1, data was at the root level
          return { ...data.data, _meta: data.meta };
        }
      }
    }

    return data;
  }
}

export function createApiVersionManager(versions?: ApiVersion[], defaultVersion?: string): ApiVersionManager {
  return new ApiVersionManager(versions, defaultVersion);
}
