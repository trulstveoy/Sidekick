import { readFile } from 'node:fs/promises';
import type { ProjectSummaryGenerationResult } from '../shared/sidekick-api';
import { CodexRunner } from './codex-runner';
import { readProjectInfo, validateProjectSummaryMarkdown } from './project-info';
import { PROJECT_SUMMARY_PROMPT_NB } from './prompts/project-summary.nb';

export type ProjectSummaryGenerationInput = {
  rootPath: string;
  contextPackagePath: string;
  codexRunner: CodexRunner;
};

export type ProjectSummaryMarkdownResult = {
  status: 'complete';
  markdown: string;
};

export const buildProjectSummaryPrompt = (contextPackageMarkdown: string) => [
  PROJECT_SUMMARY_PROMPT_NB,
  '',
  'Context package:',
  '',
  '```markdown',
  contextPackageMarkdown,
  '```',
].join('\n');

export const normalizeProjectSummaryOutput = (output: string) => {
  const trimmed = output.trim();
  const firstRequiredHeadingIndex = trimmed.indexOf('## Project Summary');

  return firstRequiredHeadingIndex >= 0 ? trimmed.slice(firstRequiredHeadingIndex).trim() : trimmed;
};

export const generateProjectSummaryMarkdown = async ({
  rootPath,
  contextPackagePath,
  codexRunner,
}: ProjectSummaryGenerationInput): Promise<ProjectSummaryMarkdownResult> => {
  const status = await codexRunner.getStatus(rootPath);

  if (status.state !== 'ready') {
    throw new Error(status.message ?? 'Codex is not ready for project summary generation.');
  }

  const contextPackageMarkdown = await readFile(contextPackagePath, 'utf8');
  const prompt = buildProjectSummaryPrompt(contextPackageMarkdown);
  const result = await codexRunner.runExecText(rootPath, prompt, 'read-only');

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.code !== 0) {
    throw new Error((result.stderr || result.stdout || 'Codex summary generation failed.').trim());
  }

  const markdown = normalizeProjectSummaryOutput(result.stdout);
  validateProjectSummaryMarkdown(markdown);

  return {
    status: 'complete',
    markdown,
  };
};

export const createFailedProjectSummaryResult = async (
  rootPath: string,
  message: string,
): Promise<ProjectSummaryGenerationResult> => {
  const previousProjectInfo = await readProjectInfo(rootPath);

  return {
    status: 'failed',
    previousProjectInfo:
      previousProjectInfo.status === 'complete' ? previousProjectInfo : undefined,
    message,
  };
};
