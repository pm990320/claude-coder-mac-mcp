import {describe, it, expect} from 'vitest';
import {
  escapeForAppleScript,
  escapeForShell,
  buildClaudeCommand,
  buildFullCommand,
  buildSpawnAppleScript,
} from '../src/spawn.js';

describe('escapeForAppleScript', () => {
  it('should escape backslashes', () => {
    expect(escapeForAppleScript('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape double quotes', () => {
    expect(escapeForAppleScript('say "hello"')).toBe('say \\"hello\\"');
  });

  it('should escape newlines', () => {
    expect(escapeForAppleScript('line1\nline2')).toBe('line1\\nline2');
  });

  it('should handle combined escapes', () => {
    expect(escapeForAppleScript('path\\to\n"file"')).toBe(
      'path\\\\to\\n\\"file\\"',
    );
  });

  it('should return unchanged string when no escaping needed', () => {
    expect(escapeForAppleScript('simple text')).toBe('simple text');
  });
});

describe('escapeForShell', () => {
  it('should wrap string in single quotes', () => {
    expect(escapeForShell('hello')).toBe("'hello'");
  });

  it('should escape single quotes within string', () => {
    expect(escapeForShell("it's working")).toBe("'it'\"'\"'s working'");
  });

  it('should handle multiple single quotes', () => {
    expect(escapeForShell("don't won't can't")).toBe(
      "'don'\"'\"'t won'\"'\"'t can'\"'\"'t'",
    );
  });

  it('should handle empty string', () => {
    expect(escapeForShell('')).toBe("''");
  });

  it('should preserve special characters inside quotes', () => {
    expect(escapeForShell('$HOME && rm -rf /')).toBe("'$HOME && rm -rf /'");
  });
});

describe('buildClaudeCommand', () => {
  it('should build command without dangerously-skip-permissions by default', () => {
    const cmd = buildClaudeCommand('test prompt', false);
    expect(cmd).toBe("claude 'test prompt'");
    expect(cmd).not.toContain('--dangerously-skip-permissions');
  });

  it('should include dangerously-skip-permissions when enabled', () => {
    const cmd = buildClaudeCommand('test prompt', true);
    expect(cmd).toBe("claude --dangerously-skip-permissions 'test prompt'");
  });

  it('should properly escape prompt with special characters', () => {
    const cmd = buildClaudeCommand("it's a test", true);
    expect(cmd).toContain("'it'\"'\"'s a test'");
  });
});

describe('buildFullCommand', () => {
  it('should combine cd and claude command', () => {
    const cmd = buildFullCommand('test', '/home/user', true);
    expect(cmd).toContain("cd '/home/user'");
    expect(cmd).toContain('&&');
    expect(cmd).toContain('claude --dangerously-skip-permissions');
  });

  it('should escape directory paths with spaces', () => {
    const cmd = buildFullCommand('test', '/path/with spaces', false);
    expect(cmd).toContain("cd '/path/with spaces'");
  });
});

describe('buildSpawnAppleScript', () => {
  it('should create valid AppleScript structure', () => {
    const script = buildSpawnAppleScript('echo hello', 'Test Window');

    expect(script).toContain('tell application "iTerm"');
    expect(script).toContain('activate');
    expect(script).toContain('create window with default profile');
    expect(script).toContain('set name to "Test Window"');
    expect(script).toContain('write text "echo hello"');
    expect(script).toContain('end tell');
  });

  it('should escape special characters in window title', () => {
    const script = buildSpawnAppleScript('cmd', 'Title with "quotes"');
    expect(script).toContain('set name to "Title with \\"quotes\\""');
  });

  it('should escape special characters in command', () => {
    const script = buildSpawnAppleScript('echo "hello"', 'Title');
    expect(script).toContain('write text "echo \\"hello\\""');
  });
});
