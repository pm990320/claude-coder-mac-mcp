import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {z} from 'zod';
import {spawnClaudeCoder} from './spawn.js';
import {listItermWindows, formatWindowList} from './iterm.js';

export interface ServerOptions {
  dangerouslySkipPermissions: boolean;
}

/**
 * Create and configure the MCP server
 */
export function createServer(options: ServerOptions): McpServer {
  const server = new McpServer({
    name: 'claude-coder-mac-mcp',
    version: '1.0.0',
  });

  registerTools(server, options);

  return server;
}

/**
 * Register all MCP tools on the server
 */
export function registerTools(server: McpServer, options: ServerOptions): void {
  const {dangerouslySkipPermissions} = options;

  const permissionMode = dangerouslySkipPermissions
    ? 'AUTONOMOUS MODE (--dangerously-skip-permissions): Claude will act without user approval. Be specific to prevent unintended actions.'
    : 'INTERACTIVE MODE: User must approve each action in the spawned terminal.';

  const toolDescription = `Spawn a new Claude Code instance in an iTerm2 window to work on a task.

${permissionMode}

PROMPT BEST PRACTICES:
- Be specific: "Run npm test, fix any failing tests" not "fix tests"
- Include context Claude can't see: "This is a Next.js app using Prisma and PostgreSQL"
- Set success criteria: "Done when all tests pass and npm run build succeeds"
- Mention key files: "The API routes are in src/app/api/"
- One focused task works better than multiple vague ones

EXAMPLE PROMPT:
"In this TypeScript Express project, add a new GET /api/health endpoint that returns {status: 'ok', timestamp: Date.now()}. Follow the pattern in src/routes/users.ts. Run npm test when done."

ALWAYS specify workingDirectory so Claude starts in the correct project folder. If you do not know the correct working directory, specify as the first instruction in your prompt that claude should find the project and cd into its directory first.`;

  server.registerTool(
    'spawn_claude_coder',
    {
      title: 'Spawn Claude Coder',
      description: toolDescription,
      inputSchema: {
        prompt: z
          .string()
          .describe('The prompt/task to give to the new Claude Code instance'),
        workingDirectory: z
          .string()
          .optional()
          .describe(
            'The working directory for the Claude Code instance (defaults to home directory)',
          ),
        windowTitle: z
          .string()
          .optional()
          .describe(
            "Custom title for the iTerm2 window (defaults to 'Claude Coder')",
          ),
      },
      annotations: {
        title: 'Spawn Claude Coder',
        readOnlyHint: false,
        destructiveHint: dangerouslySkipPermissions,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({prompt, workingDirectory, windowTitle}) => {
      const result = await spawnClaudeCoder({
        prompt,
        workingDirectory,
        windowTitle,
        dangerouslySkipPermissions,
      });

      if (result.success) {
        const permissionStatus = result.dangerouslySkipPermissions
          ? 'with --dangerously-skip-permissions'
          : 'in normal mode';

        return {
          content: [
            {
              type: 'text' as const,
              text: `Successfully spawned Claude Code in iTerm2 (${permissionStatus})!\n\nWindow title: ${result.windowTitle}\nWorking directory: ${result.workingDirectory}\nPrompt: ${result.prompt}\n\nThe Claude Code instance is now running interactively in iTerm2.`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to spawn Claude Code: ${result.error}\n\nMake sure iTerm2 is installed and you have granted automation permissions in System Settings > Privacy & Security > Automation.`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    'list_iterm_windows',
    {
      title: 'List iTerm2 Windows',
      description:
        'List all iTerm2 windows and their sessions (useful to see running Claude instances)',
      annotations: {
        title: 'List iTerm2 Windows',
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async () => {
      try {
        const windows = await listItermWindows();
        return {
          content: [
            {
              type: 'text' as const,
              text: formatWindowList(windows),
            },
          ],
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text' as const,
              text: `Failed to list iTerm windows: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    },
  );
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(options: ServerOptions): Promise<void> {
  const server = createServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  const modeLabel = options.dangerouslySkipPermissions
    ? 'with --dangerously-skip-permissions'
    : 'in normal mode';
  console.error(`Claude Coder Mac MCP server running on stdio (${modeLabel})`);
}
