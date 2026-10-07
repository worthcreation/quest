global.location = { search: '?scene=epic&seed=1000003' };
const src = require('./harness.js').drawn;
// Build 239 (Ross, two screenshots in the canyon: clipping behind what should be a jumpable plate): you are drawn after
// every plate wholly north of your feet that would cover you. Two causes, each fixed in drawMtn: (1) a boulder south of
// you whose turn came before a plate behind you (the shelf's step shares the bent shelf's turn, 22.73; the boulder at
// 30, 21 is 21.9): the stone is now raised to just after you; (2) a plate reaching south of your body edge whose turn
// came just before one behind you: plateHeroPick takes the order that hides less of you wrongly. Spots from a scan of
// the canyon at every quarter tile (186 bad before, 7 after: the 7 are wedged between a low plate in front and a taller
// one behind on the screen, list (ai)). Then walked like a person from the start, east past the step: never hidden.
eval(src + `;
let errs=0; begin(); state.intro=null; state.pip=null; startTestScene('epic', 28/64, 20/40); for(let k=0;k<4;k++){update(1/60);draw();} state.enemies=[]; state.texts=[];
DRAW_SCENE_STRIDE=1; const m=MTN.epic, pl=platesLay(m), h=state.hero, tx=()=>h.x/UNIT, ty=()=>h.y/UNIT;
let seq=[]; const p0=drawPlate, h0=drawHero; drawPlate=(mm,p,...a)=>{ seq.push(p); return p0(mm,p,...a); }; drawHero=(...a)=>{ seq.push('hero'); return h0(...a); };
const pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,state.mtn);
// the plates painted after you that stand wholly north of your feet and cover a sixth of you or more
const wrong=(x,y,hz)=>{ seq=[]; draw(); const hi=seq.indexOf('hero'); if (hi<0) return ['not drawn']; const [X,Y]=pr(x,y,hz), U=Math.abs(pr(x,y,0)[1]-pr(x,y,1)[1]), out=[];
  for (const q of seq.slice(hi+1)) { if (q==='hero'||plateTop(q)<=hz+0.05||q.base>=hz+PL_HEAD-1e-6) continue;
    let south=false; for (let xx=x-PL_BODY; xx<=x+PL_BODY+1e-6&&!south; xx+=PL_BODY/2) for (let yy=y+0.15; yy<=q.box[3]+1e-6; yy+=0.1) if (plateHas(q,xx,yy)) { south=true; break; } if (south) continue;
    const T=q.P.map(([a,b])=>pr(a,b,plateTop(q))), F=q.P.map(([a,b])=>pr(a,b,q.base)); let hit=0;
    for (let i=0;i<6;i++) for (let j=0;j<6;j++){ const px=X+U*(-0.4+0.8*(i+0.5)/6), py=Y+U*(-1+(j+0.5)/6); let inn=plateIn(T,px,py)||plateIn(F,px,py); for(let k=0;k<T.length&&!inn;k++){ const l=(k+1)%T.length; if(plateIn([T[k],T[l],F[l],F[k]],px,py)) inn=true; } if(inn) hit++; }
    if (hit/36>=0.15) out.push(q.li); }
  return out; };
const stand=(x,y)=>{ const hz=plateTopAt(pl,x,y); h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=hz; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; h.falling=0; mtnCamera(0,state.mtn,true); return hz; };
// 1. the scan's worst spots (the boulder by the shelf's step; the band's foot; on the band; the ridge's foot)
const spots=[[29.75,19.25],[29.75,19.5],[30,19.5],[28.25,8.25],[28.5,8.25],[28.25,7.5],[14,9],[14.25,9],[12.25,8.75],[15.5,8]], res=[];
for (const [x,y] of spots) { const hz=stand(x,y), w=wrong(x,y,hz); res.push(x+','+y+(w.length?' behind '+w.join('+'):' ok')); if (w.length) errs++; }
console.log('1 the scan\\'s worst spots:', res.join(' | '));
// 2. walked from the start east along the step's south side and back, the x-ray never on and never behind the step or shelf
{ stand(28,20.6); let hidden=0, worst=0, frames=0; const walk=(k,n)=>{ state.keys[k]=true; for(let i=0;i<n;i++){ update(1/60); const w=wrong(tx(),ty(),h.lift||0); frames++; if(w.length) hidden++; worst=Math.max(worst,state.mtn.cover||0); } state.keys[k]=false; };
  walk('arrowright',90); walk('arrowup',20); walk('arrowleft',90);
  console.log('2 walked past the step: frames', frames, 'drawn behind a plate', hidden, '| most of you covered', Math.round(worst*100)+'%', '(the x-ray needs', MTN_XRAY*100+'%)', '| ended at', tx().toFixed(1), ty().toFixed(1));
  if (hidden || worst>=MTN_XRAY) errs++; }
drawPlate=p0; drawHero=h0;
console.log('BUILD', BUILD, '| errs', errs);
`);
