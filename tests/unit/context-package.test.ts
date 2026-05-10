import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CONTEXT_PACKAGE_IGNORE_PATTERNS,
  createContextPackageFileName,
  getContextPackageOutputPath,
} from '../../src/main/context-package';

describe('context package helpers', () => {
  it('creates a context package filename from the project folder name', () => {
    expect(createContextPackageFileName(path.join('/tmp', 'My Project'))).toBe(
      'My Project.context-package.md',
    );
  });

  it('sanitizes characters that are unsafe in filenames', () => {
    expect(createContextPackageFileName(path.join('/tmp', 'Bad<Name>|Project'))).toBe(
      'Bad-Name--Project.context-package.md',
    );
  });

  it('builds the output path inside the selected folder root', () => {
    expect(getContextPackageOutputPath(path.join('/tmp', 'sidekick-project'))).toBe(
      path.join('/tmp', 'sidekick-project', 'sidekick-project.context-package.md'),
    );
  });

  it('ignores generated packages and noisy folders', () => {
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('*.context-package.md');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('*context-package*');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('node_modules/**');
    expect(CONTEXT_PACKAGE_IGNORE_PATTERNS).toContain('dist/**');
  });
});
