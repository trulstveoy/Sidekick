import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createProjectInfoMarkdown,
  getProjectInfoPath,
  readProjectInfo,
  validateProjectSummaryMarkdown,
  writeProjectInfo,
} from '../../src/main/project-info';

const temporaryRoots: string[] = [];

const createTempRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-project-info-'));
  temporaryRoots.push(rootPath);

  return rootPath;
};

const validSummary = [
  '## Project Summary',
  '',
  'Prosjektet handler om lokal prosjektforståelse.',
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

describe('project info document handling', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('writes and reads project info markdown with front matter', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'prosjekt.context-package.md');
    const snapshot = await writeProjectInfo({
      rootPath,
      contextPackagePath,
      contextPackageSha256: 'abc123',
      generatedAt: '2026-05-13T12:00:00.000Z',
      summaryMarkdown: validSummary,
    });
    const markdown = await readFile(getProjectInfoPath(rootPath), 'utf8');

    expect(snapshot.status).toBe('complete');
    expect(snapshot.generatedAt).toBe('2026-05-13T12:00:00.000Z');
    expect(snapshot.sourceScope).toBe('full-project');
    expect(snapshot.contextPackagePath).toBe('./prosjekt.context-package.md');
    expect(snapshot.contextPackageSha256).toBe('abc123');
    expect(snapshot.summaryLanguage).toBe('nb');
    expect(snapshot.projectSummary).toContain('lokal prosjektforståelse');
    expect(snapshot.participants).toContain('Sidekick-teamet');
    expect(snapshot.themes).toEqual(['Lokal lagring', 'Kontekstpakker']);
    expect(snapshot.openQuestions).toEqual(['Hvordan skal metadata utvikles?']);
    expect(markdown).toContain('sidekick_schema: project-info.v1');
    expect(markdown).toContain('## Source Context');
  });

  it('reports missing project info as a typed state', async () => {
    const rootPath = await createTempRoot();

    await expect(readProjectInfo(rootPath)).resolves.toMatchObject({
      status: 'missing',
      path: getProjectInfoPath(rootPath),
    });
  });

  it('reports invalid project info as a typed state', async () => {
    const rootPath = await createTempRoot();
    const projectInfoPath = getProjectInfoPath(rootPath);
    await writeFile(projectInfoPath, 'not front matter', 'utf8').catch(async () => {
      await writeProjectInfo({
        rootPath,
        contextPackagePath: path.join(rootPath, 'old.context-package.md'),
        contextPackageSha256: 'old',
        generatedAt: '2026-05-13T12:00:00.000Z',
        summaryMarkdown: validSummary,
      });
      await writeFile(projectInfoPath, 'not front matter', 'utf8');
    });

    await expect(readProjectInfo(rootPath)).resolves.toMatchObject({
      status: 'invalid',
      message: expect.stringContaining('front matter'),
    });
  });

  it('rejects generated context packages outside the project root', async () => {
    const rootPath = await createTempRoot();
    const otherRoot = await createTempRoot();

    expect(() =>
      createProjectInfoMarkdown({
        rootPath,
        contextPackagePath: path.join(otherRoot, 'outside.context-package.md'),
        contextPackageSha256: 'abc123',
        summaryMarkdown: validSummary,
      }),
    ).toThrow(/inside the selected project/);
  });

  it('requires summary sections before writing project info', () => {
    expect(() => validateProjectSummaryMarkdown('## Project Summary\n\nBare ett felt')).toThrow(
      /missing required sections/i,
    );
  });
});
