# Top 5 Quick Wins

Low-effort, high-payoff changes. Nothing here needs new assets, a build step, or new systems — all are achievable by editing the existing `render()`/CSS code directly. Ordered by payoff-per-minute-spent.

---

## 1. Add drop shadows under every entity

**Effort:** ~15 min · **Touches:** `render()` in `game.js`

Before drawing the player, enemies, towers, forge, and town core, draw a soft dark ellipse beneath them:

```js
function drawGroundShadow(x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y + ry * 0.4, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
}
```
Call it once per object right before its main fill, using roughly `radius * 0.9` for both axes. This single helper, called ~6 places, is the fastest way to make the whole scene look grounded instead of floating.

---

## 2. Swap flat fills for radial gradients on the "big" shapes

**Effort:** ~20 min · **Touches:** town core (`game.js:359-362`), forge (`game.js:369-374`), built towers (`game.js:399-402`)

Flat fill → a small radial gradient (light at the upper-left, darker at the edge) instantly implies volume:

```js
function radialFill(x, y, r, colorLight, colorDark) {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, colorLight);
  g.addColorStop(1, colorDark);
  return g;
}
// e.g. for the town core:
ctx.fillStyle = radialFill(townCore.x, townCore.y, townCore.radius, '#ffe9b3', coreBaseColor);
```
Do this for the 3-4 largest/most-central shapes first (core, forge, towers) — those are what players look at most, and gradients on small elements (projectiles, gold) matter far less.

---

## 3. Hit-flash + screen-shake-lite on damage events

**Effort:** ~30 min · **Touches:** projectile collision (`game.js:282-296`), core damage (`game.js:250-255`)

Two cheap additions:
- **Hit flash:** give enemies (and the core) a `flashTimer` set to ~0.08s whenever they take damage; while `flashTimer > 0`, draw them with `ctx.fillStyle = '#ffffff'` instead of their normal color (or use `globalCompositeOperation = 'lighter'` for a brighter flash), decrementing each frame.
- **Micro screen-shake on core damage:** keep a `shakeTimer`/`shakeMagnitude`; when the core takes a hit, set `shakeMagnitude = 6` and decay it over ~0.15s; in `render()`, apply `ctx.translate(randRange(-mag, mag), randRange(-mag, mag))` before drawing the world (and reset after).

This is the single highest "feels expensive" change relative to code size — it's the difference between the world reacting to what the player does and just silently updating numbers.

---

## 4. Replace the system font with a proper display font for the HUD

**Effort:** ~10 min · **Touches:** `style.css:10`

Swap `'Segoe UI', Tahoma, Verdana, sans-serif` for a game-appropriate face. Two options depending on whether you want an internet dependency:
- **No internet required (safer for an offline `file://` game):** bundle a single open-license `.ttf`/`.woff2` (e.g. a free strategy-game-style display font) locally and `@font-face` it — one file, no build step.
- **Simplest possible:** just change the stack to something with more character even from system fonts, e.g. `'Cinzel', 'Trebuchet MS', Georgia, serif` for headings/numbers and keep a clean sans for body copy — an immediate, zero-asset upgrade over the current Windows-dialog look.

Apply the new face to `#hp-label`, `#gold-text`, `#timer-text`, `#weapon-text`, `#end-title` specifically (the numbers/labels players actually read), not necessarily the hint text.

---

## 5. Give the HUD actual panel backgrounds and simple icons

**Effort:** ~25 min · **Touches:** `style.css:30-86`, `index.html:13-24`

- Wrap `#hp-panel` and `#stats-panel` in a semi-transparent rounded panel (`background: rgba(15,20,15,0.55); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px 14px; backdrop-filter: blur(2px);`) so the HUD reads as *interface* rather than floating text.
- Prefix `Gold: 30` with a small drawn/emoji coin glyph (even a plain `●` in gold color, or a tiny inline SVG circle) and the HP label with a shield/heart glyph — cheap, immediate "someone designed this" signal.
- Round and inset the HP bar (`#hp-bar-bg`) with a subtle `box-shadow: inset 0 1px 3px rgba(0,0,0,0.5)` so it reads as a recessed gauge instead of a flat rectangle.

---

### Why these five specifically
All five are: (1) confined to files that already exist, (2) require no new dependencies, art pipeline, or gameplay changes, and (3) each individually touches something the player looks at constantly (the whole scene, the HUD, or the moment-to-moment combat feedback). Doing all five in one pass would likely change the game's perceived quality more than any single item in `high_impact_upgrades.md`.
