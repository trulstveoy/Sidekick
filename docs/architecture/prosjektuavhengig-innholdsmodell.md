# Prosjektuavhengig innholdsmodell

Status: Draft

Dato: 2026-05-13

## Bakgrunn

Sidekick er i dag bygget rundt en enkel og forståelig antakelse:

```text
prosjekt = valgt lokal mappe = innholdet Sidekick arbeider med
```

Dette gir en tydelig startmodell. Brukeren velger en prosjektmappe, Sidekick skanner den, viser strukturen, importerer transkripsjoner, lager kontekstpakke og kjører Codex mot den valgte mappen.

Denne modellen er nyttig når et prosjekt har tydelig eierskap til sine filer. Den blir mer krevende når samme fil, samtale, transkripsjon eller dokument er relevant for flere prosjekter.

## Førende prinsipp

Sidekick skal ikke nødvendigvis eie innholdet.

Innholdet skal være vanlige Markdown-filer og andre lokale filer på disk. Brukeren kan skrive, lese og vedlikeholde Markdown i andre verktøy. Sidekick skal hjelpe brukeren å forstå, strukturere, koble, finne og organisere et Markdown-basert arbeidsområde.

Dette betyr:

- Markdown-filene er primærmaterialet.
- Filsystemet skal fortsatt være meningsfullt uten Sidekick.
- Sidekick skal ikke kreve at innhold importeres til en skjult database eller et lukket format.
- Sidekick kan legge til metadata, sammendrag, kontekstpakker og organiseringshjelp, men slike tillegg må være transparente og lokale.
- Sidekick bør være forsiktig med å skrive i brukerens eksisterende innholdsfiler.
- Sidekick bør skille tydelig mellom innhold brukeren skriver i andre verktøy, og organiseringsdata Sidekick bruker for å hjelpe brukeren.

Sidekick sin rolle er dermed nærmere en lokal organiserings- og forståelsesflate enn et primært skriveverktøy.

## Sidekick-kontrakt og fri brukerstruktur

Brukeren eier innholdet. Sidekick trenger likevel en liten og stabil arbeidsområdekontrakt for å kunne forstå og organisere innholdet pålitelig.

Dette gir et viktig skille:

- fri brukerstruktur: filer og mapper brukeren kan lage, redigere, flytte og organisere selv;
- Sidekick-kontrakt: de minste faste holdepunktene Sidekick trenger for å gi full funksjonalitet.

Sidekick bør ikke kreve at hele arbeidsområdet følger et rigid skjema. Men Sidekick kan kreve at noen få ting finnes og betyr det samme over tid.

Eksempel på mulig grunnstruktur:

```text
Arbeidsområde/
  .sidekick/
    workspace.md
    content-index.md
  00. Innboks/
  01. Transkripsjoner/
  02. Prosjekter/
```

Dette er bare et eksempel, ikke en beslutning om endelig struktur.

Mulige kontraktselementer:

- `.sidekick/` finnes som Sidekick sitt område for organiseringsdata.
- En arbeidsområdefil beskriver navn, versjon og grunninnstillinger for arbeidsområdet.
- En indeks- eller metadatafil beskriver koblinger mellom artefakter, prosjekter, temaer og fysisk plassering.
- Noen standardmapper kan ha fast betydning, for eksempel innboks, transkripsjoner og prosjekter.
- Sidekick-produserte filer bør ha forutsigbar navngiving og plassering.

Kontrakten bør være:

- liten nok til at brukeren forstår den;
- synlig i filsystemet;
- dokumentert i Sidekick;
- reparerbar hvis noe mangler;
- tolerant for ekstra filer og mapper;
- streng nok til at Sidekick ikke må gjette for mye.

Hvis brukeren endrer på grunnstrukturen, bør Sidekick ikke nødvendigvis slutte å virke helt. En bedre modell er gradert funksjonalitet:

- Hvis grunnstrukturen er intakt, kan Sidekick gi full funksjonalitet.
- Hvis standardmapper mangler, kan Sidekick oppdage det og tilby å opprette eller reparere dem.
- Hvis metadata mangler, kan Sidekick fortsatt skanne Markdown-filer, men mister koblinger, tags, sammendrag eller prosjektvisninger.
- Hvis filer flyttes utenfor Sidekick, kan Sidekick forsøke å gjenkjenne dem på sti, navn eller innhold, men må kanskje be brukeren om avklaring.
- Hvis `.sidekick/` slettes, kan Sidekick fortsatt lese arbeidsområdet som vanlige filer, men mister sin organiseringskontekst.

Prinsippet bør være:

```text
Grunnstrukturen skal være så liten som mulig, men så fast som nødvendig.
```

## Problemet

En fysisk prosjektmappe er ikke alltid det samme som en logisk prosjektkontekst.

Eksempel:

- En transkripsjon fra en samtale kan handle om flere prosjekter.
- En workshop kan dekke både strategi, arkitektur og et konkret leveranseprosjekt.
- Et bakgrunnsdokument kan være relevant for flere initiativer.
- Noen filer er felles kunnskap, mens andre filer faktisk bare hører til ett prosjekt.

Hvis Sidekick krever at alt ligger fysisk under ett prosjekt, kan brukeren ende med:

- dupliserte filer i flere prosjektmapper;
- uklart eierskap til originalfilen;
- manglende sammenheng mellom prosjekter;
- kontekstpakker som blir for smale eller for brede;
- en folderstruktur som organiserer lagring, men ikke kunnskapsrelasjoner.

Kjernen er derfor ikke bare hvor filene ligger, men hvordan Sidekick forstår forholdet mellom filer, prosjekter, temaer og kontekster.

## Foreløpig mål

Utforske om Sidekick bør støtte en hybrid modell der:

- filer fortsatt kan ligge i en ryddig lokal folderstruktur;
- prosjekter kan være logiske samlinger, ikke bare fysiske mapper;
- én fil kan være koblet til flere prosjekter;
- noen filer fortsatt kan være eid av ett prosjekt;
- tags, metadata eller relasjoner kan brukes til å lage prosjektvisninger;
- kontekstpakker, sammendrag og søk kan bygges fra både fysisk plassering og logisk tilknytning.

Dette notatet er ikke en beslutning om å endre dagens modell. Det beskriver et mulig framtidig konsept som må vurderes nøye før implementering.

## Rollefordeling mot andre verktøy

Brukeren kan ha et eget Markdown-verktøy for skriving. Sidekick skal ikke konkurrere med dette som hovededitor.

En hensiktsmessig rollefordeling kan være:

- Markdown-editor: skrive, redigere og lese innhold.
- Filsystem: lagre og strukturere materialet på en måte som er forståelig for mennesker.
- Sidekick: analysere, organisere, koble, oppsummere, foreslå struktur og lage kontekst.

Denne rollefordelingen er viktig fordi Sidekick bør bevare brukerens frihet til å arbeide med filene utenfor appen.

## Begreper

### Artefakt

En artefakt er en konkret fil Sidekick kan arbeide med.

Eksempler:

- transkripsjon;
- notat;
- PDF;
- presentasjon;
- bilde;
- lydfil;
- kontekstpakke;
- prosjektsammendrag.

### Prosjekt

Et prosjekt kan forstås på to måter:

- fysisk prosjekt: en mappe med egne filer;
- logisk prosjekt: en samling artefakter som hører sammen, uavhengig av hvor filene fysisk ligger.

Dagens Sidekick bruker primært fysisk prosjekt.

### Bibliotek

Et bibliotek er et område for artefakter som ikke nødvendigvis eies av ett prosjekt.

Eksempel:

```text
Bibliotek/
  Transkripsjoner/
  Bakgrunnsdokumenter/
  Felles notater/
```

Biblioteket kan inneholde materiale som senere kobles til ett eller flere prosjekter.

### Prosjekttilknytning

Prosjekttilknytning er metadata som sier hvilke prosjekter en artefakt er relevant for.

Eksempel:

```yaml
projects:
  - Prosjekt A
  - Prosjekt B
topics:
  - datamodell
  - risiko
  - onboarding
```

## Dagens baseline og mulige modeller

### Baseline: Rent prosjektorientert

Dette er dagens modell. Alle filer ligger under én prosjektmappe.

```text
Prosjekt A/
  00. Forutsetninger/
  01. Transkripsjoner/
  02. Notater/
```

Fordeler:

- lett å forstå;
- fungerer godt med lokalt filsystem;
- enkel kontekstpakke;
- enkel sikkerhetsmodell;
- ingen ekstra metadata kreves.

Ulemper:

- samme fil kan ikke naturlig høre til flere prosjekter;
- gjenbruk gir ofte duplisering;
- relasjoner mellom prosjekter blir svake;
- prosjektmappen blir både lagringsmodell og kunnskapsmodell.

Denne modellen er ikke et fremtidsalternativ i denne konseptutforskingen. Den er referansepunktet vi vurderer andre modeller mot.

### Modell A: Rent prosjektuavhengig bibliotek

Alle filer ligger i et felles bibliotek. Prosjekter er bare tags eller views.

```text
Bibliotek/
  Transkripsjoner/
  Dokumenter/
  Notater/
```

Fordeler:

- høy gjenbruk;
- én fil kan brukes i mange prosjekter;
- godt grunnlag for søk, tagging og relasjoner;
- passer for transkripsjoner og felles kunnskap.

Ulemper:

- kan bli mindre intuitivt for brukere som tenker i mapper;
- vanskeligere å se fysisk eierskap;
- krever robust metadatahåndtering;
- prosjektspesifikke filer kan bli mindre ryddige;
- kontekstpakker må velge filer basert på metadata, ikke bare mappe.

#### Testcase: Strategi og Operasjon

Dette caset bør brukes som testgrunnlag når Modell A og Modell B vurderes videre.

Formålet er å teste om modellen fungerer i en realistisk situasjon der noen filer er tydelig prosjektspesifikke, mens andre filer er relevante for flere prosjekter.

Vi har to samtidige prosjekter:

- Strategi
- Operasjon

Arbeidet skjer i samme organisasjon. Strategi-prosjektet skal beskrive retning, prioriteringer og mål. Operasjon-prosjektet skal beskrive hvordan organisasjonen faktisk skal styres, bemannes og følge opp leveranser.

Minimumsdatasettet bør inneholde:

| Artefakt | Type | Relevans | Hvorfor den finnes |
| --- | --- | --- | --- |
| `2026-05-13 intervju med direktør.md` | Transkripsjon | Strategi og Operasjon | Direktøren snakker både om strategisk retning og operasjonelle utfordringer. |
| `2026-05-14 operasjonsmodell.md` | Dokument | Operasjon | Beskriver roller, styringsmodell, møtefora og oppfølging. |
| `2026-05-15 strategiske veivalg.md` | Dokument | Strategi | Beskriver strategiske valg, prioriteringer og begrunnelser. |

Caset kan utvides med flere artefakter senere, men dette er nok til å teste de viktigste forskjellene:

- én delt transkripsjon;
- ett dokument som bare hører til Operasjon;
- ett dokument som bare hører til Strategi.

Brukeroppgaver caset må støtte:

1. Brukeren legger inn eller importerer direktørintervjuet én gang.
2. Brukeren kobler intervjuet til både Strategi og Operasjon.
3. Brukeren lager et operasjonsdokument som bare skal ligge i Operasjon.
4. Brukeren lager et strategidokument som bare skal ligge i Strategi.
5. Brukeren åpner Strategi og ser strategidokumentet pluss det delte intervjuet.
6. Brukeren åpner Operasjon og ser operasjonsdokumentet pluss det delte intervjuet.
7. Brukeren lager en kontekstpakke for Strategi og får riktig utvalg.
8. Brukeren lager en kontekstpakke for Operasjon og får riktig utvalg.
9. Brukeren kan se hvorfor intervjuet er inkludert i begge prosjektkontekster.
10. Brukeren kan finne fysisk plassering for alle filer uten å måtte forstå Sidekick-intern metadata.

Evalueringsspørsmål:

- Må brukeren vite for mye om Sidekick-metadata for å lagre en ny fil riktig?
- Unngår modellen duplisering av intervjuet?
- Er det tydelig hvilke filer som fysisk ligger hvor?
- Er det tydelig hvorfor en fil vises i en prosjektkontekst?
- Kan brukeren rette feil prosjekttilknytning uten å flytte filer manuelt?
- Kan Markdown-filene fortsatt leses og vedlikeholdes i andre verktøy?
- Hva skjer hvis `.sidekick/` mangler eller er utdatert?

##### Modell A brukt på caset

I en rent prosjektuavhengig bibliotekmodell kan diskstrukturen se slik ut:

```text
Arbeidsområde/
  00. Innboks/
  01. Transkripsjoner/
    2026-05-13 intervju med direktør.md
  02. Dokumenter/
    2026-05-14 operasjonsmodell.md
    2026-05-15 strategiske veivalg.md
  03. Prosjekter/
    strategi.md
    operasjon.md
  .sidekick/
    workspace.md
    content-index.md
```

Transkripsjonen kan ha metadata som sier at den hører til begge prosjekter:

```markdown
---
type: transkripsjon
projects:
  - Strategi
  - Operasjon
participants:
  - Direktør
date: 2026-05-13
---

# Intervju med direktør
```

Operasjonsdokumentet kan ha metadata som sier at det kun hører til Operasjon:

```markdown
---
type: dokument
projects:
  - Operasjon
topics:
  - operasjonsmodell
date: 2026-05-14
---

# Operasjonsmodell
```

Strategidokumentet kan ha metadata som sier at det kun hører til Strategi:

```markdown
---
type: dokument
projects:
  - Strategi
topics:
  - strategiske valg
  - prioriteringer
date: 2026-05-15
---

# Strategiske veivalg
```

Sidekick kan da visualisere prosjektene som logiske samlinger:

```text
Prosjekt: Strategi
  Transkripsjoner
    2026-05-13 intervju med direktør.md
  Dokumenter
    2026-05-15 strategiske veivalg.md

Prosjekt: Operasjon
  Transkripsjoner
    2026-05-13 intervju med direktør.md
  Dokumenter
    2026-05-14 operasjonsmodell.md
```

Dette viser styrken i Modell A: transkripsjonen trenger ikke dupliseres. Den finnes ett sted på disk, men vises i begge prosjektkontekster.

Problemet er brukeropplevelsen utenfor Sidekick. Brukeren skriver Markdown i et annet verktøy. Når brukeren lager `operasjonsmodell.md` eller `strategiske veivalg.md`, må brukeren vite:

- hvilken fysisk mappe dokumentet skal ligge i;
- hvilken `type` dokumentet skal ha;
- hvilket prosjekt dokumentet skal tagges med;
- hvilke metadata som er påkrevd for at Sidekick skal vise dokumentet riktig.

Dette kan bli mer abstrakt enn dagens prosjektmapper. For dokumenter som bare hører til ett prosjekt, kan det oppleves mer naturlig å legge filen direkte i en prosjektmappe enn i et generelt dokumentbibliotek.

Mulig brukeropplevelse i Modell A:

1. Brukeren skriver eller lagrer en ny Markdown-fil i `00. Innboks/` eller `02. Dokumenter/`.
2. Sidekick oppdager filen som ny eller uklassifisert.
3. Sidekick ber brukeren velge type, prosjekt og eventuelle tema.
4. Sidekick viser filen under riktig prosjektvisning basert på metadata.
5. Filen blir liggende fysisk i bibliotekstrukturen.

Dette krever gode maler, tydelig uklassifisert-tilstand og enkel metadataredigering. Uten dette kan Modell A bli tung å bruke.

Foreløpig vurdering:

- Modell A passer godt for delte artefakter, særlig transkripsjoner og felles bakgrunnsmateriale.
- Modell A passer dårligere for dokumenter som intuitivt og praktisk bare hører til ett prosjekt.
- Modell A krever en sterk innboks-, klassifiserings- og metadataflyt for å bli brukbar.
- Eksempelet peker derfor mot at en hybrid modell kan være mer naturlig: delte transkripsjoner i bibliotek, prosjektspesifikke dokumenter i prosjektmappe.

### Modell B: Hybrid modell

Noen filer ligger i prosjektmapper, mens gjenbrukbare artefakter ligger i et bibliotek og kobles til prosjekter med metadata.

```text
Prosjekter/
  Prosjekt A/
    00. Forutsetninger/
    01. Arbeidsnotater/
  Prosjekt B/
    00. Forutsetninger/
    01. Arbeidsnotater/

Bibliotek/
  Transkripsjoner/
    2026-05-01 samtale med Kari.md
    2026-05-03 workshop arkitektur.md
  Bakgrunnsdokumenter/
    felles rammeverk.pdf
```

Metadata:

```yaml
file: Bibliotek/Transkripsjoner/2026-05-01 samtale med Kari.md
projects:
  - Prosjekt A
  - Prosjekt B
topics:
  - arkitektur
  - datamodell
```

Fordeler:

- bevarer ryddig folderstruktur;
- støtter delte transkripsjoner og felles materiale;
- lar prosjektet være en logisk kontekst;
- gir bedre grunnlag for sammenhenger på tvers av prosjekter;
- kan innføres gradvis.

Ulemper:

- mer kompleks brukeropplevelse;
- krever tydelig skille mellom fysisk plassering og prosjektkobling;
- metadata må være synlig, forståelig og lett å rette;
- risiko for at brukeren mister oversikten over hva som faktisk ligger hvor.

#### Strategi og Operasjon i hybridmodellen

Med samme testcase kan en hybrid diskstruktur se slik ut:

```text
Arbeidsområde/
  Prosjekter/
    Strategi/
      00. Retning/
        2026-05-15 strategiske veivalg.md
    Operasjon/
      00. Leveranse/
        2026-05-14 operasjonsmodell.md
  Bibliotek/
    Transkripsjoner/
      2026-05-13 intervju med direktør.md
  .sidekick/
    workspace.md
    content-index.md
```

Brukerens prosjektspesifikke dokumenter ligger da der brukeren naturlig forventer dem: under hvert prosjekt. Det delte intervjuet ligger ett sted i biblioteket.

Prosjekttilknytning kan lagres i en sentral Sidekick-indeks:

```yaml
artifacts:
  - id: transcription-2026-05-13-director
    path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    type: transkripsjon
    projects:
      - Strategi
      - Operasjon
    participants:
      - Direktør
    date: 2026-05-13
  - id: strategy-choices-2026-05-15
    path: Prosjekter/Strategi/00. Retning/2026-05-15 strategiske veivalg.md
    type: dokument
    projects:
      - Strategi
    date: 2026-05-15
  - id: operating-model-2026-05-14
    path: Prosjekter/Operasjon/00. Leveranse/2026-05-14 operasjonsmodell.md
    type: dokument
    projects:
      - Operasjon
    date: 2026-05-14
```

Sidekick kan vise to supplerende sannheter samtidig:

```text
Prosjektvisning: Strategi
  Prosjektfiler
    2026-05-15 strategiske veivalg.md
  Koblede bibliotekfiler
    2026-05-13 intervju med direktør.md

Prosjektvisning: Operasjon
  Prosjektfiler
    2026-05-14 operasjonsmodell.md
  Koblede bibliotekfiler
    2026-05-13 intervju med direktør.md

Mappevisning
  Prosjekter/
    Strategi/
    Operasjon/
  Bibliotek/
    Transkripsjoner/
```

Denne modellen gjør det lettere å forklare kontekstpakker:

- Strategi-pakken inkluderer strategidokumentet fordi det fysisk ligger i Strategi.
- Strategi-pakken inkluderer intervjuet fordi intervjuet er koblet til Strategi.
- Operasjon-pakken inkluderer operasjonsmodellen fordi den fysisk ligger i Operasjon.
- Operasjon-pakken inkluderer intervjuet fordi intervjuet er koblet til Operasjon.

Hybridmodellen virker mer naturlig for dette caset fordi brukeren slipper å flytte prosjektspesifikke dokumenter inn i et generelt bibliotek. Samtidig unngår modellen duplisering av intervjuet.

Den viktigste designutfordringen er at GUI-et må vise forskjellen mellom `ligger i prosjektet` og `er koblet til prosjektet`. Hvis Sidekick ikke gjør dette tydelig, kan brukeren miste tillit til hvorfor filer dukker opp i en prosjektvisning.

Foreløpig vurdering: Hybridmodellen virker mest relevant, men den må designes forsiktig.

## Metadata og lagring

Hvis Sidekick skal støtte prosjektuavhengige artefakter, trengs en metadata-modell.

Mulige lagringsstrategier:

### Metadata i hver fil

Markdown-filer kan ha frontmatter.

```markdown
---
sidekick:
  projects:
    - Prosjekt A
    - Prosjekt B
  topics:
    - datamodell
    - risiko
---

# Transkripsjon
...
```

Fordeler:

- metadata følger filen;
- lett å lese for mennesker;
- fungerer godt for Markdown.

Ulemper:

- passer dårlig for PDF, lyd, bilder og binære filer;
- Sidekick må skrive i brukerens filer;
- kan kollidere med eksisterende frontmatter.

### Sidecar-filer

Hver artefakt kan ha en egen metadatafil ved siden av.

```text
2026-05-01 samtale med Kari.md
2026-05-01 samtale med Kari.sidekick.json
```

Fordeler:

- fungerer for alle filtyper;
- originalfilen kan forbli urørt;
- lett å slette eller regenerere.

Ulemper:

- flere filer i mappene;
- kan oppleves rotete;
- metadata kan komme ut av sync hvis filen flyttes.

### Sentral metadataindeks

Prosjekt- eller bibliotekroten kan ha en Sidekick-fil.

```text
.sidekick/
  content-index.json
```

Fordeler:

- samlet oversikt;
- godt grunnlag for søk og GUI;
- originalfiler forblir urørt.

Ulemper:

- metadata er mindre synlig i filsystemet;
- flytting/renaming må håndteres;
- krever tydelig recovery-strategi hvis indeksen blir feil.

Foreløpig vurdering: En sentral metadataindeks i `.sidekick/` virker mest kontrollerbar for Sidekick, men Markdown-frontmatter kan være aktuelt for enkelte Sidekick-produserte Markdown-filer.

Denne vurderingen må veies mot prinsippet om at Markdown-filene skal være brukbare i andre verktøy. Metadata som er viktig for menneskelig forståelse kan høre hjemme i Markdown. Metadata som primært er intern organisering, cache eller koblingsdata kan høre hjemme i `.sidekick/`.

## Konsekvenser for Sidekick

### Prosjektvelger

Dagens prosjektvelger velger en mappe. I en hybrid modell kan Sidekick trenge å skille mellom:

- arbeidsområde;
- fysisk prosjektmappe;
- logisk prosjekt;
- felles bibliotek.

Det kan bli nødvendig med en førstegangsoppsett-flyt:

1. Velg eller opprett arbeidsområde.
2. Kontroller at Sidekick-kontrakten finnes.
3. Opprett eller reparer manglende grunnstruktur ved behov.
4. Definer hvor prosjekter ligger.
5. Definer hvor felles bibliotek ligger.
6. Velg eller opprett logiske prosjekter.

### Transkripsjoner

Transkripsjoner er den tydeligste kandidaten for prosjektuavhengig lagring.

Mulig retning:

- transkripsjoner lagres i et felles transkripsjonsbibliotek;
- hver transkripsjon kan tagges med ett eller flere prosjekter;
- transkripsjonen kan også tagges med tema, deltakere, dato og kilde;
- prosjektvisningen viser transkripsjoner som er koblet til prosjektet, selv om de ligger utenfor prosjektmappen.

### Kontekstpakker

Kontekstpakker må kunne bygges fra en definert kontekst, ikke bare en mappe.

Mulige konteksttyper:

- fysisk mappe;
- valgt prosjektmappe;
- logisk prosjekt;
- valgt tema;
- valgt transkripsjon;
- manuelt utvalg av filer.

Dette påvirker både preview, navngiving, output-plassering og forklaring av hva som inkluderes.

### Sammendrag

Prosjektsammendrag kan bli bedre hvis de bygger på logisk prosjekttilknytning.

Eksempel:

- prosjektspesifikke filer fra prosjektmappen;
- transkripsjoner tagget med prosjektet;
- felles bakgrunnsdokumenter som er koblet til prosjektet;
- relasjoner til andre prosjekter eller temaer.

### Søk

En prosjektuavhengig modell øker behovet for en lokal indeks.

Søk bør kunne filtrere på:

- prosjekt;
- tema;
- artefakttype;
- fysisk plassering;
- dato;
- deltakere;
- relasjoner.

### GUI

GUI-et må gjøre to ting tydelig:

- hvor filen fysisk ligger;
- hvilke prosjekter og temaer filen er koblet til.

Mulige visninger:

- Prosjektvisning: viser alt som hører til prosjektet, uansett fysisk plassering.
- Mappevisning: viser faktisk folderstruktur.
- Bibliotekvisning: viser felles artefakter.
- Artefaktdetaljer: viser fysisk sti, prosjekttilknytninger, tags og relasjoner.

Dette må ikke bli en full kunnskapsdatabase for tidlig. Første versjon bør være enkel og lokal.

## Viktige designspørsmål

1. Skal Sidekick fortsatt starte med å velge en mappe, eller skal brukeren velge et arbeidsområde?
2. Skal prosjekter være fysiske mapper, logiske objekter, eller begge deler?
3. Skal transkripsjoner som standard lagres i prosjektet eller i et felles bibliotek?
4. Hvordan skal brukeren se at en fil hører til flere prosjekter?
5. Hvordan skal brukeren endre prosjekttilknytning?
6. Hvor skal metadata lagres?
7. Skal Sidekick skrive metadata inn i brukerens filer, eller bare i `.sidekick/`?
8. Hvordan håndteres filer som flyttes utenfor Sidekick?
9. Hvordan skal kontekstpakker forklare hvorfor hver fil er inkludert?
10. Hva skjer hvis to prosjekter bruker samme transkripsjon, men vil ha ulike sammendrag eller vurderinger?
11. Skal prosjektuavhengige artefakter være kopier, lenker, referanser eller tags?
12. Hvordan unngår vi at fleksibiliteten gjør systemet uoversiktlig?

## Mulig gradvis innføring

En trygg innføring kan skje i trinn.

### Trinn 1: Dokumenter konseptet

Ingen produktendring. Bare forstå modellene og konsekvensene.

### Trinn 2: Legg metadata til Sidekick-produserte filer

Sidekick kan begynne med å lagre intern metadata i `.sidekick/`, uten å endre brukerens eksisterende filer.

### Trinn 3: Vis prosjekttilknytning i GUI

For utvalgte artefakter, særlig transkripsjoner, kan Sidekick vise hvilke prosjekter filen er koblet til.

### Trinn 4: Tillat felles transkripsjonsbibliotek

Brukeren kan velge et felles bibliotek for transkripsjoner og koble transkripsjoner til prosjekter.

### Trinn 5: Bygg kontekstpakker fra logiske prosjekter

Kontekstpakker kan inkludere både prosjektmappen og relevante bibliotekfiler basert på metadata.

## Foreløpig anbefaling

Ikke endre dagens prosjektmappemodell umiddelbart.

Dagens modell er fortsatt riktig for tidlig produktutvikling fordi den er lokal, enkel og forståelig. Men Sidekick bør unngå å bygge for mange irreversible antakelser rundt at alt innhold alltid eies av nøyaktig én prosjektmappe.

Neste arkitektoniske steg bør være å utforske en hybrid modell der:

- prosjektmapper fortsatt finnes;
- felles artefaktbibliotek kan finnes;
- transkripsjoner kan kobles til flere prosjekter;
- `.sidekick/` kan lagre kontrollerbar metadata;
- en liten Sidekick-kontrakt definerer grunnstruktur uten å overstyre brukerens frie Markdown-arbeid;
- GUI-et kan skille mellom fysisk plassering og logisk prosjekttilknytning.

Utforskingen bør samtidig holde fast ved at Sidekick ikke skal bli en lukket innholdsbase. Sidekick skal hjelpe brukeren å organisere et åpent Markdown-arbeidsområde som fortsatt kan brukes fra andre verktøy.

Dette bør bli en egen spesifikasjonsoppgave før det blir implementering.
