const fs=require('fs');const ef='lib/emails.json';const e=JSON.parse(fs.readFileSync(ef,'utf8'));let h=e.W2.html;
const o3="List each one and whether it names a beneficiary (POD or TOD). Not set up yet? Write Not yet and add one later.";
const n3="List each account and who gets it when you die, if you&rsquo;ve named someone. Banks call this POD; investment accounts call it TOD. Either way, that person can skip probate. Haven&rsquo;t named anyone? Write &ldquo;Not yet&rdquo; in the POD / TOD column.";
const add="\n            <p class=\"muted\" style=\"margin:8px 0 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:22px; color:#6B665C;\">Before Template 3 arrives next week, try adding a POD to one of those accounts. It can take minutes, and your family won&rsquo;t wait months for that money. Many banks let you do it online; others need a short form or a branch visit. <a href=\"https://www.justincaseimdead.com/guides/how-to-add-a-pod-beneficiary-to-a-bank-account\" style=\"color:#2F4A3A;text-decoration:underline\">How to add a POD beneficiary</a></p>";
if(h.includes(n3))console.log('item 2 already new');
else{if(h.split(o3).length!==2)throw new Error('W2 item 2 old text not found once');h=h.replace(o3,()=>n3);console.log('item 2 updated');}
if(h.includes("Before Template 3 arrives next week"))console.log('POD line already there');
else{const a=n3+'</p>';if(h.split(a).length!==2)throw new Error('anchor');h=h.replace(a,()=>a+add);console.log('POD line added');}
e.W2.html=h;fs.writeFileSync(ef,JSON.stringify(e));JSON.parse(fs.readFileSync(ef,'utf8'));console.log('ok');
