global.location = { search: '?edit=mt2&seed=1000003' };
const src = require('./harness.js').src;
// The editor (build 215, edit.js) on ?edit=mt2, driven as a person would with the mouse and keys: the hero stays parked
// while the arrows pan and the wheel zooms about the cursor; a click selects a plate, [ ] change its thickness (and the
// collision changes with it: the one shape), a drag moves it with the stack on it, D duplicates up the stack, N lays a
// plate, P a pit (which cuts the plate under it), C and clicks lay a crack, Delete removes; S's text loads back as the
// same layout and is the file shipped (src/layouts/mt2.js reads back to what 214 laid); T drops the hero and the game
// runs, T again parks him; frames draw with the overlay.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const tap=k=>{state.keys[k]=true;run(1);state.keys[k]=false;run(1);};
const h=state.hero, m=M2, E=state.edit, LY=()=>E.layout, pl=()=>platesLay(m), tx=()=>h.x/UNIT, ty=()=>h.y/UNIT, c=state.mtn;
run(5); state.texts=[];
const pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c), mid=R=>{let x=0,y=0; for(const [X,Y] of R){x+=X/R.length;y+=Y/R.length;} return [x,y];};
const topMid=p=>mid(p.P.map(([x,y])=>pr(x,y,plateTop(p)))), byS=s=>pl().list.find(p=>Math.abs(p.seed-s)<1e-6);
const click=(X,Y)=>{ editDown(X,Y); run(1); editUp(X,Y); run(1); };
const southOf=p=>{ const [sx,sy]=p.P.reduce((a,b)=>b[1]>a[1]?b:a); return pr(sx,sy-0.35,plateTop(p)); };   // a spot on a plate's top that shows (its south edge is under nothing stacked on it)
// 1. parked: the arrows pan the view and the hero stays; the wheel zooms about the cursor (the tile under it stays put)
const hx0=tx(), cx0=c.cx; state.keys.arrowright=true; run(60); state.keys.arrowright=false; run(1); const panned=c.cx-cx0, heroMoved=Math.abs(tx()-hx0);
const X=SW/2+120, Y=SH/2+40, before=editTile(X,Y), z0=mtnZoom(c.p,m); editWheel(-100,X,Y); run(1); const after=editTile(X,Y), z1=mtnZoom(c.p,m);
console.log('1 editing', !!E, 'on', state.scene, '| arrows: view panned', panned.toFixed(2), 'tiles, hero moved', heroMoved.toFixed(3), '| wheel in: zoom', z0.toFixed(3), '>', z1.toFixed(3), '| tile under the cursor drifted', Math.hypot(after[0]-before[0], after[1]-before[1]).toFixed(3));
// 2. the shipped layout is 214's: 11 plates, a pit, a seam; the editor's copy is the same; click the face stack's foot: selected
E.zoom=1; E.cx=5; E.cy=18; mtnCamera(0,c,true); run(1);
const n0=[pl().list.length, pl().pits.length, pl().seams.length], shipped=LAYOUTS.mt2.plates.length;
const foot=byS(80); const [FX,FY]=southOf(foot); click(FX,FY); const sel1=E.sel&&E.sel.kind==='plate'&&LY().plates[E.sel.i].seed===80;
console.log('2 laid: plates', n0[0], 'pits', n0[1], 'seams', n0[2], '(the file lists', shipped+') | clicked the face stack foot: selected it', sel1, '| the hero parked at', tx().toFixed(1), ty().toFixed(1));
// 3. ] thickens it by 0.05: the ground on it rises as much, the plate above it (1.2 face) stands higher; [ puts it back
const sp=p=>{ const [sx,sy]=p.P.reduce((a,b)=>b[1]>a[1]?b:a); return [sx,sy-0.35]; }, at=p=>plateTopAt(pl(),...sp(p));   // the ground on that showing part of its top
const t0=at(foot), b0=LY().plates.find(p=>p.seed===81.3).base; tap(']'); const t1=at(foot), b1=LY().plates.find(p=>p.seed===81.3).base; tap('['); const t2=at(foot);
console.log('3 ] thickness: ground on it', t0.toFixed(2), '>', t1.toFixed(2), '| the plate above re-based', b0.toFixed(2), '>', b1.toFixed(2), '| [ back to', t2.toFixed(2));
// 4. drag it 2 tiles east: it and the two on it move; the ground at the old spot drops to 0, at the new spot is its top
const k=mtnPush(mtnH(m,foot.x,foot.y)+foot.thick,c)*UNIT*mtnZoom(c.p,m), [DX,DY]=southOf(byS(80)); const [ox,oy]=sp(foot), o2=LY().plates.find(p=>p.seed===82.6).x;
editDown(DX,DY); run(1); editMove(DX+k*2,DY); run(1); editUp(DX+k*2,DY); run(1);
const nf=byS(80), movedBy=nf.x-foot.x, aboveBy=LY().plates.find(p=>p.seed===82.6).x-o2, gOld=plateTopAt(pl(),ox,oy), gNew=at(nf);
console.log('4 dragged the foot 2 tiles east: it moved', movedBy.toFixed(2), '| the crown on it moved', aboveBy.toFixed(2), '| ground at the old spot', gOld, 'at the new', gNew.toFixed(2));
// 5. D duplicates up the stack (on the selected, shifted, smaller, thinner); Delete removes it
click(...topMid(byS(82.6))); const nBefore=LY().plates.length; tap('d'); const dup=LY().plates[LY().plates.length-1], crown=byS(82.6);
const dupOK=dup.under===LY().plates.indexOf(LY().plates.find(p=>p.seed===82.6))&&Math.abs(dup.base-plateTop(crown))<1e-6&&dup.w<crown.w&&dup.thick<crown.thick;
tap('delete'); const nAfter=LY().plates.length;
console.log('5 D on the crown: plates', nBefore, '>', nBefore+1, '| the new one stands on it, thinner and smaller', dupOK, '(thick', dup.thick, 'base', dup.base+') | Delete:', nAfter);
// 6. N lays a plate at the cursor on open ground (base 0), P a pit on it: inside the pit the ground is the floor, outside it the plate's top
const [NX,NY]=pr(14,20,0); editMove(NX,NY); run(1); tap('n'); const np=LY().plates[LY().plates.length-1]; tap('p'); const q=pl().pits[pl().pits.length-1];
const inPit=plateTopAt(pl(),14,20), onPlate=plateTopAt(pl(),14+1.6,20);
console.log('6 N at 14,20: a plate at', np.x, np.y, 'base', np.base, 'thick', np.thick, '| P: pits', pl().pits.length, 'cutting', q.cut.length, 'plate | ground in the pit', inPit, 'beside it', onPlate);
// 7. C, three clicks, C: a seam of three points; its width [ ]; then Delete it, the pit and the plate (the layout back to 214's)
tap('c'); for (const [x,y] of [[16,18],[17,19],[18,21]]) { const [CX,CY]=pr(x,y,0); click(CX,CY); } const laid=E.crack.spine.length; tap('c');
const sm=LY().seams[LY().seams.length-1], w0=sm.spine[0][2]; tap(']'); const w1=sm.spine[0][2]; tap('delete');
click(...pl().pits[pl().pits.length-1].P.slice(0,1).map(([x,y])=>pr(x,y,0.4)).map(v=>v)); if(!(E.sel&&E.sel.kind==='pit')) { const Q=pl().pits[pl().pits.length-1]; click(...mid(Q.P.map(([x,y])=>pr(x,y,Q.top)))); } const pitSel=E.sel&&E.sel.kind==='pit'; tap('delete');
click(...topMid(byS(np.seed))); tap('delete');
const n1=[pl().list.length, pl().pits.length, pl().seams.length];
console.log('7 crack: laid', laid, 'points, seams', LY().seams.length+1, '> width', w0, '>', w1, '| deleted: pit selected by its ring', pitSel, '| back to plates', n1[0], 'pits', n1[1], 'seams', n1[2]);
// 8. S's text loads back as the same layout; the shipped file reads back as what 214 laid (the old test's numbers)
const text=editText(LY(),'mt2'), same=JSON.stringify(LY()); const okLoad=editLoad(text), back=JSON.stringify(LY())===same; if(!back) console.log(same, JSON.stringify(LY()));
const fromFile=LAYOUTS.mt2, shippedSame=JSON.stringify(JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}')+1)))===JSON.stringify({plates:fromFile.plates.map(p=>({...p,x:+(p.x+(p.seed>=80&&p.seed<84?movedBy:0)).toFixed(3)})),pits:fromFile.pits,seams:fromFile.seams});
console.log('8 S then L: loaded', okLoad, 'the same', back, '| the text is the file\\'s shape (plates line by line)', /"plates": \\[\\n    \\{"x"/.test(text), '| lines', text.split('\\n').length, '| matches the shipped file but for the drag', shippedSame);
// 9. T at the cursor: the hero there, the game runs (he walks); T parks him, the view on him
const [TX,TY]=pr(10,4,0); editMove(TX,TY); run(1); tap('t'); const dropped=[tx(),ty()].map(v=>v.toFixed(1)), trying=E.trying; state.keys.arrowright=true; run(40); state.keys.arrowright=false; run(1); const walked=tx()-10; tap('t');
console.log('9 T: hero at', dropped.join(','), 'trying', trying, '| walked', walked.toFixed(2), 'tiles east | T again: editing', !E.trying, 'view on him', Math.abs(E.cx-tx())<1e-6, '| the hero stays at', tx().toFixed(1), 'while', (state.keys.arrowleft=true, run(30), state.keys.arrowleft=false, run(1), tx().toFixed(1)));
const ms0=Date.now(); for(let i=0;i<30;i++) draw(); console.log("10 a drawn frame with the overlay", ((Date.now()-ms0)/30).toFixed(1), 'ms | BUILD', BUILD, '| errs', errs);
`);
