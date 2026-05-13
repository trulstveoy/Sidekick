import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type {
  ContextPackagePreview,
  ContextPackageResult,
  ContextPackageSkippedFile,
  ContextPackageWarning,
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
  '*context-package*',
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

export const getContextPackageOutputPath = (rootPath: string) =>
  path.join(rootPath, createContextPackageFileName(rootPath));

export const calculateFileSha256 = async (filePath: string) => {
  const contents = await readFile(filePath);

  return createHash('sha256').update(contents).digest('hex');
};

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

type GenerateContextPackageOptions = {
  codexRunner?: CodexRunner;
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
  const projectSummary = await generateProjectSummary(
    rootPath,
    preview.outputPath,
    options.codexRunner ?? new CodexRunner(),
  );
  const scan = await scanProjectFolder(rootPath);

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
    projectSummary,
    scan,
  };
};
