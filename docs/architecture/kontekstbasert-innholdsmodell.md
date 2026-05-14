# Kontekstbasert innholdsmodell

Status: Beslutningsgrunnlag

Dato: 2026-05-13

## Formål

Dette dokumentet beskriver hvordan en kontekstbasert innholdsmodell kan fungere i Sidekick.

Dokumentet skal brukes som beslutningsgrunnlag før implementering. Det er skrevet for utviklere, konsulenter og produktarbeid som trenger en felles forståelse av:

- hva den kontekstbaserte innholdsmodellen er;
- hvilke brukerproblemer den løser;
- hvordan modellen oppleves i Sidekick;
- hvordan modellen oppleves i en vanlig Markdown-editor;
- hvilke konsekvenser modellen har for filstruktur, metadata, kontekstpakker, sammendrag, søk og GUI.

Dette er ikke en implementeringsplan. Det er en anbefalt retning og et beslutningsgrunnlag.

## Kort konklusjon

Den kontekstbaserte innholdsmodellen bør være Sidekick sin langsiktige retning for prosjektuavhengig innhold.

Dagens enkle prosjektmodell bør fortsatt være første produktnivå:

```text
prosjekt = valgt lokal mappe
```

Den kontekstbaserte modellen legger et nytt nivå oppå dette, uten å erstatte prosjektmapper:

```text
arbeidsområde = prosjektmapper + applikasjonsmapper + felles bibliotek + Sidekick-metadata
```

I den kontekstbaserte modellen kan vanlige prosjektspesifikke dokumenter fortsatt ligge i prosjektmapper, applikasjonsgenerelle dokumenter kan ligge i applikasjonsmapper, og delte artefakter, særlig transkripsjoner og felles bakgrunnsmateriale, kan ligge i et felles bibliotek og kobles til én eller flere kontekstvisninger.

Dette gir bedre gjenbruk uten at brukeren må slutte å tenke i mapper.

Brukeropplevelsen bør organiseres som kontekstvisninger over samme innhold: `Mapper` viser fysisk plassering, mens `Prosjekter`, `Applikasjoner` og senere andre kontekstvisninger viser logiske kontekster.

`Mapper`, `Prosjekter` og `Applikasjoner` er konseptuelle kontekstvisninger, ikke en lukket liste med faste produktfaner. De beskriver et generisk mønster Sidekick kan bygge videre på.

## Førende prinsipper

Den kontekstbaserte modellen bør følge disse prinsippene:

- Sidekick skal ikke eie brukerens innhold.
- Markdown-filer og lokale filer på disk er primærmaterialet.
- Filsystemet skal fortsatt være forståelig uten Sidekick.
- Sidekick kan legge til metadata, sammendrag, indekser og kontekstpakker, men dette skal være lokalt og transparent.
- Sidekick bør være forsiktig med å skrive metadata inn i brukerens egne innholdsfiler.
- Intern organiseringsmetadata bør i første omgang ligge under `.sidekick/`.
- Brukeren skal kunne forstå forskjellen mellom hvor en fil fysisk ligger og hvilke kontekster den er koblet til.
- Modellen må tåle at filer opprettes, leses og redigeres i andre verktøy.

## Begreper

### Arbeidsområde

Et arbeidsområde er den overordnede lokale mappen Sidekick kan forstå som en samling av prosjektmapper, bibliotek og Sidekick-metadata.

Eksempel:

```text
Arbeidsområde/
  Prosjekter/
  Applikasjoner/
  Bibliotek/
  .sidekick/
```

### Fysisk prosjektmappe

En fysisk prosjektmappe er en mappe på disk som eier prosjektspesifikke filer.

Eksempel:

```text
Arbeidsområde/Prosjekter/Strategi/
```

### Logisk prosjekt

Et logisk prosjekt er Sidekick sin prosjektvisning. Den kan bestå av:

- filer som fysisk ligger i prosjektmappen;
- delte artefakter som ligger i biblioteket og er koblet til prosjektet.

### Kontekst

En kontekst er en logisk samling artefakter Sidekick kan lage en visning av.

`Prosjekt` er en viktig konteksttype, men ikke den eneste mulige konteksttypen.

Mulige konteksttyper:

- prosjekt;
- applikasjon;
- tema;
- beslutning;
- person eller rolle;
- prosess;
- leveranse.

Dette betyr at Sidekick på sikt bør kunne vise innhold som `Prosjekt: Operasjon`, men også som `Applikasjon: Sidekick` eller `Tema: Transkripsjonsimport`.

### Applikasjon

En applikasjon er et produkt, system eller verktøy som kan ha egne dokumenter på tvers av prosjekter.

Eksempel:

```text
Arbeidsområde/Applikasjoner/Sidekick/
```

En applikasjon kan også opptre inne i et prosjekt:

```text
Arbeidsområde/Prosjekter/Operasjon/Applikasjoner/Sidekick/
```

Disse to plasseringene betyr ikke det samme:

- `Applikasjoner/Sidekick/` beskriver applikasjonen som et selvstendig objekt.
- `Prosjekter/Operasjon/Applikasjoner/Sidekick/` beskriver Sidekick i Operasjon-prosjektets kontekst.

### Bibliotek

Et bibliotek er et felles område for artefakter som ikke nødvendigvis eies av ett prosjekt.

Eksempel:

```text
Arbeidsområde/Bibliotek/Transkripsjoner/
```

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

### Konteksttilknytning

Konteksttilknytning er metadata som sier at en artefakt er relevant for én eller flere kontekster.

Eksempel:

```yaml
contexts:
  - type: project
    name: Strategi
  - type: project
    name: Operasjon
  - type: application
    name: Sidekick
```

## Beslutningen som skal tas

Dette dokumentet støtter en beslutning om Sidekick bør gå mot en kontekstbasert innholdsmodell der:

- prosjektmapper fortsatt er gyldige og viktige;
- flere konteksttyper kan eksistere side om side, for eksempel prosjekt og applikasjon;
- et felles bibliotek kan brukes for delte artefakter;
- transkripsjoner kan kobles til flere prosjekter, applikasjoner eller temaer;
- `.sidekick/` brukes til kontrollerbar metadata;
- prosjekt- og applikasjonsvisninger kan vise både egne filer og koblede bibliotekfiler;
- kontekstpakker, sammendrag og søk senere kan bygges fra logisk konteksttilknytning, ikke bare fysisk mappe.

Beslutningen bør ikke automatisk bety at alt bygges nå. Den bør gi retning for metadata, filkontrakter og GUI slik at kommende oppgaver ikke låser Sidekick til en ren prosjektmappemodell.

## Use case: Strategi og Operasjon

Dette use caset bør brukes som referanse når den kontekstbaserte modellen diskuteres med utviklere og konsulenter.

### Situasjon

En organisasjon har to samtidige prosjekter:

- `Strategi`
- `Operasjon`

Strategi-prosjektet handler om retning, prioriteringer og mål.

Operasjon-prosjektet handler om styring, bemanning, møtefora, leveranser og oppfølging.

Noe materiale er tydelig prosjektspesifikt. Annet materiale er relevant for begge prosjekter.

### Minimumsdatasett

| Artefakt | Type | Relevans | Hvorfor den finnes |
| --- | --- | --- | --- |
| `2026-05-13 intervju med direktør.md` | Transkripsjon | Strategi og Operasjon | Direktøren snakker både om strategisk retning og operasjonelle utfordringer. |
| `2026-05-14 operasjonsmodell.md` | Dokument | Operasjon | Beskriver roller, styringsmodell, møtefora og oppfølging. |
| `2026-05-15 strategiske veivalg.md` | Dokument | Strategi | Beskriver strategiske valg, prioriteringer og begrunnelser. |

### Hva caset tester

Caset tester om modellen kan håndtere:

- én delt transkripsjon uten duplisering;
- ett dokument som bare hører til Strategi;
- ett dokument som bare hører til Operasjon;
- kontekstpakker for hvert prosjekt med riktig innhold;
- tydelig forklaring av hvorfor en fil er inkludert;
- bruk av Markdown-editor uten at brukeren må forstå Sidekick-intern metadata.

### Forventet filstruktur

Den kontekstbaserte modellen kan representere caset slik:

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
    content-index.yml
```

Prosjektspesifikke dokumenter ligger i prosjektmapper. Den delte transkripsjonen ligger ett sted i biblioteket.

### Forventet prosjektvisning

Sidekick kan vise Strategi slik:

```text
Prosjekt: Strategi
  Prosjektfiler
    2026-05-15 strategiske veivalg.md
  Koblede bibliotekfiler
    2026-05-13 intervju med direktør.md
```

Sidekick kan vise Operasjon slik:

```text
Prosjekt: Operasjon
  Prosjektfiler
    2026-05-14 operasjonsmodell.md
  Koblede bibliotekfiler
    2026-05-13 intervju med direktør.md
```

Mappevisning viser samtidig faktisk diskstruktur:

```text
Mappevisning
  Prosjekter/
    Strategi/
    Operasjon/
  Bibliotek/
    Transkripsjoner/
```

Dette er kjernen i den kontekstbaserte modellen: Sidekick må kunne vise både fysisk struktur og logisk konteksttilknytning.

## Use case: Applikasjon som egen kontekst

Strategi/Operasjon-caset viser hvorfor prosjektmapper og bibliotek må kunne kombineres. Et neste realistisk case er at `Applikasjon` også blir en egen konteksttype.

Dette gjør modellen mer kompleks, men også mer presis.

### Situasjon

Organisasjonen bruker eller utvikler applikasjonen `Sidekick`.

Sidekick kan beskrives på to nivåer:

- som en generell applikasjon med egen arkitektur, roadmap og datamodell;
- som en applikasjon i et konkret prosjekt, for eksempel Operasjon.

Begge deler kan være sant samtidig.

### Forventet filstruktur

Arbeidsområdet kan ha en egen hovedkategori for applikasjoner:

```text
Arbeidsområde/
  Applikasjoner/
    Sidekick/
      00. Produkt/
        produktbeskrivelse.md
      01. Arkitektur/
        applikasjonsarkitektur.md
        datamodell.md
      02. Roadmap/
        roadmap.md
```

Dette beskriver Sidekick som applikasjon uavhengig av ett bestemt prosjekt.

Samtidig kan et prosjekt ha en applikasjonsmappe:

```text
Arbeidsområde/
  Prosjekter/
    Operasjon/
      Applikasjoner/
        Sidekick/
          krav.md
          innforingsplan.md
          risiko.md
```

Dette beskriver hvordan Sidekick inngår i Operasjon-prosjektet.

### Hvorfor begge trengs

Hvis alt Sidekick-relatert legges under `Applikasjoner/Sidekick/`, mister Operasjon-prosjektet en naturlig plass for prosjektspesifikke krav, risikoer og innføringsplaner.

Hvis alt Sidekick-relatert legges under `Prosjekter/Operasjon/`, mister applikasjonen sin egen kunnskapsbase på tvers av prosjekter.

Den kontekstbaserte modellen bør derfor støtte begge:

- applikasjonsgenerelle dokumenter i `Applikasjoner/<Applikasjon>/`;
- prosjektspesifikke applikasjonsdokumenter i `Prosjekter/<Prosjekt>/Applikasjoner/<Applikasjon>/`.

### Sidekick-visning for applikasjon

Sidekick kan vise `Applikasjon: Sidekick` slik:

```text
Applikasjon: Sidekick
  Generelle applikasjonsdokumenter
    Applikasjoner/Sidekick/00. Produkt/produktbeskrivelse.md
    Applikasjoner/Sidekick/01. Arkitektur/applikasjonsarkitektur.md
    Applikasjoner/Sidekick/01. Arkitektur/datamodell.md
    Applikasjoner/Sidekick/02. Roadmap/roadmap.md
  Prosjektkontekster
    Operasjon
      Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md
      Prosjekter/Operasjon/Applikasjoner/Sidekick/innforingsplan.md
      Prosjekter/Operasjon/Applikasjoner/Sidekick/risiko.md
```

Sidekick kan samtidig vise `Prosjekt: Operasjon` slik:

```text
Prosjekt: Operasjon
  Prosjektfiler
    00. Leveranse/2026-05-14 operasjonsmodell.md
  Applikasjoner i prosjektet
    Sidekick
      krav.md
      innforingsplan.md
      risiko.md
  Koblede bibliotekfiler
    Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

Dette betyr at samme fysiske dokument kan være synlig fra flere kontekstvisninger uten å dupliseres.

### Implisitt og eksplisitt kontekst

Dette caset introduserer et viktig prinsipp:

```text
Fysisk struktur kan uttrykke én naturlig kontekst.
Metadata kan uttrykke flere logiske kontekster.
```

Eksempel:

```text
Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md
```

Sidekick kan lese mye direkte fra filstien:

```yaml
implicit_contexts:
  - type: project
    id: project-operations
  - type: application
    id: app-sidekick
```

Filen ligger fysisk i Operasjon-prosjektet og i Sidekick-applikasjonsdelen av prosjektet. Sidekick trenger ikke nødvendigvis eksplisitt metadata for å forstå dette første nivået.

Men en bibliotekfil trenger eksplisitt metadata:

```text
Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

```yaml
contexts:
  - type: project
    id: project-operations
  - type: project
    id: project-strategy
  - type: application
    id: app-sidekick
```

Dette lar samme transkripsjon være relevant for Operasjon, Strategi og Sidekick uten å flyttes eller kopieres.

### Rasjonale

Applikasjonscaset viser at `Prosjekt` ikke bør være den eneste logiske modellen i Sidekick.

En bedre generell modell er:

```text
Artefakt = en fil på disk
Kontekst = en logisk samling artefakter
Konteksttype = prosjekt, applikasjon, tema, beslutning, person, prosess
View = Sidekick sin visning av én kontekst
```

Prosjekt og applikasjon kan begge ha fysisk struktur. De kan også overlappe.

Derfor bør Sidekick ikke bygge en metadata- og GUI-modell som bare har `projects`. `projects` er forståelig i tidlige oppgaver, men langsiktig bør modellen kunne uttrykke `contexts`.

Dette betyr ikke at alt må bli generisk med en gang. Det betyr at nye metadata bør unngå irreversible felt og antakelser som gjør det vanskelig å legge til applikasjonsvisninger senere.

## Sidekick-perspektiv

Fra Sidekick sitt perspektiv er den kontekstbaserte modellen en utvidelse av dagens prosjektmodell.

Sidekick må kunne forstå flere nivåer:

1. arbeidsområde;
2. fysisk prosjektmappe;
3. fysisk applikasjonsmappe;
4. prosjektspesifikk applikasjonsmappe;
5. felles bibliotek;
6. logiske kontekstvisninger.

### Arbeidsområdeoppsett

En fremtidig arbeidsområdeflyt kan se slik ut:

1. Brukeren velger eller oppretter et arbeidsområde.
2. Sidekick sjekker om `.sidekick/` finnes.
3. Sidekick sjekker om standardmapper finnes.
4. Sidekick tilbyr å opprette eller reparere manglende struktur.
5. Brukeren peker ut hvor prosjektmapper ligger.
6. Brukeren peker ut hvor applikasjonsmapper ligger.
7. Brukeren peker ut hvor felles bibliotek ligger.
8. Sidekick bygger eller oppdaterer `content-index`.

Første versjon bør ikke kreve at alle arbeidsområder har full struktur. Sidekick bør støtte gradert funksjonalitet.

### Kontekstvisninger

Den kontekstbaserte modellen bør forstås som flere kontekstvisninger over samme arbeidsområde.

En kontekstvisning er en måte å vise de samme artefaktene i en valgt kontekst:

- `Mapper`: fysisk diskstruktur.
- `Prosjekter`: logiske prosjektvisninger.
- `Applikasjoner`: logiske applikasjonsvisninger.
- Senere mulige kontekstvisninger: tema, beslutninger, personer, prosesser.

Listen er ikke uttømmende. `Mapper`, `Prosjekter` og `Applikasjoner` er de første konkrete eksemplene på en mer generell mekanisme:

```text
Kontekstvisning = en konseptuell visning over artefakter og kontekster
```

Nye kontekstvisninger bør kunne legges til uten at artefaktmodellen må bygges om.

Prototypefilen `docs/architecture/kontekstvisninger-mapper-og-prosjekter.html` viser dette prinsippet for to kontekstvisninger:

- `Mapper` viser hvor filer faktisk ligger.
- `Prosjekter` viser hvilke filer som hører til hvert prosjekt.

Samme transkripsjon vises da to steder i brukeropplevelsen:

```text
Mapper
  Bibliotek/
    Transkripsjoner/
      2026-05-13 intervju med direktør.md

Prosjekter
  Strategi
    Fra bibliotek
      2026-05-13 intervju med direktør.md
  Operasjon
    Fra bibliotek
      2026-05-13 intervju med direktør.md
```

Dette betyr ikke at filen finnes tre ganger. Den finnes fysisk ett sted, men vises i flere kontekstvisninger.

Kontekstvisningsmodellen krever at Sidekick skiller tydelig mellom:

- artefaktens fysiske plassering;
- artefaktens konteksttilknytninger;
- hvorfor artefakten vises i en bestemt kontekstvisning;
- hvilke handlinger som gir mening i valgt kontekstvisning.

### Krav fra kontekstvisningen

For at kontekstvisningen skal fungere, må metamodelen støtte noen konkrete spørsmål:

1. Hvilken fil på disk representerer denne raden?
2. Hvilken kontekstvisning vises raden i?
3. Hvorfor er filen inkludert i denne kontekstvisningen?
4. Er filen fysisk del av konteksten, eller koblet fra bibliotek?
5. Hvilke andre kontekster er filen koblet til?
6. Hvilke handlinger er relevante for valgt fil og valgt kontekstvisning?

Dette gir et viktig skille:

```text
Artefakt = filen på disk
Kontekst = prosjekt, applikasjon, tema eller annen logisk samling
Kontekstvisning = UI-visning av én type struktur
Rad i kontekstvisning = artefakt + visningsgrunn + valgt kontekst
```

En rad i `Mapper`-visningen kan forklares med fysisk plassering:

```yaml
context_view: folders
artifact_id: transcription-2026-05-13-director
view_reason: physical-location
path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

En rad i `Prosjekter`-visningen kan forklare at samme fil er koblet til Strategi:

```yaml
context_view: projects
context_id: project-strategy
artifact_id: transcription-2026-05-13-director
view_reason: linked-library-artifact
path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

En fremtidig rad i `Applikasjoner`-visningen kan forklare at samme fil er koblet til Sidekick:

```yaml
context_view: applications
context_id: app-sidekick
artifact_id: transcription-2026-05-13-director
view_reason: linked-library-artifact
path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

Dette er samme artefakt i tre ulike visningssammenhenger.

### Høyrepanel i kontekstvisningsmodellen

Høyrepanelet bør ikke bare vise filmetadata. Det bør også forklare valgt visning.

For en bibliotekfil valgt fra prosjektvisningen bør panelet kunne vise:

```text
Fil: 2026-05-13 intervju med direktør.md
Fysisk plassering: Bibliotek/Transkripsjoner/
Vises her fordi: Koblet til Strategi
Koblet til: Strategi, Operasjon, Sidekick
Kilde i denne visningen: Fra bibliotek
```

For samme fil valgt i mappevisningen bør panelet kunne vise:

```text
Fil: 2026-05-13 intervju med direktør.md
Fysisk plassering: Bibliotek/Transkripsjoner/
Vises her fordi: Ligger i denne mappen
Koblet til: Strategi, Operasjon, Sidekick
Kilde i denne visningen: Fysisk fil
```

Dette krever at renderer ikke bare får en filsti. Den må få valgt visningskontekst fra main process eller en trygg delt modell:

```yaml
selected_artifact_id: transcription-2026-05-13-director
selected_context_view: projects
selected_context_id: project-strategy
view_reason: linked-library-artifact
```

Uten denne informasjonen kan ikke Sidekick forklare hvorfor samme fil vises på ulike steder.

### Prosjektvisning

En prosjektvisning bør samle:

- prosjektfiler som fysisk ligger under prosjektmappen;
- prosjektspesifikke applikasjonsfiler som ligger under prosjektet;
- bibliotekfiler som er koblet til prosjektet i metadata;
- Sidekick-genererte artefakter for prosjektet, for eksempel prosjektoppsummering eller relasjonsrapport.

Prosjektvisningen må merke kilden tydelig:

- `Ligger i prosjektet`
- `Applikasjon i prosjektet`
- `Koblet fra bibliotek`
- `Generert av Sidekick`

### Applikasjonsvisning

En applikasjonsvisning bør samle:

- applikasjonsgenerelle filer som fysisk ligger under `Applikasjoner/<Applikasjon>/`;
- prosjektspesifikke applikasjonsfiler som ligger under `Prosjekter/<Prosjekt>/Applikasjoner/<Applikasjon>/`;
- bibliotekfiler som er koblet til applikasjonen;
- Sidekick-genererte artefakter for applikasjonen, for eksempel applikasjonssammendrag eller relasjonsrapport.

Applikasjonsvisningen må merke kilden tydelig:

- `Generelle applikasjonsfiler`
- `Fra prosjekt`
- `Koblet fra bibliotek`
- `Generert av Sidekick`

Dette gjør at en applikasjon kan ha sin egen kunnskapsbase samtidig som Sidekick viser hvordan applikasjonen brukes i ulike prosjekter.

### Artefaktdetaljer

Når brukeren velger en fil, bør Sidekick kunne vise:

- fysisk sti;
- artefakttype;
- kontekster, for eksempel prosjekt, applikasjon eller tema;
- temaer;
- deltakere eller dato der det er relevant;
- om metadata kommer fra Sidekick-indeks eller filens egen frontmatter;
- om filen er prosjektspesifikk, applikasjonsgenerell, prosjektspesifikk applikasjonsdokumentasjon eller delt.

### Import av transkripsjon

For transkripsjoner bør Sidekick etter hvert støtte to importmål:

- importer til valgt prosjektmappe;
- importer til felles transkripsjonsbibliotek og koble til ett eller flere prosjekter, applikasjoner eller temaer.

I den kontekstbaserte modellen bør felles bibliotek være standard for transkripsjoner som kan være relevante for flere kontekster. Prosjektlokal import kan fortsatt være nødvendig for materiale som faktisk bare hører til ett prosjekt.

### Kontekstpakker

Kontekstpakker må kunne bygges fra en definert kontekst, ikke bare en fysisk mappe.

Før den kontekstbaserte modellen:

```text
kontekstpakke = alle relevante filer under valgt prosjektmappe
```

Med den kontekstbaserte modellen:

```text
kontekstpakke = prosjektfiler + bibliotekfiler koblet til prosjektet
```

For en applikasjonskontekst:

```text
kontekstpakke = applikasjonsfiler + prosjektspesifikke applikasjonsfiler + bibliotekfiler koblet til applikasjonen
```

En kontekstpakke bør forklare inkludering per fil:

| Fil | Inkludert fordi |
| --- | --- |
| `Prosjekter/Strategi/00. Retning/2026-05-15 strategiske veivalg.md` | Fysisk ligger i Strategi |
| `Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md` | Koblet til Strategi |
| `Applikasjoner/Sidekick/01. Arkitektur/datamodell.md` | Fysisk ligger i Sidekick-applikasjonen |
| `Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md` | Sidekick-dokumentasjon i Operasjon-prosjektet |

Dette er viktig for tillit. Brukeren må se hvorfor en bibliotekfil blir med.

### Sammendrag

Sammendrag bør være knyttet til både kildeartefakt og kontekst.

For en transkripsjon som er koblet til både Strategi og Operasjon finnes det minst to mulige behov:

- et generelt samtalesammendrag av transkripsjonen;
- en prosjektspesifikk vurdering av hva transkripsjonen betyr for Strategi eller Operasjon.
- en applikasjonsspesifikk vurdering av hva transkripsjonen betyr for Sidekick, hvis transkripsjonen også er koblet til applikasjonen.

Første steg i den kontekstbaserte modellen bør skille disse tydelig:

- `transcription-summary`: oppsummerer selve samtalen, uavhengig av prosjekt;
- `project-relevance-summary`: forklarer hvorfor artefakten er relevant for et bestemt prosjekt, hvis dette senere bygges.
- `application-relevance-summary`: forklarer hvorfor artefakten er relevant for en bestemt applikasjon, hvis dette senere bygges.

Dette unngår at samme transkripsjon får uklart eierskap til sammendrag.

### Søk

Den kontekstbaserte modellen øker behovet for lokal indeks.

Søk bør etter hvert kunne filtrere på:

- prosjekt;
- applikasjon;
- konteksttype;
- fysisk plassering;
- artefakttype;
- tema;
- deltakere;
- dato;
- om filen er prosjektfil eller koblet bibliotekfil.

Første versjoner kan fortsatt indeksere valgt fysisk prosjektmappe. Men metadata og lagringsvalg bør ikke hindre senere arbeidsområde- eller bibliotekindeks.

## Markdown-editor-perspektiv

Brukeren kan bruke et annet verktøy til å skrive og lese Markdown. Sidekick skal ikke kreve at brukeren bruker Sidekick som hovededitor.

Fra Markdown-editor-perspektivet må arbeidsområdet fortsatt være forståelig.

### Prosjektspesifikke dokumenter

For vanlige prosjektdokumenter skal brukeren kunne gjøre dette uten Sidekick:

```text
Arbeidsområde/Prosjekter/Strategi/00. Retning/2026-05-15 strategiske veivalg.md
```

Brukeren bør forstå at filen hører til Strategi fordi den fysisk ligger under Strategi.

Det skal ikke være nødvendig å skrive Sidekick-metadata i filen for at den skal være en gyldig strategifil.

### Applikasjonsgenerelle dokumenter

For dokumenter som beskriver en applikasjon uavhengig av ett prosjekt, skal brukeren kunne gjøre dette uten Sidekick:

```text
Arbeidsområde/Applikasjoner/Sidekick/01. Arkitektur/datamodell.md
```

Brukeren bør forstå at filen handler om Sidekick-applikasjonen fordi den fysisk ligger under `Applikasjoner/Sidekick/`.

### Prosjektspesifikke applikasjonsdokumenter

For dokumenter som beskriver en applikasjon i et prosjekt, skal brukeren kunne gjøre dette:

```text
Arbeidsområde/Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md
```

Brukeren bør forstå to ting fra filstien:

- filen hører til Operasjon-prosjektet;
- filen handler om Sidekick-applikasjonen i Operasjon-prosjektets kontekst.

Dette er et viktig eksempel på implicit kontekst fra fysisk struktur. Sidekick kan lese både prosjekt og applikasjon fra mappene.

### Delte artefakter

For delte artefakter er det mer metadataavhengighet:

```text
Arbeidsområde/Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
```

I en ren Markdown-editor ser brukeren at filen er en transkripsjon, men ikke nødvendigvis at den er koblet til Strategi og Operasjon.

Derfor bør metadata som er viktig for menneskelig forståelse vurderes i filen eller i et synlig Sidekick-dokument. Metadata som primært er teknisk eller intern bør ligge i `.sidekick/`.

### Frontmatter

Frontmatter kan være nyttig for Sidekick-produserte Markdown-filer og for metadata brukeren forventer å se i editoren.

Eksempel:

```markdown
---
type: transkripsjon
date: 2026-05-13
participants:
  - Direktør
---

# Intervju med direktør
```

Men Sidekick bør være forsiktig med å skrive konteksttilknytninger inn i brukerens eksisterende filer automatisk.

Prosjekttilknytning kan være bedre i `.sidekick/content-index.yml` i første versjon, fordi:

- det fungerer for alle filtyper;
- det unngår konflikt med eksisterende frontmatter;
- det gjør metadata lettere å reparere fra Sidekick;
- det skiller brukerinnhold fra Sidekick-organisering.

### Hva editorbrukeren må kunne gjøre

En bruker som jobber i en Markdown-editor bør kunne:

- opprette nye prosjektspesifikke dokumenter i prosjektmapper;
- lese transkripsjoner i biblioteket;
- redigere innhold uten å ødelegge Sidekick;
- se nok struktur i filsystemet til å forstå arbeidsområdet;
- la Sidekick oppdatere koblinger og indekser senere.

Brukeren bør ikke måtte:

- forstå interne artefakt-ID-er;
- redigere `content-index.yml` manuelt;
- vite nøyaktig hvordan Sidekick bygger prosjektvisninger;
- flytte delte filer manuelt for å få dem inn i flere prosjekter.

## Generelt brukerperspektiv

Fra brukerens perspektiv bør den kontekstbaserte modellen kjennes enkel:

- Prosjektfiler ligger i prosjektet.
- Applikasjonsfiler ligger i applikasjonen.
- Applikasjonsfiler i et prosjekt ligger under prosjektet.
- Felles materiale ligger i biblioteket.
- Sidekick kan koble felles materiale til ett eller flere prosjekter, applikasjoner eller temaer.
- Prosjekt- og applikasjonsvisninger viser både egne filer og koblet materiale.
- Sidekick forklarer hvorfor en fil vises.

### Brukerhistorier

#### Importere delt transkripsjon

1. Brukeren importerer `2026-05-13 intervju med direktør.md`.
2. Sidekick foreslår felles transkripsjonsbibliotek fordi filen kan være relevant for flere prosjekter.
3. Brukeren velger `Strategi` og `Operasjon`.
4. Sidekick lagrer transkripsjonen i biblioteket.
5. Sidekick oppdaterer konteksttilknytning i `.sidekick/content-index.yml`.
6. Transkripsjonen vises under begge prosjekter som `Koblet fra bibliotek`.

#### Opprette prosjektspesifikt dokument

1. Brukeren lager `2026-05-15 strategiske veivalg.md` i `Prosjekter/Strategi/00. Retning/`.
2. Sidekick skanner arbeidsområdet.
3. Sidekick viser dokumentet i Strategi som `Ligger i prosjektet`.
4. Ingen eksplisitt konteksttilknytning er nødvendig.

#### Opprette applikasjonsgenerelt dokument

1. Brukeren lager `datamodell.md` i `Applikasjoner/Sidekick/01. Arkitektur/`.
2. Sidekick skanner arbeidsområdet.
3. Sidekick viser dokumentet i `Applikasjon: Sidekick` som `Generelle applikasjonsfiler`.
4. Ingen eksplisitt applikasjonstilknytning er nødvendig.

#### Opprette applikasjonsdokument i prosjekt

1. Brukeren lager `krav.md` i `Prosjekter/Operasjon/Applikasjoner/Sidekick/`.
2. Sidekick skanner arbeidsområdet.
3. Sidekick viser dokumentet i `Prosjekt: Operasjon` under `Applikasjoner i prosjektet`.
4. Sidekick viser også dokumentet i `Applikasjon: Sidekick` under `Prosjektkontekster / Operasjon`.
5. Ingen eksplisitt metadata er nødvendig for første visning fordi konteksten kan leses fra filstien.

#### Lage kontekstpakke for Strategi

1. Brukeren velger Strategi.
2. Brukeren starter kontekstpakke.
3. Sidekick viser preview med prosjektfiler og koblede bibliotekfiler.
4. Sidekick forklarer hvorfor hver fil er inkludert.
5. Brukeren bekrefter.
6. Sidekick skriver kontekstpakke med metadata om scope.

#### Lage kontekstpakke for Sidekick-applikasjonen

1. Brukeren velger `Applikasjon: Sidekick`.
2. Brukeren starter kontekstpakke.
3. Sidekick viser preview med generelle applikasjonsfiler, prosjektspesifikke Sidekick-filer og eventuelle koblede bibliotekfiler.
4. Sidekick forklarer hvorfor hver fil er inkludert.
5. Brukeren bekrefter.
6. Sidekick skriver kontekstpakke med metadata om applikasjonsscope.

#### Rette feil konteksttilknytning

1. Brukeren ser at intervjuet er koblet til Operasjon, men ikke Strategi.
2. Brukeren åpner artefaktdetaljer.
3. Brukeren legger til Strategi som konteksttilknytning.
4. Sidekick oppdaterer `content-index`.
5. Intervjuet vises i Strategi uten at filen flyttes.

### Brukerens mentale modell

Den ønskede mentale modellen er:

```text
Prosjektet mitt har egne filer.
Applikasjonen min har egne filer.
Prosjektet kan ha dokumenter om en applikasjon.
Biblioteket har felles filer.
Sidekick kan koble felles filer til flere kontekstvisninger.
```

Modellen bør ikke kreve at brukeren tenker:

```text
Alle filer er databaseobjekter, og mapper betyr egentlig ingenting.
```

Det er hovedgrunnen til at den kontekstbaserte modellen foretrekkes fremfor et rent prosjektuavhengig bibliotek.

## Filstruktur

En mulig standardstruktur:

```text
Arbeidsområde/
  Prosjekter/
    Strategi/
    Operasjon/
  Applikasjoner/
    Sidekick/
  Bibliotek/
    Transkripsjoner/
    Bakgrunnsdokumenter/
    Felles notater/
  00. Innboks/
  .sidekick/
    workspace.md
    content-index.yml
    summaries/
    context-packages/
    search-index/
```

### Prosjekter

`Prosjekter/` inneholder fysiske prosjektmapper.

Prosjektmapper kan fortsatt ha fri intern struktur:

```text
Prosjekter/Strategi/
  00. Retning/
  01. Beslutninger/
  02. Arbeidsnotater/
  Applikasjoner/
    Sidekick/
```

Sidekick bør ikke kreve ett bestemt prosjektskjema for alle prosjekter.

### Applikasjoner

`Applikasjoner/` inneholder dokumentasjon om applikasjoner som selvstendige objekter.

Eksempel:

```text
Applikasjoner/Sidekick/
  00. Produkt/
  01. Arkitektur/
  02. Roadmap/
```

Denne mappen bør inneholde dokumenter som gjelder Sidekick uavhengig av ett bestemt prosjekt.

### Applikasjoner inne i prosjekter

Prosjekter kan ha egne applikasjonsmapper:

```text
Prosjekter/Operasjon/
  Applikasjoner/
    Sidekick/
      krav.md
      innforingsplan.md
      risiko.md
```

Dette er prosjektspesifikk dokumentasjon om en applikasjon.

Sidekick bør tolke denne plasseringen som to samtidige kontekster:

- prosjekt: Operasjon;
- applikasjon: Sidekick.

### Bibliotek

`Bibliotek/` inneholder gjenbrukbare artefakter.

Første relevante bibliotektype er transkripsjoner:

```text
Bibliotek/Transkripsjoner/
```

Senere kan det utvides med:

- bakgrunnsdokumenter;
- felles notater;
- referansemateriale;
- bilder eller presentasjoner.

### Innboks

`00. Innboks/` kan brukes for uklassifiserte filer.

Sidekick kan senere tilby en klassifiseringsflyt:

- flytt til prosjekt;
- flytt til bibliotek;
- koble til prosjekt;
- la filen være uklassifisert.

### .sidekick

`.sidekick/` er Sidekick sitt område for generert metadata og organiseringsdata.

Det bør ikke være nødvendig for brukeren å redigere dette manuelt.

Det bør være trygt å slette noe av innholdet hvis Sidekick kan regenerere det, men ikke alt vil være regenererbart.

Derfor bør `.sidekick/` skille mellom:

- rebuildable cache;
- genererte rapporter;
- brukerbekreftede koblinger.

## Metadata

### Anbefalt første retning

Første versjon av den kontekstbaserte modellen bør bruke sentral metadataindeks under `.sidekick/`.

Anbefalt fil:

```text
.sidekick/content-index.yml
```

Dette gir Sidekick kontrollert metadata uten å skrive i brukerens egne innholdsfiler.

### Eksempel på content-index

```yaml
sidekick_schema: content-index.v1
workspace:
  name: Organisasjonsutvikling
  root: .
contexts:
  - id: project-strategy
    type: project
    name: Strategi
    path: Prosjekter/Strategi
  - id: project-operations
    type: project
    name: Operasjon
    path: Prosjekter/Operasjon
  - id: app-sidekick
    type: application
    name: Sidekick
    path: Applikasjoner/Sidekick
artifacts:
  - id: transcription-2026-05-13-director
    type: transcription
    path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    title: Intervju med direktør
    contexts:
      - id: project-strategy
        type: project
        source: explicit
      - id: project-operations
        type: project
        source: explicit
      - id: app-sidekick
        type: application
        source: explicit
    topics:
      - strategi
      - operasjon
    participants:
      - Direktør
    date: 2026-05-13
    content_sha256: "<hash>"
  - id: strategy-choices-2026-05-15
    type: document
    path: Prosjekter/Strategi/00. Retning/2026-05-15 strategiske veivalg.md
    title: Strategiske veivalg
    contexts:
      - id: project-strategy
        type: project
        source: implicit-path
    content_sha256: "<hash>"
  - id: operating-model-2026-05-14
    type: document
    path: Prosjekter/Operasjon/00. Leveranse/2026-05-14 operasjonsmodell.md
    title: Operasjonsmodell
    contexts:
      - id: project-operations
        type: project
        source: implicit-path
    content_sha256: "<hash>"
  - id: sidekick-data-model
    type: document
    path: Applikasjoner/Sidekick/01. Arkitektur/datamodell.md
    title: Datamodell
    contexts:
      - id: app-sidekick
        type: application
        source: implicit-path
    content_sha256: "<hash>"
  - id: operations-sidekick-requirements
    type: document
    path: Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md
    title: Krav til Sidekick i Operasjon
    contexts:
      - id: project-operations
        type: project
        source: implicit-path
      - id: app-sidekick
        type: application
        source: implicit-path
    content_sha256: "<hash>"
```

### Metamodell for kontekstvisninger

Kontekstvisningen krever at Sidekick skiller mellom lagringsdata, kontekstdata og visningsdata.

Metamodellen i dette dokumentet er et konseptuelt beslutningsgrunnlag, ikke et ferdig databaseskjema eller en låst filkontrakt. Den beskriver hvilke begreper systemet må kunne uttrykke for at kontekstvisninger skal fungere.

En mulig modell:

```yaml
artifacts:
  - id: transcription-2026-05-13-director
    type: transcription
    path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    title: Intervju med direktør
    content_sha256: "<hash>"

contexts:
  - id: project-strategy
    type: project
    name: Strategi
    path: Prosjekter/Strategi
  - id: project-operations
    type: project
    name: Operasjon
    path: Prosjekter/Operasjon
  - id: app-sidekick
    type: application
    name: Sidekick
    path: Applikasjoner/Sidekick

artifact_contexts:
  - artifact_id: transcription-2026-05-13-director
    context_id: project-strategy
    context_type: project
    source: explicit
  - artifact_id: transcription-2026-05-13-director
    context_id: project-operations
    context_type: project
    source: explicit
  - artifact_id: transcription-2026-05-13-director
    context_id: app-sidekick
    context_type: application
    source: explicit
```

Dette er mer normalisert enn eksempelet over, men viser et viktig poeng:

- `artifacts` beskriver filer;
- `contexts` beskriver prosjekter, applikasjoner og andre kontekster;
- `artifact_contexts` beskriver koblinger mellom filer og kontekster.

Denne tredelingen bør være stabil som konsept selv om første implementering velger en enklere lagringsform.

Sidekick kan deretter bygge kontekstvisninger fra disse dataene:

```yaml
context_view_rows:
  - context_view: folders
    artifact_id: transcription-2026-05-13-director
    display_path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    view_reason: physical-location
  - context_view: projects
    context_id: project-strategy
    artifact_id: transcription-2026-05-13-director
    display_group: Fra bibliotek
    view_reason: linked-library-artifact
  - context_view: projects
    context_id: project-operations
    artifact_id: transcription-2026-05-13-director
    display_group: Fra bibliotek
    view_reason: linked-library-artifact
  - context_view: applications
    context_id: app-sidekick
    artifact_id: transcription-2026-05-13-director
    display_group: Koblede bibliotekfiler
    view_reason: linked-library-artifact
```

`context_view_rows` trenger ikke nødvendigvis lagres. De kan bygges fra scan og `content-index`. Men begrepet er nyttig fordi UI-et trenger denne informasjonen for å forklare visningen.

Dette betyr at `context_view_rows` bør forstås som en avledet visningsmodell, ikke som primærdata. Primærdata er artefakter, kontekster og koblinger.

### Metadataregler

Foreslåtte regler:

- `path` skal være relativ til arbeidsområderoten.
- Artefakt-ID skal være stabil nok til koblinger, men ikke avhenge blindt av filnavn alene.
- `content_sha256` kan brukes til stale-detection og flytte-/rename-hjelp.
- Filer under prosjektmapper kan få prosjektkontekst fra fysisk plassering.
- Filer under `Applikasjoner/<Applikasjon>/` kan få applikasjonskontekst fra fysisk plassering.
- Filer under `Prosjekter/<Prosjekt>/Applikasjoner/<Applikasjon>/` kan få både prosjekt- og applikasjonskontekst fra fysisk plassering.
- Filer i bibliotek må ha eksplisitt konteksttilknytning for å vises i prosjekt- eller applikasjonsvisninger.
- Bibliotekfiler som skal vises i applikasjonsvisninger må ha eksplisitt applikasjonstilknytning.
- Metadata bør på sikt bruke `contexts`, ikke bare `projects`.
- Hver kontekstkobling bør kunne si om den kommer fra `implicit-path`, `explicit`, `frontmatter` eller en annen kilde.
- Hver visningsrad bør kunne forklare `view_reason`, for eksempel `physical-location`, `physical-project-file`, `physical-application-file`, `project-application-file` eller `linked-library-artifact`.
- UI-et bør ikke beregne `view_reason` fra rå sti alene når metadata finnes. Main process eller en delt domenemodell bør produsere dette deterministisk.
- Sidekick bør tåle ekstra metadatafelt.
- Ukjente metadatafelt bør ignoreres, ikke ødelegge parsing.

### Frontmatter eller indeks

Anbefalt førstevalg:

- `.sidekick/content-index.yml` for Sidekick-organisering og konteksttilknytning.
- Frontmatter bare når metadata er nyttig for mennesker eller Sidekick selv produserer filen.

Eksempel på frontmatter som kan være greit:

```markdown
---
type: transkripsjon
date: 2026-05-13
participants:
  - Direktør
---
```

Eksempel på metadata som først bør ligge i Sidekick-indeks:

```yaml
contexts:
  - id: project-strategy
    type: project
  - id: project-operations
    type: project
  - id: app-sidekick
    type: application
```

Begrunnelse: konteksttilknytning er organisering på arbeidsområdenivå. Det kan endre seg uten at samtaleteksten eller dokumentinnholdet endres.

## Konsekvenser for GUI

GUI-et må gjøre den kontekstbaserte modellen eksplisitt uten å gjøre den tung.

Kontekstvisnings-prototypen viser en egnet grunnstruktur:

```text
Topp: valgt arbeidsområde
Midt: kontekstvisningsvelger og liste/tree
Høyre: detaljer for valgt artefakt i valgt visningskontekst
Bunn: handlinger for valgt arbeidsområde eller valgt artefakt
```

Det viktigste er at midtpanelet kan bytte kontekstvisning uten at arbeidsområdet eller filene endres.

### Nødvendige visninger

Første fullverdige kontekstbaserte modell trenger minst:

- prosjektvisning;
- applikasjonsvisning;
- mappevisning;
- bibliotekvisning;
- artefaktdetaljer.

### Mappevisning

Mappevisningen viser fysisk diskstruktur.

Den bør:

- vise filer der de faktisk ligger;
- vise `.sidekick/` som Sidekick-eid metadataområde eller skjule det avhengig av valgt modus;
- ikke vise bibliotekfiler som om de lå inne i prosjektmapper;
- la brukeren velge en fil og se konteksttilknytninger i høyrepanelet.

Denne kontekstvisningen svarer på spørsmålet:

```text
Hvor ligger filen?
```

### Prosjektvisning

Prosjektvisningen bør gruppere innhold:

```text
Prosjektfiler
Koblede bibliotekfiler
Generert av Sidekick
```

Dette er viktigere enn å vise alt i én flat liste.

Denne kontekstvisningen svarer på spørsmålet:

```text
Hva hører til dette prosjektet?
```

Prosjektvisningen bør ikke skjule at noen filer ligger utenfor prosjektmappen. Bibliotekfiler bør merkes som `Fra bibliotek`, slik prototypen gjør.

### Applikasjonsvisning

Applikasjonsvisningen bør gruppere innhold:

```text
Generelle applikasjonsfiler
Prosjektkontekster
Koblede bibliotekfiler
Generert av Sidekick
```

Dette gjør at brukeren kan forstå applikasjonen på tvers av prosjekter.

Denne kontekstvisningen svarer på spørsmålet:

```text
Hva hører til denne applikasjonen?
```

Applikasjonsvisningen bør skille mellom:

- filer som beskriver applikasjonen generelt;
- filer som beskriver applikasjonen i et prosjekt;
- bibliotekfiler koblet til applikasjonen.

### Mappevisning

Mappevisningen viser disk slik den faktisk er.

Den skal ikke late som bibliotekfiler fysisk ligger i prosjektmappen.

### Bibliotekvisning

Bibliotekvisningen viser delte artefakter.

For hvert artefakt bør brukeren se:

- hvilke kontekster det er koblet til;
- om det mangler konteksttilknytning;
- type, dato og eventuelle deltakere.

### Artefaktdetaljer

Artefaktdetaljer bør være stedet der brukeren kan forstå og senere endre koblinger.

Før redigering bygges, kan panelet være read-only:

```text
Fysisk plassering: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
Type: Transkripsjon
Koblet til: Strategi, Operasjon, Sidekick
Tema: strategi, operasjon
```

Når artefaktet er valgt fra en kontekstvisning, bør panelet også vise visningsforklaring:

```text
Valgt kontekstvisning: Prosjekter
Valgt kontekst: Strategi
Vises her fordi: Koblet fra bibliotek
```

For samme fil valgt fra Mappevisningen kan forklaringen være:

```text
Valgt kontekstvisning: Mapper
Vises her fordi: Ligger fysisk i Bibliotek/Transkripsjoner/
```

Dette er ikke bare hjelpetekst. Det er en del av produktmodellen. Hvis Sidekick ikke kan forklare hvorfor en fil vises i en kontekstvisning, er metadata- eller scanmodellen for svak.

### Handlinger i kontekstvisninger

Handlinger bør avhenge av valgt artefakt og valgt kontekstvisning.

Eksempel:

| Valgt kontekstvisning | Valgt fil | Mulig handling |
| --- | --- | --- |
| Mapper | Prosjektfil | Åpne fil, vis i prosjekt |
| Prosjekter / Strategi | Prosjektfil | Åpne fil, generer kontekstpakke for Strategi |
| Prosjekter / Strategi | Bibliotekfil | Åpne fil, fjern kobling fra Strategi, vis i bibliotek |
| Applikasjoner / Sidekick | Applikasjonsfil | Åpne fil, generer kontekstpakke for Sidekick |
| Applikasjoner / Sidekick | Prosjektspesifikk applikasjonsfil | Åpne fil, vis prosjektkontekst |

Dette krever at valgt state inneholder både artefakt og kontekstvisning:

```yaml
selection:
  artifact_id: transcription-2026-05-13-director
  context_view: projects
  context_id: project-strategy
  view_reason: linked-library-artifact
```

## Konsekvenser for sikkerhet og Electron-grenser

Den kontekstbaserte modellen endrer ikke Sidekick sine grunnleggende sikkerhetsregler.

Den gjør path-validering viktigere.

Main process må eie:

- lesing av `.sidekick/content-index.yml`;
- skriving av `.sidekick/content-index.yml`;
- scanning av prosjektmapper, applikasjonsmapper og bibliotek;
- validering av at filer ligger innenfor arbeidsområdet;
- bygging av trygge kontekstvisningsmodeller for renderer;
- forklaring av `view_reason` når den bygger på filesystem og metadata;
- generering av kontekstpakker;
- Codex-kjøring;
- skriving av genererte sammendrag og rapporter.

Renderer skal bare bruke typed APIs.

Renderer skal ikke få:

- raw filesystem access;
- raw IPC;
- raw shell/process access;
- mulighet til å sende vilkårlige output paths uten main-process-validering.

Renderer bør heller ikke være eneste kilde til sannhet for:

- hvilke filer som hører til en kontekst;
- hvorfor en fil vises i en kontekstvisning;
- hvilken fysisk fil en logisk rad peker på;
- hvilke handlinger som er tillatt for valgt rad.

Path-validering må støtte flere godkjente røtter innenfor samme arbeidsområde:

- arbeidsområderot;
- prosjektmapper;
- applikasjonsmapper;
- bibliotekmapper;
- `.sidekick/` for Sidekick-genererte data.

## Konsekvenser for eksisterende og kommende features

### Transkripsjonsimport

Dagens prosjektlokale import bør kunne fortsette.

Den kontekstbaserte modellen legger til en fremtidig importvariant:

- importer til felles transkripsjonsbibliotek;
- koble til ett eller flere prosjekter, applikasjoner eller temaer;
- vis transkripsjonen i relevante kontekstvisninger uten duplisering.

### Transkripsjonssammendrag

Sammendrag bør lagres som Sidekick-metadata, ikke i transkripsjonsmappen.

Generelt samtalesammendrag bør knyttes til artefakten:

```text
.sidekick/summaries/transcriptions/<artifact-id>.summary.md
```

Prosjektspesifikk relevans bør være en egen artefakt hvis det bygges senere:

```text
.sidekick/summaries/project-relevance/<project-id>/<artifact-id>.summary.md
```

Applikasjonsspesifikk relevans bør være en egen artefakt hvis det bygges senere:

```text
.sidekick/summaries/application-relevance/<application-id>/<artifact-id>.summary.md
```

Dette skiller mellom:

- hva samtalen handler om;
- hvorfor samtalen er relevant for et bestemt prosjekt;
- hvorfor samtalen er relevant for en bestemt applikasjon.

### Prosjektsammendrag

Prosjektsammendrag bør på sikt kunne bygge på:

- filer fysisk under prosjektmappen;
- bibliotekfiler koblet til prosjektet;
- relevante Sidekick-genererte sammendrag;
- eventuelle relasjonsrapporter.

Metadata bør derfor inneholde `source_model` eller tilsvarende:

```yaml
source_model: context-based-workspace
source_scope: logical-project
project_id: project-strategy
```

### Applikasjonssammendrag

Applikasjonssammendrag kan på sikt bygge på:

- filer fysisk under `Applikasjoner/<Applikasjon>/`;
- prosjektspesifikke filer under `Prosjekter/<Prosjekt>/Applikasjoner/<Applikasjon>/`;
- bibliotekfiler koblet til applikasjonen;
- relevante Sidekick-genererte sammendrag og relasjonsrapporter.

Metadata bør kunne skille applikasjonsscope fra prosjektscope:

```yaml
source_model: context-based-workspace
source_scope: logical-application
application_id: app-sidekick
```

### Kontekstpakker

Kontekstpakker bør få eksplisitt scope:

```yaml
source_model: context-based-workspace
source_scope: logical-project
project_id: project-strategy
included_sources:
  - path: Prosjekter/Strategi/00. Retning/2026-05-15 strategiske veivalg.md
    reason: physical-project-file
  - path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    reason: linked-library-artifact
```

For applikasjonskontekst:

```yaml
source_model: context-based-workspace
source_scope: logical-application
application_id: app-sidekick
included_sources:
  - path: Applikasjoner/Sidekick/01. Arkitektur/datamodell.md
    reason: physical-application-file
  - path: Prosjekter/Operasjon/Applikasjoner/Sidekick/krav.md
    reason: project-application-file
  - path: Bibliotek/Transkripsjoner/2026-05-13 intervju med direktør.md
    reason: linked-library-artifact
```

### Relasjoner mellom dokumenter

Relasjonsanalyse bør skille mellom:

- relasjoner innenfor fysisk prosjektmappe;
- relasjoner mellom prosjektfiler og koblede bibliotekfiler;
- relasjoner innenfor en applikasjon;
- relasjoner mellom applikasjonsgenerelle filer og prosjektspesifikke applikasjonsfiler;
- relasjoner på tvers av logiske prosjekter.
- relasjoner på tvers av konteksttyper, for eksempel prosjekt, applikasjon og tema.

Første versjoner kan fortsatt være fysisk prosjektbasert, men rapportformat bør ikke gjøre dette irreversibelt.

### Søk og indeks

Søk bør etter hvert støtte arbeidsområdeindeks.

Første steg kan fortsatt være prosjektlokal indeks:

```text
.sidekick/search-index/
```

Men fremtidig kontekstbasert modell kan kreve:

```text
.sidekick/search-index/workspace/
```

Søkeresultater bør kunne filtreres på:

- fysisk plassering;
- prosjekt;
- applikasjon;
- konteksttype;
- bibliotek;
- artefakttype;
- tema;
- dato;
- deltakere.

## Recovery og feiltilstander

Den kontekstbaserte modellen må være robust når filer og metadata kommer ut av sync.

### Hvis `.sidekick/` mangler

Sidekick bør fortsatt kunne:

- åpne arbeidsområdet som vanlige mapper;
- skanne prosjektmapper;
- skanne applikasjonsmapper;
- vise mappevisning.

Sidekick mister:

- konteksttilknytninger for bibliotekfiler;
- koblinger;
- noen sammendrag;
- indekser;
- logiske prosjekt- og applikasjonsvisninger.

Sidekick bør kunne tilby:

- opprett ny `.sidekick/`;
- importer eksisterende struktur;
- skann prosjektmapper, applikasjonsmapper og bibliotek, og be bruker klassifisere der Sidekick ikke kan utlede kontekst.

### Hvis en fil flyttes

Sidekick kan forsøke å gjenkjenne flyttet fil ved:

- tidligere sti;
- filnavn;
- `content_sha256`;
- størrelse;
- tittel/frontmatter hvis tilgjengelig.

Hvis match er usikker, bør Sidekick be brukeren bekrefte.

### Hvis metadata peker på en fil som ikke finnes

Sidekick bør vise koblingen som brutt, ikke slette den automatisk.

Mulige handlinger:

- finn fil;
- fjern kobling;
- marker som arkivert;
- ignorer midlertidig.

### Hvis en bibliotekfil mangler konteksttilknytning

Sidekick bør vise den som uklassifisert bibliotekfil.

Mulige handlinger:

- koble til prosjekt;
- koble til applikasjon;
- koble til tema;
- la være uklassifisert;
- flytt til prosjekt;
- flytt til applikasjon;
- arkiver.

## Gradvis innføring

Den kontekstbaserte modellen bør innføres trinnvis.

### Trinn 1: Bevar dagens prosjektmodell

Ingen produktendring i brukerens mentale modell.

Teknisk bør nye genererte metadata få felter som ikke låser dem til fysisk prosjekt for alltid:

```yaml
source_model: physical-project-folder
source_scope: full-project
```

Der det er naturlig, bør nye artefakter også kunne bruke mer generiske felt:

```yaml
source_model: context-based-workspace
source_scope: logical-context
context:
  type: project
  id: project-strategy
```

### Trinn 2: Samle Sidekick-metadata i `.sidekick/`

Sammendrag, rapporter, indekser og pakkehistorikk bør ligge under `.sidekick/`.

Dette etablerer Sidekick sitt metadataområde.

### Trinn 3: Introduser arbeidsområdebegrep internt

Sidekick kan internt skille mellom:

- project root;
- application root;
- workspace root;
- sidekick metadata root.

Dette kan gjøres før GUI-et viser full workspace-modell.

### Trinn 4: Vis konteksttilknytning read-only

For utvalgte artefakter, særlig transkripsjoner, kan Sidekick vise:

- fysisk plassering;
- koblede kontekster;
- type og metadata.

### Trinn 5: Introduser applikasjonskontekst read-only

Sidekick kan vise applikasjonsmapper og prosjektspesifikke applikasjonsmapper som en egen applikasjonsvisning:

```text
Applikasjon: Sidekick
```

Første versjon kan være read-only og basert på fysisk struktur.

### Trinn 6: Tillat felles transkripsjonsbibliotek

Brukeren kan velge eller opprette et felles transkripsjonsbibliotek.

Sidekick kan importere transkripsjoner dit og koble dem til prosjekter, applikasjoner eller temaer.

### Trinn 7: Bygg logiske prosjekt- og applikasjonspakker

Kontekstpakker og sammendrag kan bygges fra logiske kontekster.

```text
prosjektmappe + koblede bibliotekfiler
```

```text
applikasjonsmappe + prosjektspesifikke applikasjonsfiler + koblede bibliotekfiler
```

## Viktige åpne beslutninger

Før implementering må disse spørsmålene avklares:

1. Skal `content-index` være YAML, JSON eller Markdown med frontmatter?
2. Hvordan skal artefakt-ID-er genereres og bevares ved rename/flytting?
3. Skal felles bibliotek være under samme arbeidsområderot, eller kan det ligge utenfor?
4. Skal Sidekick tillate flere biblioteker?
5. Skal prosjekter være mapper, metadataobjekter, eller begge deler?
6. Skal applikasjoner være mapper, metadataobjekter, eller begge deler?
7. Skal metadata bruke `projects` som spesialfelt, eller en generell `contexts`-modell?
8. Hvor mye metadata skal Sidekick skrive inn i brukerens Markdown-filer?
9. Hvordan skal GUI-et la brukeren endre konteksttilknytning?
10. Hvordan skal tilgang og path-validering fungere hvis bibliotek eller applikasjonsmapper ligger utenfor prosjektmappen?
11. Skal kontekstpakker fra logiske kontekster skrives i prosjektmappen, applikasjonsmappen eller under `.sidekick/`?
12. Hvordan håndteres to prosjekter som trenger ulike vurderinger av samme transkripsjon?
13. Hvordan håndteres én applikasjon som har generell dokumentasjon og flere prosjektspesifikke dokumentsett?

## Anbefalte beslutninger nå

Følgende beslutninger kan tas før implementering:

1. Den kontekstbaserte innholdsmodellen er ønsket langsiktig retning.
2. Dagens prosjektmappemodell beholdes som første brukeropplevelse.
3. Delte transkripsjoner er første kandidat for felles bibliotek.
4. `.sidekick/` er anbefalt sted for Sidekick-organisering og koblingsmetadata.
5. `Applikasjon` bør behandles som en mulig konteksttype, ikke bare som en undermappe.
6. Fysisk struktur bør kunne gi implicit kontekst.
7. Metadata bør på sikt kunne uttrykke generelle `contexts`, ikke bare `projects`.
8. Sidekick bør ikke automatisk skrive konteksttilknytning inn i brukerens eksisterende Markdown-filer.
9. Nye genererte artefakter bør få metadata som beskriver `source_model` og `source_scope`.
10. GUI-et bør bygges rundt kontekstvisninger over samme arbeidsområde, ikke separate kopier av innholdet.
11. GUI-et må senere skille tydelig mellom `Prosjektfiler`, `Koblede bibliotekfiler`, `Generelle applikasjonsfiler` og `Prosjektkontekster`.
12. Main process eller en delt domenemodell bør produsere radene i en kontekstvisning, inkludert `view_reason`.
13. `Mapper`, `Prosjekter` og `Applikasjoner` bør behandles som eksempler på en utvidbar kontekstvisningsmekanisme, ikke som en lukket navigasjonsmodell.

## Hva dette betyr for utviklere og konsulenter

Utviklere bør unngå nye irreversible antakelser om at:

- alt relevant innhold ligger under nøyaktig én prosjektmappe;
- en transkripsjon eies av ett prosjekt;
- prosjektkontekst er eneste relevante kontekst;
- applikasjonskontekst ikke kan være et eget view;
- kontekst alltid kan beregnes fra filsti alene;
- renderer trygt kan finne opp prosjekt- eller applikasjonsmedlemskap selv;
- genererte sammendrag alltid er prosjektspesifikke;
- context packages alltid er `full physical project`.

Samtidig skal utviklere ikke implementere full kontekstbasert modell i tilfeldige oppgaver.

Riktig mellomposisjon er:

- hold dagens scope prosjektlokalt der oppgaven sier det;
- legg til metadatafelt som gjør fremtidig kontekstbasert modell mulig;
- bruk `contexts`-tenkning i nye arkitekturvalg selv om første implementering bare støtter prosjekt;
- modeller UI-valg som `artifact + context_view + context`, ikke bare `path`;
- ekskluder `.sidekick/` fra skanning og kontekstpakker der det er generert metadata;
- valider paths strengt i main process;
- dokumenter `source_model` og `source_scope` når nye genererte artefakter introduseres.

Konsulenter bør bruke Strategi/Operasjon-caset og Applikasjon-caset til å teste informasjonsarkitektur, GUI-flyt og begrepsbruk før implementering.

## Beslutningskriterier

Den kontekstbaserte modellen bør anses som riktig hvis den oppfyller disse kriteriene:

- Brukeren kan fortsatt forstå arbeidsområdet i filsystemet.
- Vanlige prosjektdokumenter kan ligge i prosjektmapper.
- Applikasjonsgenerelle dokumenter kan ligge i applikasjonsmapper.
- Prosjektspesifikke applikasjonsdokumenter kan ligge i prosjekter.
- Delte transkripsjoner kan gjenbrukes uten duplisering.
- Sidekick kan forklare hvorfor en fil vises i et prosjekt eller en applikasjon.
- Sidekick kan vise samme artefakt i flere kontekstvisninger uten å duplisere filen.
- Høyrepanelet kan vise både fysisk plassering og valgt visningsgrunn.
- Kontekstpakker kan vise inkluderte filer og begrunnelse.
- Markdown-editor-bruk er fortsatt praktisk.
- `.sidekick/` kan slettes eller skades uten at brukerens innhold går tapt.
- Metadata kan repareres eller bygges opp igjen med brukerhjelp.
- Modellen kan innføres gradvis.

## Foreløpig konklusjon

Den kontekstbaserte modellen er den beste langsiktige modellen for Sidekick fordi den kombinerer to behov:

- prosjektmapper gir enkelhet, eierskap og forståelig filstruktur;
- applikasjonsmapper gir et sted for produkt- og systemdokumentasjon på tvers av prosjekter;
- bibliotek og konteksttilknytning gir gjenbruk, delte transkripsjoner og bedre kunnskapsrelasjoner.

Sidekick bør derfor fortsette med dagens prosjektmodell i kortsiktige oppgaver, men utforme metadata, sammendrag, kontekstpakker og søk slik at den kontekstbaserte modellen kan innføres uten større ombygging senere.
