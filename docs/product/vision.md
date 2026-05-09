# Sidekick Product Vision

Status: Draft

Sidekick helps you understand and organize local project folders by inspecting their structure, classifying artifacts, and surfacing useful project-level summaries.

## What Sidekick Is

Sidekick is a local-first desktop application for working with project folders.

Each folder can represent a project or work area. Sidekick helps make that folder understandable by showing its structure, identifying artifact types, counting relevant files, and surfacing useful project-level signals.

## What Sidekick Is Not

- Not primarily a software development tool.
- Not primarily a Markdown editor.
- Not primarily an agent orchestration platform.
- Not a cloud-first knowledge base.

## Core Idea

Sidekick starts with folder understanding.

It should help answer questions like:

- What exists in this project folder?
- What kinds of artifacts are present?
- How many likely transcripts, notes, PDFs, media files, or exports are there?
- What has changed recently?
- Which files appear unclassified, duplicated, or poorly organized?
- What project-level summary can be produced from the folder?

## Early Product Direction

The first useful version should focus on:

- selecting a local root folder;
- listing project folders;
- inspecting a selected project folder;
- showing folder structure and artifact counts;
- classifying artifacts using file metadata, names, and extensions;
- surfacing simple project-level summaries;
- avoiding destructive file operations by default.

## Agent Role

Agentic functionality is a helper layer, not the primary product identity.

The agent may later assist with reading, summarizing, merging, annotating, renaming, or restructuring files, but changes to local files should be explicit, reviewable, and approved before execution.
