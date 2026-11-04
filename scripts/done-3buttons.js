// Done → three buttons: "Yes, I'm done" (normal week, {done_week_url}), "Done, send the next one now" ({done_now_url}), "Not this week" ({snooze_url}).
// {done_url} (3 days) is no longer used in new emails but MUST keep working for emails already in inboxes.
// Usage: node scripts/done-3buttons.js lib/emails.json   (idempotent; reports counts)
const fs = require('fs');

const RE = /<p class="ink"([^>]*)>Let us know how it went<\/p>\s*<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>\s*<td[\s\S]*?\{done_url\}[\s\S]*?\{snooze_url\}[\s\S]*?<\/tr><\/table>\s*<p class="muted"[^>]*><strong[^>]*>Done<\/strong> &mdash; your next step \(([^)]*)\) arrives in <strong[^>]*>3 days<\/strong> instead of a week\.<\/p>\s*<p class="muted"[^>]*><strong[^>]*>Not this week<\/strong>[\s\S]*?<\/p>\s*<p class="muted"[^>]*><strong[^>]*>Not sure yet\?<\/strong>[\s\S]*?<\/p>\s*<p class="muted"[^>]*>Either click[\s\S]*?<\/p>/g;

const btn = (href, bg, border, tc, sc, title, sub) =>
  `<tr><td style="padding:0 0 10px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td ${bg ? `bgcolor="${bg}" ` : ''}style="${bg ? `background-color:${bg}; ` : ''}${border ? `border:1px solid ${border}; ` : ''}border-radius:4px;"><a href="${href}" style="display:block; padding:12px 18px; font-family:Arial, Helvetica, sans-serif; text-decoration:none;"><span style="display:block; font-size:15px; line-height:20px; font-weight:bold; color:${tc};">${title}</span><span style="display:block; font-size:13px; line-height:19px; color:${sc};">${sub}</span></a></td></tr></table></td></tr>`;

function transform(html) {
  let n = 0;
  const out = html.replace(RE, (_, inkAttrs, paren) => {
    n++;
    const name = paren.split(/, about /)[0];
    return `<p class="ink"${inkAttrs}>Finished this step?</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:420px;">
            ${btn('{done_week_url}', '#2F4A3A', '', '#FFFFFF', '#DCE5DE', '&#10003;&nbsp; Yes, I&rsquo;m done', `${name} comes next week, as usual`)}
            ${btn('{done_now_url}', '#E4EBE3', '', '#2F4A3A', '#3E5A49', '&#10003;&nbsp; Done, send the next one now', `${name} arrives in a few minutes`)}
            ${btn('{snooze_url}', '', '#D3CBBB', '#2B2A26', '#6B665C', 'Not this week', 'We&rsquo;ll send this same step again in 7 days')}
          </table>
          <p class="muted" style="margin:4px 0 6px; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:19px; color:#6B665C;"><strong class="ink" style="color:#2B2A26;">Not sure?</strong> Do nothing, and the next step comes in a week as usual.</p>
          <p class="muted" style="margin:0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:19px; color:#6B665C;">Clicking only tells us which email to send next, never what&rsquo;s in your plan.</p>`;
  });
  return { out, n };
}

if (typeof module !== 'undefined') module.exports = { transform };
if (typeof require !== 'undefined' && require.main === module) {
  const file = process.argv[2] || 'lib/emails.json';
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const hit = [], miss = [];
  for (const [k, v] of Object.entries(data)) {
    if (!v || typeof v.html !== 'string') continue;
    const { out, n } = transform(v.html);
    if (n) { v.html = out; hit.push(`${k}(${n})`); }
    else if (v.html.includes('{done_url}')) miss.push(k);
  }
  fs.writeFileSync(file, JSON.stringify(data));
  JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log('changed:', hit.join(' ') || 'none');
  console.log('has {done_url} but NOT changed (check by hand):', miss.join(' ') || 'none');
}
