const src = require('./harness.js').src;
// The wind shelf (mt1, build 207): the rise's pass leads onto it; a ravine splits the way, jumped at three narrow
// crossings, ridden across on the strong gust from ledge to ledge where it's wide, with an island out in the widest
// stretch (the secret) reached only by riding; hares; the pass at the far end leads onto the stepping path (mt2). Played like a person.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT, h=state.hero, m=M1, r=M1.rav, sc=()=>sceneDef();
run(5); state.intro=null; state.pip=null; state.texts=[];
// 1. the rise's pass leads onto the wind shelf (its own scene, a mountain screen; climb1 is gone)
startTestScene('rise', RISE.outX/RISE.len, (RISE.D-1)/RISE.D); run(5); state.keys.arrowdown=true; run(90); off(); run(10); const inAt=[tx(),ty()];
console.log('1 through the rise\\'s pass ->', state.scene, 'at x', inAt[0].toFixed(1), 'y', inAt[1].toFixed(1), '| a mountain screen:', !!state.mtn, '| climb1 in the world:', !!WORLD.climb1, '| scene', m.len+'x'+m.D, 'tiles');
state.enemies=[];
// 2. the ravine's numbers: the gap at each crossing, the wide stretches, the island
const gaps=r.cross.map(c=>2*r.hw(c));
console.log('2 gaps at the crossings (tiles):', gaps.map(g=>g.toFixed(2)).join(', '), '| wide', (2*r.hw(19)).toFixed(1), '| at the island', (2*r.hw(r.island[0])).toFixed(1), '(island', r.island[1]*2, 'across, a gap of', (r.hw(r.island[0])-r.island[1]).toFixed(2), 'either side) | jump reach', jumpReach().toFixed(2));
// 3. the north bank, walked east to the first crossing without falling
const falls=[]; const walk=(secs, until)=>{ let t=0; while(t<60*secs && !until()){ const dy=m.pathY(tx()+1)-ty(); state.keys.arrowright=true; state.keys.arrowdown=dy>0.3; state.keys.arrowup=dy<-0.3; run(1); t++; if(h.falling>0){ falls.push(tx().toFixed(1)); while(h.falling>0) run(1); } } off(); };
walk(12, ()=>tx()>r.cross[0]-2.5);
console.log('3 the north bank to x', tx().toFixed(1), '| falls', falls.length);
// 4. each crossing: run at the lip and jump from half a tile before it; then a jump across the wide part drops you in,
// and back onto the bank you come (the pit's note)
const cross=(cx, back)=>{ const sd=m.side(cx-1), lip=r.cy(cx)+sd*r.hw(cx), far=r.cy(cx)-sd*r.hw(cx);
  h.falling=0; h.ride=null; h.z=0; h.x=cx*UNIT; h.y=(lip+sd*(back+1.5))*UNIT; h.vx=h.vy=0; h.safe=[h.x/(m.len*UNIT),h.y/(m.D*UNIT)]; run(3);
  state.keys[sd<0?'arrowdown':'arrowup']=true; while(Math.abs(ty()-lip)>back) run(1);
  state.keys.btnjump=true; run(1); state.keys.btnjump=false; let air=0; while((h.z>0||h.vz>0)&&air<90){run(1);air++;} off(); run(3); return [sd*(far-ty()), h.falling>0]; };
const res=r.cross.map(cx=>cross(cx, 0.5)); const allOk=res.every(([past,fell])=>past>0&&!fell);
console.log('4 crossings from 0.5 tiles before the lip: landed past the far lip by', res.map(([p])=>p.toFixed(2)).join(', '), 'tiles | fell:', res.map(([,f])=>f).join(','));
const wide=cross(19, 0.2); state.texts=[]; let note=''; while(h.falling>0){ run(1); } run(2); note=(state.texts.find(x=>/bank|Ooof/.test(x.text))||{}).text||''; const backAt=[tx(),ty()];
console.log('4b a jump across the wide part: fell', wide[1], '| note:', JSON.stringify(note), '| back on the bank at x', backAt[0].toFixed(1), 'y', backAt[1].toFixed(1), '(the south lip', (r.cy(19)+r.hw(19)).toFixed(1)+')');
// 5. the rides: on the north ledge by the wide stretch, wait for the strong gust blowing south, jump: it carries you to
// the ledge across. At the widest, north ledge > island (the carrots and acorn) > south ledge
const ledges=sc().rocks.map(k=>[k.fx*m.len, k.fy*m.D, k.r, !!k.island]);
const rideFrom=(lx,ly,want)=>{ h.x=lx*UNIT; h.y=ly*UNIT; h.vx=h.vy=0; h.ride=null; h.falling=0; let w=0; while(w<60*40){ run(1); w++; const g=sc().gusts[state.gustIdx]; if(state.gustPhase==='blow' && g.s>=1 && Math.sign(Math.cos(g.a))===want) break; } state.keys.btnjump=true; run(1); state.keys.btnjump=false; const rode=!!h.ride; let n=0; while(h.ride&&n<300){run(1);n++;} run(5); return rode; };
const N1=ledges.find(l=>Math.abs(l[0]-19)<0.1 && l[1]<r.cy(19)), S1=ledges.find(l=>Math.abs(l[0]-19)<0.1 && l[1]>r.cy(19));
const rode1=rideFrom(N1[0],N1[1],1), on1=Math.hypot(tx()-S1[0], ty()-S1[1])<S1[2];
console.log('5 ledges:', ledges.length, '(island '+ledges.filter(l=>l[3]).length+') | north ledge at x 19, strong south gust, jump: rode', rode1, '| landed on the ledge across', on1, 'at', tx().toFixed(1)+','+ty().toFixed(1));
const Ni=ledges.find(l=>Math.abs(l[0]-r.island[0])<0.1 && l[1]<r.cy(r.island[0]) && !l[3]), Si=ledges.find(l=>Math.abs(l[0]-r.island[0])<0.1 && l[1]>r.cy(r.island[0]));
const rode2=rideFrom(Ni[0],Ni[1],1), onIsland=Math.hypot(tx()-r.island[0], ty()-r.cy(r.island[0]))<r.island[1]; const here=state.items.filter(i=>Math.hypot(i.x-h.x,i.y-h.y)<UNIT*1.5).map(i=>i.type).sort().join(',');
const rode3=rideFrom(tx(),ty(),1), onS=Math.hypot(tx()-Si[0], ty()-Si[1])<Si[2];
console.log('5b the widest: north ledge -> rode', rode2, 'onto the island', onIsland, '| on it:', here, '| island -> rode', rode3, 'onto the south ledge', onS);
// 6. the wind on the bank: 25 s of gusts standing 2.5 tiles from the lip, not blown in
h.x=19*UNIT; h.y=(r.cy(19)-r.hw(19)-2.5)*UNIT; h.vx=h.vy=0; h.ride=null; h.safe=[h.x/W,h.y/H]; let blownIn=false; for(let k=0;k<60*25;k++){ run(1); if(h.falling>0){blownIn=true; break;} }
console.log('6 standing 2.5 tiles from the lip for 25 s: blown in', blownIn); while(h.falling>0) run(1);
// 7. the hares: bigger than the rise's rabbits, a hit tougher; they rage, dart and flee
state.enemies=sc().spawns.map((s,i)=>makeEnemy(s.type,s.fx*W,s.fy*H,i)); const e=state.enemies[0]; h.x=e.x-UNIT*3; h.y=e.y; h.vx=h.vy=0; const modes=new Set(); for(let k=0;k<240;k++){ run(1); modes.add(e.mode); }
console.log('7 hares:', sc().spawns.filter(s=>s.type==='hare').length, '| r', (e.r/UNIT).toFixed(2), 'tiles (rabbit', (MONSTERS.rabbit.stats(UNIT).r/UNIT).toFixed(2)+'), hp', e.hp, '(rabbit 2) | modes seen:', [...modes].sort().join(','));
// 8. east along the south bank, through the pass at the far end, onto mt2; and back north from the way in to the rise
state.enemies=[]; h.x=49*UNIT; h.y=m.pathY(49)*UNIT; h.vx=h.vy=0; falls.length=0; walk(12, ()=>tx()>m.outX-0.3); state.keys.arrowdown=true; run(60*4); off(); run(5); const out=[state.scene, !!state.climb];
state.climb=null; enterScene('mt1', m.inX/m.len, 2/m.D); run(5); state.keys.arrowup=true; run(90); off(); run(10);
console.log('8 the south bank east to the pass and south ->', out[0], '(climb running:', out[1]+') | falls on the way', falls.length, '| north from the way in ->', state.scene, 'at x', tx().toFixed(1), 'y', ty().toFixed(1));
if (!(inAt[0]<8 && !!WORLD.mt1 && !WORLD.climb1 && gaps.every(g=>g<=1.4) && falls.length===0)) errs++;
if (!(allOk && wide[1] && /bank/.test(note) && rode1 && on1 && rode2 && onIsland && /carrot/.test(here) && rode3 && onS && !blownIn)) errs++;
if (!(e.r>MONSTERS.rabbit.stats(UNIT).r && modes.has('dart') && out[0]==='mt2' && !out[1] && state.scene==='rise')) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
