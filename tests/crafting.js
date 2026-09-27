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
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
// 1. vigor bar: fixed, as wide as the slot row
enterScene('start'); state.enemies=[]; run(5); clear(); inv.sword=true; inv.acorns=3; inv.food.push('turnip','carrot'); run(30);
const s=Math.min(24, UNIT*0.6), row=s*(4*1.2+3*0.35); draw(); const w0=state.hudRect; inv.depth=3; draw(); const w1=state.hudRect; inv.depth=0;
console.log('1 vigor bar width', row.toFixed(1), '| same at depth 0 and 3:', w0.w===w1.w);
// 2. each of A S D F holds one thing, each thing in one slot; keys can't double up
setSlot('a',{kind:'weapon',id:'sword'}); setSlot('f',{kind:'weapon',id:'sword'}); const sl=slotsOf();
console.log('2 sword put on A then F:', ALL_SLOTS.filter(k=>sl[k]&&sl[k].id==='sword').join(','), '| distinct entries', new Set(ALL_SLOTS.filter(k=>sl[k]).map(k=>sl[k].kind+sl[k].id)).size===ALL_SLOTS.filter(k=>sl[k]).length);
assignKey('jump','a'); const km=state.settings.keys, vals=Object.values(km); console.log('   rebinding jump to A: every key used once', new Set(vals).size===vals.length, '| dash now', km.dash); assignKey('dash','a'); assignKey('jump',' ');
// 3. Pip's idea, the recipe book, lay it out, jump to Combine
inv.sword=false; setSlot('f',null); setSlot('a',null); run(10); inv.story=STORY.gather; rawOf().stick=3; inv.craftSlots=3; state.pipTalkT=-9; state.pip={x:h.x+UNIT,y:h.y,show:true,follow:true};
const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(t); return _s(t,x,y,o); };
for(let k=0;k<60*12 && !(inv.heard||{}).woodsword;k++){ run(1); if(k%20===0){ clear(); if(state.pip) state.pip.visit=null; } }
console.log('3 Pip:', said.find(t=>/sword/.test(t))||'(nothing)', '| heard', !!(inv.heard||{}).woodsword);
clear(); inv.story=STORY.adventure; inv.pipTaken=true; if(state.pip) state.pip.show=false; state.menu={view:'pack',tab:PACK_TABS.indexOf('Craft'),sel:3,focus:'grid',act:0}; const cells=packCells('Craft'); const bi=cells.findIndex(c=>c.recipe&&c.recipe.out==='woodsword');
state.menu.sel=bi; press('f'); console.log('4 F on the recipe lays it out:', JSON.stringify(state.mat), '| cursor jumped to Combine', state.menu.sel===0, '|', state.menu.note);
press('f'); console.log('5 combine: wooden sword', inv.woodsword, '| sticks left', rawOf().stick, '| in slot', ALL_SLOTS.find(k=>slotsOf()[k]&&slotsOf()[k].id==='woodsword'));
state.menu=null; run(10);
// 6. it splinters with every swing and hit, then shatters
h.x=W*0.2; h.y=H*0.85; state.enemies=[]; run(3); let swings=0, lastAtk=null; while(inv.woodsword>0 && swings<60){ clear(); state.atkCool=0; state.keys.f=true; run(1); if(state.atk&&state.atk!==lastAtk){ swings++; lastAtk=state.atk; } state.keys.f=false; run(24); }
console.log('6 swings at nothing until it shatters:', swings, '| gone from the slots', !ALL_SLOTS.some(k=>slotsOf()[k]&&slotsOf()[k].id==='woodsword'));
inv.woodsword=WOOD_SWORD; run(10); let strikes=0; const mk=()=>{ const e=makeEnemy('gremlin', h.x+UNIT*0.9, h.y, 0); e.hp=e.maxHp=99; e.mode='idle'; e.t=5; state.enemies=[e]; };
h.fx=1; h.fy=0; while(inv.woodsword>0 && strikes<40){ mk(); clear(); state.atkCool=0; press('f',2); run(20); strikes++; }
console.log('   strikes that land until it shatters:', strikes);
// 7. the mat's hints
const hint=m=>{ state.mat=m; return matHint(); };
console.log('7 hints: [fluff]', '"'+hint(['fluff'])+'"', '| [fluff,fluff]', '"'+hint(['fluff','fluff']).slice(-40)+'"', '| [stick,berries]', '"'+hint(['stick','berries'])+'"');
// 8. field recipes: augmentation and food
inv.woodsword=WOOD_SWORD; state.equip='woodsword'; inv.mats.thorn=1; rawOf().fluff=1; state.mat=['thorn','fluff']; state.menu={view:'pack',tab:2,sel:0,focus:'grid'}; craftNow();
console.log('8 thorn wrap on the blade:', JSON.stringify(inv.aug), '|', state.menu.note);
state.menu=null; h.vig=maxVig(); mk(); clear(); const e0=state.enemies[0]; const hp0=e0.hp; state.atkCool=0; press('f',2); run(20); console.log('   one hit with it (wood 0.6x, +1 from the wrap): dealt', (hp0-e0.hp).toFixed(2), '| hits left', inv.aug&&inv.aug.n);
inv.food.push('turnip','carrot','berries'); state.mat=['turnip','carrot']; const h1=matHint(); craftNow(); state.mat=['turnip','carrot','berries']; inv.food.push('turnip','carrot'); craftNow(); inv.acorns=2; inv.food.push('berries'); state.mat=['acorn','berries']; craftNow();
console.log('9 food: mash', inv.food.includes('mash'), '(hint: '+h1.slice(-38)+') | salad', inv.food.includes('salad'), '| trail mix', inv.food.includes('trailmix'));
state.menu=null;
// 10. the bench: weapon parts, not automatic
const silk0=inv.silk; collect({type:'silk', x:h.x, y:h.y}); clear(); console.log('10 diver silk picked up: sling level', inv.silk, '(was '+silk0+') | parts', inv.mats.silkpart);
state.menu={view:'forge',sel:0,note:''}; forgeSelect(FORGE.findIndex(f=>f.k==='silk')); console.log('   worked at the bench: sling level', inv.silk, '|', state.menu.note); state.menu=null;
// 11. journal lore
inv.heard={}; inv.pages=4; collect({type:'page',x:h.x,y:h.y}); inv.pages=7; collect({type:'page',x:h.x,y:h.y}); clear(); console.log('11 pages 5 and 8 give ideas:', JSON.stringify(inv.heard));
// 12. text about a place stays while you're there, lets go when you leave
inv.pipTaken=false; enterScene('meadow'); inv.story=STORY.garden; delete inv.pipTips.firstseed; delete inv.pipTips.plots; inv.pipTips.plots=true; inv.firstBirdSeed=true; inv.bag.turnipseed=1; run(10); clear();
const q=WORLD.meadow.feat.plots[0]; h.x=q[0]*W-UNIT; h.y=q[1]*H; state.pipTalkT=-9; for(let k=0;k<60*3;k++) run(1);
const line=state.texts.find(t=>/shove them/.test(t.text)); console.log('12 at the patches Pip says:', line&&line.text, '| free words (build 76), not waiting', !(line&&line.hold));
run(60*2); const still=state.texts.includes(line); h.x=q[0]*W+UNIT*9; h.y=q[1]*H; run(60); console.log('   still there after 2 s at the patches', still, '| walked away: faded', !state.texts.includes(line));
console.log('BUILD', BUILD, '| errs', errs);
`);
