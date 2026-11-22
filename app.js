'use strict';

/* =========================================================
   Smart Table Maker — everything runs in the browser.
   No server, no internet, no Excel required.
   ========================================================= */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clone = o => JSON.parse(JSON.stringify(o));
const STORE = 'smartTableMaker.v1';

function uid() { return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}
function numVal(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const n = parseFloat(String(v == null ? '' : v).replace(/,/g, ''));
  return isFinite(n) ? n : 0;
}
function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }
// The sample quotation cuts off extra paise (414366.75 × 18% = 74586.015 → 74586.01).
function trunc2(n) { return (n >= 0 ? Math.floor(n * 100 + 1e-9) : Math.ceil(n * 100 - 1e-9)) / 100; }
function niceNum(n) { return Number.isInteger(n) ? String(n) : String(round2(n)); }
function nl2br(v) { return esc(v).replace(/\r?\n/g, '<br>'); }

/* ---------- sample data taken from the sample quotation ---------- */
const SAMPLE_ITEMS = [
  ['M.S. Junction Box (Powder Coated) 300x300 with 2.5/4.0 Amp T.B. & Start/Stop Button and Red & Yellow Indicator and Panel Lock with Nut Bolt Fasteners, cable gland holes & earthing point & suitable required etc.', '8', 'Nos', '9030'],
  ['Emergency Push Button', '', '', ''],
  ['Red & Green Push Button', '5', 'Nos', '393.75'],
  ['NO & NC Terminal Block', '60', 'Nos', '241.50'],
  ['Cable Tie (50, 100, 200 mm)', '60', 'Nos', '126.00'],
  ['Taparia Plier', '15', 'Packet', '472.50'],
  ['Taparia Tester', '1', 'Nos', '504.00'],
  ['MCB Box Single Pole', '2', 'Nos', '131.25'],
  ['Fan Sheet', '10', 'Nos', '157.50'],
  ['Red, Yellow, Blue Indicator', '10', 'Nos', '47.25'],
  ['6 Amp Switch', '150', 'Nos', '78.75'],
  ['16 Amp Switch/Socket Combined Box', '20', 'Nos', '44.10'],
  ['16 Amp Switch', '2', 'Nos', '446.25'],
  ['16 Amp Socket', '4', 'Nos', '194.25'],
  ['1.5 mm Wire Copper Polycab/Finolex', '200', 'Mtr', '186.90'],
  ['2.5 mm Wire Copper Polycab/Finolex', '100', 'Mtr', '206.85'],
  ['3CX1.5 sqmm Copper Armoured Cable Polycab/Finolex', '200', 'Mtr', '498.75'],
  ['3CX2.5 sqmm Copper Armoured Cable Polycab/Finolex', '100', 'Mtr', '615.30'],
  ['Bulb Holder Anchor', '10', 'Nos', '37.80'],
  ['Installation Charges for above', '1', 'Job', '47250'],
  ['2x2 Sqft LED Light. make Bajaj/Crompton', '3', 'Nos', '8820'],
  ['50X50 mm PVC Panel Channel', '3', 'Mtr', '136.50']
];
const quotationRows = () => SAMPLE_ITEMS.map(r => ({ part: r[0], qty: r[1], unit: r[2], rate: r[3] }));

/* ---------- ready-made formats ---------- */
const TEMPLATES = {
  quotation: {
    columns: [
      { id: 'sr',    name: 'SR',         kind: 'serial' },
      { id: 'part',  name: 'Particulars', kind: 'text' },
      { id: 'qty',   name: 'Qty',         kind: 'number', decimals: 0, money: false },
      { id: 'unit',  name: 'Unit',        kind: 'text' },
      { id: 'rate',  name: 'Rate',        kind: 'number', decimals: 2, money: false },
      { id: 'amount',name: 'Amount',      kind: 'calc', op: 'multiply', a: 'qty', b: 'rate', decimals: 2, money: true }
    ],
    rows: quotationRows(),
    footer: { total: true, totalCol: 'amount', totalLabel: 'G.Total', gst: true, gstPct: 18, gstTruncate: true, round: true, roundLabel: 'R/O', final: true, finalLabel: 'Total' },
    doc: {
      gstin: 'GSTIN : 07BTLPG4488F1ZE',
      company: 'M G CONSTRUCTION CO.',
      ref: '_________________',
      dated: '___/___/______',
      title: 'Quotation',
      to: 'To,\nProject Manager,\nV.A.Tech Wabag Ltd\nGhaziabad.',
      date: '26/09/2026',
      site: 'Site :- 3 MLD STP, Pilikhuwa.',
      note: 'Supply & Installation.',
      sign: 'MG Construction Co.\nProprietor'
    },
    format: { currency: '', decimals: 2, indian: false }
  },
  simple: {
    columns: [
      { id: 'sr',   name: 'SR',   kind: 'serial' },
      { id: 'part', name: 'Item', kind: 'text' },
      { id: 'qty',  name: 'Qty',  kind: 'number', decimals: 0, money: false },
      { id: 'rate', name: 'Rate', kind: 'number', decimals: 2, money: false },
      { id: 'amt',  name: 'Amount', kind: 'calc', op: 'multiply', a: 'qty', b: 'rate', decimals: 2, money: true }
    ],
    rows: [
      { part: 'Item one', qty: '2', rate: '250' },
      { part: 'Item two', qty: '5', rate: '120' },
      { part: 'Item three', qty: '1', rate: '999' }
    ],
    footer: { total: true, totalCol: 'amt', totalLabel: 'Grand Total', gst: false, gstPct: 0, gstTruncate: true, round: false, roundLabel: 'R/O', final: false, finalLabel: 'Total' },
    doc: { gstin: '', company: '', ref: '', dated: '', title: 'List', to: '', date: '', site: '', note: '', sign: '' },
    format: { currency: '', decimals: 2, indian: false }
  },
  blank: {
    columns: [
      { id: 'sr',  name: 'SR',    kind: 'serial' },
      { id: 'a',   name: 'Name',  kind: 'text' },
      { id: 'b',   name: 'Value', kind: 'number', decimals: 2, money: false }
    ],
    rows: [{ a: '', b: '' }],
    footer: { total: false, totalCol: 'b', totalLabel: 'Total', gst: false, gstPct: 0, gstTruncate: true, round: false, roundLabel: 'R/O', final: false, finalLabel: 'Final Total' },
    doc: { gstin: '', company: '', ref: '', dated: '', title: '', to: '', date: '', site: '', note: '', sign: '' },
    format: { currency: '', decimals: 2, indian: false }
  }
};

const DOC_FIELDS = [
  { key: 'gstin',   label: 'GSTIN / tax number' },
  { key: 'company', label: 'Your company name' },
  { key: 'ref',     label: 'Ref. No.' },
  { key: 'dated',   label: 'Dated' },
  { key: 'title',   label: 'Heading (e.g. Quotation)' },
  { key: 'to',      label: 'Prepared for (To…)' },
  { key: 'date',    label: 'Date' },
  { key: 'site',    label: 'Site / subject line' },
  { key: 'note',    label: 'Line below the heading', wide: true },
  { key: 'sign',    label: 'Signature / sign-off', wide: true }
];

const KIND_LABELS = {
  text: 'Type text myself',
  number: 'Enter a number',
  serial: 'Auto number (1, 2, 3…)',
  calc: 'Calculate with a function'
};
const OP_LABELS = {
  multiply: 'Multiply  (A × B)',
  add: 'Add  (A + B)',
  subtract: 'Subtract  (A − B)',
  divide: 'Divide  (A ÷ B)',
  percent: 'Percentage  (% of a column)'
};
const OP_HINTS = {
  multiply: 'Amount = first column × second column',
  add: 'Result = first column + second column',
  subtract: 'Result = first column − second column',
  divide: 'Result = first column ÷ second column',
  percent: 'Result = chosen column × percent ÷ 100'
};

let state = null;
let currentTemplate = 'quotation';

/* =========================================================
   STATE + CALCULATIONS
   ========================================================= */

function colById(id) { return state.columns.find(c => c.id === id); }
function numericColumns() { return state.columns.filter(c => c.kind === 'number' || c.kind === 'calc'); }
function blankRow() {
  const r = {};
  state.columns.forEach(c => { if (c.kind === 'text' || c.kind === 'number') r[c.id] = ''; });
  return r;
}

function hasValue(i, colId, seen) {
  const c = colById(colId);
  if (!c) return false;
  const chain = seen || new Set();
  if (chain.has(colId)) return false;
  const next = new Set(chain); next.add(colId);
  if (c.kind === 'serial') return true;
  if (c.kind !== 'calc') return String(state.rows[i] ? (state.rows[i][colId] ?? '') : '').trim() !== '';
  return (c.op === 'percent' ? [c.a] : [c.a, c.b]).some(id => hasValue(i, id, next));
}
function getValue(i, colId, seen) {
  const c = colById(colId);
  if (!c) return '';
  const chain = seen || new Set();
  if (chain.has(colId)) return 0;              // guard against circular formulas
  const next = new Set(chain); next.add(colId);

  if (c.kind === 'serial') return i + 1;
  if (c.kind !== 'calc') return state.rows[i] ? (state.rows[i][colId] ?? '') : '';

  // Nothing typed in the source columns? Leave the calculated cell empty.
  if (!(c.op === 'percent' ? [c.a] : [c.a, c.b]).some(id => hasValue(i, id, next))) return '';

  const a = numVal(getValue(i, c.a, next));
  const b = numVal(getValue(i, c.b, next));
  switch (c.op) {
    case 'add':      return a + b;
    case 'subtract': return a - b;
    case 'divide':   return b === 0 ? 0 : a / b;
    case 'percent':  return a * numVal(c.pct) / 100;
    case 'multiply':
    default:         return a * b;
  }
}

function calcTotals() {
  const f = state.footer;
  let grand = 0;
  if (f.total && f.totalCol) state.rows.forEach((_, i) => { grand += numVal(getValue(i, f.totalCol)); });
  const rawGst = grand * numVal(f.gstPct) / 100;
  const gst = f.gst ? (f.gstTruncate === false ? round2(rawGst) : trunc2(rawGst)) : 0;
  const subtotal = grand + gst;
  const ro = f.round ? Math.round(subtotal) - subtotal : 0;
  const final = subtotal + ro;
  return { grand, gst, ro, final };
}

function fmtNum(v, decimals, money) {
  const d = decimals == null ? (state.format.decimals ?? 2) : decimals;
  const n = numVal(v);
  const body = Math.abs(n).toLocaleString(state.format.indian ? 'en-IN' : 'en-US',
    { minimumFractionDigits: d, maximumFractionDigits: d });
  return (n < 0 ? '-' : '') + ((money === false) ? '' : (state.format.currency || '')) + body;
}
function fmt(v, col) {
  if (col && col.kind === 'serial') return fmtNum(v, 0, false);
  if (col && (col.kind === 'number' || col.kind === 'calc')) {
    return (v === '' || v == null) ? '' : fmtNum(v, col.decimals, !!col.money);
  }
  return v == null ? '' : String(v);
}

/* rows used in the generated table / exports */
function footerRows(plain) {
  const t = calcTotals();
  const value = n => plain ? String(round2(n)) : fmtNum(n);
  const out = [];
  if (state.footer.total) out.push([state.footer.totalLabel || 'G.Total', value(t.grand)]);
  if (state.footer.gst)   out.push(['GST ' + niceNum(state.footer.gstPct) + '%', value(t.gst)]);
  if (state.footer.round) {
    // The document writes the round-off with an explicit + / − sign and no currency mark.
    const sign = t.ro >= 0 ? '+' : '-';
    const amount = Math.abs(t.ro);
    out.push([state.footer.roundLabel || 'R/O',
      sign + (plain ? String(round2(amount)) : fmtNum(amount, undefined, false))]);
  }
  if (state.footer.final) out.push([state.footer.finalLabel || 'Total', value(t.final)]);
  return out;
}
function plainCell(i, c) {
  if (c.kind === 'serial') return String(i + 1);
  if (c.kind === 'calc') { const v = getValue(i, c.id); return v === '' ? '' : String(round2(numVal(v))); }
  const raw = state.rows[i] ? (state.rows[i][c.id] ?? '') : '';
  if (c.kind === 'number') return raw === '' ? '' : String(round2(numVal(raw)));
  return String(raw);
}
function footerDataRow(label, value) {
  const n = state.columns.length;
  const arr = Array(n).fill('');
  if (n >= 2) { arr[n - 2] = label; arr[n - 1] = value; }
  else arr[0] = label + ' ' + value;
  return arr;
}
function sheetData() {
  const rows = [state.columns.map(c => c.name)];
  state.rows.forEach((_, i) => rows.push(state.columns.map(c => plainCell(i, c))));
  footerRows(true).forEach(r => rows.push(footerDataRow(r[0], r[1])));
  return rows;
}

/* =========================================================
   RENDERING — CONTROLS
   ========================================================= */

function renderTemplates() {
  $$('.template-card').forEach(b =>
    b.classList.toggle('active', b.dataset.template === currentTemplate));
}
function renderDocFields() {
  $('#docFields').innerHTML = DOC_FIELDS.map(f => `
    <div class="${f.wide ? 'wide' : ''}">
      <label>${esc(f.label)}</label>
      <input type="text" data-doc="${f.key}" value="${esc(state.doc[f.key] || '')}">
    </div>`).join('');
}
function renderFormatFields() {
  $('#formatFields').innerHTML = `
    <div><label>Currency symbol</label><input type="text" data-fmt="currency" value="${esc(state.format.currency || '')}" placeholder="₹, $, or blank"></div>
    <div><label>Decimal places</label><input type="number" min="0" max="4" data-fmt="decimals" value="${esc(state.format.decimals ?? 2)}"></div>
    <div class="wide"><label class="check-row"><input type="checkbox" data-fmt="indian" ${state.format.indian ? 'checked' : ''}> Indian style grouping (1,23,456.00)</label></div>`;
}
function optionsFor(targetId, selected) {
  return state.columns.filter(c => c.id !== targetId).map(c =>
    `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.name || c.id)}</option>`).join('');
}
function opArgsHtml(c) {
  if (c.op === 'percent') {
    return `<div class="op-args">
      <div><label>Take percent of which column?</label><select data-f="a">${optionsFor(c.id, c.a)}</select></div>
      <div><label>Percent (%)</label><input type="number" step="any" data-f="pct" value="${esc(c.pct ?? 0)}"></div>
      <div class="hintline">${esc(OP_HINTS.percent)}</div>
    </div>`;
  }
  return `<div class="op-args">
    <div><label>First column (A)</label><select data-f="a">${optionsFor(c.id, c.a)}</select></div>
    <div><label>Second column (B)</label><select data-f="b">${optionsFor(c.id, c.b)}</select></div>
    <div class="hintline">${esc(OP_HINTS[c.op] || OP_HINTS.multiply)}</div>
  </div>`;
}
function renderColumns() {
  const list = $('#columnsList');
  list.innerHTML = state.columns.map((c, i) => {
    const showDecimals = c.kind === 'number' || c.kind === 'calc';
    return `<div class="col-card" data-id="${esc(c.id)}">
      <div class="col-head">
        <span class="col-badge">${i + 1}</span>
        <input class="col-name" data-f="name" value="${esc(c.name)}" placeholder="Column name">
        <div class="col-actions">
          <button class="btn-icon" data-act="up" title="Move left">←</button>
          <button class="btn-icon" data-act="down" title="Move right">→</button>
          <button class="btn-icon" data-act="del" title="Delete column">✕</button>
        </div>
      </div>
      <div class="col-fields">
        <div class="full"><label>What goes in this column?</label>
          <select data-f="kind">${Object.keys(KIND_LABELS).map(k =>
            `<option value="${k}" ${c.kind === k ? 'selected' : ''}>${esc(KIND_LABELS[k])}</option>`).join('')}</select>
        </div>
        ${c.kind === 'calc' ? `<div class="full"><label>Function</label><select data-f="op">${Object.keys(OP_LABELS).map(o =>
          `<option value="${o}" ${c.op === o ? 'selected' : ''}>${esc(OP_LABELS[o])}</option>`).join('')}</select></div>` : ''}
        ${showDecimals ? `<div><label>Decimal places</label><input type="number" min="0" max="4" data-f="decimals" value="${esc(c.decimals ?? state.format.decimals)}"></div>` : ''}
        ${showDecimals ? `<div><label class="check-row" style="margin-top:22px"><input type="checkbox" data-f="money" ${c.money ? 'checked' : ''}> Show currency symbol${state.format.currency ? ' (' + esc(state.format.currency) + ')' : ' (type one in step 6)'}</label></div>` : ''}
        ${c.kind === 'calc' ? opArgsHtml(c) : ''}
        ${c.kind === 'serial' ? `<div class="col-note">Each row is numbered automatically — nothing to type.</div>` : ''}
      </div>
    </div>`;
  }).join('');
}
function renderTotals() {
  const f = state.footer;
  $('#totalsBox').innerHTML = `
    <label class="check-row"><input type="checkbox" data-t="total" ${f.total ? 'checked' : ''}> Add a grand total</label>
    <div class="totals-grid">
      <div><label>Label</label><input type="text" data-t="totalLabel" value="${esc(f.totalLabel || '')}"></div>
      <div><label>Add up which column?</label><select data-t="totalCol">${numericColumns().map(c =>
        `<option value="${esc(c.id)}" ${c.id === f.totalCol ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div>
    </div>
    <label class="check-row"><input type="checkbox" data-t="gst" ${f.gst ? 'checked' : ''}> Add GST percent</label>
    <div class="totals-grid">
      <div><label>GST rate (%)</label><input type="number" step="any" data-t="gstPct" value="${esc(f.gstPct ?? 0)}"></div>
      <div><label class="check-row" style="margin-top:22px"><input type="checkbox" data-t="gstTruncate" ${f.gstTruncate !== false ? 'checked' : ''}> Cut extra paise (like the sample)</label></div>
    </div>
    <label class="check-row"><input type="checkbox" data-t="round" ${f.round ? 'checked' : ''}> Round off to a whole number</label>
    <div class="totals-grid"><div><label>Round-off label</label><input type="text" data-t="roundLabel" value="${esc(f.roundLabel || '')}"></div></div>
    <label class="check-row"><input type="checkbox" data-t="final" ${f.final ? 'checked' : ''}> Show final total</label>
    <div class="totals-grid"><div><label>Final total label</label><input type="text" data-t="finalLabel" value="${esc(f.finalLabel || '')}"></div></div>`;
}
function renderEntry() {
  const table = $('#entryTable');
  const n = state.columns.length;
  const head = '<thead><tr>' + state.columns.map(c => `<th>${esc(c.name)}</th>`).join('') + '<th></th></tr></thead>';
  const body = state.rows.map((r, i) => {
    const cells = state.columns.map(c => {
      if (c.kind === 'serial') return `<td class="sr-cell">${i + 1}</td>`;
      if (c.kind === 'calc') return `<td><span class="calc-cell" data-calc="${i}:${esc(c.id)}">${esc(fmt(getValue(i, c.id), c))}</span></td>`;
      const isNum = c.kind === 'number';
      return `<td><input class="${isNum ? 'num-input' : ''}" data-i="${i}" data-col="${esc(c.id)}" inputmode="${isNum ? 'decimal' : 'text'}" value="${esc(r[c.id] ?? '')}" placeholder="${isNum ? '0' : ''}"></td>`;
    }).join('');
    return `<tr>${cells}<td class="del-cell"><button class="btn-icon" data-delrow="${i}" title="Delete this row">✕</button></td></tr>`;
  }).join('');
  table.innerHTML = head + '<tbody>' + (body ||
    `<tr><td colspan="${n + 1}" style="padding:18px;text-align:center;color:#8b95a7">No rows yet — click “Add row”.</td></tr>`) + '</tbody>';
}
function refreshCalcCells() {
  $$('#entryTable .calc-cell').forEach(el => {
    const [i, id] = el.dataset.calc.split(':');
    const c = colById(id);
    if (c) el.textContent = fmt(getValue(Number(i), id), c);
  });
}
function syncOptionLabels() {
  $$('.op-args select').forEach(sel => {
    Array.from(sel.options).forEach(o => { const c = colById(o.value); if (c) o.textContent = c.name; });
  });
  const totalSel = $('[data-t="totalCol"]');
  if (totalSel) Array.from(totalSel.options).forEach(o => { const c = colById(o.value); if (c) o.textContent = c.name; });
}

/* =========================================================
   RENDERING — THE GENERATED SHEET
   ========================================================= */

function sheetMarkup(inline) {
  const st = s => inline ? ` style="${s}"` : '';
  const d = state.doc;
  let html = '';

  if (d.gstin || d.company) {
    html += `<div class="sheet-doc-head"${st('text-align:center;margin-bottom:4px')}>
      ${d.gstin ? `<div class="gstin"${st('font-size:11px')}>${esc(d.gstin)}</div>` : ''}
      ${d.company ? `<div class="company"${st('font-size:19px;font-weight:800;letter-spacing:.5px;margin-top:2px')}>${esc(d.company)}</div>` : ''}
    </div>`;
  }
  if (d.ref || d.dated) {
    html += `<table class="sheet-ref"${st('width:100%;border-collapse:collapse;margin-bottom:4px;font-size:11px')}><tr>
      <td${st('border:0')}></td>
      <td${st('border:0;text-align:center')}>Ref. No. ${esc(d.ref || '')}</td>
      <td${st('border:0;text-align:right')}>Dated ${esc(d.dated || '')}</td>
    </tr></table>`;
  }
  if (d.title) html += `<div class="sheet-title"${st('text-align:center;font-size:15px;font-weight:700;text-decoration:underline;margin:12px 0 14px')}>${esc(d.title)}</div>`;
  if (d.to || d.date) {
    const dateText = d.date ? (/^\s*date/i.test(d.date) ? d.date : 'Date :- ' + d.date) : '';
    html += `<div class="sheet-meta"${st('display:flex;justify-content:space-between;gap:20px;margin-bottom:12px;font-size:11.5px')}>
      <div class="to"${st('white-space:pre-line;font-weight:600')}>${nl2br(d.to || '')}</div>
      <div class="right"${st('text-align:right;white-space:pre-line')}>${nl2br(dateText)}</div>
    </div>`;
  }
  if (d.site) html += `<div class="sheet-site"${st('margin-bottom:10px;font-weight:600')}>${nl2br(d.site)}</div>`;

  const thStyle = 'border:1px solid #444;padding:6px 8px;text-align:center;background:#eef1f5;font-weight:700';
  const tdStyle = 'border:1px solid #444;padding:6px 8px;vertical-align:top';
  html += `<table class="sheet-table"${st('width:100%;border-collapse:collapse;font-size:11.5px')}><thead><tr>`;
  state.columns.forEach(c => {
    html += `<th${st(thStyle)}>${esc(c.name)}</th>`;
  });
  html += `</tr></thead><tbody>`;

  state.rows.forEach((_, i) => {
    html += `<tr>`;
    state.columns.forEach(c => {
      const cls = c.kind === 'serial' ? 'center' : (c.kind === 'number' || c.kind === 'calc' ? 'num' : '');
      const align = c.kind === 'serial' ? 'text-align:center' : (cls === 'num' ? 'text-align:right;white-space:nowrap' : '');
      html += `<td class="${cls}"${st(tdStyle + (align ? ';' + align : ''))}>${esc(fmt(getValue(i, c.id), c))}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody>`;

  const foot = footerRows(false);
  if (foot.length) {
    const n = state.columns.length;
    const footStyle = tdStyle + ';font-weight:700;background:#fafbfc';
    html += `<tfoot>`;
    foot.forEach(([label, value]) => {
      html += `<tr>`;
      if (n >= 2) {
        html += `<td class="label" colspan="${n - 1}"${st(footStyle + ';text-align:right')}>${esc(label)}</td>`;
        html += `<td class="num"${st(footStyle + ';text-align:right;white-space:nowrap')}>${esc(value)}</td>`;
      } else {
        html += `<td${st(footStyle + ';text-align:right')}>${esc(label)} ${esc(value)}</td>`;
      }
      html += `</tr>`;
    });
    html += `</tfoot>`;
  }
  html += `</table>`;

  if (d.note) html += `<div class="sheet-note"${st('white-space:pre-line;margin-top:16px;font-size:11.5px')}>${nl2br(d.note)}</div>`;
  if (d.sign) html += `<div class="sheet-sign"${st('margin-top:30px;text-align:right;font-weight:700;white-space:pre-line')}>${nl2br(d.sign)}</div>`;
  return html;
}
function renderPreview() {
  $('#sheet').innerHTML = sheetMarkup(false);
  const total = fmtNum(calcTotals().final);
  $('#bigTotal').textContent = 'Total: ' + total;
  $('#mobileTotal').querySelector('strong').textContent = total;
}

/* =========================================================
   EXPORT HELPERS
   ========================================================= */

function exportHtml() {
  return '<!doctype html><html><head><meta charset="utf-8"><title>' +
    esc(state.doc.title || 'Smart Table') + '</title></head><body>' + sheetMarkup(true) + '</body></html>';
}
function toTsv() {
  return sheetData().map(r => r.map(v => String(v == null ? '' : v).replace(/[\t\r\n]/g, ' ')).join('\t')).join('\r\n');
}
function toCsv() {
  const cell = v => { const s = String(v == null ? '' : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return sheetData().map(r => r.map(cell).join(',')).join('\r\n');
}
function toMarkdown() {
  const cell = v => String(v == null ? '' : v).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
  const rows = sheetData();
  if (!rows.length) return '';
  const head = '| ' + rows[0].map(cell).join(' | ') + ' |';
  const sep = '| ' + rows[0].map(() => '---').join(' | ') + ' |';
  return [head, sep].concat(rows.slice(1).map(r => '| ' + r.map(cell).join(' | ') + ' |')).join('\r\n');
}
function download(filename, content, mime) {
  try {
    const blob = new Blob(['\ufeff', content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast('Downloaded: ' + filename);
  } catch (e) { toast('Download failed — try Print / PDF'); }
}
function fileName(ext) {
  const base = (state.doc.title || state.doc.company || 'my-table')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-table';
  return base + '.' + ext;
}
let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}
async function copyText(text, msg) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      toast(msg); return;
    }
  } catch (e) { /* fall through */ }
  const ta = document.createElement('textarea');
  ta.value = text; ta.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(ta); ta.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
  ta.remove();
  toast(ok ? msg : 'Copy failed — use a Download button instead');
}
async function copyRichTable() {
  const html = sheetMarkup(true), plain = toTsv();
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' })
      })]);
      toast('Table copied — paste into Word or Docs'); return;
    }
  } catch (e) { /* fall through */ }
  const div = document.createElement('div');
  div.contentEditable = 'true'; div.innerHTML = html;
  div.style.cssText = 'position:fixed;left:-9999px;top:0';
  document.body.appendChild(div);
  const range = document.createRange(); range.selectNodeContents(div);
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
  div.remove(); sel.removeAllRanges();
  toast(ok ? 'Table copied — paste into Word or Docs' : 'Copy failed — use a Download button instead');
}

/* =========================================================
   STATE CHANGES
   ========================================================= */

function save() { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) { /* private mode */ } }
function refresh(opts) {
  const o = opts || {};
  if (o.columns) renderColumns();
  if (o.totals) renderTotals();
  if (o.entry) renderEntry();
  refreshCalcCells();
  renderPreview();
  save();
}
function normalize() {
  state.doc = Object.assign({}, TEMPLATES.quotation.doc, state.doc || {});
  state.format = Object.assign({}, TEMPLATES.quotation.format, state.format || {});
  state.footer = Object.assign({}, TEMPLATES.quotation.footer, state.footer || {});
  if (state.footer.gstTruncate == null) state.footer.gstTruncate = true;
  state.columns = state.columns || [];
  state.rows = state.rows || [];
  state.columns.forEach(c => {
    if (!c.id) c.id = uid();
    if (!c.name) c.name = 'Column';
    if (!c.kind) c.kind = 'text';
    if (c.kind === 'calc' && !c.op) c.op = 'multiply';
    if ((c.kind === 'number' || c.kind === 'calc') && c.money == null) c.money = c.kind === 'calc';
  });
}
function applyTemplate(key) {
  const hasData = state && state.rows.some(r => Object.values(r).some(v => String(v).trim() !== ''));
  if (hasData && !confirm('Replace the current table with this new format? Your current rows will be lost.')) return;
  currentTemplate = key;
  state = clone(TEMPLATES[key]);
  state.template = key;
  renderAll();
  toast('Format loaded: ' + ({ quotation: 'Quotation / Bill', simple: 'Simple list', blank: 'Blank table' })[key]);
}
function renderAll() {
  renderTemplates(); renderDocFields(); renderFormatFields();
  renderColumns(); renderTotals(); renderEntry(); renderPreview();
  save();
}

/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {
  const setView = view => {
    $('#layout').dataset.view = view;
    $$('.mobile-tab').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  $('#mobileTabs').addEventListener('click', e => {
    const tab = e.target.closest('.mobile-tab');
    if (tab) setView(tab.dataset.view);
  });
  $('#btnSeeTable').addEventListener('click', () => setView('preview'));
  $('#btnBackEdit').addEventListener('click', () => setView('edit'));

  $('#templateGrid').addEventListener('click', e => {
    const card = e.target.closest('.template-card');
    if (card) applyTemplate(card.dataset.template);
  });

  $('#docFields').addEventListener('input', e => {
    const key = e.target.dataset.doc;
    if (!key) return;
    state.doc[key] = e.target.value;
    renderPreview(); save();
  });

  $('#formatFields').addEventListener('input', e => {
    const key = e.target.dataset.fmt;
    if (!key) return;
    state.format[key] = e.target.type === 'checkbox' ? e.target.checked
      : (key === 'decimals' ? Math.max(0, Math.min(4, Math.round(numVal(e.target.value)))) : e.target.value);
    refresh({ entry: true });
  });

  $('#columnsList').addEventListener('input', e => {
    const f = e.target.dataset.f;
    if (!f) return;
    const card = e.target.closest('.col-card');
    const c = colById(card.dataset.id);
    if (!c) return;
    c[f] = e.target.type === 'checkbox' ? e.target.checked
      : (e.target.type === 'number' ? numVal(e.target.value) : e.target.value);
    if (f === 'name') syncOptionLabels();
    refresh({});
  });

  $('#columnsList').addEventListener('change', e => {
    const f = e.target.dataset.f;
    if (!f) return;
    const card = e.target.closest('.col-card');
    const c = colById(card.dataset.id);
    if (!c) return;
    c[f] = e.target.type === 'checkbox' ? e.target.checked
      : (e.target.type === 'number' ? numVal(e.target.value) : e.target.value);
    if (f === 'kind') {
      if (c.kind === 'calc') {
        if (c.money == null) c.money = true;
        c.op = c.op || 'multiply';
        const others = state.columns.filter(x => x.id !== c.id);
        c.a = c.a && colById(c.a) && c.a !== c.id ? c.a : (others[0] && others[0].id);
        c.b = c.b && colById(c.b) && c.b !== c.id ? c.b : (others[1] && others[1].id) || c.a;
        if (c.decimals == null) c.decimals = state.format.decimals;
      }
      if (c.kind === 'number' && c.decimals == null) c.decimals = state.format.decimals;
    }
    if (f === 'op' && c.op === 'percent') c.b = c.a;
    refresh({ columns: true, entry: true, totals: true });
  });

  $('#columnsList').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const card = btn.closest('.col-card');
    const id = card.dataset.id;
    const idx = state.columns.findIndex(c => c.id === id);
    const act = btn.dataset.act;
    if (act === 'del') {
      if (state.columns.length <= 1) { toast('Keep at least one column'); return; }
      state.columns.splice(idx, 1);
      state.columns.forEach(c => {
        if (c.a === id) c.a = state.columns.find(x => x.id !== c.id)?.id;
        if (c.b === id) c.b = state.columns.find(x => x.id !== c.id)?.id || c.a;
      });
      if (state.footer.totalCol === id) state.footer.totalCol = (numericColumns()[0] || {}).id;
    } else if (act === 'up' && idx > 0) {
      [state.columns[idx - 1], state.columns[idx]] = [state.columns[idx], state.columns[idx - 1]];
    } else if (act === 'down' && idx < state.columns.length - 1) {
      [state.columns[idx + 1], state.columns[idx]] = [state.columns[idx], state.columns[idx + 1]];
    }
    refresh({ columns: true, entry: true, totals: true });
  });

  $('#totalsBox').addEventListener('input', e => {
    const key = e.target.dataset.t;
    if (!key) return;
    state.footer[key] = e.target.type === 'checkbox' ? e.target.checked
      : (key === 'decimals' || key === 'gstPct' ? numVal(e.target.value) : e.target.value);
    refresh({});
  });
  $('#totalsBox').addEventListener('change', e => {
    if (e.target.dataset.t) refresh({ totals: e.target.type === 'checkbox' });
  });

  $('#entryTable').addEventListener('input', e => {
    const input = e.target.closest('input[data-col]');
    if (!input) return;
    const i = Number(input.dataset.i);
    if (!state.rows[i]) return;
    state.rows[i][input.dataset.col] = input.value;
    refresh({});
  });
  $('#entryTable').addEventListener('click', e => {
    const btn = e.target.closest('[data-delrow]');
    if (!btn) return;
    state.rows.splice(Number(btn.dataset.delrow), 1);
    refresh({ entry: true });
  });

  $('#btnAddRow').addEventListener('click', () => { state.rows.push(blankRow()); refresh({ entry: true }); });
  $('#btnClearRows').addEventListener('click', () => { state.rows = []; refresh({ entry: true }); });
  $('#btnSampleRows').addEventListener('click', () => {
    const sample = clone(quotationRows());
    state.rows = sample.map(r => {
      const out = {};
      state.columns.forEach(c => {
        let v = r[c.id];
        if (v === undefined) {
          const name = String(c.name || '').toLowerCase();
          if (c.kind === 'text') v = r.part;
          else if (c.kind === 'number') {
            v = name.includes('rate') || name.includes('price') ? r.rate
              : (name.includes('qty') || name.includes('quantity') ? r.qty : '');
          }
        }
        out[c.id] = v ?? '';
      });
      return out;
    });
    refresh({ entry: true });
    toast('Sample rows loaded');
  });
  $('#btnAddColumn').addEventListener('click', () => {
    const c = { id: uid(), name: 'New column', kind: 'text' };
    state.columns.push(c);
    refresh({ columns: true, entry: true, totals: true });
  });

  $('#btnResetAll').addEventListener('click', () => {
    if (!confirm('Reset everything back to the sample quotation?')) return;
    currentTemplate = 'quotation';
    state = clone(TEMPLATES.quotation);
    state.template = 'quotation';
    renderAll(); toast('Reset to sample quotation');
  });

  $('#btnCopyWord').addEventListener('click', copyRichTable);
  $('#btnCopyExcel').addEventListener('click', () => copyText(toTsv(), 'Ready for Excel — paste into cell A1'));
  $('#btnCopyMd').addEventListener('click', () => copyText(toMarkdown(), 'Markdown table copied'));

  $('#btnDlExcel').addEventListener('click', () => download(fileName('xls'), exportHtml(), 'application/vnd.ms-excel'));
  $('#btnDlWord').addEventListener('click', () => download(fileName('doc'), exportHtml(), 'application/msword'));
  $('#btnDlCsv').addEventListener('click', () => download(fileName('csv'), toCsv(), 'text/csv;charset=utf-8'));
  $('#btnDlHtml').addEventListener('click', () => download(fileName('html'), exportHtml(), 'text/html;charset=utf-8'));
  $('#btnPrint').addEventListener('click', () => window.print());
  $('#btnPrintTop').addEventListener('click', () => window.print());
}

/* =========================================================
   START
   ========================================================= */

(function init() {
  try {
    const saved = localStorage.getItem(STORE);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
        state = parsed;
        currentTemplate = parsed.template || 'quotation';
      }
    }
  } catch (e) { /* ignore damaged or blocked storage */ }
  if (!state) state = clone(TEMPLATES.quotation);
  state.template = currentTemplate;
  normalize();
  renderAll();
  bindEvents();
})();
