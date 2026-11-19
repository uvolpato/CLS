/* =========================================================
   CLS · componenti UI riusabili (icone, datatable, modali…)
   ========================================================= */
(function () {
  'use strict';
  var U = window.U;

  var ICONS = {
    home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-2h4v2"/>',
    users: '<circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.7c2 .7 3.2 2.4 3.5 5.3"/>',
    stethoscope: '<path d="M6 3v5a4 4 0 0 0 8 0V3"/><path d="M10 12v2.5a4.5 4.5 0 0 0 9 0V12"/><circle cx="19" cy="10" r="2"/>',
    clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 9h6M9 13h6M9 17h4"/>',
    syringe: '<path d="m18 2 4 4M17 3l4 4M14 6l4 4M6 14 14 6l4 4-8 8H6v-4Z"/><path d="m9 11 4 4M4 20l2-2"/>',
    pin: '<path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    grad: '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v4c0 1.5 2.7 3 6 3s6-1.5 6-3v-4M22 9v5"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    check: '<path d="m4 12.5 5 5L20 6.5"/>',
    left: '<path d="m15 5-7 7 7 7"/>',
    right: '<path d="m9 5 7 7-7 7"/>',
    down: '<path d="m5 9 7 7 7-7"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5"/><path d="M4 20h16"/>',
    printer: '<path d="M7 8V3h10v5"/><rect x="4" y="8" width="16" height="8" rx="2"/><path d="M7 16h10v5H7z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6.5"/><path d="M20 4v7h-7"/>',
    alert: '<path d="M12 3 2 20h20L12 3Z"/><path d="M12 9v5M12 17h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 12h6M9 16h6"/>',
    activity: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.5 3h-4l-.4 3a7 7 0 0 0-1.7 1l-2.3-1-2 3.4L6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.4 3h4l.4-3a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4L20 8l-4-4L4 16v4Z"/><path d="m14 6 4 4"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    link: '<path d="M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1"/>',
    database: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    logout: '<path d="M9 21H4V3h5M16 17l5-5-5-5M21 12H9"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.8-4.2 4-6.3 8-6.3s7.2 2.1 8 6.3"/>',
    shield: '<path d="M12 2 4 5v6c0 5.3 3.4 9 8 11 4.6-2 8-5.7 8-11V5l-8-3Z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.7"/>',
    play: '<path d="M7 4v16l13-8L7 4Z"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/>',
    wifi: '<path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>',
    heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1Z"/>',
    send: '<path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/>',
    save: '<path d="M4 3h13l3 3v15H4z"/><path d="M8 3v6h8V3M8 21v-7h8v7"/>',
    history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1L8 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2Z"/>',
    euro: '<path d="M18 6a7 7 0 1 0 0 12M4 10h9M4 14h9"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7l10-5Z"/><path d="m2 12 10 5 10-5M2 17l10 5 10-5"/>',
    inbox: '<path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4"/>'
  };
  function ic(name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || ICONS.grid) + '</svg>';
  }

  var UI = {
    ic: ic,
    chip: function (testo, tone, opts) {
      tone = tone || '';
      return '<span class="chip ' + tone + ' ' + ((opts && opts.lg) ? 'lg' : '') + '">' + (opts && opts.dot ? '<span class="dot ' + tone + '"></span>' : '') + testo + '</span>';
    },
    dot: function (tone) { return '<span class="dot ' + (tone || '') + '"></span>'; },
    avatar: function (nome, md) { return '<span class="' + (md ? 'avatar-md' : 'avatar-sm') + '">' + U.esc(U.iniziali(nome)) + '</span>'; },
    kpi: function (o) {
      var tag = o.href ? 'a' : 'div';
      return '<' + tag + ' class="kpi ' + (o.tone || '') + '"' + (o.href ? ' href="' + o.href + '"' : '') + '><div class="n">' + o.n + (o.unita ? '<small>' + o.unita + '</small>' : '') + (o.trend ? '<span class="trend ' + (o.trendTone || '') + '">' + o.trend + '</span>' : '') + '</div><div class="l">' + (o.icona ? ic(o.icona) : '') + o.label + '</div></' + tag + '>';
    },
    card: function (o) {
      return '<div class="card ' + (o.cls || '') + '">' +
        (o.titolo ? '<div class="card-head"><h2>' + (o.icona ? ic(o.icona) + ' ' : '') + o.titolo + '</h2>' + (o.sub ? '<span class="sub">' + o.sub + '</span>' : '') + (o.azioni ? '<div class="right row wrap">' + o.azioni + '</div>' : '') + '</div>' : '') +
        (o.corpo != null ? '<div class="card-body ' + (o.tight ? 'tight' : '') + '">' + o.corpo + '</div>' : '') +
        (o.piede ? '<div class="card-foot">' + o.piede + '</div>' : '') + '</div>';
    },
    empty: function (msg, icona) { return '<div class="empty">' + ic(icona || 'search', 'bi xl') + msg + '</div>'; },
    statusChip: function (data) {
      var s = U.statoScadenza(data);
      return '<span class="chip ' + s.tone + '">' + s.label + '</span>';
    },
    giudizioChip: function (g) {
      if (!g) return '<span class="chip plain">—</span>';
      var t = U.chipGiudizio(g);
      var breve = g.replace(' alla mansione specifica', '').replace('Non è possibile esprimere il giudizio d\'idoneità perché non ha completato gli esami previsti dal protocollo di sorveglianza sanitaria', 'Esami protocollo incompleti');
      return '<span class="chip ' + t + '" title="' + U.esc(g) + '">' + U.esc(breve) + '</span>';
    },
    tabs: function (chiave, items, attivo) {
      return '<div class="tabbar" role="tablist">' + items.map(function (i) {
        var id = typeof i === 'string' ? i : i.id;
        var label = typeof i === 'string' ? i : i.label;
        var n = typeof i === 'string' ? '' : i.n;
        return '<button type="button" role="tab" aria-selected="' + (id === attivo ? 'true' : 'false') + '" data-azione="tab" data-chiave="' + chiave + '" data-tab="' + id + '">' + label + (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    },
    kv: function (coppie, cls) {
      return '<dl class="kv ' + (cls || '') + '">' + coppie.map(function (c) { return '<div><dt>' + c[0] + '</dt><dd>' + (c[1] == null || c[1] === '' ? '—' : c[1]) + '</dd></div>'; }).join('') + '</dl>';
    },
    infoGrid: function (blocchi) {
      return '<div class="info-grid">' + blocchi.map(function (b) { return '<div class="info-block"><div class="k">' + b[0] + '</div><div class="v">' + (b[1] == null || b[1] === '' ? '<span class="muted">—</span>' : b[1]) + '</div></div>'; }).join('') + '</div>';
    },
    campo: function (o) {
      var id = 'f_' + String(o.name || '').replace(/[^a-zA-Z0-9]/g, '_');
      var req = o.req ? ' <span class="req">*</span>' : '';
      var attrs = o.attrs || '';
      var ctl;
      if (o.type === 'select') {
        ctl = '<select id="' + id + '" name="' + o.name + '" ' + (o.req ? 'required' : '') + ' ' + attrs + '>' + UI.opts(o.options, o.value) + '</select>';
      } else if (o.type === 'textarea') {
        ctl = '<textarea id="' + id + '" name="' + o.name + '" rows="' + (o.rows || 2) + '" ' + (o.req ? 'required' : '') + ' ' + attrs + '>' + U.esc(o.value || '') + '</textarea>';
      } else if (o.type === 'checkbox') {
        return '<label class="check ' + (o.full ? 'full' : '') + '"><input type="checkbox" name="' + o.name + '" value="1" ' + (o.value ? 'checked' : '') + ' ' + attrs + '> <span>' + o.label + '</span></label>';
      } else {
        ctl = '<input id="' + id + '" type="' + (o.type || 'text') + '" name="' + o.name + '" value="' + U.esc(o.value == null ? '' : o.value) + '" ' + (o.req ? 'required' : '') + (o.placeholder ? ' placeholder="' + U.esc(o.placeholder) + '"' : '') + ' ' + attrs + '>';
      }
      return '<div class="' + (o.full ? 'full' : '') + '"><label class="fl" for="' + id + '">' + o.label + req + '</label>' + ctl + (o.help ? '<div class="form-help">' + o.help + '</div>' : '') + '</div>';
    },
    opts: function (options, sel) {
      return (options || []).map(function (o) {
        var v = Array.isArray(o) ? o[0] : (o && o.v != null ? o.v : o);
        var l = Array.isArray(o) ? o[1] : (o && o.l != null ? o.l : o);
        return '<option value="' + U.esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + U.esc(l) + '</option>';
      }).join('');
    },
    tableMini: function (headers, righe, opts) {
      opts = opts || {};
      return '<div class="table-box"><table class="table-mini ' + (opts.cls || '') + '"><thead><tr>' + headers.map(function (h) { var x = Array.isArray(h) ? h : [h, '']; return '<th class="' + x[1] + '">' + x[0] + '</th>'; }).join('') + '</tr></thead><tbody>' +
        (righe.length ? righe.map(function (r) { return '<tr class="' + (r.cls || '') + '" ' + (r.href ? 'data-href="' + r.href + '"' : '') + '>' + r.celle.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + headers.length + '">' + UI.empty('Nessun dato disponibile.') + '</td></tr>') +
        '</tbody></table></div>';
    },
    /* ---------- datatable ---------- */
    _cfg: {},
    _cache: {},
    datatable: function (cfg) {
      var st = STATE.dt[cfg.id] || (STATE.dt[cfg.id] = { q: '', sort: cfg.ordine || '', dir: cfg.dir || 1, page: 1, per: cfg.per || 10, ex: {} });
      st.ex = st.ex || {};
      UI._cfg[cfg.id] = cfg;
      var q = norm(st.q);
      var righe = cfg.righe.filter(function (r) {
        var okExtra = (cfg.extra || []).every(function (x) {
          var v = st.ex[x.k];
          if (!v) return true;
          return x.filtra ? x.filtra(r, v) : String(r[x.k]) === String(v);
        });
        if (!okExtra) return false;
        if (!q) return true;
        return cfg.colonne.some(function (c) {
          if (c.cerca === false) return false;
          return norm(testoCol(c, r)).indexOf(q) >= 0;
        });
      });
      if (st.sort) {
        var col = cfg.colonne.find(function (c) { return c.k === st.sort; });
        if (col) {
          righe = righe.slice().sort(function (a, b) {
            var va = col.val ? col.val(a) : testoCol(col, a);
            var vb = col.val ? col.val(b) : testoCol(col, b);
            if (col.num) { va = Number(va) || 0; vb = Number(vb) || 0; return (va - vb) * st.dir; }
            return String(va).localeCompare(String(vb), 'it') * st.dir;
          });
        }
      }
      var tot = righe.length;
      var pages = Math.max(1, Math.ceil(tot / st.per));
      if (st.page > pages) st.page = pages;
      var start = (st.page - 1) * st.per;
      var visibili = righe.slice(start, start + st.per);
      UI._cache[cfg.id] = { cfg: cfg, righe: righe };
      var th = cfg.colonne.map(function (c) {
        var sorted = st.sort === c.k;
        var aria = sorted ? (st.dir === 1 ? 'ascending' : 'descending') : 'none';
        return '<th class="' + (c.num ? 'num' : '') + '" aria-sort="' + aria + '">' + (c.sort === false ? c.l : '<button type="button" class="dt-sort" data-azione="dt-sort" data-dt="' + cfg.id + '" data-k="' + c.k + '">' + c.l + ' <span class="dt-ico">' + (sorted ? (st.dir === 1 ? '▲' : '▼') : '↕') + '</span></button>') + '</th>';
      }).join('');
      var tb = visibili.length ? visibili.map(function (r) {
        return '<tr class="' + (cfg.classeRiga ? cfg.classeRiga(r) : '') + '" ' + (cfg.riga ? cfg.riga(r) : '') + '>' + cfg.colonne.map(function (c) {
          return '<td class="' + (c.num ? 'num' : '') + ' ' + (c.cls || '') + '">' + (c.cell ? c.cell(r) : U.esc(r[c.k])) + '</td>';
        }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cfg.colonne.length + '">' + UI.empty(cfg.vuoto || 'Nessun risultato con i filtri attuali.', 'search') + '</td></tr>';
      var extra = (cfg.extra || []).map(function (x) {
        return '<select data-azione="dt-extra" data-dt="' + cfg.id + '" data-k="' + x.k + '" aria-label="' + U.esc(x.label) + '" style="max-width:210px;min-height:31px;font-size:12.5px">' + UI.opts([['', x.label]].concat(x.opzioni), st.ex[x.k] || '') + '</select>';
      }).join('');
      var pagine = [];
      pagine.push('<button type="button" data-azione="dt-pagina" data-dt="' + cfg.id + '" data-p="' + (st.page - 1) + '" ' + (st.page === 1 ? 'disabled' : '') + ' aria-label="Pagina precedente">‹</button>');
      for (var p = 1; p <= pages; p++) {
        if (pages > 7 && p > 2 && p < pages - 1 && Math.abs(p - st.page) > 1) {
          if (p === 3 && Math.abs(st.page - 1) > 1) pagine.push('<button type="button" disabled>…</button>');
          if (p === pages - 2 && Math.abs(st.page - pages) > 1) pagine.push('<button type="button" disabled>…</button>');
          continue;
        }
        pagine.push('<button type="button" class="' + (p === st.page ? 'on' : '') + '" data-azione="dt-pagina" data-dt="' + cfg.id + '" data-p="' + p + '" ' + (p === st.page ? 'aria-current="page"' : '') + '>' + p + '</button>');
      }
      pagine.push('<button type="button" data-azione="dt-pagina" data-dt="' + cfg.id + '" data-p="' + (st.page + 1) + '" ' + (st.page === pages ? 'disabled' : '') + ' aria-label="Pagina successiva">›</button>');
      var footer = cfg.piede || ('<span><b>' + tot + '</b> righe' + (tot !== cfg.righe.length ? ' su ' + cfg.righe.length : '') + '</span><span class="muted">pagina ' + st.page + ' di ' + pages + '</span><span class="dt-pag">' + pagine.join('') + '</span>');
      return '<div class="card grow-card ' + (cfg.cls || '') + '">' +
        '<div class="filtri"><input type="search" data-azione="dt-cerca" data-dt="' + cfg.id + '" value="' + U.esc(st.q) + '" placeholder="' + U.esc(cfg.placeholder || 'Cerca…') + '" aria-label="Cerca nella tabella">' + extra +
        (cfg.filtriExtra || '') + '<span class="right small muted nowrap"></span></div>' +
        '<div class="table-box"><table class="dt"><thead><tr>' + th + '</tr></thead><tbody>' + tb + '</tbody>' + (cfg.totale ? '<tfoot>' + cfg.totale(righe) + '</tfoot>' : '') + '</table></div>' +
        '<div class="dt-piede">' + footer + '</div></div>';
    },
    filtroDati: function (id) { return UI._cache[id] ? UI._cache[id].righe : []; },
    /* ---------- modali ---------- */
    apriModale: function (o) {
      var dlg = document.getElementById('dlg');
      if (dlg.open) dlg.close();
      dlg.className = o.size || '';
      dlg.innerHTML = '<div class="dlg-head"><div class="grow"><h2>' + o.titolo + '</h2>' + (o.sotto ? '<div class="sub">' + o.sotto + '</div>' : '') + '</div><button type="button" class="dlg-close" data-azione="chiudi-modale" aria-label="Chiudi">' + ic('x') + '</button></div>' +
        '<div class="dlg-body">' + (o.corpo || '') + '</div>' +
        '<div class="dlg-foot">' + (o.piede || '<button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button>') + '</div>';
      dlg.showModal();
      if (o.dopo) setTimeout(o.dopo, 0);
      return dlg;
    },
    chiudiModale: function () { var d = document.getElementById('dlg'); if (d && d.open) d.close(); },
    toast: function (msg, tone) {
      var box = document.getElementById('toasts');
      var el = document.createElement('div');
      el.className = 'toast ' + (tone || '');
      el.innerHTML = ic(tone === 'err' ? 'alert' : tone === 'ok' ? 'check' : 'bell') + '<span>' + U.esc(msg) + '</span>';
      box.appendChild(el);
      setTimeout(function () { el.remove(); }, 3800);
    },
    confirm: function (msg, fn, label) {
      UI.apriModale({
        titolo: 'Conferma operazione', size: 'sm',
        corpo: '<p style="font-size:13.5px">' + msg + '</p>',
        piede: '<button type="button" class="btn" data-azione="chiudi-modale">Annulla</button><button type="button" class="btn btn-primary right" data-azione="conferma-ok">' + (label || 'Conferma') + '</button>',
        dopo: function () { window.__conferma = fn; }
      });
    },
    stampa: function (titolo, htmlDoc, sotto) {
      var dlg = document.getElementById('dlg');
      if (dlg.open) dlg.close();
      dlg.className = 'lg';
      dlg.innerHTML = '<div class="dlg-head"><div class="grow"><h2>' + titolo + '</h2>' + (sotto ? '<div class="sub">' + sotto + '</div>' : '') + '</div><button type="button" class="dlg-close" data-azione="chiudi-modale" aria-label="Chiudi">' + ic('x') + '</button></div>' +
        '<div class="dlg-body">' + htmlDoc + '</div>' +
        '<div class="dlg-foot"><button type="button" class="btn" data-azione="chiudi-modale">Chiudi</button><button type="button" class="btn right" data-azione="scarica-pdf">' + ic('download') + ' Scarica PDF</button><button type="button" class="btn btn-primary" data-azione="stampa">' + ic('printer') + ' Stampa</button></div>';
      dlg.showModal();
    },
    certificato: function (v) {
      var l = U.getLav(v.lavoratoreId), d = U.getDitta(v.dittaId), mn = U.getMansione(v.mansioneId), med = U.getMedico(v.medicoId);
      return '<div class="print-doc">' +
        '<div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. — Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia · Tel. 030 5511220 · P.IVA 01234567890</small><small>Servizio di sorveglianza sanitaria ai sensi del D.Lgs. 81/2008</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863"><div>Protocollo ' + U.esc(v.id.toUpperCase()) + '/2026</div><div>Data ' + U.fmtData(v.data) + '</div></div></div>' +
        '<h3>Giudizio di idoneità sanitaria</h3><div class="cert-sub">Certificato di idoneità alla mansione specifica</div>' +
        '<div class="cert-body">' +
        '<div class="cert-row"><span class="k">Lavoratore</span><span><b>' + U.esc(U.nomeLav(l)) + '</b> — nato il ' + U.fmtData(l.nascita) + ' a ' + U.esc(l.luogoNascita) + '</span></div>' +
        '<div class="cert-row"><span class="k">Codice fiscale</span><span>' + U.esc(l.cf) + '</span></div>' +
        '<div class="cert-row"><span class="k">Ditta</span><span>' + U.esc(d.ragione) + ' — ' + U.esc(d.citta) + ' (' + U.esc(d.prov) + ')</span></div>' +
        '<div class="cert-row"><span class="k">Mansione</span><span>' + U.esc(mn.nome) + '</span></div>' +
        '<div class="cert-row"><span class="k">Tipo di visita</span><span>' + U.esc(v.tipo) + ' del ' + U.fmtData(v.data) + '</span></div>' +
        '<div class="cert-row"><span class="k">Medico competente</span><span>Dott. ' + U.esc(med.nome) + '</span></div>' +
        '</div>' +
        '<div class="cert-giudizio">' + U.esc(v.giudizio) + '</div>' +
        (v.prescrizioni ? '<div style="font-size:12px;margin-bottom:10px"><b>Prescrizioni / limitazioni:</b> ' + U.esc(v.prescrizioni) + '</div>' : '') +
        '<div style="font-size:12px"><b>Prossima visita:</b> ' + (v.successiva ? 'tra ' + v.successiva + ' mesi' : 'da definire') + ' · <b>Trasmissione:</b> ' + U.esc(v.mezzo || '—') + '</div>' +
        '<div class="firma"><div class="f"><b>Dott. ' + U.esc(med.nome) + '</b>Firma del medico competente</div></div>' +
        '<div class="firma-digitale">' + ic('shield') + ' Documento firmato digitalmente il ' + U.fmtData(v.data) + ' — inviato automaticamente a ' + U.esc(l.email) + '</div>' +
        '<div class="meta"><span>CLS S.r.l. · Sistema di gestione sorveglianza sanitaria</span><span>Pagina 1 di 1</span></div>' +
        '</div>';
    },
    certificatoDitta: function (tipo, ditta, anno) {
      var med = U.getMedico(ditta.medicoId);
      return '<div class="print-doc"><div class="letterhead"><div><img class="doc-logo" src="assets/favicon-cls.png" alt="CLS Salus"><b>CLS S.r.l. — Centro di Medicina del Lavoro</b><small>Via della Salute 12 · 25124 Brescia · Tel. 030 5511220</small></div><div style="text-align:right;font-size:10.5px;color:#6b6863">Anno ' + anno + '</div></div>' +
        '<h3>' + U.esc(tipo) + '</h3><div class="cert-sub">' + U.esc(ditta.ragione) + ' — ' + U.esc(ditta.citta) + ' (' + U.esc(ditta.prov) + ')</div>' +
        '<div class="cert-body">' +
        '<div class="cert-row"><span class="k">Ragione sociale</span><span>' + U.esc(ditta.ragione) + '</span></div>' +
        '<div class="cert-row"><span class="k">P.IVA / C.F.</span><span>' + U.esc(ditta.piva) + '</span></div>' +
        '<div class="cert-row"><span class="k">Sede operativa</span><span>' + U.esc(ditta.indirizzo) + ', ' + U.esc(ditta.citta) + ' (' + U.esc(ditta.prov) + ')</span></div>' +
        '<div class="cert-row"><span class="k">Attività</span><span>' + U.esc(ditta.attivita) + ' — ATECO ' + U.esc(ditta.ateco) + '</span></div>' +
        '<div class="cert-row"><span class="k">Medico competente</span><span>Dott. ' + U.esc(med.nome) + '</span></div>' +
        '<div class="cert-row"><span class="k">Lavoratori in forza</span><span>' + U.lavoratoriDitta(ditta.id).length + '</span></div>' +
        '</div>' +
        '<p style="font-size:12px;margin:14px 0">Il documento riporta il programma di sorveglianza sanitaria, i protocolli per mansione e le attività di medicina del lavoro svolte nel periodo. Le scadenze sono calcolate automaticamente dal sistema.</p>' +
        '<div class="firma"><div class="f"><b>Dott. ' + U.esc(med.nome) + '</b>Firma del medico competente</div></div>' +
        '<div class="firma-digitale">' + ic('shield') + ' Documento generato e firmato digitalmente</div>' +
        '<div class="meta"><span>CLS S.r.l. · ' + U.esc(tipo) + '</span><span>Pagina 1 di 1</span></div></div>';
    }
  };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function testoCol(c, r) {
    if (c.testo) return c.testo(r);
    var v = r[c.k];
    return v == null ? '' : String(v);
  }

  /* ---------- azioni globali ---------- */
  var AZIONI = {
    'chiudi-modale': function () { UI.chiudiModale(); },
    'stampa': function () { window.print(); },
    // shortcut: il PDF è simulato; integrare la generazione reale lato server.
    'scarica-pdf': function () { UI.toast('PDF generato e scaricato (simulazione).', 'ok'); },
    'conferma-ok': function () { UI.chiudiModale(); if (typeof window.__conferma === 'function') window.__conferma(); window.__conferma = null; },
    'dt-sort': function (el) {
      var st = STATE.dt[el.dataset.dt];
      if (!st) return;
      if (st.sort === el.dataset.k) st.dir = -st.dir; else { st.sort = el.dataset.k; st.dir = 1; }
      RENDER();
    },
    'dt-pagina': function (el) {
      var st = STATE.dt[el.dataset.dt];
      if (!st) return;
      st.page = Math.max(1, Number(el.dataset.p));
      RENDER();
    },
    'dt-extra': function (el) {
      var st = STATE.dt[el.dataset.dt];
      if (!st) return;
      st.ex = st.ex || {};
      st.ex[el.dataset.k] = el.value;
      st.page = 1;
      RENDER();
    },
    'esporta-csv': function (el) {
      var cache = UI._cache[el.dataset.dt];
      if (!cache) { UI.toast('Nessun dato da esportare.', 'err'); return; }
      var cols = cache.cfg.colonne.filter(function (c) { return c.azioni !== true && c.esporta !== false && String(c.k).indexOf('_az') !== 0; });
      var rows = [cols.map(function (c) { return c.l; })].concat(cache.righe.map(function (r) {
        return cols.map(function (c) { return strip(c.cell ? c.cell(r) : (r[c.k] == null ? '' : r[c.k])); });
      }));
      var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = (el.dataset.nome || 'export') + '.csv';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      UI.toast('Esportazione CSV completata.', 'ok');
    },
    'tab': function (el) {
      STATE.tab[el.dataset.chiave] = el.dataset.tab;
      RENDER();
    }
  };
  function strip(html) {
    var d = document.createElement('div'); d.innerHTML = html;
    return (d.textContent || '').replace(/\s+/g, ' ').trim();
  }

  /* gestione delegata: click */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-azione]');
    if (btn && !btn.disabled) {
      var nome = btn.dataset.azione;
      if (AZIONI[nome]) {
        if (btn.tagName === 'BUTTON') e.preventDefault();
        AZIONI[nome](btn, e);
        return;
      }
    }
    var tr = e.target.closest('tr[data-href]');
    if (tr && !e.target.closest('a,button,input,select,textarea,label')) {
      location.hash = tr.dataset.href;
    }
  });

  /* gestione delegata: input (ricerca con ripristino focus) */
  document.addEventListener('input', function (e) {
    var inp = e.target.closest('[data-azione="dt-cerca"]');
    if (inp) {
      var st = STATE.dt[inp.dataset.dt];
      if (!st) return;
      st.q = inp.value; st.page = 1;
      STATE.focus = { dt: inp.dataset.dt, caret: inp.value.length };
      RENDER();
      return;
    }
    if (e.target.matches('[data-bmi]')) {
      var form = e.target.closest('[data-wizard]') || document;
      var h = form.querySelector('[name="altezza"]'), p = form.querySelector('[name="peso"]');
      var out = form.querySelector('[data-bmi-out]');
      if (h && p && out) {
        var hv = Number(h.value), pv = Number(p.value);
        out.innerHTML = hv > 0 && pv > 0 ? 'BMI: <b>' + (pv / Math.pow(hv / 100, 2)).toFixed(2) + '</b>' : 'BMI: —';
      }
    }
  });

  window.UI = UI;
  window.AZIONI = AZIONI;
})();
