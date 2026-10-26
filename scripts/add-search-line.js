// Adds a grey line under every Drive-search button in lib/emails.json. Idempotent.
const fs = require('fs'); const path = require('path');
const file = path.join(__dirname, '..', 'lib', 'emails.json');
const LINE = "<p class=\"muted\" style=\"margin:10px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:19px; color:#6B665C;\">Opens a Google Drive search for your Just In Case templates.</p>";
function fix(h){
  let n=0; const re = /<a href="https:\/\/drive\.google\.com\/drive\/search\?q=Just%20In%20Case" style="display:block;/g;
  let out='', last=0, m;
  while((m=re.exec(h))){
    const end = h.indexOf('</td></tr></table>', m.index); if(end<0) continue;
    const at = end + '</td></tr></table>'.length;
    if (h.slice(at, at+400).includes('Opens a Google Drive search')) continue;
    out += h.slice(last, at) + '\n        ' + LINE; last = at; n++; re.lastIndex = at;
  }
  return [out + h.slice(last), n];
}
const e = JSON.parse(fs.readFileSync(file, 'utf8')); let total = 0;
for (const k of Object.keys(e)) { const [h, n] = fix(e[k].html); if (n) { e[k].html = h; total += n; console.log(k, n); } }
fs.writeFileSync(file, JSON.stringify(e)); console.log('added', total);
