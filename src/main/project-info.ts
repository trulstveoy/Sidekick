import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ProjectInfoSnapshot } from '../shared/sidekick-api';

export const SIDEKICK_METADATA_FOLDER = '.sidekick';
export const PROJECT_INFO_FILE_NAME = 'project-info.md';
export const PROJECT_INFO_SCHEMA = 'project-info.v1';

type ProjectInfoWriteInput = {
  rootPath: string;
  contextPackagePath: string;
  contextPackageSha256: string;
  summaryMarkdown: string;
  generatedAt?: string;
};

type ProjectInfoMetadata = {
  generatedAt: string;
  sourceScope: 'full-project';
  contextPackagePath: string;
  contextPackageSha256: string;
  summaryLanguage: 'nb';
};

const REQUIRED_SUMMARY_SECTIONS = ['Project Summary', 'Participants', 'Themes'];

const normalizeNewlines = (value: string) => value.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const toPosixPath = (value: string) => value.split(path.sep).join('/');

const isPathInside = (parentPath: string, candidatePath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const assertProjectPath = (rootPath: string, candidatePath: string) => {
  if (!path.isAbsolute(rootPath)) {
    throw new Error('Project root path must be absolute.');
  }

  if (!isPathInside(rootPath, candidatePath)) {
    throw new Error('Project info path must stay inside the selected project.');
  }
};

export const getSidekickMetadataPath = (rootPath: string) => {
  const metadataPath = path.join(rootPath, SIDEKICK_METADATA_FOLDER);
  assertProjectPath(rootPath, metadataPath);

  return metadataPath;
};

export const getProjectInfoPath = (rootPath: string) => {
  const projectInfoPath = path.join(getSidekickMetadataPath(rootPath), PROJECT_INFO_FILE_NAME);
  assertProjectPath(rootPath, projectInfoPath);

  return projectInfoPath;
};

export const toProjectRelativePath = (rootPath: string, targetPath: string) => {
  assertProjectPath(rootPath, targetPath);

  const relativePath = path.relative(rootPath, targetPath);

  return `./${toPosixPath(relativePath)}`;
};

const parseFrontMatter = (markdown: string) => {
  const normalized = normalizeNewlines(markdown);
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalized);

  if (!match) {
    throw new Error('Project info front matter is missing.');
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

export const validateProjectSummaryMarkdown = (summaryMarkdown: string) => {
  const sections = parseMarkdownSections(summaryMarkdown);
  const missingSections = REQUIRED_SUMMARY_SECTIONS.filter((section) => !sections.get(section));

  if (missingSections.length > 0) {
    throw new Error(`Project summary is missing required sections: ${missingSections.join(', ')}.`);
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

const createFrontMatter = (metadata: ProjectInfoMetadata) => [
  '---',
  `sidekick_schema: ${PROJECT_INFO_SCHEMA}`,
  `generated_at: ${metadata.generatedAt}`,
  `source_scope: ${metadata.sourceScope}`,
  `context_package_path: ${metadata.contextPackagePath}`,
  `context_package_sha256: ${metadata.contextPackageSha256}`,
  `summary_language: ${metadata.summaryLanguage}`,
  '---',
  '',
].join('\n');

export const createProjectInfoMarkdown = ({
  rootPath,
  contextPackagePath,
  contextPackageSha256,
  summaryMarkdown,
  generatedAt = new Date().toISOString(),
}: ProjectInfoWriteInput) => {
  validateProjectSummaryMarkdown(summaryMarkdown);
  const metadata: ProjectInfoMetadata = {
    generatedAt,
    sourceScope: 'full-project',
    contextPackagePath: toProjectRelativePath(rootPath, contextPackagePath),
    contextPackageSha256,
    summaryLanguage: 'nb',
  };
  const normalizedSummary = normalizeNewlines(summaryMarkdown).trim();

  return [
    createFrontMatter(metadata),
    '# Sidekick Project Info',
    '',
    normalizedSummary,
    '',
    '## Source Context',
    '',
    '- Scope: full-project',
    `- Context package: \`${metadata.contextPackagePath}\``,
    `- Generated at: \`${metadata.generatedAt}\``,
    `- Context hash: \`${metadata.contextPackageSha256}\``,
    '',
  ].join('\n');
};

export const parseProjectInfoMarkdown = (
  projectInfoPath: string,
  markdown: string,
): ProjectInfoSnapshot => {
  const { attributes, body } = parseFrontMatter(markdown);

  if (attributes.get('sidekick_schema') !== PROJECT_INFO_SCHEMA) {
    throw new Error('Project info schema is unsupported.');
  }

  const sections = parseMarkdownSections(body);
  const projectSummary = sections.get('Project Summary');

  if (!projectSummary) {
    throw new Error('Project info summary section is missing.');
  }

  return {
    status: 'complete',
    path: projectInfoPath,
    generatedAt: attributes.get('generated_at'),
    sourceScope: attributes.get('source_scope') === 'full-project' ? 'full-project' : undefined,
    contextPackagePath: attributes.get('context_package_path'),
    contextPackageSha256: attributes.get('context_package_sha256'),
    summaryLanguage: attributes.get('summary_language') === 'nb' ? 'nb' : undefined,
    projectSummary,
    participants: sections.get('Participants'),
    themes: parseListSection(sections.get('Themes')),
    openQuestions: parseListSection(sections.get('Open Questions')).filter(
      (question) => !/^ingen tydelige/i.test(question),
    ),
  };
};

export const readProjectInfo = async (rootPath: string): Promise<ProjectInfoSnapshot> => {
  const projectInfoPath = getProjectInfoPath(rootPath);

  try {
    const markdown = await readFile(projectInfoPath, 'utf8');

    return parseProjectInfoMarkdown(projectInfoPath, markdown);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        status: 'missing',
        path: projectInfoPath,
      };
    }

    return {
      status: 'invalid',
      path: projectInfoPath,
      message: error instanceof Error ? error.message : 'Project info could not be read.',
    };
  }
};

export const writeProjectInfo = async (
  input: ProjectInfoWriteInput,
): Promise<ProjectInfoSnapshot> => {
  const metadataPath = getSidekickMetadataPath(input.rootPath);
  const projectInfoPath = getProjectInfoPath(input.rootPath);
  const markdown = createProjectInfoMarkdown(input);

  await mkdir(metadataPath, { recursive: true });
  await writeFile(projectInfoPath, markdown, 'utf8');

  return parseProjectInfoMarkdown(projectInfoPath, markdown);
};
