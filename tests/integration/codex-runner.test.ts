import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CodexCompletionEvent, CodexOutputEvent } from '../../src/shared/sidekick-api';
import { CodexRunner } from '../../src/main/codex-runner';

const tempRoots: string[] = [];

const createFakeCodex = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-fake-codex-'));
  tempRoots.push(rootPath);
  const executablePath = path.join(rootPath, 'fake-codex');
  // The fake executable models the Codex CLI contract Sidekick depends on:
  // status commands, device login, stdin prompt input, and JSONL output.
  await writeFile(
    executablePath,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  console.log('codex-cli 0.130.0-test');
  process.exit(0);
}
if (args[0] === 'login' && args[1] === 'status') {
  console.log('Logged in using ChatGPT');
  process.exit(0);
}
if (args[0] === 'login' && args[1] === '--device-auth') {
  console.log('Open https://example.test/device and enter TEST-CODE');
  setInterval(() => {}, 1000);
  return;
}
if (args[0] === 'exec') {
  let input = '';
  process.stdin.on('data', (chunk) => {
    input += chunk.toString();
  });
  process.stdin.on('end', () => {
    if (!args.includes('--json')) {
      console.log('## Workspace Summary');
      console.log('');
      console.log('Arbeidsområdet handler om Sidekick.');
      console.log('');
      console.log('## Participants');
      console.log('');
      console.log('- Sidekick-teamet');
      console.log('');
      console.log('## Themes');
      console.log('');
      console.log('- Lokal kontekst');
      process.exit(0);
    }
    console.log(JSON.stringify({ type: 'argv', args }));
    console.log(JSON.stringify({ type: 'stdin', input }));
    process.exit(0);
  });
  return;
}
console.error('unexpected args ' + args.join(' '));
process.exit(2);
`,
    'utf8',
  );
  await chmod(executablePath, 0o755);

  return {
    executablePath,
    rootPath,
  };
};

describe('codex runner', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map(async (tempRoot) => {
        await import('node:fs/promises').then(({ rm }) =>
          rm(tempRoot, { force: true, recursive: true }),
        );
      }),
    );
  });

  it('reports status from a Codex-compatible executable', async () => {
    const fake = await createFakeCodex();
    const runner = new CodexRunner(fake.executablePath);

    await expect(runner.getStatus(fake.rootPath)).resolves.toMatchObject({
      state: 'ready',
      available: true,
      loggedIn: true,
      version: 'codex-cli 0.130.0-test',
    });
  });

  it('passes prompts over stdin and streams parsed output', async () => {
    const fake = await createFakeCodex();
    const runner = new CodexRunner(fake.executablePath);
    const output: CodexOutputEvent[] = [];
    const completion = new Promise<CodexCompletionEvent>((resolve) => {
      runner.on('completion', resolve);
    });
    runner.on('output', (event) => output.push(event));

    runner.startExec(fake.rootPath, 'summarize this folder', 'read-only');
    await expect(completion).resolves.toMatchObject({ state: 'completed', mode: 'read-only' });

    expect(output.map((event) => event.parsed)).toContainEqual({
      type: 'stdin',
      input: 'summarize this folder',
    });
    expect(output.map((event) => event.parsed)).toContainEqual({
      type: 'argv',
      args: [
        'exec',
        '--json',
        '--ephemeral',
        '--skip-git-repo-check',
        '--cd',
        fake.rootPath,
        '--sandbox',
        'read-only',
        '-',
      ],
    });
  });

  it('can run a non-streaming text response for internal workflows', async () => {
    const fake = await createFakeCodex();
    const runner = new CodexRunner(fake.executablePath);

    const result = await runner.runExecText(fake.rootPath, 'summarize this folder', 'read-only');

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('## Workspace Summary');
    expect(result.stdout).toContain('## Themes');
  });

  it('enforces one active run and supports cancellation', async () => {
    const fake = await createFakeCodex();
    const runner = new CodexRunner(fake.executablePath);
    const completion = new Promise<CodexCompletionEvent>((resolve) => {
      runner.on('completion', resolve);
    });

    const runId = runner.startLogin(fake.rootPath);
    expect(() => runner.startExec(fake.rootPath, 'second run', 'read-only')).toThrow(
      'A Codex run is already active.',
    );

    runner.cancel(runId);
    await expect(completion).resolves.toMatchObject({ state: 'canceled', mode: 'login' });
  });
});
