import {execAppleScript} from './iterm.js';

export interface SpawnOptions {
  prompt: string;
  workingDirectory?: string;
  windowTitle?: string;
  dangerouslySkipPermissions?: boolean;
}

export interface SpawnResult {
  success: boolean;
  windowTitle: string;
  workingDirectory: string;
  prompt: string;
  dangerouslySkipPermissions: boolean;
  error?: string;
}

/**
 * Escape a string for use in AppleScript
 */
export function escapeForAppleScript(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

/**
 * Escape a string for use in shell (inside the AppleScript command)
 */
export function escapeForShell(str: string): string {
  // Use single quotes and escape any single quotes in the string
  return `'${str.replace(/'/g, "'\"'\"'")}'`;
}

/**
 * Build the claude command string
 */
export function buildClaudeCommand(
  prompt: string,
  dangerouslySkipPermissions: boolean,
): string {
  const flags = dangerouslySkipPermissions
    ? '--dangerously-skip-permissions '
    : '';
  return `claude ${flags}${escapeForShell(prompt)}`;
}

/**
 * Build the full shell command (cd + claude)
 */
export function buildFullCommand(
  prompt: string,
  workingDirectory: string,
  dangerouslySkipPermissions: boolean,
): string {
  const claudeCommand = buildClaudeCommand(prompt, dangerouslySkipPermissions);
  return `cd ${escapeForShell(workingDirectory)} && ${claudeCommand}`;
}

/**
 * Build the AppleScript to spawn an iTerm2 window with a command
 */
export function buildSpawnAppleScript(
  command: string,
  windowTitle: string,
): string {
  return `
tell application "iTerm"
  activate
  set newWindow to (create window with default profile)
  tell current session of newWindow
    set name to "${escapeForAppleScript(windowTitle)}"
    write text "${escapeForAppleScript(command)}"
  end tell
end tell
`;
}

/**
 * Spawn a new Claude Code instance in iTerm2
 */
export async function spawnClaudeCoder(
  options: SpawnOptions,
): Promise<SpawnResult> {
  const windowTitle = options.windowTitle || 'Claude Coder';
  const workingDirectory = options.workingDirectory || process.env.HOME || '~';
  const dangerouslySkipPermissions =
    options.dangerouslySkipPermissions ?? false;

  const fullCommand = buildFullCommand(
    options.prompt,
    workingDirectory,
    dangerouslySkipPermissions,
  );
  const appleScript = buildSpawnAppleScript(fullCommand, windowTitle);

  try {
    await execAppleScript(appleScript);

    return {
      success: true,
      windowTitle,
      workingDirectory,
      prompt: options.prompt,
      dangerouslySkipPermissions,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      windowTitle,
      workingDirectory,
      prompt: options.prompt,
      dangerouslySkipPermissions,
      error: errorMessage,
    };
  }
}
