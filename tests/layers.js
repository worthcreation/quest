global.location = { search: '?edit=flat&seed=1000003' };
const src = require('./harness.js').drawn;
// The plates' draw order as layers (229, Ross from two screenshots after 228): standing on the ground south of a slab
// you are painted after its top (in front of it), north of it before (it hides you); a slab stacked on another has its
// walls painted after the top it stands on (they showed under it); on the slab's top you are after it. Read from the
// real paint calls of a drawn frame, the editor's flat board, tried with T.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
const tap=k=>{state.keys[k]=true;run(1);state.keys[k]=false;run(1);}, h=state.hero, E=state.edit, fm=MTN.flat;
run(3); editLoad(JSON.stringify({plates:[{x:20,y:12,w:6,h:3,seed:4,base:0,thick:0.5,tone:134,rot:0,under:-1},{x:20,y:12,w:3,h:1.6,seed:5,base:0.5,thick:0.45,tone:134,rot:0,under:0}],pits:[],seams:[]}));
E.cx=20; E.cy=12; mtnCamera(0,state.mtn,true); run(1);
const low=()=>platesLay(fm).list.find(p=>p.seed===4), up=()=>platesLay(fm).list.find(p=>p.seed===5);
const order=()=>{ const seq=[], f0=drawPlateFaces, p0=drawPlate, h0=drawHero; drawPlateFaces=(m,p,...a)=>{ seq.push('faces'+p.seed); return f0(m,p,...a); }; drawPlate=(m,p,...a)=>{ seq.push('top'+p.seed); return p0(m,p,...a); }; drawHero=(...a)=>{ seq.push('hero'); return h0(...a); };
  try{ for(let k=0;k<8&&!seq.length;k++) draw(); } finally { drawPlateFaces=f0; drawPlate=p0; drawHero=h0; } return seq; };
const put=(x,y)=>{ const [X,Y]=mtnProj(x,y,mtnH(fm,x,y),state.mtn); editMove(X,Y); run(1); tap('t'); run(10); const o=order(); tap('t'); return o; };
const after=(o,a,b)=>o.indexOf(a)>o.indexOf(b);
const S=put(20,14.4), N=put(20,9.6), T=put(18.2,12);
console.log('1 south of the slab, on the ground: you after its top', after(S,'hero','top4'), '(order', S.join(' ')+')');
console.log('2 north of it: you before its walls and top', !after(N,'hero','faces4')&&!after(N,'hero','top4'), '(order', N.join(' ')+')');
console.log('3 the stacked slab: its walls after the top it stands on', after(S,'faces5','top4'), '| its top after its walls', after(S,'top5','faces5'), '| keys: lower top', low().key.toFixed(3), 'upper walls', up().fkey.toFixed(3), 'upper top', up().key.toFixed(3));
console.log('4 on the lower slab, west of the upper: lift', +(h.lift||0).toFixed(2), '| you after the lower top', after(T,'hero','top4'));
console.log('BUILD', BUILD, '| errs', errs);
`);
