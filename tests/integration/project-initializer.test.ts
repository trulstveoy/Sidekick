import { mkdtemp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { REQUIRED_PROJECT_FOLDERS } from '../../src/main/project-creator';
import {
  confirmProjectInitialization,
  createProjectInitializationPreview,
} from '../../src/main/project-initializer';

let rootPath: string;

beforeEach(async () => {
  rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-project-initializer-'));
});

afterEach(async () => {
  await rm(rootPath, { recursive: true, force: true });
});

describe('project initializer', () => {
  it('previews an already initialized folder as satisfied', async () => {
    await Promise.all(REQUIRED_PROJECT_FOLDERS.map((folderName) => mkdir(path.join(rootPath, folderName))));

    const preview = await createProjectInitializationPreview(rootPath, 'preview-1');

    expect(preview.previewId).toBe('preview-1');
    expect(preview.rootPath).toBe(rootPath);
    expect(preview.requiredFolders.map((folder) => folder.status)).toEqual(['existing', 'existing']);
    expect(preview.warnings).toEqual([]);
  });

  it('previews missing required folders without creating them', async () => {
    const preview = await createProjectInitializationPreview(rootPath);

    expect(preview.requiredFolders.map((folder) => folder.status)).toEqual(['missing', 'missing']);
    await expect(readdir(rootPath)).resolves.toEqual([]);
  });

  it('warns about similarly named folders without accepting them as required folders', async () => {
    await mkdir(path.join(rootPath, '01. Transkriberinger'));

    const preview = await createProjectInitializationPreview(rootPath);

    expect(preview.requiredFolders.find((folder) => folder.name === '01. Transkripsjoner')?.status).toBe(
      'missing',
    );
    expect(preview.warnings).toEqual([
      {
        path: '01. Transkriberinger',
        message:
          'This folder looks similar to a required project folder, but Sidekick requires the exact folder name.',
      },
    ]);
  });

  it('creates only missing required folders and does not create sidekick metadata', async () => {
    await mkdir(path.join(rootPath, '00. Forutsetninger'));
    await writeFile(path.join(rootPath, 'notes.md'), 'Existing content');

    const result = await confirmProjectInitialization(rootPath);
    const entries = await readdir(rootPath);

    expect(result.requiredFolders.map((folder) => folder.status)).toEqual(['existing', 'created']);
    expect(entries.sort()).toEqual([
      '00. Forutsetninger',
      '01. Transkripsjoner',
      'notes.md',
    ]);
    expect(entries).not.toContain('.sidekick');
  });

  it('rejects file paths', async () => {
    const filePath = path.join(rootPath, 'not-a-folder.md');
    await writeFile(filePath, 'Not a folder');

    await expect(createProjectInitializationPreview(filePath)).rejects.toThrow(
      'Choose a project folder, not a file.',
    );
  });
});
