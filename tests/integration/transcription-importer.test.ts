import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { FolderTreeNode } from '../../src/shared/sidekick-api';
import {
  confirmTranscriptionImport,
  createTranscriptionImportPreview,
} from '../../src/main/transcription-importer';

const fixturePath = path.resolve(__dirname, '../fixtures/project-folder-basic');
const temporaryRoots: string[] = [];

const copyFixtureToTemp = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-transcription-import-'));
  temporaryRoots.push(rootPath);
  await cp(fixturePath, rootPath, { recursive: true });

  return rootPath;
};

const createSourceTranscription = async (extension = '.md') => {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), 'sidekick-downloads-'));
  temporaryRoots.push(sourceRoot);
  const sourcePath = path.join(sourceRoot, `downloaded transcription${extension}`);
  await writeFile(sourcePath, 'Imported transcription content');

  return sourcePath;
};

const collectRelativePaths = (node: FolderTreeNode, paths: string[] = []) => {
  paths.push(node.relativePath);
  node.children?.forEach((child) => collectRelativePaths(child, paths));

  return paths;
};

describe('transcription import', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('previews and copies a transcription without moving the source', async () => {
    const rootPath = await copyFixtureToTemp();
    const targetFolder = path.join(rootPath, '02-transkripsjoner');
    const sourcePath = await createSourceTranscription();
    await writeFile(path.join(targetFolder, '01-existing.md'), 'existing 1');
    await writeFile(path.join(targetFolder, '02-existing.md'), 'existing 2');

    const preview = await createTranscriptionImportPreview(rootPath, sourcePath, 'preview-1');
    expect(preview.previewId).toBe('preview-1');
    expect(preview.targetFolderRelativePath).toBe('02-transkripsjoner');
    expect(preview.destinationFileName).toBe('03-downloaded transcription.md');
    expect(preview.numbering.inferredFromExistingFiles).toBe(true);

    const result = await confirmTranscriptionImport(preview);
    const sourceContent = await readFile(sourcePath, 'utf8');
    const destinationContent = await readFile(result.destinationPath, 'utf8');
    const scannedPaths = collectRelativePaths(result.scan.tree);

    expect(result.destinationFileName).toBe('03-downloaded transcription.md');
    expect(sourceContent).toBe('Imported transcription content');
    expect(destinationContent).toBe('Imported transcription content');
    expect(scannedPaths).toContain('02-transkripsjoner/03-downloaded transcription.md');
  });

  it('automatically chooses the next number if the previewed destination is taken', async () => {
    const rootPath = await copyFixtureToTemp();
    const targetFolder = path.join(rootPath, '02-transkripsjoner');
    const sourcePath = await createSourceTranscription();
    await writeFile(path.join(targetFolder, '01-existing.md'), 'existing 1');
    await writeFile(path.join(targetFolder, '02-existing.md'), 'existing 2');

    const preview = await createTranscriptionImportPreview(rootPath, sourcePath, 'preview-2');
    await writeFile(path.join(targetFolder, preview.destinationFileName), 'new conflict');

    const result = await confirmTranscriptionImport(preview);

    expect(preview.destinationFileName).toBe('03-downloaded transcription.md');
    expect(result.destinationFileName).toBe('04-downloaded transcription.md');
    expect(await readFile(path.join(targetFolder, '03-downloaded transcription.md'), 'utf8')).toBe(
      'new conflict',
    );
    expect(await readFile(result.destinationPath, 'utf8')).toBe('Imported transcription content');
  });

  it('fails when no transcription folder is detected', async () => {
    const rootPath = await copyFixtureToTemp();
    const sourcePath = await createSourceTranscription();
    await rm(path.join(rootPath, '02-transkripsjoner'), { recursive: true, force: true });

    await expect(createTranscriptionImportPreview(rootPath, sourcePath)).rejects.toThrow(
      'No transcription folder was detected',
    );
  });

  it('fails when multiple transcription folders are detected', async () => {
    const rootPath = await copyFixtureToTemp();
    const sourcePath = await createSourceTranscription();
    await mkdir(path.join(rootPath, '05-transcripts'));

    await expect(createTranscriptionImportPreview(rootPath, sourcePath)).rejects.toThrow(
      'Multiple transcription folders were detected',
    );
  });

  it('rejects unsupported source file extensions', async () => {
    const rootPath = await copyFixtureToTemp();
    const sourcePath = await createSourceTranscription('.pdf');

    await expect(createTranscriptionImportPreview(rootPath, sourcePath)).rejects.toThrow(
      'Choose a .txt, .md, or .markdown transcription file.',
    );
  });
});
