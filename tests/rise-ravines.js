// build 208: the rise reworked. Three ravines from the generator, none with a floor to see: the big one in from the
// north edge down to the reeds (with them it shuts the way east), a slit edge to edge at x 40 jumped where the path
// crosses it, a short one in from the north at x 58. No walls of stone: the screen's edges hold, and east of its foot
// the mountain itself holds, except along the way through the pass. Nothing stands in a ravine.
const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT;
const at=(x,y)=>{ const h=state.hero; h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.falling=0; h.safe=null; run(3); };
const hold=(k,n)=>{ state.keys[k]=true; run(n); off(); };
run(5); state.intro=null; state.texts=[]; state.pip=null;
startTestScene('rise', 10/RISE.len, RISE.pathY(10)/RISE.D); run(5); state.enemies=[];
// 1. the ravines: three, generated, bottomless; the big one reaches from off the north edge to under the reeds
const ravs=RISE.ravs, big=ravs[0].spine[0], tail=big[big.length-1], widest=Math.max(...big.map(q=>q[2]));
const dropAt=(x,y)=>isChasm(x*UNIT, y*UNIT); const slit=ravs[1].spine[0], slitX=y=>slit.reduce((b,q)=>Math.abs(q[1]-y)<Math.abs(b[1]-y)?q:b)[0];
console.log('1 ravines:', ravs.length, '| all bottomless:', ravs.every(r=>r.floor===false), '| the big one: from y', big[0][1].toFixed(1), 'to', tail[1].toFixed(1), 'at x', tail[0].toFixed(1), '(reeds at', RISE.barX+') | widest', (widest*2).toFixed(1), 'tiles across | a drop at (16, 5):', dropAt(16.5,5), '| the slit at y 5: x', slitX(5).toFixed(1), 'a drop there:', dropAt(slitX(5),5), '| narrow at the path: wall to wall', (2*ravField(ravs[1], slitX(RISE.pathY(40)), RISE.pathY(40), 'p')[2]).toFixed(1), 'tiles');
// 2. nothing stands in a ravine: not a stone, a tree, a tuft, a clump of tall grass, a rabbit
const land=mtnLand(RISE), inGap=land.solids.filter(p=>mtnGap(RISE,p.x,p.y,p.r)).length+land.deco.filter(p=>mtnGap(RISE,p.x,p.y,0.2)).length;
const grassIn=WORLD.rise.feat.plants.filter(([fx,fy])=>mtnGap(RISE,fx*RISE.len,fy*RISE.D,0.6)).length, rabIn=WORLD.rise.spawns.filter(s=>mtnGap(RISE,s.fx*RISE.len,s.fy*RISE.D,0.5)).length;
console.log('2 standing in a ravine: props', inGap, '| tall grass', grassIn, '| spawns', rabIn, '| solids on the rise', land.solids.length);
// 3. the way east is shut: walk east into the big ravine on the path and north of it: you fall and come back up the bank; the
// reeds hold the rest; a jump at this vigor reaches less than the ravine is wide
let falls=0; for (const y of [RISE.pathY(12), 4, 9]) { at(11, y); hold('arrowright', 240); if (state.hero.fallKind==='pit' || tx()<RISE.barX) falls++; }
at(14, 24); hold('arrowright', 240); const reedsStop=tx();
console.log('3 walking east: fell or held', falls, 'of 3 | south of the ravine the reeds stop you at x', reedsStop.toFixed(1), '| jump reach', jumpReach().toFixed(1), 'tiles, the ravine', (widest*2).toFixed(1));
// 4. the slit: walk into it and you fall; a running jump at the path's narrow gets across
startTestScene('rise', 36/RISE.len, RISE.pathY(36)/RISE.D); run(5); state.enemies=[];
at(slitX(4)-3, 4); hold('arrowright', 120); const slitFall=state.hero.fallKind==='pit' || tx()<slitX(4);
at(37.5, RISE.pathY(37.5)); state.keys.arrowright=true; let jumped=false; for (let k=0;k<240;k++){ if(!jumped && !isChasm(state.hero.x,state.hero.y) && isChasm(state.hero.x+UNIT*1.1, state.hero.y)) { state.keys[' ']=true; run(1); state.keys[' ']=false; jumped=true; } run(1); } off(); const jumpedTo=tx();
console.log('4 the slit: walking in off the path, fell or held:', slitFall, '| at the path, jumped and reached x', jumpedTo.toFixed(1), '(the slit at 40)');
// 5. the mountain holds: east of the foot you are put back, except along the way; walking the way reaches the wind shelf
at(70, 5); hold('arrowright', 240); const stop1=[tx(), RISE.foot(ty())]; at(70, 24); hold('arrowright', 240); const stop2=[tx(), RISE.foot(ty())];
at(RISE.foot(RISE.pathY(74))-1, RISE.pathY(74)); hold('arrowright', 300); const inPass=tx();
const stray=[tx(), ty()]; state.keys.arrowup=true; run(120); off(); const north=ty(); const pd=RISE.pathD(tx(), ty());
console.log('5 the mountain: held at x', stop1[0].toFixed(1), '(foot', stop1[1].toFixed(1)+') and x', stop2[0].toFixed(1), '(foot', stop2[1].toFixed(1)+') | along the way: in to x', inPass.toFixed(1), '| north off the way from y', stray[1].toFixed(1), 'to', north.toFixed(1), 'within', pd.toFixed(1), 'of the path');
// 6. a drawn frame with the ravines (the harness has no Path2D: the hole is skipped, nothing throws); the tiles overlay
state.settings.tiles=true; at(14, 8); run(5); state.settings.tiles=false;
const okRav = ravs.length===3 && ravs.every(r=>r.floor===false) && big[0][1]<0 && tail[1]>17 && Math.abs(tail[0]-RISE.barX)<3 && dropAt(16.5,5) && dropAt(slitX(5),5) && 2*ravField(ravs[1], slitX(RISE.pathY(40)), RISE.pathY(40), 'p')[2]<1.35;
const okGap = inGap===0 && grassIn===0 && rabIn===0;
const okWay = falls===3 && reedsStop<RISE.barX && jumpReach()<widest*2 && slitFall && jumpedTo>slitX(RISE.pathY(40))+1;
const okMtn = stop1[0]<=stop1[1]+0.4 && stop2[0]<=stop2[1]+0.4 && inPass>RISE.foot(RISE.pathY(74))+2 && pd<=2.3;
if (!okRav) errs++; if (!okGap) errs++; if (!okWay) errs++; if (!okMtn) errs++;
console.log('6 drew with the overlay | ok: ravines', okRav, 'nothing inside', okGap, 'the way shut', okWay, 'the mountain holds', okMtn);
// 7. (build 209) smooth: once on the screen, a second of play and drawing never measures a spine (the test reads the
// grid made on the way in) and never reads the canvas back
{ let calls=0; const f0=ravField; ravField=(...a)=>{ calls++; return f0(...a); }; let reads=0; const g0=ctx.getImageData; ctx.getImageData=(...a)=>{ reads++; return g0 ? g0.apply(ctx,a) : null; };
  at(12, 10); state.keys.arrowright=true; for (let k=0;k<60;k++){ run(1); draw(); } off(); ravField=f0; ctx.getImageData=g0;
  console.log('7 a second walking by the big ravine: spine measured', calls, 'times, canvas read back', reads, 'times'); if (calls || reads) errs++; }
// 8. (build 210) the brink lies on the ground: painted before you and before the reeds, wherever you stand by it
{ const P0=typeof Path2D==='undefined'?undefined:Path2D; globalThis.Path2D=function(){ return {moveTo(){},lineTo(){},closePath(){},rect(){}}; };
  const order=[], b0=drawMtnBrink, h0=drawHero, s0=drawSolid; drawMtnBrink=(...a)=>{ order.push('brink'); return b0(...a); }; drawHero=(...a)=>{ order.push('hero'); return h0(...a); }; drawSolid=(o,...a)=>{ if (o && o.kind==='reeds') order.push('reeds'); return s0(o,...a); };
  const spots=[[14.4, 6], [12.5, 2], [RISE.barX-0.8, 16.5]]; let ok=0;
  for (const [x,y] of spots) { at(x,y); order.length=0; drawMtn(); const b=order.indexOf('brink'), hh=order.indexOf('hero'), rr=order.indexOf('reeds'); if (b>=0 && b<hh && (rr<0 || b<rr)) ok++; }
  drawMtnBrink=b0; drawHero=h0; drawSolid=s0; globalThis.Path2D=P0;
  console.log('8 the brink painted before you and the reeds at', ok, 'of', spots.length, 'spots by the big ravine'); if (ok!==spots.length) errs++; }
console.log('BUILD', BUILD, '| errs', errs);
`);
