import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  createDocumentRelationshipsMarkdown,
  getDocumentRelationshipsPath,
  parseDocumentRelationshipsMarkdown,
  readDocumentRelationships,
  validateDocumentRelationshipsMarkdown,
  writeDocumentRelationships,
} from '../../src/main/document-relationships';

const temporaryRoots: string[] = [];

const createTempRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-document-relationships-'));
  temporaryRoots.push(rootPath);

  return rootPath;
};

const validRelationships = [
  '## Overview',
  '',
  'Materialet har flere sammenhenger mellom strategi og operasjon.',
  '',
  '## Relationship Map',
  '',
  '- Type: delt tema | Dokumenter: strategi.md, operasjon.md | Confidence: høy | Forklaring: Begge beskriver målbilde | Bevis: begge nevner målbilde',
  '',
  '## Thematic Clusters',
  '',
  '- Målbilde: strategi.md, operasjon.md',
  '',
  '## Notable Overlaps',
  '',
  '- Begge dokumenter omtaler prioriteringer.',
  '',
  '## Possible Contradictions',
  '',
  'Ingen tydelige motstrider funnet',
  '',
  '## Low Confidence Or Missing Evidence',
  '',
  'Ingen tydelige lav-konfidensfunn',
].join('\n');

describe('document relationships report handling', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('writes and reads document relationships markdown with front matter', async () => {
    const rootPath = await createTempRoot();
    const contextPackagePath = path.join(rootPath, 'project.context-package.md');
    const snapshot = await writeDocumentRelationships({
      rootPath,
      contextPackagePath,
      contextPackageSha256: 'abc123',
      generatedAt: '2026-05-13T12:00:00.000Z',
      analysisMarkdown: validRelationships,
    });
    const markdown = await readFile(getDocumentRelationshipsPath(rootPath), 'utf8');

    expect(snapshot.status).toBe('complete');
    expect(snapshot.generatedAt).toBe('2026-05-13T12:00:00.000Z');
    expect(snapshot.sourceScope).toBe('full-project');
    expect(snapshot.sourceModel).toBe('physical-project-folder');
    expect(snapshot.contextPackagePath).toBe('./project.context-package.md');
    expect(snapshot.contextPackageSha256).toBe('abc123');
    expect(snapshot.overview).toContain('strategi og operasjon');
    expect(snapshot.relationshipMap).toContain('Confidence: høy');
    expect(markdown).toContain('sidekick_schema: document-relationships.v1');
    expect(markdown).toContain('## Source Context');
  });

  it('reports missing document relationships as a typed state', async () => {
    const rootPath = await createTempRoot();

    await expect(readDocumentRelationships(rootPath)).resolves.toMatchObject({
      status: 'missing',
      path: getDocumentRelationshipsPath(rootPath),
    });
  });

  it('reports invalid document relationships as a typed state', async () => {
    const rootPath = await createTempRoot();
    const reportPath = getDocumentRelationshipsPath(rootPath);
    await writeDocumentRelationships({
      rootPath,
      contextPackagePath: path.join(rootPath, 'project.context-package.md'),
      contextPackageSha256: 'abc123',
      generatedAt: '2026-05-13T12:00:00.000Z',
      analysisMarkdown: validRelationships,
    });
    await writeFile(reportPath, 'not front matter', 'utf8');

    await expect(readDocumentRelationships(rootPath)).resolves.toMatchObject({
      status: 'invalid',
      message: expect.stringContaining('front matter'),
    });
  });

  it('rejects relationship markdown without required sections', () => {
    expect(() => validateDocumentRelationshipsMarkdown('## Overview\n\nBare ett felt')).toThrow(
      /missing required sections/i,
    );
  });

  it('rejects generated context packages outside the project root', async () => {
    const rootPath = await createTempRoot();
    const otherRoot = await createTempRoot();

    expect(() =>
      createDocumentRelationshipsMarkdown({
        rootPath,
        contextPackagePath: path.join(otherRoot, 'outside.context-package.md'),
        contextPackageSha256: 'abc123',
        analysisMarkdown: validRelationships,
      }),
    ).toThrow(/inside the selected project/);
  });

  it('parses an existing report markdown snapshot', async () => {
    const rootPath = await createTempRoot();
    const markdown = createDocumentRelationshipsMarkdown({
      rootPath,
      contextPackagePath: path.join(rootPath, 'project.context-package.md'),
      contextPackageSha256: 'abc123',
      generatedAt: '2026-05-13T12:00:00.000Z',
      analysisMarkdown: validRelationships,
    });

    const snapshot = parseDocumentRelationshipsMarkdown(
      getDocumentRelationshipsPath(rootPath),
      markdown,
    );

    expect(snapshot.status).toBe('complete');
    expect(snapshot.markdown).toContain('## Relationship Map');
  });
});
