const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\n').slice(1,3).join(' | '));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero;
// 1. the riverbank: three stones lying about, the rest in a boulder you pound apart
inv.story=STORY.gather; enterScene('riverbank'); state.enemies=[]; run(5);
console.log('1 stones lying on the riverbank:', state.items.filter(i=>i.type==='stone').length, '| the boulder by the water:', state.solids.filter(s=>s.bar==='stonecrag').map(s=>s.size+' tiles').join(''));
const c=state.solids.find(s=>s.bar==='stonecrag');
// pounding by it does nothing now; it takes a thrown rock
h.x=c.x-c.r-UNIT*0.9; h.y=c.y; run(3); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40);
console.log('   a pound beside the boulder breaks it?', broken('riverbank','stonecrag'));
// the stuck stone nearby: stomp to loosen, hold F, rock, pull up
(state.inv.pipTips=state.inv.pipTips||{})['stone-loosen']=true; const rk=WORLD.riverbank.feat.riverRock; h.x=rk[0]*W-UNIT*1.2; h.y=rk[1]*H; h.fx=1; h.fy=0; run(3); state.keys[' ']=true; run(1); state.keys[' ']=false; run(8); state.keys.f=true; run(1); state.keys.f=false; run(40);
const loose=!!rtFor('riverbank').flags.knocked_riverrock; h.x=rk[0]*W-UNIT*1.2; h.y=rk[1]*H; run(3);
state.keys.f=true; run(5); for(let i=0;i<8;i++){ state.keys[i%2?'arrowright':'arrowleft']=true; run(2); state.keys.arrowleft=state.keys.arrowright=false; run(4); } state.keys.arrowup=true; run(2); state.keys.arrowup=false; run(4); state.keys.f=false; run(10);
console.log('   stuck stone: loosened', loose, '| carrying it', state.carry);
let throws=0; const throwAtC=()=>{ if(!state.carry){ const it=state.items.find(i=>i.type==='bigrock'); if(!it) return false; h.x=it.x-UNIT*0.8; h.y=it.y; run(2); press('f'); run(3); } const cc=state.solids.find(s=>s.bar==='stonecrag'); if(!cc) return false; const side=cc.x>W/2?-1:1; h.x=cc.x+side*(cc.r+UNIT*3); h.y=cc.y; h.fx=-side; h.fy=0; run(2); state.keys.f=true; for(let k=0;k<90;k++){ run(1); const [lx,ly]=rockLanding(h); if (Math.hypot(lx-cc.x,ly-cc.y)<cc.r*0.4) break; } state.keys.f=false; run(90); throws++; return true; };
while(!broken('riverbank','stonecrag') && throws<6 && throwAtC()) {}
console.log('   broken after', throws, 'throws | smooth stones lying there:', state.items.filter(i=>i.type==='stone').length);
// 2. the first woods screen: a gremlin peeks from behind the way-out boulder, and ducks away when you come
inv.story=STORY.adventure; inv.sword=true; state.pip=null; enterScene('w1'); state.enemies=[]; run(3); const pk=WORLD.w1.feat.peek;
const before=!rtFor('w1').flags.peekGone; h.x=pk[0]*W-UNIT*5; h.y=pk[1]*H+UNIT*2; run(30); console.log('2 peeking at first:', before, '| ducked when you came close:', !!rtFor('w1').flags.peekGone);
// 3. the second woods screen: halfway across, one runs at you, leaps away from every swing, then runs back east
enterScene('w2'); state.enemies=[]; run(3); h.x=W*0.5; h.y=H*0.5; run(60*2); const t=state.enemies.find(e=>e.taunter);
console.log('3 a gremlin ran at you:', !!t, t?'| stopped '+(Math.hypot(t.x-h.x,t.y-h.y)/UNIT).toFixed(1)+' tiles away':'');
let swings=0, hits=0; for(let i=0;i<8 && state.enemies.includes(t);i++){ h.fx=Math.sign(t.x-h.x)||1; state.atkCool=0; h.vig=maxVig(); const hp0=t.hp; press('f',2); run(40); swings++; if(t.hp<hp0) hits++; if(t.x<W) { h.x+= (t.x-h.x)*0.6; h.y+=(t.y-h.y)*0.6; } }
for(let k=0;k<60*6 && state.enemies.includes(t);k++) run(1);
console.log('   swings', swings, '| hits landed', hits, '| leaps', t.leaps, '| ran back east and gone:', !state.enemies.includes(t), '| once only:', !!rtFor('w2').flags.taunted);
console.log('BUILD', BUILD, '| errs', errs);
`);
