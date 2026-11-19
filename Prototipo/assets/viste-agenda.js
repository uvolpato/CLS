/* =========================================================
   CLS · Agenda giornaliera per medici, sedi e blocchi esterni
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};

  var OGGI_ISO = U.iso(window.OGGI);
  var START = 8 * 60;
  var END = 18 * 60;
  var SLOT = 30;

  function toMin(ora) {
    var p = String(ora || '09:00').split(':').map(Number);
    return (p[0] || 0) * 60 + (p[1] || 0);
  }
  function fmtMin(m) {
    m = Math.max(0, Math.min(1439, Math.round(m)));
    return U.pad(Math.floor(m / 60)) + ':' + U.pad(m % 60);
  }
  function dur(e) { return Number(e && e.durata) || 30; }
  function eventEnd(e) { return toMin(e.ora) + dur(e); }
  function selectedDay(giorni) {
    var g = STATE.agendaGiorno;
    if (!g || giorni.indexOf(g) < 0) {
      g = giorni.indexOf(OGGI_ISO) >= 0 ? OGGI_ISO : giorni[0];
      STATE.agendaGiorno = g;
    }
    return g;
  }
  function eventiGiorno(g) { return U.eventiVisibili().filter(function (e) { return e.data === g; }); }
  function blocchiGiorno(g) { return U.blocchiVisibili().filter(function (b) { return b.data === g; }); }
  function offsetDi(g) {
    var d = U.asDate(g);
    var day = (d.getDay() + 6) % 7;
    var lun = new Date(d); lun.setDate(lun.getDate() - day);
    var base = U.asDate(U.settimana(0)[0]);
    return Math.round((lun - base) / 604800000);
  }

  function mediciGiorno(g) {
    return U.mediciVisibili().map(function (m) {
      var ev = eventiGiorno(g).filter(function (e) { return e.medicoId === m.id; });
      var bl = blocchiGiorno(g).filter(function (b) { return b.medicoId === m.id; });
      return { medico: m, eventi: ev, blocchi: bl, media: U.durataMedia(m.id), count: DB.visite.filter(function (v) { return v.stato === 'eseguita' && v.medicoId === m.id; }).length };
    });
  }

  function filtroEvento(e) {
    var f = STATE.agendaFiltro || 'tutti';
    if (f === 'sede') return e.modalita !== 'esterna';
    if (f === 'esterni') return e.modalita === 'esterna';
    return true;
  }

  function dayStrip(giorni, selected) {
    return '<div class="day-strip">' + giorni.map(function (g) {
      var d = U.asDate(g);
      var n = eventiGiorno(g).length;
      var conf = proposta() && (eventiGiorno(g).some(function (e) { return e.conflitto; }) || blocchiGiorno(g).some(function (b) { return b.conflitto; }));
      return '<button type="button" class="day-chip ' + (g === selected ? 'sel' : '') + (g === OGGI_ISO ? ' today' : '') + (conf ? ' conf' : '') + '" title="' + (conf ? 'Ci sono conflitti' : '') + '" data-azione="agenda-giorno" data-giorno="' + g + '" aria-pressed="' + (g === selected ? 'true' : 'false') + '">' +
        '<span class="d">' + U.GIORNI[d.getDay()].slice(0, 3).toUpperCase() + '</span><b>' + d.getDate() + '</b><span class="n">' + n + '</span></button>';
    }).join('') + '</div>';
  }

  // posizione al minuto nella griglia a slot da 30': riga di partenza + scostamento in px (righe da RIGA_PX)
  var RIGA_PX = 58;
  function posizione(start, end) {
    var r0 = Math.floor((start - START) / SLOT), r1 = Math.ceil((end - START) / SLOT);
    var su = (start - START - r0 * SLOT) / SLOT * RIGA_PX, giu = (START + r1 * SLOT - end) / SLOT * RIGA_PX;
    return 'grid-row:' + (r0 + 2) + ' / span ' + Math.max(1, r1 - r0) + ';margin-top:' + (su + 1).toFixed(1) + 'px;margin-bottom:' + (giu + 1).toFixed(1) + 'px';
  }
  function gridHtml(g, filtro, medici) {
    medici = medici || U.mediciVisibili();
    var evs = eventiGiorno(g).filter(filtroEvento);
    var bls = (filtro === 'sede' ? [] : blocchiGiorno(g));
    var rows = (END - START) / SLOT;
    var cols = '72px repeat(' + medici.length + ',minmax(140px,1fr))';
    var rowStyle = 'grid-template-rows:60px repeat(' + rows + ',' + RIGA_PX + 'px);grid-template-columns:' + cols;
    var minWidth = Math.max(600, 72 + medici.length * 140);
    var html = '<div class="agenda-doc" style="' + rowStyle + ';min-width:' + minWidth + 'px">';
    html += '<div class="agd-corner">Ora</div>';
    medici.forEach(function (m, i) {
      var n = evs.filter(function (e) { return e.medicoId === m.id; }).length;
      html += '<div class="agd-doc-head"><div class="row">' + UI.avatar(m.nome.slice(0, 12), false) + '<b>' + U.esc(m.nome.split(' ')[0]) + '</b></div><div class="tiny muted">' + U.esc(m.nome.split(' ').slice(1).join(' ')) + ' · media ' + U.durataMedia(m.id) + "' · " + n + ' visite</div></div>';
    });
    for (var r = 0; r < rows; r++) {
      var min = START + r * SLOT;
      html += '<div class="agd-time" style="grid-row:' + (r + 2) + ';grid-column:1">' + fmtMin(min) + '</div>';
      medici.forEach(function (m, ci) {
        html += '<div class="agd-cell" style="grid-row:' + (r + 2) + ';grid-column:' + (ci + 2) + '" data-azione="agenda-nuovo" data-giorno="' + g + '" data-medico="' + m.id + '" data-ora="' + fmtMin(min) + '"></div>';
      });
    }
    if (proposta()) html += logisticaGriglia(g, medici);
    // blocchi esterni (contenitori con le visite dentro)
    bls.forEach(function (b) {
      var ci = medici.findIndex(function (m) { return m.id === b.medicoId; });
      if (ci < 0) return;
      var start = Math.max(START, toMin(b.oraInizio));
      var end = Math.min(END, toMin(b.oraFine));
      if (end <= START || start >= END) return;
      var startSlot = Math.floor((start - START) / SLOT);
      var span = Math.max(1, Math.ceil((end - start) / SLOT));
      var children = eventiGiorno(g).filter(function (e) { return e.bloccoId === b.id; }).sort(function (a, c) { return a.ora.localeCompare(c.ora); });
      var d = U.getDitta(b.dittaId);
      html += '<div class="agd-block ' + (b.conflitto ? 'conflict' : '') + (b.modalita === 'sede' ? ' studio' : '') + '" style="' + posizione(start, end) + ';grid-column:' + (ci + 2) + '" data-blocco="' + b.id + '"><div class="agd-block-head" data-azione="apri-blocco" data-id="' + b.id + '"><b>' + (b.gruppo ? UI.ic('users') + ' ' : '') + U.esc(d.ragione) + '</b><span>' + U.esc(b.oraInizio) + '–' + U.esc(b.oraFine) + ' · ' + (b.gruppo ? (end - start < 45 ? children.map(function (e) { return U.esc(e.titolo); }).join(', ') : children.length + ' lavoratori, ordine libero') + (b.modalita === 'sede' ? ' · in studio' : '') : children.length + '/' + b.capienza + ' · ' + b.durata + "'") + '</span></div>' +
        (b.gruppo && end - start < 45 ? '' : children.length ? children.map(function (e) {
          return '<div class="agd-block-evt" draggable="true" data-evento="' + e.id + '" data-azione="apri-evento" data-id="' + e.id + '"><b>' + (b.gruppo ? '·' : e.ora) + '</b><span>' + U.esc(e.titolo) + '</span><i>' + dur(e) + "'</i></div>";
        }).join('') : '<div class="agd-block-empty">Trascina qui le visite</div>') +
        (children.length && children.length < b.capienza ? '<div class="agd-block-empty">+' + (b.capienza - children.length) + ' posti liberi</div>' : '') + '</div>';
    });
    // visite e altri eventi (le visite nei blocchi sono già dentro il blocco)
    var visibili = evs.filter(function (e) { return !e.bloccoId; });
    var usati = {}, gruppi = [];
    visibili.forEach(function (e) {
      if (usati[e.id]) return;
      var gruppo = visibili.filter(function (o) {
        return o.medicoId === e.medicoId && o.data === e.data && toMin(o.ora) < eventEnd(e) && toMin(e.ora) < eventEnd(o);
      });
      if (gruppo.length > 1) {
        gruppo.sort(function (a, b) { return toMin(a.ora) - toMin(b.ora) || a.id.localeCompare(b.id); });
        gruppo.forEach(function (o) { usati[o.id] = true; });
        gruppi.push({ evento: gruppo[0], gruppo: gruppo });
      }
    });
    gruppi.forEach(function (g) {
      var ci = medici.findIndex(function (m) { return m.id === g.evento.medicoId; });
      if (ci < 0) return;
      var start = Math.max(START, Math.min.apply(null, g.gruppo.map(function (e) { return toMin(e.ora); })));
      var end = Math.min(END, Math.max.apply(null, g.gruppo.map(eventEnd)));
      if (end <= START || start >= END) return;
      var startSlot = Math.floor((start - START) / SLOT);
      var span = Math.max(1, Math.ceil((end - start) / SLOT));
      html += '<div class="agd-conflict-group" style="' + posizione(start, end) + ';grid-column:' + (ci + 2) + '"><div class="h">' + UI.ic('alert') + ' ' + g.gruppo.length + ' conflitti</div>' +
        g.gruppo.map(function (e) { return '<div class="r" draggable="true" data-evento="' + e.id + '" data-azione="apri-evento" data-id="' + e.id + '"><b>' + e.ora + '</b> ' + U.esc(e.titolo) + '</div>'; }).join('') + '</div>';
    });
    evs.forEach(function (e) {
      if (e.bloccoId || usati[e.id]) return;
      var ci = medici.findIndex(function (m) { return m.id === e.medicoId; });
      if (ci < 0) return;
      var start = Math.max(START, toMin(e.ora));
      var end = Math.min(END, eventEnd(e));
      if (end <= START || start >= END) return;
      var startSlot = Math.floor((start - START) / SLOT);
      var span = Math.max(1, Math.ceil((end - start) / SLOT));
      var cls = e.tipo === 'sopralluogo' ? 'sopralluogo' : e.tipo === 'esame' ? 'esame' : (e.modalita === 'esterna' ? 'esterna' : 'sede');
      html += '<button type="button" class="agd-evt ' + cls + (e.conflitto || (proposta() && ((e.viaggio && !e.viaggio.ok) || e.fuoriDisp)) ? ' conflict' : '') + '" draggable="true" data-evento="' + e.id + '" data-azione="apri-evento" data-id="' + e.id + '" style="' + posizione(start, end) + ';grid-column:' + (ci + 2) + '" title="' + U.esc(e.titolo + ' · ' + e.ora + '–' + fmtMin(eventEnd(e))) + '">' +
        '<b>' + U.esc(e.titolo) + '</b><span>' + U.esc(e.sottotitolo) + '</span>' +
        '<i>' + e.ora + ' · ' + (e.modalita === 'esterna' ? 'Esterno' : U.esc(e.sala || 'Sede')) + ' · ' + dur(e) + "'</i></button>";
    });
    return html + '</div>';
  }

  function listEvent(e) {
    var cls = e.tipo === 'sopralluogo' ? 'sopralluogo' : e.tipo === 'esame' ? 'esame' : (e.modalita === 'esterna' ? 'esterna' : 'sede');
    return '<button type="button" class="agenda-li ' + cls + (e.conflitto ? ' conflict' : '') + '" data-azione="apri-evento" data-id="' + e.id + '">' +
      '<span class="li-time">' + e.ora + '<i>' + fmtMin(eventEnd(e)) + '</i></span>' +
      '<span class="li-main"><b>' + U.esc(e.titolo) + '</b><span>' + U.esc(e.sottotitolo) + '</span></span>' +
      '<span class="li-doc">' + U.esc(U.nomeMedico(e.medicoId)) + '</span>' +
      '<span class="li-meta">' + (e.modalita === 'esterna' ? 'Esterno' : U.esc(e.sala || 'Sede')) + ' · ' + dur(e) + "'</span></button>";
  }
  function listBlock(b) {
    var d = U.getDitta(b.dittaId);
    var children = DB.eventi.filter(function (e) { return e.bloccoId === b.id; }).sort(function (a, c) { return a.ora.localeCompare(c.ora); });
    return '<div class="agenda-li-block' + (b.conflitto ? ' conflict' : '') + '">' +
      '<button type="button" class="agenda-li-head" data-azione="apri-blocco" data-id="' + b.id + '">' +
      '<span class="li-time">' + b.oraInizio + '<i>' + b.oraFine + '</i></span>' +
      '<span class="li-main"><b>' + U.esc(d.ragione) + '</b><span>' + (b.gruppo ? 'Appuntamento di gruppo · ' + (b.modalita === 'sede' ? 'in studio' : 'presso il cliente') + ' · ordine libero' : 'Blocco esterno') + '</span></span>' +
      '<span class="li-doc">' + U.esc(U.nomeMedico(b.medicoId)) + '</span>' +
      '<span class="li-meta">' + children.length + '/' + b.capienza + ' · ' + b.durata + "'</span></button>" +
      (children.length ? '<div class="agenda-li-children">' + children.map(listEvent).join('') + '</div>' : '<div class="agenda-li-empty">Nessuna visita assegnata</div>') + '</div>';
  }
  function listHtml(g, filtro, medicoId) {
    var evs = eventiGiorno(g).filter(filtroEvento).filter(function (e) { return !medicoId || e.medicoId === medicoId; });
    var bls = (filtro === 'sede' ? [] : blocchiGiorno(g)).filter(function (b) { return !medicoId || b.medicoId === medicoId; });
    var items = [];
    evs.filter(function (e) { return !e.bloccoId; }).forEach(function (e) { items.push({ t: toMin(e.ora), h: listEvent(e) }); });
    bls.forEach(function (b) { items.push({ t: toMin(b.oraInizio), h: listBlock(b) }); });
    items.sort(function (a, b) { return a.t - b.t; });
    if (!items.length) return '<div class="agenda-empty">' + UI.ic('calendar') + ' Nessuna attività con i filtri selezionati.</div>';
    return '<div class="agenda-list">' + items.map(function (i) { return i.h; }).join('') + '</div>';
  }

  function sidePending() {
    var daPian = DB.daPianificare.filter(function (p) { return U.puoLav({ id: p.lavoratoreId }); });
    var items = daPian.map(function (p) {
      var l = U.getLav(p.lavoratoreId);
      return '<div class="pending" draggable="true" data-evento="p:' + l.id + '" data-azione="agenda-nuovo" data-lav="' + l.id + '" title="Trascina su un medico o su un blocco esterno"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(U.nomeDitta(l.dittaId)) + '</span><span class="chip ' + (p.urgenza === 'alta' ? 'err' : 'warn') + '" style="margin-top:3px">' + U.esc(p.motivo) + '</span></div>';
    }).join('');
    return '<div class="side-card"><div class="card-head"><h2>' + UI.ic('clock') + ' Da pianificare</h2><span class="sub">' + daPian.length + '</span></div><div class="unsched">' + (items || '<div class="pad-sm small muted">Tutte le visite sono pianificate.</div>') + '</div><div class="card-foot">Trascina su un medico o su un blocco esterno.</div></div>';
  }

  function sideMedici() {
    var rows = U.mediciVisibili().map(function (m) {
      return [U.esc(m.nome.split(' ')[0] + ' ' + (m.nome.split(' ')[1] || '')), '<span class="mono">' + U.durataMedia(m.id) + "'</span>", String(DB.visite.filter(function (v) { return v.stato === 'eseguita' && v.medicoId === m.id; }).length)];
    });
    return '<div class="side-card"><div class="card-head"><h2>' + UI.ic('activity') + ' Tempi medi</h2><span class="sub">storico</span></div><div class="card-body tight" style="padding:0">' +
      UI.tableMini([['Medico', ''], ['Media', 'num'], ['Visite', 'num']], rows.map(function (r) { return { celle: r }; })) +
      '</div><div class="card-foot">Durata media delle visite concluse. In futuro guiderà durate e slot proposti.</div></div>';
  }

  function sideConflitti(g) {
    var ev = U.eventiVisibili().filter(function (e) { return e.conflitto && e.data === g; });
    var bl = U.blocchiVisibili().filter(function (b) { return b.conflitto && b.data === g; });
    var items = ev.slice(0, 5).map(function (e) { return '<div class="it"><span class="dot err"></span><div class="t"><b>' + U.esc(e.titolo) + '</b><small>' + U.fmtData(e.data) + ' ' + e.ora + ' · ' + U.esc(U.nomeMedico(e.medicoId)) + '</small></div><button type="button" class="btn btn-xs" data-azione="apri-evento" data-id="' + e.id + '">Apri</button></div>'; }).join('');
    var blocks = bl.slice(0, 3).map(function (b) { return '<div class="it"><span class="dot err"></span><div class="t"><b>Blocco ' + U.esc(U.nomeDitta(b.dittaId)) + '</b><small>' + U.esc(b.oraInizio) + '–' + U.esc(b.oraFine) + ' · conflitto medico</small></div><button type="button" class="btn btn-xs" data-azione="apri-blocco" data-id="' + b.id + '">Apri</button></div>'; }).join('');
    return '<div class="side-card"><div class="card-head"><h2>' + UI.ic('alert') + ' Conflitti</h2><span class="sub">' + (ev.length + bl.length) + '</span></div>' + (items || blocks ? '<div class="mini-list">' + items + blocks + '</div>' : '<div class="pad-sm small muted">Nessun conflitto.</div>') + '<div class="card-foot">Sovrapposizione di orari per lo stesso medico.</div></div>';
  }

  /* ---------- proposta: disponibilità, viaggi, settimana, posti liberi ---------- */
  function proposta() { return !!(window.PROPOSTA && window.PROPOSTA.attiva()); }
  function soloAttivi() { return STATE.agendaSoloAttivi === undefined ? proposta() : STATE.agendaSoloAttivi; }
  function oreMin(m) { var h = Math.floor(m / 60), r = m % 60; return h + 'h' + (r ? ' ' + U.pad(r) : ''); }
  function weekend(g) { var d = U.asDate(g).getDay(); return d === 0 || d === 6; }
  function nomeLuogo(l) { return l === 'CLS' ? 'studio' : U.nomeDitta(l); }

  // primi orari in cui un'attività di `durata` minuti nel luogo `luogo` entra nella disponibilità del medico,
  // senza sovrapposizioni e lasciando il tempo di viaggio da e verso le attività vicine
  function slotLiberi(medicoId, g, durata, luogo, max) {
    var ps = U.presenze(medicoId, g), out = [];
    U.disponibilita(medicoId, g).forEach(function (f) {
      for (var s = Math.ceil(f[0] / SLOT) * SLOT; s + durata <= f[1] && out.length < (max || 3); s += SLOT) {
        var fine = s + durata, prec = null, succ = null, libero = true;
        ps.forEach(function (p) {
          if (s < p.a && p.da < fine) libero = false;
          if (p.a <= s && (!prec || p.a > prec.a)) prec = p;
          if (p.da >= fine && (!succ || p.da < succ.da)) succ = p;
        });
        if (!libero) continue;
        if (prec && s - prec.a < U.viaggio(prec.luogo, luogo)) continue;
        if (succ && succ.da - fine < U.viaggio(luogo, succ.luogo)) continue;
        out.push(s);
      }
    });
    return out;
  }
  function occupazione(medicoId, g) {
    var ps = U.presenze(medicoId, g), min = 0, viaggi = 0;
    ps.forEach(function (p) { min += p.a - p.da; if (p.rif.viaggio) viaggi += p.rif.viaggio.minuti; });
    return { min: min, viaggi: viaggi, disp: U.minutiDisponibili(medicoId, g), n: ps.length };
  }

  // una visita in agenda: usata da nuovo appuntamento, drag & drop e pianificazione guidata
  function creaVisita(l, medicoId, data, ora, durata, modalita, sala, tipo, bloccoId) {
    var d = U.getDitta(l.dittaId);
    var v = {
      id: 'v' + Date.now() + Math.floor(Math.random() * 1000), stato: 'programmata', lavoratoreId: l.id, dittaId: l.dittaId, medicoId: medicoId,
      mansioneId: l.mansioneId, data: data, ora: ora, tipo: tipo || 'Visita periodica', giudizio: '', successiva: 0,
      sede: modalita === 'esterna' ? d.ragione + ' — ' + d.indirizzo + ', ' + d.citta : 'CLS — sede di Brescia',
      modalita: modalita, sala: modalita === 'esterna' ? '' : (sala || 'Sala 1'), bloccoId: bloccoId || '',
      durata: durata, note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', clinica: null
    };
    DB.visite.push(v);
    DB.eventi.push({ id: 'ev' + v.id, tipo: 'visita', rifId: v.id, titolo: U.nomeLav(l), sottotitolo: v.tipo + ' · ' + U.getMansione(l.mansioneId).nome, data: data, ora: ora, medicoId: medicoId, dittaId: l.dittaId, lavoratoreId: l.id, durata: durata, modalita: modalita, sala: v.sala, bloccoId: v.bloccoId });
    DB.daPianificare = DB.daPianificare.filter(function (p) { return p.lavoratoreId !== l.id; });
    DB.scadenze.filter(function (s) { return s.lavoratoreId === l.id && s.tipo === 'Visita'; }).forEach(function (s) { s.fissata = true; s.data = data; s.note = 'Appuntamento fissato in agenda'; });
    return v;
  }
  function avvisiLogistica(rifId) {
    var e = DB.eventi.filter(function (x) { return x.rifId === rifId || x.id === rifId; })[0];
    if (!e) return '';
    if (e.conflitto) return 'il medico ha già un’attività sovrapposta';
    if (e.viaggio && !e.viaggio.ok) return 'mancano ' + (e.viaggio.minuti - e.viaggio.margine) + ' minuti per il viaggio da ' + nomeLuogo(e.viaggio.da);
    if (e.fuoriDisp) return 'è fuori dalla disponibilità del medico';
    return '';
  }
  window.AGENDA = { slotLiberi: slotLiberi, occupazione: occupazione, creaVisita: creaVisita, fmtMin: fmtMin, oreMin: oreMin, avvisi: avvisiLogistica };

  function settimanaHtml(giorni, medici) {
    var righe = medici.map(function (m) {
      var celle = giorni.map(function (g) {
        var o = occupazione(m.id, g);
        var ev = eventiGiorno(g).filter(function (e) { return e.medicoId === m.id; });
        var bl = blocchiGiorno(g).filter(function (b) { return b.medicoId === m.id; });
        var prob = ev.concat(bl).filter(function (x) { return x.conflitto || (x.viaggio && !x.viaggio.ok) || x.fuoriDisp; }).length;
        var est = U.presenze(m.id, g).filter(function (p) { return p.luogo !== 'CLS'; }).map(function (p) { return U.getDitta(p.luogo).citta; });
        return { g: g, o: o, ev: ev, bl: bl, prob: prob, est: est.filter(function (x, i) { return est.indexOf(x) === i; }) };
      });
      var disp = celle.reduce(function (s, c) { return s + c.o.disp; }, 0);
      var occ = celle.reduce(function (s, c) { return s + c.o.min + c.o.viaggi; }, 0);
      return { m: m, celle: celle, disp: disp, occ: occ };
    });
    if (soloAttivi()) righe = righe.filter(function (r) { return r.disp || r.occ; });
    if (!righe.length) return '<div class="agenda-empty">' + UI.ic('calendar') + ' Nessun medico disponibile in questa settimana.</div>';
    var daRiempire = righe.reduce(function (s, r) {
      return s + r.celle.filter(function (c) { return c.g > OGGI_ISO; }).reduce(function (t, c) { return t + Math.max(0, c.o.disp - c.o.min - c.o.viaggi); }, 0);
    }, 0);
    var head = '<tr><th>Medico</th>' + giorni.map(function (g) {
      var d = U.asDate(g);
      return '<th class="' + (g === OGGI_ISO ? 'oggi' : '') + '">' + U.GIORNI[d.getDay()].slice(0, 3) + ' ' + d.getDate() + '</th>';
    }).join('') + '<th class="num">Saturazione</th></tr>';
    var body = righe.map(function (r) {
      var sat = r.disp ? Math.round(r.occ * 100 / r.disp) : 0;
      return '<tr><td><b>' + U.esc(r.m.nome) + '</b><div class="tiny muted">' + U.esc(r.m.regime || '') + ' · media ' + U.durataMedia(r.m.id) + "'</div><div class=\"tiny muted\">" + U.esc(U.testoDisponibilita(r.m.id)) + '</div></td>' + r.celle.map(function (c) {
        var cls = (weekend(c.g) ? 'we ' : '') + (c.g === OGGI_ISO ? 'oggi' : '');
        var att = '" data-azione="agenda-cella" data-giorno="' + c.g + '" data-medico="' + r.m.id + '"';
        if (!c.o.disp && !c.o.n) return '<td class="' + cls + '"><span class="wk-cella off">' + (weekend(c.g) ? '' : 'non disponibile') + '</span></td>';
        var pct = c.o.disp ? Math.round((c.o.min + c.o.viaggi) * 100 / c.o.disp) : 100;
        var tone = c.prob ? 'err' : pct > 90 ? 'ok' : pct > 50 ? '' : 'warn';
        if (!c.o.n) return '<td class="' + cls + '"><button type="button" class="wk-cella libero' + att + ' title="Disponibile ' + oreMin(c.o.disp) + '">libero · ' + oreMin(c.o.disp) + '</button></td>';
        return '<td class="' + cls + '"><button type="button" class="wk-cella' + att + ' title="' + oreMin(c.o.min) + ' di attività + ' + oreMin(c.o.viaggi) + ' di viaggio su ' + oreMin(c.o.disp) + ' disponibili">' +
          '<span class="wk-n">' + c.ev.length + (c.prob ? ' <span class="chip err">' + c.prob + ' da sistemare</span>' : '') + '</span>' +
          (c.est.length ? '<span class="tiny" style="color:var(--info)">' + UI.ic('pin') + ' ' + U.esc(c.est.join(', ')) + '</span>' : '') +
          '<span class="pro-track ' + tone + '"><b style="width:' + Math.min(100, pct) + '%"></b></span><span class="tiny muted">' + pct + '% di ' + oreMin(c.o.disp) + (c.o.viaggi ? ' · ' + oreMin(c.o.viaggi) + ' viaggio' : '') + '</span></button></td>';
      }).join('') + '<td class="num"><b class="mono">' + sat + '%</b><div class="tiny muted">' + oreMin(r.occ) + ' / ' + oreMin(r.disp) + '</div></td></tr>';
    }).join('');
    return '<div class="wk"><div class="note info" style="margin:10px 12px">' + UI.ic('spark') + ' Ore ancora libere da qui a fine settimana: <b>' + oreMin(daRiempire) + '</b>. Le celle gialle sono giornate poco piene: conviene riempirle dalla <a href="#/pianifica">Pianificazione guidata</a>.</div>' +
      '<table class="table-mini wk-table"><thead>' + head + '</thead><tbody>' + body + '</tbody></table>' +
      '<div class="agenda-hint">Saturazione = attività + viaggi rispetto alle ore di disponibilità del medico. In blu le città dei clienti visitati. Clic su una cella per aprire la giornata.</div></div>';
  }

  function sideLiberi(g, medicoScelto) {
    var corpo;
    if (g < OGGI_ISO) corpo = '<div class="pad-sm small muted">Giorno passato.</div>';
    else {
      var righe = U.mediciVisibili().filter(function (m) { return !medicoScelto || m.id === medicoScelto; }).map(function (m) {
        var o = occupazione(m.id, g);
        return { m: m, slot: slotLiberi(m.id, g, U.durataMedia(m.id), 'CLS', 3), libero: Math.max(0, o.disp - o.min - o.viaggi) };
      }).filter(function (r) { return r.slot.length; }).sort(function (a, b) { return b.libero - a.libero; }).slice(0, 5);
      corpo = righe.length ? '<div class="mini-list">' + righe.map(function (r) {
        return '<div class="it"><div class="t"><b>' + U.esc(r.m.nome.split(' ')[0]) + ' <span class="muted" style="font-weight:400">' + U.esc(r.m.nome.split(' ').slice(1).join(' ')) + '</span></b><small>' + oreMin(r.libero) + ' liberi · ' + U.esc(U.testoDisponibilita(r.m.id)) + '</small>' +
          '<div class="row wrap" style="gap:4px;margin-top:5px">' + r.slot.map(function (s) {
            return '<button type="button" class="btn btn-xs" data-azione="agenda-nuovo" data-giorno="' + g + '" data-medico="' + r.m.id + '" data-ora="' + fmtMin(s) + '">' + fmtMin(s) + '</button>';
          }).join('') + '</div></div></div>';
      }).join('') + '</div>' : '<div class="pad-sm small muted">Nessun medico disponibile con posti liberi.</div>';
    }
    return '<div class="side-card"><div class="card-head"><h2>' + UI.ic('plus') + ' Posti liberi in studio</h2><span class="sub">' + U.fmtBreve(g) + '</span></div>' + corpo + '<div class="card-foot">Dentro la disponibilità del medico, con il tempo di rientro se è da un cliente. <a href="#/pianifica">Pianificazione guidata →</a></div></div>';
  }

  // strisce di viaggio e ore non disponibili nella griglia del giorno
  function logisticaGriglia(g, medici) {
    var html = '';
    medici.forEach(function (m, ci) {
      for (var r = 0; r < (END - START) / SLOT; r++) {
        var t = START + r * SLOT;
        if (!U.dentroDisponibilita(m.id, g, t, t + SLOT)) html += '<div class="agd-off" style="grid-row:' + (r + 2) + ';grid-column:' + (ci + 2) + '" aria-hidden="true"></div>';
      }
      U.presenze(m.id, g).forEach(function (p) {
        var v = p.rif.viaggio;
        if (!v) return;
        // si parte il più tardi possibile ma mai prima della fine dell'attività precedente; se il tempo non basta la striscia copre tutto il margine ed è rossa
        var da = Math.max(START, p.da - Math.min(v.minuti, Math.max(0, v.margine)));
        if (da >= p.da) return;
        html += '<div class="agd-viaggio' + (v.ok ? '' : ' ko') + '" style="' + posizione(da, p.da) + ';grid-column:' + (ci + 2) + '" title="Viaggio ' + nomeLuogo(v.da) + ' → ' + nomeLuogo(v.a) + ': ' + v.minuti + ' min, disponibili ' + Math.max(0, v.margine) + '">' +
          UI.ic('pin') + ' ' + v.minuti + "' " + nomeLuogo(v.da) + ' → ' + nomeLuogo(v.a) + (v.ok ? '' : ' · mancano ' + (v.minuti - Math.max(0, v.margine)) + "'") + '</div>';
      });
    });
    return html;
  }

  VISTE.agenda = function () {
    U.ricalcolaConflitti();
    var pro = proposta();
    var giorni = U.settimana(STATE.agendaOffset || 0);
    var selected = selectedDay(giorni);
    var filtro = STATE.agendaFiltro || 'tutti';
    var vista = STATE.agendaVista || (pro ? 'settimana' : 'griglia');
    var medicoScelto = STATE.agendaMedico || '';
    if (medicoScelto && !U.mediciVisibili().some(function (m) { return m.id === medicoScelto; })) { medicoScelto = ''; STATE.agendaMedico = ''; }
    var evs = eventiGiorno(selected);
    var blocchi = blocchiGiorno(selected);
    var tutti = mediciGiorno(selected);
    var attivi = tutti.filter(function (x) { return x.eventi.length || x.blocchi.length; });
    var scelti = tutti.filter(function (x) {
      if (medicoScelto && x.medico.id !== medicoScelto) return false;
      if (soloAttivi() && !medicoScelto && !x.eventi.length && !x.blocchi.length) return false;
      return true;
    });
    var medici = scelti.map(function (x) { return x.medico; });
    var filt = '<div class="seg seg-sm"><button type="button" data-azione="agenda-filtro" data-filtro="tutti" aria-pressed="' + (filtro === 'tutti' ? 'true' : 'false') + '">Tutti</button><button type="button" data-azione="agenda-filtro" data-filtro="sede" aria-pressed="' + (filtro === 'sede' ? 'true' : 'false') + '">In sede</button><button type="button" data-azione="agenda-filtro" data-filtro="esterni" aria-pressed="' + (filtro === 'esterni' ? 'true' : 'false') + '">Esterni</button></div>';
    var opzioniMedici = '<option value="">Tutti i medici (' + U.mediciVisibili().length + ')</option>' + U.mediciVisibili().map(function (m) {
      return '<option value="' + m.id + '"' + (m.id === medicoScelto ? ' selected' : '') + '>Dott. ' + U.esc(m.nome) + '</option>';
    }).join('');
    var tools = '<div class="agenda-tools">' +
      '<div class="seg seg-sm"><button type="button" data-azione="agenda-vista" data-vista="griglia" aria-pressed="' + (vista === 'griglia' ? 'true' : 'false') + '">Griglia</button><button type="button" data-azione="agenda-vista" data-vista="lista" aria-pressed="' + (vista === 'lista' ? 'true' : 'false') + '">Lista</button>' + (pro ? '<button type="button" data-azione="agenda-vista" data-vista="settimana" aria-pressed="' + (vista === 'settimana') + '">Settimana</button>' : '') + '</div>' +
      (U.mediciVisibili().length > 1 ? '<select data-azione="agenda-medico" aria-label="Filtra per medico" style="max-width:230px">' + opzioniMedici + '</select>' : '') +
      '<button type="button" class="btn btn-sm" data-azione="agenda-solo-attivi" aria-pressed="' + (soloAttivi() ? 'true' : 'false') + '">' + UI.ic('filter') + ' Solo con attività</button>' +
      '<span class="right small muted">' + medici.length + ' medici · ' + attivi.length + ' con attività</span></div>' +
      (!pro && vista === 'griglia' && medici.length > 6 ? '<div class="agenda-hint">Con molti medici conviene la vista <b>Lista</b> o il filtro “Solo con attività”.</div>' : '');
    var legenda = '<div class="agenda-legend"><span><i style="background:var(--accent)"></i>In sede</span><span><i style="background:var(--info)"></i>Esterno</span><span><i style="background:var(--violet)"></i>Sopralluogo</span><span><i style="background:#9cc3ef"></i>Blocco esterno</span><span><i style="background:var(--danger)"></i>Conflitto</span></div>';
    var settimana = vista === 'settimana';
    var contenuto = settimana
      ? settimanaHtml(giorni, U.mediciVisibili().filter(function (m) { return !medicoScelto || m.id === medicoScelto; }))
      : vista === 'lista'
      ? listHtml(selected, filtro, medicoScelto)
      : (medici.length ? gridHtml(selected, filtro, medici) : '<div class="agenda-empty">' + UI.ic('users') + ' Nessun medico con i filtri selezionati.</div>');
    var corpo = '<div class="agenda-wrap"><div class="card agenda-main">' +
      '<div class="card-head"><h2>' + UI.ic('calendar') + ' ' + (settimana ? 'Settimana ' + U.fmtBreve(giorni[0]) + ' – ' + U.fmtBreve(giorni[6]) : U.fmtLunga(U.asDate(selected))) + '</h2><span class="sub">' + (settimana ? giorni.reduce(function (s, g) { return s + eventiGiorno(g).length; }, 0) + ' attività in settimana' : evs.length + ' attività · ' + blocchi.length + ' blocchi esterni') + '</span>' + (settimana ? '' : '<div class="right row wrap">' + filt + '</div>') + '</div>' +
      tools +
      (settimana ? '' : dayStrip(giorni, selected)) +
      '<div class="agenda-scroll">' + contenuto + '</div>' + legenda + '</div>' +
      '<aside class="agenda-side">' + sidePending() + sideConflitti(selected) + (pro ? sideLiberi(selected, medicoScelto) : sideMedici()) + '</aside></div>';

    return {
      id: 'agenda', icona: 'calendar', titolo: 'Agenda', sotto: 'Sede, esterni, blocchi e tempi visita',
      fit: true,
      azioni: '<div class="seg seg-sm"><button type="button" data-azione="agenda-settimana" data-delta="-1" aria-label="Settimana precedente">' + UI.ic('left') + '</button><button type="button" data-azione="agenda-settimana" data-delta="0">Oggi</button><button type="button" data-azione="agenda-settimana" data-delta="1" aria-label="Settimana successiva">' + UI.ic('right') + '</button></div>' +
        '<button type="button" class="btn" data-azione="agenda-blocco">' + UI.ic('pin') + ' Blocco esterno</button>' +
        '<button type="button" class="btn btn-primary" data-azione="agenda-nuovo">' + UI.ic('plus') + ' Nuovo appuntamento</button>',
      corpo: corpo
    };
  };

  function optMedici(sel) { return U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; }); }
  function optLav(sel) { return [['', '- seleziona un lavoratore -']].concat(U.lavVisibili().slice().sort(function (a, b) { return U.nomeLav(a).localeCompare(U.nomeLav(b)); }).map(function (l) { return [l.id, U.nomeLav(l) + ' - ' + U.nomeDitta(l.dittaId)]; })); }
  function optOre(sel) {
    var out = [];
    for (var m = START; m < END; m += SLOT) out.push([fmtMin(m), fmtMin(m)]);
    return out;
  }

  AZIONI['agenda-giorno'] = function (el) { STATE.agendaGiorno = el.dataset.giorno; RENDER(); };
  AZIONI['agenda-settimana'] = function (el) {
    var d = Number(el.dataset.delta);
    if (d === 0) { STATE.agendaOffset = 0; STATE.agendaGiorno = OGGI_ISO; }
    else { STATE.agendaOffset = (STATE.agendaOffset || 0) + d; var g = U.settimana(STATE.agendaOffset); STATE.agendaGiorno = g.indexOf(OGGI_ISO) >= 0 ? OGGI_ISO : g[0]; }
    RENDER();
  };
  AZIONI['agenda-filtro'] = function (el) { STATE.agendaFiltro = el.dataset.filtro; RENDER(); };
  AZIONI['agenda-vista'] = function (el) { STATE.agendaVista = el.dataset.vista; RENDER(); };
  AZIONI['agenda-medico'] = function (el) { STATE.agendaMedico = el.value; RENDER(); };
  AZIONI['agenda-solo-attivi'] = function () { STATE.agendaSoloAttivi = !soloAttivi(); RENDER(); };
  AZIONI['agenda-cella'] = function (el) { STATE.agendaGiorno = el.dataset.giorno; STATE.agendaMedico = el.dataset.medico; STATE.agendaVista = 'griglia'; RENDER(); };

  AZIONI['agenda-nuovo'] = function (el) {
    var lavId = el.dataset.lav || '';
    var lav = lavId ? U.getLav(lavId) : null;
    var medicoId = el.dataset.medico || (lav && lav.id ? U.getDitta(lav.dittaId).medicoId : U.mediciVisibili()[0].id);
    var giorno = el.dataset.giorno || selectedDay(U.settimana(STATE.agendaOffset || 0));
    var ora = el.dataset.ora || '09:00';
    var media = U.durataMedia(medicoId);
    var dl = lav && lav.id ? U.getDitta(lav.dittaId) : null;
    var pref = dl && dl.modalitaVisite === 'loco' ? 'esterna' : 'sede';
    var notaCliente = dl ? '<div class="note ' + (dl.locoObbligatoria ? 'warn' : 'info') + '">' + UI.ic('building') + ' <b>' + U.esc(dl.ragione) + '</b>: ' +
      (dl.modalitaVisite === 'loco' ? 'visite presso il cliente' + (dl.locoObbligatoria ? ' (obbligatorio)' : ' (preferenza)') : dl.modalitaVisite === 'sede' ? 'visite in studio' : 'nessuna preferenza sul luogo') +
      ' · ' + U.esc(U.zona(dl.id)) + (dl.notePianificazione ? ' · ' + U.esc(dl.notePianificazione) : '') + '</div>' : '';
    UI.apriModale({
      titolo: 'Nuovo appuntamento', size: 'lg', sotto: 'Visita in sede o presso il cliente',
      corpo: '<form id="form-appuntamento" data-form="salva-appuntamento" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Modalità', name: 'modalita', type: 'select', value: pref, options: [['sede', 'In sede CLS'], ['esterna', 'Presso il cliente']] }) +
        UI.campo({ label: 'Medico', name: 'medicoId', type: 'select', value: medicoId, options: optMedici(medicoId), req: true }) +
        UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', value: lavId, options: optLav(lavId), req: true }) +
        UI.campo({ label: 'Tipo di visita', name: 'tipo', type: 'select', value: 'Visita periodica', options: window.TIPI_VISITA, req: true }) +
        UI.campo({ label: 'Data', name: 'data', type: 'date', value: giorno, req: true }) +
        UI.campo({ label: 'Ora inizio', name: 'ora', type: 'select', value: ora, options: optOre(ora), req: true }) +
        UI.campo({ label: 'Durata (minuti)', name: 'durata', type: 'number', value: media, req: true, help: 'Tempo medio del medico: ' + media + ' min' }) +
        UI.campo({ label: 'Sala (se in sede)', name: 'sala', type: 'select', value: 'Sala 1', options: ['Sala 1', 'Sala 2', 'Sala 3', 'Sala 4'] }) +
        UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', rows: 2, full: true }) +
        '</div>' + notaCliente + '<div class="note info">' + UI.ic('clock') + ' La durata precompilata è la media storica del medico. Puoi sovrascriverla: il dato alimenterà le proposte automatiche future.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-appuntamento">' + UI.ic('calendar') + ' Pianifica</button>'
    });
  };

  AZIONI['salva-appuntamento'] = function (form) {
    var fd = new FormData(form);
    var l = U.getLav(fd.get('lavoratoreId'));
    if (!l.id || !U.puoLav(l)) { UI.toast('Seleziona un lavoratore valido.', 'err'); return; }
    var med = U.getMedico(fd.get('medicoId'));
    var durata = Math.max(5, Number(fd.get('durata')) || U.durataMedia(med.id));
    var data = fd.get('data'), ora = fd.get('ora');
    var v = creaVisita(l, med.id, data, ora, durata, fd.get('modalita'), fd.get('sala'), fd.get('tipo'));
    v.note = fd.get('note');
    U.ricalcolaConflitti();
    UI.chiudiModale();
    STATE.agendaGiorno = data;
    STATE.agendaOffset = offsetDi(data);
    if (STATE.agendaVista === 'settimana') STATE.agendaVista = 'griglia';
    RENDER();
    var avviso = avvisiLogistica(v.id);
    if (avviso) UI.toast('Appuntamento creato, ma ' + avviso + '.', 'err');
    else UI.toast('Appuntamento per ' + U.nomeLav(l) + ' il ' + U.fmtData(data) + ' alle ' + ora + ' (' + durata + ' min).', 'ok');
  };

  AZIONI['agenda-blocco'] = function () {
    var giorno = selectedDay(U.settimana(STATE.agendaOffset || 0));
    var med = U.mediciVisibili()[0];
    UI.apriModale({
      titolo: 'Nuovo blocco esterno', size: 'lg', sotto: 'Il medico va dal cliente e visita più lavoratori',
      corpo: '<form id="form-blocco" data-form="salva-blocco" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Medico', name: 'medicoId', type: 'select', value: med.id, options: optMedici(med.id), req: true }) +
        UI.campo({ label: 'Azienda / sede', name: 'dittaId', type: 'select', options: U.ditteVisibili().filter(function (d) { return !d.cessazione; }).map(function (d) { return [d.id, d.ragione + ' - ' + d.citta]; }), req: true }) +
        UI.campo({ label: 'Data', name: 'data', type: 'date', value: giorno, req: true }) +
        UI.campo({ label: 'Inizio', name: 'oraInizio', type: 'select', value: '09:00', options: optOre('09:00'), req: true }) +
        UI.campo({ label: 'Numero visite', name: 'capienza', type: 'number', value: 6, req: true, help: 'Quante visite deve fare il medico in questa trasferta.' }) +
        UI.campo({ label: 'Durata per visita (minuti)', name: 'durata', type: 'number', value: 30, req: true }) +
        UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', rows: 2, full: true }) +
        '</div><div class="note info">' + UI.ic('pin') + ' Il blocco riserva il tempo del medico. Poi trascina i lavoratori da “Da pianificare” dentro il blocco: il sistema assegna gli slot in sequenza.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-blocco">' + UI.ic('pin') + ' Crea blocco</button>'
    });
  };

  AZIONI['salva-blocco'] = function (form) {
    var fd = new FormData(form);
    var cap = Math.max(1, Number(fd.get('capienza')) || 1);
    var durata = Math.max(5, Number(fd.get('durata')) || 30);
    var inizio = toMin(fd.get('oraInizio'));
    var fine = inizio + cap * durata;
    if (fine > END) { UI.toast('Il blocco supera le 18:00. Riduci visite o durata.', 'err'); return; }
    DB.blocchi.push({ id: 'b' + Date.now(), medicoId: fd.get('medicoId'), dittaId: fd.get('dittaId'), data: fd.get('data'), oraInizio: fd.get('oraInizio'), oraFine: fmtMin(fine), durata: durata, capienza: cap, note: fd.get('note') });
    U.ricalcolaConflitti();
    UI.chiudiModale();
    STATE.agendaGiorno = fd.get('data');
    STATE.agendaOffset = offsetDi(fd.get('data'));
    RENDER();
    UI.toast('Blocco esterno creato: ' + cap + ' posti da ' + durata + ' minuti. Trascina i lavoratori dentro.', 'ok');
  };

  function nextSlot(b) {
    var children = DB.eventi.filter(function (e) { return e.bloccoId === b.id; });
    if (b.gruppo) {
      // gruppo: si allunga di una visita, l'ordine non conta
      b.capienza = children.length + 1;
      b.oraFine = fmtMin(toMin(b.oraInizio) + b.capienza * b.durata);
      return b.oraInizio;
    }
    if (children.length >= b.capienza) return null;
    var fine = toMin(b.oraInizio);
    children.forEach(function (e) { fine = Math.max(fine, toMin(e.ora) + dur(e)); });
    return fmtMin(fine);
  }
  function assignToBlock(b, id) {
    var d = U.getDitta(b.dittaId);
    var workerId = id.indexOf('p:') === 0 ? id.slice(2) : (DB.eventi.filter(function (e) { return e.id === id; })[0] || {}).lavoratoreId;
    var l = U.getLav(workerId);
    if (!l.id || !U.puoLav(l)) return false;
    if (!U.puoDitta(b.dittaId)) { UI.toast('Il blocco appartiene a un’azienda non a te assegnata.', 'err'); return false; }
    if (l.dittaId !== b.dittaId) { UI.toast('Il lavoratore non appartiene all’azienda del blocco.', 'err'); return false; }
    var ora = nextSlot(b);
    if (!ora) { UI.toast('Il blocco è pieno: aumenta il numero di visite o crea un altro blocco.', 'err'); return false; }
    var ev = DB.eventi.filter(function (e) { return e.id === id; })[0];
    if (ev) {
      var v = DB.visite.filter(function (x) { return x.id === ev.rifId; })[0];
      if (v) { v.bloccoId = b.id; v.data = b.data; v.ora = ora; v.medicoId = b.medicoId; v.durata = b.durata; v.modalita = b.modalita === 'sede' ? 'sede' : 'esterna'; v.sala = b.modalita === 'sede' ? 'Sala 1' : ''; v.sede = b.modalita === 'sede' ? 'CLS — sede di Brescia' : d.ragione + ' — ' + d.indirizzo + ', ' + d.citta; }
      ev.bloccoId = b.id; ev.data = b.data; ev.ora = ora; ev.medicoId = b.medicoId; ev.durata = b.durata; ev.modalita = b.modalita === 'sede' ? 'sede' : 'esterna'; ev.sala = b.modalita === 'sede' ? 'Sala 1' : ''; ev.dittaId = b.dittaId;
    } else {
      var v2 = { id: 'v' + Date.now(), stato: 'programmata', lavoratoreId: l.id, dittaId: b.dittaId, medicoId: b.medicoId, mansioneId: l.mansioneId, data: b.data, ora: ora, tipo: 'Visita periodica', giudizio: '', successiva: 0, sede: d.ragione + ' — ' + d.indirizzo + ', ' + d.citta, modalita: 'esterna', sala: '', bloccoId: b.id, durata: b.durata, note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', clinica: null };
      DB.visite.push(v2);
      DB.eventi.push({ id: 'ev' + Date.now(), tipo: 'visita', rifId: v2.id, titolo: U.nomeLav(l), sottotitolo: v2.tipo + ' · ' + U.getMansione(l.mansioneId).nome, data: b.data, ora: ora, medicoId: b.medicoId, dittaId: b.dittaId, lavoratoreId: l.id, durata: b.durata, modalita: 'esterna', sala: '', bloccoId: b.id });
    }
    DB.daPianificare = DB.daPianificare.filter(function (p) { return p.lavoratoreId !== l.id; });
    DB.scadenze.filter(function (s) { return s.lavoratoreId === l.id && s.tipo === 'Visita'; }).forEach(function (s) { s.fissata = true; s.data = b.data; s.note = 'Inserita nel blocco esterno del ' + U.fmtData(b.data); });
    return true;
  }

  AZIONI['sposta-evento'] = function (el) {
    var id = el.dataset.evento, giorno = el.dataset.giorno;
    var b = el.dataset.blocco ? DB.blocchi.filter(function (x) { return x.id === el.dataset.blocco; })[0] : null;
    if (b) {
      if (assignToBlock(b, id)) { U.ricalcolaConflitti(); RENDER(); UI.toast('Visita inserita nel blocco di ' + U.nomeDitta(b.dittaId) + '.', 'ok'); }
      return;
    }
    var ora = el.dataset.ora, medicoId = el.dataset.medico;
    if (!giorno || !ora || !medicoId) return;
    if (id.indexOf('p:') === 0) {
      var l = U.getLav(id.slice(2));
      if (!l.id) return;
      var d = U.getDitta(l.dittaId), durata = U.durataMedia(medicoId);
      var v = { id: 'v' + Date.now(), stato: 'programmata', lavoratoreId: l.id, dittaId: l.dittaId, medicoId: medicoId, mansioneId: l.mansioneId, data: giorno, ora: ora, tipo: 'Visita periodica', giudizio: '', successiva: 0, sede: 'CLS — sede di Brescia', modalita: 'sede', sala: 'Sala 1', bloccoId: '', durata: durata, note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', clinica: null };
      DB.visite.push(v);
      DB.eventi.push({ id: 'ev' + Date.now(), tipo: 'visita', rifId: v.id, titolo: U.nomeLav(l), sottotitolo: 'Visita periodica · ' + U.getMansione(l.mansioneId).nome, data: giorno, ora: ora, medicoId: medicoId, dittaId: l.dittaId, lavoratoreId: l.id, durata: durata, modalita: 'sede', sala: 'Sala 1', bloccoId: '' });
      DB.daPianificare = DB.daPianificare.filter(function (p) { return p.lavoratoreId !== l.id; });
      DB.scadenze.filter(function (s) { return s.lavoratoreId === l.id && s.tipo === 'Visita'; }).forEach(function (s) { s.fissata = true; s.data = giorno; s.note = 'Appuntamento fissato in agenda'; });
      U.ricalcolaConflitti(); RENDER();
      var e2 = DB.eventi.filter(function (x) { return x.rifId === v.id; })[0];
      if (e2 && e2.conflitto) UI.toast('Visita pianificata, ma c’è una sovrapposizione con un altro appuntamento del medico.', 'err');
      else UI.toast('Visita di ' + U.nomeLav(l) + ' pianificata per ' + U.fmtData(giorno) + ' alle ' + ora + '.', 'ok');
      return;
    }
    var e = DB.eventi.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    e.data = giorno; e.ora = ora; e.medicoId = medicoId; e.bloccoId = '';
    var vv = DB.visite.filter(function (x) { return x.id === e.rifId; })[0];
    if (vv) { vv.data = giorno; vv.ora = ora; vv.medicoId = medicoId; vv.bloccoId = ''; }
    var so = DB.sopralluoghi.filter(function (x) { return x.id === e.rifId; })[0];
    if (so) { so.data = giorno; so.ora = ora; so.medicoId = medicoId; }
    U.ricalcolaConflitti(); RENDER();
    if (e.conflitto) UI.toast('Spostato, ma il medico ha già un’attività sovrapposta.', 'err');
    else UI.toast('Appuntamento spostato.', 'ok');
  };

  AZIONI['apri-evento'] = function (el) {
    var id = el.dataset.id || el.dataset.evento;
    var e = DB.eventi.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    var l = e.lavoratoreId ? U.getLav(e.lavoratoreId) : null;
    var d = U.getDitta(e.dittaId);
    var b = e.bloccoId ? DB.blocchi.filter(function (x) { return x.id === e.bloccoId; })[0] : null;
    var avviso = e.conflitto ? '<div class="note warn"><strong>Conflitto:</strong> il medico ha un’altra attività sovrapposta.</div>' : '';
    if (e.viaggio) avviso += '<div class="note ' + (e.viaggio.ok ? 'info' : 'warn') + '">' + UI.ic('pin') + ' Viaggio da ' + nomeLuogo(e.viaggio.da) + ': <b>' + e.viaggio.minuti + ' minuti</b>, tempo disponibile ' + Math.max(0, e.viaggio.margine) + ' minuti' + (e.viaggio.ok ? '.' : ' — <b>non basta</b>.') + '</div>';
    if (e.fuoriDisp) avviso += '<div class="note warn">' + UI.ic('clock') + ' Fuori dalla disponibilità del medico (' + U.esc(U.testoDisponibilita(e.medicoId)) + ').</div>';
    var corpo = '<div class="row" style="margin-bottom:12px"><span class="chip ' + (e.modalita === 'esterna' ? 'info' : 'ok') + '">' + (e.modalita === 'esterna' ? 'Esterno' : 'In sede') + '</span>' + (b ? '<span class="chip violet">Blocco ' + U.esc(U.nomeDitta(b.dittaId)) + '</span>' : '') + '<span class="right mono">' + e.ora + '–' + fmtMin(eventEnd(e)) + '</span></div>' +
      UI.kv([['Lavoratore', l && l.id ? U.esc(U.nomeLav(l)) : '—'], ['Azienda / sede', U.esc(d.ragione || '—')], ['Medico', 'Dott. ' + U.esc(U.nomeMedico(e.medicoId))], ['Durata', dur(e) + ' minuti'], ['Modalità', e.modalita === 'esterna' ? 'Presso il cliente' : 'CLS — sede di Brescia'], ['Sala / luogo', e.modalita === 'esterna' ? U.esc(e.sede || d.citta) : U.esc(e.sala || 'Sala 1')], ['Tipo', U.esc(e.sottotitolo)]]) + avviso;
    UI.apriModale({
      titolo: U.esc(e.titolo), sotto: U.fmtLunga(U.asDate(e.data)) + ' · ' + e.ora, size: 'lg', corpo: corpo,
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><div class="right row"><a class="btn" href="#/lavoratori/' + (l ? l.id : '') + '" data-azione="chiudi-modale">' + UI.ic('user') + ' Cartella</a><a class="btn" href="#/ditte/' + d.id + '" data-azione="chiudi-modale">' + UI.ic('building') + ' Ditta</a></div>'
    });
  };

  AZIONI['apri-blocco'] = function (el) {
    var b = DB.blocchi.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!b) return;
    var d = U.getDitta(b.dittaId), med = U.getMedico(b.medicoId);
    var children = DB.eventi.filter(function (e) { return e.bloccoId === b.id; }).sort(function (a, c) { return a.ora.localeCompare(c.ora); });
    var corpo = '<div class="row" style="margin-bottom:12px">' + (b.gruppo ? '<span class="chip ' + (b.modalita === 'sede' ? 'ok' : 'info') + '">Appuntamento di gruppo · ' + (b.modalita === 'sede' ? 'in studio' : 'presso il cliente') + '</span>' : '<span class="chip info">Blocco esterno</span>') + '<span class="right mono">' + b.oraInizio + '–' + b.oraFine + '</span></div>' +
      (b.gruppo ? '<div class="note info mb">' + UI.ic('users') + ' I lavoratori vengono visitati nell’ordine in cui si presentano: l’orario vale per tutto il gruppo.</div>' : '') +
      UI.kv([['Azienda', U.esc(d.ragione)], ['Medico', 'Dott. ' + U.esc(med.nome)], ['Data', U.fmtLunga(U.asDate(b.data))], ['Durata per visita', b.durata + ' minuti'], ['Posti', children.length + ' / ' + b.capienza]]) +
      (children.length ? UI.tableMini([[b.gruppo ? '' : 'Ora', ''], ['Lavoratore', ''], ['Durata', 'num']], children.map(function (e) { return { celle: [b.gruppo ? '·' : e.ora, U.esc(e.titolo), dur(e) + "'"] }; })) : '<div class="note info mt">Blocco vuoto: trascina qui i lavoratori da “Da pianificare”.</div>') +
      (b.note ? '<div class="note mt">' + U.esc(b.note) + '</div>' : '');
    UI.apriModale({ titolo: 'Blocco · ' + U.esc(d.ragione), sotto: U.fmtLunga(U.asDate(b.data)), size: 'lg', corpo: corpo, piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button>' });
  };

})();
