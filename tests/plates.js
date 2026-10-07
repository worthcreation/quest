const src = require('./harness.js').drawn;
// The plate (build 212, plates.js): the mountain's stone kind, laid on mt2's banks as a test layout. The outline is
// worn and squarish from its seed; one shape (plateHas) for drawing and the hold; stacks add their thicknesses,
// a pit through a stack drops to its floor; kinds by thickness; the one projection pushes what stands above the
// camera's ground out from the screen's centre (and nothing on a screen without an eye); faces draw north only; a
// seam stays under half a tile. The hero (213) walks up a step, hops or high-hops onto a plate, is held by a face, drops
// off an edge and out of a pit's floor with a held jump. Played like a person: steered, jumping where an edge stops him.
eval(src+`;
// (238) run steps without drawing: the checks that read the picture draw for themselves (the frame cost, xr, the painters)
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT, h=state.hero, m=M2;
run(5); state.intro=null; state.pip=null; state.texts=[];
// 1. the outline: 48 points (12 cut twice) roughened at three scales (235: resampled every 0.18 tiles, so over 48),
// about w by h, the same again from the same seed, another from another
const P=plateOutline(10, 10, 8, 4.5, 60), P2=plateOutline(10, 10, 8, 4.5, 60), P3=plateOutline(10, 10, 8, 4.5, 61);
const box=P=>{const xs=P.map(q=>q[0]), ys=P.map(q=>q[1]); return [Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys)];}, [bw,bh]=box(P);
const same=P.every((q,i)=>q[0]===P2[i][0]&&q[1]===P2[i][1]), diff=P.some((q,i)=>q[0]!==P3[i][0]);
console.log('1 outline: points', P.length, '(48 before the roughening) | spans', bw.toFixed(2), 'x', bh.toFixed(2), '(asked 8 x 4.5) | same seed same shape', same, '| another seed differs', diff);
// 1b. a brush slab's outline (227): the strip a brush sweeps along a stroke, from a quarter-tile raster; its area about
// 2 r L + pi r^2 for a straight stroke, a disc for a click, a bent stroke's less by the overlap at the bend; the same
// again from the same points, radius and seed; a stroke that closes on itself keeps its hole inside (one outline)
const bo=(pts,r,seed)=>brushOutline({strokes:[{pts,r}]},seed), bA=bo([[10,10],[18,10]],1,5), bB=bo([[10,10]],1,5), bC=bo([[10,10],[14,10],[14,14]],0.8,5), bD=bo([[10,10],[14,10],[14,14],[10,14],[10,10.5]],1,5);
const bE=brushOutline({strokes:[{pts:[[10,10],[18,10]],r:1}],plates:[{x:14,y:10,w:4,h:3,seed:9,rot:0}]},5), bP=plateOutline(14,10,4,3,9);   // merged (228): a stroke and a plate as one outline
const ar=P=>Math.abs(polyArea(P)), expA=2*1*8+Math.PI, expC=2*0.8*8+Math.PI*0.64-(4-Math.PI)*0.64*0.5;
console.log('1b brush outline: a straight stroke of 8 by r 1: points', bA.length, 'area', ar(bA).toFixed(2), '(2rL + pi r2', expA.toFixed(2)+') | a click: area', ar(bB).toFixed(2), '(pi', Math.PI.toFixed(2)+') | a bent stroke', ar(bC).toFixed(2), '(about', expC.toFixed(2)+') | a loop', bD.length, 'points, area', ar(bD).toFixed(1), '(the 6 by 6 it fills, less its corners) | the same again', JSON.stringify(bo([[10,10],[18,10]],1,5))===JSON.stringify(bA), '| another seed differs', JSON.stringify(bo([[10,10],[18,10]],1,6))!==JSON.stringify(bA), '| a stroke and a plate merged: one loop of', bE.length, 'points, area', ar(bE).toFixed(1), '(stroke', ar(bA).toFixed(1), 'plate', ar(bP).toFixed(1), 'together less the overlap) | holds the plate\\'s north (outside the stroke)', plateIn(bE,14,8.8), '(in the plate', plateIn(bP,14,8.8)+')', 'and the stroke\\'s end', plateIn(bE,17.8,10));
// 2. the one shape: the middle is in, far out is out, the hold's test is the drawing's
const p={P}; const hasMid=plateHas(p,10,10), hasOut=plateHas(p,20,10), hasEdge=plateHas(p,10+bw/2*0.9,10), hasPast=plateHas(p,10+bw/2*1.1,10);
console.log('2 plateHas: middle', hasMid, '| 9/10 of the way out', hasEdge, '| 11/10', hasPast, '| far', hasOut, '| kinds:', [0.2,0.4,0.8,1.2].map(t=>t+' '+plateKind(t)).join(', '));
// 3. mt2's layout: plates, pits, seams; heights add up a stack; the pit's floor; off every plate the ground is 0
startTestScene('mt2', 3/m.len, 17.5/m.D); state.gustPhase='lull'; state.gustT=0; state.gustDur=1e9; run(5);   // (238: the wind held in a lull: its timing comes off Math.random, and the walks here test the plates, not the wind)
 state.enemies=[]; const pl=platesLay(m), st=pl.list.filter(p=>p.seed>=60&&p.seed<66), foot=st[0], topS=st[st.length-1];
const hAtFoot=plateTopAt(pl, 2.0, 22.8), hTop=plateTopAt(pl, topS.x-1.6, topS.y-1.2), pit=pl.pits[0], hPit=plateTopAt(pl, 6.6, 19.7), hOff=plateTopAt(pl, 20, 3), steps=[...pit.ring.keys()].map(p=>plateBox(pit.ring.get(p))[3]);   // (each plate's ring ends further north: its south edge a ledge)
console.log('3 laid: plates', pl.list.length, 'pits', pl.pits.length, 'seams', pl.seams.length, '| the pitted stack', st.length, 'high: on its foot', hAtFoot.toFixed(2), 'on its crown', hTop.toFixed(2), '(sum', st.map(p=>p.thick).reduce((a,b)=>a+b).toFixed(2)+') | the pit cuts', pit.cut.length, 'plates down to', pit.floor, '| at its bottom', hPit.toFixed(2), '| each plate\\'s ring ends at y', steps.map(v=>v.toFixed(2)).join(', '), '| off every plate', hOff);
// 3b. the cutout clean (225; 235: a top's own lip and shoulder are baked into its texture): drawn, a lower layer of
// the pit paints no lip (its ledge is bare texture under the wash) and the top layer one, the rim's
for (let k=0;k<4;k++) draw();   // (238: the frames drawn so far bake the tops textures, as in play; run no longer draws)
{ let lips=0; const lip0=platePaintLip; platePaintLip=(R,s2,sd,g)=>{ lips++; lip0(R,s2,sd,g); };
  const c2={...state.mtn, cx:5.5, cy:20}, pr2=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c2), low=pit.cut.find(p=>p.base<=pit.floor+0.01), topP=pit.cut.find(p=>plateTop(p)>=pit.top-1e-6);
  drawPlate(m,low,pr2,1); const lipsLow=lips; lips=0; drawPlate(m,topP,pr2,1); const lipsTop=lips; platePaintLip=lip0;
  console.log('3b the cutout: the lowest layer drawn with lips', lipsLow, '(none: its own is in its texture) | the rim layer lips', lipsTop, '(the rim\\'s)'); if (!(lipsLow===0 && lipsTop===1)) errs++; }
// 4. the one projection: on mt2 (eye m.eye, 40 since 221) a point 2 tiles up is pushed out from the centre by 1 + 2/eye; on the rise (no eye) not at all
const c=state.mtn; const g0=mtnProj(c.cx+5, c.cy, c.ch, c), g2=mtnProj(c.cx+5, c.cy, c.ch+2, c), push=(g2[0]-SW/2)/(g0[0]-SW/2);
const cR={m:RISE,p:0.5,cx:40,cy:15,ch:0}; const r0=mtnProj(45,15,0,cR), r2=mtnProj(45,15,2,cR);
console.log('4 push-out on mt2: x', push.toFixed(3), '(want', (1+2/m.eye).toFixed(3)+') | on the rise', ((r2[0]-SW/2)/(r0[0]-SW/2)).toFixed(3), '(want 1.000) | mt2 close: zoom', mtnZoom(c.p,m), 'p', c.p);
// 5. faces north only: of a far plate's foot ring on the screen, every face drawn has its foot south of its lip
const far=pl.list.find(p=>p.seed===120), pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c), T=far.P.map(([x,y])=>pr(x,y,far.thick)), F=far.P.map(([x,y])=>pr(x,y,0)); let seen=0, north=0;   // (a plate well away from the eye, which is over you: the north bank's two-step)
for(let i=0;i<T.length;i++){ const j=(i+1)%T.length, ex=T[j][0]-T[i][0], ey=T[j][1]-T[i][1], L=Math.hypot(ex,ey)||1, nx=ey/L, ny=-ex/L, mx=(T[i][0]+T[j][0])/2, my=(T[i][1]+T[j][1])/2, fx=(F[i][0]+F[j][0])/2, fy=(F[i][1]+F[j][1])/2; const out=(fx-mx)*nx+(fy-my)*ny>0.2; if(out&&fy>my+0.2) seen++; if(out&&fy<=my+0.2) north++; }
const seamW=pl.seams[0].top;   // (231: mt2's seam is a crack on the base, top 0)
console.log('5 a far plate: edges with the foot outward', seen+north, '| drawn (foot south of the lip)', seen, '| skipped north faces', north, '| the base crack on the layer at', seamW);
// 6. walked into the face stack's 0.4 foot from the west (a hop, so it holds you); then a drawn frame's cost
h.x=0.6*UNIT; h.y=15.6*UNIT; h.vx=h.vy=0; const stack2=pl.list.find(p=>p.seed===80); let inside=false; state.keys.arrowright=true; for(let k=0;k<180;k++){ run(1); if(plateHas(stack2,tx(),ty())) inside=true; } off(); const stopX=tx(); let edgeX=0; while(!plateHas(stack2,edgeX,ty())&&edgeX<5) edgeX+=0.01;
const t0=Date.now(); for(let k=0;k<30;k++) draw(); const ms=(Date.now()-t0)/30;
console.log('6 walked east at the face stack 0.4 foot (no jump): on it', inside, '| went round to x', stopX.toFixed(1), 'on the base:', (h.lift||0)===0, '| a drawn frame', ms.toFixed(1), 'ms (fake canvas)');
// 7. on the plates, played: steer at a spot; when a plate's edge stops you, jump (a tap, or held for hold frames)
const go=(X,Y,hold=0,secs=6,want=null)=>{ let t=0, last=[tx(),ty()], still=0, jumps=0; while(t<60*secs && (Math.hypot(X-tx(),Y-ty())>0.25 || want!=null && Math.abs((h.lift||0)-want)>1e-6)){ const dx=X-tx(), dy=Y-ty(); state.keys.arrowright=dx>0.1; state.keys.arrowleft=dx<-0.1; state.keys.arrowdown=dy>0.1; state.keys.arrowup=dy<-0.1;
    run(1); t++; still=Math.hypot(tx()-last[0],ty()-last[1])<0.01?still+1:0; last=[tx(),ty()];
    const L0=Math.hypot(dx,dy)||1, ahead=plateTopAt(pl,tx()+dx/L0*0.55,ty()+dy/L0*0.55); if(hold>=0 && h.z<=0 && ahead>(h.lift||0)+0.26) still=99;   // an edge just ahead, higher than a step: jump, as a person would
    if(still>4 && h.z<=0 && hold>=0){ state.keys.btnjump=true; run(1); for(let k=0;k<hold;k++) run(1); state.keys.btnjump=false; t+=hold+1; still=0; jumps++; } } off(); for(let k=0;k<40 && (h.z>0||h.vz>0);k++) run(1); run(2); return jumps; };
const lift=()=>+(h.lift||0).toFixed(2), byS=s=>pl.list.find(p=>Math.abs(p.seed-s)<1e-6);
const spot=(p,ax=tx(),ay=ty())=>{ let b=null,bd=1e9; for(let y=p.box[1];y<p.box[3];y+=0.1) for(let x=p.box[0];x<p.box[2];x+=0.1){ if(Math.abs(plateTopAt(pl,x,y)-plateTop(p))>1e-6||[[0.45,0],[-0.45,0],[0,0.45],[0,-0.45]].some(([a,c])=>plateTopAt(pl,x+a,y+c)!==plateTop(p))) continue; const d=Math.hypot(x-ax,y-ay); if(d<bd){bd=d;b=[x,y];} } return b; };   // the nearest spot well inside what shows of a plate's top
h.x=3*UNIT; h.y=17.4*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; run(2);
h.x=1.2*UNIT; h.y=24*UNIT-UNIT*0.6; h.x=2.2*UNIT; h.y=23.3*UNIT; h.vx=h.vy=0; h.lift=0; h.plPrev=[h.x,h.y]; run(2);   // on the base, south-west of the stack
const s60=spot(byS(60)), walkOn=go(s60[0],s60[1],-1,2), heldBack=lift();            // walking at the 0.4 foot plate: held (a hop, not a step)
const j1=go(s60[0],s60[1],0,4), onFoot=lift();                                       // a tap: up onto it
const s61=spot(byS(61.3)), j2=go(s61[0],s61[1],0,4), on2=lift(), keyOK=plateKeyUnder(pl,tx(),ty(),h.lift)>byS(61.3).key;
const s62=spot(byS(62.6)), j3=go(s62[0],s62[1],0,4), on3=lift();
const s63=spot(byS(63.9),4.5,18.9), j4=go(s63[0],s63[1],0,5), on4=lift();             // up the stagger to its crown
const intoPit=go(6.6,19.7,-1,4), inPit=lift();                                       // walk east into the pit: down to the base, inside the ring
const ledge=p=>{ let b=null,bd=1e9; for(let y=17;y<23;y+=0.05) for(let x=3;x<10;x+=0.05){ if(!plateIn(pit.P,x,y)||plateTopAt(pl,x,y)!==plateTop(p)||[[0.2,0],[-0.2,0],[0,0.2],[0,-0.2]].some(([a,c])=>plateTopAt(pl,x+a,y+c)!==plateTop(p))) continue; const d=Math.hypot(x-tx(),y-ty()); if(d<bd){bd=d;b=[x,y];} } return b; };   // the nearest spot on that plate's ledge, inside the hole
const way=[]; for (const p of [byS(60),byS(61.3),byS(62.6)]) { const L=ledge(p); go(L[0],L[1],0,4,plateTop(p)); way.push(lift()); } { const o=spot(byS(63.9),4.3,18.4); go(o[0],o[1],0,4); way.push(lift()); }   // out up its ledges, north-west, a tap at each
console.log('7 the stack: walked at its foot plate, held at', heldBack, '| tapped up', onFoot, on2, '(drawn after it', keyOK+')', on3, on4, '(a tap at the 1.2 ledge may carry to the crown: the outlines are broken, 235)', '| walked into the pit:', inPit, '| out up the ledges, a tap each:', way.join(' > '));
h.x=31.9*UNIT; h.y=4.7*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=plateTopAt(pl,31.9,4.7); h.plPrev=[h.x,h.y]; run(2);
const before=lift(); go(31.9,2.2,-1,3); const off1=lift(), landed=h.z<=0;                       // walk off the south edge: down to the base
h.x=6.2*UNIT; h.y=16.2*UNIT; h.vx=h.vy=0; h.lift=0; h.plPrev=[h.x,h.y]; run(2); const stepJ=go(8.2,16.3,-1,3), onStep=lift();   // the perch's 0.25 foot: walked up, no jump
h.x=2.4*UNIT; h.y=17.3*UNIT; h.vx=h.vy=0; h.lift=0; h.plPrev=[h.x,h.y]; run(2); let o80=null; { let bd=1e9; for(let y=15;y<17.5;y+=0.05) for(let x=0.3;x<4.6;x+=0.05){ if(plateTopAt(pl,x,y)!==0.4||[[0.25,0],[-0.25,0],[0,0.25],[0,-0.25]].some(([a,c])=>plateTopAt(pl,x+a,y+c)!==0.4)) continue; const d=Math.hypot(x-2.0,y-16.4); if(d<bd){bd=d;o80=[x,y];} } } go(o80[0],o80[1],0,4); const onShelf=lift(); go(3.0,15.3,20,4); const atFace=lift();   // the face stack: up its 0.4 foot, then the 1.2 face stops even a held jump
console.log('8 off the north edge of the north bank two-step from', before, 'to', off1, '(landed', landed+') | the 0.25 step walked up to', onStep, '| the face stack: up to', onShelf, 'and the 1.2 face holds at', atFace);
// 9. seen from above: down the pit a rim covers only an edge of you, under the x-ray's line (226: it needs 70 percent of you hidden); north of the face stack it hides you and the x-ray shows you; out on the open base nothing does (state.mtn.xray and .cover, set by the frame)
const xr=(x,y,l)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=l; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; mtnCamera(0,state.mtn,true); DRAW_SCENE_STRIDE=1; draw(); return [!!state.mtn.xray, Math.round(state.mtn.cover*100)]; };
const xPit=xr(6.6,19.7,0), xLedge=xr(4.1,20.6,1.2), xBehind=xr(2.6,13.7,0), xOpen=xr(14,3,0);
console.log('9 x-ray (shown, % of you hidden): down the pit', xPit.join(' '), '| on its 1.2 ledge', xLedge.join(' '), '| north of the face stack', xBehind.join(' '), '| out in the open', xOpen.join(' '));
if (!(P.length>48 && Math.abs(bw-8)<1.6 && Math.abs(bh-4.5)<1.2 && same && diff && hasMid && hasEdge && !hasPast && !hasOut)) errs++;
if (!(pl.list.length>=9 && pl.pits.length===1 && pl.seams.length===1 && hAtFoot===0.4 && Math.abs(hTop-1.65)<1e-6 && hPit===0 && pit.cut.length===4 && steps.every((v,i)=>!i||v<steps[i-1]-0.4) && hOff===0)) errs++;
if (!(Math.abs(push-(1+2/m.eye))<0.01 && Math.abs((r2[0]-SW/2)/(r0[0]-SW/2)-1)<1e-9 && mtnZoom(c.p,m)===0.825 && seen>0 && seen<T.length && seamW===0 && !inside)) errs++;
if (!(heldBack===0 && onFoot===0.4 && on2===0.85 && keyOK && (on3===1.2||on3===1.65) && on4===1.65 && inPit===0 && way.join()==='0.4,0.85,1.2,1.65')) errs++;
if (!(before>0 && off1===0 && landed && onStep===0.25 && onShelf===0.4 && atFace===0.4)) errs++;
if (!(xBehind[0] && !xOpen[0] && !xPit[0] && !xLedge[0])) errs++;   // (down the pit a rim hides only an edge of you: under the line)
// 10. cracks (231): on the flat board a stack of three (0.4, 0.4, 0.4) with a crack drawn on its crown: a slit through
// all three to the base, its width by its depth (1.2: 0.25 + 0.4 x 1.2 = 0.73); narrower than a tile, you walk over it
// (the ground ignores it); a crack on the base beside it cuts nothing (a hairline); a plate laid over the crack spans it
LAYOUTS.flat={plates:[{x:20,y:12,w:8,h:5,seed:4,base:0,thick:0.4,tone:134,rot:0,under:-1},{x:20,y:12,w:7,h:4.4,seed:5,base:0.4,thick:0.4,tone:134,rot:0,under:0},{x:20,y:12,w:6,h:3.8,seed:6,base:0.8,thick:0.4,tone:134,rot:0,under:1},{x:20,y:12,w:2.4,h:1.2,seed:7,base:1.2,thick:0.3,tone:134,rot:0,under:2}],pits:[],seams:[{spine:[[20,9.5],[20,14.5]],top:1.2},{spine:[[10,20],[30,20]],top:0}]};
FLAT.pl=null; startTestScene('flat', 0.5, 0.5); run(3); const fp=platesLay(FLAT), cr=fp.pits.find(q=>q.crack), onCrown=plateTopAt(fp,20,13), onLid=plateTopAt(fp,20,12), beside=plateTopAt(fp,18.5,13);
h.x=18.6*UNIT; h.y=13.4*UNIT; h.vx=h.vy=0; h.z=0; h.liftAt=null; run(3); const liftA=h.lift; state.keys.arrowright=true; run(22); off(); run(3); const liftB=+(h.lift||0).toFixed(2), xB=tx().toFixed(1);
console.log('10 cracks: on the crown of a 1.2 stack: cuts', cr.cut.length, 'plates, roof', cr.roof.toFixed(3), 'width', cr.w, '(0.25 + 0.4 x 1.2) | the ground on it ignores it', onCrown, '| the lid laid over it spans it', onLid, '| beside', beside, '| the base crack cut nothing (pits', fp.pits.length+', seams', fp.seams.length+') | walked east across it: lift', liftA, '>', liftB, 'at x', xB);
if (!(cr && cr.cut.length===3 && Math.abs(cr.w-0.73)<1e-6 && Math.abs(onCrown-1.2)<1e-9 && Math.abs(onLid-1.5)<1e-9 && fp.pits.length===1 && fp.seams.length===1 && liftB===1.2 && +xB>21)) errs++;
// 11. a ravine with angled edges (233): on a 1.4 slab, 4 wide, 1.4 deep, slope 1 (45 degrees): from the rim the
// ground falls a tile a tile to a flat floor 1.2 wide; step onto the edge and you slide to the floor; walking up a
// 45-degree side gets you nowhere; a jump gets out while the rim is within its reach (a tap 0.56, held 0.95): from 0.4
// down a tap, from 0.8 a held jump, from 1.1 not even held, from the floor not at all; a gentle side (slope 2.5) you
// walk up and out
LAYOUTS.flat={plates:[{x:20,y:12,w:14,h:16,seed:4,base:0,thick:1.4,tone:134,rot:0,under:-1}],pits:[],seams:[],ravines:[{spine:[[14,10],[26,10]],w:4,depth:1.4,top:1.4,seed:9,slope:1},{spine:[[14,17],[26,17]],w:5,depth:1.4,top:1.4,seed:10,slope:2.5}]};
FLAT.pl=null; startTestScene('flat', 0.5, 0.5); run(3); const rp=platesLay(FLAT), rv=rp.pits.find(q=>q.rav===0), hs=[0,0.5,1,1.4,2].map(d=>+plateTopAt(rp,20,8+d).toFixed(2));
const placeH=(x,y)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.liftAt=null; h.plPrev=null; h.vig=maxVig(); run(2); return +(h.lift||0).toFixed(2); };
placeH(20,7.6); state.keys.arrowdown=true; run(20); off(); let slid=false, lowest=9; for(let k=0;k<120;k++){ run(1); if(h.sliding) slid=true; lowest=Math.min(lowest,+(h.lift||0).toFixed(2)); } const settled=+(h.lift||0).toFixed(2), yEnd=ty().toFixed(2);
placeH(20,8.9); const liftS=+(h.lift||0).toFixed(2); state.keys.arrowup=true; run(60); off(); run(5); const climbed=+(h.lift||0).toFixed(2);
const jumpOut=(y,hold)=>{ placeH(20,y); const from=+(h.lift||0).toFixed(2); state.keys.arrowup=true; run(2); state.keys.btnjump=true; run(1); for(let k=0;k<hold;k++) run(1); state.keys.btnjump=false; run(3); for(let k=0;k<60&&(h.z>0||h.vz>0);k++) run(1); off(); run(30); return from+' > '+(+(h.lift||0).toFixed(2)); };   // (steered at the rim only while in the air: landed, you let go)
const rj1=jumpOut(8.4,0), rj2=jumpOut(8.8,14), rj3=jumpOut(9.1,14), rj4=jumpOut(10,14);
placeH(20,14.3); state.keys.arrowdown=true; run(30); off(); run(60); const gentleIn=+(h.lift||0).toFixed(2); state.keys.arrowup=true; let upF=0; while(upF++<240 && (h.lift||0)<1.39) run(1); off(); run(5); const gentleOut=+(h.lift||0).toFixed(2), upSecs=(upF/60).toFixed(1);
console.log('11 angled edges: heights 0, 0.5, 1, 1.4, 2 tiles in from the rim', hs.join(', '), '(the floor is 1.2 wide) | stepped onto the edge: slid', slid, 'lowest', lowest, 'settled at', settled, 'y', yEnd, '| walking up the 45-degree side from', liftS, 'for a second:', climbed, '| jumps toward the rim: tap from 0.4 down', rj1, '| held from 0.8', rj2, '| held from 1.1', rj3, '| held from the floor', rj4, '| the gentle side (slope 2.5): slid to', gentleIn, 'walked up and out to', gentleOut, 'in', upSecs, 's');
if (!(hs[0]===1.4 && Math.abs(hs[1]-0.9)<1e-6 && Math.abs(hs[2]-0.4)<1e-6 && hs[3]===0 && hs[4]===0 && slid && settled===0 && climbed<=liftS+0.05 && rj1.endsWith('> 1.4') && rj2.endsWith('> 1.4') && !rj3.endsWith('> 1.4') && !rj4.endsWith('> 1.4') && gentleOut===1.4)) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
