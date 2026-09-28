# Farming and gathering

- Patches are few and sit mostly by travel mushrooms, never packed side by side (diagonal or a tile between). Pip's garden has two; camp has four; each mushroom has two nearby.
- F at an empty patch: plant any seed you carry, or compost (3 acorns). Compost turns the soil: faster growth, sometimes extra.
- Seeds are distinct (turnip, carrot, pepper, squash) and look like the real seeds. One seed grows 1 to 3 turnips or 1 to 2 carrots. Turnips heal slowly and sometimes raise max vigor; carrots heal at once.
- Crops are pulled up like rocks: hold F, rock left and right, then up. Farming level lowers the rocking (3, 2, 2, 1, 1) until it's just F.
- Picking things up: F within reach. Gathering skill grows with every pickup: reach grows, a faint ring shows within reach, and things start drifting to you on their own (common at level 3, uncommon at 6, rare at 9, anything on screen at 12). Hidden loose spots (pound to open) show from level 5.
- Rocks: a thrown rock can bury itself in mud, and in soft ground one time in five. Pound beside it, rock it, heave it out.

Code: interact.js (patches), items.js (pickups, pulls, mud), skills.js (gathering, farming levels), world.js (where patches go).

## Boulders (the woods)

- Every obstacle is one boulder on its own, 1 to 5 tiles across. It takes one good rock hit per tile, cracking more each time, and breaks into pieces on the last. Only that boulder breaks, and it leaves a rock to throw at the next.
- Exits are blocked by one boulder a bit bigger than the opening. The cave is blocked by one great stone with a gap beside it only gremlins fit through. The sword sits under a cluster of brambles.
- No rings, rows or keystones.
