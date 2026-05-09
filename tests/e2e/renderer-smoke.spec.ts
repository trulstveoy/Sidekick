import { expect, test } from '@playwright/test';
import type { ArtifactType, FolderSignal, ProjectFolderScan } from '../../src/shared/sidekick-api';

const createArtifactCounts = () =>
  ({
    'markdown-text': 1,
    document: 1,
    pdf: 1,
    image: 1,
    audio: 0,
    video: 0,
    'spreadsheet-data': 0,
    presentation: 0,
    drawio: 0,
    transcript: 0,
    note: 0,
    'information-model': 0,
    architecture: 0,
    unclassified: 0,
  }) satisfies Record<ArtifactType, number>;

const createFolderSignalCounts = () =>
  ({
    background: 1,
    transcript: 1,
    'information-model': 0,
    architecture: 0,
    thematic: 0,
  }) satisfies Record<FolderSignal, number>;

const mockScan: ProjectFolderScan = {
  rootPath: '/tmp/sidekick-project',
  rootName: 'sidekick-project',
  scannedAt: '2026-05-09T12:00:00.000Z',
  status: 'complete',
  tree: {
    name: 'sidekick-project',
    relativePath: '.',
    kind: 'folder',
    children: [
      {
        name: '01-bakgrunn',
        relativePath: '01-bakgrunn',
        kind: 'folder',
        children: [
          {
            name: 'brief.pdf',
            relativePath: '01-bakgrunn/brief.pdf',
            kind: 'file',
            artifactType: 'pdf',
            contextHints: ['background'],
            size: 1024,
            modifiedAt: '2026-05-09T12:00:00.000Z',
          },
          {
            name: 'notes.md',
            relativePath: '01-bakgrunn/notes.md',
            kind: 'file',
            artifactType: 'markdown-text',
            contextHints: ['background'],
            size: 512,
            modifiedAt: '2026-05-09T12:00:00.000Z',
          },
        ],
        folderSignals: ['background'],
        contextHints: ['background'],
        modifiedAt: '2026-05-09T12:00:00.000Z',
      },
      {
        name: '02-transkripsjoner',
        relativePath: '02-transkripsjoner',
        kind: 'folder',
        children: [
          {
            name: 'intervju-01.docx',
            relativePath: '02-transkripsjoner/intervju-01.docx',
            kind: 'file',
            artifactType: 'document',
            contextHints: ['transcript'],
            size: 2048,
            modifiedAt: '2026-05-09T12:00:00.000Z',
          },
        ],
        folderSignals: ['transcript'],
        contextHints: ['transcript'],
        modifiedAt: '2026-05-09T12:00:00.000Z',
      },
    ],
    folderSignals: [],
    contextHints: [],
    modifiedAt: '2026-05-09T12:00:00.000Z',
  },
  summary: {
    fileCount: 3,
    folderCount: 2,
    artifactTypeCounts: createArtifactCounts(),
    folderSignalCounts: createFolderSignalCounts(),
    recentFiles: [],
    limitsReached: {
      maxDepth: false,
      maxFiles: false,
    },
  },
  warnings: [],
};

test('renders the folder inspection empty state', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sidekick' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose folder' })).toBeVisible();
  await expect(page.getByText('Choose a project folder')).toBeVisible();
  await expect(page.getByText('No folder selected')).toBeVisible();
  await expect(page.getByText('Browser preview')).toBeVisible();
  await expect(page.getByText('No warnings')).toBeVisible();
});

test('expands and collapses scanned folders', async ({ page }) => {
  await page.addInitScript((scan) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseProjectFolder: async () => scan,
    };
  }, mockScan);

  await page.goto('/');
  await page.getByRole('button', { name: 'Choose folder' }).click();

  await expect(page.getByRole('tree', { name: 'Scanned folder tree' })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /sidekick-project/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);

  await page.getByRole('button', { name: 'Expand 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toBeVisible();
  await expect(page.getByText('notes.md')).toBeVisible();

  await page.getByRole('button', { name: 'Collapse 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
  await expect(page.getByText('notes.md')).toHaveCount(0);
});

test('expands and collapses all scanned folders', async ({ page }) => {
  await page.addInitScript((scan) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseProjectFolder: async () => scan,
    };
  }, mockScan);

  await page.goto('/');
  await page.getByRole('button', { name: 'Choose folder' }).click();
  await page.getByRole('button', { name: 'Expand all folders' }).click();

  await expect(page.getByText('brief.pdf')).toBeVisible();
  await expect(page.getByText('intervju-01.docx')).toBeVisible();

  await page.getByRole('button', { name: 'Collapse all folders' }).click();
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
  await expect(page.getByText('intervju-01.docx')).toHaveCount(0);
});
