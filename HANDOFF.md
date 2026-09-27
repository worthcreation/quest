# Quest: handoff notes (as of build 69, 27 Sep 2026)

## What this is
Browser RPG, Zelda meets EarthBound. One file, `index.html`, on GitHub Pages: https://worthcreation.github.io/quest/
Repo: https://github.com/worthcreation/quest (personal account `worthcreation`).

## The single source of truth
`index.html` is the whole game. It is assembled from split source parts (in `src/` here) with:

    cd src && cat head.html p1.js p2.js p3.js p4.js p6.js p7.js p8.js p9.js p10.js p11.js p12.js p13.js p14.js p5.js > ../index.html

Note the order: p5.js goes LAST (it has drawItemIcon, resize, startup). src/, tests/ and tools/ live in the repo from build 64 on.

Ship step (every build): one download, quest-bNN.zip, laid out like the repo root. Then
    cd ~/quest && unzip -o ~/Downloads/quest-bNN.zip && rm ~/Downloads/quest-bNN.zip && git add . && git commit -m "Build N: ..." && git push
Next chat: git clone https://github.com/worthcreation/quest.git (github.com is reachable from the container) and work in src/.

## File map
- head.html   HTML, CSS, touch buttons (#pad, #act, #jump, #dash(A), #eat(S), #slotd(D), #throw(swap), #fire, #menubtn)
- p1.js       constants (DEFAULT_KEYS, ACTION_NAMES), world generation (all screens), newInv, state object, SEEDS, MATS
- p2.js       input (held/pressedNow), touch, say()/text system entry, settings
- p3.js       enterScene, collisions (F table), chasms/rocks/stones, jump, wind (updateWind, rideGust), pull mechanic, drops table, collect()
- p4.js       combat, enemies AI, damage, slam, birds
- p5.js       drawItemIcon, drawItems, enemies drawing, text layout (layoutTexts), resize, boot   (LAST in the cat)
- p6.js       interact(), farming (PATCH levels), findInteractable, Pip guide + story lines, cutscenes (intro/dusk/abduct/sword), river quest, pack menu, save/load, breakBarrier
- p7.js       drawing: ground, solids, hero (drawHero), HUD (drawHUD), menu screens, tips, BUILD constant
- p8.js       overview map (MAP_LAYOUT, REGION_COLOR, MAP_NAMES)
- p9.js       arena mode (?arena): ARENA_ZONES on real screens, arenaKit
- p10.js      puzzle mode (?puzzle): PUZZLES list, portals, records in localStorage 'quest-puzzles'
- p11.js      drawn hero model (arena only / &model): POSES, drawHeroModel, pose sheet (mirror in arena glade)
- p12.js      wind ledges, landing shadow, ravines drawing, Wick's jetty (placeDock/drawJetty), shack drawing
- p13.js      camp building & crafting (RAW, RECIPES, craft mat), lean-to interior, old jetty, STORY flags,
              quest log (QUESTS chains, updateQuests, questView)
- p14.js      food ranges & crop levels (FOOD, cropLevel, farmLevel, eatFood, CROP_PERK), mushroom glow, quick slots (SLOT_KEYS, useSlot, drawSlotBar),
              skills (SKILLS, skillUse, skillLevel, setSkillLevel, SKILL_COLOR), acorn spread/homing (acornSpread, steerAcorn)

## Build 69 in short
- Text stays while it's relevant. say(..., {site: {x, y, r}}) ties held text to a place: walk more than r tiles away and it
  lets go and fades (updateTexts in p4). Held speech without a site lets go 11 tiles from where it was said. pipSay takes
  a 5th arg `site`; visits pass their spot. At the garden patches (within 4 tiles, with seeds) Pip says "Stand over here and
  shove them in the dirt! They love this stuff." (site r 6).
- Vigor bar is a fixed width: exactly the A S D F row (s * 5.85), whatever the vigor depth (p7 drawHUD).
- Blades: bladeKind() (p14) = 'steel' (the stump sword) or 'wood'. Combat, slams and hero drawing use it instead of
  inv.sword; story checks (pipWithYou etc.) still use inv.sword. Wooden sword: 3 sticks on the mat, inv.woodsword =
  WOOD_SWORD (14) durability; bladeWear(1) per swing (slash start, stab start) and per landed hit (slash, stab, whirl);
  splinters from 5 down, shatters at 0 (fx, line, slot clears). Hits at 0.6x. It's a weapon slot entry like the others.
  Measured: 13 swings at nothing, or 7 landed strikes.
- Crafting rework (p13). Field (the mat, anywhere): camp raw/pieces, small charms, the wooden sword, augmentations and
  food. Ingredients come from one pool: stockOf/takeStock cover raw, MATS, acorns and food. RECIPES now carry kind:
  raw | piece | wear | weapon | aug | food. New: woodsword (3 sticks), thornwrap (thorn + fluff: +1 damage, 8 hits),
  emberoil (ember + glue: sets alight, 6 hits), mash (turnip + carrot), salad (mash's two + berries), trailmix (acorn +
  berries: speed). Augmentations (inv.aug {id, n}, AUG in p14) coat the held blade and count down in augBonus(); drawn by
  augGlint. Bench (FORGE, p6): big enhancements, now also Silk sling and Horn-lashed blade: diver silk and charger horn
  drops are materials (silkpart/hornpart) worked there, no longer automatic. The Stalker's Step stays automatic (not a
  weapon).
- Knowing recipes: inv.known (made) and inv.heard (told). recipeBook() lists both in the Craft tab; F on one lays it out
  (layOut) and jumps the cursor to Combine. Sources: Pip ("Three sticks lashed together make a sword!" out gathering with
  3 sticks), Pip's reward line (mash), journal pages 5 and 8 (PAGE_LORE: ember oil, thorn wrap), and trial and error.
  matHint(): "Almost. It feels like it wants one more thing." when the mat is one short of any recipe; "...and there's room
  for one more thing." when it matches a recipe that has an unmade bigger cousin (glue -> mitts, emberoil -> embercharm,
  mash -> salad).
- Keys and slots: an entry sits in one slot only; remapping a key that's taken swaps (assignKey), so A S D F are each
  bound once. Touch buttons checked for overlap.
- Tests: t69 (12 checks). tools/shot.js B69=1.

## Build 68 in short
- Mushrooms, mellower (p14). shroomGlow: three slow waves (one wobbling its own speed) through pow 4.2: mean 0.17, above 0.6
  about 4% of the time, below 0.3 about 84%, still reaching ~1 now and then. Ripples are now individual (state.shroomRip[key]):
  random timing, speed, reach, flatness, line width, pattern (one, two, dash, waver) and strength = ceiling * rnd^2.6, so the
  old strength (SHROOM_RIP_CALM 0.14, SHROOM_RIP_MAX 0.35 just after waking) is the top and most sit far under it
  (median ~0.016, p90 ~0.08). Cap sparkle and motes slowed to match (p7 'shroom').
- No logs or ropes anywhere in the woods. Barrier kind 'wedge' = a heap of boulders wedged on a cracked keystone (p1 w1/w2/w3,
  drawn in p7 drawSolid). keystone() rope is always null now. Pip's lines say boulders and mud.
- Mud: sc.mud = [[fx, fy, radius tiles]] (w1 in front of the keystone, w2 all around it, w3 in front of its keystone),
  drawn by drawMud in p12, slows you (x0.55, p3 movement). A thrown rock that lands in mud, or one set down in it, sinks:
  sinkRock() adds a runtime buried rock (rt.flags.mudRocks, synced into sc.pullables by syncMudRocks on enterScene). It is
  a normal buried rock: pound beside it (knockRocks), rock it and heave (updatePull/freePullable), which removes it again.
- Abduction (p6 'abduct'): no camera lock, you steer the whole time (movement done inside the cut). Get within 1.6 tiles
  and Pip and the gremlins spring 3.2 to 4 tiles away in a 0.3 s arc (p.hz / g.hz lift, drawn in p7), biased toward the
  hole, with a jeer the first time. They're dragged on to the hole between hops; c.gone ends it (forced by 11 s).
  Its lines pass hold:false.
- The sword is hidden: a dark, moss-covered knob sunk in the stump, faint from afar; the Pull label only shows within
  0.9 tiles; w3's area line no longer mentions a glint. Pulling it runs a longer reveal (startSwordCut / 'sword' cut /
  drawSwordReveal in p7): rumble and moss, light fanning out of the stump (0 to 1.5 s), the blade rising rust and all with a
  line of light running up it (1.5 to 3.1 s), then it's yours (inv.sword set at 3.1 s), the leap, rays, "THE BLADE".
- New quest alert: showTitle(name, 'a new quest', 'herald', 3.6), never held: fades up in gold over a soft band of
  light, lingers, melts away (p5 drawTitle 'herald'). Quest complete is still held for F.
- Tests: t68 (12 checks). t65 steps 10/11 updated for the fleeting alert. tools/shot.js B68=1.

## Build 67 in short
- F picks things up. Walking over an item no longer takes it (p3 update loop), except TOUCH_PICKUP (spore, spores7, wisp).
  itemAtFeet()/pickUpHere() in p3 (reach PICK_R = 1.15 tiles, grounded, not carrying); interact() calls it right after the
  carry check, so held text is cleared first, then pickup, then everything else. pickUpHere runs tidySlots at once.
- No button or label for items. The cue is sparkle: drawGlints() in p5 (state kept in the GLINTS WeakMap, never on the item,
  so saves stay clean). Rate 0.3/s far, rising with nearness, +6/s within reach; each glint has a random life and a kind
  that gets fancier the closer you are (star4, star8, spin, motes, ring); in reach they turn warm gold. t67: 4 s counts
  far/near/reach, all five kinds only in reach.
- Pounding: every outdoor screen gets 2 or 3 hidden loose spots (rt.flags.loose, made on first pound there). slamDown ->
  poundLoose(): within 1.7 tiles a spot gives one find from LOOSE_FINDS (local seed, acorn, stone, stick, berries, thornseed,
  carrotseed, emberseed) and is spent; within 3.5 tiles the ground rattles (dirt motes). Nothing marks them.
- Pip, once each: "Try pounding around in different places..." (out gathering, after the camp shopping list) and "Get enough
  of those acorns, and you can make some awesome compost!" (first acorns, before the adventure). The first patch step is
  now "work in acorn compost" and the choice reads "Compost it: ...".
- Quest HUD: light and see-through by default (row alpha 0.38, faint box). A milestone (new quest, step done) sets
  state.qPulse[id]; that row is bold, gold-edged and glowing for Q_BRIGHT 3.5 s, then fades back over Q_FADE 2.5 s.
  A finished tracked quest shows ticked in green (state.qDone) for Q_DONE 6 s, then goes. questGlow(t) in p13.
- Tests: t67 (11 checks). t56/t57/t64/t65 now press F on items and use the seed slot's key.

## Build 66 in short (slots, wheel, wearables; all in p14 unless noted)
- One slot model. inv.slots = {a, s, d, f}, each {kind: weapon|food|seed|ability, id} or null; inv.slotV = 2 (older saves'
  'auto' slots convert in slotsOf). slotOptions() is the single list of what can be slotted; entryCount/entryInfo describe any
  entry; setSlot(k, e) moves an entry (it leaves any other slot); useEntry(e) is the single "use it" path for slot keys, the
  wheel and F. Nothing else should hand-roll food/seed/weapon lists.
- Slots start empty and draw nothing (no box, no letter). tidySlots() (4x/s from update) clears slots whose thing ran out and
  drops newly owned things into an empty slot (weapons F first, the rest A/S/D). A full bar is never overwritten: one tip
  points to R and the pack (tipsSeen.slotsFull). inv.slotSeen tracks what has been offered.
- F is the dynamic action: interact() first; if nothing is here, F uses the F slot (weapon: equips it and combat runs; other:
  useEntry). A weapon on A/S/D: slotWeaponHeld() (inside held.act) makes that key act as the weapon key and sets
  state.slotAct, which skips interact(). Same swing/stab/throw code for every key. syncEquip() keeps state.equip valid.
- Seeds on A/S/D: that key plants; seeds on F: F plants (interact's plot branch). seedSlotKey() looks at all four.
- Wheel: hold R = consumables for use now (food, seeds). Hold R + A/S/D/F = everything slottable for that slot plus "Empty";
  let go of R to set it. Tap R steps F through weapons. World runs at 0.05x while the wheel is open. radialOptions/
  radialLabel/applyRadial/cycleEquip in p6, drawRadial in p7.
- Menus: D backs out (acts -> grid -> tabs -> closed; other views close; ask() choices cancel). F selects. menuBack() in p6.
- Wearables: WEAR table (cap = Stalker cap, stonecharm, mitts, embercharm, feather), inv.gear (owned), inv.worn, wearSlots() =
  2 (+1 Pip rescued, +1 tortoise). wears(id) is the only check effects use. Pack tab "Wear" toggles them. drawWorn() draws
  every worn thing on the hero. Effects: cap (old scalp checks), stonecharm in hurtHero (x0.75), mitts in eatFood (x1.25) and
  turnip regen (x2), embercharm sets burn on acorn hits (p6 updateShots) and unlocks the Flare ability (flare() in p14).
  Sources: cap from the stalker parts as before; feather from Pip at "Home base"; the charms are craft-mat recipes
  (RECIPES entries with wear: true; mats like ember can go on the mat; mitts need a first harvest).
- Pip: during a pipSay visit Pip stays at the thing until you've read the line (held 'pip' text), even with you beside it.
  Conversations (npcTalk) no longer freeze you; screen exits wait until the talk ends.
- Tests: t66 (30 checks: empty start, auto-equip order, no overwrite + tip, each key using its slot, sword on A, food on F,
  wheel use/assign/slowdown, tap R, D back in menus, crafting and wearing charms, stone charm damage, Flare, Pip waiting,
  walking in conversations, old-save slots). t61 predates the empty-start slots and is stale in its expectations.
  tools/shot.js B66=1 renders the HUD, both wheels and the Wear tab.

## Build 65 in short
- Opening is no longer a cutscene. startIntro puts you on the bank at the jetty's foot (solids within 2.6 tiles of that spot are
  removed at world start) and sets state.intro = {step, gone}. updateIntro (called from updatePip) says INTRO_LINES one at a time,
  each waiting for F; checkEdges refuses every exit while !intro.gone; drawHUD hides until then. After the third line Pip walks
  off the south edge, then state.intro = null and inv.story = STORY.garden.
- Held text: say() with key 'pip'/'npc' now holds (life 1e9, t.hold) until F or a tap; showTitle(..., hold=true) does the same
  for New quest / Quest complete. dismissHeld() runs in update() right after readPresses and eats that F press (title first,
  then the oldest held speech). updateCut returns early while heldText(), so cutscene timelines pause on a line.
  Narration inside an action beat passes hold:false (raft lines, Pip's "Over here!"). NPC conversations (startTalk/advanceTalk)
  page themselves and pass hold:false. pipSay/pipGatherTalk/the robin's "not this time" line wait while speakingNow().
  drawReadOn() draws the key badge on held boxes and titles.
- Garden phase (inv.story === STORY.garden): Pip stands at gardenSpot() (beside meadow plot 0), state.pip.atGarden, never
  visits, hidden on every other screen. Lesson lines are said from there, gated by the hero being within 7 tiles.
- Quest HUD: drawQuestHud() in p13 (called from drawHUD), top right, up to 3 tracked current quests; state.questHudRect is
  reserved in reservedRects. inv.qtrack[id] = true means tracked; trackQuest(id, on), tracked(id) (no qtrack object = all on).
  New quests start tracked. Quests tab: F on a current row toggles it; green dot + "active" on the row. Completed quests drop off.
- Seeds: SEEDS in p3 now has turnipseed/carrotseed/pepperseed/squashseed with crop and n:[lo,hi] (vegetables per seed), plus
  the material seeds. SEED_OF, CROP_SEEDS, localSeed(sc) (a 'seed' in a stone/fish/flock drop becomes the local crop's seed).
  Robin drops turnipseed (first guaranteed), rabbits carrotseed, gremlins turnipseed. seedOfPlot/cropOfPlot in p6 resolve what a
  patch holds (old saves planted 'seed'). migrateSeeds(inv) runs on load: bag.seed -> turnipseed, favSeed, slot ids, plot seeds.
  Icons in p5 drawItemIcon follow the real seeds. Harvest gives n[0]..n[1] (+ patch bonus / crop-level extra).
- Food: turnip goes into inv.turnipRegen and trickles back (max(0.35, R/8) vigor per second, in update), 30% + 8%/crop level
  chance to raise max vigor; carrot heals on the spot as before. FOOD_INFO says so.
- Pip's garden quest: last step "Harvest a turnip" (harvests > 0). QUESTS[].reward() runs on completion (not on quiet backfill):
  1 turnip, 1 carrot, 1 carrotseed.
- Tests: t65 covers all of the above (34 checks). t21/t56/t57 updated for held text and the new opening. tools/shot.js: B65=1.

## Conventions that matter
- Everything is in fractions of the screen (fx, fy) at gen time; UNIT = one tile in px (H/14 landscape). Anything that must be
  jumpable/hoppable is laid out in TILES at enterScene (stepping stones, ravine rock columns, ledges, ravines on the crags).
- Runtime per-screen state lives in RT[id] = {deadAt, items, pulled(Set), flags}. Barriers: solids with `bar`; broken when
  rt.flags[bar] is true (breakBarrier). showFlag: solid appears only when rt.flags[showFlag] (camp pieces).
- Save format v16. Settings in localStorage 'quest-settings'. Three save slots.
- Test modes share ALL gameplay code. ARENA/PUZZLE only add a hub screen, a kit, and a few System items. Keep it that way.
- Text: say(text, x, y, {key, life, tip, color, hold}). key 'pip'/'npc' = speech: held until F unless hold:false (holds titles). tips go to the menu marquee only.
  Prompts "F to ..." are replaced by the action ring + label (findInteractable). Text boxes are placed once and fixed (t.pos).
- Pip: pipSay(key, text, at, sight) says once per key, walks to `at` and waits there until you come over.
- Story flags: inv.story = STORY.garden(1) -> tocamp(2) -> gather(3) -> adventure(4). campBuilt('fire'|'tent'|'bench').
- Quests (build 63): QUESTS in p13 = chains of steps {id, name, line(), done()}; a quest opens when start() is true.
  updateQuests() (4x/s from update) advances steps in order and appends {q, s, t: playTime secs} to inv.qlog, and
  inv.quests[id] = {at, step, done}. It only watches story state; never drive the story from it. First tick after
  resetRun (load/new game) is quiet with t null, so old saves backfill without titles. New quest / Quest complete use
  showTitle(..., 'area') so they wait for speech. Chains: Pip's garden (Gather seeds, Plant seeds, Come back later =
  first harvest, inv.harvests), Set up camp (Follow Pip, Gather 2 stones/3 sticks/2 fluff counting crafted pieces,
  Build fire ring, Build bench), then Find Pip, toad's beans, journal, Downriver, mushrooms. Quests tab (main game)
  is a list: CURRENT (newest quest first, step name, progress line, "step n of m"), then a folded "Log (n)" row,
  F toggles it, entries newest first with quest and play time. Arena keeps its zone grid in that tab.
- Keys: arrows move, Space jump, F act + F slot, R tap = next weapon in F / hold = wheel (+A/S/D/F to set a slot), A/S/D slots, E fire, M menu, D back in menus.
- Planting (build 64): the quick slot holding seeds is the plant button. seedSlotKey()/seedKeyLabel() in p14; the
  patch prompt shows that key, F on an empty patch only improves it (or says "D plants."). With no seed slot, F plants.
- Pip while gathering (build 64): pipGatherTalk in p6 replaces "The woods are the other way" until the camp is built.
  On screens with camp materials (initItems, or rabbits for fluff) or off the home paths: "Let's keep looking around.
  Still need ..." or "We have what we need from here. Still need ...", repeated only when the answer changes;
  "That's everything! Back to camp." once. The woods line remains for the adventure phase.
- Skills (build 62): inv.skill[id] = {n (uses), hits, lvl}; progress = n + 2*hits crosses SKILLS[id].steps (4 levels);
  each step says SKILLS[id].lines[lvl-1] once, in SKILL_COLOR '#c9a2ff', key 'skill'. Never show numbers. Only 'acorn' is
  wired: skillUse('acorn') in launch(), skillUse('acorn', true) on an enemy hit in updateShots(). sword/dodge/farm tables
  exist with lines but nothing calls them yet. Acorns: spread ACORN_SPREAD[lvl] degrees, homing ACORN_HOME[lvl] rad/s
  toward the nearest hittable enemy inside a 36 degree cone within 4+lvl tiles. Arena System item "Acorn practice" cycles
  the level for testing (setSkillLevel). Old saves get inv.skill lazily; save format still v16.
- Never use pressure plates language: woods puzzles are cracked keystones under wedged boulders (throw a rock), buried rocks
  (stomp to knock loose, then rock and heave), mud (rocks sink; pound and pull them out), brambles (thrown rock), the
  gremlin burrow (thrown rock). No logs, ropes or tied gates.

## Testing (headless, node)
`tests/*.js` eval index.html with a fake canvas/audio (see the top of t21.js). Run from /tmp with index.html at
/mnt/user-data/outputs/index.html (or edit the path). Useful ones:
- t21 full game tour to the rescue  - t57 garden/robin lesson  - t56 opening + camp build  - t59 twilight/forest/hole
- t42 stepping stones (12 crossings) - t44 rock columns + crags - t51/t52 wind sets & rides - t60 food levels/gusts/HUD
- t65 build 65 opening, held text, garden Pip, quest HUD/tracking, seeds, turnip regen - t61 quick slots + fixed text - t62 acorn skill (hit rates by level, level-up once, save round trip) - t63 quest chain, log order, fold, old-save backfill - t64 seed-slot planting, Pip gather lines - t43 puzzle mode (11 stones) - t47 arena (4 zones) - t33 text overlap - t41 legibility
- t33 frames-with-overlap baseline: 104 at build 61, 122 at build 63 (quest titles), 95 at build 64, 39 at build 65; worst pair/res/off still 0.
- tools/overlap.js: 300 worlds, expects "overlaps 0". tools/shot.js renders PNGs with @napi-rs/canvas (npm i in tools/); SKILL=1 renders the level-up line, QUESTLOG=1 the Quests tab folded/open.
Some older tests (t15, t32, t38, t27) are stale after redesigns.

## Where things are (world)
Camp (lean-to, fire ring, bench, 6 patches, mushroom) north of the glade (start). Meadow (Pip's garden, robin) west of glade;
riverbank north of meadow (old jetty south bank; Wick's shack + jetty far bank; ford west). Woods w1..w3 east of glade
(sword at w3, sinkhole to caves). Mountain path f1..f7 south (wind sets of three, ledges, rock columns, tortoise at f7),
High Crags peak1..3 east of f7 (unlocked after the tortoise). Foothill farm west of f1. Marsh/hollow/swamp/caves as before.

## Balance / pending ideas
- Charger horn only from 2 chargers; ironwood bottleneck (3 recipes want 10); Warden enrage threshold 9 (consider 12).
- Drawn hero is shelved (arena + &model only) until reviewed.
- Ideas parked: chapter 2 dungeon under the swamp shrine, seasons, gremlin raids on the farm, rope traversal, music reacting to combo,
  new game+, co-op; unbuilt monsters (Bog Bellower, Moss Golem, Thornback boar, Nettle Sprite, Ash Wraith, Gremlin Chief,
  Mountain Roc (foreshadowed at the summit), Wind Wisp, Salamander, The Sleeper).

## Next task (suggested)
Wire the other skills through the same table: skillUse('sword') per swing and ('sword', true) per hit in p4 combat,
skillUse('dodge', true) when a dodge avoids a hit (state.dodged), skillUse('farm') per plant/harvest. Then give each
level a small effect: sword combo window, dodge cooldown, crop speed. Keep levels invisible and the lines rare.
