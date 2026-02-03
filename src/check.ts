import {exec} from 'child_process';
import {promisify} from 'util';
import * as os from 'os';

const execAsync = promisify(exec);

export interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

export interface EnvironmentCheckResult {
  allPassed: boolean;
  checks: CheckResult[];
}

/**
 * Check if running on macOS
 */
export function checkMacOS(): CheckResult {
  const platform = os.platform();
  if (platform === 'darwin') {
    const release = os.release();
    return {
      name: 'macOS',
      status: 'pass',
      message: `Running on macOS (Darwin ${release})`,
    };
  }
  return {
    name: 'macOS',
    status: 'fail',
    message: `This tool requires macOS. Current platform: ${platform}`,
  };
}

/**
 * Check if iTerm2 is installed
 */
export async function checkITerm2(): Promise<CheckResult> {
  try {
    // Check if iTerm2 app exists
    await execAsync('test -d "/Applications/iTerm.app"');
    return {
      name: 'iTerm2',
      status: 'pass',
      message: 'iTerm2 is installed at /Applications/iTerm.app',
    };
  } catch {
    return {
      name: 'iTerm2',
      status: 'fail',
      message:
        'iTerm2 is not installed. Download from https://iterm2.com/ or install via: brew install --cask iterm2',
    };
  }
}

/**
 * Check if Claude Code CLI is installed
 */
export async function checkClaudeCode(): Promise<CheckResult> {
  try {
    const {stdout} = await execAsync('which claude');
    const path = stdout.trim();
    // Try to get version
    try {
      const {stdout: versionOut} = await execAsync('claude --version');
      const version = versionOut.trim();
      return {
        name: 'Claude Code CLI',
        status: 'pass',
        message: `Claude Code CLI found at ${path} (${version})`,
      };
    } catch {
      return {
        name: 'Claude Code CLI',
        status: 'pass',
        message: `Claude Code CLI found at ${path}`,
      };
    }
  } catch {
    return {
      name: 'Claude Code CLI',
      status: 'fail',
      message:
        'Claude Code CLI is not installed. Install from https://claude.ai/code',
    };
  }
}

/**
 * Check if automation permissions are granted for iTerm2
 */
export async function checkAutomationPermissions(): Promise<CheckResult> {
  try {
    // Try a simple AppleScript that requires iTerm2 automation permission
    await execAsync('osascript -e \'tell application "iTerm2" to get name\'');
    return {
      name: 'Automation Permissions',
      status: 'pass',
      message: 'Automation permissions for iTerm2 are granted',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not allowed') || errorMessage.includes('1743')) {
      return {
        name: 'Automation Permissions',
        status: 'fail',
        message:
          'Automation permissions not granted. Go to System Settings > Privacy & Security > Automation and enable iTerm2 for your terminal/app.',
      };
    }
    // iTerm2 might not be running, which is OK
    if (
      errorMessage.includes('not running') ||
      errorMessage.includes('(-600)')
    ) {
      return {
        name: 'Automation Permissions',
        status: 'warn',
        message:
          'Could not verify automation permissions (iTerm2 is not running). Permissions will be requested on first use.',
      };
    }
    return {
      name: 'Automation Permissions',
      status: 'warn',
      message: `Could not verify automation permissions: ${errorMessage}`,
    };
  }
}

/**
 * Check if Node.js version meets requirements
 */
export function checkNodeVersion(): CheckResult {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (major >= 18) {
    return {
      name: 'Node.js',
      status: 'pass',
      message: `Node.js ${nodeVersion} meets minimum requirement (>=18.0.0)`,
    };
  }
  return {
    name: 'Node.js',
    status: 'fail',
    message: `Node.js ${nodeVersion} is below minimum requirement (>=18.0.0)`,
  };
}

/**
 * Run all environment checks
 */
export async function runAllChecks(): Promise<EnvironmentCheckResult> {
  const checks: CheckResult[] = [];

  // Synchronous checks
  checks.push(checkMacOS());
  checks.push(checkNodeVersion());

  // Async checks
  checks.push(await checkITerm2());
  checks.push(await checkClaudeCode());
  checks.push(await checkAutomationPermissions());

  const allPassed = checks.every(
    c => c.status === 'pass' || c.status === 'warn',
  );

  return {allPassed, checks};
}

/**
 * Format check results for display
 */
export function formatCheckResults(result: EnvironmentCheckResult): string {
  const lines: string[] = ['Environment Check Results', '='.repeat(50), ''];

  for (const check of result.checks) {
    const icon =
      check.status === 'pass'
        ? '[OK]'
        : check.status === 'warn'
          ? '[!!]'
          : '[X]';
    lines.push(`${icon} ${check.name}`);
    lines.push(`    ${check.message}`);
    lines.push('');
  }

  lines.push('='.repeat(50));
  if (result.allPassed) {
    lines.push('All checks passed! Environment is ready.');
  } else {
    lines.push('Some checks failed. Please fix the issues above.');
  }

  return lines.join('\n');
}
