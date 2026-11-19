# Graph Report - Prototipo  (2026-11-10)

## Corpus Check
- 13 files · ~50,618 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: .css 2, .webmanifest 1)

## Summary
- 178 nodes · 305 edges · 17 communities (12 shown, 5 thin omitted)
- Extraction: 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App mobile medico
- Agenda e blocchi
- Dati demo e helper
- Coda attività
- Shell, login e routing
- Visite e clinica
- Scoping per ruolo
- Cruscotti e utenti
- Helper dati filtrati
- Form anagrafiche
- Lookup entità
- Fatture e compensi
- Storico visite

## God Nodes (most connected - your core abstractions)
1. `vista()` - 12 edges
2. `perDitte()` - 10 edges
3. `empty()` - 9 edges
4. `timeline()` - 9 edges
5. `utenteCorrente()` - 8 edges
6. `gridHtml()` - 8 edges
7. `listHtml()` - 7 edges
8. `codaView()` - 7 edges
9. `shell()` - 6 edges
10. `listEvent()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `perDitte()` --calls--> `utenteCorrente()`  [EXTRACTED]
  assets/dati.js → assets/dati.js  _Bridges community 6 → community 8_

## Import Cycles
- None detected.

## Communities (17 total, 5 thin omitted)

### Community 0 - "App mobile medico"
Cohesion: 0.16
Nodes (26): backHref(), blocchiGiorno(), blockCard(), dur(), empty(), evCard(), eventiGiorno(), fine() (+18 more)

### Community 1 - "Agenda e blocchi"
Cohesion: 0.18
Nodes (16): assignToBlock(), blocchiGiorno(), dayStrip(), dur(), eventEnd(), eventiGiorno(), filtroEvento(), fmtMin() (+8 more)

### Community 2 - "Dati demo e helper"
Cohesion: 0.10
Nodes (8): calcolaConflitti(), getMansione(), getMedico(), mansioneInDitta(), nomeMedico(), scadenzaProssima(), scadenzeLav(), toMin()

### Community 3 - "Coda attività"
Cohesion: 0.24
Nodes (17): actionButton(), astate(), codaView(), detail(), etaLabel(), filterBar(), firmareItems(), inviareItems() (+9 more)

### Community 4 - "Shell, login e routing"
Cohesion: 0.25
Nodes (11): areaDi(), areeVisibili(), conflitti(), loginHtml(), menuUtente(), navHtml(), RENDER(), risolvi() (+3 more)

### Community 5 - "Visite e clinica"
Cohesion: 0.26
Nodes (7): area(), formIngestione(), optsAcc(), optsLav(), rigaEsame(), risultatoOpts(), v()

### Community 6 - "Scoping per ruolo"
Cohesion: 0.22
Nodes (10): blocchiVisibili(), ditteVisibili(), eventiVisibili(), lavVisibili(), mediciVisibili(), puoDitta(), puoLav(), puoPagina() (+2 more)

### Community 7 - "Cruscotti e utenti"
Cohesion: 0.31
Nodes (7): agendaTable(), apriNuovoUtente(), dashboardDitta(), dashboardMedico(), eventiOggi(), formUtente(), scadenzeTable()

### Community 8 - "Helper dati filtrati"
Cohesion: 0.25
Nodes (8): corsiVisibili(), documentiVisibili(), esamiVisibili(), perDitte(), scadenzeVisibili(), sopralluoghiVisibili(), vaccinazioniVisibili(), visiteVisibili()

### Community 9 - "Form anagrafiche"
Cohesion: 0.32
Nodes (4): formDitta(), formLavoratore(), optDitte(), optMedici()

### Community 11 - "Lookup entità"
Cohesion: 0.40
Nodes (5): compensiMedico(), getDitta(), getLav(), nomeDitta(), nomeLav()

### Community 12 - "Fatture e compensi"
Cohesion: 0.60
Nodes (4): fatturaHtml(), letterhead(), meseScelto(), mesiConsuntivo()

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `perDitte()` connect `Helper dati filtrati` to `Dati demo e helper`, `Scoping per ruolo`?**
  _High betweenness centrality (0.001) - this node is a cross-community bridge._
- **Should `Dati demo e helper` be split into smaller, more focused modules?**
  _Cohesion score 0.10276679841897234 - nodes in this community are weakly interconnected._