const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const supportToEmail = process.env.SUPPORT_TO_EMAIL || 'justincaseimdead@gmail.com';

  if (!apiKey || !fromEmail) {
    return res.status(500).json({
      error: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL environment variable.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = String(body.name || 'Visitor').trim();
    const email = String(body.email || '').trim();
    const subject = String(body.subject || 'Support request').trim();
    const message = String(body.message || '').trim();

    if (!email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: [supportToEmail],
      reply_to: email,
      subject: subject || 'Support request',
      html: `
        <h2>New message from ${name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'Support request'}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      text: `New message from ${name}\n\nEmail: ${email}\nSubject: ${subject || 'Support request'}\n\nMessage:\n${message}`,
    });

    return res.status(200).json({
      success: true,
      id: emailResult?.data?.id || null,
    });
  } catch (error) {
    console.error('Resend email error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unable to send email.',
    });
  }
};
