import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { WorkspaceInfoSnapshot } from '../shared/sidekick-api';

export const SIDEKICK_METADATA_FOLDER = '.sidekick';
export const WORKSPACE_INFO_FILE_NAME = 'workspace-info.md';
export const WORKSPACE_INFO_SCHEMA = 'workspace-info.v1';

type WorkspaceInfoWriteInput = {
  rootPath: string;
  contextPackagePath: string;
  contextPackageSha256: string;
  summaryMarkdown: string;
  generatedAt?: string;
};

type WorkspaceInfoMetadata = {
  generatedAt: string;
  sourceScope: 'full-workspace';
  contextPackagePath: string;
  contextPackageSha256: string;
  summaryLanguage: 'nb';
};

const REQUIRED_SUMMARY_SECTIONS = ['Workspace Summary', 'Participants', 'Themes'];

const normalizeNewlines = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const toPosixPath = (value: string) => value.split(path.sep).join('/');

const isPathInside = (parentPath: string, candidatePath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const assertWorkspacePath = (rootPath: string, candidatePath: string) => {
  if (!path.isAbsolute(rootPath)) {
    throw new Error('Workspace root path must be absolute.');
  }

  if (!isPathInside(rootPath, candidatePath)) {
    throw new Error('Workspace info path must stay inside the selected workspace.');
  }
};

export const getSidekickMetadataPath = (rootPath: string) => {
  const metadataPath = path.join(rootPath, SIDEKICK_METADATA_FOLDER);
  assertWorkspacePath(rootPath, metadataPath);

  return metadataPath;
};

export const getWorkspaceInfoPath = (rootPath: string) => {
  const workspaceInfoPath = path.join(getSidekickMetadataPath(rootPath), WORKSPACE_INFO_FILE_NAME);
  assertWorkspacePath(rootPath, workspaceInfoPath);

  return workspaceInfoPath;
};

export const toWorkspaceRelativePath = (rootPath: string, targetPath: string) => {
  assertWorkspacePath(rootPath, targetPath);

  const relativePath = path.relative(rootPath, targetPath);

  return `./${toPosixPath(relativePath)}`;
};

const parseFrontMatter = (markdown: string) => {
  const normalized = normalizeNewlines(markdown);
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);

  if (!match) {
    throw new Error('Workspace info front matter is missing.');
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

export const parseMarkdownSections = (markdown: string) => {
  const normalized = normalizeNewlines(markdown);
  const headingPattern = /^## ([^\n]+)$/gm;
  const headings: Array<{ title: string; index: number; contentStart: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = headingPattern.exec(normalized))) {
    headings.push({
      title: match[1].trim(),
      index: match.index,
      contentStart: headingPattern.lastIndex,
    });
  }

  const sections = new Map<string, string>();

  headings.forEach((heading, index) => {
    const nextHeading = headings[index + 1];
    const contentEnd = nextHeading ? nextHeading.index : normalized.length;
    sections.set(heading.title, normalized.slice(heading.contentStart, contentEnd).trim());
  });

  return sections;
};

export const validateWorkspaceSummaryMarkdown = (summaryMarkdown: string) => {
  const sections = parseMarkdownSections(summaryMarkdown);
  const missingSections = REQUIRED_SUMMARY_SECTIONS.filter((section) => !sections.get(section));

  if (missingSections.length > 0) {
    throw new Error(`Workspace summary is missing required sections: ${missingSections.join(', ')}.`);
  }

  return sections;
};

const parseListSection = (value: string | undefined) => {
  if (!value) {
    return [];
  }

  return value
    .split('\n')
    .map((line) => line.trim().replace(/^[-*]\s+/, ''))
    .filter((line) => line.length > 0);
};

const createFrontMatter = (metadata: WorkspaceInfoMetadata) => [
  '---',
  `sidekick_schema: ${WORKSPACE_INFO_SCHEMA}`,
  `generated_at: ${metadata.generatedAt}`,
  `source_scope: ${metadata.sourceScope}`,
  `context_package_path: ${metadata.contextPackagePath}`,
  `context_package_sha256: ${metadata.contextPackageSha256}`,
  `summary_language: ${metadata.summaryLanguage}`,
  '---',
  '',
].join('\n');

export const createWorkspaceInfoMarkdown = ({
  rootPath,
  contextPackagePath,
  contextPackageSha256,
  summaryMarkdown,
  generatedAt = new Date().toISOString(),
}: WorkspaceInfoWriteInput) => {
  validateWorkspaceSummaryMarkdown(summaryMarkdown);
  const metadata: WorkspaceInfoMetadata = {
    generatedAt,
    sourceScope: 'full-workspace',
    contextPackagePath: toWorkspaceRelativePath(rootPath, contextPackagePath),
    contextPackageSha256,
    summaryLanguage: 'nb',
  };
  const normalizedSummary = normalizeNewlines(summaryMarkdown).trim();

  return [
    createFrontMatter(metadata),
    '# Sidekick Workspace Info',
    '',
    normalizedSummary,
    '',
    '## Source Context',
    '',
    '- Scope: full-workspace',
    `- Context package: \`${metadata.contextPackagePath}\``,
    `- Generated at: \`${metadata.generatedAt}\``,
    `- Context hash: \`${metadata.contextPackageSha256}\``,
    '',
  ].join('\n');
};

export const parseWorkspaceInfoMarkdown = (
  workspaceInfoPath: string,
  markdown: string,
): WorkspaceInfoSnapshot => {
  const { attributes, body } = parseFrontMatter(markdown);

  if (attributes.get('sidekick_schema') !== WORKSPACE_INFO_SCHEMA) {
    throw new Error('Workspace info schema is unsupported.');
  }

  const sections = parseMarkdownSections(body);
  const workspaceSummary = sections.get('Workspace Summary');

  if (!workspaceSummary) {
    throw new Error('Workspace info summary section is missing.');
  }

  return {
    status: 'complete',
    path: workspaceInfoPath,
    generatedAt: attributes.get('generated_at'),
    sourceScope: attributes.get('source_scope') === 'full-workspace' ? 'full-workspace' : undefined,
    contextPackagePath: attributes.get('context_package_path'),
    contextPackageSha256: attributes.get('context_package_sha256'),
    summaryLanguage: attributes.get('summary_language') === 'nb' ? 'nb' : undefined,
    workspaceSummary,
    participants: sections.get('Participants'),
    themes: parseListSection(sections.get('Themes')),
    openQuestions: parseListSection(sections.get('Open Questions')).filter(
      (question) => !/^ingen tydelige/i.test(question),
    ),
  };
};

export const readWorkspaceInfo = async (rootPath: string): Promise<WorkspaceInfoSnapshot> => {
  const workspaceInfoPath = getWorkspaceInfoPath(rootPath);

  try {
    const markdown = await readFile(workspaceInfoPath, 'utf8');

    return parseWorkspaceInfoMarkdown(workspaceInfoPath, markdown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        status: 'missing',
        path: workspaceInfoPath,
      };
    }

    return {
      status: 'invalid',
      path: workspaceInfoPath,
      message: error instanceof Error ? error.message : 'Workspace info could not be read.',
    };
  }
};

export const writeWorkspaceInfo = async (
  input: WorkspaceInfoWriteInput,
): Promise<WorkspaceInfoSnapshot> => {
  const metadataPath = getSidekickMetadataPath(input.rootPath);
  const workspaceInfoPath = getWorkspaceInfoPath(input.rootPath);
  const markdown = createWorkspaceInfoMarkdown(input);

  await mkdir(metadataPath, { recursive: true });
  await writeFile(workspaceInfoPath, markdown, 'utf8');

  return parseWorkspaceInfoMarkdown(workspaceInfoPath, markdown);
};
