const src = require('./harness.js').drawn;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
// 1. an old save with two actions on one key comes back to the defaults; slot labels A S D F, each once
const d={inv:JSON.parse(JSON.stringify(inv)), settings:{keys:{...DEFAULT_KEYS, dash:'d'}}}; state.settings.keys={...DEFAULT_KEYS, ...d.settings.keys}; if (new Set(Object.values(state.settings.keys)).size < Object.keys(state.settings.keys).length) state.settings.keys={...DEFAULT_KEYS}; refreshK && refreshK();
console.log('1 slot labels:', ALL_SLOTS.map(slotLabel).join(' '), '| each once', new Set(ALL_SLOTS.map(slotLabel)).size===4);
// 2. a long line from Pip: short pages, above Pip, never the bottom panel
enterScene('start'); state.enemies=[]; inv.story=STORY.gather; run(5); clear(); const p=state.pip||(state.pip={x:W*0.5,y:H*0.5,show:true,follow:true}); p.show=true;
say('We still need a fire ring and a bench. River stones from the riverbank, sticks from the forest, and rabbit fluff from the windy fields down south. For glue. Trust me.', p.x, p.y-UNIT*1.3, {key:'pip', color:'#bfe4ff'});
const t=state.texts.find(x=>x.key==='pip'); state.pip.x=W*0.5; state.pip.y=H*0.55; h.x=W*0.3; h.y=H*0.8; run(2); draw(); const bx=(t.lx!=null?t.lx:null);
console.log('2 pages:', 1+(t.more?t.more.length:0), '| first:', t.text);
const boxes=(state.textBoxes||[]); 
const b=layoutTexts().find(q=>q.t===t); console.log('   box near Pip (screen):', b? 'box centre x '+Math.round(b.x+b.w/2)+' vs Pip '+Math.round(toScreen(p.x,p.y)[0])+', box bottom '+Math.round(b.y+b.h)+' vs Pip top '+Math.round(toScreen(p.x,p.y-UNIT*1.3)[1])+', width '+Math.round(b.w) : 'unplaced', '| bottom panel', !!(b&&b.panel));
const pages=[t.text]; for(let i=0;i<3;i++){ press('f'); if(state.texts.includes(t)&&t.text!==pages[pages.length-1]) pages.push(t.text); } run(30); console.log('   F pages through:', pages.length, 'pages, then gone', !state.texts.includes(t));
// 3. Pip's everyday hints: light, fading, spaced out
state.pipTalkT=-99; delete inv.pipTips.hintA; delete inv.pipTips.hintB; pipSay('hintA','This is a hint.'); const ha=state.texts.find(x=>x.text==='This is a hint.'); const b2=pipSay('hintB','Another hint.');
console.log('3 hint held?', !!(ha&&ha.hold), '| size', ha&&ha.size, '| a second hint right after:', b2, '| gap', PIP_GAP, 's'); run(60*8); console.log('   the first faded by itself:', !state.texts.includes(ha));
// 4. Pip leads further ahead
enterScene('start'); inv.story=STORY.gather; state.pip=null; run(5); clear(); h.x=W*0.2; h.y=H*0.5; let dsum=0,n=0; for(let k=0;k<60*4;k++){ run(1); if(state.pip&&state.pip.show&&!state.pip.visit){ dsum+=Math.hypot(state.pip.x-h.x,state.pip.y-h.y)/UNIT; n++; } } console.log('4 Pip stands about', n?(dsum/n).toFixed(1):'-', 'tiles from you while leading');
// 5. the tent: Pip comes in, and the chest has seeds and acorns
enterScene('tentin'); run(20); console.log('5 Pip in the tent:', !!(state.pip&&state.pip.show), '| chest:', JSON.stringify(inv.chest));
const inv2=newInv(); console.log('   a new game chest:', JSON.stringify(inv2.chest));
// 6. the quest outro: a banner like the intro, with what was done, not waiting on F
QUESTS.push({ id:'tq', name:'A test quest', icon:'acorn', start:()=>true, steps:[{ id:'a', name:'Do it', line:()=>'do it', done:()=>!!state.tqDone }] }); QUEST_DID.tq='Did the thing, well.';
updateQuests(true); run(60*5); clear(); state.title=null; state.titleQ=[]; state.texts=[]; state.tqDone=true;
const seenT=[]; for(let k=0;k<60*7;k++){ run(1); if(state.title && !seenT.includes(state.title)) seenT.push(state.title); }
const T=seenT.find(x=>x.sub==='quest complete'); console.log('6 quest complete banner:', T&&T.text, '|', T&&T.note, '| held', !!(T&&T.hold), '| gone by itself', state.title!==T);
console.log('BUILD', BUILD, '| errs', errs);
`);
