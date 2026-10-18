# Lilac Apothecary

By **LILAC VEXTOR** · package `com.lilacvextor.lilacapothecary` · Expo owner `889-893`.

A potion-deduction puzzle for Android: read the old ledger of brews and their seals, reason out the one true recipe, and brew it.

**How it plays.**
- A recipe is a row of ingredients, one per brass dish. The ledger lists earlier brews of the same potion.
- Each ledger line earns a gold seal for every ingredient in the right dish, and a silver seal for every other ingredient that belongs but sat in the wrong dish.
- Exactly one recipe agrees with every line. There's no luck; it's pure reasoning.
- Tap a dish to choose it, then a jar to fill it; the next empty dish is chosen automatically. Tap a chosen dish again to empty it.
- Hold a jar to strike it out when you know it isn't in the recipe.
- Press **Brew** when every dish is full. A wrong brew fizzles and names the ledger line it breaks, with the seals that line would have shown. Undo and empty are free.
- A hint fills one dish correctly and fixes it there.
- Stars (gold seals): three for a first-time brew without a hint, two with one slip.

**Content.**
- 24 potions in three chapters:
  - **Herbal:** three dishes, five or six jars.
  - **Tinctures:** four dishes, six or seven jars, no repeats.
  - **Elixirs:** four dishes, where an ingredient may appear more than once.
- Ledgers are generated, then pruned so that every line is necessary. The tests check that exactly one recipe fits and that removing any line lets in others.

**Look and sound.**
- Visuals: a candlelit oak shop with shelves of glass jars. The eight ingredients (lavender, rose, mint, saffron, moonflower, nightshade, honey, sea salt) each have their own silhouette as well as colour. There's a parchment ledger with wax seals, brass dishes, and a round flask that fills, bubbles and glows when the potion is right.
- Sound: a harp in the dorian mode over a cello drone with a ticking clock, glass clinks, ingredients dropping into brass, a quill scratch for strike-outs, a sour fizzle for a wrong brew, and bubbling with a harp glissando for the right one.

## Structure

| Path | What it is |
| --- | --- |
| `web/src/game/sim.ts` | Seals, recipe enumeration, candidates, conflicts |
| `web/src/game/ledgers.json` | The 24 generated ledgers |
| `web/tools/gen.ts` | The ledger generator and pruner |
| `web/src/game/art.ts` | Ingredient emblems, jars, dishes, seals, the shop and the flask |
| `web/src/game/scene.ts` | The Phaser shop |
| `web/brand/` | Icon, splash and feature graphic |
| `Delivery/` | Play Store icon, feature graphic and screenshots |
| `src/native/` | Expo WebView shell |

```bash
npm install && npm run web:install
npm run web:test     # 32 tests
npm run build:game && npm run validate:assets && npm run android
```

## Release builds

The Android release is configured for Google Play: target and compile SDK 36, R8 minification and resource shrinking, a non-debuggable release build, no Internet permission, and the game served offline from the app's own assets. Builds run on EAS; `eas.json` has two profiles:

```bash
npm install -g eas-cli && eas login
eas init                     # once: links this folder to your Expo project
npm run eas:apk              # preview profile: a signed APK for testing on devices
npm run eas:aab              # production profile: an AAB for Google Play (versionCode auto-increments)
```
