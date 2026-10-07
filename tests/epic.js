global.location = { search: '?scene=epic&seed=1000003' };
const src = require('./harness.js').src;
// Build 236 (Ross: "where is the epic scene? playable?", then "move and create"): the canyon, composed in the mocks
// on 7 Oct as the stone's test screen, is a scene of its own (EPIC in mountain.js, src/layouts/epic.js), off the map
// (?scene=epic, ?edit=epic). Played like a person at both screen shapes: parked in the open at 30, 20; walked to the
// cave mouth and in under its roof (the window opens); walked north at the cliff band (its 3-tile face holds you);
// hopped onto the shelf (1.6: a held jump does not get you up, the face holds); walked south at the canyon (you fall
// in and are put back on its rim); the editor opens it and its text holds every plate, the seam and the ravine.
eval(src+`;
let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const h=state.hero, m=MTN.epic, tx=()=>h.x/UNIT, ty=()=>h.y/UNIT, lift=()=>+(h.lift||0).toFixed(2);
const put=(x,y)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=0; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; run(2); };
const go=(X,Y,secs=4)=>{ for(let t=0;t<60*secs&&Math.hypot(X-tx(),Y-ty())>0.25;t++){ const dx=X-tx(), dy=Y-ty(); state.keys.arrowright=dx>0.1; state.keys.arrowleft=dx<-0.1; state.keys.arrowdown=dy>0.1; state.keys.arrowup=dy<-0.1; run(1); } off(); run(2); };
const out=[];
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  begin(); state.intro=null; state.pip=null; startTestScene('epic', 30/64, 20/40); run(5); state.texts=[]; state.enemies=[];
  const pl=platesLay(m), at0=[+tx().toFixed(1), +ty().toFixed(1)], on0=lift();
  put(22.7,23.5); go(22.7,18.0); const inCave=[+ty().toFixed(1), lift(), !!state.mtn.win];                        // in at the mouth, under the roof (1.8 up)
  put(31,13.5); go(31,8.5,3); const atBand=[+ty().toFixed(1), lift()];                                           // north at the cliff band: its foot holds you
  put(40,22.5); go(40,19.5,2); state.keys.arrowup=true; state.keys.btnjump=true; run(30); state.keys.btnjump=false; run(20); off(); run(10); const atShelf=[+ty().toFixed(1), lift()];   // a held jump at the 1.6 shelf: no
  put(14,26.5); const startY=ty(); let dropped=false, deepest=startY; { const f0=update; for(let t=0;t<180;t++){ state.keys.arrowdown=true; run(1); if(h.falling>0) dropped=true; deepest=Math.max(deepest,ty()); } off(); run(90); } const fell=state.scene==='epic' && (dropped || deepest-startY<4) && ty()<deepest+0.01;      // south into the canyon: you drop in (or its edge holds you) and are back on the rim
  const t0=Date.now(); for(let k=0;k<10;k++) draw(); const ms=(Date.now()-t0)/10;
  out.push({w, at0, on0, inCave, atBand, atShelf, fell, ms, plates:pl.list.length, pits:pl.pits.length, seams:pl.seams.length});
  console.log(w+'x'+hh+': parked at', at0.join(', '), 'ground', on0, '| in the cave: y', inCave[0], 'ground', inCave[1], 'window', inCave[2], '| at the band: stopped at y', atBand[0], 'ground', atBand[1], '| a held jump at the shelf: y', atShelf[0], 'ground', atShelf[1], '| walked into the canyon: dropped', dropped, 'furthest y', deepest.toFixed(1), 'from', startY.toFixed(1), 'back at y', ty().toFixed(1), fell, '| laid: plates', pl.list.length, 'pits', pl.pits.length, 'seams', pl.seams.length, '| a frame', ms.toFixed(1), 'ms (fake canvas)');
  if (!(at0[0]===30 && Math.abs(at0[1]-20)<0.5 && on0===0 && inCave[0]<19 && inCave[1]===0 && inCave[2] && atBand[0]>8.3 && atBand[1]===0 && atShelf[1]===0 && fell && pl.list.length===8 && pl.pits.length===2 && pl.seams.length===0 && ms<40)) errs++; }
// the editor: ?edit=epic opens it, its text holds what was laid
startEdit('epic'); run(3); const txt=editText(state.edit.layout,'epic'), kept=['"seed": 11','"seed": 41','"top": 5.4','"slope"','"w": 2.8'].map(k=>txt.includes(k));
console.log('the editor: open', !!state.edit, '| its text holds plates 0 and 7, the seam, the ravine', kept.join(', '));
if (!(state.edit && kept[0] && kept[1] && kept[2] && kept[4])) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
