// node tools/build.js: builds index.html from src/: head.html, then each file named in src/ORDER (load order matters
// for the few top-level statements; functions are hoisted). Then checks the built script parses (catches a stray //
// swallowing the rest of a line) and exits 1 if not. build.sh just runs this.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'index.html');
const read = f => fs.readFileSync(path.join(src, f), 'utf8');
const html = read('head.html') + read('ORDER').split(/\s+/).filter(Boolean).map(f => read(f + '.js')).join('');
fs.writeFileSync(out, html);
console.log(`built index.html (${(html.match(/\n/g) || []).length} lines)`);
try { new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]); }
catch (e) { console.log('index.html does not parse: ' + e.message); process.exit(1); }
