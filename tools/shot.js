// render single scenes at full size for a visual check
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
let src0 = fs.readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
let src = src0.replace('const TEST_MODE = false;', 'const TEST_MODE = true;');
const noop = () => {}; const game = createCanvas(+process.env.SW||1280, +process.env.SH||800);
const stubEl = () => ({ appendChild: noop, click: noop, addEventListener: noop, remove: noop, style: {}, classList: { toggle: noop, add: noop, remove: noop }, dataset: {} });
global.document = { getElementById: id => id === 'game' ? Object.assign(game, { addEventListener: noop, style: {} }) : stubEl(), querySelectorAll: () => [], querySelector: () => null, createElement: t => t === 'canvas' ? createCanvas(10, 10) : stubEl(), documentElement: { style: {} }, body: { style: {}, appendChild: noop }, addEventListener: noop };
global.window = { innerWidth: 1280, innerHeight: 800, devicePixelRatio: 1, addEventListener: noop, matchMedia: () => ({ matches: false }) };
global.localStorage = { getItem: () => null, setItem: noop };
global.setTimeout = f => f(); global.setInterval = noop; global.requestAnimationFrame = noop; global.performance = { now: () => 0 };
global.location = { search: process.env.Q || '' };
const ids = process.argv.slice(2);
eval(src + `;
W=+process.env.SW||1280; H=+process.env.SH||800; computeUnit(); canvas.width=W; canvas.height=H; lightCv.width=W/2; lightCv.height=H/2;
if (process.env.DUSK) {
  state.started=true; state.inv.story=STORY.adventure; state.dusk=true; enterScene('tentin'); state.pip={x:W*0.58,y:H*0.55,show:true,follow:true,side:-1}; state.hero.x=W*0.4; state.hero.y=H*0.62;
  for (let k=0;k<30;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/dusk-in.png', canvas.toBuffer('image/png'));
  enterScene('w1', 0.06, 0.5); state.cut=null; state.enemies=[]; for (let k=0;k<30;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/dusk-w1.png', canvas.toBuffer('image/png'));
}
if (process.env.QUESTLOG) {
  state.started=true; const inv=state.inv; enterScene('camp'); state.cut=null;
  inv.story=STORY.garden; inv.bag.turnipseed=1; state.playTime=40; updateQuests(true);
  const pl=rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0})); inv.bag.turnipseed=0; inv.story=STORY.tocamp; state.playTime=95; updateQuests(true);
  inv.story=STORY.gather; state.playTime=130; updateQuests(true); Object.assign(rawOf(),{stone:2,stick:1}); state.playTime=200; updateQuests(true);
  state.texts=[]; state.title=null; state.menu={view:'pack',tab:PACK_TABS.indexOf('Quests'),sel:0,focus:'grid',act:0,sys:0,note:'',qsel:0};
  draw(); fs.writeFileSync('/tmp/quests-folded.png', canvas.toBuffer('image/png'));
  state.qlogOpen=true; state.menu.qsel=2; draw(); fs.writeFileSync('/tmp/quests-open.png', canvas.toBuffer('image/png'));
}
if (process.env.SKILL) {
  state.started=true; state.inv.sword=true; state.inv.acorns=12; enterScene('meadow'); state.cut=null; const h=state.hero; h.x=W*0.4; h.y=H*0.55; h.fx=1; h.fy=0; state.equip='acorn';
  const e=makeEnemy('rabbit', h.x+UNIT*4, h.y-UNIT*0.5, -1); e.mode='idle'; e.t=9; e.cool=9; state.enemies.push(e);
  setSkillLevel('acorn',0); skillOf('acorn').n=11; launch('acorn',0.6); for (let k=0;k<14;k++) update(1/60); state.title=null; draw(); fs.writeFileSync('/tmp/skill-up.png', canvas.toBuffer('image/png'));
  console.log('texts', JSON.stringify(state.texts.map(t=>[t.text,t.color])));
}
if (process.env.ITEMS) {
  state.started=true; state.inv.sword=true; enterScene('riverbank'); state.cut=null; state.hero.x=W*0.8; state.hero.y=H*0.85;
  state.items.push({type:'seed',x:W*0.52,y:H*0.62},{type:'acorn',x:W*0.56,y:H*0.62},{type:'carrot',x:W*0.6,y:H*0.62},{type:'fluff',x:W*0.64,y:H*0.62}); state.solids=state.solids.filter(o=>!(o.y>H*0.5&&o.y<H*0.75&&o.x>W*0.45&&o.x<W*0.7));
  let best=null; for (let k=0;k<400;k++){ update(1/60); state.texts=[]; state.title=null; }
  draw(); fs.writeFileSync('/tmp/items.png', canvas.toBuffer('image/png'));
}
if (process.env.SHROOM) {
  state.started=true; state.inv.sword=true; state.inv.acorns=4; state.inv.pepper=40; ['fire','tent','bench'].forEach(p=>rtFor('camp').flags['built_'+p]=true); enterScene('camp'); state.cut=null;
  const f=WORLD.camp.feat.shroom; state.hero.x=f[0]*W-UNIT*1.5; state.hero.y=f[1]*H; state.inv.shrooms={}; for (let k=0;k<90;k++) update(1/60); state.texts=[]; state.title=null;
  draw(); fs.writeFileSync('/tmp/shroom1.png', canvas.toBuffer('image/png')); for (let k=0;k<200;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/shroom2.png', canvas.toBuffer('image/png'));
}
if (process.env.FOREST) {
  state.started=true; state.dusk=true; state.inv.lantern=true; state.inv.story=STORY.adventure; enterScene('start'); state.cut=null; const h=state.hero; const rk=WORLD.start.pullables.find(p=>p.id==='rock'); h.x=rk.fx*W-UNIT*2; h.y=rk.fy*H+UNIT*0.5;
  for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/f-start.png', canvas.toBuffer('image/png'));
  state.inv.pipTaken=true; enterScene('w2'); state.cut=null; const hw=WORLD.w2.feat.hole; h.x=hw[0]*W-UNIT*3; h.y=hw[1]*H; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/f-w2.png', canvas.toBuffer('image/png'));
}
if (process.env.LEAN) {
  state.started=true; state.inv.sword=true; rtFor('camp').flags.built_tent=true; enterScene('camp'); state.cut=null; const h=state.hero; const td=WORLD.camp.feat.tentDoor; h.x=td[0]*W+UNIT*0.3; h.y=td[1]*H+UNIT*0.2;
  for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/lean-out.png', canvas.toBuffer('image/png'));
  enterScene('tentin'); for (let k=0;k<60;k++) update(1/60); console.log('title', state.title && state.title.text); state.texts=[]; state.title=null; const b=WORLD.tentin.feat.book; state.hero.x=b[0]*W; state.hero.y=b[1]*H+UNIT*1.1; for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/lean-in.png', canvas.toBuffer('image/png'));
}
if (process.env.JAG2) { const run=n=>{ for (let k=0;k<n;k++){ update(1/60); console.log('u',k); draw(); console.log('d',k); } }; state.started=true; state.intro=null; state.inv.story=STORY.adventure; enterScene('w1'); console.log('entered'); state.cut=null; state.enemies=[]; run(2); }
if (process.env.JAG3) { state.started=true; state.intro=null; state.inv.story=STORY.adventure; enterScene('w1'); state.cut=null; state.enemies=[]; for (const s of state.solids) { console.error('solid', s.kind, s.bar||'', Math.round(s.x), Math.round(s.y), Math.round(s.r)); drawSolid(s); } console.error('all solids ok'); }
if (process.env.JAG) { drawJagged(200,200,40,12.3,['#7d776c','#8f887b','#6c665c']); console.log('jag ok'); drawRock(100,100,30); console.log('rock ok'); }
if (process.env.PIPCHECK) {                        // every place Pip is drawn, close up
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.pipSaved=true; enterScene('camp'); state.cut=null; state.enemies=[]; run(3); state.texts=[]; state.title=null;
  const n=WORLD.camp.npcs.find(q=>q.kind==='pip'); state.hero.x=n.fx*W-UNIT*2; state.hero.y=n.fy*H; state.pip={x:state.hero.x-UNIT*1.2,y:state.hero.y,show:true,follow:true}; run(2); state.texts=[]; draw();
  fs.writeFileSync('/tmp/pipcheck.png', canvas.toBuffer('image/png')); console.log('pip npc at', n.fx*W|0, n.fy*H|0, 'follower at', state.pip.x|0, state.pip.y|0, 'BUILD', BUILD);
}
if (process.env.B131) {                            // build 131: broken ravine edges; boulders turning craggy up the fields; the Map's diagonal climb
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.tortoise=true; state.pip=null;
  for (const id of ['f2','f5','peak1']) { enterScene(id); state.cut=null; state.enemies=[]; state.pip=null; state.hero.x=W*0.2; state.hero.y=H*0.15; run(6); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b131-'+id+'.png', canvas.toBuffer('image/png')); }
  for (const id of ['f1','f2','f3','f4','f5','f6','f7','peak1','peak2','peak3','hr1','hr2','hr3','start','foot']) state.seen[id]=true;
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Map'),sel:0,focus:'tabs',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b131-map.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b131 written');
}
if (process.env.B130) {                            // build 130: a pickup note and a long alert, both scrolls
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; enterScene('start'); state.cut=null; state.enemies=[]; state.pip=null; run(5); state.texts=[]; state.title=null; state.scrolls=[];
  const h=state.hero; collect({type:'stick',x:h.x,y:h.y}); run(5); collect({type:'stick',x:h.x,y:h.y}); run(20); draw(); fs.writeFileSync('/tmp/b130-a.png', canvas.toBuffer('image/png'));
  state.scrolls=[]; showScroll('The fishing rod', 'Stand by a ripple and press F to cast. Wait for the bob to dip, then F again to reel it in before it gets away.'); run(30); draw(); fs.writeFileSync('/tmp/b130-b.png', canvas.toBuffer('image/png'));
  console.log('b130 written');
}
if (process.env.B129) {                            // build 129: boulders sunk in the ground; the riverbank's stuck stone
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.gather; enterScene('riverbank'); state.cut=null; state.enemies=[]; state.pip=null; const c=WORLD.riverbank.feat.stoneCrag; state.hero.x=c[0]*W+UNIT*3; state.hero.y=c[1]*H; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b129.png', canvas.toBuffer('image/png'));
  console.log('b129 written');
}
if (process.env.B128) {                            // build 128: a field ravine full of stones, a crags ravine, the Windy Ledge's close valley
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.tortoise=true; state.pip=null;
  for (const id of ['f3','peak2','hr1']) { enterScene(id); state.cut=null; state.enemies=[]; state.pip=null; state.hero.x=W*0.3; state.hero.y=H*0.2; run(8); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b128-'+id+'.png', canvas.toBuffer('image/png')); }
  console.log('b128 written', WORLD.f3.chasms.length, WORLD.peak2.chasms.length);
}
if (process.env.B127) {                            // build 127: the riverbank boulder, the peeking gremlin, the taunter mid-leap
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.gather; enterScene('riverbank'); state.cut=null; state.enemies=[]; state.pip=null; const c=WORLD.riverbank.feat.stoneCrag; state.hero.x=c[0]*W-UNIT*2.5; state.hero.y=c[1]*H; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b127-river.png', canvas.toBuffer('image/png'));
  inv.story=STORY.adventure; inv.sword=true; enterScene('w1'); state.enemies=[]; state.pip=null; state.hero.x=W*0.4; state.hero.y=H*0.5; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b127-peek.png', canvas.toBuffer('image/png'));
  enterScene('w2'); state.enemies=[]; state.pip=null; state.hero.x=W*0.5; state.hero.y=H*0.5; run(80); const t=state.enemies.find(e=>e.taunter); if(t){ t.leap={x0:t.x,y0:t.y,x1:t.x+UNIT*3,y1:t.y-UNIT,t:0.2,dur:0.45}; } run(1); draw(); fs.writeFileSync('/tmp/b127-taunt.png', canvas.toBuffer('image/png'));
  console.log('b127 written');
}
if (process.env.B126) {                            // build 126: the icon belt and the Map as miniatures
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.pipSaved=true; inv.shrooms={camp:true,w2:true,foot:true}; inv.spores=4; inv.sword=true; inv.food.push('turnip');
  for (const id of ['riverbank','start','meadow','camp','f1','f2','w1','w2','shack','ford','farbank','foot','f3']) state.seen[id]=true;
  enterScene('start'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Map'),sel:0,focus:'tabs',act:0,note:''}; draw(); state.menu.focus='grid'; state.menu.sel=state.menu.mapIds.indexOf('w2'); draw(); fs.writeFileSync('/tmp/b126-map.png', canvas.toBuffer('image/png'));
  state.menu={view:'pack',tab:0,sel:0,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b126-gear.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b126 written');
}
if (process.env.B123) {                            // build 123: the High Reaches card, close then pulling back; Gear with everything
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.sawHighTitle=true; enterScene('hr3'); state.cut=null; state.enemies=[]; state.pip=null; run(3); state.texts=[]; state.title=null;
  const now=performance.now()/1000; for (const t of [0.6, 3, 6.5]) { state.highTitle={t0: now - t}; draw(); fs.writeFileSync('/tmp/b123-title'+t+'.png', canvas.toBuffer('image/png')); }
  state.highTitle=null; inv.sword=true; inv.lantern=true; inv.letter=true; inv.tortoise=true; inv.beetle={t:0}; inv.recipes={guard:true}; inv.pages=2; inv.beans=3; enterScene('start'); run(3); state.texts=[]; state.scrolls=[];
  state.menu={view:'pack',tab:0,sel:0,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b123-gear.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b123 written');
}
if (process.env.B120) {                            // build 120: Wick's cellar, the woods' little mushrooms, three different traveler's mushrooms, the Map tab
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.pipSaved=true; inv.shrooms={camp:true,w2:true,foot:true,c4:true}; inv.spores=5; inv.lantern=true; state.pip=null;
  enterScene('cellar'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b120-cellar.png', canvas.toBuffer('image/png'));
  const shots=[]; for (const id of ['camp','w2','foot']) { enterScene(id); state.enemies=[]; state.pip=null; const f=WORLD[id].feat.shroom; state.hero.x=f[0]*W-UNIT*2.5; state.hero.y=f[1]*H+UNIT; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b120-'+id+'.png', canvas.toBuffer('image/png')); }
  enterScene('camp'); run(3); state.menu={view:'pack',tab:PACK_TABS.indexOf('Map'),sel:1,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b120-map.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b120 written');
}
if (process.env.B119) {                            // build 119: the reed wall at the marsh's end, and marsh reeds
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; enterScene('m3'); state.cut=null; state.enemies=[]; state.pip=null; state.hero.x=W*0.72; state.hero.y=H*0.5; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b119.png', canvas.toBuffer('image/png')); console.log('b119 written');
}
if (process.env.B118) {                            // build 118: the vigor bar at 1, 2 and 3 layers; Pip following, in a scene, and tied up, all one drawing
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; enterScene('start'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  const h=state.hero; state.pip={x:h.x+UNIT*1.2,y:h.y,show:true,follow:true,side:-1};
  for (const [d,name] of [[0,'1'],[12,'2'],[29,'3']]) { inv.depth=0; inv.vigBonus=d; h.vig=maxVig(); state.hudVigT=state.time; run(2); draw(); fs.writeFileSync('/tmp/b118-bar'+name+'.png', canvas.toBuffer('image/png')); }
  inv.vigBonus=0; inv.depth=0; h.vig=maxVig(); enterScene('c7'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b118-cave.png', canvas.toBuffer('image/png'));
  console.log('b118 written', maxVig());
}
if (process.env.B114) {                            // build 114: the High Reaches
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.sawHighTitle=true; state.pip=null;
  for (const id of ['hr1','hr2','hr3']) { enterScene(id); state.cut=null; state.pip=null; if (id!=='hr2') state.enemies=state.enemies.filter(e=>e.type!=='mantis'); state.hero.x=W*0.45; state.hero.y=H*0.7; run(40); state.texts=[]; state.title=null; state.scrolls=[]; draw(); fs.writeFileSync('/tmp/b114-'+id+'.png', canvas.toBuffer('image/png')); }
  state.highTitle={t:2}; draw(); fs.writeFileSync('/tmp/b114-title.png', canvas.toBuffer('image/png')); state.highTitle=null;
  console.log('b114 written');
}
if (process.env.B113) {                            // build 113: single boulders (w1 exit, practice), a 4-tile one cracked 3 times, the cave stone, the bramble cluster, Pip at 60%
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; state.dusk=false;
  enterScene('w1'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null; state.pip={x:state.hero.x+UNIT*1.2,y:state.hero.y,show:true,follow:true}; draw(); fs.writeFileSync('/tmp/b113-w1.png', canvas.toBuffer('image/png'));
  rtFor('w1').flags.hits_crack1=3; draw(); fs.writeFileSync('/tmp/b113-cracked.png', canvas.toBuffer('image/png'));
  enterScene('w3'); state.enemies=[]; state.pip=null; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b113-w3.png', canvas.toBuffer('image/png'));
  console.log('b113 written');
}
if (process.env.B112) {                            // build 112: Gear columns (with what you wear), Status cards, a cracked stone
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; inv.sword=true; inv.woodsword=6; inv.acorns=5; inv.fire=true; inv.step=1; inv.up.edge=1; inv.rod=true; gainGear('feather',true); gainGear('stonecharm',true); state.title=null; state.scrolls=[];
  setSkillLevel('sword',1); setSkillLevel('gather',2); inv.cropXp={turnip:8};
  enterScene('start'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.scrolls=[];
  state.menu={view:'pack',tab:0,sel:0,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b112-gear.png', canvas.toBuffer('image/png'));
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Status'),sel:0,focus:'tabs',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b112-status.png', canvas.toBuffer('image/png')); state.menu=null;
  enterScene('w1'); run(3); const k=sceneDef().solids.find(s=>s.bar==='knockA'); state.hero.x=k.fx*W-UNIT*2; state.hero.y=k.fy*H; run(3); state.texts=[]; draw(); fs.writeFileSync('/tmp/b112-stone.png', canvas.toBuffer('image/png'));
  console.log('b112 written');
}
if (process.env.B111) {                            // build 111: w2's one row of boulders, the w3 cave heap, the heap broken open, a buried rock popping
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; state.dusk=false;
  enterScene('w2'); state.cut=null; state.enemies=[]; state.pip=null; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b111-w2.png', canvas.toBuffer('image/png'));
  enterScene('w3'); state.cut=null; state.enemies=[]; state.pip=null; const cv=WORLD.w3.feat.cave; state.hero.x=cv[0]*W-UNIT*4; state.hero.y=cv[1]*H; run(5); state.texts=[]; draw(); fs.writeFileSync('/tmp/b111-w3.png', canvas.toBuffer('image/png'));
  rtFor('w3').flags.cave=true; refreshSceneGeometry(); run(3); state.texts=[]; draw(); fs.writeFileSync('/tmp/b111-w3open.png', canvas.toBuffer('image/png'));
  enterScene('start'); state.pip=null; run(3); const rock=sceneDef().pullables.find(p=>p.id==='rock'); state.hero.x=rock.fx*W-UNIT*1.8; state.hero.y=rock.fy*H; run(3); state.texts=[];
  rtFor('start').flags.knocked_rock=true; rtFor('start').flags.knockT_rock=state.time; run(8); draw(); fs.writeFileSync('/tmp/b111-pop.png', canvas.toBuffer('image/png'));
  console.log('b111 written');
}
if (process.env.B110) {                            // build 110: the boulder barrier and a cracked stone in w1; the buried rock flat then tilted; the tent lantern
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  console.log('b110 start'); state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; enterScene('w1'); console.log('entered'); state.cut=null; state.enemies=[]; run(5); console.log('ran'); state.texts=[]; state.title=null;
  const k1=sceneDef().solids.find(s=>s.bar==='crack1'&&s.kind==='cracked'); state.hero.x=k1.fx*W-UNIT*3; state.hero.y=k1.fy*H; run(3); state.texts=[]; console.log('w1 ok'); draw(); fs.writeFileSync('/tmp/b110-w1.png', canvas.toBuffer('image/png'));
  enterScene('start'); run(3); const rock=sceneDef().pullables.find(p=>p.id==='rock'); state.hero.x=rock.fx*W-UNIT*1.6; state.hero.y=rock.fy*H; run(3); console.log('start ok'); state.texts=[]; draw(); fs.writeFileSync('/tmp/b110-flat.png', canvas.toBuffer('image/png'));
  rtFor('start').flags.knocked_rock=true; run(2); draw(); fs.writeFileSync('/tmp/b110-tilt.png', canvas.toBuffer('image/png'));
  enterScene('tentin'); run(3); console.log('tent ok'); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b110-tent-day.png', canvas.toBuffer('image/png')); state.dusk=true; run(3); state.texts=[]; draw(); fs.writeFileSync('/tmp/b110-tent-dusk.png', canvas.toBuffer('image/png'));
  console.log('b110 written');
}
if (process.env.B108) {                            // build 108: the spore swirl on the way home, the stump sword rising
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.adventure; state.dusk=true; enterScene('c7'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  const h=state.hero; state.pip={x:h.x+UNIT,y:h.y,show:true,follow:true}; startRescue(); run(130); state.texts=[]; draw(); fs.writeFileSync('/tmp/b108-spores.png', canvas.toBuffer('image/png'));
  state.cut=null; state.dusk=true; inv.woodsword=WOOD_SWORD; inv.sword=false; enterScene('w3'); run(5); state.texts=[]; startSwordCut(); run(150); state.texts=[]; draw(); fs.writeFileSync('/tmp/b108-sword.png', canvas.toBuffer('image/png'));
  console.log('b108 written');
}
if (process.env.B105) {                            // build 105: HUD bottom-right (bright, then faded), the pickup feed bottom-left
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.sword=true; inv.acorns=5; enterScene('start'); state.cut=null; state.enemies=[]; run(20); state.texts=[]; state.title=null;
  const h=state.hero; collect({type:'stick',x:h.x,y:h.y}); collect({type:'stick',x:h.x,y:h.y}); collect({type:'acorn',x:h.x,y:h.y}); h.vig-=1; run(10); draw(); fs.writeFileSync('/tmp/b105-a.png', canvas.toBuffer('image/png'));
  run(60*6); draw(); fs.writeFileSync('/tmp/b105-b.png', canvas.toBuffer('image/png')); console.log('b105 written');
}
if (process.env.B102) {                            // build 102: the rusty sword, a raging rabbit, the quest HUD under a bubble
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.gather; inv.sword=true; enterScene('f2'); state.cut=null; run(5); state.texts=[]; state.title=null; updateQuests(true);
  const h=state.hero; h.x=W*0.5; h.y=H*0.5; h.side=1; h.fx=1; const e=state.enemies.find(q=>q.type==='rabbit') || makeEnemy('rabbit', h.x+UNIT*2.2, h.y, 0); if(!state.enemies.includes(e)) state.enemies.push(e); e.x=h.x+UNIT*2.2; e.y=h.y; e.mode='rage'; e.t=9;
  state.time=Math.PI/60*1.01; run(1); say('Watch their eyes! When they flash red, get out of the way.', W*0.8, UNIT*1.2, {key:'pip', hold:false, color:'#bfe4ff'}); run(6);
  console.log('rabbits on f2:', state.enemies.filter(q=>q.type==='rabbit').length); draw(); fs.writeFileSync('/tmp/b102.png', canvas.toBuffer('image/png'));
}
if (process.env.B101) {                            // build 101: a level-up scroll, and Status with now / next
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; enterScene('start'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  setSkillLevel('gather',3); setSkillLevel('sword',1); showScroll('Gathering III', 'Things come to you when you pass close by.'); run(40); draw(); fs.writeFileSync('/tmp/b101-scroll.png', canvas.toBuffer('image/png'));
  state.scrolls=[]; state.menu={view:'pack',tab:PACK_TABS.indexOf('Status'),sel:0,focus:'tabs',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b101-status.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b101 written');
}
if (process.env.B99) {                             // build 99: a quest banner with the quest HUD and the pinned step under it
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.gather; (inv.pipTips=inv.pipTips||{}).tada=true; enterScene('camp'); state.cut=null; run(5); state.texts=[]; state.title=null;
  updateQuests(true); state.coach={id:'sword',i:1,t:0}; rawOf().stick=3; showTitle('Set up camp','a new quest','herald',3.6); state.title.t=1.2; run(3); draw();
  fs.writeFileSync('/tmp/b99.png', canvas.toBuffer('image/png')); console.log('b99 written');
}
if (process.env.B98) {                             // build 98: craft columns, the coach note, the book's map pages, candles at dusk, the ring's stones
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; const inv=state.inv; inv.story=STORY.gather; (inv.pipTips=inv.pipTips||{}).tada=true; inv.pipTips.craftLesson=true;
  ['riverbank','start','meadow','camp','f1','w1'].forEach(id=>state.seen[id]=true);
  enterScene('camp'); state.cut=null; run(5); state.texts=[]; state.title=null;
  Object.assign(rawOf(),{stick:5,stone:2,fluff:3,glue:1}); inv.acorns=3; campParts().stones=3; inv.woodsword=6; inv.known={glue:true,woodsword:true}; inv.heard={tinder:true,benchframe:true};
  state.coach={id:'tinder',i:2,t:0}; state.menu={view:'pack',tab:PACK_TABS.indexOf('Craft'),sel:1,focus:'grid',act:0,note:''}; state.mat=['stick']; run(2); draw(); fs.writeFileSync('/tmp/b98-craft.png', canvas.toBuffer('image/png'));
  state.menu=null; state.coach=null; state.hero.x=W*0.45; state.hero.y=H*0.55; run(5); state.texts=[]; draw(); fs.writeFileSync('/tmp/b98-camp.png', canvas.toBuffer('image/png'));
  state.menu={view:'book',page:6}; draw(); fs.writeFileSync('/tmp/b98-book.png', canvas.toBuffer('image/png')); state.menu=null;
  state.dusk=true; enterScene('tentin'); run(5); state.texts=[]; draw(); fs.writeFileSync('/tmp/b98-candles.png', canvas.toBuffer('image/png'));
  console.log('b98 shots written');
}
if (process.env.B92) {                             // build 92: the lantern (and feather) on the hero in the dark woods
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.adventure; state.inv.lantern=true; gainGear('feather',true); state.title=null; enterScene('w1'); state.cut=null; state.enemies=[]; run(10); state.texts=[]; state.title=null; draw();
  fs.writeFileSync('/tmp/b92.png', canvas.toBuffer('image/png')); console.log('b92 written');
}
if (process.env.B87) {                             // build 87: the Craft tab in sections, three places on the mat from the start
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.gather; enterScene('camp'); state.cut=null; run(3); state.texts=[]; state.title=null;
  Object.assign(rawOf(),{stick:4,stone:2,fluff:3,glue:1,firering:1}); state.inv.acorns=3; state.inv.food.push('turnip'); state.inv.known={glue:true}; state.inv.heard={woodsword:true};
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Craft'),sel:2,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b87.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b87', packCells('Craft').map(c=>c.sec+':'+c.name).join(' | '));
}
if (process.env.B84) {                             // build 84: Pip's two garden patches, and the camp's four by its mushroom
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.tocamp; state.settings.tiles=true;
  for (const id of ['meadow','camp']) { enterScene(id); state.cut=null; if (state.pip) state.pip.show=false; state.hero.x=W*0.1; state.hero.y=H*0.2; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b84-'+id+'.png', canvas.toBuffer('image/png')); }
  state.settings.tiles=false; console.log('b84 shots written');
}
if (process.env.B83) {                             // build 83: stacked action chips at a patch
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.tocamp; enterScene('meadow'); state.cut=null; run(3); state.texts=[]; state.title=null;
  state.inv.bag.turnipseed=2; state.inv.acorns=3; run(30); const q=WORLD.meadow.feat.plots[2]; state.hero.x=q[0]*W; state.hero.y=q[1]*H; state.pip.show=false; run(5); state.texts=[]; draw();
  fs.writeFileSync('/tmp/b83.png', canvas.toBuffer('image/png')); console.log('b83', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join(' | '));
}
if (process.env.B77) {                             // build 77: the book as a two-page spread, and the tiles overlay
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; enterScene('tentin'); state.cut=null; run(3); state.texts=[]; state.title=null;
  state.menu={view:'book',page:4}; draw(); fs.writeFileSync('/tmp/b77-book.png', canvas.toBuffer('image/png')); state.menu=null;
  state.settings.tiles=true; enterScene('riverbank'); state.hero.x=W*0.5; state.hero.y=H*0.8; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b77-tiles.png', canvas.toBuffer('image/png')); state.settings.tiles=false;
  console.log('b77 shots written');
}
if (process.env.B76) {                             // build 76: a waiting line vs a free line
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.garden; enterScene('meadow'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  const p=state.pip; state.hero.x=p.x-UNIT*5; state.hero.y=p.y+UNIT*2;
  say('Stand over here and shove them in the dirt! They love this stuff.', p.x, p.y-UNIT*1.3, {key:'pip', hold:false, color:'#bfe4ff'});
  say('...no, LISTEN. Old Wick says the river runs to a pool so shiny it hurts your eyes!', state.hero.x, state.hero.y-UNIT*1.3, {key:'npc', color:'#bfe4ff'});
  run(25); fs.writeFileSync('/tmp/b76-bubbles.png', canvas.toBuffer('image/png'));
  console.log('b76 shots written');
}
if (process.env.B75) {                             // build 75: pack tabs early and later, Gear sections, Status, testing levels
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; enterScene('riverbank'); state.cut=null; state.enemies=[]; run(5); state.texts=[]; state.title=null;
  state.menu={view:'pack',tab:0,sel:0,focus:'tabs',act:0,sys:0,note:''}; run(2); draw(); fs.writeFileSync('/tmp/b75-early.png', canvas.toBuffer('image/png'));
  const inv=state.inv; inv.sword=true; inv.acorns=5; inv.fire=true; inv.step=1; inv.silk=2; inv.up.edge=1; inv.rod=true; inv.food.push('turnip','carrot'); inv.bag.turnipseed=2; inv.mats.thorn=2; gainGear('feather',true); state.title=null; state.texts=[];
  setSkillLevel('gather',4); setSkillLevel('acorn',2); inv.cropXp={turnip:5};
  state.menu={view:'pack',tab:0,sel:2,focus:'grid',act:0,sys:0,note:''}; run(2); draw(); fs.writeFileSync('/tmp/b75-gear.png', canvas.toBuffer('image/png'));
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Status'),sel:0,focus:'tabs',act:0,sys:0,note:''}; run(2); draw(); fs.writeFileSync('/tmp/b75-status.png', canvas.toBuffer('image/png'));
  state.menu={view:'levels',sel:1,note:''}; run(2); draw(); fs.writeFileSync('/tmp/b75-levels.png', canvas.toBuffer('image/png'));
  console.log('b75 shots written');
}
if (process.env.B72) {                             // build 72: gathering rings at level 0 and level 8, loose-ground hints
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.adventure; state.inv.pipTaken=true; enterScene('start'); state.cut=null; state.enemies=[]; state.items=[]; run(5); state.texts=[]; state.title=null;
  const h=state.hero; h.x=W*0.5; h.y=H*0.6; const put=()=>{ state.items=[{type:'stick',x:h.x+UNIT*0.9,y:h.y},{type:'stone',x:h.x-UNIT*2.5,y:h.y+UNIT*0.4},{type:'thorn',x:h.x+UNIT*3,y:h.y-UNIT*0.8},{type:'starpetal',x:h.x-UNIT*1.2,y:h.y-UNIT*1.8}]; };
  setSkillLevel('gather',0); put(); for (let k=0;k<5;k++) draw(); fs.writeFileSync('/tmp/b72-l0.png', canvas.toBuffer('image/png'));
  setSkillLevel('gather',7); put(); state.items.forEach(i=>i.magnet=false); rtFor('start').flags.loose=[{fx:0.42,fy:0.75,found:false}]; for (let k=0;k<5;k++) draw(); fs.writeFileSync('/tmp/b72-l7.png', canvas.toBuffer('image/png'));
  console.log('b72 shots written');
}
if (process.env.B71) {                             // build 71: Pip's words in a bubble over Pip, and the quest-complete banner
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.gather; enterScene('camp'); state.cut=null; state.enemies=[]; run(10); state.texts=[]; state.title=null;
  state.inv.food.push('turnip','carrot'); state.inv.bag.turnipseed=2; run(30); state.texts=[]; state.title=null;
  state.pip={x:W*0.55,y:H*0.5,show:true,follow:true}; state.hero.x=W*0.45; state.hero.y=H*0.6;
  say('We still need a fire ring and a bench. River stones from the riverbank, sticks from the forest, and rabbit fluff from the windy fields down south. For glue. Trust me.', state.pip.x, state.pip.y-UNIT*1.3, {key:'pip', color:'#bfe4ff'});
  run(3); draw(); fs.writeFileSync('/tmp/b71-bubble.png', canvas.toBuffer('image/png'));
  state.texts=[]; state.title={ text: "Pip's garden", sub: 'quest complete', style: 'herald', t: 0, life: 4.6, at: state.time, hold: false, note: QUEST_DID.garden }; run(50); draw(); fs.writeFileSync('/tmp/b71-outro.png', canvas.toBuffer('image/png'));
  console.log('b71 shots written');
}
if (process.env.B70) {                             // build 70: the Vale quest banner mid-rise, and the vigor bar at 8, 17 and 40
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.adventure; state.inv.pipTaken=true; state.inv.sword=true; enterScene('start'); state.cut=null; state.enemies=[]; run(20); state.texts=[]; state.title=null;
  showTitle('Find Pip', 'a new quest', 'herald', 3.6); run(40); state.texts=[]; draw(); fs.writeFileSync('/tmp/b70-banner.png', canvas.toBuffer('image/png'));
  state.title=null; const inv=state.inv, h=state.hero; const strip=createCanvas(W*0.3, H*0.36), g=strip.getContext('2d');
  [[0,8],[9,17],[32,25],[32,40]].forEach(([b,v],i)=>{ inv.vigBonus=b; h.vig=v; draw(); g.drawImage(canvas, 0, 0, W*0.3, H*0.09, 0, i*H*0.09, W*0.3, H*0.09); });
  fs.writeFileSync('/tmp/b70-vigor.png', strip.toBuffer('image/png'));
  console.log('b70 shots written');
}
if (process.env.B69) {                             // build 69: fixed vigor bar over the slots, wooden sword in hand, the Craft tab with recipes
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.adventure; state.inv.pipTaken=true; enterScene('start'); state.cut=null; state.enemies=[]; run(3);
  const inv=state.inv; inv.woodsword=6; inv.acorns=4; inv.food.push('turnip','carrot'); inv.bag.turnipseed=2; inv.aug={id:'thornwrap',n:5}; run(30);
  state.hero.x=W*0.5; state.hero.y=H*0.62; state.texts=[]; state.title=null; run(2); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b69-hud.png', canvas.toBuffer('image/png'));
  Object.assign(rawOf(),{stick:3,fluff:2,stone:1}); inv.craftSlots=3; inv.known={glue:true}; inv.heard={woodsword:true, mash:true}; state.mat=['fluff','fluff'];
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Craft'),sel:0,focus:'grid',act:0,note:''}; draw(); fs.writeFileSync('/tmp/b69-craft.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b69 shots written');
}
if (process.env.B68) {                             // build 68: mud wallow + boulder wedge, hidden sword, the reveal, the new-quest herald
  const run=n=>{ for (let k=0;k<n;k++){ update(1/60); draw(); } };
  state.started=true; state.intro=null; state.inv.story=STORY.adventure; state.inv.sword=true;
  enterScene('w2'); state.cut=null; state.enemies=[]; run(3); const m=WORLD.w2.mud[0]; state.hero.x=m[0]*W-UNIT*3.5; state.hero.y=m[1]*H;
  sinkRock(m[0]*W-UNIT*1.2, m[1]*H+UNIT*0.4); run(40); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b68-mud.png', canvas.toBuffer('image/png'));
  state.inv.sword=false; enterScene('w3'); state.cut=null; state.enemies=[]; const sw=WORLD.w3.feat.sword; rtFor('w3').flags.swordthorns=true; refreshSceneGeometry();
  state.hero.x=sw[0]*W-UNIT*1.2; state.hero.y=sw[1]*H+UNIT*0.3; run(5); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b68-hidden.png', canvas.toBuffer('image/png'));
  rtFor('w3').pulled.add('sword'); startSwordCut(); run(Math.round(60*2.6)); state.texts=[]; draw(); fs.writeFileSync('/tmp/b68-reveal.png', canvas.toBuffer('image/png'));
  state.cut=null; state.cam.focus=null; state.title=null; showTitle('Set up camp', 'a new quest', 'herald', 3.6); run(70); draw(); fs.writeFileSync('/tmp/b68-herald.png', canvas.toBuffer('image/png'));
  console.log('b68 shots written');
}
if (process.env.B67) {                             // build 67: sparkles far / near / in reach, quest HUD bright then light
  const run=n=>{ for (let k=0;k<n;k++) update(1/60); };
  state.started=true; state.intro=null; state.inv.story=STORY.gather; enterScene('start'); state.cut=null; state.enemies=[]; run(5); updateQuests(true); state.texts=[]; state.title=null;
  const items=[{type:'acorn',x:W*0.2,y:H*0.7},{type:'turnipseed',x:W*0.45,y:H*0.7},{type:'stick',x:W*0.52,y:H*0.7}]; state.items.push(...items);
  state.hero.x=W*0.5; state.hero.y=H*0.66; state.qPulse={camp: state.time}; for (let k=0;k<40;k++){ update(1/60); draw(); } state.texts=[]; state.title=null; draw();
  const cx=W*0.5, cy=H*0.68; const crop=(nm)=>{ const c=createCanvas(W*0.5,H*0.3); c.getContext('2d').drawImage(canvas, -W*0.1, -H*0.55); fs.writeFileSync(nm, c.toBuffer('image/png')); };
  fs.writeFileSync('/tmp/b67-bright.png', canvas.toBuffer('image/png')); crop('/tmp/b67-glints.png');
  state.qPulse={camp: state.time-9}; run(2); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/b67-light.png', canvas.toBuffer('image/png'));
  console.log('b67 shots written');
}
if (process.env.B66) {                             // build 66: slot bar, the wheel (use / set a slot), the Wear tab, worn things on the hero
  const run=n=>{ for (let k=0;k<n;k++) update(1/60); };
  state.started=true; state.inv.story=STORY.gather; enterScene('camp'); state.cut=null; state.intro=null; run(5);
  state.inv.sword=true; state.inv.acorns=6; state.inv.food.push('turnip','turnip','carrot','berries'); state.inv.bag.turnipseed=3; run(30);
  gainGear('feather',true); gainGear('embercharm',true); state.texts=[]; state.title=null; state.hero.x=W*0.5; state.hero.y=H*0.62; run(5); state.texts=[]; state.title=null;
  draw(); fs.writeFileSync('/tmp/b66-hud.png', canvas.toBuffer('image/png'));
  state.swapT=state.time-1; state.radial={slot:null, opts:radialOptions(), sel:1}; draw(); fs.writeFileSync('/tmp/b66-wheel.png', canvas.toBuffer('image/png'));
  state.radial={slot:'d', opts:radialOptions('d'), sel:2}; draw(); fs.writeFileSync('/tmp/b66-assign.png', canvas.toBuffer('image/png')); state.radial=null; state.swapT=null;
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Wear'),sel:0,focus:'grid',act:0}; draw(); fs.writeFileSync('/tmp/b66-wear.png', canvas.toBuffer('image/png')); state.menu=null;
  console.log('b66 shots written');
}
if (process.env.B65) {                             // build 65: the held opening line, Pip at the garden with the quest HUD, seeds, a quest alert, the Quests tab
  const run=n=>{ for (let k=0;k<n;k++) update(1/60); };
  const F=()=>{ state.keys.f=true; run(1); state.keys.f=false; run(30); };
  state.started=true; startIntro(); run(40); draw(); fs.writeFileSync('/tmp/b65-open.png', canvas.toBuffer('image/png'));
  F(); F(); F(); run(60*9); state.hero.x=W*0.5; state.hero.y=H-UNIT*0.6; run(2); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; run(30);
  draw(); fs.writeFileSync('/tmp/b65-alert.png', canvas.toBuffer('image/png'));
  F(); const g=gardenSpot(); state.hero.x=g[0]-UNIT*2.2; state.hero.y=g[1]; run(80); draw(); fs.writeFileSync('/tmp/b65-garden.png', canvas.toBuffer('image/png'));
  F(); state.texts=[]; state.inv.bag.turnipseed=2; state.inv.bag.carrotseed=1; state.inv.bag.pepperseed=1; state.inv.bag.squashseed=1; state.inv.bag.thornseed=1;
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Seeds'),sel:0,focus:'grid',act:0}; draw(); fs.writeFileSync('/tmp/b65-seeds.png', canvas.toBuffer('image/png'));
  state.menu={view:'pack',tab:PACK_TABS.indexOf('Quests'),sel:0,focus:'grid',act:0,qsel:0}; draw(); fs.writeFileSync('/tmp/b65-quests.png', canvas.toBuffer('image/png'));
  state.menu=null; const items=['turnipseed','carrotseed','pepperseed','squashseed']; ctx.fillStyle='#4a9650'; ctx.fillRect(0,0,W,H); items.forEach((t,i)=>drawItemIcon(t, 120+i*160, 120, 96)); fs.writeFileSync('/tmp/b65-seedicons.png', canvas.toBuffer('image/png'));
  console.log('b65 shots written');
}
if (process.env.OPEN) {
  state.started=true; startIntro(); for (let k=0;k<60*4.5;k++) update(1/60); draw(); fs.writeFileSync('/tmp/open.png', canvas.toBuffer('image/png'));
  state.cut=null; enterScene('tentin'); state.texts=[]; state.title=null; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/tent.png', canvas.toBuffer('image/png'));
  state.menu={view:'book',page:4}; draw(); fs.writeFileSync('/tmp/book.png', canvas.toBuffer('image/png')); state.menu=null;
  enterScene('meadow'); const h=state.hero; h.x=W*0.4; h.y=H*0.5; for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; state.keys[' ']=true; update(1/60); for (let k=0;k<14;k++) update(1/60); state.texts=[]; draw();
  fs.writeFileSync('/tmp/jumpz.png', canvas.toBuffer('image/png')); console.log('z at shot', (h.z/UNIT).toFixed(2), 'scale', heightScale(h.z).toFixed(2));
}
if (process.env.CAMP) {
  state.started=true; enterScene('camp'); state.cut=null; rawOf().cloth=1; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null;
  state.hero.x=W*0.55; state.hero.y=H*0.62; state.pip={x:W*0.6,y:H*0.55,show:true,follow:true};
  for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/camp0.png', canvas.toBuffer('image/png'));
  Object.assign(rawOf(), { stick: 3, stone: 2, fiber: 3, cord: 1 }); state.inv.known={cord:true}; state.inv.craftSlots=3; state.mat=['stone','stone','stick'];
  state.menu={ view:'pack', tab: PACK_TABS.indexOf('Craft'), sel: 0, focus:'grid', act:0 }; draw(); fs.writeFileSync('/tmp/craft.png', canvas.toBuffer('image/png'));
}
if (process.env.FARM) {
  state.started=true; state.inv.sword=true; enterScene('camp'); state.cut=null; const f=WORLD.camp.feat; const rt=rtFor('camp');
  rt.flags.plots = f.plots.map((q,i)=>({ s: i>=4?1:0, t: state.playTime - [0,0,0,0,25,60,25,60][i], seed:'turnipseed', lv: i%4 }));
  for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; state.hero.x=W*0.8; state.hero.y=H*0.8; draw();
  fs.writeFileSync('/tmp/farm.png', canvas.toBuffer('image/png'));
  console.log(JSON.stringify(f.plots));
}
if (process.env.RIDE) {
  state.started=true; state.inv.sword=true; enterScene('f3'); state.cut=null; state.enemies=[]; const sc=WORLD.f3, h=state.hero;
  state.gustIdx=0; const top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy).find(r=>{ const t=windTarget(sc,{x:r.fx*W,y:r.fy*H}); return t && t[1]>r.fy*H+UNIT; }); h.x=top.fx*W; h.y=top.fy*H;
  for (let k=0;k<3;k++) update(1/60);
  state.gustIdx=0; state.gustStep=5; state.gustPhase='blow'; state.gustT=0.2; state.gust=1;
  state.keys[' ']=true; update(1/60); state.keys[' ']=false;
  for (let k=0;k<Math.round(h.ride.dur*60*0.72);k++){ update(1/60); state.texts=[]; state.title=null; }
  draw(); fs.writeFileSync('/tmp/ride.png', canvas.toBuffer('image/png'));
}
if (process.env.WIND) {
  state.started=true;
  for (const id of ['f3','f5']) {
    enterScene(id); state.cut=null; state.enemies=[]; state.texts=[]; state.title=null;
    const sc=WORLD[id], top=sc.rocks.filter(r=>r.ledge).sort((a,b)=>a.fy-b.fy||a.fx-b.fx)[1] || sc.rocks[0]; const h=state.hero; h.x=top.fx*W; h.y=top.fy*H;
    for (let k=0;k<1200;k++){ update(1/60); state.texts=[]; state.title=null; if (state.gustPhase==='build' && windTarget(sc)) break; }
    for (let k=0;k<25;k++){ update(1/60); state.texts=[]; state.title=null; }
    console.log(id, 'phase', state.gustPhase, 'target', JSON.stringify(windTarget(sc)), 'hero', (h.x/W).toFixed(2), (h.y/H).toFixed(2), 'z', h.z, 'ride', !!h.ride); draw(); fs.writeFileSync('/tmp/wind-'+id+'.png', canvas.toBuffer('image/png'));
  }
}
if (process.env.POSE) {
  state.started=true; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null;
  state.menu = { view: 'poses', sel: 0 }; for (let k=0;k<20;k++) { update(1/60); } draw(); fs.writeFileSync('/tmp/poses.png', canvas.toBuffer('image/png'));
  state.menu = null; const h = state.hero; h.x = W * 0.45; h.y = H * 0.55; h.fx = 1; h.fy = 0; h.side = 1;
  for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/hero-world.png', canvas.toBuffer('image/png'));
}
if (process.env.MQ) {
  state.started=true; state.inv.sword=true; state.inv.food=['carrot','fish']; state.inv.acorns=4; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null;
  toggleMenu(); for (let k=0;k<150;k++) { update(1/60); draw(); } console.log('marquee', JSON.stringify(state.marquee), 'time', state.time.toFixed(2)); fs.writeFileSync('/tmp/mq.png', canvas.toBuffer('image/png'));
}
if (process.env.PIP) {
  state.started=true; enterScene('start', 0.3, 0.5); state.cut=null; state.hero.x=W*0.35; state.hero.y=H*0.5; state.hero.fx=1; state.hero.fy=0;
  for (let k=0;k<200;k++) update(1/60); draw(); fs.writeFileSync('/tmp/pip.png', canvas.toBuffer('image/png'));
}
if (process.env.SYS) {
  state.started=true; for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null;
  state.menu = { view: 'pack', tab: PACK_TABS.indexOf('System'), sel: 0, focus: 'grid', sys: 1, act: 0 }; draw(); fs.writeFileSync('/tmp/sys.png', canvas.toBuffer('image/png'));
  state.menu = null; for (let k=0;k<3;k++) update(1/60); state.texts=[]; state.title=null; draw(); fs.writeFileSync('/tmp/hub.png', canvas.toBuffer('image/png'));
}
if (process.env.RAP) {
  state.started=true; enterScene('rapids'); state.cut=null; state.rapids.dist=4.2; state.rapids.x=rapidsChannel(4.2)[0];
  for (let k=0;k<20;k++) update(1/60); state.texts=[]; draw(); fs.writeFileSync('/tmp/rap1.png', canvas.toBuffer('image/png'));
  state.rapids.dist=RAPIDS.len-0.35; state.rapids.x=rapidsChannel(state.rapids.dist)[0]; for (let k=0;k<3;k++) update(1/60); state.texts=[]; draw(); fs.writeFileSync('/tmp/rap2.png', canvas.toBuffer('image/png'));
  state.rapids=null; state.overFalls=true; enterScene('gleampool', 0.8, 0.5); for (let k=0;k<30;k++) update(1/60); draw(); fs.writeFileSync('/tmp/rap3.png', canvas.toBuffer('image/png'));
}
if (process.env.TXT) {
  state.started=true; enterScene('start'); state.cut=null; RT.start.flags.ambush=true; state.hero.x=W*0.5; state.hero.y=H*0.55; state.inv.sword=true; state.inv.acorns=5;
  for (let k=0;k<5;k++) update(1/60); state.texts=[];
  for (let k=0;k<5;k++) say(['Tilled soil. F to plant','+1 driftwood (3)','A gleaming fish!','The thief has the journal','Getting away'][k], W*0.5+k*6, H*0.48+k*4, { key:'s'+k, life: 30 });
  sayHero('Too tired to spin', { life: 30 });
  say('A letter, weighted with a pipe: "If you are reading this, you found my shack. Do not mind the smell. The pool downriver has fish as big as boots, so I lashed four logs of driftwood with thorn twine and went. Mind the rapids. Old Wick."', W*0.5, H*0.5, { key:'letter', life: 30 });
  showTitle('Sidequest: Downriver', 'build a raft at the old jetty', 'relic', 30);
  for (let k=0;k<30;k++) { update(1/60); draw(); }
  fs.writeFileSync('/tmp/txt.png', canvas.toBuffer('image/png'));
}
if (process.env.UI) {
  state.started=true; enterScene('m1'); state.cut=null; state.inv.sword=true; state.inv.acorns=6; state.inv.rod=true; state.inv.fire=true; state.inv.step=2; state.inv.up.edge=1; state.inv.food=['fish','carrot','carrot','squash','pepper']; state.inv.favFood='carrot';
  state.inv.bag.thornseed=2; state.inv.bag.seed=3; state.inv.mats.thorn=3; state.inv.mats.driftwood=2;
  for (let k=0;k<5;k++) update(1/60); state.texts=[]; state.title=null;
  state.radial = { opts: radialOptions(), sel: 2 }; draw(); fs.writeFileSync('/tmp/ui-radial.png', canvas.toBuffer('image/png')); state.radial=null;
  state.menu = { view: 'pack', tab: 1, sel: 1, focus: 'acts', act: 1 }; draw(); fs.writeFileSync('/tmp/ui-pack.png', canvas.toBuffer('image/png'));
  state.menu = { view: 'pack', tab: 0, sel: 0, focus: 'grid', act: 0 }; draw(); fs.writeFileSync('/tmp/ui-gear.png', canvas.toBuffer('image/png'));
}
for (const id of ${JSON.stringify(ids)}) {
  enterScene(id); state.cut=null; state.hero.x = W*0.55; state.hero.y = H*0.75; state.texts=[]; state.title=null;
  for (let k=0;k<5;k++) update(1/60);
  state.texts=[]; state.title=null;
  ctx.setTransform(1,0,0,1,0,0); drawScene(WORLD[id]);
  fs.writeFileSync('/tmp/shot-'+id+'.png', canvas.toBuffer('image/png'));
}
`);
