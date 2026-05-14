import { randomUUID } from 'node:crypto';
import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  FolderTreeNode,
  WorkspaceScan,
  TranscriptionSummaryBatchCounts,
  TranscriptionSummaryBatchItem,
  TranscriptionSummaryBatchPreview,
  TranscriptionSummaryBatchResult,
  TranscriptionSummaryBatchResultItem,
  TranscriptionSummaryGenerationResult,
} from '../shared/sidekick-api';
import { scanWorkspaceFolder } from './folder-scanner';
import {
  findTranscriptionFolders,
  isAllowedTranscriptionFile,
} from './transcription-importer';

type TranscriptionSummaryGenerator = (request: {
  rootPath: string;
  transcriptionPath: string;
}) => Promise<TranscriptionSummaryGenerationResult>;

type TranscriptionSummaryReader = (
  rootPath: string,
  transcriptionRelativePath: string,
) => Promise<{
  status: 'missing' | 'complete' | 'stale' | 'invalid';
  summaryRelativePath: string;
  message?: string;
}>;

type BatchTarget = {
  scan: WorkspaceScan;
  targetFolder: FolderTreeNode;
  targetFolderPath: string;
};

const ROOT_RELATIVE_PATH = '.';

const isPathInside = (parentPath: string, candidatePath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const normalizeRelativePath = (relativePath: string) => relativePath.split(path.sep).join('/');

const toDiskRelativePath = (relativePath: string) => relativePath.split('/').join(path.sep);

const getSingleTranscriptionFolder = (scan: WorkspaceScan) => {
  const transcriptionFolders = findTranscriptionFolders(scan);

  if (transcriptionFolders.length === 0) {
    throw new Error('No transcription folder was detected in the selected workspace.');
  }

  if (transcriptionFolders.length > 1) {
    throw new Error('Multiple transcription folders were detected in the selected workspace.');
  }

  return transcriptionFolders[0];
};

const resolveBatchTarget = async (rootPath: string): Promise<BatchTarget> => {
  const scan = await scanWorkspaceFolder(rootPath);
  const targetFolder = getSingleTranscriptionFolder(scan);
  const targetFolderPath = path.join(rootPath, toDiskRelativePath(targetFolder.relativePath));

  if (!isPathInside(rootPath, targetFolderPath)) {
    throw new Error('Detected transcription folder is outside the selected workspace.');
  }

  const targetStats = await lstat(targetFolderPath);

  if (!targetStats.isDirectory()) {
    throw new Error('Detected transcription target is not a folder.');
  }

  return { scan, targetFolder, targetFolderPath };
};

const readTranscriptionFileNames = async (targetFolderPath: string) => {
  const entries = await readdir(targetFolderPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => isAllowedTranscriptionFile(fileName))
    .sort((left, right) => left.localeCompare(right, 'nb-NO'));
};

const createCounts = (items: TranscriptionSummaryBatchItem[]): TranscriptionSummaryBatchCounts => {
  const counts = items.reduce(
    (accumulator, item) => ({
      ...accumulator,
      [item.status]: accumulator[item.status] + 1,
    }),
    {
      missing: 0,
      complete: 0,
      stale: 0,
      invalid: 0,
    },
  );

  return {
    total: items.length,
    ...counts,
    toGenerate: counts.missing + counts.invalid,
  };
};

const createPreviewFromTarget = async ({
  rootPath,
  previewId,
  reader,
}: {
  rootPath: string;
  previewId: string;
  reader: TranscriptionSummaryReader;
}): Promise<TranscriptionSummaryBatchPreview> => {
  const target = await resolveBatchTarget(rootPath);
  const fileNames = await readTranscriptionFileNames(target.targetFolderPath);
  const items = await Promise.all(
    fileNames.map(async (fileName): Promise<TranscriptionSummaryBatchItem> => {
      const transcriptionRelativePath =
        target.targetFolder.relativePath === ROOT_RELATIVE_PATH
          ? fileName
          : `${target.targetFolder.relativePath}/${fileName}`;
      const summary = await reader(rootPath, transcriptionRelativePath);

      return {
        transcriptionRelativePath: normalizeRelativePath(transcriptionRelativePath),
        transcriptionFileName: fileName,
        status: summary.status,
        summaryRelativePath: summary.summaryRelativePath,
        message: summary.message,
      };
    }),
  );

  return {
    previewId,
    rootPath,
    targetFolderPath: target.targetFolderPath,
    targetFolderRelativePath: target.targetFolder.relativePath,
    counts: createCounts(items),
    items,
    warnings: [],
  };
};

export const createTranscriptionSummaryBatchPreview = (
  rootPath: string,
  reader: TranscriptionSummaryReader,
  previewId = randomUUID(),
) => createPreviewFromTarget({ rootPath, reader, previewId });

const resultCounts = (items: TranscriptionSummaryBatchResultItem[]) => ({
  total: items.length,
  generated: items.filter((item) => item.status === 'generated').length,
  failed: items.filter((item) => item.status === 'failed').length,
  skippedComplete: items.filter((item) => item.status === 'skipped-complete').length,
  skippedStale: items.filter((item) => item.status === 'skipped-stale').length,
});

export const confirmTranscriptionSummaryBatch = async ({
  rootPath,
  reader,
  generateSummary,
}: {
  rootPath: string;
  reader: TranscriptionSummaryReader;
  generateSummary: TranscriptionSummaryGenerator;
}): Promise<TranscriptionSummaryBatchResult> => {
  const preview = await createTranscriptionSummaryBatchPreview(rootPath, reader);
  const items: TranscriptionSummaryBatchResultItem[] = [];

  for (const item of preview.items) {
    if (item.status === 'complete') {
      items.push({
        transcriptionRelativePath: item.transcriptionRelativePath,
        transcriptionFileName: item.transcriptionFileName,
        status: 'skipped-complete',
        message: 'Eksisterende sammendrag ble beholdt.',
      });
      continue;
    }

    if (item.status === 'stale') {
      items.push({
        transcriptionRelativePath: item.transcriptionRelativePath,
        transcriptionFileName: item.transcriptionFileName,
        status: 'skipped-stale',
        message: 'Utdatert sammendrag ble ikke regenerert i denne versjonen.',
      });
      continue;
    }

    const transcriptionPath = path.join(rootPath, toDiskRelativePath(item.transcriptionRelativePath));

    if (!isPathInside(rootPath, transcriptionPath)) {
      items.push({
        transcriptionRelativePath: item.transcriptionRelativePath,
        transcriptionFileName: item.transcriptionFileName,
        status: 'failed',
        message: 'Transkripsjonen ligger utenfor valgt arbeidsområde.',
      });
      continue;
    }

    const result = await generateSummary({ rootPath, transcriptionPath });

    if (result.status === 'complete') {
      items.push({
        transcriptionRelativePath: item.transcriptionRelativePath,
        transcriptionFileName: item.transcriptionFileName,
        status: 'generated',
        summary: result.summary,
      });
      continue;
    }

    items.push({
      transcriptionRelativePath: item.transcriptionRelativePath,
      transcriptionFileName: item.transcriptionFileName,
      status: 'failed',
      message: result.message,
    });
  }

  return {
    status: 'complete',
    rootPath,
    targetFolderPath: preview.targetFolderPath,
    targetFolderRelativePath: preview.targetFolderRelativePath,
    counts: resultCounts(items),
    items,
    scan: await scanWorkspaceFolder(rootPath),
  };
};
