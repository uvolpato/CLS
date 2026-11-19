/* =========================================================
   CLS · anagrafiche: ditte, lavoratori, medici, mansioni
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};

  /* ---------- form ---------- */
  function optDitte(sel) {
    return [['', '— seleziona una ditta —']].concat(DB.ditte.filter(function (d) { return !d.cessazione || d.id === sel; }).map(function (d) { return [d.id, d.ragione]; }));
  }
  function optMedici(sel) {
    return [['', '— seleziona un medico —']].concat(DB.medici.map(function (m) { return [m.id, 'Dott. ' + m.nome]; }));
  }

  function formDitta(d) {
    d = d || {};
    return '<form id="form-ditta" data-form="salva-ditta" class="col" style="gap:14px"><input type="hidden" name="id" value="' + (d.id || '') + '">' +
      '<fieldset class="wfieldset"><legend>Dati fiscali</legend><div class="fgrid">' +
      UI.campo({ label: 'Ragione sociale', name: 'ragione', value: d.ragione, req: true, full: true }) +
      UI.campo({ label: 'Partita IVA', name: 'piva', value: d.piva }) + UI.campo({ label: 'Codice fiscale', name: 'cf', value: d.cf }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Sede legale</legend><div class="fgrid">' +
      UI.campo({ label: 'Indirizzo', name: 'legIndirizzo', value: d.legIndirizzo || d.indirizzo, full: true }) +
      UI.campo({ label: 'Comune', name: 'legCitta', value: d.legCitta || d.citta }) + UI.campo({ label: 'Provincia', name: 'legProv', value: d.legProv || d.prov, attrs: 'maxlength="2"' }) +
      UI.campo({ label: 'CAP', name: 'legCap', value: d.legCap || d.cap }) + UI.campo({ label: 'PEC', name: 'pec', value: d.pec, type: 'email' }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Sede operativa e contatti</legend><div class="fgrid">' +
      UI.campo({ label: 'Indirizzo', name: 'indirizzo', value: d.indirizzo, full: true }) +
      UI.campo({ label: 'Comune', name: 'citta', value: d.citta }) + UI.campo({ label: 'Provincia', name: 'prov', value: d.prov, attrs: 'maxlength="2"' }) +
      UI.campo({ label: 'CAP', name: 'cap', value: d.cap }) + UI.campo({ label: 'Telefono', name: 'tel', value: d.tel }) +
      UI.campo({ label: 'Cellulare', name: 'cellulare', value: d.cellulare || '' }) + UI.campo({ label: 'Email', name: 'email', value: d.email, type: 'email' }) +
      UI.campo({ label: 'Email per visite', name: 'emailVisite', value: d.emailVisite, type: 'email', help: 'Destinatario delle comunicazioni di scadenza.' }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Attività e medico</legend><div class="fgrid">' +
      UI.campo({ label: 'Attività prevalente', name: 'attivita', value: d.attivita }) + UI.campo({ label: 'Codice ATECO', name: 'ateco', value: d.ateco }) +
      UI.campo({ label: 'RSPP', name: 'rspp', value: d.rspp }) + UI.campo({ label: 'Rappresentante legale', name: 'rappr', value: d.rappr }) +
      UI.campo({ label: 'Medico competente', name: 'medicoId', type: 'select', value: d.medicoId, options: optMedici(d.medicoId), req: true }) +
      UI.campo({ label: 'Ruolo del medico', name: 'ruolo', type: 'select', value: d.ruolo || 'Medico Competente Unico', options: ['Medico Competente Unico', 'Medico Competente Coordinato', 'Medico Coordinatore'] }) +
      UI.campo({ label: 'Data acquisizione', name: 'acquisizione', type: 'date', value: d.acquisizione }) +
      UI.campo({ label: 'Data cessazione', name: 'cessazione', type: 'date', value: d.cessazione, help: 'Se valorizzata la ditta passa tra le cessate.' }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Note e opzioni</legend>' +
      UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: d.note, full: true, rows: 2 }) +
      '<div class="row wrap" style="gap:18px">' +
      UI.campo({ label: 'Newsletter', name: 'newsletter', type: 'checkbox', value: d.newsletter }) +
      UI.campo({ label: 'Riunioni periodiche (per report fatturazione)', name: 'riunioni', type: 'checkbox', value: d.riunioni }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Visite e pianificazione</legend><div class="fgrid">' +
      UI.campo({ label: 'Dove si fanno le visite', name: 'modalitaVisite', type: 'select', value: d.modalitaVisite || 'indifferente', options: [['indifferente', 'Indifferente'], ['loco', 'Presso il cliente'], ['sede', 'In studio CLS']] }) +
      UI.campo({ label: 'Chi sceglie la data', name: 'prenotazione', type: 'select', value: d.prenotazione || 'studio', options: [['studio', 'Lo studio fissa la data'], ['cliente', 'Il cliente sceglie tra le proposte']] }) +
      UI.campo({ label: 'Note per la pianificazione', name: 'notePianificazione', value: d.notePianificazione || '', full: true, help: 'Es. solo al mattino, chiusi il lunedì, turni.' }) +
      '</div><div class="row wrap" style="gap:18px">' +
      UI.campo({ label: 'Visita in loco obbligatoria (i lavoratori non possono spostarsi)', name: 'locoObbligatoria', type: 'checkbox', value: d.locoObbligatoria }) +
      '</div></fieldset></form>';
  }

  function formLavoratore(l, dittaId) {
    l = l || {};
    return '<form id="form-lavoratore" data-form="salva-lavoratore" class="col" style="gap:14px"><input type="hidden" name="id" value="' + (l.id || '') + '">' +
      '<fieldset class="wfieldset"><legend>Dati personali</legend><div class="fgrid">' +
      UI.campo({ label: 'Cognome', name: 'cognome', value: l.cognome, req: true }) + UI.campo({ label: 'Nome', name: 'nome', value: l.nome, req: true }) +
      UI.campo({ label: 'Sesso', name: 'sesso', type: 'select', value: l.sesso || 'M', options: [['M', 'Maschile'], ['F', 'Femminile']], req: true }) +
      UI.campo({ label: 'Data di nascita', name: 'nascita', type: 'date', value: l.nascita, req: true }) +
      UI.campo({ label: 'Luogo di nascita', name: 'luogoNascita', value: l.luogoNascita }) + UI.campo({ label: 'Nazionalità', name: 'nazionalita', value: l.nazionalita || 'Italiana' }) +
      UI.campo({ label: 'Codice fiscale', name: 'cf', value: l.cf }) +
      UI.campo({ label: 'Residenza', name: 'residenza', value: l.residenza, full: true }) +
      UI.campo({ label: 'Comune', name: 'comune', value: l.comune }) + UI.campo({ label: 'Provincia', name: 'prov', value: l.prov, attrs: 'maxlength="2"' }) +
      UI.campo({ label: 'CAP', name: 'cap', value: l.cap }) + UI.campo({ label: 'Telefono', name: 'tel', value: l.tel }) +
      UI.campo({ label: 'Email', name: 'email', value: l.email, type: 'email', full: true }) +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Dati professionali</legend><div class="fgrid">' +
      UI.campo({ label: 'Ditta', name: 'dittaId', type: 'select', value: l.dittaId || dittaId || '', options: optDitte(l.dittaId || dittaId), req: true }) +
      UI.campo({ label: 'Mansione', name: 'mansioneId', type: 'select', value: l.mansioneId || '', options: [['', '— seleziona —']].concat(DB.mansioni.map(function (m) { return [m.id, m.nome]; })), req: true }) +
      UI.campo({ label: 'Data assunzione', name: 'assunzione', type: 'date', value: l.assunzione }) + UI.campo({ label: 'Data risoluzione', name: 'risoluzione', type: 'date', value: l.risoluzione, help: 'Se valorizzata il lavoratore è dimesso.' }) +
      UI.campo({ label: 'Sede di lavoro', name: 'sede', value: l.sede }) + UI.campo({ label: 'Matricola', name: 'matricola', value: l.matricola }) +
      UI.campo({ label: 'Rapporto di lavoro', name: 'rapporto', type: 'select', value: l.rapporto || 'Tempo indeterminato', options: ['Tempo indeterminato', 'Tempo determinato', 'Co.co.pro.', 'Interinale', 'Libero professionista', 'A contratto', 'Frequentante volontario', 'Borsista', 'Tirocinante', 'Lavoro a chiamata'] }) +
      UI.campo({ label: 'Orario', name: 'orario', type: 'select', value: l.orario || 'Tempo pieno', options: ['Tempo pieno', 'Part time', 'Turnista diurno', 'Turnista notturno', 'Turnista diurno e notturno'] }) +
      UI.campo({ label: 'Lavoratore storico', name: 'storicoId', type: 'select', value: l.storicoId || '', options: [['', 'Scegli dimesso (nessuno)']], full: true, help: 'Collega la nuova assunzione alla cartella precedente, se presente.' }) +
      UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: l.note, full: true, rows: 2 }) +
      '<div class="row wrap" style="gap:18px">' + UI.campo({ label: 'Soggetto a sorveglianza sanitaria', name: 'sorveglianza', type: 'checkbox', value: l.sorveglianza == null ? true : l.sorveglianza }) + '</div>' +
      '</div></fieldset>' +
      '<fieldset class="wfieldset"><legend>Medico curante</legend><div class="fgrid">' +
      UI.campo({ label: 'Nome e cognome', name: 'medicoCurante', value: l.medicoCurante, full: true }) +
      '</div></fieldset></form>';
  }

  function formMedico(m) {
    m = m || {};
    return '<form id="form-medico" data-form="salva-medico" class="col"><div class="fgrid">' +
      '<input type="hidden" name="id" value="' + (m.id || '') + '">' +
      UI.campo({ label: 'Nome completo', name: 'nome', value: m.nome, req: true, full: true }) +
      UI.campo({ label: 'Data di nascita', name: 'nascita', type: 'date', value: m.nascita }) + UI.campo({ label: 'Codice fiscale', name: 'cf', value: m.cf }) +
      UI.campo({ label: 'Partita IVA', name: 'piva', value: m.piva || '' }) + UI.campo({ label: 'Comune', name: 'comune', value: m.comune }) +
      UI.campo({ label: 'Provincia', name: 'prov', value: m.prov, attrs: 'maxlength="2"' }) + UI.campo({ label: 'Telefono', name: 'tel', value: m.tel }) +
      UI.campo({ label: 'Email', name: 'email', value: m.email, type: 'email', full: true }) +
      UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: m.note || '', full: true, rows: 2 }) +
      '<div class="full">' + UI.campo({ label: 'Firma digitale caricata e attiva sui giudizi', name: 'firma', type: 'checkbox', value: m.firma }) + '</div>' +
      '</div></form>';
  }

  function parseAccertamenti(testo) {
    return String(testo || '').split('\n').map(function (r) { return r.split('|').map(function (x) { return x.trim(); }); }).filter(function (a) { return a[0]; }).map(function (a) { return [a[0], a[1] || '']; });
  }

  function formMansione(m) {
    m = m || {};
    return '<form id="form-mansione" data-form="salva-mansione" class="col"><div class="fgrid">' +
      '<input type="hidden" name="id" value="' + (m.id || '') + '">' +
      UI.campo({ label: 'Nome mansione', name: 'nome', value: m.nome, req: true, full: true }) +
      UI.campo({ label: 'Periodo visita (mesi)', name: 'periodo', type: 'number', value: m.periodo || 24, req: true }) +
      UI.campo({ label: 'Rischi (separati da virgola)', name: 'rischi', value: (m.rischi || []).join(', '), full: true }) +
      UI.campo({ label: 'Accertamenti e periodicità', name: 'accertamenti', type: 'textarea', rows: 7, full: true, value: (m.accertamenti || []).map(function (a) { return a[0] + ' | ' + a[1]; }).join('\n'), help: 'Una voce per riga nel formato <b>ACCERTAMENTO | periodicità</b>. Periodicità in mesi oppure AB / IB / O.' }) +
      UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: m.note || '', full: true, rows: 2 }) +
      '</div></form>';
  }

  /* ---------- azioni anagrafiche ---------- */
  AZIONI['nuova-ditta'] = function () {
    if (U.ruolo() !== 'operatore') { UI.toast('Le anagrafiche si gestiscono dalla segreteria CLS.', 'err'); return; }
    UI.apriModale({ titolo: 'Nuova ditta', size: 'lg', sotto: 'Anagrafica, sede e medico competente', corpo: formDitta({}), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-ditta">' + UI.ic('save') + ' Salva ditta</button>' });
  };
  AZIONI['modifica-ditta'] = function (el) {
    var d = U.getDitta(el.dataset.id);
    UI.apriModale({ titolo: 'Modifica ditta', size: 'lg', sotto: U.esc(d.ragione), corpo: formDitta(d), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-ditta">' + UI.ic('save') + ' Salva modifiche</button>' });
  };
  AZIONI['salva-ditta'] = function (form) {
    var fd = new FormData(form);
    var id = fd.get('id');
    var obj = {
      ragione: fd.get('ragione'), piva: fd.get('piva'), cf: fd.get('cf'),
      legIndirizzo: fd.get('legIndirizzo'), legCitta: fd.get('legCitta'), legProv: fd.get('legProv'), legCap: fd.get('legCap'),
      indirizzo: fd.get('indirizzo'), citta: fd.get('citta'), prov: fd.get('prov'), cap: fd.get('cap'),
      tel: fd.get('tel'), cellulare: fd.get('cellulare'), email: fd.get('email'), pec: fd.get('pec'), emailVisite: fd.get('emailVisite'),
      attivita: fd.get('attivita'), ateco: fd.get('ateco'), rspp: fd.get('rspp'), rappr: fd.get('rappr'),
      medicoId: fd.get('medicoId'), ruolo: fd.get('ruolo'), acquisizione: fd.get('acquisizione'), cessazione: fd.get('cessazione'),
      note: fd.get('note'), newsletter: fd.get('newsletter') === '1', riunioni: fd.get('riunioni') === '1', modalitaVisite: fd.get('modalitaVisite') || 'indifferente', prenotazione: fd.get('prenotazione') || 'studio', notePianificazione: fd.get('notePianificazione') || '', locoObbligatoria: fd.get('locoObbligatoria') === '1'
    };
    var nuova = false;
    var d = id ? U.getDitta(id) : null;
    if (d && d.id) Object.assign(d, obj);
    else {
      obj.id = 'd' + (DB.ditte.length + 1);
      obj.mansioni = [];
      obj.protocolli = {};
      DB.ditte.push(obj);
      nuova = true;
    }
    UI.chiudiModale();
    UI.toast(nuova ? 'Ditta creata correttamente.' : 'Anagrafica ditta aggiornata.', 'ok');
    if (nuova) location.hash = '#/ditte/' + obj.id;
    RENDER();
  };

  AZIONI['nuovo-lavoratore'] = function (el) {
    if (U.ruolo() !== 'operatore') { UI.toast('Le anagrafiche si gestiscono dalla segreteria CLS.', 'err'); return; }
    UI.apriModale({ titolo: 'Nuovo lavoratore', size: 'lg', sotto: 'Dati personali, professionali e sorveglianza', corpo: formLavoratore({}, el.dataset.ditta), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-lavoratore">' + UI.ic('save') + ' Salva lavoratore</button>' });
  };
  AZIONI['modifica-lavoratore'] = function (el) {
    var l = U.getLav(el.dataset.id);
    UI.apriModale({ titolo: 'Modifica lavoratore', size: 'lg', sotto: U.esc(U.nomeLav(l)), corpo: formLavoratore(l), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-lavoratore">' + UI.ic('save') + ' Salva modifiche</button>' });
  };
  AZIONI['salva-lavoratore'] = function (form) {
    var fd = new FormData(form);
    var id = fd.get('id');
    var obj = {
      cognome: fd.get('cognome'), nome: fd.get('nome'), sesso: fd.get('sesso'), nascita: fd.get('nascita'), luogoNascita: fd.get('luogoNascita'),
      nazionalita: fd.get('nazionalita'), cf: fd.get('cf'), residenza: fd.get('residenza'), comune: fd.get('comune'), prov: fd.get('prov'), cap: fd.get('cap'),
      tel: fd.get('tel'), email: fd.get('email'), dittaId: fd.get('dittaId'), mansioneId: fd.get('mansioneId'),
      assunzione: fd.get('assunzione'), risoluzione: fd.get('risoluzione'), sede: fd.get('sede'), matricola: fd.get('matricola'),
      rapporto: fd.get('rapporto'), orario: fd.get('orario'), storicoId: fd.get('storicoId'), note: fd.get('note'),
      sorveglianza: fd.get('sorveglianza') === '1', medicoCurante: fd.get('medicoCurante')
    };
    var nuova = false, l = id ? U.getLav(id) : null;
    if (l && l.id) Object.assign(l, obj);
    else { obj.id = 'l' + (DB.lavoratori.length + 1); DB.lavoratori.push(obj); nuova = true; }
    UI.chiudiModale();
    UI.toast(nuova ? 'Lavoratore creato correttamente.' : 'Anagrafica lavoratore aggiornata.', 'ok');
    if (nuova) location.hash = '#/lavoratori/' + obj.id;
    RENDER();
  };

  AZIONI['nuovo-medico'] = function () {
    UI.apriModale({ titolo: 'Nuovo medico', size: 'lg', corpo: formMedico({}), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-medico">' + UI.ic('save') + ' Salva medico</button>' });
  };
  AZIONI['modifica-medico'] = function (el) {
    var m = U.getMedico(el.dataset.id);
    UI.apriModale({ titolo: 'Modifica medico', size: 'lg', sotto: U.esc(m.nome), corpo: formMedico(m), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-medico">' + UI.ic('save') + ' Salva modifiche</button>' });
  };
  AZIONI['salva-medico'] = function (form) {
    var fd = new FormData(form), id = fd.get('id');
    var obj = { nome: fd.get('nome'), nascita: fd.get('nascita'), cf: fd.get('cf'), piva: fd.get('piva'), comune: fd.get('comune'), prov: fd.get('prov'), tel: fd.get('tel'), email: fd.get('email'), note: fd.get('note'), firma: fd.get('firma') === '1' };
    var m = id ? U.getMedico(id) : null;
    if (m && m.id) Object.assign(m, obj);
    else { obj.id = 'm' + (DB.medici.length + 1); DB.medici.push(obj); }
    UI.chiudiModale(); RENDER(); UI.toast('Anagrafica medico salvata.', 'ok');
  };

  AZIONI['nuova-mansione'] = function () {
    UI.apriModale({ titolo: 'Nuova mansione e protocollo', size: 'lg', corpo: formMansione({ periodo: 24 }), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-mansione">' + UI.ic('save') + ' Salva mansione</button>' });
  };
  AZIONI['modifica-mansione'] = function (el) {
    var m = U.getMansione(el.dataset.id);
    UI.apriModale({ titolo: 'Modifica mansione', size: 'lg', sotto: U.esc(m.nome), corpo: formMansione(m), piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-mansione">' + UI.ic('save') + ' Salva modifiche</button>' });
  };
  AZIONI['salva-mansione'] = function (form) {
    var fd = new FormData(form), id = fd.get('id');
    var obj = { nome: fd.get('nome'), periodo: Number(fd.get('periodo')) || 24, rischi: String(fd.get('rischi') || '').split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean), accertamenti: parseAccertamenti(fd.get('accertamenti')), note: fd.get('note') };
    var m = id ? U.getMansione(id) : null;
    if (m && m.id) Object.assign(m, obj);
    else { obj.id = 'mn' + (DB.mansioni.length + 1); DB.mansioni.push(obj); }
    UI.chiudiModale(); RENDER(); UI.toast('Mansione e protocollo salvati.', 'ok');
  };

  AZIONI['protocollo-mansione'] = function (el) {
    var d = el.dataset.ditta ? U.getDitta(el.dataset.ditta) : null;
    var m = d ? U.mansioneInDitta(d, el.dataset.mansione) : U.getMansione(el.dataset.mansione);
    var lav = d ? U.lavoratoriDitta(d.id).filter(function (l) { return l.mansioneId === m.id; }) : DB.lavoratori.filter(function (l) { return l.mansioneId === m.id; });
    var corpo = '<div class="note info mb">' + UI.ic('clipboard') + ' Il protocollo genera le righe esame della visita e le scadenze degli accertamenti con periodicità numerica o <b>O</b>.</div>' +
      '<div class="table-box"><table class="table-mini"><thead><tr><th>Accertamento</th><th>Periodicità</th><th>Genera esame</th></tr></thead><tbody>' +
      (m.accertamenti || []).map(function (a) { return '<tr><td><b>' + U.esc(a[0]) + '</b></td><td class="mono">' + (a[1] || '—') + '</td><td>' + (/^\d+$/.test(a[1]) || a[1] === 'O' ? UI.chip('Sì', 'ok') : UI.chip('No', 'plain')) + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<div class="fgrid mt"><div><div class="eyebrow">Periodo visita</div><div class="strong">' + m.periodo + ' mesi</div></div><div><div class="eyebrow">Lavoratori coinvolti</div><div class="strong">' + lav.length + '</div></div></div>' +
      (m.rischi && m.rischi.length ? '<div class="mt"><div class="eyebrow mb">Rischi</div><div class="row wrap">' + m.rischi.map(function (r) { return '<span class="chip plain">' + U.esc(r) + '</span>'; }).join('') + '</div></div>' : '');
    UI.apriModale({
      titolo: U.esc(m.nome), sotto: d ? 'Protocollo applicato a ' + d.ragione : 'Mansione template', size: 'lg', corpo: corpo,
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button>' + (d ? '<button type="button" class="btn right" data-azione="personalizza-protocollo" data-ditta="' + d.id + '" data-mansione="' + m.id + '">' + UI.ic('edit') + ' Personalizza in ditta</button>' : '<button type="button" class="btn btn-primary right" data-azione="modifica-mansione" data-id="' + m.id + '">' + UI.ic('edit') + ' Modifica mansione</button>')
    });
  };

  AZIONI['personalizza-protocollo'] = function (el) {
    var d = U.getDitta(el.dataset.ditta), m = U.mansioneInDitta(d, el.dataset.mansione), base = U.getMansione(el.dataset.mansione);
    var corpo = '<form id="form-protocollo" data-form="salva-protocollo" class="col"><input type="hidden" name="dittaId" value="' + d.id + '"><input type="hidden" name="mansioneId" value="' + base.id + '">' +
      '<div class="note info">' + UI.ic('building') + ' Modifica della mansione <b>' + U.esc(base.nome) + '</b> per <b>' + U.esc(d.ragione) + '</b>. La modifica non tocca il catalogo generale.</div>' +
      '<div class="fgrid">' + UI.campo({ label: 'Rischi in ditta (separati da virgola)', name: 'rischi', value: (m.rischi || []).join(', '), full: true }) +
      UI.campo({ label: 'Periodo visita (mesi)', name: 'periodo', type: 'number', value: m.periodo }) +
      UI.campo({ label: 'Note', name: 'note', value: m.note || '' }) + '</div>' +
      '<div class="form-help">Accertamenti del protocollo: modificabili dal catalogo generale.</div></form>';
    UI.apriModale({ titolo: 'Personalizza mansione in ditta', size: 'lg', corpo: corpo, piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-protocollo">' + UI.ic('save') + ' Salva in ditta</button>' });
  };

  AZIONI['salva-protocollo'] = function (form) {
    var fd = new FormData(form), d = U.getDitta(fd.get('dittaId'));
    d.protocolli = d.protocolli || {};
    d.protocolli[fd.get('mansioneId')] = {
      rischi: String(fd.get('rischi') || '').split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean),
      periodo: Number(fd.get('periodo')) || 24, note: fd.get('note')
    };
    UI.chiudiModale(); RENDER(); UI.toast('Protocollo personalizzato per la ditta.', 'ok');
  };

  /* ---------- documenti ---------- */
  AZIONI['apri-documento'] = function (el) {
    var doc = DB.documenti.find(function (x) { return x.id === el.dataset.id; });
    if (!doc) return;
    var d = U.getDitta(doc.dittaId);
    if (doc.tipo === 'Giudizio di idoneità' && doc.visitaId) {
      var v = DB.visite.find(function (x) { return x.id === doc.visitaId; });
      if (v) { UI.stampa('Certificato di idoneità · ' + doc.soggetto, UI.certificato(v), doc.stato + ' · ' + U.fmtData(doc.dataDoc)); return; }
    }
    if (doc.tipo === 'Verbale sopralluogo') {
      var so = DB.sopralluoghi.find(function (x) { return x.dittaId === doc.dittaId && x.data === doc.dataDoc; });
      if (so) { AZIONI['stampa-sopralluogo']({ dataset: { id: so.id } }); return; }
    }
    if (/Cartella sanitaria|Referto strumentale/.test(doc.tipo)) {
      UI.apriModale({
        titolo: U.esc(doc.tipo), size: 'sm', sotto: U.esc(doc.soggetto) + ' · ' + U.fmtData(doc.dataDoc),
        corpo: '<div class="note info">' + UI.ic('file') + ' Documento archiviato nel fascicolo del lavoratore. Apri la cartella per consultare visite, esami e referti collegati.</div>',
        piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button>' + (doc.lavoratoreId ? '<a class="btn right" href="#/lavoratori/' + doc.lavoratoreId + '" data-azione="chiudi-modale">Apri cartella</a>' : '')
      });
      return;
    }
    UI.stampa(doc.tipo + ' · ' + d.ragione, UI.certificatoDitta(doc.tipo, d, doc.anno), (doc.stato || '') + ' · ' + U.fmtData(doc.dataDoc));
  };

  AZIONI['stampa-cartella'] = function (el) {
    var l = U.getLav(el.dataset.id), vs = U.visiteLav(l.id).filter(function (v) { return v.stato === 'eseguita'; });
    var corpo = '<div class="note info mb">' + UI.ic('file') + ' Seleziona le visite da includere nella cartella sanitaria. La stampa viene registrata nell’archivio documenti.</div>' +
      '<form id="form-cartella" data-form="genera-cartella"><input type="hidden" name="lavoratoreId" value="' + l.id + '"><div class="table-box"><table class="table-mini"><thead><tr><th style="width:34px"></th><th>Data</th><th>Tipo</th><th>Medico</th><th>Giudizio</th><th>Stampata</th></tr></thead><tbody>' +
      (vs.length ? vs.map(function (v) { return '<tr><td><input type="checkbox" name="visita" value="' + v.id + '" checked></td><td class="mono">' + U.fmtData(v.data) + '</td><td>' + U.esc(v.tipo) + '</td><td class="small">' + U.esc(U.nomeMedico(v.medicoId)) + '</td><td>' + UI.giudizioChip(v.giudizio) + '</td><td class="tiny muted">' + (DB.documenti.some(function (x) { return x.visitaId === v.id; }) ? 'Sì' : '—') + '</td></tr>'; }).join('') : '<tr><td colspan="6">' + UI.empty('Nessuna visita eseguita.') + '</td></tr>') +
      '</tbody></table></div></form>';
    UI.apriModale({ titolo: 'Stampa cartella sanitaria', size: 'lg', sotto: U.esc(U.nomeLav(l)), corpo: corpo, piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-cartella">' + UI.ic('printer') + ' Genera cartella</button>' });
  };

  AZIONI['genera-cartella'] = function (form) {
    var fd = new FormData(form), l = U.getLav(fd.get('lavoratoreId'));
    var ids = fd.getAll('visita');
    var vs = DB.visite.filter(function (v) { return ids.indexOf(v.id) >= 0; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
    DB.documenti.unshift({ id: 'doc' + Date.now(), tipo: 'Cartella sanitaria', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, anno: 2026, dataDoc: U.iso(window.OGGI), stato: 'Stampato', generatoIl: U.iso(window.OGGI), email: l.email, visitaId: '', firma: '' });
    var med = U.getMedico(U.getDitta(l.dittaId).medicoId);
    var html = '<div class="print-doc"><div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. — Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863">Cartella sanitaria<br>' + U.fmtData(window.OGGI) + '</div></div>' +
      '<h3>Cartella sanitaria e di rischio</h3><div class="cert-sub">' + U.esc(U.nomeLav(l)) + ' · ' + U.esc(U.nomeDitta(l.dittaId)) + '</div>' +
      '<div class="cert-body"><div class="cert-row"><span class="k">Lavoratore</span><span>' + U.esc(U.nomeLav(l)) + ' — nato il ' + U.fmtData(l.nascita) + '</span></div>' +
      '<div class="cert-row"><span class="k">Codice fiscale</span><span>' + U.esc(l.cf) + '</span></div>' +
      '<div class="cert-row"><span class="k">Mansione</span><span>' + U.esc(U.getMansione(l.mansioneId).nome) + '</span></div>' +
      '<div class="cert-row"><span class="k">Medico competente</span><span>Dott. ' + U.esc(med.nome) + '</span></div></div>' +
      '<div class="mt"><b>Visite incluse</b></div><div class="table-box mt-sm"><table class="table-mini"><thead><tr><th>Data</th><th>Tipo</th><th>Giudizio</th><th>Prescrizioni</th></tr></thead><tbody>' +
      vs.map(function (v) { return '<tr><td>' + U.fmtData(v.data) + '</td><td>' + U.esc(v.tipo) + '</td><td>' + U.esc(v.giudizio) + '</td><td>' + U.esc(v.prescrizioni || '—') + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="firma"><div class="f"><b>Dott. ' + U.esc(med.nome) + '</b>Firma del medico competente</div></div><div class="meta"><span>CLS S.r.l.</span><span>' + vs.length + ' visite · ' + U.fmtData(window.OGGI) + '</span></div></div>';
    UI.chiudiModale();
    UI.stampa('Cartella sanitaria · ' + U.nomeLav(l), html, 'Documento generato e registrato nell’archivio');
    RENDER();
    UI.toast('Cartella sanitaria generata e registrata.', 'ok');
  };

  AZIONI['mostra-nota-ditta'] = function (el) {
    var d = U.getDitta(el.dataset.id);
    UI.apriModale({
      titolo: 'Note · ' + U.esc(d.ragione), size: 'sm',
      corpo: '<div class="note">' + U.esc(d.note || 'Nessuna nota.') + '</div>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><a class="btn right" href="#/ditte/' + d.id + '" data-azione="chiudi-modale">Apri scheda</a>'
    });
  };

  /* ===================== ELENCO DITTE ===================== */
  VISTE.ditte = function () {
    var visibili = U.ditteVisibili();
    var righe = visibili.map(function (d) {
      var pss = DB.documenti.filter(function (x) { return x.dittaId === d.id && /PSS/.test(x.tipo); })[0];
      var rfa = DB.documenti.filter(function (x) { return x.dittaId === d.id && /RFA/.test(x.tipo); })[0];
      return Object.assign({}, d, { _pss: pss ? pss.anno : '', _rfa: rfa ? rfa.anno : '', _lav: U.lavoratoriDitta(d.id).length, _med: U.nomeMedico(d.medicoId) });
    });
    var tab = UI.datatable({
      id: 'ditte', righe: righe, ordine: 'ragione', per: 10, placeholder: 'Cerca ragione sociale, sede, P.IVA, medico…',
      extra: [{ k: 'medicoId', label: 'Tutti i medici', opzioni: U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; }) }],
      riga: function (r) { return 'data-href="#/ditte/' + r.id + '" class="click' + (r.cessazione ? ' attenuata' : '') + '"'; },
      colonne: [
        { k: 'ragione', l: 'Ragione sociale', cell: function (r) { return '<b>' + U.esc(r.ragione) + '</b>' + (r.cessazione ? ' ' + UI.chip('cessata', 'plain') : '') + '<div class="tiny muted">P.IVA ' + U.esc(r.piva) + '</div>'; } },
        { k: 'citta', l: 'Sede operativa', cell: function (r) { return U.esc(r.indirizzo) + '<div class="tiny muted">' + U.esc(r.citta) + ' (' + U.esc(r.prov) + ')</div>'; }, testo: function (r) { return r.indirizzo + ' ' + r.citta + ' ' + r.prov; } },
        { k: 'tel', l: 'Contatti', cell: function (r) { return '<span class="small">' + U.esc(r.tel) + '</span><div class="tiny muted">' + U.esc(r.email) + '</div>'; }, sort: false },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: '_lav', l: 'Lav.', num: true },
        { k: '_pss', l: 'PSS', num: true, cell: function (r) { return r._pss ? '<span class="mono">' + r._pss + '</span>' : '<span class="muted">—</span>'; } },
        { k: '_rfa', l: 'RFA', num: true, cell: function (r) { return r._rfa ? '<span class="mono">' + r._rfa + '</span>' : '<span class="muted">—</span>'; } },
        { k: 'riunioni', l: 'R', num: true, sort: false, cell: function (r) { return r.riunioni ? UI.chip('R', 'info') : '<span class="muted">—</span>'; } },
        { k: 'note', l: 'Note', sort: false, cerca: false, cell: function (r) { return r.note ? '<button type="button" class="btn btn-xs" data-azione="mostra-nota-ditta" data-id="' + r.id + '">Mostra</button>' : '<span class="muted">—</span>'; } },
        { k: '_apri', l: '', sort: false, cerca: false, cell: function (r) { return '<a class="btn btn-xs" href="#/ditte/' + r.id + '">Apri</a>'; } }
      ]
    });
    return {
      id: 'ditte', icona: 'building', titolo: 'Ditte', sotto: visibili.length + ' aziende · ' + visibili.filter(function (d) { return d.cessazione; }).length + ' cessate · filtri e storico',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="ditte" data-nome="ditte">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-primary" data-azione="nuova-ditta">' + UI.ic('plus') + ' Nuova ditta</button>' : ''),
      fit: true, corpo: tab
    };
  };

  /* ===================== SCHEDA DITTA ===================== */
  /* ---------- datatable nelle tab delle schede (regola: ogni tabella di dati è una datatable) ---------- */
  function dtScheda(id, righe, colonne, opz) {
    return UI.datatable(Object.assign({ id: id, righe: righe, colonne: colonne, per: 10, cls: 'dt-annidata', placeholder: 'Cerca…' }, opz || {}));
  }
  function colData(k, l, extra) {
    return { k: k, l: l || 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r[k]) + '</span>' + (extra ? extra(r) : ''); }, testo: function (r) { return U.fmtData(r[k]); }, val: function (r) { return r[k] || ''; } };
  }
  function opzioni(righe, k) { var v = {}; righe.forEach(function (r) { if (r[k]) v[r[k]] = 1; }); return Object.keys(v).sort(); }
  function colLav() { return { k: '_lav', l: 'Lavoratore', cell: function (r) { return r.lavoratoreId ? '<a href="#/lavoratori/' + r.lavoratoreId + '">' + U.esc(r._lav) + '</a>' : '<span class="muted">—</span>'; } }; }
  function conLav(x) { return Object.assign({}, x, { _lav: x.lavoratoreId ? U.nomeLav(U.getLav(x.lavoratoreId)) : '' }); }
  function copia(x) { return Object.assign({}, x); }
  function colStatoDoc() { return { k: 'stato', l: 'Stato', cell: function (r) { return UI.chip(r.stato, /Firmato|Pronto|Stampato/.test(r.stato) ? 'ok' : 'warn'); } }; }
  function colApriDoc() { return { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="apri-documento" data-id="' + r.id + '">' + UI.ic('eye') + ' Apri</button>'; } }; }
  function colScadenza() { return { k: 'data', l: 'Scadenza', cell: function (r) { return UI.statusChip(r.data); }, testo: function (r) { return U.fmtData(r.data); }, val: function (r) { return r.data; } }; }
  function colCosa() { return { k: 'cosa', l: 'Cosa', cell: function (r) { return '<b>' + U.esc(r.cosa) + '</b><div class="tiny muted">' + U.esc(r.descrizione) + '</div>'; }, testo: function (r) { return r.cosa + ' ' + r.descrizione; } }; }
  function colFissata() { return { k: 'fissata', l: 'Fissata', cell: function (r) { return r.fissata ? UI.chip('sì', 'ok') : '<span class="muted">no</span>'; }, testo: function (r) { return r.fissata ? 'fissata' : ''; } }; }

  VISTE.ditta = function (id) {
    var d = U.getDitta(id);
    if (!d.id || !U.puoDitta(d.id)) return { id: 'ditte', icona: 'building', titolo: 'Ditta non disponibile', corpo: UI.empty('La ditta richiesta non esiste o non è tra quelle a te assegnate.', 'lock') };
    var lav = U.lavoratoriDitta(d.id);
    var visite = DB.visite.filter(function (v) { return v.dittaId === d.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
    var esami = DB.esami.filter(function (e) { return e.dittaId === d.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
    var sopr = DB.sopralluoghi.filter(function (s) { return s.dittaId === d.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
    var corsi = DB.corsi.filter(function (c) { return c.dittaId === d.id; }).sort(function (a, b) { return b.data.localeCompare(a.data); });
    var scad = DB.scadenze.filter(function (s) { return s.dittaId === d.id; }).sort(function (a, b) { return a.data.localeCompare(b.data); });
    var docs = DB.documenti.filter(function (x) { return x.dittaId === d.id; });
    var note = DB.note.filter(function (n) { return n.dittaId === d.id; });
    var attivo = STATE.tab['ditta-' + id] || 'lavoratori';
    var tabs = [
      { id: 'mansioni', label: 'Mansioni', n: d.mansioni.length }, { id: 'lavoratori', label: 'Lavoratori', n: lav.length },
      { id: 'visite', label: 'Visite', n: visite.length }, { id: 'esami', label: 'Esami', n: esami.length },
      { id: 'sopralluoghi', label: 'Sopralluoghi', n: sopr.length }, { id: 'corsi', label: 'Corsi', n: corsi.length },
      { id: 'scadenze', label: 'Scadenze', n: scad.length }, { id: 'documenti', label: 'Documenti', n: docs.length },
      { id: 'note', label: 'Note', n: note.length }, { id: 'storico', label: 'Storico Mago' }
    ];
    var corpoTab = '';

    if (attivo === 'mansioni') {
      corpoTab = dtScheda('ditta-' + d.id + '-mans', d.mansioni.map(function (mid) {
        var m = U.mansioneInDitta(d, mid);
        return { id: mid, nome: m.nome, periodo: m.periodo, rischi: m.rischi || [], accertamenti: m.accertamenti || [], _pers: !!(d.protocolli && d.protocolli[mid]), _n: U.lavoratoriDitta(d.id).filter(function (l) { return l.mansioneId === mid; }).length };
      }), [
        { k: 'nome', l: 'Mansione', cell: function (r) { return '<b>' + U.esc(r.nome) + '</b>' + (r._pers ? ' ' + UI.chip('personalizzata', 'info') : ''); } },
        { k: 'periodo', l: 'Vis.', num: true, cell: function (r) { return '<span class="mono">' + r.periodo + '</span>'; } },
        { k: '_rischi', l: 'Rischi', sort: false, cell: function (r) { return r.rischi.slice(0, 3).map(function (x) { return '<span class="chip plain">' + U.esc(x) + '</span>'; }).join(' ') + (r.rischi.length > 3 ? ' <span class="tiny muted">+' + (r.rischi.length - 3) + '</span>' : ''); }, testo: function (r) { return r.rischi.join(' '); } },
        { k: '_acc', l: 'Accertamenti', sort: false, cell: function (r) { return '<span class="small muted">' + r.accertamenti.slice(0, 3).map(function (a) { return U.esc(a[0]); }).join(' · ') + (r.accertamenti.length > 3 ? ' …' : '') + '</span>'; }, testo: function (r) { return r.accertamenti.map(function (a) { return a[0]; }).join(' '); } },
        { k: '_n', l: 'Lavoratori', num: true },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="protocollo-mansione" data-ditta="' + d.id + '" data-mansione="' + r.id + '">Protocollo</button>'; } }
      ], { ordine: 'nome', placeholder: 'Cerca mansione, rischio, accertamento…' });
    }

    function dtTab(nome, righe, colonne, opz) { return dtScheda('ditta-' + d.id + '-' + nome, righe, colonne, opz); }

    if (attivo === 'lavoratori') {
      var rl = lav.map(function (l) { var sc = U.scadenzaProssima(l.id); return Object.assign({}, l, { _nome: U.nomeLav(l), _eta: U.eta(l.nascita), _mans: U.getMansione(l.mansioneId).nome, _sc: sc ? sc.data : '' }); });
      corpoTab = dtTab('lav', rl, [
        { k: '_nome', l: 'Lavoratore', cell: function (r) { return '<div class="row">' + UI.avatar(r._nome) + '<div><b>' + U.esc(r._nome) + '</b><div class="tiny muted">' + U.esc(r.cf) + '</div></div></div>'; }, testo: function (r) { return r._nome + ' ' + r.cf; } },
        { k: '_eta', l: 'Età', num: true },
        { k: 'sesso', l: 'Sesso' },
        colData('assunzione', 'Assunto'),
        { k: '_mans', l: 'Mansione', cell: function (r) { return U.esc(r._mans); } },
        { k: 'sorveglianza', l: 'Sorv.', cell: function (r) { return r.sorveglianza ? UI.chip('Sì', 'ok') : UI.chip('No', 'plain'); }, testo: function (r) { return r.sorveglianza ? 'sì' : 'no'; } },
        { k: '_sc', l: 'Prossima visita', cell: function (r) { return r._sc ? UI.statusChip(r._sc) : UI.chip('non pianificata', 'plain'); }, testo: function (r) { return r._sc ? U.fmtData(r._sc) : 'non pianificata'; }, val: function (r) { return r._sc || '9999'; } }
      ], { ordine: '_nome', placeholder: 'Cerca nome, CF, mansione…', extra: [{ k: '_mans', label: 'Tutte le mansioni', opzioni: opzioni(rl, '_mans') }], riga: function (r) { return 'data-href="#/lavoratori/' + r.id + '"'; }, classeRiga: function () { return 'click'; } });
    }

    if (attivo === 'visite') {
      var rv = visite.map(function (v) { return Object.assign(conLav(v), { _med: U.nomeMedico(v.medicoId) }); });
      corpoTab = dtTab('visite', rv, [
        colData('data', 'Data', function (r) { return r.stato === 'programmata' ? ' ' + UI.chip('in agenda', 'info') : ''; }),
        colLav(),
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: 'tipo', l: 'Tipo' },
        { k: 'giudizio', l: 'Giudizio', cell: function (r) { return r.stato === 'programmata' ? '<span class="muted">—</span>' : UI.giudizioChip(r.giudizio); } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return r.stato === 'eseguita' ? '<button type="button" class="btn btn-xs" data-azione="apri-certificato" data-visita="' + r.id + '">' + UI.ic('printer') + ' Certificato</button>' : ''; } }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca lavoratore, medico, tipo…', extra: [{ k: 'stato', label: 'Tutte le visite', opzioni: [['programmata', 'In agenda'], ['eseguita', 'Eseguite']] }, { k: 'tipo', label: 'Tutti i tipi', opzioni: opzioni(rv, 'tipo') }] });
    }

    if (attivo === 'esami') {
      var re = esami.map(conLav);
      corpoTab = dtTab('esami', re, [
        colData('data'), colLav(),
        { k: 'accertamento', l: 'Accertamento' },
        { k: 'risultato', l: 'Risultato' },
        { k: 'giudizioIdoneita', l: 'Idoneità', cell: function (r) { return r.giudizioIdoneita ? UI.chip(r.giudizioIdoneita, 'info') : '<span class="muted">—</span>'; } }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca lavoratore, accertamento, risultato…', extra: [{ k: 'accertamento', label: 'Tutti gli accertamenti', opzioni: opzioni(re, 'accertamento') }] });
    }

    if (attivo === 'sopralluoghi') {
      var rs = sopr.map(function (x) { return Object.assign({}, x, { _med: U.nomeMedico(x.medicoId) }); });
      corpoTab = dtTab('sopr', rs, [
        colData('data', 'Data', function (r) { return r.stato === 'programmato' ? ' ' + UI.chip('in agenda', 'info') : ''; }),
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: 'igiene', l: 'Igiene' },
        { k: 'prossimo', l: 'Prossimo', num: true, cell: function (r) { return r.prossimo + ' mesi'; } },
        { k: 'pronto', l: 'Pronto', cell: function (r) { return r.pronto ? UI.chip('pronto', 'ok') : UI.chip('da predisporre', 'plain'); }, testo: function (r) { return r.pronto ? 'pronto' : 'da predisporre'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="stampa-sopralluogo" data-id="' + r.id + '" aria-label="Stampa verbale">' + UI.ic('printer') + '</button>'; } }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca medico, esito…' });
    }

    if (attivo === 'corsi') {
      corpoTab = dtTab('corsi', corsi.map(function (x) { return Object.assign({}, x); }), [
        colData('data'),
        { k: 'nome', l: 'Corso' },
        { k: 'nominativo', l: 'Nominativo' },
        colData('scadenza', 'Scadenza'),
        { k: 'ore', l: 'Ore', num: true },
        { k: 'rischio', l: 'Rischio' }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca corso, nominativo…', extra: [{ k: 'nome', label: 'Tutti i corsi', opzioni: opzioni(corsi, 'nome') }] });
    }

    if (attivo === 'scadenze') {
      corpoTab = dtTab('scad', scad.map(function (x) { return Object.assign({}, x); }), [
        { k: 'tipo', l: 'Tipo', cell: function (r) { return '<span class="chip plain">' + U.esc(r.tipo) + '</span>'; } },
        { k: 'cosa', l: 'Cosa', cell: function (r) { return '<b>' + U.esc(r.cosa) + '</b><div class="tiny muted">' + U.esc(r.descrizione) + '</div>'; }, testo: function (r) { return r.cosa + ' ' + r.descrizione; } },
        { k: 'soggetto', l: 'Soggetto' },
        { k: 'data', l: 'Scadenza', cell: function (r) { return UI.statusChip(r.data); }, testo: function (r) { return U.fmtData(r.data); }, val: function (r) { return r.data; } },
        { k: 'fissata', l: 'Fissata', cell: function (r) { return r.fissata ? UI.chip('sì', 'ok') : '<span class="muted">no</span>'; }, testo: function (r) { return r.fissata ? 'fissata' : ''; } }
      ], { ordine: 'data', placeholder: 'Cerca cosa, soggetto…', extra: [{ k: 'tipo', label: 'Tutti i tipi', opzioni: opzioni(scad, 'tipo') }] });
    }

    if (attivo === 'documenti') {
      corpoTab = dtTab('docs', docs.map(function (x) { return Object.assign({}, x); }), [
        { k: 'tipo', l: 'Tipo' },
        { k: 'anno', l: 'Anno', num: true },
        colData('dataDoc'),
        { k: 'stato', l: 'Stato', cell: function (r) { return UI.chip(r.stato, /Firmato|Pronto|Stampato/.test(r.stato) ? 'ok' : 'warn'); } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="apri-documento" data-id="' + r.id + '">' + UI.ic('eye') + ' Apri</button>'; } }
      ], { ordine: 'dataDoc', dir: -1, placeholder: 'Cerca documento…', extra: [{ k: 'tipo', label: 'Tutti i documenti', opzioni: opzioni(docs, 'tipo') }] });
    }

    if (attivo === 'note') {
      corpoTab = dtTab('note', note.map(conLav), [
        colData('data'),
        { k: 'tipo', l: 'Tipo' },
        colLav(),
        { k: 'testo', l: 'Nota' }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca nel testo…', extra: [{ k: 'tipo', label: 'Tutti i tipi', opzioni: opzioni(note, 'tipo') }] });
    }

    if (attivo === 'storico') {
      var st = DB.mago.anagrafiche.filter(function (a) { return a.piva === d.piva; });
      if (st.length) {
        corpoTab = '<div class="note info mb">' + UI.ic('history') + ' Variazione di ragione sociale o sede con la stessa P.IVA: il record precedente è annullato logicamente, il nuovo resta attivo. I documenti emessi restano collegati allo storico.</div>' +
          '<div class="storico">' + st[0].records.map(function (r) {
            return '<div class="r ' + (r.stato === 'Annullata' ? 'old' : '') + '"><span class="d">' + r.dal + (r.al ? '<br>→ ' + r.al : '<br>→ oggi') + '</span><div><span class="nome strong">' + U.esc(r.ragione) + '</span><div class="small muted">' + U.esc(r.sede) + '</div><div class="tiny muted">ID Mago ' + U.esc(r.magoId) + '</div></div>' + UI.chip(r.stato, r.stato === 'Attiva' ? 'ok' : 'plain') + '</div>';
          }).join('') + '</div>';
      } else {
        corpoTab = UI.empty('Nessuna variazione anagrafica registrata per questa P.IVA.', 'history');
      }
    }

    var corpo = '<div class="detail-head"><div class="avatar-md" style="width:52px;height:52px;font-size:16px">' + UI.ic('building') + '</div><div class="id"><h1>' + U.esc(d.ragione) + '</h1><div class="sub">' +
      '<span>P.IVA <b>' + U.esc(d.piva) + '</b></span><span class="divider"></span><span>' + U.esc(d.citta) + ' (' + U.esc(d.prov) + ')</span><span class="divider"></span><span>Dott. ' + U.esc(U.nomeMedico(d.medicoId)) + '</span>' +
      (d.cessazione ? '<span class="chip plain">cessata il ' + U.fmtData(d.cessazione) + '</span>' : UI.chip('attiva', 'ok')) + '</div></div><div class="actions">' +
      '<button type="button" class="btn" data-azione="modifica-ditta" data-id="' + d.id + '">' + UI.ic('edit') + ' Modifica</button>' +
      '<button type="button" class="btn" data-azione="nuovo-sopralluogo" data-ditta="' + d.id + '">' + UI.ic('pin') + ' Sopralluogo</button>' +
      '<button type="button" class="btn" data-azione="nuovo-corso" data-ditta="' + d.id + '">' + UI.ic('grad') + ' Corso</button>' +
      '<button type="button" class="btn btn-primary" data-azione="nuovo-lavoratore" data-ditta="' + d.id + '">' + UI.ic('plus') + ' Lavoratore</button>' +
      '</div></div>' +
      (d.cessazione ? '<div class="note warn">Ditta cessata il ' + U.fmtData(d.cessazione) + '. I dati restano consultabili in sola lettura.</div>' : '') +
      '<div class="card"><div class="info-grid">' +
      [[ 'P.IVA / C.F.', (d.piva ? U.esc(d.piva) : '<span class="muted">—</span>') + (d.cf && d.cf !== d.piva ? '<div class="small">C.F. ' + U.esc(d.cf) + '</div>' : '')],
        ['Sede legale', (d.legIndirizzo || d.indirizzo ? U.esc(d.legIndirizzo || d.indirizzo) : '<span class="muted">—</span>') + (d.legCitta || d.citta ? '<div class="small">' + U.esc(d.legCitta || d.citta) + ' (' + U.esc(d.legProv || d.prov) + ') ' + U.esc(d.legCap || d.cap) + '</div>' : '')],
        ['Sede operativa', (d.indirizzo ? U.esc(d.indirizzo) : '<span class="muted">—</span>') + (d.citta ? '<div class="small">' + U.esc(d.citta) + ' (' + U.esc(d.prov) + ') ' + U.esc(d.cap) + '</div>' : '')],
        ['Contatti', (d.tel ? U.esc(d.tel) : '<span class="muted">—</span>') + (d.email ? '<div class="small">' + U.esc(d.email) + '</div>' : '') + (d.pec ? '<div class="small">PEC ' + U.esc(d.pec) + '</div>' : '')],
        ['Medico competente', 'Dott. ' + U.esc(U.nomeMedico(d.medicoId)) + (d.ruolo ? '<div class="small">' + U.esc(d.ruolo) + '</div>' : '')],
        ['Attività', (d.attivita ? U.esc(d.attivita) : '<span class="muted">—</span>') + (d.ateco ? '<div class="small">ATECO ' + U.esc(d.ateco) + '</div>' : '')],
        ['RSPP / Rappresentante', U.esc(d.rspp || '—') + (d.rappr ? '<div class="small">' + U.esc(d.rappr) + '</div>' : '')],
        ['Email visite', (d.emailVisite || d.email ? U.esc(d.emailVisite || d.email) : '<span class="muted">—</span>') + (d.acquisizione ? '<div class="small">Acquisita il ' + U.fmtData(d.acquisizione) + '</div>' : '')]].map(function (b) {
          return '<div class="info-block"><div class="k">' + b[0] + '</div><div class="v">' + (b[1] || '<span class="muted">—</span>') + '</div></div>';
        }).join('') +
      '</div></div>' +
      '<div class="row wrap"><button type="button" class="btn btn-sm" data-azione="genera-pss" data-ditta="' + d.id + '">' + UI.ic('file') + ' Genera PSS 2026</button><button type="button" class="btn btn-sm" data-azione="genera-rfa" data-ditta="' + d.id + '">' + UI.ic('file') + ' Genera RFA 2026</button><button type="button" class="btn btn-sm" data-azione="allegato-3b" data-ditta="' + d.id + '">' + UI.ic('download') + ' Allegato 3B</button><button type="button" class="btn btn-sm" data-azione="email-scadenze">' + UI.ic('mail') + ' Email scadenze</button><span class="right small muted">' + lav.length + ' lavoratori · ' + visite.length + ' visite · ' + scad.length + ' scadenze</span></div>' +
      '<div class="card"><div class="card-head" style="padding:0">' + UI.tabs('ditta-' + id, tabs, attivo) + '</div><div class="card-body tight" style="padding:0">' + (corpoTab || UI.empty('Nessun dato in questa sezione.')) + '</div></div>';

    return {
      id: 'ditte', icona: 'building', titolo: d.ragione, sotto: 'Scheda ditta · ' + lav.length + ' lavoratori · ' + U.esc(d.attivita) + ' · visite ' + (d.modalitaVisite === 'loco' ? 'presso il cliente' + (d.locoObbligatoria ? ' (obbligatorio)' : '') : d.modalitaVisite === 'sede' ? 'in studio' : 'luogo indifferente') + ' · ' + (d.prenotazione === 'cliente' ? 'la data la sceglie il cliente' : 'la data la fissa lo studio'),
      azioni: '<button type="button" class="btn btn-sm" data-azione="esporta-csv" data-dt="ditte" data-nome="ditte">' + UI.ic('download') + '</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-sm" data-azione="pian-gruppo" data-ditta="' + d.id + '">' + UI.ic('users') + ' Appuntamento di gruppo</button><button type="button" class="btn btn-sm" data-azione="accesso-ditta" data-ditta="' + d.id + '">' + UI.ic('lock') + ' Accesso</button><button type="button" class="btn btn-primary btn-sm" data-azione="nuovo-lavoratore" data-ditta="' + d.id + '">' + UI.ic('plus') + ' Nuovo lavoratore</button>' : ''),
      corpo: corpo
    };
  };

  AZIONI['allegato-3b'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    UI.apriModale({
      titolo: 'Allegato 3B INAIL', size: 'sm', sotto: 'Comunicazione sanitaria · ' + d.ragione,
      corpo: '<form id="form-3b" data-form="scarica-3b"><input type="hidden" name="dittaId" value="' + d.id + '"><div class="col" style="gap:12px">' +
        UI.campo({ label: 'Anno di riferimento', name: 'anno', type: 'select', value: '2026', options: ['2026', '2025', '2024'] }) +
        '<div class="note info">' + UI.ic('file') + ' Il file XLS viene generato dai dati di sorveglianza della ditta per l’anno selezionato.</div></div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-3b">' + UI.ic('download') + ' Scarica XLS</button>'
    });
  };
  AZIONI['scarica-3b'] = function (form) {
    var fd = new FormData(form), d = U.getDitta(fd.get('dittaId'));
    UI.chiudiModale();
    UI.toast('Allegato 3B ' + fd.get('anno') + ' di ' + d.ragione + ' scaricato (simulazione).', 'ok');
  };

  AZIONI['genera-pss'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    DB.documenti.unshift({ id: 'doc' + Date.now(), tipo: 'Piano di Sorveglianza (PSS)', soggetto: d.ragione, dittaId: d.id, lavoratoreId: '', anno: 2026, dataDoc: U.iso(window.OGGI), stato: 'Firmato', generatoIl: U.iso(window.OGGI), email: d.emailVisite, visitaId: '', firma: 'Dott. ' + U.nomeMedico(d.medicoId) });
    UI.stampa('Piano di Sorveglianza 2026 · ' + d.ragione, UI.certificatoDitta('Piano di Sorveglianza (PSS)', d, 2026), 'Documento generato e firmato digitalmente');
    RENDER();
    UI.toast('PSS 2026 generato e archiviato.', 'ok');
  };
  AZIONI['genera-rfa'] = function (el) {
    var d = U.getDitta(el.dataset.ditta);
    DB.documenti.unshift({ id: 'doc' + Date.now(), tipo: 'Relazione Annuale (RFA)', soggetto: d.ragione, dittaId: d.id, lavoratoreId: '', anno: 2026, dataDoc: U.iso(window.OGGI), stato: 'Firmato', generatoIl: U.iso(window.OGGI), email: d.emailVisite, visitaId: '', firma: 'Dott. ' + U.nomeMedico(d.medicoId) });
    UI.stampa('Relazione Annuale 2026 · ' + d.ragione, UI.certificatoDitta('Relazione Annuale (RFA)', d, 2026), 'Documento generato e firmato digitalmente');
    RENDER();
    UI.toast('RFA 2026 generata e archiviata.', 'ok');
  };

  /* ===================== ELENCO LAVORATORI ===================== */
  VISTE.lavoratori = function () {
    var visibili = U.lavVisibili();
    var righe = visibili.map(function (l) {
      var sc = U.scadenzaProssima(l.id);
      var cart = DB.documenti.filter(function (d) { return d.lavoratoreId === l.id; }).sort(function (a, b) { return (b.dataDoc || '').localeCompare(a.dataDoc || ''); })[0];
      return Object.assign({}, l, { _nome: U.nomeLav(l), _eta: U.eta(l.nascita), _ditta: U.nomeDitta(l.dittaId), _mans: U.getMansione(l.mansioneId).nome, _scad: sc ? sc.data : '', _cart: cart ? cart.dataDoc : '' });
    });
    var tab = UI.datatable({
      id: 'lavoratori', righe: righe, ordine: '_nome', per: 12, cls: 'dt-compatta', placeholder: 'Cerca nome, CF, ditta, mansione…',
      extra: [
        { k: 'dittaId', label: 'Tutte le ditte', opzioni: U.ditteVisibili().map(function (d) { return [d.id, d.ragione]; }) },
        { k: 'sorveglianza', label: 'Sorveglianza: tutti', opzioni: [['1', 'Soggetti a sorveglianza'], ['0', 'Non soggetti']], filtra: function (r, v) { return String(r.sorveglianza) === v; } }
      ],
      riga: function (r) { return 'data-href="#/lavoratori/' + r.id + '" class="click' + (r.risoluzione ? ' attenuata' : '') + '"'; },
      colonne: [
        { k: '_nome', l: 'Lavoratore', cell: function (r) { return '<div class="row">' + UI.avatar(r._nome) + '<div><b>' + U.esc(r._nome) + '</b><div class="tiny muted">' + U.esc(r.cf) + '</div></div></div>'; } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<span class="small">' + U.esc(r._ditta) + '</span>'; } },
        { k: 'sesso', l: 'Sesso', cell: function (r) { return '<span class="small">' + r.sesso + '</span>'; } },
        { k: 'nascita', l: 'Nascita / età', cell: function (r) { return '<span class="mono">' + U.fmtData(r.nascita) + '</span><div class="tiny muted">' + r._eta + ' anni</div>'; } },
        { k: 'assunzione', l: 'Assunto', cell: function (r) { return '<span class="mono small">' + U.fmtData(r.assunzione) + '</span>'; } },
        { k: '_mans', l: 'Mansione', cell: function (r) { return '<span class="small">' + U.esc(r._mans) + '</span>'; } },
        { k: 'sorveglianza', l: 'Sorv.', sort: false, cell: function (r) { return r.sorveglianza ? UI.chip('Sì', 'ok') : UI.chip('No', 'plain'); } },
        { k: '_scad', l: 'Prossima visita', cell: function (r) { return r._scad ? UI.statusChip(r._scad) : '<span class="muted small">non pianificata</span>'; } },
        { k: '_cart', l: 'Ultimo certificato', sort: false, cell: function (r) { return r._cart ? '<span class="tiny muted">' + U.fmtData(r._cart) + '</span>' : '<span class="muted">—</span>'; } }
      ]
    });
    return {
      id: 'lavoratori', icona: 'users', titolo: 'Lavoratori', sotto: visibili.length + ' lavoratori · sorveglianza, mansioni e prossime visite',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="lavoratori" data-nome="lavoratori">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-primary" data-azione="nuovo-lavoratore">' + UI.ic('plus') + ' Nuovo lavoratore</button>' : ''),
      fit: true, corpo: tab
    };
  };

  /* ===================== SCHEDA LAVORATORE ===================== */
  VISTE.lavoratore = function (id) {
    var l = U.getLav(id);
    if (!l.id || !U.puoLav(l)) return { id: 'lavoratori', icona: 'users', titolo: 'Lavoratore non disponibile', corpo: UI.empty('Il lavoratore richiesto non esiste o non è tra quelli a te visibili.', 'lock') };
    var d = U.getDitta(l.dittaId), mn = U.getMansione(l.mansioneId);
    var visite = U.visiteLav(l.id), esami = U.esamiLav(l.id), vacc = U.vaccLav(l.id), scad = U.scadenzeLav(l.id).sort(function (a, b) { return a.data.localeCompare(b.data); });
    var docs = DB.documenti.filter(function (x) { return x.lavoratoreId === l.id; });
    var note = DB.note.filter(function (n) { return n.lavoratoreId === l.id; });
    var ultima = U.ultimaVisita(l.id), prossima = U.prossimaVisita(l.id), scPross = U.scadenzaProssima(l.id);
    var ristretto = U.ruolo() === 'ditta';
    var attivo = STATE.tab['lav-' + id] || 'visite';
    if (ristretto && ['vaccinazioni', 'note'].indexOf(attivo) >= 0) attivo = 'visite';
    var tabs = ristretto
      ? [{ id: 'visite', label: 'Visite e giudizi', n: visite.length }, { id: 'esami', label: 'Esami e referti', n: esami.length }, { id: 'scadenze', label: 'Scadenze', n: scad.length }, { id: 'documenti', label: 'Documenti', n: docs.length }]
      : [{ id: 'visite', label: 'Visite mediche', n: visite.length }, { id: 'esami', label: 'Esami', n: esami.length }, { id: 'vaccinazioni', label: 'Vaccinazioni', n: vacc.length }, { id: 'scadenze', label: 'Scadenze', n: scad.length }, { id: 'documenti', label: 'Documenti', n: docs.length }, { id: 'note', label: 'Note', n: note.length }];
    var corpoTab = '';

    function dtLav(nome, righe, colonne, opz) { return dtScheda('lav-' + l.id + '-' + nome, righe, colonne, opz); }
    if (attivo === 'visite') {
      corpoTab = dtLav('visite', visite.map(function (v) { return Object.assign({}, v, { _med: U.nomeMedico(v.medicoId) }); }), [
        colData('data', 'Data', function (r) { return r.stato === 'programmata' ? ' ' + UI.chip('in agenda', 'info') : ''; }),
        { k: 'tipo', l: 'Tipo' },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: 'giudizio', l: 'Giudizio', cell: function (r) { return r.stato === 'programmata' ? '<span class="muted">da eseguire</span>' : UI.giudizioChip(r.giudizio); } },
        { k: 'successiva', l: 'Prossima', num: true, cell: function (r) { return r.successiva ? r.successiva + ' mesi' : '—'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (v) { return v.stato === 'eseguita' ? '<button type="button" class="btn btn-xs" data-azione="apri-certificato" data-visita="' + v.id + '">' + UI.ic('printer') + ' Certificato</button>' + (ristretto ? ' <button type="button" class="btn btn-xs" data-azione="certificato-presenza" data-visita="' + v.id + '">' + UI.ic('clock') + ' Presenza</button>' : '') : (ristretto ? '<span class="muted tiny">in agenda</span>' : '<a class="btn btn-xs" href="#/visite/nuova/' + l.id + '">Apri visita</a>'); } }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca tipo, medico, giudizio…', extra: [{ k: 'tipo', label: 'Tutti i tipi', opzioni: opzioni(visite, 'tipo') }] });
    }
    if (attivo === 'esami') {
      corpoTab = dtLav('esami', esami.map(copia), [
        colData('data'),
        { k: 'accertamento', l: 'Accertamento' },
        { k: 'risultato', l: 'Risultato', cell: function (r) { return '<b>' + U.esc(r.risultato) + '</b>'; } },
        { k: 'esterno', l: 'Esterno', cell: function (r) { return r.esterno ? UI.chip('sì', 'info') : 'no'; }, testo: function (r) { return r.esterno ? 'esterno' : ''; } },
        { k: 'note', l: 'Note', cell: function (r) { return '<span class="small muted">' + U.esc(r.note || '—') + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="apri-referto" data-id="' + r.id + '">' + UI.ic('download') + ' Referto</button>'; } }
      ], { ordine: 'data', dir: -1, placeholder: 'Cerca accertamento, risultato…', extra: [{ k: 'accertamento', label: 'Tutti gli accertamenti', opzioni: opzioni(esami, 'accertamento') }] });
    }
    if (attivo === 'vaccinazioni') {
      corpoTab = dtLav('vacc', vacc.map(copia), [
        { k: 'tipo', l: 'Vaccinazione', cell: function (r) { return '<b>' + U.esc(r.tipo) + '</b>'; } },
        colData('dose1', 'Dose 1'), colData('dose2', 'Dose 2'), colData('dose3', 'Dose 3'), colData('richiamo1', 'Richiamo 1'), colData('richiamo2', 'Richiamo 2')
      ], { ordine: 'tipo', placeholder: 'Cerca vaccinazione…' });
    }
    if (attivo === 'scadenze') {
      corpoTab = dtLav('scad', scad.map(copia), [{ k: 'tipo', l: 'Tipo' }, colCosa(), colScadenza(), colFissata()],
        { ordine: 'data', placeholder: 'Cerca scadenza…', extra: [{ k: 'tipo', label: 'Tutti i tipi', opzioni: opzioni(scad, 'tipo') }] });
    }
    if (attivo === 'documenti') {
      corpoTab = dtLav('docs', docs.map(copia), [{ k: 'tipo', l: 'Tipo' }, colData('dataDoc'), colStatoDoc(), colApriDoc()],
        { ordine: 'dataDoc', dir: -1, placeholder: 'Cerca documento…', extra: [{ k: 'tipo', label: 'Tutti i documenti', opzioni: opzioni(docs, 'tipo') }] });
    }
    if (attivo === 'note') {
      corpoTab = dtLav('note', note.map(copia), [colData('data'), { k: 'tipo', l: 'Tipo' }, { k: 'testo', l: 'Nota' }], { ordine: 'data', dir: -1, placeholder: 'Cerca nel testo…' });
    }

    var avviso = '';
    if (l.sorveglianza) {
      if (scPross && U.giorniA(scPross.data) < 0) avviso = '<div class="note warn">' + UI.ic('alert') + ' <strong>Visita scaduta il ' + U.fmtData(scPross.data) + '</strong> (' + Math.abs(U.giorniA(scPross.data)) + ' giorni). ' + (prossima ? 'Nuovo appuntamento fissato per il ' + U.fmtData(prossima.data) + '.' : 'Nessun appuntamento fissato.') + (ristretto ? '' : ' <a href="#/visite/nuova/' + l.id + '">Avvia visita</a>') + '</div>';
      else if (prossima) avviso = '<div class="note ok">' + UI.ic('calendar') + ' Prossima visita fissata per <strong>' + U.fmtLunga(prossima.data) + '</strong> alle ' + prossima.ora + ' — ' + U.esc(U.nomeMedico(prossima.medicoId)) + '.</div>';
      else if (scPross) avviso = '<div class="note info">' + UI.ic('clock') + ' Prossima visita prevista entro il <strong>' + U.fmtData(scPross.data) + '</strong> (' + U.statoScadenza(scPross.data).label + ').' + (ristretto ? '' : ' <a href="#/visite/nuova/' + l.id + '">Avvia visita</a>') + '</div>';
    } else {
      avviso = '<div class="note">' + UI.ic('user') + ' Lavoratore non soggetto a sorveglianza sanitaria.</div>';
    }

    var azioniHead = ristretto ? '' : '<button type="button" class="btn" data-azione="modifica-lavoratore" data-id="' + l.id + '">' + UI.ic('edit') + ' Modifica</button>' +
      '<button type="button" class="btn" data-azione="stampa-cartella" data-id="' + l.id + '">' + UI.ic('printer') + ' Cartella</button>' +
      '<button type="button" class="btn" data-azione="nuova-vaccinazione" data-lav="' + l.id + '">' + UI.ic('syringe') + ' Vaccinazione</button>' +
      '<button type="button" class="btn" data-azione="nuovo-esame" data-lav="' + l.id + '">' + UI.ic('activity') + ' Esame</button>' +
      '<a class="btn btn-primary" href="#/visite/nuova/' + l.id + '">' + UI.ic('heart') + ' Nuova visita</a>';

    var corpo = '<div class="detail-head"><div class="avatar-md" style="width:52px;height:52px;font-size:16px">' + U.esc(U.iniziali(U.nomeLav(l))) + '</div><div class="id"><h1>' + U.esc(U.nomeLav(l)) + '</h1><div class="sub">' +
      '<span>' + U.esc(d.ragione) + '</span><span class="divider"></span><span>' + U.esc(mn.nome) + '</span><span class="divider"></span><span>Dott. ' + U.esc(U.nomeMedico(d.medicoId)) + '</span><span class="divider"></span><span>' + U.eta(l.nascita) + ' anni</span>' +
      (l.sorveglianza ? UI.chip('in sorveglianza', 'ok') : UI.chip('non soggetto', 'plain')) + '</div></div><div class="actions">' + azioniHead + '</div></div>' + avviso +
      '<div class="card"><div class="info-grid">' +
      [['Data di nascita', U.fmtData(l.nascita) + '<div class="small">' + U.esc(l.luogoNascita) + ' · ' + U.eta(l.nascita) + ' anni</div>'],
        ['Codice fiscale', U.esc(l.cf) + '<div class="small">' + U.esc(l.nazionalita) + '</div>'],
        ['Residenza', U.esc(l.residenza) + '<div class="small">' + U.esc(l.comune) + ' (' + U.esc(l.prov) + ') ' + U.esc(l.cap) + '</div>'],
        ['Contatti', U.esc(l.tel) + '<div class="small">' + U.esc(l.email) + '</div>'],
        ['Ditta e mansione', U.esc(d.ragione) + '<div class="small">' + U.esc(mn.nome) + '</div>'],
        ['Assunzione', U.fmtData(l.assunzione) + '<div class="small">' + U.esc(l.rapporto) + ' · ' + U.esc(l.orario) + '</div>'],
        ['Sede e matricola', U.esc(l.sede) + '<div class="small">Matricola ' + U.esc(l.matricola) + '</div>'],
        ['Medico curante', U.esc(l.medicoCurante || '—') + '<div class="small">Medico competente: Dott. ' + U.esc(U.nomeMedico(d.medicoId)) + '</div>']].map(function (b) {
          return '<div class="info-block"><div class="k">' + b[0] + '</div><div class="v">' + b[1] + '</div></div>';
        }).join('') + '</div></div>' +
      '<div class="row wrap"><span class="small muted">Ultima visita: <b>' + (ultima ? U.fmtData(ultima.data) + ' · ' + U.esc(ultima.giudizio) : 'nessuna') + '</b></span>' + (ristretto ? '' : '<span class="divider"></span><span class="small muted">Esami: <b>' + esami.length + '</b></span><span class="divider"></span><span class="small muted">Vaccinazioni: <b>' + vacc.length + '</b></span>') + '</div>' +
      '<div class="card"><div class="card-head" style="padding:0">' + UI.tabs('lav-' + id, tabs, attivo) + '</div><div class="card-body tight" style="padding:0">' + (corpoTab || UI.empty('Nessun dato in questa sezione.')) + '</div></div>';

    return {
      id: 'lavoratori', icona: 'users', titolo: U.nomeLav(l), sotto: 'Cartella del lavoratore · ' + d.ragione + ' · ' + mn.nome,
      azioni: '<a class="btn btn-sm" href="#/ditte/' + d.id + '">' + UI.ic('building') + ' Ditta</a>' + (ristretto ? '' : '<a class="btn btn-primary btn-sm" href="#/visite/nuova/' + l.id + '">' + UI.ic('heart') + ' Nuova visita</a>'),
      corpo: corpo
    };
  };

  /* ===================== MEDICI ===================== */
  VISTE.medici = function () {
    var righe = DB.medici.map(function (m) {
      return Object.assign({}, m, { _ditte: U.ditteDelMedico(m.id).length, _firma: m.firma });
    });
    var tab = UI.datatable({
      id: 'medici', righe: righe, ordine: 'nome', per: 10, placeholder: 'Cerca nome, CF, comune…',
      colonne: [
        { k: 'nome', l: 'Medico', cell: function (r) { return '<div class="row">' + UI.avatar(r.nome, true) + '<div><b>Dott. ' + U.esc(r.nome) + '</b><div class="tiny muted">' + U.esc(r.email) + '</div></div></div>'; } },
        { k: 'nascita', l: 'Nascita', cell: function (r) { return '<span class="mono small">' + U.fmtData(r.nascita) + '</span>'; } },
        { k: 'cf', l: 'Codice fiscale', cell: function (r) { return '<span class="mono small">' + U.esc(r.cf) + '</span>'; } },
        { k: 'comune', l: 'Comune', cell: function (r) { return U.esc(r.comune) + ' <span class="muted">(' + U.esc(r.prov) + ')</span>'; } },
        { k: 'tel', l: 'Telefono', cell: function (r) { return '<span class="small">' + U.esc(r.tel) + '</span>'; } },
        { k: '_ditte', l: 'Ditte', num: true },
        { k: 'regime', l: 'Disponibilità', sort: false, cell: function (r) { return UI.chip(r.regime || '—', r.regime === 'Tempo pieno' ? 'ok' : 'plain') + '<div class="tiny muted">' + U.esc(U.testoDisponibilita(r.id)) + '</div>'; } },
        { k: '_firma', l: 'Firma', cell: function (r) { return r.firma ? UI.chip('attiva', 'ok') : UI.chip('da caricare', 'warn'); } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<div class="row wrap"><button type="button" class="btn btn-xs" data-azione="dettaglio-medico" data-id="' + r.id + '">Dettaglio</button><button type="button" class="btn btn-xs" data-azione="accesso-medico" data-id="' + r.id + '">' + UI.ic('lock') + ' Accesso</button><button type="button" class="btn btn-xs" data-azione="modifica-medico" data-id="' + r.id + '">' + UI.ic('edit') + '</button></div>'; } }
      ]
    });
    return {
      id: 'medici', icona: 'stethoscope', titolo: 'Medici competenti', sotto: DB.medici.length + ' medici · firma, ditte assegnate e attività',
      azioni: '<button type="button" class="btn btn-primary" data-azione="nuovo-medico">' + UI.ic('plus') + ' Nuovo medico</button>',
      fit: true, corpo: tab
    };
  };

  AZIONI['dettaglio-medico'] = function (el) {
    var m = U.getMedico(el.dataset.id), ditte = U.ditteDelMedico(m.id);
    var ev = DB.eventi.filter(function (e) { return e.medicoId === m.id && U.giorniA(e.data) >= 0; }).sort(function (a, b) { return (a.data + a.ora).localeCompare(b.data + b.ora); }).slice(0, 5);
    var corpo = '<div class="row" style="margin-bottom:12px">' + UI.avatar(m.nome, true) + '<div><b style="font-size:15px">Dott. ' + U.esc(m.nome) + '</b><div class="small muted">' + U.esc(m.email) + ' · ' + U.esc(m.tel) + '</div></div><div class="right">' + (m.firma ? UI.chip('firma attiva', 'ok') : UI.chip('firma da caricare', 'warn')) + '</div></div>' +
      UI.kv([['Codice fiscale', U.esc(m.cf)], ['Comune', U.esc(m.comune) + ' (' + U.esc(m.prov) + ')'], ['Ditte assegnate', ditte.length], ['Prossimi appuntamenti', ev.length]]) +
      '<div class="mt"><div class="section-title"><h2>Ditte assegnate</h2><span class="count">' + ditte.length + '</span></div><div class="row wrap mt-sm">' + (ditte.map(function (d) { return '<a class="chip plain" href="#/ditte/' + d.id + '" data-azione="chiudi-modale">' + U.esc(d.ragione) + '</a>'; }).join('') || '<span class="muted small">Nessuna ditta.</span>') + '</div></div>' +
      '<div class="mt"><div class="section-title"><h2>Prossimi appuntamenti</h2><span class="count">' + ev.length + '</span></div><div class="mini-list mt-sm">' + (ev.map(function (e) { return '<div class="it"><div class="date">' + U.fmtBreve(e.data) + '</div><div class="t"><b>' + U.esc(e.titolo) + '</b><small>' + e.ora + ' · ' + U.esc(e.sottotitolo) + '</small></div></div>'; }).join('') || '<div class="pad-sm small muted">Nessun appuntamento.</div>') + '</div></div>';
    UI.apriModale({ titolo: 'Medico competente', size: 'lg', corpo: corpo, piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><button type="button" class="btn btn-primary right" data-azione="modifica-medico" data-id="' + m.id + '">' + UI.ic('edit') + ' Modifica</button>' });
  };

  /* ===================== MANSIONI ===================== */
  VISTE.mansioni = function () {
    var righe = DB.mansioni.map(function (m) {
      return Object.assign({}, m, { _lav: DB.lavoratori.filter(function (l) { return l.mansioneId === m.id; }).length, _ditte: DB.ditte.filter(function (d) { return d.mansioni.indexOf(m.id) >= 0; }).length });
    });
    var tab = UI.datatable({
      id: 'mansioni', righe: righe, ordine: 'nome', per: 10, placeholder: 'Cerca mansione o rischio…',
      colonne: [
        { k: 'nome', l: 'Mansione', cell: function (r) { return '<b>' + U.esc(r.nome) + '</b><div class="tiny muted">' + r._ditte + (r._ditte === 1 ? ' ditta' : ' ditte') + ' · ' + r._lav + ' lavoratori</div>'; } },
        { k: 'periodo', l: 'Vis. (mesi)', num: true, cell: function (r) { return '<span class="mono">' + r.periodo + '</span>'; } },
        { k: 'rischi', l: 'Rischi', sort: false, cell: function (r) { return (r.rischi || []).slice(0, 4).map(function (x) { return '<span class="chip plain">' + U.esc(x) + '</span>'; }).join(' ') + ((r.rischi || []).length > 4 ? ' <span class="tiny muted">+' + (r.rischi.length - 4) + '</span>' : ''); }, testo: function (r) { return (r.rischi || []).join(' '); } },
        { k: 'accertamenti', l: 'Accertamenti', sort: false, cell: function (r) { return '<span class="small">' + (r.accertamenti || []).slice(0, 3).map(function (a) { return U.esc(a[0]) + ' <span class="mono muted">' + a[1] + '</span>'; }).join(' · ') + ((r.accertamenti || []).length > 3 ? ' …' : '') + '</span>'; }, testo: function (r) { return (r.accertamenti || []).map(function (a) { return a[0]; }).join(' '); } },
        { k: '_lav', l: 'Lavoratori', num: true },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<div class="row"><button type="button" class="btn btn-xs" data-azione="protocollo-mansione" data-mansione="' + r.id + '">Protocollo</button><button type="button" class="btn btn-xs" data-azione="modifica-mansione" data-id="' + r.id + '">' + UI.ic('edit') + '</button></div>'; } }
      ]
    });
    return {
      id: 'mansioni', icona: 'clipboard', titolo: 'Mansioni e protocolli sanitari', sotto: DB.mansioni.length + ' mansioni · periodicità visita e accertamenti',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="mansioni" data-nome="mansioni">' + UI.ic('download') + ' Esporta</button><button type="button" class="btn btn-primary" data-azione="nuova-mansione">' + UI.ic('plus') + ' Nuova mansione</button>',
      fit: true, corpo: tab
    };
  };

})();
