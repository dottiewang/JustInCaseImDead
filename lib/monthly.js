// Monthly newsletter: who gets it, and sending each person their next issue once a month.
// Each person starts at issue 1 and works through the schedule in order (jic_nln = next issue number).
const NL = require('./newsletter');
const { sendRaw } = require('./core');
const ITEMS = require('./guides.json').concat(require('./newsletters.json'));
const SCHEDULE = require('./schedule.json').slice().sort((a, b) => a.n - b.n);

// Finished the plan (clicked Done or went quiet on the last email), or paused and already sent the 30-day follow-up.
// Never while still making the binder, never if unsubscribed or monthly guides turned off.
function eligible(m) {
  if (m.jic_unsub === '1' || m.jic_news === '0') return false;
  return m.jic_track === 'done' || m.jic_paused === '2' || m.jic_paused === '3';
}

// First written (non-draft) issue at or after number n. Null if none left.
function issueFrom(n) {
  for (const s of SCHEDULE) {
    if (s.n < n) continue;
    const it = ITEMS.find(i => NL.slug(i.t) === s.slug && !i.draft);
    if (it) return { n: s.n, it };
  }
  return null;
}

// Sends during the first 7 days of the month, once per person per month. Anyone missed one day is picked up the next.
async function maybeSend(cus, now) {
  const d = new Date(now);
  if (d.getUTCDate() > 7) return null;
  const m = cus.metadata || {};
  if (!cus.email || !eligible(m)) return null;
  const key = NL.monthKey(d);
  if (m.jic_nl === key) return null;
  const next = issueFrom(+m.jic_nln || 1);
  if (!next) return null;
  await sendRaw(cus, NL.build(next.it), 'nl-' + cus.id + '-' + key);
  return { jic_nl: key, jic_nln: next.n + 1 };
}

module.exports = { eligible, maybeSend, issueFrom };
