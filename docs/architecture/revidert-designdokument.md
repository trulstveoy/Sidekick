# Sidekick – Revidert navigasjonsmodell
Designdokument · Mai 2026

---

## Dette er endret fra v0.1.8

Dette dokumentet erstatter ikke fase 4-spesifikasjonene – det reviderer navigasjonsmodellen og rollefordelingen mellom panelene. De fire viktigste endringene:

| Endring | Tidligere (v0.1.8) | Nå |
|--------|--------------------|----|
| Arbeidsflyten skjer i | Høyre panel | Midtpanel (erstatter filtreet) |
| Høyre panel under en arbeidsflyt | Oppdateres med fremdrift og kontroller | Forblir uendret – viser kontekst |
| Handlinger er plassert | Spredt i handlingsbar og høyre panel, uten tydelig skille | Globale handlinger i handlingsbar, kontekstuelle handlinger i høyre panel |
| Mappespesifikk kontekstpakke | Ikke implementert | Kontekstuell handling i høyre panel når mappe er valgt – lagres i mappen |

Alt annet – topbar, filtre, handlingsbar, designtokens – følger eksisterende spesifikasjoner fra fase 4.

---

## Bakgrunn

Dette dokumentet beskriver en revidert navigasjons- og interaksjonsmodell for Sidekick, basert på gjennomgang av v0.1.8 og påfølgende diskusjon. Modellen er ikke en komplett redesign – den er en strukturell klargjøring som gjør det mulig å vokse uten at UI-et blir rotete.

---

## Overordnet layout

Applikasjonen er delt i tre horisontale soner og to vertikale soner:

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR                                                    [⚙]  │
├─────────────────────────────────────────────────┬───────────────┤
│                                                 │               │
│  MIDTPANEL                                      │  HØYRE PANEL  │
│  (filtre eller aktiv arbeidsflyt)               │  (kontekst)   │
│                                                 │               │
│                                                 │               │
│                                                 │               │
│                                                 │               │
├─────────────────────────────────────────────────┴───────────────┤
│  HANDLINGSBAR                                                    │
└─────────────────────────────────────────────────────────────────┘
```

Hver sone har ett ansvar og blander seg ikke inn i de andre.

---

## 1. Topbar

**Ansvar:** Identifisere appen og vise hvilken prosjektmappe som er aktiv.

```
┌─────────────────────────────────────────────────────────────────┐
│  ■ Sidekick    │    MyNewProject ▾    │                    [⚙]  │
└─────────────────────────────────────────────────────────────────┘
  ^                ^                                    ^
  Logo + navn      Aktiv mappe (klikkbar)               Innstillinger
```

- **Logo + navn** – alltid synlig, aldri klikkbar
- **Aktiv mappe** – viser mappenavnet. Klikk åpner en enkel liste over nylig brukte mapper + «Velg annen mappe…». Dette er den eneste måten å bytte prosjekt på.
- **Innstillinger** – tannhjulikon. Åpner innstillinger som et eget view i midtpanelet.

Topbaren endrer seg aldri under normale operasjoner. Den er et orienteringspunkt.

---

## 2. Midtpanel

**Ansvar:** Vise filtreet (standardtilstand) eller en aktiv arbeidsflyt (når bruker har startet en handling).

Midtpanelet har to tilstander:

### 2a. Standardtilstand – filtre

```
┌─────────────────────────────────────────────────┐
│  Mappe              Filer    Signal              │  ← kolonneoverskrifter
├─────────────────────────────────────────────────┤
│ ▶ MyNewProject/     1 fil                    →  │
│   ▶ 00. Forutsetninger/   Tom                →  │
│   ▾ 01. Transkripsjoner/  1 fil              →  │
│     00. Oppfølgingsmøte…  72 KB              →  │
├─────────────────────────────────────────────────┤
│                                                  │
│                                                  │
└─────────────────────────────────────────────────┘
```

Interaksjoner i filtreet:
- **▶/▾** – ekspanderer eller kollapser undermapper i treet
- **Klikk på navn** – velger elementet, høyre panel oppdateres
- **→** (synlig ved hover) – navigerer inn i mappen, midtpanelet skifter til drill-down

### 2b. Arbeidsflytstilstand

Når bruker starter en handling fra handlingsbaren eller høyre panel, **erstatter arbeidsflyt-visningen filtreet**. Filtreet er borte mens flyten pågår.

```
┌─────────────────────────────────────────────────┐
│ ← Tilbake    Generer kontekstpakke   ⚠ Skriveop.│  ← panel-header
├─────────────────────────────────────────────────┤
│                                                  │
│  Outputfil:   mynewproject.context-package.md    │
│  Skrivested:  MyNewProject/ (prosjektrot)        │
│  Filer:       1 fil                              │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ ⚠ Skriveoperasjon                        │   │
│  │ Filen opprettes i prosjektroten.         │   │
│  │ Handlingen kan ikke angres.              │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
├─────────────────────────────────────────────────┤
│  [← Avbryt]                [Generer ▶]           │  ← handlingsbar
└─────────────────────────────────────────────────┘
```

**«← Tilbake»** i panel-header returnerer alltid til filtreet uten å gjøre noe.

Høyre panel forblir uendret under en arbeidsflyt. Brukeren kan se prosjektkontekst mens de jobber.

---

## 3. Høyre panel

**Ansvar:** Vise kontekst og tilgjengelige handlinger for det som er valgt i filtreet.

Panelet har tre tilstander:

### 3a. Ingenting valgt

```
┌───────────────┐
│ PROSJEKT      │
│               │
│ Mappe         │
│ MyNewProject  │
│               │
│ Filer    1    │
│ Mapper   2    │
│ Skannet  nå   │
└───────────────┘
```

Bare informasjon. Ingen knapper. Minimal.

### 3b. Mappe valgt

Hvilke kontekstuelle knapper som vises avhenger av hva slags mappe det er. Handlinger som er globale (tilgjengelige uansett) vises ikke her – de ligger i handlingsbaren.

Eksempel: en transkripsjonmappe har én kontekstuell handling – å generere en kontekstpakke avgrenset til innholdet i akkurat den mappen. Kontekstpakken legges i mappen den ble generert fra, ikke i prosjektroten.

```
┌───────────────────────┐
│ 01. Transkripsjoner/  │  ← navn på valgt mappe
│ Mappe · 1 fil         │  ← kort beskrivelse
│                       │
│ [Generer            ] │  ← kontekstuell knapp:
│  kontekstpakke        │    gjelder bare denne mappen
│  for denne mappen     │
└───────────────────────┘
```

Filnavnet følger samme mønster som prosjekt-kontekstpakken, men scopes til mappen:
`transkripsjoner.context-package.md` lagres i `01. Transkripsjoner/`

**Skillet mellom globale og kontekstuelle handlinger:**

| Handling | Type | Plassering |
|----------|------|------------|
| Importer transkripsjon | Global | Handlingsbar |
| Generer kontekstpakke (hele prosjektet) | Global | Handlingsbar |
| Kjør Codex | Global | Handlingsbar |
| Generer kontekstpakke (denne mappen) | Kontekstuell | Høyre panel |

### 3c. Fil valgt

```
┌───────────────┐
│ 00. Oppfølg…  │  ← filnavn
│ .md · 72 KB   │  ← type og størrelse
│ 12.05.2026    │  ← sist endret
│               │
│ [Åpne fil   ] │  ← kontekstuell knapp
└───────────────┘
```

### 3d. Kontekstpakke valgt (fremtidig eksempel)

Viser at kontekstuelle handlinger kan utvides over tid uten å endre arkitekturen:

```
┌───────────────┐
│ kontekstpakke │
│ .md · 312 KB  │
│ Generert i dag│
│               │
│ [Bruk i Codex]│
│ [Generer ny ] │
│ [Slett      ] │
└───────────────┘
```

---

## 4. Handlingsbar

**Ansvar:** Globale handlinger som alltid er tilgjengelige, uavhengig av hva som er valgt.

```
┌─────────────────────────────────────────────────────────────────┐
│  [Importer transkripsjon]  [Generer kontekstpakke]  [Kjør Codex]  [···]  │
└─────────────────────────────────────────────────────────────────┘
```

- De faste knappene er dagens kjente handlinger
- **«···»** åpner en liten meny med sjeldnere handlinger (f.eks. «Skann på nytt», fremtidige handlinger)
- Handlingsbaren er alltid synlig, uansett om midtpanelet viser filtre eller en arbeidsflyt

**Når en arbeidsflyt er aktiv** kan det være aktuelt å deaktivere handlingsbaren for å unngå at brukeren starter to ting samtidig. Dette avklares under implementasjon.

---

## 5. Navigasjonsflyt – et komplett eksempel

Slik ser en typisk sesjon ut med den nye modellen:

```
1. Bruker åpner Sidekick
   → Midtpanel: filtre (MyNewProject)
   → Høyre panel: prosjektstatus (ingenting valgt)

2. Bruker klikker på «01. Transkripsjoner/»
   → Midtpanel: uendret (mappe markert i treet)
   → Høyre panel: mappeinfo + [Generer kontekstpakke for denne mappen]

3. Bruker klikker [Generer kontekstpakke for denne mappen] i høyre panel
   → Midtpanel: SKIFTER til kontekstpakke-flyt
   → Høyre panel: uendret

4. Bruker leser informasjon, klikker [Generer ▶]
   → Midtpanel: generering pågår (progressbar + logg)
   → Høyre panel: uendret

5. Generering ferdig
   → Midtpanel: resultatvisning med stats
   → Høyre panel: uendret

6. Bruker klikker [← Tilbake]
   → Midtpanel: TILBAKE til filtreet
   → Høyre panel: samme mappe fortsatt valgt
```

Brukeren mister aldri kontekst. Høyre panel er et stabilt orienteringspunkt gjennom hele sesjonen.

---

## 6. Oppsummering av prinsippene

| Prinsipp | Beskrivelse |
|----------|-------------|
| Én ting per sone | Topbar orienterer. Midtpanel handler. Høyre panel kontekstualiserer. Handlingsbar trigger. |
| Midtpanel skifter | Arbeidsflyter tar over midtpanelet fullstendig. Filtreet kommer tilbake via «← Tilbake». |
| Høyre panel er stabilt | Endrer seg bare ved brukervalg i filtreet. Aldri under en aktiv arbeidsflyt. |
| Start minimalt | Høyre panel er enkel nå. Kontekstuell logikk legges til over tid. |
| Handlingsbar er global | Knappene der gjelder alltid. Kontekstuelle knapper er i høyre panel, ikke i handlingsbaren. |
