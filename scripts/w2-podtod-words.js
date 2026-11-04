const fs=require('fs');const f='lib/emails.json';const e=JSON.parse(fs.readFileSync(f,'utf8'));
const o="Banks call this POD; investment accounts call it TOD.";
const n="Banks call this <a href=\"https://www.justincaseimdead.com/guides/payable-on-death-pod-what-it-means\" style=\"color:#2F4A3A;text-decoration:underline\">payable on death (POD)</a>; investment accounts call it <a href=\"https://www.justincaseimdead.com/guides/transfer-on-death-tod-for-investment-accounts\" style=\"color:#2F4A3A;text-decoration:underline\">transfer on death (TOD)</a>.";
if(e.W2.html.includes(n))console.log('already done');
else{if(e.W2.html.split(o).length!==2)throw new Error('W2 POD/TOD sentence not found once');e.W2.html=e.W2.html.replace(o,()=>n);fs.writeFileSync(f,JSON.stringify(e));console.log('W2 POD/TOD spelled out + linked');}
JSON.parse(fs.readFileSync(f,'utf8'));console.log('json ok');
