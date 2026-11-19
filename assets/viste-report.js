/* =========================================================
   CLS · report: situazione generale, fatturazione, note
   ========================================================= */
(function () {
  'use strict';
  var U = window.U, UI = window.UI, DB = window.DB, AZIONI = window.AZIONI;
  window.VISTE = window.VISTE || {};

  VISTE.reportGenerale = function () {
    var righe = DB.lavoratori.map(function (l) {
      var d = U.getDitta(l.dittaId), uv = U.ultimaVisita(l.id), sc = U.scadenzaProssima(l.id);
      return Object.assign({}, l, {
        _lav: U.nomeLav(l), _ditta: d.ragione, _med: U.nomeMedico(d.medicoId), _mans: U.getMansione(l.mansioneId).nome,
        _ultima: uv ? uv.data : '', _prossima: sc ? sc.data : '', _giudizio: uv ? uv.giudizio : '', _presc: uv ? uv.prescrizioni : '',
        _esami: U.esamiLav(l.id).length, _scadenze: U.scadenzeLav(l.id).length
      });
    });
    var scadute = righe.filter(function (r) { return r._prossima && U.giorniA(r._prossima) < 0; }).length;
    var kpis = '<div class="kpis">' +
      UI.kpi({ n: righe.length, label: 'Lavoratori in sorveglianza', icona: 'users' }) +
      UI.kpi({ n: righe.filter(function (r) { return r._giudizio && /prescrizioni|limitazioni/.test(r._giudizio); }).length, label: 'Con prescrizioni o limitazioni', icona: 'clipboard', tone: 'alert' }) +
      UI.kpi({ n: scadute, label: 'Visite scadute', icona: 'alert', tone: 'danger' }) +
      UI.kpi({ n: righe.reduce(function (s, r) { return s + r._esami; }, 0), label: 'Esami in archivio', icona: 'activity' }) +
      '</div>';
    var tab = UI.datatable({
      id: 'rgenerale', righe: righe, ordine: '_lav', per: 12, placeholder: 'Cerca lavoratore, ditta, mansione, giudizio…',
      extra: [
        { k: 'dittaId', label: 'Tutte le ditte', opzioni: DB.ditte.map(function (d) { return [d.id, d.ragione]; }) },
        { k: 'medicoId', label: 'Tutti i medici', opzioni: DB.medici.map(function (m) { return [m.id, 'Dott. ' + m.nome]; }), filtra: function (r, v) { return U.getDitta(r.dittaId).medicoId === v; } }
      ],
      colonne: [
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<a href="#/ditte/' + r.dittaId + '" style="text-decoration:none" class="strong small">' + U.esc(r._ditta) + '</a>'; } },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="tiny muted">' + U.esc(r._med) + '</span>'; } },
        { k: '_lav', l: 'Lavoratore', cell: function (r) { return '<a href="#/lavoratori/' + r.id + '" style="text-decoration:none">' + U.esc(r._lav) + '</a>'; } },
        { k: 'nascita', l: 'Nascita', cell: function (r) { return '<span class="mono small">' + U.fmtData(r.nascita) + '</span>'; } },
        { k: '_mans', l: 'Mansione', cell: function (r) { return '<span class="small muted">' + U.esc(r._mans) + '</span>'; } },
        { k: '_ultima', l: 'Ultima visita', cell: function (r) { return r._ultima ? '<span class="mono small">' + U.fmtData(r._ultima) + '</span>' : '<span class="muted">—</span>'; } },
        { k: '_prossima', l: 'Successiva', cell: function (r) { return r._prossima ? UI.statusChip(r._prossima) : '<span class="muted">—</span>'; } },
        { k: '_giudizio', l: 'Giudizio', cell: function (r) { return UI.giudizioChip(r._giudizio); }, testo: function (r) { return r._giudizio; } },
        { k: '_presc', l: 'Prescrizione', sort: false, cell: function (r) { return r._presc ? '<span class="small muted truncate" style="max-width:180px;display:inline-block" title="' + U.esc(r._presc) + '">' + U.esc(r._presc) + '</span>' : '<span class="muted">—</span>'; } },
        { k: '_esami', l: 'Esami', num: true },
        { k: '_scadenze', l: 'Scadenze', num: true }
      ]
    });
    return {
      id: 'report', icona: 'grid', titolo: 'Situazione generale', sotto: 'Stato di sorveglianza per lavoratore · ' + (STATE.reportRigenerato ? 'aggiornato alle ' + STATE.reportRigenerato : 'dati consolidati'),
      fit: true,
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="rgenerale" data-nome="situazione-generale">' + UI.ic('download') + ' Esporta</button><button type="button" class="btn" data-azione="rigenera-report">' + UI.ic('refresh') + ' Rigenera report</button><a class="btn" href="#/report/fatturazione">Fatturazione</a><a class="btn" href="#/report/note">Note</a>',
      corpo: kpis + tab
    };
  };
  AZIONI['rigenera-report'] = function () {
    var ora = new Date();
    STATE.reportRigenerato = U.pad(ora.getHours()) + ':' + U.pad(ora.getMinutes());
    RENDER();
    UI.toast('Report rigenerato dai dati consolidati di visite, esami e scadenze.', 'ok');
  };

  VISTE.reportFatturazione = function () {
    var dal = STATE.filtri.fattDal || U.addGiorni(window.OGGI, -180);
    var al = STATE.filtri.fattAl || U.iso(window.OGGI);
    var righe = DB.fatturazione.filter(function (f) { return f.data >= dal && f.data <= al; }).map(function (f) {
      return Object.assign({}, f, { _ditta: U.nomeDitta(f.dittaId), _med: U.nomeMedico(f.medicoId) });
    });
    var totV = righe.reduce(function (s, r) { return s + r.visite; }, 0);
    var totE = righe.reduce(function (s, r) { return s + r.esami; }, 0);
    var totX = righe.reduce(function (s, r) { return s + r.vacc; }, 0);
    var kpis = '<div class="kpis">' +
      UI.kpi({ n: righe.length, label: 'Righe di fatturazione', icona: 'euro' }) +
      UI.kpi({ n: totV, label: 'Visite nel periodo', icona: 'heart' }) +
      UI.kpi({ n: totE, label: 'Esami', icona: 'activity' }) +
      UI.kpi({ n: righe.filter(function (r) { return r.S; }).length, label: 'Sopralluoghi (S)', icona: 'pin' }) +
      UI.kpi({ n: righe.filter(function (r) { return r.R; }).length, label: 'Riunioni periodiche (R)', icona: 'users' }) +
      '</div>';
    var filtriExtra = '<label class="small muted nowrap" for="fatt-dal">Dal</label><input id="fatt-dal" type="date" value="' + U.esc(dal) + '" data-azione="fatt-dal" style="max-width:145px;min-height:31px;font-size:12.5px">' +
      '<label class="small muted nowrap" for="fatt-al">al</label><input id="fatt-al" type="date" value="' + U.esc(al) + '" data-azione="fatt-al" style="max-width:145px;min-height:31px;font-size:12.5px">';
    var tab = UI.datatable({
      id: 'fatturazione', righe: righe, ordine: 'data', dir: -1, per: 12, placeholder: 'Cerca ditta, medico, esami…',
      extra: [{ k: 'medicoId', label: 'Tutti i medici', opzioni: DB.medici.map(function (m) { return [m.id, 'Dott. ' + m.nome]; }) }],
      filtriExtra: filtriExtra,
      colonne: [
        { k: 'data', l: 'Data attività', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<a href="#/ditte/' + r.dittaId + '" style="text-decoration:none" class="strong">' + U.esc(r._ditta) + '</a>'; } },
        { k: '_med', l: 'Medico', cell: function (r) { return '<span class="small">' + U.esc(r._med) + '</span>'; } },
        { k: 'S', l: 'S', num: true, cell: function (r) { return r.S ? UI.chip('S', 'violet') : '<span class="muted">—</span>'; } },
        { k: 'R', l: 'R', num: true, cell: function (r) { return r.R ? UI.chip('R', 'info') : '<span class="muted">—</span>'; } },
        { k: 'visite', l: 'Visite', num: true },
        { k: 'esami', l: 'Esami', num: true },
        { k: 'quali', l: 'Quali esami', sort: false, cell: function (r) { return '<span class="tiny muted truncate" style="max-width:210px;display:inline-block" title="' + U.esc(r.quali) + '">' + U.esc(r.quali) + '</span>'; } },
        { k: 'vacc', l: 'Vacc.', num: true },
        { k: 'qualiVacc', l: 'Quali vacc.', sort: false, cell: function (r) { return '<span class="tiny muted">' + U.esc(r.qualiVacc || '—') + '</span>'; } }
      ],
      totale: function (rs) {
        return '<tr><td colspan="5">Totale filtrato: <b>' + rs.length + '</b> righe</td><td class="num">' + rs.reduce(function (s, r) { return s + r.visite; }, 0) + '</td><td class="num">' + rs.reduce(function (s, r) { return s + r.esami; }, 0) + '</td><td></td><td class="num">' + rs.reduce(function (s, r) { return s + r.vacc; }, 0) + '</td><td></td></tr>';
      }
    });
    return {
      id: 'report', icona: 'euro', titolo: 'Report per fatturazione', sotto: 'Attività per ditta, medico e periodo · flag S (sopralluogo) e R (riunione)',
      fit: true,
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="fatturazione" data-nome="fatturazione">' + UI.ic('download') + ' Esporta</button><a class="btn" href="#/report/generale">Situazione generale</a><a class="btn" href="#/report/note">Note</a>',
      corpo: kpis + tab
    };
  };
  AZIONI['fatt-dal'] = function (el) { STATE.filtri.fattDal = el.value; RENDER(); };
  AZIONI['fatt-al'] = function (el) { STATE.filtri.fattAl = el.value; RENDER(); };

  VISTE.reportNote = function () {
    var righe = DB.note.map(function (n) {
      return Object.assign({}, n, { _ditta: U.nomeDitta(n.dittaId), _lav: n.lavoratoreId ? U.nomeLav(U.getLav(n.lavoratoreId)) : '' });
    });
    var tab = UI.datatable({
      id: 'rnote', righe: righe, ordine: 'data', dir: -1, per: 12, placeholder: 'Cerca ditta, tipo, lavoratore, testo…',
      extra: [{ k: 'tipo', label: 'Tutti i tipi', opzioni: Array.from(new Set(DB.note.map(function (n) { return n.tipo; }))) }],
      colonne: [
        { k: 'data', l: 'Data', cell: function (r) { return '<span class="mono">' + U.fmtData(r.data) + '</span>'; } },
        { k: '_ditta', l: 'Ditta', cell: function (r) { return '<span class="small">' + U.esc(r._ditta) + '</span>'; } },
        { k: 'tipo', l: 'Tipo', cell: function (r) { return '<span class="chip plain">' + U.esc(r.tipo) + '</span>'; } },
        { k: '_lav', l: 'Lavoratore', cell: function (r) { return r._lav ? '<span class="small">' + U.esc(r._lav) + '</span>' : '<span class="muted">—</span>'; } },
        { k: 'testo', l: 'Nota', sort: false, cell: function (r) { return '<span class="small truncate" style="max-width:420px;display:inline-block" title="' + U.esc(r.testo) + '">' + U.esc(r.testo) + '</span>'; } },
        { k: '_az', l: '', sort: false, cerca: false, cell: function (r) { return '<button type="button" class="btn btn-xs" data-azione="mostra-nota" data-data="' + r.data + '" data-ditta="' + r.dittaId + '" data-tipo="' + U.esc(r.tipo) + '" data-lav="' + (r.lavoratoreId || '') + '" data-testo="' + U.esc(r.testo) + '">Mostra</button>'; } }
      ]
    });
    return {
      id: 'report', icona: 'mail', titolo: 'Situazione note', sotto: DB.note.length + ' note aggregate da ditte, lavoratori, sopralluoghi e corsi',
      fit: true,
      azioni: '<button type="button" class="btn" data-azione="esporta-csv" data-dt="rnote" data-nome="note">' + UI.ic('download') + ' Esporta</button><a class="btn" href="#/report/generale">Situazione generale</a><a class="btn" href="#/report/fatturazione">Fatturazione</a>',
      corpo: tab
    };
  };
  AZIONI['mostra-nota'] = function (el) {
    var d = el.dataset;
    UI.apriModale({
      titolo: 'Nota · ' + U.esc(d.tipo || ''), sotto: U.fmtData(d.data) + ' · ' + U.nomeDitta(d.ditta) + (d.lav ? ' · ' + U.nomeLav(U.getLav(d.lav)) : ''),
      corpo: '<div class="note">' + U.esc(d.testo) + '</div>',
      piede: '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button>' + (d.lav ? '<a class="btn right" href="#/lavoratori/' + d.lav + '" data-azione="chiudi-modale">Scheda lavoratore</a>' : '<a class="btn right" href="#/ditte/' + d.ditta + '" data-azione="chiudi-modale">Scheda ditta</a>')
    });
  };

})();
