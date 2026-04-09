import { configCommand } from '../commands/config.js';
import { channelsCommand } from '../commands/channels.js';
import { providersCommand } from '../commands/providers.js';
import { pluginsCommand } from '../commands/plugins.js';
import { serverCommand } from '../commands/server.js';
import { versionCommand } from '../commands/version.js';
import { initCommand } from '../commands/init.js';
import { doctorCommand } from '../commands/doctor.js';
import { statusCommand } from '../commands/status.js';
import { sessionsCommand } from '../commands/sessions.js';
import { modelsCommand } from '../commands/models.js';
import { logger } from '../infra/logger.js';

export interface CliOptions {
  container?: string;
  profile?: string;
  verbose?: boolean;
  debug?: boolean;
}

export type CommandHandler = (args: string[], options: CliOptions) => Promise<void>;

export interface Command {
  name: string;
  description: string;
  options?: {
    name: string;
    type: string;
    description: string;
    default?: string | boolean;
  }[];
  handler: CommandHandler;
}

const commands: Command[] = [
  initCommand,
  configCommand,
  channelsCommand,
  providersCommand,
  pluginsCommand,
  serverCommand,
  versionCommand,
  doctorCommand,
  statusCommand,
  sessionsCommand,
  modelsCommand,
];

export async function runCli(args: string[] = process.argv.slice(2)): Promise<void> {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printHelp();
    return;
  }

  const commandName = args[0];
  const commandArgs = args.slice(1);

  if (commandName === '--help' || commandName === '-h') {
    printHelp();
    return;
  }

  const command = commands.find(c => c.name === commandName);

  if (!command) {
    logger.error(`Unknown command: ${commandName}`);
    printHelp();
    process.exit(1);
  }

  // Handle --help for subcommands
  if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
    printCommandHelp(command);
    return;
  }

  // Parse options from command args
  const parsedOptions: Record<string, string | boolean> = {};
  const positionalArgs: string[] = [];

  for (let i = 0; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      // Find the option definition
      const opt = command.options?.find(o => o.name === key);
      if (opt?.type === 'boolean') {
        parsedOptions[key] = true;
      } else if (i + 1 < commandArgs.length && !commandArgs[i + 1].startsWith('--')) {
        parsedOptions[key] = commandArgs[i + 1];
        i++; // skip next (value)
      } else {
        parsedOptions[key] = true;
      }
    } else {
      positionalArgs.push(arg);
    }
  }

  try {
    await command.handler(positionalArgs, parsedOptions);
  } catch (error: any) {
    logger.error(`Command failed: ${error}`);
    process.exit(1);
  }
}

function printHelp(): void {
  console.log(`
agent-gateway - Universal AI Agent Gateway

Usage: agent-gateway <command> [options]

Commands:
${commands.map(c => `  ${c.name.padEnd(12)} ${c.description}`).join('\n')}

Options:
  --help         Show this help message

Examples:
  agent-gateway init                          Create default config
  agent-gateway config --list                 Show current config
  agent-gateway channels --available          See supported platforms
  agent-gateway providers --available         See supported AI models
  agent-gateway server                        Start the gateway

For more info: agent-gateway <command> --help
  `.trim());
}

function printCommandHelp(command: Command): void {
  console.log(`
${command.name} - ${command.description}

Usage: agent-gateway ${command.name} [options]
${command.options ? `
Options:
${command.options.map(o => `  --${o.name.padEnd(14)} ${o.description}${o.default ? ` (default: ${o.default})` : ''}`).join('\n')}` : ''}
  `.trim());
}

export async function runMain(): Promise<void> {
  await runCli(process.argv.slice(2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMain();
}