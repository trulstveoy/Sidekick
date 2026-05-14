import { expect, test, type Locator } from '@playwright/test';
import { deriveContextViews } from '../../src/shared/context-views';
import type {
  ArtifactType,
  AppSettingsSnapshot,
  ContextPackagePreview,
  ContextPackageResult,
  DocumentRelationshipsGenerationResult,
  DocumentRelationshipsSnapshot,
  FolderSignal,
  WorkspaceCreationResult,
  WorkspaceScan,
  WorkspaceInfoSnapshot,
  WorkspaceInitializationPreview,
  WorkspaceInitializationResult,
  TranscriptionSummaryBatchPreview,
  TranscriptionSummaryBatchResult,
  TranscriptionImportPreview,
  TranscriptionImportResult,
} from '../../src/shared/sidekick-api';

// These smoke tests run the renderer in a browser and inject the same typed
// preload API shape that Electron exposes, so UI behavior can be verified
// without privileged filesystem access.
const mockSettingsSnapshot: AppSettingsSnapshot = {
  settings: {
    sidekick_codex_path: null,
  },
  codexPathSource: 'automatic',
  effectiveCodexPath: null,
};

const expectWithinViewport = async (locator: Locator, width: number, height: number) => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(width);
  expect(box.y + box.height).toBeLessThanOrEqual(height);
};

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

const withContextViews = (scan: Omit<WorkspaceScan, 'contextViews'>): WorkspaceScan => ({
  ...scan,
  contextViews: deriveContextViews(scan.tree),
});

const mockScan: WorkspaceScan = withContextViews({
  rootPath: '/tmp/sidekick-workspace',
  rootName: 'sidekick-workspace',
  scannedAt: '2026-05-09T12:00:00.000Z',
  status: 'complete',
  tree: {
    name: 'sidekick-workspace',
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
});

const mockScanWithTextTranscriptions: WorkspaceScan = withContextViews({
  ...mockScan,
  tree: {
    ...mockScan.tree,
    children: mockScan.tree.children?.map((child) =>
      child.relativePath === '02-transkripsjoner'
        ? {
            ...child,
            children: [
              ...(child.children ?? []),
              {
                name: '00. interview.md',
                relativePath: '02-transkripsjoner/00. interview.md',
                kind: 'file',
                artifactType: 'transcript',
                contextHints: ['transcript'],
                size: 2048,
                modifiedAt: '2026-05-09T12:01:00.000Z',
              },
              {
                name: '01. workshop.txt',
                relativePath: '02-transkripsjoner/01. workshop.txt',
                kind: 'file',
                artifactType: 'transcript',
                contextHints: ['transcript'],
                size: 1024,
                modifiedAt: '2026-05-09T12:02:00.000Z',
              },
              {
                name: '02. broken.md',
                relativePath: '02-transkripsjoner/02. broken.md',
                kind: 'file',
                artifactType: 'transcript',
                contextHints: ['transcript'],
                size: 768,
                modifiedAt: '2026-05-09T12:03:00.000Z',
              },
            ],
          }
        : child,
    ),
  },
  summary: {
    ...mockScan.summary,
    fileCount: 6,
    artifactTypeCounts: {
      ...mockScan.summary.artifactTypeCounts,
      transcript: 3,
    },
  },
});

const mockProjectScan: WorkspaceScan = withContextViews({
  ...mockScan,
  tree: {
    ...mockScan.tree,
    children: mockScan.tree.children?.map((child) =>
      child.relativePath === '01-bakgrunn'
        ? {
            ...child,
            name: 'Strategi',
            relativePath: 'Strategi',
            metadata: {
              status: 'valid',
              markerRelativePath: 'Strategi/.sidekick-folder.json',
              folderId: 'folder-strategi',
              tags: [
                {
                  label: 'Prosjektmappe',
                  normalizedLabel: 'prosjektmappe',
                  kind: 'system',
                  source: 'explicit',
                  updatedAt: '2026-05-14T12:00:00.000Z',
                  systemEffect: 'project-root',
                  context: {
                    id: 'project-strategi',
                    type: 'project',
                    name: 'Strategi',
                  },
                },
              ],
            },
            children: child.children?.map((grandchild) => ({
              ...grandchild,
              relativePath: grandchild.relativePath.replace('01-bakgrunn', 'Strategi'),
            })),
          }
        : child,
    ),
  },
});

const mockContextPackagePreview: ContextPackagePreview = {
  scope: 'workspace',
  rootPath: '/tmp/sidekick-workspace',
  targetPath: '/tmp/sidekick-workspace',
  targetRelativePath: '.',
  outputPath: '/tmp/sidekick-workspace/sidekick-workspace.context-package.md',
  outputFileName: 'sidekick-workspace.context-package.md',
  willOverwrite: true,
  binaryFileWarning:
    'Binary files such as PDF, DOCX, PPTX, images, audio, and video are not included as full text content.',
  selfIgnoreWarning: 'Generated context-package files are ignored during generation.',
};

const mockWorkspaceInfo: WorkspaceInfoSnapshot = {
  status: 'complete',
  path: '/tmp/sidekick-workspace/.sidekic./workspace-info.md',
  generatedAt: '2026-05-09T12:10:00.000Z',
  sourceScope: 'full-workspace',
  contextPackagePath: './sidekick-workspace.context-package.md',
  contextPackageSha256: 'abc123',
  summaryLanguage: 'nb',
  workspaceSummary: 'Arbeidsområdet handler om lokal arbeidsområdeforståelse og kontekstpakker.',
  participants: '- Sidekick-teamet',
  themes: ['Lokal lagring', 'Kontekstpakker'],
  openQuestions: ['Hvordan skal metadata utvikles?'],
};

const mockContextPackageResult: ContextPackageResult = {
  status: 'complete',
  scope: 'workspace',
  rootPath: '/tmp/sidekick-workspace',
  targetPath: '/tmp/sidekick-workspace',
  targetRelativePath: '.',
  outputPath: '/tmp/sidekick-workspace/sidekick-workspace.context-package.md',
  outputFileName: 'sidekick-workspace.context-package.md',
  overwritten: true,
  totalFiles: 2,
  totalCharacters: 4096,
  totalTokens: 523,
  outputBytes: 8192,
  processedFiles: ['01-bakgrunn/notes.md', '02-transkripsjoner/intervju-01.txt'],
  skippedFiles: [
    { path: '01-bakgrunn/brief.pdf', reason: 'binary-extension' },
    { path: '02-transkripsjoner/intervju-01.docx', reason: 'binary-extension' },
  ],
  warnings: [{ path: '03-modeller/model.md', message: 'Suspicious file content detected.' }],
  workspaceSummary: {
    status: 'complete',
    workspaceInfo: mockWorkspaceInfo,
  },
  scan: withContextViews({
    ...mockScan,
    scannedAt: '2026-05-09T12:10:00.000Z',
    tree: {
      ...mockScan.tree,
      children: [
        ...(mockScan.tree.children ?? []),
        {
          name: 'sidekick-workspace.context-package.md',
          relativePath: 'sidekick-workspace.context-package.md',
          kind: 'file',
          artifactType: 'markdown-text',
          contextHints: [],
          size: 8192,
          modifiedAt: '2026-05-09T12:10:00.000Z',
        },
      ],
    },
    summary: {
      ...mockScan.summary,
      fileCount: 4,
      artifactTypeCounts: {
        ...mockScan.summary.artifactTypeCounts,
        'markdown-text': mockScan.summary.artifactTypeCounts['markdown-text'] + 1,
      },
    },
  }),
};

const mockDocumentRelationships: DocumentRelationshipsSnapshot = {
  status: 'complete',
  path: '/tmp/sidekick-workspace/.sidekick/document-relationships.md',
  generatedAt: '2026-05-09T12:20:00.000Z',
  sourceScope: 'full-workspace',
  sourceModel: 'physical-workspace',
  contextPackagePath: './sidekick-workspace.context-package.md',
  contextPackageSha256: 'def456',
  summaryLanguage: 'nb',
  overview: 'Arbeidsområdet har tydelige koblinger mellom strategiintervjuer og operasjonsmodell.',
  relationshipMap:
    '- Type: tematisk overlapp\n  Dokumenter: intervju-01.txt, operasjonsmodell.md\n  Belegg: Begge omtaler styringsmodell.',
  thematicClusters: '- Styring og ansvar: intervju-01.txt, operasjonsmodell.md',
  notableOverlaps: '- Strategi og operasjon deler begrepet porteføljestyring.',
  possibleContradictions: '- Ingen tydelige motsetninger funnet.',
  lowConfidenceOrMissingEvidence: '- Rollen til ekstern partner bør undersøkes videre.',
  markdown: [
    '## Overview',
    'Arbeidsområdet har tydelige koblinger mellom strategiintervjuer og operasjonsmodell.',
    '## Relationship Map',
    '- Type: tematisk overlapp',
    '## Thematic Clusters',
    '- Styring og ansvar',
    '## Notable Overlaps',
    '- Strategi og operasjon deler begrepet porteføljestyring.',
    '## Possible Contradictions',
    '- Ingen tydelige motsetninger funnet.',
    '## Low Confidence Or Missing Evidence',
    '- Rollen til ekstern partner bør undersøkes videre.',
  ].join('\n\n'),
};

const mockDocumentRelationshipsResult: DocumentRelationshipsGenerationResult = {
  status: 'complete',
  report: mockDocumentRelationships,
  contextPackage: {
    ...mockContextPackageResult,
    workspaceSummary: undefined,
  },
};

const mockScanAfterTranscriptionImport: WorkspaceScan = withContextViews({
  ...mockScan,
  scannedAt: '2026-05-09T12:05:00.000Z',
  tree: {
    ...mockScan.tree,
    children: mockScan.tree.children?.map((child) =>
      child.relativePath === '02-transkripsjoner'
        ? {
            ...child,
            children: [
              ...(child.children ?? []),
              {
                name: '00. new-transcription.md',
                relativePath: '02-transkripsjoner/00. new-transcription.md',
                kind: 'file',
                artifactType: 'transcript',
                contextHints: ['transcript'],
                size: 1024,
                modifiedAt: '2026-05-09T12:05:00.000Z',
              },
            ],
          }
        : child,
    ),
  },
  summary: {
    ...mockScan.summary,
    fileCount: 4,
    artifactTypeCounts: {
      ...mockScan.summary.artifactTypeCounts,
      transcript: 1,
    },
  },
});

const mockTranscriptionImportPreview: TranscriptionImportPreview = {
  previewId: 'preview-1',
  rootPath: '/tmp/sidekick-workspace',
  sourcePath: '/tmp/downloads/new-transcription.md',
  sourceFileName: 'new-transcription.md',
  targetFolderPath: '/tmp/sidekick-workspace/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  destinationPath: '/tmp/sidekick-workspace/02-transkripsjoner/00. new-transcription.md',
  destinationFileName: '00. new-transcription.md',
  numbering: {
    nextNumber: 0,
    width: 2,
    separator: '. ',
    inferredFromExistingFiles: false,
  },
  warnings: [],
};

const mockTranscriptionImportResult: TranscriptionImportResult = {
  status: 'complete',
  rootPath: '/tmp/sidekick-workspace',
  sourcePath: '/tmp/downloads/new-transcription.md',
  sourceFileName: 'new-transcription.md',
  targetFolderPath: '/tmp/sidekick-workspace/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  destinationPath: '/tmp/sidekick-workspace/02-transkripsjoner/00. new-transcription.md',
  destinationFileName: '00. new-transcription.md',
  finalNumber: 0,
  copiedBytes: 1024,
  summary: {
    status: 'complete',
    summary: {
      status: 'complete',
      rootPath: '/tmp/sidekick-workspace',
      transcriptionRelativePath: '02-transkripsjoner/00. new-transcription.md',
      summaryRelativePath: '.sidekick/transcription-summaries/test.summary.md',
      summaryPath: '/tmp/sidekick-workspace/.sidekick/transcription-summaries/test.summary.md',
      generatedAt: '2026-05-09T12:05:30.000Z',
      transcriptionSha256: 'old',
      currentTranscriptionSha256: 'old',
      summaryLanguage: 'nb',
      conversationSummary:
        '## Conversation Summary\n\nSamtalen handler om Sidekick.\n\n- Transkripsjonen ble importert.',
    },
  },
  scan: mockScanAfterTranscriptionImport,
};

const mockTranscriptionSummaryBatchPreview: TranscriptionSummaryBatchPreview = {
  previewId: 'summary-batch-1',
  rootPath: '/tmp/sidekick-workspace',
  targetFolderPath: '/tmp/sidekick-workspace/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  counts: {
    total: 3,
    missing: 1,
    complete: 1,
    stale: 0,
    invalid: 1,
    toGenerate: 2,
  },
  items: [
    {
      transcriptionRelativePath: '02-transkripsjoner/00. interview.md',
      transcriptionFileName: '00. interview.md',
      status: 'missing',
      summaryRelativePath: '.sidekick/transcription-summaries/interview.summary.md',
    },
    {
      transcriptionRelativePath: '02-transkripsjoner/01. workshop.txt',
      transcriptionFileName: '01. workshop.txt',
      status: 'complete',
      summaryRelativePath: '.sidekick/transcription-summaries/workshop.summary.md',
    },
    {
      transcriptionRelativePath: '02-transkripsjoner/02. broken.md',
      transcriptionFileName: '02. broken.md',
      status: 'invalid',
      summaryRelativePath: '.sidekick/transcription-summaries/broken.summary.md',
      message: 'Sammendraget kunne ikke leses.',
    },
  ],
  warnings: [],
};

const mockTranscriptionSummaryBatchResult: TranscriptionSummaryBatchResult = {
  status: 'complete',
  rootPath: '/tmp/sidekick-workspace',
  targetFolderPath: '/tmp/sidekick-workspace/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  counts: {
    total: 3,
    generated: 1,
    failed: 1,
    skippedComplete: 1,
    skippedStale: 0,
  },
  items: [
    {
      transcriptionRelativePath: '02-transkripsjoner/00. interview.md',
      transcriptionFileName: '00. interview.md',
      status: 'generated',
      summary: {
        status: 'complete',
        rootPath: '/tmp/sidekick-workspace',
        transcriptionRelativePath: '02-transkripsjoner/00. interview.md',
        summaryRelativePath: '.sidekick/transcription-summaries/interview.summary.md',
        summaryPath: '/tmp/sidekick-workspace/.sidekick/transcription-summaries/interview.summary.md',
        generatedAt: '2026-05-09T12:15:00.000Z',
        transcriptionSha256: 'new',
        currentTranscriptionSha256: 'new',
        summaryLanguage: 'nb',
        conversationSummary: '## Conversation Summary\n\nIntervjuet handler om Sidekick.',
      },
    },
    {
      transcriptionRelativePath: '02-transkripsjoner/01. workshop.txt',
      transcriptionFileName: '01. workshop.txt',
      status: 'skipped-complete',
      message: 'Eksisterende sammendrag ble beholdt.',
    },
    {
      transcriptionRelativePath: '02-transkripsjoner/02. broken.md',
      transcriptionFileName: '02. broken.md',
      status: 'failed',
      message: 'Codex failed.',
    },
  ],
  scan: mockScanWithTextTranscriptions,
};

const mockWorkspaceCreationResult: WorkspaceCreationResult = {
  rootPath: '/tmp/new-sidekick-workspace',
  rootName: 'new-sidekick-workspace',
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/new-sidekick-workspace/00. Forutsetninger',
      status: 'created',
    },
    {
      name: '01. Notater',
      path: '/tmp/new-sidekick-workspace/01. Notater',
      status: 'created',
    },
    {
      name: '02. Transkripsjoner',
      path: '/tmp/new-sidekick-workspace/02. Transkripsjoner',
      status: 'created',
    },
  ],
  scan: withContextViews({
    ...mockScan,
    rootPath: '/tmp/new-sidekick-workspace',
    rootName: 'new-sidekick-workspace',
    tree: {
      ...mockScan.tree,
      name: 'new-sidekick-workspace',
      children: [
        {
          name: '00. Forutsetninger',
          relativePath: '00. Forutsetninger',
          kind: 'folder',
          children: [],
          folderSignals: ['background'],
          contextHints: ['background'],
          modifiedAt: '2026-05-09T12:00:00.000Z',
        },
        {
          name: '01. Notater',
          relativePath: '01. Notater',
          kind: 'folder',
          children: [],
          folderSignals: [],
          contextHints: [],
          modifiedAt: '2026-05-09T12:00:00.000Z',
        },
        {
          name: '02. Transkripsjoner',
          relativePath: '02. Transkripsjoner',
          kind: 'folder',
          children: [],
          folderSignals: ['transcript'],
          contextHints: ['transcript'],
          modifiedAt: '2026-05-09T12:00:00.000Z',
        },
      ],
    },
    summary: {
      ...mockScan.summary,
      fileCount: 0,
      folderCount: 3,
      recentFiles: [],
    },
  }),
};

const mockWorkspaceInitializationPreview: WorkspaceInitializationPreview = {
  previewId: 'init-preview',
  rootPath: '/tmp/existing-sidekick-workspace',
  rootName: 'existing-sidekick-workspace',
  existingEntryCount: 3,
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/existing-sidekick-workspace/00. Forutsetninger',
      status: 'existing',
    },
    {
      name: '01. Notater',
      path: '/tmp/existing-sidekick-workspace/01. Notater',
      status: 'missing',
    },
    {
      name: '02. Transkripsjoner',
      path: '/tmp/existing-sidekick-workspace/02. Transkripsjoner',
      status: 'missing',
    },
  ],
  warnings: [
    {
      path: '01. Transkriberinger',
      message:
        'This folder looks similar to a required workspace, but Sidekick requires the exact folder name.',
    },
  ],
};

const mockWorkspaceInitializationResult: WorkspaceInitializationResult = {
  status: 'complete',
  rootPath: '/tmp/existing-sidekick-workspace',
  rootName: 'existing-sidekick-workspace',
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/existing-sidekick-workspace/00. Forutsetninger',
      status: 'existing',
    },
    {
      name: '01. Notater',
      path: '/tmp/existing-sidekick-workspace/01. Notater',
      status: 'created',
    },
    {
      name: '02. Transkripsjoner',
      path: '/tmp/existing-sidekick-workspace/02. Transkripsjoner',
      status: 'created',
    },
  ],
  scan: withContextViews({
    ...mockWorkspaceCreationResult.scan,
    rootPath: '/tmp/existing-sidekick-workspace',
    rootName: 'existing-sidekick-workspace',
    tree: {
      ...mockWorkspaceCreationResult.scan.tree,
      name: 'existing-sidekick-workspace',
    },
  }),
};

const mockPartialScan: WorkspaceScan = withContextViews({
  ...mockScan,
  status: 'partial',
  warnings: [
    {
      path: '06-eksporter',
      type: 'read-error',
      severity: 'warning',
      message: 'Kunne ikke lese mappen.',
    },
  ],
  summary: {
    ...mockScan.summary,
    limitsReached: {
      maxDepth: false,
      maxFiles: true,
    },
  },
});

const mockDeepScan: WorkspaceScan = withContextViews({
  ...mockScan,
  tree: {
    ...mockScan.tree,
    children: mockScan.tree.children?.map((child) =>
      child.relativePath === '01-bakgrunn'
        ? {
            ...child,
            children: [
              ...(child.children ?? []),
              {
                name: 'research',
                relativePath: '01-bakgrunn/research',
                kind: 'folder',
                folderSignals: ['background'],
                contextHints: ['background'],
                modifiedAt: '2026-05-09T12:00:00.000Z',
                children: [
                  {
                    name: 'deep-note.md',
                    relativePath: '01-bakgrunn/research/deep-note.md',
                    kind: 'file',
                    artifactType: 'markdown-text',
                    contextHints: ['background'],
                    size: 768,
                    modifiedAt: '2026-05-09T12:00:00.000Z',
                  },
                ],
              },
            ],
          }
        : child,
    ),
  },
  summary: {
    ...mockScan.summary,
    fileCount: 4,
    folderCount: 3,
  },
});

const mockEmptyScan: WorkspaceScan = withContextViews({
  ...mockScan,
  rootPath: '/tmp/empty-sidekick-workspace',
  rootName: 'empty-sidekick-workspace',
  tree: {
    name: 'empty-sidekick-workspace',
    relativePath: '.',
    kind: 'folder',
    children: [],
    folderSignals: [],
    contextHints: [],
    modifiedAt: '2026-05-09T12:00:00.000Z',
  },
  summary: {
    fileCount: 0,
    folderCount: 0,
    artifactTypeCounts: {
      ...createArtifactCounts(),
      'markdown-text': 0,
      document: 0,
      pdf: 0,
      image: 0,
    },
    folderSignalCounts: {
      background: 0,
      transcript: 0,
      'information-model': 0,
      architecture: 0,
      thematic: 0,
    },
    recentFiles: [],
    limitsReached: {
      maxDepth: false,
      maxFiles: false,
    },
  },
  warnings: [],
});

test('renders the folder inspection empty state', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-app-topbar]')).toBeVisible();
  await expect(page.locator('[data-primary-workspace]')).toBeVisible();
  await expect(page.locator('[data-context-surface]')).toBeHidden();
  await expect(page.locator('[data-action-bar]')).toBeHidden();
  await expect(page.locator('[data-status-bar]')).toBeVisible();
  await expect(page.locator('.app-brand__name')).toHaveText('Sidekick');
  await expect(page.getByRole('heading', { name: 'Velg et arbeidsområde' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett nytt arbeidsområde...' })).toBeVisible();
  await expect(
    page.getByLabel('Valgt arbeidsområde').getByRole('heading', {
      name: 'Ingen arbeidsområde valgt',
    }),
  ).toBeVisible();
  await expect(page.getByText('Browser preview')).toBeVisible();
});

test('creates a workspace and displays the required folders', async ({ page }) => {
  await page.addInitScript(
    ({ createdWorkspace }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => null,
        chooseWorkspaceParentFolder: async () => '/tmp',
        createWorkspaceFolder: async (request) =>
          request.workspaceName === 'new-sidekick-workspace' && request.parentPath === '/tmp'
            ? createdWorkspace
            : null,
        previewContextPackage: async () => {
          throw new Error('No context package preview.');
        },
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      createdWorkspace: mockWorkspaceCreationResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Opprett nytt arbeidsområde...' }).click();
  await expect(page.getByRole('dialog', { name: 'Opprett nytt arbeidsområde' })).toBeVisible();
  await expect(page.getByLabel('Arbeidsområdenavn')).toBeFocused();
  await expect(page.getByText('Arbeidsområdenavn er påkrevd.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Avbryt' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Lukk' })).toBeFocused();
  await page.getByLabel('Arbeidsområdenavn').focus();
  await page.getByLabel('Arbeidsområdenavn').fill('new-sidekick-workspace');
  await page.getByRole('button', { name: 'Velg...' }).click();
  await expect(page.locator('[data-workspace-target-preview]')).toContainText(
    '/tmp/new-sidekick-workspace',
  );
  await expect(page.locator('[data-workspace-target-preview]')).toContainText('01. Notater');
  await expect(page.locator('[data-workspace-target-preview]')).toContainText('02. Transkripsjoner');
  await page.getByRole('button', { name: 'Opprett arbeidsområde' }).click();

  await expect(page.getByLabel('Valgt arbeidsområde').getByRole('heading')).toHaveText(
    'new-sidekick-workspace',
  );
  await expect(page.getByLabel('Valgt arbeidsområde')).toContainText('/tmp/new-sidekick-workspace');
  await expect(page.getByRole('treeitem', { name: /00. Forutsetninger/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01. Notater/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /02. Transkripsjoner/ })).toBeVisible();
  await expect(page.locator('[data-workflow-panel="codex"]')).toContainText('codex-cli 0.130.0-test');
});

test('shows search status and workspace search results', async ({ page }) => {
  await page.addInitScript(
    ({ scan }) => {
      const readyStatus = {
        rootPath: scan.rootPath,
        state: 'ready',
        documentCount: 1,
        skippedCounts: { unsupported: 1, binary: 1, oversized: 0, 'read-error': 0 },
        skippedFiles: [],
        updatedAt: '2026-05-09T12:10:00.000Z',
      };

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        chooseWorkspaceFolderForInitialization: async () => null,
        confirmWorkspaceInitialization: async () => {
          throw new Error('No workspace initialization.');
        },
        previewContextPackage: async () => ({
          scope: 'workspace',
          rootPath: scan.rootPath,
          targetPath: scan.rootPath,
          targetRelativePath: '.',
          outputPath: `${scan.rootPath}/workspace.context-package.md`,
          outputFileName: 'workspace.context-package.md',
          willOverwrite: false,
          binaryFileWarning: '',
          selfIgnoreWarning: '',
        }),
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        readWorkspaceInfo: async () => ({ status: 'missing', path: '' }),
        readDocumentRelationships: async () => ({ status: 'missing', path: '' }),
        generateDocumentRelationships: async () => {
          throw new Error('No document relationships.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import.');
        },
        getSearchIndexStatus: async () => readyStatus,
        refreshSearchIndex: async () => readyStatus,
        searchWorkspace: async (request) => ({
          rootPath: scan.rootPath,
          query: request.query,
          status: readyStatus,
          resultCount: 1,
          results: [
            {
              id: '01-bakgrunn/notes.md',
              rank: 1,
              score: 12.4,
              name: 'notes.md',
              relativePath: '01-bakgrunn/notes.md',
              artifactType: 'markdown-text',
              extension: '.md',
              size: 512,
              modifiedAt: '2026-05-09T12:00:00.000Z',
              snippet: 'Dette notatet beskriver lokal søkbar indeks.',
            },
          ],
        }),
        getCodexStatus: async () => ({ state: 'unavailable', available: false, loggedIn: false }),
        startCodexLogin: async () => ({ runId: 'login' }),
        startCodexRun: async () => ({ runId: 'run' }),
        cancelCodexRun: async () => undefined,
        getSettings: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        saveCodexPath: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        resetCodexPath: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        chooseCodexPath: async () => null,
        testCodexPath: async () => ({ ok: true, message: 'ok' }),
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
        onSearchIndexStatus: () => () => undefined,
      };
    },
    { scan: mockScan },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await expect(page.locator('[data-search-status]')).toHaveText('Indeks klar (1)');

  await page.getByRole('searchbox', { name: 'Søk' }).fill('lokal indeks');
  await expect(page.locator('[data-search-results]')).toContainText('01-bakgrunn/notes.md');
  await expect(page.locator('[data-search-results]')).toContainText('Dette notatet beskriver lokal søkbar indeks.');
  await expect(page.locator('.tree-panel')).toBeHidden();

  await page.getByRole('button', { name: /01-bakgrunn\/notes\.md/ }).click();
  await expect(page.locator('.tree-panel')).toBeVisible();
  await expect(page.locator('[data-selection-title]')).toHaveText('notes.md');
});

test('shows search empty and stale refresh states', async ({ page }) => {
  await page.addInitScript(
    ({ scan }) => {
      let refreshed = false;
      const status = () => ({
        rootPath: scan.rootPath,
        state: refreshed ? 'ready' : 'stale',
        message: refreshed ? undefined : 'Filer er endret.',
        documentCount: 1,
        skippedCounts: { unsupported: 0, binary: 0, oversized: 0, 'read-error': 0 },
        skippedFiles: [],
        updatedAt: '2026-05-09T12:10:00.000Z',
      });

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        chooseWorkspaceFolderForInitialization: async () => null,
        confirmWorkspaceInitialization: async () => {
          throw new Error('No workspace initialization.');
        },
        previewContextPackage: async () => ({
          scope: 'workspace',
          rootPath: scan.rootPath,
          targetPath: scan.rootPath,
          targetRelativePath: '.',
          outputPath: `${scan.rootPath}/workspace.context-package.md`,
          outputFileName: 'workspace.context-package.md',
          willOverwrite: false,
          binaryFileWarning: '',
          selfIgnoreWarning: '',
        }),
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        readWorkspaceInfo: async () => ({ status: 'missing', path: '' }),
        readDocumentRelationships: async () => ({ status: 'missing', path: '' }),
        generateDocumentRelationships: async () => {
          throw new Error('No document relationships.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import.');
        },
        getSearchIndexStatus: async () => status(),
        refreshSearchIndex: async () => {
          refreshed = true;
          return status();
        },
        searchWorkspace: async (request) => ({
          rootPath: scan.rootPath,
          query: request.query,
          status: status(),
          resultCount: 0,
          results: [],
        }),
        getCodexStatus: async () => ({ state: 'unavailable', available: false, loggedIn: false }),
        startCodexLogin: async () => ({ runId: 'login' }),
        startCodexRun: async () => ({ runId: 'run' }),
        cancelCodexRun: async () => undefined,
        getSettings: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        saveCodexPath: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        resetCodexPath: async () => ({ settings: { sidekick_codex_path: null }, codexPathSource: 'automatic', effectiveCodexPath: null }),
        chooseCodexPath: async () => null,
        testCodexPath: async () => ({ ok: true, message: 'ok' }),
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
        onSearchIndexStatus: () => () => undefined,
      };
    },
    { scan: mockScan },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await expect(page.locator('[data-search-status]')).toHaveText('Indeks må oppdateres');

  await page.getByRole('searchbox', { name: 'Søk' }).fill('mangler');
  await expect(page.locator('[data-search-results]')).toContainText('Ingen treff');

  await page.getByRole('button', { name: 'Oppdater indeks' }).click();
  await expect(page.locator('[data-search-status]')).toHaveText('Indeks klar (1)');
});

test('initializes an existing folder after preview confirmation', async ({ page }) => {
  await page.addInitScript(
    ({ preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => null,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        chooseWorkspaceFolderForInitialization: async () => preview,
        confirmWorkspaceInitialization: async (previewId) => {
          if (previewId !== preview.previewId) {
            throw new Error('Unexpected preview id.');
          }

          return result;
        },
        previewContextPackage: async () => {
          throw new Error('No context package preview.');
        },
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      preview: mockWorkspaceInitializationPreview,
      result: mockWorkspaceInitializationResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Initialiser eksisterende arbeidsområde...' }).click();

  await expect(page.locator('[data-workspace-initialization-panel]')).toBeVisible();
  await expect(page.locator('[data-workspace-initialization-details]')).toContainText(
    '/tmp/existing-sidekick-workspace',
  );
  await expect(page.locator('[data-workspace-initialization-details]')).toContainText(
    '02. Transkripsjoner',
  );
  await expect(page.locator('[data-workspace-initialization-warnings]')).toContainText(
    '01. Transkriberinger',
  );

  await page.getByRole('button', { name: 'Opprett manglende mapper' }).click();

  await expect(page.getByLabel('Valgt arbeidsområde').getByRole('heading')).toHaveText(
    'existing-sidekick-workspace',
  );
  await expect(page.getByRole('treeitem', { name: /00. Forutsetninger/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01. Notater/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /02. Transkripsjoner/ })).toBeVisible();
});

test('validates and cancels the workspace creation dialog', async ({ page }) => {
  await page.addInitScript(() => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => null,
      chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => {
        throw new Error('Create should not be called.');
      },
      previewContextPackage: async () => {
        throw new Error('No context package preview.');
      },
      generateContextPackage: async () => {
        throw new Error('No context package result.');
      },
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
      getCodexStatus: async () => ({
        state: 'ready',
        available: true,
        loggedIn: true,
        version: 'codex-cli 0.130.0-test',
      }),
      startCodexLogin: async () => ({ runId: 'login-run' }),
      startCodexRun: async () => ({ runId: 'codex-run' }),
      cancelCodexRun: async () => undefined,
      onCodexOutput: () => () => undefined,
      onCodexCompletion: () => () => undefined,
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Opprett nytt arbeidsområde...' }).click();
  await page.getByLabel('Arbeidsområdenavn').fill('../outside');

  await expect(page.getByText('Arbeidsområdenavnet må være et mappenavn, ikke en sti.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett arbeidsområde' })).toBeDisabled();

  await page.getByRole('button', { name: 'Velg...' }).click();
  await expect(page.locator('[data-workspace-parent-path]')).toHaveText('Ingen plassering valgt.');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Opprett nytt arbeidsområde' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Velg et arbeidsområde' })).toBeVisible();
});

test('shows a workspace creation error and keeps the dialog usable', async ({ page }) => {
  await page.addInitScript(() => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => null,
      chooseWorkspaceParentFolder: async () => '/tmp',
      createWorkspaceFolder: async () => {
        throw new Error('Arbeidsområdet finnes allerede.');
      },
      previewContextPackage: async () => {
        throw new Error('No context package preview.');
      },
      generateContextPackage: async () => {
        throw new Error('No context package result.');
      },
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
      getCodexStatus: async () => ({
        state: 'ready',
        available: true,
        loggedIn: true,
        version: 'codex-cli 0.130.0-test',
      }),
      startCodexLogin: async () => ({ runId: 'login-run' }),
      startCodexRun: async () => ({ runId: 'codex-run' }),
      cancelCodexRun: async () => undefined,
      onCodexOutput: () => () => undefined,
      onCodexCompletion: () => () => undefined,
    };
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Opprett nytt arbeidsområde...' }).click();
  await page.getByLabel('Arbeidsområdenavn').fill('existing-workspace');
  await page.getByRole('button', { name: 'Velg...' }).click();
  await page.getByRole('button', { name: 'Opprett arbeidsområde' }).click();

  await expect(page.getByRole('dialog', { name: 'Opprett nytt arbeidsområde' })).toBeVisible();
  await expect(page.getByText('Arbeidsområdet finnes allerede.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett arbeidsområde' })).toBeEnabled();
});

test('renders the refreshed workspace overview at minimum viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1040, height: 720 });
  await page.addInitScript(
    ({ scan, preview }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.locator('[data-overview-title]')).toHaveText('Arbeidsområdeoversikt');
  await expect(page.getByLabel('Valgt arbeidsområde')).toContainText('/tmp/sidekick-workspace');

  const stats = page.locator('[data-overview-stats]');
  await expect(stats).toContainText('Filer');
  await expect(stats).toContainText('3');
  await expect(stats).toContainText('Mapper');
  await expect(stats).toContainText('2');
  await expect(stats).toContainText('Siste skanning');
  await expect(stats).toContainText('Kontekstpakke');

  await expect(page.locator('[data-selection-details]')).toContainText('Kontekstpakke');
  await expect(page.locator('[data-selection-details]')).toContainText('Finnes');
  await expect(page.locator('[data-selection-details]')).toContainText('Fullført');
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generer kontekstpakke' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importer transkripsjon' })).toBeVisible();
  await expect(page.locator('[data-overview-action-run-codex]')).toBeVisible();
  await expectWithinViewport(page.locator('[data-app-topbar]'), 1040, 720);
  await expectWithinViewport(page.locator('[data-overview-stats]'), 1040, 720);
  await expectWithinViewport(page.locator('[data-action-bar]'), 1040, 720);
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});

test('keeps the refreshed shell balanced at reference viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 820 });
  await page.addInitScript(
    ({ scan, preview }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  const primary = page.locator('[data-primary-workspace]');
  const context = page.locator('[data-context-surface]');
  const primaryBox = await primary.boundingBox();
  const contextBox = await context.boundingBox();

  expect(primaryBox).not.toBeNull();
  expect(contextBox).not.toBeNull();

  if (primaryBox && contextBox) {
    expect(primaryBox.x + primaryBox.width).toBeLessThanOrEqual(contextBox.x + 1);
    expect(contextBox.x + contextBox.width).toBeLessThanOrEqual(1280);
  }

  await expectWithinViewport(page.locator('[data-app-topbar]'), 1280, 820);
  await expectWithinViewport(page.locator('[data-action-bar]'), 1280, 820);
  await expectWithinViewport(page.locator('[data-status-bar]'), 1280, 820);
  await expect(page.locator('[data-context-surface]')).toContainText('Kontekstpakke');
});

test('shows partial scan status and warnings in the overview', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockPartialScan,
      preview: {
        ...mockContextPackagePreview,
        willOverwrite: false,
      },
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.getByRole('heading', { name: 'Arbeidsområdeoversikt (delvis)' })).toBeVisible();
  await expect(page.locator('[data-selection-details]')).toContainText('Delvis');
  await expect(page.locator('[data-selection-details]')).toContainText('Mangler');
  await expect(page.locator('[data-selection-warnings]')).toContainText(
    'Skanningen traff maks antall filer.',
  );
  await expect(page.locator('[data-selection-warnings]')).toContainText(
    '06-eksporter: Kunne ikke lese mappen.',
  );
  await expect
    .poll(() =>
      page
        .locator('[data-selection-warnings] li')
        .first()
        .evaluate((element) => getComputedStyle(element, '::before').content),
    )
    .toBe('"!"');
});

test('shows an empty scanned workspace as an overview state', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockEmptyScan,
      preview: {
        ...mockContextPackagePreview,
        willOverwrite: false,
      },
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.getByRole('heading', { name: 'Arbeidsområdet er tomt' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Velg et arbeidsområde' })).toHaveCount(0);
  await expect(page.locator('[data-overview-stats]')).toContainText('0');
  await expect(page.locator('[data-selection-details]')).toContainText('Ingen');
});

test('expands and collapses scanned folders', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        readWorkspaceInfo: async () => result.workspaceSummary.workspaceInfo ?? mockWorkspaceInfo,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.getByRole('tree', { name: 'Skannet mappetre' })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /sidekick-workspace/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);

  await page.getByRole('button', { name: 'Utvid 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toBeVisible();
  await expect(page.getByText('notes.md')).toBeVisible();

  await page.getByRole('button', { name: 'Lukk 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
  await expect(page.getByText('notes.md')).toHaveCount(0);
});

test('switches between physical folders and project context views', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockProjectScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.getByRole('button', { name: 'Mapper', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('tree', { name: 'Skannet mappetre' })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /Strategi/ })).toBeVisible();

  await page.getByRole('button', { name: 'Prosjekter', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Prosjekter', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const projectsView = page.getByLabel('Prosjekter');
  await expect(projectsView.locator('.project-context-group', { hasText: 'Strategi' })).toBeVisible();
  await expect(page.getByText('Prosjektfiler')).toBeVisible();
  await expect(projectsView.getByRole('button', { name: /brief.pdf/ })).toBeVisible();
  await expect(projectsView.getByText('02-transkripsjoner')).toHaveCount(0);

  await projectsView.getByRole('button', { name: /notes.md/ }).click();
  await expect(page.locator('[data-selection-details]')).toContainText('Fysisk plassering');
  await expect(page.locator('[data-selection-details]')).toContainText('Strategi/notes.md');
  await expect(page.locator('[data-selection-details]')).toContainText('Prosjekt');
  await expect(page.locator('[data-selection-details]')).toContainText('Vises her fordi');
  await expect(page.locator('[data-selection-details]')).toContainText(
    'Filen ligger fysisk i en mappe tagget som Prosjektmappe.',
  );

  await page.getByRole('button', { name: 'Mapper', exact: true }).click();
  await expect(page.getByRole('tree', { name: 'Skannet mappetre' })).toBeVisible();
  await expect(page.locator('[data-selection-title]')).toHaveText('notes.md');
});

test('shows an empty project context view when no folders are tagged', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Prosjekter', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Ingen prosjektmapper' })).toBeVisible();
  await expect(page.getByText('Tagg en mappe med Prosjektmappe')).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
});

test('edits folder tags from the right panel and shows tree pills', async ({ page }) => {
  await page.addInitScript(
    ({ scan }) => {
      let currentScan = scan;
      const normalize = (label: string) => label.trim().replace(/\s+/g, ' ');
      const key = (label: string) => normalize(label).toLocaleLowerCase('nb-NO');
      const updateNodeTags = (node: WorkspaceScan['tree'], relativePath: string, tags: unknown[]) => {
        if (node.relativePath === relativePath) {
          return {
            ...node,
            metadata: {
              status: 'valid',
              markerRelativePath: `${relativePath}/.sidekick-folder.json`,
              folderId: 'folder-01-bakgrunn',
              tags,
            },
          };
        }

        return {
          ...node,
          children: node.children?.map((child) => updateNodeTags(child, relativePath, tags)),
        };
      };
      const makeTag = (label: string) => {
        const normalized = normalize(label);
        if (key(normalized) === 'prosjektmappe') {
          return {
            label: 'Prosjektmappe',
            normalizedLabel: 'prosjektmappe',
            kind: 'system',
            source: 'explicit',
            updatedAt: '2026-05-14T12:00:00.000Z',
            systemEffect: 'project-root',
            context: {
              id: 'project-01-bakgrunn',
              type: 'project',
              name: '01-bakgrunn',
            },
          };
        }

        return {
          label: normalized,
          normalizedLabel: key(normalized),
          kind: 'free',
          source: 'explicit',
          updatedAt: '2026-05-14T12:00:00.000Z',
        };
      };
      const editTag = async (request: { folderRelativePath: string; label: string }, action: 'add' | 'remove') => {
        const node = currentScan.tree.children?.find(
          (child) => child.relativePath === request.folderRelativePath,
        );
        const currentTags = node?.metadata?.status === 'valid' ? node.metadata.tags ?? [] : [];
        const normalizedLabel = key(request.label);
        const tags =
          action === 'add'
            ? [...currentTags.filter((tag) => tag.normalizedLabel !== normalizedLabel), makeTag(request.label)]
            : currentTags.filter((tag) => tag.normalizedLabel !== normalizedLabel);

        currentScan = {
          ...currentScan,
          tree: updateNodeTags(currentScan.tree, request.folderRelativePath, tags),
        };

        return {
          status: 'complete',
          rootPath: currentScan.rootPath,
          folderRelativePath: request.folderRelativePath,
          metadata: currentScan.tree.children?.find(
            (child) => child.relativePath === request.folderRelativePath,
          )?.metadata,
          scan: currentScan,
        };
      };

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => currentScan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => {
          throw new Error('No context package preview.');
        },
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        addFolderTag: async (request) => editTag(request, 'add'),
        removeFolderTag: async (request) => editTag(request, 'remove'),
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    { scan: mockScan },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('treeitem', { name: /01-bakgrunn/ }).click();

  await expect(page.getByText('Tagger', { exact: true })).toBeVisible();
  await expect(page.getByText('Ingen tagger')).toBeVisible();

  const tagInput = page.getByLabel('Legg til tag');
  await tagInput.fill('Prosjektmappe');
  await tagInput.press('Enter');

  await expect(page.locator('.folder-tag-chip', { hasText: 'Prosjektmappe' })).toBeVisible();
  await expect(page.locator('.tree-tag-pill', { hasText: 'Prosjektmappe' })).toBeVisible();

  await tagInput.fill('Q2');
  await tagInput.press('Enter');

  await expect(page.locator('.folder-tag-chip', { hasText: 'Q2' })).toBeVisible();
  await page.getByRole('button', { name: 'Fjern tag Prosjektmappe' }).click();
  await expect(page.locator('.folder-tag-chip', { hasText: 'Prosjektmappe' })).toHaveCount(0);
  await expect(page.locator('.folder-tag-chip', { hasText: 'Q2' })).toBeVisible();
});

test('expands and collapses all scanned folders', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Utvid alle mapper' }).click();

  await expect(page.getByText('brief.pdf')).toBeVisible();
  await expect(page.getByText('intervju-01.docx')).toBeVisible();

  await page.getByRole('button', { name: 'Lukk alle mapper' }).click();
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
  await expect(page.getByText('intervju-01.docx')).toHaveCount(0);
});

test('selects folders and shows selected folder detail', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.locator('.tree-row[data-tree-path="01-bakgrunn"]').click();

  const selectedItem = page.locator('[role="treeitem"][data-tree-path="01-bakgrunn"]');
  await expect(selectedItem).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-selection-title]')).toHaveText('01-bakgrunn');
  await expect(page.locator('[data-selection-details]')).toContainText('01-bakgrunn');
  await expect(page.locator('[data-selection-details]')).toContainText('2 filer');
  await expect(page.locator('[data-selection-contents]')).toContainText('brief.pdf');
  await expect(page.locator('[data-selection-contents]')).toContainText('notes.md');

  await page.locator('[data-selection-contents]').getByRole('button', { name: /brief.pdf/ }).click();
  await expect(page.locator('[data-selection-title]')).toHaveText('brief.pdf');
  await expect(page.locator('[data-selection-details]')).toContainText('01-bakgrunn/brief.pdf');
  await expect(page.locator('[data-selection-details]')).toContainText('PDF');
  await expect(page.getByRole('button', { name: /Åpne fil/i })).toHaveCount(0);
});

test('supports keyboard navigation and breadcrumb selection in the folder tree', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockDeepScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  const rootRow = page.locator('.tree-row[data-tree-path="."]');
  await rootRow.focus();
  await expect(rootRow).toBeFocused();
  await expect
    .poll(() =>
      rootRow.evaluate((element) => Number.parseFloat(getComputedStyle(element).outlineWidth)),
    )
    .toBeGreaterThanOrEqual(2);

  await rootRow.press('ArrowDown');
  const backgroundRow = page.locator('.tree-row[data-tree-path="01-bakgrunn"]');
  await expect(backgroundRow).toBeFocused();
  await backgroundRow.press('Enter');

  const backgroundItem = page.locator('[role="treeitem"][data-tree-path="01-bakgrunn"]');
  await expect(backgroundItem).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect
    .poll(() => backgroundRow.evaluate((element) => getComputedStyle(element).boxShadow))
    .not.toBe('none');
  await expect(page.locator('[data-selection-title]')).toHaveText('01-bakgrunn');

  await backgroundRow.press('ArrowRight');
  await expect(backgroundItem).toHaveAttribute('aria-expanded', 'true');

  await page.locator('.tree-row[data-tree-path="01-bakgrunn/research"]').click();
  await expect(page.locator('[data-selection-title]')).toHaveText('research');
  await expect(page.locator('[data-selection-breadcrumb]')).toContainText('01-bakgrunn');
  await expect(page.locator('[data-selection-contents]')).toContainText('deep-note.md');

  await page.locator('[data-selection-breadcrumb]').getByRole('button', { name: '01-bakgrunn' }).click();
  await expect(page.locator('[data-selection-title]')).toHaveText('01-bakgrunn');
});

test('confirms and displays a generated context package', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => preview,
        generateContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: mockContextPackagePreview,
      result: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Generer kontekstpakke' }).click();

  await expect(page.getByRole('heading', { name: 'Lag kontekstpakke' })).toBeVisible();
  await expect(page.locator('[data-selection-title]')).toHaveText('sidekick-workspace');
  await expect(page.getByRole('button', { name: 'Importer transkripsjon' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Kjør Codex' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Velg annen mappe...' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Innstillinger' })).toBeDisabled();

  await expect(page.getByRole('button', { name: 'Forhåndsvis' })).toBeEnabled();
  await page.getByRole('button', { name: 'Forhåndsvis' }).click();

  await expect(page.getByRole('heading', { name: 'Bekreft kontekstpakke' })).toBeVisible();
  const contextPackageState = page.locator('[data-context-package-state]');
  const contextPackageDetails = page.locator('[data-context-package-details]');
  await expect(contextPackageState.getByText('Skriveoperasjon')).toBeVisible();
  await expect(contextPackageDetails).toContainText('sidekick-workspace.context-package.md');
  await expect(contextPackageDetails).toContainText(
    '/tmp/sidekick-workspace/sidekick-workspace.context-package.md',
  );
  await expect(contextPackageDetails).toContainText('Overskriver');
  await expect(contextPackageDetails).toContainText('Ja');
  await expect(page.getByText(/erstatter eksisterende sidekick-workspace.context-package.md/)).toBeVisible();
  await expect(page.getByText(/Binary files such as PDF/)).toBeVisible();
  await expect(page.getByText(/Generated context-package files are ignored/)).toBeVisible();

  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(page.getByRole('heading', { name: 'Arbeidsområdeoversikt' })).toBeVisible();

  await page.getByRole('button', { name: 'Generer kontekstpakke' }).click();
  await page.getByRole('button', { name: 'Forhåndsvis' }).click();
  await expect(page.getByRole('heading', { name: 'Bekreft kontekstpakke' })).toBeVisible();
  await page.getByRole('button', { name: 'Generer pakke' }).click();

  await expect(page.getByRole('heading', { name: 'Kontekstpakke generert' })).toBeVisible();
  await expect(page.getByText('Kontekstpakken er klar')).toBeVisible();
  await expect(contextPackageDetails).toContainText('Inkludert');
  await expect(contextPackageDetails).toContainText('2');
  await expect(contextPackageDetails).toContainText('Hoppet over');
  await expect(contextPackageDetails).toContainText('Tokens');
  await expect(contextPackageDetails).toContainText('523');
  await expect(contextPackageDetails).toContainText('Arbeidsområdesammendrag oppdatert');
  await expect(page.getByText('01-bakgrunn/brief.pdf: binary-extension')).toBeVisible();
  await expect(page.getByText('03-modeller/model.md: Suspicious file content detected.')).toBeVisible();
  await expect(page.locator('[data-selection-details]')).toContainText('Finnes');
  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(
    page.getByRole('tree', { name: 'Skannet mappetre' }).getByText('sidekick-workspace.context-package.md'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Arbeidsområdesammendrag' })).toBeVisible();
  await expect(page.getByText('Arbeidsområdet handler om lokal arbeidsområdeforståelse')).toBeVisible();
  await expect(page.locator('[data-overview-stats]')).toContainText('4');
});

test('generates and displays document relationship reports', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult, relationshipResult }) => {
      let relationshipSnapshot: DocumentRelationshipsSnapshot = {
        status: 'missing',
        path: '/tmp/sidekick-workspace/.sidekick/document-relationships.md',
      };

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        readDocumentRelationships: async () => relationshipSnapshot,
        generateDocumentRelationships: async () => {
          relationshipSnapshot = relationshipResult.report;

          return relationshipResult;
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
      relationshipResult: mockDocumentRelationshipsResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(page.locator('[data-selection-details]')).toContainText('Sammenhenger');
  await expect(page.locator('[data-selection-details]')).toContainText('Mangler');
  await page.locator('[data-overview-action-document-relationships]').click();

  const relationshipPanel = page.locator('[data-workflow-panel="document-relationships"]');
  await expect(relationshipPanel.getByRole('heading', { name: 'Finn sammenhenger' })).toBeVisible();
  await expect(relationshipPanel).toContainText('Hele valgt arbeidsområde');
  await relationshipPanel.locator('[data-document-relationships-primary]').click();

  await expect(
    relationshipPanel.getByRole('heading', { name: 'Dokumentsammenhenger oppdatert' }),
  ).toBeVisible();
  await expect(relationshipPanel).toContainText('Rapporten er klar');
  await expect(relationshipPanel).toContainText('.sidekick/document-relationships.md');
  await expect(relationshipPanel).toContainText('Strategi og operasjon deler begrepet porteføljestyring');
  await expect(relationshipPanel).toContainText('Rollen til ekstern partner bør undersøkes videre');

  await relationshipPanel.locator('[data-document-relationships-secondary]').click();
  await expect(page.getByRole('heading', { name: 'Sammenhenger' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vis rapport' })).toBeVisible();
  await page.getByRole('button', { name: 'Vis rapport' }).click();

  await expect(relationshipPanel.getByRole('heading', { name: 'Dokumentsammenhenger' })).toBeVisible();
  await expect(relationshipPanel).toContainText('Relasjonskart');
  await expect(relationshipPanel).toContainText('styringsmodell');
});

test('shows no-write feedback when document relationship analysis fails', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        readDocumentRelationships: async () => ({
          status: 'missing',
          path: '/tmp/sidekick-workspace/.sidekick/document-relationships.md',
        }),
        generateDocumentRelationships: async () => ({
          status: 'failed',
          message: 'Kontekstpakken er for stor til sikker analyse.',
        }),
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.locator('[data-overview-action-document-relationships]').click();

  const relationshipPanel = page.locator('[data-workflow-panel="document-relationships"]');
  await relationshipPanel.locator('[data-document-relationships-primary]').click();

  await expect(relationshipPanel.getByRole('heading', { name: 'Analyse feilet' })).toBeVisible();
  await expect(relationshipPanel).toContainText('Kontekstpakken er for stor til sikker analyse.');
  await expect(relationshipPanel).toContainText('Ingen ny rapport ble skrevet');
  await expect(relationshipPanel.getByRole('button', { name: 'Prøv igjen' })).toBeEnabled();
});

test('generates a folder-scoped context package from selected folder context', async ({ page }) => {
  const folderPreview: ContextPackagePreview = {
    ...mockContextPackagePreview,
    scope: 'folder',
    targetPath: '/tmp/sidekick-workspace/02-transkripsjoner',
    targetRelativePath: '02-transkripsjoner',
    outputPath: '/tmp/sidekick-workspace/02-transkripsjoner/transkripsjoner.context-package.md',
    outputFileName: 'transkripsjoner.context-package.md',
    willOverwrite: false,
  };
  const folderResult: ContextPackageResult = {
    ...mockContextPackageResult,
    scope: 'folder',
    targetPath: '/tmp/sidekick-workspace/02-transkripsjoner',
    targetRelativePath: '02-transkripsjoner',
    outputPath: '/tmp/sidekick-workspace/02-transkripsjoner/transkripsjoner.context-package.md',
    outputFileName: 'transkripsjoner.context-package.md',
    overwritten: false,
    scan: withContextViews({
      ...mockContextPackageResult.scan,
      tree: {
        ...mockContextPackageResult.scan.tree,
        children: mockContextPackageResult.scan.tree.children?.map((child) =>
          child.relativePath === '02-transkripsjoner'
            ? {
                ...child,
                children: [
                  ...(child.children ?? []),
                  {
                    name: 'transkripsjoner.context-package.md',
                    relativePath: '02-transkripsjoner/transkripsjoner.context-package.md',
                    kind: 'file' as const,
                    artifactType: 'markdown-text' as const,
                    contextHints: [],
                    size: 4096,
                    modifiedAt: '2026-05-09T12:12:00.000Z',
                  },
                ],
              }
            : child,
        ),
      },
    }),
  };

  await page.addInitScript(
    ({ scan, preview, result }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => {
          throw new Error('Use folder preview in this test.');
        },
        generateContextPackage: async () => {
          throw new Error('Use folder generation in this test.');
        },
        previewFolderContextPackage: async () => preview,
        generateFolderContextPackage: async () => result,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
      };
    },
    {
      scan: mockScan,
      preview: folderPreview,
      result: folderResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.locator('.tree-row[data-tree-path="02-transkripsjoner"]').click();

  await expect(page.locator('[data-selection-title]')).toHaveText('02-transkripsjoner');
  await expect(
    page.getByRole('button', { name: 'Generer kontekstpakke for denne mappen' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Generer kontekstpakke for denne mappen' }).click();
  await expect(page.getByRole('heading', { name: 'Lag kontekstpakke for mappe' })).toBeVisible();
  await expect(page.locator('[data-selection-title]')).toHaveText('02-transkripsjoner');

  await page.getByRole('button', { name: 'Forhåndsvis' }).click();
  const contextPackageDetails = page.locator('[data-context-package-details]');
  await expect(page.getByRole('heading', { name: 'Bekreft kontekstpakke' })).toBeVisible();
  await expect(contextPackageDetails).toContainText('02-transkripsjoner');
  await expect(contextPackageDetails).toContainText('transkripsjoner.context-package.md');
  await expect(contextPackageDetails).toContainText(
    '/tmp/sidekick-workspace/02-transkripsjoner/transkripsjoner.context-package.md',
  );
  await expect(page.getByText(/Sidekick skriver én Markdown-fil til valgt mappe/)).toBeVisible();

  await page.getByRole('button', { name: 'Generer pakke' }).click();
  await expect(page.getByRole('heading', { name: 'Kontekstpakke generert' })).toBeVisible();
  await expect(contextPackageDetails).toContainText('02-transkripsjoner');
  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(
    page.getByRole('tree', { name: 'Skannet mappetre' }).getByText('transkripsjoner.context-package.md'),
  ).toBeVisible();
});

test('shows folder-scoped context package action only for non-root folders', async ({ page }) => {
  await page.addInitScript(({ scan }) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => scan,
      chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => null,
      previewContextPackage: async () => {
        throw new Error('No context package preview.');
      },
      generateContextPackage: async () => {
        throw new Error('No context package result.');
      },
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
    };
  }, { scan: mockScan });

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  await expect(
    page.getByRole('button', { name: 'Generer kontekstpakke for denne mappen' }),
  ).toBeHidden();

  await page.locator('.tree-row[data-tree-path="01-bakgrunn"]').click();
  await expect(
    page.getByRole('button', { name: 'Generer kontekstpakke for denne mappen' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Utvid 01-bakgrunn' }).click();
  await page.locator('.tree-row[data-tree-path="01-bakgrunn/notes.md"]').click();
  await expect(
    page.getByRole('button', { name: 'Generer kontekstpakke for denne mappen' }),
  ).toBeHidden();
});

test('generates missing transcription summaries from the transcription folder action', async ({ page }) => {
  await page.addInitScript(
    ({ scan, summaryPreview, summaryResult }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => {
          throw new Error('No context package preview.');
        },
        generateContextPackage: async () => {
          throw new Error('No context package result.');
        },
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        previewTranscriptionSummaryBatch: async () => summaryPreview,
        confirmTranscriptionSummaryBatch: async () => summaryResult,
      };
    },
    {
      scan: mockScanWithTextTranscriptions,
      summaryPreview: mockTranscriptionSummaryBatchPreview,
      summaryResult: mockTranscriptionSummaryBatchResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.locator('.tree-row[data-tree-path="02-transkripsjoner"]').click();

  await expect(page.getByRole('button', { name: 'Generer manglende sammendrag' })).toBeVisible();
  await page.getByRole('button', { name: 'Generer manglende sammendrag' }).click();
  await expect(page.getByRole('heading', { name: 'Lag manglende sammendrag' })).toBeVisible();

  await page.getByRole('button', { name: 'Forhåndsvis' }).click();
  const summaryDetails = page.locator('[data-transcription-summary-batch-details]');
  await expect(page.getByRole('heading', { name: 'Bekreft sammendrag' })).toBeVisible();
  await expect(summaryDetails).toContainText('02-transkripsjoner');
  await expect(summaryDetails).toContainText('Skal genereres');
  await expect(summaryDetails).toContainText('2');
  await expect(page.getByText('00. interview.md: Mangler')).toBeVisible();
  await expect(page.getByText(/02. broken.md: Ugyldig/)).toBeVisible();
  await expect(page.getByText(/Sidekick skriver samtalesammendrag/)).toBeVisible();

  await page.getByRole('button', { name: 'Generer sammendrag' }).click();
  await expect(page.getByRole('heading', { name: 'Sammendrag ferdig' })).toBeVisible();
  await expect(page.getByText('Delvis fullført')).toBeVisible();
  await expect(summaryDetails).toContainText('Generert');
  await expect(summaryDetails).toContainText('Feilet');
  await expect(summaryDetails).toContainText('Hoppet over, finnes');
  await expect(page.getByText('02. broken.md: Codex failed.')).toBeVisible();
  await expect(page.getByText('00. interview.md: Generert')).toBeVisible();
});

test('shows no-write feedback when context package preview fails', async ({ page }) => {
  await page.addInitScript(({ scan }) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => scan,
      chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => null,
      previewContextPackage: async () => {
        throw new Error('Workspace path must point to a directory.');
      },
      generateContextPackage: async () => {
        throw new Error('No context package result.');
      },
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
    };
  }, { scan: mockScan });

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Generer kontekstpakke' }).click();
  await page.getByRole('button', { name: 'Forhåndsvis' }).click();

  await expect(
    page.getByRole('heading', { name: 'Kontekstpakke kan ikke forberedes' }),
  ).toBeVisible();
  await expect(page.getByText('Workspace path must point to a directory.')).toBeVisible();
  await expect(page.getByText('Ingen fil ble skrevet')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prøv igjen' })).toBeEnabled();
});

test('confirms and displays an imported transcription', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult, importPreview, importResult }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => importPreview,
        confirmTranscriptionImport: async () => importResult,
        readTranscriptionSummary: async () => importResult.summary.summary,
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
      importPreview: mockTranscriptionImportPreview,
      importResult: mockTranscriptionImportResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();

  await expect(page.getByRole('button', { name: 'Velg fil...' })).toBeEnabled();
  await page.getByRole('button', { name: 'Velg fil...' }).click();

  await expect(page.getByRole('heading', { name: 'Bekreft import' })).toBeVisible();
  const transcriptionDetails = page.locator('[data-transcription-import-details]');
  const transcriptionState = page.locator('[data-transcription-import-state]');
  await expect(transcriptionState.getByText('Skriveoperasjon')).toBeVisible();
  await expect(transcriptionDetails).toContainText('new-transcription.md');
  await expect(transcriptionDetails).toContainText('/tmp/downloads/new-transcription.md');
  await expect(transcriptionDetails).toContainText('02-transkripsjoner');
  await expect(transcriptionDetails).toContainText('00. new-transcription.md');
  await expect(page.getByText(/Ingen andre filer endres/)).toBeVisible();

  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(page.getByRole('heading', { name: 'Arbeidsområdeoversikt' })).toBeVisible();

  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();
  await page.getByRole('button', { name: 'Velg fil...' }).click();
  await expect(page.getByRole('heading', { name: 'Bekreft import' })).toBeVisible();
  await page.getByRole('button', { name: 'Importer fil' }).click();

  await expect(page.getByRole('heading', { name: 'Transkripsjon importert' })).toBeVisible();
  await expect(page.getByText(/Sidekick har laget et samtalesammendrag/)).toBeVisible();
  await expect(transcriptionDetails).toContainText('00. new-transcription.md');
  await expect(transcriptionDetails).toContainText('Samtalesammendrag laget');
  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(
    page.getByRole('tree', { name: 'Skannet mappetre' }).getByText('00. new-transcription.md'),
  ).toBeVisible();
  await expect(
    page.getByRole('treeitem', { name: '00. new-transcription.md' }),
  ).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('[data-transcription-summary="loaded"]')).toContainText(
    'Samtalen handler om Sidekick.',
  );
});

test('keeps the transcript import ready state when file selection is cancelled', async ({ page }) => {
  await page.addInitScript(({ scan, contextPreview, contextResult }) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => scan,
      chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => null,
      previewContextPackage: async () => contextPreview,
      generateContextPackage: async () => contextResult,
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
    };
  }, {
    scan: mockScan,
    contextPreview: mockContextPackagePreview,
    contextResult: mockContextPackageResult,
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();
  await page.getByRole('button', { name: 'Velg fil...' }).click();

  await expect(page.getByRole('heading', { name: 'Importer transkripsjon' })).toBeVisible();
  await expect(page.locator('[data-transcription-import-state]').getByText('Skriveoperasjon')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Velg fil...' })).toBeEnabled();
});

test('shows no-change feedback when transcript import preview fails', async ({ page }) => {
  await page.addInitScript(({ scan, contextPreview, contextResult }) => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => scan,
      chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => null,
      previewContextPackage: async () => {
        return contextPreview;
      },
      generateContextPackage: async () => contextResult,
      previewTranscriptionImport: async () => {
        throw new Error('No transcription folder was detected in this workspace.');
      },
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
    };
  }, {
    scan: mockScan,
    contextPreview: mockContextPackagePreview,
    contextResult: mockContextPackageResult,
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();
  await page.getByRole('button', { name: 'Velg fil...' }).click();

  await expect(page.getByRole('heading', { name: 'Importen kan ikke fullføres' })).toBeVisible();
  await expect(page.getByText('No transcription folder was detected in this workspace.')).toBeVisible();
  await expect(page.getByText('Ingen filer ble endret')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prøv igjen' })).toBeEnabled();
});

test('operates refreshed workflow controls from keyboard focus', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult, importPreview, importResult }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => importPreview,
        confirmTranscriptionImport: async () => importResult,
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
      importPreview: mockTranscriptionImportPreview,
      importResult: mockTranscriptionImportResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();

  const contextAction = page.locator('[data-overview-action-generate-context]');
  await contextAction.focus();
  await expect(contextAction).toBeFocused();
  await contextAction.press('Enter');
  await expect(page.getByRole('heading', { name: 'Lag kontekstpakke' })).toBeVisible();
  const contextPrimary = page.locator('[data-context-package-primary]');
  await expect(contextPrimary).toBeEnabled();
  await contextPrimary.click();
  await expect(page.getByRole('heading', { name: 'Bekreft kontekstpakke' })).toBeVisible();
  await page.locator('[data-context-package-secondary]').click();
  await expect(page.getByRole('heading', { name: 'Arbeidsområdeoversikt' })).toBeVisible();

  const importAction = page.locator('[data-overview-action-import-transcription]');
  await importAction.focus();
  await expect(importAction).toBeFocused();
  await importAction.press('Enter');
  await expect(page.getByRole('heading', { name: 'Importer transkripsjon' })).toBeVisible();
  const importPrimary = page.locator('[data-transcription-import-primary]');
  await expect(importPrimary).toBeEnabled();
  await importPrimary.click();
  await expect(page.getByRole('heading', { name: 'Bekreft import' })).toBeVisible();
  await page.locator('[data-transcription-import-secondary]').click();
  await expect(page.getByRole('heading', { name: 'Arbeidsområdeoversikt' })).toBeVisible();

  await page.locator('[data-overview-action-run-codex]').focus();
  await page.keyboard.press('Enter');
  const codexPrompt = page.locator('[data-codex-prompt]');
  await codexPrompt.focus();
  await expect(codexPrompt).toBeFocused();
  await codexPrompt.fill('Inspect the workspace');
  await page.locator('[data-codex-edit-mode]').focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-codex-state]')).toContainText('Skriveoperasjon');
  await page.locator('[data-codex-primary]').focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Codex kjører' })).toBeVisible();
});

test('runs Codex in read-only mode from the controlled panel', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult }) => {
      let outputListener:
        | ((event: {
            runId: string;
            stream: 'stdout' | 'stderr';
            text: string;
            createdAt: string;
          }) => void)
        | undefined;
      let completionListener:
        | ((event: {
            runId: string;
            state: 'completed';
            mode: 'read-only' | 'workspace-write' | 'login';
            exitCode: number;
            signal: null;
            createdAt: string;
          }) => void)
        | undefined;
      (window as unknown as { __codexRequests: unknown[] }).__codexRequests = [];

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async (request) => {
          (window as unknown as { __codexRequests: unknown[] }).__codexRequests.push(request);
          window.setTimeout(() => {
            outputListener?.({
              runId: 'codex-run',
              stream: 'stdout',
              text: 'Workspace summary complete',
              createdAt: '2026-05-11T12:00:00.000Z',
            });
            completionListener?.({
              runId: 'codex-run',
              state: 'completed',
              mode: 'read-only',
              exitCode: 0,
              signal: null,
              createdAt: '2026-05-11T12:00:01.000Z',
            });
          }, 0);

          return { runId: 'codex-run' };
        },
        cancelCodexRun: async () => undefined,
        onCodexOutput: (listener) => {
          outputListener = listener;
          return () => {
            outputListener = undefined;
          };
        },
        onCodexCompletion: (listener) => {
          completionListener = listener;
          return () => {
            completionListener = undefined;
          };
        },
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await expect(codexPanel.getByRole('heading', { name: 'Codex er klar' })).toBeVisible();
  await expect(codexPanel).toContainText('codex-cli 0.130.0-test');
  await expect(codexPanel).toContainText('Lesetilgang');
  await expect(codexPanel).toContainText('/tmp/sidekick-workspace');

  await codexPanel.getByLabel('Instruksjon').fill('Summarize this workspace');
  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Codex fullført' })).toBeVisible();
  await expect(codexPanel).toContainText('Workspace summary complete');
  await expect(codexPanel).toContainText('Kjørelogg');
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __codexRequests: Array<{ mode: string }> }).__codexRequests[0]?.mode,
      ),
    )
    .toBe('read-only');
});

test('shows Codex write-mode warning before running', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult }) => {
      (window as unknown as { __codexRequests: unknown[] }).__codexRequests = [];

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async (request) => {
          (window as unknown as { __codexRequests: unknown[] }).__codexRequests.push(request);
          return { runId: 'codex-write-run' };
        },
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: () => () => undefined,
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Update the workspace notes');
  await codexPanel.locator('[data-codex-edit-mode]').check();

  await expect(codexPanel).toContainText('Skrivetilgang');
  await expect(codexPanel).toContainText('Skriveoperasjon');
  await expect(codexPanel).toContainText('Codex kan endre filer direkte i /tmp/sidekick-workspace');

  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();
  await expect(codexPanel.getByRole('heading', { name: 'Codex kjører' })).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { __codexRequests: Array<{ mode: string }> }).__codexRequests[0]?.mode,
      ),
    )
    .toBe('workspace-write');
});

test('shows Codex login state and returns to ready after device login', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult }) => {
      let statusChecks = 0;
      let outputListener:
        | ((event: {
            runId: string;
            stream: 'stdout' | 'stderr';
            text: string;
            createdAt: string;
          }) => void)
        | undefined;
      let completionListener:
        | ((event: {
            runId: string;
            state: 'completed';
            mode: 'login';
            exitCode: number;
            signal: null;
            createdAt: string;
          }) => void)
        | undefined;

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => {
          statusChecks += 1;
          return statusChecks === 1
            ? {
                state: 'logged-out',
                available: true,
                loggedIn: false,
                version: 'codex-cli 0.130.0-test',
                message: 'Device login required.',
              }
            : {
                state: 'ready',
                available: true,
                loggedIn: true,
                version: 'codex-cli 0.130.0-test',
              };
        },
        startCodexLogin: async () => {
          window.setTimeout(() => {
            outputListener?.({
              runId: 'login-run',
              stream: 'stdout',
              text: 'Open the device login URL.',
              createdAt: '2026-05-11T12:00:00.000Z',
            });
          }, 20);
          window.setTimeout(() => {
            completionListener?.({
              runId: 'login-run',
              state: 'completed',
              mode: 'login',
              exitCode: 0,
              signal: null,
              createdAt: '2026-05-11T12:00:01.000Z',
            });
          }, 150);

          return { runId: 'login-run' };
        },
        startCodexRun: async () => ({ runId: 'codex-run' }),
        cancelCodexRun: async () => undefined,
        onCodexOutput: (listener) => {
          outputListener = listener;
          return () => {
            outputListener = undefined;
          };
        },
        onCodexCompletion: (listener) => {
          completionListener = listener;
          return () => {
            completionListener = undefined;
          };
        },
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await expect(codexPanel.getByRole('heading', { name: 'Innlogging kreves' })).toBeVisible();
  await expect(codexPanel).toContainText('Codex er ikke logget inn');
  await codexPanel.getByRole('button', { name: 'Logg inn' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Innlogging kjører' })).toBeVisible();
  await expect(codexPanel).toContainText('Open the device login URL.');
  await expect(codexPanel.getByRole('heading', { name: 'Codex er klar' })).toBeVisible();
});

test('cancels a running Codex operation from the controlled panel', async ({ page }) => {
  await page.addInitScript(
    ({ scan, contextPreview, contextResult }) => {
      let completionListener:
        | ((event: {
            runId: string;
            state: 'canceled';
            mode: 'read-only';
            exitCode: null;
            signal: null;
            message: string;
            createdAt: string;
          }) => void)
        | undefined;

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => ({ runId: 'cancel-run' }),
        cancelCodexRun: async () => {
          completionListener?.({
            runId: 'cancel-run',
            state: 'canceled',
            mode: 'read-only',
            exitCode: null,
            signal: null,
            message: 'Kjøringen ble avbrutt.',
            createdAt: '2026-05-11T12:00:01.000Z',
          });
        },
        onCodexOutput: () => () => undefined,
        onCodexCompletion: (listener) => {
          completionListener = listener;
          return () => {
            completionListener = undefined;
          };
        },
      };
    },
    {
      scan: mockScan,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Inspect the workspace');
  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();
  await expect(codexPanel.getByRole('heading', { name: 'Codex kjører' })).toBeVisible();
  await codexPanel.getByRole('button', { name: 'Avbryt' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Codex avbrutt' })).toBeVisible();
  await expect(codexPanel).toContainText('Kjøringen ble avbrutt.');
});

test('shows Codex failure state and refreshes scan after write completion', async ({ page }) => {
  await page.addInitScript(
    ({ scan, scanAfterWrite, contextPreview, contextResult }) => {
      let completionListener:
        | ((event: {
            runId: string;
            state: 'failed' | 'completed';
            mode: 'read-only' | 'workspace-write';
            exitCode: number | null;
            signal: null;
            message?: string;
            createdAt: string;
            scan?: unknown;
          }) => void)
        | undefined;

      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseWorkspaceFolder: async () => scan,
        chooseWorkspaceParentFolder: async () => null,
        createWorkspaceFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => null,
        confirmTranscriptionImport: async () => {
          throw new Error('No transcription import preview.');
        },
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async (request) => {
          window.setTimeout(() => {
            completionListener?.(
              request.mode === 'workspace-write'
                ? {
                    runId: 'codex-run',
                    state: 'completed',
                    mode: 'workspace-write',
                    exitCode: 0,
                    signal: null,
                    message: 'Skrivekjøring fullført.',
                    createdAt: '2026-05-11T12:00:01.000Z',
                    scan: scanAfterWrite,
                  }
                : {
                    runId: 'codex-run',
                    state: 'failed',
                    mode: 'read-only',
                    exitCode: 1,
                    signal: null,
                    message: 'Codex returned an error.',
                    createdAt: '2026-05-11T12:00:01.000Z',
                  },
            );
          }, 0);

          return { runId: 'codex-run' };
        },
        cancelCodexRun: async () => undefined,
        onCodexOutput: () => () => undefined,
        onCodexCompletion: (listener) => {
          completionListener = listener;
          return () => {
            completionListener = undefined;
          };
        },
      };
    },
    {
      scan: mockScan,
      scanAfterWrite: mockScanAfterTranscriptionImport,
      contextPreview: mockContextPackagePreview,
      contextResult: mockContextPackageResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Velg eksisterende arbeidsområde...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Fail this read-only run');
  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();
  await expect(codexPanel.getByRole('heading', { name: 'Codex feilet' })).toBeVisible();
  await expect(codexPanel).toContainText('Codex returned an error.');

  await codexPanel.getByLabel('Instruksjon').fill('Update the workspace');
  await codexPanel.locator('[data-codex-edit-mode]').check();
  await codexPanel.getByRole('button', { name: 'Kjør igjen' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Codex fullført' })).toBeVisible();
  await expect(codexPanel).toContainText('Skrivekjøring fullført.');
  await expect(page.locator('[data-overview-stats]')).toContainText('4');
});

test('opens settings and manages Codex CLI path', async ({ page }) => {
  await page.addInitScript(({ settings }) => {
    let currentSettings = settings;

    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseWorkspaceFolder: async () => null,
        chooseWorkspaceParentFolder: async () => null,
      createWorkspaceFolder: async () => null,
      previewContextPackage: async () => {
        throw new Error('No context package preview.');
      },
      generateContextPackage: async () => {
        throw new Error('No context package result.');
      },
      previewTranscriptionImport: async () => null,
      confirmTranscriptionImport: async () => {
        throw new Error('No transcription import preview.');
      },
      getCodexStatus: async () => ({
        state: 'ready',
        available: true,
        loggedIn: true,
        version: 'codex-cli 0.130.0-test',
      }),
      startCodexLogin: async () => ({ runId: 'login-run' }),
      startCodexRun: async () => ({ runId: 'codex-run' }),
      cancelCodexRun: async () => undefined,
      getSettings: async () => currentSettings,
      chooseCodexPath: async () => '/usr/local/bin/codex',
      testCodexPath: async (codexPath) => ({
        ok: codexPath === '/usr/local/bin/codex',
        state: codexPath === '/usr/local/bin/codex' ? 'ready' : 'unavailable',
        version: codexPath === '/usr/local/bin/codex' ? 'codex-cli settings-test' : undefined,
        message:
          codexPath === '/usr/local/bin/codex'
            ? 'Codex detected: codex-cli settings-test'
            : 'Codex CLI path must point to an existing file.',
      }),
      saveCodexPath: async (codexPath) => {
        currentSettings = {
          settings: {
            sidekick_codex_path: codexPath,
          },
          codexPathSource: codexPath ? 'saved' : 'automatic',
          effectiveCodexPath: codexPath,
        };

        return currentSettings;
      },
      resetCodexPath: async () => {
        currentSettings = {
          settings: {
            sidekick_codex_path: null,
          },
          codexPathSource: 'automatic',
          effectiveCodexPath: null,
        };

        return currentSettings;
      },
      onCodexOutput: () => () => undefined,
      onCodexCompletion: () => () => undefined,
    };
  }, {
    settings: mockSettingsSnapshot,
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Innstillinger' }).click();

  const settingsDetails = page.locator('[data-settings-codex-details]');
  await expect(page.getByRole('heading', { name: 'Innstillinger' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex', exact: true })).toBeVisible();
  await expect(settingsDetails).toContainText('Automatisk søk');

  await page.getByRole('button', { name: 'Velg...' }).click();
  await expect(page.getByRole('textbox', { name: 'Sti' })).toHaveValue('/usr/local/bin/codex');

  await page.getByRole('button', { name: 'Test' }).click();
  await expect(page.getByText('Codex detected: codex-cli settings-test')).toBeVisible();

  await page.getByRole('button', { name: 'Lagre' }).click();
  await expect(page.getByText('Codex-sti lagret.')).toBeVisible();
  await expect(settingsDetails).toContainText('Lagret innstilling');

  await page.getByRole('button', { name: 'Tilbakestill til automatisk søk' }).click();
  await expect(page.getByText('Codex-sti tilbakestilt til automatisk søk.')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Sti' })).toHaveValue('');

  await page.getByRole('button', { name: 'Tilbake til arbeidsflate' }).click();
  await expect(page.getByRole('heading', { name: 'Mappestruktur' })).toBeVisible();
});
