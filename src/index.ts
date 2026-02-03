#!/usr/bin/env node

import {Command} from 'commander';
import {startServer} from './server.js';
import {spawnClaudeCoder} from './spawn.js';
import {listItermWindows, formatWindowList} from './iterm.js';

const program = new Command();

program
  .name('claude-coder-mac-mcp')
  .description('Spawn Claude Code instances from Claude Desktop via MCP')
  .version('1.0.0');

program
  .command('mcp')
  .alias('serve')
  .description('Start the MCP server (for Claude Desktop)')
  .option(
    '--dangerously-skip-permissions',
    'Pass --dangerously-skip-permissions to spawned Claude instances',
  )
  .action(async (options: {dangerouslySkipPermissions?: boolean}) => {
    await startServer({
      dangerouslySkipPermissions: options.dangerouslySkipPermissions ?? false,
    });
  });

program
  .command('spawn')
  .description('Test spawning a Claude Code instance in iTerm2')
  .argument('<prompt>', 'The prompt/task to give to Claude Code')
  .option('-d, --directory <path>', 'Working directory', process.env.HOME)
  .option('-t, --title <title>', 'Window title', 'Claude Coder')
  .option(
    '--dangerously-skip-permissions',
    'Pass --dangerously-skip-permissions to the Claude instance',
  )
  .action(
    async (
      prompt: string,
      options: {
        directory: string;
        title: string;
        dangerouslySkipPermissions?: boolean;
      },
    ) => {
      const skipPerms = options.dangerouslySkipPermissions ?? false;
      const modeLabel = skipPerms
        ? 'with --dangerously-skip-permissions'
        : 'in normal mode';

      console.log(`Spawning Claude Code instance (${modeLabel})...`);

      const result = await spawnClaudeCoder({
        prompt,
        workingDirectory: options.directory,
        windowTitle: options.title,
        dangerouslySkipPermissions: skipPerms,
      });

      if (result.success) {
        console.log('Success!');
        console.log(`  Window title: ${result.windowTitle}`);
        console.log(`  Working directory: ${result.workingDirectory}`);
        console.log(`  Mode: ${modeLabel}`);
        console.log(`  Prompt: ${result.prompt}`);
      } else {
        console.error(`Failed: ${result.error}`);
        process.exit(1);
      }
    },
  );

program
  .command('list')
  .alias('ls')
  .description('List iTerm2 windows and sessions')
  .action(async () => {
    const windows = await listItermWindows();
    console.log(formatWindowList(windows));
  });

program.parse();
