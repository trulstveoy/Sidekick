import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import config, { appIconBasePath, appIconIcoPath, appIconPngPath } from '../../forge.config';

describe('app icon configuration', () => {
  it('configures Electron Packager to use the generated Sidekick icon', () => {
    expect(config.packagerConfig?.icon).toBe(appIconBasePath);
    expect(config.packagerConfig?.extraResource).toEqual([appIconPngPath]);
    expect(appIconBasePath).toBe(path.resolve(__dirname, '../../assets/icons/generated/sidekick-icon'));
  });

  it('keeps generated icon files available for packaging', () => {
    expect(existsSync(path.resolve(__dirname, '../../assets/icons/sidekick-icon.svg'))).toBe(true);
    expect(existsSync(appIconPngPath)).toBe(true);
    expect(existsSync(appIconIcoPath)).toBe(true);
    expect(existsSync(`${appIconBasePath}.icns`)).toBe(true);
  });
});
