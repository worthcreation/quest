# Quest: handoff notes (as of build 66, 27 Sep 2026)

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
- Never use pressure plates language: woods puzzles are cracked keystones (throw a rock), buried rocks (stomp to knock loose,
  then rock and heave), brambles (thrown rock), the gremlin burrow (thrown rock).

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
