#!/usr/bin/env node

import { spawn } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmCi = spawn(npmCommand, ['ci'], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

const recentLines = [];

function remember(chunk, stream) {
  const text = chunk.toString();
  stream.write(text);

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    recentLines.push(line);
    if (recentLines.length > 40) {
      recentLines.shift();
    }
  }
}

function annotationEscape(value) {
  return value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A');
}

npmCi.stdout.on('data', (chunk) => remember(chunk, process.stdout));
npmCi.stderr.on('data', (chunk) => remember(chunk, process.stderr));

npmCi.on('close', (code) => {
  if (code === 0) {
    process.exit(0);
  }

  const lines = recentLines.length > 0 ? recentLines : [`npm ci exited with code ${code}`];
  for (const line of lines) {
    console.error(`::error title=npm ci failed::${annotationEscape(line)}`);
  }

  process.exit(code ?? 1);
});
