import type {
  FolderContextReference,
  FolderMetadataStatus,
  FolderMetadataSummary,
  FolderSystemEffect,
  FolderTag,
} from '../shared/sidekick-api';

export const FOLDER_METADATA_FILE_NAME = '.sidekick-folder.json';
export const FOLDER_METADATA_SCHEMA = 'workspace-database.v1';
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

export const normalizeFolderTagLabel = (label: string) =>
  label.trim().replace(/\s+/g, ' ');

export const normalizeFolderTagKey = (label: string) =>
  normalizeFolderTagLabel(label).toLocaleLowerCase('nb-NO');

export const getSystemTagDefinition = (label: string) => {
  const normalizedLabel = normalizeFolderTagKey(label);

  return SYSTEM_TAGS.find((tag) => tag.normalizedLabel === normalizedLabel);
};

export const toFolderMetadataSummary = (
  status: FolderMetadataStatus,
  metadata?: FolderMetadataFile,
  message?: string,
): FolderMetadataSummary => ({
  status,
  tags: status === 'valid' ? metadata?.tags ?? [] : [],
  folderId: status === 'valid' ? metadata?.folderId : undefined,
  message,
});
