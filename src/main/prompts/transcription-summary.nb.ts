export const buildTranscriptionSummaryPrompt = (transcriptionFileName: string, transcriptionText: string) => `
Du skal lage et kort, presist samtalesammendrag på norsk bokmål.

Kontekst:
- Filnavn: ${transcriptionFileName}
- Innholdet under er en transkripsjon importert til et Sidekick-prosjekt.

Krav:
- Svar kun med Markdown.
- Start med overskriften "## Conversation Summary".
- Skriv 1 kort avsnitt med hva samtalen handler om.
- Legg deretter til 3-7 punkt som oppsummerer de viktigste temaene, beslutningene eller åpne spørsmålene.
- Ikke legg til antagelser som ikke støttes av transkripsjonen.
- Ikke skriv innledning om at du er en AI-modell.

Transkripsjon:

${transcriptionText}
`.trim();
