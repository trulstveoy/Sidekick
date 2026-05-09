import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runCli } from 'repomix';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../..');
const fixtureDir = path.join(repoRoot, 'tests/fixtures/project-folder-basic');
const outputDir = path.join(repoRoot, 'tmp/repomix-spike');

const runs = [
  {
    name: 'fixture-markdown',
    style: 'markdown',
    compress: false,
  },
  {
    name: 'fixture-xml',
    style: 'xml',
    compress: false,
  },
  {
    name: 'fixture-markdown-compressed',
    style: 'markdown',
    compress: true,
  },
];

const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readPreview = async (filePath) => {
  const content = await readFile(filePath, 'utf8');

  return content.slice(0, 800);
};

const runRepomix = async ({ name, style, compress }) => {
  const outputPath = path.join(outputDir, `${name}.${style === 'xml' ? 'xml' : 'md'}`);
  const startedAt = performance.now();
  const result = await runCli(['.'], fixtureDir, {
    output: outputPath,
    style,
    compress,
    quiet: true,
    copy: false,
    securityCheck: true,
    gitignore: true,
    dotIgnore: true,
    defaultPatterns: true,
    ignore: 'dist/**',
  });

  if (!result || !('packResult' in result)) {
    throw new Error(`Repomix did not return a pack result for ${name}.`);
  }

  const outputStats = await stat(outputPath);
  const preview = await readPreview(outputPath);
  const packResult = result.packResult;

  return {
    name,
    style,
    compress,
    durationMs: Math.round(performance.now() - startedAt),
    outputPath: path.relative(repoRoot, outputPath),
    outputBytes: outputStats.size,
    outputSize: formatBytes(outputStats.size),
    totalFiles: packResult.totalFiles,
    totalCharacters: packResult.totalCharacters,
    totalTokens: packResult.totalTokens,
    gitDiffTokenCount: packResult.gitDiffTokenCount,
    gitLogTokenCount: packResult.gitLogTokenCount,
    processedFiles: packResult.processedFiles.map((file) => file.path).sort(),
    skippedFiles: packResult.skippedFiles.map((file) => ({
      path: file.path,
      reason: file.reason,
    })),
    suspiciousFiles: packResult.suspiciousFilesResults.map((result) => ({
      filePath: result.filePath,
      messages: result.messages,
    })),
    preview,
  };
};

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const summaries = [];

for (const run of runs) {
  summaries.push(await runRepomix(run));
}

const summaryPath = path.join(outputDir, 'summary.json');
await writeFile(`${summaryPath}`, `${JSON.stringify(summaries, null, 2)}\n`);

for (const summary of summaries) {
  console.log(
    [
      `${summary.name}:`,
      `${summary.totalFiles} files`,
      `${summary.totalTokens} tokens`,
      `${summary.outputSize}`,
      `${summary.durationMs}ms`,
    ].join(' '),
  );
}

console.log(`Summary written to ${path.relative(repoRoot, summaryPath)}`);
