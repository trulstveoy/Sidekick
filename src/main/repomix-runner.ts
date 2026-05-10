import path from 'node:path';
import { lintSource } from '@secretlint/core';
import { creator } from '@secretlint/secretlint-rule-preset-recommend';
import {
  buildCliConfig,
  mergeConfigs,
  pack,
  setLogLevel,
  TokenCounter,
  type CliOptions,
  type PackResult,
  type RepomixProgressCallback,
  type SuspiciousFileResult,
} from 'repomix';

export interface RepomixContextPackageOptions {
  rootPath: string;
  outputPath: string;
  ignorePatterns: string[];
}

export interface RepomixContextPackageResult {
  packResult: PackResult;
  config: ReturnType<typeof mergeConfigs>;
}

const SECURITY_CHECK_BATCH_SIZE = 50;
const REPOMIX_SILENT_LOG_LEVEL = -1;

type TokenEncoding = ConstructorParameters<typeof TokenCounter>[0];

interface RepomixRawFile {
  path: string;
  content: string;
}

interface GitDiffResult {
  workTreeDiffContent?: string;
  stagedDiffContent?: string;
}

interface GitLogResult {
  logContent?: string;
}

type SecurityCheckType = 'file' | 'gitDiff' | 'gitLog';

interface SecurityCheckItem {
  filePath: string;
  content: string;
  type: SecurityCheckType;
}

interface TokenCountTask {
  content: string;
  encoding: TokenEncoding;
  path?: string;
}

interface TokenCountBatchTask {
  items: Array<{
    content: string;
    path?: string;
  }>;
  encoding: TokenEncoding;
}

type MetricsWorkerTask = TokenCountTask | TokenCountBatchTask;
type MetricsWorkerResult = number | number[];

const createInProcessMetricsTaskRunner = (
  _numOfTasks: number,
  encoding: TokenEncoding,
): {
  taskRunner: {
    run: (task: MetricsWorkerTask) => Promise<MetricsWorkerResult>;
    cleanup: () => Promise<void>;
  };
  warmupPromise: Promise<unknown>;
} => {
  const tokenCounterPromises = new Map<TokenEncoding, Promise<TokenCounter>>();

  const getTokenCounter = (tokenEncoding: TokenEncoding) => {
    const cachedCounter = tokenCounterPromises.get(tokenEncoding);

    if (cachedCounter) {
      return cachedCounter;
    }

    const counterPromise = (async () => {
      const counter = new TokenCounter(tokenEncoding);
      await counter.init();
      return counter;
    })();

    tokenCounterPromises.set(tokenEncoding, counterPromise);
    return counterPromise;
  };

  const countTokenTask = async (task: MetricsWorkerTask): Promise<MetricsWorkerResult> => {
    const counter = await getTokenCounter(task.encoding);

    if ('items' in task) {
      return task.items.map((item) => counter.countTokens(item.content, item.path));
    }

    return counter.countTokens(task.content, task.path);
  };

  const taskRunner = {
    run: countTokenTask,
    cleanup: async () => {
      tokenCounterPromises.clear();
    },
  };

  return {
    taskRunner,
    warmupPromise: getTokenCounter(encoding),
  };
};

const getSecurityCheckItems = (
  rawFiles: RepomixRawFile[],
  gitDiffResult?: GitDiffResult,
  gitLogResult?: GitLogResult,
): SecurityCheckItem[] => {
  const gitDiffItems: SecurityCheckItem[] = [];
  const gitLogItems: SecurityCheckItem[] = [];

  if (gitDiffResult?.workTreeDiffContent) {
    gitDiffItems.push({
      filePath: 'Working tree changes',
      content: gitDiffResult.workTreeDiffContent,
      type: 'gitDiff',
    });
  }

  if (gitDiffResult?.stagedDiffContent) {
    gitDiffItems.push({
      filePath: 'Staged changes',
      content: gitDiffResult.stagedDiffContent,
      type: 'gitDiff',
    });
  }

  if (gitLogResult?.logContent) {
    gitLogItems.push({
      filePath: 'Git log history',
      content: gitLogResult.logContent,
      type: 'gitLog',
    });
  }

  const fileItems: SecurityCheckItem[] = rawFiles.map((file) => ({
    filePath: file.path,
    content: file.content,
    type: 'file',
  }));

  return [...fileItems, ...gitDiffItems, ...gitLogItems];
};

const isSuspiciousFileResult = (
  result: SuspiciousFileResult | null,
): result is SuspiciousFileResult => result !== null;

const runSecurityCheckInProcess = async (
  rawFiles: RepomixRawFile[],
  progressCallback: RepomixProgressCallback = () => undefined,
  gitDiffResult?: GitDiffResult,
  gitLogResult?: GitLogResult,
): Promise<SuspiciousFileResult[]> => {
  const items = getSecurityCheckItems(rawFiles, gitDiffResult, gitLogResult);
  const secretLintConfig = {
    rules: [
      {
        id: '@secretlint/secretlint-rule-preset-recommend',
        rule: creator,
      },
    ],
  };
  const results: SuspiciousFileResult[] = [];

  for (let index = 0; index < items.length; index += SECURITY_CHECK_BATCH_SIZE) {
    const batch = items.slice(index, index + SECURITY_CHECK_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (item): Promise<SuspiciousFileResult | null> => {
        const result = await lintSource({
          source: {
            filePath: item.filePath,
            content: item.content,
            ext: item.filePath.split('.').pop() || '',
            contentType: 'text',
          },
          options: {
            config: secretLintConfig,
          },
        });

        if (result.messages.length === 0) {
          return null;
        }

        return {
          filePath: item.filePath,
          messages: result.messages.map((message) => message.message),
          type: item.type,
        };
      }),
    );

    results.push(...batchResults.filter(isSuspiciousFileResult));

    const completedItems = Math.min(index + batch.length, items.length);
    const lastItem = batch[batch.length - 1];
    progressCallback(`Running security check... (${completedItems}/${items.length}) ${lastItem.filePath}`);
  }

  return results;
};

const validateFileSafetyInProcess = async (
  rawFiles: RepomixRawFile[],
  progressCallback: RepomixProgressCallback,
  config: ReturnType<typeof mergeConfigs>,
  gitDiffResult?: GitDiffResult,
  gitLogResult?: GitLogResult,
) => {
  let suspiciousFilesResults: SuspiciousFileResult[] = [];
  let suspiciousGitDiffResults: SuspiciousFileResult[] = [];
  let suspiciousGitLogResults: SuspiciousFileResult[] = [];

  if (config.security.enableSecurityCheck) {
    progressCallback('Running security check...');
    const allResults = await runSecurityCheckInProcess(
      rawFiles,
      progressCallback,
      gitDiffResult,
      gitLogResult,
    );

    suspiciousFilesResults = allResults.filter((result) => result.type === 'file');
    suspiciousGitDiffResults = allResults.filter((result) => result.type === 'gitDiff');
    suspiciousGitLogResults = allResults.filter((result) => result.type === 'gitLog');
  }

  const suspiciousFilePaths = new Set(suspiciousFilesResults.map((result) => result.filePath));
  const safeRawFiles = rawFiles.filter((file) => !suspiciousFilePaths.has(file.path));

  return {
    safeRawFiles,
    safeFilePaths: safeRawFiles.map((file) => file.path),
    suspiciousFilesResults,
    suspiciousGitDiffResults,
    suspiciousGitLogResults,
  };
};

export const runRepomixContextPackage = async ({
  rootPath,
  outputPath,
  ignorePatterns,
}: RepomixContextPackageOptions): Promise<RepomixContextPackageResult> => {
  setLogLevel(REPOMIX_SILENT_LOG_LEVEL);

  const cliOptions: CliOptions = {
    output: outputPath,
    style: 'markdown',
    compress: false,
    quiet: true,
    copy: false,
    securityCheck: true,
    gitignore: true,
    dotIgnore: true,
    defaultPatterns: true,
    ignore: ignorePatterns.join(','),
  };
  const config = mergeConfigs(rootPath, {}, buildCliConfig(cliOptions));
  const packResult = await pack([path.resolve(rootPath)], config, () => undefined, {
    createMetricsTaskRunner: createInProcessMetricsTaskRunner,
    validateFileSafety: validateFileSafetyInProcess,
  });

  return {
    packResult,
    config,
  };
};
