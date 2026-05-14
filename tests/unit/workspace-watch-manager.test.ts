import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  WorkspaceWatchManager,
  shouldIgnoreWorkspaceRefreshPath,
} from '../../src/main/workspace-watch-manager';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForRefresh = (manager: WorkspaceWatchManager) =>
  new Promise<string>((resolve) => {
    manager.on('refresh', resolve);
  });

describe('workspace watch manager', () => {
  let rootPath: string | undefined;

  afterEach(async () => {
    if (rootPath) {
      await rm(rootPath, { recursive: true, force: true });
      rootPath = undefined;
    }
  });

  it('ignores generated Sidekick paths but keeps folder metadata marker changes visible', () => {
    const root = path.join(os.tmpdir(), 'sidekick-watch-root');

    expect(shouldIgnoreWorkspaceRefreshPath(root, path.join(root, '.sidekick', 'search-index', 'index.json'))).toBe(
      true,
    );
    expect(shouldIgnoreWorkspaceRefreshPath(root, path.join(root, 'workspace.context-package.md'))).toBe(
      true,
    );
    expect(shouldIgnoreWorkspaceRefreshPath(root, path.join(root, 'Strategi', '.sidekick-folder.json'))).toBe(
      false,
    );
    expect(shouldIgnoreWorkspaceRefreshPath(root, path.join(root, 'Strategi', 'notat.md'))).toBe(false);
  });

  it('emits one debounced refresh for external file changes', async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-watch-'));
    const manager = new WorkspaceWatchManager(50);

    try {
      manager.watchWorkspace(rootPath);
      await wait(100);

      const refresh = waitForRefresh(manager);
      await writeFile(path.join(rootPath, 'notat.md'), '# Notat\n', 'utf8');

      await expect(refresh).resolves.toBe(rootPath);
    } finally {
      manager.close();
    }
  });

  it('watches newly discovered subfolders after refresh completion', async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-watch-'));
    const manager = new WorkspaceWatchManager(50);

    try {
      manager.watchWorkspace(rootPath);
      await wait(100);

      const folderRefresh = waitForRefresh(manager);
      await mkdir(path.join(rootPath, 'Strategi'));
      await expect(folderRefresh).resolves.toBe(rootPath);

      manager.notifyUpdated(rootPath);
      await wait(100);

      const fileRefresh = waitForRefresh(manager);
      await writeFile(path.join(rootPath, 'Strategi', 'notat.md'), '# Strategi\n', 'utf8');
      await expect(fileRefresh).resolves.toBe(rootPath);
    } finally {
      manager.close();
    }
  });
});
