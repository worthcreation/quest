# Quest: what the project is, and how we work on it
Checked 29 Sep 2026 against build 164 source (the 29 Sep rewrite was against build 65 and a p-file layout that no longer
exists). Read this and HANDOFF.md at the start of every Quest chat.

## 1. What Quest is
A browser RPG, Zelda meets EarthBound, for a family on a laptop or phone. One index.html on GitHub Pages
(worthcreation/quest), built from src/ by `sh build.sh` (file order in src/ORDER). Youthful, warm, a little silly (rabbit
glue), never mean. Puzzles are physical and readable: see the thing, understand what it wants, do it with your hands.

One gameplay code for every face: Quest, Arena (?arena), Puzzles (?puzzle), test links (?mountain, ?scene=<id>).
Verified: ARENA/PUZZLE appear in engine.js (entry, hubs, dispatch), their own files, boot, menu, draw-ui, draw-hero,
and in pip/quests/tutorial only to keep the story out. Never in movement, combat, wind or AI. Keep it that way.

## 2. Principles
1. One source of truth. Gameplay lives once, in src/. A variant is a flag or a data table, not a copy.
2. Lay out in tiles at enterScene for anything you jump, hop or ride to. Screen fractions are for generation only.
3. Readable before pretty: make the rule visible first (shadow, lips, the tile overlay), then dress it.
4. Guaranteed first, chance after. Tutorials never fail on the first try.
5. Words are part of the mechanic. On every rework, grep the old words and retire them.
6. Test with numbers. "7 of 7 hops, 0 falls" is a claim; "should work" is not.
7. Render only when Ross asks (a still, a mockup, a look to check). Tests carry the proof otherwise.
8. Dialogue: Pip and NPC lines (say key 'pip'/'npc') hold until F; tutorial and coach lines are free (hold:false) so
   the player can keep moving. Story flags advance from the player's actions, never from a line ending.
9. Source lives in git. Chats end.
10. Delete what lost its purpose in the same build it lost it.
11. Learned the hard way: never put a `// comment` in the middle of a one-line replacement; it swallows the rest of
    the line. build.sh now refuses to finish if the built script doesn't parse.
12. Learned the hard way: anything that takes over the update (rapids, climb) must also handle death, menus and
    dialogue itself, or the game sits on a black screen.

## 3. The feature loop (every request)
1. Restate the request in one line; name the screens, files and tests it touches. Ask one question only if the answer
   changes what gets built. Otherwise decide and state the assumption.
2. Reuse before adding (section 4). New system only when nothing fits.
3. Write or extend a headless test that plays it like a person (walk, press, wait); add a bot where scale matters.
4. While working: `sh build.sh` and `node tests/<name>.js` for the tests it touches. No renders unless asked.
5. Write the one short HISTORY entry, then ship in one call: `sh tools/ship.sh NN "Build NN: ..." [scene]`. It bumps
   BUILD, builds, runs every test (about 2 minutes) and the overlap check, packages quest-bNN.zip only if all pass,
   and prints the ship line and every play-test link with a fresh prime (tools/links.js holds the list).
6. Deliver: what changed (grouped by what the player sees), what was tested with numbers, then the printed ship line
   and links as they came out.
7. For unsettled looks, iterate on still mockups first (no build), when Ross asks for them.

## 4. Reuse table (checked against source; file in brackets)
- World: barrier()/breakBarrier [world/engine]; crag() + hitCrag (single boulders that crack, drops) [world/items];
  keystone()/hitStone [world/items]; pullable() + pullLocked [world/items]; claim()/freeSpot() [world];
  corridorSpan/fitToCorridor (mountain path) [world]; enterScene layout hooks; RT[id].flags.
- Text: say() [text] (pages, holds), pipLine() for anything Pip says (hold: true waits for F) and pipSay() for a once-only line [pip], showTitle() for quest start/end only, showScroll() for every
  other alert, notice() for pickups (a scroll too). There is no tell() and no questAlert; don't look for them.
- Pip: PIP_LINES (one-off lines with when/at/text), TUTORIAL (ordered steps), COACH (pinned steps, shown only inside
  the pack; outside Pip says them) [tutorial]; drawPip() is the only Pip drawing [draw]; PIP_PACE, PIP_SIZE;
  pipPost/pipArrive decide where Pip is on a screen (enterScene and updatePip both call it), pipBackIn brings him in
  from an edge, exitToward/exitPoint [pip].
- Story: inv.story + STORY [craft], storyAt() [quests], campBuilt() [craft]; QUESTS + updateQuests + drawQuestHud
  [quests] (updateQuests watches flags, never drives them); inv.qtrack.
- Progression: SKILLS/skillUse [skills]; FOOD [gear]; SEEDS [items]; plotStage() + PATCH [interact]; CROP_XP [gear];
  RECIPES [craft]; slots SLOT_KEYS/useSlot/flashSlot [gear]; the R wheel [actions].
- Drawing: drawItemIcon for every icon [draw-ui]; drawJagged (optional context) for every rough stone; drawRock (seeded
  lumpy stone) and drawSoilLine (the zigzag where stone meets ground; soilLinePts gives its points, to clip a stone to
  it) and rounded(x, y, w, h, r) for every rounded box [draw]; drawHUD is bottom-right (vigor and
  slots, fading when quiet); the quest HUD is top-right; banners own the top only for quest start/end.
- Climb screens: CLIMBS table [climb] (trail, gap field, side); newClimb/updateClimb/drawClimb; SHADOW tuning.
- A scene bigger than the screen: give it sc.virt = [w, h] in tiles; sceneSize makes W and H its size while it's
  current (update and enterScene), and L() walks at the screen's pace. The rise is the one: riseLand, addRise,
  riseHalf, riseView, riseCamera, drawRise (draws the game's own things at their spot on its ground), riseCragSprite
  [rise]. Its solids are the collision; nothing else tests an edge there.
- Mode flags: ARENA, PUZZLE, MODEL_ON, MOUNTAIN, START_SCENE, TEST_MODE (tests only), and only where section 1 says.

## 5. Audit
- `node tools/audit.js` is the report card: unused names, size (lines per file, lines over 200 characters, distinct
  state.* fields), the longest functions (over 150 lines flagged), statement shapes written 5+ times (a helper
  waiting to happen), and update plus draw cost per screen in the harness (over 2 ms flagged, errors listed). About
  6 seconds. It compares against docs/audit-baseline.json.
- Run it at the start of a cleanup chat and at every handoff; not every build. At a handoff: `node tools/audit.js
  --save`, and copy its last line (the summary) into HANDOFF.md.
- It informs; it doesn't block. Only `node tools/dead.js` stops a ship (tools/ship.sh runs it right after the build):
  a top-level name nothing references is deleted in the same build, or marked `// keep: <reason>` on its definition
  line if it's a hook on purpose (startEnding is).
- What it flags goes on HANDOFF's cleanup list and gets its own build, separate from feature builds. The fix for a
  flagged function is to split it the next time a feature touches it, unless Ross asks for a cleanup build.
- Baseline (build 174): 10914 lines, 0 unused, 4 functions over 150 (genWorld 533, drawSolid 216, drawItemIcon 203,
  updateCut 163), 5 repeats (top: a note above the hero, say(..., h.x, h.y - UNIT * n, ...), 25 times in 8 files),
  162 state fields, frames avg 1.0 ms, 4 over 2 ms (rise, climb3, climb4, f5), 0 errors.
- Watch for: the ship command's Remove-Item globs; p*.js also matched pip.js and puzzles.js. Never glob-delete in src/.
- Still to decide with the climb: the crag() painter inside paintClimb and climbBand fixed at 12. Keep ZIG1/zig()
  until the climb design settles.

## 6. Definition of done
- `sh tools/ship.sh` finished: build parses, every test passes, 0 overlaps, zip packaged, BUILD bumped.
- Anything laid out in tiles is tested at both screen shapes (1280x800 and 390x844) by numbers. Grep for stale words.
- One short entry at the top of docs/HISTORY.md every build. HANDOFF.md's current-state sections at a handoff (end of
  a chat, or when asked), not every build.
- Reply ends with the ship line and links as tools/ship.sh printed them. If a link is added or renamed in src/, update
  tools/links.js in the same build.

## 7. Talking to the model
Say what the player should see and feel, and the rule. Batch related changes into one build. For visuals: one
reference image plus a few words; "render a still" gets a mockup, no build. If a chat compacts, say so. Start a
fresh chat every 5 or 6 builds or when the topic changes: long chats are slower, and HANDOFF carries everything.

## 7a. Which model: FABLE or Opus (enforce this, every chat)
Claude says which model the task needs IN THE FIRST LINE OF ITS FIRST REPLY, before any work, and again the moment a
task changes size mid-chat. When the answer is Fable and the chat is on Opus, Claude STOPS and says so plainly:
"Switch to Fable for this: <reason>. Start a fresh chat on Fable and paste the task." It does not start the work on
the wrong model to be helpful, and it does not soften it to a suggestion.

USE FABLE when any of these is true:
- the plan changes more than about four files in ways that depend on each other;
- it's a refactor with no change in play across a system (splitting genWorld by region, a MONSTERS table if it
  also reshapes combat or drawing, mapping or moving who owns which state.* fields);
- it joins or restructures parts of the world (the climb into the world, retiring f3 to f6, a new region);
- it designs a new system from nothing (a new mechanic, a new menu, a save format);
- an audit shows problems spread across many files and the job is deciding what to do about them;
- two tries on Opus haven't fixed a bug, or the cause spans several systems.
STAY ON OPUS for: one feature in one or two files, tuning numbers, a bug with a known cause, running the audit,
mechanical moves (dead code, a helper replacing repeats), docs and handoffs, mockups.
If unsure, Fable. Fable's extra safeguards cover biology, cybersecurity and AI research; none of that touches this game.

## 8. Handoff between chats
1. Each build: one download, quest-bNN.zip, laid out like the repo root. Ship (Windows PowerShell, in a ```powershell
   block so it's coloured; PowerShell 5.1 has no &&):
   cd ~\quest -ErrorAction Stop; Expand-Archive -Force ~\Downloads\quest-bNN.zip .; Remove-Item ~\Downloads\quest-bNN.zip; git add -A; git commit -m "Build NN: ..."; git push
   (git add -A, not ".", so deletions are committed too.)
2. At a handoff: refine PROJECT_INSTRUCTIONS.md against the source, and docs/PROJECT_DESCRIPTION.md only if the mood,
   theme or direction changed. Give both as copyable text, always the full current file, never just the changes;
   they go in the claude.ai Project settings.
3. Start of a chat: clone worthcreation/quest, read HANDOFF.md and this file, then the task. github.com is reachable
   from the container; no uploads needed once the repo is current.

## 9. Roadmap
1. The climb: settle the look (screens 1 to 5 on ?mountain), then decide where it joins the real world (between the
   windy fields and the crags) and retire the f2-f6 mountain-path screens it replaces.
2. Balance pass from arena and puzzle records; sword swing cost (SWING_COST) and Pip's pace still being tuned.
3. Story after the rescue: the journal quest, spore travel, the High Reaches, then chapter 2.
4. The drawn hero, once mechanics lock.
