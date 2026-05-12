import { lstat, mkdir } from 'node:fs/promises';
import path from 'node:path';
import type {
  ProjectCreationFolder,
  ProjectCreationRequest,
  RequiredProjectFolderName,
} from '../shared/sidekick-api';

export const REQUIRED_PROJECT_FOLDERS: RequiredProjectFolderName[] = [
  '00. Forutsetninger',
  '01. Transkripsjoner',
];

type CreateProjectFolderOptions = {
  parentPath: string;
  request: ProjectCreationRequest;
};

type CreateProjectFolderResult = {
  rootPath: string;
  rootName: string;
  requiredFolders: ProjectCreationFolder[];
};

const assertAbsoluteParentPath = (parentPath: string) => {
  if (!path.isAbsolute(parentPath)) {
    throw new Error('Choose where the project should be created.');
  }
};

export const validateProjectName = (projectName: string) => {
  const trimmedName = projectName.trim();

  if (!trimmedName) {
    throw new Error('Project name is required.');
  }

  if (
    trimmedName === '.' ||
    trimmedName === '..' ||
    trimmedName.includes('/') ||
    trimmedName.includes('\\') ||
    trimmedName.includes('\0') ||
    path.isAbsolute(trimmedName)
  ) {
    throw new Error('Project name must be a folder name, not a path.');
  }

  return trimmedName;
};

export const getProjectRootPath = (parentPath: string, projectName: string) => {
  assertAbsoluteParentPath(parentPath);

  const rootName = validateProjectName(projectName);
  const parentRoot = path.resolve(parentPath);
  const rootPath = path.resolve(parentRoot, rootName);
  const relativeTarget = path.relative(parentRoot, rootPath);

  // A project name is accepted only as one direct child of the chosen parent;
  // this prevents path traversal and accidental nested creation.
  if (
    !relativeTarget ||
    relativeTarget.startsWith('..') ||
    path.isAbsolute(relativeTarget) ||
    path.dirname(rootPath) !== parentRoot
  ) {
    throw new Error('Project folder must be created inside the selected parent folder.');
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
  name: RequiredProjectFolderName,
): Promise<ProjectCreationFolder> => {
  const folderPath = path.join(rootPath, name);
  const alreadyExists = await pathExists(folderPath);

  await mkdir(folderPath, { recursive: true });

  return {
    name,
    path: folderPath,
    status: alreadyExists ? 'existing' : 'created',
  };
};

export const ensureRequiredProjectFolders = (rootPath: string) =>
  Promise.all(
    REQUIRED_PROJECT_FOLDERS.map((folderName) => createRequiredFolder(rootPath, folderName)),
  );

export const createProjectFolder = async ({
  parentPath,
  request,
}: CreateProjectFolderOptions): Promise<CreateProjectFolderResult> => {
  const rootName = validateProjectName(request.projectName);
  const rootPath = getProjectRootPath(parentPath, rootName);

  if (await pathExists(rootPath)) {
    throw new Error('Project folder already exists.');
  }

  await mkdir(rootPath);

  const requiredFolders = await ensureRequiredProjectFolders(rootPath);

  return {
    rootPath,
    rootName,
    requiredFolders,
  };
};
