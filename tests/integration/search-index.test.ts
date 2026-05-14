import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  resolveWorkspaceRelativePath,
  SEARCH_INDEX_FILE,
  SEARCH_INDEX_FOLDER,
  SEARCH_MANIFEST_FILE,
  SEARCH_MAX_FILE_BYTES,
  SearchIndexManager,
} from '../../src/main/search-index';

let rootPath: string;
let manager: SearchIndexManager;

beforeEach(async () => {
  rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-search-'));
  manager = new SearchIndexManager();
});

afterEach(async () => {
  await manager.close();
  await rm(rootPath, { recursive: true, force: true });
});

const writeWorkspaceFile = async (relativePath: string, content: string | Buffer) => {
  const absolutePath = path.join(rootPath, ...relativePath.split('/'));
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, content);

  return absolutePath;
};

describe('search index manager', () => {
  it('builds a workspace-local index and searches supported text files', async () => {
    await writeWorkspaceFile('notes/brief.md', 'Dette er et notat om lokal søkbar indeks.');
    await writeWorkspaceFile('.sidekick/hidden.md', 'Skal ikke indekseres.');
    await writeWorkspaceFile('generated.context-package.md', 'Skal ikke indekseres.');

    const status = await manager.refresh(rootPath);
    const indexFile = path.join(rootPath, ...SEARCH_INDEX_FOLDER.split('/'), SEARCH_INDEX_FILE);
    const manifestFile = path.join(rootPath, ...SEARCH_INDEX_FOLDER.split('/'), SEARCH_MANIFEST_FILE);
    const manifest = JSON.parse(await readFile(manifestFile, 'utf8')) as {
      sidekick_schema: string;
      document_count: number;
      files: Record<string, unknown>;
    };

    expect(status.state).toBe('ready');
    expect(status.documentCount).toBe(1);
    await expect(stat(indexFile)).resolves.toBeTruthy();
    expect(manifest.sidekick_schema).toBe('search-index-manifest.v1');
    expect(manifest.document_count).toBe(1);
    expect(Object.keys(manifest.files)).toEqual(['notes/brief.md']);

    const result = await manager.search({ rootPath, query: 'søkbar indeks' });

    expect(result.results).toHaveLength(1);
    expect(result.results[0].relativePath).toBe('notes/brief.md');
    expect(result.results[0].snippet).toContain('søkbar indeks');
  });

  it('reports unsupported, binary, and oversized skipped files', async () => {
    await writeWorkspaceFile('notes/brief.md', 'Kort tekst.');
    await writeWorkspaceFile('image.png', Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    await writeWorkspaceFile('archive.bin', Buffer.from([0x00, 0x01, 0x02]));
    await writeWorkspaceFile('large.txt', 'a'.repeat(SEARCH_MAX_FILE_BYTES + 1));

    const status = await manager.refresh(rootPath);

    expect(status.state).toBe('ready');
    expect(status.documentCount).toBe(1);
    expect(status.skippedCounts.binary).toBe(1);
    expect(status.skippedCounts.unsupported).toBe(1);
    expect(status.skippedCounts.oversized).toBe(1);
  });

  it('applies incremental refreshes through supported file changes', async () => {
    await writeWorkspaceFile('notes/brief.md', 'Første innhold.');
    await manager.refresh(rootPath);

    await writeWorkspaceFile('notes/second.md', 'Andre innhold med søkeord.');
    await manager.refresh(rootPath);

    let result = await manager.search({ rootPath, query: 'søkeord' });
    expect(result.results.map((item) => item.relativePath)).toEqual(['notes/second.md']);

    await writeWorkspaceFile('notes/second.md', 'Oppdatert innhold uten nøkkelord.');
    await manager.refresh(rootPath);

    result = await manager.search({ rootPath, query: 'søkeord' });
    expect(result.results).toHaveLength(0);

    await rm(path.join(rootPath, 'notes/second.md'));
    const status = await manager.refresh(rootPath);
    expect(status.documentCount).toBe(1);
  });

  it('rejects unsafe workspace-relative result paths', () => {
    expect(() => resolveWorkspaceRelativePath(rootPath, '../outside.md')).toThrow(
      'Search result path must stay inside the workspace root.',
    );
    expect(() => resolveWorkspaceRelativePath(rootPath, '/tmp/outside.md')).toThrow(
      'Search result path must be relative to the workspace root.',
    );
  });
});
