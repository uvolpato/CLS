/* =========================================================
   CLS · accessi per ruolo: cruscotti medico/azienda e utenti
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};
  var OGGI_ISO = U.iso(window.OGGI);

  function eventiOggi() {
    return U.eventiVisibili().filter(function (e) { return e.data === OGGI_ISO; }).sort(function (a, b) { return a.ora.localeCompare(b.ora); });
  }
  function agendaTable(evs) {
    if (!evs.length) return UI.empty('Nessun appuntamento oggi. La giornata è libera.', 'calendar');
    return '<div class="table-box"><table class="table-mini"><thead><tr><th style="width:58px">Ora</th><th>Attività</th><th>Luogo</th><th></th></tr></thead><tbody>' +
      evs.map(function (e) {
        var href = e.lavoratoreId ? '#/lavoratori/' + e.lavoratoreId : '#/ditte/' + e.dittaId;
        return '<tr class="click" data-href="' + href + '"><td class="mono">' + e.ora + '</td><td><b>' + U.esc(e.titolo) + '</b> <span class="small muted">' + U.esc(e.sottotitolo) + '</span></td><td class="tiny muted">' + U.esc(e.modalita === 'esterna' ? 'Esterno' : (e.sala || 'Sede CLS')) + '</td><td class="right"><a class="btn btn-xs" href="' + href + '">Apri</a></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function scadenzeTable(scad) {
    return '<div class="table-box"><table class="table-mini"><thead><tr><th>Scadenza</th><th>Soggetto</th><th>Data</th></tr></thead><tbody>' +
      (scad.length ? scad.map(function (s) {
        var st = U.statoScadenza(s.data);
        return '<tr><td><b>' + U.esc(s.cosa) + '</b><div class="tiny muted">' + U.esc(s.tipo) + ' · ' + U.esc(s.descrizione) + '</div></td><td class="small">' + U.esc(s.soggetto) + '</td><td><span class="chip ' + st.tone + '">' + st.label + '</span></td></tr>';
      }).join('') : '<tr><td colspan="3">' + UI.empty('Nessuna scadenza imminente.', 'check') + '</td></tr>') + '</tbody></table></div>';
  }

  /* ===================== DASHBOARD MEDICO ===================== */
  function dashboardMedico(u) {
    var m = U.getMedico(u.medicoId), ditte = U.ditteVisibili();
    var evOggi = eventiOggi();
    var sett = U.settimana(0);
    var evSett = U.eventiVisibili().filter(function (e) { return sett.indexOf(e.data) >= 0; });
    var scad = U.scadenzeVisibili();
    var scad30 = scad.filter(function (s) { return U.giorniA(s.data) >= 0 && U.giorniA(s.data) <= 30 && !s.fissata; });
    var referti = U.esamiVisibili().filter(function (e) { return /DA RIPETERE|NON PERVENUTO/.test(e.risultato); });
    var daPian = DB.daPianificare.filter(function (p) { return U.puoLav({ id: p.lavoratoreId }); });

    var kpis = '<div class="kpis">' +
      UI.kpi({ n: evOggi.filter(function (e) { return e.tipo === 'visita'; }).length, label: 'Visite oggi', icona: 'heart', tone: 'ok', href: '#/agenda' }) +
      UI.kpi({ n: evSett.length, label: 'Appuntamenti questa settimana', icona: 'calendar', href: '#/agenda' }) +
      UI.kpi({ n: scad30.length, label: 'Scadenze entro 30 giorni', icona: 'clock', tone: 'alert', href: '#/scadenziario' }) +
      UI.kpi({ n: referti.length, label: 'Referti da verificare', icona: 'activity', tone: referti.length ? 'danger' : '', href: '#/esami' }) +
      UI.kpi({ n: ditte.length, label: 'Aziende assegnate', icona: 'building', href: '#/ditte' }) +
      '</div>';

    var ditteCard = UI.card({
      titolo: 'Le mie aziende', icona: 'building', sub: ditte.length + ' aziende',
      azioni: '<a class="btn btn-sm" href="#/ditte">Tutte</a>',
      corpo: ditte.length ? '<div class="mini-list">' + ditte.slice(0, 6).map(function (d) {
        var lav = U.lavoratoriDitta(d.id).length;
        return '<div class="it"><span class="dot ok"></span><div class="t"><b><a href="#/ditte/' + d.id + '" style="text-decoration:none">' + U.esc(d.ragione) + '</a></b><small>' + U.esc(d.citta) + ' · ' + lav + ' lavoratori</small></div><a class="btn btn-xs" href="#/ditte/' + d.id + '">Apri</a></div>';
      }).join('') + '</div>' : UI.empty('Nessuna azienda assegnata.', 'building')
    });

    var pianCard = UI.card({
      titolo: 'Da pianificare', icona: 'clock', sub: daPian.length + ' visite',
      azioni: '<a class="btn btn-sm" href="#/agenda">Agenda</a>',
      corpo: daPian.length ? '<div class="mini-list">' + daPian.slice(0, 5).map(function (p) {
        var l = U.getLav(p.lavoratoreId);
        return '<div class="it"><span class="dot ' + (p.urgenza === 'alta' ? 'err' : 'warn') + '"></span><div class="t"><b>' + U.esc(U.nomeLav(l)) + '</b><small>' + U.esc(U.nomeDitta(l.dittaId)) + ' · ' + U.esc(p.motivo) + '</small></div><a class="btn btn-xs" href="#/agenda">Pianifica</a></div>';
      }).join('') + '</div>' : UI.empty('Tutte le visite sono pianificate.', 'check')
    });

    var corpo = kpis + '<div class="grid-side"><div class="col" style="gap:16px">' +
      UI.card({ titolo: 'Agenda di oggi', icona: 'calendar', sub: U.fmtLunga(window.OGGI), azioni: '<a class="btn btn-sm" href="#/agenda">Apri agenda</a>', corpo: agendaTable(evOggi), tight: true }) +
      UI.card({ titolo: 'Scadenze delle mie aziende', icona: 'clock', sub: 'prossimi 45 giorni', azioni: '<a class="btn btn-sm" href="#/scadenziario">Scadenziario</a>', corpo: scadenzeTable(scad.filter(function (s) { return U.giorniA(s.data) <= 45; }).slice(0, 8)), tight: true }) +
      '</div><div class="col" style="gap:16px">' + ditteCard + pianCard +
      UI.card({ titolo: 'Il mio profilo', icona: 'user', corpo: '<div class="row">' + UI.avatar(m.nome, true) + '<div class="grow"><b>Dott. ' + U.esc(m.nome) + '</b><div class="small muted">' + U.esc(m.email) + ' · ' + U.esc(m.tel) + '</div></div></div><div class="note info mt">Vedi solo le aziende in cui sei medico competente e i loro lavoratori. La cartella clinica completa è accessibile dalle visite.</div>' }) +
      '</div></div>';

    return {
      id: 'dashboard', icona: 'home', titolo: 'Dashboard medico', sotto: 'La tua giornata, le aziende assegnate e le scadenze di sorveglianza',
      azioni: '<a class="btn btn-primary" href="#/agenda">' + UI.ic('calendar') + ' Apri agenda</a>',
      corpo: corpo
    };
  }

  /* ===================== DASHBOARD AZIENDA ===================== */
  function dashboardDitta(u) {
    var d = U.getDitta(u.dittaId), lav = U.lavVisibili();
    var visite = U.visiteVisibili();
    var docs = U.documentiVisibili();
    var scad = U.scadenzeVisibili();
    var inAgenda = visite.filter(function (v) { return v.stato === 'programmata' && U.giorniA(v.data) >= 0; }).sort(function (a, b) { return (a.data + a.ora).localeCompare(b.data + b.ora); });
    var certificati = docs.filter(function (x) { return /Giudizio/.test(x.tipo); });
    var scad30 = scad.filter(function (s) { return U.giorniA(s.data) >= 0 && U.giorniA(s.data) <= 30 && !s.fissata; });
    var scadute = scad.filter(function (s) { return U.giorniA(s.data) < 0 && !s.fissata; });

    var kpis = '<div class="kpis">' +
      UI.kpi({ n: lav.filter(function (l) { return l.sorveglianza; }).length, label: 'Lavoratori in sorveglianza', icona: 'users', href: '#/lavoratori' }) +
      UI.kpi({ n: inAgenda.length, label: 'Visite in programma', icona: 'calendar', href: '#/visite' }) +
      UI.kpi({ n: certificati.length, label: 'Certificati disponibili', icona: 'file', tone: 'ok', href: '#/documenti' }) +
      UI.kpi({ n: scadute.length, label: 'Scadenze da recuperare', icona: 'alert', tone: scadute.length ? 'danger' : '', href: '#/scadenziario' }) +
      UI.kpi({ n: scad30.length, label: 'Scadenze entro 30 giorni', icona: 'clock', tone: 'alert', href: '#/scadenziario' }) +
      '</div>';

    var prossime = '<div class="table-box"><table class="table-mini"><thead><tr><th>Data</th><th>Lavoratore</th><th>Visita</th><th>Sede</th></tr></thead><tbody>' +
      (inAgenda.length ? inAgenda.slice(0, 8).map(function (v) {
        return '<tr><td class="mono">' + U.fmtData(v.data) + '<div class="tiny muted">' + v.ora + '</div></td><td><b>' + U.esc(U.nomeLav(U.getLav(v.lavoratoreId))) + '</b></td><td class="small">' + U.esc(v.tipo) + '</td><td class="tiny muted">' + U.esc(/esterna/i.test(v.sede || '') ? 'Presso di noi' : 'CLS Brescia') + '</td></tr>';
      }).join('') : '<tr><td colspan="4">' + UI.empty('Nessuna visita in programma.', 'calendar') + '</td></tr>') + '</tbody></table></div>';

    var docsTable = '<div class="table-box"><table class="table-mini"><thead><tr><th>Documento</th><th>Soggetto</th><th>Data</th><th></th></tr></thead><tbody>' +
      (docs.length ? docs.slice().sort(function (a, b) { return (b.dataDoc || '').localeCompare(a.dataDoc || ''); }).slice(0, 6).map(function (x) {
        return '<tr><td><b>' + U.esc(x.tipo) + '</b><div class="tiny muted">' + U.esc(x.stato) + '</div></td><td class="small">' + U.esc(x.soggetto) + '</td><td class="mono small">' + U.fmtData(x.dataDoc) + '</td><td class="right"><a class="btn btn-xs" href="#/documenti">Apri</a></td></tr>';
      }).join('') : '<tr><td colspan="4">' + UI.empty('Nessun documento disponibile.', 'file') + '</td></tr>') + '</tbody></table></div>';

    var contatti = UI.card({
      titolo: 'Referenti CLS', icona: 'phone',
      corpo: UI.infoGrid([
        ['Azienda', U.esc(d.ragione)],
        ['Medico competente', 'Dott. ' + U.esc(U.nomeMedico(d.medicoId))],
        ['Email visite', U.esc(d.emailVisite || d.email)],
        ['Telefono studio', '030 4521789']
      ]) + '<div class="note info mt">L’accesso azienda mostra solo i lavoratori, le visite e i documenti della vostra azienda. Per modifiche anagrafiche o nuove assunzioni contatta la segreteria CLS.</div>'
    });

    var corpo = kpis + '<div class="grid-side"><div class="col" style="gap:16px">' +
      UI.card({ titolo: 'Prossime visite', icona: 'calendar', sub: U.fmtLunga(window.OGGI), azioni: '<a class="btn btn-sm" href="#/visite">Tutte le visite</a>', corpo: prossime, tight: true }) +
      UI.card({ titolo: 'Scadenze di sorveglianza', icona: 'clock', sub: 'prossimi 45 giorni', azioni: '<a class="btn btn-sm" href="#/scadenziario">Scadenziario</a>', corpo: scadenzeTable(scad.filter(function (s) { return U.giorniA(s.data) <= 45; }).slice(0, 8)), tight: true }) +
      '</div><div class="col" style="gap:16px">' +
      UI.card({ titolo: 'Documenti recenti', icona: 'file', azioni: '<a class="btn btn-sm" href="#/documenti">Archivio</a>', corpo: docsTable, tight: true }) +
      contatti + '</div></div>';

    return {
      id: 'dashboard', icona: 'home', titolo: 'Dashboard azienda', sotto: d.ragione + ' · sorveglianza sanitaria dei vostri lavoratori',
      azioni: '<a class="btn" href="#/lavoratori">' + UI.ic('users') + ' Lavoratori</a><a class="btn btn-primary" href="#/documenti">' + UI.ic('file') + ' Documenti</a>',
      corpo: corpo
    };
  }

  var dashboardBase = VISTE.dashboard;
  VISTE.dashboard = function () {
    var u = U.utenteCorrente();
    if (!u || u.ruolo === 'operatore') return dashboardBase();
    return u.ruolo === 'medico' ? dashboardMedico(u) : dashboardDitta(u);
  };

  /* ===================== GESTIONE UTENTI ===================== */
  function legameUtente(u) {
    if (u.ruolo === 'medico') return 'Dott. ' + U.nomeMedico(u.medicoId);
    if (u.ruolo === 'ditta') return U.nomeDitta(u.dittaId);
    return 'Sede CLS';
  }
  function linkUtente(u) {
    if (u.ruolo === 'ditta') return '#/ditte/' + u.dittaId;
    return '';
  }

  VISTE.utenti = function () {
    var righe = DB.utenti.map(function (u) {
      return Object.assign({}, u, { _legame: legameUtente(u), _ruolo: U.ruoloLabel(u.ruolo), _link: linkUtente(u) });
    });
    var tab = UI.datatable({
      id: 'utenti', righe: righe, ordine: 'nome', per: 12, placeholder: 'Cerca nome, email, username, azienda…',
      extra: [
        { k: 'ruolo', label: 'Tutti i ruoli', opzioni: [['operatore', 'Operatore CLS'], ['medico', 'Medico competente'], ['ditta', 'Azienda cliente']] },
        { k: 'attivo', label: 'Tutti gli stati', opzioni: [['1', 'Attivi'], ['0', 'Disattivati']], filtra: function (r, v) { return String(r.attivo) === v; } }
      ],
      colonne: [
        { k: 'nome', l: 'Utente', cell: function (r) { return '<div class="row">' + UI.avatar(r.nome) + '<div><b>' + U.esc(r.nome) + '</b><div class="tiny muted">' + U.esc(r.email) + '</div></div></div>'; } },
        { k: 'username', l: 'Username', cell: function (r) { return '<span class="mono small">' + U.esc(r.username) + '</span>'; } },
        { k: '_ruolo', l: 'Ruolo', cell: function (r) { return '<span class="chip ' + (r.ruolo === 'operatore' ? 'info' : r.ruolo === 'medico' ? 'ok' : 'violet') + '">' + U.esc(r._ruolo) + '</span>'; } },
        { k: '_legame', l: 'Collegato a', cell: function (r) { return r._link ? '<a href="' + r._link + '" style="text-decoration:none" class="small">' + U.esc(r._legame) + '</a>' : '<span class="small muted">' + U.esc(r._legame) + '</span>'; } },
        { k: 'ultimoAccesso', l: 'Ultimo accesso', cell: function (r) { return '<span class="tiny muted">' + U.esc(r.ultimoAccesso || '—') + '</span>'; }, sort: false },
        { k: 'attivo', l: 'Stato', cell: function (r) { return r.attivo ? UI.chip('attivo', 'ok', { dot: true }) : UI.chip('disattivato', 'err', { dot: true }); } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) {
          return '<div class="row wrap"><button type="button" class="btn btn-xs" data-azione="modifica-utente" data-id="' + r.id + '">' + UI.ic('edit') + ' Modifica</button>' +
            '<button type="button" class="btn btn-xs" data-azione="reset-password" data-id="' + r.id + '">' + UI.ic('lock') + '</button>' +
            (r.id === (window.STATE.utente && window.STATE.utente.id) ? '' : '<button type="button" class="btn btn-xs" data-azione="toggle-utente" data-id="' + r.id + '">' + (r.attivo ? 'Disattiva' : 'Attiva') + '</button>') + '</div>';
        } }
      ]
    });
    var attivi = DB.utenti.filter(function (u) { return u.attivo; }).length;
    var perRuolo = ['operatore', 'medico', 'ditta'].map(function (r) { return UI.chip(U.ruoloLabel(r) + ' ' + DB.utenti.filter(function (u) { return u.ruolo === r; }).length, r === 'operatore' ? 'info' : r === 'medico' ? 'ok' : 'violet'); }).join(' ');
    return {
      id: 'utenti', icona: 'lock', titolo: 'Utenti e ruoli', sotto: DB.utenti.length + ' account · ' + attivi + ' attivi · accessi separati per operatore, medico e azienda', fit: true,
      azioni: '<button type="button" class="btn btn-primary" data-azione="nuovo-utente">' + UI.ic('plus') + ' Nuovo utente</button>',
      corpo: '<div class="row wrap" style="margin-bottom:10px">' + perRuolo + '<span class="right small muted">Il medico vede le proprie aziende; l’azienda solo i propri dati.</span></div>' + tab
    };
  };

  function formUtente(u, preset) {
    preset = preset || {};
    var ruolo = u ? u.ruolo : (preset.ruolo || 'ditta');
    var medicoSel = u ? u.medicoId : (preset.medicoId || '');
    var dittaSel = u ? u.dittaId : (preset.dittaId || '');
    return '<form id="form-utente" data-form="salva-utente" class="col"><input type="hidden" name="id" value="' + (u ? u.id : '') + '"><div class="fgrid">' +
      UI.campo({ label: 'Nome e cognome', name: 'nome', value: u ? u.nome : (preset.nome || ''), req: true, full: true }) +
      UI.campo({ label: 'Email', name: 'email', type: 'email', value: u ? u.email : (preset.email || ''), req: true }) +
      UI.campo({ label: 'Username', name: 'username', value: u ? u.username : (preset.username || ''), req: true }) +
      UI.campo({ label: 'Password', name: 'password', value: u ? u.password : 'cls2026', req: true, help: 'Password demo: comunicarla all’utente.' }) +
      UI.campo({ label: 'Ruolo', name: 'ruolo', type: 'select', value: ruolo, options: [['operatore', 'Operatore CLS (tutto)'], ['medico', 'Medico competente (proprie aziende)'], ['ditta', 'Azienda cliente (solo la propria)']], req: true, attrs: 'data-azione="utente-ruolo"' }) +
      '<label class="check"><input type="checkbox" name="attivo" value="1" ' + (!u || u.attivo ? 'checked' : '') + '> <span>Account attivo</span></label>' +
      '<div class="full u-link" data-ruolo="medico" ' + (ruolo === 'medico' ? '' : 'hidden') + '>' +
      UI.campo({ label: 'Medico collegato', name: 'medicoId', type: 'select', value: medicoSel, options: [['', '— seleziona un medico —']].concat(DB.medici.map(function (m) { return [m.id, 'Dott. ' + m.nome]; })), req: false }) + '</div>' +
      '<div class="full u-link" data-ruolo="ditta" ' + (ruolo === 'ditta' ? '' : 'hidden') + '>' +
      UI.campo({ label: 'Azienda collegata', name: 'dittaId', type: 'select', value: dittaSel, options: [['', '— seleziona un’azienda —']].concat(DB.ditte.filter(function (d) { return !d.cessazione; }).map(function (d) { return [d.id, d.ragione]; })), req: false }) + '</div>' +
      '</div><div class="note info">' + UI.ic('shield') + ' Il ruolo determina menu e dati visibili. Un medico o un’azienda senza collegamento non possono accedere ai dati.</div></form>';
  }

  function apriNuovoUtente(preset) {
    UI.apriModale({
      titolo: 'Nuovo utente', size: 'lg', sotto: 'Crea l’accesso per un operatore, un medico o un’azienda cliente',
      corpo: formUtente(null, preset),
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-utente">' + UI.ic('save') + ' Crea utente</button>'
    });
  }

  AZIONI['nuovo-utente'] = function () { apriNuovoUtente(); };
  AZIONI['accesso-ditta'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    if (!d.id || U.ruolo() !== 'operatore') return;
    var u = DB.utenti.filter(function (x) { return x.dittaId === d.id; })[0];
    if (u) { AZIONI['modifica-utente']({ dataset: { id: u.id } }); return; }
    apriNuovoUtente({ ruolo: 'ditta', dittaId: d.id, nome: d.rappr || d.ragione, email: d.emailVisite || d.email, username: d.email ? d.email.split('@')[0] : '' });
  };
  AZIONI['accesso-medico'] = function (el) {
    var m = U.getMedico(el.dataset.id);
    if (!m.id || U.ruolo() !== 'operatore') return;
    var u = DB.utenti.filter(function (x) { return x.medicoId === m.id; })[0];
    if (u) { AZIONI['modifica-utente']({ dataset: { id: u.id } }); return; }
    apriNuovoUtente({ ruolo: 'medico', medicoId: m.id, nome: 'Dott. ' + m.nome, email: m.email, username: m.email ? m.email.split('@')[0] : '' });
  };
  AZIONI['modifica-utente'] = function (el) {
    var u = DB.utenti.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!u) return;
    UI.apriModale({
      titolo: 'Modifica utente', size: 'lg', sotto: U.esc(u.nome) + ' · ' + U.ruoloLabel(u.ruolo),
      corpo: formUtente(u),
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-utente">' + UI.ic('save') + ' Salva</button>'
    });
  };
  AZIONI['utente-ruolo'] = function (el) {
    var form = el.closest('form');
    if (!form) return;
    form.querySelectorAll('.u-link').forEach(function (box) {
      box.hidden = box.dataset.ruolo !== el.value;
      if (box.hidden) { var sel = box.querySelector('select'); if (sel) sel.value = ''; }
    });
  };
  AZIONI['salva-utente'] = function (form) {
    var fd = new FormData(form);
    var id = fd.get('id') || '';
    var nome = String(fd.get('nome') || '').trim();
    var email = String(fd.get('email') || '').trim();
    var username = String(fd.get('username') || '').trim().toLowerCase();
    var password = String(fd.get('password') || '');
    var ruolo = fd.get('ruolo');
    var medicoId = ruolo === 'medico' ? fd.get('medicoId') : '';
    var dittaId = ruolo === 'ditta' ? fd.get('dittaId') : '';
    if (!nome || !email || !username) { UI.toast('Nome, email e username sono obbligatori.', 'err'); return; }
    if (password.length < 6) { UI.toast('La password deve avere almeno 6 caratteri.', 'err'); return; }
    if (ruolo === 'medico' && !medicoId) { UI.toast('Seleziona il medico collegato all’account.', 'err'); return; }
    if (ruolo === 'ditta' && !dittaId) { UI.toast('Seleziona l’azienda collegata all’account.', 'err'); return; }
    if (DB.utenti.some(function (x) { return x.username.toLowerCase() === username && x.id !== id; })) { UI.toast('Username già in uso: scegline un altro.', 'err'); return; }
    if (id === (window.STATE.utente && window.STATE.utente.id) && ruolo !== 'operatore') { UI.toast('Non puoi togliere a te stesso il ruolo operatore.', 'err'); return; }
    var u = id ? DB.utenti.filter(function (x) { return x.id === id; })[0] : null;
    if (!u) {
      u = { id: 'u' + Date.now(), ultimoAccesso: '—' };
      DB.utenti.push(u);
    }
    u.nome = nome; u.email = email; u.username = username; u.password = password;
    u.ruolo = ruolo; u.medicoId = medicoId; u.dittaId = dittaId; u.attivo = fd.get('attivo') === '1';
    if (window.STATE.utente && window.STATE.utente.id === u.id) window.STATE.utente = u;
    UI.chiudiModale();
    RENDER();
    UI.toast('Utente ' + u.username + ' salvato come ' + U.ruoloLabel(u.ruolo) + '.', 'ok');
  };
  AZIONI['toggle-utente'] = function (el) {
    var u = DB.utenti.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!u) return;
    if (window.STATE.utente && u.id === window.STATE.utente.id) { UI.toast('Non puoi disattivare il tuo account.', 'err'); return; }
    u.attivo = !u.attivo;
    RENDER();
    UI.toast('Account ' + u.username + (u.attivo ? ' attivato.' : ' disattivato.'), u.attivo ? 'ok' : '');
  };
  AZIONI['reset-password'] = function (el) {
    var u = DB.utenti.filter(function (x) { return x.id === el.dataset.id; })[0];
    if (!u) return;
    UI.apriModale({
      titolo: 'Reimposta password', size: 'sm', sotto: U.esc(u.nome) + ' · ' + U.esc(u.username),
      corpo: '<form id="form-password" data-form="salva-password"><input type="hidden" name="id" value="' + u.id + '">' +
        UI.campo({ label: 'Nuova password', name: 'password', value: u.password, req: true, help: 'Minimo 6 caratteri.' }) +
        '<div class="note warn mt">In produzione la password va generata monouso e mai mostrata in chiaro.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-password">' + UI.ic('lock') + ' Reimposta</button>'
    });
  };
  AZIONI['salva-password'] = function (form) {
    var fd = new FormData(form);
    var u = DB.utenti.filter(function (x) { return x.id === fd.get('id'); })[0];
    if (!u) return;
    var p = String(fd.get('password') || '');
    if (p.length < 6) { UI.toast('La password deve avere almeno 6 caratteri.', 'err'); return; }
    u.password = p;
    UI.chiudiModale();
    RENDER();
    UI.toast('Password di ' + u.username + ' reimpostata.', 'ok');
  };
})();
