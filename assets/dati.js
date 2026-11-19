/* =========================================================
   CLS · dati demo coerenti (in memoria, nessuna persistenza)
   shortcut: dati e date sono fissi per la demo; collegare DB/API
   reali quando il prototipo diventa l'applicazione di produzione.
   ========================================================= */
(function () {
  'use strict';

  var OGGI = new Date(2026, 10, 10); // 10/11/2026 — data fissa della demo
  var pad = function (n) { return String(n).padStart(2, '0'); };
  var iso = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  var parseISO = function (s) { var p = String(s || '').split('-').map(Number); return new Date(p[0], (p[1] || 1) - 1, p[2] || 1); };
  var asDate = function (x) { return x instanceof Date ? new Date(x) : parseISO(x); };
  var addGiorni = function (x, n) { var d = asDate(x); d.setDate(d.getDate() + n); return iso(d); };
  var addMesi = function (x, n) { var d = asDate(x); d.setMonth(d.getMonth() + n); return iso(d); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  var fmtData = function (x) { if (!x) return '—'; var d = asDate(x); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); };
  var fmtBreve = function (x) { if (!x) return '—'; var d = asDate(x); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1); };
  var fmtLunga = function (x) { var d = asDate(x); return GIORNI[d.getDay()] + ' ' + d.getDate() + ' ' + MESI[d.getMonth()] + ' ' + d.getFullYear(); };
  var fmtEuro = function (n) { return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0); };
  var meseAnno = function (x) { var d = asDate(x); return MESI[d.getMonth()] + ' ' + d.getFullYear(); };
  var giorniA = function (x) { return Math.round((asDate(x) - OGGI) / 86400000); };
  var eta = function (nascita) { var d = asDate(nascita); var e = OGGI.getFullYear() - d.getFullYear(); var m = OGGI.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && OGGI.getDate() < d.getDate())) e--; return e; };
  var iniziali = function (nome) { return String(nome || '').split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase(); };

  var DB = {
    medici: [
      { id: 'm1', nome: 'MINEO Alessandro Antonio', nascita: '1972-03-15', cf: 'MNILSN72C15B157X', comune: 'Brescia', prov: 'BS', tel: '030 4521789', email: 'a.mineo@clsalus.it', firma: true },
      { id: 'm2', nome: 'DE BENI Berardo', nascita: '1965-01-10', cf: 'DBNBRD65A10C225Y', comune: 'Verona', prov: 'VR', tel: '045 8012233', email: 'b.debeni@clsalus.it', firma: true },
      { id: 'm3', nome: 'CAMINITA Maria Letizia', nascita: '1968-05-04', cf: 'CMNMLZ68E44E349Z', comune: 'Milano', prov: 'MI', tel: '02 55018822', email: 'l.caminita@clsalus.it', firma: true },
      { id: 'm4', nome: 'ANDREOLI Daniele Marco', nascita: '1970-06-12', cf: 'NDRDNL70H12A562K', comune: 'Bergamo', prov: 'BG', tel: '035 223371', email: 'd.andreoli@clsalus.it', firma: true },
      { id: 'm5', nome: 'ABBRESCIA Vincenzo', nascita: '1962-03-03', cf: 'BBRVCN62T03F205L', comune: 'Mantova', prov: 'MN', tel: '0376 322115', email: 'v.abbreScia@clsalus.it', firma: false },
      { id: 'm6', nome: 'ROSSI Licia', nascita: '1975-11-12', cf: 'RSSLCI75S52F704P', comune: 'Pavia', prov: 'PV', tel: '0382 250633', email: 'l.rossi@clsalus.it', firma: true },
      { id: 'm7', nome: 'PAGANELLI Matteo', nascita: '1978-02-19', cf: 'PGNMTT78B19L736Q', comune: 'Monza', prov: 'MB', tel: '039 740112', email: 'm.paganelli@clsalus.it', firma: true },
      { id: 'm8', nome: 'ZENONI Giorgio', nascita: '1959-04-27', cf: 'ZNRGRG59D27G388R', comune: 'Lodi', prov: 'LO', tel: '0371 42280', email: 'g.zenoni@clsalus.it', firma: false }
    ],

    mansioni: [
      { id: 'mn1', nome: 'IMPIEGATO AMMINISTRATIVO', periodo: 60, rischi: ['VIDEOTERMINALE', 'AFFATICAMENTO VISIVO'], accertamenti: [['SCREENING ERGOVISIVO', '24'], ['VISITA OCULISTICA', 'AB'], ['VISITA ORTOPEDICA', 'AB']], note: 'Protocollo da mansione template. Rischi personalizzati in ditta.' },
      { id: 'mn2', nome: 'MAGAZZINIERE', periodo: 24, rischi: ['MOVIMENTAZIONE MANUALE CARICHI', 'RUMORE', 'POLVERI'], accertamenti: [['SPIROMETRIA', '24'], ['AUDIOMETRIA', 'AB'], ['VACCINAZIONE ANTITETANICA', 'O'], ['DOSAGGIO ANTICORPI ANTITETANO', 'IB'], ['ECG', 'AB'], ['VISITA ORTOPEDICA', 'AB']], note: '' },
      { id: 'mn3', nome: 'MAGAZZINIERE CARRELLISTA', periodo: 24, rischi: ['MOVIMENTAZIONE MANUALE CARICHI', 'RUMORE', 'VIBRAZIONI', 'POLVERI'], accertamenti: [['AUDIOMETRIA', 'AB'], ['SPIROMETRIA', '36'], ['TEST SCREENING URINARIO SOSTANZE STUPEFACENTI', '12'], ['QUESTIONARIO ALCOOL', '12'], ['VACCINAZIONE ANTITETANICA', 'AB'], ['DOSAGGIO ANTICORPI ANTITETANO', 'IB'], ['CDT', 'AB'], ['EMOCROMO + FL', 'AB'], ['AST, ALT, GGT', 'AB'], ['ECG', 'AB'], ['VISITA ORTOPEDICA', 'AB']], note: 'Richiesta abilitazione alla guida del carrello elevatore.' },
      { id: 'mn4', nome: 'AUTISTA PAT. B - CARICO/SCARICO + MULETTO', periodo: 24, rischi: ['GUIDA VEICOLI', 'RUMORE', 'VIBRAZIONI', 'MOVIMENTAZIONE MANUALE CARICHI'], accertamenti: [['SPIROMETRIA', 'AB'], ['ECG', 'AB'], ['VISITA CARDIOLOGICA CON ECG', 'AB'], ['VISITA ORTOPEDICA', 'AB'], ['EMOCROMO + FL', 'AB'], ['AST, ALT, GGT', 'AB'], ['CDT', 'AB'], ['TEST SCREENING URINARIO SOSTANZE STUPEFACENTI', '12'], ['QUESTIONARIO ALCOOL', '12']], note: '' },
      { id: 'mn5', nome: 'OPERAIO METALMECCANICO', periodo: 24, rischi: ['RUMORE', 'POLVERI', 'MOVIMENTAZIONE MANUALE CARICHI', 'SCHEDE DI SICUREZZA'], accertamenti: [['SPIROMETRIA', '24'], ['AUDIOMETRIA', '24'], ['ESAME URINE', '12'], ['VISITA ORTOPEDICA', 'AB'], ['ECG', 'AB']], note: '' },
      { id: 'mn6', nome: 'SALDATORE', periodo: 24, rischi: ['FUMI DI SALDATURA', 'RUMORE', 'RADIAZIONI UV', 'POLVERI'], accertamenti: [['SPIROMETRIA', '24'], ['AUDIOMETRIA', '24'], ['ESAME URINE', '12'], ['VISITA OCULISTICA', 'AB'], ['RX TORACE', '36']], note: 'Saldatura a filo e a elettrodo.' },
      { id: 'mn7', nome: 'ADDETTO PULIZIE', periodo: 36, rischi: ['PRODOTTI CHIMICI', 'MOVIMENTAZIONE MANUALE CARICHI', 'BIOLOGICO'], accertamenti: [['SPIROMETRIA', '36'], ['VISITA OCULISTICA', 'AB'], ['VACCINAZIONE ANTITETANICA', 'O']], note: '' },
      { id: 'mn8', nome: 'CUOCO', periodo: 24, rischi: ['CALORE', 'MOVIMENTAZIONE MANUALE CARICHI', 'TAGLIENTI'], accertamenti: [['VISITA MEDICA', '24'], ['TEST SCREENING URINARIO SOSTANZE STUPEFACENTI', '12'], ['QUESTIONARIO ALCOOL', '12'], ['ESAME URINE', '12']], note: '' },
      { id: 'mn9', nome: 'ELETTRICISTA', periodo: 24, rischi: ['ELETTRICO', 'LAVORI IN QUOTA', 'MOVIMENTAZIONE MANUALE CARICHI'], accertamenti: [['SPIROMETRIA', '36'], ['AUDIOMETRIA', 'AB'], ['VISITA OCULISTICA', 'AB'], ['VACCINAZIONE ANTITETANICA', 'O']], note: '' },
      { id: 'mn10', nome: 'IMPIEGATO TECNICO', periodo: 60, rischi: ['VIDEOTERMINALE', 'GUIDA VEICOLI'], accertamenti: [['SCREENING ERGOVISIVO', '24'], ['VISITA OCULISTICA', 'AB']], note: '' }
    ],

    ditte: [
      { id: 'd1', ragione: 'Metalpress S.r.l.', piva: '02345670123', cf: '02345670123', indirizzo: 'Via Industriale 14', citta: 'Brescia', prov: 'BS', cap: '25135', tel: '030 5511220', email: 'amministrazione@metalpress.it', pec: 'metalpress@pec.it', attivita: 'Stampaggio e lavorazione lamiera', ateco: '25.50.01', rspp: 'Ing. Paolo Riva', rappr: 'Carlo Metalpressi', medicoId: 'm1', ruolo: 'Medico Competente Unico', note: 'Cliente storico. Referente visite: Sig.ra Paola Neri.', newsletter: true, riunioni: true, acquisizione: '2014-03-01', cessazione: '', emailVisite: 'paola.neri@metalpress.it', mansioni: ['mn5', 'mn6', 'mn2', 'mn3', 'mn1'] },
      { id: 'd2', ragione: 'Logistica Adriatica S.p.A.', piva: '03456780124', cf: '03456780124', indirizzo: 'Via del Porto 8', citta: 'Verona', prov: 'VR', cap: '37135', tel: '045 8203344', email: 'hr@logisticaadriatica.it', pec: 'logisticaadriatica@pec.it', attivita: 'Trasporto merci e magazzinaggio', ateco: '52.29.10', rspp: 'Dott. Marco Bellini', rappr: 'Stefano Adriani', medicoId: 'm2', ruolo: 'Medico Competente Coordinato', note: 'Sedi operative a Verona e Padova. Visite anche in sede esterna.', newsletter: true, riunioni: true, acquisizione: '2017-09-15', cessazione: '', emailVisite: 'sicurezza@logisticaadriatica.it', mansioni: ['mn4', 'mn2', 'mn3'] },
      { id: 'd3', ragione: 'Cantine Valpolicella S.r.l.', piva: '04567890125', cf: '04567890125', indirizzo: 'Via dei Vigneti 3', citta: 'Negrar', prov: 'VR', cap: '37024', tel: '045 7501122', email: 'info@cantinevalpolicella.it', pec: 'cantinevalpolicella@pec.it', attivita: 'Produzione vino', ateco: '11.02.10', rspp: 'Ing. Laura Biondi', rappr: 'Giovanni Bertani', medicoId: 'm3', ruolo: 'Medico Competente Unico', note: 'Attività stagionale, sopralluogo in vendemmia.', newsletter: true, riunioni: false, acquisizione: '2019-02-20', cessazione: '', emailVisite: 'amministrazione@cantinevalpolicella.it', mansioni: ['mn5', 'mn2', 'mn1'] },
      { id: 'd4', ragione: 'Edilfer Costruzioni S.r.l.', piva: '05678901236', cf: '05678901236', indirizzo: 'Via dei Cantieri 27', citta: 'Bergamo', prov: 'BG', cap: '24126', tel: '035 3114400', email: 'ufficio@edilfer.it', pec: 'edilfer@pec.it', attivita: 'Costruzioni edili', ateco: '41.20.00', rspp: 'Geom. Alberto Sala', rappr: 'Franco Edilferri', medicoId: 'm4', ruolo: 'Medico Competente Unico', note: 'Cantieri attivi in tutta la provincia. Visite in cantiere su richiesta.', newsletter: true, riunioni: false, acquisizione: '2018-06-11', cessazione: '', emailVisite: 'sicurezza@edilfer.it', mansioni: ['mn9', 'mn5'] },
      { id: 'd5', ragione: 'Pulizie Splendor S.r.l.', piva: '06789012347', cf: '06789012347', indirizzo: 'Via Mantegna 45', citta: 'Mantova', prov: 'MN', cap: '46100', tel: '0376 441155', email: 'info@puliziesplendor.it', pec: 'puliziesplendor@pec.it', attivita: 'Servizi di pulizia industriale', ateco: '81.21.00', rspp: 'Dott.ssa Elisa Fanti', rappr: 'Mario Splendori', medicoId: 'm5', ruolo: 'Medico Competente Unico', note: '', newsletter: false, riunioni: false, acquisizione: '2020-01-14', cessazione: '', emailVisite: 'personale@puliziesplendor.it', mansioni: ['mn7'] },
      { id: 'd6', ragione: 'Trattoria del Borgo S.n.c.', piva: '07890123458', cf: '07890123458', indirizzo: 'Piazza del Borgo 2', citta: 'Cremona', prov: 'CR', cap: '26100', tel: '0372 301122', email: 'info@trattoriadelborgo.it', pec: '', attivita: 'Ristorazione', ateco: '56.10.11', rspp: 'Titolare', rappr: 'Anna Borghi', medicoId: 'm2', ruolo: 'Medico Competente Unico', note: 'Piccola azienda a conduzione familiare.', newsletter: true, riunioni: false, acquisizione: '2021-04-07', cessazione: '', emailVisite: 'anna@trattoriadelborgo.it', mansioni: ['mn8'] },
      { id: 'd7', ragione: 'Studio Tecnico Alfa', piva: '08901234569', cf: '08901234569', indirizzo: 'Corso Magenta 18', citta: 'Milano', prov: 'MI', cap: '20123', tel: '02 4987651', email: 'segreteria@studiotecnicoalfa.it', pec: 'studiotecnicoalfa@pec.it', attivita: 'Studi di ingegneria', ateco: '71.12.10', rspp: 'Ing. Chiara Villa', rappr: 'Luca Alfa', medicoId: 'm6', ruolo: 'Medico Competente Unico', note: '', newsletter: false, riunioni: false, acquisizione: '2022-10-03', cessazione: '', emailVisite: 'segreteria@studiotecnicoalfa.it', mansioni: ['mn10'] },
      { id: 'd8', ragione: 'Tessitura Serica S.r.l.', piva: '09012345670', cf: '09012345670', indirizzo: 'Via della Seta 5', citta: 'Como', prov: 'CO', cap: '22100', tel: '031 274400', email: 'info@tessituraserica.it', pec: 'tessituraserica@pec.it', attivita: 'Tessitura', ateco: '13.20.00', rspp: 'Sig. Bruno Colombo', rappr: 'Elena Serica', medicoId: 'm3', ruolo: 'Medico Competente Unico', note: '', newsletter: true, riunioni: false, acquisizione: '2016-11-22', cessazione: '', emailVisite: 'ufficio@tessituraserica.it', mansioni: ['mn5'] },
      { id: 'd9', ragione: 'Meccanica Valseriana S.r.l.', piva: '01123456781', cf: '01123456781', indirizzo: 'Via delle Officine 11', citta: 'Bergamo', prov: 'BG', cap: '24121', tel: '035 4221188', email: 'amministrazione@meccvalseriana.it', pec: 'meccvalseriana@pec.it', attivita: 'Lavorazioni meccaniche di precisione', ateco: '25.62.00', rspp: 'Ing. Fabio Nespoli', rappr: 'Teresa Valsecchi', medicoId: 'm1', ruolo: 'Medico Competente Coordinato', note: 'Azienda con turni su tre squadre.', newsletter: true, riunioni: true, acquisizione: '2015-05-18', cessazione: '', emailVisite: 'hr@meccvalseriana.it', mansioni: ['mn5', 'mn6'] },
      { id: 'd10', ragione: 'Supermercati Brianza S.r.l.', piva: '02234567892', cf: '02234567892', indirizzo: 'Via delle Merci 42', citta: 'Monza', prov: 'MB', cap: '20900', tel: '039 2022110', email: 'personale@superbrianza.it', pec: 'superbrianza@pec.it', attivita: 'Grande distribuzione organizzata', ateco: '47.11.00', rspp: 'Dott. Sergio Brambilla', rappr: 'Rosa Brianza', medicoId: 'm7', ruolo: 'Medico Competente Unico', note: '', newsletter: true, riunioni: false, acquisizione: '2020-09-01', cessazione: '', emailVisite: 'personale@superbrianza.it', mansioni: ['mn2', 'mn3'] },
      { id: 'd11', ragione: 'Azienda Agricola Ronchi', piva: '03345678903', cf: 'RNCGNN60A01E648T', indirizzo: 'Cascina Ronchi 1', citta: 'Codogno', prov: 'LO', cap: '26845', tel: '0377 43112', email: 'ronchi.agricola@gmail.com', pec: '', attivita: 'Coltivazioni agricole', ateco: '01.11.00', rspp: 'Titolare', rappr: 'Giovanni Ronchi', medicoId: 'm8', ruolo: 'Medico Competente Unico', note: 'Azienda individuale. Visita annuale in azienda.', newsletter: false, riunioni: false, acquisizione: '2023-03-06', cessazione: '', emailVisite: 'ronchi.agricola@gmail.com', mansioni: ['mn5'] },
      { id: 'd12', ragione: 'Farmacia Centrale S.r.l.', piva: '04456789014', cf: '04456789014', indirizzo: 'Piazza Duomo 9', citta: 'Pavia', prov: 'PV', cap: '27100', tel: '0382 301144', email: 'info@farmaciacentrale.it', pec: 'farmaciacentrale@pec.it', attivita: 'Farmacia', ateco: '47.73.10', rspp: 'Dott.ssa Paola Gatti', rappr: 'Paola Gatti', medicoId: 'm6', ruolo: 'Medico Competente Unico', note: '', newsletter: false, riunioni: false, acquisizione: '2021-11-29', cessazione: '', emailVisite: 'info@farmaciacentrale.it', mansioni: ['mn1'] },
      { id: 'd13', ragione: 'Tessitura Old S.r.l.', piva: '05567890125', cf: '05567890125', indirizzo: 'Via del Mulino 4', citta: 'Como', prov: 'CO', cap: '22100', tel: '031 270011', email: '', pec: '', attivita: 'Tessitura', ateco: '13.20.00', rspp: '', rappr: 'Aldo Oldi', medicoId: 'm3', ruolo: 'Medico Competente Unico', note: 'Rapporto cessato il 31/12/2024. Archivio storico consultabile.', newsletter: false, riunioni: false, acquisizione: '2012-01-10', cessazione: '2024-12-31', emailVisite: '', mansioni: [] }
    ],

    // shortcut: password in chiaro e ruoli in memoria, solo per la demo; in produzione hash e permessi lato server.
    utenti: [
      { id: 'u1', username: 'admin', password: 'cls2026', nome: 'Alessandra Volpi', email: 'alessandra.volpi@clsalus.it', ruolo: 'operatore', medicoId: '', dittaId: '', attivo: true, ultimoAccesso: '09/11/2026 18:42' },
      { id: 'u2', username: 'm.mineo', password: 'medico2026', nome: 'Dott. Alessandro Mineo', email: 'a.mineo@clsalus.it', ruolo: 'medico', medicoId: 'm1', dittaId: '', attivo: true, ultimoAccesso: '10/11/2026 08:15' },
      { id: 'u3', username: 'metalpress', password: 'ditta2026', nome: 'Paola Neri', email: 'paola.neri@metalpress.it', ruolo: 'ditta', medicoId: '', dittaId: 'd1', attivo: true, ultimoAccesso: '09/11/2026 16:22' }
    ],
    visite: [],
    esami: [],
    vaccinazioni: [],
    sopralluoghi: [],
    corsi: [],
    scadenze: [],
    documenti: [],
    eventi: [],
    blocchi: [],
    daPianificare: [],
    note: [],
    fatturazione: [],
    dispositivi: [
      { id: 'dev1', nome: 'Spirometro MIR Spirobank II', tipo: 'Spirometro', seriale: 'SPI-2291', stato: 'Connesso', rete: 'LAN studio', ultimo: '10/11/2026 08:42' },
      { id: 'dev2', nome: 'Elettrocardiografo BTL-08 SD', tipo: 'ECG', seriale: 'ECG-7714', stato: 'Connesso', rete: 'LAN studio', ultimo: '10/11/2026 09:10' },
      { id: 'dev3', nome: 'Scanner documentale Fujitsu fi-7160', tipo: 'Scanner / OCR IA', seriale: 'SCN-0432', stato: 'Connesso', rete: 'USB locale', ultimo: '09/11/2026 17:55' },
      { id: 'dev4', nome: 'Spirometro portatile MIR Spirobank Smart', tipo: 'Spirometro', seriale: 'SPI-8830', stato: 'VPN attiva', rete: 'VPN mobilità', ultimo: '10/11/2026 07:58' }
    ],
    mago: {
      ultimoSync: '09/11/2026 18:42',
      stato: 'ok',
      coda: 3,
      errori: 1,
      log: [
        ['09/11/2026 18:42', 'ok', 'Sincronizzazione completata: 12 anagrafiche, 8 prestazioni, 4 fatture.'],
        ['09/11/2026 18:41', 'dim', 'Invio fattura FT-2026/0418 — Metalpress S.r.l. — € 1.240,00'],
        ['09/11/2026 18:40', 'ok', 'Nuovo cliente creato in Mago: Farmacia Centrale S.r.l. (P.IVA 04456789014).'],
        ['09/11/2026 10:15', 'warn', 'Ditta Tessitura Serica: coordinate bancarie mancanti, invio rinviato.'],
        ['08/11/2026 19:02', 'err', 'Mago ha rifiutato la fattura FT-2026/0411: codice destinatario non valido.'],
        ['08/11/2026 19:01', 'ok', 'Allineati 3 pagamenti ricevuti.']
      ],
      anagrafiche: [
        {
          piva: '02345670123',
          ragione: 'Metalpress S.r.l.',
          records: [
            { id: 'a1', ragione: 'Metalpress S.r.l.', sede: 'Via Industriale 14, Brescia (BS)', dal: '01/03/2014', al: '', stato: 'Attiva', magoId: 'C-00142' },
            { id: 'a0', ragione: 'Metalpress di Rossi & C. S.n.c.', sede: 'Via Artigiani 2, Brescia (BS)', dal: '12/05/2009', al: '28/02/2014', stato: 'Annullata', magoId: 'C-00142' }
          ]
        },
        {
          piva: '03456780124',
          ragione: 'Logistica Adriatica S.p.A.',
          records: [
            { id: 'a3', ragione: 'Logistica Adriatica S.p.A.', sede: 'Via del Porto 8, Verona (VR)', dal: '15/09/2017', al: '', stato: 'Attiva', magoId: 'C-00208' },
            { id: 'a2', ragione: 'Adriatica Trasporti S.r.l.', sede: 'Viale Romea 110, Venezia (VE)', dal: '03/02/2011', al: '14/09/2017', stato: 'Annullata', magoId: 'C-00208' }
          ]
        }
      ]
    }
  };

  /* ---------- lookup ---------- */
  function getDitta(id) { return DB.ditte.find(function (d) { return d.id === id; }) || {}; }
  function getLav(id) { return DB.lavoratori.find(function (l) { return l.id === id; }) || {}; }
  function getMedico(id) { return DB.medici.find(function (m) { return m.id === id; }) || {}; }
  function getMansione(id) { return DB.mansioni.find(function (m) { return m.id === id; }) || {}; }
  function nomeLav(l) { return (l.cognome ? l.cognome + ' ' + l.nome : '').trim(); }
  function nomeDitta(id) { return getDitta(id).ragione || '—'; }
  function nomeMedico(id) { return getMedico(id).nome || '—'; }
  function ditteDelMedico(id) { return DB.ditte.filter(function (d) { return d.medicoId === id; }); }
  function mansioneInDitta(ditta, mansioneId) {
    var base = getMansione(mansioneId);
    var ov = (ditta && ditta.protocolli && ditta.protocolli[mansioneId]) || {};
    return Object.assign({}, base, ov);
  }
  function lavoratoriDitta(id) { return DB.lavoratori.filter(function (l) { return l.dittaId === id; }); }
  function visiteLav(id) { return DB.visite.filter(function (v) { return v.lavoratoreId === id; }).sort(function (a, b) { return b.data.localeCompare(a.data); }); }
  function esamiVisita(id) { return DB.esami.filter(function (e) { return e.visitaId === id; }); }
  function esamiLav(id) { return DB.esami.filter(function (e) { return e.lavoratoreId === id; }).sort(function (a, b) { return b.data.localeCompare(a.data); }); }
  function vaccLav(id) { return DB.vaccinazioni.filter(function (v) { return v.lavoratoreId === id; }); }
  function scadenzeLav(id) { return DB.scadenze.filter(function (s) { return s.lavoratoreId === id; }); }
  function ultimaVisita(id) { return visiteLav(id).filter(function (v) { return v.stato === 'eseguita'; })[0] || null; }
  function prossimaVisita(id) { return DB.visite.filter(function (v) { return v.lavoratoreId === id && v.stato === 'programmata'; }).sort(function (a, b) { return a.data.localeCompare(b.data); })[0] || null; }
  function scadenzaProssima(id) {
    var list = scadenzeLav(id).filter(function (s) { return s.tipo === 'Visita'; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
    return list[0] || null;
  }

  /* ---------- ditte ---------- */
  var VIE = ['Roma', 'Garibaldi', 'Dante Alighieri', 'Manzoni', 'IV Novembre', 'della Libertà', 'Verdi', 'Marconi', 'dei Mille', 'Sant\'Ambrogio', 'Carducci', 'Leopardi'];
  var ANAG = [
    ['Rossi', 'Marco', 'M'], ['Bianchi', 'Luca', 'M'], ['Ferrari', 'Andrea', 'M'], ['Esposito', 'Salvatore', 'M'],
    ['Colombo', 'Giulia', 'F'], ['Ricci', 'Alessandro', 'M'], ['Marino', 'Francesca', 'F'], ['Greco', 'Antonio', 'M'],
    ['Galli', 'Stefano', 'M'], ['Conti', 'Elena', 'F'], ['De Luca', 'Paolo', 'M'], ['Costa', 'Matteo', 'M'],
    ['Giordano', 'Sara', 'F'], ['Mancini', 'Davide', 'M'], ['Rizzo', 'Chiara', 'F'], ['Lombardi', 'Simone', 'M'],
    ['Moretti', 'Valentina', 'F'], ['Barbieri', 'Federico', 'M'], ['Fontana', 'Martina', 'F'], ['Santoro', 'Giuseppe', 'M'],
    ['Mariani', 'Laura', 'F'], ['Rinaldi', 'Alberto', 'M'], ['Caruso', 'Serena', 'F'], ['Ferrara', 'Nicola', 'M'],
    ['Gallo', 'Irene', 'F'], ['Martini', 'Roberto', 'M'], ['Leone', 'Elisa', 'F'], ['Longo', 'Fabio', 'M'],
    ['Gentile', 'Anna', 'F'], ['Martinelli', 'Andrea', 'M'], ['Vitale', 'Monica', 'F'], ['Serra', 'Daniele', 'M'],
    ['Coppola', 'Silvia', 'F'], ['De Santis', 'Marco', 'M'], ['D\'Angelo', 'Paola', 'F'], ['Pagano', 'Luigi', 'M']
  ];
  var DISTRIBUZIONE = [['d1', 16], ['d2', 3], ['d3', 3], ['d4', 2], ['d5', 2], ['d6', 2], ['d7', 1], ['d8', 1], ['d9', 2], ['d10', 2], ['d11', 1], ['d12', 1]];

  DB.lavoratori = [];
  (function () {
    var idx = 0;
    DISTRIBUZIONE.forEach(function (coppia) {
      var d = getDitta(coppia[0]);
      var mans = d.mansioni;
      for (var k = 0; k < coppia[1]; k++) {
        var a = ANAG[idx];
        var i = idx;
        var nascita = iso(new Date(1962 + (i * 7) % 37, (i * 5) % 12, (i * 3) % 27 + 1));
        var assunzione = iso(new Date(2012 + (i % 12), (i * 4) % 12, (i * 7) % 27 + 1));
        DB.lavoratori.push({
          id: 'l' + (i + 1),
          cognome: a[0], nome: a[1], sesso: a[2],
          nascita: nascita, luogoNascita: d.citta,
          cf: cfFake(a[0], a[1], nascita, a[2]), nazionalita: 'Italiana',
          residenza: 'Via ' + VIE[i % VIE.length] + ' ' + (2 + (i % 40)), comune: d.citta, prov: d.prov, cap: d.cap,
          tel: '340 ' + String(1000000 + i * 76543).slice(0, 6), email: (a[1] + '.' + a[0]).toLowerCase().replace(/[^a-z.]/g, '') + '@email.it',
          dittaId: coppia[0], mansioneId: mans[k % mans.length],
          assunzione: assunzione, risoluzione: '',
          sede: d.citta, matricola: 'M' + (1000 + i),
          rapporto: i % 9 === 0 ? 'Tempo determinato' : 'Tempo indeterminato',
          orario: i % 11 === 0 ? 'Turnista notturno' : i % 7 === 0 ? 'Turnista diurno' : 'Tempo pieno',
          sorveglianza: i !== 12 && i !== 24,
          note: i === 12 || i === 24 ? 'Non soggetto a sorveglianza sanitaria: mansione amministrativa senza rischi.' : '',
          medicoCurante: 'Dott. ' + ['Bianchi Carlo', 'Ferrari Luigi', 'Riva Elena', 'Sala Paolo'][i % 4],
          storicoId: ''
        });
        idx++;
      }
    });
  })();

  function cfFake(cognome, nome, nascita, sesso) {
    var cons = function (s) { return s.toUpperCase().normalize('NFD').replace(/[^A-Z]/g, ''); };
    var d = parseISO(nascita);
    var base = (cons(cognome) + cons(nome) + 'XX').slice(0, 6);
    return (base + String(d.getFullYear()).slice(-2) + 'ABCDEHLMPRST'[d.getMonth()] + pad(d.getDate()) + 'X' + (sesso === 'F' ? 'F' : 'M') + '123A').slice(0, 16).padEnd(16, 'X');
  }

  /* ---------- visite ---------- */
  var TIPI = ['Visita preventiva', 'Prima visita', 'Visita di controllo', 'Visita periodica', 'Visita straordinaria', 'Giudizio d\'idoneità specifica', 'Visita specialistica', 'Cessazione rapporto di lavoro', 'Cessazione esposizione a rischio', 'Visita rientro infortunio/malattia', 'Visita per cambio mansione'];
  var GIUDIZI = ['Idoneo alla mansione specifica', 'Idoneo temporaneamente alla mansione specifica', 'Idoneo con prescrizioni', 'Idoneo con prescrizioni temporanee', 'Idoneo con limitazioni', 'Idoneo con limitazioni temporanee', 'Idoneo con prescrizioni/limitazioni', 'Non idoneo temporaneamente', 'Non idoneo permanentemente', 'Attesa di accertamenti', 'Chiusa dal proprio medico competente', 'Non è possibile esprimere il giudizio d\'idoneità perché non ha completato gli esami previsti dal protocollo di sorveglianza sanitaria'];
  var MEZZI = ['Fax', 'Consegnata a mano al Datore di lavoro', 'Posta', 'Posta elettronica PEC'];
  var vseq = 0;

  function addVisita(o) {
    var v = { id: 'v' + (++vseq), stato: 'eseguita', note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', sede: 'CLS — sede di Brescia', ora: '', clinica: null };
    Object.keys(o).forEach(function (k) { v[k] = o[k]; });
    DB.visite.push(v); return v;
  }

  DB.lavoratori.forEach(function (l, i) {
    var d = getDitta(l.dittaId), mn = getMansione(l.mansioneId);
    var mesiFa = 3 + (i * 7) % 36;
    var data = addMesi(OGGI, -mesiFa);
    var giud = GIUDIZI[(i * 3) % GIUDIZI.length];
    if (i % 5 === 0) giud = 'Idoneo con prescrizioni';
    addVisita({
      lavoratoreId: l.id, dittaId: l.dittaId, medicoId: d.medicoId, mansioneId: l.mansioneId,
      data: data, tipo: i % 7 === 0 ? 'Prima visita' : i % 5 === 0 ? 'Visita straordinaria' : 'Visita periodica',
      giudizio: giud, prescrizioni: giud.indexOf('prescrizioni') >= 0 ? 'Evitare il sollevamento manuale di carichi superiori a 15 kg.' : giud.indexOf('limitazioni') >= 0 ? 'Limitazione alle attività in quota e sui ponteggi.' : '',
      successiva: mn.periodo, ora: '09:00', sede: i % 9 === 0 ? 'Sede aziendale (esterna)' : 'CLS — sede di Brescia'
    });
    if (i % 4 === 0) {
      addVisita({
        lavoratoreId: l.id, dittaId: l.dittaId, medicoId: d.medicoId, mansioneId: l.mansioneId,
        data: addMesi(data, -mn.periodo), tipo: 'Visita periodica', giudizio: 'Idoneo alla mansione specifica',
        successiva: mn.periodo, ora: '10:00', sede: 'CLS — sede di Brescia'
      });
    }
  });

  // appuntamenti della settimana corrente (9–15 novembre 2026)
  var APPUNTAMENTI = [
    ['l3', '2026-11-09', 9], ['l17', '2026-11-09', 11], ['l26', '2026-11-09', 14],
    ['l5', '2026-11-10', 8], ['l1', '2026-11-10', 10], ['l2', '2026-11-10', 10],
    ['l19', '2026-11-10', 15], ['l30', '2026-11-10', 13],
    ['l6', '2026-11-11', 9], ['l21', '2026-11-11', 11], ['l32', '2026-11-11', 15],
    ['l9', '2026-11-12', 8], ['l24', '2026-11-12', 10], ['l34', '2026-11-12', 11],
    ['l12', '2026-11-13', 9], ['l27', '2026-11-13', 13], ['l22', '2026-11-13', 10]
  ];
  APPUNTAMENTI.forEach(function (a, i) {
    var l = getLav(a[0]), d = getDitta(l.dittaId);
    addVisita({
      lavoratoreId: l.id, dittaId: l.dittaId, medicoId: d.medicoId, mansioneId: l.mansioneId,
      data: a[1], ora: pad(a[2]) + ':00', tipo: i % 6 === 0 ? 'Visita preventiva' : 'Visita periodica',
      stato: 'programmata', giudizio: '', successiva: 0,
      sede: i % 5 === 0 ? 'Sede aziendale (esterna)' : 'CLS — sede di Brescia'
    });
  });

  // visite già concluse a inizio novembre: danno sostanza al consuntivo del medico
  [['l3', '2026-11-03', '09:00', 38], ['l4', '2026-11-05', '10:00', 34], ['l6', '2026-11-07', '11:30', 42]].forEach(function (a) {
    var l = getLav(a[0]), d = getDitta(l.dittaId);
    addVisita({
      lavoratoreId: l.id, dittaId: l.dittaId, medicoId: d.medicoId, mansioneId: l.mansioneId,
      data: a[1], ora: a[2], durata: a[3], tipo: 'Visita periodica', giudizio: 'Idoneo alla mansione specifica',
      successiva: 24, prescrizioni: '', sede: 'CLS — sede di Brescia', modalita: 'sede', sala: 'Sala 1', bloccoId: ''
    });
  });

  // durata e modalità: dati storici per il tempo medio del medico
  DB.visite.forEach(function (v, i) {
    if (!v.durata) v.durata = 20 + (i * 7) % 20;
    v.modalita = /esterna/i.test(v.sede || '') ? 'esterna' : 'sede';
    if (v.modalita === 'sede' && !v.sala) v.sala = 'Sala ' + (1 + (i % 3));
    if (!v.bloccoId) v.bloccoId = '';
  });

  // blocchi esterni: il medico va dall'azienda e visita più lavoratori in sequenza
  DB.blocchi = [
    { id: 'b1', medicoId: 'm3', dittaId: 'd3', data: '2026-11-11', oraInizio: '09:00', oraFine: '11:30', durata: 25, capienza: 6, note: 'Visite periodiche in cantina' },
    { id: 'b2', medicoId: 'm4', dittaId: 'd4', data: '2026-11-13', oraInizio: '09:00', oraFine: '11:00', durata: 30, capienza: 4, note: 'Visite in cantiere' }
  ];
  var inBlocco = [
    ['l21', 'b1', '09:00', 25, '2026-11-11'],
    ['l22', 'b2', '09:00', 30, '2026-11-13']
  ];
  inBlocco.forEach(function (x) {
    var v = DB.visite.filter(function (y) { return y.lavoratoreId === x[0] && y.stato === 'programmata'; })[0];
    var b = DB.blocchi.filter(function (y) { return y.id === x[1]; })[0];
    var d = b ? getDitta(b.dittaId) : null;
    if (!v || !b || !d) return;
    v.bloccoId = b.id; v.medicoId = b.medicoId; v.data = x[4]; v.ora = x[2]; v.durata = x[3];
    v.modalita = 'esterna'; v.sala = ''; v.sede = d.ragione + ' — ' + d.indirizzo + ', ' + d.citta;
  });

  /* ---------- esami ---------- */
  var RISULTATI = {
    'SPIROMETRIA': ['NELLA NORMA', 'VALORI NEI LIMITI DELLA NORMA', 'SINDROME DISVENTILATORIA OSTRUTTIVA LIEVE', 'SINDROME DISVENTILATORIA OSTRUTTIVA MODERATA', 'SINDROME RESTRITTIVA LIEVE', 'SOGGETTO NON COLLABORANTE', 'ESAME DA RIPETERE'],
    'AUDIOMETRIA': ['CLASSE 0', 'IP CLASSE 1', 'IP CLASSE 2', 'IP CLASSE 3', 'ESAME NON ATTENDIBILE', 'ESAME DA RIPETERE'],
    'ECG': ['NELLA NORMA', 'RISCONTRO ALTERAZIONI', 'ESAME DA RIPETERE', 'VEDERE REFERTO IN CARTELLA'],
    'ESAME URINE': ['NELLA NORMA', 'VALORE RILEVABILE', 'RISCONTRO ALTERAZIONI', 'ESAME DA RIPETERE'],
    'SCREENING ERGOVISIVO': ['VISUS NELLA NORMA', 'DEFICIT VISIVO CORRETTO', 'DEFICIT VISIVO', 'PRESBIOPIA INIZIALE', 'ESAME DA RIPETERE'],
    'TEST SCREENING URINARIO SOSTANZE STUPEFACENTI': ['NEGATIVO', 'POSITIVO', 'IN ATTESA DI TEST DI CONFERMA'],
    'QUESTIONARIO ALCOOL': ['NEGATIVO', 'POSITIVO', 'CONSUMO OCCASIONALE', 'CONSUMO ABITUALE O MODERATO'],
    'VACCINAZIONE ANTITETANICA': ['EFFETTUATA', '1 DOSE', '2 DOSE', '3 DOSE', 'RICHIAMO'],
    'DOSAGGIO ANTICORPI ANTITETANO': ['POSITIVO PROTETTO', 'NON PROTETTO', 'BASSA PROTEZIONE', 'DEVE EFFETTUARE RICHIAMO'],
    'EMOCROMO + FL': ['NELLA NORMA', 'VALORE RILEVABILE', 'RISCONTRO ALTERAZIONI'],
    'AST, ALT, GGT': ['NELLA NORMA', 'VALORE RILEVABILE', 'RISCONTRO ALTERAZIONI'],
    'CDT': ['NELLA NORMA', 'VALORE RILEVABILE', 'RISCONTRO ALTERAZIONI'],
    'RX TORACE': ['NELLA NORMA', 'RISCONTRO ALTERAZIONI', 'ESAME DA RIPETERE'],
    'VISITA OCULISTICA': ['NELLA NORMA', 'DEFICIT VISIVO CORRETTO', 'ESAME DA RIPETERE'],
    'VISITA ORTOPEDICA': ['NELLA NORMA', 'RISCONTRO ALTERAZIONI', 'ESAME DA RIPETERE'],
    'VISITA CARDIOLOGICA CON ECG': ['NELLA NORMA', 'RISCONTRO ALTERAZIONI', 'ESAME DA RIPETERE'],
    'VISITA MEDICA': ['NELLA NORMA', 'ESAME EFFETTUATO'],
    'DEFAULT': ['NELLA NORMA', 'VALORE RILEVABILE', 'VALORE NON RILEVABILE', 'RISCONTRO ALTERAZIONI', 'ESAME EFFETTUATO', 'ESAME DA RIPETERE', 'ESAME NON PERVENUTO']
  };
  var eseq = 0;
  DB.visite.filter(function (v) { return v.stato === 'eseguita'; }).forEach(function (v, i) {
    var mn = getMansione(v.mansioneId);
    var prot = (mn.accertamenti || []).filter(function (a) { return /^\d+$/.test(a[1]) || a[1] === 'O'; }).slice(0, 3);
    prot.forEach(function (a, k) {
      var nome = a[0];
      var vals = RISULTATI[nome] || RISULTATI.DEFAULT;
      var res = k === 0 && i % 9 === 0 ? 'ESAME DA RIPETERE' : vals[0];
      DB.esami.push({
        id: 'e' + (++eseq), visitaId: v.id, lavoratoreId: v.lavoratoreId, dittaId: v.dittaId, medicoId: v.medicoId,
        data: addGiorni(v.data, k === 0 ? 0 : 2), accertamento: nome, risultato: res,
        esterno: k === 2 && i % 4 === 0, note: '', giudizioIdoneita: '', prescrizioni: '', stampato: false
      });
    });
  });

  /* ---------- vaccinazioni ---------- */
  var vaxseq = 0;
  DB.lavoratori.forEach(function (l, i) {
    var mn = getMansione(l.mansioneId);
    var haVax = (mn.accertamenti || []).some(function (a) { return /ANTITETANICA/.test(a[0]); });
    if (!haVax) return;
    var d1 = addMesi(OGGI, -(30 + (i * 5) % 60));
    DB.vaccinazioni.push({
      id: 'x' + (++vaxseq), lavoratoreId: l.id, dittaId: l.dittaId,
      tipo: 'ANTITETANICA', dose1: d1, dose2: addGiorni(d1, 40), dose3: addMesi(d1, 6),
      richiamo1: addMesi(OGGI, -(i * 4) % 48), richiamo2: i % 3 === 0 ? addMesi(OGGI, -(i * 7) % 60) : '', richiamo3: '',
      esterne: [false, false, false, false, false, false], note: ''
    });
  });

  /* ---------- sopralluoghi ---------- */
  var soprseq = 0;
  DB.ditte.filter(function (d) { return !d.cessazione; }).forEach(function (d, i) {
    var data = addMesi(OGGI, -(7 + (i * 3) % 9));
    DB.sopralluoghi.push({
      id: 'so' + (++soprseq), dittaId: d.id, medicoId: d.medicoId, data: data, stato: 'eseguito',
      cassetta: i % 4 === 0 ? 'Cassetta presente e rifornita' : 'Cassetta presente, integrare ghiaccio',
      prossimo: 12, indirizzo: '', infortuni: i % 6 === 0 ? 'si' : 'no', infortuniDett: i % 6 === 0 ? 'Un infortunio lieve da taglio nel 2025, denunciato regolarmente.' : '',
      dvr: true, dvrData: addMesi(data, -2), dvrNote: 'DVR aggiornato e disponibile in azienda.',
      attivita: d.attivita, rischi: (getMansione(d.mansioni[0] || 'mn1').rischi || []).join(', '),
      protezioni: 'si', protezioniQuali: 'DPI consegnati e registro firmato.',
      igiene: ['buone', 'buone', 'mediocre'][i % 3],
      noteRelazione: 'Sopralluogo periodico: ambiente di lavoro ordinato, percorsi di esodo liberi.',
      comunicazione: i % 3 === 0 ? 'Si raccomanda di aggiornare la segnaletica di sicurezza del reparto spedizioni.' : '',
      pronto: i % 2 === 0, noteAdmin: '', informale: i % 4 === 0
    });
  });
  // tre sopralluoghi in agenda questa settimana
  [['d2', '2026-11-11', 14, 'm2'], ['d4', '2026-11-12', 15, 'm4'], ['d6', '2026-11-13', 11, 'm2']].forEach(function (a) {
    DB.sopralluoghi.push({
      id: 'so' + (++soprseq), dittaId: a[0], medicoId: a[3], data: a[1], ora: pad(a[2]) + ':00', stato: 'programmato',
      cassetta: '', prossimo: 12, indirizzo: '', infortuni: 'no', infortuniDett: '', dvr: true, dvrData: '', dvrNote: '',
      attivita: getDitta(a[0]).attivita, rischi: '', protezioni: '', protezioniQuali: '', igiene: 'buone',
      noteRelazione: '', comunicazione: '', pronto: false, noteAdmin: '', informale: false
    });
  });

  /* ---------- corsi ---------- */
  var cseq = 0;
  DB.ditte.filter(function (d) { return !d.cessazione; }).forEach(function (d, i) {
    var data = addMesi(OGGI, -(i % 12) - 2);
    DB.corsi.push({
      id: 'c' + (++cseq), dittaId: d.id, nome: 'Formazione generale sicurezza (4 ore)', data: data,
      nominativo: i % 2 === 0 ? 'Tutti i dipendenti' : 'Nuove assunzioni', scadenza: addMesi(data, 60), ore: 4,
      rischio: 'Generale', note: ''
    });
    if (i % 2 === 0) DB.corsi.push({
      id: 'c' + (++cseq), dittaId: d.id, nome: 'Aggiornamento preposti (8 ore)', data: addMesi(data, 4),
      nominativo: 'Preposti di reparto', scadenza: addMesi(data, 64), ore: 8, rischio: 'Preposti', note: ''
    });
  });

  /* ---------- eventi agenda ---------- */
  var eseqEv = 0;
  DB.eventi = DB.visite.filter(function (v) { return v.stato === 'programmata'; }).map(function (v) {
    var l = getLav(v.lavoratoreId);
    return { id: 'ev' + (++eseqEv), tipo: 'visita', rifId: v.id, titolo: nomeLav(l), sottotitolo: v.tipo + ' · ' + getMansione(v.mansioneId).nome, data: v.data, ora: v.ora, medicoId: v.medicoId, dittaId: v.dittaId, lavoratoreId: l.id, durata: v.durata, modalita: v.modalita, sala: v.sala || '', bloccoId: v.bloccoId || '' };
  });
  [['l4', '2026-11-10', 16, 'VISITA CARDIOLOGICA CON ECG', 'm1'], ['l10', '2026-11-12', 14, 'SPIROMETRIA', 'm1'], ['l28', '2026-11-13', 15, 'AUDIOMETRIA', 'm2']].forEach(function (a) {
    var l = getLav(a[0]);
    DB.eventi.push({ id: 'ev' + (++eseqEv), tipo: 'esame', rifId: '', titolo: nomeLav(l), sottotitolo: a[3] + ' · esame specialistico', data: a[1], ora: pad(a[2]) + ':00', medicoId: a[4], dittaId: l.dittaId, lavoratoreId: l.id, durata: 45, modalita: 'sede', sala: 'Sala 2', bloccoId: '' });
  });
  DB.sopralluoghi.filter(function (s) { return s.stato === 'programmato'; }).forEach(function (s) {
    DB.eventi.push({ id: 'ev' + (++eseqEv), tipo: 'sopralluogo', rifId: s.id, titolo: nomeDitta(s.dittaId), sottotitolo: 'Sopralluogo' + (s.informale ? ' informale' : ''), data: s.data, ora: s.ora || '09:00', medicoId: s.medicoId, dittaId: s.dittaId, lavoratoreId: '', durata: 120, modalita: 'esterna', sala: '', bloccoId: '' });
  });
  function toMin(ora) {
    var p = String(ora || '09:00').split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  }
  /* ---------- logistica: luoghi, viaggi, preferenze clienti, disponibilità medici ---------- */
  // ponytail: coordinate per capoluogo e velocità media fissa; in produzione usare un servizio di distanze (OSRM / Google) sull'indirizzo reale
  var COORD = { CLS: [45.54, 10.22], BS: [45.54, 10.22], BG: [45.70, 9.67], VR: [45.44, 10.99], MN: [45.16, 10.79], CR: [45.13, 10.02], MI: [45.46, 9.19], CO: [45.81, 9.08], MB: [45.58, 9.27], LO: [45.31, 9.50], PV: [45.19, 9.16] };
  var VELOCITA_KMH = 60, TORTUOSITA = 1.3, MARGINE_MIN = 10, STESSA_ZONA_MIN = 15;
  function km(a, b) {
    var r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * TORTUOSITA;
  }
  // luogo di un'attività: 'CLS' (studio) oppure l'id della ditta
  function luogoDi(x) { return x.modalita === 'esterna' || (x.oraInizio && x.modalita !== 'sede') ? x.dittaId : 'CLS'; }
  function provDi(luogo) { return luogo === 'CLS' ? 'CLS' : (getDitta(luogo).prov || 'BS'); }
  function viaggio(a, b) {
    if (!a || !b || a === b) return 0;
    var pa = provDi(a), pb = provDi(b);
    if (pa === pb || (pa === 'CLS' && pb === 'BS') || (pa === 'BS' && pb === 'CLS')) return STESSA_ZONA_MIN;
    return Math.round(km(COORD[pa] || COORD.CLS, COORD[pb] || COORD.CLS) / VELOCITA_KMH * 60) + MARGINE_MIN;
  }
  function zona(luogo) {
    if (luogo === 'CLS') return 'Studio CLS · Brescia';
    var d = getDitta(luogo);
    return d.citta + ' (' + d.prov + ') · ' + viaggio('CLS', luogo) + "' dallo studio";
  }

  // preferenze di pianificazione per cliente (dati demo, modificabili dalla scheda ditta)
  var PREF = {
    d1: ['indifferente', false, 'studio', ''],
    d2: ['loco', true, 'cliente', 'Turni in magazzino: visite solo al mattino'],
    d3: ['loco', true, 'studio', 'Visite in cantina, giornata intera'],
    d4: ['loco', true, 'studio', 'Cantiere: il personale non può spostarsi'],
    d5: ['sede', false, 'cliente', ''],
    d6: ['sede', false, 'studio', 'Chiusi il lunedì'],
    d7: ['sede', false, 'cliente', ''],
    d8: ['indifferente', false, 'studio', ''],
    d9: ['loco', false, 'studio', 'Preferiscono in azienda per non fermare la produzione'],
    d10: ['sede', false, 'cliente', ''],
    d11: ['loco', true, 'studio', 'Lavoratori nei campi, raggiungibili solo in azienda'],
    d12: ['sede', false, 'studio', ''],
    d13: ['sede', false, 'studio', '']
  };
  DB.ditte.forEach(function (d) {
    var p = PREF[d.id] || ['indifferente', false, 'studio', ''];
    if (!d.modalitaVisite) d.modalitaVisite = p[0];
    if (d.locoObbligatoria === undefined) d.locoObbligatoria = p[1];
    if (!d.prenotazione) d.prenotazione = p[2];
    if (d.notePianificazione === undefined) d.notePianificazione = p[3];
  });

  // disponibilità settimanale dei medici: giorno (1 = lunedì) → fasce orarie
  var LV = [1, 2, 3, 4, 5];
  function fasce(giorni, da, a) { var o = {}; giorni.forEach(function (g) { o[g] = [[da, a]]; }); return o; }
  var DISP = {
    m1: ['Tempo pieno', fasce(LV, '08:00', '18:00')],
    m2: ['Parziale', fasce([1, 2, 3, 5], '09:00', '18:00')],
    m3: ['Parziale', fasce([2, 3], '08:00', '14:00')],
    m4: ['Parziale', fasce([4, 5], '08:00', '18:00')],
    m5: ['Parziale', fasce([1, 4], '13:00', '18:00')],
    m6: ['Parziale', fasce([2, 4], '08:00', '13:00')],
    m7: ['Parziale', fasce([4, 5], '08:00', '13:00')],
    m8: ['Parziale', fasce([1, 3, 5], '14:00', '18:00')]
  };
  DB.medici.forEach(function (m) {
    var p = DISP[m.id] || ['Tempo pieno', fasce(LV, '08:00', '18:00')];
    if (!m.disponibilita) { m.regime = p[0]; m.disponibilita = p[1]; }
  });
  function disponibilita(medicoId, data) {
    var m = getMedico(medicoId), g = asDate(data).getDay();
    return ((m.disponibilita || {})[g] || []).map(function (f) { return [toMin(f[0]), toMin(f[1])]; });
  }
  function minutiDisponibili(medicoId, data) { return disponibilita(medicoId, data).reduce(function (s, f) { return s + f[1] - f[0]; }, 0); }
  function testoDisponibilita(medicoId) {
    var m = getMedico(medicoId), per = {};
    Object.keys(m.disponibilita || {}).forEach(function (g) {
      var k = m.disponibilita[g].map(function (f) { return f[0].replace(':00', '') + '–' + f[1].replace(':00', ''); }).join(', ');
      (per[k] = per[k] || []).push(GIORNI[Number(g)].slice(0, 3));
    });
    return Object.keys(per).map(function (k) { return per[k].join(' ') + ' ' + k; }).join(' · ') || 'Nessuna disponibilità';
  }
  function dentroDisponibilita(medicoId, data, da, a) {
    return disponibilita(medicoId, data).some(function (f) { return da >= f[0] && a <= f[1]; });
  }

  // presenze del medico in un giorno: eventi fuori blocco + blocchi, ordinate, con luogo
  function presenze(medicoId, data) {
    var out = [];
    DB.eventi.forEach(function (e) {
      if (e.medicoId !== medicoId || e.data !== data || e.bloccoId) return;
      out.push({ rif: e, da: toMin(e.ora), a: toMin(e.ora) + (Number(e.durata) || 30), luogo: luogoDi(e) });
    });
    DB.blocchi.forEach(function (b) {
      if (b.medicoId !== medicoId || b.data !== data) return;
      out.push({ rif: b, da: toMin(b.oraInizio), a: toMin(b.oraFine), luogo: luogoDi(b) });
    });
    return out.sort(function (x, y) { return x.da - y.da; });
  }

  function calcolaConflitti() {
    DB.eventi.forEach(function (e) { e.conflitto = false; });
    DB.blocchi.forEach(function (b) { b.conflitto = false; });
    DB.eventi.forEach(function (a) {
      var a1 = toMin(a.ora), a2 = a1 + (a.durata || 30);
      DB.eventi.forEach(function (b) {
        if (a === b || a.medicoId !== b.medicoId || a.data !== b.data || (a.bloccoId && a.bloccoId === b.bloccoId)) return;
        var b1 = toMin(b.ora), b2 = b1 + (b.durata || 30);
        if (a1 < b2 && b1 < a2) { a.conflitto = true; b.conflitto = true; }
      });
      DB.blocchi.forEach(function (bl) {
        if (bl.medicoId !== a.medicoId || bl.data !== a.data || a.bloccoId === bl.id) return;
        var b1 = toMin(bl.oraInizio), b2 = toMin(bl.oraFine);
        if (a1 < b2 && b1 < a2) { a.conflitto = true; bl.conflitto = true; }
      });
    });
    DB.blocchi.forEach(function (b1) {
      DB.blocchi.forEach(function (b2) {
        if (b1 === b2 || b1.medicoId !== b2.medicoId || b1.data !== b2.data) return;
        if (toMin(b1.oraInizio) < toMin(b2.oraFine) && toMin(b2.oraInizio) < toMin(b1.oraFine)) { b1.conflitto = true; b2.conflitto = true; }
      });
    });
  }
  function calcolaLogistica() {
    DB.eventi.forEach(function (e) { e.viaggio = null; e.fuoriDisp = false; });
    DB.blocchi.forEach(function (b) { b.viaggio = null; b.fuoriDisp = false; });
    var visti = {};
    DB.eventi.concat(DB.blocchi).forEach(function (x) {
      var k = x.medicoId + '|' + x.data;
      if (visti[k]) return;
      visti[k] = true;
      var ps = presenze(x.medicoId, x.data);
      ps.forEach(function (p, i) {
        p.rif.fuoriDisp = !dentroDisponibilita(x.medicoId, x.data, p.da, p.a);
        var prec = ps[i - 1];
        if (!prec) return;
        var serve = viaggio(prec.luogo, p.luogo);
        if (!serve) return;
        var gap = p.da - prec.a;
        p.rif.viaggio = { da: prec.luogo, a: p.luogo, minuti: serve, margine: gap, ok: gap >= serve };
      });
    });
  }
  function calcolaTutto() { calcolaConflitti(); calcolaLogistica(); }
  calcolaTutto();
  function durataMedia(medicoId) {
    var ds = DB.visite.filter(function (v) { return v.stato === 'eseguita' && v.medicoId === medicoId && v.durata; }).map(function (v) { return v.durata; });
    if (!ds.length) return 30;
    return Math.round(ds.reduce(function (a, b) { return a + b; }, 0) / ds.length);
  }

  function utenteCorrente() { return (window.STATE && window.STATE.utente) || null; }
  function ruoloLabel(r) { return r === 'medico' ? 'Medico competente' : r === 'ditta' ? 'Azienda cliente' : 'Operatore CLS'; }
  function ditteVisibili() {
    var u = utenteCorrente();
    if (u && u.ruolo === 'medico') return DB.ditte.filter(function (d) { return d.medicoId === u.medicoId; });
    if (u && u.ruolo === 'ditta') return DB.ditte.filter(function (d) { return d.id === u.dittaId; });
    return DB.ditte;
  }
  function lavVisibili() {
    var u = utenteCorrente(), ids = {};
    if (u && u.ruolo === 'medico') { ditteVisibili().forEach(function (d) { ids[d.id] = true; }); return DB.lavoratori.filter(function (l) { return ids[l.dittaId]; }); }
    if (u && u.ruolo === 'ditta') return DB.lavoratori.filter(function (l) { return l.dittaId === u.dittaId; });
    return DB.lavoratori;
  }
  function mediciVisibili() {
    var u = utenteCorrente();
    if (u && u.ruolo === 'medico') return DB.medici.filter(function (m) { return m.id === u.medicoId; });
    return DB.medici;
  }
  function puoDitta(id) { return ditteVisibili().some(function (d) { return d.id === id; }); }
  function puoLav(l) { return !!(l && l.id) && lavVisibili().some(function (x) { return x.id === l.id; }); }

  // permessi per pagina: un solo posto per nav, guardia di rotta e azioni
  var PAGINE_RUOLO = {
    dashboard: ['operatore', 'medico', 'ditta'],
    attivita: ['operatore'], pianifica: ['operatore'], agenda: ['operatore', 'medico'], scadenziario: ['operatore', 'medico', 'ditta'], consuntivo: ['medico'],
    ditte: ['operatore', 'medico'], lavoratori: ['operatore', 'medico', 'ditta'],
    medici: ['operatore'], mansioni: ['operatore'],
    visite: ['operatore', 'medico', 'ditta'], esami: ['operatore', 'medico', 'ditta'],
    vaccinazioni: ['operatore'], sopralluoghi: ['operatore', 'medico'], corsi: ['operatore', 'ditta'],
    documenti: ['operatore', 'medico', 'ditta'], fatture: ['operatore', 'ditta'], mago: ['operatore'], report: ['operatore'], utenti: ['operatore']
  };
  function ruolo() { var u = utenteCorrente(); return u ? u.ruolo : 'operatore'; }
  function puoPagina(id) { return (PAGINE_RUOLO[id] || ['operatore']).indexOf(ruolo()) >= 0; }
  function perDitte(lista) {
    var u = utenteCorrente();
    if (!u || u.ruolo === 'operatore') return lista;
    var ids = {};
    ditteVisibili().forEach(function (d) { ids[d.id] = true; });
    return lista.filter(function (x) { return ids[x.dittaId]; });
  }
  function visiteVisibili() { return perDitte(DB.visite); }
  function esamiVisibili() { return perDitte(DB.esami); }
  function vaccinazioniVisibili() { return perDitte(DB.vaccinazioni); }
  function sopralluoghiVisibili() { return perDitte(DB.sopralluoghi); }
  function corsiVisibili() { return perDitte(DB.corsi); }
  function documentiVisibili() { return perDitte(DB.documenti); }
  function scadenzeVisibili() { return perDitte(DB.scadenze); }
  function eventiVisibili() {
    var u = utenteCorrente();
    if (!u || u.ruolo === 'operatore') return DB.eventi;
    if (u.ruolo === 'medico') return DB.eventi.filter(function (e) { return e.medicoId === u.medicoId; });
    return DB.eventi.filter(function (e) { return e.dittaId === u.dittaId; });
  }
  function blocchiVisibili() {
    var u = utenteCorrente();
    if (!u || u.ruolo === 'operatore') return DB.blocchi;
    if (u.ruolo === 'medico') return DB.blocchi.filter(function (b) { return b.medicoId === u.medicoId; });
    return DB.blocchi.filter(function (b) { return b.dittaId === u.dittaId; });
  }

  /* ---------- scadenze ---------- */
  var sseq = 0;
  function addScad(o) { DB.scadenze.push(Object.assign({ id: 's' + (++sseq), fissata: false, note: '' }, o)); }
  DB.lavoratori.forEach(function (l) {
    var d = getDitta(l.dittaId), mn = getMansione(l.mansioneId);
    if (!l.sorveglianza) return;
    var uv = ultimaVisita(l.id), prog = prossimaVisita(l.id);
    if (uv || prog) {
      var data = prog ? prog.data : addMesi(uv.data, mn.periodo);
      addScad({
        entita: 'Lavoratore', tipo: 'Visita', soggetto: nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id,
        cosa: 'Visita periodica', descrizione: 'Mansione: ' + mn.nome, data: data, medicoId: d.medicoId,
        fissata: !!prog, note: prog ? 'Appuntamento già fissato in agenda' : ''
      });
    }
    var esami = esamiLav(l.id);
    var fatti = {};
    esami.forEach(function (e) {
      if (fatti[e.accertamento]) return;
      fatti[e.accertamento] = true;
      var prot = (mn.accertamenti || []).find(function (a) { return a[0] === e.accertamento; });
      if (!prot || !/^\d+$/.test(prot[1])) return;
      addScad({
        entita: 'Lavoratore', tipo: 'Accertamento', soggetto: nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id,
        cosa: e.accertamento, descrizione: 'Periodicità ' + prot[1] + ' mesi', data: addMesi(e.data, Number(prot[1])), medicoId: d.medicoId
      });
    });
    vaccLav(l.id).forEach(function (v) {
      var ultima = v.richiamo2 || v.richiamo1 || v.dose3 || v.dose1;
      if (!ultima) return;
      addScad({ entita: 'Lavoratore', tipo: 'Vaccinazione', soggetto: nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, cosa: v.tipo, descrizione: 'Richiamo vaccinale', data: addMesi(ultima, 60), medicoId: d.medicoId });
    });
  });
  DB.sopralluoghi.filter(function (s) { return s.stato === 'eseguito'; }).forEach(function (s) {
    addScad({ entita: 'Ditta', tipo: 'Sopralluogo', soggetto: nomeDitta(s.dittaId), dittaId: s.dittaId, cosa: 'Sopralluogo periodico', descrizione: 'Verifica ambienti di lavoro', data: addMesi(s.data, s.prossimo || 12), medicoId: s.medicoId, fissata: DB.sopralluoghi.some(function (x) { return x.dittaId === s.dittaId && x.stato === 'programmato'; }) });
  });
  DB.corsi.forEach(function (c) {
    addScad({ entita: 'Ditta', tipo: 'Corso', soggetto: nomeDitta(c.dittaId), dittaId: c.dittaId, cosa: c.nome, descrizione: c.nominativo + ' · ' + c.ore + ' ore', data: c.scadenza, medicoId: getDitta(c.dittaId).medicoId });
  });
  DB.ditte.forEach(function (d) {
    if (lavoratoriDitta(d.id).length > 15) {
      addScad({
        entita: 'Ditta', tipo: 'Riunione', soggetto: d.ragione, dittaId: d.id, cosa: 'Riunione periodica annuale',
        descrizione: 'Ditta con più di 15 dipendenti: incontro periodico art. 35 D.Lgs. 81/08',
        data: '2026-10-30', medicoId: d.medicoId, note: 'Regola automatica: aziende con più di 15 dipendenti.'
      });
    }
    if (d.riunioni) {
      addScad({ entita: 'Ditta', tipo: 'Riunione', soggetto: d.ragione, dittaId: d.id, cosa: 'Riunione periodica', descrizione: 'Riunione annuale con RSPP e datore di lavoro', data: addMesi(OGGI, -1 + (d.id === 'd9' ? -2 : 0)), medicoId: d.medicoId });
    }
  });
  DB.scadenze.sort(function (a, b) { return a.data.localeCompare(b.data); });

  /* ---------- da pianificare ---------- */
  DB.daPianificare = DB.scadenze.filter(function (s) {
    return s.tipo === 'Visita' && giorniA(s.data) < 0 && !s.fissata;
  }).slice(0, 7).map(function (s) {
    return { lavoratoreId: s.lavoratoreId, motivo: 'Visita scaduta il ' + fmtData(s.data), urgenza: giorniA(s.data) < -60 ? 'alta' : 'media', scadenzaId: s.id };
  });

  /* ---------- documenti ---------- */
  var dseq = 0;
  DB.visite.filter(function (v) { return v.stato === 'eseguita' && v.giudizio; }).slice(0, 22).forEach(function (v) {
    var l = getLav(v.lavoratoreId);
    DB.documenti.push({
      id: 'doc' + (++dseq), tipo: 'Giudizio di idoneità', soggetto: nomeLav(l), dittaId: v.dittaId, lavoratoreId: l.id,
      anno: asDate(v.data).getFullYear(), dataDoc: v.data, stato: 'Firmato e inviato', generatoIl: v.data,
      email: l.email, visitaId: v.id, firma: 'Dott. ' + nomeMedico(v.medicoId)
    });
  });
  DB.ditte.filter(function (d) { return !d.cessazione; }).forEach(function (d, i) {
    DB.documenti.push({ id: 'doc' + (++dseq), tipo: i % 2 === 0 ? 'Piano di Sorveglianza (PSS)' : 'Relazione Annuale (RFA)', soggetto: d.ragione, dittaId: d.id, lavoratoreId: '', anno: 2026, dataDoc: addMesi(OGGI, -2), stato: i % 3 === 0 ? 'Bozza' : 'Pronto', generatoIl: addGiorni(OGGI, -12), email: d.emailVisite, visitaId: '', firma: '' });
  });
  DB.sopralluoghi.filter(function (s) { return s.stato === 'eseguito' && s.pronto; }).forEach(function (s) {
    DB.documenti.push({ id: 'doc' + (++dseq), tipo: 'Verbale sopralluogo', soggetto: nomeDitta(s.dittaId), dittaId: s.dittaId, lavoratoreId: '', anno: 2026, dataDoc: s.data, stato: 'Pronto', generatoIl: s.data, email: getDitta(s.dittaId).emailVisite, visitaId: '', firma: '' });
  });

  // tre certificati in coda: l'invio automatico è fallito e vanno trasmessi a mano
  DB.documenti.filter(function (d) { return d.tipo === 'Giudizio di idoneità'; }).slice(3, 6).forEach(function (d) { d.stato = 'Da inviare'; });

  /* ---------- note aggregate ---------- */
  DB.ditte.forEach(function (d) {
    if (d.note) DB.note.push({ data: addGiorni(OGGI, -20), dittaId: d.id, tipo: 'Ditta', lavoratoreId: '', testo: d.note });
  });
  DB.lavoratori.filter(function (l) { return l.note; }).forEach(function (l) {
    DB.note.push({ data: addGiorni(OGGI, -40), dittaId: l.dittaId, tipo: 'Lavoratore', lavoratoreId: l.id, testo: l.note });
  });
  DB.sopralluoghi.filter(function (s) { return s.comunicazione; }).forEach(function (s) {
    DB.note.push({ data: s.data, dittaId: s.dittaId, tipo: 'Sopralluogo', lavoratoreId: '', testo: s.comunicazione });
  });
  DB.corsi.forEach(function (c) {
    if (c.note) DB.note.push({ data: c.data, dittaId: c.dittaId, tipo: 'Corso', lavoratoreId: '', testo: c.note });
  });
  DB.note.sort(function (a, b) { return b.data.localeCompare(a.data); });

  /* ---------- fatturazione ---------- */
  (function () {
    var gruppi = {};
    DB.visite.filter(function (v) { return v.stato === 'eseguita' && giorniA(v.data) > -180; }).forEach(function (v) {
      var m = v.data.slice(0, 7);
      var key = v.dittaId + '|' + m;
      var g = gruppi[key] || (gruppi[key] = { dittaId: v.dittaId, medicoId: v.medicoId, data: v.data, visite: 0, esami: 0, vacc: 0, quali: {}, qualiVacc: {}, S: false, R: getDitta(v.dittaId).riunioni });
      g.visite++;
      g.data = v.data > g.data ? v.data : g.data;
      esamiVisita(v.id).forEach(function (e) { g.esami++; g.quali[e.accertamento] = 1; });
    });
    DB.vaccinazioni.forEach(function (x) {
      var m = (x.richiamo1 || x.dose1).slice(0, 7);
      var key = x.dittaId + '|' + m;
      var g = gruppi[key];
      if (g) { g.vacc++; g.qualiVacc[x.tipo] = 1; }
    });
    DB.sopralluoghi.forEach(function (s) {
      var key = s.dittaId + '|' + s.data.slice(0, 7);
      if (gruppi[key]) gruppi[key].S = true;
    });
    DB.fatturazione = Object.keys(gruppi).map(function (k) {
      var g = gruppi[k];
      return { id: 'f' + k, data: g.data, dittaId: g.dittaId, medicoId: g.medicoId, S: g.S, R: g.R, visite: g.visite, esami: g.esami, quali: Object.keys(g.quali).join(', '), vacc: g.vacc, qualiVacc: Object.keys(g.qualiVacc).join(', ') };
    }).sort(function (a, b) { return b.data.localeCompare(a.data); });
  })();

  /* ---------- utilità di stato ---------- */
  function statoScadenza(data) {
    var g = giorniA(data);
    if (g < 0) return { giorni: g, tone: 'err', label: 'Scaduta da ' + Math.abs(g) + ' gg' };
    if (g === 0) return { giorni: 0, tone: 'err', label: 'Oggi' };
    if (g <= 15) return { giorni: g, tone: 'warn', label: 'Tra ' + g + ' gg' };
    if (g <= 45) return { giorni: g, tone: 'warn', label: 'Tra ' + g + ' gg' };
    return { giorni: g, tone: 'ok', label: fmtData(data) };
  }
  function chipGiudizio(g) {
    if (!g) return '';
    if (/^Non idoneo/.test(g)) return 'err';
    if (/Attesa|Non è possibile/.test(g)) return 'warn';
    if (/prescrizioni|limitazioni/.test(g)) return 'info';
    return 'ok';
  }
  function settimana(offset) {
    var lun = new Date(2026, 10, 9); // lunedì 9/11/2026
    lun.setDate(lun.getDate() + (offset || 0) * 7);
    var giorni = [];
    for (var i = 0; i < 7; i++) { var d = new Date(lun); d.setDate(d.getDate() + i); giorni.push(iso(d)); }
    return giorni;
  }

  /* ---------- compensi medici e fatture clienti ---------- */
  // compenso a prestazione (visita, esame, sopralluogo) + trasferta per blocco esterno
  DB.tariffe = {};
  DB.medici.forEach(function (m, i) {
    DB.tariffe[m.id] = { visita: 38 + (i % 3) * 3, esame: 12 + (i % 2) * 3, sopralluogo: 140 + i * 5, trasferta: 50 };
  });
  function compensiMedico(medicoId, mese) {
    var t = DB.tariffe[medicoId] || { visita: 38, esame: 12, sopralluogo: 150, trasferta: 50 };
    var righe = [];
    DB.visite.filter(function (v) { return v.stato === 'eseguita' && v.medicoId === medicoId && String(v.data).slice(0, 7) === mese; }).forEach(function (v) {
      righe.push({ data: v.data, prestazione: 'Visita', descrizione: v.tipo, soggetto: nomeLav(getLav(v.lavoratoreId)), ditta: nomeDitta(v.dittaId), importo: t.visita });
    });
    DB.esami.filter(function (e) { return e.medicoId === medicoId && String(e.data).slice(0, 7) === mese; }).forEach(function (e) {
      righe.push({ data: e.data, prestazione: 'Accertamento', descrizione: e.accertamento, soggetto: nomeLav(getLav(e.lavoratoreId)), ditta: nomeDitta(e.dittaId), importo: t.esame });
    });
    DB.sopralluoghi.filter(function (s) { return s.stato === 'eseguito' && s.medicoId === medicoId && String(s.data).slice(0, 7) === mese; }).forEach(function (s) {
      righe.push({ data: s.data, prestazione: 'Sopralluogo', descrizione: 'Verifica ambienti di lavoro', soggetto: nomeDitta(s.dittaId), ditta: nomeDitta(s.dittaId), importo: t.sopralluogo });
    });
    DB.blocchi.filter(function (b) { return b.medicoId === medicoId && String(b.data).slice(0, 7) === mese; }).forEach(function (b) {
      righe.push({ data: b.data, prestazione: 'Trasferta', descrizione: 'Visite esterne ' + b.oraInizio + '–' + b.oraFine, soggetto: nomeDitta(b.dittaId), ditta: nomeDitta(b.dittaId), importo: t.trasferta });
    });
    righe.sort(function (a, b) { return a.data.localeCompare(b.data) || a.prestazione.localeCompare(b.prestazione); });
    return {
      righe: righe,
      totale: righe.reduce(function (a, r) { return a + r.importo; }, 0),
      visite: righe.filter(function (r) { return r.prestazione === 'Visita'; }).length,
      esami: righe.filter(function (r) { return r.prestazione === 'Accertamento'; }).length,
      sopralluoghi: righe.filter(function (r) { return r.prestazione === 'Sopralluogo'; }).length,
      trasferte: righe.filter(function (r) { return r.prestazione === 'Trasferta'; }).length
    };
  }

  DB.fatture = [];
  (function () {
    var seq = 0;
    DB.ditte.filter(function (d) { return !d.cessazione; }).forEach(function (d) {
      [-1, -2, -3].forEach(function (k) {
        var m = new Date(OGGI.getFullYear(), OGGI.getMonth() + k, 1);
        var ym = iso(m).slice(0, 7);
        var qv = DB.visite.filter(function (v) { return v.dittaId === d.id && v.stato === 'eseguita' && String(v.data).slice(0, 7) === ym; }).length;
        var qe = DB.esami.filter(function (e) { return e.dittaId === d.id && String(e.data).slice(0, 7) === ym; }).length;
        var qs = DB.sopralluoghi.filter(function (s) { return s.dittaId === d.id && s.stato === 'eseguito' && String(s.data).slice(0, 7) === ym; }).length;
        qv = qv || 6 + (seq % 5);
        qe = qe || 3 + (seq % 4);
        var righe = [
          { descrizione: 'Visite mediche di sorveglianza sanitaria', qta: qv, prezzo: 35 },
          { descrizione: 'Accertamenti strumentali e di laboratorio', qta: qe, prezzo: 14 }
        ];
        if (qs) righe.push({ descrizione: 'Sopralluogo ambienti di lavoro', qta: qs, prezzo: 180 });
        if (d.riunioni) righe.push({ descrizione: 'Riunione periodica art. 35 D.Lgs. 81/08', qta: 1, prezzo: 120 });
        var imponibile = righe.reduce(function (a, r) { return a + r.qta * r.prezzo; }, 0);
        var iva = Math.round(imponibile * 0.22 * 100) / 100;
        var data = iso(new Date(m.getFullYear(), m.getMonth() + 1, 5));
        DB.fatture.push({
          id: 'f' + (++seq), numero: 'FT-2026/' + pad(100 + seq), dittaId: d.id, data: data,
          scadenza: addGiorni(data, 30), periodo: MESI[m.getMonth()] + ' ' + m.getFullYear(), righe: righe,
          imponibile: imponibile, iva: iva, totale: Math.round((imponibile + iva) * 100) / 100,
          stato: k === -1 ? 'Da pagare' : 'Pagata'
        });
      });
    });
  })();

  window.DB = DB;
  window.OGGI = OGGI;
  window.TIPI_VISITA = TIPI;
  window.GIUDIZI = GIUDIZI;
  window.MEZZI = MEZZI;
  window.RISULTATI = RISULTATI;
  window.U = {
    esc: esc, pad: pad, iso: iso, parseISO: parseISO, asDate: asDate, addGiorni: addGiorni, addMesi: addMesi,
    fmtData: fmtData, fmtBreve: fmtBreve, fmtLunga: fmtLunga, meseAnno: meseAnno, giorniA: giorniA, eta: eta, iniziali: iniziali, fmtEuro: fmtEuro,
    getDitta: getDitta, getLav: getLav, getMedico: getMedico, getMansione: getMansione,
    nomeLav: nomeLav, nomeDitta: nomeDitta, nomeMedico: nomeMedico, ditteDelMedico: ditteDelMedico, mansioneInDitta: mansioneInDitta,
    lavoratoriDitta: lavoratoriDitta, visiteLav: visiteLav, esamiVisita: esamiVisita, esamiLav: esamiLav,
    vaccLav: vaccLav, scadenzeLav: scadenzeLav, ultimaVisita: ultimaVisita, prossimaVisita: prossimaVisita,
    scadenzaProssima: scadenzaProssima, statoScadenza: statoScadenza, chipGiudizio: chipGiudizio, settimana: settimana, ricalcolaConflitti: calcolaTutto, viaggio: viaggio, zona: zona, luogoDi: luogoDi, provDi: provDi, presenze: presenze, disponibilita: disponibilita, minutiDisponibili: minutiDisponibili, testoDisponibilita: testoDisponibilita, dentroDisponibilita: dentroDisponibilita, toMin: toMin, durataMedia: durataMedia, compensiMedico: compensiMedico,
    utenteCorrente: utenteCorrente, ruoloLabel: ruoloLabel, ruolo: ruolo, ditteVisibili: ditteVisibili, lavVisibili: lavVisibili, mediciVisibili: mediciVisibili, puoDitta: puoDitta, puoLav: puoLav,
    puoPagina: puoPagina, visiteVisibili: visiteVisibili, esamiVisibili: esamiVisibili, vaccinazioniVisibili: vaccinazioniVisibili, sopralluoghiVisibili: sopralluoghiVisibili, corsiVisibili: corsiVisibili, documentiVisibili: documentiVisibili, scadenzeVisibili: scadenzeVisibili, eventiVisibili: eventiVisibili, blocchiVisibili: blocchiVisibili,
    MESI: MESI, GIORNI: GIORNI
  };

  // self-check dei dati demo (fallisce solo in console, non blocca l'interfaccia)
  console.assert(DB.lavoratori.length === 36, 'Attesi 36 lavoratori demo');
  console.assert(DB.lavoratori.every(function (l) { return getDitta(l.dittaId).id && getMansione(l.mansioneId).id; }), 'Lavoratore senza ditta o mansione valida');
  console.assert(DB.visite.every(function (v) { return v.data && getLav(v.lavoratoreId).id; }), 'Visita senza data o lavoratore');
  console.assert(DB.ditte.every(function (d) { return d.mansioni.every(function (id) { return getMansione(id).id; }); }), 'Ditta con mansione inesistente');
})();
