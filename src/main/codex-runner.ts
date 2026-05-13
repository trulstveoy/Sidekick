import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  CodexCompletionEvent,
  CodexOutputEvent,
  CodexRunMode,
  CodexStatus,
} from '../shared/sidekick-api';

type ProcessResult = {
  code: number | null;
  signal: string | null;
  stdout: string;
  stderr: string;
  error?: Error;
};

type CodexExecutable = {
  command: string;
  shell: boolean;
};

type ActiveRun = {
  process: ChildProcessWithoutNullStreams;
  mode: CodexRunMode | 'login';
  canceled: boolean;
};

type CodexEnvironment = NodeJS.ProcessEnv;

export type CodexRunnerEvents = {
  output: [CodexOutputEvent];
  completion: [CodexCompletionEvent];
};

export const buildCodexExecArgs = (rootPath: string, mode: CodexRunMode) => [
  'exec',
  '--json',
  '--ephemeral',
  '--skip-git-repo-check',
  '--cd',
  rootPath,
  '--sandbox',
  mode,
  // The prompt is written to stdin so user text is not exposed through process
  // arguments or shell history.
  '-',
];

export const buildCodexLoginArgs = () => ['login', '--device-auth'];

export const parseCodexJsonLine = (line: string): unknown | undefined => {
  const trimmed = line.trim();

  if (!trimmed.startsWith('{')) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return undefined;
  }
};

const hasPathSeparator = (value: string) => /[\\/]/.test(value);

const isWindowsCommandShim = (filePath: string, platform: NodeJS.Platform) =>
  platform === 'win32' && /\.(cmd|bat)$/i.test(filePath);

const executableForPath = (filePath: string, platform: NodeJS.Platform): CodexExecutable => ({
  command: filePath,
  // npm-installed Windows CLIs are often .cmd shims, which require a shell to
  // resolve correctly. Native executables keep shell=false.
  shell: isWindowsCommandShim(filePath, platform),
});

const pathEntries = (environment: CodexEnvironment, platform: NodeJS.Platform) => {
  const delimiter = platform === 'win32' ? ';' : ':';

  return (environment.PATH ?? environment.Path ?? '')
    .split(delimiter)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const windowsCandidateDirectories = (environment: CodexEnvironment) => [
  environment.APPDATA ? path.join(environment.APPDATA, 'npm') : undefined,
  environment.LOCALAPPDATA ? path.join(environment.LOCALAPPDATA, 'Programs', 'nodejs') : undefined,
  environment.ProgramFiles ? path.join(environment.ProgramFiles, 'nodejs') : undefined,
  environment['ProgramFiles(x86)'] ? path.join(environment['ProgramFiles(x86)'], 'nodejs') : undefined,
];

const unixCandidateDirectories = (environment: CodexEnvironment) => {
  const homeDirectory = environment.HOME || os.homedir();

  return [
    homeDirectory ? path.join(homeDirectory, '.npm-global', 'bin') : undefined,
    homeDirectory ? path.join(homeDirectory, '.local', 'bin') : undefined,
    '/opt/homebrew/bin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
  ];
};

const uniqueExistingDirectories = (directories: Array<string | undefined>) => [
  ...new Set(
    directories
      .filter((directory): directory is string => Boolean(directory))
      .filter((directory) => existsSync(directory)),
  ),
];

const candidateFileNames = (executable: string, platform: NodeJS.Platform) => {
  if (platform !== 'win32' || path.extname(executable)) {
    return [executable];
  }

  const pathExts = ['.exe', '.cmd', '.bat', '.com'];

  return [...new Set([executable, ...pathExts.map((extension) => `${executable}${extension}`)])];
};

export const resolveCodexExecutable = (
  executable = 'codex',
  environment: CodexEnvironment = process.env,
  platform: NodeJS.Platform = process.platform,
): CodexExecutable => {
  const configuredExecutable = environment.SIDEKICK_CODEX_PATH?.trim();
  const requestedExecutable = configuredExecutable || executable;

  if (hasPathSeparator(requestedExecutable) || path.isAbsolute(requestedExecutable)) {
    return executableForPath(requestedExecutable, platform);
  }

  const additionalDirectories =
    platform === 'win32'
      ? windowsCandidateDirectories(environment)
      : unixCandidateDirectories(environment);
  const candidateDirectories = uniqueExistingDirectories([
    ...pathEntries(environment, platform),
    ...additionalDirectories,
  ]);

  // Electron apps can launch without the same PATH as a user's terminal, so we
  // also check common Node/npm install locations before falling back to PATH
  // resolution.
  for (const directory of candidateDirectories) {
    for (const fileName of candidateFileNames(requestedExecutable, platform)) {
      const candidatePath = path.join(directory, fileName);

      if (existsSync(candidatePath)) {
        return executableForPath(candidatePath, platform);
      }
    }
  }

  return {
    command: requestedExecutable,
    shell: platform === 'win32',
  };
};

export class CodexRunner extends EventEmitter {
  private executable: CodexExecutable;

  private readonly executableName: string;

  private readonly platform: NodeJS.Platform;

  private activeRun?: ActiveRun;

  constructor(
    executable = 'codex',
    environment: CodexEnvironment = process.env,
    platform: NodeJS.Platform = process.platform,
  ) {
    super();
    this.executableName = executable;
    this.platform = platform;
    this.executable = resolveCodexExecutable(executable, environment, platform);
  }

  setEnvironment(environment: CodexEnvironment) {
    if (this.activeRun) {
      throw new Error('Codex settings cannot be changed while a Codex run is active.');
    }

    this.executable = resolveCodexExecutable(this.executableName, environment, this.platform);
  }

  override on<EventName extends keyof CodexRunnerEvents>(
    eventName: EventName,
    listener: (...args: CodexRunnerEvents[EventName]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  override off<EventName extends keyof CodexRunnerEvents>(
    eventName: EventName,
    listener: (...args: CodexRunnerEvents[EventName]) => void,
  ): this {
    return super.off(eventName, listener);
  }

  private emitOutput(event: CodexOutputEvent) {
    this.emit('output', event);
  }

  private emitCompletion(event: CodexCompletionEvent) {
    this.emit('completion', event);
  }

  private runCommand(args: string[], cwd: string, stdinText?: string): Promise<ProcessResult> {
    return new Promise((resolve) => {
      const child = spawn(this.executable.command, args, {
        cwd,
        shell: this.executable.shell,
        windowsHide: true,
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));
      child.stdin.on('error', () => {
        // Startup failures can close stdin before the prompt is written. The
        // process error/close handlers below report the real failure.
      });

      if (stdinText !== undefined) {
        child.stdin.end(stdinText);
      }

      child.on('error', (error) => {
        resolve({
          code: null,
          signal: null,
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
          error,
        });
      });

      child.on('close', (code, signal) => {
        resolve({
          code,
          signal,
          stdout: Buffer.concat(stdout).toString('utf8'),
          stderr: Buffer.concat(stderr).toString('utf8'),
        });
      });
    });
  }

  async getStatus(rootPath: string): Promise<CodexStatus> {
    const versionResult = await this.runCommand(['--version'], rootPath);

    if (versionResult.error) {
      return {
        state: 'unavailable',
        available: false,
        loggedIn: false,
        message:
          'Codex CLI was not found. Install Codex CLI or set SIDEKICK_CODEX_PATH to the full Codex executable path.',
      };
    }

    if (versionResult.code !== 0) {
      return {
        state: 'unavailable',
        available: false,
        loggedIn: false,
        message: (versionResult.stderr || versionResult.stdout || 'Codex CLI is unavailable.').trim(),
      };
    }

    const loginResult = await this.runCommand(['login', 'status'], rootPath);
    const version = versionResult.stdout.trim() || undefined;

    if (loginResult.code === 0) {
      return {
        state: 'ready',
        available: true,
        loggedIn: true,
        version,
        message: (loginResult.stdout || loginResult.stderr).trim() || undefined,
      };
    }

    return {
      state: 'logged-out',
      available: true,
      loggedIn: false,
      version,
      message: (loginResult.stderr || loginResult.stdout || 'Codex login is required.').trim(),
    };
  }

  startLogin(rootPath: string) {
    return this.startProcess({
      args: buildCodexLoginArgs(),
      cwd: rootPath,
      mode: 'login',
    });
  }

  startExec(rootPath: string, prompt: string, mode: CodexRunMode) {
    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      throw new Error('Enter a Codex prompt before running.');
    }

    const runId = this.startProcess({
      args: buildCodexExecArgs(rootPath, mode),
      cwd: rootPath,
      mode,
    });
    const process = this.activeRun?.process;
    setImmediate(() => {
      process?.stdin.end(trimmedPrompt);
    });

    return runId;
  }

  async runExecText(rootPath: string, prompt: string, mode: CodexRunMode) {
    if (this.activeRun) {
      throw new Error('A Codex run is already active.');
    }

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      throw new Error('Enter a Codex prompt before running.');
    }

    const result = await this.runCommand(buildCodexExecArgs(rootPath, mode), rootPath, trimmedPrompt);

    if (result.error) {
      throw result.error;
    }

    if (result.code !== 0) {
      throw new Error((result.stderr || result.stdout || 'Codex returned an error.').trim());
    }

    return result.stdout;
  }

  cancel(runId: string) {
    if (!this.activeRun) {
      return;
    }

    if (this.activeRun.process.pid?.toString() !== runId) {
      throw new Error('The requested Codex run is no longer active.');
    }

    this.activeRun.canceled = true;
    this.killProcessTree(this.activeRun.process);
  }

  private startProcess({
    args,
    cwd,
    mode,
  }: {
    args: string[];
    cwd: string;
    mode: CodexRunMode | 'login';
  }) {
    if (this.activeRun) {
      throw new Error('A Codex run is already active.');
    }

    const child = spawn(this.executable.command, args, {
      cwd,
      // POSIX runs are detached into their own process group so cancellation can
      // terminate Codex and children it started. Windows uses taskkill instead.
      detached: process.platform !== 'win32',
      shell: this.executable.shell,
      windowsHide: true,
    });

    if (!child.pid) {
      child.once('error', () => {
        // The caller receives the startup failure synchronously below.
      });
      throw new Error('Unable to start Codex.');
    }

    const runId = child.pid.toString();
    this.activeRun = {
      process: child,
      mode,
      canceled: false,
    };

    child.stdout.on('data', (chunk: Buffer) => {
      setImmediate(() => {
        this.emitChunk(runId, 'stdout', chunk);
      });
    });

    child.stderr.on('data', (chunk: Buffer) => {
      setImmediate(() => {
        this.emitChunk(runId, 'stderr', chunk);
      });
    });

    child.on('error', (error) => {
      setImmediate(() => {
        this.completeRun(runId, null, null, error.message);
      });
    });

    child.on('close', (code, signal) => {
      setImmediate(() => {
        this.completeRun(runId, code, signal);
      });
    });

    return runId;
  }

  private emitChunk(runId: string, stream: 'stdout' | 'stderr', chunk: Buffer) {
    const text = chunk.toString('utf8');
    const lines = text.split(/\r?\n/).filter((line) => line.length > 0);

    // Codex emits JSONL on stdout, but stderr and startup failures can still be
    // plain text. Preserve both the raw text and parsed JSON when available.
    for (const line of lines.length > 0 ? lines : [text]) {
      this.emitOutput({
        runId,
        stream,
        text: line,
        parsed: stream === 'stdout' ? parseCodexJsonLine(line) : undefined,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private completeRun(runId: string, code: number | null, signal: string | null, message?: string) {
    if (!this.activeRun || this.activeRun.process.pid?.toString() !== runId) {
      return;
    }

    const { canceled, mode } = this.activeRun;
    this.activeRun = undefined;
    const state = canceled ? 'canceled' : code === 0 ? 'completed' : 'failed';

    this.emitCompletion({
      runId,
      mode,
      state,
      exitCode: code,
      signal,
      message,
      createdAt: new Date().toISOString(),
    });
  }

  private killProcessTree(child: ChildProcessWithoutNullStreams) {
    if (!child.pid) {
      return;
    }

    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', child.pid.toString(), '/t', '/f'], {
        shell: false,
        windowsHide: true,
      });
      return;
    }

    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        // The process may already have exited.
      }
    }
  }
}
