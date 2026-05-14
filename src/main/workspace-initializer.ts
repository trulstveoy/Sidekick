import { lstat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  WorkspaceCreationFolder,
  WorkspaceInitializationPreview,
  WorkspaceInitializationWarning,
  RequiredWorkspaceFolderName,
} from '../shared/sidekick-api';
import { ensureRequiredWorkspaceFolders, REQUIRED_WORKSPACE_FOLDERS } from './workspace-creator';

const SIMILAR_FOLDER_TERMS = [
  'transkrips',
  'transkrib',
  'transcript',
  'forutset',
  'assumption',
  'notat',
  'note',
];

type DirectoryEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
};

const assertAbsoluteDirectory = async (rootPath: string) => {
  if (typeof rootPath !== 'string' || !path.isAbsolute(rootPath)) {
    throw new Error('Choose an existing workspace.');
  }

  const stats = await lstat(rootPath);

  if (!stats.isDirectory()) {
    throw new Error('Choose a workspace, not a file.');
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

const requiredFolderExists = async (rootPath: string, folderName: RequiredWorkspaceFolderName) => {
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
  missingRequiredFolders: RequiredWorkspaceFolderName[],
): WorkspaceInitializationWarning[] => {
  if (missingRequiredFolders.length === 0) {
    return [];
  }

  const requiredFolderSet = new Set(REQUIRED_WORKSPACE_FOLDERS);

  return entries
    .filter((entry) => entry.isDirectory)
    .filter((entry) => !requiredFolderSet.has(entry.name as RequiredWorkspaceFolderName))
    .filter((entry) => {
      const normalizedName = normalizeFolderName(entry.name);

      return SIMILAR_FOLDER_TERMS.some((term) => normalizedName.includes(term));
    })
    .map((entry) => ({
      path: path.relative(rootPath, entry.path) || entry.name,
      // Similar names are warnings only. Initialization still requires the exact
      // standard folder names so later workflows have predictable targets.
      message:
        'This folder looks similar to a required workspace, but Sidekick requires the exact folder name.',
    }));
};

export const createWorkspaceInitializationPreview = async (
  rootPath: string,
  previewId = randomUUID(),
): Promise<WorkspaceInitializationPreview> => {
  await assertAbsoluteDirectory(rootPath);

  const entries = await readDirectoryEntries(rootPath);
  const requiredFolders = await Promise.all(
    REQUIRED_WORKSPACE_FOLDERS.map(async (folderName) => ({
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

export const confirmWorkspaceInitialization = async (
  rootPath: string,
): Promise<{
  rootPath: string;
  rootName: string;
  requiredFolders: WorkspaceCreationFolder[];
}> => {
  await assertAbsoluteDirectory(rootPath);

  const requiredFolders = await ensureRequiredWorkspaceFolders(rootPath);

  return {
    rootPath,
    rootName: path.basename(rootPath),
    requiredFolders,
  };
};
