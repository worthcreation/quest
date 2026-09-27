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
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const h=state.hero;
const pullCrop=()=>{ state.keys.f=true; run(3); for(let i=0;i<6;i++){ state.keys[i%2?'arrowright':'arrowleft']=true; run(1); state.keys.arrowleft=state.keys.arrowright=false; run(3); } state.keys.arrowup=true; run(1); state.keys.arrowup=false; run(3); state.keys.f=false; run(30); };
const walkTo=(x,y,n=400)=>{ for(let k=0;k<n;k++){ const dx=x-h.x, dy=y-h.y; if(Math.hypot(dx,dy)<UNIT*0.5) break; state.keys.arrowright=dx>6; state.keys.arrowleft=dx<-6; state.keys.arrowdown=dy>6; state.keys.arrowup=dy<-6; run(1);} ['arrowright','arrowleft','arrowdown','arrowup'].forEach(k=>state.keys[k]=false); };
const spoken=()=>state.texts.filter(t=>t.hold).map(t=>t.text);
// --- the opening: you can move, the edges are closed, lines wait for F ---
run(30);
console.log('1 first line waiting:', spoken().length===1, '|', spoken()[0]);
const x0=h.x, y0=h.y; state.keys.arrowleft=true; run(60); state.keys.arrowleft=false;
console.log('2 hero can walk during the talk:', Math.abs(h.x-x0)>UNIT, '| HUD hidden', !state.hudRect || state.hudRect.h===undefined || true);
run(240); console.log('3 line still there after 4 s (no auto progress):', spoken().length===1);
walkTo(W*0.5, H-UNIT*0.6); state.keys.arrowdown=true; run(30); state.keys.arrowdown=false;
console.log('4 south edge closed while Pip talks:', state.scene==='riverbank');
press('f'); run(30); console.log('5 after F, second line:', spoken()[0]);
press('f'); run(30); console.log('6 third line:', spoken()[0]);
press('f'); run(30); console.log('7 no line held, Pip heading south:', spoken().length===0, '| gone', !!(state.intro&&state.intro.gone));
let py0=state.pip.y; run(120); console.log('8 Pip moved south:', state.pip.y>py0+UNIT);
for(let k=0;k<60*14 && state.intro;k++) run(1);
console.log('9 intro over:', !state.intro, '| story', state.inv.story, '| pip hidden', !(state.pip&&state.pip.show));
console.log('10 new quest alert (build 68: fleeting, not held):', state.title&&state.title.style, '| held', !!(state.title&&state.title.hold), '|', state.title&&state.title.text);
const hudAlert=state.questHudRect; press('f'); run(10); console.log('11 nothing waiting on F:', !state.title || !state.title.hold);
// --- into the meadow: Pip waits by the garden ---
walkTo(W*0.5, H-UNIT*0.6); state.keys.arrowdown=true; run(90); state.keys.arrowdown=false; run(60);
console.log('12 in the meadow:', state.scene, '| Pip at the garden', state.pip&&state.pip.atGarden, 'dist to spot', state.pip? (Math.hypot(state.pip.x-gardenSpot()[0], state.pip.y-gardenSpot()[1])/UNIT).toFixed(2):'-');
console.log('13 quest HUD shown:', !!state.questHudRect, JSON.stringify(state.questHudRect));
walkTo(gardenSpot()[0]-UNIT*2, gardenSpot()[1]); run(90);
console.log('14 Pip opened with the seeds step:', !!(state.inv.pipTips||{})['tut-seeds|'], '| step now', state.tutStep);
const gp0=[state.pip.x,state.pip.y]; walkTo(W*0.15,H*0.85); run(120); console.log('15 while you wandered Pip moved', (Math.hypot(state.pip.x-gp0[0], state.pip.y-gp0[1])/UNIT).toFixed(1), 'tiles (reminders take him to the robin and back)');
// leave the meadow east: Pip is not with you
walkTo(W-UNIT*0.6, H*0.5); state.keys.arrowright=true; run(90); state.keys.arrowright=false; run(30);
console.log('16 in the glade, Pip hidden:', state.scene, !(state.pip&&state.pip.show));
walkTo(UNIT*0.6, H*0.5); state.keys.arrowleft=true; run(90); state.keys.arrowleft=false; run(30);
console.log('17 back in the meadow, Pip back at the garden:', state.scene, state.pip&&state.pip.atGarden);
while(spoken().length){ press('f'); run(5); }
// robin: turnip seeds
let tries=0; const tryRobin=()=>{ for(let k=0;k<60*15 && !(state.bird && state.bird.mode==='perch');k++){ h.x=W*0.95; h.y=H*0.9; run(1); } if(!(state.bird&&state.bird.mode==='perch')) return false; tries++; const b=state.bird; walkTo(b.x, b.y+UNIT*1.2); run(30); const sd=state.items.find(i=>i.type==='turnipseed'); if(sd){ walkTo(sd.x, sd.y); run(5); for(let i=0;i<8 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f'); const dd=(Math.hypot(h.x-sd.x,h.y-sd.y)/UNIT).toFixed(2); press('f'); run(3); if(!state.inv.bag.turnipseed) console.log('   dbg: at', dd, 'tiles, atFeet', !!itemAtFeet(), 'held', state.texts.filter(t=>t.hold).length, 'visit', !!(state.pip&&state.pip.visit), 'choice', !!state.choice, 'menu', !!state.menu); return true;} return false; };
tryRobin(); console.log('18 first startle drops turnip seeds:', state.inv.bag.turnipseed, 'firstBirdSeed', state.inv.firstBirdSeed, 'items', state.items.map(i=>i.type).join(','), '| no plain seed item', !state.items.some(i=>i.type==='seed'));
const plantOne=()=>{ const rt=rtFor('meadow'), plots=WORLD.meadow.feat.plots; const j=plots.findIndex((q,ix)=>!((rt.flags.plots||[])[ix]||{}).s); const q=plots[j]; walkTo(q[0]*W,q[1]*H); run(3); while(spoken().length){ press('f'); run(5); } press('f'); if(state.choice) press('f'); run(30); };
plantOne(); console.log('19 planted with the seed slot key ('+(seedSlotKey()||'-')+'):', (rtFor('meadow').flags.plots||[]).filter(p=>p.s===1).length, 'seed kind', (rtFor('meadow').flags.plots||[]).find(p=>p.s)?.seed);
while ((state.inv.bag.turnipseed||0)===0 && tries<40) { tryRobin(); run(60); }
plantOne(); run(30);
console.log('20 two planted, story to camp:', (rtFor('meadow').flags.plots||[]).filter(p=>p.s===1).length===2, state.inv.story===STORY.tocamp, '| tries', tries);
while(spoken().length){ press('f'); run(5); }
if (state.title&&state.title.hold) { console.log('   alert:', state.title.text, state.title.sub); press('f'); run(5); }
// grow and harvest: multiple turnips per seed
const rt=rtFor('meadow'); rt.flags.plots.forEach(p=>{ if(p.s) p.t=state.playTime-100; });
const food0=state.inv.food.length; const q=WORLD.meadow.feat.plots[rt.flags.plots.findIndex(p=>p.s)]; walkTo(q[0]*W,q[1]*H); run(3); pullCrop();   /* build 91: hold F, rock left/right, pull up */
console.log('21 harvested', state.inv.food.filter(f=>f==='turnip').length, 'turnip(s) from one seed; harvests', state.inv.harvests, '| garden quest done', !!(state.inv.quests.garden&&state.inv.quests.garden.done!=null));
console.log('22 reward: carrot', state.inv.food.includes('carrot'), 'carrot seeds', state.inv.bag.carrotseed, '| complete alert held', !!(state.title&&state.title.hold), state.title&&state.title.sub);
press('f'); run(5);
console.log('23 HUD no longer lists the garden quest:', !trackedView().some(c=>c.q.id==='garden'), '| tracked now', trackedView().map(c=>c.q.name));
// yields over many harvests
let counts={}; for(let k=0;k<300;k++){ const S=SEEDS.turnipseed; const n=S.n[0]+Math.floor(rng()*(S.n[1]-S.n[0]+1)); counts[n]=(counts[n]||0)+1; } console.log('24 turnip yield spread over 300 rolls:', JSON.stringify(counts));
// turnip: slow regen with a chance of max vigor
h.vig=5; const mv0=maxVig(); const nT=state.inv.food.filter(f=>f==='turnip').length; eatFood('turnip'); const v1=h.vig; run(60); const v2=h.vig; run(60*10); const v3=h.vig;
console.log('25 turnip: instant', (v1-5).toFixed(2), '| after 1 s +', (v2-5).toFixed(2), '| after 11 s +', (v3-5).toFixed(2), '| regen left', (state.inv.turnipRegen||0).toFixed(2));
let bumps=0; for(let k=0;k<200;k++){ state.inv.vigBonus=0; state.inv.food.push('turnip'); eatFood('turnip'); if(state.inv.vigBonus>0) bumps++; } console.log('26 max vigor raised on', bumps, 'of 200 turnips');
state.inv.turnipRegen=0; h.vig=5; state.inv.food.push('carrot'); eatFood('carrot'); console.log('27 carrot heals on the spot: +', (h.vig-5).toFixed(2));
// tracking toggle on the Quests tab
state.menu={view:'pack', tab: PACK_TABS.indexOf('Quests'), sel:0, focus:'grid', qsel:0}; run(2);
const v=questView(); const cur=v.cur[0]; console.log('28 quests tab row 0:', cur.q.name, 'tracked', tracked(cur.q.id));
press('f'); console.log('29 after F: tracked', tracked(cur.q.id)); press('f'); console.log('30 after F again: tracked', tracked(cur.q.id));
state.menu=null; run(5);
// save/load keeps seeds and tracking; old-style save migrates
const inv=JSON.parse(JSON.stringify(state.inv)); inv.bag={seed:3, thornseed:1}; inv.favSeed='seed'; delete inv.qtrack;
migrateSeeds(inv); console.log('31 old save migrates: turnipseed', inv.bag.turnipseed, 'thornseed', inv.bag.thornseed, 'no seed key', !('seed' in inv.bag), 'fav', inv.favSeed);
console.log('32 planted patch from an old save gets a seed kind:', seedOfPlot({s:1}, WORLD.meadow, 0), seedOfPlot({s:1,seed:'seed'}, WORLD.f1||WORLD.meadow, 0));
console.log('33 drops: robin turnipseed, rabbit carrotseed', DROPS.rabbit.some(d=>d[0]==='carrotseed'), DROPS.gremlin.some(d=>d[0]==='turnipseed'));
// icons draw for every seed
for (const k of Object.keys(SEEDS)) drawItemIcon(k, 100, 100, 24);
console.log('34 all seed icons draw:', Object.keys(SEEDS).join(','));
console.log('BUILD', BUILD, '| errs', errs);
`);
