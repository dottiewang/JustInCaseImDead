// Builds one static page per guide: site/guides/<slug>/index.html, plus site/guides/index.html.
// Reads site/lib/guides.json and site/lib/newsletters.json. No dependencies.
// Run from the repo root:  node site/scripts/build-guides.js
const fs = require('fs');
const path = require('path');

const AS_OF = 'October 2026'; // update when guides are re-verified
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'guides');
const SITE = 'https://www.justincaseimdead.com';

const slug = t => t.toLowerCase().replace(/&/g, 'and').replace(/[’'"“”]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const block = {
  p: b => `<p>${b.p}</p>`,
  h: b => `<h2>${b.h}</h2>`,
  list: b => `<ul>${b.list.map(x => `<li>${x}</li>`).join('')}</ul>`,
  steps: b => `<ol>${b.steps.map(x => `<li>${x}</li>`).join('')}</ol>`,
  timeline: b => `<dl class="timeline">${b.timeline.map(x => Array.isArray(x) ? `<dt>${x[0]}</dt><dd>${x[1]}</dd>` : `<dt>${x.when || x.t || ''}</dt><dd>${x.what || x.d || ''}</dd>`).join('')}</dl>`,
  table: b => `<div class="tbl"><table><thead><tr>${b.table[0].map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${b.table.slice(1).map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`,
  tip: b => `<div class="tip"><strong>Good to know</strong><p>${b.tip}</p></div>`,
  current: b => `<div class="current"><strong>Current rules and figures in this guide:</strong><ul>${b.current.map(x => `<li>${x.label}: <b>${x.fig}</b></li>`).join('')}<li class="muted">Last verified: ${b.verified}</li></ul></div>`,
};
const renderBlock = b => { const k = Object.keys(b).find(k => block[k]); return k ? block[k](b) : ''; };

const DISCLAIMER = `
<footer class="legal">
  <p><strong>A quick note before you act on this</strong></p>
  <p>This guide is general information to help you get organized. It isn’t legal, financial, tax or medical advice, and reading it doesn’t make us your lawyer, accountant or advisor.</p>
  <p>Laws and rules vary by state and change over time, and every family’s situation is different. We try to keep this accurate and up to date, but we can’t guarantee this information is current, complete or error-free. Costs and timelines mentioned here are typical ranges, not quotes. Before you sign documents, move money, or make legal, financial, tax or medical decisions, check with a qualified professional where you live, or with the bank, insurer or agency involved.</p>
  <p>Just In Case doesn’t create, file or store legal documents for you, and doesn’t review or verify documents you create. To the fullest extent permitted by law, Just In Case is not responsible or liable for any loss, damage or consequence resulting from your use of, or reliance on, this content.</p>
  <p>If something here looks out of date, let us know at <a href="mailto:hello@justincaseimdead.com">hello@justincaseimdead.com</a>.</p>
</footer>`;

const CSS = `
body{margin:0;background:#F1ECE2;color:#2B2A26;font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}
a{color:#2F4A3A} a:hover{color:#A0703F}
.top{max-width:720px;margin:0 auto;padding:24px 24px 0;display:flex;align-items:center;justify-content:space-between;gap:16px;font-size:14px}
.top img{width:72px;height:auto;display:block}
article{max-width:720px;margin:24px auto 64px;background:#FBF8F2;border:1px solid #E2DBCD;border-radius:8px;padding:40px 44px;box-sizing:border-box}
@media (max-width:600px){article{margin:16px 12px 48px;padding:28px 22px}}
.kicker{margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#A0703F}
h1{margin:0 0 8px;font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:32px;line-height:40px;text-wrap:pretty}
.pre{margin:0 0 28px;font-size:17px;line-height:26px;color:#6B665C}
.asof{margin:-16px 0 28px;font-size:13px;line-height:20px;font-style:italic;color:#6B665C}
h2{margin:28px 0 10px;font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:21px;line-height:28px}
p{margin:0 0 16px;font-size:16px;line-height:25px;text-wrap:pretty}
ul,ol{margin:0 0 16px;padding-left:22px;font-size:16px;line-height:24px}
li{margin:0 0 6px}
.tbl{overflow-x:auto;margin:0 0 16px}
table{width:100%;border-collapse:collapse;font-size:14px;line-height:20px}
th,td{padding:9px 10px;border-bottom:1px solid #E2DBCD;vertical-align:top;text-align:left}
th{background:#F1ECE2;font-weight:700}
.timeline{display:grid;grid-template-columns:minmax(90px,max-content) 1fr;gap:8px 16px;margin:0 0 16px;font-size:15px;line-height:22px}
.timeline dt{font-weight:700;color:#2F4A3A}.timeline dd{margin:0}
.tip{margin:20px 0 16px;padding:16px 18px;background:#F1ECE2;border-radius:6px}
.tip strong{display:block;margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#A0703F}
.tip p{margin:0;font-size:15px;line-height:23px}
.current{margin:28px 0 0;padding:18px 20px;border:1px solid #E2DBCD;border-radius:6px;background:#fff;font-size:14px;line-height:21px}
.current ul{margin:8px 0 0;padding-left:20px;font-size:14px;line-height:21px}
.muted{color:#6B665C}
.legal{margin:28px 0 0;padding-top:16px;border-top:1px solid #E2DBCD;color:#6B665C}
.legal p{font-size:13px;line-height:20px;margin:0 0 8px}
.legal strong{color:#2B2A26}
.list{list-style:none;padding:0;margin:0}
.list li{padding:12px 0;border-bottom:1px solid #E2DBCD;margin:0}
.list small{display:block;color:#6B665C;margin-top:2px}`;

const page = (title, desc, url, inner) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${attr(title)} · Just In Case</title>
<meta name="description" content="${attr(desc)}">
<link rel="canonical" href="${url}">
<style>${CSS}</style>
</head>
<body>
<div class="top"><a href="/"><img src="${SITE}/logo.jpg" alt="Just In Case"></a><a href="/guides/">All guides</a></div>
${inner}
</body>
</html>
`;

function render(guides, newsletters) {
  const all = [...guides, ...newsletters];
  const seen = new Set();
  const files = {};
  all.forEach(g => {
    const s = slug(g.t);
    if (seen.has(s)) return; // a guide and an issue with the same title share one page
    seen.add(s);
    const asof = g.asOf ? `<p class="asof">Current as of ${AS_OF}. Laws and figures can change — see full disclaimer.</p>` : '';
    const inner = `<article>
<p class="kicker">${g.s || 'Guide'}</p>
<h1>${g.t}</h1>
${g.pre ? `<p class="pre">${g.pre}</p>` : ''}
${asof}
${g.b.map(renderBlock).join('\n')}
${DISCLAIMER}
</article>`;
    files[`${s}/index.html`] = page(g.t, g.pre || g.t, `${SITE}/guides/${s}`, inner);
  });
  const items = all.filter((g, i) => all.findIndex(x => slug(x.t) === slug(g.t)) === i)
    .sort((a, b) => (a.s || '').localeCompare(b.s || '') || a.t.localeCompare(b.t))
    .map(g => `<li><a href="/guides/${slug(g.t)}">${g.t}</a>${g.pre ? `<small>${g.pre}</small>` : ''}</li>`).join('\n');
  files['index.html'] = page('Guides', 'Plain-English guides for getting your affairs in order.', `${SITE}/guides/`,
    `<article><p class="kicker">Just In Case</p><h1>Guides</h1><p class="pre">Plain-English guides that go with your templates.</p><ul class="list">${items}</ul></article>`);
  return files;
}

if (require.main === module) {
  const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', f), 'utf8'));
  const files = render(read('guides.json'), read('newsletters.json'));
  for (const [rel, html] of Object.entries(files)) {
    const p = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, html);
  }
  console.log(`Wrote ${Object.keys(files).length} files to ${path.relative(process.cwd(), OUT)}/`);
}

module.exports = { render, slug };