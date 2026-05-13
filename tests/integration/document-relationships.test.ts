import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CodexRunner } from '../../src/main/codex-runner';
import {
  generateDocumentRelationships,
  generateDocumentRelationshipsMarkdown,
  getDocumentRelationshipsPath,
} from '../../src/main/document-relationships';

const tempRoots: string[] = [];

const createFakeCodex = async (mode: 'ready' | 'logged-out' | 'malformed' = 'ready') => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-relationships-codex-'));
  tempRoots.push(rootPath);
  const executablePath = path.join(rootPath, 'fake-codex');
  await writeFile(
    executablePath,
    `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  console.log('codex-cli 0.130.0-test');
  process.exit(0);
}
if (args[0] === 'login' && args[1] === 'status') {
  ${mode === 'logged-out' ? "console.error('not logged in'); process.exit(1);" : "console.log('Logged in'); process.exit(0);"}
}
if (args[0] === 'exec') {
  process.stdin.resume();
  process.stdin.on('end', () => {
    ${
      mode === 'malformed'
        ? "console.log('## Overview\\n\\nFor kort');"
        : "console.log('## Overview\\n\\nStrategi og operasjon henger sammen.\\n\\n## Relationship Map\\n\\n- Type: delt tema | Dokumenter: strategi.md, operasjon.md | Confidence: høy | Forklaring: Begge omtaler målbilde | Bevis: målbilde\\n\\n## Thematic Clusters\\n\\n- Målbilde: strategi.md, operasjon.md\\n\\n## Notable Overlaps\\n\\n- Begge omtaler prioriteringer.\\n\\n## Possible Contradictions\\n\\nIngen tydelige motstrider funnet\\n\\n## Low Confidence Or Missing Evidence\\n\\nIngen tydelige lav-konfidensfunn');"
    }
    process.exit(0);
  });
  return;
}
process.exit(2);
`,
    'utf8',
  );
  await chmod(executablePath, 0o755);

  return {
    executablePath,
    rootPath,
  };
};

const createProjectRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-relationships-project-'));
  tempRoots.push(rootPath);
  await writeFile(path.join(rootPath, 'strategi.md'), '# Strategi\n\nMålbilde og retning.', 'utf8');
  await writeFile(
    path.join(rootPath, 'operasjon.md'),
    '# Operasjon\n\nOperasjonsmodell og målbilde.',
    'utf8',
  );

  return rootPath;
};

describe('document relationships generation integration', () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((rootPath) => rm(rootPath, { recursive: true, force: true })));
  });

  it('generates relationship markdown through a Codex-compatible executable', async () => {
    const fake = await createFakeCodex();
    const contextPackagePath = path.join(fake.rootPath, 'project.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nProject contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    const markdown = await generateDocumentRelationshipsMarkdown({
      rootPath: fake.rootPath,
      contextPackagePath,
      codexRunner: runner,
    });

    expect(markdown).toContain('## Relationship Map');
    expect(markdown).toContain('Confidence: høy');
  });

  it('writes a relationship report after generating fresh project context', async () => {
    const fake = await createFakeCodex();
    const rootPath = await createProjectRoot();
    const runner = new CodexRunner(fake.executablePath);

    const result = await generateDocumentRelationships({
      rootPath,
      codexRunner: runner,
    });
    const reportMarkdown = await readFile(getDocumentRelationshipsPath(rootPath), 'utf8');

    expect(result.status).toBe('complete');
    expect(result.report?.relationshipMap).toContain('Confidence: høy');
    expect(result.contextPackage?.scope).toBe('project');
    expect(result.contextPackage?.projectSummary).toBeUndefined();
    expect(reportMarkdown).toContain('source_model: physical-project-folder');
    expect(reportMarkdown).toContain('context_package_sha256:');
  });

  it('fails without writing a report when the fresh context package is too large', async () => {
    const rootPath = await createProjectRoot();

    const result = await generateDocumentRelationships({
      rootPath,
      maxContextPackageTokens: 0,
    });

    expect(result.status).toBe('failed');
    expect(result.message).toContain('for stor');
    await expect(readFile(getDocumentRelationshipsPath(rootPath), 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('fails when Codex is not logged in', async () => {
    const fake = await createFakeCodex('logged-out');
    const contextPackagePath = path.join(fake.rootPath, 'project.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nProject contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    await expect(
      generateDocumentRelationshipsMarkdown({
        rootPath: fake.rootPath,
        contextPackagePath,
        codexRunner: runner,
      }),
    ).rejects.toThrow(/not logged in/i);
  });

  it('fails when Codex returns malformed relationship markdown', async () => {
    const fake = await createFakeCodex('malformed');
    const contextPackagePath = path.join(fake.rootPath, 'project.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nProject contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    await expect(
      generateDocumentRelationshipsMarkdown({
        rootPath: fake.rootPath,
        contextPackagePath,
        codexRunner: runner,
      }),
    ).rejects.toThrow(/missing required sections/i);
  });
});
