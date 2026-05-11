import { describe, expect, it } from 'vitest';
import {
  buildCodexExecArgs,
  buildCodexLoginArgs,
  parseCodexJsonLine,
} from '../../src/main/codex-runner';

describe('codex runner helpers', () => {
  it('builds read-only exec args without placing the prompt in argv', () => {
    const args = buildCodexExecArgs('/tmp/project', 'read-only');

    expect(args).toEqual([
      'exec',
      '--json',
      '--ephemeral',
      '--skip-git-repo-check',
      '--cd',
      '/tmp/project',
      '--sandbox',
      'read-only',
      '-',
    ]);
    expect(args).not.toContain('summarize this folder');
  });

  it('builds workspace-write exec args', () => {
    const args = buildCodexExecArgs('/tmp/project', 'workspace-write');

    expect(args).toContain('workspace-write');
    expect(args).not.toContain('danger-full-access');
    expect(args).not.toContain('--dangerously-bypass-approvals-and-sandbox');
  });

  it('builds device-auth login args', () => {
    expect(buildCodexLoginArgs()).toEqual(['login', '--device-auth']);
  });

  it('parses JSONL output and tolerates raw text', () => {
    expect(parseCodexJsonLine('{"type":"message","text":"hello"}')).toEqual({
      type: 'message',
      text: 'hello',
    });
    expect(parseCodexJsonLine('plain output')).toBeUndefined();
    expect(parseCodexJsonLine('{not-json')).toBeUndefined();
  });
});
