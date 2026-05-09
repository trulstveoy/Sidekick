import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanProjectFolder } from '../../src/main/folder-scanner';

const fixturePath = path.resolve(__dirname, '../fixtures/project-folder-basic');

describe('folder scanner', () => {
  it('scans a project folder and returns summary counts', async () => {
    const result = await scanProjectFolder(fixturePath);

    expect(result.status).toBe('complete');
    expect(result.rootName).toBe('project-folder-basic');
    expect(result.summary.fileCount).toBe(8);
    expect(result.summary.folderCount).toBe(4);
    expect(result.summary.artifactTypeCounts.pdf).toBe(1);
    expect(result.summary.artifactTypeCounts.presentation).toBe(1);
    expect(result.summary.artifactTypeCounts.drawio).toBe(2);
    expect(result.summary.artifactTypeCounts.transcript).toBe(2);
    expect(result.summary.folderSignalCounts.background).toBe(1);
    expect(result.summary.folderSignalCounts.transcript).toBe(1);
    expect(result.summary.folderSignalCounts['information-model']).toBe(1);
    expect(result.summary.folderSignalCounts.architecture).toBe(1);
    expect(result.warnings.some((warning) => warning.path.includes('dist'))).toBe(true);
  });

  it('returns partial results when the file limit is reached', async () => {
    const result = await scanProjectFolder(fixturePath, { maxFiles: 2 });

    expect(result.status).toBe('partial');
    expect(result.summary.limitsReached.maxFiles).toBe(true);
    expect(result.warnings.some((warning) => warning.type === 'file-limit')).toBe(true);
    expect(result.summary.fileCount).toBe(2);
  });
});
