#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import Module, { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { extractAll } from '@electron/asar';

const findPackagedAsar = async (outDirectory) => {
  const entries = await readdir(outDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith('Sidekick-')) {
      continue;
    }

    const asarPath = path.join(outDirectory, entry.name, 'resources', 'app.asar');

    if (existsSync(asarPath)) {
      return asarPath;
    }
  }

  throw new Error(`No packaged app.asar found under ${outDirectory}.`);
};

const createElectronStub = (selectedProjectRoot, ipcHandlers) => ({
  app: {
    quit() {},
    enableSandbox() {},
    getName() {
      return 'Sidekick';
    },
    getVersion() {
      return '0.0.0-test';
    },
    isPackaged: true,
    whenReady() {
      return new Promise(() => undefined);
    },
    setAppUserModelId() {},
    on() {},
  },
  ipcMain: {
    handle(channel, handler) {
      ipcHandlers.set(channel, handler);
    },
  },
  BrowserWindow: class BrowserWindow {
    static fromWebContents() {
      return null;
    }

    static getAllWindows() {
      return [];
    }
  },
  dialog: {
    async showOpenDialog() {
      return {
        canceled: false,
        filePaths: [selectedProjectRoot],
      };
    },
  },
  shell: {
    openExternal() {},
  },
});

const runVerification = async () => {
  const outDirectory = path.resolve('out');
  const asarPath = await findPackagedAsar(outDirectory);
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'sidekick-packaged-context-'));
  const extractPath = path.join(tempRoot, 'app');
  const projectRoot = path.join(tempRoot, 'project');
  const ipcHandlers = new Map();
  const originalLoad = Module._load;

  try {
    extractAll(asarPath, extractPath);
    await mkdir(projectRoot, { recursive: true });
    await writeFile(
      path.join(projectRoot, 'note.md'),
      '# Packaged context check\n\nHello from packaged Sidekick.\n',
      'utf8',
    );

    // Load the packaged main bundle in Node with a minimal Electron stub. This
    // catches packaging-only failures, such as missing asar dependencies or
    // worker paths, without launching the GUI in CI.
    Module._load = function load(request, parent, isMain) {
      if (request === 'electron') {
        return createElectronStub(projectRoot, ipcHandlers);
      }

      return originalLoad.apply(this, [request, parent, isMain]);
    };

    const require = createRequire(import.meta.url);
    require(path.join(extractPath, '.vite', 'build', 'main.js'));

    const selectAndScan = ipcHandlers.get('project-folder:choose-and-scan');
    const generateContextPackage = ipcHandlers.get('context-package:generate');

    if (!selectAndScan || !generateContextPackage) {
      throw new Error('Packaged app did not register expected context-package IPC handlers.');
    }

    const scan = await selectAndScan({ sender: {} });
    const result = await generateContextPackage({ sender: {} }, scan.rootPath);
    const output = await readFile(result.outputPath, 'utf8');

    if (!output.includes('Packaged context check')) {
      throw new Error('Generated context package does not include expected source content.');
    }

    console.log(`Packaged context package verification passed for ${path.basename(asarPath)}.`);
  } finally {
    Module._load = originalLoad;
    await rm(tempRoot, { recursive: true, force: true });
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runVerification().catch((error) => {
    console.error(error instanceof Error ? error.stack : error);
    process.exitCode = 1;
  });
}
