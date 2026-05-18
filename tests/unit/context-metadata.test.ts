import { mkdir, mkdtemp, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FOLDER_METADATA_FILE_NAME,
  normalizeFolderTagKey,
} from '../../src/main/context-metadata';
import { openWorkspaceDatabase } from '../../src/main/workspace-database';

const temporaryRoots: string[] = [];

const createFolder = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-folder-metadata-'));
  const folderPath = path.join(rootPath, 'Strategi');
  temporaryRoots.push(rootPath);
  await mkdir(folderPath, { recursive: true });

  return folderPath;
};

describe('folder context metadata', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('normalizes system tag labels exactly without fuzzy matching', () => {
    expect(normalizeFolderTagKey(' prosjektmappe ')).toBe('prosjektmappe');
    expect(normalizeFolderTagKey('Prosjekt   mappe')).toBe('prosjekt mappe');
    expect(normalizeFolderTagKey('Prosjektmappe!')).toBe('prosjektmappe!');
  });

  it('stores a system tag in the workspace database with stable folder and context ids', async () => {
    const folderPath = await createFolder();
    const rootPath = path.dirname(folderPath);
    const database = await openWorkspaceDatabase(rootPath);
    const first = database.addFolderTag(folderPath, ' prosjektmappe ');
    const second = database.addFolderTag(folderPath, 'Prosjektmappe');
    database.close();
    const tag = second.tags[0];

    expect(first.folderId).toBe(second.folderId);
    expect(first.tags[0].context?.id).toBe(second.tags[0].context?.id);
    expect(tag.label).toBe('Prosjektmappe');
    expect(tag.kind).toBe('system');
    expect(tag.systemEffect).toBe('project-root');
    expect(tag.context?.type).toBe('project');
    expect(tag.context?.name).toBe('Strategi');
  });

  it('stores near matches as free-form tags', async () => {
    const folderPath = await createFolder();
    const database = await openWorkspaceDatabase(path.dirname(folderPath));
    const metadata = database.addFolderTag(folderPath, 'Prosjekt mappe');
    database.close();
    const tag = metadata.tags[0];

    expect(tag.label).toBe('Prosjekt mappe');
    expect(tag.kind).toBe('free');
    expect(tag.systemEffect).toBeUndefined();
  });

  it('removes tags from the database without creating marker files', async () => {
    const folderPath = await createFolder();
    const database = await openWorkspaceDatabase(path.dirname(folderPath));
    database.addFolderTag(folderPath, 'Q2');
    const metadata = database.removeFolderTag(folderPath, 'q2');
    database.close();
    const markerPath = path.join(folderPath, FOLDER_METADATA_FILE_NAME);

    expect(metadata.tags).toEqual([]);
    await expect(stat(markerPath)).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
