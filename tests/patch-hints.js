const src = require('./harness.js').src;
eval(src+`;
let errs=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs++; if(errs<6) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
const pipLines=[]; const _say=say; say=function(t,x,y,o){ if(o&&o.key==='pip') pipLines.push(state.scene+': '+t); return _say(t,x,y,o); };
begin(); state.cut=null; const inv=state.inv; inv.story=STORY.garden; enterScene('meadow'); state.cut=null; run(3);
const h=state.hero, q=WORLD.meadow.feat.plots[0];
const atPlot=()=>{ h.x=q[0]*W; h.y=q[1]*H; h.vx=h.vy=0; state.pip.visit=null; run(3); };
inv.bag.turnipseed=2; run(20); atPlot(); drawActionHint(); console.log('hint on the patch:', state.actionHint && state.actionHint.verb, state.actionHint && state.actionHint.key);
press('f'); console.log('F: seeds left', inv.bag.turnipseed, '(still 2)');
press('f'); if(state.choice) press('f'); console.log('seed key ('+'slot'+'): seeds left', inv.bag.turnipseed, '| patch planted', rtFor('meadow').flags.plots[0].s===1);
// seeds moved to slot A: the hint follows
rtFor('meadow').flags.plots[0].s=0; slotsOf().a={kind:'seed',id:'auto'}; slotsOf().d=null; atPlot(); drawActionHint(); console.log('seeds in A: hint key', state.actionHint.key);
press('a'); console.log('A plants: seeds left', inv.bag.turnipseed);
// no slot holds seeds: F plants as before
rtFor('meadow').flags.plots[0].s=0; slotsOf().a=null; inv.bag.turnipseed=1; atPlot(); drawActionHint(); console.log('no seed slot: hint key', state.actionHint.key||'F (default)'); press('f'); if(state.choice) press('f'); console.log('F plants: seeds left', inv.bag.turnipseed);
slotsOf().d={kind:'seed',id:'auto'};
// Pip while gathering
inv.story=STORY.gather; state.pip.show=true; state.pip.follow=true; state.pip.visit=null; inv.pipTips={}; const raw=rawOf();
const visit=(id,n=200)=>{ enterScene(id); state.cut=null; state.pip.visit=null; state.pipTalkT=-9; run(n); };
pipLines.length=0;
visit('riverbank'); raw.stone=2; state.pipTalkT=-9; run(600);
visit('start'); raw.stick=3; state.pipTalkT=-9; run(600);
visit('f2'); raw.fluff=2; state.pip.visit=null; state.pipTalkT=-9; run(600);
visit('meadow'); visit('riverbank');
const gl=pipLines.filter(l=>/need|everything|looking/.test(l)); gl.forEach(l=>console.log('  '+l));
console.log('woods line while gathering:', pipLines.some(l=>/other way/.test(l)));
console.log('BUILD', BUILD, '| errs', errs);
`);
