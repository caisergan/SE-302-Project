import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'fs';
import path from 'path';

const config: ForgeConfig = {
  packagerConfig: {
    icon: './src/assets/logo',
    asar: {
      unpack: '**/node_modules/better-sqlite3/**',
    },
  },
  hooks: {
    packageAfterCopy: async (config, buildPath) => {
      const modules = ['better-sqlite3', 'bindings', 'file-uri-to-path'];
      for (const module of modules) {
        const src = path.join(__dirname, 'node_modules', module);
        const dest = path.join(buildPath, 'node_modules', module);
        if (!fs.existsSync(path.join(buildPath, 'node_modules'))) {
          fs.mkdirSync(path.join(buildPath, 'node_modules'));
        }
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true });
          console.log(`Copied ${module} to build path`);
        } else {
          console.warn(`Could not find ${module} to copy`);
        }
      }
    },
  },
  rebuildConfig: {},
  makers: [
    // Windows EXE Installer
    new MakerSquirrel({
      name: 'SchedulR',
      authors: 'Team5',
      description: 'Desktop application for automated exam scheduling',
      setupExe: 'SchedulR-Setup.exe',
    }),
    // macOS DMG Installer
    new MakerDMG({
      name: 'SchedulR',
    }),
    // macOS ZIP (fallback)
    new MakerZIP({}, ['darwin']),
    // Linux RPM
    new MakerRpm({}),
    // Linux DEB
    new MakerDeb({}),
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
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
          config: 'vite.renderer.config.mts',
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
      [FuseV1Options.OnlyLoadAppFromAsar]: false,
    }),
  ],
};

export default config;
