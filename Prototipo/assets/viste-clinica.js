/* =========================================================
   CLS · visite, esami, vaccinazioni, sopralluoghi, corsi,
          documenti e dispositivi
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};

  var OGGI_ISO = U.iso(window.OGGI);
  var ACCERTAMENTI = Object.keys(window.RISULTATI).filter(function (k) { return k !== 'DEFAULT'; });

  var FRASI_EO = {
    stato: 'Soggetto normotipo, apparente benessere soggettivo.',
    cute: 'Rosea, normoirrorata, normotrofica, normoelastica.',
    linfonodi: 'Apparentemente indenni quelle esplorabili.',
    collo: 'Capo normoconformato, normoatteggiato, globi oculari in asse. Collo cilindrico, simmetrico, normomobile attivamente e passivamente nei movimenti di flessoestensione e lateralità, non tumefazioni visibili e/o palpabili, loggia tiroidea nei limiti.',
    occhi: 'Pupille isocoriche, isocicliche, normoreagenti alla luce e all’accomodazione. Visus normale.',
    respiratorio: 'EO Torace cilindrico, colonna vertebrale in asse, cute di aspetto e colorito normale, non reticoli venosi superficiali patologici, FVT normotrasmesso su tutto l’ambito, basi normoespansibili con gli atti del respiro, SCP, MV fisiologico.',
    cardio: 'Toni cardiaci netti e puri in successione ritmica, pause apparentemente libere. Polso radiale ritmico, isosfigmico e simmetrico.',
    addome: 'Piano, mobile su tutti i quadranti con gli atti del respiro, cicatrice ombelicale normointroflessa, cute di aspetto e colorito normale, non masse e/o pulsazioni visibili, niente di rilevante al termotatto. Trattabile su tutti i quadranti sia alla palpazione superficiale che profonda.',
    fegato: 'Margine inferiore non palpabile. Manovra di Murphy negativa.',
    milza: 'Non palpabile.',
    genito: 'Manovra di Giordano negativa.',
    ernie: 'Non evidenti.',
    osteo: 'Apparentemente nella norma, in particolare mobilità articolare colonna conservata, logge muscolari paravertebrali e apofisi spinose non dolenti, Lasegue negativo, deambula in tallo-equinismo, ROT normoevocabili bilateralmente. Non parestesie arti superiori, motilità articolari arti superiori conservate, punti trigger spalle non dolenti, epitroclea ed epicondilo non dolenti bilateralmente, compressioni canali carpali negative, flesso estensioni dei polsi non dolenti, test di Tinel e Phalen negativi bilateralmente, Test di Finkelstein negativo bilateralmente.',
    psiche: 'Soggetto vigile, ben orientato nel tempo e nello spazio, tono dell’umore nei limiti della norma.'
  };

  function optsMedici(sel) { return [['', '- seleziona -']].concat(U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; })); }
  function optsLav(sel) { return [['', '- seleziona un lavoratore -']].concat(U.lavVisibili().slice().sort(function (a, b) { return U.nomeLav(a).localeCompare(U.nomeLav(b)); }).map(function (l) { return [l.id, U.nomeLav(l) + ' - ' + U.nomeDitta(l.dittaId)]; })); }
  function optsAcc(sel) { return [['', '— accertamento —']].concat(ACCERTAMENTI.map(function (a) { return [a, a]; })); }
  function risultatoOpts(acc, sel) {
    var vals = window.RISULTATI[acc] || window.RISULTATI.DEFAULT;
    return [['', '— risultato —']].concat(vals.map(function (v) { return [v, v]; }));
  }

  /* ---------- righe esame / vaccinazione ---------- */
  function rigaEsame(acc, data, risultato) {
    acc = acc || '';
    return '<div class="esami-riga" data-esame-riga>' +
      '<label class="check" title="Effettuato esternamente"><input type="checkbox" data-campo="esterno" aria-label="Effettuato esternamente"></label>' +
      '<input type="date" data-campo="data" value="' + U.esc(data || OGGI_ISO) + '" aria-label="Data esame">' +
      '<select data-campo="accertamento" data-azione="cambia-accertamento" aria-label="Accertamento">' + UI.opts(optsAcc(acc), acc) + '</select>' +
      '<select data-campo="risultato" aria-label="Risultato">' + UI.opts(risultatoOpts(acc, risultato), risultato || '') + '</select>' +
      '<textarea data-campo="note" rows="1" placeholder="Note" aria-label="Note"></textarea>' +
      '<button type="button" class="icon-btn sm" data-azione="rimuovi-riga" aria-label="Rimuovi esame">' + UI.ic('x') + '</button>' +
      '</div>';
  }
  function rigaVacc() {
    return '<div class="fgrid-3" data-vacc-riga style="border:1px solid var(--border);border-radius:8px;padding:10px;position:relative">' +
      '<div class="full"><label class="fl">Vaccinazione</label><input data-campo="tipo" placeholder="es. ANTITETANICA"></div>' +
      '<div><label class="fl">Dose 1</label><input type="date" data-campo="dose1"></div><div><label class="fl">Dose 2</label><input type="date" data-campo="dose2"></div><div><label class="fl">Dose 3</label><input type="date" data-campo="dose3"></div>' +
      '<div><label class="fl">Richiamo 1</label><input type="date" data-campo="richiamo1"></div><div><label class="fl">Richiamo 2</label><input type="date" data-campo="richiamo2"></div><div><label class="fl">Richiamo 3</label><input type="date" data-campo="richiamo3"></div>' +
      '<button type="button" class="icon-btn sm" data-azione="rimuovi-riga" aria-label="Rimuovi vaccinazione" style="position:absolute;top:6px;right:6px">' + UI.ic('x') + '</button>' +
      '</div>';
  }

  /* ===================== ELENCO VISITE ===================== */
  VISTE.visite = function () {
    var visibili = U.visiteVisibili();
    var righe = visibili.slice().sort(function (a, b) { return b.data.localeCompare(a.data) || (b.ora || '').localeCompare(a.ora || ''); }).map(function (v) {
      var l = U.getLav(v.lavoratoreId);
      return Object.assign({}, v, { _lav: U.nomeLav(l), _ditta: U.nomeDitta(v.dittaId), _med: U.nomeMedico(v.medicoId), _mans: U.getMansione(v.mansioneId).nome, _link: '#/lavoratori/' + l.id });
    });
    var tab = UI.datatable({
      id: 'visite', righe: righe, ordine: 'data', dir: -1, per: 12, placeholder: 'Cerca lavoratore, ditta, medico, tipo…',
      extra: [
        { k: 'stato', label: 'Tutte le visite', opzioni: [['eseguita', 'Eseguite'], ['programmata', 'In agenda']] },
        { k: 'tipo', label: 'Tutti i tipi', opzioni: window.TIPI_VISITA },
        { k: 'medicoId', label: 'Tutti i medici', opzioni: U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; }) }
      ],
      riga: function (r) { return r.stato === 'eseguita' ? 'class="click" data-href="#/lavoratori/' + r.lavoratoreId + '"' : 'class="click" data-href="#/agenda"'; },
      colonne: [
        { k: 'data', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span><div class="tiny muted">' + r.ora + '</div>'; } },
        { k: '_lav', l: 'Lavoratore', cell: function (r) { return '<a href="' + r._link + '" class="strong" style="text-decoration:none">' + U.esc(r._lav) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r._lav + ' ' + r._ditta; } },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: '_mans', l: 'Mansione', cell: function (r) { return '<span class="small muted">' + U.esc(r._mans) + '</span>'; } },
        { k: 'tipo', l: 'Tipo', cell: function (r) { return U.esc(r.tipo) + (r.stato === 'programmata' ? ' ' + UI.chip('in agenda', 'info') : ''); } },
        { k: 'giudizio', l: 'Giudizio', cell: function (r) { return r.stato === 'programmata' ? '<span class="muted small">da eseguire</span>' : UI.giudizioChip(r.giudizio); } },
        { k: 'sede', l: 'Sede', sort: false, cell: function (r) { return '<span class="tiny muted">' + U.esc(r.sede || '—') + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return r.stato === 'eseguita' ? '<div class="row wrap"><button type="button" class="btn btn-xs" data-azione="apri-certificato" data-visita="' + r.id + '">' + UI.ic('printer') + ' Certificato</button>' + (U.ruolo() === 'ditta' ? '<button type="button" class="btn btn-xs" data-azione="certificato-presenza" data-visita="' + r.id + '">' + UI.ic('clock') + ' Presenza</button>' : '') + '</div>' : (U.ruolo() !== 'ditta' ? '<a class="btn btn-xs" href="#/visite/nuova/' + r.lavoratoreId + '">Apri visita</a>' : '<span class="muted tiny">in agenda</span>'); } }
      ]
    });
    return {
      id: 'visite', icona: 'heart', titolo: U.ruolo() === 'ditta' ? 'Visite dei nostri lavoratori' : 'Visite mediche',
      sotto: visibili.filter(function (v) { return v.stato === 'eseguita'; }).length + ' eseguite · ' + visibili.filter(function (v) { return v.stato === 'programmata'; }).length + ' in agenda',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="visite" data-nome="visite">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() !== 'ditta' ? '<button type="button" class="btn btn-primary" data-azione="nuova-visita">' + UI.ic('plus') + ' Nuova visita</button>' : ''),
      fit: true, corpo: tab
    };
  };

  AZIONI['nuova-visita'] = function () {
    if (U.ruolo() === 'ditta') { UI.toast('Le visite si prenotano tramite il proprio medico competente.', 'err'); return; }
    UI.apriModale({
      titolo: 'Nuova visita medica', size: 'sm', sotto: 'La visita parte precompilata dall’ultima visita del lavoratore',
      corpo: '<form id="form-scelta-lav" data-form="avvia-visita" class="col">' + UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', options: optsLav(''), req: true }) +
        '<div class="note info">' + UI.ic('spark') + ' Mansione, protocollo, anamnesi ed esame obiettivo vengono precaricati. Il tipo di visita resta da selezionare.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-scelta-lav">' + UI.ic('arrow') + ' Apri visita</button>'
    });
  };
  AZIONI['avvia-visita'] = function (form) {
    var fd = new FormData(form), id = fd.get('lavoratoreId');
    if (!id || !U.puoLav({ id: id })) { UI.toast('Seleziona un lavoratore valido.', 'err'); return; }
    UI.chiudiModale();
    location.hash = '#/visite/nuova/' + id;
  };

  /* ===================== WIZARD VISITA ===================== */
  VISTE.visitaNuova = function (lavId) {
    var l = U.getLav(lavId);
    if (!l.id || !U.puoLav(l) || U.ruolo() === 'ditta') return { id: 'visite', icona: 'heart', titolo: 'Visita non disponibile', corpo: UI.empty('Seleziona un lavoratore valido e tra quelli a te assegnati.', 'lock') };
    var d = U.getDitta(l.dittaId);
    var mn = U.mansioneInDitta(d, l.mansioneId);
    var last = U.ultimaVisita(l.id);
    var cl = (last && last.clinica) || {};
    function v(name, def) { return cl[name] != null && cl[name] !== '' ? cl[name] : (def == null ? '' : def); }
    var mansioniDitta = d.mansioni.map(function (mid) { return U.mansioneInDitta(d, mid); });
    var prot = mn.accertamenti || [];
    var righeEsame = prot.filter(function (a) { return /^\d+$/.test(a[1]) || a[1] === 'O'; });
    var prefillBanner = last ? '<div class="prefill-banner">' + UI.ic('spark') + '<div><b>Visita precompilata</b> dall’ultima visita del ' + U.fmtData(last.data) + ' (Dott. ' + U.esc(U.nomeMedico(last.medicoId)) + '). I dati anamnestici e l’esame obiettivo sono riportati: verifica e aggiorna prima di salvare.</div></div>' : '<div class="note info">' + UI.ic('user') + ' Prima visita del lavoratore: la maschera parte dai valori standard del protocollo.</div>';

    var nav = ['Dati visita', 'Occupazionale', 'Esami', 'Vaccinazioni', 'Anamnesi lavorativa', 'Infortuni', 'Anamnesi fisiologica', 'Familiare', 'Patologica', 'Esame obiettivo', 'Conclusioni', 'Giudizio'].map(function (t, i) {
      return '<button type="button" class="wstep-nav" data-azione="wstep" data-step="' + i + '" aria-current="' + (i === 0 ? 'true' : 'false') + '"><span class="n">' + (i + 1) + '</span>' + t + '</button>';
    }).join('');

    /* --- step 1 --- */
    var s1 = '<section class="wstep" data-wstep><div class="ws-title">' + UI.ic('heart') + ' Dati visita <span class="muted">informazioni generali e medico</span></div><div class="wfieldset"><div class="fgrid">' +
      UI.campo({ label: 'Data visita', name: 'data_visita', type: 'date', value: OGGI_ISO, req: true }) +
      UI.campo({ label: 'Tipo di visita', name: 'tipo', type: 'select', value: '', options: [['', '— seleziona —']].concat(window.TIPI_VISITA), req: true }) +
      UI.campo({ label: 'Medico', name: 'medicoId', type: 'select', value: (last && last.medicoId) || d.medicoId, options: optsMedici((last && last.medicoId) || d.medicoId), req: true }) +
      UI.campo({ label: 'Medico esecutore', name: 'medicoEsecutore', type: 'select', value: '', options: optsMedici('') }) +
      UI.campo({ label: 'Sede della visita', name: 'sede', type: 'select', value: 'CLS — sede di Brescia', options: ['CLS — sede di Brescia', 'Sede aziendale (esterna)', 'Altro presidio'], full: true }) +
      UI.campo({ label: 'Note amministrative', name: 'note', type: 'textarea', value: '', full: true, rows: 2 }) +
      '</div></div></section>';

    /* --- step 2 --- */
    var piano = '';
    for (var i = 0; i < 15; i++) {
      var a = prot[i];
      piano += '<tr class="' + (a ? '' : 'vuota') + '"><td>' + (a ? U.esc(a[0]) : '') + '</td><td class="mono">' + (a ? a[1] : '') + '</td><td><input data-campo="forza" placeholder="—" aria-label="Periodicità forzata"></td></tr>';
    }
    var s2 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('clipboard') + ' Dati occupazionali <span class="muted">mansione e piano sanitario</span></div>' +
      '<div class="wfieldset"><div class="fgrid">' +
      UI.campo({ label: 'Mansione', name: 'mansioneId', type: 'select', value: l.mansioneId, options: mansioniDitta.map(function (x) { return [x.id, x.nome]; }), req: true }) +
      UI.campo({ label: 'Periodo visita (mesi)', name: 'periodo', type: 'number', value: mn.periodo, req: true }) +
      UI.campo({ label: 'Cancerogeni', name: 'cancerogeni', type: 'checkbox', value: false, full: true }) +
      '</div><div class="mt"><div class="eyebrow mb">Piano sanitario della mansione</div><div class="table-box"><table class="piano table-mini"><thead><tr><th>Accertamento</th><th>Periodicità mansione</th><th>Forza scadenza (mesi)</th></tr></thead><tbody>' + piano + '</tbody></table></div></div></div>' +
      '<div class="note">' + UI.ic('activity') + ' Le righe esame vengono generate solo per gli accertamenti con periodicità numerica o <b>O</b>. Le voci AB/IB non generano una riga.</div></section>';

    /* --- step 3 --- */
    var s3 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('activity') + ' Esami <span class="muted">generati dal protocollo</span></div>' +
      '<div class="wfieldset"><div class="esami-riga esami-head"><span></span><span>Data esame</span><span>Accertamento</span><span>Risultato</span><span>Note</span><span></span></div>' +
      '<div data-esami>' + (righeEsame.length ? righeEsame.map(function (a) { return rigaEsame(a[0], OGGI_ISO, ''); }).join('') : '') + '</div>' +
      '<button type="button" class="btn btn-sm mt" data-azione="aggiungi-esame">' + UI.ic('plus') + ' Aggiungi un esame</button></div></section>';

    /* --- step 4 --- */
    var s4 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('syringe') + ' Vaccinazioni <span class="muted">dosi e richiami</span></div>' +
      '<div class="wfieldset"><div class="col" data-vacc> </div><button type="button" class="btn btn-sm mt" data-azione="aggiungi-vacc">' + UI.ic('plus') + ' Nuova vaccinazione</button></div></section>';

    /* --- step 5 --- */
    function radio(name, val) {
      return '<div class="radio-row"><label><input type="radio" name="' + name + '" value="1" ' + (val === '1' ? 'checked' : '') + '> Sì</label><label><input type="radio" name="' + name + '" value="0" ' + (val === '0' ? 'checked' : '') + '> No</label></div>';
    }
    var s5 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('clipboard') + ' Anamnesi lavorativa</div><div class="wfieldset">' +
      '<label class="invariata"><input type="checkbox" name="al_invariata" value="1" checked> Non è cambiato nulla rispetto alla precedente</label>' +
      '<div><label class="fl">Descrizione attività lavorativa</label><textarea name="al_descrizione" rows="2">' + U.esc(v('al_descrizione', 'Attività lavorativa svolta presso ' + d.ragione + ' con mansione di ' + mn.nome.toLowerCase() + '.')) + '</textarea></div>' +
      '<div class="fgrid"><div><label class="fl">Esposizioni precedenti?</label>' + radio('al_esposizioni', '0') + '</div><div><label class="fl">Contemporanee esposizioni ad altri lavori?</label>' + radio('al_altri', '0') + '</div>' +
      '<div><label class="fl">Se sì, quali?</label><textarea name="al_esposizioni_desc" rows="1">' + U.esc(v('al_esposizioni_desc')) + '</textarea></div><div><label class="fl">Se sì, quali?</label><textarea name="al_altri_desc" rows="1">' + U.esc(v('al_altri_desc')) + '</textarea></div></div>' +
      '<div class="fgrid"><div><label class="fl">Utilizza DPI?</label>' + radio('al_dpi', '1') + '</div><div><label class="fl">Se sì, quali?</label><input name="al_dpi_desc" value="' + U.esc(v('al_dpi_desc', 'Guanti, calzature antinfortunistiche, occhiali protettivi')) + '"></div></div>' +
      '<div><label class="fl">Notizie utili</label><textarea name="al_note" rows="2">' + U.esc(v('al_note')) + '</textarea></div></div></section>';

    /* --- step 6 --- */
    var s6 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('alert') + ' Infortuni e malattie professionali</div><div class="wfieldset"><div class="fgrid">' +
      '<div class="full"><label class="fl">Infortunio / Malattia professionale</label><textarea name="inf_malattia" rows="2">' + U.esc(v('inf_malattia')) + '</textarea></div>' +
      '<div><label class="fl">Pratica INAIL</label><input name="inf_inail" value="' + U.esc(v('inf_inail')) + '"></div>' +
      '<div><label class="fl">Pratica civile</label><input name="inf_civile" value="' + U.esc(v('inf_civile')) + '"></div>' +
      '<div><label class="fl">Grado invalidità (%)</label><input name="inf_grado" value="' + U.esc(v('inf_grado')) + '"></div>' +
      '<div class="row wrap" style="gap:18px"><label class="check"><input type="checkbox" name="inf_asl" value="1"> Denuncia ASL</label><label class="check"><input type="checkbox" name="inf_inail_den" value="1"> Denuncia INAIL</label></div>' +
      '</div></div></section>';

    /* --- step 7 --- */
    var s7 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('user') + ' Anamnesi fisiologica</div><div class="wfieldset">' +
      '<label class="invariata"><input type="checkbox" name="fs_invariata" value="1"> Non è cambiato nulla rispetto alla visita precedente</label>' +
      '<div class="fgrid-3">' +
      UI.campo({ label: 'Titolo di studio', name: 'fs_scolarita', type: 'select', value: v('fs_scolarita', 'DIPLOMA SCUOLA SUPERIORE'), options: ['', 'NESSUNO', 'SCUOLA ELEMENTARE', 'SCUOLA MEDIA', 'FORMAZIONE PROFESSIONALE', 'DIPLOMA SCUOLA SUPERIORE', 'LAUREA', 'LAUREA SPECIALISTICA'] }) +
      UI.campo({ label: 'Servizio di leva', name: 'fs_leva', type: 'select', value: v('fs_leva', '0'), options: [['', '—'], ['1', 'Sì'], ['0', 'No']] }) +
      UI.campo({ label: 'Pasti regolari', name: 'fs_pasti', type: 'select', value: v('fs_pasti', '1'), options: [['1', 'Sì'], ['0', 'No']] }) +
      UI.campo({ label: 'Dieta', name: 'fs_dieta', value: v('fs_dieta') }) + UI.campo({ label: 'Alcool', name: 'fs_alcool', type: 'select', value: v('fs_alcool', 'NO'), options: ['', 'NO', 'SI', 'CONSUMATORE OCCASIONALE', 'CONSUMATORE ABITUALE'] }) +
      UI.campo({ label: 'Quantità / giorno', name: 'fs_alcool_q', value: v('fs_alcool_q') }) +
      UI.campo({ label: 'Caffè (n./giorno)', name: 'fs_caffe', value: v('fs_caffe', '2') }) +
      UI.campo({ label: 'Fumo', name: 'fs_fumo', type: 'select', value: v('fs_fumo', 'no'), options: [['no', 'No'], ['si', 'Sì'], ['ex fumatore', 'Ex fumatore']] }) +
      UI.campo({ label: 'N. sigarette / giorno', name: 'fs_sigarette', value: v('fs_sigarette') }) +
      UI.campo({ label: 'Pregresso', name: 'fs_pregresso', value: v('fs_pregresso') }) +
      UI.campo({ label: 'Alvo', name: 'fs_alvo', type: 'select', value: v('fs_alvo', '1'), options: [['1', 'Regolare'], ['0', 'Irregolare']] }) +
      UI.campo({ label: 'Diuresi', name: 'fs_diuresi', type: 'select', value: v('fs_diuresi', '1'), options: [['1', 'Regolare'], ['0', 'Irregolare']] }) +
      UI.campo({ label: 'Sonno', name: 'fs_sonno', type: 'select', value: v('fs_sonno', '1'), options: [['1', 'Regolare'], ['0', 'Disturbato']] }) +
      UI.campo({ label: 'Sport', name: 'fs_sport', type: 'select', value: v('fs_sport', 'NESSUNO'), options: ['', 'NESSUNO', 'ATTIVITÀ AGONISTICA', 'ATTIVITÀ DILETTANTISTICA', 'ALTRO'] }) +
      UI.campo({ label: 'Quale sport', name: 'fs_sport_quale', value: v('fs_sport_quale') }) +
      UI.campo({ label: 'Sostanze stupefacenti', name: 'fs_stupefacenti', type: 'select', value: v('fs_stupefacenti', 'NESSUNA'), options: ['', 'NESSUNA', 'CONSUMATORE SALTUARIO', 'CONSUMATORE ABITUALE'] }) +
      UI.campo({ label: 'Se sì, quali', name: 'fs_stupefacenti_q', value: v('fs_stupefacenti_q') }) +
      UI.campo({ label: 'Terapie in corso', name: 'fs_terapie', value: v('fs_terapie') }) +
      UI.campo({ label: 'Allergie', name: 'fs_allergie', value: v('fs_allergie') }) +
      (l.sesso === 'F' ? UI.campo({ label: 'Menarca', name: 'fs_menarca', value: v('fs_menarca', '12') }) + UI.campo({ label: 'Cicli mestruali', name: 'fs_cicli', type: 'select', value: v('fs_cicli', 'regolari'), options: ['regolari', 'irregolari', 'menopausa'] }) + UI.campo({ label: 'Gravidanze a termine', name: 'fs_gravidanze', value: v('fs_gravidanze', '0') }) + UI.campo({ label: 'Aborti', name: 'fs_aborti', value: v('fs_aborti', '0') }) : '') +
      '<div class="full"><label class="fl">Note</label><textarea name="fs_note" rows="2">' + U.esc(v('fs_note')) + '</textarea></div></div></div></section>';

    /* --- step 8 --- */
    var s8 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('users') + ' Anamnesi familiare</div><div class="wfieldset"><div class="row wrap" style="gap:18px"><label class="check"><input type="checkbox" name="af_invariata" value="1" checked> Invariata</label><label class="check"><input type="checkbox" name="af_negativa" value="1"> Negativa</label></div><div><label class="fl">Descrizione</label><textarea name="af_desc" rows="3">' + U.esc(v('af_desc', 'Nessuna familiarità degna di nota per patologie rilevanti ai fini lavorativi.')) + '</textarea></div></div></section>';

    /* --- step 9 --- */
    var s9 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('clipboard') + ' Anamnesi patologica</div><div class="wfieldset"><label class="invariata"><input type="checkbox" name="ap_invariata" value="1"> Invariata</label><div><label class="fl">Remota</label><textarea name="ap_remota" rows="2">' + U.esc(v('ap_remota')) + '</textarea></div><div><label class="fl">Prossima</label><textarea name="ap_prossima" rows="2">' + U.esc(v('ap_prossima')) + '</textarea></div></div></section>';

    /* --- step 10 --- */
    function area(campo, label, cols) {
      var val = v('eo_' + campo, campo === 'stato' ? FRASI_EO.stato : '');
      if (['cute', 'linfonodi', 'collo', 'occhi', 'respiratorio', 'cardio', 'addome', 'fegato', 'milza', 'genito', 'ernie', 'osteo', 'psiche'].indexOf(campo) >= 0 && !cl['eo_' + campo]) val = FRASI_EO[campo];
      return '<div class="' + (cols ? 'full' : '') + '"><label class="fl">' + label + '</label><div class="textarea-default"><button type="button" class="def" data-azione="eo-default" data-campo="' + campo + '">default</button><textarea name="eo_' + campo + '" rows="2">' + U.esc(val) + '</textarea></div></div>';
    }
    var s10 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('stethoscope') + ' Esame obiettivo <span class="muted">antropometria e distretti</span></div>' +
      '<div class="wfieldset"><div class="row wrap"><button type="button" class="btn btn-sm" data-azione="eo-tutti">' + UI.ic('spark') + ' Inserisci frasi di default nei campi vuoti</button><span class="small muted">BMI calcolato automaticamente da altezza e peso.</span></div>' +
      '<div class="eo-grid">' +
      area('stato', 'Stato generale', true) +
      '<div><label class="fl">Altezza (cm)</label><div class="row"><input type="number" name="eo_altezza" data-bmi value="' + U.esc(v('eo_altezza', '175')) + '"><span class="small muted">cm</span></div></div>' +
      '<div><label class="fl">Peso (kg)</label><div class="row"><input type="number" name="eo_peso" data-bmi value="' + U.esc(v('eo_peso', '78')) + '"><span class="bmi" data-bmi-out>BMI: —</span></div></div>' +
      area('cute', 'Cute e annessi') + area('linfonodi', 'Stazioni linfoghiandolari') +
      area('collo', 'Capo e collo', true) + area('occhi', 'Occhi: visus e altro', true) +
      area('respiratorio', 'Apparato respiratorio / torace', true) + area('cardio', 'Apparato cardiocircolatorio', true) +
      '<div class="fgrid-3 full"><div><label class="fl">P. MAX</label><input name="eo_pa_max" value="' + U.esc(v('eo_pa_max', '120')) + '"></div><div><label class="fl">P. MIN</label><input name="eo_pa_min" value="' + U.esc(v('eo_pa_min', '80')) + '"></div><div><label class="fl">F.C. (b/m)</label><input name="eo_fc" value="' + U.esc(v('eo_fc', '78')) + '"></div></div>' +
      '<div class="full"><label class="fl">Cuore</label><div class="seg seg-sm" style="padding:2px">' + ['', 'ritmico', 'aritmico'].map(function (x) { return '<label class="check" style="padding:4px 8px"><input type="radio" name="eo_cuore" value="' + x + '" ' + (v('eo_cuore', 'ritmico') === x ? 'checked' : '') + '> ' + (x || 'non rilevato') + '</label>'; }).join('') + '</div></div>' +
      area('addome', 'Addome', true) + area('fegato', 'Fegato') + area('milza', 'Milza') +
      area('genito', 'Apparato genito-urinario') + area('ernie', 'Ernie') +
      area('osteo', 'Apparato osteoarticolare', true) + area('psiche', 'Sistema nervoso', true) +
      area('altro', 'Altri rilievi', true) +
      '</div></div></section>';

    /* --- step 11 --- */
    var s11 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('file') + ' Valutazioni conclusive / diagnosi</div><div class="wfieldset"><div><label class="fl">Conclusioni</label><textarea name="conclusioni" rows="5" placeholder="Sintesi clinica e valutazione conclusiva">' + U.esc(v('conclusioni')) + '</textarea></div></div></section>';

    /* --- step 12 --- */
    var s12 = '<section class="wstep" data-wstep hidden><div class="ws-title">' + UI.ic('shield') + ' Giudizio di idoneità <span class="muted">firma e invio automatico</span></div>' +
      '<div class="wfieldset"><div class="fgrid">' +
      UI.campo({ label: 'Idoneità', name: 'giudizio', type: 'select', value: '', options: [['', '— esprimi il giudizio —']].concat(window.GIUDIZI), req: true, full: true }) +
      UI.campo({ label: 'Prescrizioni / limitazioni', name: 'prescrizioni', type: 'textarea', value: v('prescrizioni'), rows: 2, full: true }) +
      UI.campo({ label: 'Note del giudizio', name: 'giud_note', type: 'textarea', value: v('giud_note'), rows: 2, full: true }) +
      UI.campo({ label: 'Trasmesso per mezzo', name: 'mezzo', type: 'select', value: 'Consegnata a mano al Datore di lavoro', options: window.MEZZI }) +
      UI.campo({ label: 'Visita successiva (mesi)', name: 'successiva', type: 'number', value: mn.periodo, req: true, help: 'Imposta la scadenza della prossima visita.' }) +
      '</div></div>' +
      '<div class="note ok">' + UI.ic('shield') + ' Al salvataggio il certificato viene <b>firmato digitalmente</b>, archiviato e inviato via email al lavoratore e all’azienda.</div></section>';

    var wizard = '<form id="form-visita" data-wizard data-form="salva-visita" novalidate><input type="hidden" name="lavoratoreId" value="' + l.id + '"><div class="wizard-body">' + s1 + s2 + s3 + s4 + s5 + s6 + s7 + s8 + s9 + s10 + s11 + s12 + '</div></form>';

    var corpo = prefillBanner + '<div class="row wrap"><div class="row"><span class="avatar-md">' + U.esc(U.iniziali(U.nomeLav(l))) + '</span><div><b>' + U.esc(U.nomeLav(l)) + '</b><div class="small muted">' + U.esc(d.ragione) + ' · ' + U.esc(mn.nome) + ' · ' + U.eta(l.nascita) + ' anni</div></div></div><span class="right small muted">Protocollo: ' + prot.filter(function (a) { return /^\d+$/.test(a[1]) || a[1] === 'O'; }).length + ' esami generati · periodo ' + mn.periodo + ' mesi</span></div>' +
      '<div class="card"><div class="wizard-steps">' + nav + '</div>' + wizard +
      '<div class="wizard-foot"><span class="small muted nowrap" data-progress>Passo <b>1</b> di 12</span><button type="button" class="btn btn-sm" data-azione="wstep-rel" data-delta="-1">' + UI.ic('left') + ' Indietro</button><button type="button" class="btn btn-sm" data-azione="wstep-rel" data-delta="1">Avanti ' + UI.ic('right') + '</button>' +
      '<div class="right row"><a class="btn" href="#/lavoratori/' + l.id + '">Annulla</a><button type="submit" class="btn btn-primary" form="form-visita">' + UI.ic('save') + ' Salva e chiudi visita</button></div></div></div>';

    return {
      id: 'visite', icona: 'heart', titolo: 'Nuova visita medica', sotto: U.nomeLav(l) + ' · ' + d.ragione + ' · compilazione guidata in 12 passi',
      azioni: '<a class="btn btn-sm" href="#/lavoratori/' + l.id + '">' + UI.ic('user') + ' Scheda lavoratore</a><a class="btn btn-sm" href="#/visite">Elenco visite</a>',
      corpo: corpo,
      dopo: aggiornaProgresso
    };
  };

  function aggiornaProgresso() {
    var form = document.querySelector('[data-wizard]');
    if (!form) return;
    var steps = form.querySelectorAll('[data-wstep]');
    var idx = 0;
    steps.forEach(function (s, i) { if (!s.hidden) idx = i; });
    var pr = document.querySelector('[data-progress]');
    if (pr) pr.innerHTML = 'Passo <b>' + (idx + 1) + '</b> di ' + steps.length;
    document.querySelectorAll('.wstep-nav').forEach(function (b, i) {
      b.setAttribute('aria-current', i === idx ? 'true' : 'false');
      b.classList.toggle('done', i < idx);
    });
    var h = form.querySelector('[name="eo_altezza"]'), p = form.querySelector('[name="eo_peso"]'), out = form.querySelector('[data-bmi-out]');
    if (h && p && out) {
      var hv = Number(h.value), pv = Number(p.value);
      out.innerHTML = hv > 0 && pv > 0 ? 'BMI: <b>' + (pv / Math.pow(hv / 100, 2)).toFixed(2) + '</b>' : 'BMI: —';
    }
  }

  AZIONI['wstep'] = function (el) {
    var form = document.querySelector('[data-wizard]');
    if (!form) return;
    var steps = form.querySelectorAll('[data-wstep]');
    var n = Math.max(0, Math.min(steps.length - 1, Number(el.dataset.step)));
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    document.querySelectorAll('.wstep-nav').forEach(function (b, i) {
      b.setAttribute('aria-current', i === n ? 'true' : 'false');
      b.classList.toggle('done', i < n);
    });
    var pr = document.querySelector('[data-progress]');
    if (pr) pr.innerHTML = 'Passo <b>' + (n + 1) + '</b> di ' + steps.length;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  AZIONI['wstep-rel'] = function (el) {
    var form = document.querySelector('[data-wizard]');
    if (!form) return;
    var steps = form.querySelectorAll('[data-wstep]');
    var idx = 0;
    steps.forEach(function (s, i) { if (!s.hidden) idx = i; });
    var n = Math.max(0, Math.min(steps.length - 1, idx + Number(el.dataset.delta)));
    steps.forEach(function (s, i) { s.hidden = i !== n; });
    document.querySelectorAll('.wstep-nav').forEach(function (b, i) {
      b.setAttribute('aria-current', i === n ? 'true' : 'false');
      b.classList.toggle('done', i < n);
    });
    var pr = document.querySelector('[data-progress]');
    if (pr) pr.innerHTML = 'Passo <b>' + (n + 1) + '</b> di ' + steps.length;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  AZIONI['eo-default'] = function (el) {
    var t = document.querySelector('[data-wizard] textarea[name="eo_' + el.dataset.campo + '"]');
    if (t && FRASI_EO[el.dataset.campo]) t.value = FRASI_EO[el.dataset.campo];
  };
  AZIONI['eo-tutti'] = function () {
    Object.keys(FRASI_EO).forEach(function (k) {
      var t = document.querySelector('[data-wizard] textarea[name="eo_' + k + '"]');
      if (t && !t.value.trim()) t.value = FRASI_EO[k];
    });
    UI.toast('Frasi standard inserite nei campi vuoti.', 'ok');
  };
  AZIONI['aggiungi-esame'] = function () {
    var cont = document.querySelector('[data-esami]');
    if (!cont) return;
    cont.insertAdjacentHTML('beforeend', rigaEsame('', OGGI_ISO, ''));
    var last = cont.lastElementChild;
    if (last) last.querySelector('[data-campo="accertamento"]').focus();
  };
  AZIONI['aggiungi-vacc'] = function () {
    var cont = document.querySelector('[data-vacc]');
    if (!cont) return;
    cont.insertAdjacentHTML('beforeend', rigaVacc());
  };
  AZIONI['rimuovi-riga'] = function (el) {
    var riga = el.closest('[data-esame-riga],[data-vacc-riga]');
    if (riga) riga.remove();
  };
  AZIONI['cambia-accertamento'] = function (el) {
    var riga = el.closest('[data-esame-riga]');
    if (!riga) return;
    var res = riga.querySelector('[data-campo="risultato"]');
    if (res) res.innerHTML = UI.opts(risultatoOpts(el.value, ''), '');
  };

  AZIONI['salva-visita'] = function (form) {
    var fd = new FormData(form);
    var l = U.getLav(fd.get('lavoratoreId'));
    var req = ['data_visita', 'tipo', 'medicoId', 'mansioneId', 'periodo', 'giudizio', 'successiva'];
    var mancante = req.find(function (k) { return !String(fd.get(k) || '').trim(); });
    if (mancante) {
      var campo = form.querySelector('[name="' + mancante + '"]');
      if (campo) {
        var step = campo.closest('[data-wstep]');
        var steps = form.querySelectorAll('[data-wstep]');
        var idx = Array.prototype.indexOf.call(steps, step);
        if (idx >= 0) AZIONI['wstep']({ dataset: { step: idx } });
        campo.focus();
      }
      UI.toast('Completa i campi obbligatori prima di salvare la visita.', 'err');
      return;
    }
    var d = U.getDitta(l.dittaId);
    var prog = U.prossimaVisita(l.id);
    var nuova = !prog;
    var v = prog || { id: 'v' + Date.now() };
    var clinica = {};
    fd.forEach(function (val, key) { clinica[key] = val; });
    Object.assign(v, {
      stato: 'eseguita', lavoratoreId: l.id, dittaId: l.dittaId, medicoId: fd.get('medicoId'), medicoEsecutore: fd.get('medicoEsecutore'),
      mansioneId: fd.get('mansioneId'), data: fd.get('data_visita'), ora: (prog && prog.ora) || '09:00', tipo: fd.get('tipo'),
      sede: fd.get('sede'), note: fd.get('note'), giudizio: fd.get('giudizio'), prescrizioni: fd.get('prescrizioni'),
      giudNote: fd.get('giud_note'), mezzo: fd.get('mezzo'), successiva: Number(fd.get('successiva')) || 0,
      durata: (prog && prog.durata) || U.durataMedia(fd.get('medicoId')),
      modalita: /esterna/i.test(fd.get('sede') || '') ? 'esterna' : 'sede',
      sala: /esterna/i.test(fd.get('sede') || '') ? (prog && prog.sala) || '' : (prog && prog.sala) || 'Sala 1',
      cancerogeni: fd.get('cancerogeni') === '1', clinica: clinica
    });
    if (nuova) DB.visite.push(v);
    // rimuove l'appuntamento dall'agenda, se presente
    DB.eventi = DB.eventi.filter(function (e) { return e.rifId !== v.id; });

    // esami
    var nEsami = 0;
    form.querySelectorAll('[data-esame-riga]').forEach(function (row) {
      var acc = row.querySelector('[data-campo="accertamento"]').value;
      if (!acc) return;
      DB.esami.push({
        id: 'e' + Date.now() + '-' + (++nEsami), visitaId: v.id, lavoratoreId: l.id, dittaId: l.dittaId, medicoId: v.medicoId,
        data: row.querySelector('[data-campo="data"]').value || v.data, accertamento: acc,
        risultato: row.querySelector('[data-campo="risultato"]').value || 'ESAME EFFETTUATO',
        esterno: row.querySelector('[data-campo="esterno"]').checked,
        note: row.querySelector('[data-campo="note"]').value, giudizioIdoneita: '', prescrizioni: '', stampato: false
      });
    });
    // vaccinazioni
    var nVacc = 0;
    form.querySelectorAll('[data-vacc-riga]').forEach(function (row) {
      var tipo = row.querySelector('[data-campo="tipo"]').value.trim();
      if (!tipo) return;
      DB.vaccinazioni.push({
        id: 'x' + Date.now() + '-' + (++nVacc), lavoratoreId: l.id, dittaId: l.dittaId, tipo: tipo,
        dose1: row.querySelector('[data-campo="dose1"]').value, dose2: row.querySelector('[data-campo="dose2"]').value,
        dose3: row.querySelector('[data-campo="dose3"]').value, richiamo1: row.querySelector('[data-campo="richiamo1"]').value,
        richiamo2: row.querySelector('[data-campo="richiamo2"]').value, richiamo3: row.querySelector('[data-campo="richiamo3"]').value,
        esterne: [], note: ''
      });
    });
    // scadenza prossima visita
    var sc = DB.scadenze.find(function (s) { return s.lavoratoreId === l.id && s.tipo === 'Visita'; });
    var prossimaData = U.addMesi(v.data, Number(v.successiva) || 0);
    if (sc) { sc.data = prossimaData; sc.fissata = false; sc.note = 'Calcolata dalla visita del ' + U.fmtData(v.data); }
    else DB.scadenze.push({ id: 's' + Date.now(), entita: 'Lavoratore', tipo: 'Visita', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, cosa: 'Visita periodica', descrizione: 'Mansione: ' + U.getMansione(v.mansioneId).nome, data: prossimaData, medicoId: v.medicoId, fissata: false, note: '' });
    // certificato firmato e inviato
    DB.documenti.unshift({
      id: 'doc' + Date.now(), tipo: 'Giudizio di idoneità', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id,
      anno: U.asDate(v.data).getFullYear(), dataDoc: v.data, stato: 'Firmato e inviato', generatoIl: U.iso(window.OGGI),
      email: l.email + ' · ' + (d.emailVisite || d.email), visitaId: v.id, firma: 'Dott. ' + U.nomeMedico(v.medicoId)
    });
    U.ricalcolaConflitti();
    UI.chiudiModale();
    location.hash = '#/lavoratori/' + l.id;
    RENDER();
    UI.toast('Visita salvata. Certificato firmato e inviato a ' + l.email + '.', 'ok');
    setTimeout(function () { UI.stampa('Certificato di idoneità · ' + U.nomeLav(l), UI.certificato(v), 'Firmato digitalmente e inviato automaticamente'); }, 120);
  };

  /* ---------- certificato / dettaglio visita ---------- */
  AZIONI['apri-certificato'] = function (el) {
    var v = DB.visite.find(function (x) { return x.id === el.dataset.visita; });
    if (!v) return;
    if (v.stato !== 'eseguita' || !v.giudizio) { AZIONI['apri-visita'](el); return; }
    UI.stampa('Certificato di idoneità · ' + U.nomeLav(U.getLav(v.lavoratoreId)), UI.certificato(v), U.fmtData(v.data) + ' · firmato digitalmente');
  };
  AZIONI['apri-visita'] = function (el) {
    var v = DB.visite.find(function (x) { return x.id === (el.dataset.visita || el.dataset.id); });
    if (!v) return;
    var l = U.getLav(v.lavoratoreId);
    var corpo = '<div class="row" style="margin-bottom:12px"><div class="grow"><b style="font-size:15px">' + U.fmtLunga(v.data) + ' · ' + U.esc(v.tipo) + '</b><div class="small muted">' + U.esc(U.nomeDitta(v.dittaId)) + ' · ' + U.esc(U.getMansione(v.mansioneId).nome) + '</div></div>' + (v.stato === 'eseguita' ? UI.giudizioChip(v.giudizio) : UI.chip('in agenda', 'info')) + '</div>' +
      UI.kv([['Lavoratore', U.esc(U.nomeLav(l))], ['Medico', 'Dott. ' + U.esc(U.nomeMedico(v.medicoId))], ['Sede', U.esc(v.sede || '—')], ['Prossima visita', v.successiva ? 'tra ' + v.successiva + ' mesi' : '—'], ['Prescrizioni', U.esc(v.prescrizioni || '—')], ['Trasmissione', U.esc(v.mezzo || '—')]]) +
      (v.stato === 'eseguita' ? '<div class="note ok mt">' + UI.ic('shield') + ' Certificato firmato digitalmente e inviato il ' + U.fmtData(v.data) + '.</div>' : '<div class="note info mt">' + UI.ic('calendar') + ' Visita programmata, non ancora eseguita. Apri la compilazione per registrare il giudizio.</div>');
    UI.apriModale({
      titolo: 'Visita medica', sotto: U.esc(U.nomeLav(l)), size: 'lg', corpo: corpo,
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><div class="right row"><a class="btn" href="#/lavoratori/' + l.id + '" data-azione="chiudi-modale">' + UI.ic('user') + ' Cartella</a>' +
        (v.stato === 'eseguita' ? '<button type="button" class="btn btn-primary" data-azione="apri-certificato" data-visita="' + v.id + '">' + UI.ic('printer') + ' Certificato</button>' : '<a class="btn btn-primary" href="#/visite/nuova/' + l.id + '" data-azione="chiudi-modale">' + UI.ic('heart') + ' Compila visita</a>') + '</div>'
    });
  };

  /* ===================== ESAMI ===================== */
  VISTE.esami = function () {
    var visibili = U.esamiVisibili();
    var righe = visibili.slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).map(function (e) {
      var l = U.getLav(e.lavoratoreId);
      return Object.assign({}, e, { _lav: U.nomeLav(l), _ditta: U.nomeDitta(e.dittaId), _med: U.nomeMedico(e.medicoId) });
    });
    var tab = UI.datatable({
      id: 'esami', righe: righe, ordine: 'data', dir: -1, per: 12, placeholder: 'Cerca lavoratore, accertamento, risultato…',
      extra: [
        { k: 'accertamento', label: 'Tutti gli accertamenti', opzioni: ACCERTAMENTI },
        { k: 'medicoId', label: 'Tutti i medici', opzioni: U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; }) }
      ],
      colonne: [
        { k: 'data', l: 'Data esame', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
        { k: '_lav', l: 'Lavoratore', cell: function (r) { return '<a href="#/lavoratori/' + r.lavoratoreId + '" style="text-decoration:none" class="strong">' + U.esc(r._lav) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r._lav + ' ' + r._ditta; } },
        { k: 'accertamento', l: 'Accertamento', cell: function (r) { return '<b>' + U.esc(r.accertamento) + '</b>' + (r.esterno ? ' ' + UI.chip('esterno', 'info') : ''); } },
        { k: 'risultato', l: 'Risultato', cell: function (r) { return '<span class="chip ' + (/DA RIPETERE|NON PERVENUTO/.test(r.risultato) ? 'warn' : /ALTERAZIONI|POSITIVO|NON PROTETTO/.test(r.risultato) ? 'err' : 'ok') + '">' + U.esc(r.risultato) + '</span>'; } },
        { k: 'giudizioIdoneita', l: 'Giudizio', sort: false, cell: function (r) { return r.giudizioIdoneita ? UI.chip(r.giudizioIdoneita, 'info') : '<span class="muted">—</span>'; } },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small muted">' + U.esc(r._med) + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<div class="row"><button type="button" class="btn btn-xs" data-azione="apri-referto" data-id="' + r.id + '">' + UI.ic('download') + (U.ruolo() === 'ditta' ? ' Scarica referto' : ' Referto') + '</button>' + (U.ruolo() !== 'ditta' ? '<button type="button" class="btn btn-xs" data-azione="nuovo-esame" data-lav="' + r.lavoratoreId + '">' + UI.ic('edit') + '</button>' : '') + '</div>'; } }
      ]
    });
    return {
      id: 'esami', icona: 'activity', titolo: 'Esami e accertamenti', sotto: visibili.length + ' esami · referti esterni e da verificare',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="esami" data-nome="esami">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() !== 'ditta' ? '<button type="button" class="btn btn-primary" data-azione="nuovo-esame">' + UI.ic('plus') + ' Nuovo esame</button>' : ''),
      fit: true, corpo: tab
    };
  };

  AZIONI['nuovo-esame'] = function (el) {
    if (U.ruolo() === 'ditta') { UI.toast('Gli esami vengono registrati dal medico o dalla segreteria CLS.', 'err'); return; }
    var lavId = el.dataset.lav || '';
    var lavScelto = lavId ? U.getLav(lavId) : null;
    var medDefault = lavScelto && lavScelto.id ? U.getDitta(lavScelto.dittaId).medicoId : '';
    UI.apriModale({
      titolo: 'Nuovo esame', size: 'lg', sotto: 'Dati dell’accertamento e giudizio autonomo',
      corpo: '<form id="form-esame" data-form="salva-esame" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', value: lavId, options: optsLav(lavId), req: true, full: true, attrs: 'data-azione="esame-lav"' }) +
        UI.campo({ label: 'Data esame', name: 'data', type: 'date', value: OGGI_ISO, req: true }) +
        UI.campo({ label: 'Medico', name: 'medicoId', type: 'select', value: medDefault, options: optsMedici(medDefault), req: true }) +
        UI.campo({ label: 'Accertamento', name: 'accertamento', type: 'select', options: optsAcc(''), req: true, attrs: 'data-azione="cambia-acc-esame"' }) +
        UI.campo({ label: 'Risultato', name: 'risultato', type: 'select', options: risultatoOpts('', ''), req: true }) +
        UI.campo({ label: 'Effettuato esternamente', name: 'esterno', type: 'checkbox', value: false }) +
        UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', full: true, rows: 2 }) +
        '<div class="full"><div class="eyebrow">Giudizio autonomo dell’esame (opzionale)</div></div>' +
        UI.campo({ label: 'Idoneità', name: 'giudizioIdoneita', type: 'select', value: '', options: [['', '—'], 'Idoneo alla mansione specifica', 'Idoneo con prescrizioni', 'Idoneo con limitazioni', 'Non idoneo temporaneamente', 'Non idoneo permanentemente', 'In attesa di accertamenti'] }) +
        UI.campo({ label: 'Prescrizioni', name: 'prescrizioni', value: '' }) +
        '</div><div class="note info">' + UI.ic('activity') + ' Il risultato dipende dall’accertamento selezionato. Gli esami esterni vengono marcati per la fatturazione.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-esame">' + UI.ic('save') + ' Salva esame</button>'
    });
  };
  AZIONI['cambia-acc-esame'] = function (el) {
    var form = el.closest('form'), res = form && form.querySelector('[name="risultato"]');
    if (res) res.innerHTML = UI.opts(risultatoOpts(el.value, ''), '');
  };
  AZIONI['esame-lav'] = function (el) {
    var l = U.getLav(el.value), f = el.closest('form');
    if (!l.id || !f) return;
    var med = f.querySelector('[name="medicoId"]');
    if (med && !med.value) med.value = U.getDitta(l.dittaId).medicoId;
  };
  AZIONI['sopr-ditta'] = function (el) {
    var d = U.getDitta(el.value), f = el.closest('form');
    if (!d.id || !f) return;
    var med = f.querySelector('[name="medicoId"]');
    if (med && !med.value) med.value = d.medicoId;
    var att = f.querySelector('[name="attivita"]');
    if (att && !att.value) att.value = d.attivita || '';
  };

  AZIONI['salva-esame'] = function (form) {
    var fd = new FormData(form);
    var l = U.getLav(fd.get('lavoratoreId'));
    if (!l.id) { UI.toast('Seleziona un lavoratore.', 'err'); return; }
    var d = U.getDitta(l.dittaId);
    var e = {
      id: 'e' + Date.now(), visitaId: '', lavoratoreId: l.id, dittaId: l.dittaId,
      medicoId: fd.get('medicoId') || d.medicoId, data: fd.get('data'), accertamento: fd.get('accertamento'),
      risultato: fd.get('risultato'), esterno: fd.get('esterno') === '1', note: fd.get('note'),
      giudizioIdoneita: fd.get('giudizioIdoneita'), prescrizioni: fd.get('prescrizioni'), stampato: false
    };
    DB.esami.push(e);
    var prot = (U.getMansione(l.mansioneId).accertamenti || []).find(function (a) { return a[0] === e.accertamento; });
    if (prot && /^\d+$/.test(prot[1])) {
      DB.scadenze.push({ id: 's' + Date.now(), entita: 'Lavoratore', tipo: 'Accertamento', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, cosa: e.accertamento, descrizione: 'Periodicità ' + prot[1] + ' mesi', data: U.addMesi(e.data, Number(prot[1])), medicoId: e.medicoId, fissata: false, note: '' });
    }
    UI.chiudiModale(); RENDER();
    UI.toast('Esame registrato. Scadenza aggiornata se prevista dal protocollo.', 'ok');
  };
  AZIONI['apri-referto'] = function (el) {
    var e = DB.esami.find(function (x) { return x.id === el.dataset.id; });
    if (!e) return;
    var l = U.getLav(e.lavoratoreId), d = U.getDitta(e.dittaId);
    var html = '<div class="print-doc"><div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. — Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863">Referto<br>' + U.fmtData(e.data) + '</div></div>' +
      '<h3>Referto di accertamento</h3><div class="cert-sub">' + U.esc(e.accertamento) + '</div>' +
      '<div class="cert-body"><div class="cert-row"><span class="k">Lavoratore</span><span>' + U.esc(U.nomeLav(l)) + ' — ' + U.fmtData(l.nascita) + '</span></div>' +
      '<div class="cert-row"><span class="k">Ditta</span><span>' + U.esc(d.ragione) + '</span></div>' +
      '<div class="cert-row"><span class="k">Data esame</span><span>' + U.fmtData(e.data) + '</span></div>' +
      '<div class="cert-row"><span class="k">Eseguito</span><span>' + (e.esterno ? 'Laboratorio esterno' : 'Presso CLS') + '</span></div>' +
      '<div class="cert-row"><span class="k">Medico</span><span>Dott. ' + U.esc(U.nomeMedico(e.medicoId)) + '</span></div></div>' +
      '<div class="cert-giudizio">' + U.esc(e.risultato) + '</div>' +
      (e.note ? '<div style="font-size:12px"><b>Note:</b> ' + U.esc(e.note) + '</div>' : '') +
      (e.giudizioIdoneita ? '<div class="mt" style="font-size:12px"><b>Giudizio:</b> ' + U.esc(e.giudizioIdoneita) + (e.prescrizioni ? ' — ' + U.esc(e.prescrizioni) : '') + '</div>' : '') +
      '<div class="firma"><div class="f"><b>Dott. ' + U.esc(U.nomeMedico(e.medicoId)) + '</b>Firma del medico</div></div><div class="meta"><span>CLS S.r.l.</span><span>Referto ' + U.esc(e.id.toUpperCase()) + '</span></div></div>';
    UI.stampa('Referto · ' + e.accertamento, html, U.nomeLav(l) + ' · ' + U.fmtData(e.data));
  };

  /* ===================== VACCINAZIONI ===================== */
  VISTE.vaccinazioni = function () {
    var visibili = U.vaccinazioniVisibili();
    var righe = visibili.map(function (v) {
      var l = U.getLav(v.lavoratoreId);
      var ultima = v.richiamo3 || v.richiamo2 || v.richiamo1 || v.dose3 || v.dose1;
      return Object.assign({}, v, { _lav: U.nomeLav(l), _ditta: U.nomeDitta(v.dittaId), _next: ultima ? U.addMesi(ultima, 60) : '' });
    });
    var tab = UI.datatable({
      id: 'vaccinazioni', righe: righe, ordine: '_lav', per: 10, placeholder: 'Cerca lavoratore, ditta, vaccinazione…',
      extra: [{ k: 'dittaId', label: 'Tutte le ditte', opzioni: U.ditteVisibili().map(function (d) { return [d.id, d.ragione]; }) }],
      colonne: [
        { k: '_lav', l: 'Lavoratore', cell: function (r) { return '<a href="#/lavoratori/' + r.lavoratoreId + '" style="text-decoration:none" class="strong">' + U.esc(r._lav) + '</a><div class="tiny muted">' + U.esc(r._ditta) + '</div>'; }, testo: function (r) { return r._lav + ' ' + r._ditta; } },
        { k: 'tipo', l: 'Vaccinazione', cell: function (r) { return '<b>' + U.esc(r.tipo) + '</b>'; } },
        { k: 'dose1', l: 'Dose 1', cell: function (r) { return U.fmtData(r.dose1); } },
        { k: 'dose2', l: 'Dose 2', cell: function (r) { return U.fmtData(r.dose2); } },
        { k: 'dose3', l: 'Dose 3', cell: function (r) { return U.fmtData(r.dose3); } },
        { k: 'richiamo1', l: 'Richiamo 1', cell: function (r) { return U.fmtData(r.richiamo1); } },
        { k: 'richiamo2', l: 'Richiamo 2', cell: function (r) { return U.fmtData(r.richiamo2); } },
        { k: '_next', l: 'Prossimo richiamo', cell: function (r) { return r._next ? UI.statusChip(r._next) : '<span class="muted">—</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-xs" data-azione="nuova-vaccinazione" data-lav="' + r.lavoratoreId + '">' + UI.ic('edit') + ' Aggiorna</button>' : '<span class="muted tiny">—</span>'; } }
      ]
    });
    return {
      id: 'vaccinazioni', icona: 'syringe', titolo: 'Vaccinazioni', sotto: visibili.length + ' vaccinazioni · dosi, richiami e scadenze',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="vaccinazioni" data-nome="vaccinazioni">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-primary" data-azione="nuova-vaccinazione">' + UI.ic('plus') + ' Nuova vaccinazione</button>' : ''),
      fit: true, corpo: tab
    };
  };

  AZIONI['nuova-vaccinazione'] = function (el) {
    if (U.ruolo() !== 'operatore') { UI.toast('Le vaccinazioni vengono registrate dalla segreteria CLS.', 'err'); return; }
    var lavId = el.dataset.lav || '';
    UI.apriModale({
      titolo: 'Vaccinazione', size: 'lg', sotto: 'Dosi, richiami e prestazioni esterne',
      corpo: '<form id="form-vacc" data-form="salva-vaccinazione" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', value: lavId, options: optsLav(lavId), req: true, full: true }) +
        UI.campo({ label: 'Tipo di vaccinazione', name: 'tipo', value: 'ANTITETANICA', req: true, full: true }) +
        UI.campo({ label: 'Dose 1', name: 'dose1', type: 'date', value: '' }) + UI.campo({ label: 'Dose 2', name: 'dose2', type: 'date', value: '' }) +
        UI.campo({ label: 'Dose 3', name: 'dose3', type: 'date', value: '' }) + UI.campo({ label: 'Richiamo 1', name: 'richiamo1', type: 'date', value: '' }) +
        UI.campo({ label: 'Richiamo 2', name: 'richiamo2', type: 'date', value: '' }) + UI.campo({ label: 'Richiamo 3', name: 'richiamo3', type: 'date', value: '' }) +
        UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', full: true, rows: 2 }) +
        '</div><div class="note info">' + UI.ic('clock') + ' Il richiamo genera automaticamente la scadenza vaccinale.</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-vacc">' + UI.ic('save') + ' Salva vaccinazione</button>'
    });
  };
  AZIONI['salva-vaccinazione'] = function (form) {
    var fd = new FormData(form);
    var l = U.getLav(fd.get('lavoratoreId'));
    if (!l.id) { UI.toast('Seleziona un lavoratore.', 'err'); return; }
    var v = {
      id: 'x' + Date.now(), lavoratoreId: l.id, dittaId: l.dittaId, tipo: fd.get('tipo'),
      dose1: fd.get('dose1'), dose2: fd.get('dose2'), dose3: fd.get('dose3'),
      richiamo1: fd.get('richiamo1'), richiamo2: fd.get('richiamo2'), richiamo3: fd.get('richiamo3'),
      esterne: [], note: fd.get('note')
    };
    DB.vaccinazioni.push(v);
    var ultima = v.richiamo3 || v.richiamo2 || v.richiamo1 || v.dose3 || v.dose1;
    if (ultima) DB.scadenze.push({ id: 's' + Date.now(), entita: 'Lavoratore', tipo: 'Vaccinazione', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, cosa: v.tipo, descrizione: 'Richiamo vaccinale', data: U.addMesi(ultima, 60), medicoId: U.getDitta(l.dittaId).medicoId, fissata: false, note: '' });
    UI.chiudiModale(); RENDER(); UI.toast('Vaccinazione registrata e scadenza richiamo calcolata.', 'ok');
  };

  /* ===================== SOPRALLUOGHI ===================== */
  VISTE.sopralluoghi = function () {
    var visibili = U.sopralluoghiVisibili();
    var righe = visibili.slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).map(function (s) {
      return Object.assign({}, s, { _ditta: U.nomeDitta(s.dittaId), _med: U.nomeMedico(s.medicoId), _igiene: s.igiene || '—' });
    });
    var tab = UI.datatable({
      id: 'sopralluoghi', righe: righe, ordine: 'data', dir: -1, per: 10, placeholder: 'Cerca ditta, medico, note…',
      extra: [
        { k: 'medicoId', label: 'Tutti i medici', opzioni: U.mediciVisibili().map(function (m) { return [m.id, 'Dott. ' + m.nome]; }) },
        { k: 'igiene', label: 'Condizioni igieniche', opzioni: ['buone', 'mediocre', 'scarse'] }
      ],
      colonne: [
        { k: 'data', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>' + (r.stato === 'programmato' ? ' ' + UI.chip('in agenda', 'info') : ''); } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<a href="#/ditte/' + r.dittaId + '" style="text-decoration:none" class="strong">' + U.esc(r._ditta) + '</a>'; } },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: '_igiene', l: 'Igiene', cell: function (r) { return '<span class="chip ' + (r.igiene === 'buone' ? 'ok' : r.igiene === 'mediocre' ? 'warn' : 'err') + '">' + U.esc(r._igiene) + '</span>'; } },
        { k: 'dvr', l: 'DVR', sort: false, cell: function (r) { return r.dvr ? UI.chip('sì', 'ok') : UI.chip('no', 'warn'); } },
        { k: 'informale', l: 'Informale', sort: false, cell: function (r) { return r.informale ? UI.chip('sì', 'info') : '<span class="muted">—</span>'; } },
        { k: 'pronto', l: 'Pronto', sort: false, cell: function (r) { return r.pronto ? UI.chip('sì', 'ok') : UI.chip('no', 'plain'); } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<div class="row"><button type="button" class="btn btn-xs" data-azione="stampa-sopralluogo" data-id="' + r.id + '">' + UI.ic('printer') + '</button><button type="button" class="btn btn-xs" data-azione="nuovo-sopralluogo" data-ditta="' + r.dittaId + '">' + UI.ic('edit') + '</button></div>'; } }
      ]
    });
    return {
      id: 'sopralluoghi', icona: 'pin', titolo: 'Sopralluoghi', sotto: visibili.length + ' verbali · ambienti di lavoro, DVR e infortuni',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="sopralluoghi" data-nome="sopralluoghi">' + UI.ic('download') + ' Esporta</button><button type="button" class="btn btn-primary" data-azione="nuovo-sopralluogo">' + UI.ic('plus') + ' Nuovo sopralluogo</button>',
      fit: true, corpo: tab
    };
  };

  AZIONI['nuovo-sopralluogo'] = function (el) {
    var dittaId = el.dataset.ditta || '';
    if (U.ruolo() === 'ditta' || (dittaId && !U.puoDitta(dittaId))) { UI.toast('Sopralluogo non disponibile per questa azienda.', 'err'); return; }
    var optsD = [['', '— seleziona —']].concat(U.ditteVisibili().filter(function (d) { return !d.cessazione; }).map(function (d) { return [d.id, d.ragione]; }));
    var medDefault = dittaId ? U.getDitta(dittaId).medicoId : '';
    UI.apriModale({
      titolo: 'Sopralluogo', size: 'lg', sotto: 'Verbale, infortuni, DVR e comunicazione al cliente',
      corpo: '<form id="form-sopr" data-form="salva-sopralluogo" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Ditta', name: 'dittaId', type: 'select', value: dittaId, options: optsD, req: true, attrs: 'data-azione="sopr-ditta"' }) +
        UI.campo({ label: 'Data', name: 'data', type: 'date', value: OGGI_ISO, req: true }) +
        UI.campo({ label: 'Medico', name: 'medicoId', type: 'select', value: medDefault, options: optsMedici(medDefault), req: true }) +
        UI.campo({ label: 'Prossimo sopralluogo (mesi)', name: 'prossimo', type: 'number', value: 12 }) +
        UI.campo({ label: 'Luogo cassetta di soccorso', name: 'cassetta', value: '', full: true }) +
        UI.campo({ label: 'Descrizione attività lavorativa', name: 'attivita', type: 'textarea', value: '', full: true, rows: 2 }) +
        UI.campo({ label: 'Rischi lavorativi', name: 'rischi', type: 'textarea', value: '', full: true, rows: 2 }) +
        '<div class="full"><div class="eyebrow mb">Infortuni e DVR</div><div class="fgrid">' +
        UI.campo({ label: 'Infortuni', name: 'infortuni', type: 'select', options: [['no', 'No'], ['si', 'Sì']] }) +
        UI.campo({ label: 'Dettaglio infortuni', name: 'infortuniDett', value: '' }) +
        UI.campo({ label: 'DVR presente', name: 'dvr', type: 'select', options: [['1', 'Sì'], ['0', 'No']] }) +
        UI.campo({ label: 'Data DVR', name: 'dvrData', type: 'date', value: '' }) +
        UI.campo({ label: 'Note DVR', name: 'dvrNote', value: '', full: true }) +
        '</div></div>' +
        UI.campo({ label: 'Protezioni adottate', name: 'protezioni', type: 'textarea', value: '', full: true, rows: 2 }) +
        UI.campo({ label: 'Condizioni igieniche', name: 'igiene', type: 'select', options: ['buone', 'mediocre', 'scarse'] }) +
        UI.campo({ label: 'Pronto da stampare', name: 'pronto', type: 'select', options: [['0', 'No'], ['1', 'Sì']] }) +
        UI.campo({ label: 'Note per relazione annuale', name: 'noteRelazione', type: 'textarea', value: '', full: true, rows: 2 }) +
        UI.campo({ label: 'Comunicazione interna per il cliente', name: 'comunicazione', type: 'textarea', value: '', full: true, rows: 2 }) +
        UI.campo({ label: 'Sopralluogo informale', name: 'informale', type: 'checkbox', value: false }) +
        '</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-sopr">' + UI.ic('save') + ' Salva sopralluogo</button>'
    });
  };
  AZIONI['salva-sopralluogo'] = function (form) {
    var fd = new FormData(form);
    var d = U.getDitta(fd.get('dittaId'));
    if (!d.id) { UI.toast('Seleziona una ditta.', 'err'); return; }
    var s = {
      id: 'so' + Date.now(), dittaId: d.id, medicoId: fd.get('medicoId') || d.medicoId, data: fd.get('data'), stato: 'eseguito',
      cassetta: fd.get('cassetta'), prossimo: Number(fd.get('prossimo')) || 12, indirizzo: '', infortuni: fd.get('infortuni'),
      infortuniDett: fd.get('infortuniDett'), dvr: fd.get('dvr') === '1', dvrData: fd.get('dvrData'), dvrNote: fd.get('dvrNote'),
      attivita: fd.get('attivita'), rischi: fd.get('rischi'), protezioni: 'si', protezioniQuali: fd.get('protezioni'),
      igiene: fd.get('igiene'), noteRelazione: fd.get('noteRelazione'), comunicazione: fd.get('comunicazione'),
      pronto: fd.get('pronto') === '1', noteAdmin: '', informale: fd.get('informale') === '1'
    };
    DB.sopralluoghi.push(s);
    DB.scadenze.push({ id: 's' + Date.now(), entita: 'Ditta', tipo: 'Sopralluogo', soggetto: d.ragione, dittaId: d.id, cosa: 'Sopralluogo periodico', descrizione: 'Verifica ambienti di lavoro', data: U.addMesi(s.data, s.prossimo), medicoId: s.medicoId, fissata: false, note: '' });
    if (s.pronto) DB.documenti.unshift({ id: 'doc' + Date.now(), tipo: 'Verbale sopralluogo', soggetto: d.ragione, dittaId: d.id, lavoratoreId: '', anno: 2026, dataDoc: s.data, stato: 'Pronto', generatoIl: U.iso(window.OGGI), email: d.emailVisite, visitaId: '', firma: '' });
    UI.chiudiModale(); RENDER(); UI.toast('Sopralluogo registrato. Scadenza del prossimo sopralluogo creata.', 'ok');
  };
  AZIONI['stampa-sopralluogo'] = function (el) {
    var s = DB.sopralluoghi.find(function (x) { return x.id === el.dataset.id; });
    if (!s) return;
    var d = U.getDitta(s.dittaId), med = U.getMedico(s.medicoId);
    var html = '<div class="print-doc"><div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. — Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863">Verbale<br>' + U.fmtData(s.data) + '</div></div>' +
      '<h3>Verbale di sopralluogo</h3><div class="cert-sub">' + U.esc(d.ragione) + ' — ' + U.esc(d.citta) + ' (' + U.esc(d.prov) + ')</div>' +
      '<div class="cert-body"><div class="cert-row"><span class="k">Data</span><span>' + U.fmtData(s.data) + '</span></div>' +
      '<div class="cert-row"><span class="k">Medico</span><span>Dott. ' + U.esc(med.nome) + '</span></div>' +
      '<div class="cert-row"><span class="k">Attività</span><span>' + U.esc(s.attivita || d.attivita) + '</span></div>' +
      '<div class="cert-row"><span class="k">Rischi</span><span>' + U.esc(s.rischi || '—') + '</span></div>' +
      '<div class="cert-row"><span class="k">Condizioni igieniche</span><span>' + U.esc(s.igiene) + '</span></div>' +
      '<div class="cert-row"><span class="k">DVR</span><span>' + (s.dvr ? 'Presente' + (s.dvrData ? ' — aggiornato il ' + U.fmtData(s.dvrData) : '') : 'Non presente') + '</span></div>' +
      '<div class="cert-row"><span class="k">Infortuni</span><span>' + (s.infortuni === 'si' ? U.esc(s.infortuniDett || 'Sì') : 'Nessun infortunio segnalato') + '</span></div>' +
      '<div class="cert-row"><span class="k">Protezioni</span><span>' + U.esc(s.protezioniQuali || '—') + '</span></div></div>' +
      '<p style="font-size:12px;margin-top:12px">' + U.esc(s.noteRelazione || '') + '</p>' +
      (s.comunicazione ? '<div class="note" style="margin-top:10px">' + U.esc(s.comunicazione) + '</div>' : '') +
      '<div class="firma"><div class="f"><b>Dott. ' + U.esc(med.nome) + '</b>Firma del medico competente</div></div>' +
      '<div class="meta"><span>CLS S.r.l. · Verbale di sopralluogo</span><span>Pagina 1 di 1</span></div></div>';
    UI.stampa('Verbale di sopralluogo · ' + d.ragione, html, U.fmtData(s.data) + (s.informale ? ' · informale' : ''));
  };

  /* ===================== CORSI ===================== */
  VISTE.corsi = function () {
    var visibili = U.corsiVisibili();
    var righe = visibili.slice().sort(function (a, b) { return b.data.localeCompare(a.data); }).map(function (c) {
      return Object.assign({}, c, { _ditta: U.nomeDitta(c.dittaId) });
    });
    var tab = UI.datatable({
      id: 'corsi', righe: righe, ordine: 'data', dir: -1, per: 10, placeholder: 'Cerca ditta, corso, nominativo…',
      extra: [{ k: 'dittaId', label: 'Tutte le ditte', opzioni: U.ditteVisibili().map(function (d) { return [d.id, d.ragione]; }) }],
      colonne: [
        { k: 'data', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<a href="#/ditte/' + r.dittaId + '" style="text-decoration:none" class="strong">' + U.esc(r._ditta) + '</a>'; } },
        { k: 'nome', l: 'Corso', cell: function (r) { return '<b>' + U.esc(r.nome) + '</b><div class="tiny muted">' + U.esc(r.rischio) + '</div>'; } },
        { k: 'nominativo', l: 'Nominativo', cell: function (r) { return '<span class="small">' + U.esc(r.nominativo) + '</span>'; } },
        { k: 'scadenza', l: 'Scadenza', cell: function (r) { return UI.statusChip(r.scadenza); } },
        { k: 'ore', l: 'Ore', num: true },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-xs" data-azione="nuovo-corso" data-ditta="' + r.dittaId + '">' + UI.ic('edit') + ' Nuovo</button>' : '<span class="muted tiny">—</span>'; } }
      ]
    });
    return {
      id: 'corsi', icona: 'grad', titolo: 'Corsi e sicurezza', sotto: visibili.length + ' corsi · formazione, scadenze e nominativi',
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="corsi" data-nome="corsi">' + UI.ic('download') + ' Esporta</button>' + (U.ruolo() === 'operatore' ? '<button type="button" class="btn btn-primary" data-azione="nuovo-corso">' + UI.ic('plus') + ' Nuovo corso</button>' : ''),
      fit: true, corpo: tab
    };
  };
  AZIONI['nuovo-corso'] = function (el) {
    if (U.ruolo() !== 'operatore') { UI.toast('I corsi vengono programmati dalla segreteria CLS.', 'err'); return; }
    var dittaId = el.dataset.ditta || '';
    UI.apriModale({
      titolo: 'Nuovo corso', size: 'lg', sotto: 'Formazione e aggiornamento sicurezza',
      corpo: '<form id="form-corso" data-form="salva-corso" class="col"><div class="fgrid">' +
        UI.campo({ label: 'Ditta', name: 'dittaId', type: 'select', value: dittaId, options: [['', '— seleziona —']].concat(U.ditteVisibili().filter(function (d) { return !d.cessazione; }).map(function (d) { return [d.id, d.ragione]; })), req: true }) +
        UI.campo({ label: 'Tipo di corso', name: 'nome', value: 'Formazione generale sicurezza (4 ore)', req: true }) +
        UI.campo({ label: 'Data corso', name: 'data', type: 'date', value: OGGI_ISO }) +
        UI.campo({ label: 'Nominativo', name: 'nominativo', value: 'Tutti i dipendenti' }) +
        UI.campo({ label: 'Scadenza', name: 'scadenza', type: 'date', value: U.addMesi(OGGI_ISO, 60) }) +
        UI.campo({ label: 'Ore', name: 'ore', type: 'number', value: 4 }) +
        UI.campo({ label: 'Rischio', name: 'rischio', value: 'Generale' }) +
        UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', full: true, rows: 2 }) +
        '</div></form>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-corso">' + UI.ic('save') + ' Salva corso</button>'
    });
  };
  AZIONI['salva-corso'] = function (form) {
    var fd = new FormData(form);
    var d = U.getDitta(fd.get('dittaId'));
    if (!d.id) { UI.toast('Seleziona una ditta.', 'err'); return; }
    DB.corsi.push({ id: 'c' + Date.now(), dittaId: d.id, nome: fd.get('nome'), data: fd.get('data'), nominativo: fd.get('nominativo'), scadenza: fd.get('scadenza'), ore: Number(fd.get('ore')) || 4, rischio: fd.get('rischio'), note: fd.get('note') });
    DB.scadenze.push({ id: 's' + Date.now(), entita: 'Ditta', tipo: 'Corso', soggetto: d.ragione, dittaId: d.id, cosa: fd.get('nome'), descrizione: fd.get('nominativo') + ' · ' + fd.get('ore') + ' ore', data: fd.get('scadenza'), medicoId: d.medicoId, fissata: false, note: '' });
    UI.chiudiModale(); RENDER(); UI.toast('Corso registrato e scadenza creata.', 'ok');
  };

  /* ===================== DOCUMENTI E DISPOSITIVI ===================== */
  VISTE.documenti = function () {
    if (!STATE.dt.documenti) STATE.dt.documenti = { q: '', sort: 'dataDoc', dir: -1, page: 1, per: 10, ex: {} };
    var visibili = U.documentiVisibili();
    var operatore = U.ruolo() === 'operatore';
    var righe = visibili.slice().sort(function (a, b) { return (b.dataDoc || '').localeCompare(a.dataDoc || ''); }).map(function (x) {
      return Object.assign({}, x, { _ditta: U.nomeDitta(x.dittaId) });
    });
    var devices = DB.dispositivi.map(function (dev) {
      return '<div class="device"><div class="head">' + UI.ic(dev.tipo === 'ECG' ? 'heart' : dev.tipo === 'Scanner / OCR IA' ? 'file' : 'activity') + '<b>' + U.esc(dev.nome) + '</b><span class="right">' + UI.chip(dev.stato, dev.stato === 'Connesso' || dev.stato === 'VPN attiva' ? 'ok' : 'warn', { dot: true }) + '</span></div>' +
        '<div class="meta">' + U.esc(dev.tipo) + ' · seriale ' + U.esc(dev.seriale) + '<br>' + U.esc(dev.rete) + ' · ultimo accesso ' + U.esc(dev.ultimo) + '</div>' +
        '<div class="acts"><button type="button" class="btn btn-sm" data-azione="ingest-dispositivo" data-dev="' + dev.id + '">' + UI.ic('download') + ' Acquisisci referto</button><button type="button" class="btn btn-sm" data-azione="verifica-dispositivo" data-dev="' + dev.id + '">' + UI.ic('wifi') + ' Verifica</button></div></div>';
    }).join('');

    var tab = UI.datatable({
      id: 'documenti', righe: righe, ordine: 'dataDoc', dir: -1, per: 10, placeholder: 'Cerca documento, soggetto, stato…',
      extra: [
        { k: 'tipo', label: 'Tutti i tipi', opzioni: ['Giudizio di idoneità', 'Piano di Sorveglianza (PSS)', 'Relazione Annuale (RFA)', 'Verbale sopralluogo', 'Cartella sanitaria', 'Referto strumentale'] },
        { k: 'stato', label: 'Tutti gli stati', opzioni: ['Firmato e inviato', 'Firmato', 'Pronto', 'Stampato', 'Bozza', 'Da inviare', 'Inviato', 'Acquisito'] }
      ],
      colonne: [
        { k: 'tipo', l: 'Documento', cell: function (r) { return '<b>' + U.esc(r.tipo) + '</b><div class="tiny muted">' + U.esc(r.soggetto) + '</div>'; } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<span class="small">' + U.esc(r._ditta) + '</span>'; } },
        { k: 'anno', l: 'Anno', num: true },
        { k: 'dataDoc', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.dataDoc) + '</span>'; } },
        { k: 'stato', l: 'Stato', cell: function (r) { return UI.chip(r.stato, /Firmato|Pronto|Stampato|Inviato|Acquisito/.test(r.stato) ? 'ok' : 'warn'); } },
        { k: 'email', l: 'Destinatario', sort: false, cell: function (r) { return '<span class="tiny muted">' + U.esc(r.email || '—') + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<div class="row"><button type="button" class="btn btn-xs" data-azione="apri-documento" data-id="' + r.id + '">' + UI.ic('eye') + '</button>' + (r.email && U.ruolo() !== 'ditta' ? '<button type="button" class="btn btn-xs" data-azione="invia-documento" data-id="' + r.id + '">' + UI.ic('send') + '</button>' : '') + '</div>'; } }
      ]
    });

    var corpo = (operatore ? '<div class="doc-grid">' + devices + '</div>' +
      '<div class="note info">' + UI.ic('wifi') + ' I dispositivi portatili in mobilità si collegano tramite <strong>VPN</strong>: le vecchie chiavette USB non sono più utilizzate. Lo scanner con OCR/IA riconosce i referti cartacei e li abbina al paziente.</div>' : '') +
      UI.card({
        titolo: operatore ? 'Archivio documenti' : U.ruolo() === 'ditta' ? 'Documenti della nostra azienda' : 'Documenti delle aziende assegnate',
        icona: 'file', sub: visibili.length + ' documenti',
        azioni: (operatore ? '<button type="button" class="btn btn-sm" data-azione="scansiona-referto">' + UI.ic('spark') + ' Scansione IA</button>' : '') + '<button type="button" class="btn btn-sm" data-azione="esporta-csv" data-dt="documenti" data-nome="documenti">' + UI.ic('download') + ' Esporta</button>',
        corpo: tab, tight: true
      });

    return {
      id: 'documenti', icona: 'file', titolo: operatore ? 'Documenti e dispositivi' : 'Documenti',
      sotto: operatore ? 'Certificati firmati, referti, archivi e strumenti diagnostici' : 'Certificati, piani di sorveglianza e referti a te disponibili',
      azioni: operatore ? '<button type="button" class="btn" data-azione="sync-dispositivi">' + UI.ic('refresh') + ' Verifica dispositivi</button><button type="button" class="btn btn-primary" data-azione="scansiona-referto">' + UI.ic('spark') + ' Acquisisci referto</button>' : '<button type="button" class="btn" data-azione="esporta-csv" data-dt="documenti" data-nome="documenti">' + UI.ic('download') + ' Esporta elenco</button>',
      corpo: corpo
    };
  };

  AZIONI['verifica-dispositivo'] = function (el) {
    var dev = DB.dispositivi.find(function (d) { return d.id === el.dataset.dev; });
    if (!dev) return;
    dev.ultimo = '10/11/2026 10:12';
    UI.toast(dev.nome + ': connessione verificata, riferimenti aggiornati.', 'ok');
    RENDER();
  };
  AZIONI['sync-dispositivi'] = function () {
    DB.dispositivi.forEach(function (d) { d.ultimo = '10/11/2026 10:15'; d.stato = d.stato === 'Offline' ? 'Connesso' : d.stato; });
    RENDER(); UI.toast('Tutti i dispositivi rispondono. Sincronizzazione completata.', 'ok');
  };

  function formIngestione(dev) {
    return '<form id="form-ingest" data-form="salva-ingestione" class="col"><input type="hidden" name="dispositivo" value="' + (dev ? dev.id : '') + '"><div class="fgrid">' +
      UI.campo({ label: 'Dispositivo', name: 'dispositivoLabel', value: dev ? dev.nome : 'Scanner / OCR IA', attrs: 'readonly' }) +
      UI.campo({ label: 'Data referto', name: 'data', type: 'date', value: OGGI_ISO }) +
      UI.campo({ label: 'Lavoratore', name: 'lavoratoreId', type: 'select', options: optsLav(''), req: true, full: true }) +
      UI.campo({ label: 'Accertamento', name: 'accertamento', type: 'select', value: dev && /Spiro/i.test(dev.nome) ? 'SPIROMETRIA' : dev && /Elettro/i.test(dev.nome) ? 'ECG' : '', options: optsAcc(dev && /Spiro/i.test(dev.nome) ? 'SPIROMETRIA' : dev && /Elettro/i.test(dev.nome) ? 'ECG' : ''), req: true }) +
      UI.campo({ label: 'Risultato', name: 'risultato', type: 'select', options: risultatoOpts('', '') }) +
      UI.campo({ label: 'Note', name: 'note', type: 'textarea', value: '', full: true, rows: 2 }) +
      '</div><div class="note ok">' + UI.ic('check') + ' Il PDF viene allegato alla cartella del paziente e il referto viene letto automaticamente.</div></form>';
  }

  AZIONI['ingest-dispositivo'] = function (el) {
    var dev = DB.dispositivi.find(function (d) { return d.id === el.dataset.dev; });
    UI.apriModale({
      titolo: 'Acquisisci referto da dispositivo', size: 'lg', sotto: dev ? dev.nome + ' · ' + dev.rete : '',
      corpo: formIngestione(dev),
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-ingest">' + UI.ic('download') + ' Acquisisci e abbina</button>'
    });
  };
  AZIONI['scansiona-referto'] = function () {
    UI.apriModale({
      titolo: 'Acquisizione ottica / IA', size: 'lg', sotto: 'Scansione di referti cartacei con riconoscimento automatico',
      corpo: '<div class="note info mb">' + UI.ic('spark') + ' Trascina qui un PDF o una scansione: il sistema riconosce paziente, accertamento e risultato e propone l’abbinamento alla cartella.</div>' + formIngestione(null),
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="submit" class="btn btn-primary right" form="form-ingest">' + UI.ic('spark') + ' Conferma e archivia</button>'
    });
  };
  AZIONI['salva-ingestione'] = function (form) {
    var fd = new FormData(form);
    var l = U.getLav(fd.get('lavoratoreId'));
    if (!l.id) { UI.toast('Seleziona il lavoratore a cui abbinare il referto.', 'err'); return; }
    var e = { id: 'e' + Date.now(), visitaId: '', lavoratoreId: l.id, dittaId: l.dittaId, medicoId: U.getDitta(l.dittaId).medicoId, data: fd.get('data'), accertamento: fd.get('accertamento'), risultato: fd.get('risultato') || 'ESAME EFFETTUATO', esterno: false, note: fd.get('note') || 'Referto acquisito da dispositivo.', giudizioIdoneita: '', prescrizioni: '', stampato: false };
    DB.esami.push(e);
    DB.documenti.unshift({ id: 'doc' + Date.now(), tipo: 'Referto strumentale', soggetto: U.nomeLav(l), dittaId: l.dittaId, lavoratoreId: l.id, anno: 2026, dataDoc: e.data, stato: 'Acquisito', generatoIl: U.iso(window.OGGI), email: l.email, visitaId: '', firma: '' });
    UI.chiudiModale(); RENDER();
    UI.toast('Referto acquisito e abbinato a ' + U.nomeLav(l) + '.', 'ok');
  };
  AZIONI['invia-documento'] = function (el) {
    var doc = DB.documenti.find(function (d) { return d.id === el.dataset.id; });
    if (!doc) return;
    doc.stato = 'Inviato';
    UI.toast('Documento inviato a ' + (doc.email || 'destinatario') + ' (simulazione).', 'ok');
    RENDER();
  };

})();
