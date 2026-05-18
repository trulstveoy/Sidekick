import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isPathInside,
  shouldIgnoreWorkspaceWatchFolder,
  toWorkspaceRelativePath,
  WorkspaceFileEventService,
  type WorkspaceFileEvent,
} from '../../src/main/workspace-file-events';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForEvent = (service: WorkspaceFileEventService) =>
  new Promise<WorkspaceFileEvent>((resolve) => {
    service.on('event', resolve);
  });

describe('workspace file event service', () => {
  let rootPath: string | undefined;

  afterEach(async () => {
    if (rootPath) {
      await rm(rootPath, { recursive: true, force: true });
      rootPath = undefined;
    }
  });

  it('normalizes workspace-relative paths', () => {
    const root = path.join(os.tmpdir(), 'sidekick-event-root');

    expect(isPathInside(root, path.join(root, 'notes', 'brief.md'))).toBe(true);
    expect(isPathInside(root, path.join(os.tmpdir(), 'outside.md'))).toBe(false);
    expect(toWorkspaceRelativePath(root, path.join(root, 'notes', 'brief.md'))).toBe(
      'notes/brief.md',
    );
  });

  it('uses shared ignored folder rules for watcher coverage', () => {
    expect(shouldIgnoreWorkspaceWatchFolder('.git')).toBe(true);
    expect(shouldIgnoreWorkspaceWatchFolder('.sidekick')).toBe(true);
    expect(shouldIgnoreWorkspaceWatchFolder('node_modules')).toBe(true);
    expect(shouldIgnoreWorkspaceWatchFolder('.obsidian')).toBe(true);
    expect(shouldIgnoreWorkspaceWatchFolder('Strategi')).toBe(false);
  });

  it('emits normalized file events for watched roots', async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-events-'));
    const service = new WorkspaceFileEventService();

    try {
      service.watchWorkspace(rootPath, 'test-owner');
      await wait(100);

      const event = waitForEvent(service);
      await writeFile(path.join(rootPath, 'notat.md'), '# Notat\n', 'utf8');

      await expect(event).resolves.toMatchObject({
        rootPath,
        relativePath: 'notat.md',
      });
    } finally {
      service.close();
    }
  });

  it('keeps watchers alive until the last owner unsubscribes', async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-events-'));
    const service = new WorkspaceFileEventService();

    try {
      const unsubscribeFirst = service.watchWorkspace(rootPath, 'first-owner');
      const unsubscribeSecond = service.watchWorkspace(rootPath, 'second-owner');
      await wait(100);
      unsubscribeFirst();

      const event = waitForEvent(service);
      await writeFile(path.join(rootPath, 'shared.md'), '# Shared\n', 'utf8');

      await expect(event).resolves.toMatchObject({
        rootPath,
        relativePath: 'shared.md',
      });

      unsubscribeSecond();
    } finally {
      service.close();
    }
  });

  it('refreshes watcher coverage for newly discovered folders', async () => {
    rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-events-'));
    const service = new WorkspaceFileEventService();

    try {
      service.watchWorkspace(rootPath, 'test-owner');
      await wait(100);

      await mkdir(path.join(rootPath, 'Strategi'));
      await service.refreshWorkspaceWatchers(rootPath);

      const event = waitForEvent(service);
      await writeFile(path.join(rootPath, 'Strategi', 'notat.md'), '# Strategi\n', 'utf8');

      await expect(event).resolves.toMatchObject({
        rootPath,
        relativePath: 'Strategi/notat.md',
      });
    } finally {
      service.close();
    }
  });
});
