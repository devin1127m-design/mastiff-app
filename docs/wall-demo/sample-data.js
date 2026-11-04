/* Sample data for the Mastiff Wall demo. Every name, number and amount here is invented. 555-01xx numbers are reserved for fiction. */
window.SAMPLE = {
  org: 'Sample Office',
  submitter: 'Dana (bookkeeper)',
  settings: { multiple: 2, noHistoryLine: 5000 },
  build: function (now) {
    var DAY = 86400000;
    function at(d, h, m) { var t = new Date(now - d * DAY); t.setHours(h, m || 0, 0, 0); return t; }
    function iso(t) { return t.toISOString(); }
    function seen(d) { return iso(new Date(now - d * DAY)).slice(0, 10); }
    var vendors = [
      { name: 'Acme Supply LLC', phone: '248-555-0111', bank: 'Huron Valley Bank', last4: '4417', first_seen: seen(640), avg90: 1900 },
      { name: 'Pinecrest HVAC', phone: '248-555-0122', bank: 'Lakeshore Credit Union', last4: '0238', first_seen: seen(510), avg90: 2100 },
      { name: 'Gordon Glass', phone: '248-555-0134', bank: 'Oakland Savings Bank', last4: '6620', first_seen: seen(720), avg90: 3200 },
      { name: 'Northfield Concrete', phone: '248-555-0145', bank: 'Huron Valley Bank', last4: '9051', first_seen: seen(430), avg90: 6100 },
      { name: 'Lakeside Electric', phone: '248-555-0156', bank: 'Lakeshore Credit Union', last4: '3374', first_seen: seen(380), avg90: 2750 },
      { name: 'Ridgeway Lumber', phone: '248-555-0167', bank: 'Oakland Savings Bank', last4: '8812', first_seen: seen(600), avg90: 4300 },
      { name: 'Baldwin Plumbing', phone: '248-555-0178', bank: 'Huron Valley Bank', last4: '1590', first_seen: seen(290), avg90: 1450 },
      { name: 'Clarkston Roofing', phone: '248-555-0189', bank: 'Lakeshore Credit Union', last4: '7246', first_seen: seen(350), avg90: 5200 },
      { name: 'Orion Rental Equipment', phone: '248-555-0193', bank: 'Oakland Savings Bank', last4: '2063', first_seen: seen(200), avg90: 980 },
      { name: 'Metro Office Supply', phone: '248-555-0104', bank: 'Huron Valley Bank', last4: '5528', first_seen: seen(450), avg90: 320 },
      { name: 'Hartwell Insurance Agency', phone: '248-555-0115', bank: 'Lakeshore Credit Union', last4: '4096', first_seen: seen(800), avg90: 1800 },
      { name: 'Davison Tile and Stone', phone: '248-555-0126', bank: 'Oakland Savings Bank', last4: '3317', first_seen: seen(160), avg90: 2400 }
    ];
    function row(id, when, payee, amount, type, how, last4, bank, verdict, reasons, cautions, status, extra) {
      var r = { id: id, at: iso(when), payee: payee, amount: amount, type: type, bank: bank || '', last4: last4, how: how,
        note: '', submitter: 'Dana (bookkeeper)', offHours: cautions.length > 0, urgent: false, verdict: verdict, reasons: reasons,
        cautions: cautions, status: status, resolved_at: '', who_called: '', number_called: '', said: '', approver: '', override_reason: '' };
      for (var k in (extra || {})) r[k] = extra[k];
      return r;
    }
    var gStart = at(10, 10, 40), nStart = at(7, 16, 30);
    var log = [
      row('s1', at(13, 9, 20), 'Acme Supply LLC', 1840, 'payment', 'email', '4417', 'Huron Valley Bank', 'PASS', [], [], 'pass'),
      row('s2', at(12, 14, 5), 'Pinecrest HVAC', 2200, 'payment', 'portal', '0238', 'Lakeshore Credit Union', 'PASS', [], [], 'pass'),
      row('s3', gStart, 'Gordon Glass', 3150, 'bank change', 'email', '6620', 'Oakland Savings Bank', 'HOLD',
        ['Bank details changed: last 4 is 6620, file has 3391.'], ['Arrived outside payment hours. Worth checking.'], 'released',
        { resolved_at: iso(new Date(gStart.getTime() + 3 * 3600000)), who_called: 'Dana', number_called: '248-555-0134',
          said: 'Owner confirmed the new account after a bank merger.', approver: 'Marcus (owner)' }),
      row('s4', at(9, 11, 15), 'Northfield Concrete', 6400, 'payment', 'phone', '9051', 'Huron Valley Bank', 'PASS', [], [], 'pass'),
      row('s5', nStart, 'Brightline Supply Co', 4800, 'payment', 'email', '7782', '', 'HOLD',
        ['Payee not on file.'], ['The request pushes to hurry. Worth checking.'], 'rejected',
        { urgent: true, offHours: false, resolved_at: iso(new Date(nStart.getTime() + 20 * 3600000)), who_called: 'Dana', number_called: '248-555-0190',
          said: 'The company says it sent no invoice. Could not verify.', approver: 'Marcus (owner)' }),
      row('s6', at(5, 9, 50), 'Acme Supply LLC', 2050, 'payment', 'email', '4417', 'Huron Valley Bank', 'PASS', [], [], 'pass'),
      row('s7', at(3, 13, 10), 'Pinecrest HVAC', 1975, 'payment', 'portal', '0238', 'Lakeshore Credit Union', 'PASS', [], [], 'pass'),
      row('s8', at(1, 15, 45), 'Gordon Glass', 3400, 'payment', 'phone', '6620', 'Oakland Savings Bank', 'PASS', [], [], 'pass')
    ];
    return { vendors: vendors, log: log };
  }
};
