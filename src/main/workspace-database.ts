import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  FolderMetadataSummary,
  FolderSystemEffect,
  FolderTag,
  FolderTagKind,
  FolderTreeNode,
} from '../shared/sidekick-api';
import { getSystemTagDefinition, normalizeFolderTagKey, normalizeFolderTagLabel } from './context-metadata';
import { SIDEKICK_METADATA_FOLDER } from './workspace-info';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as {
  DatabaseSync: new (filePath: string) => WorkspaceSqliteDatabase;
};

const DATABASE_FILE_NAME = 'sidekick.db';
const CURRENT_SCHEMA_VERSION = 1;

type WorkspaceSqliteStatement = {
  run: (...values: unknown[]) => { changes: number; lastInsertRowid: number | bigint };
  get: (...values: unknown[]) => Record<string, unknown> | undefined;
  all: (...values: unknown[]) => Array<Record<string, unknown>>;
};

type WorkspaceSqliteDatabase = {
  close: () => void;
  exec: (sql: string) => void;
  prepare: (sql: string) => WorkspaceSqliteStatement;
};

type EntryKind = 'folder' | 'file';
type EntryStatus = 'active' | 'missing';

type FilesystemEntryRow = {
  id: string;
  relative_path: string;
  kind: EntryKind;
  name: string;
  status: EntryStatus;
};

type TagRow = {
  id: string;
  label: string;
  normalized_label: string;
  kind: FolderTagKind;
  system_effect: FolderSystemEffect | null;
};

type EntryTagRow = TagRow & {
  entry_id: string;
  source: 'explicit';
  updated_at: string;
  context_id: string | null;
  context_type: 'project' | null;
  context_name: string | null;
};

const isPathInside = (parentPath: string, childPath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(childPath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const toPosixRelativePath = (rootPath: string, absolutePath: string) => {
  const relativePath = path.relative(rootPath, absolutePath);

  return relativePath === '' ? '.' : relativePath.split(path.sep).join('/');
};

const normalizeRelativePath = (relativePath: string) =>
  relativePath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/g, '') || '.';

const assertWorkspaceRelativePath = (relativePath: string) => {
  if (path.isAbsolute(relativePath)) {
    throw new Error('Workspace path must be relative.');
  }

  const normalized = normalizeRelativePath(relativePath);
  const segments = normalized === '.' ? [] : normalized.split('/');

  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error('Workspace path must stay inside the selected workspace.');
  }

  return normalized;
};

const createId = (prefix: string) => `${prefix}-${randomUUID()}`;

const mapEntryRow = (row: Record<string, unknown> | undefined): FilesystemEntryRow | undefined => {
  if (!row) {
    return undefined;
  }

  return {
    id: String(row.id),
    relative_path: String(row.relative_path),
    kind: row.kind === 'file' ? 'file' : 'folder',
    name: String(row.name),
    status: row.status === 'missing' ? 'missing' : 'active',
  };
};

const mapEntryTagRow = (row: Record<string, unknown>): EntryTagRow => ({
  entry_id: String(row.entry_id),
  id: String(row.id),
  label: String(row.label),
  normalized_label: String(row.normalized_label),
  kind: row.kind === 'system' ? 'system' : 'free',
  system_effect: row.system_effect === 'project-root' ? 'project-root' : null,
  source: 'explicit',
  updated_at: String(row.updated_at),
  context_id: typeof row.context_id === 'string' ? row.context_id : null,
  context_type: row.context_type === 'project' ? 'project' : null,
  context_name: typeof row.context_name === 'string' ? row.context_name : null,
});

const schemaSql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace (
  id TEXT PRIMARY KEY,
  root_path TEXT NOT NULL,
  root_name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_scanned_at TEXT,
  schema_version INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS filesystem_entry (
  id TEXT PRIMARY KEY,
  relative_path TEXT NOT NULL UNIQUE,
  parent_relative_path TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('folder', 'file')),
  name TEXT NOT NULL,
  artifact_type TEXT,
  size INTEGER,
  mtime_ms INTEGER,
  last_seen_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'missing')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_state (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tag (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  normalized_label TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('system', 'free')),
  system_effect TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS filesystem_entry_tag (
  entry_id TEXT NOT NULL REFERENCES filesystem_entry(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES tag(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source = 'explicit'),
  context_id TEXT,
  context_type TEXT,
  context_name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (entry_id, tag_id)
);

CREATE TABLE IF NOT EXISTS context (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type = 'project'),
  name TEXT NOT NULL,
  root_entry_id TEXT NOT NULL REFERENCES filesystem_entry(id) ON DELETE CASCADE,
  root_relative_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS context_entry (
  context_id TEXT NOT NULL REFERENCES context(id) ON DELETE CASCADE,
  entry_id TEXT NOT NULL REFERENCES filesystem_entry(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (context_id, entry_id, role)
);

CREATE TABLE IF NOT EXISTS generated_artifact (
  id TEXT PRIMARY KEY,
  entry_id TEXT REFERENCES filesystem_entry(id) ON DELETE SET NULL,
  artifact_kind TEXT NOT NULL,
  status TEXT NOT NULL,
  source_entry_id TEXT REFERENCES filesystem_entry(id) ON DELETE SET NULL,
  output_relative_path TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const getWorkspaceDatabasePath = (rootPath: string) => {
  const databasePath = path.join(rootPath, SIDEKICK_METADATA_FOLDER, DATABASE_FILE_NAME);

  if (!isPathInside(rootPath, databasePath)) {
    throw new Error('Workspace database path must stay inside the selected workspace.');
  }

  return databasePath;
};

export class WorkspaceDatabase {
  private readonly db: WorkspaceSqliteDatabase;

  private readonly rootPath: string;

  private constructor(rootPath: string, db: WorkspaceSqliteDatabase) {
    this.rootPath = rootPath;
    this.db = db;
    this.migrate();
    this.ensureWorkspaceRow();
    this.ensureSystemTags();
  }

  static async open(rootPath: string) {
    await mkdir(path.join(rootPath, SIDEKICK_METADATA_FOLDER), { recursive: true });

    return new WorkspaceDatabase(rootPath, new DatabaseSync(getWorkspaceDatabasePath(rootPath)));
  }

  close() {
    this.db.close();
  }

  syncTree(tree: FolderTreeNode) {
    const seenPaths = new Set<string>();
    const now = new Date().toISOString();

    this.transaction(() => {
      const visit = (node: FolderTreeNode, parentRelativePath: string | null) => {
        seenPaths.add(node.relativePath);
        this.upsertEntry({
          relativePath: node.relativePath,
          parentRelativePath,
          kind: node.kind,
          name: node.name,
          artifactType: node.artifactType,
          size: node.size,
          modifiedAt: node.modifiedAt,
          seenAt: now,
        });

        node.children?.forEach((child) => visit(child, node.relativePath));
      };

      visit(tree, null);
      this.markMissingEntries(seenPaths, now);
      this.db
        .prepare('UPDATE workspace SET last_scanned_at = ?, updated_at = ? WHERE root_path = ?')
        .run(now, now, this.rootPath);
    });
  }

  annotateTree(tree: FolderTreeNode) {
    const visit = (node: FolderTreeNode) => {
      if (node.kind === 'folder') {
        const metadata = this.getFolderMetadataSummary(node.relativePath);
        if (metadata.status !== 'none') {
          node.metadata = metadata;
        } else {
          delete node.metadata;
        }
      }

      node.children?.forEach(visit);
    };

    visit(tree);
  }

  addFolderTag(folderPath: string, label: string) {
    const relativePath = toPosixRelativePath(this.rootPath, folderPath);
    const now = new Date().toISOString();
    const normalizedInput = normalizeFolderTagLabel(label);

    if (!normalizedInput) {
      throw new Error('Tag label is required.');
    }

    return this.transaction(() => {
      const entry = this.ensureFolderEntry(relativePath, now);
      const tag = this.ensureTag(label, now);
      const existing = this.getEntryTag(entry.id, tag.id);
      const systemTag = tag.kind === 'system' ? getSystemTagDefinition(tag.label) : undefined;
      const contextId =
        systemTag?.contextType === 'project'
          ? existing?.context_id ?? `project-${randomUUID()}`
          : null;
      const contextType = systemTag?.contextType ?? null;
      const contextName = systemTag?.contextType === 'project' ? entry.name : null;

      this.db
        .prepare(
          [
            'INSERT INTO filesystem_entry_tag',
            '(entry_id, tag_id, source, context_id, context_type, context_name, created_at, updated_at)',
            'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            'ON CONFLICT(entry_id, tag_id) DO UPDATE SET',
            'source = excluded.source,',
            'context_id = COALESCE(filesystem_entry_tag.context_id, excluded.context_id),',
            'context_type = excluded.context_type,',
            'context_name = excluded.context_name,',
            'updated_at = excluded.updated_at',
          ].join(' '),
        )
        .run(entry.id, tag.id, 'explicit', contextId, contextType, contextName, now, now);

      if (contextId && contextType === 'project' && contextName) {
        this.upsertProjectContext({
          contextId,
          entryId: entry.id,
          rootRelativePath: entry.relative_path,
          name: contextName,
          now,
        });
      }

      return this.getFolderMetadataFile(relativePath);
    });
  }

  removeFolderTag(folderPath: string, label: string) {
    const relativePath = toPosixRelativePath(this.rootPath, folderPath);
    const normalizedKey = normalizeFolderTagKey(label);

    return this.transaction(() => {
      const entry = this.getEntry(relativePath);
      if (!entry) {
        throw new Error('Folder metadata does not exist.');
      }

      const tag = this.getTagByNormalizedLabel(normalizedKey);
      if (!tag) {
        return this.getFolderMetadataFile(relativePath);
      }

      const existingTag = this.getEntryTag(entry.id, tag.id);

      this.db
        .prepare('DELETE FROM filesystem_entry_tag WHERE entry_id = ? AND tag_id = ?')
        .run(entry.id, tag.id);

      if (existingTag?.context_id && existingTag.context_type === 'project') {
        this.deactivateContext(existingTag.context_id, new Date().toISOString());
      }

      return this.getFolderMetadataFile(relativePath);
    });
  }

  getFolderMetadataFile(relativePath: string) {
    const normalized = assertWorkspaceRelativePath(relativePath);
    const entry = this.getEntry(normalized);

    if (!entry) {
      throw new Error('Folder metadata does not exist.');
    }

    const tags = this.getTagsForEntry(entry.id);

    return {
      sidekickSchema: 'workspace-database.v1' as const,
      folderId: entry.id,
      createdAt: '',
      updatedAt: tags.reduce((latest, tag) => (tag.updatedAt > latest ? tag.updatedAt : latest), ''),
      tags,
    };
  }

  getFolderMetadataSummary(relativePath: string): FolderMetadataSummary {
    const normalized = assertWorkspaceRelativePath(relativePath);
    const entry = this.getEntry(normalized);

    if (!entry || entry.status !== 'active') {
      return {
        status: 'none',
        tags: [],
      };
    }

    const tags = this.getTagsForEntry(entry.id);

    if (tags.length === 0) {
      return {
        status: 'none',
        tags: [],
      };
    }

    return {
      status: 'valid',
      tags,
      folderId: entry.id,
    };
  }

  private migrate() {
    this.db.exec(schemaSql);
    const applied = this.db
      .prepare('SELECT version FROM schema_migrations WHERE version = ?')
      .get(CURRENT_SCHEMA_VERSION);

    if (!applied) {
      this.db
        .prepare('INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)')
        .run(CURRENT_SCHEMA_VERSION, 'workspace metadata database v1', new Date().toISOString());
    }
  }

  private ensureWorkspaceRow() {
    const now = new Date().toISOString();
    const existing = this.db.prepare('SELECT id FROM workspace LIMIT 1').get();

    if (existing) {
      this.db
        .prepare(
          'UPDATE workspace SET root_path = ?, root_name = ?, updated_at = ?, schema_version = ? WHERE id = ?',
        )
        .run(
          this.rootPath,
          path.basename(this.rootPath),
          now,
          CURRENT_SCHEMA_VERSION,
          String(existing.id),
        );
      return;
    }

    this.db
      .prepare(
        [
          'INSERT INTO workspace',
          '(id, root_path, root_name, created_at, updated_at, schema_version)',
          'VALUES (?, ?, ?, ?, ?, ?)',
        ].join(' '),
      )
      .run(
        createId('workspace'),
        this.rootPath,
        path.basename(this.rootPath),
        now,
        now,
        CURRENT_SCHEMA_VERSION,
      );
  }

  private ensureSystemTags() {
    const now = new Date().toISOString();
    this.ensureTag('Prosjektmappe', now);
  }

  private transaction<T>(callback: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');

    try {
      const result = callback();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  private upsertEntry({
    relativePath,
    parentRelativePath,
    kind,
    name,
    artifactType,
    size,
    modifiedAt,
    seenAt,
  }: {
    relativePath: string;
    parentRelativePath: string | null;
    kind: EntryKind;
    name: string;
    artifactType?: string;
    size?: number;
    modifiedAt?: string;
    seenAt: string;
  }) {
    const normalized = assertWorkspaceRelativePath(relativePath);
    const existing = this.getEntry(normalized);
    const mtimeMs = modifiedAt ? Date.parse(modifiedAt) : null;

    if (existing) {
      this.db
        .prepare(
          [
            'UPDATE filesystem_entry SET',
            'parent_relative_path = ?, kind = ?, name = ?, artifact_type = ?, size = ?,',
            'mtime_ms = ?, last_seen_at = ?, status = ?, updated_at = ?',
            'WHERE relative_path = ?',
          ].join(' '),
        )
        .run(
          parentRelativePath,
          kind,
          name,
          artifactType ?? null,
          size ?? null,
          mtimeMs,
          seenAt,
          'active',
          seenAt,
          normalized,
        );
      return existing.id;
    }

    const id = createId(kind);
    this.db
      .prepare(
        [
          'INSERT INTO filesystem_entry',
          '(',
          'id, relative_path, parent_relative_path, kind, name, artifact_type, size, mtime_ms,',
          'last_seen_at, status, created_at, updated_at',
          ') VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ].join(' '),
      )
      .run(
        id,
        normalized,
        parentRelativePath,
        kind,
        name,
        artifactType ?? null,
        size ?? null,
        mtimeMs,
        seenAt,
        'active',
        seenAt,
        seenAt,
      );

    return id;
  }

  private markMissingEntries(seenPaths: Set<string>, now: string) {
    const rows = this.db.prepare('SELECT relative_path FROM filesystem_entry WHERE status = ?').all('active');

    rows.forEach((row) => {
      const relativePath = String(row.relative_path);

      if (!seenPaths.has(relativePath)) {
        this.db
          .prepare('UPDATE filesystem_entry SET status = ?, updated_at = ? WHERE relative_path = ?')
          .run('missing', now, relativePath);
      }
    });
  }

  private ensureFolderEntry(relativePath: string, now: string) {
    const normalized = assertWorkspaceRelativePath(relativePath);
    const existing = this.getEntry(normalized);

    if (existing) {
      if (existing.kind !== 'folder') {
        throw new Error('Selected path must be a folder.');
      }

      return existing;
    }

    const absolutePath = path.resolve(this.rootPath, ...normalized.split('/').filter(Boolean));
    const parentRelativePath = normalized === '.' ? null : path.dirname(normalized).replace(/\\/g, '/');
    this.upsertEntry({
      relativePath: normalized,
      parentRelativePath: parentRelativePath === '.' ? null : parentRelativePath,
      kind: 'folder',
      name: path.basename(absolutePath),
      seenAt: now,
    });

    const entry = this.getEntry(normalized);
    if (!entry) {
      throw new Error('Folder metadata could not be stored.');
    }

    return entry;
  }

  private ensureTag(label: string, now: string): TagRow {
    const systemTag = getSystemTagDefinition(label);
    const canonicalLabel = systemTag?.label ?? normalizeFolderTagLabel(label);
    const normalizedLabel = systemTag?.normalizedLabel ?? normalizeFolderTagKey(canonicalLabel);
    const existing = this.getTagByNormalizedLabel(normalizedLabel);

    if (existing) {
      return existing;
    }

    const id = createId(systemTag ? 'system-tag' : 'tag');
    this.db
      .prepare(
        [
          'INSERT INTO tag',
          '(id, label, normalized_label, kind, system_effect, created_at, updated_at)',
          'VALUES (?, ?, ?, ?, ?, ?, ?)',
        ].join(' '),
      )
      .run(
        id,
        canonicalLabel,
        normalizedLabel,
        systemTag ? 'system' : 'free',
        systemTag?.systemEffect ?? null,
        now,
        now,
      );

    return {
      id,
      label: canonicalLabel,
      normalized_label: normalizedLabel,
      kind: systemTag ? 'system' : 'free',
      system_effect: systemTag?.systemEffect ?? null,
    };
  }

  private getEntry(relativePath: string) {
    return mapEntryRow(
      this.db.prepare('SELECT * FROM filesystem_entry WHERE relative_path = ?').get(relativePath),
    );
  }

  private getTagByNormalizedLabel(normalizedLabel: string) {
    const row = this.db
      .prepare('SELECT * FROM tag WHERE normalized_label = ?')
      .get(normalizedLabel);

    if (!row) {
      return undefined;
    }

    return {
      id: String(row.id),
      label: String(row.label),
      normalized_label: String(row.normalized_label),
      kind: row.kind === 'system' ? 'system' : 'free',
      system_effect: row.system_effect === 'project-root' ? 'project-root' : null,
    } satisfies TagRow;
  }

  private getEntryTag(entryId: string, tagId: string) {
    const row = this.db
      .prepare('SELECT * FROM filesystem_entry_tag WHERE entry_id = ? AND tag_id = ?')
      .get(entryId, tagId);

    return row ? mapEntryTagRow({ ...row, id: tagId, label: '', normalized_label: '', kind: 'free' }) : undefined;
  }

  private getTagsForEntry(entryId: string): FolderTag[] {
    const rows = this.db
      .prepare(
        [
          'SELECT t.*, et.entry_id, et.source, et.updated_at, et.context_id, et.context_type, et.context_name',
          'FROM filesystem_entry_tag et',
          'JOIN tag t ON t.id = et.tag_id',
          'WHERE et.entry_id = ?',
          'ORDER BY t.kind DESC, t.label COLLATE NOCASE ASC',
        ].join(' '),
      )
      .all(entryId)
      .map(mapEntryTagRow);

    return rows.map((row): FolderTag => {
      if (row.kind === 'system' && row.system_effect === 'project-root') {
        return {
          label: row.label,
          normalizedLabel: row.normalized_label,
          kind: 'system',
          source: 'explicit',
          updatedAt: row.updated_at,
          systemEffect: row.system_effect,
          context:
            row.context_id && row.context_type && row.context_name
              ? {
                  id: row.context_id,
                  type: row.context_type,
                  name: row.context_name,
                }
              : undefined,
        };
      }

      return {
        label: row.label,
        normalizedLabel: row.normalized_label,
        kind: 'free',
        source: 'explicit',
        updatedAt: row.updated_at,
      };
    });
  }

  private upsertProjectContext({
    contextId,
    entryId,
    rootRelativePath,
    name,
    now,
  }: {
    contextId: string;
    entryId: string;
    rootRelativePath: string;
    name: string;
    now: string;
  }) {
    this.db
      .prepare(
        [
          'INSERT INTO context',
          '(id, type, name, root_entry_id, root_relative_path, status, created_at, updated_at)',
          'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          'ON CONFLICT(id) DO UPDATE SET',
          'name = excluded.name,',
          'root_entry_id = excluded.root_entry_id,',
          'root_relative_path = excluded.root_relative_path,',
          'status = excluded.status,',
          'updated_at = excluded.updated_at',
        ].join(' '),
      )
      .run(contextId, 'project', name, entryId, rootRelativePath, 'active', now, now);

    this.db
      .prepare(
        [
          'INSERT INTO context_entry',
          '(context_id, entry_id, role, created_at, updated_at)',
          'VALUES (?, ?, ?, ?, ?)',
          'ON CONFLICT(context_id, entry_id, role) DO UPDATE SET',
          'updated_at = excluded.updated_at',
        ].join(' '),
      )
      .run(contextId, entryId, 'root', now, now);
  }

  private deactivateContext(contextId: string, now: string) {
    this.db.prepare('UPDATE context SET status = ?, updated_at = ? WHERE id = ?').run(
      'inactive',
      now,
      contextId,
    );
  }
}

export const openWorkspaceDatabase = (rootPath: string) => WorkspaceDatabase.open(rootPath);
