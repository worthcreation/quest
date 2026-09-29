const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT, z=()=>riseZoom(state.rise.p), tilt=()=>Math.round(RISE.tilt*state.rise.p*57.3);
// walk east along the path like a person (steer toward it), until the key has been held n seconds or the scene changes
// (the path: down from the north-west corner, east, and south out of the pass at x RISE.outX)
const walkEast=(secs, stopAt)=>{ const sc0=state.scene, seen=[]; let t=0;
  while(state.scene===sc0 && t<60*secs && !(stopAt && tx()>stopAt)){
    const south = tx() > RISE.outX - 0.4 && ty() > risePathY(tx()) - 1;                  // at the far end: turn down through the pass
    const dy = south ? 1 : risePathY(tx()+1)-ty(), far = dy > 2.5 && tx() < RISE.inX + 5;   // coming in: down first
    state.keys.arrowright = !south && !far || (south && tx() < RISE.outX - 0.2); state.keys.arrowleft = south && tx() > RISE.outX + 0.4;
    state.keys.arrowdown=dy>0.3; state.keys.arrowup=dy<-0.3; run(1); t++; if(t%60===0 && state.rise) seen.push([tx(), z()]); } off(); return [t/60, seen]; };
run(5); state.intro=null; state.texts=[]; state.pip=null;
// 1. f2 is gone; the first field's south way leads onto the rise at its north-west corner, looking straight down
startTestScene('f1'); run(10);
const s1=WORLD.f1.exits.find(e=>e.side==='s'); state.hero.x=(s1.a+s1.b)/2*W; state.hero.y=H-UNIT*0.7; state.keys.arrowdown=true; run(40); off(); run(40);
console.log('1 f2 in the world:', !!WORLD.f2, '| south from f1 ->', state.scene, 'at x', tx().toFixed(1), 'y', ty().toFixed(1), '| zoom', z().toFixed(2), '| tilt', tilt(), 'deg | scene', RISE.len+'x'+RISE.D, 'tiles');
// 2. two rabbits in the first stretch
const rab=state.enemies.filter(e=>e.type==='rabbit');
console.log('2 rabbits:', rab.length, 'at x', rab.map(e=>(e.x/UNIT).toFixed(1)).join(', '));
state.enemies=[];
// 3. the reeds at x 20, just past a tree: walking east stops there; a sword does nothing to them
const tree=riseLand().solids.filter(p=>p.k==='tree'&&p.x<RISE.barX).sort((a,b)=>b.x-a.x)[0];
const cover=riseLand().solids.filter(p=>p.x>1&&p.x<RISE.barX-1&&Math.abs(p.y-RISE.mid)<riseHalf(p.x)-1).length;
walkEast(6); const stopped=tx();
const reeds=()=>state.solids.filter(s=>s.reedwall).length;
for (let i=0;i<6;i++){ press('f'); run(20); }
console.log('3 cover before the reeds:', cover, 'stones and trees | tree at x', tree.x.toFixed(1), '| reeds at x', RISE.barX, '('+reeds()+' clumps, wall to wall) | walking east stops at x', stopped.toFixed(1), '| six sword swings later:', reeds(), 'clumps');
// 4. for now not even fire gets through (a lit puff of gas against them, as the marsh fire does)
{ const p=spawnPuff((RISE.barX-0.9)*UNIT, ty()*UNIT, 0, 0, UNIT*1.2); p.r=UNIT*0.8; p.ign=state.time; } run(120);
const afterFire=reeds(); state.keys.arrowright=true; run(120); off();
console.log('4 after fire: reeds', afterFire, '| still stops at x', tx().toFixed(1));
state.hero.x=(RISE.barX+2)*UNIT; state.hero.y=risePathY(RISE.barX+2)*UNIT; run(5);   // (past them, to walk the rest)
// 5. on up the rise: the view pulls back evenly and tips; the walls open out; the east end leads down to f3
const [secs, seen]=walkEast(30); const zs=seen.map(s=>s[1]), mono=zs.every((v,i)=>!i||v<=zs[i-1]+1e-6), most=Math.max(0,...zs.slice(1).map((v,i)=>zs[i]-v));
console.log('5 east and down the pass to', state.scene, 'by the', state.scene==='f3' ? 'north way' : '?', 'in', secs.toFixed(1), 's | zoom by second:', zs.map(v=>v.toFixed(2)).join(' '), '| only pulls back:', mono, '| biggest step', most.toFixed(3));
// 6. back up from f3: in at the rise's east end, pulled back; then west, the view comes back in
const n3=WORLD.f3.exits.find(e=>e.to==='rise'); state.hero.x=(n3.a+n3.b)/2*W; state.hero.y=UNIT*0.7; state.keys.arrowup=true; run(40); off(); run(10);
const inAt=[tx(), ty(), z()]; state.enemies=[]; state.keys.arrowup=true; run(60*2); off(); state.keys.arrowleft=true; run(60*3); off(); run(120);
console.log('6 north from f3 ->', state.scene, 'at x', inAt[0].toFixed(1), 'y', inAt[1].toFixed(1), 'zoom', inAt[2].toFixed(2), '| up the pass 2 s, then 3 s west: x', tx().toFixed(1), 'y', ty().toFixed(1), 'zoom', z().toFixed(2));
// 7. the walls open out as you go: wall to wall at three places
const walls=x=>{ state.hero.x=x*UNIT; state.hero.y=15*UNIT; state.hero.vx=state.hero.vy=0; state.keys.arrowup=true; run(150); off(); const a=ty(); state.keys.arrowdown=true; run(240); off(); return ty()-a; };
const w5=walls(10), w40=walls(40), w66=walls(66);
console.log('7 wall to wall: x 10', w5.toFixed(1), 'tiles | x 40', w40.toFixed(1), '| x 66', w66.toFixed(1));
// 8. the way in leads back up to f1; the west end is a wall; a phone keeps you at least 20 px
state.hero.x=2*UNIT; state.hero.y=15*UNIT; state.keys.arrowleft=true; run(90); off(); const wx=tx(); state.hero.x=RISE.inX*UNIT; state.hero.y=4*UNIT; state.keys.arrowup=true; run(90); off(); run(20); const west=state.scene;
const sv=[W,H,SW,SH]; W=SW=390; H=SH=844; computeUnit(); const px=riseZoomMin()*UNIT; [W,H,SW,SH]=sv; computeUnit();
console.log('8 west end: stopped at x', wx.toFixed(2), '| up the way in ->', west, '| phone: smallest hero', px.toFixed(1), 'px');
if (!(WORLD.f2===undefined && rab.length===2 && cover>=6 && stopped<RISE.barX && afterFire>0 && secs>0 && mono && most<0.12 && w40>w5+3 && w66>w40+3 && wx>0.3 && west==='f1' && px>=20)) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
