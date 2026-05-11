import { describe, expect, it } from 'vitest';
import { createSquirrelConfig } from '../../forge.config';

describe('Windows signing Forge configuration', () => {
  it('keeps unsigned Windows packaging available when signing is not configured', () => {
    expect(createSquirrelConfig({}, 'win32')).toEqual({});
  });

  it('does not require Windows signing credentials on non-Windows package jobs', () => {
    expect(() => {
      createSquirrelConfig({ SIDEKICK_REQUIRE_WINDOWS_SIGNING: 'true' }, 'linux');
    }).not.toThrow();
  });

  it('fails clearly on Windows when signing is required without complete credentials', () => {
    expect(() => {
      createSquirrelConfig({ SIDEKICK_REQUIRE_WINDOWS_SIGNING: 'true' }, 'win32');
    }).toThrow(/SIDEKICK_SIGNING_PFX_PATH/);
  });

  it('fails clearly on Windows when signing is partially configured', () => {
    expect(() => {
      createSquirrelConfig({ SIDEKICK_SIGNING_PFX_PATH: 'C:\\certs\\sidekick.pfx' }, 'win32');
    }).toThrow(/SIDEKICK_SIGNING_PFX_PATH/);
  });

  it('passes certificate settings to Squirrel when signing is configured', () => {
    expect(
      createSquirrelConfig(
        {
          SIDEKICK_SIGNING_PFX_PATH: 'C:\\certs\\sidekick.pfx',
          SIDEKICK_SIGNING_PASSWORD: 'secret-password',
        },
        'win32',
      ),
    ).toEqual({
      signWithParams: '/fd SHA256 /f "C:\\certs\\sidekick.pfx" /p "secret-password"',
    });
  });

  it('adds timestamp parameters when a timestamp URL is configured', () => {
    expect(
      createSquirrelConfig(
        {
          SIDEKICK_SIGNING_PFX_PATH: 'C:\\certs\\sidekick.pfx',
          SIDEKICK_SIGNING_PASSWORD: 'secret-password',
          SIDEKICK_SIGNING_TIMESTAMP_URL: 'http://timestamp.example.test',
        },
        'win32',
      ).signWithParams,
    ).toBe('/fd SHA256 /f "C:\\certs\\sidekick.pfx" /p "secret-password" /tr http://timestamp.example.test /td SHA256');
  });
});
