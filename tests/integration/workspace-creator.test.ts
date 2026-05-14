import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createWorkspaceFolder,
  ensureRequiredWorkspaceFolders,
  getWorkspaceRootPath,
  REQUIRED_WORKSPACE_FOLDERS,
  validateWorkspaceName,
} from '../../src/main/workspace-creator';

let parentPath: string;

beforeEach(async () => {
  parentPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-workspace-creator-'));
});

afterEach(async () => {
  await rm(parentPath, { recursive: true, force: true });
});

describe('workspace creator', () => {
  it('creates a workspace root with the required folders', async () => {
    const result = await createWorkspaceFolder({
      parentPath,
      request: { workspaceName: 'My Workspace', parentPath },
    });

    expect(result.rootName).toBe('My Workspace');
    expect(result.rootPath).toBe(path.join(parentPath, 'My Workspace'));
    expect(result.requiredFolders.map((folder) => folder.name)).toEqual(REQUIRED_WORKSPACE_FOLDERS);
    expect(result.requiredFolders.every((folder) => folder.status === 'created')).toBe(true);
    await expect(readdir(result.rootPath)).resolves.toEqual(REQUIRED_WORKSPACE_FOLDERS);
  });

  it('rejects an existing target workspace', async () => {
    await createWorkspaceFolder({
      parentPath,
      request: { workspaceName: 'Existing Workspace', parentPath },
    });

    await expect(
      createWorkspaceFolder({
        parentPath,
        request: { workspaceName: 'Existing Workspace', parentPath },
      }),
    ).rejects.toThrow('Arbeidsområdet finnes allerede.');
  });

  it('treats existing required folders as satisfied during recovery', async () => {
    const rootPath = path.join(parentPath, 'Recovered Workspace');
    await createWorkspaceFolder({
      parentPath,
      request: { workspaceName: 'Recovered Workspace', parentPath },
    });

    const result = await ensureRequiredWorkspaceFolders(rootPath);

    expect(result.map((folder) => folder.status)).toEqual([
      'existing',
      'existing',
      'existing',
    ]);
  });

  it('rejects workspace names that are paths', () => {
    expect(() => validateWorkspaceName('../outside')).toThrow(
      'Workspace name must be a folder name, not a path.',
    );
    expect(() => validateWorkspaceName('nested/workspace')).toThrow(
      'Workspace name must be a folder name, not a path.',
    );
  });

  it('rejects empty workspace names', () => {
    expect(() => validateWorkspaceName('   ')).toThrow('Workspace name is required.');
  });

  it('keeps the workspace root inside the selected parent folder', () => {
    expect(getWorkspaceRootPath(parentPath, 'Safe Workspace')).toBe(
      path.join(parentPath, 'Safe Workspace'),
    );
  });
});
