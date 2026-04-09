import { exec, spawn, ExecOptions } from 'child_process';
import { promisify } from 'util';
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from 'fs';
import { join, resolve, dirname, isAbsolute } from 'path';
import { logger } from '../infra/index.js';

const execAsync = promisify(exec);

export interface BashToolResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  error?: string;
}

export interface BashToolConfig {
  allowedDirs?: string[];
  maxOutputBytes?: number;
  timeoutMs?: number;
  blockCommands?: string[];
}

const DEFAULT_BLOCKED = [
  'rm -rf /', 'rm -rf /*', ':(){:|:&};:', 'mkfs', 'dd if=',
  'curl -s', 'wget -qO-', 'nc -l', 'nmap',
];

export class BashTool {
  private config: Required<BashToolConfig>;

  constructor(config: BashToolConfig = {}) {
    this.config = {
      allowedDirs: config.allowedDirs || [process.cwd()],
      maxOutputBytes: config.maxOutputBytes ?? 64 * 1024, // 64KB
      timeoutMs: config.timeoutMs ?? 30_000, // 30s
      blockCommands: config.blockCommands || DEFAULT_BLOCKED,
    };
  }

  async execute(command: string, cwd?: string): Promise<BashToolResult> {
    // Safety checks
    const blocked = this.config.blockCommands.find((b) => command.includes(b));
    if (blocked) {
      return { success: false, stdout: '', stderr: '', exitCode: -1, error: `Command blocked: contains '${blocked}'` };
    }

    // Resolve working directory
    const execCwd = cwd ? resolve(cwd) : this.config.allowedDirs[0];

    // Verify cwd is within allowed dirs
    if (!this.config.allowedDirs.some((d) => execCwd.startsWith(resolve(d)))) {
      return { success: false, stdout: '', stderr: '', exitCode: -1, error: `Working directory not in allowed paths: ${execCwd}` };
    }

    const execOptions: ExecOptions = {
      cwd: execCwd,
      timeout: this.config.timeoutMs,
      maxBuffer: this.config.maxOutputBytes,
      env: { ...process.env, FORCE_COLOR: '0' },
    };

    logger.debug({ command, cwd: execCwd }, 'Executing bash command');

    try {
      const { stdout, stderr } = await execAsync(command, execOptions);
      return {
        success: true,
        stdout: this.truncate(typeof stdout === 'string' ? stdout : stdout.toString()),
        stderr: this.truncate(typeof stderr === 'string' ? stderr : stderr.toString()),
        exitCode: 0,
      };
    } catch (err: any) {
      return {
        success: false,
        stdout: this.truncate(typeof err.stdout === 'string' ? err.stdout : (err.stdout ? err.stdout.toString() : '')),
        stderr: this.truncate(typeof err.stderr === 'string' ? err.stderr : (err.stderr ? err.stderr.toString() : '')),
        exitCode: err.code === 'ETIMEDOUT' || err.killed ? -2 : err.status ?? -1,
        error: err.message,
      };
    }
  }

  /** Interactive shell via spawn — returns a child process */
  spawn(command: string, args: string[], cwd?: string): ReturnType<typeof spawn> {
    const execCwd = cwd ? resolve(cwd) : this.config.allowedDirs[0];
    return spawn(command, args, { cwd: execCwd, stdio: ['pipe', 'pipe', 'pipe'] });
  }

  private truncate(output: string): string {
    if (output.length > this.config.maxOutputBytes) {
      return output.slice(0, this.config.maxOutputBytes) + '\n\n[Output truncated]';
    }
    return output;
  }
}

export function createBashTool(config?: BashToolConfig): BashTool {
  return new BashTool(config);
}
