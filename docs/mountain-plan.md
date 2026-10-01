# The mountain: one family of screens after the rise (roadmap, 1 Oct)
Ross, 1 Oct: fold the rise and the climb into one family. The climb's puzzles come back as screens after the rise,
sharing the rise's and the windy meadow's familiar pieces: the same wind, rabbits that grow with height, birds that
hunt them (and you), gaps that widen and open under you, the side-view ledges, a way inside the mountain. A few
screens are fixed and zoomed out; the rest move like the rise. Ross: this is what the climb was always meant to
be. The defaults below stand unless he overrules; new looks get still mockups before the build that needs them.

## The rule that decides how it's built
The climb (climb.js) runs its own world: updateClimb returns before the main update, so nothing from the game lives
there (no rabbits, birds, Pip, items, fire). The rise runs on the main game with its own drawing. Every mountain
screen is built the rise's way (sceneSize, riseLand-style layout in tiles at enterScene, one shape function for
collision and drawing). The climb's puzzles are remade on that footing one screen per build; climb.js is deleted
when its last puzzle has moved. Arena, puzzle and test modes stay on the main game's code throughout.

## The chain
rise (as now, the reeds open later) >
m1 The wind shelf. Moving camera, like the rise. climb1's winding ravine, crossed at its narrow points; the rise's
   rabbits a size up and snarling; the first birds, circling the rabbits.
m2 The stepping path. Fixed, zoomed out (the whole crossing in view). climb2's round islands over the ravine; a
   bird that picks you off an island and drops you at the screen's start (replacing the too-strong gusts that threw
   you to the farm).
m3 Inside the mountain. Moving camera. A way in through the side and out higher; no wind, dust sifting down;
   climb3's rifts, but they crack open ahead of you as you walk (a line across the floor, then the drop); rabbits
   bigger again, cornered ones fight.
m4 The windy crossing. Fixed, wide. climb4's bare islands and big rocks to shelter behind; here the rabbits are big
   enough to fight the birds off: a bird that grabs a rabbit gets kicked down, and above this screen there are none.
m5 The last ledges. Side view (climb5, on the main game). The buff rabbits: hopped up on carrot juice, bodybuilding,
   short-tempered, after the next carrot or health juice.
peak1 (the crags; the tortoise's home near here, 2b).

## The pieces, reimagined
- Wind: f1's and the rise's three-gust pattern, tell (tall grass leaning) and look, stronger with height. What it
  carries changes: leaves low, dust and grit of rock higher, now and then a tuft of fur or a feather. One particle
  table keyed by scene height; the fx code already does leaves (engine.js gust fx).
- Gaps: ravines widen screen by screen; some open under you (crack, then drop, with a beat to react). Laid out in
  tiles at enterScene, every crossing a running jump at most; the shadow stays the aim.
- Rabbits: one MONSTERS.rabbit with a size and temper per screen (scale, hp, bite, how soon it fights instead of
  running). Low: the rise's rabbits. Mid: snarling, bigger. Top: buff, strutting, juice-crazed. They want carrots:
  a carrot thrown is a distraction; a carrot carried draws them. Health juice: Ross to say what it is (a craft from
  carrots? the thing the buff ones guard?).
- Birds: a new critter. They hunt rabbits (dive, lift, drop) and you (grab and carry back a stretch, a vigor cost).
  On m4 the rabbits turn on them; none above.
- Cameras: fixed and zoomed out on m2 and m4 (and m5 side-on); moving on m1 and m3, the rise's riseZoom and tilt
  reused.
- Inside: m3 is the one interior; its light and drawing are the cave's family unless Ross wants its own.

## Defaults (Ross can overrule any)
1. The chain: five screens, m1 to m5, as above, then peak1.
2. Birds: the High Reaches' hawk (critters.js: circles, its shadow on the ground, dives, grabs and carries,
   updateGrab), reused, not a new critter. A sword hit knocks it off you; a big rock or a tree is shelter.
3. Carrot juice: a craft from carrots (two carrots); a little vigor back. Thrown, it pulls every rabbit in range
   (they fight over it). Health juice is the stronger one the buff rabbits are after: a craft later (with item 9's
   quick craft), flavour until then.
4. Buff rabbits drop hide (mats.hide already exists); bigger rabbit, more hide.
5. The tortoise (2b): its own small screen between m5 and peak1, a hollow where the wind drops to just a breeze,
   with its little home; you bring it peaches. Peaches: a peach tree on the foothill farm (the farm stays). What it
   gives back: what it gave before, the step up in vigor depth, and it points the way on to the crags.
6. Mockups in this order, each just before its build: dust-and-grit wind (205), snarling rabbit (206), the hawk
   lifting a rabbit (207), the interior (208), buff rabbit (210), the tortoise's home (211).

## Builds (main's BUILD plus one each; one at a time)
204 retire f3 to f7 (HANDOFF item 2). FABLE.
205 the wind by height: one particle table keyed by height (leaves low, dust and grit higher, the odd fur or feather)
    and gust strength by height, rise included; no new screens. Opus.
206 m1 the wind shelf on the main game (climb1's ravine), the rabbit's size-and-temper table (rise as is, m1 a size
    up and snarling); climb1 comes out of climb.js. FABLE.
207 hawks hunt rabbits as well as you (dive, lift, drop); on m1. FABLE.
208 m2 the stepping path, fixed and zoomed out (climb2); the hawk carries you back to the start. FABLE.
209 m3 inside the mountain, moving camera (climb3); rifts that crack open ahead of you. FABLE.
210 m4 the windy crossing, fixed and wide (climb4); rabbits fight the hawks off, none above. FABLE.
211 m5 the last ledges, side view on the main game (climb5); the buff rabbits; carrot juice; climb.js deleted.
    FABLE.
212 the tortoise's home between m5 and peak1; peaches on the farm. FABLE.
Each screen lays its ranges out from its own stream (seed and screen id), every crossing a running jump at most
(this replaces the old "climb from the seed" item). Each build ports that screen's climb test to the main game.
