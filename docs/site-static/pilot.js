// Pilot form handler. Reads window.MASTIFF_CONFIG (config.js). Never logs or displays keys.
(function () {
  'use strict';
  var cfg = window.MASTIFF_CONFIG || {};
  var form = document.getElementById('pilot-form');
  if (!form) return;
  var errorEl = document.getElementById('form-error');
  var okEl = document.getElementById('form-success');
  var offEl = document.getElementById('form-offline');
  var offText = document.getElementById('offline-text');
  var submit = document.getElementById('f-submit');
  var required = ['name', 'firm', 'email', 'phone', 'payments_per_month'];

  function val(n) { return (form.elements[n].value || '').trim(); }

  function validate() {
    var bad = [];
    required.forEach(function (n) {
      var el = form.elements[n];
      var v = val(n);
      var ok = v.length > 0;
      if (n === 'email') ok = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
      if (n === 'phone') ok = v.replace(/\D/g, '').length >= 7;
      if (n === 'payments_per_month') ok = /^\d+$/.test(v);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (!ok) bad.push(el);
    });
    return bad;
  }

  function show(el) {
    form.hidden = true;
    errorEl.hidden = true;
    el.hidden = false;
    el.focus();
  }

  function notConnected(data) {
    var email = (cfg.contactEmail || '').trim();
    offText.textContent = '';
    if (email) {
      var body = 'Name: ' + data.name + '\nFirm: ' + data.firm + '\nEmail: ' + data.email +
        '\nPhone: ' + data.phone + '\nPayments per month: ' + data.payments_per_month +
        (data.note ? '\nNote: ' + data.note : '');
      var a = document.createElement('a');
      a.href = 'mailto:' + encodeURIComponent(email).replace('%40', '@') +
        '?subject=' + encodeURIComponent('Mastiff pilot request') + '&body=' + encodeURIComponent(body);
      a.textContent = 'email us';
      offText.appendChild(document.createTextNode('Your request was not sent. Please '));
      offText.appendChild(a);
      offText.appendChild(document.createTextNode(' instead.'));
    } else {
      offText.textContent = 'Your request was not sent. Please email us instead.';
    }
    show(offEl);
  }

  form.addEventListener('input', function (e) {
    if (e.target && e.target.setAttribute) e.target.setAttribute('aria-invalid', 'false');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad.length) {
      errorEl.hidden = false;
      bad[0].focus();
      return;
    }
    errorEl.hidden = true;
    // Honeypot: a bot filled the hidden field. Pretend success, send nothing.
    if (val('website')) { show(okEl); return; }

    var data = {
      name: val('name'), firm: val('firm'), email: val('email'), phone: val('phone'),
      payments_per_month: val('payments_per_month'), note: val('note'), source: 'site-pilot-form'
    };
    var url = (cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
    var key = (cfg.supabaseAnonKey || '').trim();
    if (!url || !key) { notConnected(data); return; }

    submit.disabled = true;
    fetch(url + '/rest/v1/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    }).then(function (r) {
      if (!r.ok) throw new Error('status ' + r.status);
      show(okEl);
    }).catch(function () {
      submit.disabled = false;
      notConnected(data);
    });
  });
})();
