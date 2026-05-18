import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  FOLDER_METADATA_FILE_NAME,
} from '../../src/main/context-metadata';
import { scanWorkspaceFolder } from '../../src/main/folder-scanner';
import { openWorkspaceDatabase } from '../../src/main/workspace-database';

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
    const rootPath = await copyFixtureToTemp();
    const result = await scanWorkspaceFolder(rootPath);

    expect(result.status).toBe('complete');
    expect(result.rootName).toMatch(/^sidekick-folder-scanner-/);
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
    const rootPath = await copyFixtureToTemp();
    const result = await scanWorkspaceFolder(rootPath, { maxFiles: 2 });

    expect(result.status).toBe('partial');
    expect(result.summary.limitsReached.maxFiles).toBe(true);
    expect(result.warnings.some((warning) => warning.type === 'file-limit')).toBe(true);
    expect(result.summary.fileCount).toBe(2);
  });

  it('reads folder metadata from the workspace database and hides legacy marker files from the visible tree', async () => {
    const rootPath = await copyFixtureToTemp();
    const folderPath = path.join(rootPath, '01-bakgrunn');
    const database = await openWorkspaceDatabase(rootPath);
    database.addFolderTag(folderPath, 'Prosjektmappe');
    database.close();
    await writeFile(path.join(folderPath, FOLDER_METADATA_FILE_NAME), 'LEGACY_METADATA_SECRET', 'utf8');
    await writeFile(path.join(folderPath, 'visible.json'), '{"visible":true}', 'utf8');

    const result = await scanWorkspaceFolder(rootPath);
    const folder = result.tree.children?.find((child) => child.relativePath === '01-bakgrunn');
    const childNames = folder?.children?.map((child) => child.name) ?? [];

    expect(folder?.metadata?.status).toBe('valid');
    expect(folder?.metadata?.tags[0].label).toBe('Prosjektmappe');
    expect(folder?.metadata?.tags[0].systemEffect).toBe('project-root');
    expect(childNames).toContain('visible.json');
    expect(childNames).not.toContain(FOLDER_METADATA_FILE_NAME);
    expect(result.contextViews.projects.contexts).toHaveLength(1);
    expect(result.contextViews.projects.contexts[0].label).toBe('01-bakgrunn');
    expect(result.contextViews.projects.rows.map((row) => row.artifactRelativePath)).toContain(
      '01-bakgrunn/visible.json',
    );
  });

  it('keeps folder metadata tied to the original path when a tagged folder is renamed outside Sidekick', async () => {
    const rootPath = await copyFixtureToTemp();
    const originalFolder = path.join(rootPath, '01-bakgrunn');
    const renamedFolder = path.join(rootPath, 'Strategi');
    const database = await openWorkspaceDatabase(rootPath);
    const beforeMove = database.addFolderTag(originalFolder, 'Q2');
    database.close();

    await rm(renamedFolder, { recursive: true, force: true });
    await mkdir(renamedFolder);
    await rm(originalFolder, { recursive: true, force: true });
    const result = await scanWorkspaceFolder(rootPath);
    const renamed = result.tree.children?.find((child) => child.relativePath === 'Strategi');

    expect(beforeMove.tags[0].label).toBe('Q2');
    expect(renamed?.metadata).toBeUndefined();
  });

  it('ignores legacy marker files as non-authoritative metadata', async () => {
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

    expect(byPath.get('corrupt')?.metadata).toBeUndefined();
    expect(byPath.get('unsupported')?.metadata).toBeUndefined();
    expect(byPath.get('duplicate-a')?.metadata).toBeUndefined();
    expect(byPath.get('duplicate-b')?.metadata).toBeUndefined();
    expect(result.contextViews.projects.contexts).toEqual([]);
    expect(result.contextViews.projects.rows).toEqual([]);
    expect(result.warnings.map((warning) => warning.type)).not.toEqual(
      expect.arrayContaining(['metadata-invalid', 'metadata-unsupported', 'metadata-conflict']),
    );
  });
});
