import { describe, expect, it } from 'vitest';
import {
  createTranscriptionDestination,
  detectNumberingConvention,
  isAllowedTranscriptionFile,
  stripLeadingNumberPrefix,
} from '../../src/main/transcription-importer';

describe('transcription importer helpers', () => {
  it('accepts text and markdown transcription files', () => {
    expect(isAllowedTranscriptionFile('/tmp/interview.txt')).toBe(true);
    expect(isAllowedTranscriptionFile('/tmp/interview.md')).toBe(true);
    expect(isAllowedTranscriptionFile('/tmp/interview.markdown')).toBe(true);
    expect(isAllowedTranscriptionFile('/tmp/interview.pdf')).toBe(false);
  });

  it('detects the next number and common separator from existing files', () => {
    const convention = detectNumberingConvention([
      '01 - first.md',
      '02 - second.md',
      'not-numbered.md',
    ]);

    expect(convention).toEqual({
      nextNumber: 3,
      width: 2,
      separator: ' - ',
      inferredFromExistingFiles: true,
    });
  });

  it('uses a default convention when no numbered files exist', () => {
    expect(detectNumberingConvention(['interview.md'])).toEqual({
      nextNumber: 1,
      width: 2,
      separator: '-',
      inferredFromExistingFiles: false,
    });
  });

  it('strips a leading source number before adding the project sequence', () => {
    expect(stripLeadingNumberPrefix('01 - downloaded transcript.md')).toBe(
      'downloaded transcript.md',
    );
    expect(stripLeadingNumberPrefix('01_downloaded transcript.md')).toBe(
      'downloaded transcript.md',
    );
    expect(stripLeadingNumberPrefix('downloaded transcript.md')).toBe(
      'downloaded transcript.md',
    );
  });

  it('creates a destination filename that continues numbering', () => {
    const destination = createTranscriptionDestination('new-transcription.md', [
      '001_existing.md',
    ]);

    expect(destination.destinationFileName).toBe('002_new-transcription.md');
    expect(destination.finalNumber).toBe(2);
    expect(destination.numbering.width).toBe(3);
    expect(destination.numbering.separator).toBe('_');
  });

  it('advances to the next available number when the generated name exists', () => {
    const destination = createTranscriptionDestination('new-transcription.md', [
      '01-existing.md',
      '02-new-transcription.md',
    ]);

    expect(destination.destinationFileName).toBe('03-new-transcription.md');
    expect(destination.finalNumber).toBe(3);
  });
});
