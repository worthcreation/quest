global.location = { search: '?puzzle' };
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
begin();
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(60);
console.log('mode', PUZZLE, 'start scene', state.scene, 'portals', WORLD.puzzlehub.feat.portals.length, 'pip along', pipWithYou());
const cheats = { thicket: ()=>{ rtFor('start').flags.thicket=true; }, gate: ()=>{ breakBarrier('crack1','rock'); }, ring: ()=>{ breakBarrier('crack2','rock'); }, sword: ()=>{ state.inv.sword=true; },
  gusts: ()=>{ enterScene('f4'); }, strong: ()=>{ enterScene('f6'); }, ford: ()=>{ state.hero.y=H*0.05; }, rapids: ()=>{ state.rapids.dist=RAPIDS.len; state.rapids.planks=3; }, reeds: ()=>{ rtFor('m3').flags.reeds=true; }, crags: ()=>{ enterScene('peak3'); }, webs: ()=>{ rtFor('h2').flags.webs=true; } };
for (const q of WORLD.puzzlehub.feat.portals) {
  if (state.scene!=='puzzlehub') { enterScene('puzzlehub'); run(5); }
  const h=state.hero; h.x=q.fx*W; h.y=q.fy*H+UNIT*1.1; run(3);
  const hint=state.actionHint && state.actionHint.verb; press('f'); run(60*6);
  const p=PUZZLES.find(o=>o.id===q.pid);
  const inScene=state.scene, foes=state.enemies.filter(e=>!e.dead).length, rt=RT[p.scene];
  cheats[q.pid](); run(60*2); const solved=state.puzzle && state.puzzle.solved; const title=(state.title && state.title.sub) || 'Q:'+JSON.stringify((state.titleQ||[]).map(t=>t.text))+' speaking '+speakingNow()+' texts '+JSON.stringify(state.texts.map(t=>t.key));
  run(60*4);
  console.log(q.pid.padEnd(8), 'hint', hint, '| entered', inScene, '| foes', foes, '| solved', solved, '|', title, '| back at', state.scene);
}
console.log('records', JSON.stringify(puzzleRecords()));
// retry from the System tab resets the puzzle
enterPuzzle(PUZZLES[0]); run(60*2); rtFor('start').flags.thicket=true; state.puzzle.solved=true; enterPuzzle(PUZZLES[0]); run(60*2); console.log('retry resets brambles', !broken('start','thicket'));
console.log('errs', errs2);
`);