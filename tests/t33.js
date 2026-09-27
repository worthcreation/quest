const src=require('fs').readFileSync('/mnt/user-data/outputs/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1];
const noop=()=>{}; const grad={addColorStop:(o,c)=>{ if(!(o>=0&&o<=1)) throw new Error('colorstop offset '+o); if(/NaN|undefined|Infinity/.test(String(c))) throw new Error('bad color '+c); }};
const chk=(name,vals)=>{ for(const v of vals) if(!(isFinite(v))) throw new Error(name+' non-finite '+vals.join(',')); };
const mkctx=()=>new Proxy({},{get:(t,k)=>{ if(k in t) return t[k];
 if(k==='measureText') return (s)=>({width:s.length*8});
 if(k==='arc') return (x,y,r)=>{ chk('arc',[x,y,r]); if(r<0) throw new Error('arc negative radius '+r); };
 if(k==='ellipse') return (x,y,rx,ry)=>{ chk('ellipse',[x,y,rx,ry]); if(rx<0||ry<0) throw new Error('ellipse negative radius '+rx+','+ry); };
 if(k==='createRadialGradient') return (x0,y0,r0,x1,y1,r1)=>{ chk('radial',[x0,y0,r0,x1,y1,r1]); if(r0<0||r1<0) throw new Error('radial negative '+r0+','+r1); return grad; };
 if(k==='createLinearGradient') return (a,b,c,d)=>{ chk('linear',[a,b,c,d]); return grad; };
 if(k==='addColorStop') return noop;
 if(k.startsWith('create')) return ()=>grad; return noop; },set:(t,k,v)=>(t[k]=v,true)});
const el=()=>({addEventListener:noop,getContext:mkctx,remove:noop,style:{},classList:{toggle:noop},dataset:{}});
const P=()=>{const param={value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};
 return new Proxy({},{get:(t,k)=>{ if(k in t) return t[k]; if(['gain','frequency','Q','pan'].includes(k)) return t[k]=param; if(k==='connect') return (n)=>n||P(); if(k==='getChannelData') return ()=>new Float32Array(10); return ()=>P(); }, set:(t,k,v)=>(t[k]=v,true)});};
class AC{constructor(){this.currentTime=0;this.sampleRate=100;this.state='running';this.destination=P();} createGain(){return P()} createOscillator(){return P()} createBufferSource(){return P()} createBiquadFilter(){return P()} createStereoPanner(){return P()} createBuffer(){return P()} resume(){}}
global.document={getElementById:el,querySelectorAll:()=>[],createElement:el,documentElement:{},addEventListener:noop};
global.window={AudioContext:AC,innerWidth:1280,innerHeight:800,devicePixelRatio:1,addEventListener:noop,matchMedia:()=>({matches:false})};
const store={}; global.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=String(v)}};
global.setTimeout=(f)=>{f()}; global.setInterval=noop; global.requestAnimationFrame=noop; global.performance={now:()=>0};
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const check = (label) => {
  const b = (state.textBoxes||[]).map(o=>({x:o.x,y:o.panel?o.y:o.drawY,w:o.w,h:o.h,size:o.size,panel:!!o.panel,text:o.t.text}));
  let pair=0, res=0, off=0, small=0;
  for (let a=0;a<b.length;a++) for (let c=a+1;c<b.length;c++) if (overlaps(b[a],b[c],0)) pair++;
  for (const o of b) { if (reservedRects().some(r=>overlaps(o,r,0))) res++; if (o.x<0||o.y<0||o.x+o.w>W||o.y+o.h>H) off++; if (o.size<14) small++; }
  return { label, shown: b.length, pair, res, off, small };
};
const settle = () => { for (let k=0;k<40;k++) { draw(); } };
const sizes = [[1280,800],[390,844],[667,375],[1024,768]];
let worst = { pair:0, res:0, off:0, small:0 };
for (const [w,h] of sizes) {
  window.innerWidth=w; window.innerHeight=h; resize();
  enterScene('start'); state.cut=null; RT.start.flags.ambush=true; const hero=state.hero; hero.x=W*0.5; hero.y=H*0.5; state.title=null;
  // stress: seven messages anchored at nearly the same spot, one on the hero, a long read, a title
  state.texts=[];
  for (let k=0;k<6;k++) say('Message number '+k+' about something nearby', W*0.5+k*4, H*0.45+k*3, { key:'s'+k, life: 30 });
  sayHero('The hero says something short.', { life: 30 });
  say('A letter, weighted with a pipe: "If you are reading this, you found my shack. Do not mind the smell. The pool downriver has fish as big as boots, so I lashed four logs of driftwood with thorn twine and went."', hero.x, hero.y, { key:'letter', life: 30 });
  showTitle('Sidequest: Downriver', 'build a raft', 'relic', 30);
  settle(); const r1=check(w+'x'+h+' stress');
  // texts pinned against each screen edge and the HUD corner
  state.texts=[]; state.title=null;
  say('Top left corner text', UNIT, UNIT, { key:'a', life: 30 }); say('Top right corner text', W-UNIT, UNIT, { key:'b', life: 30 });
  say('Bottom left text here', UNIT, H-UNIT, { key:'c', life: 30 }); say('Bottom right text here', W-UNIT, H-UNIT, { key:'d', life: 30 });
  settle(); const r2=check(w+'x'+h+' edges');
  for (const r of [r1,r2]) { console.log(r.label.padEnd(22), 'shown', r.shown, '| overlapping pairs', r.pair, '| over HUD/title/buttons', r.res, '| off screen', r.off, '| too small', r.small); for (const k of ['pair','res','off','small']) worst[k]=Math.max(worst[k], r[k]); }
}
window.innerWidth=1280; window.innerHeight=800; resize();
// the real game: run the scene tour and count frames where any text overlaps
let frames=0, bad=0; const realDraw=draw;
draw = function(){ realDraw(); frames++; const r=check('tour'); if (r.pair||r.res||r.off) bad++; };
for (const id of Object.keys(WORLD)) { enterScene(id); state.cut=null; state.hero.x=W*0.5; state.hero.y=H*0.6; for (let k=0;k<45;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; } } }
draw = realDraw;
console.log('tour frames', frames, 'frames with any overlap', bad);
console.log('WORST', JSON.stringify(worst), 'errs', errs2);
`);