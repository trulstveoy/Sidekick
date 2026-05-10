import { cp, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  generateContextPackage,
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

    const result = await generateContextPackage(rootPath);
    const output = await readFile(outputPath, 'utf8');
    const outputStats = await stat(outputPath);
    const skippedPaths = result.skippedFiles.map((file) => file.path);

    expect(result.status).toBe('complete');
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
  });
});
