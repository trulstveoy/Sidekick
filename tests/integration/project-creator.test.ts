import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createProjectFolder,
  ensureRequiredProjectFolders,
  getProjectRootPath,
  REQUIRED_PROJECT_FOLDERS,
  validateProjectName,
} from '../../src/main/project-creator';

let parentPath: string;

beforeEach(async () => {
  parentPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-project-creator-'));
});

afterEach(async () => {
  await rm(parentPath, { recursive: true, force: true });
});

describe('project creator', () => {
  it('creates a project root with the required folders', async () => {
    const result = await createProjectFolder({
      parentPath,
      request: { projectName: 'My Project', parentPath },
    });

    expect(result.rootName).toBe('My Project');
    expect(result.rootPath).toBe(path.join(parentPath, 'My Project'));
    expect(result.requiredFolders.map((folder) => folder.name)).toEqual(REQUIRED_PROJECT_FOLDERS);
    expect(result.requiredFolders.every((folder) => folder.status === 'created')).toBe(true);
    await expect(readdir(result.rootPath)).resolves.toEqual(REQUIRED_PROJECT_FOLDERS);
  });

  it('rejects an existing target project folder', async () => {
    await createProjectFolder({
      parentPath,
      request: { projectName: 'Existing Project', parentPath },
    });

    await expect(
      createProjectFolder({
        parentPath,
        request: { projectName: 'Existing Project', parentPath },
      }),
    ).rejects.toThrow('Project folder already exists.');
  });

  it('treats existing required folders as satisfied during recovery', async () => {
    const rootPath = path.join(parentPath, 'Recovered Project');
    await createProjectFolder({
      parentPath,
      request: { projectName: 'Recovered Project', parentPath },
    });

    const result = await ensureRequiredProjectFolders(rootPath);

    expect(result.map((folder) => folder.status)).toEqual(['existing', 'existing']);
  });

  it('rejects project names that are paths', () => {
    expect(() => validateProjectName('../outside')).toThrow(
      'Project name must be a folder name, not a path.',
    );
    expect(() => validateProjectName('nested/project')).toThrow(
      'Project name must be a folder name, not a path.',
    );
  });

  it('rejects empty project names', () => {
    expect(() => validateProjectName('   ')).toThrow('Project name is required.');
  });

  it('keeps the project root inside the selected parent folder', () => {
    expect(getProjectRootPath(parentPath, 'Safe Project')).toBe(
      path.join(parentPath, 'Safe Project'),
    );
  });
});
