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
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, sl=()=>JSON.stringify(Object.fromEntries(ALL_SLOTS.map(k=>[k, slotsOf()[k] ? slotsOf()[k].id : null])));
// skip the opening
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
enterScene('meadow'); run(10); clear();
console.log('1 new game, all slots empty:', sl(), '| any slot drawn', ALL_SLOTS.some(k=>slotShow(slotsOf()[k])));
const give=t=>{ collect({type:t, x:h.x, y:h.y}); run(20); };
give('turnipseed'); give('turnip'); give('carrot');
console.log('2 auto-equip into empty slots in order:', sl());
state.tipsSeen.slotsFull=false; give('berries'); const tip=state.texts.find(t=>/slots are full/.test(t.text));
console.log('3 full bar never overwritten:', sl(), '| pointed to R and the pack:', !!tip);
state.inv.sword=true; run(20); console.log('4 sword goes to F? F was empty:', slotsOf().f&&slotsOf().f.id, '| equip', state.equip);
clear();
// A plants (seeds sit in A)
const q=WORLD.meadow.feat.plots[0]; h.x=q[0]*W; h.y=q[1]*H; run(3); const s0=state.inv.bag.turnipseed; press('a'); run(5);
console.log('5 A (holding seeds) plants:', state.inv.bag.turnipseed===s0-1, '| seeds left', state.inv.bag.turnipseed, '| A slot now', slotsOf().a);
h.x=W*0.2; h.y=H*0.8; run(3); h.vig=3; const f0=state.inv.food.length; press('s'); run(3);
console.log('6 S eats the turnip:', state.inv.food.length===f0-1, '| S emptied when it ran out', slotsOf().s===null);
// wheel: hold R -> consumables only, the world nearly stops
state.inv.food.push('carrot','turnip'); run(20); clear(); h.vig=2;
state.keys.r=true; run(20); const R=state.radial, t0=state.time; run(60); const slow=(state.time-t0);
console.log('7 hold R: wheel of', R&&R.opts.map(o=>o.kind+':'+o.id).join(','), '| slot mode', R&&R.slot, '| world time over 1s of frames', slow.toFixed(3));
const ci=R.opts.findIndex(o=>o.id==='carrot'); R.sel=ci; const c0=state.inv.food.filter(x=>x==='carrot').length; state.keys.r=false; run(3);
console.log('8 release on carrot eats it now:', state.inv.food.filter(x=>x==='carrot').length===c0-1, '| wheel closed', !state.radial);
// R + D: everything assignable for D
state.inv.acorns=5; run(20); clear();
state.keys.r=true; run(20); press('d'); const R2=state.radial;
console.log('9 R+D lists everything that can go in D:', R2&&R2.slot, R2&&R2.opts.map(o=>o.id).join(','));
R2.sel=R2.opts.findIndex(o=>o.id==='acorn'); state.keys.r=false; run(3);
console.log('10 released on acorns: D =', slotsOf().d&&slotsOf().d.id, '| slots', sl());
// D throws acorns (a weapon slotted off F uses the same throw)
h.x=W*0.5; h.y=H*0.5; run(3); const a0=state.inv.acorns; state.keys.d=true; run(20); state.keys.d=false; run(10);
console.log('11 D throws an acorn:', state.inv.acorns===a0-1, '| equip now', state.equip);
// F swings the sword (nothing to do here)
h.x=W*0.5; h.y=H*0.3; run(3); press('f',2); console.log('12 F with the sword in F swings:', state.equip==='sword', '| swinging', !!(state.atk||state.hold.t>0||state.whirl));
// move the sword to A, F to carrot: A swings, F eats
setSlot('a',{kind:'weapon',id:'sword'}); setSlot('f',{kind:'food',id:'turnip'}); run(20); h.vig=2; const tf=state.inv.food.filter(x=>x==='turnip').length;
state.atk=null; press('a',2); const swungA=!!(state.atk||state.hold.t>0); run(40); press('f'); run(3);
console.log('13 sword on A swings:', swungA, '| F eats the turnip in F:', state.inv.food.filter(x=>x==='turnip').length===tf-1);
// tap R steps F through weapons
setSlot('f',{kind:'weapon',id:'sword'}); run(3); press('r'); run(3); console.log('14 tap R: F', slotsOf().f&&slotsOf().f.id, '| acorns moved out of D', slotsOf().d);
// menus: D goes back
toggleMenu(); run(2); state.menu.focus='acts'; press('d'); const f1=state.menu&&state.menu.focus; press('d'); const f2=state.menu&&state.menu.focus; press('d');
console.log('15 D in the pack: acts ->', f1, '->', f2, '-> closed', !state.menu);
toggleMenu(); run(2); state.menu.tab=PACK_TABS.indexOf('Food'); state.menu.focus='grid'; press('f'); console.log('16 F selects (grid -> actions):', state.menu&&state.menu.focus); press('d'); press('d'); press('d'); console.log('   closed again', !state.menu);
// wearables
console.log('17 wear slots', wearSlots(), '| owned', gearOwned().join(',')||'none');
gainGear('feather'); clear(); console.log('18 Pip\\'s feather: worn', wears('feather'));
Object.assign(rawOf(),{stone:2, glue:1}); state.inv.craftSlots=3; state.mat=['stone','stone','glue']; craftNow(); clear();
console.log('19 crafted a river-stone charm:', gearOwned().includes('stonecharm'), '| worn', wears('stonecharm'), '| stones left', rawOf().stone);
h.vig=maxVig(); h.invuln=0; const v0=h.vig; hurtHero(1, h.x+10, h.y); const lost=v0-h.vig; toggleWear('stonecharm'); h.vig=maxVig(); h.invuln=0; hurtHero(1,h.x+10,h.y); const lost2=maxVig()-h.vig;
console.log('20 stone charm on: lost', lost.toFixed(2), '| off:', lost2.toFixed(2));
state.inv.mats.ember=1; rawOf().stone=1; rawOf().glue=1; state.mat=['stone','glue','ember']; craftNow(); clear();
console.log('21 ember charm made:', gearOwned().includes('embercharm'), '| worn (2 slots, feather + ember)', wears('embercharm'), '| worn list', state.inv.worn.join(','));
run(20); console.log('22 Flare now slottable:', slotOptions().some(o=>o.id==='flare'));
setSlot('s',{kind:'ability',id:'flare'}); state.enemies=[]; h.vig=maxVig(); const vf=h.vig; press('s'); console.log('23 S flares:', h.vig<vf);
console.log('24 full wear: try the stone charm again ->', toggleWear('stonecharm'));
state.menu={view:'pack',tab:PACK_TABS.indexOf('Wear'),sel:0,focus:'grid',act:0}; draw(); console.log('25 Wear tab cells', packCells('Wear').map(c=>c.name+(c.mark?'*':'')).join(', ')); state.menu=null;
// Pip stays by what Pip points out until you've read it
state.inv.sword=false; enterScene('camp'); state.inv.story=STORY.gather; run(5); clear(); const p=state.pip; delete state.inv.pipTips.test1; state.pipTalkT=-9;
pipSay('test1','Look at this rock!', [W*0.3,H*0.7]); for(let k=0;k<200 && !(p.visit&&p.visit.said);k++) run(1);
h.x=p.x+UNIT; h.y=p.y; run(90); const stay=!!p.visit;
const px=p.x; for(let k=0;k<60;k++){ state.keys.arrowright=true; run(1);} state.keys.arrowright=false;
console.log('26 you came over, text unread: Pip waits there', stay, '| hero moved while reading', h.x>px+UNIT*2, '| Pip still there', Math.hypot(p.x-px,0)<UNIT*0.5);
h.x=p.x+UNIT; run(3); press('f'); run(90); console.log('27 after F: Pip carries on', !p.visit);
// talking to someone: you can walk while paging, but not leave the screen
enterScene('camp'); run(5); clear(); const toadN={kind:'toad',fx:0.5,fy:0.5}; state.npcTalk={n:toadN,lines:['one','two'],i:0,then:null};
const hx=h.x; for(let k=0;k<30;k++){ state.keys.arrowleft=true; run(1);} state.keys.arrowleft=false; console.log('28 walking during a conversation:', Math.abs(h.x-hx)>UNIT);
h.x=UNIT*0.5; h.y=H*0.5; state.keys.arrowleft=true; run(30); state.keys.arrowleft=false; console.log('29 exits wait until it ends:', state.scene==='camp'); state.npcTalk=null;
// old save slots
const inv=state.inv; inv.slots={a:{kind:'ability',id:'dodge'}, s:{kind:'food',id:'auto'}, d:{kind:'seed',id:'auto'}}; inv.slotV=1; inv.step=1;
console.log('30 old save slots:', sl());
console.log('BUILD', BUILD, '| errs', errs);
`);
