// Admin support page: look up a subscriber, see where they are in the plan, fix things.
// https://www.justincaseimdead.com/api/support?key=JIC_TEST_KEY
// Every change shows a preview first and only saves after "Yes, do it".
const { stripe, send, saveMeta, DAY, WEEKLY, finishUpdates } = require('../lib/core');
const EMAILS = require('../lib/emails.json');

const STEP = ['Cover Sheet', 'Read This First', 'Legal & Decision Making', 'Digital Access Plan', 'Financial Snapshot', 'Home, Car & Everyday Life', 'Insurance & Protection', 'Identification & Records', 'Personal Notes', 'Print a Paper Copy', 'Store It Safely'];
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const fmt = t => new Date(+t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' });
const subj = k => EMAILS[k] ? EMAILS[k].subject.replace(/\{[a-z_]+\}/g, '…') : k;

const REPLIES = {
  resend: (n, x) => `Hi ${n},\n\nI've just resent "${x.subject}". It should arrive within a few minutes. If you don't see it, please check your Spam or Promotions folder.\n\nJust In Case`,
  step: (n, x) => `Hi ${n},\n\nNo problem. I've moved you to Step ${x.n}: ${x.name}, and that email is on its way now. The plan carries on weekly from there.\n\nEverything you've already written is still in your Google Drive, untouched.\n\nJust In Case`,
  question: (n, x) => `Hi ${n},\n\nNo problem. I've set you to question ${x.n}, and it's on its way now. The next one follows in a few days.\n\nEverything you've already written is still in your Google Drive, untouched.\n\nJust In Case`,
  restart: n => `Hi ${n},\n\nYou're starting fresh from Step 1. The welcome email is on its way now.\n\nAnything you've already written is still in your Google Drive, so there's no need to copy those templates again.\n\nJust In Case`,
  resume: n => `Hi ${n},\n\nWelcome back. Your next step arrives within a day, then one a week as before.\n\nJust In Case`,
  unstop: n => `Hi ${n},\n\nYour emails are back on. Your plan picks up right where you left off.\n\nJust In Case`,
  newson: (n, x) => `Hi ${n},\n\nMonthly guides are back on. ${x.done ? 'The next one arrives in the first week of next month.' : 'They start once your plan is finished.'}\n\nJust In Case`,
  newsoff: n => `Hi ${n},\n\nDone. You won't get any more monthly guides. Your plan emails and checkpoints carry on as normal.\n\nJust In Case`,
  finish: (n, x) => `Hi ${n},\n\nI've marked your plan as finished. Your first checkpoint arrives in about ${x.months} months, to help you keep everything up to date.\n\nJust In Case`,
  notfound: () => `Hi there,\n\nI couldn't find a plan under this email address. Could you reply with the email you used when you signed up?\n\nJust In Case`
};

function status(m, now) {
  const r = [], pos = +m.jic_pos || 0, q = +m.jic_q || 1;
  const when = t => !+t ? '—' : (+t <= now ? 'due now (next daily run)' : fmt(t));
  if (m.jic_track === 'weekly') {
    r.push(['Pace', 'Weekly (full plan)']);
    r.push(['Last sent', pos ? `W${pos} · Step ${pos}: ${STEP[pos - 1]}` : 'Nothing yet']);
    r.push(['Next', pos < 11 ? `W${pos + 1} · Step ${pos + 1}: ${STEP[pos]}, ${when(m.jic_next)}` : (m.jic_w11rem === '1' ? 'Plan finishes ' + when(m.jic_next) : 'W11 reminder, ' + when(m.jic_next))]);
  } else if (m.jic_track === 'easy') {
    r.push(['Pace', 'Easy mode (2-minute questions)']);
    r.push(['Last sent', q > 1 ? 'Q' + (q - 1) : 'Easy mode start (E0)']);
    r.push(['Next', (q <= 16 ? 'Q' + q : (m.jic_skips ? 'Skipped Q' + m.jic_skips.split(',')[0] : 'W10 (print step)')) + ', ' + when(m.jic_next)]);
    if (m.jic_skips) r.push(['Skipped', m.jic_skips.split(',').map(s => 'Q' + s).join(', ')]);
  } else if (m.jic_track === 'done') {
    r.push(['Pace', 'Plan finished' + (+m.jic_done ? ' on ' + fmt(m.jic_done) : '')]);
    r.push(['Next', `Checkpoint ${m.jic_cpn === '2' ? 2 : 1} (${m.jic_cpstyle === 'guided' ? 'guided questions' : 'full review'}), ${when(m.jic_cpnext)}`]);
    r.push(['Checkpoints', m.jic_cp === 'annual' ? 'Once a year' : 'Twice a year']);
  }
  r.push(['Paused', { '1': 'Yes (check-in sent)', '2': 'Yes (second check-in sent)', '3': 'Yes (renewal email sent)' }[m.jic_paused] || 'No']);
  r.push(['All emails', m.jic_unsub === '1' ? '<b style="color:#9A3B2E">STOPPED</b> (clicked Stop all emails)' : 'On']);
  r.push(['Monthly guides', m.jic_news === '0' ? 'Off' : (m.jic_track === 'done' ? 'On' + (m.jic_nl ? ', last sent ' + esc(m.jic_nl) : '') : 'On (start once the plan is finished)')]);
  if (+m.jic_silent) r.push(['No clicks', m.jic_silent + ' emails in a row' + (m.jic_track === 'weekly' ? ' (weekly plan pauses at 3)' : '')]);
  if (+m.jic_start) r.push(['Signed up', fmt(m.jic_start)]);
  r.push(['Plan', { month: 'Monthly', quarter: 'Quarterly', year: 'Annual' }[m.jic_plan] || (m.jic_plan ? esc(m.jic_plan) : 'Unknown (signed up before tracking)')]);
  r.push(['Consent', m.jic_consent ? esc(m.jic_consent) : 'Not recorded']);
  r.push(['Confirmation sent', +m.jic_ack ? fmt(m.jic_ack) : 'Not sent']);
  if (m.jic_supp) r.push(['Support log', esc(m.jic_supp)]);
  return r;
}

function plan(m, q, now) {
  const n = parseInt(q.n, 10), base = { jic_paused: '', jic_pausedat: '', jic_silent: 0 };
  switch (q.do) {
    case 'resend': return EMAILS[q.id] ? { label: `Resend ${q.id}: ${subj(q.id)}`, send: q.id, u: {}, reply: 'resend', x: { subject: subj(q.id) } } : { err: 'Pick an email.' };
    case 'step': return n >= 1 && n <= 11 ? { label: `Move to Step ${n}: ${STEP[n - 1]} and send it now`, send: WEEKLY[n - 1], u: { ...base, jic_track: 'weekly', jic_pos: n, jic_next: now + (n === 1 ? 3 : 7) * DAY, jic_w11rem: '' }, reply: 'step', x: { n, name: STEP[n - 1] } } : { err: 'Pick a step.' };
    case 'question': return n >= 1 && n <= 16 ? { label: `Move to easy-mode question ${n} and send it now`, send: 'Q' + n, u: { ...base, jic_track: 'easy', jic_q: n + 1, jic_next: now + 3 * DAY }, reply: 'question', x: { n } } : { err: 'Pick a question.' };
    case 'restart': return { label: 'Start over from Step 1 (sends the welcome email now)', send: 'W1', u: { ...base, jic_track: 'weekly', jic_pos: 1, jic_next: now + 3 * DAY, jic_w11rem: '', jic_q: '', jic_skips: '' }, reply: 'restart' };
    case 'resume': return { label: 'Resume (next email goes out in the next daily run)', u: { ...base, jic_next: now }, reply: 'resume' };
    case 'unstop': return { label: 'Undo "Stop all emails"', u: { jic_unsub: '' }, reply: 'unstop' };
    case 'newson': return { label: 'Turn monthly guides on', u: { jic_news: '' }, reply: 'newson', x: { done: m.jic_track === 'done' } };
    case 'newsoff': return { label: 'Turn monthly guides off', u: { jic_news: '0' }, reply: 'newsoff' };
    case 'finish': return { label: 'Mark plan finished (checkpoints start)', u: finishUpdates(m, now), reply: 'finish', x: { months: m.jic_cp === 'annual' ? 12 : 6 } };
  }
  return { err: 'Unknown action.' };
}

const BTN = 'padding:10px 18px;border:0;border-radius:4px;background:#2F4A3A;color:#FBF8F2;font-size:15px;font-weight:700;cursor:pointer';
const FIELD = 'padding:10px;font-size:15px;border:1px solid #E2DBCD;border-radius:4px;background:#FBF8F2;color:#2B2A26;max-width:100%';

const hidden = o => Object.entries(o).map(([k, v]) => `<input type="hidden" name="${k}" value="${esc(v)}">`).join('');
const form = (key, email, doa, inner, label, title, when) => `<form method="GET" action="/api/support" style="padding:18px 0;border-top:1px solid #E2DBCD">${hidden({ key, email, do: doa })}<p style="margin:0 0 4px;font-size:17px;font-weight:700;color:#2B2A26">${title}</p><p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:#2B2A26">${when}</p><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">${inner}<button style="${BTN}">${label}</button></div></form>`;
const opts = (list, sel) => list.map(([v, t]) => `<option value="${esc(v)}"${v === sel ? ' selected' : ''}>${esc(t)}</option>`).join('');
const card = html => `<div style="background:#FBF8F2;border:1px solid #E2DBCD;border-radius:6px;padding:20px 22px;margin:0 0 24px">${html}</div>`;
const replyBox = text => card(`<p style="margin:0 0 8px;font-weight:700">Reply you can send</p><textarea id="reply" rows="9" style="${FIELD};width:100%;box-sizing:border-box;font-family:inherit;line-height:1.5">${esc(text)}</textarea><button type="button" onclick="navigator.clipboard.writeText(document.getElementById('reply').value);this.textContent='Copied'" style="${BTN};margin-top:10px">Copy reply</button>`);

function page(key, email, body) {
  return '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Support</title></head>' +
    '<body style="margin:0;background:#F1ECE2;color:#2B2A26;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><div style="max-width:680px;margin:0 auto;padding:40px 20px">' +
    '<p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#A0703F">Admin</p>' +
    '<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:normal;font-size:30px">Support</h1>' +
    `<form method="GET" action="/api/support" style="display:flex;flex-wrap:wrap;gap:10px;margin:0 0 28px">${hidden({ key })}<input name="email" type="email" required placeholder="Subscriber email" value="${esc(email || '')}" style="${FIELD};flex:1 1 260px"><button style="${BTN}">Look up</button></form>` +
    body + '</div></body></html>';
}

module.exports = async (req, res) => {
  const purpose = String(req.headers['sec-purpose'] || req.headers['purpose'] || req.headers['x-purpose'] || '');
  if (/prefetch|prerender/i.test(purpose)) { res.statusCode = 503; res.setHeader('Cache-Control', 'no-store'); return res.end(); }
  res.setHeader('Cache-Control', 'no-store');
  const isPost = req.method === 'POST';
  const q = { ...(req.query || {}), ...(isPost && req.body && typeof req.body === 'object' ? req.body : {}) };
  if (!process.env.JIC_TEST_KEY || q.key !== process.env.JIC_TEST_KEY) return res.status(401).send('Unauthorized');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  const key = q.key, email = (q.email || '').trim();
  const back = '/api/support?key=' + encodeURIComponent(key) + '&email=' + encodeURIComponent(email);
  if (!email) return res.send(page(key, '', '<p style="color:#6B665C;font-size:17px;line-height:1.6">Type the email address they signed up with.</p>'));

  const found = await stripe('customers?limit=10&email=' + encodeURIComponent(email));
  const withPlan = found.data.filter(c => (c.metadata || {}).jic_track);
  const cus = withPlan[0];
  if (!cus) return res.send(page(key, email, card('<p style="margin:0;font-size:17px"><strong>No plan found for that email.</strong> It must match Stripe exactly.</p>') + replyBox(REPLIES.notfound())));
  const m = cus.metadata || {}, now = Date.now(), first = m.jic_first || 'there';
  let top = withPlan.length > 1 ? card(`<p style="margin:0">Note: ${withPlan.length} Stripe customers have this email. Showing the first one.</p>`) : '';

  if (q.do) {
    const p = plan(m, q, now);
    if (p.err) top += card(`<p style="margin:0;color:#9A3B2E"><strong>${esc(p.err)}</strong></p>`);
    else if (!(isPost && q.confirm === '1')) {
      const rows = Object.entries(p.u).filter(([k, v]) => String(m[k] == null ? '' : m[k]) !== String(v)).map(([k, v]) => {
        const show = x => x === '' || x == null ? '(blank)' : (/next|done$/.test(k) && +x > 1e12 ? fmt(x) : esc(x));
        return `<tr><td style="padding:4px 12px 4px 0;color:#6B665C">${k.replace('jic_', '')}</td><td style="padding:4px 0">${show(m[k])} → <strong>${show(v)}</strong></td></tr>`;
      }).join('');
      const warn = p.send && m.jic_unsub === '1' && q.do !== 'unstop' ? '<p style="margin:12px 0 0;color:#9A3B2E">They\'ve stopped all emails. This one still sends, but nothing after it will until you undo "Stop all emails".</p>' : '';
      top += card(`<p style="margin:0 0 10px;font-size:17px"><strong>${esc(p.label)}?</strong></p>` +
        (p.send ? `<p style="margin:0 0 10px">Sends now: <strong>${esc(p.send)}</strong> · ${esc(subj(p.send))}</p>` : '') +
        (rows ? `<table style="border-collapse:collapse;font-size:15px;margin:0 0 6px">${rows}</table>` : '<p style="margin:0 0 6px;color:#6B665C">Their plan doesn\'t change.</p>') + warn +
        `<form method="POST" action="/api/support" onsubmit="this.querySelector('button').disabled=true;this.querySelector('button').textContent='Working…'" style="display:flex;gap:10px;margin:16px 0 0">${hidden({ key, email, do: q.do, ...(q.n ? { n: q.n } : {}), ...(q.id ? { id: q.id } : {}), confirm: '1', t: String(now) })}<button style="${BTN}">Yes, do it</button><a href="/api/support?key=${encodeURIComponent(key)}&email=${encodeURIComponent(email)}" style="padding:10px 18px;color:#2F4A3A;font-weight:700">Cancel</a></form>`);
    } else if (q.t && m.jic_suppt === String(q.t)) {
      res.writeHead(303, { Location: back + '&did=' + encodeURIComponent(q.do) + (q.n ? '&n=' + encodeURIComponent(q.n) : '') + (q.id ? '&id=' + encodeURIComponent(q.id) : '') });
      return res.end();
    } else {
      try {
        const log = (fmt(now) + ' ' + q.do + (q.n ? ' ' + q.n : '') + (q.id ? ' ' + q.id : '') + (m.jic_supp ? '; ' + m.jic_supp : '')).slice(0, 450);
        const u = { ...p.u, jic_supp: log, jic_suppt: String(q.t || now) };
        if (p.send) await send({ ...cus, metadata: { ...m, ...u } }, p.send);
        await saveMeta(cus.id, u);
        res.writeHead(303, { Location: back + '&did=' + encodeURIComponent(q.do) + (q.n ? '&n=' + encodeURIComponent(q.n) : '') + (q.id ? '&id=' + encodeURIComponent(q.id) : '') });
        return res.end();
      } catch (e) { top += card(`<p style="margin:0;color:#9A3B2E"><strong>Failed, nothing saved:</strong> ${esc(e.message)}</p>`); }
    }
  }

  if (q.did && !q.do) {
    const p = plan(m, { do: q.did, n: q.n, id: q.id }, now);
    if (!p.err) top += card(`<p style="margin:0;font-size:17px"><strong>Done: ${esc(p.label)}.</strong></p><p style="margin:6px 0 0;font-size:14px;color:#6B665C">Refreshing this page won't do it again.</p>`) + replyBox(REPLIES[p.reply](first, p.x || {}));
  }

  const st = status(m, now).map(([a, b]) => `<tr><td style="padding:6px 16px 6px 0;color:#6B665C;vertical-align:top;white-space:nowrap">${a}</td><td style="padding:6px 0">${b}</td></tr>`).join('');
  const pos = +m.jic_pos || 0, qn = +m.jic_q || 1;
  const fixes =
    form(key, email, 'resend', `<select name="id" style="${FIELD};flex:1 1 260px">${opts(Object.keys(EMAILS).filter(k => k !== 'PRICE').map(k => [k, k + ' · ' + subj(k)]), m.jic_track === 'weekly' && pos ? WEEKLY[pos - 1] : 'W1')}</select>`, 'Resend', 'Send an email again', '“I never got it” or “I deleted it.” Sends one email again. Nothing else changes.') +
    form(key, email, 'step', `<select name="n" style="${FIELD};flex:1 1 260px">${opts(STEP.map((s, i) => [String(i + 1), `Step ${i + 1}: ${s}`]), String(Math.max(1, pos - 1)))}</select>`, 'Move', 'Go back (or ahead) to a step', '“I clicked Done by mistake” or “I want to redo a week.” Sends that step now, then one a week from there.') +
    (m.jic_track === 'easy' ? form(key, email, 'question', `<select name="n" style="${FIELD};flex:1 1 260px">${opts(Array.from({ length: 16 }, (_, i) => [String(i + 1), 'Question ' + (i + 1) + ' · ' + subj('Q' + (i + 1))]), String(Math.max(1, qn - 2)))}</select>`, 'Move', 'Go back (or ahead) to a question', 'Easy mode version of the one above. Sends that question now, then one every few days.') : '') +
    form(key, email, 'restart', '', 'Start over', 'Start over from Step 1', '“I want to begin again.” Sends the welcome email now and runs the whole plan from the start. Their Google Docs aren’t touched.') +
    (m.jic_paused ? form(key, email, 'resume', '', 'Resume', 'Un-pause', '“I stopped clicking and want back in.” Their next step goes out within a day.') : '') +
    (m.jic_unsub === '1' ? form(key, email, 'unstop', '', 'Turn emails back on', 'Undo “Stop all emails”', '“I clicked Stop all emails by mistake.” Turns everything back on, right where they left off.') : '') +
    form(key, email, m.jic_news === '0' ? 'newson' : 'newsoff', '', m.jic_news === '0' ? 'Turn on' : 'Turn off', m.jic_news === '0' ? 'Turn monthly guides back on' : 'Turn off monthly guides', m.jic_news === '0' ? '“I want the monthly guides again.” Plan emails aren’t affected.' : '“I don’t want the monthly guides.” Plan emails and checkpoints carry on.') +
    (m.jic_track !== 'done' ? form(key, email, 'finish', '', 'Mark finished', 'Skip to the end', '“I’ve already filled everything in.” Stops the weekly emails. Checkpoints start in 6 months (12 if once a year).') : '');

  res.send(page(key, email, top +
    card(`<p style="margin:0 0 4px;font-size:19px;font-family:Georgia,serif">${esc(m.jic_first || '')} ${esc(cus.email)}</p><table style="border-collapse:collapse;font-size:15px;line-height:1.4">${st}</table><p style="margin:12px 0 0;font-size:14px"><a href="https://dashboard.stripe.com/customers/${esc(cus.id)}" target="_blank" style="color:#2F4A3A">Open in Stripe</a> (change email, cancel, refund)</p>`) +
    card(`<p style="margin:0 0 4px;font-family:Georgia,serif;font-size:22px">Fix something</p><p style="margin:0 0 6px;font-size:15px;color:#2B2A26">Each button shows what will change first. Nothing happens until you click “Yes, do it”.</p>${fixes}`)));
};
