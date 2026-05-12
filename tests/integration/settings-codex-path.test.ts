import { chmod, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { AppSettingsStore } from '../../src/main/settings-store';
import { CodexRunner } from '../../src/main/codex-runner';

const tempRoots: string[] = [];

const createFakeCodex = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-settings-codex-'));
  tempRoots.push(rootPath);
  const executablePath = path.join(rootPath, 'codex');
  await writeFile(
    executablePath,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  console.log('codex-cli settings-test');
  process.exit(0);
}
if (args[0] === 'login' && args[1] === 'status') {
  console.log('Logged in using ChatGPT');
  process.exit(0);
}
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

describe('settings-backed Codex path', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map(async (tempRoot) => {
        await import('node:fs/promises').then(({ rm }) =>
          rm(tempRoot, { force: true, recursive: true }),
        );
      }),
    );
  });

  it('uses a saved sidekick_codex_path for Codex status', async () => {
    const fake = await createFakeCodex();
    const store = new AppSettingsStore(fake.rootPath);
    await store.updateCodexPath(fake.executablePath, 'linux');
    const snapshot = await store.snapshot({});
    const runner = new CodexRunner('codex', {
      SIDEKICK_CODEX_PATH: snapshot.effectiveCodexPath ?? undefined,
    });

    await expect(runner.getStatus(fake.rootPath)).resolves.toMatchObject({
      state: 'ready',
      available: true,
      loggedIn: true,
      version: 'codex-cli settings-test',
    });
  });
});
