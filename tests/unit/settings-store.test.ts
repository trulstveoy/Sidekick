import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  AppSettingsStore,
  DEFAULT_APP_SETTINGS,
  validateCodexPath,
} from '../../src/main/settings-store';

const tempRoots: string[] = [];

const createTempRoot = async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sidekick-settings-'));
  tempRoots.push(tempRoot);

  return tempRoot;
};

describe('app settings store', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map(async (tempRoot) => {
        await import('node:fs/promises').then(({ rm }) =>
          rm(tempRoot, { force: true, recursive: true }),
        );
      }),
    );
  });

  it('uses defaults when no settings file exists', async () => {
    const store = new AppSettingsStore(await createTempRoot());

    await expect(store.snapshot({})).resolves.toEqual({
      settings: DEFAULT_APP_SETTINGS,
      codexPathSource: 'automatic',
      effectiveCodexPath: null,
      warning: undefined,
    });
  });

  it('persists sidekick_codex_path and reports saved source', async () => {
    const tempRoot = await createTempRoot();
    const codexPath = path.join(tempRoot, 'codex');
    await writeFile(codexPath, '#!/bin/sh\n', 'utf8');
    const store = new AppSettingsStore(tempRoot);

    await store.updateCodexPath(codexPath, 'linux');

    await expect(store.snapshot({})).resolves.toMatchObject({
      settings: {
        sidekick_codex_path: codexPath,
      },
      codexPathSource: 'saved',
      effectiveCodexPath: codexPath,
    });
    await expect(readFile(path.join(tempRoot, 'settings.json'), 'utf8')).resolves.toContain(
      '"sidekick_codex_path"',
    );
  });

  it('lets SIDEKICK_CODEX_PATH take precedence over saved settings', async () => {
    const tempRoot = await createTempRoot();
    const savedCodexPath = path.join(tempRoot, 'codex');
    const environmentCodexPath = path.join(tempRoot, 'env-codex');
    await writeFile(savedCodexPath, '#!/bin/sh\n', 'utf8');
    const store = new AppSettingsStore(tempRoot);
    await store.updateCodexPath(savedCodexPath, 'linux');

    await expect(
      store.snapshot({
        SIDEKICK_CODEX_PATH: environmentCodexPath,
      }),
    ).resolves.toMatchObject({
      codexPathSource: 'environment',
      effectiveCodexPath: environmentCodexPath,
    });
  });

  it('rejects relative Codex paths', async () => {
    await expect(validateCodexPath('codex', 'linux')).rejects.toThrow(/absolute path/);
  });

  it('rejects missing Codex files', async () => {
    await expect(validateCodexPath(path.join(await createTempRoot(), 'codex'), 'linux')).rejects.toThrow(
      /existing file/,
    );
  });

  it('reports invalid JSON and falls back to defaults', async () => {
    const tempRoot = await createTempRoot();
    await mkdir(tempRoot, { recursive: true });
    await writeFile(path.join(tempRoot, 'settings.json'), '{not-json', 'utf8');
    const store = new AppSettingsStore(tempRoot);

    const snapshot = await store.snapshot({});

    expect(snapshot.settings).toEqual(DEFAULT_APP_SETTINGS);
    expect(snapshot.warning).toContain('Settings could not be read');
  });
});
