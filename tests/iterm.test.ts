import {describe, it, expect} from 'vitest';
import {parseWindowList, formatWindowList} from '../src/iterm.js';

describe('parseWindowList', () => {
  it('should parse empty output', () => {
    expect(parseWindowList('')).toEqual([]);
  });

  it('should parse single window with single session', () => {
    const output = `WINDOW:12345
SESSION:My Session|/dev/ttys001`;

    const result = parseWindowList(output);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('12345');
    expect(result[0].sessions).toHaveLength(1);
    expect(result[0].sessions[0].name).toBe('My Session');
    expect(result[0].sessions[0].tty).toBe('/dev/ttys001');
  });

  it('should parse multiple windows with multiple sessions', () => {
    const output = `WINDOW:111
SESSION:Session A|/dev/ttys001
SESSION:Session B|/dev/ttys002
WINDOW:222
SESSION:Session C|/dev/ttys003`;

    const result = parseWindowList(output);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('111');
    expect(result[0].sessions).toHaveLength(2);
    expect(result[1].id).toBe('222');
    expect(result[1].sessions).toHaveLength(1);
  });

  it('should handle session without tty', () => {
    const output = `WINDOW:123
SESSION:Test|`;

    const result = parseWindowList(output);

    expect(result[0].sessions[0].name).toBe('Test');
    expect(result[0].sessions[0].tty).toBe('');
  });

  it('should ignore empty lines', () => {
    const output = `WINDOW:123

SESSION:Test|/dev/ttys001

`;

    const result = parseWindowList(output);

    expect(result).toHaveLength(1);
    expect(result[0].sessions).toHaveLength(1);
  });
});

describe('formatWindowList', () => {
  it('should return message when no windows', () => {
    expect(formatWindowList([])).toBe('No iTerm2 windows found.');
  });

  it('should format single window', () => {
    const windows = [
      {
        id: '123',
        sessions: [{name: 'Session 1', tty: '/dev/ttys001'}],
      },
    ];

    const result = formatWindowList(windows);

    expect(result).toContain('Window: 123');
    expect(result).toContain('Session: Session 1 - /dev/ttys001');
  });

  it('should format multiple windows with indentation', () => {
    const windows = [
      {
        id: '111',
        sessions: [
          {name: 'A', tty: '/dev/ttys001'},
          {name: 'B', tty: '/dev/ttys002'},
        ],
      },
      {
        id: '222',
        sessions: [{name: 'C', tty: '/dev/ttys003'}],
      },
    ];

    const result = formatWindowList(windows);
    const lines = result.split('\n');

    expect(lines[0]).toBe('Window: 111');
    expect(lines[1]).toBe('  Session: A - /dev/ttys001');
    expect(lines[2]).toBe('  Session: B - /dev/ttys002');
    expect(lines[3]).toBe('Window: 222');
    expect(lines[4]).toBe('  Session: C - /dev/ttys003');
  });
});
