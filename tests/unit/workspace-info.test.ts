import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createWorkspaceInfoMarkdown,
  getWorkspaceInfoPath,
  readWorkspaceInfo,
  validateWorkspaceSummaryMarkdown,
  writeWorkspaceInfo,
} from '../../src/main/workspace-info';

const temporaryRoots: string[] = [];

const createTempRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-workspace-info-'));
  temporaryRoots.push(rootPath);

  return rootPath;
};

const validSummary = [
  '## Workspace Summary',
  '',
  'Arbeidsområdet handler om lokal arbeidsområdeforståelse.',
  '',
  '## Participants',
  '',
  '- Sidekick-teamet',
  '',
  '## Themes',
  '',
  '- Lokal lagring',
  '- Kontekstpakker',
  '',
  '## Open Questions',
  '',
  '- Hvordan skal metadata utvikles?',
].join('\n');

describe('workspace info document handling', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('writes and reads workspace info markdown with front matter', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'arbeidsområde.context-package.md');
    const snapshot = await writeWorkspaceInfo({
      rootPath,
      contextPackagePath,
      contextPackageSha256: 'abc123',
      generatedAt: '2026-05-13T12:00:00.000Z',
      summaryMarkdown: validSummary,
    });
    const markdown = await readFile(getWorkspaceInfoPath(rootPath), 'utf8');

    expect(snapshot.status).toBe('complete');
    expect(snapshot.generatedAt).toBe('2026-05-13T12:00:00.000Z');
    expect(snapshot.sourceScope).toBe('full-workspace');
    expect(snapshot.contextPackagePath).toBe('./arbeidsområde.context-package.md');
    expect(snapshot.contextPackageSha256).toBe('abc123');
    expect(snapshot.summaryLanguage).toBe('nb');
    expect(snapshot.workspaceSummary).toContain('lokal arbeidsområdeforståelse');
    expect(snapshot.participants).toContain('Sidekick-teamet');
    expect(snapshot.themes).toEqual(['Lokal lagring', 'Kontekstpakker']);
    expect(snapshot.openQuestions).toEqual(['Hvordan skal metadata utvikles?']);
    expect(markdown).toContain('sidekick_schema: workspace-info.v1');
    expect(markdown).toContain('## Source Context');
  });

  it('reports missing workspace info as a typed state', async () => {
    const rootPath = await createTempRoot();

    await expect(readWorkspaceInfo(rootPath)).resolves.toMatchObject({
      status: 'missing',
      path: getWorkspaceInfoPath(rootPath),
    });
  });

  it('reports invalid workspace info as a typed state', async () => {
    const rootPath = await createTempRoot();
    const workspaceInfoPath = getWorkspaceInfoPath(rootPath);
    await writeFile(workspaceInfoPath, 'not front matter', 'utf8').catch(async () => {
      await writeWorkspaceInfo({
        rootPath,
        contextPackagePath: path.join(rootPath, 'old.context-package.md'),
        contextPackageSha256: 'old',
        generatedAt: '2026-05-13T12:00:00.000Z',
        summaryMarkdown: validSummary,
      });
      await writeFile(workspaceInfoPath, 'not front matter', 'utf8');
    });

    await expect(readWorkspaceInfo(rootPath)).resolves.toMatchObject({
      status: 'invalid',
      message: expect.stringContaining('front matter'),
    });
  });

  it('rejects generated context packages outside the workspace root', async () => {
    const rootPath = await createTempRoot();
    const otherRoot = await createTempRoot();

    expect(() =>
      createWorkspaceInfoMarkdown({
        rootPath,
        contextPackagePath: path.join(otherRoot, 'outside.context-package.md'),
        contextPackageSha256: 'abc123',
        summaryMarkdown: validSummary,
      }),
    ).toThrow(/inside the selected workspace/);
  });

  it('requires summary sections before writing workspace info', () => {
    expect(() => validateWorkspaceSummaryMarkdown('## Workspace Summary\n\nBare ett felt')).toThrow(
      /missing required sections/i,
    );
  });
});
