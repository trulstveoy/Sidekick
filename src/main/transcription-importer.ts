import { constants as fsConstants } from 'node:fs';
import { copyFile, lstat, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  FolderTreeNode,
  ProjectFolderScan,
  TranscriptionImportNumbering,
  TranscriptionImportPreview,
  TranscriptionImportResult,
} from '../shared/sidekick-api';
import { scanProjectFolder } from './folder-scanner';

const ALLOWED_TRANSCRIPTION_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);
const STRICT_NUMBER_SEPARATOR = '. ';
const STRICT_NUMBER_WIDTH = 2;
const FIRST_STRICT_NUMBER = 0;
const NUMBERED_PREFIX_PATTERN = /^(\d+)(?:\. |[\s_-]+)(.+)$/;
const STRICT_NUMBERED_PREFIX_PATTERN = /^(\d{2})\. (.+)$/;

type NumberedFileName = {
  fileName: string;
  number: number;
};

type TranscriptionDestination = {
  destinationFileName: string;
  finalNumber: number;
  numbering: TranscriptionImportNumbering;
};

const isFolderNode = (node: FolderTreeNode) => node.kind === 'folder';

const getChildren = (node: FolderTreeNode) => node.children ?? [];

const normalizeRelativePath = (relativePath: string) => relativePath.split('/').join(path.sep);

const isPathInside = (parentPath: string, candidatePath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

export const isAllowedTranscriptionFile = (filePath: string) =>
  ALLOWED_TRANSCRIPTION_EXTENSIONS.has(path.extname(filePath).toLowerCase());

export const stripLeadingNumberPrefix = (fileName: string) => {
  const match = NUMBERED_PREFIX_PATTERN.exec(fileName);

  return match?.[2] ? match[2] : fileName;
};

const parseNumberedFileName = (fileName: string): NumberedFileName | null => {
  const match = STRICT_NUMBERED_PREFIX_PATTERN.exec(fileName);

  if (!match) {
    return null;
  }

  const [, numberText] = match;
  const number = Number.parseInt(numberText, 10);

  if (!Number.isSafeInteger(number)) {
    return null;
  }

  return {
    fileName,
    number,
  };
};

export const detectNumberingConvention = (fileNames: string[]): TranscriptionImportNumbering => {
  const numberedNames = fileNames
    .map(parseNumberedFileName)
    .filter((value): value is NumberedFileName => Boolean(value));

  if (numberedNames.length === 0) {
    return {
      nextNumber: FIRST_STRICT_NUMBER,
      width: STRICT_NUMBER_WIDTH,
      separator: STRICT_NUMBER_SEPARATOR,
      inferredFromExistingFiles: false,
    };
  }

  return {
    nextNumber: Math.max(...numberedNames.map((fileName) => fileName.number)) + 1,
    width: STRICT_NUMBER_WIDTH,
    separator: STRICT_NUMBER_SEPARATOR,
    inferredFromExistingFiles: true,
  };
};

const formatNumber = (value: number, width: number) => value.toString().padStart(width, '0');

export const createTranscriptionDestination = (
  sourceFileName: string,
  targetFileNames: string[],
): TranscriptionDestination => {
  const sourceBaseName = stripLeadingNumberPrefix(sourceFileName);
  const targetFileNameSet = new Set(targetFileNames);
  const convention = detectNumberingConvention(targetFileNames);
  let nextNumber = convention.nextNumber;
  let destinationFileName = '';

  do {
    destinationFileName = `${formatNumber(nextNumber, convention.width)}${convention.separator}${sourceBaseName}`;
    nextNumber += 1;
  } while (targetFileNameSet.has(destinationFileName));

  const finalNumber = nextNumber - 1;

  return {
    destinationFileName,
    finalNumber,
    numbering: {
      ...convention,
      nextNumber: finalNumber,
    },
  };
};

export const findTranscriptionFolders = (scan: ProjectFolderScan) => {
  const transcriptionFolders: FolderTreeNode[] = [];

  const visit = (node: FolderTreeNode) => {
    if (
      isFolderNode(node) &&
      node.relativePath !== '.' &&
      node.folderSignals?.includes('transcript')
    ) {
      transcriptionFolders.push(node);
    }

    getChildren(node).forEach(visit);
  };

  visit(scan.tree);

  return transcriptionFolders;
};

const assertAllowedSourceFile = async (sourcePath: string) => {
  if (!path.isAbsolute(sourcePath)) {
    throw new Error('Choose an absolute transcription file path.');
  }

  if (!isAllowedTranscriptionFile(sourcePath)) {
    throw new Error('Choose a .txt, .md, or .markdown transcription file.');
  }

  const sourceStats = await lstat(sourcePath);

  if (!sourceStats.isFile()) {
    throw new Error('Choose a transcription file, not a folder.');
  }
};

const getSingleTranscriptionFolder = (scan: ProjectFolderScan) => {
  const transcriptionFolders = findTranscriptionFolders(scan);

  if (transcriptionFolders.length === 0) {
    throw new Error('No transcription folder was detected in the selected project.');
  }

  if (transcriptionFolders.length > 1) {
    throw new Error('Multiple transcription folders were detected in the selected project.');
  }

  return transcriptionFolders[0];
};

const readTargetFileNames = async (targetFolderPath: string) => {
  const entries = await readdir(targetFolderPath, { withFileTypes: true });

  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
};

const getTargetFolderPath = async (rootPath: string, targetFolder: FolderTreeNode) => {
  const targetFolderPath = path.join(rootPath, normalizeRelativePath(targetFolder.relativePath));

  if (!isPathInside(rootPath, targetFolderPath)) {
    throw new Error('Detected transcription folder is outside the selected project.');
  }

  const targetStats = await lstat(targetFolderPath);

  if (!targetStats.isDirectory()) {
    throw new Error('Detected transcription target is not a folder.');
  }

  return targetFolderPath;
};

export const createTranscriptionImportPreview = async (
  rootPath: string,
  sourcePath: string,
  previewId = randomUUID(),
): Promise<TranscriptionImportPreview> => {
  await assertAllowedSourceFile(sourcePath);

  const scan = await scanProjectFolder(rootPath);
  const targetFolder = getSingleTranscriptionFolder(scan);
  const targetFolderPath = await getTargetFolderPath(rootPath, targetFolder);
  const targetFileNames = await readTargetFileNames(targetFolderPath);
  const destination = createTranscriptionDestination(path.basename(sourcePath), targetFileNames);
  const destinationPath = path.join(targetFolderPath, destination.destinationFileName);

  if (!isPathInside(targetFolderPath, destinationPath)) {
    throw new Error('Generated transcription destination is outside the target folder.');
  }

  return {
    previewId,
    rootPath,
    sourcePath,
    sourceFileName: path.basename(sourcePath),
    targetFolderPath,
    targetFolderRelativePath: targetFolder.relativePath,
    destinationPath,
    destinationFileName: destination.destinationFileName,
    numbering: destination.numbering,
    warnings: [],
  };
};

const copyWithoutOverwrite = async (
  sourcePath: string,
  targetFolderPath: string,
  sourceFileName: string,
) => {
  let targetFileNames = await readTargetFileNames(targetFolderPath);

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const destination = createTranscriptionDestination(sourceFileName, targetFileNames);
    const destinationPath = path.join(targetFolderPath, destination.destinationFileName);

    if (!isPathInside(targetFolderPath, destinationPath)) {
      throw new Error('Generated transcription destination is outside the target folder.');
    }

    try {
      await copyFile(sourcePath, destinationPath, fsConstants.COPYFILE_EXCL);

      return {
        ...destination,
        destinationPath,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }

      targetFileNames = await readTargetFileNames(targetFolderPath);
    }
  }

  throw new Error('Unable to find an available destination filename.');
};

export const confirmTranscriptionImport = async (
  preview: TranscriptionImportPreview,
): Promise<TranscriptionImportResult> => {
  await assertAllowedSourceFile(preview.sourcePath);

  const scanBeforeCopy = await scanProjectFolder(preview.rootPath);
  const targetFolder = getSingleTranscriptionFolder(scanBeforeCopy);
  const targetFolderPath = await getTargetFolderPath(preview.rootPath, targetFolder);
  const copied = await copyWithoutOverwrite(
    preview.sourcePath,
    targetFolderPath,
    preview.sourceFileName,
  );
  const copiedStats = await stat(copied.destinationPath);
  const scan = await scanProjectFolder(preview.rootPath);

  return {
    status: 'complete',
    rootPath: preview.rootPath,
    sourcePath: preview.sourcePath,
    sourceFileName: preview.sourceFileName,
    targetFolderPath,
    targetFolderRelativePath: targetFolder.relativePath,
    destinationPath: copied.destinationPath,
    destinationFileName: copied.destinationFileName,
    finalNumber: copied.finalNumber,
    copiedBytes: copiedStats.size,
    scan,
  };
};
