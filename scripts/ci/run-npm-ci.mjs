#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const diagnostics = [
  `cwd: ${process.cwd()}`,
  `platform: ${process.platform}`,
  `package.json exists: ${existsSync('package.json')}`,
  `package-lock.json exists: ${existsSync('package-lock.json')}`,
  `npm command: ${npmCommand} ci`,
];

for (const line of diagnostics) {
  console.log(line);
}

const npmCi = spawn(npmCommand, ['ci'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  shell: process.platform === 'win32',
});

const capturedLines = [];

function remember(chunk, stream) {
  const text = chunk.toString();
  stream.write(text);

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    capturedLines.push(line);
    if (capturedLines.length > 200) {
      capturedLines.shift();
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

let finished = false;

function fail(code, extraLines = []) {
  if (finished) {
    return;
  }
  finished = true;

  const outputLines =
    capturedLines.length > 100
      ? [...capturedLines.slice(0, 30), '... output truncated ...', ...capturedLines.slice(-70)]
      : capturedLines;
  const lines =
    outputLines.length > 0 || extraLines.length > 0
      ? [...extraLines, ...outputLines]
      : [`npm ci exited with code ${code}`];
  const message = [...diagnostics, ...lines].join('\n');

  for (const chunk of message.match(/[\s\S]{1,3500}/g) ?? [message]) {
    console.error(`::error title=npm ci failed::${annotationEscape(chunk)}`);
  }

  process.exit(code ?? 1);
}

npmCi.on('error', (error) => {
  fail(1, [`failed to start npm ci: ${error.message}`]);
});

npmCi.on('close', (code) => {
  if (code === 0) {
    finished = true;
    process.exit(0);
  }

  fail(code);
});
