// Emails one subscriber the newsletter issue they'd get next, marked [Preview]. Private: needs ?key=CRON_SECRET.
// /api/newsletter-preview?key=...&email=you@example.com  (optional &n=5 to preview issue 5)
const { stripe, sendRaw } = require('../lib/core');
const NL = require('../lib/newsletter');
const { issueFrom } = require('../lib/monthly');

module.exports = async (req, res) => {
  const q = req.query || {};
  if (!process.env.CRON_SECRET || q.key !== process.env.CRON_SECRET) return res.status(401).send('Unauthorized');
  if (!q.email) return res.status(400).send('Add &email=you@example.com to the end of the address.');
  const found = await stripe('customers?limit=1&email=' + encodeURIComponent(q.email));
  const cus = found.data[0];
  if (!cus) return res.status(404).send('No customer with that email. Sign up first.');
  const start = /^\d+$/.test(q.n || '') ? +q.n : (+(cus.metadata || {}).jic_nln || 1);
  const next = issueFrom(start);
  if (!next) return res.status(404).send('No written issue at or after number ' + start + '.');
  const t = NL.build(next.it);
  await sendRaw(cus, { subject: '[Preview] ' + t.subject, html: t.html });
  res.status(200).send('Sent issue ' + next.n + ', "' + next.it.t + '", to ' + cus.email + '.');
};
