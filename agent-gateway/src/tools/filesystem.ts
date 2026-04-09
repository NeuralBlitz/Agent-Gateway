import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync, renameSync, unlinkSync } from 'fs';
import { join, resolve, isAbsolute, dirname } from 'path';
import { logger } from '../infra/index.js';

export interface FileSystemConfig {
  allowedDirs?: string[];
  maxReadBytes?: number;
  maxWriteBytes?: number;
}

export class FileSystemTool {
  private config: Required<FileSystemConfig>;

  constructor(config: FileSystemConfig = {}) {
    this.config = {
      allowedDirs: config.allowedDirs || [process.cwd()],
      maxReadBytes: config.maxReadBytes ?? 256 * 1024, // 256KB
      maxWriteBytes: config.maxWriteBytes ?? 1024 * 1024, // 1MB
    };
  }

  /** Validate that path is within allowed dirs */
  private validatePath(p: string): string {
    const resolved = isAbsolute(p) ? resolve(p) : resolve(process.cwd(), p);
    const allowed = this.config.allowedDirs.map((d) => resolve(d));
    if (!allowed.some((d) => resolved.startsWith(d))) {
      throw new Error(`Path not in allowed directories: ${resolved}`);
    }
    return resolved;
  }

  /** Read a file's contents */
  async read(path: string): Promise<{ content: string; size: number; encoding: string }> {
    const resolved = this.validatePath(path);
    if (!existsSync(resolved)) throw new Error(`File not found: ${resolved}`);
    const stat = statSync(resolved);
    if (stat.isDirectory()) throw new Error(`Path is a directory: ${resolved}`);
    if (stat.size > this.config.maxReadBytes) throw new Error(`File too large: ${stat.size} bytes (max ${this.config.maxReadBytes})`);

    const content = readFileSync(resolved, 'utf-8');
    logger.debug({ path: resolved, size: content.length }, 'File read');
    return { content, size: content.length, encoding: 'utf-8' };
  }

  /** Write content to a file (creates dirs if needed) */
  async write(path: string, content: string): Promise<{ path: string; size: number }> {
    const resolved = this.validatePath(path);
    if (content.length > this.config.maxWriteBytes) {
      throw new Error(`Write too large: ${content.length} bytes (max ${this.config.maxWriteBytes})`);
    }

    // Ensure parent directory exists
    const dir = dirname(resolved);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(resolved, content, 'utf-8');
    logger.debug({ path: resolved, size: content.length }, 'File written');
    return { path: resolved, size: content.length };
  }

  /** List directory contents */
  async listDir(path: string): Promise<{ name: string; type: 'file' | 'directory'; size?: number }[]> {
    const resolved = this.validatePath(path);
    if (!existsSync(resolved)) throw new Error(`Directory not found: ${resolved}`);
    if (!statSync(resolved).isDirectory()) throw new Error(`Not a directory: ${resolved}`);

    const entries = readdirSync(resolved);
    return entries.map((name) => {
      const full = join(resolved, name);
      const stat = statSync(full);
      return {
        name,
        type: stat.isDirectory() ? 'directory' : 'file',
        size: stat.isFile() ? stat.size : undefined,
      };
    });
  }

  /** Create a directory */
  async mkdir(path: string): Promise<{ path: string }> {
    const resolved = this.validatePath(path);
    if (existsSync(resolved)) throw new Error(`Already exists: ${resolved}`);
    mkdirSync(resolved, { recursive: true });
    logger.debug({ path: resolved }, 'Directory created');
    return { path: resolved };
  }

  /** Delete a file */
  async delete(path: string): Promise<void> {
    const resolved = this.validatePath(path);
    if (!existsSync(resolved)) throw new Error(`File not found: ${resolved}`);
    if (statSync(resolved).isDirectory()) throw new Error('Use rmdir for directories');
    unlinkSync(resolved);
    logger.debug({ path: resolved }, 'File deleted');
  }

  /** Move/rename a file or directory */
  async move(from: string, to: string): Promise<{ from: string; to: string }> {
    const resolvedFrom = this.validatePath(from);
    const resolvedTo = this.validatePath(to);
    if (!existsSync(resolvedFrom)) throw new Error(`Not found: ${resolvedFrom}`);
    renameSync(resolvedFrom, resolvedTo);
    logger.debug({ from: resolvedFrom, to: resolvedTo }, 'File/directory moved');
    return { from: resolvedFrom, to: resolvedTo };
  }
}

export function createFileSystemTool(config?: FileSystemConfig): FileSystemTool {
  return new FileSystemTool(config);
}
