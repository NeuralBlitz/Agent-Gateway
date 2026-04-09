import { describe, it, expect, beforeAll } from 'vitest';
import { BashTool } from '../src/tools/bash.js';
import { FileSystemTool } from '../src/tools/filesystem.js';
import { ToolRegistry } from '../src/tools/registry.js';
import { mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_DIR = join(process.cwd(), '.test-tmp');

beforeAll(() => {
  if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true, force: true });
  mkdirSync(TEST_DIR, { recursive: true });
});

describe('BashTool', () => {
  const tool = new BashTool({ allowedDirs: [TEST_DIR], timeoutMs: 5000 });

  it('executes a simple command', async () => {
    const result = await tool.execute('echo hello');
    expect(result.success).toBe(true);
    expect(result.stdout.trim()).toBe('hello');
  });

  it('captures stderr', async () => {
    const result = await tool.execute('echo error >&2');
    expect(result.success).toBe(true);
    expect(result.stderr.trim()).toBe('error');
  });

  it('blocks dangerous commands', async () => {
    const result = await tool.execute('rm -rf /');
    expect(result.success).toBe(false);
    expect(result.error).toContain('blocked');
  });

  it('respects timeout', async () => {
    const slowTool = new BashTool({ allowedDirs: [TEST_DIR], timeoutMs: 100 });
    const result = await slowTool.execute('sleep 10');
    expect(result.success).toBe(false);
    expect(result.exitCode < 0).toBe(true);
  });

  it('restricts working directory', async () => {
    const result = await tool.execute('pwd', '/');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not in allowed');
  });
});

describe('FileSystemTool', () => {
  const tool = new FileSystemTool({ allowedDirs: [TEST_DIR] });

  it('writes and reads a file', async () => {
    await tool.write(join(TEST_DIR, 'test.txt'), 'hello world');
    const result = await tool.read(join(TEST_DIR, 'test.txt'));
    expect(result.content).toBe('hello world');
  });

  it('lists a directory', async () => {
    const result = await tool.listDir(TEST_DIR);
    expect(result.some(f => f.name === 'test.txt')).toBe(true);
  });

  it('creates a directory', async () => {
    await tool.mkdir(join(TEST_DIR, 'subdir'));
    expect(existsSync(join(TEST_DIR, 'subdir'))).toBe(true);
  });

  it('moves a file', async () => {
    await tool.move(join(TEST_DIR, 'test.txt'), join(TEST_DIR, 'moved.txt'));
    expect(existsSync(join(TEST_DIR, 'moved.txt'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'test.txt'))).toBe(false);
  });

  it('deletes a file', async () => {
    await tool.delete(join(TEST_DIR, 'moved.txt'));
    expect(existsSync(join(TEST_DIR, 'moved.txt'))).toBe(false);
  });

  it('rejects paths outside allowed dirs', async () => {
    await expect(tool.read('/etc/passwd')).rejects.toThrow('not in allowed');
  });
});

describe('ToolRegistry', () => {
  it('registers built-in tools', () => {
    const registry = new ToolRegistry();
    const tools = registry.list();
    expect(tools.length).toBeGreaterThanOrEqual(3);
    expect(tools.map(t => t.name)).toContain('bash');
    expect(tools.map(t => t.name)).toContain('filesystem');
    expect(tools.map(t => t.name)).toContain('web_search');
  });

  it('converts to provider tool schemas', () => {
    const registry = new ToolRegistry();
    const schemas = registry.toProviderTools();
    expect(schemas.length).toBeGreaterThanOrEqual(3);
    for (const schema of schemas) {
      expect(schema.type).toBe('function');
      expect(schema.function.name).toBeDefined();
      expect(schema.function.description).toBeDefined();
      expect(schema.function.parameters).toBeDefined();
    }
  });

  it('executes tools', async () => {
    const registry = new ToolRegistry();
    const result = await registry.execute('bash', { command: 'echo test123' });
    expect(result.success).toBe(true);
    expect(result.output.trim()).toBe('test123');
  });

  it('can disable tools', () => {
    const registry = new ToolRegistry({
      bash: { enabled: false },
      filesystem: { enabled: false },
      websearch: { enabled: false },
    });
    expect(registry.list()).toEqual([]);
  });
});
