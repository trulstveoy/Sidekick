import { randomUUID } from 'node:crypto';
import { lstat, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  FolderContextReference,
  FolderMetadataStatus,
  FolderMetadataSummary,
  FolderSystemEffect,
  FolderTag,
  FolderTagKind,
} from '../shared/sidekick-api';

export const FOLDER_METADATA_FILE_NAME = '.sidekick-folder.json';
export const FOLDER_METADATA_SCHEMA = 'folder-metadata.v1';
export const ROOT_RELATIVE_PATH = '.';

export type FolderMetadataFile = {
  sidekickSchema: typeof FOLDER_METADATA_SCHEMA;
  folderId: string;
  createdAt: string;
  updatedAt: string;
  tags: FolderTag[];
};

type SystemTagDefinition = {
  label: string;
  normalizedLabel: string;
  systemEffect: FolderSystemEffect;
  contextType: FolderContextReference['type'];
};

const SYSTEM_TAGS: SystemTagDefinition[] = [
  {
    label: 'Prosjektmappe',
    normalizedLabel: 'prosjektmappe',
    systemEffect: 'project-root',
    contextType: 'project',
  },
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const normalizeFolderTagLabel = (label: string) =>
  label.trim().replace(/\s+/g, ' ');

export const normalizeFolderTagKey = (label: string) =>
  normalizeFolderTagLabel(label).toLocaleLowerCase('nb-NO');

const slugify = (value: string) =>
  normalizeFolderTagLabel(value)
    .toLocaleLowerCase('nb-NO')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

const shortId = () => randomUUID().slice(0, 8);

const createFolderId = (folderName: string) =>
  `folder-${slugify(folderName) || 'folder'}-${shortId()}`;

const createContextId = (folderName: string) =>
  `project-${slugify(folderName) || 'project'}-${shortId()}`;

export const getSystemTagDefinition = (label: string) => {
  const normalizedLabel = normalizeFolderTagKey(label);

  return SYSTEM_TAGS.find((tag) => tag.normalizedLabel === normalizedLabel);
};

const createTag = (
  label: string,
  folderName: string,
  updatedAt: string,
  existingTag?: FolderTag,
): FolderTag => {
  const systemTag = getSystemTagDefinition(label);

  if (systemTag) {
    return {
      label: systemTag.label,
      normalizedLabel: systemTag.normalizedLabel,
      kind: 'system',
      systemEffect: systemTag.systemEffect,
      context: existingTag?.context ?? {
        id: createContextId(folderName),
        type: systemTag.contextType,
        name: folderName,
      },
      source: 'explicit',
      updatedAt,
    };
  }

  const normalizedLabel = normalizeFolderTagLabel(label);

  return {
    label: normalizedLabel,
    normalizedLabel: normalizeFolderTagKey(normalizedLabel),
    kind: 'free',
    source: 'explicit',
    updatedAt,
  };
};

const isFolderTagKind = (value: unknown): value is FolderTagKind =>
  value === 'system' || value === 'free';

const isFolderSystemEffect = (value: unknown): value is FolderSystemEffect =>
  value === 'project-root';

const validateContextReference = (value: unknown): FolderContextReference | undefined => {
  if (!isObjectRecord(value)) {
    return undefined;
  }

  const { id, type, name } = value;

  if (typeof id !== 'string' || typeof name !== 'string' || type !== 'project') {
    return undefined;
  }

  return {
    id,
    type,
    name,
  };
};

const validateFolderTag = (value: unknown): FolderTag | null => {
  if (!isObjectRecord(value)) {
    return null;
  }

  const { label, normalizedLabel, kind, source, updatedAt, systemEffect, context } = value;

  if (
    typeof label !== 'string' ||
    typeof normalizedLabel !== 'string' ||
    !isFolderTagKind(kind) ||
    source !== 'explicit' ||
    typeof updatedAt !== 'string'
  ) {
    return null;
  }

  if (kind === 'system') {
    if (!isFolderSystemEffect(systemEffect)) {
      return null;
    }

    const contextReference = validateContextReference(context);
    if (!contextReference) {
      return null;
    }

    const systemTag = getSystemTagDefinition(label);
    if (!systemTag || systemTag.systemEffect !== systemEffect) {
      return null;
    }

    return {
      label: systemTag.label,
      normalizedLabel: systemTag.normalizedLabel,
      kind,
      source,
      updatedAt,
      systemEffect,
      context: contextReference,
    };
  }

  return {
    label,
    normalizedLabel,
    kind,
    source,
    updatedAt,
  };
};

const validateMetadataFile = (value: unknown): FolderMetadataFile => {
  if (!isObjectRecord(value)) {
    throw new Error('Folder metadata must be a JSON object.');
  }

  const { sidekickSchema, folderId, createdAt, updatedAt, tags } = value;

  if (sidekickSchema !== FOLDER_METADATA_SCHEMA) {
    throw new Error('Unsupported folder metadata schema.');
  }

  if (
    typeof folderId !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof updatedAt !== 'string' ||
    !Array.isArray(tags)
  ) {
    throw new Error('Folder metadata is missing required fields.');
  }

  const validatedTags = tags.map(validateFolderTag);

  if (validatedTags.some((tag) => tag === null)) {
    throw new Error('Folder metadata contains invalid tags.');
  }

  return {
    sidekickSchema,
    folderId,
    createdAt,
    updatedAt,
    tags: validatedTags as FolderTag[],
  };
};

const markerPathForFolder = (folderPath: string) =>
  path.join(folderPath, FOLDER_METADATA_FILE_NAME);

export const markerRelativePathForFolder = (folderRelativePath: string) =>
  folderRelativePath === ROOT_RELATIVE_PATH
    ? FOLDER_METADATA_FILE_NAME
    : `${folderRelativePath}/${FOLDER_METADATA_FILE_NAME}`;

export const toFolderMetadataSummary = (
  status: FolderMetadataStatus,
  folderRelativePath: string,
  metadata?: FolderMetadataFile,
  message?: string,
): FolderMetadataSummary => ({
  status,
  tags: status === 'valid' ? metadata?.tags ?? [] : [],
  markerRelativePath: markerRelativePathForFolder(folderRelativePath),
  folderId: status === 'valid' ? metadata?.folderId : undefined,
  message,
});

export const readFolderMetadataFile = async (
  folderPath: string,
): Promise<FolderMetadataFile | null> => {
  const metadataPath = markerPathForFolder(folderPath);

  let raw: string;
  try {
    raw = await readFile(metadataPath, 'utf8');
  } catch {
    return null;
  }

  return validateMetadataFile(JSON.parse(raw));
};

export type FolderMetadataReadResult =
  | { status: 'none' }
  | { status: 'valid'; metadata: FolderMetadataFile }
  | { status: 'invalid'; message: string }
  | { status: 'unsupported'; message: string };

export const readFolderMetadataForScan = async (
  folderPath: string,
): Promise<FolderMetadataReadResult> => {
  const metadataPath = markerPathForFolder(folderPath);

  let raw: string;
  try {
    raw = await readFile(metadataPath, 'utf8');
  } catch {
    return { status: 'none' };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (
      isObjectRecord(parsed) &&
      parsed.sidekickSchema !== undefined &&
      parsed.sidekickSchema !== FOLDER_METADATA_SCHEMA
    ) {
      return {
        status: 'unsupported',
        message: 'Folder metadata uses an unsupported schema.',
      };
    }

    return {
      status: 'valid',
      metadata: validateMetadataFile(parsed),
    };
  } catch (error) {
    return {
      status: 'invalid',
      message: error instanceof Error ? error.message : 'Folder metadata could not be read.',
    };
  }
};

const readOrCreateMetadataFile = async (folderPath: string, folderName: string, now: string) => {
  const existing = await readFolderMetadataFile(folderPath);

  if (existing) {
    return existing;
  }

  return {
    sidekickSchema: FOLDER_METADATA_SCHEMA,
    folderId: createFolderId(folderName),
    createdAt: now,
    updatedAt: now,
    tags: [],
  } satisfies FolderMetadataFile;
};

const writeFolderMetadataFile = async (folderPath: string, metadata: FolderMetadataFile) => {
  const metadataPath = markerPathForFolder(folderPath);
  const temporaryPath = path.join(
    folderPath,
    `${FOLDER_METADATA_FILE_NAME}.${process.pid}.${Date.now()}.tmp`,
  );

  await writeFile(temporaryPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  await rename(temporaryPath, metadataPath);
};

const assertFolderPath = async (folderPath: string) => {
  const stats = await lstat(folderPath);

  if (!stats.isDirectory()) {
    throw new Error('Selected path must be a folder.');
  }
};

export const addFolderTag = async (folderPath: string, label: string) => {
  await assertFolderPath(folderPath);

  const normalizedInput = normalizeFolderTagLabel(label);
  if (!normalizedInput) {
    throw new Error('Tag label is required.');
  }

  const folderName = path.basename(folderPath);
  const now = new Date().toISOString();
  const metadata = await readOrCreateMetadataFile(folderPath, folderName, now);
  const normalizedKey = normalizeFolderTagKey(label);
  const existingTag = metadata.tags.find((tag) => tag.normalizedLabel === normalizedKey);
  const nextTag = createTag(label, folderName, now, existingTag);
  const nextTags = metadata.tags.filter((tag) => tag.normalizedLabel !== nextTag.normalizedLabel);

  metadata.tags = [...nextTags, nextTag];
  metadata.updatedAt = now;
  await writeFolderMetadataFile(folderPath, metadata);

  return metadata;
};

export const removeFolderTag = async (folderPath: string, label: string) => {
  await assertFolderPath(folderPath);

  const metadata = await readFolderMetadataFile(folderPath);
  const now = new Date().toISOString();
  const normalizedKey = normalizeFolderTagKey(label);

  if (!metadata) {
    throw new Error('Folder metadata does not exist.');
  }

  metadata.tags = metadata.tags.filter((tag) => tag.normalizedLabel !== normalizedKey);
  metadata.updatedAt = now;
  await writeFolderMetadataFile(folderPath, metadata);

  return metadata;
};
