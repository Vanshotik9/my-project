# Top 5 High-Impact Upgrades

Bigger-effort changes than the quick wins, but still achievable in vanilla Canvas 2D/CSS without a rewrite, an art pipeline, or new dependencies. These are what would take the game from "polished MVP" to "feels like a real product."

---

## 1. A lightweight particle system for hits, deaths, purchases, and pickups

**Effort:** ~1-2 hrs · **Payoff:** the single biggest jump in "does this feel premium"

One reusable array (`particles = []`) with a generic shape `{x, y, vx, vy, life, maxLife, color, size}`, updated/rendered alongside existing entities, driven by a couple of spawn helpers:
- `spawnBurst(x, y, color, count)` — small circles flying outward and fading, for enemy death and tower/forge upgrade confirmation.
- `spawnSparks(x, y, angle, color)` — a tight directional burst, for projectile impacts.
- `spawnFloatingText(x, y, text, color)` — a string that drifts upward and fades, for `+3 gold` on pickup and `-15` on core damage.

This single system covers *every* feedback gap identified in `visual_problems.md` #2, reuses one update/render loop, and is the standard technique that makes indie action games feel responsive without any art investment.

---

## 2. A cohesive lighting pass: vignette + directional shadows + rim light on the town core

**Effort:** ~1 hr · **Payoff:** atmosphere and focus

- **Vignette:** one radial gradient drawn last, from transparent center to `rgba(0,0,0,0.45)` at the canvas corners, composited over everything. This alone makes the play area feel like a lit scene instead of a flat poster, and naturally draws the eye toward the town core.
- **Consistent shadow direction:** once ground shadows exist (quick win #1), offset them all the same direction (e.g. down-right) to imply one light source, rather than straight-down — small detail, reads as "considered," not "default."
- **Rim light / pulse on the town core when it's the last line of defense:** when core HP drops below ~30%, add a slow red pulsing glow (`ctx.shadowBlur`/a secondary translucent stroke oscillating in radius) around it — turns "the core is low" from a stat you have to notice into something the screen itself communicates.

---

## 3. Distinct silhouettes and small animated tells per entity type

**Effort:** ~1-2 hrs · **Payoff:** readability + character, biggest single "art style" upgrade available without assets

Right now every unit is the same triangle at a different size/color. Differentiating silhouettes (still pure vector, no sprites needed) would do more for "art direction" than any color change:
- **Fast enemy:** smaller, sharper/elongated triangle, maybe with a thin motion-trail (draw 2-3 fading copies of its last positions).
- **Strong enemy:** blockier shape (e.g. a rounded pentagon or a triangle with a secondary "shoulder" bulge), heavier stroke, subtle idle scale-pulse to feel "tanky."
- **Towers:** differentiate by level with a genuinely different silhouette per tier (e.g. level 1 = single turret barrel, level 2 = twin barrels, level 3 = add a base platform ring) instead of just a size/pip change — makes upgrading *look* like an upgrade, not just a bigger circle.
- **Player:** small idle animation (subtle bob or gun-barrel recoil kick on fire) so the character reads as active rather than static between inputs.

---

## 4. Environmental detail pass inside the town circle

**Effort:** ~1-2 hrs · **Payoff:** sells the "village" premise, biggest background upgrade available

Currently the town is one flat lighter-green circle. A believable low-cost upgrade, still zero external assets:
- Draw simple **paths/roads** connecting the town core to each tower spot and the forge (thin lighter-tan strokes) — instantly implies a built settlement rather than an arena.
- Scatter a **fixed set of static decorations** (rocks, grass tufts, small fence segments, a couple of simple hut silhouettes) at deterministic positions generated once at load (seeded pseudo-random, cached to an offscreen canvas so it costs nothing per frame) — breaks up the flat fill without any runtime cost.
- Add a **subtle terrain gradient/noise texture** instead of a flat green fill (even a coarse repeating dot/grain pattern drawn once to an offscreen canvas and tiled) to avoid the "solid color fill" look entirely.
- Draw the outer "wilderness" zone slightly darker/desaturated relative to the town, reinforcing the safe-zone-vs-threat read that the spawn mechanic already implies.

Rendering this to an **offscreen canvas once** (not every frame) keeps performance identical to today — this is a one-time draw cost, not a per-frame one.

---

## 5. A real UI system: consistent panel component, icon set, and juiced end-screen

**Effort:** ~2 hrs · **Payoff:** professionalism of the "product," not just the game world

- Define one visual "panel" style (background, border, radius, shadow — see quick win #5) and reuse it everywhere: top HUD, hint overlay, end screen. Right now each piece of UI has a different treatment; unifying them is what makes a UI feel *designed* rather than assembled.
- Build a tiny inline icon set (SVG or hand-drawn canvas glyphs: coin, heart/shield, sword/gun, clock) to replace text labels (`Gold:`, `Weapon Lv`) — icons read faster and look far more finished than word-labels.
- Animate the end screen in: scale/fade the panel in over ~0.3s instead of an instant `display` swap (a CSS `@keyframes` on `.hidden`/reveal is enough), and consider a full-screen color wash (green tint for victory, red for defeat) behind the panel for a beat before it appears — turns the win/lose moment into a payoff instead of a UI toggle.
- Add a subtle **hover affordance** on interactive world objects (tower spots, core, forge) — e.g. a faint glow or scale-up when the mouse is near/over their click radius — so "these are clickable" is communicated visually instead of only by the cursor and hint text.

---

### Sequencing note
Items 1 and 2 give the most noticeable improvement for the effort and don't depend on anything else. Item 3 (silhouettes) is best done *after* the lighting/shadow pass (item 2), since new shapes should be designed with the gradient/shadow treatment in mind rather than retrofitted. Item 4 (environment) and item 5 (UI system) are the most self-contained and can be done in any order, in parallel with the others.
