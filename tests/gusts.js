const src=require('fs').readFileSync(require('path').join(__dirname,'..','index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1];
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
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const all=[]; for (const [id,sc] of Object.entries(WORLD)) for (const g of sc.gusts||[]) all.push(g.s);
console.log('gust strengths in the world', [...new Set(all)].join(','));
const deg = (x,y) => (Math.atan2(y,x)*180/Math.PI).toFixed(0);
// push vs streaks for each f4 gust direction
enterScene('f4'); state.cut=null; state.enemies=[]; const h=state.hero;
for (let gi=0; gi<WORLD.f4.gusts.length; gi++) {
  let px=W*0.5, py=H*0.2; for (let q=0;q<40 && (onRock(sceneDef(),px,py,-UNIT) || state.solids.some(o=>Math.hypot(o.x-px,o.y-py)<o.r+UNIT*2));q++){ px=W*(0.25+0.5*Math.random()); py=H*(0.12+0.15*Math.random()); } h.x=px; h.y=py; h.vx=h.vy=0; state.gustIdx=gi; state.gustPhase='blow'; state.gust=1; state.gustT=0; state.fx=[];
  const x0=h.x,y0=h.y; for(let k=0;k<20;k++){ state.gustIdx=gi; state.gustPhase='blow'; state.gustT=0; update(1/60);} 
  const st=state.fx.filter(p=>p.color==='streak'); const sv=st.length? [st[0].vx, st[0].vy] : [0,0];
  const g=WORLD.f4.gusts[gi];
  console.log('gust', gi, 'angle a', g.a.toFixed(2), '| hero pushed toward', deg(h.x-x0,h.y-y0)+'°', '| streaks move toward', deg(sv[0],sv[1])+'°');
}
// a wind ride goes the same way and the same distance whatever the gust
for (let gi=0; gi<WORLD.f4.gusts.length; gi++) { h.x=W*0.5; h.y=H*0.2; h.ride=null; state.gustIdx=gi; const ok=rideGust(WORLD.f4); const r=h.ride; const g=WORLD.f4.gusts[gi]; console.log('ride', gi, 'gust toward', deg(Math.sin(g.a),Math.cos(g.a))+'°', ok ? '| lands on a ledge toward '+deg(r.x1-r.x0, r.y1-r.y0)+'°, '+(Math.hypot(r.x1-r.x0,r.y1-r.y0)/UNIT).toFixed(1)+' tiles' : '| no ledge that way: plain jump'); h.ride=null; state.cam.focus=null; }
// stomp mid-ride: drop where you are
h.x=W*0.5; h.y=H*0.2; state.gustIdx=1; rideGust(WORLD.f4); run(25); const zx=h.x, zy=h.y, zz=h.z; state.keys.f=true; run(1); state.keys.f=false; run(40);
console.log('stomp mid-ride at height', (zz/UNIT).toFixed(1), '| ride ended', !h.ride, '| moved after the stomp', (Math.hypot(h.x-zx,h.y-zy)/UNIT).toFixed(2), 'tiles | pounded', true);
// enemies and the ravine
const c=WORLD.f4.chasms[0]; const lipY=c[1]*H-UNIT*0.6;
let r1=makeEnemy('rabbit', W*0.3, lipY, -1); r1.mode='idle'; r1.t=99; state.enemies=[r1]; r1.vx=0; r1.vy=UNIT*3; run(40); console.log('walking rabbit at the lip: stays up', !r1.falling && !r1.dead, 'y', (r1.y/H).toFixed(3), 'lip', c[1].toFixed(3));
let cx=W*0.3; for (let q=0.15;q<0.86;q+=0.03){ const X=q*W; if(!state.solids.some(o=>Math.abs(o.x-X)<o.r+UNIT*1.2 && o.y>lipY-UNIT*4 && o.y<c[3]*H+UNIT*2) && !(WORLD.f4.rocks||[]).some(r=>Math.abs(r.fx*W-X)<UNIT*1.5)){ cx=X; break; } } h.x=cx; h.y=c[3]*H+UNIT*1.5; let r2=makeEnemy('charger', cx, lipY-UNIT, -1); r2.mode='charge'; r2.t=1.2; r2.cx=0; r2.cy=1; r2.vx=0; r2.vy=L()*0.85; state.enemies=[r2]; for(let k=0;k<30;k++){ run(1); if(k%5==0) console.log('  charger y', (r2.y/H).toFixed(3), 'mode', r2.mode, 'falling', r2.falling, 'chasm here', isChasm(r2.x,r2.y), 'band', c[1].toFixed(2)+'-'+c[3].toFixed(2), 'x', (r2.x/W).toFixed(2)); } run(30); console.log('charging charger over the edge: fell', !!r2.dead);
let r3=makeEnemy('gremlin', W*0.3, lipY, -1); r3.mode='idle'; r3.t=99; state.enemies=[r3]; h.x=W*0.3; h.y=lipY-UNIT*1.3; h.fx=0; h.fy=1; state.inv.sword=true; damage(r3, 0.5, 'slash', 0, -1, true); r3.vy=UNIT*8; run(60); console.log('gremlin knocked into the ravine: fell', !!r3.dead);
enterScene('ford'); state.cut=null; let r4=makeEnemy('rabbit', W*0.5, H*0.94, -1); r4.mode='dart'; r4.t=1; r4.vy=-L()*0.6; state.enemies=[r4]; run(60); console.log('darting into the river: fell', !!r4.dead);
console.log('errs', errs2);
`);