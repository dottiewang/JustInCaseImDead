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
.list small{display:block;color:#6B665C;margin-top:2px}
.ask{margin:0 0 32px}
.ask h1{margin-bottom:16px}
.row{display:flex;gap:8px;flex-wrap:wrap}
.row input{flex:1 1 260px;min-width:0;font:inherit;font-size:17px;padding:14px 16px;border:1px solid #CFC6B4;border-radius:6px;background:#fff;color:#2B2A26}
.row input:focus{outline:none;border-color:#2F4A3A;box-shadow:0 0 0 3px rgba(47,74,58,.15)}
.row button{font:inherit;font-size:15px;font-weight:700;padding:14px 20px;border:0;border-radius:6px;background:#2F4A3A;color:#FBF8F2;cursor:pointer}
.chips{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:14px 0 0;font-size:13px}
.chips button{font:inherit;font-size:13px;padding:6px 12px;border:1px solid #E2DBCD;border-radius:999px;background:#fff;color:#2B2A26;cursor:pointer}
.chips button:hover{border-color:#2F4A3A;color:#2F4A3A}
#res{margin-top:14px}
.hit{display:flex;flex-direction:column;gap:4px;padding:14px 4px;border-bottom:1px solid #E2DBCD;text-decoration:none;color:#2B2A26}
.hit:first-child{border-top:1px solid #E2DBCD}
.hit:hover{background:#F6F1E7}
.hit .kicker{margin:0;font-size:11px}
.hit strong{font-family:Georgia,"Times New Roman",serif;font-weight:400;font-size:19px;line-height:26px;color:#2F4A3A}
.hit .muted{font-size:14px;line-height:21px}
.small{font-size:13px;margin:14px 0 0}`;

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
    `<article><section id="ask" class="ask">
<p class="kicker">Just Ask</p>
<h1>What do you need to find?</h1>
<div class="row"><input id="q" type="search" placeholder="Try “death certificates” or “close a bank account”" aria-label="Just Ask" autocomplete="off"><button id="clr" type="button">Clear</button></div>
<div id="chips" class="chips"><span class="muted">People often ask:</span><button type="button" data-q="death certificates">death certificates</button><button type="button" data-q="close a bank account">close a bank account</button><button type="button" data-q="phone passcode">phone passcode</button><button type="button" data-q="do I need a will">do I need a will</button></div>
<div id="res"></div>
<p class="muted small">Searches the guides on this site. Nothing you type is saved.</p>
</section><p class="kicker">All guides</p><h2>Browse everything</h2><ul class="list">${items}</ul></article><script>
(function(){
  var docs=[],box=document.getElementById('q'),out=document.getElementById('res'),chips=document.getElementById('chips');
  function norm(s){return ' '+s.toLowerCase().replace(/[\\u2019']/g,'').replace(/[^a-z0-9$%]+/g,' ')+' ';}
  function stem(w){return w.length>4?w.replace(/(ing|ies|es|s|ed)$/,'').replace(/e$/,''):w;}
  var SYN={pwd:'password',pass:'password','2fa':'two factor',poa:'power of attorney',pod:'payable on death',ssn:'social security',taxes:'tax',died:'death loss',dies:'death',dead:'death loss',passed:'death loss',lost:'loss',cancel:'close',shut:'close',iphone:'phone apple',gmail:'google email',dog:'pets',cat:'pets',house:'home mortgage'};
  var STOP={};'a an the to of do i my is how what for in on and or if me can who where when with it your you be are does should about get'.split(' ').forEach(function(w){STOP[w]=1;});
  function esc(s){return s.replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function rx(w){return new RegExp(' '+w.replace(/[.*+?^\${}()|[\\]\\\\]/g,'\\\\$&'),'g');}
  function search(q){
    var words=[];norm(q).trim().split(' ').forEach(function(w){if(!w||STOP[w])return;(SYN[w]?SYN[w].split(' '):[w]).forEach(function(x){words.push(stem(x));});});
    if(!words.length)return[];
    return docs.map(function(d){var score=0,hits=0,inT=0;words.forEach(function(w){var re=rx(w);var t=(d.tl.match(re)||[]).length,p=(d.pl.match(re)||[]).length,b=(d.bl.match(re)||[]).length;if(t+p+b)hits++;if(t)inT++;score+=t*10+p*4+Math.min(b,6);});score+=(inT/words.length)*30+(inT===words.length?20:0);return{d:d,score:score*hits/words.length,w:words};})
      .filter(function(r){return r.score>1;}).sort(function(a,b){return b.score-a.score;}).slice(0,5);
  }
  function render(){
    var q=box.value.trim();chips.style.display=q.length>1?'none':'';
    if(q.length<2){out.innerHTML='';return;}
    var r=search(q);
    if(!r.length){out.innerHTML='<div class="tip"><strong>Nothing yet</strong><p>We don\\u2019t have a guide for that yet. Email <a href="mailto:hello@justincaseimdead.com">hello@justincaseimdead.com</a> and we\\u2019ll point you in the right direction, and maybe write one.</p></div>';return;}
    out.innerHTML=r.map(function(x){var d=x.d,sn=d.body.split(/(?<=[.!?])\\s+/).find(function(s){return x.w.some(function(w){return norm(s).indexOf(' '+w)>-1;});})||d.pre;if(sn.length>160)sn=sn.slice(0,157).replace(/\\s\\S*$/,'')+'\\u2026';
      return '<a class="hit" href="/guides/'+d.slug+'"><span class="kicker">'+esc(d.s)+'</span><strong>'+esc(d.t)+'</strong><span class="muted">'+esc(sn)+'</span></a>';}).join('');
  }
  fetch('/guides/search.json').then(function(r){return r.json();}).then(function(j){docs=j.map(function(d){d.tl=norm(d.t);d.pl=norm(d.pre);d.bl=norm(d.body);return d;});render();});
  box.addEventListener('input',render);
  document.getElementById('clr').addEventListener('click',function(){box.value='';render();box.focus();});
  chips.addEventListener('click',function(e){if(e.target.dataset.q){box.value=e.target.dataset.q;render();}});
  var p=new URLSearchParams(location.search).get('q');if(p){box.value=p;}
})();</script>`);
  const strip = s => String(s).replace(/<[^>]+>/g, '');
  files['search.json'] = JSON.stringify(all.filter((g, i) => all.findIndex(x => slug(x.t) === slug(g.t)) === i).map(g => ({ t: g.t, s: g.s || 'Guide', pre: strip(g.pre || ''), slug: slug(g.t), body: strip(g.b.flatMap(b => [b.p, b.h, b.tip, ...(b.list || []), ...(b.steps || []), ...((b.table || []).flat()), ...((b.timeline || []).flat())]).filter(Boolean).join(' ')) })));
  return files;
}

if (require.main === module) {
  const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', f), 'utf8'));
  const live = x => !x.draft; // draft = written but not yet approved
  const files = render(read('guides.json').filter(live), read('newsletters.json').filter(live));
  for (const [rel, html] of Object.entries(files)) {
    const p = path.join(OUT, rel);
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, html);
  }
  console.log(`Wrote ${Object.keys(files).length} files to ${path.relative(process.cwd(), OUT)}/`);
}

module.exports = { render, slug };
