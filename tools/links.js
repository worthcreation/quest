// prints the PowerShell ship line and every play-test link for a build: node tools/links.js NN "message" [scene]
// The one list of links (HANDOFF points here); the seed is a fresh 7-digit prime each run.
const [n, msg = `Build ${n}`, scene = 'rise'] = process.argv.slice(2);
if (!n) { console.log('usage: node tools/links.js NN "message" [scene]'); process.exit(1); }
const isPrime = k => { for (let i = 2; i * i <= k; i++) if (k % i === 0) return false; return k > 1; };
let seed = 1000000 + Math.floor(Math.random() * 8999999); while (!isPrime(seed)) seed++;
const base = 'https://worthcreation.github.io/quest/', zip = `quest-b${n}.zip`;
console.log('```powershell');
console.log(`cd ~\\quest -ErrorAction Stop; Expand-Archive -Force ~\\Downloads\\${zip} .; Remove-Item ~\\Downloads\\${zip}; git add -A; git commit -m "${msg.replace(/"/g, "'")}"; git push`);
console.log('```\n');
for (const q of [`?seed=${seed}`, '?arena', '?puzzle', '?mountain', `?scene=${scene}`, `?overview=${seed}`, '?model']) console.log(`- ${base}${q}`);
