/* =========================================================
   CLS · Proposta: Dashboard "come stiamo" e Attività "cosa faccio"
   Attivabile dall'operatore con il selettore Attuale / Proposta.
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI, ATTIVITA = window.ATTIVITA;
  var OGGI_ISO = U.iso(window.OGGI);
  var CAPIENZA_MIN = 480; // ponytail: giornata medico fissa a 8 ore, leggerla dal calendario del medico quando esiste

  function pro() { if (!STATE.pro) STATE.pro = { on: true, bucket: 'scadute' }; return STATE.pro; }
  function operatore() { var u = STATE.utente; return !u || u.ruolo === 'operatore'; }
  window.PROPOSTA = { attiva: function () { return pro().on && operatore(); } };

  function ast() {
    var s = STATE.attivita = STATE.attivita || { tipo: '', priorita: '', cerca: '', sel: '' };
    s.check = s.check || {}; s.presi = s.presi || {};
    return s;
  }
  function mio() { return STATE.utente ? STATE.utente.nome : 'Operatore'; }
  function durata(g) {
    g = Math.abs(g);
    if (g < 60) return g + ' gg';
    if (g < 730) return Math.round(g / 30.4) + ' mesi';
    return Math.floor(g / 365) + ' anni';
  }
  function ore(min) { var h = Math.floor(min / 60), m = min % 60; return h + 'h' + (m ? ' ' + (m < 10 ? '0' : '') + m : ''); }
  function track(pct, tone) { return '<div class="pro-track ' + (tone || '') + '"><b style="width:' + Math.min(100, pct) + '%"></b></div>'; }

  function toggle() {
    var on = pro().on;
    return '<div class="seg seg-sm" role="group" aria-label="Versione della pagina">' +
      '<button type="button" data-azione="pro-toggle" data-on="0" aria-pressed="' + !on + '">Attuale</button>' +
      '<button type="button" data-azione="pro-toggle" data-on="1" aria-pressed="' + on + '">' + UI.ic('spark') + ' Proposta</button></div>';
  }

  function tasks() {
    return ATTIVITA.tasks().map(function (t) {
      if (t.tipo === 'firmare') { t.verbo = 'Firma del medico'; t.tipoLabel = 'In attesa di firma'; }
      t.medicoId = t.ref.medicoId || t.ditta.medicoId;
      return t;
    });
  }

  /* ===================== DASHBOARD ===================== */
  function dashPro() {
    var T = tasks();
    function n(tipo) { return T.filter(function (t) { return t.tipo === tipo; }).length; }
    var evOggi = U.eventiVisibili().filter(function (e) { return e.data === OGGI_ISO; }).sort(function (a, b) { return a.ora.localeCompare(b.ora); });
    var confOggi = evOggi.filter(function (e) { return e.conflitto; }).length;
    var inviati = DB.documenti.filter(function (d) { var g = U.giorniA(d.dataDoc); return d.tipo === 'Giudizio di idoneità' && /inviat/i.test(d.stato) && g <= 0 && g >= -30; }).length;

    var passi = [
      { tipo: 'pianificare', n: n('pianificare'), l: 'Da pianificare', s: 'visite scadute senza data', ic: 'clock', tone: n('pianificare') ? 'warn' : 'ok' },
      { href: '#/agenda', n: evOggi.length, l: 'In agenda oggi', s: confOggi ? confOggi + ' in conflitto' : 'nessun conflitto', ic: 'calendar', tone: confOggi ? 'err' : 'info' },
      { tipo: 'refertare', n: n('refertare'), l: 'Referti da verificare', s: 'esami da ripetere o mancanti', ic: 'activity', tone: n('refertare') ? 'err' : 'ok' },
      { tipo: 'firmare', n: n('firmare'), l: 'In attesa di firma', s: 'certificati dal medico', ic: 'shield', tone: n('firmare') ? 'warn' : 'ok' },
      { tipo: 'inviare', n: n('inviare'), l: 'Da inviare', s: 'certificati pronti', ic: 'send', tone: n('inviare') ? 'err' : 'ok' },
      { href: '#/documenti', n: inviati, l: 'Chiusi', s: 'inviati ultimi 30 gg', ic: 'check', tone: 'ok' }
    ];
    var pipe = '<nav class="pipe" aria-label="Flusso delle pratiche">' + passi.map(function (p) {
      return '<a class="pipe-step ' + p.tone + '" href="' + (p.href || '#/attivita') + '"' + (p.tipo ? ' data-azione="pro-coda" data-tipo="' + p.tipo + '"' : '') + '>' +
        '<span class="pipe-n">' + p.n + '</span><span class="pipe-l">' + UI.ic(p.ic) + p.l + '</span><span class="pipe-s">' + p.s + '</span></a>';
    }).join('') + '</nav>';

    // carico dei medici oggi
    var medici = DB.medici.map(function (m) {
      var ev = evOggi.filter(function (e) { return e.medicoId === m.id; });
      return { m: m, ev: ev, min: ev.reduce(function (s, e) { return s + (Number(e.durata) || 30); }, 0), conf: ev.filter(function (e) { return e.conflitto; }).length };
    });
    var attivi = medici.filter(function (x) { return x.ev.length; }).sort(function (a, b) { return b.min - a.min; });
    var liberi = medici.length - attivi.length;
    var caricoTab = attivi.length ? '<div class="table-box"><table class="table-mini"><thead><tr><th>Medico</th><th style="width:34%">Carico giornata</th><th>Orario</th><th>Stato</th></tr></thead><tbody>' +
      attivi.map(function (x) {
        var pct = Math.round(x.min * 100 / CAPIENZA_MIN);
        return '<tr class="click" data-href="#/agenda"><td><b>' + U.esc(x.m.nome) + '</b><div class="tiny muted">' + x.ev.length + ' appuntamenti</div></td>' +
          '<td>' + track(pct, pct > 90 ? 'err' : pct > 70 ? 'warn' : '') + '<div class="tiny muted">' + ore(x.min) + ' su ' + ore(CAPIENZA_MIN) + ' · ' + pct + '%</div></td>' +
          '<td class="mono small">' + x.ev[0].ora + '–' + x.ev[x.ev.length - 1].ora + '</td>' +
          '<td>' + (x.conf ? '<span class="chip err">' + x.conf + ' conflitti</span>' : '<span class="chip ok">regolare</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : UI.empty('Nessun medico in agenda oggi.', 'calendar');

    var agendaOggi = evOggi.length ? '<div class="table-box"><table class="table-mini"><thead><tr><th style="width:58px">Ora</th><th>Lavoratore / attività</th><th>Medico</th><th>Dove</th></tr></thead><tbody>' +
      evOggi.map(function (e) {
        var href = e.tipo === 'visita' ? '#/lavoratori/' + e.lavoratoreId : e.tipo === 'sopralluogo' ? '#/ditte/' + e.dittaId : '#/agenda';
        return '<tr class="click" data-href="' + href + '"><td class="mono">' + e.ora + '</td><td><b>' + U.esc(e.titolo) + '</b> ' + (e.conflitto ? '<span class="chip err">conflitto</span>' : '') + '<div class="tiny muted">' + U.esc(e.sottotitolo) + '</div></td><td class="small">' + U.esc(U.nomeMedico(e.medicoId)) + '</td><td>' + (e.modalita === 'esterna' ? '<span class="chip info">esterna</span>' : '<span class="chip">' + U.esc(e.sala || 'sede') + '</span>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : UI.empty('Nessun appuntamento oggi.', 'calendar');

    // scadenze: tre finestre, una riga per lavoratore
    var finestre = { scadute: [-1e9, -1, 'Scadute'], sett: [0, 7, 'Entro 7 gg'], mese: [8, 30, 'Entro 30 gg'] };
    var aperte = U.scadenzeVisibili().filter(function (s) { return !s.fissata; });
    function gruppi(k) {
      var f = finestre[k], m = {};
      aperte.forEach(function (s) {
        var g = U.giorniA(s.data);
        if (g < f[0] || g > f[1]) return;
        var key = s.lavoratoreId || 'd:' + s.dittaId;
        var x = m[key] = m[key] || { lav: s.lavoratoreId, nome: s.soggetto, ditta: U.nomeDitta(s.dittaId), items: [], data: s.data };
        x.items.push(s.cosa);
        if (s.data < x.data) x.data = s.data;
      });
      return Object.keys(m).map(function (k2) { return m[k2]; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
    }
    var bucket = pro().bucket;
    var lista = gruppi(bucket);
    var seg = '<div class="seg seg-sm">' + Object.keys(finestre).map(function (k) {
      return '<button type="button" data-azione="pro-bucket" data-k="' + k + '" aria-pressed="' + (k === bucket) + '">' + finestre[k][2] + '<span class="n">' + gruppi(k).length + '</span></button>';
    }).join('') + '</div>';
    var scadCorpo = '<div class="pad-sm">' + seg + '</div>' + (lista.length ? '<div class="mini-list">' + lista.slice(0, 7).map(function (x) {
      var st = U.statoScadenza(x.data);
      return '<div class="it"><span class="dot ' + st.tone + '"></span><div class="t"><b>' + U.esc(x.nome) + '</b><small>' + U.esc(x.ditta) + ' · ' + x.items.length + ' voci: ' + U.esc(x.items.join(', ')) + '</small><span class="chip ' + st.tone + '">' + st.label + '</span></div>' +
        (x.lav ? '<button type="button" class="btn btn-xs" data-azione="pianifica" data-lav="' + x.lav + '">Pianifica</button>' : '<a class="btn btn-xs" href="#/scadenziario">Apri</a>') + '</div>';
    }).join('') + '</div>' : UI.empty('Niente in questa finestra.', 'check'));

    // aziende con più lavoratori fuori sorveglianza
    var aziende = DB.ditte.filter(function (d) { return !d.cessazione; }).map(function (d) {
      var tot = DB.lavoratori.filter(function (l) { return l.dittaId === d.id; }).length, k = {};
      DB.scadenze.forEach(function (s) { if (s.dittaId === d.id && s.tipo === 'Visita' && !s.fissata && U.giorniA(s.data) < 0) k[s.lavoratoreId] = 1; });
      var n2 = Object.keys(k).length;
      return { d: d, tot: tot, k: n2, pct: tot ? Math.round(n2 * 100 / tot) : 0 };
    }).filter(function (x) { return x.k; }).sort(function (a, b) { return b.pct - a.pct || b.k - a.k; }).slice(0, 5);
    var azCorpo = aziende.length ? '<div class="mini-list">' + aziende.map(function (x) {
      return '<div class="it"><div class="t"><b><a href="#/ditte/' + x.d.id + '">' + U.esc(x.d.ragione) + '</a></b>' + track(x.pct, x.pct >= 30 ? 'err' : 'warn') + '<small>' + x.k + ' su ' + x.tot + ' lavoratori con visita scaduta · ' + x.pct + '%</small></div>' +
        '<a class="btn btn-xs" href="#/pianifica" data-azione="pian-ditta" data-ditta="' + x.d.id + '">' + UI.ic('spark') + ' Pianifica</a></div>';
    }).join('') + '</div>' : UI.empty('Tutte le aziende sono in regola.', 'check');

    var mago = DB.mago;
    var magoBtn = '<a class="btn btn-sm" href="#/mago" title="Sincronizzazione Mago"><span class="dot ' + (mago.stato === 'ok' && !mago.errori ? 'ok' : 'warn') + '"></span> Mago ' + U.esc(String(mago.ultimoSync).slice(-5)) + (mago.errori ? ' · ' + mago.errori + ' errore' : '') + '</a>';

    var corpo = pipe + '<div class="grid-side"><div class="col pane-stack">' +
      UI.card({ titolo: 'Medici oggi', icona: 'stethoscope', sub: attivi.length + ' in attività · ' + liberi + ' senza appuntamenti', azioni: '<a class="btn btn-sm" href="#/agenda">Agenda</a>', corpo: caricoTab, tight: true }) +
      UI.card({ titolo: 'Agenda di oggi', icona: 'calendar', sub: U.fmtLunga(window.OGGI), corpo: agendaOggi, tight: true, cls: 'fill' }) +
      '</div><div class="col pane-stack">' +
      UI.card({ titolo: 'Scadenze', icona: 'clock', cls: 'fill', sub: 'una riga per lavoratore', azioni: '<a class="btn btn-sm" href="#/scadenziario">Tutte</a>', corpo: scadCorpo, tight: true }) +
      UI.card({ titolo: 'Aziende da seguire', icona: 'building', sub: '', azioni: '<a class="btn btn-sm" href="#/attivita" data-azione="tab" data-chiave="attivita" data-tab="richiami">Richiami</a>', corpo: azCorpo, tight: true }) +
      '</div></div>';

    return {
      id: 'dashboard', icona: 'home', titolo: 'Dashboard operativa', sotto: 'Come stiamo oggi: flusso delle pratiche, medici, scadenze e aziende',
      azioni: magoBtn + '<button type="button" class="btn btn-primary" data-azione="pianifica">' + UI.ic('plus') + ' Pianifica visita</button>',
      corpo: corpo
    };
  }

  /* ===================== ATTIVITÀ ===================== */
  function etaCell(t) {
    var g = U.giorniA(t.data);
    if (t.tipo === 'pianificare') return '<span class="chip err">scaduta da ' + durata(g) + '</span>';
    if (g === 0) return '<span class="chip warn">oggi</span>';
    if (g > 0) return '<span class="chip plain">tra ' + g + ' gg</span>';
    return '<span class="chip warn">da ' + durata(g) + '</span>';
  }
  function priTone(p) { return p === 'alta' ? 'err' : p === 'media' ? 'warn' : 'info'; }
  function azione(t, grande) {
    var cls = grande ? 'btn btn-primary' : 'btn btn-xs';
    if (t.tipo === 'pianificare') return '<button type="button" class="' + cls + '" data-azione="pianifica" data-lav="' + t.lav.id + '">' + UI.ic('calendar') + ' Pianifica</button>';
    if (t.tipo === 'refertare') return '<button type="button" class="' + cls + '" data-azione="apri-referto" data-id="' + t.ref.id + '">' + UI.ic('eye') + ' Apri referto</button>';
    if (t.tipo === 'firmare') return '<button type="button" class="' + cls + '" data-azione="pro-sollecita" data-id="' + t.id + '">' + UI.ic('mail') + ' Sollecita</button>';
    return '<button type="button" class="' + cls + '" data-azione="invia-documento" data-id="' + t.ref.id + '">' + UI.ic('send') + ' Invia</button>';
  }

  function filtra(all) {
    var st = ast(), q = String(st.cerca || '').toLowerCase();
    return all.filter(function (t) {
      if (st.tipo && t.tipo !== st.tipo) return false;
      if (st.priorita && t.priorita !== st.priorita) return false;
      if (st.fDitta && t.ditta.id !== st.fDitta) return false;
      if (st.fMedico && t.medicoId !== st.fMedico) return false;
      if (st.mie && st.presi[t.id] !== mio()) return false;
      if (q && (t.soggetto + ' ' + t.azienda + ' ' + t.verbo + ' ' + t.dettaglio).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function barra(all) {
    var st = ast();
    var c = { '': all.length, pianificare: 0, refertare: 0, firmare: 0, inviare: 0 };
    all.forEach(function (t) { c[t.tipo]++; });
    var tipi = [['', 'Tutte'], ['pianificare', 'Pianificare'], ['refertare', 'Refertare'], ['firmare', 'Firma medico'], ['inviare', 'Inviare']];
    var ditte = {}, medici = {};
    all.forEach(function (t) { ditte[t.ditta.id] = t.azienda; if (t.medicoId) medici[t.medicoId] = U.nomeMedico(t.medicoId); });
    function sel(k, vuoto, mappa) {
      return '<select data-pro-f="' + k + '" aria-label="' + vuoto + '" style="max-width:190px;min-height:31px;font-size:12.5px">' +
        UI.opts([['', vuoto]].concat(Object.keys(mappa).map(function (id) { return [id, mappa[id]]; }).sort(function (a, b) { return a[1].localeCompare(b[1]); })), st[k] || '') + '</select>';
    }
    var mie = all.filter(function (t) { return st.presi[t.id] === mio(); }).length;
    return '<div class="filtri"><input id="att-cerca" type="search" value="' + U.esc(st.cerca || '') + '" placeholder="Cerca lavoratore, azienda, attività…" aria-label="Cerca attività">' +
      '<div class="seg seg-sm">' + tipi.map(function (x) {
        return '<button type="button" data-azione="attivita-tipo" data-tipo="' + x[0] + '" aria-pressed="' + (st.tipo === x[0]) + '">' + x[1] + '<span class="n">' + c[x[0]] + '</span></button>';
      }).join('') + '</div></div>' +
      '<div class="filtri">' + sel('fDitta', 'Tutte le aziende', ditte) + sel('fMedico', 'Tutti i medici', medici) +
      sel('priorita', 'Tutte le priorità', { alta: 'Priorità alta', media: 'Priorità media', bassa: 'Priorità bassa' }) +
      '<div class="seg seg-sm"><button type="button" data-azione="pro-mie" data-v="0" aria-pressed="' + !st.mie + '">Di tutti</button><button type="button" data-azione="pro-mie" data-v="1" aria-pressed="' + !!st.mie + '">In carico a me<span class="n">' + mie + '</span></button></div>' +
      '<button type="button" class="btn btn-sm right" data-azione="pro-gruppo" aria-pressed="' + !!st.gruppo + '">' + UI.ic('building') + (st.gruppo ? ' Lista unica' : ' Raggruppa per azienda') + '</button></div>';
  }

  function bulk(vis) {
    var st = ast();
    var sel = vis.filter(function (t) { return st.check[t.id]; });
    if (!sel.length) return '';
    function k(tipo) { return sel.filter(function (t) { return t.tipo === tipo; }).length; }
    var ditte = {}; sel.forEach(function (t) { if (t.tipo === 'pianificare') ditte[t.ditta.id] = 1; });
    var nd = Object.keys(ditte).length;
    return '<div class="filtri pro-bulk"><b>' + sel.length + ' selezionate</b>' +
      (k('inviare') ? '<button type="button" class="btn btn-sm btn-primary" data-azione="pro-bulk" data-op="invia">' + UI.ic('send') + ' Invia ' + k('inviare') + ' certificati</button>' : '') +
      (k('firmare') ? '<button type="button" class="btn btn-sm" data-azione="pro-bulk" data-op="sollecita">' + UI.ic('mail') + ' Sollecita ' + k('firmare') + ' firme</button>' : '') +
      (nd ? '<button type="button" class="btn btn-sm" data-azione="pro-bulk" data-op="richiamo">' + UI.ic('mail') + ' Richiamo a ' + nd + (nd > 1 ? ' aziende' : ' azienda') + '</button>' : '') +
      '<button type="button" class="btn btn-sm" data-azione="pro-bulk" data-op="carico">' + UI.ic('user') + ' Prendi in carico</button>' +
      '<button type="button" class="btn btn-sm btn-ghost" data-azione="pro-bulk" data-op="nessuna">Deseleziona</button></div>';
  }

  function riga(t, selezionata) {
    var st = ast(), chi = st.presi[t.id];
    return '<tr class="' + (selezionata ? 'selected' : '') + '" data-azione="attivita-sel" data-id="' + t.id + '">' +
      '<td><input type="checkbox" data-azione="pro-check" data-ids="' + t.id + '" aria-label="Seleziona" ' + (st.check[t.id] ? 'checked' : '') + '></td>' +
      '<td><span class="dot ' + priTone(t.priorita) + '" title="Priorità ' + t.priorita + '"></span></td>' +
      '<td><b>' + t.verbo + '</b>' + (t.ref.sollecito ? ' <span class="chip info">sollecitata</span>' : '') + '<div class="tiny muted">' + U.esc(t.dettaglio) + '</div></td>' +
      '<td><b>' + U.esc(t.soggetto) + '</b><div class="tiny muted">' + U.esc(t.azienda) + '</div></td>' +
      '<td>' + etaCell(t) + '</td>' +
      '<td>' + (chi ? '<span title="In carico a ' + U.esc(chi) + '">' + UI.avatar(chi) + '</span>' : '<span class="faint">—</span>') + '</td>' +
      '<td class="right">' + azione(t, false) + '</td></tr>';
  }

  function corpoTabella(vis, selId) {
    var st = ast();
    if (!vis.length) return '<tr><td colspan="7">' + UI.empty('Nessuna attività con questi filtri.', 'check') + '</td></tr>';
    if (!st.gruppo) return vis.map(function (t) { return riga(t, t.id === selId); }).join('');
    var g = {}, ordine = [];
    vis.forEach(function (t) { if (!g[t.ditta.id]) { g[t.ditta.id] = []; ordine.push(t.ditta.id); } g[t.ditta.id].push(t); });
    ordine.sort(function (a, b) { return g[b].length - g[a].length; });
    return ordine.map(function (id) {
      var items = g[id], ids = items.map(function (t) { return t.id; });
      var tutti = ids.every(function (x) { return st.check[x]; });
      var tipi = {}; items.forEach(function (t) { tipi[t.tipoLabel] = (tipi[t.tipoLabel] || 0) + 1; });
      return '<tr class="pro-gruppo"><td><input type="checkbox" data-azione="pro-check" data-ids="' + ids.join(',') + '" aria-label="Seleziona tutte di ' + U.esc(items[0].azienda) + '" ' + (tutti ? 'checked' : '') + '></td>' +
        '<td colspan="6"><b>' + U.esc(items[0].azienda) + '</b> <span class="muted small">· ' + items.length + ' attività</span> ' +
        Object.keys(tipi).map(function (k) { return '<span class="chip">' + k + ' ' + tipi[k] + '</span>'; }).join(' ') +
        ' <span class="small muted">· Dott. ' + U.esc(U.nomeMedico(items[0].ditta.medicoId)) + ' · ' + U.esc(items[0].ditta.tel || '') + '</span></td></tr>' +
        items.map(function (t) { return riga(t, t.id === selId); }).join('');
    }).join('');
  }

  function dettaglio(t, all) {
    if (!t) return '<div class="card att-detail"><div class="card-body">' + UI.empty('Seleziona un’attività per vedere contesto e azioni.', 'inbox') + '</div></div>';
    var st = ast(), l = t.lav, d = t.ditta, uv = U.ultimaVisita(l.id), chi = st.presi[t.id];
    var stessoLav = all.filter(function (x) { return x.lav.id === l.id && x.id !== t.id; });
    var stessaDitta = all.filter(function (x) { return x.ditta.id === d.id; }).length;
    var perche = {
      pianificare: 'Visita scaduta il <b>' + U.fmtData(t.data) + '</b> e senza appuntamento.',
      refertare: 'L’esame <b>' + U.esc(t.ref.accertamento) + '</b> del ' + U.fmtData(t.data) + ' risulta <b>' + U.esc(t.ref.risultato) + '</b>.',
      firmare: 'Visita del <b>' + U.fmtData(t.data) + '</b> chiusa con giudizio <b>' + U.esc(t.ref.giudizio || 'da definire') + '</b>: manca la firma del medico sul certificato.' + (t.ref.sollecito ? ' Sollecito già inviato.' : ''),
      inviare: 'Il certificato del <b>' + U.fmtData(t.data) + '</b> è firmato ma non ancora trasmesso.'
    }[t.tipo];
    var note = DB.note.filter(function (n) { return n.lavoratoreId === l.id || (n.dittaId === d.id && !n.lavoratoreId); }).slice(0, 3);
    var secondo = t.tipo === 'firmare' ? '<button type="button" class="btn" data-azione="pro-anteprima" data-id="' + t.ref.id + '">' + UI.ic('file') + ' Anteprima</button>'
      : t.tipo === 'inviare' ? '<button type="button" class="btn" data-azione="apri-documento" data-id="' + t.ref.id + '">' + UI.ic('file') + ' Documento</button>'
        : '<a class="btn" href="#/lavoratori/' + l.id + '">' + UI.ic('user') + ' Cartella</a>';
    return '<aside class="card att-detail" data-key="' + t.id + '"><div class="card-head"><h2>' + UI.ic('inbox') + ' Dettaglio</h2><span class="chip ' + priTone(t.priorita) + '">' + t.priorita + '</span>' +
      '<button type="button" class="btn btn-xs right" data-azione="pro-carico" data-id="' + t.id + '">' + (chi ? 'Rilascia' : UI.ic('user') + ' Prendi in carico') + '</button></div><div class="card-body">' +
      '<div class="eyebrow">' + t.tipoLabel + '</div><h2 style="font-size:18px;margin:4px 0 2px">' + t.verbo + '</h2><div class="small muted">' + U.esc(t.soggetto) + ' · ' + U.esc(t.azienda) + (chi ? ' · in carico a ' + U.esc(chi) : '') + '</div>' +
      '<div class="note ' + (t.priorita === 'alta' ? 'warn' : '') + ' mt">' + perche + '</div>' +
      '<div class="row wrap mt">' + azione(t, true) + secondo + '</div>' +
      UI.kv([['Mansione', U.esc(U.getMansione(l.mansioneId).nome)], ['Medico', 'Dott. ' + U.esc(U.nomeMedico(t.medicoId))], ['Ultima visita', uv ? U.fmtData(uv.data) : '—'], ['Contatto azienda', U.esc(d.tel || d.email || '—')]], 'kv-1') +
      (stessoLav.length || stessaDitta > 1 ? '<div class="note info mt">' +
        (stessoLav.length ? 'Lo stesso lavoratore ha altre <b>' + stessoLav.length + '</b> attività: ' + stessoLav.map(function (x) { return U.esc(x.verbo.toLowerCase()); }).join(', ') + '. ' : '') +
        (stessaDitta > 1 ? '<button type="button" class="btn btn-xs mt-sm" data-azione="pro-ditta" data-ditta="' + d.id + '">Tutte le ' + stessaDitta + ' di ' + U.esc(d.ragione) + '</button>' : '') + '</div>' : '') +
      (note.length ? '<div class="eyebrow mt">Ultime note</div><div class="mini-list">' + note.map(function (n) {
        return '<div class="it"><span class="date">' + U.fmtBreve(n.data) + '</span><div class="t"><b>' + U.esc(n.tipo || 'Nota') + '</b><small title="' + U.esc(n.testo) + '">' + U.esc(n.testo) + '</small></div></div>';
      }).join('') + '</div>' : '') +
      '</div></aside>';
  }

  function codaPro() {
    var all = tasks(), st = ast(), vis = filtra(all);
    var selT = vis.filter(function (t) { return t.id === st.sel; })[0] || vis[0] || null;
    st.sel = selT ? selT.id : '';
    var ids = vis.map(function (t) { return t.id; });
    var tutti = ids.length && ids.every(function (x) { return st.check[x]; });
    return '<div class="grid-side att-wrap"><div class="card"><div class="card-head"><h2>' + UI.ic('inbox') + ' Coda di lavoro</h2><span class="sub">' + all.length + ' aperte · ordinate per priorità</span></div>' +
      barra(all) + bulk(vis) +
      '<div class="table-box att-list"><table class="dt att-table"><thead><tr><th style="width:18px"><input type="checkbox" data-azione="pro-check" data-ids="' + ids.join(',') + '" aria-label="Seleziona tutte" ' + (tutti ? 'checked' : '') + '></th><th style="width:12px"></th><th>Attività</th><th>Lavoratore</th><th>Da quando</th><th>In carico</th><th></th></tr></thead><tbody>' +
      corpoTabella(vis, st.sel) + '</tbody></table></div>' +
      '<div class="dt-piede"><span><b>' + vis.length + '</b> visibili</span><span class="muted">spunta più righe per agire insieme</span></div></div>' +
      dettaglio(selT, all) + '</div>';
  }

  /* ===================== SCADENZIARIO ===================== */
  var FINESTRE = [
    ['scadute', 'Scadute', 'alert', 'danger', function (g, s) { return g < 0 && !s.fissata; }],
    ['7', 'Entro 7 giorni', 'clock', 'danger', function (g, s) { return g >= 0 && g <= 7 && !s.fissata; }],
    ['30', 'Entro 30 giorni', 'calendar', 'alert', function (g, s) { return g > 7 && g <= 30 && !s.fissata; }],
    ['90', 'Da 31 a 90 giorni', 'calendar', 'info', function (g, s) { return g > 30 && g <= 90 && !s.fissata; }],
    ['fissate', 'Già fissate', 'check', 'ok', function (g, s) { return s.fissata; }]
  ];
  function finestra() { var k = pro().scadFin === undefined ? 'scadute' : pro().scadFin; return FINESTRE.filter(function (f) { return f[0] === k; })[0] || null; }
  function chipsCosa(items) {
    var max = 4;
    return items.slice(0, max).map(function (s) { var st = U.statoScadenza(s.data); return '<span class="chip ' + (s.fissata ? 'ok' : st.tone) + '" title="' + U.esc(s.tipo + ' · ' + st.label) + '">' + U.esc(s.cosa) + '</span>'; }).join(' ') +
      (items.length > max ? ' <span class="chip">+' + (items.length - max) + '</span>' : '');
  }
  function tipiChip(items) {
    var t = {};
    items.forEach(function (s) { t[s.tipo] = (t[s.tipo] || 0) + 1; });
    return Object.keys(t).map(function (k) { return '<span class="chip">' + U.esc(k) + ' ' + t[k] + '</span>'; }).join(' ');
  }
  function azioniRiga(html) { return '<div class="row" style="justify-content:flex-end;gap:6px">' + html + '</div>'; }

  function scadPro() {
    var vis = U.scadenzeVisibili(), f = finestra(), modo = pro().scadModo || 'lavoratore';
    // stesso componente della dashboard (.pipe) ma senza frecce: sono finestre di tempo da filtrare, non passi di un flusso
    var TONO = { danger: 'err', alert: 'warn', info: 'info', ok: 'ok' };
    var SOTTO = { scadute: 'da recuperare', '7': 'da fissare subito', '30': 'da proporre al cliente', '90': 'da preparare', fissate: 'appuntamento in agenda' };
    var kpis = '<nav class="pipe pipe-filtro" aria-label="Finestre di scadenza">' + FINESTRE.map(function (x) {
      var n = vis.filter(function (s) { return x[4](U.giorniA(s.data), s); }).length;
      var on = !!f && f[0] === x[0];
      return '<button type="button" class="pipe-step ' + TONO[x[3]] + (on ? ' on' : '') + '" data-azione="pro-fin" data-k="' + (on ? '' : x[0]) + '" aria-pressed="' + on + '">' +
        '<span class="pipe-n">' + n + '</span><span class="pipe-l">' + UI.ic(x[2]) + x[1] + '</span><span class="pipe-s">' + SOTTO[x[0]] + '</span></button>';
    }).join('') + '</nav>';
    var sc = vis.filter(function (s) { return !f || f[4](U.giorniA(s.data), s); });

    var modi = '<div class="seg seg-sm">' + [['lavoratore', 'Per lavoratore'], ['azienda', 'Per azienda'], ['elenco', 'Elenco']].map(function (m) {
      return '<button type="button" data-azione="pro-modo" data-k="' + m[0] + '" aria-pressed="' + (modo === m[0]) + '">' + m[1] + '</button>';
    }).join('') + '</div>' + (f ? '<button type="button" class="btn btn-xs" data-azione="pro-fin" data-k="" title="Mostra tutte le finestre">' + U.esc(f[1]) + ' ✕</button>' : '');
    var tipi = { k: 'tipo', label: 'Tutti i tipi', opzioni: ['Visita', 'Accertamento', 'Vaccinazione', 'Corso', 'Sopralluogo', 'Riunione'], filtra: function (r, v) { return (r.items || [r]).some(function (s) { return s.tipo === v; }); } };
    var medico = { k: 'medicoId', label: 'Tutti i medici', opzioni: U.mediciVisibili().map(function (m) { return [m.id, m.nome]; }) };
    var idTab, tab;

    if (modo === 'elenco') {
      idTab = 'scadPro';
      tab = UI.datatable({
        id: idTab, righe: sc.map(function (s) { return Object.assign({}, s, { _ditta: U.nomeDitta(s.dittaId), _link: s.lavoratoreId ? '#/lavoratori/' + s.lavoratoreId : '#/ditte/' + s.dittaId }); }),
        ordine: 'data', per: 12, placeholder: 'Cerca soggetto, azienda, cosa…', extra: [tipi, medico], filtriExtra: modi,
        colonne: [
          { k: '_stato', l: 'Stato', sort: false, cerca: false, cell: function (r) { return r.fissata ? UI.chip('fissata', 'ok') : UI.statusChip(r.data); } },
          { k: 'soggetto', l: 'Soggetto', cell: function (r) { return '<a href="' + r._link + '" class="strong" style="text-decoration:none">' + U.esc(r.soggetto) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r.soggetto + ' ' + r._ditta; } },
          { k: 'cosa', l: 'Cosa scade', cell: function (r) { return '<b>' + U.esc(r.cosa) + '</b><div class="tiny muted">' + U.esc(r.tipo) + ' · ' + U.esc(r.descrizione) + '</div>'; }, testo: function (r) { return r.cosa + ' ' + r.tipo; } },
          { k: 'data', l: 'Scadenza', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
          { k: 'medicoId', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(U.nomeMedico(r.medicoId)) + '</span>'; }, testo: function (r) { return U.nomeMedico(r.medicoId); } },
          { k: '_az', l: '', sort: false, cerca: false, cell: function (r) {
            return azioniRiga((r.lavoratoreId && !r.fissata ? '<button type="button" class="btn btn-xs" data-azione="pianifica" data-lav="' + r.lavoratoreId + '">' + UI.ic('calendar') + ' Pianifica</button>' : '') +
              '<label class="check" title="Fissata"><input type="checkbox" data-azione="toggle-fissata" data-id="' + r.id + '" ' + (r.fissata ? 'checked' : '') + ' aria-label="Fissata"></label>');
          } }
        ]
      });
    } else if (modo === 'azienda') {
      idTab = 'scadProAz';
      var perD = {};
      sc.forEach(function (s) { (perD[s.dittaId] = perD[s.dittaId] || []).push(s); });
      var righeAz = Object.keys(perD).map(function (id) {
        var items = perD[id], d = U.getDitta(id), sogg = {};
        items.forEach(function (s) { sogg[s.lavoratoreId || 'ditta'] = 1; });
        function conta(fn) { return items.filter(function (s) { return !s.fissata && fn(U.giorniA(s.data)); }).length; }
        return {
          id: id, ragione: d.ragione, medicoId: d.medicoId, items: items, sogg: Object.keys(sogg).length,
          scad: conta(function (g) { return g < 0; }), s30: conta(function (g) { return g >= 0 && g <= 30; }),
          email: items.every(function (s) { return s.emailInviata || s.richiamoInviato; }), contatto: d.emailVisite || d.email
        };
      });
      tab = UI.datatable({
        id: idTab, righe: righeAz, ordine: 'scad', dir: -1, per: 12, placeholder: 'Cerca azienda o esame…', extra: [tipi, medico], filtriExtra: modi,
        colonne: [
          { k: 'ragione', l: 'Azienda', cell: function (r) { return '<a href="#/ditte/' + r.id + '" class="strong" style="text-decoration:none">' + U.esc(r.ragione) + '</a><div class="tiny muted">Dott. ' + U.esc(U.nomeMedico(r.medicoId)) + '</div>'; } },
          { k: 'scad', l: 'Scadute', num: true, cell: function (r) { return r.scad ? '<span class="chip err">' + r.scad + '</span>' : '<span class="faint">0</span>'; } },
          { k: 's30', l: 'Entro 30 gg', num: true, cell: function (r) { return r.s30 ? '<span class="chip warn">' + r.s30 + '</span>' : '<span class="faint">0</span>'; } },
          { k: 'sogg', l: 'Lavoratori', num: true },
          { k: '_cosa', l: 'Cosa scade', sort: false, cell: function (r) { return tipiChip(r.items); }, testo: function (r) { return r.items.map(function (s) { return s.cosa; }).join(' '); } },
          { k: 'email', l: 'Comunicazione', sort: false, cerca: false, cell: function (r) { return r.email ? UI.chip('inviata', 'ok') : '<span class="small muted">da inviare</span>'; } },
          { k: '_az', l: '', sort: false, cerca: false, cell: function (r) {
            return azioniRiga('<button type="button" class="btn btn-xs btn-primary" data-azione="pian-gruppo" data-ditta="' + r.id + '" title="Un appuntamento unico per i lavoratori in scadenza">' + UI.ic('users') + ' Pianifica insieme</button><button type="button" class="btn btn-xs" data-azione="pro-email-ditta" data-ditta="' + r.id + '" title="' + U.esc(r.contatto || '') + '">' + UI.ic('mail') + ' Email</button><a class="btn btn-xs" href="#/ditte/' + r.id + '">Apri</a>');
          } }
        ]
      });
    } else {
      idTab = 'scadProLav';
      var perL = {};
      sc.forEach(function (s) {
        var k = s.lavoratoreId || 'd:' + s.dittaId;
        var x = perL[k] = perL[k] || { id: k, lav: s.lavoratoreId, soggetto: s.soggetto, dittaId: s.dittaId, _ditta: U.nomeDitta(s.dittaId), medicoId: s.medicoId, items: [], data: s.data };
        x.items.push(s);
        if (s.data < x.data) x.data = s.data;
      });
      var righeLav = Object.keys(perL).map(function (k) { var x = perL[k]; x.items.sort(function (a, b) { return a.data.localeCompare(b.data); }); x.n = x.items.length; return x; });
      tab = UI.datatable({
        id: idTab, righe: righeLav, ordine: 'data', per: 12, placeholder: 'Cerca lavoratore, azienda, esame…', extra: [tipi, medico], filtriExtra: modi,
        colonne: [
          { k: '_stato', l: 'Stato', sort: false, cerca: false, cell: function (r) { return r.items.every(function (s) { return s.fissata; }) ? UI.chip('fissata', 'ok') : UI.statusChip(r.data); } },
          { k: 'soggetto', l: 'Lavoratore', cell: function (r) { return '<a href="' + (r.lav ? '#/lavoratori/' + r.lav : '#/ditte/' + r.dittaId) + '" class="strong" style="text-decoration:none">' + U.esc(r.soggetto) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r.soggetto + ' ' + r._ditta; } },
          { k: 'n', l: 'Cosa scade', sort: false, cell: function (r) { return chipsCosa(r.items); }, testo: function (r) { return r.items.map(function (s) { return s.cosa; }).join(' '); }, val: function (r) { return r.n; } },
          { k: 'data', l: 'Prima scadenza', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
          { k: 'medicoId', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(U.nomeMedico(r.medicoId)) + '</span>'; }, testo: function (r) { return U.nomeMedico(r.medicoId); } },
          { k: '_az', l: '', sort: false, cerca: false, cell: function (r) {
            var aperte = r.items.filter(function (s) { return !s.fissata; });
            return azioniRiga((r.lav && aperte.length ? '<button type="button" class="btn btn-xs" data-azione="pianifica" data-lav="' + r.lav + '" title="Una visita per tutte le voci">' + UI.ic('calendar') + (aperte.length > 1 ? ' Pianifica tutto' : ' Pianifica') + '</button>' : '') +
              (aperte.length ? '<button type="button" class="btn btn-xs" data-azione="pro-fissa" data-ids="' + aperte.map(function (s) { return s.id; }).join(',') + '">' + UI.ic('check') + ' Fissata</button>' : ''));
          } }
        ]
      });
    }

    return {
      id: 'scadenziario', icona: 'clock', titolo: 'Scadenziario proattivo', fit: true,
      sotto: 'Clicca una finestra per filtrare · una riga per lavoratore o per azienda',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="' + idTab + '" data-nome="scadenze">' + UI.ic('download') + ' Esporta</button><button type="button" class="btn btn-primary" data-azione="email-scadenze">' + UI.ic('mail') + ' Email raggruppate</button>',
      corpo: kpis + tab
    };
  }

  /* ===================== aggancio alle viste ===================== */
  var dashBase = VISTE.dashboard, attBase = VISTE.attivita;
  VISTE.dashboard = function () {
    if (!operatore()) return dashBase();
    var v = pro().on ? dashPro() : dashBase();
    v.azioni = toggle() + (v.azioni || '');
    return v;
  };
  VISTE.attivita = function () {
    var v = attBase();
    if (pro().on && (STATE.tab.attivita || 'coda') === 'coda') v.corpo = ATTIVITA.tabbar('coda') + codaPro();
    v.azioni = toggle() + (v.azioni || '');
    return v;
  };

  var agBase = VISTE.agenda, scBase = VISTE.scadenziario;
  VISTE.agenda = function () {
    var v = agBase();
    if (operatore()) v.azioni = toggle() + v.azioni;
    return v;
  };
  VISTE.scadenziario = function () {
    if (!operatore()) return scBase();
    var v = pro().on ? scadPro() : scBase();
    v.azioni = toggle() + (v.azioni || '');
    return v;
  };

  /* ===================== azioni ===================== */
  function trova(id) { return tasks().filter(function (t) { return t.id === id; })[0]; }
  AZIONI['pro-toggle'] = function (el) { pro().on = el.dataset.on === '1'; RENDER(); };
  AZIONI['pro-coda'] = function (el) { var s = ast(); s.tipo = el.dataset.tipo; s.sel = ''; STATE.tab.attivita = 'coda'; };
  AZIONI['pro-bucket'] = function (el) { pro().bucket = el.dataset.k; RENDER(); };
  AZIONI['pro-mie'] = function (el) { ast().mie = el.dataset.v === '1'; ast().sel = ''; RENDER(); };
  AZIONI['pro-gruppo'] = function () { ast().gruppo = !ast().gruppo; RENDER(); };
  AZIONI['pro-ditta'] = function (el) { var s = ast(); s.fDitta = el.dataset.ditta; s.tipo = ''; RENDER(); };
  AZIONI['pro-check'] = function (el) {
    var s = ast(), ids = el.dataset.ids ? el.dataset.ids.split(',') : [];
    ids.forEach(function (id) { if (el.checked) s.check[id] = true; else delete s.check[id]; });
    RENDER();
  };
  AZIONI['pro-carico'] = function (el) {
    var s = ast();
    if (s.presi[el.dataset.id]) delete s.presi[el.dataset.id]; else s.presi[el.dataset.id] = mio();
    RENDER();
  };
  AZIONI['pro-sollecita'] = function (el) {
    var t = trova(el.dataset.id);
    if (!t) return;
    t.ref.sollecito = OGGI_ISO;
    RENDER();
    UI.toast('Sollecito di firma inviato al Dott. ' + U.nomeMedico(t.medicoId) + ' (simulazione).', 'ok');
  };
  AZIONI['pro-anteprima'] = function (el) {
    var v = DB.visite.find(function (x) { return x.id === el.dataset.id; });
    if (v) UI.stampa('Certificato di idoneità · ' + U.nomeLav(U.getLav(v.lavoratoreId)), UI.certificato(v), 'Anteprima · in attesa di firma del medico');
  };
  AZIONI['pro-bulk'] = function (el) {
    var s = ast(), op = el.dataset.op;
    var sel = tasks().filter(function (t) { return s.check[t.id]; });
    var msg = '';
    if (op === 'invia') {
      var inv = sel.filter(function (t) { return t.tipo === 'inviare'; });
      inv.forEach(function (t) { t.ref.stato = 'Inviato'; delete s.check[t.id]; });
      msg = inv.length + ' certificati inviati (simulazione).';
    } else if (op === 'sollecita') {
      var fi = sel.filter(function (t) { return t.tipo === 'firmare'; }), med = {};
      fi.forEach(function (t) { t.ref.sollecito = OGGI_ISO; med[t.medicoId] = 1; delete s.check[t.id]; });
      msg = 'Sollecito inviato a ' + Object.keys(med).length + ' medici per ' + fi.length + ' certificati.';
    } else if (op === 'richiamo') {
      var dd = {};
      sel.filter(function (t) { return t.tipo === 'pianificare'; }).forEach(function (t) { dd[t.ditta.id] = t.ditta; delete s.check[t.id]; });
      Object.keys(dd).forEach(function (id) {
        DB.scadenze.forEach(function (x) { if (x.tipo === 'Visita' && x.dittaId === id) x.richiamoInviato = true; });
        DB.note.unshift({ data: OGGI_ISO, dittaId: id, tipo: 'Richiamo', lavoratoreId: '', testo: 'Richiamo di sorveglianza inviato a ' + dd[id].ragione + '.' });
      });
      msg = 'Richiamo inviato a ' + Object.keys(dd).length + ' aziende.';
    } else if (op === 'carico') {
      sel.forEach(function (t) { s.presi[t.id] = mio(); });
      s.check = {};
      msg = sel.length + ' attività prese in carico.';
    } else s.check = {};
    RENDER();
    if (msg) UI.toast(msg, 'ok');
  };

  AZIONI['pro-fin'] = function (el) {
    pro().scadFin = el.dataset.k;
    ['scadPro', 'scadProAz', 'scadProLav'].forEach(function (k) { if (STATE.dt[k]) STATE.dt[k].page = 1; });
    RENDER();
  };
  AZIONI['pro-modo'] = function (el) { pro().scadModo = el.dataset.k; RENDER(); };
  AZIONI['pro-fissa'] = function (el) {
    var ids = el.dataset.ids.split(',');
    DB.scadenze.forEach(function (s) { if (ids.indexOf(s.id) >= 0) { s.fissata = true; s.note = 'Fissata manualmente il ' + U.fmtData(window.OGGI); } });
    RENDER();
    UI.toast(ids.length > 1 ? ids.length + ' scadenze segnate come fissate.' : 'Scadenza segnata come fissata.', 'ok');
  };
  AZIONI['pro-email-ditta'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    var items = U.scadenzeVisibili().filter(function (s) { return s.dittaId === d.id && !s.fissata && U.giorniA(s.data) <= 45; });
    items.forEach(function (s) { s.emailInviata = true; });
    DB.note.unshift({ data: OGGI_ISO, dittaId: d.id, tipo: 'Scadenze', lavoratoreId: '', testo: 'Email scadenze inviata a ' + d.ragione + ' (' + items.length + ' voci).' });
    RENDER();
    UI.toast('Email con ' + items.length + ' scadenze inviata a ' + (d.emailVisite || d.email || d.ragione) + ' (simulazione).', 'ok');
  };

  // le select della coda usano 'change' (un click ridisegnerebbe la pagina con la tendina aperta)
  document.addEventListener('change', function (e) {
    var el = e.target.closest && e.target.closest('select[data-pro-f]');
    if (!el) return;
    var s = ast();
    s[el.dataset.proF] = el.value; s.sel = '';
    RENDER();
  });
})();
