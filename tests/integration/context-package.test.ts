import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CodexRunner } from '../../src/main/codex-runner';
import {
  generateContextPackage,
  generateFolderContextPackage,
  getFolderContextPackageOutputPath,
  getFolderContextPackagePreview,
  getContextPackageOutputPath,
  getContextPackagePreview,
} from '../../src/main/context-package';

const fixturePath = path.resolve(__dirname, '../fixtures/project-folder-basic');
const temporaryRoots: string[] = [];

const copyFixtureToTemp = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-context-package-'));
  temporaryRoots.push(rootPath);
  await cp(fixturePath, rootPath, { recursive: true });

  return rootPath;
};

const summaryMarkdown = [
  '## Project Summary',
  '',
  'Prosjektet handler om Sidekick.',
  '',
  '## Participants',
  '',
  '- Sidekick-teamet',
  '',
  '## Themes',
  '',
  '- Lokal kontekst',
].join('\n');

const fakeCodexRunner = {
  getStatus: async () => ({
    state: 'ready',
    available: true,
    loggedIn: true,
  }),
  runExecText: async () => ({
    code: 0,
    signal: null,
    stdout: summaryMarkdown,
    stderr: '',
  }),
} as unknown as CodexRunner;

describe('context package generation', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('previews output path and overwrite status', async () => {
    const rootPath = await copyFixtureToTemp();
    const outputPath = getContextPackageOutputPath(rootPath);

    let preview = await getContextPackagePreview(rootPath);
    expect(preview.outputPath).toBe(outputPath);
    expect(preview.outputFileName).toBe(`${path.basename(rootPath)}.context-package.md`);
    expect(preview.willOverwrite).toBe(false);

    await writeFile(outputPath, 'old generated package');
    preview = await getContextPackagePreview(rootPath);
    expect(preview.willOverwrite).toBe(true);
  });

  it('generates markdown output and excludes an existing generated package', async () => {
    const rootPath = await copyFixtureToTemp();
    const outputPath = getContextPackageOutputPath(rootPath);
    await writeFile(outputPath, 'SHOULD_NOT_BE_INCLUDED');
    await mkdir(path.join(rootPath, '.sidekick'), { recursive: true });
    await writeFile(path.join(rootPath, '.sidekick', 'project-info.md'), 'SIDEKICK_METADATA_SECRET');

    const result = await generateContextPackage(rootPath, { codexRunner: fakeCodexRunner });
    const output = await readFile(outputPath, 'utf8');
    const outputStats = await stat(outputPath);
    const skippedPaths = result.skippedFiles.map((file) => file.path);

    expect(result.status).toBe('complete');
    expect(result.projectSummary.status).toBe('complete');
    expect(result.outputPath).toBe(outputPath);
    expect(result.outputFileName).toBe(`${path.basename(rootPath)}.context-package.md`);
    expect(result.overwritten).toBe(true);
    expect(result.outputBytes).toBe(outputStats.size);
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.totalTokens).toBeGreaterThan(0);
    expect(result.totalCharacters).toBeGreaterThan(0);
    expect(result.processedFiles).toEqual(
      expect.arrayContaining([
        '01-bakgrunn/marked-notes.md',
        '02-transkripsjoner/intervju-01.txt',
      ]),
    );
    expect(skippedPaths).toEqual(
      expect.arrayContaining([
        '01-bakgrunn/brief.pdf',
        '02-transkripsjoner/intervju-02.docx',
        '03-informasjonsmodell/domene-modell.png',
        '04-arkitektur/arkitektur.pptx',
      ]),
    );
    expect(output).toContain('# File Summary');
    expect(output).toContain('marked-notes.md');
    expect(output).toContain('intervju-01.txt');
    expect(output).not.toContain('SHOULD_NOT_BE_INCLUDED');
    expect(output).not.toContain('SIDEKICK_METADATA_SECRET');
  });

  it('previews folder-scoped output path and overwrite status', async () => {
    const rootPath = await copyFixtureToTemp();
    const folderRelativePath = '02-transkripsjoner';
    const folderPath = path.join(rootPath, folderRelativePath);
    const outputPath = getFolderContextPackageOutputPath(folderPath);

    let preview = await getFolderContextPackagePreview({ rootPath, folderRelativePath });
    expect(preview.scope).toBe('folder');
    expect(preview.rootPath).toBe(rootPath);
    expect(preview.targetPath).toBe(folderPath);
    expect(preview.targetRelativePath).toBe(folderRelativePath);
    expect(preview.outputPath).toBe(outputPath);
    expect(preview.outputFileName).toBe('02-transkripsjoner.context-package.md');
    expect(preview.willOverwrite).toBe(false);

    await writeFile(outputPath, 'old generated folder package');
    preview = await getFolderContextPackagePreview({ rootPath, folderRelativePath });
    expect(preview.willOverwrite).toBe(true);
  });

  it('generates folder-scoped markdown and excludes sibling folders', async () => {
    const rootPath = await copyFixtureToTemp();
    const folderRelativePath = '02-transkripsjoner';
    const outputPath = getFolderContextPackageOutputPath(path.join(rootPath, folderRelativePath));

    const result = await generateFolderContextPackage({ rootPath, folderRelativePath });
    const output = await readFile(outputPath, 'utf8');

    expect(result.scope).toBe('folder');
    expect(result.outputPath).toBe(outputPath);
    expect(result.targetRelativePath).toBe(folderRelativePath);
    expect(result.processedFiles).toEqual(expect.arrayContaining(['intervju-01.txt']));
    expect(result.processedFiles).not.toEqual(expect.arrayContaining(['01-bakgrunn/marked-notes.md']));
    expect(output).toContain('intervju-01.txt');
    expect(output).not.toContain('marked-notes.md');
  });

  it('excludes nested generated context packages from folder-scoped output', async () => {
    const rootPath = await copyFixtureToTemp();
    const folderRelativePath = '02-transkripsjoner';
    const nestedFolder = path.join(rootPath, folderRelativePath, 'nested');
    await cp(path.join(rootPath, '01-bakgrunn'), nestedFolder, { recursive: true });
    await writeFile(
      path.join(nestedFolder, 'nested.context-package.md'),
      'SHOULD_NOT_BE_INCLUDED_FROM_NESTED_PACKAGE',
    );

    const result = await generateFolderContextPackage({ rootPath, folderRelativePath });
    const output = await readFile(result.outputPath, 'utf8');

    expect(output).not.toContain('SHOULD_NOT_BE_INCLUDED_FROM_NESTED_PACKAGE');
    expect(result.processedFiles).not.toContain('nested/nested.context-package.md');
  });

  it('rejects unsafe folder-scoped paths', async () => {
    const rootPath = await copyFixtureToTemp();

    await expect(
      getFolderContextPackagePreview({ rootPath, folderRelativePath: '../outside' }),
    ).rejects.toThrow('Selected folder path must stay inside the project root.');
    await expect(
      getFolderContextPackagePreview({ rootPath, folderRelativePath: path.join(rootPath, '02-transkripsjoner') }),
    ).rejects.toThrow('Selected folder path must be relative to the project root.');
    await expect(
      getFolderContextPackagePreview({ rootPath, folderRelativePath: '.' }),
    ).rejects.toThrow('Use the full-project context package action for the project root.');
  });
});
