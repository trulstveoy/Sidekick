import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type {
  ContextPackagePreview,
  ContextPackageResult,
  ContextPackageSkippedFile,
  ContextPackageWarning,
  FolderContextPackageRequest,
  ProjectSummaryGenerationResult,
} from '../shared/sidekick-api';
import { CodexRunner } from './codex-runner';
import { scanProjectFolder } from './folder-scanner';
import { writeProjectInfo } from './project-info';
import {
  createFailedProjectSummaryResult,
  generateProjectSummaryMarkdown,
} from './project-summary';
import { runRepomixContextPackage } from './repomix-runner';

export const CONTEXT_PACKAGE_SUFFIX = 'context-package.md';

export const CONTEXT_PACKAGE_IGNORE_PATTERNS = [
  // Generated packages must never include previous package output; otherwise
  // repeated generation recursively grows the context file.
  '*.context-package.md',
  '**/*.context-package.md',
  '*context-package*',
  '**/*context-package*',
  '.git/**',
  'node_modules/**',
  'out/**',
  'dist/**',
  '.vite/**',
  '.cache/**',
  '.sidekick/**',
];

export const BINARY_FILE_WARNING =
  'Binary files such as PDF, DOCX, PPTX, images, audio, and video are not included as full text content.';

export const SELF_IGNORE_WARNING =
  'Generated context-package files are ignored during generation.';

const INVALID_FILENAME_CHARACTERS = new Set(['<', '>', ':', '"', '/', '\\', '|', '?', '*']);
const ROOT_RELATIVE_PATH = '.';
const NUMERIC_FOLDER_PREFIX_PATTERN = /^\d+\.\s*/;

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
  // The output filename is derived from the project folder, but it still has to
  // be safe on Windows because release builds target Windows first.
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

export const createFolderContextPackageFileName = (folderName: string) => {
  const safeFolderName = Array.from(folderName.replace(NUMERIC_FOLDER_PREFIX_PATTERN, ''))
    .map((character) =>
      character.charCodeAt(0) < 32 || INVALID_FILENAME_CHARACTERS.has(character)
        ? '-'
        : character,
    )
    .join('')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/[. -]+$/g, '')
    .replace(/^-+/g, '')
    .trim();

  return `${safeFolderName || 'folder'}.${CONTEXT_PACKAGE_SUFFIX}`;
};

export const getContextPackageOutputPath = (rootPath: string) =>
  path.join(rootPath, createContextPackageFileName(rootPath));

export const calculateFileSha256 = async (filePath: string) => {
  const contents = await readFile(filePath);

  return createHash('sha256').update(contents).digest('hex');
};

export const getFolderContextPackageOutputPath = (folderPath: string) =>
  path.join(folderPath, createFolderContextPackageFileName(path.basename(folderPath)));

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

const assertRelativeFolderPath = (folderRelativePath: string) => {
  if (typeof folderRelativePath !== 'string' || folderRelativePath.trim() === '') {
    throw new Error('A selected folder path is required.');
  }

  if (folderRelativePath === ROOT_RELATIVE_PATH) {
    throw new Error('Use the full-project context package action for the project root.');
  }

  if (path.isAbsolute(folderRelativePath)) {
    throw new Error('Selected folder path must be relative to the project root.');
  }

  const normalized = folderRelativePath.replace(/\\/g, '/');
  const segments = normalized.split('/');

  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    throw new Error('Selected folder path must stay inside the project root.');
  }

  return normalized;
};

const isPathInside = (parentPath: string, childPath: string) => {
  const relativePath = path.relative(parentPath, childPath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const resolveFolderContextPackageTarget = async ({
  rootPath,
  folderRelativePath,
}: FolderContextPackageRequest) => {
  assertAbsoluteRootPath(rootPath);
  await assertReadableDirectory(rootPath);

  const normalizedRelativePath = assertRelativeFolderPath(folderRelativePath);
  const folderPath = path.resolve(rootPath, ...normalizedRelativePath.split('/'));

  if (!isPathInside(rootPath, folderPath)) {
    throw new Error('Selected folder must stay inside the project root.');
  }

  await assertReadableDirectory(folderPath);

  const outputPath = getFolderContextPackageOutputPath(folderPath);

  if (!isPathInside(folderPath, outputPath)) {
    throw new Error('Context package output must stay inside the selected folder.');
  }

  return {
    rootPath,
    folderPath,
    folderRelativePath: normalizedRelativePath,
    outputPath,
  };
};

export const getContextPackagePreview = async (
  rootPath: string,
): Promise<ContextPackagePreview> => {
  assertAbsoluteRootPath(rootPath);
  await assertReadableDirectory(rootPath);

  const outputPath = getContextPackageOutputPath(rootPath);

  return {
    scope: 'project',
    rootPath,
    targetPath: rootPath,
    targetRelativePath: ROOT_RELATIVE_PATH,
    outputPath,
    outputFileName: path.basename(outputPath),
    willOverwrite: await pathExists(outputPath),
    binaryFileWarning: BINARY_FILE_WARNING,
    selfIgnoreWarning: SELF_IGNORE_WARNING,
  };
};

export const getFolderContextPackagePreview = async (
  request: FolderContextPackageRequest,
): Promise<ContextPackagePreview> => {
  const target = await resolveFolderContextPackageTarget(request);

  return {
    scope: 'folder',
    rootPath: target.rootPath,
    targetPath: target.folderPath,
    targetRelativePath: target.folderRelativePath,
    outputPath: target.outputPath,
    outputFileName: path.basename(target.outputPath),
    willOverwrite: await pathExists(target.outputPath),
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

type GenerateContextPackageOptions = {
  codexRunner?: CodexRunner;
  generateProjectSummary?: boolean;
};

const generateProjectSummary = async (
  rootPath: string,
  contextPackagePath: string,
  codexRunner: CodexRunner,
): Promise<ProjectSummaryGenerationResult> => {
  const contextPackageSha256 = await calculateFileSha256(contextPackagePath);

  try {
    const summary = await generateProjectSummaryMarkdown({
      rootPath,
      contextPackagePath,
      codexRunner,
    });
    const projectInfo = await writeProjectInfo({
      rootPath,
      contextPackagePath,
      contextPackageSha256,
      summaryMarkdown: summary.markdown,
    });

    return {
      status: 'complete',
      projectInfo,
    };
  } catch (error) {
    return createFailedProjectSummaryResult(
      rootPath,
      error instanceof Error ? error.message : 'Project summary generation failed.',
    );
  }
};

export const generateContextPackage = async (
  rootPath: string,
  options: GenerateContextPackageOptions = {},
): Promise<ContextPackageResult> => {
  const preview = await getContextPackagePreview(rootPath);
  const { packResult } = await runRepomixContextPackage({
    rootPath,
    outputPath: preview.outputPath,
    ignorePatterns: CONTEXT_PACKAGE_IGNORE_PATTERNS,
  });

  const outputStats = await stat(preview.outputPath);
  const shouldGenerateProjectSummary = options.generateProjectSummary ?? true;
  const projectSummary = shouldGenerateProjectSummary
    ? await generateProjectSummary(
        rootPath,
        preview.outputPath,
        options.codexRunner ?? new CodexRunner(),
      )
    : undefined;
  const scan = await scanProjectFolder(rootPath);

  return {
    status: 'complete',
    scope: 'project',
    rootPath,
    targetPath: rootPath,
    targetRelativePath: ROOT_RELATIVE_PATH,
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
    projectSummary,
    scan,
  };
};

export const generateFolderContextPackage = async (
  request: FolderContextPackageRequest,
): Promise<ContextPackageResult> => {
  const preview = await getFolderContextPackagePreview(request);
  const { packResult } = await runRepomixContextPackage({
    rootPath: preview.targetPath,
    outputPath: preview.outputPath,
    ignorePatterns: CONTEXT_PACKAGE_IGNORE_PATTERNS,
  });

  const outputStats = await stat(preview.outputPath);
  const scan = await scanProjectFolder(preview.rootPath);

  return {
    status: 'complete',
    scope: 'folder',
    rootPath: preview.rootPath,
    targetPath: preview.targetPath,
    targetRelativePath: preview.targetRelativePath,
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
    scan,
  };
};
