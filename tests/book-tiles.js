const src = require('./harness.js').drawn;
eval(src+`;
begin();
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,400)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const clear=()=>{ for(let i=0;i<12 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) press('f',1); };
const h=state.hero, inv=state.inv;
// 1. the opening: nothing about the far side while Pip talks, or from across the river
const said=[]; const _s=say; say=function(t,x,y,o){ said.push({t, k:o&&o.key}); return _s(t,x,y,o); };
run(60*6); const during=said.filter(s=>s.k==='farside').length; for(let i=0;i<6 && state.intro && !state.intro.gone;i++){ press('f'); run(20);} for(let k=0;k<60*14 && state.intro;k++) run(1); clear();
enterScene('riverbank'); run(10); const f=WORLD.riverbank.feat.farside, fx=f[0]*W, fy=f[1]*H;
let seenFromHere=0; for(const [x,y] of [[W*0.5,H*0.8],[W*0.3,H*0.9],[W*0.7,H*0.75]]){ h.x=x; h.y=y; run(60); } seenFromHere=said.filter(s=>s.k==='farside').length;
console.log('1 far-side notice during the opening:', during, '| from the near bank:', seenFromHere, '| line of sight across the river:', inView(fx,fy+UNIT*0.6,99));
// 2. over there, up close: now it's described
h.x=fx+UNIT*2; h.y=fy+UNIT*2.2; console.log('   standing on the far side, in view:', inView(fx,fy+UNIT*0.6,6)); state.pipTalkT=-9; run(90); console.log('   described now:', said.filter(s=>s.k==='farside').map(s=>s.t).join(' | '));
// 3. more than one thing to do here: all of them, each with its key
enterScene('meadow'); inv.story=STORY.garden; inv.bag.turnipseed=2; run(30); clear(); const q=WORLD.meadow.feat.plots[WORLD.meadow.feat.plots.length-1]; h.x=q[0]*W; h.y=q[1]*H; run(5); draw();
console.log('3 at an empty patch with seeds ->', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join('  |  '));
state.items.push({type:'stick',x:h.x,y:h.y}); run(2); draw(); console.log('   with a stick at your feet too ->', (state.hintActs||[]).map(a=>a.key+' '+a.verb).join('  |  ')); state.items=[];
// 4. the book: two pages to a spread
enterScene('tentin'); run(5); state.menu={view:'book',page:0}; draw(); press('arrowright'); const p1=state.menu.page; press('arrowright'); const p2=state.menu.page; press('arrowleft'); console.log('4 book spreads: start 0 -> right', p1, '-> right again', p2, '-> left', state.menu.page, '| pages', BOOK.length); state.menu=null;
// 5. tiles overlay
state.settings.tiles=true; enterScene('riverbank'); run(2); draw(); const T=state.tileCache; console.log('5 tiles:', T.cols+'x'+T.rows, '| water tiles', T.bad.filter(b=>b===2).length, '| blocked tiles', T.bad.filter(b=>b===1).length, '| in System:', SYSTEM_ITEMS().find(o=>o[0]==='tiles')[1]); state.settings.tiles=false;
console.log('BUILD', BUILD, '| errs', errs);
`);
