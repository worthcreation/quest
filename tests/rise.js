const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',state.scene,e.message,String(e.stack).split('\\\\n').slice(1,3).join(' | '));} }};
const keys=['arrowleft','arrowright','arrowup','arrowdown'], off=()=>keys.forEach(k=>state.keys[k]=false);
run(5); state.intro=null; state.texts=[]; state.pip=null; startTestScene('rise'); run(20);
let r=state.rise; const z=()=>riseZoom(r.p), tilt=()=>Math.round(RISE.tilt*r.p*57.3);
// 1. it opens like the fields: straight down, full size
console.log('1 opens at x', r.x.toFixed(1), '| zoom', z().toFixed(2), '| tilt', tilt(), 'deg');
// 2. walk east like a person, keeping to the path: the view pulls back and tips as you go, and you come out in the crags
const seen=[]; let t=0; state.keys.arrowright=true;
while(state.scene==='rise' && t<60*30){ const dy=risePathY(r.x+1)-r.y; state.keys.arrowdown=dy>0.3; state.keys.arrowup=dy<-0.3; run(1); t++; if(t%60===0) seen.push([r.x, z(), tilt()]); } off();
let mono=seen.every((s,i)=>!i||s[1]<=seen[i-1][1]+1e-6);
console.log('2 walked east in', (t/60).toFixed(1), 's ->', state.scene, '| zoom by second:', seen.map(s=>s[1].toFixed(2)).join(' '), '| only ever pulls back:', mono, '| tilt at the foot', seen.length?seen[seen.length-1][2]:0, 'deg');
// 3. walk back west: it comes back in
startTestScene('rise'); run(5); r=state.rise; r.x=60; r.y=risePathY(60); run(240); const z60=z(); state.keys.arrowleft=true; t=0; while(r.x>20 && t<60*10){ run(1); t++; } off(); run(120);
console.log('3 back west from x 60 (zoom', z60.toFixed(2)+') to x', r.x.toFixed(1), '(zoom', z().toFixed(2)+')', '| comes back in:', z()>z60+0.2);
// 4. off the path, straight at the mountain: the crags at its foot stop you
r.x=66; r.y=11; r.vx=r.vy=0; state.keys.arrowright=true; run(60*4); off(); const f=riseFoot(r.y);
console.log('4 heading east off the path at y 11: stopped at x', r.x.toFixed(1), '| the foot there is at', f.toFixed(1), '| stayed on open ground:', riseOpen(r.x,r.y));
// 5. the stones along each side of the way are the edge: up and down both stop
r.x=30; r.y=15; state.keys.arrowup=true; run(120); off(); const top=r.y; state.keys.arrowdown=true; run(180); off(); const bot=r.y;
console.log('5 up stops at y', top.toFixed(2), '| down stops at y', bot.toFixed(2), '| inside the band', RISE.band.join('-')+':', top>RISE.band[0] && bot<RISE.band[1]);
// 6. the west end goes back to the fields; coming in from the east starts at the top
r.x=3; r.y=risePathY(3); state.keys.arrowleft=true; t=0; while(state.scene==='rise' && t<120){ run(1); t++; } off(); run(10);
const west=state.scene; enterScene('rise', 0.9, 0.5); run(5); r=state.rise;
console.log('6 west end ->', west, '| entering from the east starts at x', r.x.toFixed(1), 'of', RISE.len, '| zoom', z().toFixed(2));
// 7. a phone: the view never shrinks you below 20 px
const sv=[W,H]; W=390; H=844; computeUnit(); const px=riseZoomMin()*UNIT; W=sv[0]; H=sv[1]; computeUnit();
console.log('7 phone: smallest hero', px.toFixed(1), 'px (zoom', (20/ (Math.min(390,844)/14)).toFixed(2)+')');
const land=riseLand(); console.log('   land:', land.rows.length, 'rows,', land.props.length, 'things standing on it,', land.solids.length, 'solid');
if (!(mono && z()>0.4)) errs++;
console.log('BUILD', BUILD, '| errs', errs);
`);
