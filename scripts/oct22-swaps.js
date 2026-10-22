const fs=require('fs');
const ef='lib/emails.json';let raw=fs.readFileSync(ef,'utf8');
const swaps=[["T2","1KRL87U4vRm1nDjLYuz1YrZa1UGB5fLB7B_0tn9b9fVU","1Yv3SXkTQ5AwokRpgeSFUlfuRovx4M9vEf8i0oUAJzOU"],["T4","1egK6zIToxwNch_MHRtN-0Co7Ne5ino90tUGdNmJ7DKg","1wApsd-2zyYiQ-aCDhcNAZV5XTp7xMKHvyj9qp1qdumQ"],["T5","1QgI7j9c_QjFtxDNNTplMQJlnWve_G4oEDo5YzEEvej4","1xa8ySDsHQftiYj9eQHEDDKF-mulD_YFrc-QfsMkvet0"],["T9","1gubY_UGHsHfzNjM8Rr1qiwwfW0z0AGajyYS4EYafqYI","1crBOzoUDo2cvi8f7zx4wbSEjQJUOfUvVdvXVvujxTdc"]];
for(const [t,o,n] of swaps){const c=raw.split(o).length-1;raw=raw.split(o).join(n);console.log(t,'swapped',c,'| new ID now',raw.split(n).length-1);}
const e=JSON.parse(raw);
const key="<p class=\"muted\" style=\"margin:16px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:21px; mso-line-height-rule:exactly; color:#6B665C;\"><strong>Your copy is yours.</strong>";
const add="\n        <p class=\"muted\" style=\"margin:12px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:21px; mso-line-height-rule:exactly; color:#6B665C;\"><strong>Don&rsquo;t know something yet?</strong> Write <strong>Not yet</strong>, or <strong>None</strong> if it doesn&rsquo;t apply. You don&rsquo;t need to remember where you left them: at your checkpoint, we&rsquo;ll show you how to find every one in seconds.</p>";
let h=e.W1.html;
if(h.includes('Don&rsquo;t know something yet?')) console.log('W1 line already there');
else{const i=h.indexOf(key);if(i<0||h.indexOf(key,i+1)>=0)throw new Error('W1 anchor not found once');const j=h.indexOf('</p>',i)+4;e.W1.html=h.slice(0,j)+add+h.slice(j);console.log('W1 line added');}
fs.writeFileSync(ef,JSON.stringify(e));JSON.parse(fs.readFileSync(ef,'utf8'));console.log('ok');
