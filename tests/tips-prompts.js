const src = require('./harness.js').drawn;
eval(src+`;
const step=n=>{for(let i=0;i<n;i++){update(1/60);draw();}};
const tap=k=>{state.keys[k]=true;step(2);state.keys[k]=false;step(2);};
const go=(x,y)=>{state.hero.x=x;state.hero.y=y;step(2);};
begin(); step(60*7); state.cut=null;
let errs2=0; const run=(n)=>{ for(let k=0;k<n;k++){ try{ update(1/60); draw(); }catch(e){ errs2++; if(errs2<8) console.log('ERR', state.scene, e.message, String(e.stack).slice(0,300)); return; } } };
state.texts=[]; state.title=null;
say('Tap F to slash. Hold and release to stab.', null, null, { key:'tip', tip:'sword' });
console.log('tip shown in world', state.texts.length, '| in menu pool', (state.tipPool||[]).includes('Tap F to slash. Hold and release to stab.'));
say('F to cast', W*0.5, H*0.5, { key:'fish' }); run(10); console.log('prompt drawn as badge', state.textBoxes.map(b=>b.t.badge||b.t.text).join(' | '));
state.texts=[];
say('Pip: look at that!', W*0.4, H*0.4, { key:'pip', life: 4 }); say('A giant mushroom, glowing faintly.', W*0.6, H*0.6, { key:'shroom', life: 4 }); say('+1 driftwood (3)', W*0.3, H*0.6, { key:'mat', color:'#ffe38a', life: 4 });
showTitle('The Deep Woods', null, 'area', 2.8); run(10);
console.log('while Pip talks: shown', state.textBoxes.map(b=>b.t.text).join(' | '), '| title up', !!state.title, 'queued', (state.titleQ||[]).length);
run(60*4); console.log('after Pip stops: title', state.title && state.title.text);
// the menu marquee
toggleMenu(); run(5); console.log('marquee tip', JSON.stringify(state.marquee && state.marquee.text)); run(60*20); console.log('next marquee tip', JSON.stringify(state.marquee.text)); toggleMenu();
// words on screen during the opening, before vs now: count the average visible words per frame
state.inv.pipTips={}; enterScene('camp'); state.cut=null; let words=0, frames=0; const rd=draw; draw=function(){ rd(); frames++; words += (state.textBoxes||[]).reduce((a,b)=>a+b.t.text.split(' ').length,0) + (state.title? (state.title.text+' '+(state.title.sub||'')).split(' ').length:0); };
for (const id of ['camp','start','meadow','w1']) { enterScene(id, 0.5, 0.5); state.cut=null; run(60*6); }
draw=rd; console.log('average words on screen per frame', (words/frames).toFixed(1));
console.log('errs', errs2);
`);