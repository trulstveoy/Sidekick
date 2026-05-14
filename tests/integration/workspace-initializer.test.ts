import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REQUIRED_WORKSPACE_FOLDERS } from '../../src/main/workspace-creator';
import {
  confirmWorkspaceInitialization,
  createWorkspaceInitializationPreview,
} from '../../src/main/workspace-initializer';

let rootPath: string;

beforeEach(async () => {
  rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-workspace-initializer-'));
});

afterEach(async () => {
  await rm(rootPath, { recursive: true, force: true });
});

describe('workspace initializer', () => {
  it('previews an already initialized folder as satisfied', async () => {
    await Promise.all(REQUIRED_WORKSPACE_FOLDERS.map((folderName) => mkdir(path.join(rootPath, folderName))));

    const preview = await createWorkspaceInitializationPreview(rootPath, 'preview-1');

    expect(preview.previewId).toBe('preview-1');
    expect(preview.rootPath).toBe(rootPath);
    expect(preview.requiredFolders.map((folder) => folder.status)).toEqual([
      'existing',
      'existing',
      'existing',
    ]);
    expect(preview.warnings).toEqual([]);
  });

  it('previews missing required folders without creating them', async () => {
    const preview = await createWorkspaceInitializationPreview(rootPath);

    expect(preview.requiredFolders.map((folder) => folder.status)).toEqual([
      'missing',
      'missing',
      'missing',
    ]);
    await expect(readdir(rootPath)).resolves.toEqual([]);
  });

  it('warns about similarly named folders without accepting them as required folders', async () => {
    await mkdir(path.join(rootPath, '01. Transkriberinger'));

    const preview = await createWorkspaceInitializationPreview(rootPath);

    expect(preview.requiredFolders.find((folder) => folder.name === '02. Transkripsjoner')?.status).toBe(
      'missing',
    );
    expect(preview.warnings).toEqual([
      {
        path: '01. Transkriberinger',
        message:
          'This folder looks similar to a required workspace, but Sidekick requires the exact folder name.',
      },
    ]);
  });

  it('creates only missing required folders and does not create sidekick metadata', async () => {
    await mkdir(path.join(rootPath, '00. Forutsetninger'));
    await writeFile(path.join(rootPath, 'notes.md'), 'Existing content');

    const result = await confirmWorkspaceInitialization(rootPath);
    const entries = await readdir(rootPath);

    expect(result.requiredFolders.map((folder) => folder.status)).toEqual([
      'existing',
      'created',
      'created',
    ]);
    expect(entries.sort()).toEqual([
      '00. Forutsetninger',
      '01. Notater',
      '02. Transkripsjoner',
      'notes.md',
    ]);
    expect(entries).not.toContain('.sidekick');
  });

  it('rejects file paths', async () => {
    const filePath = path.join(rootPath, 'not-a-folder.md');
    await writeFile(filePath, 'Not a folder');

    await expect(createWorkspaceInitializationPreview(filePath)).rejects.toThrow(
      'Choose a workspace, not a file.',
    );
  });
});
