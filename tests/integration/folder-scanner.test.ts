import { cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FOLDER_METADATA_FILE_NAME,
  addFolderTag,
  readFolderMetadataFile,
} from '../../src/main/context-metadata';
import { scanWorkspaceFolder } from '../../src/main/folder-scanner';

const fixturePath = path.resolve(__dirname, '../fixtures/workspace-basic');
const temporaryRoots: string[] = [];

const copyFixtureToTemp = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-folder-scanner-'));
  temporaryRoots.push(rootPath);
  await cp(fixturePath, rootPath, { recursive: true });

  return rootPath;
};

describe('folder scanner', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('scans a workspace and returns summary counts', async () => {
    const result = await scanWorkspaceFolder(fixturePath);

    expect(result.status).toBe('complete');
    expect(result.rootName).toBe('workspace-basic');
    expect(result.summary.fileCount).toBe(8);
    expect(result.summary.folderCount).toBe(4);
    expect(result.summary.artifactTypeCounts.pdf).toBe(1);
    expect(result.summary.artifactTypeCounts.presentation).toBe(1);
    expect(result.summary.artifactTypeCounts.drawio).toBe(2);
    expect(result.summary.artifactTypeCounts.transcript).toBe(2);
    expect(result.summary.folderSignalCounts.background).toBe(1);
    expect(result.summary.folderSignalCounts.transcript).toBe(1);
    expect(result.summary.folderSignalCounts['information-model']).toBe(1);
    expect(result.summary.folderSignalCounts.architecture).toBe(1);
    expect(result.warnings.some((warning) => warning.path.includes('dist'))).toBe(true);
  });

  it('returns partial results when the file limit is reached', async () => {
    const result = await scanWorkspaceFolder(fixturePath, { maxFiles: 2 });

    expect(result.status).toBe('partial');
    expect(result.summary.limitsReached.maxFiles).toBe(true);
    expect(result.warnings.some((warning) => warning.type === 'file-limit')).toBe(true);
    expect(result.summary.fileCount).toBe(2);
  });

  it('reads folder metadata markers and hides marker files from the visible tree', async () => {
    const rootPath = await copyFixtureToTemp();
    const folderPath = path.join(rootPath, '01-bakgrunn');
    await addFolderTag(folderPath, 'Prosjektmappe');
    await writeFile(path.join(folderPath, 'visible.json'), '{"visible":true}', 'utf8');

    const result = await scanWorkspaceFolder(rootPath);
    const folder = result.tree.children?.find((child) => child.relativePath === '01-bakgrunn');
    const childNames = folder?.children?.map((child) => child.name) ?? [];

    expect(folder?.metadata?.status).toBe('valid');
    expect(folder?.metadata?.tags[0].label).toBe('Prosjektmappe');
    expect(folder?.metadata?.tags[0].systemEffect).toBe('project-root');
    expect(childNames).toContain('visible.json');
    expect(childNames).not.toContain(FOLDER_METADATA_FILE_NAME);
  });

  it('keeps folder metadata when a tagged folder is renamed and moved inside the workspace', async () => {
    const rootPath = await copyFixtureToTemp();
    const originalFolder = path.join(rootPath, '01-bakgrunn');
    const renamedFolder = path.join(rootPath, 'Strategi');
    const movedFolder = path.join(rootPath, '02-transkripsjoner', 'Strategi');
    await addFolderTag(originalFolder, 'Q2');
    const beforeMove = await readFolderMetadataFile(originalFolder);

    await rename(originalFolder, renamedFolder);
    let result = await scanWorkspaceFolder(rootPath);
    let folder = result.tree.children?.find((child) => child.relativePath === 'Strategi');
    expect(folder?.metadata?.folderId).toBe(beforeMove?.folderId);
    expect(folder?.metadata?.tags[0].label).toBe('Q2');

    await rename(renamedFolder, movedFolder);
    result = await scanWorkspaceFolder(rootPath);
    const transcriptFolder = result.tree.children?.find(
      (child) => child.relativePath === '02-transkripsjoner',
    );
    folder = transcriptFolder?.children?.find(
      (child) => child.relativePath === '02-transkripsjoner/Strategi',
    );

    expect(folder?.metadata?.folderId).toBe(beforeMove?.folderId);
    expect(folder?.metadata?.tags[0].label).toBe('Q2');
  });

  it('reports corrupt, unsupported, and duplicate marker files without applying tags', async () => {
    const rootPath = await copyFixtureToTemp();
    const corruptFolder = path.join(rootPath, 'corrupt');
    const unsupportedFolder = path.join(rootPath, 'unsupported');
    const duplicateA = path.join(rootPath, 'duplicate-a');
    const duplicateB = path.join(rootPath, 'duplicate-b');
    await Promise.all([
      mkdir(corruptFolder),
      mkdir(unsupportedFolder),
      mkdir(duplicateA),
      mkdir(duplicateB),
    ]);
    await writeFile(path.join(corruptFolder, FOLDER_METADATA_FILE_NAME), '{not-json', 'utf8');
    await writeFile(
      path.join(unsupportedFolder, FOLDER_METADATA_FILE_NAME),
      JSON.stringify({ sidekickSchema: 'folder-metadata.v99' }),
      'utf8',
    );
    await writeFile(
      path.join(duplicateA, FOLDER_METADATA_FILE_NAME),
      JSON.stringify({
        sidekickSchema: 'folder-metadata.v1',
        folderId: 'folder-duplicate',
        createdAt: '2026-05-14T00:00:00.000Z',
        updatedAt: '2026-05-14T00:00:00.000Z',
        tags: [],
      }),
      'utf8',
    );
    await writeFile(
      path.join(duplicateB, FOLDER_METADATA_FILE_NAME),
      JSON.stringify({
        sidekickSchema: 'folder-metadata.v1',
        folderId: 'folder-duplicate',
        createdAt: '2026-05-14T00:00:00.000Z',
        updatedAt: '2026-05-14T00:00:00.000Z',
        tags: [],
      }),
      'utf8',
    );

    const result = await scanWorkspaceFolder(rootPath);
    const byPath = new Map(result.tree.children?.map((child) => [child.relativePath, child]));

    expect(byPath.get('corrupt')?.metadata?.status).toBe('invalid');
    expect(byPath.get('unsupported')?.metadata?.status).toBe('unsupported');
    expect(byPath.get('duplicate-a')?.metadata?.status).toBe('conflict');
    expect(byPath.get('duplicate-b')?.metadata?.status).toBe('conflict');
    expect(result.warnings.map((warning) => warning.type)).toEqual(
      expect.arrayContaining([
        'metadata-invalid',
        'metadata-unsupported',
        'metadata-conflict',
      ]),
    );
  });
});
