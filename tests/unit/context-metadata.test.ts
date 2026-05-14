import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FOLDER_METADATA_FILE_NAME,
  addFolderTag,
  normalizeFolderTagKey,
  readFolderMetadataFile,
  removeFolderTag,
} from '../../src/main/context-metadata';

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

  it('writes a system tag with stable folder and context ids', async () => {
    const folderPath = await createFolder();
    const first = await addFolderTag(folderPath, ' prosjektmappe ');
    const second = await addFolderTag(folderPath, 'Prosjektmappe');
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
    const metadata = await addFolderTag(folderPath, 'Prosjekt mappe');
    const tag = metadata.tags[0];

    expect(tag.label).toBe('Prosjekt mappe');
    expect(tag.kind).toBe('free');
    expect(tag.systemEffect).toBeUndefined();
  });

  it('keeps the marker file with an empty tag list after removing the last tag', async () => {
    const folderPath = await createFolder();
    await addFolderTag(folderPath, 'Q2');
    const metadata = await removeFolderTag(folderPath, 'q2');
    const markerPath = path.join(folderPath, FOLDER_METADATA_FILE_NAME);
    const raw = await readFile(markerPath, 'utf8');
    const fromDisk = await readFolderMetadataFile(folderPath);

    expect(metadata.tags).toEqual([]);
    expect(raw).toContain('"tags": []');
    expect(fromDisk?.folderId).toBe(metadata.folderId);
    expect(fromDisk?.tags).toEqual([]);
  });
});
