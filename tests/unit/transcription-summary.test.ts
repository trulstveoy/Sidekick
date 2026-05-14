import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  extractSummaryMarkdownFromCodexOutput,
  readTranscriptionSummary,
  relativeTranscriptionSummaryPath,
  writeTranscriptionSummary,
} from '../../src/main/transcription-summary';

const tempRoots: string[] = [];

const createWorkspaceWithTranscription = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-summary-'));
  tempRoots.push(rootPath);
  const folderPath = path.join(rootPath, '01. Transkripsjoner');
  const transcriptionPath = path.join(folderPath, '00. interview.md');

  await mkdir(folderPath, { recursive: true });
  await writeFile(transcriptionPath, 'Intervjuet handler om arbeidsområdestruktur.', 'utf8');

  return {
    rootPath,
    transcriptionPath,
    transcriptionRelativePath: '01. Transkripsjoner/00. interview.md',
  };
};

describe('transcription summary metadata', () => {
  afterEach(async () => {
    await Promise.all(
      tempRoots.splice(0).map((rootPath) => rm(rootPath, { recursive: true, force: true })),
    );
  });

  it('writes and reads a workspace-local summary outside the visible workspace scan', async () => {
    const workspace = await createWorkspaceWithTranscription();
    const summary = await writeTranscriptionSummary({
      rootPath: workspace.rootPath,
      transcriptionPath: workspace.transcriptionPath,
      summaryMarkdown: '## Conversation Summary\n\nKort sammendrag.\n\n- Første punkt.',
    });

    expect(summary.status).toBe('complete');
    expect(summary.transcriptionRelativePath).toBe('01. Transkripsjoner/00. interview.md');
    expect(summary.summaryRelativePath).toMatch(/^\.sidekick\/transcription-summaries\//);
    await expect(readFile(summary.summaryPath, 'utf8')).resolves.toContain(
      'schema: transcription-summary.v1',
    );
  });

  it('marks a summary stale when the source transcription changes', async () => {
    const workspace = await createWorkspaceWithTranscription();
    await writeTranscriptionSummary({
      rootPath: workspace.rootPath,
      transcriptionPath: workspace.transcriptionPath,
      summaryMarkdown: '## Conversation Summary\n\nKort sammendrag.',
    });

    await writeFile(workspace.transcriptionPath, 'Oppdatert transkripsjon.', 'utf8');

    await expect(
      readTranscriptionSummary(workspace.rootPath, workspace.transcriptionRelativePath),
    ).resolves.toMatchObject({
      status: 'stale',
      message: 'Sammendraget er laget for en eldre versjon av transkripsjonen.',
    });
  });

  it('rejects summary paths outside the selected workspace', () => {
    expect(() => relativeTranscriptionSummaryPath('../outside.md')).toThrow(
      'must stay inside the selected workspace',
    );
  });

  it('extracts assistant markdown from Codex JSONL output', () => {
    const stdout = [
      JSON.stringify({ type: 'argv', args: ['exec'] }),
      JSON.stringify({
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: '## Conversation Summary\n\nOppsummert.' }],
      }),
    ].join('\n');

    expect(extractSummaryMarkdownFromCodexOutput(stdout)).toBe(
      '## Conversation Summary\n\nOppsummert.',
    );
  });
});
