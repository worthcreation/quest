const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message, String(e.stack).slice(0,300));} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
run(10); for(let i=0;i<3;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
// 1. the book's first rule has a carrot
console.log('1 rule 1 doodle:', BOOK_PAGES()[0].bits[0][0], '| eat something:', BOOK_PAGES()[5].bits[2][0]);
// 2. Pip at his garden post never stands still
enterScene('meadow'); run(20); clear(); h.x=W*0.1; h.y=H*0.15; let still=0, n=0, lp=null; for(let k=0;k<60*10;k++){ run(1); const p=state.pip; if(lp){ n++; if(Math.hypot(p.x-lp[0],p.y-lp[1])<0.05) still++; } lp=[p.x,p.y]; }
console.log('2 garden post, 10 s: Pip still', Math.round(still/n*100)+'% of frames');
// 3. (crop pulling moved to t91 in build 91)
// 4. heading for camp, you stand still: Pip goes on ahead, leaves the screen, comes back to hurry you
inv.story=STORY.tocamp; enterScene('meadow'); run(10); clear(); const said=[]; const _s=say; say=function(t,x,y,o){ if(o&&o.key==='pip') said.push(Math.round(state.time)+'s '+t); return _s(t,x,y,o); };
const t0=state.time; let left=null, back=null; for(let k=0;k<60*40;k++){ run(1); const p=state.pip, off=p.x<-UNIT||p.x>W+UNIT||p.y<-UNIT||p.y>H+UNIT; if(off&&left==null) left=state.time-t0; if(left!=null&&!off&&back==null&&p.lead&&p.lead.phase==='back') back=state.time-t0; }
console.log('4 you wait: Pip left the screen after', left==null?'-':left.toFixed(1)+' s', '| came back after', back==null?'-':back.toFixed(1)+' s');
console.log('   he said:', said.join(' / '));
console.log('BUILD', BUILD, '| errs', errs);
`);
