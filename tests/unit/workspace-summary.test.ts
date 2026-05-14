import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { CodexRunner } from '../../src/main/codex-runner';
import {
  buildWorkspaceSummaryPrompt,
  generateWorkspaceSummaryMarkdown,
  normalizeWorkspaceSummaryOutput,
} from '../../src/main/workspace-summary';

const temporaryRoots: string[] = [];

const createTempRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-workspace-summary-'));
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

describe('workspace summary generation', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('builds a prompt containing the generated context package', () => {
    const prompt = buildWorkspaceSummaryPrompt('# File Summary\n\nWorkspace contents');

    expect(prompt).toContain('Lag et kort, presist arbeidsområdesammendrag');
    expect(prompt).toContain('# File Summary');
  });

  it('normalizes output before the required workspace summary heading', () => {
    expect(normalizeWorkspaceSummaryOutput(`Her er svaret:\n\n${validSummary}`)).toBe(validSummary);
  });

  it('runs Codex in read-only mode and validates markdown sections', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'workspace.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nArbeidsområdeinnhold', 'utf8');

    const result = await generateWorkspaceSummaryMarkdown({
      rootPath,
      contextPackagePath,
      codexRunner: createFakeRunner(validSummary),
    });

    expect(result.status).toBe('complete');
    expect(result.markdown).toContain('## Workspace Summary');
    await expect(readFile(contextPackagePath, 'utf8')).resolves.toContain('Arbeidsområdeinnhold');
  });

  it('rejects malformed Codex output', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'workspace.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nArbeidsområdeinnhold', 'utf8');

    await expect(
      generateWorkspaceSummaryMarkdown({
        rootPath,
        contextPackagePath,
        codexRunner: createFakeRunner('## Workspace Summary\n\nFor kort'),
      }),
    ).rejects.toThrow(/missing required sections/i);
  });
});
