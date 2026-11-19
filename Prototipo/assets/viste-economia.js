/* =========================================================
   CLS · economia: consuntivo medici, fatture e presenze
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};
  var OGGI_ISO = U.iso(window.OGGI);

  function mesiConsuntivo() {
    var out = [];
    for (var i = 0; i < 6; i++) {
      var d = new Date(OGGI_ISO.slice(0, 4), Number(OGGI_ISO.slice(5, 7)) - 1 - i, 1);
      out.push({ ym: d.getFullYear() + '-' + U.pad(d.getMonth() + 1), label: U.MESI[d.getMonth()] + ' ' + d.getFullYear() });
    }
    return out;
  }

  function letterhead(destra) {
    return '<div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. - Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia · Tel. 030 5511220 · P.IVA 01234567890</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863">' + destra + '</div></div>';
  }

  function fatturaHtml(f) {
    var d = U.getDitta(f.dittaId);
    var righe = f.righe.map(function (r) {
      return '<tr><td>' + U.esc(r.descrizione) + '</td><td class="num">' + r.qta + '</td><td class="num">' + U.fmtEuro(r.prezzo) + '</td><td class="num"><b>' + U.fmtEuro(r.qta * r.prezzo) + '</b></td></tr>';
    }).join('');
    return '<div class="print-doc">' + letterhead('Fattura<br><b>' + U.esc(f.numero) + '</b><br>' + U.fmtData(f.data)) +
      '<h3>Fattura</h3><div class="cert-sub">Periodo ' + U.esc(f.periodo) + ' · scadenza ' + U.fmtData(f.scadenza) + '</div>' +
      '<div class="cert-body">' +
      '<div class="cert-row"><span class="k">Cliente</span><span><b>' + U.esc(d.ragione) + '</b> · P.IVA ' + U.esc(d.piva) + '</span></div>' +
      '<div class="cert-row"><span class="k">Sede</span><span>' + U.esc(d.indirizzo) + ', ' + U.esc(d.citta) + ' (' + U.esc(d.prov) + ')</span></div>' +
      '<div class="cert-row"><span class="k">Prestazioni</span><span>' + U.esc(f.periodo) + '</span></div>' +
      '</div>' +
      '<table class="table-mini" style="margin-top:14px"><thead><tr><th>Descrizione</th><th class="num">Q.tà</th><th class="num">Prezzo</th><th class="num">Importo</th></tr></thead><tbody>' + righe + '</tbody></table>' +
      '<div style="margin-top:14px;text-align:right;font-size:12.5px">' +
      '<div>Imponibile <b>' + U.fmtEuro(f.imponibile) + '</b></div><div>IVA 22% <b>' + U.fmtEuro(f.iva) + '</b></div>' +
      '<div style="font-size:15px;margin-top:4px">Totale <b>' + U.fmtEuro(f.totale) + '</b></div></div>' +
      '<div style="margin-top:18px;font-size:10.5px;color:#6b6863">Pagamento a 30 giorni data fattura. Documento dimostrativo del prototipo, non valido ai fini fiscali.</div></div>';
  }

  /* ===================== FATTURE ===================== */
  VISTE.fatture = function () {
    var u = U.utenteCorrente();
    var visibili = DB.fatture.filter(function (f) { return u.ruolo === 'operatore' || f.dittaId === u.dittaId; });
    var daPagare = visibili.filter(function (f) { return f.stato === 'Da pagare'; });
    var pagate = visibili.filter(function (f) { return f.stato === 'Pagata'; });
    var kpis = '<div class="kpis">' +
      UI.kpi({ n: U.fmtEuro(daPagare.reduce(function (a, f) { return a + f.totale; }, 0)), label: 'Da pagare', icona: 'euro', tone: daPagare.length ? 'alert' : 'ok' }) +
      UI.kpi({ n: U.fmtEuro(pagate.reduce(function (a, f) { return a + f.totale; }, 0)), label: 'Pagato', icona: 'check', tone: 'ok' }) +
      UI.kpi({ n: daPagare.length, label: 'Fatture aperte', icona: 'file' }) +
      UI.kpi({ n: visibili.length, label: 'Fatture totali', icona: 'file' }) +
      '</div>';

    var righe = visibili.slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).map(function (f) {
      return Object.assign({}, f, { _ditta: U.nomeDitta(f.dittaId) });
    });
    var tab = UI.datatable({
      id: 'fatture', righe: righe, ordine: 'data', dir: -1, per: 12, placeholder: 'Cerca numero, periodo, azienda…',
      extra: [{ k: 'stato', label: 'Tutti gli stati', opzioni: ['Da pagare', 'Pagata'] }],
      colonne: [
        { k: 'numero', l: 'Fattura', cell: function (r) { return '<b class="mono">' + U.esc(r.numero) + '</b><div class="tiny muted">' + U.fmtData(r.data) + '</div>'; } },
        { k: '_ditta', l: 'Azienda', cell: function (r) { return '<span class="small">' + U.esc(r._ditta) + '</span>'; } },
        { k: 'periodo', l: 'Periodo', cell: function (r) { return '<span class="small">' + U.esc(r.periodo) + '</span>'; } },
        { k: 'imponibile', l: 'Imponibile', num: true, cell: function (r) { return U.fmtEuro(r.imponibile); } },
        { k: 'iva', l: 'IVA', num: true, cell: function (r) { return U.fmtEuro(r.iva); } },
        { k: 'totale', l: 'Totale', num: true, cell: function (r) { return '<b>' + U.fmtEuro(r.totale) + '</b>'; } },
        { k: 'stato', l: 'Stato', cell: function (r) { return UI.chip(r.stato, r.stato === 'Pagata' ? 'ok' : 'warn'); } },
        { k: 'scadenza', l: 'Scadenza', cell: function (r) { return '<span class="mono small">' + U.fmtData(r.scadenza) + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="scarica-fattura" data-id="' + r.id + '">' + UI.ic('download') + ' Scarica</button>'; } }
      ]
    });

    return {
      id: 'fatture', icona: 'euro', titolo: 'Fatture',
      sotto: u.ruolo === 'ditta' ? 'Fatture della nostra azienda · download PDF' : 'Fatture emesse ai clienti',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="fatture" data-nome="fatture">' + UI.ic('download') + ' Esporta</button>',
      corpo: kpis + tab
    };
  };

  AZIONI['scarica-fattura'] = function (el) {
    var f = DB.fatture.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!f) return;
    var u = U.utenteCorrente();
    if (u.ruolo === 'ditta' && f.dittaId !== u.dittaId) return;
    UI.stampa('Fattura ' + f.numero, fatturaHtml(f), U.nomeDitta(f.dittaId) + ' · ' + f.periodo);
  };

  /* ===================== CONSUNTIVO MEDICO ===================== */
  function meseScelto() {
    var opts = mesiConsuntivo();
    var ym = window.STATE.consuntivoMese;
    if (!ym || !opts.some(function (o) { return o.ym === ym; })) ym = opts[0].ym;
    return { ym: ym, opt: opts.filter(function (o) { return o.ym === ym; })[0] || opts[0], opts: opts };
  }

  VISTE.consuntivo = function () {
    var u = U.utenteCorrente();
    if (!u || u.ruolo !== 'medico') return { id: 'dashboard', icona: 'home', titolo: 'Non disponibile', corpo: UI.empty('Il consuntivo è personale del medico competente.', 'lock') };
    var m = U.getMedico(u.medicoId);
    var sel = meseScelto();
    var c = U.compensiMedico(m.id, sel.ym);
    var tariffa = DB.tariffe[m.id] || {};

    var kpis = '<div class="kpis">' +
      UI.kpi({ n: U.fmtEuro(c.totale), label: 'Maturato ' + sel.opt.label, icona: 'euro', tone: 'ok' }) +
      UI.kpi({ n: c.visite, label: 'Visite', icona: 'heart' }) +
      UI.kpi({ n: c.esami, label: 'Accertamenti', icona: 'activity' }) +
      UI.kpi({ n: c.sopralluoghi, label: 'Sopralluoghi', icona: 'pin' }) +
      UI.kpi({ n: c.trasferte, label: 'Trasferte', icona: 'building' }) +
      '</div>';

    var filtro = '<label class="row" style="gap:8px"><span class="small muted">Periodo</span><select data-azione="cons-mese" aria-label="Mese del consuntivo" style="min-width:160px">' +
      sel.opts.map(function (o) { return '<option value="' + o.ym + '"' + (o.ym === sel.ym ? ' selected' : '') + '>' + o.label + '</option>'; }).join('') + '</select></label>';

    var dettaglio = UI.datatable({
      id: 'consuntivo', righe: c.righe.map(function (r) { return Object.assign({}, r); }), ordine: 'data', per: 15, cls: 'dt-annidata', placeholder: 'Cerca prestazione, lavoratore, azienda…',
      extra: [{ k: 'prestazione', label: 'Tutte le prestazioni', opzioni: Object.keys(c.righe.reduce(function (o, r) { o[r.prestazione] = 1; return o; }, {})).sort() }],
      colonne: [
        { k: 'data', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; }, testo: function (r) { return U.fmtData(r.data); }, val: function (r) { return r.data; } },
        { k: 'prestazione', l: 'Prestazione', cell: function (r) { return '<b>' + U.esc(r.prestazione) + '</b><div class="tiny muted">' + U.esc(r.descrizione) + '</div>'; }, testo: function (r) { return r.prestazione + ' ' + r.descrizione; } },
        { k: 'soggetto', l: 'Soggetto / azienda', cell: function (r) { return U.esc(r.soggetto) + '<div class="tiny muted">' + U.esc(r.ditta) + '</div>'; }, testo: function (r) { return r.soggetto + ' ' + r.ditta; } },
        { k: 'importo', l: 'Importo', num: true, cell: function (r) { return U.fmtEuro(r.importo); }, val: function (r) { return r.importo; } }
      ],
      totale: function (rs) { return '<tr><td colspan="3">Totale filtrato: <b>' + rs.length + '</b> prestazioni</td><td class="num">' + U.fmtEuro(rs.reduce(function (t, r) { return t + (Number(r.importo) || 0); }, 0)) + '</td></tr>'; }
    });

    var riepilogo = UI.tableMini([['Mese', ''], ['Visite', 'num'], ['Importo', 'num']], mesiConsuntivo().map(function (o) {
      var cc = U.compensiMedico(m.id, o.ym);
      return { celle: [o.label, String(cc.visite), U.fmtEuro(cc.totale)] };
    }));

    var tariffario = UI.card({
      titolo: 'Tariffario', icona: 'euro', sub: U.esc(m.nome.split(' ')[0]),
      corpo: UI.kv([
        ['Visita', U.fmtEuro(tariffa.visita)],
        ['Accertamento', U.fmtEuro(tariffa.esame)],
        ['Sopralluogo', U.fmtEuro(tariffa.sopralluogo)],
        ['Trasferta esterna', U.fmtEuro(tariffa.trasferta)]
      ]) + '<div class="note info mt">Compenso <b>a prestazione</b> secondo il listino concordato: ogni visita, accertamento e sopralluogo matura un importo; le trasferte esterne sono rimborsate a parte. È il modello usato dai gestionali di medicina del lavoro (compensi a fornitori).</div>'
    });

    var corpo = '<div class="row wrap" style="margin-bottom:10px">' + filtro + '<span class="right small muted">' + U.esc(m.nome) + ' · ' + U.esc(m.email) + '</span></div>' + kpis +
      '<div class="grid-side"><div class="col" style="gap:16px">' +
      UI.card({ titolo: 'Dettaglio prestazioni', icona: 'list', sub: sel.opt.label, azioni: '<button type="button" class="btn btn-sm btn-primary" data-azione="scarica-consuntivo">' + UI.ic('download') + ' Scarica consuntivo</button>', corpo: c.righe.length ? dettaglio : UI.empty('Nessuna prestazione nel mese selezionato.', 'euro'), tight: true }) +
      UI.card({ titolo: 'Ultimi mesi', icona: 'clock', corpo: riepilogo, tight: true }) +
      '</div><div class="col" style="gap:16px">' + tariffario +
      UI.card({ titolo: 'Come funziona', icona: 'shield', corpo: '<div class="small muted">Il consuntivo raccoglie le prestazioni concluse nel mese. Il pagamento è disposto dalla segreteria CLS; qui vedi il maturato e puoi scaricare il riepilogo. Le prestazioni esterne e le trasferte sono indicate separatamente.</div>' }) +
      '</div></div>';

    return {
      id: 'consuntivo', icona: 'euro', titolo: 'Consuntivo', sotto: 'Compensi a prestazione · ' + sel.opt.label, fit: false, corpo: corpo
    };
  };

  AZIONI['cons-mese'] = function (el) {
    window.STATE.consuntivoMese = el.value;
    RENDER();
  };

  AZIONI['scarica-consuntivo'] = function () {
    var u = U.utenteCorrente();
    if (!u || u.ruolo !== 'medico') return;
    var m = U.getMedico(u.medicoId);
    var sel = meseScelto();
    var c = U.compensiMedico(m.id, sel.ym);
    var rows = c.righe.map(function (r) {
      return '<tr><td>' + U.fmtData(r.data) + '</td><td>' + U.esc(r.prestazione) + '<div style="font-size:10px;color:#6b6863">' + U.esc(r.descrizione) + '</div></td><td>' + U.esc(r.soggetto) + '</td><td class="num">' + U.fmtEuro(r.importo) + '</td></tr>';
    }).join('');
    var html = '<div class="print-doc">' + letterhead('Consuntivo<br><b>' + sel.opt.label + '</b>') +
      '<h3>Consuntivo compensi</h3><div class="cert-sub">Medico competente · ' + U.esc(m.nome) + '</div>' +
      '<div class="cert-body"><div class="cert-row"><span class="k">Periodo</span><span>' + sel.opt.label + '</span></div>' +
      '<div class="cert-row"><span class="k">Prestazioni</span><span>' + c.righe.length + '</span></div>' +
      '<div class="cert-row"><span class="k">Totale maturato</span><span><b>' + U.fmtEuro(c.totale) + '</b></span></div></div>' +
      '<table class="table-mini" style="margin-top:14px"><thead><tr><th>Data</th><th>Prestazione</th><th>Soggetto</th><th class="num">Importo</th></tr></thead><tbody>' + (rows || '<tr><td colspan="4">Nessuna prestazione.</td></tr>') + '</tbody></table>' +
      '<div style="margin-top:18px;font-size:10.5px;color:#6b6863">Compenso a prestazione secondo il listino concordato. Documento dimostrativo del prototipo.</div></div>';
    UI.stampa('Consuntivo ' + sel.opt.label, html, m.nome + ' · ' + U.fmtEuro(c.totale));
  };

  /* ===================== CERTIFICATO DI PRESENZA ===================== */
  AZIONI['certificato-presenza'] = function (el) {
    var v = DB.visite.filter(function (x) { return x.id === el.dataset.visita; })[0];
    if (!v || !U.puoLav({ id: v.lavoratoreId })) return;
    var l = U.getLav(v.lavoratoreId), d = U.getDitta(v.dittaId), med = U.getMedico(v.medicoId);
    var fine = (function () {
      var p = String(v.ora || '09:00').split(':').map(Number);
      var min = (p[0] || 0) * 60 + (p[1] || 0) + (Number(v.durata) || 30);
      return U.pad(Math.floor(min / 60)) + ':' + U.pad(min % 60);
    })();
    var html = '<div class="print-doc">' + letterhead('Certificato<br>' + U.fmtData(v.data)) +
      '<h3>Certificato di presenza</h3><div class="cert-sub">Accesso del lavoratore presso il centro medico</div>' +
      '<div class="cert-body">' +
      '<div class="cert-row"><span class="k">Lavoratore</span><span><b>' + U.esc(U.nomeLav(l)) + '</b> · nato il ' + U.fmtData(l.nascita) + '</span></div>' +
      '<div class="cert-row"><span class="k">Codice fiscale</span><span>' + U.esc(l.cf) + '</span></div>' +
      '<div class="cert-row"><span class="k">Azienda</span><span>' + U.esc(d.ragione) + '</span></div>' +
      '<div class="cert-row"><span class="k">Data e orario</span><span>' + U.fmtLunga(U.asDate(v.data)) + ' · dalle ' + U.esc(v.ora) + ' alle ' + fine + '</span></div>' +
      '<div class="cert-row"><span class="k">Prestazione</span><span>' + U.esc(v.tipo) + ' — ' + U.esc(U.getMansione(v.mansioneId).nome) + '</span></div>' +
      '<div class="cert-row"><span class="k">Luogo</span><span>' + U.esc(v.sede || 'CLS — sede di Brescia') + '</span></div>' +
      '<div class="cert-row"><span class="k">Medico</span><span>Dott. ' + U.esc(med.nome) + '</span></div>' +
      '</div><div style="margin-top:22px;font-size:10.5px;color:#6b6863">Certificato rilasciato su richiesta dell’azienda per giustificare l’assenza dal posto di lavoro. Documento dimostrativo del prototipo.</div></div>';
    UI.stampa('Certificato di presenza · ' + U.nomeLav(l), html, U.fmtData(v.data) + ' · ' + d.ragione);
  };
})();
