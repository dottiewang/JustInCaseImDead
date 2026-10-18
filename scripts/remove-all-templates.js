const fs=require("fs");
const fix=s => {
  let c = { skip: 0, r: 0 };
  s = s.replace(/\s*<p[^>]*>(?:(?!<\/p>)[\s\S])*?Already filled in all 9 templates\?(?:(?!<\/p>)[\s\S])*?<\/p>/g, () => { c.skip++; return ''; });
  s = s.replace(/\s*<p[^>]*>Rather see everything at once\? All 9 templates are listed below\.<\/p>/g, () => { c.r++; return ''; });
  // remove <tr> containing id="all-templates"
  let i;
  while ((i = s.indexOf('id="all-templates"')) > -1) {
    const start = s.lastIndexOf('<tr', i);
    let depth = 0, p = start, end = -1;
    const re = /<tr\b|<\/tr>/g; re.lastIndex = start; let m;
    while (m = re.exec(s)) { if (m[0] === '</tr>') { depth--; if (depth === 0) { end = m.index + 5; break; } } else depth++; }
    const ws = s.slice(0, start).match(/\s*$/)[0].length;
    s = s.slice(0, start - ws) + s.slice(end); c.list = (c.list || 0) + 1;
  }
  return [s, c];
};
const f="lib/emails.json";const j=JSON.parse(fs.readFileSync(f,"utf8"));let t={skip:0,r:0,list:0};for(const k in j){const [h,c]=fix(j[k].html);j[k].html=h;for(const x in c)t[x]+=c[x];}fs.writeFileSync(f,JSON.stringify(j));console.log(t);
