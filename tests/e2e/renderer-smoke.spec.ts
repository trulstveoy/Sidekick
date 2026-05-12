import { expect, test } from '@playwright/test';
import type {
  ArtifactType,
  AppSettingsSnapshot,
  ContextPackagePreview,
  ContextPackageResult,
  FolderSignal,
  ProjectCreationResult,
  ProjectFolderScan,
  TranscriptionImportPreview,
  TranscriptionImportResult,
} from '../../src/shared/sidekick-api';

const mockSettingsSnapshot: AppSettingsSnapshot = {
  settings: {
    sidekick_codex_path: null,
  },
  codexPathSource: 'automatic',
  effectiveCodexPath: null,
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
  warnings: [],
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
  await expect(page.locator('.codex-panel')).toContainText('codex-cli 0.130.0-test');
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

  await expect(page.locator('[data-overview-context-package-status]')).toHaveText('Finnes');
  await expect(page.locator('[data-overview-scan-status]')).toContainText('Fullført');
  await expect(page.getByRole('treeitem', { name: /01-bakgrunn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Generer kontekstpakke' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Importer transkripsjon' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Kjør Codex' })).toBeVisible();
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
  await expect(page.locator('[data-overview-scan-status]')).toContainText('Delvis');
  await expect(page.locator('[data-overview-context-package-status]')).toHaveText('Mangler');
  await expect(page.locator('[data-warnings]')).toContainText(
    'Skanningen traff maks antall filer.',
  );
  await expect(page.locator('[data-warnings]')).toContainText(
    '06-eksporter: Kunne ikke lese mappen.',
  );
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
  await expect(page.locator('[data-warnings]')).toContainText('Ingen varsler');
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
  await expect(page.locator('[data-selection-details]')).toContainText(
    '/tmp/sidekick-project/01-bakgrunn',
  );
  await expect(page.locator('[data-selection-details]')).toContainText('2 filer');
  await expect(page.locator('[data-selection-contents]')).toContainText('brief.pdf');
  await expect(page.locator('[data-selection-contents]')).toContainText('notes.md');
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
  await rootRow.press('ArrowDown');
  await page.locator('.tree-row[data-tree-path="01-bakgrunn"]').press('Enter');

  await expect(page.locator('[role="treeitem"][data-tree-path="01-bakgrunn"]')).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('[data-selection-title]')).toHaveText('01-bakgrunn');

  await page.locator('.tree-row[data-tree-path="01-bakgrunn"]').press('ArrowRight');
  await expect(page.locator('[role="treeitem"][data-tree-path="01-bakgrunn"]')).toHaveAttribute(
    'aria-expanded',
    'true',
  );

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

  await expect(page.getByRole('button', { name: 'Create context package' })).toBeEnabled();
  await page.getByRole('button', { name: 'Create context package' }).click();

  await expect(page.getByRole('heading', { name: 'Confirm generation' })).toBeVisible();
  const contextPackageDetails = page.locator('[data-context-package-details]');
  await expect(contextPackageDetails).toContainText('sidekick-project.context-package.md');
  await expect(contextPackageDetails).toContainText(
    '/tmp/sidekick-project/sidekick-project.context-package.md',
  );
  await expect(contextPackageDetails).toContainText('Overwrite');
  await expect(contextPackageDetails).toContainText('Yes');
  await expect(page.getByText(/Binary files such as PDF/)).toBeVisible();
  await expect(page.getByText(/Generated context-package files are ignored/)).toBeVisible();

  await page.getByRole('button', { name: 'Generate package' }).click();

  await expect(page.getByRole('heading', { name: 'Package created' })).toBeVisible();
  await expect(contextPackageDetails).toContainText('Included');
  await expect(contextPackageDetails).toContainText('2');
  await expect(contextPackageDetails).toContainText('Skipped');
  await expect(contextPackageDetails).toContainText('Tokens');
  await expect(contextPackageDetails).toContainText('523');
  await expect(page.getByText('01-bakgrunn/brief.pdf: binary-extension')).toBeVisible();
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

  await expect(page.getByRole('button', { name: 'Add transcription' })).toBeEnabled();
  await page.getByRole('button', { name: 'Add transcription' }).click();

  await expect(page.getByRole('heading', { name: 'Confirm import' })).toBeVisible();
  const transcriptionDetails = page.locator('[data-transcription-import-details]');
  await expect(transcriptionDetails).toContainText('new-transcription.md');
  await expect(transcriptionDetails).toContainText('02-transkripsjoner');
  await expect(transcriptionDetails).toContainText('00. new-transcription.md');
  await expect(page.getByText('Source file will be copied, not moved.')).toBeVisible();

  await page.getByRole('button', { name: 'Import transcription' }).click();

  await expect(page.getByRole('heading', { name: 'Transcription added' })).toBeVisible();
  await expect(transcriptionDetails).toContainText('00. new-transcription.md');
  await expect(page.getByRole('tree', { name: 'Scanned folder tree' }).getByText('00. new-transcription.md')).toBeVisible();
});

test('runs Codex from the controlled panel with mocked output', async ({ page }) => {
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
            mode: 'read-only';
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
        getCodexStatus: async () => ({
          state: 'ready',
          available: true,
          loggedIn: true,
          version: 'codex-cli 0.130.0-test',
        }),
        startCodexLogin: async () => ({ runId: 'login-run' }),
        startCodexRun: async () => {
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

  const codexPanel = page.locator('.codex-panel');
  await expect(codexPanel.getByRole('heading', { name: 'Ready' })).toBeVisible();
  await expect(codexPanel).toContainText('codex-cli 0.130.0-test');

  await codexPanel.getByLabel('Prompt').fill('Summarize this project');
  await codexPanel.getByRole('button', { name: 'Run Codex' }).click();

  await expect(codexPanel.getByRole('heading', { name: 'Codex completed' })).toBeVisible();
  await expect(codexPanel).toContainText('Project summary complete');
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
  await page.getByRole('button', { name: 'Settings' }).click();

  const settingsDetails = page.locator('[data-settings-codex-details]');
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Codex', exact: true })).toBeVisible();
  await expect(settingsDetails).toContainText('Automatic discovery');

  await page.getByRole('button', { name: 'Choose...' }).click();
  await expect(page.getByLabel('Path')).toHaveValue('/usr/local/bin/codex');

  await page.getByRole('button', { name: 'Test' }).click();
  await expect(page.getByText('Codex detected: codex-cli settings-test')).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Codex path saved.')).toBeVisible();
  await expect(settingsDetails).toContainText('Saved setting');

  await page.getByRole('button', { name: 'Reset to automatic discovery' }).click();
  await expect(page.getByText('Codex path reset to automatic discovery.')).toBeVisible();
  await expect(page.getByLabel('Path')).toHaveValue('');

  await page.getByRole('button', { name: 'Back to workspace' }).click();
  await expect(page.getByRole('heading', { name: 'Mappestruktur' })).toBeVisible();
});
