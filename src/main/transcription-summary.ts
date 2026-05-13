import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  TranscriptionSummaryGenerationResult,
  TranscriptionSummarySnapshot,
} from '../shared/sidekick-api';
import { buildTranscriptionSummaryPrompt } from './prompts/transcription-summary.nb';
import type { CodexRunner } from './codex-runner';

const SIDEKICK_METADATA_FOLDER = '.sidekick';
const TRANSCRIPTION_SUMMARY_FOLDER = 'transcription-summaries';
const SUMMARY_SCHEMA = 'transcription-summary.v1';
const ALLOWED_TRANSCRIPTION_EXTENSIONS = new Set(['.txt', '.md', '.markdown']);

type SummaryMetadata = {
  schema: string;
  generated_at: string;
  transcription_relative_path: string;
  transcription_sha256: string;
  summary_language: 'nb';
};

type GenerateTranscriptionSummaryRequest = {
  rootPath: string;
  transcriptionPath: string;
  codexRunner: CodexRunner;
};

const normalizeRelativePathForKey = (relativePath: string) => relativePath.split(path.sep).join('/');

const isPathInside = (parentPath: string, candidatePath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(candidatePath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const sha256 = (value: string | Buffer) => createHash('sha256').update(value).digest('hex');

const assertTranscriptionRelativePath = (relativePath: string) => {
  if (!relativePath || path.isAbsolute(relativePath)) {
    throw new Error('A project-relative transcription path is required.');
  }

  const normalized = path.normalize(relativePath);
  const parts = normalized.split(path.sep);

  if (parts.includes('..') || parts.includes('')) {
    throw new Error('The transcription path must stay inside the selected project.');
  }

  if (!ALLOWED_TRANSCRIPTION_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) {
    throw new Error('The transcription summary can only be read for .txt, .md, or .markdown files.');
  }

  return normalized;
};

export const relativeTranscriptionSummaryPath = (transcriptionRelativePath: string) => {
  const normalizedPath = normalizeRelativePathForKey(assertTranscriptionRelativePath(transcriptionRelativePath));
  const key = sha256(normalizedPath);

  return path.join(SIDEKICK_METADATA_FOLDER, TRANSCRIPTION_SUMMARY_FOLDER, `${key}.summary.md`);
};

const transcriptionSummaryPath = (rootPath: string, transcriptionRelativePath: string) =>
  path.join(rootPath, relativeTranscriptionSummaryPath(transcriptionRelativePath));

const relativePathFromRoot = (rootPath: string, candidatePath: string) => {
  if (!path.isAbsolute(rootPath) || !path.isAbsolute(candidatePath)) {
    throw new Error('Absolute project and transcription paths are required.');
  }

  if (!isPathInside(rootPath, candidatePath)) {
    throw new Error('The transcription must be inside the selected project.');
  }

  return assertTranscriptionRelativePath(path.relative(rootPath, candidatePath));
};

const parseSummaryDocument = (document: string) => {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/m.exec(document);

  if (!match) {
    throw new Error('The transcription summary metadata is missing.');
  }

  const metadata: Partial<SummaryMetadata> = {};
  const [, frontmatter, body] = match;

  for (const line of frontmatter.split(/\r?\n/)) {
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim() as keyof SummaryMetadata;
    const value = line.slice(separatorIndex + 1).trim();

    metadata[key] = value as never;
  }

  if (
    metadata.schema !== SUMMARY_SCHEMA ||
    !metadata.generated_at ||
    !metadata.transcription_relative_path ||
    !metadata.transcription_sha256
  ) {
    throw new Error('The transcription summary metadata is incomplete.');
  }

  return {
    metadata: metadata as SummaryMetadata,
    body: body.trim(),
  };
};

const summarySnapshotBase = (rootPath: string, transcriptionRelativePath: string) => ({
  rootPath,
  transcriptionRelativePath: normalizeRelativePathForKey(assertTranscriptionRelativePath(transcriptionRelativePath)),
  summaryRelativePath: normalizeRelativePathForKey(relativeTranscriptionSummaryPath(transcriptionRelativePath)),
  summaryPath: transcriptionSummaryPath(rootPath, transcriptionRelativePath),
});

export const readTranscriptionSummary = async (
  rootPath: string,
  transcriptionRelativePath: string,
): Promise<TranscriptionSummarySnapshot> => {
  const base = summarySnapshotBase(rootPath, transcriptionRelativePath);
  const summaryPath = transcriptionSummaryPath(rootPath, transcriptionRelativePath);

  try {
    const [summaryDocument, currentTranscription] = await Promise.all([
      readFile(summaryPath, 'utf8'),
      readFile(path.join(rootPath, assertTranscriptionRelativePath(transcriptionRelativePath))),
    ]);
    const { metadata, body } = parseSummaryDocument(summaryDocument);
    const currentTranscriptionSha256 = sha256(currentTranscription);

    return {
      ...base,
      status:
        currentTranscriptionSha256 === metadata.transcription_sha256 ? 'complete' : 'stale',
      generatedAt: metadata.generated_at,
      transcriptionSha256: metadata.transcription_sha256,
      currentTranscriptionSha256,
      summaryLanguage: metadata.summary_language,
      conversationSummary: body,
      message:
        currentTranscriptionSha256 === metadata.transcription_sha256
          ? undefined
          : 'Sammendraget er laget for en eldre versjon av transkripsjonen.',
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {
        ...base,
        status: 'missing',
        message: 'Ingen samtalesammendrag er laget for denne transkripsjonen ennå.',
      };
    }

    return {
      ...base,
      status: 'invalid',
      message: error instanceof Error ? error.message : 'Sammendraget kunne ikke leses.',
    };
  }
};

export const writeTranscriptionSummary = async ({
  rootPath,
  transcriptionPath,
  summaryMarkdown,
}: {
  rootPath: string;
  transcriptionPath: string;
  summaryMarkdown: string;
}) => {
  const transcriptionRelativePath = relativePathFromRoot(rootPath, transcriptionPath);
  const transcription = await readFile(transcriptionPath);
  const generatedAt = new Date().toISOString();
  const metadata: SummaryMetadata = {
    schema: SUMMARY_SCHEMA,
    generated_at: generatedAt,
    transcription_relative_path: normalizeRelativePathForKey(transcriptionRelativePath),
    transcription_sha256: sha256(transcription),
    summary_language: 'nb',
  };
  const summaryPath = transcriptionSummaryPath(rootPath, transcriptionRelativePath);
  const frontmatter = [
    '---',
    `schema: ${metadata.schema}`,
    `generated_at: ${metadata.generated_at}`,
    `transcription_relative_path: ${metadata.transcription_relative_path}`,
    `transcription_sha256: ${metadata.transcription_sha256}`,
    `summary_language: ${metadata.summary_language}`,
    '---',
    '',
  ].join('\n');

  await mkdir(path.dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${frontmatter}${summaryMarkdown.trim()}\n`, 'utf8');

  return readTranscriptionSummary(rootPath, transcriptionRelativePath);
};

const collectTextFromCodexEvent = (value: unknown): string[] => {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  const collected: string[] = [];

  if (record.type === 'output_text' && typeof record.text === 'string') {
    collected.push(record.text);
  }

  if (record.type === 'agent_message' && typeof record.message === 'string') {
    collected.push(record.message);
  }

  if (record.type === 'message' && record.role === 'assistant') {
    if (typeof record.content === 'string') {
      collected.push(record.content);
    } else if (Array.isArray(record.content)) {
      collected.push(...record.content.flatMap(collectTextFromCodexEvent));
    }
  }

  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      collected.push(...child.flatMap(collectTextFromCodexEvent));
    } else if (child && typeof child === 'object') {
      collected.push(...collectTextFromCodexEvent(child));
    }
  }

  return [...new Set(collected.map((item) => item.trim()).filter(Boolean))];
};

export const extractSummaryMarkdownFromCodexOutput = (stdout: string) => {
  const jsonCandidates: string[] = [];
  const plainCandidates: string[] = [];

  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('{')) {
      try {
        jsonCandidates.push(...collectTextFromCodexEvent(JSON.parse(trimmed)));
        continue;
      } catch {
        plainCandidates.push(trimmed);
        continue;
      }
    }

    plainCandidates.push(trimmed);
  }

  const candidate = [...jsonCandidates, plainCandidates.join('\n')]
    .map((value) => value.trim())
    .reverse()
    .find((value) => value.includes('## Conversation Summary'));

  if (!candidate) {
    throw new Error('Codex did not return a Conversation Summary section.');
  }

  return candidate;
};

export const generateTranscriptionSummary = async ({
  rootPath,
  transcriptionPath,
  codexRunner,
}: GenerateTranscriptionSummaryRequest): Promise<TranscriptionSummaryGenerationResult> => {
  try {
    const transcriptionStats = await stat(transcriptionPath);

    if (!transcriptionStats.isFile()) {
      throw new Error('The imported transcription is not a file.');
    }

    const status = await codexRunner.getStatus(rootPath);

    if (status.state !== 'ready') {
      throw new Error(status.message ?? 'Codex must be installed and logged in before Sidekick can summarize.');
    }

    const transcriptionText = await readFile(transcriptionPath, 'utf8');
    const prompt = buildTranscriptionSummaryPrompt(path.basename(transcriptionPath), transcriptionText);
    const result = await codexRunner.runExecText(rootPath, prompt, 'read-only');

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (result.code !== 0) {
      throw new Error((result.stderr || result.stdout || 'Codex summary generation failed.').trim());
    }

    const summaryMarkdown = extractSummaryMarkdownFromCodexOutput(result.stdout);
    const summary = await writeTranscriptionSummary({
      rootPath,
      transcriptionPath,
      summaryMarkdown,
    });

    return { status: 'complete', summary };
  } catch (error) {
    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Sammendraget kunne ikke lages.',
    };
  }
};
