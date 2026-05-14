import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  ContextPackageResult,
  DocumentRelationshipsGenerationResult,
  DocumentRelationshipsSnapshot,
} from '../shared/sidekick-api';
import { CodexRunner } from './codex-runner';
import { calculateFileSha256, generateContextPackage } from './context-package';
import {
  getSidekickMetadataPath,
  parseMarkdownSections,
  toWorkspaceRelativePath,
} from './workspace-info';
import { DOCUMENT_RELATIONSHIPS_PROMPT_NB } from './prompts/document-relationships.nb';

export const DOCUMENT_RELATIONSHIPS_FILE_NAME = 'document-relationships.md';
export const DOCUMENT_RELATIONSHIPS_SCHEMA = 'document-relationships.v1';
export const DEFAULT_RELATIONSHIPS_MAX_CONTEXT_TOKENS = 120_000;

const REQUIRED_RELATIONSHIP_SECTIONS = [
  'Overview',
  'Relationship Map',
  'Thematic Clusters',
  'Notable Overlaps',
  'Possible Contradictions',
  'Low Confidence Or Missing Evidence',
];

type DocumentRelationshipWriteInput = {
  rootPath: string;
  contextPackagePath: string;
  contextPackageSha256: string;
  analysisMarkdown: string;
  generatedAt?: string;
};

type GenerateDocumentRelationshipsInput = {
  rootPath: string;
  codexRunner?: CodexRunner;
  maxContextPackageTokens?: number;
};

const normalizeNewlines = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const parseFrontMatter = (markdown: string) => {
  const normalized = normalizeNewlines(markdown);
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);

  if (!match) {
    throw new Error('Document relationships front matter is missing.');
  }

  const attributes = new Map<string, string>();

  for (const line of match[1].split('\n')) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      attributes.set(key, value);
    }
  }

  return {
    attributes,
    body: normalized.slice(match[0].length),
  };
};

export const getDocumentRelationshipsPath = (rootPath: string) =>
  path.join(getSidekickMetadataPath(rootPath), DOCUMENT_RELATIONSHIPS_FILE_NAME);

export const buildDocumentRelationshipsPrompt = (contextPackageMarkdown: string) => [
  DOCUMENT_RELATIONSHIPS_PROMPT_NB,
  '',
  'Context package:',
  '',
  '```markdown',
  contextPackageMarkdown,
  '```',
].join('\n');

export const normalizeDocumentRelationshipsOutput = (output: string) => {
  const trimmed = output.trim();
  const firstRequiredHeadingIndex = trimmed.indexOf('## Overview');

  return firstRequiredHeadingIndex >= 0
    ? trimmed.slice(firstRequiredHeadingIndex).trim()
    : trimmed;
};

export const validateDocumentRelationshipsMarkdown = (analysisMarkdown: string) => {
  const sections = parseMarkdownSections(analysisMarkdown);
  const missingSections = REQUIRED_RELATIONSHIP_SECTIONS.filter((section) => !sections.get(section));

  if (missingSections.length > 0) {
    throw new Error(
      `Document relationships report is missing required sections: ${missingSections.join(', ')}.`,
    );
  }

  return sections;
};

const createFrontMatter = ({
  contextPackagePath,
  contextPackageSha256,
  generatedAt,
}: {
  contextPackagePath: string;
  contextPackageSha256: string;
  generatedAt: string;
}) => [
  '---',
  `sidekick_schema: ${DOCUMENT_RELATIONSHIPS_SCHEMA}`,
  `generated_at: ${generatedAt}`,
  'source_scope: full-workspace',
  'source_model: physical-workspace',
  `context_package_path: ${contextPackagePath}`,
  `context_package_sha256: ${contextPackageSha256}`,
  'summary_language: nb',
  '---',
  '',
].join('\n');

export const createDocumentRelationshipsMarkdown = ({
  rootPath,
  contextPackagePath,
  contextPackageSha256,
  analysisMarkdown,
  generatedAt = new Date().toISOString(),
}: DocumentRelationshipWriteInput) => {
  validateDocumentRelationshipsMarkdown(analysisMarkdown);
  const relativeContextPackagePath = toWorkspaceRelativePath(rootPath, contextPackagePath);
  const normalizedAnalysis = normalizeNewlines(analysisMarkdown).trim();

  return [
    createFrontMatter({
      contextPackagePath: relativeContextPackagePath,
      contextPackageSha256,
      generatedAt,
    }),
    '# Sidekick Document Relationships',
    '',
    normalizedAnalysis,
    '',
    '## Source Context',
    '',
    '- Scope: full-workspace',
    '- Source model: physical-workspace',
    `- Context package: \`${relativeContextPackagePath}\``,
    `- Generated at: \`${generatedAt}\``,
    `- Context hash: \`${contextPackageSha256}\``,
    '',
  ].join('\n');
};

export const parseDocumentRelationshipsMarkdown = (
  reportPath: string,
  markdown: string,
): DocumentRelationshipsSnapshot => {
  const { attributes, body } = parseFrontMatter(markdown);

  if (attributes.get('sidekick_schema') !== DOCUMENT_RELATIONSHIPS_SCHEMA) {
    throw new Error('Document relationships schema is unsupported.');
  }

  const sections = validateDocumentRelationshipsMarkdown(body);

  return {
    status: 'complete',
    path: reportPath,
    generatedAt: attributes.get('generated_at'),
    sourceScope: attributes.get('source_scope') === 'full-workspace' ? 'full-workspace' : undefined,
    sourceModel:
      attributes.get('source_model') === 'physical-workspace'
        ? 'physical-workspace'
        : undefined,
    contextPackagePath: attributes.get('context_package_path'),
    contextPackageSha256: attributes.get('context_package_sha256'),
    summaryLanguage: attributes.get('summary_language') === 'nb' ? 'nb' : undefined,
    overview: sections.get('Overview'),
    relationshipMap: sections.get('Relationship Map'),
    thematicClusters: sections.get('Thematic Clusters'),
    notableOverlaps: sections.get('Notable Overlaps'),
    possibleContradictions: sections.get('Possible Contradictions'),
    lowConfidenceOrMissingEvidence: sections.get('Low Confidence Or Missing Evidence'),
    markdown: body.trim(),
  };
};

export const readDocumentRelationships = async (
  rootPath: string,
): Promise<DocumentRelationshipsSnapshot> => {
  const reportPath = getDocumentRelationshipsPath(rootPath);

  try {
    const markdown = await readFile(reportPath, 'utf8');

    return parseDocumentRelationshipsMarkdown(reportPath, markdown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        status: 'missing',
        path: reportPath,
      };
    }

    return {
      status: 'invalid',
      path: reportPath,
      message:
        error instanceof Error ? error.message : 'Document relationships report could not be read.',
    };
  }
};

export const generateDocumentRelationshipsMarkdown = async ({
  rootPath,
  contextPackagePath,
  codexRunner,
}: {
  rootPath: string;
  contextPackagePath: string;
  codexRunner: CodexRunner;
}) => {
  const status = await codexRunner.getStatus(rootPath);

  if (status.state !== 'ready') {
    throw new Error(status.message ?? 'Codex is not ready for document relationship analysis.');
  }

  const contextPackageMarkdown = await readFile(contextPackagePath, 'utf8');
  const prompt = buildDocumentRelationshipsPrompt(contextPackageMarkdown);
  const result = await codexRunner.runExecText(rootPath, prompt, 'read-only');

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (result.code !== 0) {
    throw new Error((result.stderr || result.stdout || 'Codex relationship analysis failed.').trim());
  }

  const markdown = normalizeDocumentRelationshipsOutput(result.stdout);
  validateDocumentRelationshipsMarkdown(markdown);

  return markdown;
};

const assertContextPackageSize = (
  contextPackage: ContextPackageResult,
  maxContextPackageTokens: number,
) => {
  if (contextPackage.totalTokens <= maxContextPackageTokens) {
    return;
  }

  throw new Error(
    [
      `Kontekstpakken er for stor for relasjonsanalyse (${contextPackage.totalTokens} tokens).`,
      `Maksgrensen er ${maxContextPackageTokens} tokens i første versjon.`,
      'Bruk en folder-scoped eller tematisk kontekstpakke når dette støttes.',
    ].join(' '),
  );
};

export const writeDocumentRelationships = async (
  input: DocumentRelationshipWriteInput,
): Promise<DocumentRelationshipsSnapshot> => {
  const metadataPath = getSidekickMetadataPath(input.rootPath);
  const reportPath = getDocumentRelationshipsPath(input.rootPath);
  const markdown = createDocumentRelationshipsMarkdown(input);

  await mkdir(metadataPath, { recursive: true });
  await writeFile(reportPath, markdown, 'utf8');

  return parseDocumentRelationshipsMarkdown(reportPath, markdown);
};

export const generateDocumentRelationships = async ({
  rootPath,
  codexRunner = new CodexRunner(),
  maxContextPackageTokens = DEFAULT_RELATIONSHIPS_MAX_CONTEXT_TOKENS,
}: GenerateDocumentRelationshipsInput): Promise<DocumentRelationshipsGenerationResult> => {
  const previousReport = await readDocumentRelationships(rootPath);

  try {
    const contextPackage = await generateContextPackage(rootPath, {
      codexRunner,
      generateWorkspaceSummary: false,
    });
    assertContextPackageSize(contextPackage, maxContextPackageTokens);
    const contextPackageSha256 = await calculateFileSha256(contextPackage.outputPath);
    const analysisMarkdown = await generateDocumentRelationshipsMarkdown({
      rootPath,
      contextPackagePath: contextPackage.outputPath,
      codexRunner,
    });
    const report = await writeDocumentRelationships({
      rootPath,
      contextPackagePath: contextPackage.outputPath,
      contextPackageSha256,
      analysisMarkdown,
    });

    return {
      status: 'complete',
      report,
      contextPackage,
    };
  } catch (error) {
    return {
      status: 'failed',
      previousReport: previousReport.status === 'complete' ? previousReport : undefined,
      message:
        error instanceof Error ? error.message : 'Document relationship analysis failed.',
    };
  }
};
