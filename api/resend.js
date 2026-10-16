// Admin: resend any one email to a subscriber. Does NOT change their plan.
// https://www.justincaseimdead.com/api/resend?key=JIC_TEST_KEY
const { stripe, send } = require('../lib/core');
const EMAILS = require('../lib/emails.json');
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

function page(key, msg, email, id) {
  const opts = Object.keys(EMAILS).map(k => '<option value="' + esc(k) + '"' + (k === (id || 'W1') ? ' selected' : '') + '>' + esc(k) + ' — ' + esc(EMAILS[k].subject.replace(/\{[a-z_]+\}/g, '…')) + '</option>').join('');
  const field = 'width:100%;box-sizing:border-box;padding:14px;font-size:17px;border:1px solid #E2DBCD;border-radius:4px;background:#FBF8F2;color:#2B2A26;margin:0 0 16px';
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Resend an email</title></head>' +
    '<body style="margin:0;background:#F1ECE2;color:#2B2A26;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><div style="max-width:620px;margin:0 auto;padding:48px 24px">' +
    '<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#A0703F">Admin</p>' +
    '<h1 style="margin:0 0 12px;font-family:Georgia,serif;font-weight:normal;font-size:30px">Resend an email</h1>' +
    '<p style="margin:0 0 28px;font-size:17px;line-height:1.6;color:#6B665C">' + msg + '</p>' +
    '<form method="GET" action="/api/resend"><input type="hidden" name="key" value="' + esc(key) + '">' +
    '<label style="display:block;font-weight:700;margin:0 0 6px">Subscriber email</label><input name="email" type="email" required value="' + esc(email || '') + '" style="' + field + '">' +
    '<label style="display:block;font-weight:700;margin:0 0 6px">Email to send</label><select name="id" style="' + field + '">' + opts + '</select>' +
    '<input type="hidden" name="go" value="1"><button style="padding:16px 32px;border:0;border-radius:4px;background:#2F4A3A;color:#FBF8F2;font-size:17px;font-weight:700;cursor:pointer">Send it</button></form>' +
    '</div></body></html>';
}

module.exports = async (req, res) => {
  const q = req.query || {};
  if (!process.env.JIC_TEST_KEY || q.key !== process.env.JIC_TEST_KEY) return res.status(401).send('Unauthorized');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!q.go) return res.send(page(q.key, 'Sends one email again, with their name and working buttons. Their plan doesn’t move or change.', q.email, q.id));
  if (!EMAILS[q.id]) return res.status(400).send(page(q.key, 'Pick an email from the list.', q.email, q.id));
  const found = await stripe('customers?limit=1&email=' + encodeURIComponent(q.email || ''));
  const cus = found.data[0];
  if (!cus || !(cus.metadata || {}).jic_track) return res.status(404).send(page(q.key, 'No subscriber with that email. Check the spelling (it must match Stripe).', q.email, q.id));
  try { await send(cus, q.id); }
  catch (e) { return res.status(500).send(page(q.key, 'Send failed: ' + esc(e.message), q.email, q.id)); }
  res.send(page(q.key, '<strong>Sent ' + esc(q.id) + ' to ' + esc(cus.email) + '.</strong> Their plan is unchanged. Send another?', q.email, q.id));
};
