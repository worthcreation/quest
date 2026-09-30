// Pip on a post: he never pops in beside you on a screen he isn't on (build 173).
// 1 waiting by the garden: hidden on every other screen, at the garden the first frame you arrive at the meadow.
// 2 gone ahead into the lean-to (the tour): hidden if you leave camp another way, then comes back in from the way on.
const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,200));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const bad=(c,m)=>{ if(c){ errs++; console.log('   FAIL', m); } };
run(10); for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
const h=state.hero, inv=state.inv, shown=()=>!!(state.pip&&state.pip.show), near=()=>shown()?Math.hypot(state.pip.x-h.x,state.pip.y-h.y)/UNIT:null;
// 1. after the jetty Pip waits by the garden: walk the other way first
bad(inv.story!==STORY.garden, 'story should be at the garden, is '+inv.story);
let pops=0; for (const id of ['ford','riverbank','camp','riverbank']) { enterScene(id); if(shown()) pops++; run(30); if(shown()) pops++; }
console.log('1 garden wait: Pip shown on 4 other screens (entry and after half a second):', pops, '(want 0)');
bad(pops, 'Pip popped in beside you while waiting by the garden');
enterScene('meadow'); const [gx,gy]=gardenSpot(); const d0=Math.hypot(state.pip.x-gx,state.pip.y-gy)/UNIT; draw(); run(1); const d1=Math.hypot(state.pip.x-gx,state.pip.y-gy)/UNIT;
console.log('   at the meadow: Pip at his garden spot on arrival', d0.toFixed(2), 'tiles off, next frame', d1.toFixed(2), '| shown', shown());
bad(!shown()||d0>0.05, 'Pip not at the garden the frame you arrive');
// 2. the tour: Pip goes into the lean-to ahead of you; you leave camp instead
rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0,seed:'turnipseed'})); inv.story=STORY.tocamp; enterScene('camp'); rtFor('camp').flags.built_tent=true;
let gone=false; for(let k=0;k<60*60;k++){ run(1); if(k%20===0) clear(); const p=state.pip;
  if(p&&p.show){ const tx=p.visit?p.visit.x:p.x, ty=p.visit?p.visit.y:p.y; h.x+=(tx-h.x)*0.03; h.y+=(ty+UNIT*1.2-h.y)*0.03; }
  if(state.scene==='camp' && state.pipGone==='camp' && state.tutStep==='tour-tent'){ gone=true; break; } }
console.log('2 tour: Pip went into the lean-to ahead', gone, '| ahead to', state.pipAhead);
bad(!gone||state.pipAhead!=='tentin', 'the tour lead should leave Pip ahead in the lean-to');
enterScene('riverbank', 0.5, 0.9); const s0=shown(); h.x=W*0.5; h.y=H*0.3; run(60); const s1=shown(); clear();
let back=-1, at=null; for(let k=0;k<60*8;k++){ run(1); if(shown()){ back=1+k/60; at=[state.pip.x/W, state.pip.y/H, near()]; break; } }
console.log('   left camp for the riverbank: Pip shown on entry', s0, 'after 1 s', s1, '| came back for you', back.toFixed(1), 's after you arrived, at', at&&at.slice(0,2).map(v=>v.toFixed(2)).join(','), 'of the screen,', at&&at[2].toFixed(1), 'tiles from you');
bad(s0||s1, 'Pip popped in beside you on the riverbank while he was in the lean-to');
bad(back<3.5||back>6, 'Pip should come back after a few seconds (4), not at once');
bad(at&&at[2]<3, 'Pip should come in from the edge, not beside you');
bad(state.pipAhead, 'pipAhead should clear once Pip is with you again');
const said=state.texts.filter(t=>t.who==='pip').map(t=>t.text); console.log('   Pip said:', JSON.stringify(said));
bad(!said.some(t=>/slowpoke|this way|coming|younger/i.test(t)), 'Pip should call you when he comes back');
// 3. now go into the lean-to with Pip along: he's simply placed with you (the usual case still works)
enterScene('camp'); run(5); enterScene('tentin'); console.log('3 into the lean-to together: Pip shown', shown(), 'at', near().toFixed(1), 'tiles');
bad(!shown()||near()>6, 'Pip should be with you in the lean-to');
console.log('BUILD', BUILD, '| errs', errs);
`);
