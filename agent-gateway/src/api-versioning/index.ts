import { Router } from 'express';

export interface ApiVersion {
  version: string;
  deprecatedAt?: string;
  migrationGuide?: string;
}

export interface ApiVersionManager {
  getVersions(): ApiVersion[];
  deprecate(version: string, deprecatedAt: string, migrationGuide: string): void;
  createRouter(): Router;
}

export function createApiVersionManager(): ApiVersionManager {
  const versions: ApiVersion[] = [{ version: 'v1' }];

  return {
    getVersions() {
      return versions;
    },
    deprecate(version: string, deprecatedAt: string, migrationGuide: string) {
      const v = versions.find((v) => v.version === version);
      if (v) {
        v.deprecatedAt = deprecatedAt;
        v.migrationGuide = migrationGuide;
      }
    },
    createRouter() {
      const router = Router();
      return router;
    },
  };
}
