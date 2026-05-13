import { expect, test, type Locator } from '@playwright/test';
import type {
  ArtifactType,
  AppSettingsSnapshot,
  ContextPackagePreview,
  ContextPackageResult,
  FolderSignal,
  ProjectCreationResult,
  ProjectFolderScan,
  ProjectInitializationPreview,
  ProjectInitializationResult,
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

const mockContextPackagePreview: ContextPackagePreview = {
  rootPath: '/tmp/sidekick-project',
  outputPath: '/tmp/sidekick-project/sidekick-project.context-package.md',
  outputFileName: 'sidekick-project.context-package.md',
  willOverwrite: true,
  binaryFileWarning:
    'Binary files such as PDF, DOCX, PPTX, images, audio, and video are not included as full text content.',
  selfIgnoreWarning: 'Generated context-package files are ignored during generation.',
};

const mockContextPackageResult: ContextPackageResult = {
  status: 'complete',
  rootPath: '/tmp/sidekick-project',
  outputPath: '/tmp/sidekick-project/sidekick-project.context-package.md',
  outputFileName: 'sidekick-project.context-package.md',
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
  scan: {
    ...mockScan,
    scannedAt: '2026-05-09T12:10:00.000Z',
    tree: {
      ...mockScan.tree,
      children: [
        ...(mockScan.tree.children ?? []),
        {
          name: 'sidekick-project.context-package.md',
          relativePath: 'sidekick-project.context-package.md',
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
  },
};

const mockScanAfterTranscriptionImport: ProjectFolderScan = {
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
};

const mockTranscriptionImportPreview: TranscriptionImportPreview = {
  previewId: 'preview-1',
  rootPath: '/tmp/sidekick-project',
  sourcePath: '/tmp/downloads/new-transcription.md',
  sourceFileName: 'new-transcription.md',
  targetFolderPath: '/tmp/sidekick-project/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  destinationPath: '/tmp/sidekick-project/02-transkripsjoner/00. new-transcription.md',
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
  rootPath: '/tmp/sidekick-project',
  sourcePath: '/tmp/downloads/new-transcription.md',
  sourceFileName: 'new-transcription.md',
  targetFolderPath: '/tmp/sidekick-project/02-transkripsjoner',
  targetFolderRelativePath: '02-transkripsjoner',
  destinationPath: '/tmp/sidekick-project/02-transkripsjoner/00. new-transcription.md',
  destinationFileName: '00. new-transcription.md',
  finalNumber: 0,
  copiedBytes: 1024,
  scan: mockScanAfterTranscriptionImport,
};

const mockProjectCreationResult: ProjectCreationResult = {
  rootPath: '/tmp/new-sidekick-project',
  rootName: 'new-sidekick-project',
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/new-sidekick-project/00. Forutsetninger',
      status: 'created',
    },
    {
      name: '01. Transkripsjoner',
      path: '/tmp/new-sidekick-project/01. Transkripsjoner',
      status: 'created',
    },
  ],
  scan: {
    ...mockScan,
    rootPath: '/tmp/new-sidekick-project',
    rootName: 'new-sidekick-project',
    tree: {
      ...mockScan.tree,
      name: 'new-sidekick-project',
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
          name: '01. Transkripsjoner',
          relativePath: '01. Transkripsjoner',
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
      folderCount: 2,
      recentFiles: [],
    },
  },
};

const mockProjectInitializationPreview: ProjectInitializationPreview = {
  previewId: 'init-preview',
  rootPath: '/tmp/existing-sidekick-project',
  rootName: 'existing-sidekick-project',
  existingEntryCount: 3,
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/existing-sidekick-project/00. Forutsetninger',
      status: 'existing',
    },
    {
      name: '01. Transkripsjoner',
      path: '/tmp/existing-sidekick-project/01. Transkripsjoner',
      status: 'missing',
    },
  ],
  warnings: [
    {
      path: '01. Transkriberinger',
      message:
        'This folder looks similar to a required project folder, but Sidekick requires the exact folder name.',
    },
  ],
};

const mockProjectInitializationResult: ProjectInitializationResult = {
  status: 'complete',
  rootPath: '/tmp/existing-sidekick-project',
  rootName: 'existing-sidekick-project',
  requiredFolders: [
    {
      name: '00. Forutsetninger',
      path: '/tmp/existing-sidekick-project/00. Forutsetninger',
      status: 'existing',
    },
    {
      name: '01. Transkripsjoner',
      path: '/tmp/existing-sidekick-project/01. Transkripsjoner',
      status: 'created',
    },
  ],
  scan: {
    ...mockProjectCreationResult.scan,
    rootPath: '/tmp/existing-sidekick-project',
    rootName: 'existing-sidekick-project',
    tree: {
      ...mockProjectCreationResult.scan.tree,
      name: 'existing-sidekick-project',
    },
  },
};

const mockPartialScan: ProjectFolderScan = {
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
};

const mockDeepScan: ProjectFolderScan = {
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
};

const mockEmptyScan: ProjectFolderScan = {
  ...mockScan,
  rootPath: '/tmp/empty-sidekick-project',
  rootName: 'empty-sidekick-project',
  tree: {
    name: 'empty-sidekick-project',
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
};

test('renders the folder inspection empty state', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('[data-app-topbar]')).toBeVisible();
  await expect(page.locator('[data-primary-workspace]')).toBeVisible();
  await expect(page.locator('[data-context-surface]')).toBeHidden();
  await expect(page.locator('[data-action-bar]')).toBeHidden();
  await expect(page.locator('[data-status-bar]')).toBeVisible();
  await expect(page.locator('.app-brand__name')).toHaveText('Sidekick');
  await expect(page.getByRole('heading', { name: 'Velg en prosjektmappe' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Velg eksisterende mappe...' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett ny prosjektmappe...' })).toBeVisible();
  await expect(
    page.getByLabel('Valgt prosjektmappe').getByRole('heading', {
      name: 'Ingen prosjektmappe valgt',
    }),
  ).toBeVisible();
  await expect(page.getByText('Browser preview')).toBeVisible();
});

test('creates a project and displays the required folders', async ({ page }) => {
  await page.addInitScript(
    ({ createdProject }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseProjectFolder: async () => null,
        chooseProjectParentFolder: async () => '/tmp',
        createProjectFolder: async (request) =>
          request.projectName === 'new-sidekick-project' && request.parentPath === '/tmp'
            ? createdProject
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
      createdProject: mockProjectCreationResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Opprett ny prosjektmappe...' }).click();
  await expect(page.getByRole('dialog', { name: 'Opprett ny prosjektmappe' })).toBeVisible();
  await expect(page.getByLabel('Prosjektnavn')).toBeFocused();
  await expect(page.getByText('Prosjektnavn er påkrevd.')).toHaveCount(0);
  await page.getByRole('button', { name: 'Avbryt' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Lukk' })).toBeFocused();
  await page.getByLabel('Prosjektnavn').focus();
  await page.getByLabel('Prosjektnavn').fill('new-sidekick-project');
  await page.getByRole('button', { name: 'Velg...' }).click();
  await expect(page.locator('[data-project-target-preview]')).toContainText(
    '/tmp/new-sidekick-project',
  );
  await page.getByRole('button', { name: 'Opprett mappe' }).click();

  await expect(page.getByLabel('Valgt prosjektmappe').getByRole('heading')).toHaveText(
    'new-sidekick-project',
  );
  await expect(page.getByLabel('Valgt prosjektmappe')).toContainText('/tmp/new-sidekick-project');
  await expect(page.getByRole('treeitem', { name: /00. Forutsetninger/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01. Transkripsjoner/ })).toBeVisible();
  await expect(page.locator('[data-workflow-panel="codex"]')).toContainText('codex-cli 0.130.0-test');
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
        chooseProjectFolder: async () => null,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
        chooseProjectFolderForInitialization: async () => preview,
        confirmProjectInitialization: async (previewId) => {
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
      preview: mockProjectInitializationPreview,
      result: mockProjectInitializationResult,
    },
  );

  await page.goto('/');
  await page.getByRole('button', { name: 'Initialiser eksisterende mappe...' }).click();

  await expect(page.locator('[data-project-initialization-panel]')).toBeVisible();
  await expect(page.locator('[data-project-initialization-details]')).toContainText(
    '/tmp/existing-sidekick-project',
  );
  await expect(page.locator('[data-project-initialization-details]')).toContainText(
    '01. Transkripsjoner',
  );
  await expect(page.locator('[data-project-initialization-warnings]')).toContainText(
    '01. Transkriberinger',
  );

  await page.getByRole('button', { name: 'Opprett manglende mapper' }).click();

  await expect(page.getByLabel('Valgt prosjektmappe').getByRole('heading')).toHaveText(
    'existing-sidekick-project',
  );
  await expect(page.getByRole('treeitem', { name: /00. Forutsetninger/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01. Transkripsjoner/ })).toBeVisible();
});

test('validates and cancels the project creation dialog', async ({ page }) => {
  await page.addInitScript(() => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseProjectFolder: async () => null,
      chooseProjectParentFolder: async () => null,
      createProjectFolder: async () => {
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
  await page.getByRole('button', { name: 'Opprett ny prosjektmappe...' }).click();
  await page.getByLabel('Prosjektnavn').fill('../outside');

  await expect(page.getByText('Prosjektnavnet må være et mappenavn, ikke en sti.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett mappe' })).toBeDisabled();

  await page.getByRole('button', { name: 'Velg...' }).click();
  await expect(page.locator('[data-project-parent-path]')).toHaveText('Ingen plassering valgt.');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Opprett ny prosjektmappe' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Velg en prosjektmappe' })).toBeVisible();
});

test('shows a project creation error and keeps the dialog usable', async ({ page }) => {
  await page.addInitScript(() => {
    window.sidekick = {
      getAppInfo: async () => ({
        name: 'Sidekick',
        version: '1.0.0',
        platform: 'linux',
        isPackaged: false,
      }),
      chooseProjectFolder: async () => null,
      chooseProjectParentFolder: async () => '/tmp',
      createProjectFolder: async () => {
        throw new Error('Project folder already exists.');
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
  await page.getByRole('button', { name: 'Opprett ny prosjektmappe...' }).click();
  await page.getByLabel('Prosjektnavn').fill('existing-project');
  await page.getByRole('button', { name: 'Velg...' }).click();
  await page.getByRole('button', { name: 'Opprett mappe' }).click();

  await expect(page.getByRole('dialog', { name: 'Opprett ny prosjektmappe' })).toBeVisible();
  await expect(page.getByText('Project folder already exists.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opprett mappe' })).toBeEnabled();
});

test('renders the refreshed project overview at minimum viewport', async ({ page }) => {
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

  await expect(page.locator('[data-overview-title]')).toHaveText('Prosjektoversikt');
  await expect(page.getByLabel('Valgt prosjektmappe')).toContainText('/tmp/sidekick-project');

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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

  await expect(page.getByRole('heading', { name: 'Prosjektoversikt (delvis)' })).toBeVisible();
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

test('shows an empty scanned project as an overview state', async ({ page }) => {
  await page.addInitScript(
    ({ scan, preview }) => {
      window.sidekick = {
        getAppInfo: async () => ({
          name: 'Sidekick',
          version: '1.0.0',
          platform: 'linux',
          isPackaged: false,
        }),
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

  await expect(page.getByRole('heading', { name: 'Prosjektmappen er tom' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Velg en prosjektmappe' })).toHaveCount(0);
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

  await expect(page.getByRole('tree', { name: 'Skannet mappetre' })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /sidekick-project/ })).toBeVisible();
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);

  await page.getByRole('button', { name: 'Utvid 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toBeVisible();
  await expect(page.getByText('notes.md')).toBeVisible();

  await page.getByRole('button', { name: 'Lukk 01-bakgrunn' }).click();
  await expect(page.getByText('brief.pdf')).toHaveCount(0);
  await expect(page.getByText('notes.md')).toHaveCount(0);
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Generer kontekstpakke' }).click();

  await expect(page.getByRole('heading', { name: 'Lag kontekstpakke' })).toBeVisible();
  await expect(page.locator('[data-selection-title]')).toHaveText('sidekick-project');
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
  await expect(contextPackageDetails).toContainText('sidekick-project.context-package.md');
  await expect(contextPackageDetails).toContainText(
    '/tmp/sidekick-project/sidekick-project.context-package.md',
  );
  await expect(contextPackageDetails).toContainText('Overskriver');
  await expect(contextPackageDetails).toContainText('Ja');
  await expect(page.getByText(/erstatter eksisterende sidekick-project.context-package.md/)).toBeVisible();
  await expect(page.getByText(/Binary files such as PDF/)).toBeVisible();
  await expect(page.getByText(/Generated context-package files are ignored/)).toBeVisible();

  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(page.getByRole('heading', { name: 'Prosjektoversikt' })).toBeVisible();

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
  await expect(page.getByText('01-bakgrunn/brief.pdf: binary-extension')).toBeVisible();
  await expect(page.getByText('03-modeller/model.md: Suspicious file content detected.')).toBeVisible();
  await expect(page.locator('[data-selection-details]')).toContainText('Finnes');
  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(
    page.getByRole('tree', { name: 'Skannet mappetre' }).getByText('sidekick-project.context-package.md'),
  ).toBeVisible();
  await expect(page.locator('[data-overview-stats]')).toContainText('4');
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
      chooseProjectFolder: async () => scan,
      chooseProjectParentFolder: async () => null,
      createProjectFolder: async () => null,
      previewContextPackage: async () => {
        throw new Error('Project folder path must point to a directory.');
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Generer kontekstpakke' }).click();
  await page.getByRole('button', { name: 'Forhåndsvis' }).click();

  await expect(
    page.getByRole('heading', { name: 'Kontekstpakke kan ikke forberedes' }),
  ).toBeVisible();
  await expect(page.getByText('Project folder path must point to a directory.')).toBeVisible();
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
        previewContextPackage: async () => contextPreview,
        generateContextPackage: async () => contextResult,
        previewTranscriptionImport: async () => importPreview,
        confirmTranscriptionImport: async () => importResult,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
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
  await expect(page.getByRole('heading', { name: 'Prosjektoversikt' })).toBeVisible();

  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();
  await page.getByRole('button', { name: 'Velg fil...' }).click();
  await expect(page.getByRole('heading', { name: 'Bekreft import' })).toBeVisible();
  await page.getByRole('button', { name: 'Importer fil' }).click();

  await expect(page.getByRole('heading', { name: 'Transkripsjon importert' })).toBeVisible();
  await expect(page.getByText('Originalfilen er uendret på kildestedet.')).toBeVisible();
  await expect(transcriptionDetails).toContainText('00. new-transcription.md');
  await page.getByRole('button', { name: 'Tilbake' }).click();
  await expect(
    page.getByRole('tree', { name: 'Skannet mappetre' }).getByText('00. new-transcription.md'),
  ).toBeVisible();
  await expect(
    page.getByRole('treeitem', { name: '00. new-transcription.md' }),
  ).toHaveAttribute('aria-selected', 'true');
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
      chooseProjectFolder: async () => scan,
      chooseProjectParentFolder: async () => null,
      createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
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
      chooseProjectFolder: async () => scan,
      chooseProjectParentFolder: async () => null,
      createProjectFolder: async () => null,
      previewContextPackage: async () => {
        return contextPreview;
      },
      generateContextPackage: async () => contextResult,
      previewTranscriptionImport: async () => {
        throw new Error('No transcription folder was detected in this project.');
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Importer transkripsjon' }).click();
  await page.getByRole('button', { name: 'Velg fil...' }).click();

  await expect(page.getByRole('heading', { name: 'Importen kan ikke fullføres' })).toBeVisible();
  await expect(page.getByText('No transcription folder was detected in this project.')).toBeVisible();
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();

  const contextAction = page.locator('[data-overview-action-generate-context]');
  await contextAction.focus();
  await expect(contextAction).toBeFocused();
  await contextAction.press('Enter');
  await expect(page.getByRole('heading', { name: 'Lag kontekstpakke' })).toBeVisible();
  const contextPrimary = page.locator('[data-context-package-primary]');
  await expect(contextPrimary).toBeEnabled();
  await contextPrimary.press('Enter');
  await expect(page.getByRole('heading', { name: 'Bekreft kontekstpakke' })).toBeVisible();
  await page.locator('[data-context-package-secondary]').press('Enter');
  await expect(page.getByRole('heading', { name: 'Prosjektoversikt' })).toBeVisible();

  const importAction = page.locator('[data-overview-action-import-transcription]');
  await importAction.focus();
  await expect(importAction).toBeFocused();
  await importAction.press('Enter');
  await expect(page.getByRole('heading', { name: 'Importer transkripsjon' })).toBeVisible();
  const importPrimary = page.locator('[data-transcription-import-primary]');
  await expect(importPrimary).toBeEnabled();
  await importPrimary.press('Enter');
  await expect(page.getByRole('heading', { name: 'Bekreft import' })).toBeVisible();
  await page.locator('[data-transcription-import-secondary]').press('Enter');
  await expect(page.getByRole('heading', { name: 'Prosjektoversikt' })).toBeVisible();

  await page.locator('[data-overview-action-run-codex]').focus();
  await page.keyboard.press('Enter');
  const codexPrompt = page.locator('[data-codex-prompt]');
  await codexPrompt.focus();
  await expect(codexPrompt).toBeFocused();
  await codexPrompt.fill('Inspect the project');
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
              text: 'Project summary complete',
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await expect(codexPanel.getByRole('heading', { name: 'Codex er klar' })).toBeVisible();
  await expect(codexPanel).toContainText('codex-cli 0.130.0-test');
  await expect(codexPanel).toContainText('Lesetilgang');
  await expect(codexPanel).toContainText('/tmp/sidekick-project');

  await codexPanel.getByLabel('Instruksjon').fill('Summarize this project');
  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Codex fullført' })).toBeVisible();
  await expect(codexPanel).toContainText('Project summary complete');
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Update the project notes');
  await codexPanel.locator('[data-codex-edit-mode]').check();

  await expect(codexPanel).toContainText('Skrivetilgang');
  await expect(codexPanel).toContainText('Skriveoperasjon');
  await expect(codexPanel).toContainText('Codex kan endre filer direkte i /tmp/sidekick-project');

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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Inspect the project');
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
        chooseProjectFolder: async () => scan,
        chooseProjectParentFolder: async () => null,
        createProjectFolder: async () => null,
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
  await page.getByRole('button', { name: 'Velg eksisterende mappe...' }).click();
  await page.getByRole('button', { name: 'Kjør Codex' }).click();

  const codexPanel = page.locator('[data-workflow-panel="codex"]');
  await codexPanel.getByLabel('Instruksjon').fill('Fail this read-only run');
  await codexPanel.getByRole('button', { name: 'Kjør Codex' }).click();
  await expect(codexPanel.getByRole('heading', { name: 'Codex feilet' })).toBeVisible();
  await expect(codexPanel).toContainText('Codex returned an error.');

  await codexPanel.getByLabel('Instruksjon').fill('Update the project');
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
      chooseProjectFolder: async () => null,
        chooseProjectParentFolder: async () => null,
      createProjectFolder: async () => null,
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
