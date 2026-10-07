// the two hammocks in the lean-to: laid out in tiles, Pip's body blocks you on foot, a landing on either free one
// drops you in (his only while he's out of it; he tips you out to have it back) and rocks it, a nap after a second, any key gets you out, Pip hops in and out at dusk, the lantern by his
const src = require('./harness.js').drawn;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }};
run(5); state.intro=null; state.texts=[]; const inv=state.inv, h=state.hero; inv.story=STORY.adventure;
const keys=(o,n)=>{ Object.assign(state.keys,o); run(n); for (const k in o) state.keys[k]=false; };
// 1. layout: two hammocks, Pip's from the crossbar, yours between two posts, both inside the room
enterScene('tentin'); run(3); const hm=sceneDef().feat.hammocks, pip=hammockOf('pip'); let mine=hammockOf('hero');
const inRoom=p=>p[0]>0&&p[0]<W&&p[1]>H*0.3&&p[1]<H; const posts=state.solids.filter(s=>s.kind==='post').length, bodies=state.solids.filter(s=>s.kind==='body').length;
console.log('1 hammocks', hm.length, '| posts', posts, 'body circles (Pip\\'s)', bodies, '| ties in the room', [pip.A,pip.B,mine.A,mine.B].every(inRoom), '| lengths (tiles)', (pip.L/UNIT).toFixed(1), (mine.L/UNIT).toFixed(1), '| gap between them (tiles)', (Math.hypot(pip.B[0]-mine.B[0], pip.B[1]-mine.B[1])/UNIT).toFixed(2));
// 2. Pip's body stops you on the ground; a jump carries you over it
h.x=pip.A[0]-UNIT*2; h.y=pip.A[1]+pip.L*0.5; h.vx=0; h.vy=0; keys({arrowright:true},90); const walked=h.x;
h.x=pip.A[0]-UNIT*1.6; h.y=pip.A[1]+pip.L*0.5; h.vig=maxVig(); keys({arrowright:true,' ':true},6); keys({arrowright:true},40); const jumpIn=state.hammock&&state.hammock.who;
run(30); keys({arrowleft:true},3); run(30); const outX=h.x, outOver=!!overHammock(h.x,h.y);
state.pipIn=true; pipPin(); h.x=pip.A[0]-UNIT*1.6; h.y=pip.A[1]+pip.L*0.5; keys({arrowright:true,' ':true},6); keys({arrowright:true},40); const busyIn=!!state.hammock, busyX=h.x; state.pipIn=false; state.texts=[];
console.log('2 walking at Pip\\'s hammock stops short of its line:', walked<pip.A[0]-UNIT*0.5, '(x', ((walked-pip.A[0])/UNIT).toFixed(2), 'tiles from it) | a jump onto it while he\\'s out drops you in his:', jumpIn==='pip',
  '| out on a key, beside it (x', ((outX-pip.A[0])/UNIT).toFixed(2), 'tiles), not over it:', !outOver, '| with Pip in it the same jump leaves you out of it:', !busyIn, '(x', ((busyX-pip.A[0])/UNIT).toFixed(2), ')');
// 3. yours: a landing on it drops you in and rocks it; a nap after a second; a key gets you out
enterScene('tentin'); run(3); mine=hammockOf('hero'); h.x=mine.A[0]+mine.L*0.5; h.y=mine.A[1]+mine.hw+UNIT*1.4; h.vig=2; keys({arrowup:true,' ':true},6); let rock0=0, inAt=null; for (let k=0;k<90;k++){ keys({arrowup:!state.hammock},1); if (state.hammock && inAt==null) inAt=k; rock0=Math.max(rock0, Math.abs(mine.rock)); }
const inIt=!!state.hammock; run(60); const napped=state.hammock&&state.hammock.napped, vig=h.vig; state.texts=[]; keys({arrowdown:true},3); run(30);
console.log('3 landed in it:', inIt, '| rocked (peak, tiles of swing):', rock0.toFixed(2), rock0>0.2, '| napped after a second, vigor', vig, 'of', maxVig(), ':', !!napped && vig===maxVig(), '| out again on a key:', !state.hammock, 'standing beside it', !overHammock(h.x,h.y));
// 4. F beside it climbs in too (the prompt says so); you can't stack naps
h.x=mine.A[0]+mine.L*0.5; h.y=mine.A[1]+mine.hw+UNIT*0.9; run(2); draw(); const verb=(state.hintActs||[]).map(a=>a.verb).join(','); keys({f:true},2); run(3);
console.log('4 prompt beside yours:', JSON.stringify(verb), '| F climbs in:', !!state.hammock); keys({' ':true},3); run(5);
// 5. dusk: Pip hops into his before the lantern line, and out before he leaves; the lantern hangs by his foot post
state.dusk=false; inv.lantern=false; startDusk(); let pipWasIn=false, lineWhileIn=false; for (let k=0;k<60*14;k++){ run(1); if (k%90===0) keys({f:true},2); if (state.pipIn) { pipWasIn=true; if (state.texts.some(t=>/lantern by my hammock/.test(t.text))) lineWhileIn=true; } }
const [lx,ly]=lanternSpot(); const nearPip=Math.hypot(lx-pip.B[0], ly-pip.B[1])<UNIT*2;
console.log('5 Pip in his hammock during the dusk scene:', pipWasIn, '| says the lantern line from it:', lineWhileIn, '| out again when it ends:', !state.pipIn, '| lantern by his foot post:', nearPip);
// 6. the lantern still comes with you at dusk
state.dusk=true; h.x=lx; h.y=ly+UNIT*0.6; run(3); state.texts=[]; keys({f:true},2); run(3); console.log('6 took the lantern:', !!inv.lantern);
// 7. the tour (as tests/camp-tour.js walks it): Pip says his piece by the book, hops into his hammock, and out again to lead you on
state.hammock=null; state.pipIn=false; inv.story=STORY.tocamp; rtFor('meadow').flags.plots=WORLD.meadow.feat.plots.map(()=>({s:1,t:0,lv:0,seed:'turnipseed'})); enterScene('camp'); rtFor('camp').flags.built_tent=true;
const clear=()=>{ for(let i=0;i<20 && (state.texts.some(t=>t.hold)||(state.title&&state.title.hold));i++) keys({f:true},1); };
let inDuring=false, outAfter=false; for(let k=0;k<60*90;k++){ run(1); if(k%20===0) clear(); const st=state.tutStep, p=state.pip;
  if (st==='tour-inside' && state.pipIn) inDuring=true; if (inDuring && st==='tour-out' && !state.pipIn) outAfter=true;
  if(p&&p.show){ const tx=p.visit?p.visit.x:p.x, ty=p.visit?p.visit.y:p.y; h.x+=(tx-h.x)*0.03; h.y+=(ty+UNIT*1.2-h.y)*0.03; }
  if(state.scene==='camp' && state.pipGone==='camp' && st==='tour-tent'){ enterScene('tentin'); }
  if(state.scene==='tentin' && state.pipGone==='tentin'){ enterScene('camp', 0.33, 0.45); }
  if(state.scene==='camp' && state.pipGone==='camp' && st==='tour-exit'){ break; } }
console.log('7 tour: Pip in his hammock after the inside line:', inDuring, '| out again to lead you out:', outAfter, '| tour reached', state.tutStep);
// 8. F beside Pip's while he's out: its own prompt, in, a nap; with Pip in it, no prompt and F does nothing there
enterScene('tentin'); run(3); const pip2=hammockOf('pip'); mine=hammockOf('hero');
const pm=pip2.A[0]+pip2.ex*pip2.L*0.5, pn=pip2.A[1]+pip2.ey*pip2.L*0.5, mm=[mine.A[0]+mine.L*0.5, mine.A[1]];
const spots=()=>{ const it=findInteractable(); return it ? it.verb : 'none'; };
state.tutStep=null; state.pip=null; h.x=pm-pip2.hw-UNIT*0.9; h.y=pn; h.vig=2; run(2); draw(); const verbP=JSON.stringify(spots()); keys({f:true},2); const inP=state.hammock&&state.hammock.who; run(70); const napP=state.hammock&&state.hammock.napped&&h.vig===maxVig();
keys({arrowleft:true},3); run(30); state.pip={x:W*0.6,y:H*0.6,show:true}; state.pipIn=true; pipPin(); h.x=pm-pip2.hw-UNIT*0.9; h.y=pn; run(40); draw(); const verbBusy=JSON.stringify(spots()); keys({f:true},2); const inBusy=!!state.hammock&&state.hammock.who==='pip';
console.log('8 beside Pip\\'s (', (Math.hypot(h.x-mm[0],h.y-mm[1])/UNIT).toFixed(2), 'tiles from yours ) prompt:', verbP, '| F climbs into his:', inP==='pip', '| napped:', !!napP, '| with him in it, prompt:', verbBusy, '| F puts you in his:', inBusy);
// 9. he wants it back: lying in his when he hops in tips you out beside it, with a line
state.hammock=null; state.pipIn=false; state.texts=[]; h.x=pm-pip2.hw-UNIT*0.9; h.y=pn; climbIn(pip2); run(10); pipHop(true); run(2);
console.log('9 Pip hops in while you\\'re in his: you\\'re out', !state.hammock, '| he\\'s in', state.pipIn, '| standing beside it', !overHammock(h.x,h.y) && Math.hypot(h.x-pm,h.y-pn)>pip2.hw, '| says', JSON.stringify((state.texts.find(t=>/mine/.test(t.text))||{}).text));
state.pipIn=false;
console.log('errs', errs);
`);
