import { EventEmitter } from 'node:events';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
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

type ActiveRun = {
  process: ChildProcessWithoutNullStreams;
  mode: CodexRunMode | 'login';
  canceled: boolean;
};

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

export class CodexRunner extends EventEmitter {
  private readonly executable: string;

  private activeRun?: ActiveRun;

  constructor(executable = 'codex') {
    super();
    this.executable = executable;
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

  private runCommand(args: string[], cwd: string): Promise<ProcessResult> {
    return new Promise((resolve) => {
      const child = spawn(this.executable, args, {
        cwd,
        shell: false,
        windowsHide: true,
      });
      const stdout: Buffer[] = [];
      const stderr: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => stdout.push(chunk));
      child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk));

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
        message: 'Codex CLI was not found on PATH.',
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

    const child = spawn(this.executable, args, {
      cwd,
      detached: process.platform !== 'win32',
      shell: false,
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
