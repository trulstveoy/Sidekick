import { EventEmitter } from 'node:events';
import { watch, type FSWatcher } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export type WorkspaceFileEventType = 'change' | 'rename';

export type WorkspaceFileEvent = {
  rootPath: string;
  absolutePath: string;
  relativePath: string;
  eventType: WorkspaceFileEventType;
  createdAt: string;
};

export type WorkspaceFileWatchStatus = {
  rootPath: string;
  state: 'watching' | 'error';
  message: string;
  createdAt: string;
};

type WorkspaceFileEventServiceEvents = {
  event: [WorkspaceFileEvent];
  status: [WorkspaceFileWatchStatus];
};

type WorkspaceFileWatchState = {
  rootPath: string;
  owners: Set<string>;
  watchers: FSWatcher[];
  refreshPromise?: Promise<void>;
};

export const DEFAULT_IGNORED_WORKSPACE_WATCH_FOLDERS = [
  '.git',
  '.sidekick',
  'node_modules',
  'out',
  'dist',
  '.vite',
  '.cache',
];

const toStatus = (
  rootPath: string,
  state: WorkspaceFileWatchStatus['state'],
  message: string,
): WorkspaceFileWatchStatus => ({
  rootPath,
  state,
  message,
  createdAt: new Date().toISOString(),
});

export const isPathInside = (parentPath: string, childPath: string) => {
  const relativePath = path.relative(path.resolve(parentPath), path.resolve(childPath));

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
};

export const toWorkspaceRelativePath = (rootPath: string, absolutePath: string) => {
  const relativePath = path.relative(rootPath, absolutePath);

  return relativePath === '' ? '.' : relativePath.split(path.sep).join('/');
};

const isHiddenFolder = (folderName: string) => folderName.startsWith('.');

export const shouldIgnoreWorkspaceWatchFolder = (
  folderName: string,
  ignoredFolderNames = DEFAULT_IGNORED_WORKSPACE_WATCH_FOLDERS,
) => ignoredFolderNames.includes(folderName) || isHiddenFolder(folderName);

export class WorkspaceFileEventService extends EventEmitter {
  private readonly states = new Map<string, WorkspaceFileWatchState>();

  private readonly ignoredFolderNames: string[];

  constructor(ignoredFolderNames = DEFAULT_IGNORED_WORKSPACE_WATCH_FOLDERS) {
    super();
    this.ignoredFolderNames = ignoredFolderNames;
  }

  override on<EventName extends keyof WorkspaceFileEventServiceEvents>(
    eventName: EventName,
    listener: (...args: WorkspaceFileEventServiceEvents[EventName]) => void,
  ): this {
    return super.on(eventName, listener);
  }

  watchWorkspace(rootPath: string, ownerId: string) {
    const state = this.getOrCreateState(rootPath);

    state.owners.add(ownerId);
    void this.refreshWorkspaceWatchers(rootPath);

    return () => {
      this.unwatchWorkspace(rootPath, ownerId);
    };
  }

  async refreshWorkspaceWatchers(rootPath: string) {
    const state = this.states.get(rootPath);

    if (!state || state.owners.size === 0) {
      return;
    }

    if (state.refreshPromise) {
      return state.refreshPromise;
    }

    state.refreshPromise = this.rebuildWatchers(state).finally(() => {
      if (state.refreshPromise) {
        state.refreshPromise = undefined;
      }
    });

    return state.refreshPromise;
  }

  closeWorkspace(rootPath: string) {
    const state = this.states.get(rootPath);

    if (!state) {
      return;
    }

    this.closeWatchers(state);
    this.states.delete(rootPath);
  }

  close() {
    for (const rootPath of this.states.keys()) {
      this.closeWorkspace(rootPath);
    }
  }

  private getOrCreateState(rootPath: string) {
    let state = this.states.get(rootPath);

    if (!state) {
      state = {
        rootPath,
        owners: new Set(),
        watchers: [],
      };
      this.states.set(rootPath, state);
    }

    return state;
  }

  private unwatchWorkspace(rootPath: string, ownerId: string) {
    const state = this.states.get(rootPath);

    if (!state) {
      return;
    }

    state.owners.delete(ownerId);

    if (state.owners.size === 0) {
      this.closeWorkspace(rootPath);
    }
  }

  private closeWatchers(state: WorkspaceFileWatchState) {
    state.watchers.forEach((watcher) => watcher.close());
    state.watchers = [];
  }

  private async rebuildWatchers(state: WorkspaceFileWatchState) {
    this.closeWatchers(state);

    let folders: string[];
    try {
      folders = await this.collectWatchFolders(state.rootPath);
    } catch {
      this.emit(
        'status',
        toStatus(state.rootPath, 'error', 'Filovervåking kunne ikke startes. Oppdater manuelt.'),
      );
      return;
    }

    const activeState = this.states.get(state.rootPath);
    if (!activeState || activeState.owners.size === 0) {
      return;
    }

    folders.forEach((folderPath) => {
      try {
        const watcher = watch(folderPath, (eventType, fileName) => {
          const candidatePath =
            typeof fileName === 'string' && fileName
              ? path.join(folderPath, fileName)
              : folderPath;
          this.emitFileEvent(activeState.rootPath, candidatePath, eventType);
        });
        watcher.on('error', () => {
          this.emit(
            'status',
            toStatus(activeState.rootPath, 'error', 'Filovervåking feilet. Oppdater manuelt.'),
          );
        });
        activeState.watchers.push(watcher);
      } catch {
        this.emit(
          'status',
          toStatus(activeState.rootPath, 'error', 'Filovervåking kunne ikke startes for en undermappe.'),
        );
      }
    });

    this.emit('status', toStatus(activeState.rootPath, 'watching', 'Filovervåking aktiv.'));
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
          if (shouldIgnoreWorkspaceWatchFolder(entryName, this.ignoredFolderNames)) {
            return;
          }

          const entryPath = path.join(directoryPath, entryName);

          try {
            const stats = await stat(entryPath);
            if (stats.isDirectory()) {
              await walk(entryPath);
            }
          } catch {
            // Watch coverage is opportunistic. Consumers still rescan or
            // revalidate before trusting filesystem state.
          }
        }),
      );
    };

    await walk(rootPath);

    return folders;
  }

  private emitFileEvent(rootPath: string, absolutePath: string, eventType: string) {
    if (!isPathInside(rootPath, absolutePath)) {
      this.emit(
        'status',
        toStatus(rootPath, 'error', 'Filendring utenfor arbeidsområdet ble avvist.'),
      );
      return;
    }

    this.emit('event', {
      rootPath,
      absolutePath,
      relativePath: toWorkspaceRelativePath(rootPath, absolutePath),
      eventType: eventType === 'rename' ? 'rename' : 'change',
      createdAt: new Date().toISOString(),
    });
  }
}
