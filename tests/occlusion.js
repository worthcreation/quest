global.location = { search: '?seed=1000003' };
const src = require('./harness.js').src;
// Build 226 (Ross, from the stills in docs/parked/mock-occlusion.js): under a slab or a tree's crown a soft window
// round you shows what is under it; the x-ray (you faint, a dashed box) only when a boulder, crag or plate in front
// hides 70 percent of you or more; trees, reeds and grass never x-ray; a G tunnel is unshown. The six cases of the
// still, laid on the flat board, you put down and the frame drawn.
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\\\\\n').slice(1,3).join(' | '));} }};
const h=state.hero; run(5); state.texts=[];
const wall=(y,seed)=>({x:20,y,w:7,h:3,seed,base:0,thick:1.2,tone:134,rot:0,under:-1});
function look(plates, solids){
  LAYOUTS.flat={plates,pits:[],seams:[]}; FLAT.pl=null; FLAT.land=null; state.intro=null; startTestScene('flat',20/40,14/24); for(let k=0;k<4;k++) update(1/60); state.enemies=[]; state.texts=[];
  state.solids=state.solids.filter(o=>!o.rise&&o.kind!=='reeds');
  for(const [k,x,y,r] of solids) state.solids.push({ x:x*UNIT, y:y*UNIT, r:r*UNIT*(k==='tree'?1:1/MTN_F[k]), kind:MTN_KIND[k], v:0, flip:false, pal:'green', rise:k, rr:r, seed:3, vis:r*UNIT*1.6, key:'t'+x });
  h.x=20*UNIT; h.y=14*UNIT; h.z=0; h.vx=h.vy=0; h.vz=0; h.lift=0; h.liftAt=state.scene; h.plPrev=[h.x,h.y]; mtnCamera(0,state.mtn,true); DRAW_SCENE_STRIDE=1; draw(); draw();
  const c=state.mtn; return { win:!!c.win, xray:!!c.xray, cover:Math.round((c.cover||0)*100) };
}
const cases=[
  ['under a roof slab', [wall(11.5,4),wall(16.5,5),{x:20,y:14,w:7.5,h:9,seed:9,base:1.2,thick:0.5,tone:138,rot:0,under:-1}], [], 'window'],
  ['a big boulder r 1.8', [], [['boulder',20,15.0,1.8]], 'xray'],
  ['a mid boulder r 1.3', [], [['boulder',20,15.0,1.3]], 'none'],
  ['a small boulder r 0.9', [], [['boulder',20.6,14.9,0.9]], 'none'],
  ['a tree', [], [['tree',20,14.8,1]], 'window'],
  ['a 1.2 wall, you at its north edge', [wall(15.6,6)], [], 'xray'],
  ['out in the open', [], [], 'none'],
];
const res=[]; for(const [name,plates,solids,want] of cases){ const o=look(plates,solids), got=o.win?'window':o.xray?'xray':'none'; res.push(name+': '+got+' (hidden '+o.cover+'%)'); if(got!==want){ errs++; res[res.length-1]+=' WANT '+want; } }
console.log('1 the cases:', res.join(' | '));
const ms0=Date.now(); look([wall(11.5,4),wall(16.5,5),{x:20,y:14,w:7.5,h:9,seed:9,base:1.2,thick:0.5,tone:138,rot:0,under:-1}],[]); for(let i=0;i<30;i++) draw(); console.log('2 a drawn frame under the roof', ((Date.now()-ms0)/30).toFixed(1), 'ms (fake canvas)');
console.log('errs', errs);
`);
