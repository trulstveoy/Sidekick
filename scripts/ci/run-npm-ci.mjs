#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const diagnostics = [
  `cwd: ${process.cwd()}`,
  `package.json exists: ${existsSync('package.json')}`,
  `package-lock.json exists: ${existsSync('package-lock.json')}`,
  `npm command: ${npmCommand} ci`,
];

for (const line of diagnostics) {
  console.log(line);
}

const npmCi = spawn(npmCommand, ['ci'], {
  stdio: ['ignore', 'pipe', 'pipe'],
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

npmCi.on('close', (code) => {
  if (code === 0) {
    process.exit(0);
  }

  const outputLines =
    capturedLines.length > 100
      ? [...capturedLines.slice(0, 30), '... output truncated ...', ...capturedLines.slice(-70)]
      : capturedLines;
  const lines = outputLines.length > 0 ? outputLines : [`npm ci exited with code ${code}`];
  const message = [...diagnostics, ...lines].join('\n');

  for (const chunk of message.match(/[\s\S]{1,3500}/g) ?? [message]) {
    console.error(`::error title=npm ci failed::${annotationEscape(chunk)}`);
  }

  process.exit(code ?? 1);
});
