# claude-coder-mac-mcp

An MCP server that allows Claude Desktop to spawn new Claude Code instances in iTerm2 windows.

## Features

- **spawn_claude_coder**: Spawn a new Claude Code instance with a given prompt
  - Opens a new iTerm2 window
  - Optionally runs with `--dangerously-skip-permissions` (must be enabled on server)
  - Passes your prompt directly to Claude
  - The terminal becomes fully interactive

- **list_iterm_windows**: List all iTerm2 windows and sessions

## Requirements

- macOS
- [iTerm2](https://iterm2.com/) installed
- [Claude Code CLI](https://claude.ai/code) installed
- Automation permissions granted to the MCP host app

## Installation

### Via npm (recommended)

```bash
npm install -g claude-coder-mac-mcp
```

### From source

```bash
git clone https://github.com/pm990320/claude-coder-mac-mcp.git
cd claude-coder-mac-mcp
npm install
npm run build
```

### Verify installation

```bash
claude-coder-mac-mcp check
```

This runs environment checks to verify macOS, iTerm2, Claude Code CLI, and automation permissions are all configured correctly.

## CLI Usage

The CLI has multiple commands:

```bash
# Show help
claude-coder-mac-mcp --help

# Start the MCP server (used by Claude Desktop)
# By default, spawned Claude instances run in normal mode (user must approve actions)
claude-coder-mac-mcp mcp

# Start the MCP server with --dangerously-skip-permissions enabled
# WARNING: This allows spawned Claude instances to run without user approval
claude-coder-mac-mcp mcp --dangerously-skip-permissions

# Test spawning a Claude Code instance directly (normal mode)
claude-coder-mac-mcp spawn "Help me write a REST API"
claude-coder-mac-mcp spawn "Fix the tests" -d ~/myproject -t "Test Fixer"

# Test spawning with --dangerously-skip-permissions
claude-coder-mac-mcp spawn "Fix the tests" --dangerously-skip-permissions

# List current iTerm2 windows
claude-coder-mac-mcp list

# Check environment is configured correctly
claude-coder-mac-mcp check
```

## Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

**Normal mode** (user must approve Claude Code actions):
```json
{
  "mcpServers": {
    "claude-coder-mac": {
      "command": "node",
      "args": ["/path/to/claude-coder-mac-mcp/dist/index.js", "mcp"]
    }
  }
}
```

**With --dangerously-skip-permissions** (Claude Code runs autonomously):
```json
{
  "mcpServers": {
    "claude-coder-mac": {
      "command": "node",
      "args": ["/path/to/claude-coder-mac-mcp/dist/index.js", "mcp", "--dangerously-skip-permissions"]
    }
  }
}
```

## Usage with Claude Desktop

Once configured, you can ask Claude Desktop to spawn new Claude Code instances:

> "Start a new Claude coder to work on my project at ~/myproject with the task: implement user authentication"

Claude will use the `spawn_claude_coder` tool to open iTerm2 with a new Claude Code session.

## Permissions

On first use, macOS will ask you to grant automation permissions. Go to:

**System Settings > Privacy & Security > Automation**

And ensure the app running the MCP server (e.g., Claude Desktop) has permission to control iTerm2.

## MCP Tool Parameters

### spawn_claude_coder

| Parameter | Required | Description |
|-----------|----------|-------------|
| `prompt` | Yes | The task/prompt to give to Claude Code |
| `workingDirectory` | No | Directory to run Claude Code in (defaults to ~) |
| `windowTitle` | No | Custom title for the iTerm2 window |

Note: Whether `--dangerously-skip-permissions` is passed to spawned Claude instances is controlled by the server startup flag, not by tool parameters.

### list_iterm_windows

No parameters. Lists all open iTerm2 windows and their sessions.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Fix lint issues
npm run fix

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── index.ts    # CLI entrypoint (uses commander)
├── server.ts   # MCP server setup and tool registration
├── spawn.ts    # Core spawn functionality
├── iterm.ts    # iTerm2 AppleScript utilities
└── check.ts    # Environment verification checks

tests/
├── spawn.test.ts   # Unit tests for spawn functions
└── iterm.test.ts   # Unit tests for iTerm utilities
```

The modules are separated for testability - `spawn.ts` and `iterm.ts` contain pure functions that can be unit tested independently.

## License

MIT
