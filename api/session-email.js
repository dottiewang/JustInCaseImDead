module.exports = async (req, res) => {
  const id = (req.query || {}).session_id || '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return res.status(400).json({});
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + id, { headers: { Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY } });
  if (!r.ok) return res.status(404).json({});
  const s = await r.json();
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ email: (s.customer_details && s.customer_details.email) || '' });
};
