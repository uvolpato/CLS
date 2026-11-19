/* =========================================================
   CLS · Pianificazione guidata
   Per ogni cliente con visite scadute o in scadenza propone le date migliori
   rispettando: luogo preferito/obbligatorio, disponibilità del medico competente,
   tempi di viaggio, giri in zona e saturazione delle giornate già avviate.
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI, AG = window.AGENDA;
  var OGGI_ISO = U.iso(window.OGGI);
  var GIORNI_ESAMINATI = 20; // giorni lavorativi in avanti

  function st() { return STATE.pianifica = STATE.pianifica || { ditta: '', esclusi: {}, filtro: 'ritardo', cache: [] }; }

  function aziende() {
    return DB.ditte.filter(function (d) { return !d.cessazione && U.puoDitta(d.id); }).map(function (d) {
      var per = {};
      DB.scadenze.forEach(function (s) {
        if (s.dittaId !== d.id || s.tipo !== 'Visita' || s.fissata || !s.lavoratoreId || U.giorniA(s.data) > 30) return;
        if (!per[s.lavoratoreId] || s.data < per[s.lavoratoreId].data) per[s.lavoratoreId] = s;
      });
      var items = Object.keys(per).map(function (k) { return per[k]; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
      var scad = items.filter(function (s) { return U.giorniA(s.data) < 0; }).length;
      return { d: d, items: items, scad: scad, ritardo: scad ? -U.giorniA(items[0].data) : 0 };
    }).filter(function (x) { return x.items.length; }).sort(function (a, b) { return b.scad - a.scad || b.ritardo - a.ritardo; });
  }

  function giorni() {
    var out = [], d = new Date(window.OGGI);
    while (out.length < GIORNI_ESAMINATI) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) out.push(U.iso(d));
    }
    return out;
  }

  // prova un blocco ipotetico senza lasciarlo in agenda
  function conBlocco(b, fn) { DB.blocchi.push(b); try { return fn(); } finally { DB.blocchi.pop(); } }

  function proposte(az, lavIds) {
    var d = az.d, n = lavIds.length, mc = d.medicoId, dur = U.durataMedia(mc);
    if (!n) return [];
    var modi = d.locoObbligatoria || d.modalitaVisite === 'loco' ? ['loco'] : d.modalitaVisite === 'sede' ? ['sede'] : n >= 4 ? ['loco', 'sede'] : ['sede', 'loco'];
    var compagni = d.modalitaVisite === 'sede' ? [] : aziende().filter(function (x) {
      return x.d.id !== d.id && x.d.medicoId === mc && x.d.prov === d.prov && x.d.modalitaVisite !== 'sede' && x.scad;
    });
    var out = [];
    giorni().forEach(function (g, idx) {
      if (!U.minutiDisponibili(mc, g)) return;
      var o = AG.occupazione(mc, g), ps = U.presenze(mc, g);
      modi.forEach(function (modo, mi) {
        var luogo = modo === 'loco' ? d.id : 'CLS', k, ora = null;
        for (k = n; k >= 1; k--) { var sl = AG.slotLiberi(mc, g, k * dur, luogo, 1); if (sl.length) { ora = sl[0]; break; } }
        if (ora === null) return;
        var p = { g: g, modo: modo, luogo: luogo, ora: ora, k: k, dur: dur, mc: mc, punti: 100 - idx * 3 - mi * 8, motivi: [], giro: null };
        if (k < n) { p.punti -= 30 * (n - k) / n; p.motivi.push(['warn', k + ' di ' + n + ' lavoratori, gli altri in un altro giorno']); }
        if (modo === 'loco') {
          var presso = ps.filter(function (x) { return x.luogo === d.id; })[0];
          var vicino = ps.filter(function (x) { return x.luogo !== 'CLS' && x.luogo !== d.id && U.provDi(x.luogo) === d.prov; })[0];
          if (presso) { p.punti += 40; p.motivi.push(['ok', 'Il medico è già dal cliente quel giorno']); }
          else if (vicino) { p.punti += 30; p.motivi.push(['ok', 'Stesso giro: è già a ' + U.getDitta(vicino.luogo).citta + ' per ' + U.nomeDitta(vicino.luogo)]); }
          p.motivi.push(['info', U.viaggio('CLS', d.id) + "' di viaggio dallo studio"]);
          // giro in zona: accoda un altro cliente vicino in ritardo, stesso medico
          compagni.some(function (c) {
            var fine = ora + k * dur, n2 = Math.min(c.scad, 6), ora2 = null, k2;
            conBlocco({ medicoId: mc, dittaId: d.id, data: g, oraInizio: AG.fmtMin(ora), oraFine: AG.fmtMin(fine) }, function () {
              for (k2 = n2; k2 >= 1; k2--) {
                var s2 = AG.slotLiberi(mc, g, k2 * dur, c.d.id, 1);
                if (s2.length && s2[0] >= fine) { ora2 = s2[0]; break; }
              }
            });
            if (ora2 === null) return false;
            var p2 = JSON.parse(JSON.stringify(p));
            p2.giro = { dittaId: c.d.id, ora: ora2, k: k2, lav: c.items.filter(function (s) { return U.giorniA(s.data) < 0; }).slice(0, k2).map(function (s) { return s.lavoratoreId; }) };
            p2.punti += 35;
            p2.motivi.unshift(['ok', 'Giro in zona: poi ' + c.d.ragione + ' (' + k2 + ' visite scadute), ' + U.viaggio(d.id, c.d.id) + "' di strada"]);
            out.push(p2);
            return true;
          });
        }
        if (o.n) { p.punti += 15; p.motivi.push(['ok', 'Riempie una giornata già avviata (' + Math.round((o.min + o.viaggi) * 100 / o.disp) + '% occupata)']); }
        else p.motivi.push(['', 'Giornata libera: ' + AG.oreMin(o.disp) + ' disponibili']);
        out.push(p);
      });
    });
    if (!out.length) return [];
    var primo = out.reduce(function (m, p) { return p.g < m ? p.g : m; }, out[0].g);
    out.forEach(function (p) { if (p.g === primo) { p.punti += 10; p.motivi.unshift(['ok', 'Primo giorno utile']); } });
    out.sort(function (a, b) { return b.punti - a.punti; });
    var visti = {};
    return out.filter(function (p) { if (visti[p.g]) return false; visti[p.g] = 1; return true; }).slice(0, 3).map(function (p) {
      p.lav = lavIds.slice(0, p.k);
      return p;
    });
  }

  function chipModalita(d) {
    if (d.modalitaVisite === 'loco') return UI.chip(d.locoObbligatoria ? 'in loco · obbligatoria' : 'preferisce in loco', d.locoObbligatoria ? 'info' : 'plain');
    if (d.modalitaVisite === 'sede') return UI.chip('in studio', 'plain');
    return UI.chip('luogo indifferente', 'plain');
  }
  function chipPrenotazione(d) { return d.prenotazione === 'cliente' ? UI.chip('sceglie il cliente', 'violet') : UI.chip('propone lo studio', 'plain'); }
  function testoProposta(p) {
    var fine = p.ora + p.k * p.dur;
    return U.fmtLunga(p.g) + ', ' + AG.fmtMin(p.ora) + '–' + AG.fmtMin(fine) + (p.modo === 'loco' ? ' presso la vostra sede' : ' presso lo studio CLS di Brescia') + ' · ' + p.k + ' lavoratori';
  }

  function listaAziende(tutte) {
    var s = st();
    var filtri = [['ritardo', 'In ritardo', function (x) { return x.scad; }], ['attesa', 'Proposta inviata', function (x) { return x.d.propostaInviata; }], ['cliente', 'Sceglie il cliente', function (x) { return x.d.prenotazione === 'cliente'; }], ['tutte', 'Tutte', function () { return true; }]];
    var f = filtri.filter(function (x) { return x[0] === s.filtro; })[0] || filtri[0];
    var vis = tutte.filter(f[2]);
    var daSollecitare = tutte.filter(function (x) { return x.scad && !x.d.propostaInviata; }).length;
    return '<div class="card"><div class="card-head"><h2>' + UI.ic('building') + ' Clienti da pianificare</h2><span class="sub">' + tutte.length + '</span></div>' +
      '<div class="pad-sm"><div class="seg seg-sm">' + filtri.map(function (x) {
        return '<button type="button" data-azione="pian-filtro" data-k="' + x[0] + '" aria-pressed="' + (x === f) + '">' + x[1] + '<span class="n">' + tutte.filter(x[2]).length + '</span></button>';
      }).join('') + '</div>' +
      (daSollecitare ? '<button type="button" class="btn btn-sm mt-sm" data-azione="pian-sollecita-tutti" style="width:100%;justify-content:center">' + UI.ic('mail') + ' Invia proposte ai ' + daSollecitare + ' clienti in ritardo</button>' : '') + '</div>' +
      '<div class="mini-list pian-lista">' + (vis.map(function (x) {
        var sel = x.d.id === s.ditta;
        return '<button type="button" class="it' + (sel ? ' sel' : '') + '" data-azione="pian-ditta" data-ditta="' + x.d.id + '"><span class="dot ' + (x.scad ? 'err' : 'warn') + '"></span><div class="t"><b>' + U.esc(x.d.ragione) + '</b>' +
          '<small>' + (x.scad ? x.scad + ' scadute · ritardo max ' + x.ritardo + ' gg' : '') + (x.items.length - x.scad ? (x.scad ? ' · ' : '') + (x.items.length - x.scad) + ' entro 30 gg' : '') + '</small>' +
          '<span class="row wrap" style="gap:4px;margin-top:4px">' + chipModalita(x.d) + chipPrenotazione(x.d) + UI.chip(x.d.citta, 'plain') +
          (x.d.propostaInviata ? UI.chip('proposta del ' + U.fmtBreve(x.d.propostaInviata.data), 'warn') : '') + '</span></div></button>';
      }).join('') || UI.empty('Nessun cliente in questo filtro.', 'check')) + '</div></div>';
  }

  function dettaglio(az) {
    var s = st(), d = az.d;
    var lavIds = az.items.map(function (x) { return x.lavoratoreId; }).filter(function (id) { return !s.esclusi[id]; });
    var inviata = d.propostaInviata;
    var props = inviata ? inviata.opzioni : proposte(az, lavIds);
    s.cache = props;
    var tutti = az.items.every(function (x) { return !s.esclusi[x.lavoratoreId]; });
    var tab = UI.datatable({
      id: 'pian-lav-' + d.id, cls: 'dt-annidata', per: 50, ordine: 'data', placeholder: 'Cerca lavoratore, mansione…',
      righe: az.items.map(function (x) { var l = U.getLav(x.lavoratoreId), uv = U.ultimaVisita(l.id); return { id: l.id, _nome: U.nomeLav(l), _mans: U.getMansione(l.mansioneId).nome, _uv: uv ? uv.data : '', data: x.data }; }),
      extra: [{ k: '_mans', label: 'Tutte le mansioni', opzioni: Object.keys(az.items.reduce(function (o, x) { o[U.getMansione(U.getLav(x.lavoratoreId).mansioneId).nome] = 1; return o; }, {})).sort() }],
      filtriExtra: '<label class="check right small"><input type="checkbox" data-azione="pian-lav-tutti" data-ditta="' + d.id + '" ' + (tutti ? 'checked' : '') + (inviata ? ' disabled' : '') + '> Includi tutti</label>',
      colonne: [
        { k: '_inc', l: '', sort: false, cerca: false, cell: function (r) { return '<input type="checkbox" data-azione="pian-lav" data-id="' + r.id + '" ' + (s.esclusi[r.id] ? '' : 'checked') + (inviata ? ' disabled' : '') + ' aria-label="Includi ' + U.esc(r._nome) + '">'; } },
        { k: '_nome', l: 'Lavoratore', cell: function (r) { return '<a href="#/lavoratori/' + r.id + '"><b>' + U.esc(r._nome) + '</b></a>'; } },
        { k: '_mans', l: 'Mansione', cell: function (r) { return U.esc(r._mans); } },
        { k: '_uv', l: 'Ultima visita', cell: function (r) { return r._uv ? '<span class="mono">' + U.fmtData(r._uv) + '</span>' : '—'; }, testo: function (r) { return r._uv ? U.fmtData(r._uv) : ''; }, val: function (r) { return r._uv; } },
        { k: 'data', l: 'Scadenza', cell: function (r) { return UI.statusChip(r.data); }, testo: function (r) { return U.fmtData(r.data); }, val: function (r) { return r.data; } }
      ]
    });
    var cards = props.length ? '<div class="grid-3 pian-opzioni">' + props.map(function (p, i) {
      var fine = p.ora + p.k * p.dur;
      return '<div class="card"><div class="card-body"><div class="eyebrow">Opzione ' + (i + 1) + '</div>' +
        '<h2 style="font-size:16px;margin:4px 0 2px">' + U.esc(U.fmtLunga(p.g)) + '</h2>' +
        '<div class="mono" style="font-size:13px">' + AG.fmtMin(p.ora) + '–' + AG.fmtMin(fine) + '</div>' +
        '<div class="row wrap mt-sm" style="gap:4px">' + (p.modo === 'loco' ? UI.chip('presso il cliente', 'info') : UI.chip('in studio', 'ok')) + UI.chip(p.k + ' visite × ' + p.dur + "'", 'plain') + '</div>' +
        '<div class="small muted mt-sm">Dott. ' + U.esc(U.nomeMedico(p.mc)) + '</div>' +
        (p.giro ? '<div class="note info mt-sm">' + UI.ic('pin') + ' Poi <b>' + U.esc(U.nomeDitta(p.giro.dittaId)) + '</b> alle ' + AG.fmtMin(p.giro.ora) + ' (' + p.giro.k + ' visite)</div>' : '') +
        '<ul class="pian-motivi">' + p.motivi.map(function (m) { return '<li><span class="dot ' + (m[0] || '') + '"></span>' + U.esc(m[1]) + '</li>'; }).join('') + '</ul>' +
        '<button type="button" class="btn ' + (i === 0 && d.prenotazione !== 'cliente' ? 'btn-primary' : '') + ' mt" data-azione="pian-prenota" data-i="' + i + '" style="width:100%;justify-content:center">' + UI.ic('calendar') + (inviata ? ' Il cliente ha scelto questa' : ' Prenota') + '</button></div></div>';
    }).join('') + '</div>' : UI.empty('Nessuna data utile nei prossimi ' + GIORNI_ESAMINATI + ' giorni lavorativi con la disponibilità del medico competente.', 'calendar');
    // azioni nella testata del pannello: niente riga in più sotto le opzioni
    var invio = inviata
      ? '<span class="chip warn" title="Inviate a ' + U.esc(inviata.a) + '. Quando il cliente risponde, clicca l’opzione scelta.">' + UI.ic('mail') + ' proposte inviate il ' + U.fmtBreve(inviata.data) + ' · in attesa</span><button type="button" class="btn btn-sm" data-azione="pian-annulla-proposta">Annulla proposta</button>'
      : (props.length ? '<button type="button" class="btn btn-sm ' + (d.prenotazione === 'cliente' ? 'btn-primary' : '') + '" data-azione="pian-proponi" title="' + (d.prenotazione === 'cliente' ? 'Questo cliente sceglie la data: manda le proposte.' : 'Lo studio fissa la data: prenota, oppure chiedi conferma al cliente.') + '">' + UI.ic('mail') + ' Invia le ' + props.length + ' proposte al cliente</button>' : '');

    // pannello cliente: si allunga (.fill) e la tabella dei lavoratori scorre al suo interno; le date proposte restano in fondo
    return '<div class="col pane-stack" data-key="' + d.id + '">' +
      '<div class="card fill"><div class="card-head"><h2>' + UI.ic('building') + ' ' + U.esc(d.ragione) + '</h2><span class="sub">' + U.esc(U.zona(d.id)) + '</span><div class="right row">' +
        '<button type="button" class="btn btn-sm" data-azione="pian-gruppo" data-ditta="' + d.id + '">' + UI.ic('users') + ' Appuntamento di gruppo</button><a class="btn btn-sm" href="#/ditte/' + d.id + '">' + UI.ic('settings') + ' Preferenze cliente</a></div></div>' +
        '<div class="pad-sm"><div class="row wrap" style="gap:6px">' + chipModalita(d) + chipPrenotazione(d) + UI.chip('Medico competente: Dott. ' + U.nomeMedico(d.medicoId), 'plain') + UI.chip(U.testoDisponibilita(d.medicoId), 'plain') + '</div>' +
          (d.notePianificazione ? '<div class="note info mt-sm">' + UI.ic('clipboard') + ' ' + U.esc(d.notePianificazione) + '</div>' : '') + '</div>' +
        tab + '</div>' +
      UI.card({ titolo: 'Date proposte', icona: 'spark', sub: lavIds.length + ' lavoratori · ordinate per convenienza', azioni: invio, corpo: cards }) +
      '</div>';
  }

  VISTE.pianifica = function () {
    var tutte = aziende(), s = st();
    if (!tutte.some(function (x) { return x.d.id === s.ditta; })) s.ditta = tutte[0] ? tutte[0].d.id : '';
    var az = tutte.filter(function (x) { return x.d.id === s.ditta; })[0];
    return {
      id: 'pianifica', icona: 'spark', titolo: 'Pianificazione guidata',
      sotto: 'Clienti in ritardo, date proposte dal sistema e solleciti',
      azioni: '<a class="btn btn-sm" href="#/agenda">' + UI.ic('calendar') + ' Agenda</a>',
      corpo: '<div class="pian-wrap">' + listaAziende(tutte) + (az ? dettaglio(az) : UI.empty('Nessun cliente da pianificare.', 'check')) + '</div>'
    };
  };

  /* ---------- azioni ---------- */
  // appuntamento di gruppo: un solo blocco (in studio o dal cliente) con dentro tutti i lavoratori, ordine libero
  function creaGruppo(mc, g, dur, dittaId, lavIds, ora, modo, nota) {
    var bloccoId = 'b' + Date.now() + dittaId, inizio = AG.fmtMin(ora);
    DB.blocchi.push({ id: bloccoId, gruppo: true, modalita: modo === 'loco' ? 'esterna' : 'sede', medicoId: mc, dittaId: dittaId, data: g, oraInizio: inizio, oraFine: AG.fmtMin(ora + lavIds.length * dur), durata: dur, capienza: lavIds.length, note: nota || 'Pianificazione guidata' });
    lavIds.forEach(function (id) {
      AG.creaVisita(U.getLav(id), mc, g, inizio, dur, modo === 'loco' ? 'esterna' : 'sede', 'Sala 1', 'Visita periodica', bloccoId);
    });
  }
  function prenota(p, d) {
    creaGruppo(p.mc, p.g, p.dur, d.id, p.lav.slice(0, p.k), p.ora, p.modo);
    if (p.giro) creaGruppo(p.mc, p.g, p.dur, p.giro.dittaId, p.giro.lav.slice(0, p.giro.k), p.giro.ora, 'loco');
    delete d.propostaInviata;
    U.ricalcolaConflitti();
  }
  AZIONI['pian-ditta'] = function (el) { st().ditta = el.dataset.ditta; st().esclusi = {}; RENDER(); };
  AZIONI['pian-filtro'] = function (el) { st().filtro = el.dataset.k; RENDER(); };
  AZIONI['pian-lav-tutti'] = function (el) {
    var s = st();
    aziende().filter(function (x) { return x.d.id === el.dataset.ditta; }).forEach(function (az) { az.items.forEach(function (x) { if (el.checked) delete s.esclusi[x.lavoratoreId]; else s.esclusi[x.lavoratoreId] = true; }); });
    RENDER();
  };
  AZIONI['pian-lav'] = function (el) { var s = st(); if (el.checked) delete s.esclusi[el.dataset.id]; else s.esclusi[el.dataset.id] = true; RENDER(); };
  AZIONI['pian-prenota'] = function (el) {
    var p = st().cache[Number(el.dataset.i)], d = U.getDitta(st().ditta);
    if (!p) return;
    prenota(p, d);
    STATE.agendaGiorno = p.g; STATE.agendaMedico = p.mc; STATE.agendaVista = 'griglia';
    RENDER();
    UI.toast((p.k + (p.giro ? p.giro.k : 0)) + ' visite prenotate per ' + U.fmtLunga(p.g) + (p.modo === 'loco' ? ' presso ' + d.ragione : ' in studio') + '. Le trovi in Agenda.', 'ok');
  };
  function invia(az, props) {
    var d = az.d, a = d.emailVisite || d.email || d.ragione;
    d.propostaInviata = { data: OGGI_ISO, a: a, opzioni: props };
    DB.scadenze.forEach(function (s) { if (s.dittaId === d.id && s.tipo === 'Visita' && !s.fissata) s.richiamoInviato = true; });
    DB.note.unshift({ data: OGGI_ISO, dittaId: d.id, tipo: 'Richiamo', lavoratoreId: '', testo: 'Inviate ' + props.length + ' proposte di data per ' + az.items.length + ' visite: ' + props.map(testoProposta).join(' / ') });
  }
  AZIONI['pian-proponi'] = function () {
    var az = aziende().filter(function (x) { return x.d.id === st().ditta; })[0], props = st().cache;
    if (!az || !props.length) return;
    var d = az.d;
    var testo = 'Gentile ' + d.ragione + ',\n\n' + (az.scad ? az.scad + ' vostri lavoratori hanno la visita di sorveglianza sanitaria scaduta' : 'alcuni vostri lavoratori hanno la visita in scadenza') + '. Per rimanere in regola vi proponiamo:\n\n' +
      props.map(function (p, i) { return 'Opzione ' + (i + 1) + ': ' + testoProposta(p); }).join('\n') +
      '\n\nRispondete indicando l’opzione preferita, oppure chiamateci per un’altra data.\n\nCLS Salus · Medicina del lavoro';
    window.__pianInvia = function () { invia(az, props); RENDER(); UI.toast('Proposte inviate a ' + (d.emailVisite || d.email) + ' (simulazione).', 'ok'); };
    UI.apriModale({
      titolo: 'Proposte di data al cliente', sotto: 'A: ' + U.esc(d.emailVisite || d.email || '—'), size: 'lg',
      corpo: '<pre class="pian-mail">' + U.esc(testo) + '</pre>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="button" class="btn btn-primary right" data-azione="pian-invia">' + UI.ic('send') + ' Invia</button>'
    });
  };
  AZIONI['pian-invia'] = function () { UI.chiudiModale(); if (window.__pianInvia) window.__pianInvia(); window.__pianInvia = null; };
  AZIONI['pian-annulla-proposta'] = function () { delete U.getDitta(st().ditta).propostaInviata; RENDER(); };
  /* ---------- appuntamento unico per più lavoratori della stessa ditta (dallo scadenziario) ---------- */
  function modiAmmessi(d) { return d.locoObbligatoria ? ['loco'] : d.modalitaVisite === 'loco' ? ['loco', 'sede'] : d.modalitaVisite === 'sede' ? ['sede', 'loco'] : ['sede', 'loco']; }
  function suggerimenti(d, n, mc) {
    var dur = U.durataMedia(mc), out = [];
    giorni().some(function (g) {
      modiAmmessi(d).forEach(function (modo) {
        var s = AG.slotLiberi(mc, g, n * dur, modo === 'loco' ? d.id : 'CLS', 1);
        if (s.length) out.push({ g: g, ora: s[0], modo: modo, fine: s[0] + n * dur });
      });
      return out.length >= 6;
    });
    return out.slice(0, 6);
  }
  AZIONI['pian-gruppo'] = function (el) {
    var d = U.getDitta(el.dataset.ditta), per = {};
    DB.scadenze.forEach(function (s) {
      if (s.dittaId !== d.id || s.tipo !== 'Visita' || s.fissata || !s.lavoratoreId || U.giorniA(s.data) > 90) return;
      if (!per[s.lavoratoreId] || s.data < per[s.lavoratoreId].data) per[s.lavoratoreId] = s;
    });
    var items = Object.keys(per).map(function (k) { return per[k]; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
    if (!items.length) { UI.toast('Nessuna visita da pianificare per ' + d.ragione + ' nei prossimi 90 giorni.', 'err'); return; }
    var scelti = items.filter(function (s) { return U.giorniA(s.data) <= 30; });
    if (!scelti.length) scelti = items;
    var mc = d.medicoId, dur = U.durataMedia(mc), sug = suggerimenti(d, scelti.length, mc);
    var lista = items.map(function (s) {
      var l = U.getLav(s.lavoratoreId);
      return '<label class="check"><input type="checkbox" name="lav" value="' + l.id + '" ' + (scelti.indexOf(s) >= 0 ? 'checked' : '') + '><span class="grow"><b>' + U.esc(U.nomeLav(l)) + '</b> <span class="small muted">' + U.esc(U.getMansione(l.mansioneId).nome) + '</span></span>' + UI.statusChip(s.data) + '</label>';
    }).join('');
    var opz = sug.map(function (p, i) {
      return '<label class="check pian-radio"><input type="radio" name="quando" value="' + p.g + '|' + AG.fmtMin(p.ora) + '|' + p.modo + '" ' + (i ? '' : 'checked') + '><span class="grow"><b>' + U.esc(U.fmtLunga(p.g)) + '</b> · <span class="mono">' + AG.fmtMin(p.ora) + '–' + AG.fmtMin(p.fine) + '</span></span>' + (p.modo === 'loco' ? UI.chip('presso il cliente', 'info') : UI.chip('in studio', 'ok')) + '</label>';
    }).join('');
    UI.apriModale({
      titolo: 'Appuntamento di gruppo · ' + U.esc(d.ragione), size: 'lg',
      sotto: 'Un solo appuntamento con il Dott. ' + U.esc(U.nomeMedico(mc)) + ': i lavoratori si visitano in qualsiasi ordine · ' + dur + "' a testa",
      corpo: '<form id="form-gruppo" data-form="pian-gruppo-salva" class="col" style="gap:14px"><input type="hidden" name="dittaId" value="' + d.id + '">' +
        '<div class="note ' + (d.locoObbligatoria ? 'warn' : 'info') + '">' + UI.ic('building') + ' ' + (d.modalitaVisite === 'loco' ? 'Visite presso il cliente' + (d.locoObbligatoria ? ' (obbligatorio)' : ' (preferenza)') : d.modalitaVisite === 'sede' ? 'Il cliente preferisce lo studio' : 'Nessuna preferenza sul luogo') + ' · ' + U.esc(U.zona(d.id)) + (d.notePianificazione ? ' · ' + U.esc(d.notePianificazione) : '') + '</div>' +
        '<div><div class="eyebrow">Lavoratori (' + items.length + ' in scadenza entro 90 giorni)</div><div class="col pian-check" style="gap:6px;margin-top:6px">' + lista + '</div></div>' +
        '<div><div class="eyebrow">Quando</div><div class="small muted" style="margin:2px 0 6px">Prime giornate con ' + AG.oreMin(scelti.length * dur) + ' liberi per ' + scelti.length + ' lavoratori, dentro la disponibilità del medico e con il tempo di viaggio. Se cambi i lavoratori la durata si adegua.</div><div class="col" style="gap:6px">' +
        (opz || '<div class="note warn">Nessuna giornata utile nei prossimi ' + GIORNI_ESAMINATI + ' giorni lavorativi per ' + scelti.length + ' visite di fila: togli qualche lavoratore o scegli una data a mano.</div>') +
        '<label class="check pian-radio"><input type="radio" name="quando" value="manuale" ' + (opz ? '' : 'checked') + '><span class="grow"><b>Altra data</b></span></label>' +
        '<div class="fgrid">' +
        UI.campo({ label: 'Data', name: 'data', type: 'date', value: giorni()[0] }) +
        UI.campo({ label: 'Inizio', name: 'ora', type: 'time', value: '09:00' }) +
        UI.campo({ label: 'Luogo', name: 'modo', type: 'select', value: modiAmmessi(d)[0], options: modiAmmessi(d).map(function (m) { return [m, m === 'loco' ? 'Presso il cliente' : 'In studio CLS']; }) }) +
        '</div></div></div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-gruppo">' + UI.ic('calendar') + ' Crea appuntamento</button>'
    });
  };
  AZIONI['pian-gruppo-salva'] = function (form) {
    var fd = new FormData(form), d = U.getDitta(fd.get('dittaId')), lav = fd.getAll('lav');
    if (!lav.length) { UI.toast('Seleziona almeno un lavoratore.', 'err'); return; }
    var q = String(fd.get('quando') || 'manuale').split('|');
    var g = q[0] === 'manuale' ? fd.get('data') : q[0], ora = q[0] === 'manuale' ? fd.get('ora') : q[1], modo = q[0] === 'manuale' ? fd.get('modo') : q[2];
    if (!g || !ora) { UI.toast('Indica data e ora.', 'err'); return; }
    if (d.locoObbligatoria && modo !== 'loco') { UI.toast(d.ragione + ' richiede la visita presso il cliente.', 'err'); return; }
    var mc = d.medicoId, dur = U.durataMedia(mc);
    creaGruppo(mc, g, dur, d.id, lav, U.toMin(ora), modo, 'Appuntamento di gruppo');
    U.ricalcolaConflitti();
    var b = DB.blocchi[DB.blocchi.length - 1];
    var prob = b.conflitto ? 'il medico ha già un’attività sovrapposta'
      : b.viaggio && !b.viaggio.ok ? 'mancano ' + (b.viaggio.minuti - Math.max(0, b.viaggio.margine)) + ' minuti per il viaggio'
        : b.fuoriDisp ? 'è fuori dalla disponibilità del medico' : '';
    UI.chiudiModale();
    STATE.agendaGiorno = g; STATE.agendaMedico = mc;
    RENDER();
    if (prob) UI.toast(lav.length + ' visite create per ' + d.ragione + ', ma ' + prob + '. Controlla in Agenda.', 'err');
    else UI.toast('Appuntamento di gruppo per ' + lav.length + ' lavoratori di ' + d.ragione + ': ' + U.fmtLunga(g) + ' dalle ' + ora + ' alle ' + AG.fmtMin(U.toMin(ora) + lav.length * dur) + (modo === 'loco' ? ' presso il cliente' : ' in studio') + '.', 'ok');
  };

  AZIONI['pian-sollecita-tutti'] = function () {
    var n = 0, senza = 0;
    aziende().filter(function (x) { return x.scad && !x.d.propostaInviata; }).forEach(function (az) {
      var props = proposte(az, az.items.map(function (x) { return x.lavoratoreId; }));
      if (props.length) { invia(az, props); n++; } else senza++;
    });
    RENDER();
    UI.toast('Proposte di data inviate a ' + n + ' clienti in ritardo' + (senza ? '; ' + senza + ' senza date utili (controllare la disponibilità del medico)' : '') + ' (simulazione).', senza ? 'err' : 'ok');
  };
})();
