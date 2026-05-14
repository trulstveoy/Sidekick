import { lstat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  WorkspaceCreationFolder,
  WorkspaceCreationRequest,
  RequiredWorkspaceFolderName,
} from '../shared/sidekick-api';

export const REQUIRED_WORKSPACE_FOLDERS: RequiredWorkspaceFolderName[] = [
  '00. Forutsetninger',
  '01. Notater',
  '02. Transkripsjoner',
];

type CreateWorkspaceFolderOptions = {
  parentPath: string;
  request: WorkspaceCreationRequest;
};

type CreateWorkspaceFolderResult = {
  rootPath: string;
  rootName: string;
  requiredFolders: WorkspaceCreationFolder[];
};

const assertAbsoluteParentPath = (parentPath: string) => {
  if (!path.isAbsolute(parentPath)) {
    throw new Error('Choose where the workspace should be created.');
  }
};

export const validateWorkspaceName = (workspaceName: string) => {
  const trimmedName = workspaceName.trim();

  if (!trimmedName) {
    throw new Error('Workspace name is required.');
  }

  if (
    trimmedName === '.' ||
    trimmedName === '..' ||
    trimmedName.includes('/') ||
    trimmedName.includes('\\') ||
    trimmedName.includes('\0') ||
    path.isAbsolute(trimmedName)
  ) {
    throw new Error('Workspace name must be a folder name, not a path.');
  }

  return trimmedName;
};

export const getWorkspaceRootPath = (parentPath: string, workspaceName: string) => {
  assertAbsoluteParentPath(parentPath);

  const rootName = validateWorkspaceName(workspaceName);
  const parentRoot = path.resolve(parentPath);
  const rootPath = path.resolve(parentRoot, rootName);
  const relativeTarget = path.relative(parentRoot, rootPath);

  // A workspace name is accepted only as one direct child of the chosen parent;
  // this prevents path traversal and accidental nested creation.
  if (
    !relativeTarget ||
    relativeTarget.startsWith('..') ||
    path.isAbsolute(relativeTarget) ||
    path.dirname(rootPath) !== parentRoot
  ) {
    throw new Error('Workspace must be created inside the selected parent folder.');
  }

  return rootPath;
};

const pathExists = async (targetPath: string) => {
  try {
    await lstat(targetPath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const createRequiredFolder = async (
  rootPath: string,
  name: RequiredWorkspaceFolderName,
): Promise<WorkspaceCreationFolder> => {
  const folderPath = path.join(rootPath, name);
  const alreadyExists = await pathExists(folderPath);

  await mkdir(folderPath, { recursive: true });

  return {
    name,
    path: folderPath,
    status: alreadyExists ? 'existing' : 'created',
  };
};

export const ensureRequiredWorkspaceFolders = (rootPath: string) =>
  Promise.all(
    REQUIRED_WORKSPACE_FOLDERS.map((folderName) => createRequiredFolder(rootPath, folderName)),
  );

export const createWorkspaceFolder = async ({
  parentPath,
  request,
}: CreateWorkspaceFolderOptions): Promise<CreateWorkspaceFolderResult> => {
  const rootName = validateWorkspaceName(request.workspaceName);
  const rootPath = getWorkspaceRootPath(parentPath, rootName);

  if (await pathExists(rootPath)) {
    throw new Error('Arbeidsområdet finnes allerede.');
  }

  await mkdir(rootPath);

  const requiredFolders = await ensureRequiredWorkspaceFolders(rootPath);

  return {
    rootPath,
    rootName,
    requiredFolders,
  };
};
