const src = require('./harness.js').src;
// The plate (build 212, plates.js): the mountain's stone kind, laid on mt2's banks as a test layout. The outline is
// worn and squarish from its seed; one shape (plateHas) for drawing and the hold; stacks add their thicknesses,
// a pit through a stack drops to its floor; kinds by thickness; the one projection pushes what stands above the
// camera's ground out from the screen's centre (and nothing on a screen without an eye); faces draw north only; a
// seam stays under half a tile; every plate holds until 214. Played like a person: walked into a stack, drawn.
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
const hAtFoot=plateTopAt(pl, foot.x, foot.y), hTop=plateTopAt(pl, topS.x+1.4, topS.y), pit=pl.pits[0], hPit=plateTopAt(pl, pit.x, pit.y), hOff=plateTopAt(pl, 20, 3);
console.log('3 laid: plates', pl.list.length, 'pits', pl.pits.length, 'seams', pl.seams.length, '| the first stack', st.length, 'high: top at its foot\\'s middle', hAtFoot.toFixed(2), 'on its crown', hTop.toFixed(2), '(sum', st.map(p=>p.thick).reduce((a,b)=>a+b).toFixed(2)+') | in the pit', hPit.toFixed(2), '(floor', pit.floor+', cuts', pit.cut.length, 'plates, lip at', pit.top.toFixed(2)+') | off every plate', hOff);
// 4. the one projection: on mt2 (eye 14) a point 2 tiles up is pushed out from the centre by 1 + 2/14; on the rise (no eye) not at all
const c=state.mtn; const g0=mtnProj(c.cx+5, c.cy, c.ch, c), g2=mtnProj(c.cx+5, c.cy, c.ch+2, c), push=(g2[0]-SW/2)/(g0[0]-SW/2);
const cR={m:RISE,p:0.5,cx:40,cy:15,ch:0}; const r0=mtnProj(45,15,0,cR), r2=mtnProj(45,15,2,cR);
console.log('4 push-out on mt2: x', push.toFixed(3), '(want', (1+2/14).toFixed(3)+') | on the rise', ((r2[0]-SW/2)/(r0[0]-SW/2)).toFixed(3), '(want 1.000) | mt2 close: zoom', mtnZoom(c.p,m), 'p', c.p);
// 5. faces north only: of the first stack's foot ring on the screen, every face drawn has its foot south of its lip
const pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c), T=foot.P.map(([x,y])=>pr(x,y,foot.thick)), F=foot.P.map(([x,y])=>pr(x,y,0)); let seen=0, north=0;
for(let i=0;i<T.length;i++){ const j=(i+1)%T.length, ex=T[j][0]-T[i][0], ey=T[j][1]-T[i][1], L=Math.hypot(ex,ey)||1, nx=ey/L, ny=-ex/L, mx=(T[i][0]+T[j][0])/2, my=(T[i][1]+T[j][1])/2, fx=(F[i][0]+F[j][0])/2, fy=(F[i][1]+F[j][1])/2; const out=(fx-mx)*nx+(fy-my)*ny>0.2; if(out&&fy>my+0.2) seen++; if(out&&fy<=my+0.2) north++; }
const seamW=Math.max(...pl.seams[0].spine.map(q=>q[2]*2));
console.log('5 the foot plate: edges with the foot outward', seen+north, '| drawn (foot south of the lip)', seen, '| skipped north faces', north, '| the seam at most', seamW.toFixed(2), 'tiles wide');
// 6. the hold: walk east into the second stack from the west; stopped at its edge, never inside; then a drawn frame's cost
h.x=0.6*UNIT; h.y=15.6*UNIT; h.vx=h.vy=0; const stack2=pl.list.find(p=>p.seed===80); let inside=false; state.keys.arrowright=true; for(let k=0;k<180;k++){ run(1); if(plateHas(stack2,tx(),ty())) inside=true; } off(); const stopX=tx(); let edgeX=0; while(!plateHas(stack2,edgeX,ty())&&edgeX<5) edgeX+=0.01;
const t0=Date.now(); for(let k=0;k<30;k++) draw(); const ms=(Date.now()-t0)/30;
console.log('6 walked east into the face stack: stopped at x', stopX.toFixed(2), '(its west edge at that y', edgeX.toFixed(2)+') | ever inside', inside, '| a drawn frame', ms.toFixed(1), 'ms (fake canvas)');
if (!(P.length===48 && Math.abs(bw-8)<1.6 && Math.abs(bh-4.5)<1.2 && same && diff && hasMid && hasEdge && !hasPast && !hasOut)) errs++;
if (!(pl.list.length>=10 && pl.pits.length===1 && pl.seams.length===1 && hAtFoot>=foot.thick && Math.abs(hTop-1.65)<1e-6 && Math.abs(hPit-pit.floor)<1e-6 && pit.cut.length===3 && hOff===0)) errs++;
if (!(Math.abs(push-(1+2/14))<0.01 && Math.abs((r2[0]-SW/2)/(r0[0]-SW/2)-1)<1e-9 && mtnZoom(c.p,m)===0.825 && seen>0 && north>0 && seamW<0.5 && !inside && stopX<edgeX+0.02)) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
