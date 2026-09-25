const { DAY, WEEKLY, GUIDED_LEN, stripe, saveMeta, send, finishUpdates, nextCheckpointUpdates } = require('../lib/core');

// Decide and send whatever is due for one customer
async function tick(cus, now) {
  const m = cus.metadata || {};
  if (!m.jic_track || m.jic_unsub === '1' || !cus.email) return null;

  // Finished: checkpoints
  if (m.jic_track === 'done') {
    if (now < (+m.jic_cpnext || Infinity)) return null;
    const cpn = m.jic_cpn === '2' ? 2 : 1;
    if (m.jic_cpstyle === 'guided') {
      const g = +m.jic_cpg || 1;
      await send(cus, `G${cpn}_${g}`);
      return g >= GUIDED_LEN[cpn] ? nextCheckpointUpdates(m, now) : { jic_cpg: g + 1, jic_cpnext: now + 3 * DAY };
    }
    if (m.jic_cpact !== '1') { await send(cus, 'CP' + cpn); return { jic_cpact: '1', jic_cpnext: now + 14 * DAY }; }
    if (m.jic_cprem !== '1') { await send(cus, 'CP' + cpn); return { jic_cprem: '1', jic_cpnext: now + 14 * DAY }; }
    return nextCheckpointUpdates(m, now);
  }

  // Paused
  if (m.jic_paused === '1' && now - (+m.jic_pausedat || now) >= 30 * DAY) { await send(cus, 'C2'); return { jic_paused: '2' }; }
  if (m.jic_paused) return null;

  if (now < (+m.jic_next || 0)) return null;
  const silent = +m.jic_silent || 0;
  const pos = +m.jic_pos || 0;
  const pastTemplates = m.jic_track === 'weekly' && pos >= 10;
  if (silent >= 3 && !pastTemplates) { await send(cus, 'C'); return { jic_paused: '1', jic_pausedat: now }; }

  if (m.jic_track === 'weekly') {
    if (pos >= 11) {
      if (m.jic_w11rem !== '1') { await send(cus, 'W11'); return { jic_w11rem: '1', jic_next: now + 7 * DAY }; }
      return finishUpdates(m, now);
    }
    await send(cus, WEEKLY[pos]);
    return { jic_pos: pos + 1, jic_next: now + (pos === 0 ? 3 : 7) * DAY, jic_silent: silent + 1 };
  }

  if (m.jic_track === 'easy') {
    let q = +m.jic_q || 1;
    const skips = (m.jic_skips || '').split(',').filter(Boolean);
    if (q <= 16) { await send(cus, 'Q' + q); return { jic_q: q + 1, jic_next: now + 3 * DAY, jic_silent: silent + 1 }; }
    if (skips.length) { const s = skips.shift(); await send(cus, 'Q' + s); return { jic_skips: skips.join(','), jic_next: now + 3 * DAY, jic_silent: silent + 1 }; }
    await send(cus, 'W10');
    return { jic_track: 'weekly', jic_pos: 10, jic_next: now + 7 * DAY, jic_silent: silent + 1 };
  }
  return null;
}

module.exports = async (req, res) => {
  if (!process.env.CRON_SECRET || req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) return res.status(401).send('Unauthorized');
  const now = Date.now();
  let after = null, sent = 0, errors = 0;
  do {
    const q = 'subscriptions?status=active&limit=100&expand[]=data.customer' + (after ? '&starting_after=' + after : '');
    const page = await stripe(q);
    for (const sub of page.data) {
      try {
        const u = await tick(sub.customer, now);
        if (u) { await saveMeta(sub.customer.id, u); sent++; }
      } catch (e) { errors++; console.error(sub.customer && sub.customer.id, e.message); }
    }
    after = page.has_more ? page.data[page.data.length - 1].id : null;
  } while (after);
  res.status(200).json({ ok: true, updated: sent, errors });
};
