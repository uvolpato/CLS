/* =========================================================
   CLS · shell, login, routing, stato applicativo
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;

  var STATE = {
    utente: null,
    dt: {},
    filtri: {},
    tab: {},
    focus: null,
    agendaOffset: 0,
    visita: null,
    scroll: null,
    prevPage: null,
    currentPage: null,
    mobileOn: false
  };

  var NAV = [
    { gruppo: 'Operatività', area: 'operativita', voci: [
      { id: 'dashboard', label: 'Dashboard', icona: 'home', href: '#/dashboard' },
      { id: 'attivita', label: 'Attività', icona: 'inbox', href: '#/attivita' },
      { id: 'agenda', label: 'Agenda', icona: 'calendar', href: '#/agenda' },
      { id: 'pianifica', label: 'Pianificazione', icona: 'spark', href: '#/pianifica' },
      { id: 'scadenziario', label: 'Scadenziario', icona: 'clock', href: '#/scadenziario' },
      { id: 'consuntivo', label: 'Consuntivo', icona: 'euro', href: '#/consuntivo' }
    ] },
    { gruppo: 'Anagrafiche', area: 'anagrafiche', voci: [
      { id: 'ditte', label: 'Ditte', icona: 'building', href: '#/ditte' },
      { id: 'lavoratori', label: 'Lavoratori', icona: 'users', href: '#/lavoratori' },
      { id: 'medici', label: 'Medici', icona: 'stethoscope', href: '#/medici' },
      { id: 'mansioni', label: 'Mansioni e protocolli', icona: 'clipboard', href: '#/mansioni' }
    ] },
    { gruppo: 'Sorveglianza', area: 'sorveglianza', voci: [
      { id: 'visite', label: 'Visite mediche', icona: 'heart', href: '#/visite' },
      { id: 'esami', label: 'Esami', icona: 'activity', href: '#/esami' },
      { id: 'vaccinazioni', label: 'Vaccinazioni', icona: 'syringe', href: '#/vaccinazioni' },
      { id: 'sopralluoghi', label: 'Sopralluoghi', icona: 'pin', href: '#/sopralluoghi' },
      { id: 'corsi', label: 'Corsi e sicurezza', icona: 'grad', href: '#/corsi' }
    ] },
    { gruppo: 'Sistema', area: 'sistema', voci: [
      { id: 'documenti', label: 'Documenti e dispositivi', icona: 'file', href: '#/documenti' },
      { id: 'fatture', label: 'Fatture', icona: 'euro', href: '#/fatture' },
      { id: 'utenti', label: 'Utenti e ruoli', icona: 'lock', href: '#/utenti' },
      { id: 'mago', label: 'Sincronizzazione Mago', icona: 'database', href: '#/mago' },
      { id: 'report', label: 'Report', icona: 'grid', href: '#/report/generale' }
    ] }
  ];

  var AREE = [
    { id: 'operativita', nome: 'Operatività', icona: 'home', href: '#/dashboard' },
    { id: 'anagrafiche', nome: 'Anagrafiche', icona: 'building', href: '#/ditte' },
    { id: 'sorveglianza', nome: 'Sorveglianza', icona: 'heart', href: '#/visite' },
    { id: 'sistema', nome: 'Sistema', icona: 'settings', href: '#/documenti' }
  ];
  function areeVisibili() {
    return AREE.filter(function (a) {
      return NAV.some(function (g) { return g.area === a.id && g.voci.some(function (v) { return U.puoPagina(v.id); }); });
    });
  }

  function areaDi(id) {
    var m = {
      dashboard: 'operativita', attivita: 'operativita', agenda: 'operativita', pianifica: 'operativita', scadenziario: 'operativita', consuntivo: 'operativita',
      ditte: 'anagrafiche', lavoratori: 'anagrafiche', medici: 'anagrafiche', mansioni: 'anagrafiche',
      visite: 'sorveglianza', esami: 'sorveglianza', vaccinazioni: 'sorveglianza', sopralluoghi: 'sorveglianza', corsi: 'sorveglianza',
      documenti: 'sistema', fatture: 'sistema', utenti: 'sistema', mago: 'sistema', report: 'sistema'
    };
    return m[id] || 'operativita';
  }
  function areaById(id) {
    return AREE.filter(function (a) { return a.id === id; })[0] || AREE[0];
  }

  function scadenzeUrgenti() {
    return U.scadenzeVisibili().filter(function (s) { return !s.fissata && U.giorniA(s.data) <= 15; });
  }
  function conflitti() { return U.eventiVisibili().filter(function (e) { return e.conflitto; }); }
  function proposta() { return !!(window.PROPOSTA && window.PROPOSTA.attiva() && window.ATTIVITA); }

  function navHtml(attivo, area) {
    var urg = scadenzeUrgenti().length;
    return NAV.map(function (g) {
      var voci = g.voci.filter(function (v) { return U.puoPagina(v.id); });
      if (!voci.length) return '';
      return '<div class="nav-area ' + (g.area === area ? 'attiva' : '') + '" data-area="' + g.area + '"><div class="nav-group">' + g.gruppo + '</div>' + voci.map(function (v) {
        var badge = '';
        if (v.id === 'attivita' && window.ATTIVITA) {
          var nAtt = window.ATTIVITA.count();
          if (nAtt) badge = '<span class="count">' + nAtt + '</span>';
        }
        if (v.id === 'scadenziario' && urg && !proposta()) badge = '<span class="count">' + urg + '</span>';
        if (v.id === 'agenda' && conflitti().length) badge = '<span class="count">' + conflitti().length + '</span>';
        if (v.id === 'visite') badge = '<span class="count neutral">' + U.visiteVisibili().filter(function (x) { return x.stato === 'programmata'; }).length + '</span>';
        var label = v.id === 'documenti' && U.ruolo() !== 'operatore' ? 'Documenti' : v.label;
        return '<a href="' + v.href + '"' + (v.id === attivo ? ' aria-current="page"' : '') + '>' + UI.ic(v.icona) + '<span>' + label + '</span>' + badge + '</a>';
      }).join('') + '</div>';
    }).join('');
  }

  function menuUtente(area) {
    var u = STATE.utente;
    var nome = u ? u.nome : 'Utente';
    return '<div class="menu-utente" id="menu-utente" role="menu" aria-label="Aree e profilo" hidden>' +
      '<div class="menu-utente-head"><b>' + U.esc(nome) + '</b><span>' + U.esc(u ? U.ruoloLabel(u.ruolo) : '') + (u && u.email ? ' · ' + U.esc(u.email) : '') + '</span></div>' +
      '<div class="menu-utente-label">Aree</div>' +
      areeVisibili().map(function (a) {
        return '<a class="menu-utente-voce ' + (a.id === area ? 'attiva' : '') + '" role="menuitem" href="' + a.href + '" data-azione="chiudi-menu-utente">' +
          UI.ic(a.icona) + '<span>' + a.nome + '</span>' + (a.id === area ? '<span class="menu-spunta">' + UI.ic('check') + '</span>' : '') + '</a>';
      }).join('') +
      '<div class="menu-sep"></div>' +
      '<button type="button" class="menu-utente-voce" role="menuitem" data-azione="profilo-utente">' + UI.ic('user') + '<span>Il mio profilo</span></button>' +
      '<button type="button" class="menu-utente-voce" role="menuitem" data-azione="logout">' + UI.ic('logout') + '<span>Esci</span></button></div>';
  }

  function topbar(vista, prev) {
    var notif = proposta() ? window.ATTIVITA.count() : scadenzeUrgenti().length + conflitti().length;
    var crumb = prev && prev.hash ? '<a class="crumb-back" href="' + prev.hash + '" aria-label="Torna a ' + U.esc(prev.titolo) + '">' + UI.ic('left') + '<span>' + U.esc(prev.titolo) + '</span></a>' : '';
    return '<header class="topbar"><div class="page-title">' + crumb + '<h1>' + (vista.icona ? UI.ic(vista.icona) : '') + vista.titolo + '</h1>' + (vista.sotto ? '<p>' + vista.sotto + '</p>' : '') + '</div>' +
      '<div class="tools">' + (vista.azioni || '') +
      '<span class="divider" aria-hidden="true"></span>' +
      '<span class="today">' + UI.ic('calendar') + ' Oggi <b>' + U.fmtData(U.iso(window.OGGI)) + '</b></span>' +
      '<button type="button" class="icon-btn bell" data-azione="notifiche" aria-label="Notifiche (' + notif + ')">' + UI.ic('bell') + (notif ? '<span class="badge">' + notif + '</span>' : '') + '</button>' +
      '</div></header>';
  }

  function shell(vista, prev) {
    var area = areaDi(vista.id);
    return '<div class="app"><aside class="sidebar">' +
      '<div class="brand"><img class="brand-logo" src="assets/logo-cls-bianco.png" alt="CLS Salus"><div class="brand-text"><small>Medicina del lavoro</small></div></div>' +
      '<nav class="nav" aria-label="Navigazione principale">' + navHtml(vista.id, area) + '</nav>' +
      '<div class="side-foot"><b>Prototipo dimostrativo</b>Dati in memoria, nessuna persistenza. Le azioni di invio, firma e sincronizzazione sono simulate.' + (U.puoPagina('mago') ? '<br><a href="#/mago">Stato integrazione Mago →</a>' : '') + (U.ruolo() !== 'ditta' ? '<br><a href="anteprima-mobile.html" target="_blank" rel="noopener">App mobile del medico →</a>' : '') + '</div>' +
      '<div class="side-user-wrap">' + menuUtente(area) +
      '<button type="button" class="side-user" id="io-btn" data-azione="menu-utente" aria-haspopup="menu" aria-expanded="false"><div class="avatar">' + (STATE.utente ? U.iniziali(STATE.utente.nome) : 'AV') + '</div><div class="u"><b>' + (STATE.utente ? STATE.utente.nome : '') + '</b><small>' + (STATE.utente ? U.ruoloLabel(STATE.utente.ruolo) : '') + '</small></div>' + UI.ic('down') + '</button></div>' +
      '</aside><main class="main">' + topbar(vista, prev) + '<section class="view ' + (vista.fit ? 'fit' : '') + '" id="vista">' + vista.corpo + '</section></main></div>';
  }

  function loginHtml(err) {
    return '<div class="login"><div class="login-art"><div><div class="login-art-brand"><img class="login-logo" src="assets/logo-cls-bianco.png" alt="CLS Salus"><small>Medicina del lavoro</small></div>' +
      '<h1>La sorveglianza sanitaria, in un unico posto.</h1>' +
      '<p>Cartelle cliniche, visite, esami, scadenze e documenti. Dal paziente all\'azienda, con agenda condivisa e sincronizzazione contabile verso Mago.</p>' +
      '<div class="pills"><span class="pill">' + UI.ic('shield') + ' D.Lgs. 81/08</span><span class="pill">' + UI.ic('heart') + ' Cartella unica</span><span class="pill">' + UI.ic('calendar') + ' Agenda drag & drop</span><span class="pill">' + UI.ic('database') + ' API Mago</span></div></div>' +
      '<div class="foot">Prototipo dimostrativo · CLS S.r.l. · dati di esempio non reali</div></div>' +
      '<div class="login-form-wrap"><div class="login-card"><div class="who"><img class="login-card-logo" src="assets/favicon-cls.png" alt="CLS Salus"><div><h2>Accedi</h2><div class="sub">Gestione sorveglianza sanitaria</div></div></div>' +
      '<form data-form="login" novalidate><div class="col" style="gap:12px"><div><label class="fl" for="login-user">Username</label><input id="login-user" name="username" value="admin" autocomplete="username" required></div>' +
      '<div><label class="fl" for="login-pass">Password</label><input id="login-pass" name="password" type="password" value="cls2026" autocomplete="current-password" required></div>' +
      '<button type="submit" class="btn btn-primary">Entra ' + UI.ic('arrow') + '</button></div>' +
      '<div class="demo demo-utenti">' + UI.ic('users') + '<div class="grow"><b>Accessi demo</b>' +
      '<button type="button" class="demo-riga" data-azione="demo-login" data-u="admin" data-p="cls2026"><b>Operatore CLS</b><span>admin / cls2026</span></button>' +
      '<button type="button" class="demo-riga" data-azione="demo-login" data-u="m.mineo" data-p="medico2026"><b>Medico competente</b><span>m.mineo / medico2026</span></button>' +
      '<button type="button" class="demo-riga" data-azione="demo-login" data-u="metalpress" data-p="ditta2026"><b>Azienda cliente</b><span>metalpress / ditta2026</span></button>' +
      '</div></div>' +
      '<a class="demo-mobile" href="anteprima-mobile.html" target="_blank" rel="noopener">Apri l’app mobile del medico →</a>' +
      (err ? '<div class="err">' + err + '</div>' : '') +
      '</form></div></div></div>';
  }

  function risolvi(parti) {
    var p = parti[0] || 'dashboard';
    var id = parti[1] || '';
    if (p === 'dashboard') return { fn: VISTE.dashboard, args: [] };
    if (p === 'attivita') return { fn: VISTE.attivita, args: [] };
    if (p === 'agenda') return { fn: VISTE.agenda, args: [] };
    if (p === 'pianifica') return { fn: VISTE.pianifica, args: [] };
    if (p === 'scadenziario') return { fn: VISTE.scadenziario, args: [] };
    if (p === 'consuntivo') return { fn: VISTE.consuntivo, args: [] };
    if (p === 'fatture') return { fn: VISTE.fatture, args: [] };
    if (p === 'ditte') return id ? { fn: VISTE.ditta, args: [id] } : { fn: VISTE.ditte, args: [] };
    if (p === 'lavoratori') return id ? { fn: VISTE.lavoratore, args: [id] } : { fn: VISTE.lavoratori, args: [] };
    if (p === 'medici') return { fn: VISTE.medici, args: [] };
    if (p === 'mansioni') return { fn: VISTE.mansioni, args: [] };
    if (p === 'visite') return id === 'nuova' ? { fn: VISTE.visitaNuova, args: [parti[2]] } : { fn: VISTE.visite, args: [] };
    if (p === 'esami') return { fn: VISTE.esami, args: [] };
    if (p === 'vaccinazioni') return { fn: VISTE.vaccinazioni, args: [] };
    if (p === 'sopralluoghi') return { fn: VISTE.sopralluoghi, args: [] };
    if (p === 'corsi') return { fn: VISTE.corsi, args: [] };
    if (p === 'documenti') return { fn: VISTE.documenti, args: [] };
    if (p === 'utenti') return { fn: VISTE.utenti, args: [] };
    if (p === 'mago') return { fn: VISTE.mago, args: [] };
    if (p === 'report') {
      if (id === 'fatturazione') return { fn: VISTE.reportFatturazione, args: [] };
      if (id === 'note') return { fn: VISTE.reportNote, args: [] };
      return { fn: VISTE.reportGenerale, args: [] };
    }
    return { fn: VISTE.dashboard, args: [] };
  }

  function RENDER() {
    var app = document.getElementById('app');
    if (!STATE.utente) { app.innerHTML = loginHtml(STATE.loginErr || ''); return; }
    var hashNow = location.hash || '#/dashboard';
    if (STATE.currentPage && STATE.currentPage.hash !== hashNow) STATE.prevPage = STATE.currentPage;
    var prev = STATE.prevPage && STATE.prevPage.hash !== hashNow ? STATE.prevPage : null;
    var h = hashNow.replace(/^#\/?/, '');
    var parti = h.split('?')[0].split('/').filter(Boolean);
    var pagina = parti[0] || 'dashboard';
    if (!U.puoPagina(pagina)) {
      if (hashNow !== '#/dashboard') { location.hash = '#/dashboard'; return; }
    }
    var r = risolvi(parti);
    var mobile = !!(window.MOBILE && window.MOBILE.attivo());
    var vista;
    try {
      vista = r.fn.apply(null, r.args);
    } catch (err) {
      vista = { id: parti[0] || 'dashboard', titolo: 'Errore di visualizzazione', sotto: 'La vista non è stata caricata', corpo: '<div class="card"><div class="card-body"><div class="note warn"><strong>Errore:</strong> ' + U.esc(err.message) + '</div><pre class="small" style="white-space:pre-wrap;margin-top:10px">' + U.esc(err.stack || '') + '</pre></div></div>' };
      if (window.console) console.error(err);
    }
    if (mobile) {
      var mv = window.MOBILE.vista(parti);
      if (mv) vista = mv;
    }
    vista.id = vista.id || parti[0] || 'dashboard';
    var stessaPagina = !!(STATE.currentPage && STATE.currentPage.hash === hashNow);
    var scroll = stessaPagina ? salvaScroll() : [];
    app.innerHTML = mobile ? window.MOBILE.shell(vista, parti) : shell(vista, prev);
    STATE.mobileOn = mobile;
    STATE.currentPage = { hash: hashNow, titolo: vista.titolo || '', icona: vista.icona || '' };
    if (stessaPagina) { ripristinaScroll(scroll); mantieniFuoco(); }
    STATE.ultimoClick = null;
    if (STATE.focus) {
      var inp = document.querySelector('[data-azione="dt-cerca"][data-dt="' + STATE.focus.dt + '"]');
      if (inp) { inp.focus(); try { inp.setSelectionRange(STATE.focus.caret, STATE.focus.caret); } catch (e) { } }
      STATE.focus = null;
    }
    if (vista.dopo) setTimeout(vista.dopo, 0);
    window.scrollTo({ top: 0 });
  }

  /* ---------- regola di progetto: dopo un clic la pagina non salta ----------
     Ogni RENDER ridisegna la vista: qui ogni pannello ritrova il suo scroll
     (salvo se il suo data-key è cambiato, es. il dettaglio di un'altra riga),
     l'elemento cliccato torna a fuoco e la riga selezionata resta visibile nel suo pannello. */
  function percorso(el) {
    var p = [];
    while (el && el.id !== 'vista') { var i = 0, x = el; while ((x = x.previousElementSibling)) i++; p.unshift(i); el = el.parentElement; }
    return el ? p.join('.') : null;
  }
  function daPercorso(p) {
    var el = document.getElementById('vista');
    if (p) p.split('.').forEach(function (i) { if (el) el = el.children[Number(i)]; });
    return el;
  }
  function salvaScroll() {
    var v = document.getElementById('vista');
    if (!v) return [];
    return [v].concat([].slice.call(v.querySelectorAll('*'))).filter(function (el) { return el.scrollTop > 0 || el.scrollLeft > 0; }).map(function (el) {
      return { p: el === v ? '' : percorso(el), cls: el.className, key: el.getAttribute('data-key'), t: el.scrollTop, l: el.scrollLeft };
    });
  }
  function ripristinaScroll(lista) {
    lista.forEach(function (s) {
      var el = daPercorso(s.p);
      if (!el || el.className !== s.cls || el.getAttribute('data-key') !== s.key) return;
      el.scrollTop = s.t; el.scrollLeft = s.l;
    });
  }
  function mantieniFuoco() {
    var v = document.getElementById('vista');
    if (!v) return;
    var fermo = window.matchMedia('(min-width:1181px)').matches;
    var vt = v.scrollTop;
    var sel = v.querySelector('tr.selected, .it.sel, .day-chip.sel');
    if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    var c = STATE.ultimoClick, el = c ? v.querySelector(c) : null;
    if (el) {
      if (el.matches('button, a, input, select, textarea, [tabindex]')) el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
    if (fermo) v.scrollTop = vt;
  }
  // firma dell'elemento cliccato: azione + tutti i suoi data-*, per ritrovarlo dopo il ridisegno
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#vista [data-azione]');
    if (!b) return;
    STATE.ultimoClick = [].slice.call(b.attributes).filter(function (a) { return a.name.indexOf('data-') === 0; })
      .map(function (a) { return '[' + a.name + '="' + String(a.value).replace(/["\\]/g, '\\$&') + '"]'; }).join('');
  }, true);

  /* ---------- azioni di shell ---------- */
  // shortcut: credenziali e ruoli in memoria, nessuna autenticazione reale; sostituire con SSO e permessi.
  AZIONI.login = function (form) {
    var u = form.querySelector('[name="username"]').value.trim();
    var p = form.querySelector('[name="password"]').value;
    var trovato = DB.utenti.filter(function (x) { return x.username === u && x.password === p; })[0];
    if (trovato && trovato.attivo) {
      STATE.utente = trovato;
      trovato.ultimoAccesso = U.fmtData(window.OGGI) + ' ' + U.pad(new Date().getHours()) + ':' + U.pad(new Date().getMinutes());
      STATE.loginErr = '';
      STATE.prevPage = null;
      STATE.currentPage = null;
      STATE.agendaOffset = 0;
      STATE.agendaGiorno = null;
      location.hash = '#/dashboard';
      RENDER();
      UI.toast('Accesso effettuato come ' + U.ruoloLabel(trovato.ruolo) + '. Benvenuto, ' + trovato.nome.split(' ')[0] + '.', 'ok');
    } else {
      STATE.loginErr = trovato ? 'Account disattivato. Contatta l’amministratore CLS.' : 'Credenziali non valide. Usa uno degli accessi demo indicati.';
      RENDER();
    }
  };
  AZIONI['demo-login'] = function (el) {
    var form = document.querySelector('form[data-form="login"]');
    if (!form) return;
    form.querySelector('[name="username"]').value = el.dataset.u;
    form.querySelector('[name="password"]').value = el.dataset.p;
    form.querySelector('button[type="submit"]').focus();
  };
  AZIONI.logout = function () {
    STATE.utente = null;
    STATE.loginErr = '';
    STATE.prevPage = null;
    STATE.currentPage = null;
    STATE.agendaGiorno = null;
    location.hash = '';
    RENDER();
    UI.toast('Sessione chiusa.');
  };
  AZIONI['menu-utente'] = function () {
    var m = document.getElementById('menu-utente'), b = document.getElementById('io-btn');
    if (!m || !b) return;
    var apri = m.hidden;
    m.hidden = !apri;
    b.setAttribute('aria-expanded', apri ? 'true' : 'false');
    if (apri) {
      var first = m.querySelector('[role="menuitem"]');
      if (first) setTimeout(function () { first.focus(); }, 0);
    } else b.focus();
  };
  AZIONI['chiudi-menu-utente'] = function () {
    var m = document.getElementById('menu-utente'), b = document.getElementById('io-btn');
    if (m) m.hidden = true;
    if (b) b.setAttribute('aria-expanded', 'false');
  };
  AZIONI['profilo-utente'] = function () {
    AZIONI['chiudi-menu-utente']();
    var u = STATE.utente;
    if (!u) return;
    var legame = u.ruolo === 'medico' ? 'Dott. ' + U.nomeMedico(u.medicoId) : u.ruolo === 'ditta' ? U.nomeDitta(u.dittaId) : 'Sede CLS di Brescia';
    var pagine = NAV.reduce(function (n, g) { return n + g.voci.filter(function (v) { return U.puoPagina(v.id); }).length; }, 0);
    UI.apriModale({
      titolo: 'Il mio profilo', size: 'sm', sotto: U.ruoloLabel(u.ruolo),
      corpo: '<div class="row" style="margin-bottom:14px"><span class="avatar-md">' + U.esc(U.iniziali(u.nome)) + '</span><div><b style="font-size:15px">' + U.esc(u.nome) + '</b><div class="small muted">' + U.esc(U.ruoloLabel(u.ruolo)) + '</div></div></div>' +
        UI.kv([['Email', U.esc(u.email)], ['Account', U.esc(u.username)], ['Collegato a', U.esc(legame)], ['Ultimo accesso', U.esc(u.ultimoAccesso || '—')], ['Aree abilitate', String(pagine) + ' pagine']]) +
        '<div class="note info mt">I permessi dipendono dal ruolo. Un operatore CLS gestisce tutto; il medico vede solo le proprie aziende e la propria agenda; l’azienda vede solo i propri lavoratori e documenti.</div>',
      piede: '<button type="button" class="btn btn-primary right" data-azione="chiudi-modale">Chiudi</button>'
    });
  };
  AZIONI.notifiche = function () {
    if (proposta()) { STATE.tab.attivita = 'coda'; location.hash = '#/attivita'; return; }
    var urg = U.scadenzeVisibili().filter(function (s) { return !s.fissata && U.giorniA(s.data) <= 30; }).slice(0, 10);
    var conf = conflitti();
    var pend = DB.daPianificare.filter(function (p) { return U.puoLav({ id: p.lavoratoreId }); }).slice(0, 5);
    function riga(titolo, sotto, href, tone) {
      return '<li><span class="dot ' + tone + '"></span><div class="grow"><b>' + titolo + '</b><div class="small muted">' + sotto + '</div></div>' + (href ? '<a class="btn btn-xs" href="' + href + '" data-azione="chiudi-modale">Apri</a>' : '') + '</li>';
    }
    UI.apriModale({
      titolo: 'Notifiche operative', sotto: 'Scadenze, conflitti e attività da pianificare', size: 'lg',
      corpo: '<div class="col" style="gap:14px">' +
        '<div><div class="section-title"><h2>Scadenze aperte o entro 30 giorni</h2><span class="count">' + urg.length + '</span></div><ul class="lista-pulita" style="margin-top:6px;border:1px solid var(--border);border-radius:8px">' +
        (urg.length ? urg.map(function (s) { return riga(U.esc(s.cosa) + ' · ' + U.esc(s.soggetto), U.statoScadenza(s.data).label + ' · ' + U.esc(s.descrizione || ''), '#/scadenziario', U.statoScadenza(s.data).tone); }).join('') : '<li class="muted">Nessuna scadenza imminente.</li>') + '</ul></div>' +
        '<div><div class="section-title"><h2>Conflitti in agenda</h2><span class="count">' + conf.length + '</span></div><ul class="lista-pulita" style="margin-top:6px;border:1px solid var(--border);border-radius:8px">' +
        (conf.length ? conf.map(function (e) { return riga(U.esc(e.titolo) + ' — ' + U.fmtData(e.data) + ' ' + e.ora, 'Stesso medico e stesso orario: ' + U.esc(U.nomeMedico(e.medicoId)), '#/agenda', 'err'); }).join('') : '<li class="muted">Nessun conflitto rilevato.</li>') + '</ul></div>' +
        '<div><div class="section-title"><h2>Da pianificare</h2><span class="count">' + pend.length + '</span></div><ul class="lista-pulita" style="margin-top:6px;border:1px solid var(--border);border-radius:8px">' +
        (pend.length ? pend.map(function (p) { var l = U.getLav(p.lavoratoreId); return riga(U.esc(U.nomeLav(l)), p.motivo + ' · ' + U.nomeDitta(l.dittaId), '#/agenda', p.urgenza === 'alta' ? 'err' : 'warn'); }).join('') : '<li class="muted">Tutto pianificato.</li>') + '</ul></div>' +
        '</div>'
    });
  };
  AZIONI.vai = function (el) { location.hash = el.dataset.vai; };

  /* ---------- delega eventi ---------- */
  document.addEventListener('change', function (e) {
    var el = e.target.closest('select[data-azione], input[type="date"][data-azione]');
    if (el && AZIONI[el.dataset.azione]) AZIONI[el.dataset.azione](el, e);
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('form[data-form]');
    if (!f) return;
    e.preventDefault();
    var a = AZIONI[f.dataset.form];
    if (a) a(f, e);
  });
  document.addEventListener('click', function (e) {
    var m = document.getElementById('menu-utente');
    if (!m || m.hidden) return;
    if (e.target.closest('#menu-utente') || e.target.closest('#io-btn')) return;
    m.hidden = true;
    var b = document.getElementById('io-btn');
    if (b) b.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var m = document.getElementById('menu-utente');
      if (m && !m.hidden) {
        m.hidden = true;
        var b = document.getElementById('io-btn');
        if (b) { b.setAttribute('aria-expanded', 'false'); b.focus(); }
        return;
      }
      var d = document.getElementById('dlg');
      if (d && d.open) d.close();
    }
  });

  /* drag & drop agenda */
  document.addEventListener('dragstart', function (e) {
    var el = e.target.closest('[data-evento]');
    if (!el) return;
    e.dataTransfer.setData('text/plain', el.dataset.evento);
    e.dataTransfer.effectAllowed = 'move';
    el.classList.add('dragging');
  });
  document.addEventListener('dragend', function (e) {
    var el = e.target.closest('[data-evento]');
    if (el) el.classList.remove('dragging');
    document.querySelectorAll('.agd-cell.over,.agd-block.over,.ag-cell.over').forEach(function (c) { c.classList.remove('over'); });
  });
  function dropZone(target) {
    var block = target.closest('.agd-block');
    if (block) return { block: block };
    var cell = target.closest('.agd-cell, .ag-cell');
    return cell ? { cell: cell } : null;
  }
  document.addEventListener('dragover', function (e) {
    var zone = dropZone(e.target);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    var el = zone.block || zone.cell;
    document.querySelectorAll('.agd-cell.over,.agd-block.over,.ag-cell.over').forEach(function (c) { if (c !== el) c.classList.remove('over'); });
    el.classList.add('over');
  });
  document.addEventListener('dragleave', function (e) {
    var zone = dropZone(e.target);
    if (!zone) return;
    var el = zone.block || zone.cell;
    if (!el.contains(e.relatedTarget)) el.classList.remove('over');
  });
  document.addEventListener('drop', function (e) {
    var zone = dropZone(e.target);
    if (!zone) return;
    e.preventDefault();
    var el = zone.block || zone.cell;
    el.classList.remove('over');
    var id = e.dataTransfer.getData('text/plain');
    if (!id || !AZIONI['sposta-evento']) return;
    if (zone.block) AZIONI['sposta-evento']({ dataset: { evento: id, blocco: zone.block.dataset.blocco } });
    else AZIONI['sposta-evento']({ dataset: { evento: id, giorno: zone.cell.dataset.giorno, ora: zone.cell.dataset.ora, medico: zone.cell.dataset.medico } });
  });

  window.STATE = STATE;
  window.RENDER = RENDER;
  window.VISTE = window.VISTE || {};

  // shortcut: accesso automatico per l'anteprima (?demo=medico|ditta|operatore), solo prototipo
  (function autoDemo() {
    var demo;
    try { demo = new URLSearchParams(location.search).get('demo'); } catch (e) { return; }
    var utente = { medico: 'm.mineo', ditta: 'metalpress', operatore: 'admin' }[demo];
    if (!utente) return;
    var trovato = DB.utenti.filter(function (x) { return x.username === utente && x.attivo; })[0];
    if (!trovato) return;
    STATE.utente = trovato;
    if (!location.hash) location.hash = '#/dashboard';
  })();

  window.addEventListener('hashchange', function () { STATE.focus = null; UI.chiudiModale(); RENDER(); });

  // PWA: su HTTP(S) rende l'app installabile e avviabile a tutto schermo; su file:// non si registra.
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(function () { });
  }
  RENDER();
})();
