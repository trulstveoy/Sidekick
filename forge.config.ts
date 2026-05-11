import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel, type MakerSquirrelConfig } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const isTrue = (value: string | undefined): boolean => value?.toLowerCase() === 'true';

type SigningEnvironment = Partial<Record<
  | 'SIDEKICK_REQUIRE_WINDOWS_SIGNING'
  | 'SIDEKICK_SIGNING_PFX_PATH'
  | 'SIDEKICK_SIGNING_PASSWORD'
  | 'SIDEKICK_SIGNING_TIMESTAMP_URL',
  string
>>;

export const createSquirrelConfig = (
  environment: SigningEnvironment = process.env,
  platform: NodeJS.Platform = process.platform,
): MakerSquirrelConfig => {
  const requireSigning = isTrue(environment.SIDEKICK_REQUIRE_WINDOWS_SIGNING);
  const certificateFile = environment.SIDEKICK_SIGNING_PFX_PATH;
  const certificatePassword = environment.SIDEKICK_SIGNING_PASSWORD;
  const timestampUrl = environment.SIDEKICK_SIGNING_TIMESTAMP_URL;
  const hasCompleteSigningConfig = Boolean(certificateFile && certificatePassword);
  const hasPartialSigningConfig = Boolean(certificateFile || certificatePassword);

  if (platform === 'win32' && (requireSigning || hasPartialSigningConfig) && !hasCompleteSigningConfig) {
    throw new Error(
      'Windows signing is enabled but SIDEKICK_SIGNING_PFX_PATH and SIDEKICK_SIGNING_PASSWORD are not both set.',
    );
  }

  if (!hasCompleteSigningConfig) {
    return {};
  }

  const signWithParams = ['/fd', 'SHA256'];

  if (timestampUrl) {
    signWithParams.push('/tr', timestampUrl, '/td', 'SHA256');
  }

  return {
    certificateFile,
    certificatePassword,
    signWithParams: signWithParams.join(' '),
  };
};

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: 'sidekick',
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel(createSquirrelConfig()),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  plugins: [
    new VitePlugin({
      // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
      // If you are familiar with Vite configuration, it will look really familiar.
      build: [
        {
          // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
