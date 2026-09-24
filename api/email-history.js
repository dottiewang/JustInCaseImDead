const { query } = require('../lib/db');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  if (!process.env.EMAIL_HISTORY_SECRET || req.headers.authorization !== `Bearer ${process.env.EMAIL_HISTORY_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const email = String((req.query || {}).email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'An email query parameter is required.' });

  try {
    const result = await query(
      `SELECT stripe_customer_id, recipient_email, email_key, subject, resend_id, sent_at
       FROM sent_emails
       WHERE LOWER(recipient_email) = $1
       ORDER BY sent_at DESC`,
      [email],
    );
    return res.status(200).json({ email, emails: result.rows });
  } catch (error) {
    console.error('Email history error:', error);
    return res.status(500).json({ error: 'Unable to load email history.' });
  }
};