/* ══════════════════════════════════════════════════════════════════
   ENGINEERING WORKBOOK · SHARED PAGE HELPERS
   Loaded by every calculator. Provides:
     · workbook context (embed flag, item title, project, author)
     · reserve-factor limits + colour classes, driven by the workbook
     · reserve-factor export / clear for the contents-page badge
     · the shared materials list, and a "saved material is missing" check
     · strict number reading (a blank field is an error, never a default)
     · the print header and Print / PDF action
   ══════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var P = new URLSearchParams(location.search);
  var wbId = P.get('wb'), itemId = P.get('item');
  function num(v, def) { var n = parseFloat(v); return isFinite(n) ? n : def; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var WB = {
    embed: P.get('embed') === '1',
    wbId: wbId, itemId: itemId,
    title: P.get('title') || '',
    project: P.get('project') || '',
    author: P.get('author') || '',
    rfCrit: (function () { var v = num(P.get('rfCrit'), 1.2); return v > 0 ? v : 1.2; })(),
    rfOpt: (function () { var v = num(P.get('rfOpt'), 1.5); return v > 0 ? v : 1.5; })(),
    esc: esc, num: num
  };

  // localStorage key, scoped to the workbook item when embedded
  WB.key = function (kind, slug) {
    return (wbId && itemId) ? ('eng_wb_' + kind + '_' + wbId + '_' + itemId) : ('eng_wb_' + kind + '_' + slug);
  };

  // ── Reserve factors ─────────────────────────────────────────────
  // 'good' ≥ optimal · 'warn' between critical and optimal · 'bad' below critical
  WB.rfClass = function (v) {
    if (!(typeof v === 'number' && isFinite(v) && v >= 0)) return 'na';
    return v < WB.rfCrit ? 'bad' : v < WB.rfOpt ? 'warn' : 'good';
  };
  WB.rfColor = function (v) {
    return { good: 'var(--wb-good)', warn: 'var(--wb-warn)', bad: 'var(--wb-bad)', na: 'var(--wb-muted)' }[WB.rfClass(v)];
  };
  WB.fmtRF = function (v) {
    if (v === Infinity) return '∞';
    if (!(typeof v === 'number' && isFinite(v))) return '—';
    return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
  };
  // Publish the governing reserve factor for the workbook contents page.
  // Zero is a real result (a joint that slips or has no margin) and is published;
  // an invalid / non-finite value removes the badge rather than leaving a stale one.
  WB.setRF = function (slug, value, mode) {
    try {
      if (typeof value === 'number' && isFinite(value) && value >= 0) {
        localStorage.setItem(WB.key('rf', slug), JSON.stringify({ rf: value, mode: mode || '', ts: Date.now() }));
      } else {
        localStorage.removeItem(WB.key('rf', slug));
      }
    } catch (e) { }
  };
  WB.clearRF = function (slug) { try { localStorage.removeItem(WB.key('rf', slug)); } catch (e) { } };

  // ── Materials (workbook is the single source of truth) ──────────
  WB.loadMaterials = function () {
    try {
      var raw = localStorage.getItem('eng_wb_mats'); if (!raw) return null;
      var arr = JSON.parse(raw);
      return (Array.isArray(arr) && arr.length) ? arr : null;
    } catch (e) { return null; }
  };

  // ── Strict numeric input ────────────────────────────────────────
  // Returns NaN for a blank or unparseable field so the caller can report it;
  // never substitutes a default.
  WB.readNum = function (id) {
    var el = document.getElementById(id); if (!el) return NaN;
    var s = String(el.value).trim(); if (s === '') return NaN;
    var n = Number(s); return isFinite(n) ? n : NaN;
  };
  WB.markInvalid = function (id, bad) {
    var el = document.getElementById(id); if (el) el.classList.toggle('wb-invalid', !!bad);
  };

  // ── Page chrome: print header + Print / PDF ─────────────────────
  // opts: { slug, name }  — name is the calculator's display name
  WB.initPage = function (opts) {
    opts = opts || {};
    var root = document.documentElement;
    root.classList.add('wb-page');
    if (WB.embed) root.classList.add('wb-embed');
    if (opts.slug) root.setAttribute('data-wb-calc', opts.slug);

    // Print-only header: project · calculation title · calculator · author · date
    var head = document.createElement('div');
    head.className = 'wb-print-head';
    head.id = 'wbPrintHead';
    document.body.insertBefore(head, document.body.firstChild);
    WB._calcName = opts.name || document.title;
    WB.refreshPrintHead();
    window.addEventListener('beforeprint', WB.refreshPrintHead);

    // The legacy floating button becomes the shared Print / PDF action
    function wireBtn() {
      var btn = document.querySelector('.pdf-btn');
      if (btn) { btn.textContent = 'Print / PDF'; btn.setAttribute('onclick', 'WB.print()'); }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireBtn); else wireBtn();
  };
  WB.setTitle = function (t) { WB._title = t; WB.refreshPrintHead(); };
  WB.refreshPrintHead = function () {
    var head = document.getElementById('wbPrintHead'); if (!head) return;
    var title = WB._title || WB.title || '';
    var d = new Date();
    var date = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    // with no calculation title the calculator name is the heading — not repeated underneath
    var sub = ((title && title !== WB._calcName) ? [WB._calcName] : []).concat(WB.project ? [WB.project] : []).join(' · ');
    head.innerHTML =
      '<div class="wb-ph-main"><div class="wb-ph-title">' + esc(title || WB._calcName) + '</div>' +
      (sub ? '<div class="wb-ph-sub">' + esc(sub) + '</div>' : '') + '</div>' +
      '<div class="wb-ph-meta">' + (WB.author ? '<div>' + esc(WB.author) + '</div>' : '') +
      '<div>' + date + '</div><div>Engineering Workbook</div></div>';
  };
  WB.print = function () { WB.refreshPrintHead(); window.print(); };

  g.WB = WB;
})(window);
