const fs=require('fs');
const oT='Accounts that pay out directly</p>',nT='Bank &amp; investment accounts</p>';
const oD='Any account with a named beneficiary (called POD). Your bank app or statement will say.',nD='List each one and whether it names a beneficiary (POD or TOD). Not set up yet? Write Not yet and add one later.';
const ef='lib/emails.json',e=JSON.parse(fs.readFileSync(ef,'utf8'));
if(!e.W2.html.includes(nT)){for(const s of [oT,oD]) if(e.W2.html.split(s).length!==2) throw new Error('W2 miss: '+s);
 e.W2.html=e.W2.html.replace(oT,()=>nT).replace(oD,()=>nD);fs.writeFileSync(ef,JSON.stringify(e));}
const gf='lib/template-guides.json',g=fs.existsSync(gf)?JSON.parse(fs.readFileSync(gf,'utf8')):null;
if(!g) console.log('template-guides.json not in repo: skipped');
else if(!g['2'].some(x=>x[1]==='Transfer-on-death (TOD) for investment accounts')){
 const i=g['2'].findIndex(x=>x[0].startsWith('What\u2019s a POD'));if(i<0)throw new Error('POD row miss');
 g['2'][i][0]='What\u2019s a POD beneficiary?';
 g['2'].splice(i+1,0,['How to add a POD beneficiary to a bank account','How to add a POD beneficiary to a bank account'],['How to name a TOD beneficiary on an investment account','Transfer-on-death (TOD) for investment accounts']);
 fs.writeFileSync(gf,'{\n'+Object.entries(g).map(([k,v])=>' '+JSON.stringify(k)+': '+JSON.stringify(v)).join(',\n')+'\n}\n');}
const nf='lib/newsletters.json',n=JSON.parse(fs.readFileSync(nf,'utf8'));
const a={
 "s": "Skip probate",
 "t": "Transfer-on-death (TOD) for investment accounts",
 "pre": "The investment version of POD. Usually free, usually online.",
 "b": [
  {
   "p": "Transfer-on-death (TOD) works like payable-on-death, but for investment accounts. You name who gets the account when you die, and it passes to them directly, without probate. Until then it stays fully yours: you can sell, move money or change the beneficiary at any time."
  },
  {
   "h": "Which accounts it covers"
  },
  {
   "list": [
    "Brokerage accounts in your own name, and many joint accounts",
    "Stocks, bonds and mutual funds held at a brokerage",
    "Shares held directly with a company, through its transfer agent, which has its own form"
   ]
  },
  {
   "p": "Retirement accounts like IRAs and 401(k)s don't use TOD. They have their own beneficiary form."
  },
  {
   "h": "How people usually add one"
  },
  {
   "steps": [
    "Log in to the brokerage's website or app and look for “beneficiaries” or “transfer on death”, often under account settings.",
    "Can't find it? Many brokerages have a TOD form to download, or will send one if you call.",
    "Add each person's full legal name. Many also ask for a date of birth, address or Social Security number.",
    "Naming more than one person? Choose how to split it, for example 50/50. Many brokerages also let you name a backup (contingent) beneficiary.",
    "Save or sign, and check that the account now shows the beneficiary."
   ]
  },
  {
   "h": "What the family does later"
  },
  {
   "p": "The beneficiary usually contacts the brokerage with a certified death certificate, their own ID and the brokerage's claim form. The investments are then moved into an account in their name."
  },
  {
   "h": "Good to know"
  },
  {
   "list": [
    "A TOD beneficiary generally takes priority over what a will says.",
    "Naming a child under 18 can be complicated. Many brokerages let you name an adult as custodian for them instead.",
    "Every state now has a TOD law for investment accounts. Louisiana's courts have treated these forms differently, so people there often check with a local attorney. Each brokerage also has its own form and rules."
   ]
  },
  {
   "tip": "Write down which accounts have a TOD beneficiary, and who it is, so your family knows to ask."
  }
 ],
 "n": 104,
 "nlBatch": 6
};
if(!n.some(x=>x.t===a.t)){n.push(a);fs.writeFileSync(nf,JSON.stringify(n,null,2)+'\n');}
const O='1ezGm_duBSfinj9Ev8J9ZRZLdweGJvaPS_toOKTZjGBM',N='1KRL87U4vRm1nDjLYuz1YrZa1UGB5fLB7B_0tn9b9fVU';
let raw=fs.readFileSync(ef,'utf8');const c=raw.split(O).length-1;if(c){fs.writeFileSync(ef,raw.split(O).join(N));}
console.log('T2 ID swapped:',c,'(should be 4 first run, 0 if already done)');
console.log('ok');
