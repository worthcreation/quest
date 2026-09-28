# Keys and slots

One job per key. Slots A S D F sit under the vigor bar; empty slots draw nothing.

- F: the dynamic action. Whatever is in front of you comes first (talk, plant, pick up, build, pull). With nothing to do, F swings your blade. Hold F, let go: lunge. (With the wooden sword the slash comes when you let go, so a hold is a clean lunge.) F only ever holds a blade (sword, wooden sword); tap R to switch between blades.
- D: throw. Acorns live here. Tap to throw, hold to wind up. Winding up and swinging F work at the same time.
- S and A: things you use or call on (food, dodge, marsh fire, flare). New ones fill S, then A. Tap to use (marsh fire: hold to breathe, let go to spark).
- R is the only swap: press and hold R and the wheel opens on the key you last used; while R is held, A / S / D / F switch which key you're choosing for, and each wheel lists only what that key can hold. Point with the arrows, let go of R.
- Seeds are never on a key. F at an empty patch opens a small menu: plant any seed you carry, or compost (3 acorns).
- Anything can still be placed from the pack, but only on a key it fits. Rebinding a key that's taken swaps the two, so no key is bound twice.
- Menus: F selects, D backs out one level, M opens and closes the pack.

Code: gear.js (slots, lanes, laneAllows), actions.js (throwing, wheels), interact.js (what F does here).

## The pack

- Anything you gain appears in the pack somewhere, to look at or use: tools, keepsakes (letter, pages, beans), companions (the beetle), blessings, plans you've been taught, timed effects.
