import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCodexExecArgs,
  buildCodexLoginArgs,
  parseCodexJsonLine,
  resolveCodexExecutable,
} from '../../src/main/codex-runner';

const tempRoots: string[] = [];

const createTempDirectory = async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sidekick-codex-path-'));
  tempRoots.push(tempRoot);

  return tempRoot;
};

describe('codex runner helpers', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map(async (tempRoot) => {
        await import('node:fs/promises').then(({ rm }) =>
          rm(tempRoot, { force: true, recursive: true }),
        );
      }),
    );
  });

  it('builds read-only exec args without placing the prompt in argv', () => {
    const args = buildCodexExecArgs('/tmp/project', 'read-only');

    expect(args).toEqual([
      'exec',
      '--json',
      '--ephemeral',
      '--skip-git-repo-check',
      '--cd',
      '/tmp/project',
      '--sandbox',
      'read-only',
      '-',
    ]);
    expect(args).not.toContain('summarize this folder');
  });

  it('builds workspace-write exec args', () => {
    const args = buildCodexExecArgs('/tmp/project', 'workspace-write');

    expect(args).toContain('workspace-write');
    expect(args).not.toContain('danger-full-access');
    expect(args).not.toContain('--dangerously-bypass-approvals-and-sandbox');
  });

  it('builds device-auth login args', () => {
    expect(buildCodexLoginArgs()).toEqual(['login', '--device-auth']);
  });

  it('parses JSONL output and tolerates raw text', () => {
    expect(parseCodexJsonLine('{"type":"message","text":"hello"}')).toEqual({
      type: 'message',
      text: 'hello',
    });
    expect(parseCodexJsonLine('plain output')).toBeUndefined();
    expect(parseCodexJsonLine('{not-json')).toBeUndefined();
  });

  it('uses SIDEKICK_CODEX_PATH when configured', () => {
    const executable = resolveCodexExecutable(
      'codex',
      {
        SIDEKICK_CODEX_PATH: 'C:\\Tools\\codex.cmd',
      },
      'win32',
    );

    expect(executable).toEqual({
      command: 'C:\\Tools\\codex.cmd',
      shell: true,
    });
  });

  it('finds a Windows npm codex command shim outside PATH', async () => {
    const appData = await createTempDirectory();
    const npmBin = path.join(appData, 'npm');
    const codexShim = path.join(npmBin, 'codex.cmd');
    await mkdir(npmBin);
    await writeFile(codexShim, '@echo off\r\n', 'utf8');

    const executable = resolveCodexExecutable(
      'codex',
      {
        APPDATA: appData,
        PATH: '',
      },
      'win32',
    );

    expect(executable).toEqual({
      command: codexShim,
      shell: true,
    });
  });

  it('finds codex on PATH without enabling shell on non-Windows platforms', async () => {
    const binDirectory = await createTempDirectory();
    const codexPath = path.join(binDirectory, 'codex');
    await writeFile(codexPath, '#!/bin/sh\n', 'utf8');

    const executable = resolveCodexExecutable(
      'codex',
      {
        PATH: binDirectory,
      },
      'linux',
    );

    expect(executable).toEqual({
      command: codexPath,
      shell: false,
    });
  });
});
