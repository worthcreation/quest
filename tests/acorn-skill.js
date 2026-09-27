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
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
begin(); state.cut=null; enterScene('meadow'); state.cut=null;
const h=state.hero, inv=state.inv; run(3);
state.solids=[]; state.items=[]; state.enemies=[];
// a rabbit that keeps darting across the line of fire: each trial it starts 5 tiles ahead, offset a little, moving sideways
function trial(lvl){
  setSkillLevel('acorn', lvl); const s=skillOf('acorn'); s.lvl=lvl;   // hold the level: reset counters so practice during the trial cannot raise it
  let hits=0, N=300;
  for(let i=0;i<N;i++){
    state.enemies=[]; state.shots=[]; state.texts=[];
    h.x=W*0.3; h.y=H*0.5; h.fx=1; h.fy=0; h.vx=h.vy=0; h.vig=maxVig(); h.z=0;
    const e=makeEnemy('rabbit', h.x+UNIT*5, h.y+(Math.random()*2-1)*UNIT*1.5, -1);
    e.hp=99; e.mode='idle'; e.t=9; e.cool=9;                       // stays in idle: wanders at random, no dart at the hero
    e.vx=0; e.vy=(Math.random()<0.5?-1:1)*0.35*L();                 // crossing the line of fire
    state.enemies.push(e);
    inv.acorns=30; state.equip='acorn';
    const hit0=s.hits;
    launch('acorn', 0.6);
    run(60);
    if(s.hits>hit0) hits++;
    s.hits=hit0; s.n=0; s.lvl=lvl;                                  // hold the level
  }
  return hits/N;
}
inv.silk=0;
ACORN_HOME.push(0); ACORN_SPREAD.push(0); const base=trial(5); ACORN_HOME.pop(); ACORN_SPREAD.pop(); console.log('no spread, no homing (build 61 behaviour):', (base*100).toFixed(0)+'%'); const rates=[0,1,2,3,4].map(trial); console.log('by level 0..4:', rates.map(r=>(r*100).toFixed(0)+'%').join(' ')); const r0=rates[0], r3=rates[3];
console.log('hit rate vs crossing rabbit, 300 throws each: level 0', (r0*100).toFixed(0)+'%', '| level 3', (r3*100).toFixed(0)+'%', '| better', r3>r0+0.1);
// homing only inside the cone: a rabbit off to the side is ignored
setSkillLevel('acorn',3); state.enemies=[]; state.shots=[]; h.x=W*0.3; h.y=H*0.5; h.fx=1; h.fy=0;
const side=makeEnemy('rabbit', h.x+UNIT*1, h.y-UNIT*4, -1); side.mode='idle'; side.t=9; side.cool=9; side.hp=99; state.enemies.push(side);
launch('acorn',0.6); const sh=state.shots[0]; const a0=Math.atan2(sh.vy,sh.vx); run(5); const a1=Math.atan2(sh.vy,sh.vx);
console.log('rabbit outside the cone: acorn turned', Math.abs(a1-a0).toFixed(3), 'rad (spread only)');
// level-up: the line fires once, in the skill colour, and only when the step is crossed
setSkillLevel('acorn',0); state.texts=[]; state.enemies=[]; state.shots=[]; const sk=skillOf('acorn');
for(let i=0;i<11;i++){ inv.acorns=30; launch('acorn',0.3); run(3); }
const early=state.texts.filter(t=>t.color===SKILL_COLOR).length;
inv.acorns=30; launch('acorn',0.3); run(3);
const up=state.texts.filter(t=>t.color===SKILL_COLOR);
for(let i=0;i<5;i++){ inv.acorns=30; launch('acorn',0.3); run(3); }
const later=state.texts.filter(t=>t.color===SKILL_COLOR);
console.log('after 11 throws: lines', early, '| 12th throw: level', sk.lvl, 'lines', up.length, JSON.stringify(up.map(t=>t.text)), '| 5 more throws: still', later.length, 'line');
// hits count double: 18 hits alone reach level 2 (36)
setSkillLevel('acorn',0); state.texts=[]; for(let i=0;i<18;i++) skillUse('acorn',true); console.log('18 hits: level', skillOf('acorn').lvl, '| text', JSON.stringify(state.texts.filter(t=>t.color===SKILL_COLOR).map(t=>t.text)));
// old save without a skill field loads and lazily gets one
delete inv.skill; console.log('old inventory: level', skillLevel('acorn'), '| spread deg at 0/4', ACORN_SPREAD[0], ACORN_SPREAD[4]);
// save round trip keeps it
setSkillLevel('acorn',2); saveSlot(0); setSkillLevel('acorn',0); loadSlot(0); console.log('save/load keeps level', skillLevel('acorn'));
console.log('BUILD', BUILD, '| errs', errs);
`);
