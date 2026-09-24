const crypto = require('crypto');
const EMAILS = require('./emails.json');

const SITE = 'https://www.justincaseimdead.com';
const FROM = 'Just In Case <hello@justincaseimdead.com>';
const DAY = 86400000;

const WEEKLY = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11'];
const STEP_NAMES = ['Cover Sheet', 'Read This First', 'Legal & Decision Making', 'Digital Access Plan', 'Financial Snapshot', 'Home, Car & Everyday Life', 'Insurance & Protection', 'Identification & Records', 'Personal Notes', 'Print a paper copy', 'Store it safely'];
// Template number (1-9) each easy-mode question belongs to, Q1..Q16
const Q_TEMPLATE = [1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 9, 9];
const GUIDED_LEN = { 1: 5, 2: 6 };

const PH = {
  done_url: 'done', snooze_url: 'snooze', skip_url: 'skip', easy_mode_url: 'easy', full_mode_url: 'full',
  resume_url: 'resume', restart_url: 'restart', all_done_url: 'alldone', annual_only_url: 'annual',
  guided_checkpoint_url: 'guided', checkpoint_full_url: 'cpfull', unsubscribe_url: 'unsub', newsletter_optout_url: 'newsoff',
};

function env(k) { const v = process.env[k]; if (!v) throw new Error('Missing environment variable ' + k); return v; }
function sign(c, a) { return crypto.createHmac('sha256', env('LINK_SECRET')).update(c + ':' + a).digest('hex').slice(0, 32); }
function verify(c, a, s) { const good = sign(c, a); return typeof s === 'string' && s.length === good.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good)); }
function link(c, a) { return `${SITE}/api/action?c=${encodeURIComponent(c)}&a=${a}&s=${sign(c, a)}`; }
function esc(s) { return String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])); }

async function stripe(path, params) {
  const opts = { method: params ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + env('JIC_STRIPE_KEY') } };
  if (params) { opts.headers['Content-Type'] = 'application/x-www-form-urlencoded'; opts.body = new URLSearchParams(params).toString(); }
  const r = await fetch('https://api.stripe.com/v1/' + path, opts);
  const j = await r.json();
  if (!r.ok) throw new Error('Stripe: ' + JSON.stringify(j.error || j));
  return j;
}
async function getCustomer(id) { return stripe('customers/' + id); }
async function saveMeta(id, updates) {
  const p = {};
  for (const [k, v] of Object.entries(updates)) p[`metadata[${k}]`] = v == null ? '' : String(v);
  return stripe('customers/' + id, p);
}

// What the "paused" and "renewal" emails say about progress
function progressVars(m) {
  let next;
  if (m.jic_track === 'easy') { const q = +m.jic_q || 1; next = q <= 16 ? Q_TEMPLATE[q - 1] : 10; }
  else next = Math.min(11, (+m.jic_pos || 0) + 1);
  return { next_step_number: String(next), next_step_name: STEP_NAMES[next - 1], steps_done: String(Math.max(0, Math.min(9, next - 1))) };
}

async function send(cus, key) {
  const t = EMAILS[key];
  if (!t) throw new Error('Unknown email ' + key);
  const m = cus.metadata || {};
  const vars = { first_name: esc(m.jic_first || 'there'), ...progressVars(m) };
  for (const [ph, a] of Object.entries(PH)) vars[ph] = link(cus.id, a);
  const fill = s => s.replace(/\{([a-z_]+)\}/g, (all, k) => (vars[k] != null ? vars[k] : all));
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env('RESEND_API_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM, to: [cus.email], subject: fill(t.subject), html: fill(t.html),
      headers: { 'List-Unsubscribe': `<${vars.unsubscribe_url}>` },
    }),
  });
  if (!r.ok) throw new Error('Resend ' + r.status + ': ' + (await r.text()));
}

function firstQForTemplate(t) { const i = Q_TEMPLATE.indexOf(t); return i === -1 ? 17 : i + 1; }

function finishUpdates(m, now) {
  const annual = m.jic_cp === 'annual';
  return { jic_track: 'done', jic_done: now, jic_cpn: annual ? 2 : 1, jic_cpnext: now + (annual ? 365 : 182) * DAY, jic_cpact: '', jic_cprem: '', jic_cpg: '', jic_silent: 0 };
}
function nextCheckpointUpdates(m, now) {
  const annual = m.jic_cp === 'annual';
  const cpn = annual ? 2 : (m.jic_cpn === '1' ? 2 : 1);
  return { jic_cpn: cpn, jic_cpnext: now + (annual ? 365 : m.jic_cpn === '1' ? 183 : 182) * DAY, jic_cpact: '', jic_cprem: '', jic_cpg: '' };
}

module.exports = { DAY, WEEKLY, Q_TEMPLATE, GUIDED_LEN, getCustomer, saveMeta, stripe, send, verify, firstQForTemplate, finishUpdates, nextCheckpointUpdates };
