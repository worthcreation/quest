// render single scenes at full size for a visual check
const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
let src = fs.readFileSync('/mnt/user-data/outputs/index.html', 'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
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
  state.menu={view:'book',page:0}; draw(); fs.writeFileSync('/tmp/book.png', canvas.toBuffer('image/png')); state.menu=null;
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
