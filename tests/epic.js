global.location = { search: '?scene=epic&seed=1000003' };
const src = require('./harness.js').src;
// Build 236 (Ross: "where is the epic scene? playable?", then "move and create"): the canyon, composed in the mocks
// on 7 Oct as the stone's test screen, is a scene of its own (EPIC in mountain.js, src/layouts/epic.js), off the map
// (?scene=epic, ?edit=epic). Played like a person at both screen shapes: parked in the open at 28, 20; walked to the
// cave mouth and in under its roof (the window opens); walked north at the cliff band (its 3-tile face holds you);
// hopped onto the shelf (1.6: a held jump does not get you up, the face holds); walked south at the canyon (you fall
// in and are put back on its rim); the editor opens it and its text holds every plate, the seam and the ravine.
// 237 (Ross: cannot jump onto platforms, and clipping behind them): every face here is over the tile a held jump
// reaches, so each has steps of 0.5 to 0.8 (layouts/epic.js 8 to 18), climbed here as a person would, a held jump
// wherever an edge stops you; and at the shelf's south face, which runs south of you further east, you are drawn
// after it and nothing hides you (plateHeroKey).
eval(src+`;
let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const h=state.hero, m=MTN.epic, tx=()=>h.x/UNIT, ty=()=>h.y/UNIT, lift=()=>+(h.lift||0).toFixed(2);
const put=(x,y)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=0; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; run(2); };
const go=(X,Y,secs=4)=>{ for(let t=0;t<60*secs&&Math.hypot(X-tx(),Y-ty())>0.25;t++){ const dx=X-tx(), dy=Y-ty(); state.keys.arrowright=dx>0.1; state.keys.arrowleft=dx<-0.1; state.keys.arrowdown=dy>0.1; state.keys.arrowup=dy<-0.1; run(1); } off(); run(2); };
const out=[];
for (const [w,hh] of [[1280,800],[390,844]]) { window.innerWidth=w; window.innerHeight=hh; resize();
  begin(); state.intro=null; state.pip=null; startTestScene('epic', 28/64, 20/40); run(5); state.texts=[]; state.enemies=[];
  const pl=platesLay(m), at0=[+tx().toFixed(1), +ty().toFixed(1)], on0=lift();
  put(22.7,23.5); go(22.7,18.0); const inCave=[+ty().toFixed(1), lift(), !!state.mtn.win];                        // in at the mouth, under the roof (1.8 up)
  put(31,13.5); go(31,8.5,3); const atBand=[+ty().toFixed(1), lift()];                                           // north at the cliff band: its foot holds you
  put(40,22.5); go(40,19.5,2); state.keys.arrowup=true; state.keys.btnjump=true; run(30); state.keys.btnjump=false; run(20); off(); run(10); const atShelf=[+ty().toFixed(1), lift()];   // a held jump at the 1.6 shelf: no
  put(14,26.5); const startY=ty(); let dropped=false, deepest=startY; { const f0=update; for(let t=0;t<180;t++){ state.keys.arrowdown=true; run(1); if(h.falling>0) dropped=true; deepest=Math.max(deepest,ty()); } off(); run(90); } const fell=state.scene==='epic' && (dropped || deepest-startY<4) && ty()<deepest+0.01;      // south into the canyon: you drop in (or its edge holds you) and are back on the rim
  const t0=Date.now(); for(let k=0;k<10;k++) draw(); const ms=(Date.now()-t0)/10;
  out.push({w, at0, on0, inCave, atBand, atShelf, fell, ms, plates:pl.list.length, pits:pl.pits.length, seams:pl.seams.length});
  console.log(w+'x'+hh+': parked at', at0.join(', '), 'ground', on0, '| in the cave: y', inCave[0], 'ground', inCave[1], 'window', inCave[2], '| at the band: stopped at y', atBand[0], 'ground', atBand[1], '| a held jump at the shelf: y', atShelf[0], 'ground', atShelf[1], '| walked into the canyon: dropped', dropped, 'furthest y', deepest.toFixed(1), 'from', startY.toFixed(1), 'back at y', ty().toFixed(1), fell, '| laid: plates', pl.list.length, 'pits', pl.pits.length, 'seams', pl.seams.length, '| a frame', ms.toFixed(1), 'ms (fake canvas)');
  if (!(at0[0]===28 && Math.abs(at0[1]-20)<0.5 && on0===0 && inCave[0]<19 && inCave[1]===0 && inCave[2] && atBand[0]>8.3 && atBand[1]===0 && atShelf[1]===0 && fell && pl.list.length===19 && pl.pits.length===2 && pl.seams.length===0 && ms<40)) errs++; }
// the ways up, climbed (237): steer at each spot, a held jump where an edge stops you
{ window.innerWidth=1280; window.innerHeight=800; resize(); begin(); state.intro=null; state.pip=null; startTestScene('epic', 28/64, 20/40); run(5); state.enemies=[]; const pl=platesLay(m);
  const fresh=()=>{ h.vig=maxVig(); h.falling=0; };   // (the canyon's fall costs vigor, and a tired hero jumps lower: each climb starts rested)
  const go=(X,Y,secs=5)=>{ let t=0, last=[tx(),ty()], still=0; while(t<60*secs && Math.hypot(X-tx(),Y-ty())>0.25){ const dx=X-tx(), dy=Y-ty(); state.keys.arrowright=dx>0.1; state.keys.arrowleft=dx<-0.1; state.keys.arrowdown=dy>0.1; state.keys.arrowup=dy<-0.1; run(1); t++; still=Math.hypot(tx()-last[0],ty()-last[1])<0.01?still+1:0; last=[tx(),ty()];
      const L0=Math.hypot(dx,dy)||1, ahead=plateTopAt(pl,tx()+dx/L0*0.55,ty()+dy/L0*0.55); if(h.z<=0 && ahead>(h.lift||0)+0.26) still=99;
      if(still>4 && h.z<=0){ state.keys.btnjump=true; for(let k=0;k<20;k++) run(1); state.keys.btnjump=false; t+=20; still=0; } } off(); for(let k=0;k<40&&(h.z>0||h.vz>0);k++) run(1); run(3); return lift(); };
  const route=(start,pts)=>{ fresh(); put(...start); h.lift=plateTopAt(pl,...start); return pts.map(([x,y])=>go(x,y)); };
  const ridge=route([14,22],[[13.0,19.6],[11.2,15.5]]), band=route([11,11],[[12.6,9.6],[13.6,8.4],[14.8,7.2],[17.5,6.5],[19.0,7.0],[20.4,6.6],[24,5.5]]),
    shelf=route([30,21],[[30.6,18.9],[31,16.6],[31.5,14.6],[33.6,13.6],[37,12.2]]), cave=route([14.5,23],[[16.8,21.3],[18.0,20.6],[19.3,20.4],[19.8,21.6],[20.6,21.2],[21.5,20.2],[22.7,17]]);
  const up=a=>a.every((v,i)=>!i||v>=a[i-1]-1e-6);
  console.log('the ways up: the ridge', ridge.join(' > '), '| the band', band.join(' > '), '| the shelf and its tier', shelf.join(' > '), '| the cave', cave.join(' > '));
  if (!(up(ridge) && ridge.pop()===1.2 && up(band) && band.pop()===5.4 && up(shelf) && shelf.pop()===3 && up(cave) && cave.pop()===2.8)) errs++;
  // the shelf's south face, jumped at: you are drawn after the shelf and nothing covers you (it reaches y 22.7 further east)
  let worst=0; for (const x of [33,35,38,41]) { put(x,21); state.keys.arrowup=true; run(60); state.keys.btnjump=true; for(let k=0;k<30;k++){ run(1); worst=Math.max(worst,state.mtn.cover||0); } state.keys.btnjump=false; state.keys.arrowup=false; run(30); }
  console.log('at the shelf\\'s south face, jumping: the most of you hidden', Math.round(worst*100)+'%', '(the x-ray needs', MTN_XRAY*100+'%)');
  if (!(worst < 0.3)) errs++; }
// the editor: ?edit=epic opens it, its text holds what was laid
startEdit('epic'); run(3); const txt=editText(state.edit.layout,'epic'), kept=['"seed": 11','"seed": 41','"top": 5.4','"slope"','"w": 2.8'].map(k=>txt.includes(k));
console.log('the editor: open', !!state.edit, '| its text holds plates 0 and 7, the seam, the ravine', kept.join(', '));
if (!(state.edit && kept[0] && kept[1] && kept[2] && kept[4])) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
