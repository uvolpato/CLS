/* =========================================================
   CLS · esperienza mobile del medico (stessi dati della SPA)
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  var OGGI_ISO = U.iso(window.OGGI);
  var START = 8 * 60, SLOT = 30;

  function attivo() {
    var u = U.utenteCorrente();
    return !!u && u.ruolo === 'medico' && window.matchMedia('(max-width: 1180px)').matches;
  }
  function toMin(ora) { var p = String(ora || '09:00').split(':').map(Number); return (p[0] || 0) * 60 + (p[1] || 0); }
  function fmtMin(m) { m = Math.max(0, Math.min(1439, Math.round(m))); return U.pad(Math.floor(m / 60)) + ':' + U.pad(m % 60); }
  function dur(e) { return Number(e && e.durata) || 30; }
  function fine(e) { return fmtMin(toMin(e.ora) + dur(e)); }
  function eventiGiorno(g) {
    return U.eventiVisibili().filter(function (e) { return e.data === g; }).sort(function (a, b) { return (a.ora + a.id).localeCompare(b.ora + b.id); });
  }
  function blocchiGiorno(g) { return U.blocchiVisibili().filter(function (b) { return b.data === g; }); }

  /* ---------- shell ---------- */
  function backHref(parti) {
    var p = parti[0] || 'dashboard', id = parti[1] || '';
    if (p === 'lavoratori' && id) return '#/lavoratori';
    if (p === 'ditte' && id) return '#/ditte';
    if (p === 'visite' && id === 'nuova') return '#/lavoratori';
    if (['consuntivo', 'esami', 'scadenziario', 'visite', 'ditte'].indexOf(p) >= 0) return '#/dashboard';
    return '';
  }
  function tabbar(p) {
    var extra = p !== 'dashboard' && p !== 'agenda' && p !== 'lavoratori' && p !== 'documenti';
    return '<nav class="m-tabbar" aria-label="Navigazione mobile">' +
      '<a href="#/dashboard" class="' + (p === 'dashboard' ? 'on' : '') + '">' + UI.ic('home') + '<span>Oggi</span></a>' +
      '<a href="#/agenda" class="' + (p === 'agenda' ? 'on' : '') + '">' + UI.ic('calendar') + '<span>Agenda</span></a>' +
      '<a href="#/lavoratori" class="' + (p === 'lavoratori' ? 'on' : '') + '">' + UI.ic('users') + '<span>Pazienti</span></a>' +
      '<a href="#/documenti" class="' + (p === 'documenti' ? 'on' : '') + '">' + UI.ic('file') + '<span>Documenti</span></a>' +
      '<button type="button" data-azione="m-altro" aria-expanded="false" aria-controls="m-sheet" class="' + (extra ? 'on' : '') + '">' + UI.ic('grid') + '<span>Altro</span></button></nav>';
  }
  function sheetHtml() {
    var u = U.utenteCorrente();
    return '<div class="m-sheet" id="m-sheet" hidden><div class="m-sheet-bg" data-azione="m-altro"></div><div class="m-sheet-panel" role="menu" aria-label="Altre sezioni">' +
      '<div class="m-sheet-head"><span class="avatar-md">' + U.esc(U.iniziali(u.nome)) + '</span><div><b>' + U.esc(u.nome) + '</b><span>' + U.esc(U.ruoloLabel(u.ruolo)) + '</span></div></div>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-vai" data-href="#/scadenziario">' + UI.ic('clock') + ' Scadenze</button>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-vai" data-href="#/esami">' + UI.ic('activity') + ' Esami e referti</button>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-vai" data-href="#/visite">' + UI.ic('heart') + ' Visite</button>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-vai" data-href="#/ditte">' + UI.ic('building') + ' Aziende</button>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-vai" data-href="#/consuntivo">' + UI.ic('euro') + ' Consuntivo</button>' +
      '<div class="m-sheet-sep"></div>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-desktop">' + UI.ic('grid') + ' Apri gestionale</button>' +
      '<div class="m-sheet-note">Sul telefono: menu del browser → Aggiungi a schermata Home per l’uso a tutto schermo.</div>' +
      '<div class="m-sheet-sep"></div>' +
      '<button type="button" class="m-sheet-voce" data-azione="m-profilo">' + UI.ic('user') + ' Il mio profilo</button>' +
      '<button type="button" class="m-sheet-voce danger" data-azione="m-esci">' + UI.ic('logout') + ' Esci</button>' +
      '</div></div>';
  }
  function shell(vista, parti) {
    var p = parti[0] || 'dashboard';
    var back = backHref(parti);
    return '<div class="m-app">' +
      '<header class="m-head"><div class="m-head-row">' + (back ? '<a class="m-back" href="' + back + '" aria-label="Indietro">' + UI.ic('left') + '</a>' : '<span class="m-back-sp"></span>') +
      '<div class="m-head-t"><h1>' + (vista.titolo || '') + '</h1>' + (vista.sotto ? '<p>' + vista.sotto + '</p>' : '') + '</div>' +
      '<span class="m-head-me">' + (window.STATE.utente ? U.iniziali(window.STATE.utente.nome) : '') + '</span></div></header>' +
      '<main class="m-body">' + (vista.corpo || '') + '</main>' +
      tabbar(p) + sheetHtml() + '</div>';
  }

  /* ---------- componenti ---------- */
  function evCard(e, withinBlock) {
    var cls = e.tipo === 'sopralluogo' ? 'viola' : e.tipo === 'esame' ? 'blu' : e.modalita === 'esterna' ? 'blu' : 'arancio';
    return '<button type="button" class="m-ev ' + cls + (e.conflitto ? ' conflict' : '') + (withinBlock ? ' inside' : '') + '" data-azione="apri-evento" data-id="' + e.id + '">' +
      '<span class="m-ev-ora">' + e.ora + '<i>' + fine(e) + '</i></span>' +
      '<span class="m-ev-c"><b>' + U.esc(e.titolo) + '</b><span>' + U.esc(e.sottotitolo) + '</span>' +
      '<em>' + (e.modalita === 'esterna' ? 'Esterno' : U.esc(e.sala || 'Sede CLS')) + ' · ' + dur(e) + '\'</em></span>' +
      (e.conflitto ? '<span class="m-ev-alert">!</span>' : '') + '</button>';
  }
  function blockCard(b) {
    var d = U.getDitta(b.dittaId);
    var children = DB.eventi.filter(function (e) { return e.bloccoId === b.id; }).sort(function (a, c) { return a.ora.localeCompare(c.ora); });
    return '<div class="m-block ' + (b.conflitto ? 'conflict' : '') + '">' +
      '<button type="button" class="m-block-head" data-azione="apri-blocco" data-id="' + b.id + '">' +
      '<span class="m-block-time">' + b.oraInizio + '<i>' + b.oraFine + '</i></span>' +
      '<span class="m-block-c"><b>' + U.esc(d.ragione) + '</b><span>Blocco esterno · ' + children.length + '/' + b.capienza + ' visite · ' + b.durata + '\'</span></span>' + UI.ic('right') + '</button>' +
      (children.length ? '<div class="m-block-children">' + children.map(function (e) { return evCard(e, true); }).join('') + '</div>' : '<div class="m-block-empty">Nessuna visita assegnata</div>') + '</div>';
  }
  function empty(msg, icona) { return '<div class="m-empty">' + UI.ic(icona || 'check') + '<span>' + msg + '</span></div>'; }
  function timeline(g, filtro) {
    var evs = eventiGiorno(g).filter(function (e) {
      if (e.bloccoId) return false;
      if (!filtro || filtro === 'tutti') return true;
      return filtro === 'sede' ? e.modalita !== 'esterna' : e.modalita === 'esterna';
    });
    var bls = filtro === 'sede' ? [] : blocchiGiorno(g);
    var items = [];
    evs.forEach(function (e) { items.push({ t: toMin(e.ora), html: evCard(e) }); });
    bls.forEach(function (b) { items.push({ t: toMin(b.oraInizio), html: blockCard(b) }); });
    items.sort(function (a, b) { return a.t - b.t; });
    if (!items.length) return empty('Nessuna attività in questo giorno.', 'calendar');
    return '<div class="m-timeline">' + items.map(function (i) { return i.html; }).join('') + '</div>';
  }

  /* ---------- Oggi ---------- */
  function vistaOggi() {
    var u = U.utenteCorrente(), m = U.getMedico(u.medicoId);
    var evs = eventiGiorno(OGGI_ISO);
    var referti = U.esamiVisibili().filter(function (e) { return /DA RIPETERE|NON PERVENUTO/.test(e.risultato); }).length;
    var scad = U.scadenzeVisibili().filter(function (s) { return !s.fissata && U.giorniA(s.data) <= 30; }).length;
    var prossime = U.visiteVisibili().filter(function (v) { return v.stato === 'programmata' && U.giorniA(v.data) > 0; })
      .sort(function (a, b) { return (a.data + a.ora).localeCompare(b.data + b.ora); }).slice(0, 3);
    var nome = m.nome.split(' ');
    var display = nome.length > 1 ? nome.slice(1).join(' ') + ' ' + nome[0] : m.nome;
    var corpo = '<div class="m-hero"><span class="m-hello">Buongiorno</span><b>Dott. ' + U.esc(display) + '</b>' +
      '<span class="m-hero-date">' + U.fmtLunga(window.OGGI) + '</span>' +
      '<div class="m-hero-row"><span><b>' + evs.length + '</b> attività</span><span><b>' + U.lavVisibili().length + '</b> pazienti</span><span><b>' + U.ditteVisibili().length + '</b> aziende</span></div></div>' +
      (referti || scad ? '<div class="m-alerts">' + (referti ? '<a href="#/esami">' + UI.ic('activity') + ' ' + referti + ' referti da verificare</a>' : '') + (scad ? '<a href="#/scadenziario">' + UI.ic('clock') + ' ' + scad + ' scadenze entro 30 gg</a>' : '') + '</div>' : '') +
      '<div class="m-section"><div class="m-section-head"><h2>Agenda di oggi</h2><a href="#/agenda">Tutto</a></div>' + timeline(OGGI_ISO) + '</div>' +
      (prossime.length ? '<div class="m-section"><div class="m-section-head"><h2>Prossime visite</h2></div><div class="m-list">' + prossime.map(function (v) {
        var l = U.getLav(v.lavoratoreId);
        return '<a class="m-item" href="#/lavoratori/' + l.id + '"><span class="m-item-av">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><span class="m-item-c"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(U.nomeDitta(l.dittaId)) + '</span></span><span class="m-item-r"><b>' + U.fmtBreve(v.data) + '</b><i>' + v.ora + '</i></span></a>';
      }).join('') + '</div></div>' : '');
    return { id: 'dashboard', titolo: 'Oggi', sotto: '', corpo: corpo };
  }

  /* ---------- Agenda ---------- */
  function vistaAgenda() {
    var giorni = U.settimana(window.STATE.agendaOffset || 0);
    var sel = window.STATE.agendaGiorno;
    if (!sel || giorni.indexOf(sel) < 0) sel = giorni.indexOf(OGGI_ISO) >= 0 ? OGGI_ISO : giorni[0];
    var filtro = window.STATE.agendaFiltro || 'tutti';
    var strip = '<div class="m-week"><button type="button" class="m-week-btn" data-azione="agenda-settimana" data-delta="-1" aria-label="Settimana precedente">' + UI.ic('left') + '</button><span>' + U.fmtBreve(giorni[0]) + ' – ' + U.fmtBreve(giorni[6]) + '</span><button type="button" class="m-week-btn" data-azione="agenda-settimana" data-delta="1" aria-label="Settimana successiva">' + UI.ic('right') + '</button></div>' +
      '<div class="m-days">' + giorni.map(function (g) {
        var n = eventiGiorno(g).filter(function (e) { return !e.bloccoId; }).length + blocchiGiorno(g).length;
        return '<button type="button" class="m-day ' + (g === sel ? 'sel' : '') + ' ' + (g === OGGI_ISO ? 'today' : '') + '" data-azione="agenda-giorno" data-giorno="' + g + '"><span>' + U.GIORNI[U.asDate(g).getDay()].slice(0, 3) + '</span><b>' + U.asDate(g).getDate() + '</b><i class="' + (n ? 'has' : '') + '">' + n + '</i></button>';
      }).join('') + '</div>';
    var filtri = '<div class="m-seg">' + [['tutti', 'Tutti'], ['sede', 'In sede'], ['esterni', 'Esterni']].map(function (f) {
      return '<button type="button" data-azione="agenda-filtro" data-filtro="' + f[0] + '" aria-pressed="' + (filtro === f[0] ? 'true' : 'false') + '">' + f[1] + '</button>';
    }).join('') + '</div>';
    var visibili = eventiGiorno(sel).filter(function (e) {
      if (e.bloccoId) return false;
      return filtro === 'tutti' || (filtro === 'sede' ? e.modalita !== 'esterna' : e.modalita === 'esterna');
    });
    var bls = filtro === 'sede' ? [] : blocchiGiorno(sel);
    var corpo = strip + filtri +
      '<div class="m-day-title"><b>' + U.fmtLunga(U.asDate(sel)) + '</b><span>' + visibili.length + ' attività · ' + bls.length + ' blocchi</span></div>' +
      timeline(sel, filtro) +
      '<button type="button" class="m-fab" data-azione="agenda-nuovo" data-giorno="' + sel + '" aria-label="Nuovo appuntamento">' + UI.ic('plus') + '</button>';
    return { id: 'agenda', titolo: 'Agenda', sotto: 'La tua giornata, anche in mobilità', corpo: corpo };
  }

  /* ---------- Pazienti ---------- */
  function vistaPazienti() {
    var lav = U.lavVisibili().slice().sort(function (a, b) { return U.nomeLav(a).localeCompare(U.nomeLav(b)); });
    var corpo = '<div class="m-search"><label>' + UI.ic('search') + '<input type="search" data-m-cerca placeholder="Cerca nome, CF, mansione…" aria-label="Cerca paziente"></label><span class="m-search-n" data-m-count>' + lav.length + ' pazienti</span></div>' +
      '<div class="m-list" data-m-list>' + lav.map(function (l) {
        var sc = U.scadenzaProssima(l.id);
        return '<a class="m-item" data-m-pz data-m-search="' + U.esc((U.nomeLav(l) + ' ' + U.nomeDitta(l.dittaId) + ' ' + U.getMansione(l.mansioneId).nome + ' ' + l.cf).toLowerCase()) + '" href="#/lavoratori/' + l.id + '"><span class="m-item-av">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><span class="m-item-c"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(U.nomeDitta(l.dittaId)) + ' · ' + U.esc(U.getMansione(l.mansioneId).nome) + '</span></span><span class="m-item-r"><b>' + (sc ? U.fmtBreve(sc.data) : '—') + '</b><i>' + (sc ? 'prossima' : '') + '</i></span></a>';
      }).join('') + '</div>';
    return { id: 'lavoratori', titolo: 'Pazienti', sotto: 'Aziende e lavoratori a te assegnati', corpo: corpo };
  }

  function vistaPaziente(id) {
    var l = U.getLav(id);
    if (!l.id || !U.puoLav(l)) return { id: 'lavoratori', titolo: 'Paziente', corpo: empty('Paziente non disponibile o non assegnato a te.', 'lock') };
    var d = U.getDitta(l.dittaId), mn = U.getMansione(l.mansioneId);
    var visite = U.visiteLav(l.id).slice().sort(function (a, b) { return b.data.localeCompare(a.data); });
    var esami = U.esamiLav(l.id).slice().sort(function (a, b) { return b.data.localeCompare(a.data); });
    var scad = U.scadenzeLav(l.id).slice().sort(function (a, b) { return a.data.localeCompare(b.data); }).slice(0, 6);
    var docs = DB.documenti.filter(function (x) { return x.lavoratoreId === l.id; }).slice(0, 6);
    var prossima = U.prossimaVisita(l.id), scPross = U.scadenzaProssima(l.id);
    var corpo = '<div class="m-paz"><span class="m-paz-av">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><div><h2>' + U.esc(U.nomeLav(l)) + '</h2><span>' + U.esc(d.ragione) + ' · ' + U.esc(mn.nome) + '</span><span>' + U.eta(l.nascita) + ' anni · CF ' + U.esc(l.cf) + '</span></div></div>' +
      '<div class="m-actions"><a class="m-btn primary" href="#/visite/nuova/' + l.id + '">' + UI.ic('heart') + ' Nuova visita</a><a class="m-btn" href="tel:' + U.esc(l.tel) + '">' + UI.ic('phone') + ' Chiama</a></div>' +
      (prossima ? '<div class="m-note ok">' + UI.ic('calendar') + ' Prossima visita ' + U.fmtData(prossima.data) + ' alle ' + prossima.ora + '</div>' : scPross ? '<div class="m-note warn">' + UI.ic('clock') + ' Visita prevista entro il ' + U.fmtData(scPross.data) + '</div>' : '') +
      '<div class="m-section"><div class="m-section-head"><h2>Visite</h2><span>' + visite.length + '</span></div><div class="m-list">' + (visite.length ? visite.map(function (v) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.fmtData(v.data) + ' · ' + U.esc(v.tipo) + '</b><span>' + U.esc(U.nomeMedico(v.medicoId)) + ' · ' + U.esc(v.sede || 'Sede CLS') + '</span>' + (v.stato === 'eseguita' ? UI.giudizioChip(v.giudizio) : UI.chip('in agenda', 'info')) + '</div>' + (v.stato === 'eseguita' ? '<button type="button" class="m-icon-btn" data-azione="apri-certificato" data-visita="' + v.id + '" aria-label="Certificato">' + UI.ic('printer') + '</button>' : '<a class="m-icon-btn" href="#/visite/nuova/' + l.id + '" aria-label="Apri visita">' + UI.ic('right') + '</a>') + '</div>';
      }).join('') : empty('Nessuna visita.', 'heart')) + '</div></div>' +
      '<div class="m-section"><div class="m-section-head"><h2>Esami e referti</h2><span>' + esami.length + '</span></div><div class="m-list">' + (esami.length ? esami.slice(0, 6).map(function (e) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(e.accertamento) + '</b><span>' + U.fmtData(e.data) + ' · ' + U.esc(e.risultato) + '</span></div><button type="button" class="m-icon-btn" data-azione="apri-referto" data-id="' + e.id + '" aria-label="Referto">' + UI.ic('download') + '</button></div>';
      }).join('') : empty('Nessun esame.', 'activity')) + '</div></div>' +
      '<div class="m-section"><div class="m-section-head"><h2>Scadenze</h2><span>' + scad.length + '</span></div><div class="m-list">' + (scad.length ? scad.map(function (s) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(s.cosa) + '</b><span>' + U.fmtData(s.data) + '</span></div>' + UI.statusChip(s.data) + '</div>';
      }).join('') : empty('Nessuna scadenza.', 'check')) + '</div></div>' +
      '<div class="m-section"><div class="m-section-head"><h2>Documenti</h2><span>' + docs.length + '</span></div><div class="m-list">' + (docs.length ? docs.map(function (x) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(x.tipo) + '</b><span>' + U.fmtData(x.dataDoc) + ' · ' + U.esc(x.stato) + '</span></div><button type="button" class="m-icon-btn" data-azione="apri-documento" data-id="' + x.id + '" aria-label="Apri documento">' + UI.ic('eye') + '</button></div>';
      }).join('') : empty('Nessun documento.', 'file')) + '</div></div>';
    return { id: 'lavoratori', titolo: U.nomeLav(l), sotto: 'Paziente · ' + d.ragione, corpo: corpo };
  }

  /* ---------- liste da Altro ---------- */
  function vistaVisite() {
    var vs = U.visiteVisibili().slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).slice(0, 40);
    return { id: 'visite', titolo: 'Visite', sotto: 'Eseguite e in agenda', corpo: '<div class="m-list">' + (vs.length ? vs.map(function (v) {
      var l = U.getLav(v.lavoratoreId);
      return '<a class="m-item" href="#/lavoratori/' + l.id + '"><span class="m-item-av">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><span class="m-item-c"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(v.tipo) + ' · ' + U.fmtData(v.data) + '</span></span><span class="m-item-r"><b>' + (v.stato === 'programmata' ? v.ora : '✓') + '</b><i>' + (v.stato === 'programmata' ? 'in agenda' : 'eseguita') + '</i></span></a>';
    }).join('') : empty('Nessuna visita.', 'heart')) + '</div>' };
  }
  function vistaEsami() {
    var es = U.esamiVisibili().slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).slice(0, 50);
    return { id: 'esami', titolo: 'Esami e referti', sotto: 'Accertamenti delle tue aziende', corpo: '<div class="m-list">' + (es.length ? es.map(function (e) {
      var l = U.getLav(e.lavoratoreId);
      return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(e.accertamento) + '</b><span>' + U.esc(U.nomeLav(l)) + ' · ' + U.fmtData(e.data) + '</span><span class="chip ' + (/DA RIPETERE|NON PERVENUTO/.test(e.risultato) ? 'warn' : /ALTERAZIONI|POSITIVO/.test(e.risultato) ? 'err' : 'ok') + '">' + U.esc(e.risultato) + '</span></div><button type="button" class="m-icon-btn" data-azione="apri-referto" data-id="' + e.id + '" aria-label="Referto">' + UI.ic('download') + '</button></div>';
    }).join('') : empty('Nessun esame.', 'activity')) + '</div>' };
  }
  function vistaDocumenti() {
    var ds = U.documentiVisibili().slice().sort(function (a, b) { return (b.dataDoc || '').localeCompare(a.dataDoc || ''); }).slice(0, 50);
    return { id: 'documenti', titolo: 'Documenti', sotto: 'Certificati e referti delle tue aziende', corpo: '<div class="m-list">' + (ds.length ? ds.map(function (x) {
      return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(x.tipo) + '</b><span>' + U.esc(x.soggetto) + ' · ' + U.fmtData(x.dataDoc) + '</span>' + UI.chip(x.stato, /Firmato|Pronto|Inviato/.test(x.stato) ? 'ok' : 'warn') + '</div><button type="button" class="m-icon-btn" data-azione="apri-documento" data-id="' + x.id + '" aria-label="Apri documento">' + UI.ic('eye') + '</button></div>';
    }).join('') : empty('Nessun documento.', 'file')) + '</div>' };
  }
  function vistaScadenze() {
    var ss = U.scadenzeVisibili().slice().sort(function (a, b) { return a.data.localeCompare(b.data); }).slice(0, 60);
    return { id: 'scadenziario', titolo: 'Scadenze', sotto: 'Sorveglianza delle tue aziende', corpo: '<div class="m-list">' + (ss.length ? ss.map(function (s) {
      return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(s.cosa) + '</b><span>' + U.esc(s.soggetto) + ' · ' + U.esc(s.dittaId ? U.nomeDitta(s.dittaId) : '') + '</span></div>' + UI.statusChip(s.data) + '</div>';
    }).join('') : empty('Nessuna scadenza.', 'check')) + '</div>' };
  }
  function vistaDitte() {
    var ds = U.ditteVisibili().slice().sort(function (a, b) { return a.ragione.localeCompare(b.ragione); });
    return { id: 'ditte', titolo: 'Aziende', sotto: 'Le aziende in cui sei medico competente', corpo: '<div class="m-list">' + ds.map(function (d) {
      return '<a class="m-item" href="#/ditte/' + d.id + '"><span class="m-item-av">' + U.esc(U.iniziali(d.ragione)) + '</span><span class="m-item-c"><b>' + U.esc(d.ragione) + '</b><span>' + U.esc(d.citta) + ' · ' + U.lavoratoriDitta(d.id).length + ' lavoratori</span></span>' + UI.ic('right') + '</a>';
    }).join('') + '</div>' };
  }
  function vistaDitta(id) {
    var d = U.getDitta(id);
    if (!d.id || !U.puoDitta(d.id)) return { id: 'ditte', titolo: 'Azienda', corpo: empty('Azienda non disponibile.', 'lock') };
    var lav = U.lavoratoriDitta(d.id).slice().sort(function (a, b) { return U.nomeLav(a).localeCompare(U.nomeLav(b)); });
    var evs = U.eventiVisibili().filter(function (e) { return e.dittaId === d.id && U.giorniA(e.data) >= 0; }).sort(function (a, b) { return (a.data + a.ora).localeCompare(b.data + b.ora); }).slice(0, 5);
    var corpo = '<div class="m-paz"><span class="m-paz-av">' + U.esc(U.iniziali(d.ragione)) + '</span><div><h2>' + U.esc(d.ragione) + '</h2><span>' + U.esc(d.citta) + ' · ' + lav.length + ' lavoratori</span><span>Dott. ' + U.esc(U.nomeMedico(d.medicoId)) + '</span></div></div>' +
      '<div class="m-note">' + UI.ic('phone') + ' ' + U.esc(d.emailVisite || d.email) + ' · ' + U.esc(d.tel) + '</div>' +
      (evs.length ? '<div class="m-section"><div class="m-section-head"><h2>Prossime attività</h2></div><div class="m-list">' + evs.map(function (e) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.fmtData(e.data) + ' ' + e.ora + ' · ' + U.esc(e.titolo) + '</b><span>' + U.esc(e.tipo === 'visita' ? 'Visita' : e.sottotitolo) + '</span></div></div>';
      }).join('') + '</div></div>' : '') +
      '<div class="m-section"><div class="m-section-head"><h2>Lavoratori</h2><span>' + lav.length + '</span></div><div class="m-list">' + lav.map(function (l) {
        return '<a class="m-item" href="#/lavoratori/' + l.id + '"><span class="m-item-av">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><span class="m-item-c"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(U.getMansione(l.mansioneId).nome) + '</span></span>' + UI.ic('right') + '</a>';
      }).join('') + '</div></div>';
    return { id: 'ditte', titolo: d.ragione, sotto: 'Azienda assegnata', corpo: corpo };
  }

  /* ---------- Consuntivo ---------- */
  function vistaConsuntivo() {
    var u = U.utenteCorrente(), m = U.getMedico(u.medicoId);
    var ym = window.STATE.consuntivoMese || OGGI_ISO.slice(0, 7);
    var opts = [];
    for (var i = 0; i < 6; i++) {
      var d = new Date(Number(OGGI_ISO.slice(0, 4)), Number(OGGI_ISO.slice(5, 7)) - 1 - i, 1);
      opts.push({ ym: d.getFullYear() + '-' + U.pad(d.getMonth() + 1), label: U.MESI[d.getMonth()] + ' ' + d.getFullYear() });
    }
    if (!opts.some(function (o) { return o.ym === ym; })) ym = opts[0].ym;
    window.STATE.consuntivoMese = ym;
    var opt = opts.filter(function (o) { return o.ym === ym; })[0];
    var c = U.compensiMedico(m.id, ym);
    var t = DB.tariffe[m.id] || { visita: 38, esame: 12, trasferta: 50 };
    var corpo = '<div class="m-hero money"><span class="m-hello">Maturato</span><b>' + U.fmtEuro(c.totale) + '</b><span class="m-hero-date">' + opt.label + ' · compenso a prestazione</span>' +
      '<div class="m-hero-row"><span><b>' + c.visite + '</b> visite</span><span><b>' + c.esami + '</b> accertamenti</span><span><b>' + c.trasferte + '</b> trasferte</span></div></div>' +
      '<div class="m-field"><label>Periodo</label><select data-azione="cons-mese">' + opts.map(function (o) { return '<option value="' + o.ym + '"' + (o.ym === ym ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select></div>' +
      '<div class="m-actions"><button type="button" class="m-btn primary w" data-azione="scarica-consuntivo">' + UI.ic('download') + ' Scarica consuntivo</button></div>' +
      '<div class="m-section"><div class="m-section-head"><h2>Prestazioni</h2><span>' + c.righe.length + '</span></div><div class="m-list">' + (c.righe.length ? c.righe.map(function (r) {
        return '<div class="m-row"><div class="m-row-c"><b>' + U.esc(r.prestazione) + ' · ' + U.esc(r.soggetto) + '</b><span>' + U.fmtData(r.data) + ' · ' + U.esc(r.descrizione) + '</span></div><b class="m-row-imp">' + U.fmtEuro(r.importo) + '</b></div>';
      }).join('') : empty('Nessuna prestazione nel mese.', 'euro')) + '</div></div>' +
      '<div class="m-note">' + UI.ic('euro') + ' Visita ' + U.fmtEuro(t.visita) + ' · Accertamento ' + U.fmtEuro(t.esame) + ' · Trasferta ' + U.fmtEuro(t.trasferta) + '. Pagamento disposto dalla segreteria CLS.</div>';
    return { id: 'consuntivo', titolo: 'Consuntivo', sotto: 'I tuoi compensi', corpo: corpo };
  }

  function vista(parti) {
    var p = parti[0] || 'dashboard', id = parti[1] || '';
    if (p === 'dashboard') return vistaOggi();
    if (p === 'agenda') return vistaAgenda();
    if (p === 'lavoratori') return id ? vistaPaziente(id) : vistaPazienti();
    if (p === 'visite' && id !== 'nuova') return vistaVisite();
    if (p === 'esami') return vistaEsami();
    if (p === 'documenti') return vistaDocumenti();
    if (p === 'scadenziario') return vistaScadenze();
    if (p === 'consuntivo') return vistaConsuntivo();
    if (p === 'ditte') return id ? vistaDitta(id) : vistaDitte();
    return null;
  }

  /* ---------- azioni mobile ---------- */
  function sheet(open) {
    var s = document.getElementById('m-sheet'), b = document.querySelector('[data-azione="m-altro"]');
    if (!s) return;
    s.hidden = !open;
    if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('m-sheet-open', open);
  }
  AZIONI['m-altro'] = function () { var s = document.getElementById('m-sheet'); sheet(s ? s.hidden : false); };
  AZIONI['m-vai'] = function (el) { sheet(false); location.hash = el.dataset.href; };
  AZIONI['m-desktop'] = function () {
    sheet(false);
    var w = window.open('index.html?demo=medico', '_blank');
    if (!w) location.href = 'index.html?demo=medico';
  };
  AZIONI['m-profilo'] = function () { sheet(false); if (AZIONI['profilo-utente']) AZIONI['profilo-utente'](); };
  AZIONI['m-esci'] = function () { sheet(false); if (AZIONI['logout']) AZIONI['logout'](); };

  document.addEventListener('input', function (e) {
    if (!e.target.matches('[data-m-cerca]')) return;
    var q = e.target.value.toLowerCase().trim();
    var list = document.querySelector('[data-m-list]');
    if (!list) return;
    var n = 0;
    list.querySelectorAll('[data-m-pz]').forEach(function (el) {
      var hay = (el.dataset.mSearch || el.textContent).toLowerCase();
      var ok = !q || hay.indexOf(q) >= 0;
      el.hidden = !ok;
      if (ok) n++;
    });
    var cnt = document.querySelector('[data-m-count]');
    if (cnt) cnt.textContent = n + ' pazienti';
  });

  document.addEventListener('click', function (e) {
    var s = document.getElementById('m-sheet');
    if (!s || s.hidden) return;
    if (e.target.closest('#m-sheet') || e.target.closest('[data-azione="m-altro"]')) return;
    sheet(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { var s = document.getElementById('m-sheet'); if (s && !s.hidden) sheet(false); }
  });
  window.addEventListener('hashchange', function () { sheet(false); });
  window.addEventListener('resize', function () {
    if (!window.STATE || !window.STATE.utente || window.STATE.utente.ruolo !== 'medico') return;
    var now = attivo();
    if (now !== window.STATE.mobileOn) { window.STATE.mobileOn = now; RENDER(); }
  });

  window.MOBILE = { attivo: attivo, vista: vista, shell: shell };
})();
