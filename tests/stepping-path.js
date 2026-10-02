const src = require('./harness.js').src;
// The stepping path (mt2, build 211): the wind shelf's pass leads onto it; the drop eats the middle wall to wall and a
// chain of islands laid by genIslands (each at least 2 tiles across, each gap a sure running jump) is the only way on;
// the dare, an island off the chain a long jump away, carries carrots; a jump short of an island drops you in and the
// last island takes you back; the pass at the far end leads onto climb3. Played like a person: lined up, a short run, jump.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT, h=state.hero, m=M2, sc=()=>sceneDef();
run(5); state.intro=null; state.pip=null; state.texts=[];
// 1. the wind shelf's pass leads onto the stepping path, a fixed mountain screen the width of the view
startTestScene('mt1', M1.outX/M1.len, (M1.D-1)/M1.D); run(5); state.keys.arrowdown=true; run(90); off(); run(10); const inAt=[tx(),ty()];
console.log('1 through the wind shelf\\'s pass ->', state.scene, 'at x', inAt[0].toFixed(1), 'y', inAt[1].toFixed(1), '| fixed view p', state.mtn && state.mtn.p, 'zoom', mtnZoom(state.mtn.p, m).toFixed(2), '| climb2 in the world:', !!WORLD.climb2, '| scene', m.len+'x'+m.D);
state.enemies=[];
// 2. the islands as laid: sizes, every gap along the chain, the first hop off the west lip, the last onto the south bank, the dare
const ch=m.isls.filter(i=>i.chain), dare=m.isls.find(i=>i.dare), edge=(a,b)=>islGapTo(m,a,b);   // (the gap on the ground, lined up on the next one's middle)
const gaps=ch.slice(1).map((b,k)=>edge(ch[k],b)); const across=ch.map(i=>(i.r*2).toFixed(1));
const first=islGapTo(m,{x:m.drop.wide[0]-1,y:m.pathY(m.drop.wide[0]-1),r:0},ch[0]), lastGap=ravGapOut(m,ch[ch.length-1],0,1), dareGap=dare?Math.min(...ch.map(i=>edge(i,dare))):9;
console.log('2 islands', m.isls.length, '(chain '+ch.length+') across:', across.join(', '), '| gaps:', gaps.map(g=>g.toFixed(2)).join(', '), '| west lip to the first', first.toFixed(2), '| the last to the south bank', lastGap.toFixed(2), '| the dare', dareGap.toFixed(2), 'off the chain | reach', jumpReach().toFixed(2));
// 3. the north bank east to the lip, no fall; then the chain, hop by hop: line up on the next island, run, jump at the lip, steer in the air
const falls=[]; const goTo=(X,Y,secs,until)=>{ let t=0; while(t<60*secs && !until()){ const dx=X-tx(), dy=Y-ty(); state.keys.arrowright=dx>0.15; state.keys.arrowleft=dx<-0.15; state.keys.arrowdown=dy>0.15; state.keys.arrowup=dy<-0.15; run(1); t++; if(h.falling>0){ falls.push(tx().toFixed(1)+','+ty().toFixed(1)); while(h.falling>0) run(1); } } off(); };
h.x=inAt[0]*UNIT; h.y=3*UNIT; h.vx=h.vy=0; h.falling=0; goTo(9, m.pathY(9), 14, ()=>tx()>8.8);
console.log('3 the north bank to x', tx().toFixed(1), 'y', ty().toFixed(1), '| falls', falls.length);
const hop=(to, ahead=0.45)=>{ let t=0, jumped=false; { const i=m.isls.find(i=>islField(i,tx(),ty())<0); if(i) goTo(i.x, i.y, 3, ()=>Math.hypot(tx()-i.x,ty()-i.y)<0.15); }   // lined up: from the island's middle
  while(t<240){ const dx=to.x-tx(), dy=to.y-ty(), L=Math.hypot(dx,dy)||1, ux=dx/L, uy=dy/L; state.keys.arrowright=dx>0.12; state.keys.arrowleft=dx<-0.12; state.keys.arrowdown=dy>0.12; state.keys.arrowup=dy<-0.12;   // steered at the target, on the ground and in the air
    if(!jumped && h.z<=0 && isChasm(h.x+ux*UNIT*ahead, h.y+uy*UNIT*ahead)){ state.keys.btnjump=true; run(1); state.keys.btnjump=false; jumped=true; }
    run(1); t++; if(h.falling>0) break; if(jumped && h.z<=0 && h.vz<=0 && !isChasm(h.x,h.y)){ off(); run(2); break; } }
  off(); const fell=h.falling>0; while(h.falling>0) run(1); return [islField(to,tx(),ty())<0, fell]; };
const chain=[]; for(const i of ch){ const [on,fell]=hop(i); chain.push(on&&!fell?'ok':fell?'fell':'short'); }
const chainOk=chain.every(c=>c==='ok'), atLast=[tx(),ty()];
console.log('4 the chain:', chain.join(' '), '| on the last island at', atLast[0].toFixed(1)+','+atLast[1].toFixed(1));
// 5. off the last island south onto the bank, east along it and through the pass onto climb3
const bank=hop({x:ch[ch.length-1].x, y:ch[ch.length-1].y+ch[ch.length-1].r+2.2, r:0}); const onBank=!bank[1] && !isChasm(h.x,h.y) && !onIsl(m,tx(),ty()), bankAt=ty();
falls.length=0; goTo(m.outX, m.pathY(m.outX), 20, ()=>tx()>m.outX-0.4); state.keys.arrowdown=true; run(60*4); off(); run(5); const out=[state.scene, !!state.climb];
console.log('5 onto the south bank', onBank, 'at y', bankAt.toFixed(1), '| east and through the pass ->', out[0], '(climb running:', out[1]+') | falls', falls.length);
// 6. the dare: from its island, the long jump out to it; the carrots are there. Then a jump out into the drop from the dare's
// far side: the fall, and the note; back on the dare (the last safe spot)
state.climb=null; enterScene('mt2', 5/m.len, 3/m.D); run(3); state.enemies=[]; const from=dare&&dare.from||ch[2];
h.x=from.x*UNIT; h.y=from.y*UNIT; h.vx=h.vy=0; h.safe=[h.x/W,h.y/H]; run(3); const d1=dare?hop(dare, 0.12):[false,true]; /* (the dare: jumped from the lip itself) */ const here=state.items.filter(i=>Math.hypot(i.x-h.x,i.y-h.y)<UNIT*1.6).map(i=>i.type).sort().join(",");
run(20); const away=Math.sign(dare.y-m.mid)||1; state.texts=[]; const d2=hop({x:dare.x, y:dare.y+away*6, r:0}); const note=(state.texts.find(x=>/bank|Ooof/.test(x.text))||{}).text||''; run(2); const backOn=islField(dare,tx(),ty())<0;
console.log('6 the dare: landed', d1[0], '(fell', d1[1]+') | on it:', here, '| a jump off its far side: fell', d2[1], '| note', JSON.stringify(note), '| back on the dare', backOn);
// 7. the wind on an island: 25 s of gusts standing on the biggest, not shoved off
const big=ch.reduce((a,b)=>b.r>a.r?b:a); h.x=big.x*UNIT; h.y=big.y*UNIT; h.vx=h.vy=0; h.safe=[h.x/W,h.y/H]; let shoved=false; for(let k=0;k<60*25;k++){ run(1); if(h.falling>0||isChasm(h.x,h.y)){shoved=true;break;} }
console.log('7 25 s on the biggest island (' + (big.r*2).toFixed(1) + ' across): shoved off', shoved, '| still at', tx().toFixed(1)+','+ty().toFixed(1));
// 8. back north from the way in to the wind shelf
while(h.falling>0) run(1); enterScene('mt2', m.inX/m.len, 2/m.D); run(5); state.keys.arrowup=true; run(90); off(); run(10);
console.log('8 north from the way in ->', state.scene);
if (!(state.scene==='mt1' && !WORLD.climb2 && inAt[0]<8 && m.isls.length>=6 && ch.every(i=>i.r>=1) && gaps.every(g=>g>=1.1&&g<=1.4) && first<1.45 && lastGap<1.45 && dareGap>1.5 && dareGap<1.85)) errs++;
if (!(falls.length===0 && chainOk && onBank && out[0]==='climb3' && out[1])) errs++;
if (!(d1[0] && /carrot/.test(here) && d2[1] && /bank|Ooof/.test(note) && backOn && !shoved)) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
