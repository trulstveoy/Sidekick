import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CodexRunner } from '../../src/main/codex-runner';
import {
  buildProjectSummaryPrompt,
  generateProjectSummaryMarkdown,
  normalizeProjectSummaryOutput,
} from '../../src/main/project-summary';

const temporaryRoots: string[] = [];

const createTempRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-project-summary-'));
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
  '',
  '## Open Questions',
  '',
  'Ingen tydelige åpne spørsmål',
].join('\n');

const createFakeRunner = (stdout: string, code = 0) =>
  ({
    getStatus: async () => ({
      state: 'ready',
      available: true,
      loggedIn: true,
    }),
    runExecText: async (_rootPath: string, prompt: string) => ({
      code,
      signal: null,
      stdout,
      stderr: '',
      prompt,
    }),
  }) as unknown as CodexRunner;

describe('project summary generation', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('builds a prompt containing the generated context package', () => {
    const prompt = buildProjectSummaryPrompt('# File Summary\n\nProject contents');

    expect(prompt).toContain('Lag et kort, presist prosjektsammendrag');
    expect(prompt).toContain('# File Summary');
  });

  it('normalizes output before the required project summary heading', () => {
    expect(normalizeProjectSummaryOutput(`Her er svaret:\n\n${validSummary}`)).toBe(validSummary);
  });

  it('runs Codex in read-only mode and validates markdown sections', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'project.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nProsjektinnhold', 'utf8');

    const result = await generateProjectSummaryMarkdown({
      rootPath,
      contextPackagePath,
      codexRunner: createFakeRunner(validSummary),
    });

    expect(result.status).toBe('complete');
    expect(result.markdown).toContain('## Project Summary');
    await expect(readFile(contextPackagePath, 'utf8')).resolves.toContain('Prosjektinnhold');
  });

  it('rejects malformed Codex output', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'project.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nProsjektinnhold', 'utf8');

    await expect(
      generateProjectSummaryMarkdown({
        rootPath,
        contextPackagePath,
        codexRunner: createFakeRunner('## Project Summary\n\nFor kort'),
      }),
    ).rejects.toThrow(/missing required sections/i);
  });
});
