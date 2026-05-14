import { readFile } from 'node:fs/promises';
import type { WorkspaceSummaryGenerationResult } from '../shared/sidekick-api';
import { CodexRunner } from './codex-runner';
import { readWorkspaceInfo, validateWorkspaceSummaryMarkdown } from './workspace-info';
import { WORKSPACE_SUMMARY_PROMPT_NB } from './prompts/workspace-summary.nb';

export type WorkspaceSummaryGenerationInput = {
  rootPath: string;
  contextPackagePath: string;
  codexRunner: CodexRunner;
};

export type WorkspaceSummaryMarkdownResult = {
  status: 'complete';
  markdown: string;
};

export const buildWorkspaceSummaryPrompt = (contextPackageMarkdown: string) => [
  WORKSPACE_SUMMARY_PROMPT_NB,
  '',
  'Context package:',
  '',
  '```markdown',
  contextPackageMarkdown,
  '```',
].join('\n');

export const normalizeWorkspaceSummaryOutput = (output: string) => {
  const trimmed = output.trim();
  const firstRequiredHeadingIndex = trimmed.indexOf('## Workspace Summary');

  return firstRequiredHeadingIndex >= 0 ? trimmed.slice(firstRequiredHeadingIndex).trim() : trimmed;
};

export const generateWorkspaceSummaryMarkdown = async ({
  rootPath,
  contextPackagePath,
  codexRunner,
}: WorkspaceSummaryGenerationInput): Promise<WorkspaceSummaryMarkdownResult> => {
  const status = await codexRunner.getStatus(rootPath);

  if (status.state !== 'ready') {
    throw new Error(status.message ?? 'Codex is not ready for workspace summary generation.');
  }

  const contextPackageMarkdown = await readFile(contextPackagePath, 'utf8');
  const prompt = buildWorkspaceSummaryPrompt(contextPackageMarkdown);
  const result = await codexRunner.runExecText(rootPath, prompt, 'read-only');

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.code !== 0) {
    throw new Error((result.stderr || result.stdout || 'Codex summary generation failed.').trim());
  }

  const markdown = normalizeWorkspaceSummaryOutput(result.stdout);
  validateWorkspaceSummaryMarkdown(markdown);

  return {
    status: 'complete',
    markdown,
  };
};

export const createFailedWorkspaceSummaryResult = async (
  rootPath: string,
  message: string,
): Promise<WorkspaceSummaryGenerationResult> => {
  const previousWorkspaceInfo = await readWorkspaceInfo(rootPath);

  return {
    status: 'failed',
    previousWorkspaceInfo:
      previousWorkspaceInfo.status === 'complete' ? previousWorkspaceInfo : undefined,
    message,
  };
};
