const f = 'lib/emails.json', fs = require('fs'), e = JSON.parse(fs.readFileSync(f, 'utf8'));
const A = '<a href="{unsubscribe_url}" style="color:#6B665C; text-decoration:underline;">Manage email preferences</a>';
const L = '<a href="https://billing.stripe.com/p/login/bJecMYaaJ1MXgF7c2p9fW00" style="color:#6B665C; text-decoration:underline;">Cancel or manage subscription</a> &nbsp;&middot;&nbsp; ';
let n = 0;
for (const k of Object.keys(e)) {
  if (e[k].html.includes('https://billing.stripe.com/p/login/bJecMYaaJ1MXgF7c2p9fW00')) continue;
  if (!e[k].html.includes(A)) throw new Error('anchor missing in ' + k);
  e[k].html = e[k].html.replace(A, L + A);
  n++;
}
fs.writeFileSync(f, JSON.stringify(e));
console.log('updated', n, 'emails');
