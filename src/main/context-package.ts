import { stat } from 'node:fs/promises';
import path from 'node:path';
import { runCli } from 'repomix';
import type {
  ContextPackagePreview,
  ContextPackageResult,
  ContextPackageSkippedFile,
  ContextPackageWarning,
} from '../shared/sidekick-api';

export const CONTEXT_PACKAGE_SUFFIX = 'context-package.md';

export const CONTEXT_PACKAGE_IGNORE_PATTERNS = [
  '*.context-package.md',
  '*context-package*',
  '.git/**',
  'node_modules/**',
  'out/**',
  'dist/**',
  '.vite/**',
  '.cache/**',
];

export const BINARY_FILE_WARNING =
  'Binary files such as PDF, DOCX, PPTX, images, audio, and video are not included as full text content.';

export const SELF_IGNORE_WARNING =
  'Generated context-package files are ignored during generation.';

const INVALID_FILENAME_CHARACTERS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);

const assertAbsoluteRootPath = (rootPath: string) => {
  if (typeof rootPath !== 'string' || rootPath.trim() === '') {
    throw new Error('A project folder path is required.');
  }

  if (!path.isAbsolute(rootPath)) {
    throw new Error('Project folder path must be absolute.');
  }
};

export const createContextPackageFileName = (rootPath: string) => {
  const projectName = path.basename(rootPath);
  const safeProjectName = Array.from(projectName)
    .map((character) =>
      character.charCodeAt(0) < 32 || INVALID_FILENAME_CHARACTERS.has(character)
        ? '-'
        : character,
    )
    .join('')
    .replace(/[. ]+$/g, '')
    .trim();

  return `${safeProjectName || 'project'}.${CONTEXT_PACKAGE_SUFFIX}`;
};

export const getContextPackageOutputPath = (rootPath: string) =>
  path.join(rootPath, createContextPackageFileName(rootPath));

const pathExists = async (targetPath: string) => {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
};

const assertReadableDirectory = async (rootPath: string) => {
  const stats = await stat(rootPath);

  if (!stats.isDirectory()) {
    throw new Error('Project folder path must point to a directory.');
  }
};

export const getContextPackagePreview = async (
  rootPath: string,
): Promise<ContextPackagePreview> => {
  assertAbsoluteRootPath(rootPath);
  await assertReadableDirectory(rootPath);

  const outputPath = getContextPackageOutputPath(rootPath);

  return {
    rootPath,
    outputPath,
    outputFileName: path.basename(outputPath),
    willOverwrite: await pathExists(outputPath),
    binaryFileWarning: BINARY_FILE_WARNING,
    selfIgnoreWarning: SELF_IGNORE_WARNING,
  };
};

const toSkippedFiles = (
  skippedFiles: Array<{ path: string; reason: string }>,
): ContextPackageSkippedFile[] =>
  skippedFiles.map((file) => ({
    path: file.path,
    reason: file.reason,
  }));

const toWarnings = (
  suspiciousFilesResults: Array<{ filePath: string; messages: string[] }>,
): ContextPackageWarning[] =>
  suspiciousFilesResults.flatMap((result) =>
    result.messages.map((message) => ({
      path: result.filePath,
      message,
    })),
  );

export const generateContextPackage = async (
  rootPath: string,
): Promise<ContextPackageResult> => {
  const preview = await getContextPackagePreview(rootPath);
  const result = await runCli(['.'], rootPath, {
    output: preview.outputPath,
    style: 'markdown',
    compress: false,
    quiet: true,
    copy: false,
    securityCheck: true,
    gitignore: true,
    dotIgnore: true,
    defaultPatterns: true,
    ignore: CONTEXT_PACKAGE_IGNORE_PATTERNS.join(','),
  });

  if (!result || !('packResult' in result)) {
    throw new Error('Context package generation did not return a package result.');
  }

  const outputStats = await stat(preview.outputPath);
  const { packResult } = result;

  return {
    status: 'complete',
    rootPath,
    outputPath: preview.outputPath,
    outputFileName: preview.outputFileName,
    overwritten: preview.willOverwrite,
    totalFiles: packResult.totalFiles,
    totalCharacters: packResult.totalCharacters,
    totalTokens: packResult.totalTokens,
    outputBytes: outputStats.size,
    processedFiles: packResult.processedFiles.map((file) => file.path).sort(),
    skippedFiles: toSkippedFiles(packResult.skippedFiles),
    warnings: toWarnings(packResult.suspiciousFilesResults),
  };
};
