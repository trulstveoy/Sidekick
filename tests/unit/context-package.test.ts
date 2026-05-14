import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_PACKAGE_IGNORE_PATTERNS,
  createContextPackageFileName,
  createFolderContextPackageFileName,
  getFolderContextPackageOutputPath,
  getContextPackageOutputPath,
} from '../../src/main/context-package';

describe('context package helpers', () => {
  it('creates a context package filename from the workspace name', () => {
    expect(createContextPackageFileName(path.join('/tmp', 'My Workspace'))).toBe(
      'My Workspace.context-package.md',
    );
  });

  it('sanitizes characters that are unsafe in filenames', () => {
    expect(createContextPackageFileName(path.join('/tmp', 'Bad<Name>|Workspace'))).toBe(
      'Bad-Name--Workspace.context-package.md',
    );
  });

  it('builds the output path inside the selected folder root', () => {
    expect(getContextPackageOutputPath(path.join('/tmp', 'sidekick-workspace'))).toBe(
      path.join('/tmp', 'sidekick-workspace', 'sidekick-workspace.context-package.md'),
    );
  });

  it('creates a folder-scoped filename from the selected folder name', () => {
    expect(createFolderContextPackageFileName('01. Transkripsjoner')).toBe(
      'transkripsjoner.context-package.md',
    );
    expect(createFolderContextPackageFileName('02. Møte Notater')).toBe(
      'møte-notater.context-package.md',
    );
  });

  it('sanitizes folder-scoped filenames and falls back when the folder name is empty', () => {
    expect(createFolderContextPackageFileName('03. Bad<Name>|Folder')).toBe(
      'bad-name-folder.context-package.md',
    );
    expect(createFolderContextPackageFileName('01. <>')).toBe('folder.context-package.md');
  });

  it('builds the folder-scoped output path inside the selected folder', () => {
    expect(getFolderContextPackageOutputPath(path.join('/tmp', 'workspace', '01. Transkripsjoner'))).toBe(
      path.join('/tmp', 'workspace', '01. Transkripsjoner', 'transkripsjoner.context-package.md'),
    );
  });

  it('ignores generated packages and noisy folders', () => {
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('*.context-package.md');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('**/*.context-package.md');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('*context-package*');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('**/*context-package*');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('node_modules/**');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('dist/**');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('.sidekick/**');
  });
});
