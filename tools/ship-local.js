// one call per build: node tools/ship-local.js NN "Build NN: what changed" [scene] [--zip]
// Bumps BUILD in src/draw.js, builds (tools/build.js), checks nothing top-level is unused (tools/dead.js), runs every
// test and the overlap check, stopping at the first failure. On success prints the commit line and every play-test
// link (tools/links.js --local). No commit: Ross reviews the diff and pushes. HISTORY (and HANDOFF at a handoff) are
// written by hand before this.
// --zip (the chat's Linux container only; needs the zip command): after every check passes, also packages
// /mnt/user-data/outputs/quest-bNN.zip (older quest-b*.zip removed) and prints the zip form of the commit line.
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const argv = process.argv.slice(2), zip = argv.includes('--zip');
const [n, msg, scene = 'rise'] = argv.filter(a => a !== '--zip');
if (!/^\d+$/.test(n || '') || !msg) {
  console.log('usage: node tools/ship-local.js NN "Build NN: message" [scene] [--zip]\n' +
    '  --zip: chat container only (Linux, needs the zip command): packages /mnt/user-data/outputs/quest-bNN.zip');
  process.exit(1);
}
const root = path.join(__dirname, '..'), drawJs = path.join(root, 'src', 'draw.js');
const run = (file, ...args) => spawnSync(process.execPath, [path.join(root, file), ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 26 });
const stop = why => { console.log(why); process.exit(1); };
if (zip && spawnSync('zip', ['-v']).error) stop('--zip needs the zip command (the chat container, Linux); run without --zip here');

const src = fs.readFileSync(drawJs, 'utf8'), bumped = src.replace(/const BUILD = 'build \d+'/, `const BUILD = 'build ${n}'`);
if (!bumped.includes(`const BUILD = 'build ${n}'`)) stop('BUILD not set');
fs.writeFileSync(drawJs, bumped);

let r = run('tools/build.js'); process.stdout.write(r.stdout + r.stderr);
if (r.status) stop('BUILD FAILED');
r = run('tools/dead.js');
if (r.status) stop(r.stdout + r.stderr + 'UNUSED NAMES: delete them or mark keep: with a reason');
r = run('tests/run.js');
const lines = (r.stdout + r.stderr).trim().split('\n');
if (r.status) stop(lines.filter(l => !l.startsWith(' ok ')).join('\n') + '\nTESTS FAILED');
console.log(lines[lines.length - 1]);
r = run('tools/overlap.js');
const ov = (r.stdout || '').trim().split('\n').pop(); console.log(ov);
if (r.status || !/overlaps 0$/.test(ov)) stop((r.stderr || '') + 'OVERLAPS');
if (!zip) { process.stdout.write(run('tools/links.js', n, msg, scene, '--local').stdout); process.exit(0); }
const out = '/mnt/user-data/outputs', file = `${out}/quest-b${n}.zip`;
fs.mkdirSync(out, { recursive: true });
for (const f of fs.readdirSync(out)) if (/^quest-b\d+\.zip$/.test(f)) fs.unlinkSync(path.join(out, f));
const PACK = ['index.html', 'src', 'tests', 'tools', 'docs', 'HANDOFF.md', 'QUEST_WAYS_OF_WORKING.md',
  'PROJECT_INSTRUCTIONS.md', 'CLAUDE.md', 'build.sh', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
r = spawnSync('zip', ['-qr', file, ...PACK, '-x', '*node_modules*'], { cwd: root, encoding: 'utf8' });
if (r.status) stop(r.stdout + r.stderr + 'ZIP FAILED');
console.log(`packaged ${file} (${(fs.statSync(file).size / 1024).toFixed(0)} KB)`);
process.stdout.write(run('tools/links.js', n, msg, scene).stdout);
