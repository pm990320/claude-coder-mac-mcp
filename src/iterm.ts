import {exec} from 'child_process';
import {promisify} from 'util';

const execAsync = promisify(exec);

export interface ItermWindow {
  id: string;
  sessions: ItermSession[];
}

export interface ItermSession {
  name: string;
  tty: string;
}

/**
 * Execute an AppleScript and return the result
 */
export async function execAppleScript(script: string): Promise<string> {
  // Escape single quotes for shell
  const escapedScript = script.replace(/'/g, "'\"'\"'");
  const {stdout} = await execAsync(`osascript -e '${escapedScript}'`);
  return stdout;
}

/**
 * List all iTerm2 windows and their sessions
 */
export async function listItermWindows(): Promise<ItermWindow[]> {
  const appleScript = `
tell application "iTerm"
  set output to ""
  repeat with w in windows
    set output to output & "WINDOW:" & (id of w) & linefeed
    repeat with t in tabs of w
      repeat with s in sessions of t
        set output to output & "SESSION:" & (name of s) & "|" & (tty of s) & linefeed
      end repeat
    end repeat
  end repeat
  return output
end tell
`;

  try {
    const stdout = await execAppleScript(appleScript);
    return parseWindowList(stdout);
  } catch {
    return [];
  }
}

/**
 * Parse the window list output from AppleScript
 */
export function parseWindowList(output: string): ItermWindow[] {
  const windows: ItermWindow[] = [];
  let currentWindow: ItermWindow | null = null;

  const lines = output.split('\n').filter(line => line.trim());

  for (const line of lines) {
    if (line.startsWith('WINDOW:')) {
      if (currentWindow) {
        windows.push(currentWindow);
      }
      currentWindow = {
        id: line.substring(7),
        sessions: [],
      };
    } else if (line.startsWith('SESSION:') && currentWindow) {
      const parts = line.substring(8).split('|');
      currentWindow.sessions.push({
        name: parts[0] || '',
        tty: parts[1] || '',
      });
    }
  }

  if (currentWindow) {
    windows.push(currentWindow);
  }

  return windows;
}

/**
 * Format window list for display
 */
export function formatWindowList(windows: ItermWindow[]): string {
  if (windows.length === 0) {
    return 'No iTerm2 windows found.';
  }

  const lines: string[] = [];
  for (const window of windows) {
    lines.push(`Window: ${window.id}`);
    for (const session of window.sessions) {
      lines.push(`  Session: ${session.name} - ${session.tty}`);
    }
  }
  return lines.join('\n');
}
