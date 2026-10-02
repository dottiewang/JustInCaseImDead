// Builds a monthly newsletter email from site/lib/newsletters.json. Works in Node (require) and the browser (window.NL).
(function () {
  var SITE = 'https://www.justincaseimdead.com';
  var START = { y: 2026, m: 10 }; // Issue 1 = November 2026 (month is 0-based)
  var G = "Georgia, 'Times New Roman', serif", A = 'Arial, Helvetica, sans-serif';
  var INK = '#2B2A26', MUTED = '#6B665C', GREEN = '#2F4A3A', BRONZE = '#A0703F', RULE = '#E2DBCD', CARD = '#FBF8F2', BG = '#F1ECE2';

  function slug(t) { return t.toLowerCase().replace(/&/g, 'and').replace(/[’'"“”]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function url(it) { return SITE + '/guides/' + slug(it.t); }
  function issueFor(date) { var d = date || new Date(); return (d.getUTCFullYear() - START.y) * 12 + (d.getUTCMonth() - START.m) + 1; }
  function monthKey(date) { var d = date || new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0'); }

  var P = 'margin:0 0 16px; font-family:' + G + '; font-size:17px; line-height:27px; color:' + INK + ';';
  function tr(inner) { return '<tr><td class="px" style="padding:0 48px;">' + inner + '</td></tr>'; }
  function tbl(rows) { return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">' + rows + '</table>'; }

  var blocks = {
    p: function (b) { return '<p class="ink" style="' + P + '">' + b.p + '</p>'; },
    h: function (b) { return '<p class="ink" style="margin:8px 0 10px; font-family:' + A + '; font-size:13px; line-height:18px; letter-spacing:1.5px; text-transform:uppercase; font-weight:bold; color:' + GREEN + ';">' + b.h + '</p>'; },
    list: function (b) {
      return tbl(b.list.map(function (x, i) {
        return '<tr><td valign="top" width="26" class="rule" style="width:26px; padding:10px 0; border-top:1px solid ' + RULE + '; font-family:' + A + '; font-size:15px; line-height:22px; font-weight:bold; color:' + GREEN + ';">&#10003;</td>' +
          '<td valign="top" class="ink rule" style="padding:10px 0; border-top:1px solid ' + RULE + ';' + (i === b.list.length - 1 ? ' border-bottom:1px solid ' + RULE + ';' : '') + ' font-family:' + A + '; font-size:15px; line-height:22px; color:' + INK + ';">' + x + '</td></tr>';
      }).join(''));
    },
    steps: function (b) {
      return tbl(b.steps.map(function (x, i) {
        return '<tr><td valign="top" width="40" style="width:40px; padding:0 0 14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td width="28" height="28" align="center" bgcolor="' + GREEN + '" style="width:28px; height:28px; border-radius:14px; background-color:' + GREEN + '; font-family:' + A + '; font-size:14px; font-weight:bold; line-height:28px; color:#FBF8F2;">' + (i + 1) + '</td></tr></table></td>' +
          '<td valign="top" class="ink" style="padding:4px 0 14px; font-family:' + A + '; font-size:15px; line-height:22px; color:' + INK + ';">' + x + '</td></tr>';
      }).join(''));
    },
    timeline: function (b) {
      return tbl(b.timeline.map(function (x, i) {
        return '<tr><td valign="top" width="120" class="rule" style="width:120px; padding:12px 12px 12px 0; border-top:1px solid ' + RULE + '; font-family:' + A + '; font-size:13px; line-height:20px; font-weight:bold; color:' + BRONZE + '; text-transform:uppercase; letter-spacing:1px;">' + x[0] + '</td>' +
          '<td valign="top" class="ink rule" style="padding:12px 0; border-top:1px solid ' + RULE + ';' + (i === b.timeline.length - 1 ? ' border-bottom:1px solid ' + RULE + ';' : '') + ' font-family:' + A + '; font-size:15px; line-height:22px; color:' + INK + ';">' + x[1] + '</td></tr>';
      }).join(''));
    },
    table: function (b) {
      var head = '<tr>' + b.table[0].map(function (h) { return '<td bgcolor="' + GREEN + '" style="background-color:' + GREEN + '; padding:10px 12px; font-family:' + A + '; font-size:12px; line-height:16px; font-weight:bold; letter-spacing:1px; text-transform:uppercase; color:#FBF8F2;">' + h + '</td>'; }).join('') + '</tr>';
      var body = b.table.slice(1).map(function (r, i) {
        return '<tr>' + r.map(function (c, j) { return '<td valign="top" class="ink rule" style="padding:10px 12px; border:1px solid ' + RULE + '; border-top:0; font-family:' + A + '; font-size:14px; line-height:20px; color:' + INK + ';' + (j === 0 ? ' font-weight:bold;' : '') + (i % 2 ? ' background-color:#F6F1E7;' : '') + '">' + c + '</td>'; }).join('') + '</tr>';
      }).join('');
      return tbl(head + body);
    },
    tip: function (b) {
      return tbl('<tr><td class="track" style="padding:16px 20px; background-color:' + BG + '; border-radius:6px;"><p style="margin:0 0 4px; font-family:' + A + '; font-size:12px; line-height:16px; letter-spacing:1.5px; text-transform:uppercase; font-weight:bold; color:' + BRONZE + ';">Good to know</p><p class="ink" style="margin:0; font-family:' + A + '; font-size:15px; line-height:22px; color:' + INK + ';">' + b.tip + '</p></td></tr>');
    },
  };

  function build(it) {
    var body = it.b.map(function (b) { var k = Object.keys(b)[0]; return blocks[k] ? blocks[k](b) : ''; }).join('');
    var ask = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:2px solid ' + GREEN + '; border-radius:8px;"><tr><td style="padding:22px 24px;">' +
      '<p class="ink" style="margin:0 0 6px; font-family:' + G + '; font-size:21px; line-height:28px; color:' + INK + ';">Looking for something specific?</p>' +
      '<p class="ink" style="margin:0 0 16px; font-family:' + A + '; font-size:15px; line-height:22px; color:' + INK + ';">Type what you need, like &ldquo;after-loss checklist&rdquo; or &ldquo;close a Chase account&rdquo;, and Just Ask on our website takes you straight to the right guide.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="' + GREEN + '" style="border-radius:6px; background-color:' + GREEN + ';"><a href="' + SITE + '/guides#ask" style="display:inline-block; padding:12px 22px; font-family:' + A + '; font-size:15px; font-weight:bold; color:#FBF8F2; text-decoration:none;">Try Just Ask &rarr;</a></td></tr></table>' +
      '<p class="muted" style="margin:14px 0 0; font-family:' + A + '; font-size:13px; line-height:19px; color:' + MUTED + ';">Go ahead and delete this email. Everything in it is on our website, and Just Ask can find it again in about three seconds.</p>' +
      '</td></tr></table>';
    var html = '<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>' + it.t + '</title>' +
      '<style>body{margin:0;padding:0;} a{color:' + GREEN + ';} @media only screen and (max-width:620px){.wrap{width:100% !important;} .px{padding-left:24px !important; padding-right:24px !important;} .h1{font-size:28px !important; line-height:34px !important;}} @media (prefers-color-scheme: dark){.bg{background-color:#1E1D1A !important;} .card{background-color:#2A2925 !important;} .ink{color:#EDE8DE !important;} .muted{color:#B8B1A3 !important;} .rule{border-color:#45423B !important;} .track{background-color:#33312C !important;}}</style></head>' +
      '<body style="margin:0; padding:0; background-color:' + BG + ';">' +
      '<span style="display:none; font-size:1px; color:' + BG + '; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">' + it.pre + '&#8199;&#847;&#8199;&#847;&#8199;&#847;</span>' +
      '<table role="presentation" class="bg" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:' + BG + ';"><tr><td align="center" style="padding:32px 12px;">' +
      '<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:600px;">' +
      '<tr><td align="center" style="padding:8px 0 24px;"><a href="' + SITE + '/" style="text-decoration:none;"><img src="' + SITE + '/logo.jpg" width="120" alt="Just In Case" style="display:block; width:120px; height:auto; border:0; font-family:' + G + '; font-size:20px; color:' + INK + ';"></a></td></tr>' +
      '<tr><td class="card" style="background-color:' + CARD + '; border:1px solid ' + RULE + '; border-radius:6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
      '<tr><td class="px" style="padding:36px 48px 0;"><p style="margin:0 0 14px; font-family:' + A + '; font-size:12px; line-height:16px; letter-spacing:2px; text-transform:uppercase; font-weight:bold; color:' + GREEN + ';">' + it.s + ' &nbsp;&middot;&nbsp; <span class="muted" style="color:' + MUTED + ';">Monthly guide</span></p>' +
      '<h1 class="h1 ink" style="margin:0 0 20px; font-family:' + G + '; font-size:32px; line-height:39px; font-weight:normal; color:' + INK + ';">' + it.t + '</h1></td></tr>' +
      tr(body) +
      '<tr><td class="px" style="padding:4px 48px 28px;"><p style="margin:0; font-family:' + A + '; font-size:15px; line-height:22px;"><a href="' + url(it) + '" style="color:' + GREEN + '; font-weight:bold; text-decoration:underline;">Read this on the website</a></p></td></tr>' +
      '<tr><td class="px" style="padding:0 48px 40px;">' + ask + '</td></tr>' +
      '</table></td></tr>' +
      '<tr><td class="px" align="center" style="padding:28px 32px 8px;">' +
      '<p class="muted" style="margin:0 0 10px; font-family:' + A + '; font-size:13px; line-height:20px; color:' + MUTED + ';"><a href="' + SITE + '/guides" style="color:' + MUTED + '; text-decoration:underline;">All guides</a> &nbsp;&middot;&nbsp; <a href="' + SITE + '/faq.html" style="color:' + MUTED + '; text-decoration:underline;">FAQ</a> &nbsp;&middot;&nbsp; <a href="' + SITE + '/privacy-policy.html" style="color:' + MUTED + '; text-decoration:underline;">Privacy</a> &nbsp;&middot;&nbsp; <a href="https://forms.gle/W1bNLGjba5kQmG5v8" style="color:' + MUTED + '; text-decoration:underline;">Share feedback</a></p>' +
      '<p class="muted" style="margin:0 0 10px; font-family:' + A + '; font-size:12px; line-height:18px; color:' + MUTED + ';">General information only, not legal, financial, tax or medical advice. <a href="' + SITE + '/disclaimer.html" style="color:' + MUTED + '; text-decoration:underline;">See full disclaimer</a>. You&rsquo;re getting this monthly guide because you signed up for Just In Case.</p>' +
      '<p class="muted" style="margin:0; font-family:' + A + '; font-size:12px; line-height:18px; color:' + MUTED + ';"><a href="{newsletter_optout_url}" style="color:' + MUTED + '; text-decoration:underline;">Stop monthly guides</a> &nbsp;&middot;&nbsp; <a href="https://billing.stripe.com/p/login/bJecMYaaJ1MXgF7c2p9fW00" style="color:' + MUTED + '; text-decoration:underline;">Cancel or manage subscription</a> &nbsp;&middot;&nbsp; <a href="{unsubscribe_url}" style="color:' + MUTED + '; text-decoration:underline;">Manage email preferences</a></p>' +
      '</td></tr></table></td></tr></table></body></html>';
    return { subject: it.subj || it.t, html: html };
  }

  // Returns this month's issue: schedule = lib/schedule.json, items = guides.json + newsletters.json. Null if not written yet.
  function pick(date, items, schedule) {
    var n = issueFor(date), s = null, i;
    for (i = 0; i < schedule.length; i++) if (schedule[i].n === n) { s = schedule[i]; break; }
    if (!s) return null;
    for (i = 0; i < items.length; i++) if (slug(items[i].t) === s.slug) return items[i].draft ? null : items[i];
    return null;
  }

  var api = { build: build, pick: pick, slug: slug, url: url, issueFor: issueFor, monthKey: monthKey, START: START };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else window.NL = api;
})();
