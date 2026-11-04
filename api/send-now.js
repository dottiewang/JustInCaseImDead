const { DAY, WEEKLY, getCustomer, saveMeta, send } = require('../lib/core');

module.exports = async (req, res) => {
  const purpose = String(req.headers['sec-purpose'] || req.headers.purpose || req.headers['x-purpose'] || '');
  if (/prefetch|prerender/i.test(purpose)) {
    res.statusCode = 503;
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  }
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).send('Method not allowed.');
  }
  const { c, t } = req.body || {};
  if (typeof c !== 'string' || typeof t !== 'string' || !/^[a-f0-9]{64}$/.test(t)) {
    return res.status(400).send('This send link is not valid.');
  }

  const cus = await getCustomer(c);
  const m = cus.metadata || {};
  const pos = +m.jic_pos || 0;
  if (m.jic_nowt !== t || m.jic_nowp !== String(pos)) {
    return res.status(409).send('This send link has already been used or is no longer current.');
  }
  if (m.jic_track !== 'weekly' || m.jic_unsub === '1' || m.jic_paused || pos >= WEEKLY.length) {
    return res.status(409).send('There is no next step available to send now.');
  }

  const now = Date.now();
  await send(cus, WEEKLY[pos], 'done-now-' + t);
  await saveMeta(c, {
    jic_pos: pos + 1,
    jic_next: now + (pos === 0 ? 3 : 7) * DAY,
    jic_silent: (+m.jic_silent || 0) + 1,
    jic_nowt: '',
    jic_nowp: '',
  });
  res.writeHead(303, { Location: '/thanks?a=sent' });
  res.end();
};
