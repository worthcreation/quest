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
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
enterScene('start'); state.enemies=[]; run(10); clear();
// 1. walking over something no longer picks it up; F does
const it={type:'stick', x:W*0.5, y:H*0.5}; state.items.push(it); h.x=it.x; h.y=it.y; run(30);
const stillThere=state.items.includes(it); const r0=(rawOf().stick||0); press('f'); run(3);
console.log('1 standing on a stick: still on the ground', stillThere, '| F picks it up', !state.items.includes(it) && (rawOf().stick||0)===r0+1);
// 2. spores and wisps are still taken by touch
const sp={type:'wisp', x:W*0.3, y:H*0.5}; state.items.push(sp); h.x=sp.x; h.y=sp.y; run(3); console.log('2 a wisp is taken by touch', !state.items.includes(sp));
// 3. sparkles: count over 4 s, far vs near vs in reach (no button drawn)
const count=(dist)=>{ const x={type:'acorn', x:W*0.6, y:H*0.5}; state.items.push(x); h.x=x.x-dist*UNIT; h.y=x.y; let n=0, kinds={}; const seen=new Set(); for(let k=0;k<240;k++){ run(1); const G=GLINTS.get(x); if(G) for(const g of G.gl){ if(!seen.has(g)){ seen.add(g); n++; kinds[g.kind]=(kinds[g.kind]||0)+1; } } } const hint=state.actionHint&&state.actionHint.verb; state.items.splice(state.items.indexOf(x),1); return {n, kinds:Object.keys(kinds).sort().join('+'), hint}; };
const far=count(9), near=count(3), at=count(0.6);
console.log('3 sparkles in 4 s: far', far.n, far.kinds, '| near', near.n, near.kinds, '| in reach', at.n, at.kinds, '| action label in reach', at.hint||'none');
// 4. pounding: hidden loose spots, found once each, rattle nearby
const spots=looseSpots(); console.log('4 loose spots on the glade:', spots.length);
const s0=spots[0]; const n0=state.items.length; h.x=s0.fx*W+UNIT*2.5; h.y=s0.fy*H; const fx0=state.fx.length; poundLoose(h.x,h.y); const rattled=state.fx.length>fx0;
h.x=s0.fx*W; h.y=s0.fy*H; poundLoose(h.x,h.y); const got=state.items.length-n0; poundLoose(h.x,h.y); const again=state.items.length-n0;
console.log('5 close but not quite: the ground rattles', rattled, '| on it: shook loose', got, state.items[state.items.length-1].type, '| pounding again gives nothing more', again===got);
let tot={}; for(let k=0;k<400;k++){ rtFor('start').flags.loose=null; const sp2=looseSpots()[0]; poundLoose(sp2.fx*W, sp2.fy*H); const t=state.items.pop().type; tot[t]=(tot[t]||0)+1; } console.log('6 400 finds:', JSON.stringify(tot));
// through the real stomp: jump then F
rtFor('start').flags.loose=null; const sp3=looseSpots()[0]; h.x=sp3.fx*W; h.y=sp3.fy*H; run(3); const n1=state.items.length; press(' '); run(8); press('f'); run(60); console.log('7 jump + F on a loose spot:', state.items.length>n1, '| found', sp3.found);
// 8. Pip's lines
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
state.inv.story=STORY.gather; state.inv.pipTips.shopping=true; delete state.inv.pipTips.pound; delete state.inv.pipTips.compost; state.inv.acorns=2; enterScene('start'); state.pipTalkT=-9; for(let k=0;k<60*10;k++){ run(1); clear(); }
console.log('8 Pip:', said.filter(t=>/pound|compost/.test(t)).join(' / '));
console.log('9 the first patch step:', PATCH[1].how, '|', patchCost(PATCH[1].cost));
// 10. quest HUD: bright on a milestone, then light
state.qPulse={camp: state.time}; const g0=questGlow(state.qPulse.camp); run(60*4); const g1=questGlow(state.qPulse.camp); run(60*3); const g2=questGlow(state.qPulse.camp);
console.log('10 quest row glow: at the milestone', g0, '| 4 s', g1.toFixed(2), '| 7 s', g2.toFixed(2), '(then the light see-through look)');
state.qDone=[{q:QUESTS[0], t:state.time}]; draw(); const shown=state.questHudRect&&state.questHudRect.h; run(60*7); draw(); console.log('11 a finished quest shows ticked, then goes:', !!shown, (state.qDone||[]).length===0);
console.log('BUILD', BUILD, '| errs', errs);
`);
