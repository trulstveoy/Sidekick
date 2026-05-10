#!/usr/bin/env node
import { copyFile, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

const DISTRIBUTABLE_EXTENSIONS = new Set(['.deb', '.rpm', '.exe', '.nupkg', '.zip']);
const DISTRIBUTABLE_FILENAMES = new Set(['RELEASES']);

export const isDistributableArtifact = (filePath) => {
  const fileName = path.basename(filePath);

  return (
    DISTRIBUTABLE_FILENAMES.has(fileName) ||
    DISTRIBUTABLE_EXTENSIONS.has(path.extname(fileName).toLowerCase())
  );
};

const walkFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await walkFiles(entryPath)));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
};

const getUniqueDestinationPath = (targetDirectory, filePath, usedFileNames) => {
  const fileName = path.basename(filePath);

  if (!usedFileNames.has(fileName)) {
    usedFileNames.add(fileName);
    return path.join(targetDirectory, fileName);
  }

  const parsed = path.parse(fileName);
  let index = 2;
  let candidate = `${parsed.name}-${index}${parsed.ext}`;

  while (usedFileNames.has(candidate)) {
    index += 1;
    candidate = `${parsed.name}-${index}${parsed.ext}`;
  }

  usedFileNames.add(candidate);
  return path.join(targetDirectory, candidate);
};

export const stageMakeArtifacts = async ({ sourceDirectory, targetRoot, platform }) => {
  if (!platform) {
    throw new Error('A platform name is required.');
  }

  const resolvedSourceDirectory = path.resolve(sourceDirectory);
  const targetDirectory = path.resolve(targetRoot, platform);
  const sourceFiles = await walkFiles(resolvedSourceDirectory);
  const distributableFiles = sourceFiles.filter(isDistributableArtifact).sort();

  if (distributableFiles.length === 0) {
    throw new Error(`No distributable artifacts found in ${resolvedSourceDirectory}.`);
  }

  await rm(targetDirectory, { recursive: true, force: true });
  await mkdir(targetDirectory, { recursive: true });

  const usedFileNames = new Set();
  const stagedFiles = [];

  for (const filePath of distributableFiles) {
    const targetPath = getUniqueDestinationPath(targetDirectory, filePath, usedFileNames);
    await copyFile(filePath, targetPath);
    stagedFiles.push(targetPath);
  }

  return stagedFiles;
};

const runCli = async () => {
  const { values } = parseArgs({
    options: {
      platform: { type: 'string' },
      source: { type: 'string', default: 'out/make' },
      target: { type: 'string', default: 'staged-artifacts' },
    },
  });

  const stagedFiles = await stageMakeArtifacts({
    sourceDirectory: values.source,
    targetRoot: values.target,
    platform: values.platform,
  });

  for (const filePath of stagedFiles) {
    console.log(filePath);
  }
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
