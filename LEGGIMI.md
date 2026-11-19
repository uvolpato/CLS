# CLS · Prototipo gestionale sorveglianza sanitaria

Prototipo statico (nessuna build, nessuna dipendenza esterna) del nuovo gestionale CLS.
Si apre **doppio clic su `index.html`** in un browser moderno: funziona anche offline.

Per mostrare l’app mobile del medico al cliente senza un telefono, apri **`anteprima-mobile.html`**: carica l’app in una cornice da telefono, con accesso demo automatico e scorciatoie per Oggi, Agenda, Pazienti, Referti e Consuntivo.

## Accesso

La demo ha tre profili con menu e dati diversi. Dalla schermata di login puoi cliccare un accesso per compilare i campi.

| Profilo | Username | Password | Cosa vede |
|---|---|---|---|
| Operatore CLS | `admin` | `cls2026` | Tutto: operatività, anagrafiche, sorveglianza, sistema, fatture e gestione utenti |
| Medico competente | `m.mineo` | `medico2026` | Solo le proprie aziende e lavoratori, agenda, visite, esami, sopralluoghi, documenti e **consuntivo** |
| Azienda cliente | `metalpress` | `ditta2026` | Solo i propri lavoratori, visite con giudizi, esami e referti, corsi, scadenze, documenti e **fatture** |

- La data della demo è fissata a **10/11/2026**, così agenda e scadenze sono sempre coerenti.
- I dati sono in memoria: ricaricando la pagina si torna allo stato iniziale.

## Cosa contiene

| Area | Viste |
|---|---|
| Operatività | Dashboard, **Attività** (Coda di lavoro, Richiami), **Agenda giornaliera** per medico con sedi, blocchi esterni e tempi medi, **Consuntivo medico**, Scadenziario proattivo |
| Anagrafiche | Ditte (scheda a tab), Lavoratori (cartella a tab), Medici, Mansioni e protocolli |
| Sorveglianza | Visite (elenco + wizard in 12 passi), Esami, Vaccinazioni, Sopralluoghi, Corsi |
| Sistema | Documenti e dispositivi, **Fatture**, **Utenti e ruoli**, Sincronizzazione Mago, Report (generale, fatturazione, note) |

## Ruoli, utenti e portale aziende

- **Operatore CLS**: gestisce tutte le anagrafiche, le visite, l’agenda, i documenti e gli account. È l’unico che vede **Utenti e ruoli**.
- **Medico competente**: accede alla propria dashboard, alla propria agenda, al consuntivo e alle sole aziende in cui è medico competente. Non vede le altre aziende, gli altri medici, la gestione utenti o la sincronizzazione Mago.
- **Azienda cliente**: ha un accesso dedicato al portale. Vede solo i propri lavoratori, le visite con i giudizi di idoneità, gli esami e i referti, i corsi, le scadenze, i documenti e le fatture. Non vede l’agenda dei medici né le altre aziende.
- **Utenti e ruoli** (solo operatore): elenco account con ruolo, collegamento a medico o azienda, ultimo accesso e stato. Da qui si crea un utente, si modifica, si reimposta la password e si attiva/disattiva l’accesso.
- Dalla **scheda ditta** e dall’**elenco medici** il pulsante **Accesso** crea l’account già collegato all’azienda o al medico.
- Menu, breadcrumb e rotte si adattano al ruolo: una pagina non consentita riporta alla dashboard senza mostrare dati.

## App mobile del medico

Sotto i **1180 px** (telefono e tablet) il medico non usa la SPA desktop: al login compare un’app dedicata, con la stessa base dati. Il tablet sfrutta la larghezza con contenuti a due colonne e tabbar centrata.

- Navigazione a tab in basso: **Oggi, Agenda, Pazienti, Documenti, Altro**.
- **Oggi**: saluto, attività del giorno, referti da verificare, scadenze, prossime visite.
- **Agenda**: striscia dei 7 giorni, filtri In sede/Esterni, attività in sequenza con orari e durata, blocchi esterni con le visite dentro; il pulsante `+` crea un appuntamento.
- **Pazienti**: ricerca immediata per nome, CF o mansione; scheda paziente con visite, giudizi, esami e referti scaricabili, scadenze e documenti.
- **Altro**: scadenze, esami, visite, aziende, consuntivo, profilo e uscita.
- La compilazione visita (12 passi) resta utilizzabile a schermo stretto, con i passi scorrevoli in orizzontale e i modali a tutto schermo.
- Nell’anteprima il toggle **Tablet / Telefono** cambia cornice e larghezza; il toggle **Browser: sì/no** mostra o nasconde la barra del browser (URL e barra inferiore) per vedere l’ingombro reale. **A tutto schermo** invece la elimina del tutto.
- Dalla sidebar del gestionale (e dalla schermata di login) c’è il link **App mobile del medico**; dentro l’app, **Altro → Apri gestionale** riapre la index.
- È una **PWA**: su telefono si aggiunge alla schermata Home e si apre a tutto schermo, senza barre del browser. L’anteprima desktop ha anche il pulsante **A tutto schermo**.
- Operatore e azienda continuano a lavorare da desktop; il login è ottimizzato anche per il telefono.

## Consuntivo medico e fatture

- **Consuntivo** (solo medico): compenso **a prestazione**, non a ore. Ogni visita, accertamento e sopralluogo matura un importo secondo il tariffario; le trasferte esterne sono rimborsate a parte. La pagina mostra mese, dettaglio, totale e pulsante “Scarica consuntivo” (PDF simulato). È lo stesso schema dei gestionali di medicina del lavoro per i compensi ai medici.
- **Fatture** (azienda e operatore): elenco fatture per periodo, stato, imponibile, IVA e totale. L’azienda vede e scarica solo le proprie.
- **Esami e referti** (azienda): l’azienda può consultare e scaricare i referti dei propri lavoratori.
- **Certificati di presenza**: dalla lista visite o dalla scheda lavoratore l’azienda scarica il certificato con data, orario, sede e medico, utile per giustificare l’assenza dal posto di lavoro.

## Attività: la coda di lavoro e i richiami

La sezione **Attività** (visibile solo all’operatore) sostituisce la navigazione per tabelle con una navigazione **per lavoro aperto**:

- **Coda di lavoro**: un’unica lista di azioni aperte — pianificare, refertare, firmare, inviare — ordinata per priorità e con il contesto a lato. Cliccando una riga si vede il dettaglio e si agisce senza cambiare pagina.
- **Filtri**: tipo di attività, priorità e ricerca testuale; i contatori per tipo sono sempre visibili.
- **Richiami**: le visite di sorveglianza da rinnovare, raggruppate per azienda, con “Invia richiamo” e “Pianifica”.
- Il badge **Attività** in sidebar conta le pratiche aperte; la pagina non è un report, è una coda di lavoro.

## Proposta: Dashboard, Attività, Agenda e Scadenziario (selettore Attuale / Proposta)

Per l'operatore, in alto a destra su **Dashboard**, **Attività**, **Agenda** e **Scadenziario** c'è il selettore **Attuale / Proposta** (parte su Proposta). Codice in `assets/viste-proposte.js`.

- **Dashboard**: flusso delle pratiche cliccabile (Da pianificare → In agenda oggi → Referti → Firma medico → Da inviare → Chiusi) che apre la coda già filtrata; carico giornaliero per medico; scadenze in tre finestre con una riga per lavoratore; aziende con più lavoratori scaduti; Mago ridotto a un indicatore nell'intestazione.
- **Attività**: filtri per azienda e medico, "In carico a me", raggruppamento per azienda, selezione multipla con azioni di gruppo (invia, sollecita firma, richiamo, presa in carico), età leggibile, firma trasformata in **sollecito al medico**, dettaglio con altre attività dello stesso lavoratore e ultime note.
- La campanella mostra lo stesso numero di Attività e apre la coda; il badge dello Scadenziario sparisce.
- **Agenda**: nuova vista **Settimana** (medici × giorni con appuntamenti, ore occupate, blocchi e conflitti; clic su una cella apre la giornata del medico), "Solo con attività" attivo di default, giorni con conflitti segnati in rosso nella striscia, pannello **Posti liberi** con i primi orari prenotabili in base al tempo medio del medico.
- **Scadenziario**: le finestre (Scadute, 7, 30, 90 giorni, Fissate) sono filtri cliccabili; tre modi di lettura: **Per lavoratore** (una riga con tutte le voci, "Pianifica tutto", "Fissata"), **Per azienda** (scadute, entro 30 gg, lavoratori coinvolti, stato della comunicazione, email singola) ed **Elenco** (con "Pianifica" su ogni riga).

## Pianificazione guidata, viaggi e disponibilità dei medici

- **Disponibilità dei medici**: ogni medico ha un regime (tempo pieno o parziale) e le fasce settimanali in cui lavora per lo studio. Le vedi in **Medici**, nella vista **Settimana** dell'agenda e in Pianificazione. Nella griglia del giorno le ore fuori disponibilità sono tratteggiate e un appuntamento fuori fascia è segnalato.
- **Viaggi**: l'agenda calcola il tempo di trasferimento tra studio e clienti e tra un cliente e l'altro (stima per provincia, 60 km/h + 10' di margine; 15' nella stessa zona). Nella griglia compare una striscia "viaggio" prima dell'appuntamento; se il tempo non basta diventa rossa e l'appuntamento è segnalato, anche il rientro in studio dopo una visita esterna.
- **Preferenze del cliente** (scheda ditta → Modifica → *Visite e pianificazione*): dove si fanno le visite (studio / presso il cliente / indifferente), se la visita in loco è **obbligatoria**, **chi sceglie la data** (lo studio o il cliente tra delle proposte) e note (turni, giorni di chiusura). Il nuovo appuntamento parte già con la modalità giusta e mostra le note.
- **Pianificazione guidata** (menu Operatività): elenco dei clienti con visite scadute o in scadenza; per il cliente scelto il sistema propone **3 date** con il medico competente, rispettando luogo, disponibilità e viaggi, e preferendo le giornate già avviate (saturazione) e i **giri in zona** (se il medico è già vicino, o accodando un altro cliente in ritardo nella stessa provincia). Ogni proposta spiega il perché.
  - Se la data la fissa lo studio: **Prenota** crea subito le visite (e il blocco esterno se in loco).
  - Se la sceglie il cliente: **Invia le proposte** genera l'email con le opzioni; quando il cliente risponde si clicca l'opzione scelta.
  - **Invia proposte ai clienti in ritardo**: un clic sollecita tutti i clienti in ritardo che non hanno ancora una proposta aperta.
- **Appuntamento di gruppo**: da Scadenziario → *Per azienda* (**Pianifica insieme**), dalla scheda ditta o dalla Pianificazione guidata si scelgono i lavoratori della ditta in scadenza (entro 90 giorni) e si crea **un unico appuntamento**, in studio o presso il cliente, che dura quanto la somma delle visite. Le visite non hanno un orario a testa: i lavoratori si presentano nell'ordine che preferiscono. Il sistema propone le prime giornate libere rispettando preferenze del cliente, disponibilità del medico e viaggi; in agenda il gruppo appare come un blocco con l'elenco dei lavoratori, e trascinandoci dentro un altro lavoratore il blocco si allunga.
- **Saturazione**: la vista Settimana mostra per ogni medico la percentuale di ore occupate (attività + viaggi) sulle ore disponibili e le ore ancora libere fino a fine settimana.

## Domande aperte da fare a CLS

1. **Come si fissano oggi gli appuntamenti?** Chi propone la data: lo studio, il cliente, o dipende dal cliente? Per telefono, email o portale?
2. **Visite in loco**: quali clienti le chiedono e quali le rendono necessarie (cantieri, campi, turni)? Esiste un numero minimo di lavoratori perché lo studio si sposti?
3. **Disponibilità dei medici**: chi è a tempo pieno per lo studio e chi solo alcuni giorni o ore? Le fasce sono fisse o cambiano ogni mese? Chi le aggiorna (il medico o la segreteria)? Ferie e indisponibilità come si comunicano?
4. **Spostamenti**: il medico parte dallo studio o da casa? Usa l'auto propria? Le trasferte si rimborsano a km o a forfait (impatta il consuntivo)?
5. **Saturazione**: c'è un obiettivo di visite al giorno per medico? Si preferisce riempire le giornate già aperte o distribuire il carico?
6. **Durata delle visite**: si usa la durata media del medico o una durata standard per tipo di visita ed esami del protocollo?
7. **Solleciti**: dopo quanti giorni di ritardo si sollecita il cliente? Con quale tono e canale, e chi firma la comunicazione?

## Navigazione per aree e breadcrumb

- Le aree **Operatività, Anagrafiche, Sorveglianza, Sistema** sono nel menu dell’utente, in basso a sinistra. Si apre dal nome e mostra solo l’area attiva nella barra laterale.
- Sopra il titolo della pagina c’è un **breadcrumb sulla pagina precedente**: un clic riporta all’ultima pagina visitata, senza mostrare l’intero percorso.
- Anche da una scheda o da una lista filtrata il breadcrumb resta stabile e non punta mai alla pagina corrente.

## Percorsi di prova consigliati

1. **Attività**: nella **Coda di lavoro** seleziona una riga e usa il dettaglio a lato. Prova il filtro “Firmare”, firma un certificato e guarda il contatore scendere. Poi apri **Richiami** e invia un richiamo a Metalpress.
2. **Agenda**: scegli un giorno dalla striscia in alto. Ogni colonna è un medico; le visite in sede sono arancioni, quelle esterne blu. Usa **Griglia** per la panoramica o **Lista** per leggere tutte le attività in sequenza; con molti medici filtra per medico o attiva **Solo con attività**. Apri il mercoledì e trascina un lavoratore da “Da pianificare” dentro il blocco Cantine: il sistema assegna lo slot successivo. Prova “Blocco esterno” e “Nuovo appuntamento”; il tempo medio del medico compare nel pannello “Tempi medi”.
3. **Lavoratori → Rossi Marco → Nuova visita**: la maschera parte precompilata dall’ultima visita. Cambia i passi dal menu in alto (12 sezioni). Nella sezione Esami le righe arrivano dal protocollo della mansione; nell’Esame obiettivo il pulsante “default” inserisce le frasi standard e il BMI si calcola da altezza/peso. Scegli tipo e giudizio, salva: il certificato viene firmato digitalmente e “inviato”, la scadenza della prossima visita si aggiorna e si apre l’anteprima stampabile.
4. **Ditte → Metalpress → tab**: Mansioni (protocollo e personalizzazione in ditta), Lavoratori, Visite, Scadenze, Documenti, Storico Mago. I pulsanti PSS/RFA e Allegato 3B generano i documenti (simulati).
5. **Scadenziario**: filtra per finestra (7/30/90 giorni, solo scadute), tipo ed entità; cerca e ordina le colonne; spunta “Fissata”. “Email raggruppate” compone un’unica comunicazione per cliente con tutte le scadenze del periodo.
6. **Mago**: “Sincronizza ora” aggiorna coda e log. Apri “Storico” su Metalpress o Logistica Adriatica per vedere la regola della stessa P.IVA: record precedente annullato, nuovo record attivo, documenti storici intatti.
7. **Documenti e dispositivi**: acquisisci un referto da spirometro/ECG o con la scansione IA; il referto viene abbinato alla cartella del lavoratore. La nota VPN spiega la dismissione delle chiavette USB.
8. **Report**: situazione generale per lavoratore, fatturazione con intervallo date e totali (flag S/R), note aggregate.
9. **+ Nuova ditta / Nuovo lavoratore / Nuovo medico / Nuova mansione**: form completi, con validazione e salvataggio in memoria.
10. **Utenti e ruoli** (operatore): crea un account “Azienda cliente” e collegalo a una ditta; esci e rientra con quell’account: il menu mostra solo le viste dell’azienda e le altre rotte tornano alla dashboard. Poi rientra come `m.mineo`: agenda con la sola colonna del medico e sole aziende assegnate.
11. **Mobile medico**: apri il file da telefono o riduci la finestra sotto 760 px ed entra come `m.mineo`. Prova Oggi, Agenda (cambia giorno e filtro), Pazienti (cerca “Rossi”), scheda paziente, referto, consuntivo e il menu Altro. La compilazione visita resta a 12 passi.
12. **Azienda**: entra come `metalpress` e apri **Fatture** per scaricare una fattura; in **Visite** scarica un certificato di presenza; in **Esami** scarica un referto.

## Requisiti della specifica coperti

- Viste **paziente/azienda-centriche** con cartella unica (visite, esami, vaccinazioni, scadenze, documenti, note).
- **Workflow guidato a step** per il medico, con precompilazione dall’ultima visita e banner di trasparenza.
- **Dashboard operativa** con visite, esami, referti, certificati e scadenze.
- **Mago**: sincronizzazione API simulata, distinzione visite in sede/esterne, storicizzazione anagrafica su stessa P.IVA, cambio P.IVA come nuova entità.
- **Certificati**: firma digitale e invio automatico simulati alla chiusura della visita, archivio documenti.
- **Dispositivi**: ingestione referti da spirometro/ECG, VPN per la mobilità, scansione OCR/IA.
- **Scadenziario proattivo** con regola automatica per aziende con più di 15 dipendenti (Metalpress), scadenze da visite/esami/vaccinazioni/corsi/sopralluoghi, flag fissata, email raggruppate.
- **Agenda giornaliera per medico**: visite in sede e presso i clienti, blocchi esterni con più visite, durata impostabile, tempi medi storici, drag & drop e rilevamento conflitti per sovrapposizione di orari. Con molti medici: filtro per medico, “Solo con attività” e vista **Lista**; testi e righe ingranditi per la leggibilità.
- **Breadcrumb** alla pagina precedente, indipendente dal percorso; aree di navigazione raccolte nel menu utente.
- **Accessi per ruolo**: operatore, medico competente e azienda cliente, con menu, cruscotto, dati e rotte filtrati; gestione utenti con collegamento a ditte e medici.
- **App mobile del medico**: navigazione a tab, agenda a sequenza, pazienti, referti, consuntivo e wizard visita utilizzabile a schermo stretto.
- **Consuntivo medico a prestazione**, fatture aziendali scaricabili, referti e certificati di presenza per l’azienda.
- **Datatable** con ricerca, filtri, ordinamento, paginazione, intestazione e footer fissi, righe scrollabili.
- **Navigazione per attività**: coda unica con priorità, filtri per tipo, dettaglio laterale e richiami per azienda.

## Note tecniche

- Palette e logo ripresi dal sito ufficiale **clsclinica-bergamo.com**: arancio `#EA8B2F`, grigio `#575756`, arancio chiaro `#F2B574`; logo in `assets/logo-cls-bianco.png` e `assets/favicon-cls.png`.
- File: `index.html`, `assets/stile.css`, `assets/mobile.css`, `assets/dati.js`, `assets/componenti.js`, `assets/viste-*.js`, `assets/viste-agenda.js`, `assets/viste-attivita.js`, `assets/viste-ruoli.js`, `assets/viste-economia.js`, `assets/mobile.js`, `assets/app.js`.
- Router a hash (`#/dashboard`, `#/ditte/d1`, `#/visite/nuova/l1`, …), stato delle tabelle conservato in memoria.
- Nessuna chiamata di rete: invio email, firma, PDF, API Mago e dispositivi sono **simulazioni** dichiarate nell’interfaccia.
- Dati, nomi e documenti sono di esempio e non contengono informazioni reali.

## Limiti noti (voluti nel prototipo)

- I dati non sono persistiti e non c’è autenticazione reale: utenti, password e permessi sono in memoria; il refresh azzera anche gli account creati.
- I PDF e gli invii non vengono generati davvero; anteprima, download e stampa usano il browser.
- L’app mobile è progettata per il medico; operatore e azienda restano desktop-first (il login è comunque responsive). Fatture, compensi e certificati di presenza sono dati simulati.
- Le modifiche di visite/esami già salvati non sono previste: il prototipo concentra il flusso sulla creazione guidata.
