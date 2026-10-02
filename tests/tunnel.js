global.location = { search: '?edit=flat&seed=1000003' };
const src = require('./harness.js').src;
// Build 222 (Ross: "edges need to meet, go for tunnels as well"). A pit across a slab's edge cuts a notch out of the
// slab's outline (polyDiff), its walls the slab's own faces; a tunnel is a pit with a roof along a strip: the plates
// between its floor and roof are cut, the ones over it stay and are walked under. Laid on the flat board with the
// editor's keys (G, clicks, G), then walked through.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const tap=k=>{state.keys[k]=true;run(1);state.keys[k]=false;run(1);}, off=()=>['arrowleft','arrowright','arrowup','arrowdown'].forEach(k=>state.keys[k]=false);
const h=state.hero, m=MTN.flat, E=state.edit, pl=()=>platesLay(m), tx=()=>h.x/UNIT, ty=()=>h.y/UNIT, c=state.mtn;
run(5); state.texts=[];
// 1. polyDiff: a square less a square across its edge is one notched piece of the right area; through it, two pieces; inside it, a hole (the square back); swallowing it, nothing
const sq=(x,y,r)=>[[x-r,y-r],[x+r,y-r],[x+r,y+r],[x-r,y+r]], area=P=>Math.abs(polyArea(P));
const notch=polyDiff(sq(0,0,2),sq(2,0,1)), through=polyDiff(sq(0,0,2),[[-3,-0.5],[3,-0.5],[3,0.5],[-3,0.5]]), hole=polyDiff(sq(0,0,2),sq(0,0,1)), gone=polyDiff(sq(0,0,1),sq(0,0,2));
console.log('1 polyDiff: notch pieces', notch.length, 'area', area(notch[0]).toFixed(2), '(want 14.00) | through:', through.length, 'pieces, areas', through.map(a=>area(a).toFixed(2)).join('+'), '(want 6+6) | inside: the outline back', hole.length===1&&hole[0].length===4, '| swallowed:', gone.length);
// 2. a pit across a slab's edge: a notch (no hole), the piece's outline is the slab's less the ring; collision the same shape
const P=(x,y,w,hh,seed,base,thick,under=-1)=>({x,y,w,h:hh,seed,base,thick,tone:134,rot:0,under});
editLoad(JSON.stringify({plates:[P(26,10,7,5,4,0,1.6)],pits:[{x:23.6,y:11.2,w:3.8,h:3.4,seed:9,floor:0,ledge:0}],seams:[]}));
const s1=pl().list[0], q1=pl().pits[0]; let agree=0, n=0; for(let y=7;y<14;y+=0.25) for(let x=21;x<31;x+=0.25){ n++; if(s1.O.some(O=>plateIn(O,x,y))===(plateTopAt(pl(),x,y)>0)) agree++; }
console.log('2 pit across the edge: pieces', s1.O.length, 'holes', s1.holes.length, '| the drawn pieces and the ground agree at', agree, 'of', n, 'points');
// 3. lay a tunnel through a stack with the keys: three plates up to 1.2, a roof plate on them; G, two clicks, G
editLoad(JSON.stringify({plates:[P(16,12,6,5,1,0,0.4),P(16,12,6,5,2,0.4,0.4,0),P(16,12,6,5,3,0.8,0.4,1),P(16,12,6,5,5,1.2,0.5,2)],pits:[],seams:[]}));
E.cx=16; E.cy=12; E.zoom=1; mtnCamera(0,c,true); run(1);
const pr=(x,y,z)=>mtnProj(x,y,mtnH(m,x,y)+z,c), click=(x,y)=>{ const [X,Y]=pr(x,y,0); editDown(X,Y); run(1); editUp(X,Y); run(1); };
tap('g'); click(11,12); click(21,12); tap('g'); const t=E.layout.tunnels[0], q=pl().pits.find(p=>p.tunnel);
const cutN=q.cut.length, roofKept=!q.ring.has(pl().list.find(p=>p.seed===5)), pieces=pl().list.filter(p=>p.base<1.2).map(p=>p.O.length);
console.log('3 G, two clicks, G: tunnels', E.layout.tunnels.length, 'width', t.w, 'floor', t.floor, 'roof', t.roof, '| cuts', cutN, 'plates, the roof plate kept', roofKept, '| each cut plate in', pieces.join(','), 'pieces');
// 4. walk it: from the west, east through the middle: the ground stays 0, under the roof the x-ray shows you; north into its wall: held
const [TX,TY]=pr(11.5,12,0); editMove(TX,TY); run(1); tap('t'); const start=+(h.lift||0).toFixed(2); state.keys.arrowright=true; let xray=false, maxG=0; for(let k=0;k<200&&tx()<20.5;k++){ run(1); maxG=Math.max(maxG,h.lift||0); if(tx()>14&&tx()<18&&state.mtn.xray) xray=true; } off(); run(2);
const endX=tx(); h.x=16*UNIT; h.y=12*UNIT; h.vx=h.vy=0; h.plPrev=[h.x,h.y]; run(2); state.keys.arrowup=true; run(60); off(); run(2); const heldY=ty();
console.log('4 walked through: from x 11.5 to', endX.toFixed(1), '| ground at most', maxG, '(started', start+') | the x-ray inside', xray, '| at x 16 walked north from y 12: held at', heldY.toFixed(2), '(the wall at about', (12-0.7).toFixed(1)+')');
tap('t');
// 5. the editor: click its strip to select it, E then ] raises the roof, Delete; S and O give it back
const [GX,GY]=pr(12,12,0); editDown(GX,GY); run(1); editUp(GX,GY); run(1); const selT=E.sel&&E.sel.kind; tap('e'); tap(']'); const roof2=E.layout.tunnels[0].roof;
const text=editText(E.layout,'flat'); const has=/"tunnels": \\[/.test(text); tap('delete'); const after=E.layout.tunnels.length; editLoad(text); const back=E.layout.tunnels.length===1&&E.layout.tunnels[0].roof===roof2;
console.log('5 clicked the strip: selected', selT, '| E ] roof 1.2 >', roof2, '| S writes a tunnels block', has, '| Delete:', after, '| O gives it back', back);
const ms0=Date.now(); for(let i=0;i<30;i++) draw(); console.log('6 a drawn frame', ((Date.now()-ms0)/30).toFixed(1), 'ms | errs', errs);
`);
