const src = require('./harness.js').drawn;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero;
run(10); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1);
// 1. new quest alert: grand, not held, gone by itself
const T=state.title; console.log('1 new quest alert:', T&&T.style, T&&T.text, '| held', !!(T&&T.hold)); run(60*4.2); console.log('   gone without a key after ~4 s:', !state.title || state.title!==T);
clear();
// 2. mushrooms: glow spends most of its time low, reaches the old ceiling now and then
let n=0, s=0, hi=0, lo=0, mx=0; for(let t=0;t<1800;t+=0.05){ const v=shroomGlow(0.7,t); n++; s+=v; if(v>0.6) hi++; if(v<0.3) lo++; mx=Math.max(mx,v); }
console.log('2 glow over 30 min: mean', (s/n).toFixed(2), '| max', mx.toFixed(2), '| above 0.6', (hi/n*100).toFixed(1)+'%', '| below 0.3', (lo/n*100).toFixed(0)+'%');
// 3. ripples: each its own; strengths under the ceiling, most far under
state.shroomRip={}; state.shroomWoke={}; const seen=new Set(), pats={}, alphas=[];
const t0=state.time; for(let k=0;k<60*120;k++){ state.time=t0+k/60; drawShroomRipples(100,100,UNIT,true,'x'); for(const g of state.shroomRip.x.list) if(!seen.has(g)){ seen.add(g); pats[g.pat]=(pats[g.pat]||0)+1; alphas.push(g.a); } }
alphas.sort((a,b)=>a-b); const med=alphas[alphas.length>>1], p90=alphas[Math.floor(alphas.length*0.9)];
console.log('3 ripples in 2 min (calm):', seen.size, '| patterns', JSON.stringify(pats), '| strength median', med.toFixed(3), 'p90', p90.toFixed(3), 'max', alphas[alphas.length-1].toFixed(3), '(ceiling', SHROOM_RIP_CALM+')');
state.time=t0+200;
// 4. the woods: no logs or ropes, boulders and mud instead
const kinds=new Set(), ropes=[]; for(const id of ['w1','w2','w3']) for(const o of WORLD[id].solids){ if(o.bar) kinds.add(id+':'+o.kind); if(o.rope) ropes.push(id); }
console.log('4 barrier kinds', [...kinds].sort().join(', '), '| ropes', ropes.length, '| mud patches', ['w1','w2','w3'].map(id=>(WORLD[id].mud||[]).length).join('/'));
// 5. no mud anywhere in the woods; a thrown rock that buries itself digs out like any other
console.log('5 mud pits in the woods:', ['w1','w2','w3'].map(id=>(WORLD[id].mud||[]).length).join('/'));
state.carry=null;
// 9. the throw that does it: keystone breaks, the boulders tumble
breakBarrier('crack2','rock'); run(2); console.log('9 keystone hit: the wedged boulders gone', !state.solids.some(o=>o.bar==='crack2' && o.kind==='wedge'));
// 10. the gremlins: run at them, they hop clear every time, then they're gone down the hole
state.cut=null; state.inv.pipTaken=false; state.pip={x:W*0.5,y:H*0.5,show:true,follow:true}; h.x=W*0.15; h.y=H*0.5; startAbduct(); let hops=0, closest=99, lastHop=null;
for(let k=0;k<60*12 && state.cut;k++){ const p=state.pip; const dx=p.x-h.x, dy=p.y-h.y, d=Math.hypot(dx,dy); if(state.cut.t>0.3 && !state.cut.gone) closest=Math.min(closest, d/UNIT); state.keys.arrowright=dx>4; state.keys.arrowleft=dx<-4; state.keys.arrowdown=dy>4; state.keys.arrowup=dy<-4; run(1); if(state.cut&&state.cut.hop&&state.cut.hop!==lastHop){ hops++; lastHop=state.cut.hop; } }
['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false);
console.log('10 chasing the gremlins: hops', hops, '| closest you got', closest.toFixed(2), 'tiles | taken down the hole', state.inv.pipTaken, '| cut over', !state.cut);
clear();
// 11. the sword: hidden until you pull, then a slow, bright reveal
enterScene('w3'); state.enemies=[]; state.inv.sword=false; run(3); clear(); const sw=WORLD.w3.feat.sword;
rtFor('w3').pulled.add('sword'); h.x=sw[0]*W-UNIT; h.y=sw[1]*H; startSwordCut(); const tl=[];
for(let k=0;k<60*8 && state.cut;k++){ run(1); const c=state.cut; if(c && !tl.inHand && state.inv.sword) tl.inHand=c.t.toFixed(2); if(state.title && state.title.text==='THE BLADE' && !tl.title) tl.title=c?c.t.toFixed(2):'end'; }
console.log('11 reveal: sword in hand at', tl.inHand, 's | title at', tl.title, 's | cut ends, sword kept', !state.cut, state.inv.sword);
console.log('12 area line for w3:', WORLD.w3.msg);
console.log('BUILD', BUILD, '| errs', errs);
`);
