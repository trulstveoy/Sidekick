# 0004: Controlled Codex Panel

## Status

Accepted

## Context

Sidekick should help the user run Codex against the currently selected project folder. The user wants this as an integrated work panel, not as a general embedded shell.

This is security-sensitive because Codex can read project content, run for a long time, consume account quota, and in edit mode change local files. Sidekick project folders may also be ordinary note folders rather than Git repositories, so file changes may not be easy to review or revert.

## Decision

Use a controlled Codex panel backed by the Codex CLI.

The first version will:

- use `codex exec` in non-interactive mode;
- keep all process spawning in the Electron main process;
- expose only typed Codex-specific APIs through preload;
- run only against a project root selected through Sidekick;
- use read-only mode by default;
- require an explicit per-run edit-mode choice before using `--sandbox workspace-write`;
- pass prompts through stdin with `codex exec ... -`;
- stream stdout and stderr into the renderer as Sidekick events;
- support cancellation of the active Codex process;
- enforce one active Codex run at a time;
- refresh the folder scan only after a completed edit-mode run.

The first version will not expose:

- a general shell terminal;
- `xterm.js` or `node-pty`;
- arbitrary command execution;
- renderer-selected executables;
- renderer-selected working directories;
- `danger-full-access`;
- `--dangerously-bypass-approvals-and-sandbox`;
- autonomous background Codex actions.

Codex executable discovery is still owned by the main process. Sidekick may search PATH, common local Codex/npm command locations, and the `SIDEKICK_CODEX_PATH` environment variable. The renderer cannot choose an executable path.

## Consequences

The renderer remains inside the existing Electron security boundary. It can request Codex-specific operations, but it cannot spawn arbitrary commands or choose arbitrary filesystem locations.

The implementation depends on a locally installed Codex CLI. If Codex is missing, the app reports an unavailable state instead of failing startup. Packaged apps may not inherit the same PATH as a terminal, especially on Windows and macOS, so discovery includes common npm command locations and an optional `SIDEKICK_CODEX_PATH` override.

Edit-mode Codex runs can still change user files. Sidekick limits the working root to the selected project folder and refreshes the folder scan after successful edit-mode completion, but it does not provide a full diff viewer, rollback mechanism, or Git workflow in this version.
