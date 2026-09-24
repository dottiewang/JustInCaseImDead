const crypto = require('crypto');
const { DAY, getCustomer, saveMeta, send } = require('../lib/core');

async function rawBody(req) { const chunks = []; for await (const ch of req) chunks.push(ch); return Buffer.concat(chunks).toString('utf8'); }

function verifyStripe(raw, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')));
  const expected = crypto.createHmac('sha256', secret).update(parts.t + '.' + raw).digest('hex');
  const sigs = header.split(',').filter(p => p.startsWith('v1=')).map(p => p.slice(3));
  const fresh = Math.abs(Date.now() / 1000 - Number(parts.t)) < 600;
  return fresh && sigs.some(s => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)));
}

module.exports = async (req, res) => {
  const raw = await rawBody(req);
  if (!verifyStripe(raw, req.headers['stripe-signature'], process.env.JIC_STRIPE_WEBHOOK_SECRET)) return res.status(400).send('Bad signature');
  const event = JSON.parse(raw);
  const now = Date.now();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (!session.customer) return res.status(200).send('No customer');
    const cus = await getCustomer(session.customer);
    const m = cus.metadata || {};
    if (!m.jic_track) {
      const first = ((session.customer_details && session.customer_details.name) || cus.name || '').trim().split(/\s+/)[0] || '';
      const meta = { jic_track: 'weekly', jic_pos: 1, jic_next: now + 3 * DAY, jic_silent: 0, jic_first: first, jic_cp: 'twice', jic_cpstyle: 'full', jic_news: '1', jic_start: now };
      if (!cus.email && session.customer_details) cus.email = session.customer_details.email;
      await send({ ...cus, metadata: { ...m, ...meta } }, 'W1');
      await saveMeta(cus.id, meta);
    } else if (m.jic_track !== 'done' && m.jic_paused) {
      await send(cus, 'R');
      await saveMeta(cus.id, { jic_paused: '3', jic_unsub: '' });
    }
  }

  if (event.type === 'invoice.paid' && event.data.object.billing_reason === 'subscription_cycle') {
    const cus = await getCustomer(event.data.object.customer);
    const m = cus.metadata || {};
    if (m.jic_track && m.jic_track !== 'done' && m.jic_paused && m.jic_paused !== '3' && m.jic_unsub !== '1') {
      await send(cus, 'R');
      await saveMeta(cus.id, { jic_paused: '3' });
    }
  }

  res.status(200).json({ received: true });
};