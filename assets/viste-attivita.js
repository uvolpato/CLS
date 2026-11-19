/* =========================================================
   CLS · Attività: coda di lavoro e richiami
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};

  function astate() {
    if (!STATE.attivita) STATE.attivita = { tipo: '', priorita: '', cerca: '', sel: '' };
    return STATE.attivita;
  }

  function pianificareItems() {
    return DB.scadenze.filter(function (s) { return s.tipo === 'Visita' && !s.fissata && U.giorniA(s.data) < 0; });
  }
  function refertareItems() {
    return DB.esami.filter(function (e) { return /DA RIPETERE|NON PERVENUTO/.test(e.risultato); });
  }
  function firmareItems() {
    var conCertificato = {};
    DB.documenti.forEach(function (d) { if (d.tipo === 'Giudizio di idoneità' && d.visitaId) conCertificato[d.visitaId] = true; });
    return DB.visite.filter(function (v) { return v.stato === 'eseguita' && !conCertificato[v.id]; });
  }
  function inviareItems() {
    return DB.documenti.filter(function (d) { return d.stato === 'Da inviare'; });
  }

  function tasks() {
    var out = [];
    pianificareItems().forEach(function (s) {
      var l = U.getLav(s.lavoratoreId), d = U.getDitta(s.dittaId);
      out.push({
        id: 'p:' + s.id, tipo: 'pianificare', tipoLabel: 'Pianificare', verbo: 'Pianifica visita',
        data: s.data, priorita: U.giorniA(s.data) < -60 ? 'alta' : 'media',
        soggetto: U.nomeLav(l), azienda: d.ragione, lav: l, ditta: d, ref: s,
        dettaglio: U.getMansione(l.mansioneId).nome + ' · ' + s.cosa
      });
    });
    refertareItems().forEach(function (e) {
      var l = U.getLav(e.lavoratoreId), d = U.getDitta(e.dittaId);
      out.push({
        id: 'e:' + e.id, tipo: 'refertare', tipoLabel: 'Refertare', verbo: 'Verifica referto',
        data: e.data, priorita: 'alta', soggetto: U.nomeLav(l), azienda: d.ragione, lav: l, ditta: d, ref: e,
        dettaglio: e.accertamento + ' · ' + e.risultato
      });
    });
    firmareItems().forEach(function (v) {
      var l = U.getLav(v.lavoratoreId), d = U.getDitta(v.dittaId);
      var g = U.giorniA(v.data);
      out.push({
        id: 'v:' + v.id, tipo: 'firmare', tipoLabel: 'Firmare', verbo: 'Firma certificato',
        data: v.data, priorita: g > -30 ? 'alta' : g > -180 ? 'media' : 'bassa',
        soggetto: U.nomeLav(l), azienda: d.ragione, lav: l, ditta: d, ref: v,
        dettaglio: 'Visita ' + U.fmtData(v.data) + ' · ' + (v.giudizio || 'giudizio da definire')
      });
    });
    inviareItems().forEach(function (doc) {
      var l = U.getLav(doc.lavoratoreId), d = U.getDitta(doc.dittaId);
      out.push({
        id: 'd:' + doc.id, tipo: 'inviare', tipoLabel: 'Inviare', verbo: 'Invia certificato',
        data: doc.dataDoc, priorita: 'alta', soggetto: U.nomeLav(l), azienda: d.ragione, lav: l, ditta: d, ref: doc,
        dettaglio: 'Certificato ' + U.fmtData(doc.dataDoc) + ' · ' + doc.stato
      });
    });
    out.sort(function (a, b) {
      var pa = a.priorita === 'alta' ? 0 : a.priorita === 'media' ? 1 : 2;
      var pb = b.priorita === 'alta' ? 0 : b.priorita === 'media' ? 1 : 2;
      if (pa !== pb) return pa - pb;
      return String(a.data).localeCompare(String(b.data));
    });
    return out;
  }
  window.ATTIVITA = { count: function () { return tasks().length; }, tasks: tasks, recallGroups: recallGroups, tabbar: tabbar };

  function recallGroups() {
    var gruppi = {};
    DB.scadenze.filter(function (s) { return s.tipo === 'Visita'; }).forEach(function (s) {
      (gruppi[s.dittaId] = gruppi[s.dittaId] || []).push(s);
    });
    return Object.keys(gruppi).map(function (id) {
      var items = gruppi[id].slice().sort(function (a, b) { return a.data.localeCompare(b.data); });
      return {
        ditta: U.getDitta(id), items: items,
        scaduti: items.filter(function (s) { return U.giorniA(s.data) < 0 && !s.fissata; }).length,
        prossima: items[0] ? items[0].data : ''
      };
    }).sort(function (a, b) {
      if (b.scaduti !== a.scaduti) return b.scaduti - a.scaduti;
      return String(a.prossima).localeCompare(String(b.prossima));
    });
  }

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function etaLabel(t) {
    if (t.tipo === 'pianificare') return UI.statusChip(t.data);
    var g = U.giorniA(t.data);
    if (g === 0) return '<span class="chip warn">oggi</span>';
    if (g > 0) return '<span class="chip plain">tra ' + g + ' gg</span>';
    return '<span class="chip warn">aperta da ' + Math.abs(g) + ' gg</span>';
  }
  function priTone(p) { return p === 'alta' ? 'err' : p === 'media' ? 'warn' : 'info'; }
  function priLabel(p) { return p === 'alta' ? 'Alta' : p === 'media' ? 'Media' : 'Bassa'; }

  function filterBar(all) {
    var st = astate();
    var counts = { '': all.length, pianificare: 0, refertare: 0, firmare: 0, inviare: 0 };
    all.forEach(function (t) { counts[t.tipo]++; });
    var tipi = [['', 'Tutte'], ['pianificare', 'Pianificare'], ['refertare', 'Refertare'], ['firmare', 'Firmare'], ['inviare', 'Inviare']];
    return '<div class="filtri"><input id="att-cerca" type="search" value="' + U.esc(st.cerca) + '" placeholder="Cerca lavoratore, azienda, attività…" aria-label="Cerca attività">' +
      '<div class="seg seg-sm">' + tipi.map(function (x) {
        return '<button type="button" data-azione="attivita-tipo" data-tipo="' + x[0] + '" aria-pressed="' + (st.tipo === x[0] ? 'true' : 'false') + '">' + x[1] + '<span class="n">' + counts[x[0]] + '</span></button>';
      }).join('') + '</div>' +
      '<select data-azione="attivita-priorita" aria-label="Priorità" style="max-width:160px;min-height:31px;font-size:12.5px">' + UI.opts([['', 'Tutte le priorità'], ['alta', 'Priorità alta'], ['media', 'Priorità media'], ['bassa', 'Priorità bassa']], st.priorita) + '</select>' +
      '<span class="right small muted nowrap">' + all.length + ' attività</span></div>';
  }

  function actionButton(t, small) {
    var cls = small ? 'btn btn-xs' : 'btn btn-primary';
    if (t.tipo === 'pianificare') return '<button type="button" class="' + cls + '" data-azione="pianifica" data-lav="' + t.lav.id + '">' + UI.ic('calendar') + ' Pianifica</button>';
    if (t.tipo === 'refertare') return '<button type="button" class="' + cls + '" data-azione="apri-referto" data-id="' + t.ref.id + '">' + UI.ic('eye') + ' Apri</button>';
    if (t.tipo === 'firmare') return '<button type="button" class="' + cls + (small ? '' : ' btn-primary') + '" data-azione="attivita-firma" data-id="' + t.ref.id + '">' + UI.ic('shield') + ' Firma</button>';
    return '<button type="button" class="' + cls + (small ? '' : ' btn-primary') + '" data-azione="invia-documento" data-id="' + t.ref.id + '">' + UI.ic('send') + ' Invia</button>';
  }

  function row(t, selected) {
    return '<tr class="click ' + (selected ? 'selected' : '') + '" data-azione="attivita-sel" data-id="' + t.id + '">' +
      '<td><span class="dot ' + priTone(t.priorita) + '" title="Priorità ' + priLabel(t.priorita) + '"></span></td>' +
      '<td><b>' + t.verbo + '</b><div class="tiny muted">' + U.esc(t.dettaglio) + '</div></td>' +
      '<td><b>' + U.esc(t.soggetto) + '</b></td>' +
      '<td class="small">' + U.esc(t.azienda) + '</td>' +
      '<td>' + etaLabel(t) + '</td>' +
      '<td class="right">' + actionButton(t, true) + '</td></tr>';
  }

  function detail(t) {
    if (!t) return '<div class="card att-detail"><div class="card-body">' + UI.empty('Seleziona un’attività dalla coda per vedere il contesto e le azioni.', 'inbox') + '</div></div>';
    var l = t.lav, d = t.ditta;
    var uv = U.ultimaVisita(l.id);
    var why = '';
    if (t.tipo === 'pianificare') why = 'La visita di sorveglianza è scaduta il <b>' + U.fmtData(t.data) + '</b> e non ha un appuntamento. Mansione: <b>' + U.esc(U.getMansione(l.mansioneId).nome) + '</b>.';
    if (t.tipo === 'refertare') why = 'L’esame <b>' + U.esc(t.ref.accertamento) + '</b> del ' + U.fmtData(t.data) + ' è <b>' + U.esc(t.ref.risultato) + '</b>. Verifica il referto prima di chiudere la visita.';
    if (t.tipo === 'firmare') why = 'Visita del <b>' + U.fmtData(t.data) + '</b> con giudizio <b>' + U.esc(t.ref.giudizio) + '</b>, ma il certificato non è ancora archiviato.';
    if (t.tipo === 'inviare') why = 'Il certificato del <b>' + U.fmtData(t.data) + '</b> è pronto ma non è stato trasmesso al lavoratore e all’azienda.';
    var second = '<a class="btn" href="#/lavoratori/' + l.id + '">' + UI.ic('user') + ' Cartella</a>';
    if (t.tipo === 'inviare') second = '<button type="button" class="btn" data-azione="apri-documento" data-id="' + t.ref.id + '">' + UI.ic('file') + ' Documento</button>';
    if (t.tipo === 'refertare') second = '<a class="btn" href="#/lavoratori/' + l.id + '">' + UI.ic('user') + ' Cartella</a>';
    return '<aside class="card att-detail" data-key="' + t.id + '"><div class="card-head"><h2>' + UI.ic('inbox') + ' Dettaglio</h2><span class="chip ' + priTone(t.priorita) + '">' + priLabel(t.priorita) + '</span></div><div class="card-body">' +
      '<div class="eyebrow">' + t.tipoLabel + '</div><h2 style="font-size:18px;margin:4px 0 2px">' + t.verbo + '</h2><div class="small muted">' + U.esc(t.soggetto) + ' · ' + U.esc(t.azienda) + '</div>' +
      UI.kv([['Lavoratore', U.esc(U.nomeLav(l))], ['Azienda', U.esc(d.ragione)], ['Mansione', U.esc(U.getMansione(l.mansioneId).nome)], ['Medico', 'Dott. ' + U.esc(U.nomeMedico(d.medicoId))], ['Ultima visita', uv ? U.fmtData(uv.data) : '—'], ['Data attività', U.fmtData(t.data)]], 'kv-1') +
      '<div class="note ' + (t.priorita === 'alta' ? 'warn' : '') + '">' + why + '</div>' +
      '<div class="row wrap mt">' + actionButton(t, false) + second + '</div>' +
      '</div></aside>';
  }

  function codaView() {
    var all = tasks();
    var st = astate();
    var q = norm(st.cerca);
    var filtered = all.filter(function (t) {
      if (st.tipo && t.tipo !== st.tipo) return false;
      if (st.priorita && t.priorita !== st.priorita) return false;
      if (q && norm(t.soggetto + ' ' + t.azienda + ' ' + t.verbo + ' ' + t.dettaglio).indexOf(q) < 0) return false;
      return true;
    });
    var selected = filtered.filter(function (t) { return t.id === st.sel; })[0] || filtered[0] || null;
    st.sel = selected ? selected.id : '';
    var body = filtered.length ? filtered.map(function (t) { return row(t, selected && selected.id === t.id); }).join('') : '<tr><td colspan="6">' + UI.empty('Nessuna attività con questi filtri.', 'check') + '</td></tr>';
    return '<div class="grid-side att-wrap"><div class="card"><div class="card-head"><h2>' + UI.ic('inbox') + ' Coda di lavoro</h2><span class="sub">' + all.length + ' aperte · ordinate per priorità</span></div>' +
      filterBar(all) +
      '<div class="table-box att-list"><table class="dt att-table"><thead><tr><th style="width:12px"></th><th>Attività</th><th>Soggetto</th><th>Azienda</th><th>Aperta / scadenza</th><th></th></tr></thead><tbody>' + body + '</tbody></table></div>' +
      '<div class="dt-piede"><span><b>' + filtered.length + '</b> attività visibili</span><span class="muted">seleziona una riga per il dettaglio</span><span class="right small muted">Aggiornata al ' + U.fmtData(window.OGGI) + '</span></div></div>' +
      detail(selected) + '</div>';
  }

  function richiamiView() {
    var rec = recallGroups();
    var all = rec.reduce(function (s, x) { return s.concat(x.items); }, []);
    var scaduti = all.filter(function (s) { return U.giorniA(s.data) < 0 && !s.fissata; }).length;
    var entro30 = all.filter(function (s) { var g = U.giorniA(s.data); return g >= 0 && g <= 30 && !s.fissata; }).length;
    var fissati = all.filter(function (s) { return s.fissata; }).length;
    var st = astate();
    var corpo = rec.map(function (r) {
      var open = st.ditta === r.ditta.id;
      var inviato = r.items.some(function (s) { return s.richiamoInviato; });
      return '<div class="recall"><div class="recall-head">' +
        '<button type="button" class="queue-head" data-azione="attivita-ditta" data-ditta="' + r.ditta.id + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="dot ' + (r.scaduti ? 'err' : 'warn') + '"></span><span class="grow"><b>' + U.esc(r.ditta.ragione) + '</b><small>' + r.items.length + ' lavoratori · ' + r.scaduti + ' scaduti · prossima ' + U.fmtData(r.prossima) + '</small></span>' +
        (inviato ? '<span class="chip ok">richiamo inviato</span>' : '') + '<span class="n">' + r.items.length + '</span><span class="queue-ico">' + UI.ic(open ? 'down' : 'right') + '</span></button>' +
        '<button type="button" class="btn btn-xs" data-azione="attivita-richiamo" data-ditta="' + r.ditta.id + '">' + UI.ic('mail') + ' Invia richiamo</button></div>' +
        (open ? '<div class="queue-body">' + UI.datatable({
          id: 'richiami-' + r.ditta.id, cls: 'dt-annidata', per: 10, ordine: 'data', placeholder: 'Cerca lavoratore, mansione…',
          righe: r.items.map(function (s) { var l = U.getLav(s.lavoratoreId), uv = U.ultimaVisita(l.id); return { id: s.id, lavId: l.id, _nome: U.nomeLav(l), _mans: U.getMansione(l.mansioneId).nome, _uv: uv ? uv.data : '', data: s.data, fissata: s.fissata }; }),
          colonne: [
            { k: '_nome', l: 'Lavoratore', cell: function (x) { return '<a href="#/lavoratori/' + x.lavId + '"><b>' + U.esc(x._nome) + '</b></a>'; } },
            { k: '_mans', l: 'Mansione' },
            { k: '_uv', l: 'Ultima visita', cell: function (x) { return x._uv ? '<span class="mono">' + U.fmtData(x._uv) + '</span>' : '—'; }, testo: function (x) { return x._uv ? U.fmtData(x._uv) : ''; }, val: function (x) { return x._uv; } },
            { k: 'data', l: 'Scadenza', cell: function (x) { return '<span class="mono">' + U.fmtData(x.data) + '</span>'; }, testo: function (x) { return U.fmtData(x.data); }, val: function (x) { return x.data; } },
            { k: '_st', l: 'Stato', sort: false, cerca: false, cell: function (x) { return UI.statusChip(x.data); } },
            { k: '_az', l: '', sort: false, cerca: false, cell: function (x) { return x.fissata ? '<a class="btn btn-xs" href="#/agenda">Agenda</a>' : '<button type="button" class="btn btn-xs" data-azione="pianifica" data-lav="' + x.lavId + '">' + UI.ic('calendar') + ' Pianifica</button>'; } }
          ]
        }) + '</div>' : '') + '</div>';
    }).join('');
    return '<div class="note info">' + UI.ic('mail') + ' Un richiamo per azienda: la lista mostra chi è in scadenza, la mansione e perché va richiamato. “Invia richiamo” registra l’invio e “Pianifica” apre l’agenda.</div>' +
      '<div class="card"><div class="card-head"><h2>' + UI.ic('clock') + ' Richiami di sorveglianza</h2><span class="sub">' + rec.length + ' aziende · ' + all.length + ' lavoratori</span>' +
      '<div class="right row wrap"><span class="chip err">' + scaduti + ' scadute</span><span class="chip warn">' + entro30 + ' entro 30 gg</span><span class="chip ok">' + fissati + ' fissate</span></div></div>' +
      '<div class="queue-list">' + (corpo || UI.empty('Nessun richiamo aperto.', 'check')) + '</div></div>';
  }

  function tabbar(tab) {
    var scaduti = recallGroups().reduce(function (s, x) { return s + x.scaduti; }, 0);
    var tabs = [
      { id: 'coda', label: 'Coda di lavoro', n: tasks().length },
      { id: 'richiami', label: 'Richiami', n: scaduti }
    ];
    return '<div class="tabbar" style="background:var(--surface);border:1px solid var(--border);border-radius:var(--r-lg);padding:0 12px">' + tabs.map(function (t) {
      return '<button type="button" role="tab" aria-selected="' + (t.id === tab ? 'true' : 'false') + '" data-azione="tab" data-chiave="attivita" data-tab="' + t.id + '">' + t.label + '<span class="n">' + t.n + '</span></button>';
    }).join('') + '</div>';
  }

  VISTE.attivita = function () {
    var tab = STATE.tab.attivita || 'coda';
    var corpo = tabbar(tab) + (tab === 'richiami' ? richiamiView() : codaView());

    return {
      id: 'attivita', icona: 'inbox', titolo: 'Attività', sotto: 'Coda di lavoro e richiami di sorveglianza',
      azioni: '<a class="btn btn-sm" href="#/agenda">' + UI.ic('calendar') + ' Agenda</a><a class="btn btn-sm" href="#/scadenziario">' + UI.ic('clock') + ' Scadenziario</a>',
      corpo: corpo,
      dopo: function () {
        if (STATE.focusAtt !== undefined && STATE.focusAtt !== null) {
          var i = document.getElementById('att-cerca');
          if (i) { i.focus(); try { i.setSelectionRange(STATE.focusAtt, STATE.focusAtt); } catch (e) { } }
          STATE.focusAtt = null;
        }
      }
    };
  };

  AZIONI['attivita-tipo'] = function (el) { astate().tipo = el.dataset.tipo; astate().sel = ''; RENDER(); };
  AZIONI['attivita-priorita'] = function (el) { astate().priorita = el.value; astate().sel = ''; RENDER(); };
  AZIONI['attivita-sel'] = function (el) { astate().sel = el.dataset.id; RENDER(); };
  AZIONI['attivita-ditta'] = function (el) {
    var st = astate();
    st.ditta = st.ditta === el.dataset.ditta ? '' : el.dataset.ditta;
    RENDER();
  };
  AZIONI['attivita-richiamo'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    var items = DB.scadenze.filter(function (s) { return s.tipo === 'Visita' && s.dittaId === d.id; });
    items.forEach(function (s) { s.richiamoInviato = true; });
    DB.note.unshift({ data: U.iso(window.OGGI), dittaId: d.id, tipo: 'Richiamo', lavoratoreId: '', testo: 'Richiamo di sorveglianza inviato a ' + d.ragione + ' per ' + items.length + ' lavoratori.' });
    RENDER();
    UI.toast('Richiamo inviato a ' + (d.emailVisite || d.email) + ' per ' + items.length + ' lavoratori.', 'ok');
  };
  AZIONI['attivita-firma'] = function (el) {
    var v = DB.visite.find(function (x) { return x.id === el.dataset.id; });
    if (!v) return;
    var l = U.getLav(v.lavoratoreId);
    DB.documenti.unshift({
      id: 'doc' + Date.now(), tipo: 'Giudizio di idoneità', soggetto: U.nomeLav(l), dittaId: v.dittaId,
      lavoratoreId: l.id, anno: U.asDate(v.data).getFullYear(), dataDoc: v.data, stato: 'Firmato e inviato',
      generatoIl: U.iso(window.OGGI), email: l.email, visitaId: v.id, firma: 'Dott. ' + U.nomeMedico(v.medicoId)
    });
    UI.stampa('Certificato di idoneità · ' + U.nomeLav(l), UI.certificato(v), 'Firmato e archiviato dall’attività');
    RENDER();
    UI.toast('Certificato firmato e archiviato per ' + U.nomeLav(l) + '.', 'ok');
  };

  // ricerca con ripristino del focus dopo il re-render
  document.addEventListener('input', function (e) {
    if (e.target && e.target.id === 'att-cerca') {
      astate().cerca = e.target.value;
      astate().sel = '';
      STATE.focusAtt = e.target.value.length;
      RENDER();
    }
  });

})();
