import { describe, expect, it } from 'vitest';
import { deriveContextViews } from '../../src/shared/context-views';
import type { FolderTag, FolderTreeNode } from '../../src/shared/sidekick-api';

const projectTag = (id: string, name: string): FolderTag => ({
  label: 'Prosjektmappe',
  normalizedLabel: 'prosjektmappe',
  kind: 'system',
  source: 'explicit',
  updatedAt: '2026-05-14T00:00:00.000Z',
  systemEffect: 'project-root',
  context: {
    id,
    type: 'project',
    name,
  },
});

const folder = (
  name: string,
  relativePath: string,
  children: FolderTreeNode[] = [],
  tag?: FolderTag,
): FolderTreeNode => ({
  name,
  relativePath,
  kind: 'folder',
  children,
  contextHints: [],
  metadata: tag
    ? {
        status: 'valid',
        folderId: `folder-${relativePath}`,
        tags: [tag],
      }
    : undefined,
});

const file = (name: string, relativePath: string): FolderTreeNode => ({
  name,
  relativePath,
  kind: 'file',
  artifactType: 'markdown-text',
  contextHints: [],
  size: 42,
});

describe('context views', () => {
  it('derives project contexts only from Prosjektmappe metadata', () => {
    const tree = folder('.', '.', [
      folder('Strategi', 'Strategi', [
        folder('00. Retning', 'Strategi/00. Retning', [
          file('strategi.md', 'Strategi/00. Retning/strategi.md'),
        ]),
      ], projectTag('project-strategy', 'Strategi')),
      folder('Løsmateriale', 'Løsmateriale', [
        file('uten-prosjekt.md', 'Løsmateriale/uten-prosjekt.md'),
      ]),
    ]);

    const views = deriveContextViews(tree);

    expect(views.projects.contexts).toHaveLength(1);
    expect(views.projects.contexts[0].label).toBe('Strategi');
    expect(views.projects.rows.map((row) => row.artifactRelativePath)).toEqual([
      'Strategi',
      'Strategi/00. Retning/strategi.md',
    ]);
    expect(
      views.projects.rows.some((row) => row.artifactRelativePath === 'Løsmateriale/uten-prosjekt.md'),
    ).toBe(false);
    expect(views.projects.rows[0].viewReason).toBe('project-root-tag');
    expect(views.projects.rows[1].viewReason).toBe('physical-project-file');
  });

  it('does not create project contexts from invalid metadata', () => {
    const invalidProject = folder('Strategi', 'Strategi', [file('strategi.md', 'Strategi/strategi.md')]);
    invalidProject.metadata = {
      status: 'invalid',
      tags: [],
      message: 'Invalid marker.',
    };
    const tree = folder('.', '.', [invalidProject]);

    const views = deriveContextViews(tree);

    expect(views.projects.contexts).toEqual([]);
    expect(views.projects.rows).toEqual([]);
  });

  it('keeps the physical folders view independent from project metadata', () => {
    const tree = folder('.', '.', [
      folder('Strategi', 'Strategi', [file('strategi.md', 'Strategi/strategi.md')], projectTag('p1', 'Strategi')),
    ]);

    const views = deriveContextViews(tree);

    expect(views.folders.rows.map((row) => row.artifactRelativePath)).toEqual([
      '.',
      'Strategi',
      'Strategi/strategi.md',
    ]);
    expect(views.folders.rows.every((row) => row.viewReason === 'physical-tree-node')).toBe(true);
  });
});
