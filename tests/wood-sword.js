const src = require('./harness.js').src;
eval(src+`;
begin(); let errs=0; const run=n=>{for(let k=0;k<n;k++){ try{update(1/60);draw();}catch(e){errs++; if(errs<4) console.log('ERR',e.message);} }}; const press=(k,n=1)=>{ state.keys[k]=true; run(n); state.keys[k]=false; run(2); };
run(5); state.intro=null; state.texts=[]; enterScene('f2'); state.enemies=[]; state.items=[]; run(5); const inv=state.inv, h=state.hero; state.pip&&(state.pip.show=false);
inv.woodsword=WOOD_SWORD; inv.sword=false; run(20); h.x=W*0.3; h.y=H*0.3; h.fx=1; h.fy=0;
// 1. swinging at nothing costs nothing
for(let i=0;i<10;i++){ state.atkCool=0; state.chain.n=0; press('f',2); run(20); } console.log('1 ten swings at air: durability', inv.woodsword, 'of', WOOD_SWORD, '| spinning', !!state.whirl);
// 2. two rabbits, slash by slash (not in the whirlwind rhythm: seven slashes on the beat spin, and a spin splits wood)
state.chain.n=0;
let kills=0, swings=0; for(let r=0;r<2;r++){ const e=makeEnemy('rabbit', h.x+UNIT*0.9, h.y, 0); e.mode='idle'; e.t=99; state.enemies=[e]; for(let i=0;i<30 && state.enemies.includes(e) && !e.dead && e.hp>0;i++){ h.vig=maxVig(); state.atkCool=0; state.chain.n=0; press('f',2); run(i%2?20:50); swings++; e.x=h.x+UNIT*0.9; e.y=h.y; } if(e.dead||e.hp<=0||!state.enemies.includes(e)) kills++; }
console.log('2 rabbits slain', kills, 'in', swings, 'swings | wooden sword left', inv.woodsword, 'of', WOOD_SWORD, '| still in hand', bladeKind());
// 3. no whirlwind out of a pound
inv.woodsword=WOOD_SWORD; h.vig=maxVig(); state.whirlCool=0; press(' '); run(8); press('f'); run(40); state.atkCool=0; press('f',2); run(10); console.log('3 strike right after a pound -> whirlwind?', !!state.whirl);
// 4. the lantern hangs opposite the blade
console.log('4 lantern side vs blade side:', (h.side>0?'right':'left')+' blade, lantern on the '+(h.side>0?'left':'right'));
console.log('BUILD', BUILD, '| errs', errs);
`);
