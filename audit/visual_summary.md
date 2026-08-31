# Visual Audit — Summary

**Scope:** visual quality and presentation only. Gameplay, balance, and code architecture are out of scope.
**Reviewed:** `index.html`, `style.css`, `game.js` (all rendering + HUD code as of this audit).

---

## 1. Overall visual impression

**Verdict: reads as programmer art / a game jam prototype.** Every visual element is a single flat-filled primitive (circle, triangle, square, rectangle) with a solid stroke outline. There are no gradients, no shadows, no texture, no lighting, and almost no motion beyond straight-line movement. This is the single biggest reason the game feels cheap — not because the shapes are "wrong," but because nothing has depth or weight.

**What already works:**
- The color-coding is functionally clear: player is light blue-white, fast enemies are red, strong enemies are purple, gold is yellow, tower projectiles are cyan vs. player's yellow. Nothing is ambiguous.
- The HP-driven color lerp on the town core and HP bar (`game.js:361`, `game.js:465`) is a nice touch — it's the one place color communicates *state*, not just identity.
- The layout is legible at a glance: core in the center, towers ringed around it, forge distinct, HUD out of the way in the corners. Composition is not the problem.
- The gold-pickup pulse (`game.js:416`) is the only idle animation in the game, and it already helps that one element feel more alive than everything else.

**What should be improved first:** the flat-shape-with-outline look is the root cause behind almost every other weak point in this audit (art style, lighting, UI, feedback). A single pass that adds **radial gradients + drop shadows** to the existing shapes (no new assets, no new drawing calls' worth of complexity) would visibly lift the whole game before touching anything else. See `quick_wins.md` for the exact implementation.

---

## 2. Art style

There currently isn't a defined style — it's "default canvas primitives," which is a starting point, not a style. That's normal for an MVP, but it means there's no direction yet to be consistent *with*. Nothing is mismatched today only because everything is equally minimal.

Recommended direction: **flat/vector "clean strategy game" style** (think early Kingdom Rush or a minimalist tower-defense skin) rather than pixel-art or painterly. Reasons:
- It's achievable entirely in Canvas 2D with gradients/shadows — no sprite sheets, no art pipeline, no external tools required.
- It matches the top-down, geometric layout already in place.
- It scales cleanly at any resolution (important since the canvas is CSS-scaled responsively today, `style.css:23-28`).

Concretely, that means: every game object gets (a) a soft drop shadow to ground it on the terrain, (b) a gradient fill instead of a flat fill to imply volume, (c) a consistent stroke weight and a slightly desaturated outline color instead of pure white/black, and (d) small silhouette upgrades (see `high_impact_upgrades.md`) so shapes read as "tower / core / forge" instead of "circle / circle / square."

---

## 3. Color and lighting

- **Palette is muted and a little murky.** Background `#16211a` and town zone `#2c4331` (`game.js:350-355`) are both low-saturation dark greens sitting close together in value — there's not much separation between "ground" and "town," so the town boundary barely reads. Foreground objects (blue towers `#4c6ea8`, orange forge `#d9762e`, yellow gold `#ffd54a`) do stand out against that dark backdrop, so contrast for *gameplay-critical* elements is acceptable — but the world itself looks a bit like a swamp rather than a village.
- **No lighting model at all.** Every fill is flat and uniform; there's no implied light source, so nothing has volume. A single consistent "light from upper-left" convention (gradient direction + shadow offset) would do more for perceived quality than any other single change.
- **No shadows.** Nothing is grounded — the player, enemies, towers, and forge all look like they're floating over the terrain rather than standing on it. This is one of the most common reasons top-down games look unfinished, and it's cheap to fix (see `quick_wins.md`).
- **No glow/emphasis on important state.** Low HP on the town core is communicated only by a color shift, which is good, but there's no urgency cue (pulsing glow, vignette, screen edge warning) when the core is in danger — a moment that should feel tense currently feels the same as full health.
- **Separation from background:** good for primary actors (player/enemies/gold), weak for the town boundary and tower spots (dashed white stroke at 50% opacity on a mid-green field, `game.js:388`, is easy to lose track of, especially at small canvas sizes on lower-res displays).

---

## 4. UI quality

The in-world "click to interact" HUD elements (town core, forge, tower spots) are covered above. The screen-space HUD (`index.html:13-24`, styled in `style.css:30-156`) is functional but generic:

- **Typography:** `font-family: 'Segoe UI', Tahoma, Verdana, sans-serif'` (`style.css:10`) is a Windows system-dialog font stack. It's readable, but it makes the game look like a control panel rather than a game. There is exactly one font weight in use besides bold, no letter-spacing, no distinct display face for numbers/headings.
- **Panels:** the HUD has no background/panel treatment at all — text just floats over the game world with a drop-shadow for legibility (`style.css:40`). It works, but "text with a shadow" is the minimum-effort legibility fix, not a UI. There's no framing, no icons (gold is a word "Gold:" instead of a coin icon, HP is a label instead of a heart/shield icon).
- **HP bar:** a plain rectangle with a 1px border and 3px corner radius (`style.css:53-68`) — functional, no bevel, no inner shadow, no segment/tick marks, no icon.
- **End screen:** a centered dark card with a heading, subtitle, and one button (`style.css:125-156`) — this is the most "finished-feeling" UI element in the game because it's the only one styled as an actual panel (background, border, padding, radius), which shows how much a bit of chrome helps.
- **Spacing:** generally clean and uncluttered — the HUD doesn't feel busy, which is a genuine positive. The problem is polish, not layout.
- **Consistency:** the end-screen panel and the top HUD look like they belong to two different projects — one has a card/panel treatment, the other is bare text. Unifying these (same panel style, same font treatment) is cheap and would immediately read as more deliberate.

**Does it feel modern or basic?** Basic. Not broken, not cluttered, just undressed.

---

## 5. Animation and visual feedback

This is the weakest category. Presently:
- Enemy death = the sprite disappears and a gold coin appears in its place. No death animation, no particle burst, no flash.
- Taking a hit (enemy or town core) = no visual response at all beyond the HP bar shrinking. No hit-flash, no knockback, no damage number.
- Building/upgrading a tower or the forge = the shape instantly changes size/color. No "pop," no scale-in, no particle confirmation that a purchase happened.
- Firing a weapon = a projectile appears and travels in a straight line. No muzzle flash, no recoil, no impact spark on arrival.
- Gold pickup = coin disappears silently. No "+3" floating text, no collection animation toward the player.
- The only continuous animation in the whole game is the gold pulse.

None of the current feedback is *wrong*, it's just entirely absent where players expect a response — and juice/feedback is one of the cheapest ways to make an action game feel expensive, because it's almost all "add a few lines of drawing code," not "redesign the system." See `high_impact_upgrades.md` for a lightweight particle/feedback system that would cover hits, deaths, purchases, and pickups with one reusable mechanism.

---

## 6. Backgrounds and environment

- The world is two flat color fills (a dark rectangle and a lighter circle). There is no ground texture, no variation, no static detail (rocks, paths, fences, grass tufts, roads connecting the tower spots to the core), and no sense of the "village" the game is named after — right now it reads as an arena, not a town.
- The background does not distract (a plus), but it also does not support the theme at all — nothing about the current visuals says "village under siege" beyond the UI copy on the end screen.
- No depth cues: no parallax, no vignette darkening the screen edges to focus attention on the play area, no subtle noise/texture to break up the flat fills.
- **Biggest single background upgrade for the effort:** a radial vignette + a procedurally-scattered set of small static decorations (rocks/tufts/fence posts drawn once at load and cached, or simple deterministic pseudo-random dots) inside the town circle. This alone would break up the flatness without needing any art assets or a tilemap system.

---

*See `visual_problems.md`, `quick_wins.md`, `high_impact_upgrades.md`, and `visual_priority_plan.md` for the actionable breakdown and sequencing.*
