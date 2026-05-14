import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { CodexRunner } from '../../src/main/codex-runner';
import { generateWorkspaceSummaryMarkdown } from '../../src/main/workspace-summary';

const tempRoots: string[] = [];

const createFakeCodex = async (mode: 'ready' | 'logged-out' | 'malformed' = 'ready') => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-workspace-summary-codex-'));
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
        ? "console.log('## Workspace Summary\\n\\nFor kort');"
        : "console.log('## Workspace Summary\\n\\nArbeidsområdet handler om Sidekick.\\n\\n## Participants\\n\\n- Sidekick-teamet\\n\\n## Themes\\n\\n- Lokal kontekst');"
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

describe('workspace summary generation integration', () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((rootPath) => rm(rootPath, { recursive: true, force: true })));
  });

  it('generates summary markdown through a Codex-compatible executable', async () => {
    const fake = await createFakeCodex();
    const contextPackagePath = path.join(fake.rootPath, 'workspace.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nWorkspace contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    const result = await generateWorkspaceSummaryMarkdown({
      rootPath: fake.rootPath,
      contextPackagePath,
      codexRunner: runner,
    });

    expect(result.markdown).toContain('## Workspace Summary');
    expect(result.markdown).toContain('## Themes');
  });

  it('fails when Codex is not logged in', async () => {
    const fake = await createFakeCodex('logged-out');
    const contextPackagePath = path.join(fake.rootPath, 'workspace.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nWorkspace contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    await expect(
      generateWorkspaceSummaryMarkdown({
        rootPath: fake.rootPath,
        contextPackagePath,
        codexRunner: runner,
      }),
    ).rejects.toThrow(/not logged in/i);
  });

  it('fails when Codex returns malformed summary markdown', async () => {
    const fake = await createFakeCodex('malformed');
    const contextPackagePath = path.join(fake.rootPath, 'workspace.context-package.md');
    await writeFile(contextPackagePath, '# File Summary\n\nWorkspace contents', 'utf8');
    const runner = new CodexRunner(fake.executablePath);

    await expect(
      generateWorkspaceSummaryMarkdown({
        rootPath: fake.rootPath,
        contextPackagePath,
        codexRunner: runner,
      }),
    ).rejects.toThrow(/missing required sections/i);
  });
});
