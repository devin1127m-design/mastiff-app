/* Mastiff Wall demo. Static, no backend. State lives in localStorage under one key. */
(function () {
'use strict';
var KEY = 'mastiff-wall-demo-v1';
var ADV = 'Mastiff flags. Your firm makes every payment decision.';
var L4MSG = 'Last 4 digits only. Mastiff never stores full account numbers.';
var SAMEMSG = 'A second person must approve. The approver cannot be the person who submitted the request.';
var SETTINGS = window.SAMPLE.settings;

/* ---------- rules: pure ---------- */
function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function bigrams(s) { var o = [], t = norm(s).replace(/ /g, ''); for (var i = 0; i < t.length - 1; i++) o.push(t.slice(i, i + 2)); return o; }
function similarity(a, b) {
  var x = bigrams(a), y = bigrams(b), total = x.length + y.length, n = 0;
  if (!x.length || !y.length) return 0;
  x.forEach(function (g) { var i = y.indexOf(g); if (i > -1) { n++; y.splice(i, 1); } });
  return 2 * n / total;
}
function closest(name, vendors) {
  var best = null, bs = 0;
  vendors.forEach(function (v) { var s = similarity(name, v.name); if (s > bs) { bs = s; best = v; } });
  return bs >= 0.3 ? best : null;
}
function money(n) { n = Number(n); return '$' + n.toLocaleString('en-US', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); }
function findVendor(name, vendors) { return vendors.filter(function (v) { return norm(v.name) === norm(name); })[0] || null; }

/* Three things hold: payee not on file, bank details changed, amount out of range. Cautions never hold alone. */
function evaluate(req, vendors, settings) {
  settings = settings || SETTINGS;
  var reasons = [], cautions = [], amt = Number(req.amount), v = findVendor(req.payee, vendors);
  if (!v) {
    var c = closest(req.payee, vendors);
    reasons.push('Payee not on file' + (c ? ' (closest: ' + c.name + ')' : '') + '.');
  } else if (String(req.last4) !== String(v.last4)) {
    reasons.push('Bank details changed: last 4 is ' + req.last4 + ', file has ' + v.last4 + '.');
  }
  if (v && v.avg90 > 0) {
    if (amt > settings.multiple * v.avg90) reasons.push('Amount ' + money(amt) + ' is more than ' + settings.multiple + 'x the 90-day average of ' + money(v.avg90) + '.');
  } else if (amt > settings.noHistoryLine) {
    reasons.push('Amount ' + money(amt) + ' is over the ' + money(settings.noHistoryLine) + ' line with no payment history.');
  }
  if (req.offHours) cautions.push('Arrived outside payment hours. Worth checking.');
  if (req.urgent) cautions.push('The request pushes to hurry. Worth checking.');
  return { verdict: reasons.length ? 'HOLD' : 'PASS', reasons: reasons, cautions: cautions };
}
window.evaluate = evaluate;

/* ---------- state ---------- */
function fresh() { var d = window.SAMPLE.build(Date.now()); return { vendors: d.vendors, log: d.log }; }
function load() {
  try {
    var s = JSON.parse(localStorage.getItem(KEY));
    if (s && Array.isArray(s.vendors) && Array.isArray(s.log)) return s;
  } catch (e) { /* storage blocked or empty */ }
  return fresh();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* demo still works in memory */ } }
var state = load();

/* ---------- helpers ---------- */
function $(id) { return document.getElementById(id); }
function el(tag, props) {
  var e = document.createElement(tag), p = props || {};
  Object.keys(p).forEach(function (a) {
    if (a === 'text') e.textContent = p[a];
    else if (a.slice(0, 2) === 'on') e.addEventListener(a.slice(2), p[a]);
    else if (p[a] !== false && p[a] != null) e.setAttribute(a, p[a] === true ? '' : p[a]);
  });
  Array.prototype.slice.call(arguments, 2).forEach(function add(c) {
    if (Array.isArray(c)) c.forEach(add); else if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  });
  return e;
}
function when(iso) { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function sameName(a, b) { var f = function (s) { return norm(s).split(' ')[0]; }; return !!f(a) && f(a) === f(b); }
function setErr(id, msg, input) {
  var p = $(id); p.textContent = msg || ''; p.hidden = !msg;
  if (input) { if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid'); }
}
function isOpen(e) { return e.status === 'open hold'; }

/* ---------- five numbers ---------- */
function numbers() {
  var log = state.log, hrs = log.filter(function (e) { return e.verdict === 'HOLD' && e.resolved_at; })
    .map(function (e) { return (new Date(e.resolved_at) - new Date(e.at)) / 3600000; }).sort(function (a, b) { return a - b; });
  var m = hrs.length ? (hrs.length % 2 ? hrs[(hrs.length - 1) / 2] : (hrs[hrs.length / 2 - 1] + hrs[hrs.length / 2]) / 2) : null;
  return {
    checked: log.length,
    holds: log.filter(function (e) { return e.verdict === 'HOLD'; }).length,
    released: log.filter(function (e) { return e.status === 'released' || e.status === 'override'; }).length,
    rejected: log.filter(function (e) { return e.status === 'rejected'; }).length,
    median: m === null ? '-' : (Math.round(m * 10) / 10) + ' h'
  };
}

/* ---------- views ---------- */
function ticket(e) {
  var rows = [['Payee', e.payee], ['Amount', money(e.amount)], ['Request type', e.type], ['Bank', e.bank || 'not given'],
    ['Account, last 4', e.last4], ['Arrived by', e.how], ['Submitted by', e.submitter], e.note ? ['Note', e.note] : null].filter(Boolean);
  return el('div', { class: 'ticket' },
    el('span', { class: 'label', text: 'Verdict' }),
    el('span', { class: 'stamp', text: e.verdict }),
    el('dl', {}, rows.map(function (r) { return el('div', {}, el('dt', { text: r[0] }), el('dd', { text: r[1] })); })),
    e.reasons.length ? el('ul', { class: 'plain reasons' }, e.reasons.map(function (r) { return el('li', { text: r }); })) : null,
    e.cautions.length ? el('div', {}, el('p', { class: 'label', text: 'Cautions (these never hold alone)' }),
      el('ul', { class: 'plain' }, e.cautions.map(function (r) { return el('li', { text: r }); }))) : null,
    el('p', { class: 'advisory', text: ADV }));
}

function field(id, label, o) {
  o = o || {};
  var inp = o.options
    ? el('select', { id: id, name: id }, o.options.map(function (x) { return el('option', { value: x[0], text: x[1] }); }))
    : el('input', { id: id, name: id, type: 'text', value: o.value || '', autocomplete: 'off' });
  var err = el('p', { class: 'error', id: 'e-' + id, hidden: true });
  return { input: inp, err: err, wrap: el('div', { class: 'field' }, el('label', { for: id, text: label }),
    o.hint ? el('span', { class: 'hint', text: o.hint }) : null, inp, err) };
}

function holdCard(e) {
  var v = findVendor(e.payee, state.vendors), onFile = v ? v.phone : '';
  var f = {
    who: field('who-' + e.id, 'Who called'),
    num: field('num-' + e.id, 'Which number was called', { value: onFile }),
    said: field('said-' + e.id, 'What the vendor said'),
    out: field('out-' + e.id, 'Outcome', { options: [['', 'Choose one'], ['released', 'Record release (confirmed legitimate)'], ['rejected', 'Record not paid (could not verify)'], ['void', 'Record void (duplicate or mistake)']] }),
    appr: field('appr-' + e.id, 'Approver name', { hint: 'A second person. Not ' + e.submitter + '.' })
  };
  var o = { reason: field('oreason-' + e.id, 'Reason, one line'), appr: field('oappr-' + e.id, 'Approver name') };

  function approverOk(fld) {
    var a = fld.input.value.trim(), bad = !a ? 'Enter the approver name.' : (sameName(a, e.submitter) ? SAMEMSG : '');
    setErr(fld.err.id, bad, fld.input); return !bad;
  }
  function req(fld, msg) { var ok = !!fld.input.value.trim(); setErr(fld.err.id, ok ? '' : msg, fld.input); return ok; }

  var cb = el('form', { novalidate: true, onsubmit: function (ev) {
    ev.preventDefault();
    var ok = [req(f.who, 'Enter who called.'), req(f.num, 'Enter the number that was called.'), req(f.said, 'Enter what the vendor said.'),
      req(f.out, 'Choose an outcome.'), approverOk(f.appr)].every(Boolean);
    if (!ok) return;
    close(e, { status: f.out.input.value, who_called: f.who.input.value.trim(), number_called: f.num.input.value.trim(),
      said: f.said.input.value.trim(), approver: f.appr.input.value.trim() });
  } }, f.who.wrap, f.num.wrap, f.said.wrap, f.out.wrap, f.appr.wrap,
    el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn fill', text: 'Record callback and close' })));

  var ov = el('form', { novalidate: true, onsubmit: function (ev) {
    ev.preventDefault();
    var ok = [req(o.reason, 'Enter a one-line reason.'), approverOk(o.appr)].every(Boolean);
    if (!ok) return;
    close(e, { status: 'override', override_reason: o.reason.input.value.trim(), approver: o.appr.input.value.trim() });
  } }, o.reason.wrap, o.appr.wrap,
    el('div', { class: 'row' }, el('button', { type: 'submit', class: 'btn', text: 'Record release (override)' })));

  return el('div', { class: 'hold' }, ticket(e),
    el('div', { class: 'resolve' },
      el('div', { class: 'callnum' }, el('span', { class: 'label grey', text: 'Phone number on file' }),
        el('span', { class: 'num', text: onFile || 'None on file (new payee)' }),
        el('p', { text: onFile ? 'Call this number, not one from the request.' : 'Call this number, not one from the request. None is on file, so use a number you already trust.' })),
      el('h3', { text: 'Record the callback' }), cb,
      el('details', {}, el('summary', { text: 'Override: release without a callback' }),
        el('p', { class: 'grey', text: 'Mastiff never stops a payment. The override and its reason are logged.' }), ov)));
}

function close(e, data) {
  Object.assign(e, data, { resolved_at: new Date().toISOString() });
  if (e.status === 'released' || e.status === 'override') {
    var v = findVendor(e.payee, state.vendors);
    if (!v) state.vendors.push({ name: e.payee, phone: e.number_called, bank: e.bank, last4: e.last4, first_seen: new Date().toISOString().slice(0, 10), avg90: Number(e.amount) });
    else if (String(v.last4) !== String(e.last4)) { v.last4 = e.last4; if (e.bank) v.bank = e.bank; }
  }
  save(); renderAll();
}

function renderHolds() {
  var open = state.log.filter(isOpen).reverse(), box = $('holds');
  box.textContent = '';
  $('hold-count').textContent = '(' + open.length + ')';
  if (!open.length) box.append(el('p', { class: 'empty', text: 'No open holds. Nothing to do.' }));
  open.forEach(function (e) { box.append(holdCard(e)); });
}

function resolution(e) {
  if (!e.resolved_at) return '';
  if (e.status === 'override') return 'Override: ' + e.override_reason + '. Approved by ' + e.approver + '.';
  return 'Called ' + e.who_called + ' at ' + e.number_called + '. Vendor said: ' + e.said + ' Approved by ' + e.approver + '.';
}

function renderLog() {
  var cols = ['Date and time', 'Payee', 'Amount', 'Type', 'Verdict', 'Reasons', 'Status', 'Resolution'];
  var rows = state.log.slice().reverse().map(function (e) {
    var why = e.reasons.concat(e.cautions).join(' ') || 'Checked. Nothing to do.';
    var cells = [when(e.at), e.payee, money(e.amount), e.type, e.verdict, why, e.status, resolution(e)];
    return el('tr', {}, cells.map(function (c, i) { return el('td', { 'data-label': cols[i], class: i === 2 ? 'num' : i === 7 ? 'res' : '', text: c }); }));
  });
  $('log').textContent = '';
  $('log').append(el('div', { class: 'tablewrap' }, el('table', {},
    el('thead', {}, el('tr', {}, cols.map(function (c) { return el('th', { scope: 'col', text: c }); }))), el('tbody', {}, rows))));
}

function renderNumbers() {
  var n = numbers();
  ['checked', 'holds', 'released', 'rejected', 'median'].forEach(function (k) { $('n-' + k).textContent = n[k]; });
}
function renderVendors() {
  var dl = $('vendor-list'); dl.textContent = '';
  state.vendors.forEach(function (v) { dl.append(el('option', { value: v.name })); });
}
function renderAll() { renderNumbers(); renderHolds(); renderLog(); renderVendors(); }

/* ---------- tabs ---------- */
function setTab(name) {
  ['new', 'holds', 'log'].forEach(function (t) {
    $('panel-' + t).hidden = t !== name;
    $('tab-' + t).setAttribute('aria-selected', t === name ? 'true' : 'false');
  });
}
Array.prototype.forEach.call(document.querySelectorAll('[data-tab]'), function (b) {
  b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); });
});

/* ---------- new request ---------- */
$('req').addEventListener('submit', function (ev) {
  ev.preventDefault();
  var f = ev.target, v = function (n) { return f.elements[n].value.trim(); };
  var amt = Number(v('amount').replace(/[$,\s]/g, '')), l4 = v('last4'), bad = {};
  if (!v('payee')) bad.payee = 'Enter the payee.';
  if (!(amt > 0)) bad.amount = 'Enter an amount above zero.';
  if (l4.length > 4) bad.last4 = L4MSG; else if (!/^\d{4}$/.test(l4)) bad.last4 = 'Enter the last 4 digits of the account.';
  if (!v('how')) bad.how = 'Choose how it arrived.';
  ['payee', 'amount', 'last4', 'how'].forEach(function (k) { setErr('e-' + k, bad[k], f.elements[k]); });
  var first = Object.keys(bad)[0];
  if (first) { f.elements[first].focus(); return; }
  var known = findVendor(v('payee'), state.vendors);
  var r = { payee: known ? known.name : v('payee'), amount: amt, type: v('type'), bank: v('bank'), last4: l4, how: v('how'), note: v('note'),
    submitter: v('submitter') || window.SAMPLE.submitter, offHours: f.elements.offHours.checked, urgent: f.elements.urgent.checked };
  var res = evaluate(r, state.vendors, SETTINGS);
  var e = Object.assign({ id: 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: new Date().toISOString() }, r, {
    verdict: res.verdict, reasons: res.reasons, cautions: res.cautions, status: res.verdict === 'PASS' ? 'pass' : 'open hold',
    resolved_at: '', who_called: '', number_called: '', said: '', approver: '', override_reason: '' });
  state.log.push(e); save(); renderAll();
  var out = $('result'); out.textContent = '';
  if (e.verdict === 'PASS') {
    out.append(el('div', { class: 'ok' }, el('strong', { text: 'Checked. Nothing to do.' }),
      e.cautions.length ? el('p', { class: 'grey', text: e.cautions.join(' ') }) : null, el('p', { class: 'advisory', text: ADV })));
  } else {
    out.append(ticket(e), el('div', { class: 'row', style: 'margin-top:16px' },
      el('button', { type: 'button', class: 'btn fill', text: 'Go to open holds', onclick: function () { setTab('holds'); } })));
  }
  ['payee', 'amount', 'bank', 'last4', 'note'].forEach(function (n) { f.elements[n].value = ''; });
  f.elements.how.value = ''; f.elements.type.value = 'payment'; f.elements.offHours.checked = false; f.elements.urgent.checked = false;
});

/* ---------- export and reset ---------- */
function csvCell(s) {
  s = String(s == null ? '' : s);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
$('export').addEventListener('click', function () {
  var head = ['date_time', 'payee', 'amount', 'request_type', 'bank', 'account_last4', 'how_arrived', 'submitted_by', 'verdict', 'reasons', 'cautions', 'status', 'resolved_at', 'who_called', 'number_called', 'vendor_said', 'approver', 'override_reason'];
  var lines = [head.join(',')].concat(state.log.map(function (e) {
    return [e.at, e.payee, e.amount, e.type, e.bank, e.last4, e.how, e.submitter, e.verdict, e.reasons.join(' '), e.cautions.join(' '), e.status,
      e.resolved_at, e.who_called, e.number_called, e.said, e.approver, e.override_reason].map(csvCell).join(',');
  }));
  var url = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/csv' }));
  var a = el('a', { href: url, download: 'mastiff-demo-log.csv' });
  document.body.append(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
});
$('reset').addEventListener('click', function () {
  state = fresh(); save(); $('result').textContent = ''; renderAll(); setTab('new');
});

renderAll();
})();
