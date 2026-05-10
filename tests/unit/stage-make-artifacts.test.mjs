import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isDistributableArtifact,
  stageMakeArtifacts,
} from '../../scripts/ci/stage-make-artifacts.mjs';

const temporaryRoots = [];

const createTemporaryRoot = async () => {
  const rootPath = await mkdtemp(path.join(os.tmpdir(), 'sidekick-stage-artifacts-'));
  temporaryRoots.push(rootPath);

  return rootPath;
};

const writeFixtureFile = async (rootPath, relativePath, content = relativePath) => {
  const filePath = path.join(rootPath, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);

  return filePath;
};

describe('stage make artifacts script', () => {
  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((rootPath) =>
        rm(rootPath, { recursive: true, force: true }),
      ),
    );
  });

  it('recognizes distributable artifact files', () => {
    expect(isDistributableArtifact('out/make/deb/x64/sidekick.deb')).toBe(true);
    expect(isDistributableArtifact('out/make/rpm/x64/sidekick.rpm')).toBe(true);
    expect(isDistributableArtifact('out/make/squirrel.windows/x64/Setup.exe')).toBe(true);
    expect(isDistributableArtifact('out/make/squirrel.windows/x64/sidekick.nupkg')).toBe(true);
    expect(isDistributableArtifact('out/make/squirrel.windows/x64/RELEASES')).toBe(true);
    expect(isDistributableArtifact('out/make/debug.log')).toBe(false);
  });

  it('stages only distributable files into a platform directory', async () => {
    const rootPath = await createTemporaryRoot();
    const sourceDirectory = path.join(rootPath, 'out', 'make');
    const targetRoot = path.join(rootPath, 'staged-artifacts');

    await writeFixtureFile(rootPath, 'out/make/deb/x64/sidekick.deb', 'deb');
    await writeFixtureFile(rootPath, 'out/make/rpm/x64/sidekick.rpm', 'rpm');
    await writeFixtureFile(rootPath, 'out/make/squirrel.windows/x64/Setup.exe', 'exe');
    await writeFixtureFile(rootPath, 'out/make/squirrel.windows/x64/RELEASES', 'releases');
    await writeFixtureFile(rootPath, 'out/make/debug.log', 'ignore');

    const stagedFiles = await stageMakeArtifacts({
      sourceDirectory,
      targetRoot,
      platform: 'linux',
    });
    const stagedFileNames = stagedFiles.map((filePath) => path.basename(filePath)).sort();

    expect(stagedFileNames).toEqual(['RELEASES', 'Setup.exe', 'sidekick.deb', 'sidekick.rpm']);
    await expect(readFile(path.join(targetRoot, 'linux', 'debug.log'))).rejects.toThrow();
  });

  it('fails when no distributable files are found', async () => {
    const rootPath = await createTemporaryRoot();
    const sourceDirectory = path.join(rootPath, 'out', 'make');

    await writeFixtureFile(rootPath, 'out/make/debug.log', 'ignore');

    await expect(
      stageMakeArtifacts({
        sourceDirectory,
        targetRoot: path.join(rootPath, 'staged-artifacts'),
        platform: 'linux',
      }),
    ).rejects.toThrow(/No distributable artifacts/);
  });
});
