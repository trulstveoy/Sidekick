import { EventEmitter } from 'node:events';
import { watch, type FSWatcher } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { WorkspaceWatchStatus } from '../shared/sidekick-api';
import { FOLDER_METADATA_FILE_NAME } from './context-metadata';

export const WORKSPACE_REFRESH_DEBOUNCE_MS = 800;
const CONTEXT_PACKAGE_FILE_SUFFIX = 'context-package.md';

type WorkspaceWatchEvents = {
  refresh: [string];
  status: [WorkspaceWatchStatus];
};

type WorkspaceWatchState = {
  rootPath: string;
  watchers: FSWatcher[];
  refreshTimer?: NodeJS.Timeout;
};

const ignoredFolderNames = new Set([
  '.git',
  '.sidekick',
  'node_modules',
  'out',
  'dist',
  '.vite',
  '.cache',
]);

const isPathInside = (parentPath: string, childPath: string) => {
  const relativePath = path.relative(parentPath, childPath);

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

const toStatus = (
  rootPath: string,
  state: WorkspaceWatchStatus['state'],
  message: string,
): WorkspaceWatchStatus => ({
  rootPath,
  state,
  message,
  createdAt: new Date().toISOString(),
});

export const shouldIgnoreWorkspaceRefreshPath = (rootPath: string, absolutePath: string) => {
  const relativePath = path.relative(rootPath, absolutePath);

  if (!relativePath || relativePath === FOLDER_METADATA_FILE_NAME) {
    return false;
  }

  const normalized = relativePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1] ?? '';

  if (segments.some((segment) => ignoredFolderNames.has(segment))) {
    return true;
  }

  if (fileName.endsWith(`.${CONTEXT_PACKAGE_FILE_SUFFIX}`)) {
    return true;
  }

  return false;
};

export class WorkspaceWatchManager extends EventEmitter {
  private state?: WorkspaceWatchState;

  private readonly debounceMs: number;

  constructor(debounceMs = WORKSPACE_REFRESH_DEBOUNCE_MS) {
    super();
    this.debounceMs = debounceMs;
  }

  override on<EventName extends keyof WorkspaceWatchEvents>(
    eventName: EventName,
    listener: (...args: WorkspaceWatchEvents[EventName]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  watchWorkspace(rootPath: string) {
    this.close();
    this.state = {
      rootPath,
      watchers: [],
    };
    void this.refreshWatchers(rootPath);
  }

  close() {
    if (!this.state) {
      return;
    }

    if (this.state.refreshTimer) {
      clearTimeout(this.state.refreshTimer);
    }

    this.state.watchers.forEach((watcher) => watcher.close());
    this.state = undefined;
  }

  notifyUpdated(rootPath: string) {
    this.emit('status', toStatus(rootPath, 'updated', 'Arbeidsområde oppdatert.'));
    void this.refreshWatchers(rootPath);
  }

  notifyRefreshFailed(rootPath: string, message: string) {
    this.emit('status', toStatus(rootPath, 'error', message));
    void this.refreshWatchers(rootPath);
  }

  private async refreshWatchers(rootPath: string) {
    const state = this.state;

    if (!state || state.rootPath !== rootPath) {
      return;
    }

    state.watchers.forEach((watcher) => watcher.close());
    state.watchers = [];

    try {
      const folders = await this.collectWatchFolders(rootPath);
      const activeState = this.state;

      if (!activeState || activeState.rootPath !== rootPath) {
        return;
      }

      folders.forEach((folderPath) => {
        try {
          const watcher = watch(folderPath, (_eventType, fileName) => {
            const candidatePath =
              typeof fileName === 'string' && fileName
                ? path.join(folderPath, fileName)
                : folderPath;
            this.queueRefresh(rootPath, candidatePath);
          });
          watcher.on('error', () => {
            this.emit(
              'status',
              toStatus(rootPath, 'error', 'Filovervåking feilet. Oppdater arbeidsområdet manuelt.'),
            );
          });
          activeState.watchers.push(watcher);
        } catch {
          this.emit(
            'status',
            toStatus(rootPath, 'error', 'Filovervåking kunne ikke startes for en undermappe.'),
          );
        }
      });

      this.emit('status', toStatus(rootPath, 'watching', 'Filovervåking aktiv.'));
    } catch {
      this.emit(
        'status',
        toStatus(rootPath, 'error', 'Filovervåking kunne ikke startes. Oppdater arbeidsområdet manuelt.'),
      );
    }
  }

  private async collectWatchFolders(rootPath: string) {
    const folders: string[] = [];

    const walk = async (directoryPath: string) => {
      folders.push(directoryPath);
      let entries: string[];

      try {
        entries = await readdir(directoryPath);
      } catch {
        return;
      }

      await Promise.all(
        entries.map(async (entryName) => {
          if (ignoredFolderNames.has(entryName)) {
            return;
          }

          const entryPath = path.join(directoryPath, entryName);

          try {
            const stats = await stat(entryPath);
            if (stats.isDirectory()) {
              await walk(entryPath);
            }
          } catch {
            // Watch coverage is opportunistic. A later full rescan remains the
            // source of truth when a directory cannot be inspected.
          }
        }),
      );
    };

    await walk(rootPath);

    return folders;
  }

  private queueRefresh(rootPath: string, candidatePath: string) {
    const state = this.state;

    if (!state || state.rootPath !== rootPath) {
      return;
    }

    if (!isPathInside(rootPath, candidatePath)) {
      this.emit(
        'status',
        toStatus(rootPath, 'error', 'Filendring utenfor arbeidsområdet ble avvist.'),
      );
      return;
    }

    if (shouldIgnoreWorkspaceRefreshPath(rootPath, candidatePath)) {
      return;
    }

    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }

    this.emit('status', toStatus(rootPath, 'refreshing', 'Oppdaterer arbeidsområde...'));
    state.refreshTimer = setTimeout(() => {
      const activeState = this.state;

      if (!activeState || activeState.rootPath !== rootPath) {
        return;
      }

      activeState.refreshTimer = undefined;
      this.emit('refresh', rootPath);
    }, this.debounceMs);
  }
}
