# Consultant Brief: Sidekick GUI Refresh

Status: draft for external design consultant  
Audience: design consultant preparing a proposed delivery for Sidekick  
Purpose: provide enough product and workflow context to propose a GUI refresh without copying the current UI

## Important Framing

This brief describes what Sidekick is, what it enables, and what constraints the design must respect. It intentionally does not describe the current UI layout, screen composition, or visual treatment. The goal is not to polish the existing interface, but to define a clearer, calmer, and more capable desktop experience for the same product.

In the first step, the consultant should propose the delivery they intend to produce. We will review and comment on that proposed delivery before detailed design work starts.

## Product Purpose

Sidekick is a secure, local-first Electron desktop application for structuring knowledge work that lives in local project folders.

The application helps a user understand, organize, and work with a project folder that contains notes, transcripts, Markdown files, documents, diagrams, exports, and other project artifacts. It is not primarily a software development tool. It is a work-surface for managing project material on disk.

The product should help the user answer questions such as:

- What exists in this project folder?
- Which subfolders contain which kinds of material?
- How many transcripts, notes, documents, diagrams, and other artifacts are present?
- What changed recently?
- What looks incomplete, unclassified, duplicated, or poorly organized?
- How can a new transcript be added without breaking the existing folder convention?
- How can the project material be assembled into a context package for use with an AI assistant?
- How can a controlled AI assistant operation be run against this project folder without exposing a general shell or unsafe filesystem access?

## Product Positioning

Sidekick should feel like a focused desktop workspace for serious project work.

It is:

- local-first
- file-oriented
- project-folder oriented
- privacy-conscious
- explicit about write actions
- designed for repeated daily use
- capable of supporting agent-assisted workflows

It is not:

- a cloud knowledge base
- a generic Markdown editor
- a generic file manager
- a generic terminal
- a marketing website
- a chat-first AI product
- an IDE clone

AI functionality is a helper layer, not the identity of the product. The core product is still the user's project folder and the structure of the material inside it.

## Users and Work Context

The primary user is an individual knowledge worker who keeps project material in local folders. A project can contain meeting transcripts, research notes, background material, information models, architecture notes, diagrams, PowerPoint files, Markdown files, plain text files, and other artifacts.

The user wants the application to reduce friction in keeping this material structured. The application should support inspection, classification, importing, packaging, and controlled AI assistance, while preserving trust in the local files.

The user may have many projects, each represented as a folder. The folder names and subfolder names often carry meaning. For example, a project may contain separate folders for assumptions, background information, transcriptions, information models, architecture, diagrams, or other thematic groupings.

## Core Domain Concepts

### Project Folder

A project folder is the local root folder selected by the user. It represents one work project or work area. Sidekick treats this folder as the boundary for inspection and project-level operations.

### Project Structure

Project folders are usually organized through subfolders. The subfolder names are meaningful and often describe the type of content inside them.

Sidekick can also create a new project folder using a minimal default structure:

- `00. Forutsetninger`
- `01. Transkripsjoner`

The design should support both newly created projects and existing folders with user-defined structures.

### Artifacts

Artifacts are files inside the project folder. They may include Markdown files, text files, transcripts, PDFs, Office documents, diagrams, exports, images, and other material.

Sidekick should not assume that every meaningful artifact is Markdown. Markdown is common, but the product must remain useful for mixed project material.

### Folder Signals

Folder signals are inferred meanings from folder names and contents. For example, a folder may appear to contain transcriptions, background material, architecture information, or models based on naming patterns and file types.

Folder signals are heuristic. They should support understanding, not create hidden rules the user cannot inspect.

### Transcription Folder

A transcription folder is the single folder in a project that contains transcripts. Sidekick assumes there is exactly one transcription folder when importing a new transcript.

Imported transcript files are copied into the transcription folder. They are not moved from the source location.

### Context Package

A context package is a generated Markdown file that combines the project folder content into a single file. It is used to give an AI assistant project context.

The generated file is written to the root of the selected project folder. Its filename is based on the project folder name and identifies it as a context package.

The context package must ignore itself if it already exists, so repeated generation does not recursively include the previous package.

### Controlled Codex Operation

Sidekick can run controlled Codex operations against the selected project folder. This is not a general-purpose terminal. It is a constrained assistant operation where the application manages the working directory, mode, execution, streaming output, completion state, cancellation, and refresh behavior.

## Current Functional Capabilities

This section describes what the application can do today in functional terms. It does not describe current UI layout.

### Choose an Existing Project Folder

The user can choose a local folder from disk. Sidekick treats the chosen folder as the active project root for subsequent operations.

When a folder is selected, Sidekick scans it read-only and returns structured information about the project. The scan can include:

- project path
- folder structure
- file and folder counts
- artifact type counts
- inferred folder signals
- recent files
- warnings
- whether the scan was partial due to limits

### Create a New Project Folder

The user can create a new project folder under a selected parent folder.

Sidekick creates the folder and the initial required subfolders:

- `00. Forutsetninger`
- `01. Transkripsjoner`

If a folder with the requested project name already exists, Sidekick reports an error instead of overwriting it.

After successful creation, the new project can be selected and scanned.

### Inspect Project Contents

Sidekick can present information derived from the selected project folder, including:

- folder hierarchy
- artifact types
- counts per type
- meaningful folder groupings
- recently changed files
- warnings or scan limitations

The design should help the user understand the project at several levels:

- project overview
- folder-level understanding
- file-level understanding
- warning and exception awareness
- recent activity

### Import a Transcript

The user can add a transcript file produced by another tool. These files are usually located elsewhere on disk, often in the downloads folder.

Supported input formats are:

- `.txt`
- `.md`
- `.markdown`

Sidekick finds the project's single transcription folder and copies the selected transcript into it.

The transcript is added at the end of the existing numbered sequence. Current numbering uses a strict two-digit prefix:

- `00. first-transcript.md`
- `01. second-transcript.md`
- `02. third-transcript.md`

Sidekick preserves the original filename after the generated numeric prefix. If the source filename already has a numeric prefix, Sidekick removes that source prefix before applying the project sequence prefix.

Conflicts are handled automatically by trying the next available number. Sidekick does not overwrite existing transcript files.

After a successful import, Sidekick rescans the project folder so the project information reflects the new file.

### Preview Context Package Generation

Before generating a context package, Sidekick can show a preview of the intended operation. The preview can include:

- output filename
- output location
- whether an existing output file will be replaced
- warnings
- whether the selected project root is valid

The preview should help the user understand what will happen before a write operation occurs.

### Generate Context Package

Sidekick can generate a context package for the selected project folder using Repomix output structure.

The generated package:

- is Markdown
- is written to the root of the selected project folder
- uses a filename based on the project folder name
- excludes the generated context package file itself
- uses Repomix security checks
- reports summary information after generation

Generation can report information such as:

- output path
- included file count
- skipped file count
- token count
- character count
- output size
- skipped files
- warnings

### Controlled Codex Assistance

Sidekick can use the Codex CLI as a controlled assistant against the selected project folder.

Functional capabilities include:

- checking whether Codex is available
- checking whether the user is logged in
- starting login when needed
- running a user-provided prompt against the selected project folder
- supporting a read-only mode
- supporting an edit mode with controlled write access to the project folder
- streaming assistant output back to the application
- cancelling an active run
- reporting completion, failure, or cancellation
- rescanning the project after completed edit-mode operations

Important boundary: this is not a generic shell. The product should not expose arbitrary command execution as the main interaction model.

## Safety and Trust Constraints

Sidekick is a desktop application with access to local files. The design must reinforce user trust.

Important constraints:

- Read-only inspection should be clearly different from write actions.
- Write actions should be explicit and understandable before they happen.
- The user should be able to see what folder an operation applies to.
- The user should be able to see where generated or copied files will be placed.
- The product should avoid destructive defaults.
- The product should not hide important filesystem changes behind vague language.
- Error states should be understandable and actionable.
- AI-assisted operations should make scope and mode visible.
- The design should avoid implying cloud upload unless a future feature actually does that.

## Technical Boundaries the Design Must Respect

Sidekick is built with Electron. The application intentionally separates privileged desktop capabilities from the renderer experience.

Design consequences:

- Filesystem operations are mediated by the application, not by arbitrary renderer access.
- Native folder and file selection is used for local filesystem access.
- The renderer should not require direct raw filesystem, shell, process, or IPC access.
- External navigation must be explicit and controlled.
- Operations that affect disk should have clear intent, confirmation, or preview depending on risk.

The design does not need to specify Electron implementation details, but it should not depend on unsafe interaction models such as an unrestricted embedded terminal or invisible background file mutation.

## Desired Design Direction

We want a minimalist, quiet, professional desktop UI.

The current product has too much visual noise. The refresh should make the application feel calmer and more purposeful without making it sparse or decorative.

Desired qualities:

- clear information hierarchy
- fast project comprehension
- compact but readable density
- strong support for folder structure and artifact metadata
- restrained use of color
- minimal decoration
- visible but non-intrusive status feedback
- predictable desktop interaction patterns
- good keyboard and pointer ergonomics
- accessible contrast and focus states
- clear distinction between inspect, preview, generate, import, and AI-assisted edit operations

Avoid:

- marketing-style hero sections
- decorative gradients
- oversized promotional copy
- ornamental cards
- vague AI branding
- chat-first framing
- hidden destructive actions
- reproducing the current UI structure by default

## Requested Consultant Delivery

The consultant should first propose the delivery they intend to create. This first proposal should be reviewed by us before detailed design work starts.

The proposal should describe:

- intended design artifacts
- intended fidelity level for each artifact
- design process
- assumptions
- information needed from us
- review points
- expected sequence of work
- how implementation tasks will be specified
- what will be considered out of scope

After that proposal is accepted or adjusted, the full delivery should include the artifacts needed to implement the GUI refresh confidently.

## Expected Final Design Package

The consultant is the design expert, so the exact package may be adjusted in the first delivery proposal. As a baseline, we expect the final design package to cover the following.

### Product and UX Framing

Describe the intended user experience in product terms:

- what the application should feel like to use
- what the primary work modes are
- what information should be prominent
- what actions should feel primary, secondary, or rare
- how trust and local-first behavior should be communicated through interaction

### Information Architecture

Define how the application's functional areas should be organized conceptually.

This should include:

- how users enter or create a project context
- how project folder understanding is structured
- how artifact information is grouped
- how import, generation, and assistant operations fit into the application
- how warnings, errors, and activity states are surfaced

This should be a new IA proposal, not a restatement of the current UI.

### Workflow Designs

Define the user workflows for at least:

- starting without an active project
- choosing an existing project folder
- creating a new project folder
- understanding a scanned project
- exploring folder and artifact information
- importing a transcript
- previewing context package generation
- generating a context package
- checking Codex availability or login state
- running a read-only Codex operation
- running an edit-mode Codex operation
- cancelling a Codex operation
- understanding success, warning, and error states

### Screen and State Inventory

Provide an inventory of the screens, views, panels, dialogs, or states the design requires.

For each state, describe:

- purpose
- primary user task
- key information
- primary actions
- secondary actions
- empty state
- loading state
- error state
- success state
- edge cases

### Visual Design System

Define the visual language for the application.

This should include:

- color palette
- typography
- spacing scale
- density rules
- icon style
- borders and dividers
- elevation or shadow rules, if any
- focus states
- selection states
- disabled states
- warning and error treatment
- success and progress treatment
- use of motion, if any

The design system should be appropriate for a desktop productivity application, not a marketing interface.

### Component Guidance

Specify reusable interaction patterns and components needed by the app, such as:

- project selector or project entry pattern
- folder and artifact browser pattern
- metadata summaries
- action areas
- preview/confirmation pattern for write operations
- warning and error presentation
- progress and streaming output presentation
- file import pattern
- context package result pattern
- controlled assistant run pattern
- settings or status pattern for external tools such as Codex

The consultant should specify behavior and visual treatment, not implementation technology.

### Accessibility and Desktop Ergonomics

Provide guidance for:

- keyboard navigation
- focus order
- visible focus states
- contrast
- readable type sizes
- resize behavior
- high-density content
- reduced motion
- screen reader labels where relevant
- native desktop expectations
- menu, shortcut, and context-action recommendations if relevant

### Content and Terminology

Recommend product language and microcopy patterns.

This should include:

- names for key concepts
- action labels
- status language
- error language
- warning language
- confirmation language
- terminology for AI-assisted operations
- terminology for context package generation
- terminology for transcript import

The language should be precise and calm. It should not oversell AI capabilities.

### Implementation Handoff

Provide enough detail for us to implement the design without guessing.

The handoff should include:

- annotated designs
- design tokens or equivalent values
- component specifications
- interaction notes
- state descriptions
- acceptance criteria for each proposed implementation task
- design QA checklist
- open questions and assumptions

## How the Consultant Should Define Tasks

The consultant should define implementation tasks for us, but only at the specification level. We will write the implementation plans ourselves.

The consultant's task output should therefore answer:

- what should be changed from a user and design perspective
- why the change matters
- what user outcome is expected
- what states and flows are in scope
- what acceptance criteria prove the task is complete
- which design artifacts the task depends on

The consultant should not define:

- code-level architecture
- file paths to change
- implementation sequence
- library choices
- test commands
- internal Electron details
- detailed engineering plans

### Task Specification Format

Each proposed task should use this structure:

```markdown
# TASK: <short descriptive title>

## Problem

<What user or product problem this task solves.>

## Goal

<The intended outcome.>

## Scope

<What is included.>

## Non-goals

<What is intentionally excluded.>

## User Workflows

<The user flows or states this task must support.>

## Design Requirements

<Visual, interaction, content, accessibility, and state requirements.>

## Acceptance Criteria

- [ ] <Observable criterion>
- [ ] <Observable criterion>
- [ ] <Observable criterion>

## Dependencies

<Relevant design artifacts, prior tasks, or sequencing constraints.>

## Open Questions

<Questions that must be resolved before implementation planning.>
```

Acceptance criteria should be observable from the user experience. For example, they should describe what the user can see, understand, or do. They should not describe internal implementation steps.

If the GUI refresh is large, the consultant should split it into multiple tasks. Each task should be independently understandable and small enough for implementation planning.

## Suggested Task Areas

The consultant may propose different task boundaries, but the following areas are likely candidates:

- project entry and project creation experience
- project overview and folder understanding
- artifact and folder exploration
- transcript import workflow
- context package preview and generation workflow
- controlled Codex assistance workflow
- global status, warnings, and error handling
- visual design system and shared components
- accessibility and keyboard interaction
- empty, loading, success, and failure states

## Explicit Non-goals for the Consultant

The consultant should not:

- implement the GUI
- write code
- define engineering plans
- assume the current UI should be preserved
- produce only a visual reskin
- redesign Sidekick as a cloud product
- redesign Sidekick as a chat application
- redesign Sidekick as a generic terminal
- require unsafe filesystem or shell access
- remove the local-first trust model

## Questions We Want the Consultant to Answer First

Before starting detailed design, please propose the delivery you recommend.

Please answer:

- What design artifacts do you recommend producing?
- What fidelity should each artifact have?
- Which workflows should be designed first?
- How should the design be split into implementation tasks?
- What information do you need from us before starting?
- What should be reviewed after the first iteration?
- What should be considered out of scope?
- What format will the final handoff use?
- How will the handoff make implementation unambiguous?

## Available Reference Material

We can provide additional product and technical documentation if useful, including:

- product vision
- application architecture
- desktop design guidelines
- existing task records
- screenshots or a demo of the current app

Screenshots or a demo should be used to understand current capability, not as the target layout for the redesign.
