const src = require('./harness.js').src;
// The plate (build 212, plates.js): the mountain's stone kind, laid on mt2's banks as a test layout. The outline is
// worn and squarish from its seed; one shape (plateHas) for drawing and the hold; stacks add their thicknesses,
// a pit through a stack drops to its floor; kinds by thickness; the one projection pushes what stands above the
// camera's ground out from the screen's centre (and nothing on a screen without an eye); faces draw north only; a
// seam stays under half a tile. The hero (213) walks up a step, hops or high-hops onto a plate, is held by a face, drops
// off an edge and out of a pit's floor with a held jump. Played like a person: steered, jumping where an edge stops him.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
const tx=()=>state.hero.x/UNIT, ty=()=>state.hero.y/UNIT, h=state.hero, m=M2;
run(5); state.intro=null; state.pip=null; state.texts=[];
// 1. the outline: 48 points (12 cut twice), about w by h, the same again from the same seed, another from another
const P=plateOutline(10, 10, 8, 4.5, 60), P2=plateOutline(10, 10, 8, 4.5, 60), P3=plateOutline(10, 10, 8, 4.5, 61);
const box=P=>{const xs=P.map(q=>q[0]), ys=P.map(q=>q[1]); return [Math.max(...xs)-Math.min(...xs), Math.max(...ys)-Math.min(...ys)];}, [bw,bh]=box(P);
const same=P.every((q,i)=>q[0]===P2[i][0]&&q[1]===P2[i][1]), diff=P.some((q,i)=>q[0]!==P3[i][0]);
console.log('1 outline: points', P.length, '| spans', bw.toFixed(2), 'x', bh.toFixed(2), '(asked 8 x 4.5) | same seed same shape', same, '| another seed differs', diff);
// 2. the one shape: the middle is in, far out is out, the hold's test is the drawing's
const p={P}; const hasMid=plateHas(p,10,10), hasOut=plateHas(p,20,10), hasEdge=plateHas(p,10+bw/2*0.9,10), hasPast=plateHas(p,10+bw/2*1.1,10);
console.log('2 plateHas: middle', hasMid, '| 9/10 of the way out', hasEdge, '| 11/10', hasPast, '| far', hasOut, '| kinds:', [0.2,0.4,0.8,1.2].map(t=>t+' '+plateKind(t)).join(', '));
// 3. mt2's layout: plates, pits, seams; heights add up a stack; the pit's floor; off every plate the ground is 0
startTestScene('mt2', 3/m.len, 17.5/m.D); run(5); state.enemies=[]; const pl=platesLay(m), st=pl.list.filter(p=>p.seed>=60&&p.seed<66), foot=st[0], topS=st[st.length-1];
const hAtFoot=plateTopAt(pl, 2.6, 23.0), hTop=plateTopAt(pl, topS.x-1.6, topS.y-1.2), pit=pl.pits[0], hPit=plateTopAt(pl, 6.6, 19.7), hOff=plateTopAt(pl, 20, 3), steps=[...pit.ring.keys()].map(p=>plateBox(pit.ring.get(p))[3]);   // (each plate's ring ends further north: its south edge a ledge)
console.log('3 laid: plates', pl.list.length, 'pits', pl.pits.length, 'seams', pl.seams.length, '| the pitted stack', st.length, 'high: on its foot', hAtFoot.toFixed(2), 'on its crown', hTop.toFixed(2), '(sum', st.map(p=>p.thick).reduce((a,b)=>a+b).toFixed(2)+') | the pit cuts', pit.cut.length, 'plates down to', pit.floor, '| at its bottom', hPit.toFixed(2), '| each plate\\'s ring ends at y', steps.map(v=>v.toFixed(2)).join(', '), '| off every plate', hOff);
// 4. the one projection: on mt2 (eye m.eye, 40 since 221) a point 2 tiles up is pushed out from the centre by 1 + 2/eye; on the rise (no eye) not at all
const c=state.mtn; const g0=mtnProj(c.cx+5, c.cy, c.ch, c), g2=mtnProj(c.cx+5, c.cy, c.ch+2, c), push=(g2[0]-SW/2)/(g0[0]-SW/2);
const cR={m:RISE,p:0.5,cx:40,cy:15,ch:0}; const r0=mtnProj(45,15,0,cR), r2=mtnProj(45,15,2,cR);
console.log('4 push-out on mt2: x', push.toFixed(3), '(want', (1+2/m.eye).toFixed(3)+') | on the rise', ((r2[0]-SW/2)/(r0[0]-SW/2)).toFixed(3), '(want 1.000) | mt2 close: zoom', mtnZoom(c.p,m), 'p', c.p);
// 5. faces north only: of a far plate's foot ring on the screen, every face drawn has its foot south of its lip
const far=pl.list.find(p=>p.seed===120), pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c), T=far.P.map(([x,y])=>pr(x,y,far.thick)), F=far.P.map(([x,y])=>pr(x,y,0)); let seen=0, north=0;   // (a plate well away from the eye, which is over you: the north bank's two-step)
for(let i=0;i<T.length;i++){ const j=(i+1)%T.length, ex=T[j][0]-T[i][0], ey=T[j][1]-T[i][1], L=Math.hypot(ex,ey)||1, nx=ey/L, ny=-ex/L, mx=(T[i][0]+T[j][0])/2, my=(T[i][1]+T[j][1])/2, fx=(F[i][0]+F[j][0])/2, fy=(F[i][1]+F[j][1])/2; const out=(fx-mx)*nx+(fy-my)*ny>0.2; if(out&&fy>my+0.2) seen++; if(out&&fy<=my+0.2) north++; }
const seamW=Math.max(...pl.seams[0].spine.map(q=>q[2]*2));
console.log('5 a far plate: edges with the foot outward', seen+north, '| drawn (foot south of the lip)', seen, '| skipped north faces', north, '| the seam at most', seamW.toFixed(2), 'tiles wide');
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
console.log('7 the stack: walked at its foot plate, held at', heldBack, '| tapped up', onFoot, on2, '(drawn after it', keyOK+')', on3, on4, '| walked into the pit:', inPit, '| out up the ledges, a tap each:', way.join(' > '));
h.x=31.9*UNIT; h.y=4.7*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=plateTopAt(pl,31.9,4.7); h.plPrev=[h.x,h.y]; run(2);
const before=lift(); go(31.9,2.2,-1,3); const off1=lift(), landed=h.z<=0;                       // walk off the south edge: down to the base
h.x=6.2*UNIT; h.y=16.2*UNIT; h.vx=h.vy=0; h.lift=0; h.plPrev=[h.x,h.y]; run(2); const stepJ=go(8.2,16.3,-1,3), onStep=lift();   // the perch's 0.25 foot: walked up, no jump
h.x=2.4*UNIT; h.y=17.3*UNIT; h.vx=h.vy=0; h.lift=0; h.plPrev=[h.x,h.y]; run(2); go(2.0,16.4,0,4); const onShelf=lift(); go(3.0,15.3,20,4); const atFace=lift();   // the face stack: up its 0.4 foot, then the 1.2 face stops even a held jump
console.log('8 off the north edge of the north bank two-step from', before, 'to', off1, '(landed', landed+') | the 0.25 step walked up to', onStep, '| the face stack: up to', onShelf, 'and the 1.2 face holds at', atFace);
// 9. seen from above: on the pit's floor and on a ledge in it you're in view, an edge of you x-rayed where a rim covers it; north of the face stack it hides you; out on the open base nothing does (state.mtn.xray, set by the frame)
const xr=(x,y,l)=>{ h.x=x*UNIT; h.y=y*UNIT; h.vx=h.vy=0; h.z=0; h.vz=0; h.lift=l; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; mtnCamera(0,state.mtn,true); DRAW_SCENE_STRIDE=1; draw(); return !!state.mtn.xray; };
const xPit=xr(6.6,19.7,0), xLedge=xr(4.1,20.6,1.2), xBehind=xr(2.6,13.7,0), xOpen=xr(14,3,0);
console.log('9 x-ray: down the pit', xPit, '| on its 1.2 ledge', xLedge, '| north of the face stack', xBehind, '| out in the open', xOpen);
if (!(P.length===48 && Math.abs(bw-8)<1.6 && Math.abs(bh-4.5)<1.2 && same && diff && hasMid && hasEdge && !hasPast && !hasOut)) errs++;
if (!(pl.list.length>=9 && pl.pits.length===1 && pl.seams.length===1 && hAtFoot===0.4 && Math.abs(hTop-1.65)<1e-6 && hPit===0 && pit.cut.length===4 && steps.every((v,i)=>!i||v<steps[i-1]-0.4) && hOff===0)) errs++;
if (!(Math.abs(push-(1+2/m.eye))<0.01 && Math.abs((r2[0]-SW/2)/(r0[0]-SW/2)-1)<1e-9 && mtnZoom(c.p,m)===0.825 && seen>0 && seen<T.length && seamW<0.5 && !inside)) errs++;
if (!(heldBack===0 && onFoot===0.4 && on2===0.85 && keyOK && on3===1.2 && on4===1.65 && inPit===0 && way.join()==='0.4,0.85,1.2,1.65')) errs++;
if (!(before>0 && off1===0 && landed && onStep===0.25 && onShelf===0.4 && atFace===0.4)) errs++;
if (!(xBehind && !xOpen)) errs++;   // (in the pit the x-ray covers only the strip of you under a rim, so either is fine there)
console.log('BUILD', BUILD, '| errs', errs);
`);
