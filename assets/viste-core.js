/* =========================================================
   CLS · viste operative: dashboard, agenda, scadenziario, Mago
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};
  var OGGI_ISO = U.iso(window.OGGI);

  /* ===================== DASHBOARD ===================== */
  VISTE.dashboard = function () {
    var evOggi = DB.eventi.filter(function (e) { return e.data === OGGI_ISO; }).sort(function (a, b) { return a.ora.localeCompare(b.ora); });
    var sett = U.settimana(0);
    var evSett = DB.eventi.filter(function (e) { return sett.indexOf(e.data) >= 0; });
    var scad30 = DB.scadenze.filter(function (s) { return U.giorniA(s.data) >= 0 && U.giorniA(s.data) <= 30 && !s.fissata; });
    var referti = DB.esami.filter(function (e) { return /DA RIPETERE|NON PERVENUTO/.test(e.risultato); });
    var cert = DB.documenti.filter(function (d) { return d.tipo === 'Giudizio di idoneità'; });
    var conflitti = DB.eventi.filter(function (e) { return e.conflitto; });
    var meeting = DB.scadenze.filter(function (s) { return s.note && s.note.indexOf('15 dipendenti') >= 0; });

    var kpis = '<div class="kpis">' +
      UI.kpi({ n: evOggi.filter(function (e) { return e.tipo === 'visita'; }).length, label: 'Visite in agenda oggi', icona: 'heart', tone: 'ok', href: '#/agenda' }) +
      UI.kpi({ n: evSett.length, label: 'Appuntamenti questa settimana', icona: 'calendar', href: '#/agenda' }) +
      UI.kpi({ n: scad30.length, label: 'Scadenze entro 30 giorni', icona: 'clock', tone: 'alert', href: '#/scadenziario' }) +
      UI.kpi({ n: referti.length, label: 'Referti da verificare', icona: 'activity', tone: referti.length ? 'danger' : '', href: '#/esami' }) +
      UI.kpi({ n: cert.length, label: 'Certificati firmati e inviati', icona: 'shield', tone: 'ok', href: '#/documenti' }) +
      '</div>';

    var agendaOggi = evOggi.length ? '<div class="table-box"><table class="table-mini"><thead><tr><th style="width:58px">Ora</th><th>Attività</th><th>Medico</th><th></th></tr></thead><tbody>' +
      evOggi.map(function (e) {
        var href = e.tipo === 'visita' ? '#/lavoratori/' + e.lavoratoreId : e.tipo === 'sopralluogo' ? '#/ditte/' + e.dittaId : '#/agenda';
        return '<tr class="click" data-href="' + href + '"><td class="mono">' + e.ora + '</td><td><b>' + U.esc(e.titolo) + '</b> <span class="small muted">' + U.esc(e.sottotitolo) + '</span>' + (e.conflitto ? ' <span class="chip err">conflitto</span>' : '') + '</td><td class="small">' + U.esc(U.nomeMedico(e.medicoId)) + '</td><td class="right"><a class="btn btn-xs" href="' + href + '">Apri</a></td></tr>';
      }).join('') + '</tbody></table></div>' : UI.empty('Nessun appuntamento oggi. La giornata è libera.', 'calendar');

    var scadList = DB.scadenze.filter(function (s) { return U.giorniA(s.data) <= 45; }).slice(0, 8);
    var scadTable = '<div class="table-box"><table class="table-mini"><thead><tr><th>Scadenza</th><th>Soggetto</th><th>Data</th><th></th></tr></thead><tbody>' +
      (scadList.length ? scadList.map(function (s) {
        var st = U.statoScadenza(s.data);
        return '<tr><td><b>' + U.esc(s.cosa) + '</b><div class="tiny muted">' + U.esc(s.tipo) + ' · ' + U.esc(s.descrizione) + '</div></td><td class="small">' + U.esc(s.soggetto) + '</td><td><span class="chip ' + st.tone + '">' + st.label + '</span></td><td class="right"><a class="btn btn-xs" href="#/scadenziario">Gestisci</a></td></tr>';
      }).join('') : '<tr><td colspan="4">' + UI.empty('Nessuna scadenza nei prossimi 45 giorni.', 'check') + '</td></tr>') + '</tbody></table></div>';

    var mago = DB.mago;
    var magoCard = UI.card({
      titolo: 'Integrazione Mago', icona: 'database', cls: '',
      azioni: '<a class="btn btn-sm" href="#/mago">Dettaglio</a>',
      corpo: '<div class="row" style="gap:14px;align-items:flex-start"><div class="grow"><div class="row"><span class="dot ' + (mago.stato === 'ok' ? 'ok' : 'warn') + '"></span><b class="small">Ultimo sync</b></div><div class="mono" style="font-size:13px;margin-top:2px">' + mago.ultimoSync + '</div><div class="small muted mt-sm">' + mago.coda + ' record in coda · ' + mago.errori + ' errore da verificare</div></div><button type="button" class="btn btn-primary btn-sm" data-azione="sync-mago">' + UI.ic('refresh') + ' Sincronizza</button></div>' +
        '<div class="note info mt">Le visite esterne vengono inviate con la voce dedicata; il report di fatturazione si aggiorna da solo.</div>'
    });

    var daPian = DB.daPianificare.slice(0, 5);
    var pianCard = UI.card({
      titolo: 'Da pianificare', icona: 'clock', sub: daPian.length + ' visite scadute',
      azioni: '<a class="btn btn-sm" href="#/agenda">Agenda</a>',
      corpo: daPian.length ? '<div class="mini-list">' + daPian.map(function (p) {
        var l = U.getLav(p.lavoratoreId);
        return '<div class="it"><span class="dot ' + (p.urgenza === 'alta' ? 'err' : 'warn') + '"></span><div class="t"><b>' + U.esc(U.nomeLav(l)) + '</b><small>' + U.esc(U.nomeDitta(l.dittaId)) + ' · ' + U.esc(p.motivo) + '</small></div><button type="button" class="btn btn-xs" data-azione="pianifica" data-lav="' + l.id + '">Pianifica</button></div>';
      }).join('') + '</div>' : UI.empty('Tutte le visite sono pianificate.', 'check')
    });

    var automazioni = UI.card({
      titolo: 'Automazioni attive', icona: 'spark',
      corpo: '<div class="col" style="gap:0">' +
        (meeting.length ? '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--border)"><span class="dot warn"></span><div class="grow"><b class="small">Riunione periodica · aziende con più di 15 dipendenti</b><div class="tiny muted">' + meeting.length + ' promemoria generato: ' + U.esc(meeting[0].soggetto) + '</div></div><a class="btn btn-xs" href="#/scadenziario">Apri</a></div>' : '') +
        '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--border)"><span class="dot ok"></span><div class="grow"><b class="small">Firma digitale e invio certificato</b><div class="tiny muted">Alla chiusura della visita il PDF viene firmato e inviato al lavoratore.</div></div><a class="btn btn-xs" href="#/documenti">Archivio</a></div>' +
        '<div class="row" style="padding:9px 0;border-bottom:1px solid var(--border)"><span class="dot info"></span><div class="grow"><b class="small">Report attività al medico · 24 ore prima</b><div class="tiny muted">Riepilogo appuntamenti del giorno dopo, invio automatico ore 18:00.</div></div><button type="button" class="btn btn-xs" data-azione="report-medico">Anteprima</button></div>' +
        '<div class="row" style="padding:9px 0"><span class="dot violet"></span><div class="grow"><b class="small">Email raggruppata scadenze ai clienti</b><div class="tiny muted">Visite, esami e sopralluoghi del periodo in un’unica comunicazione.</div></div><button type="button" class="btn btn-xs" data-azione="email-scadenze">Componi</button></div>' +
        '</div>'
    });

    var corpo = kpis + '<div class="grid-side"><div class="col" style="gap:16px">' +
      UI.card({ titolo: 'Agenda di oggi', icona: 'calendar', sub: U.fmtLunga(window.OGGI), azioni: '<a class="btn btn-sm" href="#/agenda">Vedi settimana</a>', corpo: agendaOggi, tight: true }) +
      UI.card({ titolo: 'Scadenze da gestire', icona: 'clock', sub: 'aperte e prossimi 45 giorni', azioni: '<a class="btn btn-sm" href="#/scadenziario">Scadenziario</a>', corpo: scadTable, tight: true }) +
      '</div><div class="col" style="gap:16px">' + magoCard + pianCard + automazioni + '</div></div>';

    return {
      id: 'dashboard', icona: 'home', titolo: 'Dashboard operativa', sotto: 'Cruscotto giornaliero di visite, esami, scadenze e sincronizzazione',
      azioni: '<button type="button" class="btn" data-azione="email-scadenze">' + UI.ic('mail') + ' Email scadenze</button><button type="button" class="btn btn-primary" data-azione="pianifica">' + UI.ic('plus') + ' Pianifica visita</button>',
      corpo: corpo
    };
  };

  /* ===================== AGENDA ===================== */
  VISTE.agenda = function () {
    U.ricalcolaConflitti();
    var giorni = U.settimana(STATE.agendaOffset);
    var eventi = DB.eventi.filter(function (e) { return giorni.indexOf(e.data) >= 0; });
    var conflitti = eventi.filter(function (e) { return e.conflitto; });
    var ore = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

    var head = '<div class="ag-corner" aria-hidden="true"></div>' + giorni.map(function (g) {
      var d = U.asDate(g), oggi = g === OGGI_ISO;
      return '<div class="ag-head ' + (oggi ? 'today' : '') + '"><span>' + U.GIORNI[d.getDay()].slice(0, 3).toUpperCase() + ' ' + d.getDate() + '</span><span class="d">' + U.MESI[d.getMonth()].slice(0, 3) + '</span></div>';
    }).join('');

    var righe = ore.map(function (h) {
      return '<div class="ag-time">' + U.pad(h) + ':00</div>' + giorni.map(function (g) {
        var d = U.asDate(g), weekend = d.getDay() === 0 || d.getDay() === 6;
        var evs = eventi.filter(function (e) { return e.data === g && parseInt(e.ora, 10) === h; }).sort(function (a, b) { return a.ora.localeCompare(b.ora); });
        return '<div class="ag-cell ' + (weekend ? 'weekend' : '') + '" data-giorno="' + g + '" data-ora="' + h + '">' + evs.map(function (e) {
          return '<button type="button" class="evt ' + e.tipo + (e.conflitto ? ' conflict' : '') + '" draggable="true" data-evento="' + e.id + '" data-azione="apri-evento" title="' + U.esc(e.titolo + ' · ' + e.sottotitolo + ' · ' + e.ora) + '">' +
            '<b>' + e.ora + ' · ' + U.esc(e.titolo) + '</b><span>' + U.esc(e.sottotitolo) + '</span>' + (e.conflitto ? '<span class="warn-i">⚠ conflitto</span>' : '') + '</button>';
        }).join('') + '</div>';
      }).join('');
    }).join('');

    var pendenti = DB.daPianificare.map(function (p) {
      var l = U.getLav(p.lavoratoreId);
      return '<div class="pending" draggable="true" data-evento="p:' + l.id + '" data-azione="pianifica" data-lav="' + l.id + '" title="Trascina su un giorno e un orario"><b>' + U.esc(U.nomeLav(l)) + '</b><span>' + U.esc(U.nomeDitta(l.dittaId)) + '</span><span class="chip ' + (p.urgenza === 'alta' ? 'err' : 'warn') + '" style="margin-top:3px">' + U.esc(p.motivo) + '</span></div>';
    }).join('');

    var confList = conflitti.length ? '<div class="mini-list">' + conflitti.map(function (e) {
      return '<div class="it"><span class="dot err"></span><div class="t"><b>' + U.esc(e.titolo) + '</b><small>' + U.fmtData(e.data) + ' ' + e.ora + ' · ' + U.esc(U.nomeMedico(e.medicoId)) + '</small></div><button type="button" class="btn btn-xs" data-azione="apri-evento" data-id="' + e.id + '">Apri</button></div>';
    }).join('') + '</div>' : '<div class="pad-sm small muted">' + UI.ic('check') + ' Nessun conflitto rilevato.</div>';

    var side = '<div class="side-card"><div class="card-head"><h2>' + UI.ic('clock') + ' Da pianificare</h2><span class="sub">' + DB.daPianificare.length + '</span></div><div class="unsched">' + (pendenti || '<div class="pad-sm small muted">Nessuna visita arretrata.</div>') + '</div><div class="card-foot">Trascina una visita in una cella dell’agenda.</div></div>' +
      '<div class="side-card"><div class="card-head"><h2>' + UI.ic('alert') + ' Conflitti</h2><span class="sub">' + conflitti.length + '</span></div>' + confList + '<div class="card-foot">Conflitto = stesso medico, stesso giorno e ora.</div></div>' +
      '<div class="side-card"><div class="card-head"><h2>' + UI.ic('mail') + ' Report al medico</h2></div><div class="card-body tight"><div class="small muted">Riepilogo delle attività del giorno successivo, inviato automaticamente 24 ore prima (ore 18:00).</div><button type="button" class="btn btn-sm mt" data-azione="report-medico">' + UI.ic('eye') + ' Anteprima report</button></div></div>';

    var corpo = '<div class="agenda-wrap"><div class="card agenda-main"><div class="agenda-scroll"><div class="agenda">' + head + righe + '</div></div>' +
      '<div class="agenda-legend"><span><i style="background:var(--accent)"></i>Visita</span><span><i style="background:var(--info)"></i>Esame specialistico</span><span><i style="background:var(--violet)"></i>Sopralluogo</span><span><i style="background:var(--danger)"></i>Conflitto</span><span class="right">Settimana ' + U.fmtBreve(giorni[0]) + ' – ' + U.fmtBreve(giorni[6]) + '</span></div></div>' +
      '<aside class="agenda-side">' + side + '</aside></div>';

    var label = STATE.agendaOffset === 0 ? 'Questa settimana' : (STATE.agendaOffset > 0 ? '+' + STATE.agendaOffset + ' settimane' : STATE.agendaOffset + ' settimane');
    return {
      id: 'agenda', icona: 'calendar', titolo: 'Agenda settimanale', sotto: label + ' · trascina gli appuntamenti per riprogrammarli', fit: true,
      azioni: '<div class="seg seg-sm"><button type="button" data-azione="agenda-settimana" data-delta="-1" aria-label="Settimana precedente">' + UI.ic('left') + '</button><button type="button" data-azione="agenda-settimana" data-delta="0">Oggi</button><button type="button" data-azione="agenda-settimana" data-delta="1" aria-label="Settimana successiva">' + UI.ic('right') + '</button></div><button type="button" class="btn btn-primary" data-azione="pianifica">' + UI.ic('plus') + ' Pianifica</button>',
      corpo: corpo
    };
  };

  AZIONI['agenda-settimana'] = function (el) {
    var d = Number(el.dataset.delta);
    STATE.agendaOffset = d === 0 ? 0 : STATE.agendaOffset + d;
    RENDER();
  };

  function oraLabel(ora) { return String(ora).length === 4 ? '0' + ora : ora; }

  AZIONI['sposta-evento'] = function (el) {
    var id = el.dataset.evento, giorno = el.dataset.giorno, ora = U.pad(el.dataset.ora) + ':00';
    if (!giorno) return;
    if (id.indexOf('p:') === 0) {
      var lav = U.getLav(id.slice(2));
      var d = U.getDitta(lav.dittaId), mn = U.getMansione(lav.mansioneId);
      var v = { id: 'v' + Date.now(), stato: 'programmata', lavoratoreId: lav.id, dittaId: lav.dittaId, medicoId: d.medicoId, mansioneId: lav.mansioneId, data: giorno, ora: ora, tipo: 'Visita periodica', giudizio: '', successiva: 0, sede: 'CLS — sede di Brescia', note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', clinica: null };
      DB.visite.push(v);
      DB.eventi.push({ id: 'ev' + Date.now(), tipo: 'visita', rifId: v.id, titolo: U.nomeLav(lav), sottotitolo: 'Visita periodica · ' + mn.nome, data: giorno, ora: ora, medicoId: d.medicoId, dittaId: lav.dittaId, lavoratoreId: lav.id });
      DB.daPianificare = DB.daPianificare.filter(function (p) { return p.lavoratoreId !== lav.id; });
      DB.scadenze.filter(function (s) { return s.lavoratoreId === lav.id && s.tipo === 'Visita'; }).forEach(function (s) { s.fissata = true; s.data = giorno; s.note = 'Appuntamento fissato in agenda'; });
      U.ricalcolaConflitti();
      RENDER();
      UI.toast('Visita di ' + U.nomeLav(lav) + ' pianificata per ' + U.fmtData(giorno) + ' alle ' + ora + '.', 'ok');
      return;
    }
    var e = DB.eventi.find(function (x) { return x.id === id; });
    if (!e) return;
    var vecchio = e.data + ' ' + e.ora;
    e.data = giorno; e.ora = ora;
    if (e.tipo === 'visita') {
      var vv = DB.visite.find(function (x) { return x.id === e.rifId; });
      if (vv) {
        vv.data = giorno; vv.ora = ora;
        DB.scadenze.filter(function (s) { return s.lavoratoreId === vv.lavoratoreId && s.tipo === 'Visita'; }).forEach(function (s) { s.data = giorno; s.fissata = true; s.note = 'Appuntamento spostato in agenda il ' + U.fmtData(window.OGGI); });
      }
    }
    if (e.tipo === 'sopralluogo') {
      var ss = DB.sopralluoghi.find(function (x) { return x.id === e.rifId; });
      if (ss) { ss.data = giorno; ss.ora = ora; }
    }
    U.ricalcolaConflitti();
    RENDER();
    if (e.conflitto) UI.toast('Spostato, ma attenzione: il medico ha già un appuntamento in questo orario.', 'err');
    else UI.toast('Appuntamento spostato da ' + vecchio + ' a ' + U.fmtData(giorno) + ' ' + ora + '.', 'ok');
  };

  AZIONI['apri-evento'] = function (el) {
    var e = DB.eventi.find(function (x) { return x.id === el.dataset.id || x.id === el.dataset.evento; });
    if (!e) return;
    var l = e.lavoratoreId ? U.getLav(e.lavoratoreId) : null;
    var d = U.getDitta(e.dittaId);
    var v = e.tipo === 'visita' ? DB.visite.find(function (x) { return x.id === e.rifId; }) : null;
    var corpo = '<div class="col" style="gap:14px">' +
      '<div class="row"><span class="chip ' + (e.tipo === 'visita' ? 'ok' : e.tipo === 'esame' ? 'info' : 'violet') + '">' + e.tipo + '</span>' + (e.conflitto ? '<span class="chip err">Conflitto di agenda</span>' : '<span class="chip ok">Nessun conflitto</span>') + '</div>' +
      UI.kv([
        ['Data e ora', U.fmtLunga(e.data) + ' · ' + e.ora],
        ['Medico', U.esc(U.nomeMedico(e.medicoId))],
        ['Ditta', '<a href="#/ditte/' + d.id + '" data-azione="chiudi-modale">' + U.esc(d.ragione) + '</a>'],
        ['Lavoratore', l && l.id ? '<a href="#/lavoratori/' + l.id + '" data-azione="chiudi-modale">' + U.esc(U.nomeLav(l)) + '</a>' : '—'],
        ['Sede', v ? U.esc(v.sede || '—') : e.tipo === 'sopralluogo' ? 'Sede aziendale' : 'CLS — sede di Brescia'],
        ['Tipo attività', U.esc(e.sottotitolo)]
      ]) + (e.conflitto ? '<div class="note warn"><strong>Conflitto:</strong> lo stesso medico ha un altro appuntamento nello stesso giorno e orario. Trascina l’evento in un’altra cella per risolvere.</div>' : '') +
      '</div>';
    var piede = '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><div class="right row">' +
      (l && l.id ? '<a class="btn" href="#/lavoratori/' + l.id + '" data-azione="chiudi-modale">' + UI.ic('user') + ' Scheda lavoratore</a>' : '') +
      (e.tipo === 'visita' ? '<a class="btn btn-primary" href="#/visite/nuova/' + l.id + '" data-azione="chiudi-modale">' + UI.ic('heart') + ' Apri visita</a>' : '<a class="btn btn-primary" href="#/ditte/' + d.id + '" data-azione="chiudi-modale">' + UI.ic('building') + ' Scheda ditta</a>') +
      '</div>';
    UI.apriModale({ titolo: U.esc(e.titolo), sotto: U.fmtLunga(e.data) + ' · ore ' + e.ora, corpo: corpo, piede: piede });
  };

  AZIONI['pianifica'] = function (el) {
    var lavId = el.dataset.lav || '';
    var opzioni = DB.daPianificare.map(function (p) {
      var l = U.getLav(p.lavoratoreId);
      return [l.id, U.nomeLav(l) + ' — ' + U.nomeDitta(l.dittaId) + ' (' + p.motivo + ')'];
    });
    if (!opzioni.length) opzioni = DB.lavoratori.filter(function (l) { return l.sorveglianza; }).map(function (l) { return [l.id, U.nomeLav(l) + ' — ' + U.nomeDitta(l.dittaId)]; });
    var domani = U.addGiorni(window.OGGI, 1);
    UI.apriModale({
      titolo: 'Pianifica appuntamento', size: 'sm', sotto: 'L’agenda verifica automaticamente i conflitti del medico',
      corpo: '<form id="form-pianifica" data-form="salva-pianificazione" class="col" style="gap:12px">' +
        (lavId ? '<input type="hidden" name="lavoratoreId" value="' + lavId + '"><div class="note info">Lavoratore selezionato: <strong>' + U.esc(U.nomeLav(U.getLav(lavId))) + '</strong></div>' :
          UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', value: lavId, options: opzioni, req: true })) +
        '<div class="fgrid">' + UI.campo({ label: 'Data', name: 'data', type: 'date', value: domani, req: true }) + UI.campo({ label: 'Ora', name: 'ora', type: 'select', options: [['08:00', '08:00'], ['09:00', '09:00'], ['10:00', '10:00'], ['11:00', '11:00'], ['12:00', '12:00'], ['13:00', '13:00'], ['14:00', '14:00'], ['15:00', '15:00'], ['16:00', '16:00'], ['17:00', '17:00']], value: '09:00' }) + '</div>' +
        '<div class="form-help">Il medico competente viene assegnato dalla ditta del lavoratore.</div>' +
        '</form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-pianifica">' + UI.ic('calendar') + ' Pianifica</button>'
    });
  };

  AZIONI['salva-pianificazione'] = function (form) {
    var fd = new FormData(form);
    var lav = U.getLav(fd.get('lavoratoreId'));
    if (!lav.id) { UI.toast('Seleziona un lavoratore.', 'err'); return; }
    var d = U.getDitta(lav.dittaId), mn = U.getMansione(lav.mansioneId);
    var data = fd.get('data'), ora = fd.get('ora');
    var durata = U.durataMedia(d.medicoId);
    var v = { id: 'v' + Date.now(), stato: 'programmata', lavoratoreId: lav.id, dittaId: lav.dittaId, medicoId: d.medicoId, mansioneId: lav.mansioneId, data: data, ora: ora, tipo: 'Visita periodica', giudizio: '', successiva: 0, sede: 'CLS — sede di Brescia', note: '', prescrizioni: '', mezzo: 'Consegnata a mano al Datore di lavoro', clinica: null, durata: durata, modalita: 'sede', sala: 'Sala 1', bloccoId: '' };
    DB.visite.push(v);
    DB.eventi.push({ id: 'ev' + Date.now(), tipo: 'visita', rifId: v.id, titolo: U.nomeLav(lav), sottotitolo: 'Visita periodica · ' + mn.nome, data: data, ora: ora, medicoId: d.medicoId, dittaId: lav.dittaId, lavoratoreId: lav.id, durata: durata, modalita: 'sede', sala: 'Sala 1', bloccoId: '' });
    DB.daPianificare = DB.daPianificare.filter(function (p) { return p.lavoratoreId !== lav.id; });
    DB.scadenze.filter(function (s) { return s.lavoratoreId === lav.id && s.tipo === 'Visita'; }).forEach(function (s) { s.fissata = true; s.data = data; s.note = 'Appuntamento fissato in agenda'; });
    U.ricalcolaConflitti();
    UI.chiudiModale();
    var dt = U.asDate(data), wd = (dt.getDay() + 6) % 7, lun = new Date(dt);
    lun.setDate(lun.getDate() - wd);
    STATE.agendaOffset = Math.round((lun - U.asDate(U.settimana(0)[0])) / 604800000);
    STATE.agendaGiorno = data;
    RENDER();
    var e = DB.eventi.find(function (x) { return x.rifId === v.id; });
    if (e && e.conflitto) UI.toast('Appuntamento creato, ma c’è un conflitto con un altro appuntamento dello stesso medico.', 'err');
    else UI.toast('Appuntamento pianificato per ' + U.nomeLav(lav) + ' il ' + U.fmtData(data) + ' alle ' + ora + '.', 'ok');
  };

  AZIONI['report-medico'] = function () {
    var domani = U.addGiorni(window.OGGI, 1);
    var ev = DB.eventi.filter(function (e) { return e.data === domani; }).sort(function (a, b) { return a.ora.localeCompare(b.ora); });
    var perMedico = {};
    ev.forEach(function (e) { (perMedico[e.medicoId] = perMedico[e.medicoId] || []).push(e); });
    var corpo = '<div class="note info mb">' + UI.ic('mail') + ' Anteprima del report inviato automaticamente al medico 24 ore prima. Destinatari: ' + Object.keys(perMedico).length + ' medici.</div>';
    if (!ev.length) corpo += UI.empty('Nessuna attività prevista per domani (' + U.fmtData(domani) + ').', 'calendar');
    Object.keys(perMedico).forEach(function (mid) {
      corpo += '<div class="mt"><div class="section-title"><h2>Dott. ' + U.esc(U.nomeMedico(mid)) + '</h2><span class="count">' + perMedico[mid].length + '</span></div><div class="table-box mt-sm"><table class="table-mini"><thead><tr><th style="width:56px">Ora</th><th>Attività</th><th>Luogo</th></tr></thead><tbody>' +
        perMedico[mid].map(function (e) { return '<tr><td class="mono">' + e.ora + '</td><td><b>' + U.esc(e.titolo) + '</b> <span class="small muted">' + U.esc(e.sottotitolo) + '</span></td><td class="small">' + U.esc(e.tipo === 'sopralluogo' ? U.nomeDitta(e.dittaId) : 'CLS — sede di Brescia') + '</td></tr>'; }).join('') +
        '</tbody></table></div></div>';
    });
    UI.apriModale({
      titolo: 'Report attività del ' + U.fmtData(domani), size: 'lg', sotto: 'Generato 24 ore prima · ore 18:00',
      corpo: corpo,
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><button type="button" class="btn btn-primary right" data-azione="invia-report">' + UI.ic('send') + ' Invia ora ai medici</button>'
    });
  };
  AZIONI['invia-report'] = function () { UI.chiudiModale(); UI.toast('Report giornaliero inviato ai medici (simulazione).', 'ok'); };

  /* ===================== SCADENZIARIO ===================== */
  VISTE.scadenziario = function () {
    if (!STATE.dt.scadenze) STATE.dt.scadenze = { q: '', sort: 'data', dir: 1, page: 1, per: 12, ex: { finestra: '' } };
    var visibili = U.scadenzeVisibili();
    var tot = visibili.length;
    var scadute = visibili.filter(function (s) { return U.giorniA(s.data) < 0; }).length;
    var prossime = visibili.filter(function (s) { return U.giorniA(s.data) >= 0 && U.giorniA(s.data) <= 30; }).length;
    var fissate = visibili.filter(function (s) { return s.fissata; }).length;
    var kpis = '<div class="kpis">' +
      UI.kpi({ n: tot, label: 'Scadenze totali', icona: 'clock' }) +
      UI.kpi({ n: scadute, label: 'Scadute', tone: 'danger', icona: 'alert' }) +
      UI.kpi({ n: prossime, label: 'Entro 30 giorni', tone: 'alert', icona: 'calendar' }) +
      UI.kpi({ n: fissate, label: 'Già fissate', tone: 'ok', icona: 'check' }) +
      '</div>';

    var righe = visibili.map(function (s) {
      var d = U.getDitta(s.dittaId);
      var link = s.lavoratoreId ? '#/lavoratori/' + s.lavoratoreId : '#/ditte/' + s.dittaId;
      return Object.assign({}, s, { _link: link, _ditta: d.ragione });
    });

    var tab = UI.datatable({
      id: 'scadenze', righe: righe, ordine: 'data', per: 12, vuoto: 'Nessuna scadenza con i filtri selezionati.',
      placeholder: 'Cerca per soggetto, cosa, ditta, medico…',
      extra: [
        { k: 'finestra', label: 'Tutte le scadenze', opzioni: [['7', 'Prossimi 7 giorni'], ['30', 'Prossimi 30 giorni'], ['90', 'Prossimi 90 giorni'], ['scadute', 'Solo scadute']], filtra: function (r, v) { var g = U.giorniA(r.data); return v === 'scadute' ? g < 0 : g >= 0 && g <= Number(v); } },
        { k: 'tipo', label: 'Tutti i tipi', opzioni: ['Visita', 'Accertamento', 'Vaccinazione', 'Corso', 'Sopralluogo', 'Riunione'] },
        { k: 'entita', label: 'Ditte e lavoratori', opzioni: ['Ditta', 'Lavoratore'] }
      ],
      colonne: [
        { k: '_stato', l: 'Stato', sort: false, cerca: false, cell: function (r) { return UI.statusChip(r.data); } },
        { k: 'soggetto', l: 'Soggetto', cell: function (r) { return '<a href="' + r._link + '" class="strong" style="text-decoration:none">' + U.esc(r.soggetto) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r.soggetto + ' ' + r._ditta; } },
        { k: 'tipo', l: 'Tipo', cell: function (r) { return '<span class="chip plain">' + U.esc(r.tipo) + '</span>'; } },
        { k: 'cosa', l: 'Cosa', cell: function (r) { return '<b>' + U.esc(r.cosa) + '</b>' + (r.note ? ' <span class="chip warn" title="' + U.esc(r.note) + '">regola</span>' : ''); }, testo: function (r) { return r.cosa + ' ' + r.descrizione; } },
        { k: 'descrizione', l: 'Descrizione', cell: function (r) { return '<span class="small muted">' + U.esc(r.descrizione) + '</span>'; }, sort: false },
        { k: 'data', l: 'Scadenza', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
        { k: 'medicoId', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(U.nomeMedico(r.medicoId)) + '</span>'; }, testo: function (r) { return U.nomeMedico(r.medicoId); } },
        { k: 'fissata', l: 'Fissata', sort: false, cerca: false, cell: function (r) { return U.ruolo() === 'operatore' ? '<label class="check" title="Segna come fissata"><input type="checkbox" data-azione="toggle-fissata" data-id="' + r.id + '" ' + (r.fissata ? 'checked' : '') + ' aria-label="Fissata"></label>' : (r.fissata ? UI.chip('sì', 'ok') : '<span class="muted">—</span>'); } }
      ],
      totale: function (rs) {
        var sc = rs.filter(function (r) { return U.giorniA(r.data) < 0; }).length;
        return '<tr><td colspan="5">Totale filtrato: <b>' + rs.length + '</b> scadenze · di cui <b>' + sc + '</b> scadute</td><td colspan="3" class="num">' + U.fmtData(window.OGGI) + '</td></tr>';
      }
    });

    return {
      id: 'scadenziario', icona: 'clock', titolo: U.ruolo() === 'ditta' ? 'Scadenze della nostra azienda' : U.ruolo() === 'medico' ? 'Scadenze delle aziende assegnate' : 'Scadenziario proattivo',
      sotto: 'Visite, esami, vaccinazioni, corsi e sopralluoghi' + (U.ruolo() === 'operatore' ? ' · regole automatiche incluse' : ''), fit: true,
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="scadenze" data-nome="scadenze">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-primary" data-azione="email-scadenze">' + UI.ic('mail') + ' Email raggruppate</button>' : ''),
      corpo: kpis + tab
    };
  };

  AZIONI['toggle-fissata'] = function (el) {
    var s = DB.scadenze.find(function (x) { return x.id === el.dataset.id; });
    if (!s) return;
    s.fissata = el.checked;
    if (s.fissata) s.note = 'Fissata manualmente il ' + U.fmtData(window.OGGI);
    UI.toast(s.fissata ? 'Scadenza segnata come fissata.' : 'Scadenza riportata tra quelle da gestire.', 'ok');
    RENDER();
  };

  AZIONI['email-scadenze'] = function () {
    var limite = U.addGiorni(window.OGGI, 45);
    var scad = U.scadenzeVisibili().filter(function (s) { return !s.emailInviata && s.data <= limite; });
    var gruppi = {};
    scad.forEach(function (s) { (gruppi[s.dittaId] = gruppi[s.dittaId] || []).push(s); });
    var ids = Object.keys(gruppi);
    var corpo = '<div class="note info mb">' + UI.ic('mail') + ' Un’unica email per cliente con tutte le scadenze del periodo (visite, esami, vaccinazioni, sopralluoghi). ' + scad.length + ' scadenze in ' + ids.length + ' ditte.</div>';
    if (!ids.length) corpo += UI.empty('Nessuna scadenza da notificare: tutte già inviate o fissate.', 'check');
    ids.forEach(function (did) {
      var d = U.getDitta(did), list = gruppi[did];
      corpo += '<div class="mt-sm" style="border:1px solid var(--border);border-radius:8px;padding:10px 12px"><div class="row"><div class="grow"><b>' + U.esc(d.ragione) + '</b><div class="tiny muted">' + U.esc(d.emailVisite || d.email) + ' · ' + list.length + ' scadenze</div></div><span class="chip ' + (list.some(function (s) { return U.giorniA(s.data) < 0; }) ? 'err' : 'warn') + '">' + list.length + '</span></div><div class="small mt-sm">' + list.slice(0, 4).map(function (s) { return U.esc(s.cosa) + ' — ' + U.esc(s.soggetto) + ' (' + U.fmtData(s.data) + ')'; }).join('<br>') + (list.length > 4 ? '<br><span class="muted">e altre ' + (list.length - 4) + '…</span>' : '') + '</div></div>';
    });
    window.__emailIds = scad.map(function (s) { return s.id; });
    UI.apriModale({
      titolo: 'Email raggruppate ai clienti', sotto: 'Scadenze del periodo, una comunicazione per azienda', size: 'lg',
      corpo: corpo,
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="button" class="btn btn-primary right" data-azione="invia-email" ' + (ids.length ? '' : 'disabled') + '>' + UI.ic('send') + ' Invia ' + ids.length + ' email</button>'
    });
  };

  AZIONI['invia-email'] = function () {
    var ids = window.__emailIds || [];
    ids.forEach(function (id) { var s = DB.scadenze.find(function (x) { return x.id === id; }); if (s) { s.emailInviata = true; s.note = 'Email raggruppata inviata il ' + U.fmtData(window.OGGI); } });
    DB.note.unshift({ data: U.iso(window.OGGI), dittaId: '', tipo: 'Scadenze', lavoratoreId: '', testo: 'Inviata email raggruppata scadenze a ' + ids.length + ' scadenze.' });
    UI.chiudiModale();
    RENDER();
    UI.toast('Email raggruppate inviate ai clienti (simulazione).', 'ok');
  };

  /* ===================== MAGO ===================== */
  VISTE.mago = function () {
    var mago = DB.mago;
    var daInviare = DB.visite.filter(function (v) { return v.stato === 'eseguita' && String(v.data).slice(0, 4) === '2026'; });
    var esterne = daInviare.filter(function (v) { return /esterna/i.test(v.sede || ''); });

    var syncCards = '<div class="sync-grid">' +
      '<div class="sync-card"><div class="head"><span>Ultimo sync</span>' + UI.chip('OK', 'ok', { dot: true }) + '</div><div class="n" style="font-size:14px">' + mago.ultimoSync + '</div><div class="sub">12 anagrafiche · 8 prestazioni</div></div>' +
      '<div class="sync-card"><div class="head"><span>Record in coda</span><span class="dot warn"></span></div><div class="n">' + mago.coda + '</div><div class="sub">Invio automatico ogni 30 min</div></div>' +
      '<div class="sync-card"><div class="head"><span>Errori</span><span class="dot err"></span></div><div class="n">' + mago.errori + '</div><div class="sub">Fattura FT-2026/0411 rifiutata</div></div>' +
      '<div class="sync-card"><div class="head"><span>Visite esterne</span><span class="dot info"></span></div><div class="n">' + esterne.length + '</div><div class="sub">Su ' + daInviare.length + ' visite del 2026</div></div>' +
      '</div>';

    var log = '<div class="log" style="margin-top:14px">' + mago.log.map(function (l) { return '<div><span class="dim">' + U.esc(l[0]) + '</span>  <span class="' + l[1] + '">' + U.esc(l[2]) + '</span></div>'; }).join('') + '</div>';

    var storico = mago.anagrafiche.map(function (a) {
      return '<div style="border:1px solid var(--border);border-radius:8px;padding:12px 14px;margin-bottom:10px"><div class="row"><div class="grow"><b>' + U.esc(a.ragione) + '</b><div class="tiny muted">P.IVA ' + U.esc(a.piva) + '</div></div><button type="button" class="btn btn-xs" data-azione="mago-storico" data-piva="' + a.piva + '">' + UI.ic('history') + ' Storico</button></div><div class="storico mt-sm">' +
        a.records.map(function (r) {
          return '<div class="r ' + (r.stato === 'Annullata' ? 'old' : '') + '"><span class="d">' + r.dal + (r.al ? ' → ' + r.al : ' → oggi') + '</span><span><span class="nome">' + U.esc(r.ragione) + '</span><div class="tiny muted">' + U.esc(r.sede) + ' · Mago ' + U.esc(r.magoId) + '</div></span>' + UI.chip(r.stato, r.stato === 'Attiva' ? 'ok' : 'plain') + '</div>';
        }).join('') + '</div></div>';
    }).join('');

    var corpo = syncCards +
      '<div class="grid-side"><div class="col" style="gap:16px">' +
      UI.card({
        titolo: 'Coda di sincronizzazione', icona: 'database', azioni: '<button type="button" class="btn btn-sm btn-primary" data-azione="sync-mago">' + UI.ic('refresh') + ' Sincronizza ora</button>',
        corpo: '<div class="small muted">Trasferimento automatico di anagrafiche, prestazioni, modalità di pagamento e coordinate bancarie. Mago resta il centro di verità per fatturazione elettronica e SDI.</div>' + log
      }) +
      UI.card({
        titolo: 'Anagrafiche storicizzate · stessa P.IVA', icona: 'history',
        corpo: '<div class="note warn mb">Con la stessa P.IVA il record precedente viene <strong>annullato logicamente</strong> (data di annullamento) e ne viene creato uno nuovo: i documenti storici restano integri. Il cambio di P.IVA genera invece una nuova entità.</div>' + storico
      }) +
      '</div><div class="col" style="gap:16px">' +
      UI.card({
        titolo: 'Cosa viene inviato a Mago', icona: 'send',
        corpo: '<ul class="lista-pulita" style="margin:-8px -16px">' +
          ['Anagrafica ditta e lavoratore', 'Prestazioni e visite eseguite', 'Visite in sede e visite esterne (distinte)', 'Modalità di pagamento', 'Coordinate bancarie', 'Dati per fatturazione elettronica e SDI'].map(function (t) { return '<li><span class="dot ok"></span>' + t + '</li>'; }).join('') +
          '</ul>'
      }) +
      UI.card({
        titolo: 'Dati mancanti', icona: 'alert',
        corpo: '<div class="note warn"><strong>Tessitura Serica S.r.l.</strong><br>Coordinate bancarie mancanti: la sincronizzazione della fattura è rinviata.</div><div class="note info mt-sm"><strong>Studio Tecnico Alfa</strong><br>PEC non presente: la fattura elettronica usa il codice destinatario.</div><a class="btn btn-sm mt" href="#/ditte/d8">Apri anagrafica</a>'
      }) +
      '</div></div>';

    return {
      id: 'mago', icona: 'database', titolo: 'Sincronizzazione Mago', sotto: 'API, storicizzazione anagrafiche e fatturazione elettronica',
      azioni: '<button type="button" class="btn btn-primary" data-azione="sync-mago">' + UI.ic('refresh') + ' Sincronizza ora</button>',
      corpo: corpo
    };
  };

  AZIONI['sync-mago'] = function () {
    UI.toast('Sincronizzazione con Mago avviata…');
    DB.mago.coda = 0;
    DB.mago.ultimoSync = '10/11/2026 09:35';
    DB.mago.log.unshift(['10/11/2026 09:35', 'ok', 'Sincronizzazione manuale completata: 5 anagrafiche e 3 prestazioni inviate.']);
    setTimeout(function () {
      if (STATE.utente) RENDER();
      UI.toast('Sincronizzazione completata: 5 anagrafiche e 3 prestazioni inviate a Mago.', 'ok');
    }, 800);
  };

  AZIONI['mago-storico'] = function (el) {
    var a = DB.mago.anagrafiche.find(function (x) { return x.piva === el.dataset.piva; });
    if (!a) return;
    var corpo = '<div class="storico">' + a.records.map(function (r) {
      return '<div class="r ' + (r.stato === 'Annullata' ? 'old' : '') + '"><span class="d">' + r.dal + (r.al ? '<br>→ ' + r.al : '<br>→ oggi') + '</span><div><span class="nome strong">' + U.esc(r.ragione) + '</span><div class="small muted">' + U.esc(r.sede) + '</div><div class="tiny muted">ID Mago ' + U.esc(r.magoId) + (r.al ? ' · annullato il ' + r.al : '') + '</div></div>' + UI.chip(r.stato, r.stato === 'Attiva' ? 'ok' : 'plain') + '</div>';
    }).join('') + '</div><div class="note info mt">' + UI.ic('history') + ' La riga annullata non è cancellata: resta consultabile per i documenti emessi nel periodo di validità.</div>';
    UI.apriModale({ titolo: 'Storico anagrafico · ' + U.esc(a.ragione), sotto: 'P.IVA ' + U.esc(a.piva), corpo: corpo });
  };

})();
