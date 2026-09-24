const { DAY, Q_TEMPLATE, getCustomer, saveMeta, send, verify, firstQForTemplate, finishUpdates, nextCheckpointUpdates } = require('../lib/core');

module.exports = async (req, res) => {
  const { c, a, s } = req.query || {};
  if (!c || !a || !verify(c, a, s)) return res.status(400).send('This link is not valid.');
  const now = Date.now();
  const cus = await getCustomer(c);
  const m = cus.metadata || {};
  const u = { jic_silent: 0 };
  const soon = t => Math.min(+t || Infinity, now + 3 * DAY);
  const pos = +m.jic_pos || 0;

  switch (a) {
    case 'done':
    case 'skip':
      if (m.jic_track === 'done') {
        if (m.jic_cpstyle !== 'guided' && m.jic_cpact === '1') Object.assign(u, nextCheckpointUpdates(m, now));
      } else if (m.jic_track === 'weekly') {
        if (pos >= 11) Object.assign(u, finishUpdates(m, now));
        else u.jic_next = soon(m.jic_next);
      } else if (m.jic_track === 'easy') {
        if (a === 'skip') { const last = (+m.jic_q || 2) - 1; u.jic_skips = [m.jic_skips, last].filter(Boolean).join(','); }
        u.jic_next = soon(m.jic_next);
      }
      break;
    case 'snooze':
      if (m.jic_track === 'done') Object.assign(u, { jic_cpnext: now + 14 * DAY, jic_cpact: '', jic_cprem: '' });
      else Object.assign(u, { jic_pos: Math.max(0, pos - 1), jic_next: now + 7 * DAY, jic_w11rem: '' });
      break;
    case 'easy':
      if (m.jic_track !== 'easy') {
        Object.assign(u, { jic_track: 'easy', jic_q: firstQForTemplate(Math.max(1, pos)), jic_skips: '', jic_next: now + 2 * DAY, jic_paused: '' });
        await send({ ...cus, metadata: { ...m, ...u } }, 'E0');
      }
      break;
    case 'full':
      if (m.jic_track === 'easy') { const q = +m.jic_q || 1; const t = q <= 16 ? Q_TEMPLATE[q - 1] : 10; Object.assign(u, { jic_track: 'weekly', jic_pos: t - 1, jic_next: now + DAY, jic_paused: '' }); }
      break;
    case 'resume': Object.assign(u, { jic_paused: '', jic_next: now }); break;
    case 'restart': Object.assign(u, { jic_track: 'weekly', jic_pos: 0, jic_next: now, jic_paused: '', jic_w11rem: '' }); break;
    case 'alldone': Object.assign(u, { jic_track: 'weekly', jic_pos: 9, jic_next: now + DAY, jic_paused: '' }); break;
    case 'annual':
      u.jic_cp = 'annual';
      if (m.jic_track === 'done' && m.jic_cpn !== '2' && m.jic_cpact !== '1') Object.assign(u, { jic_cpn: 2, jic_cpnext: (+m.jic_cpnext || now) + 183 * DAY });
      break;
    case 'guided': Object.assign(u, { jic_cpstyle: 'guided', jic_cpg: 1, jic_cpnext: now, jic_cpact: '', jic_cprem: '' }); break;
    case 'cpfull': Object.assign(u, { jic_cpstyle: 'full', jic_cpg: '', jic_cpnext: now, jic_cpact: '', jic_cprem: '' }); break;
    case 'unsub': u.jic_unsub = '1'; break;
    case 'newsoff': u.jic_news = '0'; break;
    default: return res.status(400).send('Unknown action.');
  }
  await saveMeta(c, u);
  res.writeHead(302, { Location: '/thanks?a=' + encodeURIComponent(a) });
  res.end();
};
