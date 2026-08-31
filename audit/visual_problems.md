# Top 5 Visual Problems

Ranked by how much each one contributes to the "cheap/unfinished" impression.

---

## 1. Everything is a flat-filled shape with no depth cues

**Where:** `drawTriangle()` (`game.js:325-337`), town core fill (`game.js:359-362`), forge (`game.js:369-374`), tower spots (`game.js:397-405`) — every single draw call is `ctx.fillStyle = <flat color>; ctx.fill()`.

**Why it reads as low-end:** no gradient, no shadow, no highlight means no implied light source, no volume, no sense that objects sit on the ground rather than float above it. This is the #1 tell of "unstyled canvas prototype" versus "finished game," and it affects literally every visible object.

**Impact:** highest — fixing this one thing (gradients + drop shadows on existing shapes) touches every object in the scene and would be the single most visible improvement available.

---

## 2. Zero hit/impact/death feedback

**Where:** enemy death (`game.js:288-293`), core damage (`game.js:250-255`), tower/forge purchases (`buildTower`/`upgradeTower`/`upgradeForge`, `game.js:127-156`).

**Why it reads as low-end:** actions have consequences in the data (HP drops, gold spawns, level increments) but **no consequence on screen** beyond the state change itself. A shooter/defense game lives or dies on feedback — right now shooting something feels the same as it not being hit, and spending gold feels the same as the click failing.

**Impact:** very high, and cheap relative to payoff — this is "juice," which is famously disproportionate in cost-to-perceived-quality.

---

## 3. No lighting, shadows, or grounding on any entity

**Where:** entire `render()` function (`game.js:346-449`) — no `ctx.shadowBlur`/`shadowColor` used anywhere, no gradient fills.

**Why it reads as low-end:** the player, enemies, towers, and forge appear to float over a flat green field rather than stand on it. Real-world (and most professional 2D) top-down games always cast a soft shadow beneath characters/objects — its absence is subtle but is one of those things that "just looks off" even to players who can't say why.

**Impact:** high, low effort — a single reusable `drawShadow(x, y, radiusX, radiusY)` helper called before each entity draw fixes this everywhere at once.

---

## 4. Generic, undressed HUD typography and panels

**Where:** `style.css:10` (font stack), `#hud` (`style.css:30-42`, no background/panel at all), HP bar (`style.css:53-68`, plain rect).

**Why it reads as low-end:** the font is a Windows system-dialog stack (Segoe UI/Tahoma/Verdana), there's exactly one visual treatment (bold text + drop shadow) for all HUD text, and the top HUD has no panel/background at all while the end-screen does — so the UI doesn't feel like it belongs to one designed product. This is the difference between "text is on screen" and "there is a UI."

**Impact:** high visibility (it's on screen 100% of the time) but low-to-medium effort to fix — a display font, a couple of panel backgrounds, and icon glyphs go a long way.

---

## 5. Flat, empty environment with no thematic detail

**Where:** background fill (`game.js:349-355`) — two flat circles/rectangles, nothing else.

**Why it reads as low-end:** the game is called "The Last Village" but nothing on screen currently reads as a village — no paths, structures, fences, terrain variation, or scattered detail. The play space is functionally an arena with a color gradient standing in for "town vs. wilderness." This is the least urgent of the five (it doesn't block gameplay legibility) but it's the biggest gap between the game's *name/premise* and what's actually rendered.

**Impact:** medium — mostly about atmosphere/theming rather than perceived "quality," but it's a highly visible gap once the other four are fixed and the game otherwise starts looking polished.

---

### Honorable mentions (didn't make the top 5, but worth noting)
- Tower-spot "+" icon and dashed outline are hard to read against the mid-green town field at low opacity (`game.js:388`, `393`).
- HP mini-bars over enemies/core are bare black-backed rectangles with hard corners (`drawMiniBar`, `game.js:339-344`) — no border, no rounding, no icon.
- The player's "gun" is a small flat circle centered on the triangle (`game.js:445-448`) — reads more like a second body part than a weapon.
- No visual distinction between the two enemy types beyond size/color (same triangle silhouette) — a genuinely different shape per type would read faster in the heat of combat.
