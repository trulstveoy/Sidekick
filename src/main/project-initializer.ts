import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  ProjectCreationFolder,
  ProjectInitializationPreview,
  ProjectInitializationWarning,
  RequiredProjectFolderName,
} from '../shared/sidekick-api';
import { ensureRequiredProjectFolders, REQUIRED_PROJECT_FOLDERS } from './project-creator';

const SIMILAR_FOLDER_TERMS = [
  'transkrips',
  'transkrib',
  'transcript',
  'forutset',
  'assumption',
];

type DirectoryEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
};

const assertAbsoluteDirectory = async (rootPath: string) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) {
    throw new Error('Choose an existing project folder.');
  }

  const stats = await lstat(rootPath);

  if (!stats.isDirectory()) {
    throw new Error('Choose a project folder, not a file.');
  }
};

const readDirectoryEntries = async (rootPath: string): Promise<DirectoryEntry[]> => {
  const entries = await readdir(rootPath, { withFileTypes: true });

  return entries.map((entry) => ({
    name: entry.name,
    path: path.join(rootPath, entry.name),
    isDirectory: entry.isDirectory(),
  }));
};

const requiredFolderExists = async (rootPath: string, folderName: RequiredProjectFolderName) => {
  try {
    const stats = await lstat(path.join(rootPath, folderName));

    return stats.isDirectory();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const normalizeFolderName = (name: string) => name.toLocaleLowerCase('nb-NO');

const findSimilarFolderWarnings = (
  rootPath: string,
  entries: DirectoryEntry[],
  missingRequiredFolders: RequiredProjectFolderName[],
): ProjectInitializationWarning[] => {
  if (missingRequiredFolders.length === 0) {
    return [];
  }

  const requiredFolderSet = new Set(REQUIRED_PROJECT_FOLDERS);

  return entries
    .filter((entry) => entry.isDirectory)
    .filter((entry) => !requiredFolderSet.has(entry.name as RequiredProjectFolderName))
    .filter((entry) => {
      const normalizedName = normalizeFolderName(entry.name);

      return SIMILAR_FOLDER_TERMS.some((term) => normalizedName.includes(term));
    })
    .map((entry) => ({
      path: path.relative(rootPath, entry.path) || entry.name,
      message:
        'This folder looks similar to a required project folder, but Sidekick requires the exact folder name.',
    }));
};

export const createProjectInitializationPreview = async (
  rootPath: string,
  previewId = randomUUID(),
): Promise<ProjectInitializationPreview> => {
  await assertAbsoluteDirectory(rootPath);

  const entries = await readDirectoryEntries(rootPath);
  const requiredFolders = await Promise.all(
    REQUIRED_PROJECT_FOLDERS.map(async (folderName) => ({
      name: folderName,
      path: path.join(rootPath, folderName),
      status: (await requiredFolderExists(rootPath, folderName)) ? ('existing' as const) : ('missing' as const),
    })),
  );
  const missingRequiredFolders = requiredFolders
    .filter((folder) => folder.status === 'missing')
    .map((folder) => folder.name);

  return {
    previewId,
    rootPath,
    rootName: path.basename(rootPath),
    requiredFolders,
    existingEntryCount: entries.length,
    warnings: findSimilarFolderWarnings(rootPath, entries, missingRequiredFolders),
  };
};

export const confirmProjectInitialization = async (
  rootPath: string,
): Promise<{
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectCreationFolder[];
}> => {
  await assertAbsoluteDirectory(rootPath);

  const requiredFolders = await ensureRequiredProjectFolders(rootPath);

  return {
    rootPath,
    rootName: path.basename(rootPath),
    requiredFolders,
  };
};
