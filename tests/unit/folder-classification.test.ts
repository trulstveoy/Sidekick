import { describe, expect, it } from 'vitest';
import { classifyArtifact, getFileContextHints, getFolderSignals } from '../../src/main/folder-scanner';

describe('folder classification', () => {
  it('classifies common work artifacts by extension', () => {
    expect(classifyArtifact('brief.pdf')).toBe('pdf');
    expect(classifyArtifact('architecture.pptx')).toBe('presentation');
    expect(classifyArtifact('diagram.drawio')).toBe('drawio');
    expect(classifyArtifact('diagram.drawio.svg')).toBe('drawio');
    expect(classifyArtifact('interview.docx')).toBe('transcript');
    expect(classifyArtifact('notes.md')).toBe('note');
  });

  it('extracts folder signals from Norwegian and English folder names', () => {
    expect(getFolderSignals('01-bakgrunn')).toContain('background');
    expect(getFolderSignals('02-transkripsjoner')).toContain('transcript');
    expect(getFolderSignals('03-informasjonsmodell')).toContain('information-model');
    expect(getFolderSignals('04-arkitektur')).toContain('architecture');
  });

  it('adds file-level context hints without replacing the primary type', () => {
    expect(getFileContextHints('begrepsmodell.drawio', [])).toContain('information-model');
    expect(getFileContextHints('systemskisse.drawio', ['architecture'])).toContain('architecture');
  });
});
