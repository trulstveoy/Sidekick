import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  AppSettings,
  AppSettingsSnapshot,
  CodexPathSource,
} from '../shared/sidekick-api';

const SETTINGS_FILE_NAME = 'settings.json';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  sidekick_codex_path: null,
};

type SettingsReadResult = {
  settings: AppSettings;
  warning?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const normalizeCodexPath = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('Codex CLI path must be text.');
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

export const validateCodexPath = async (
  value: unknown,
  platform: NodeJS.Platform = process.platform,
) => {
  const codexPath = normalizeCodexPath(value);
  const platformPath = platform === 'win32' ? path.win32 : path;

  if (!codexPath) {
    return null;
  }

  if (!platformPath.isAbsolute(codexPath)) {
    throw new Error('Codex CLI path must be an absolute path.');
  }

  let stats;

  try {
    stats = await stat(codexPath);
  } catch {
    throw new Error('Codex CLI path must point to an existing file.');
  }

  if (!stats.isFile()) {
    throw new Error('Codex CLI path must point to a file.');
  }

  if (platform === 'win32') {
    const basename = platformPath.basename(codexPath).toLowerCase();
    const allowedNames = new Set(['codex', 'codex.exe', 'codex.cmd', 'codex.bat']);

    if (!allowedNames.has(basename)) {
      throw new Error('Codex CLI path must point to codex, codex.exe, codex.cmd, or codex.bat.');
    }
  }

  return codexPath;
};

const parseSettings = (raw: unknown): AppSettings => {
  if (!isRecord(raw)) {
    throw new Error('Settings file must contain an object.');
  }

  return {
    ...DEFAULT_APP_SETTINGS,
    sidekick_codex_path: normalizeCodexPath(raw.sidekick_codex_path),
  };
};

export class AppSettingsStore {
  private readonly settingsPath: string;

  private warning?: string;

  constructor(userDataPath: string) {
    this.settingsPath = path.join(userDataPath, SETTINGS_FILE_NAME);
  }

  async read(): Promise<SettingsReadResult> {
    try {
      const content = await readFile(this.settingsPath, 'utf8');
      const parsed = JSON.parse(content) as unknown;
      return {
        settings: parseSettings(parsed),
        warning: this.warning,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          settings: DEFAULT_APP_SETTINGS,
          warning: this.warning,
        };
      }

      this.warning =
        error instanceof Error
          ? `Settings could not be read. Defaults are being used. ${error.message}`
          : 'Settings could not be read. Defaults are being used.';

      return {
        settings: DEFAULT_APP_SETTINGS,
        warning: this.warning,
      };
    }
  }

  async snapshot(environment: NodeJS.ProcessEnv = process.env): Promise<AppSettingsSnapshot> {
    const { settings, warning } = await this.read();
    const environmentPath = normalizeCodexPath(environment.SIDEKICK_CODEX_PATH);
    const source: CodexPathSource = environmentPath
      ? 'environment'
      : settings.sidekick_codex_path
        ? 'saved'
        : 'automatic';

    return {
      settings,
      codexPathSource: source,
      effectiveCodexPath: environmentPath ?? settings.sidekick_codex_path,
      warning,
    };
  }

  async save(settings: AppSettings) {
    await mkdir(path.dirname(this.settingsPath), { recursive: true });
    const temporaryPath = `${this.settingsPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.settingsPath);
    this.warning = undefined;
  }

  async updateCodexPath(value: unknown, platform: NodeJS.Platform = process.platform) {
    const current = await this.read();
    const codexPath = await validateCodexPath(value, platform);
    const settings = {
      ...current.settings,
      sidekick_codex_path: codexPath,
    };

    await this.save(settings);

    return settings;
  }
}
