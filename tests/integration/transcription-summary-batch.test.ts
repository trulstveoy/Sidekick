import { cp, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  confirmTranscriptionSummaryBatch,
  createTranscriptionSummaryBatchPreview,
} from '../../src/main/transcription-summary-batch';
import {
  relativeTranscriptionSummaryPath,
  readTranscriptionSummary,
  writeTranscriptionSummary,
} from '../../src/main/transcription-summary';

const fixturePath = path.resolve(__dirname, '../fixtures/project-folder-basic');
const temporaryRoots: string[] = [];

const copyFixtureToTemp = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-summary-batch-'));
  temporaryRoots.push(rootPath);
  await cp(fixturePath, rootPath, { recursive: true });

  return rootPath;
};

const createSummary = async (rootPath: string, transcriptionRelativePath: string) =>
  writeTranscriptionSummary({
    rootPath,
    transcriptionPath: path.join(rootPath, transcriptionRelativePath),
    summaryMarkdown: '## Conversation Summary\n\nEksisterende sammendrag.',
  });

const clearFixtureTranscriptionText = async (rootPath: string) => {
  await rm(path.join(rootPath, '02-transkripsjoner', 'intervju-01.txt'), { force: true });
};

describe('transcription summary batch', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('previews missing, complete, stale, and invalid summaries for direct transcription files', async () => {
    const rootPath = await copyFixtureToTemp();
    await clearFixtureTranscriptionText(rootPath);
    const transcriptionFolder = path.join(rootPath, '02-transkripsjoner');
    await writeFile(path.join(transcriptionFolder, '00. missing.md'), 'Mangler sammendrag.');
    await writeFile(path.join(transcriptionFolder, '01. complete.md'), 'Har sammendrag.');
    await writeFile(path.join(transcriptionFolder, '02. stale.md'), 'Gammelt innhold.');
    await writeFile(path.join(transcriptionFolder, '03. invalid.txt'), 'Ugyldig metadata.');

    await createSummary(rootPath, '02-transkripsjoner/01. complete.md');
    await createSummary(rootPath, '02-transkripsjoner/02. stale.md');
    await writeFile(path.join(transcriptionFolder, '02. stale.md'), 'Oppdatert innhold.');
    await mkdir(
      path.dirname(
        path.join(rootPath, relativeTranscriptionSummaryPath('02-transkripsjoner/03. invalid.txt')),
      ),
      { recursive: true },
    );
    await writeFile(
      path.join(rootPath, relativeTranscriptionSummaryPath('02-transkripsjoner/03. invalid.txt')),
      'not valid metadata',
    );

    const preview = await createTranscriptionSummaryBatchPreview(
      rootPath,
      readTranscriptionSummary,
      'preview-1',
    );

    expect(preview.previewId).toBe('preview-1');
    expect(preview.targetFolderRelativePath).toBe('02-transkripsjoner');
    expect(preview.counts).toMatchObject({
      missing: 1,
      complete: 1,
      stale: 1,
      invalid: 1,
      toGenerate: 2,
    });
    expect(preview.items.map((item) => item.transcriptionFileName)).toEqual([
      '00. missing.md',
      '01. complete.md',
      '02. stale.md',
      '03. invalid.txt',
    ]);
  });

  it('generates only missing and invalid summaries and continues after failures', async () => {
    const rootPath = await copyFixtureToTemp();
    await clearFixtureTranscriptionText(rootPath);
    const transcriptionFolder = path.join(rootPath, '02-transkripsjoner');
    await writeFile(path.join(transcriptionFolder, '00. missing.md'), 'Mangler sammendrag.');
    await writeFile(path.join(transcriptionFolder, '01. complete.md'), 'Har sammendrag.');
    await writeFile(path.join(transcriptionFolder, '02. stale.md'), 'Gammelt innhold.');
    await writeFile(path.join(transcriptionFolder, '03. invalid.txt'), 'Ugyldig metadata.');

    await createSummary(rootPath, '02-transkripsjoner/01. complete.md');
    await createSummary(rootPath, '02-transkripsjoner/02. stale.md');
    await writeFile(path.join(transcriptionFolder, '02. stale.md'), 'Oppdatert innhold.');
    await mkdir(
      path.dirname(
        path.join(rootPath, relativeTranscriptionSummaryPath('02-transkripsjoner/03. invalid.txt')),
      ),
      { recursive: true },
    );
    await writeFile(
      path.join(rootPath, relativeTranscriptionSummaryPath('02-transkripsjoner/03. invalid.txt')),
      'not valid metadata',
    );

    const result = await confirmTranscriptionSummaryBatch({
      rootPath,
      reader: readTranscriptionSummary,
      generateSummary: async ({ transcriptionPath }) => {
        const relativePath = path.relative(rootPath, transcriptionPath).split(path.sep).join('/');

        if (relativePath.endsWith('03. invalid.txt')) {
          return {
            status: 'failed',
            message: 'Codex failed.',
          };
        }

        return {
          status: 'complete',
          summary: await writeTranscriptionSummary({
            rootPath,
            transcriptionPath,
            summaryMarkdown: '## Conversation Summary\n\nNytt sammendrag.',
          }),
        };
      },
    });

    expect(result.counts).toEqual({
      total: 4,
      generated: 1,
      failed: 1,
      skippedComplete: 1,
      skippedStale: 1,
    });
    expect(result.items.map((item) => item.status)).toEqual([
      'generated',
      'skipped-complete',
      'skipped-stale',
      'failed',
    ]);
    await expect(
      readTranscriptionSummary(rootPath, '02-transkripsjoner/00. missing.md'),
    ).resolves.toMatchObject({
      status: 'complete',
      conversationSummary: '## Conversation Summary\n\nNytt sammendrag.',
    });
  });
});
