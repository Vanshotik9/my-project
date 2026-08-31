# Visual Priority Plan

A sequenced roadmap combining `visual_problems.md`, `quick_wins.md`, and `high_impact_upgrades.md` into an order of operations. Goal: maximum visual improvement per hour spent, with each phase building on the last instead of getting reworked later.

---

## Do first (Phase 1 — same session, ~1-2 hrs total)

These are cheap, foundational, and everything else looks better once they exist.

1. **Ground shadows under every entity** (`quick_wins.md` #1) — establishes the "grounded, has depth" baseline the rest of the pass builds on.
2. **Radial gradients on core/forge/towers** (`quick_wins.md` #2) — pairs directly with shadows to fix `visual_problems.md` #1 and #3 in one pass.
3. **Hit-flash + micro screen-shake on damage** (`quick_wins.md` #3) — fixes the most-noticed gap (`visual_problems.md` #2) for the least code.
4. **HUD font swap + panel backgrounds/icons** (`quick_wins.md` #4 and #5) — fixes `visual_problems.md` #4; the HUD is visible 100% of playtime, so this punches above its effort.

**Why these first:** none of them require deciding on an art direction, none of them are at risk of being thrown away by later work, and together they address 4 of the 5 items in `visual_problems.md`. This phase alone should be enough to stop the game from reading as "unfinished prototype."

---

## Do next (Phase 2 — follow-up session, ~2-4 hrs)

Build on the Phase 1 foundation rather than replacing it.

5. **Particle system for hits/deaths/purchases/pickups** (`high_impact_upgrades.md` #1) — the single highest-payoff item in the whole audit; do this as soon as Phase 1's flash/shake are in, since it's a natural extension of "things react to damage."
6. **Vignette + consistent shadow direction + low-HP core glow** (`high_impact_upgrades.md` #2) — cheap once gradients/shadows already exist from Phase 1; mostly a matter of adding one more draw pass.
7. **Distinct enemy/tower silhouettes per type/level** (`high_impact_upgrades.md` #3) — intentionally sequenced *after* the lighting pass so new shapes are designed with gradients/shadows in mind, not retrofitted twice.

---

## Can wait (Phase 3 — polish pass, whenever there's spare time before a real release)

Valuable, but lower urgency — the game will already look and feel dramatically better before these, and none of them are blocked by anything else.

8. **Environmental detail pass** (`high_impact_upgrades.md` #4 — paths, static decoration, terrain texture) — biggest remaining gap between premise ("village") and visuals, but purely additive and doesn't risk making anything else look worse in the meantime.
9. **Full UI system unification + end-screen animation + hover affordances** (`high_impact_upgrades.md` #5) — worth doing once, but only after the HUD's font/panel/icon basics (Phase 1) are settled, so this isn't redoing already-finished work.
10. **Honorable-mention polish items** from `visual_problems.md` (tower-spot legibility, HP-bar styling, player weapon shape, enemy silhouette differentiation) — small, non-blocking, best mopped up alongside whichever phase happens to be touching that code already.

---

## What NOT to do (out of scope for this audit, and likely not worth it yet)

- Do not introduce a sprite/tilemap art pipeline or external art assets — everything above is achievable in vanilla Canvas 2D and is consistent with the project's current zero-dependency, single-file-per-concern setup (`index.html` / `style.css` / `game.js`).
- Do not redesign the layout, color-coding scheme, or camera/composition — these already work and aren't contributing to the "cheap" impression; effort spent there would come at the expense of the items above, which are the actual source of the problem.
- Do not add sound design as part of this pass — audio was explicitly out of scope for this audit, but note it as a strong candidate for a *separate* pass once the visual work above lands, since juice (Phase 2, item 5) pairs naturally with matching sound effects.

---

## One-line takeaway

**Shadows + gradients + hit feedback + a real HUD panel (Phase 1) will visibly transform the game's perceived quality for roughly 1-2 hours of work — do that pass before anything else on this list.**
