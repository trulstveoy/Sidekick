import { EventEmitter } from 'node:events';
import path from 'node:path';
import type { WorkspaceWatchStatus } from '../shared/sidekick-api';
import { FOLDER_METADATA_FILE_NAME } from './context-metadata';
import {
  WorkspaceFileEventService,
  type WorkspaceFileEvent,
  type WorkspaceFileWatchStatus,
} from './workspace-file-events';

export const WORKSPACE_REFRESH_DEBOUNCE_MS = 800;
const CONTEXT_PACKAGE_FILE_SUFFIX = 'context-package.md';

type WorkspaceWatchEvents = {
  refresh: [string];
  status: [WorkspaceWatchStatus];
};

type WorkspaceWatchState = {
  rootPath: string;
  refreshTimer?: NodeJS.Timeout;
  unsubscribe: () => void;
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

  private readonly fileEvents: WorkspaceFileEventService;

  private readonly ownerId = 'workspace-refresh';

  private readonly onFileEvent = (event: WorkspaceFileEvent) => {
    this.queueRefresh(event);
  };

  private readonly onFileWatchStatus = (status: WorkspaceFileWatchStatus) => {
    if (!this.state || this.state.rootPath !== status.rootPath) {
      return;
    }

    if (status.state === 'watching') {
      this.emit('status', toStatus(status.rootPath, 'watching', status.message));
      return;
    }

    this.emit('status', toStatus(status.rootPath, 'error', status.message));
  };

  constructor(
    fileEvents = new WorkspaceFileEventService(),
    debounceMs = WORKSPACE_REFRESH_DEBOUNCE_MS,
  ) {
    super();
    this.fileEvents = fileEvents;
    this.debounceMs = debounceMs;
    this.fileEvents.on('event', this.onFileEvent);
    this.fileEvents.on('status', this.onFileWatchStatus);
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
      unsubscribe: this.fileEvents.watchWorkspace(rootPath, this.ownerId),
    };
  }

  close() {
    if (!this.state) {
      return;
    }

    if (this.state.refreshTimer) {
      clearTimeout(this.state.refreshTimer);
    }

    this.state.unsubscribe();
    this.state = undefined;
  }

  notifyUpdated(rootPath: string) {
    this.emit('status', toStatus(rootPath, 'updated', 'Arbeidsområde oppdatert.'));
    void this.fileEvents.refreshWorkspaceWatchers(rootPath);
  }

  notifyRefreshFailed(rootPath: string, message: string) {
    this.emit('status', toStatus(rootPath, 'error', message));
    void this.fileEvents.refreshWorkspaceWatchers(rootPath);
  }

  private queueRefresh(event: WorkspaceFileEvent) {
    const state = this.state;

    if (!state || state.rootPath !== event.rootPath) {
      return;
    }

    if (shouldIgnoreWorkspaceRefreshPath(event.rootPath, event.absolutePath)) {
      return;
    }

    if (state.refreshTimer) {
      clearTimeout(state.refreshTimer);
    }

    this.emit('status', toStatus(event.rootPath, 'refreshing', 'Oppdaterer arbeidsområde...'));
    state.refreshTimer = setTimeout(() => {
      const activeState = this.state;

      if (!activeState || activeState.rootPath !== event.rootPath) {
        return;
      }

      activeState.refreshTimer = undefined;
      this.emit('refresh', event.rootPath);
    }, this.debounceMs);
  }
}
