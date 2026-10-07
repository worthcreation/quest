// prints the PowerShell ship line and every play-test link for a build: node tools/links.js NN "message" [scene] [--local]
// --local (tools/ship-local.js): the commit line for a clone on this PC, with no zip to unpack first.
// The one list of links (HANDOFF points here); the seed is a fresh 7-digit prime each run.
const args = process.argv.slice(2), local = args.includes('--local');
const [n, msg = `Build ${n}`, scene = 'rise'] = args.filter(a => a !== '--local');
if (!n) { console.log('usage: node tools/links.js NN "message" [scene] [--local]'); process.exit(1); }
const isPrime = k => { for (let i = 2; i * i <= k; i++) if (k % i === 0) return false; return k > 1; };
let seed = 1000000 + Math.floor(Math.random() * 8999999); while (!isPrime(seed)) seed++;
const base = 'https://worthcreation.github.io/quest/', zip = `quest-b${n}.zip`;
console.log('```powershell');
const unzip = local ? '' : `Expand-Archive -Force ~\\Downloads\\${zip} .; Remove-Item ~\\Downloads\\${zip}; `;
console.log(`cd ~\\quest -ErrorAction Stop; git fetch origin; git reset --hard origin/main; ${unzip}git add -A; git commit -m "${msg.replace(/"/g, "'")}"; git push`);   // (fetch and reset first: both machines push, 234)
console.log('```\n');
if (!local) { console.log('```zsh'); console.log(`cd ~/quest && git fetch origin && git reset --hard origin/main && unzip -o ~/Downloads/${zip} -d . && rm ~/Downloads/${zip} && git add -A && git commit -m "${msg.replace(/"/g, "'")}" && git push`); console.log('```\n'); }   // (the Mac's line, the same)
for (const q of [`?seed=${seed}`, '?arena', '?puzzle', '?mountain', `?scene=${scene}`, '?edit=mt2', '?edit=flat', '?scene=epic', '?edit=epic', `?overview=${seed}`, '?model']) console.log(`- ${base}${q}`);
