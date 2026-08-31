(function () {
  'use strict';

  // ---------- Constants ----------
  const W = 1280, H = 720;
  const CENTER = { x: W / 2, y: H / 2 };

  const PLAYER_SPEED = 220;
  const PLAYER_RADIUS = 14;
  const STARTING_GOLD = 30;

  const PROJECTILE_SPEED = 500;
  const PROJECTILE_RADIUS = 4;
  const PROJECTILE_LIFE = 2;

  const FORGE_DAMAGE = [10, 14, 18, 24];
  const FORGE_FIRE_RATE = [3, 3.5, 4, 5];
  const FORGE_COST = [20, 40, 70];
  const FORGE_MAX_LEVEL = FORGE_DAMAGE.length - 1;

  const ENEMY_BASE = {
    fast: { hp: 15, speed: 130, damage: 4, attackRate: 1, goldValue: 3, radius: 10, color: '#ff5c5c' },
    strong: { hp: 60, speed: 55, damage: 15, attackRate: 0.7, goldValue: 8, radius: 16, color: '#8e3aa8' }
  };
  const FAST_SPAWN_RATIO = 0.65;

  const BASE_SPAWN_INTERVAL = 3.0;
  const MIN_SPAWN_INTERVAL = 0.6;
  const SPAWN_DECAY_PER_MIN = 0.35;
  const STAT_SCALE_PER_MIN = 0.15;

  const TOWNCORE_MAX_HP = 500;
  const TOWNCORE_RADIUS = 40;
  const REPAIR_AMOUNT = 20;
  const REPAIR_COST = 15;

  const TOWER_BUILD_COST = 25;
  const TOWER_UPGRADE_COST = [30, 55];
  const TOWER_RANGE = [140, 170, 200];
  const TOWER_DAMAGE = [8, 14, 22];
  const TOWER_FIRE_RATE = [1, 1.3, 1.7];
  const TOWER_SPOT_RADIUS_FROM_CENTER = 240;
  const TOWER_SPOT_ANGLES_DEG = [300, 0, 60, 120, 180, 240];
  const TOWER_SPOT_RADIUS = 22;
  const TOWER_MAX_LEVEL = TOWER_RANGE.length;

  const GOLD_PICKUP_RADIUS = 40;
  const WIN_TIME_SECONDS = 600;

  const ENEMY_FLASH_DURATION = 0.08;
  const CORE_FLASH_DURATION = 0.12;
  const SHAKE_DURATION = 0.15;
  const SHAKE_MAGNITUDE = 6;

  // ---------- Utility ----------
  function clamp(v, lo, hi) { return v < lo ? lo : (v > hi ? hi : v); }
  function dist2(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; }
  function lerpArr(a, b, t) {
    return [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];
  }
  function rgbStr(arr) { return `rgb(${arr[0]},${arr[1]},${arr[2]})`; }
  function lerpColor(c1, c2, t) { return rgbStr(lerpArr(c1, c2, t)); }
  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  // ---------- Canvas setup ----------
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function getWorldPos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  // ---------- Game state ----------
  let gameState = 'playing'; // 'playing' | 'won' | 'lost'
  let elapsedTime = 0;
  let spawnTimer = BASE_SPAWN_INTERVAL;
  let coreFlashTimer = 0;
  let shakeTimer = 0;

  const keys = {};
  const mouse = { x: CENTER.x, y: CENTER.y };
  let firing = false;

  const player = {
    x: CENTER.x, y: CENTER.y + 140, angle: -Math.PI / 2,
    speed: PLAYER_SPEED, radius: PLAYER_RADIUS,
    fireCooldown: 0, gold: STARTING_GOLD
  };

  const townCore = { x: CENTER.x, y: CENTER.y, hp: TOWNCORE_MAX_HP, maxHp: TOWNCORE_MAX_HP, radius: TOWNCORE_RADIUS };
  const forge = { x: CENTER.x, y: CENTER.y - 140, level: 0, radius: 26 };

  const towerSpots = TOWER_SPOT_ANGLES_DEG.map(deg => {
    const rad = deg * Math.PI / 180;
    return {
      x: CENTER.x + Math.cos(rad) * TOWER_SPOT_RADIUS_FROM_CENTER,
      y: CENTER.y + Math.sin(rad) * TOWER_SPOT_RADIUS_FROM_CENTER,
      state: 'empty', level: 0, radius: TOWER_SPOT_RADIUS, fireCooldown: 0
    };
  });

  let enemies = [];
  let projectiles = [];
  let goldPickups = [];

  function playerDamage() { return FORGE_DAMAGE[forge.level]; }
  function playerFireRate() { return FORGE_FIRE_RATE[forge.level]; }
  function playerWeaponLevel() { return forge.level + 1; }

  // ---------- Interaction ----------
  function tryInteract(x, y) {
    if (dist2(x, y, forge.x, forge.y) <= forge.radius * forge.radius) {
      upgradeForge();
      return true;
    }
    if (dist2(x, y, townCore.x, townCore.y) <= townCore.radius * townCore.radius) {
      repairCore();
      return true;
    }
    for (const spot of towerSpots) {
      if (dist2(x, y, spot.x, spot.y) <= spot.radius * spot.radius) {
        if (spot.state === 'empty') buildTower(spot);
        else upgradeTower(spot);
        return true;
      }
    }
    return false;
  }

  function buildTower(spot) {
    if (player.gold < TOWER_BUILD_COST) return;
    player.gold -= TOWER_BUILD_COST;
    spot.state = 'built';
    spot.level = 1;
    spot.fireCooldown = 0;
  }

  function upgradeTower(spot) {
    if (spot.level >= TOWER_MAX_LEVEL) return;
    const cost = TOWER_UPGRADE_COST[spot.level - 1];
    if (player.gold < cost) return;
    player.gold -= cost;
    spot.level += 1;
  }

  function repairCore() {
    if (townCore.hp >= townCore.maxHp) return;
    if (player.gold < REPAIR_COST) return;
    player.gold -= REPAIR_COST;
    townCore.hp = Math.min(townCore.maxHp, townCore.hp + REPAIR_AMOUNT);
  }

  function upgradeForge() {
    if (forge.level >= FORGE_MAX_LEVEL) return;
    const cost = FORGE_COST[forge.level];
    if (player.gold < cost) return;
    player.gold -= cost;
    forge.level += 1;
  }

  // ---------- Spawning ----------
  function randomEdgeSpawn() {
    const margin = 30;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) return { x: Math.random() * W, y: -margin };
    if (side === 1) return { x: W + margin, y: Math.random() * H };
    if (side === 2) return { x: Math.random() * W, y: H + margin };
    return { x: -margin, y: Math.random() * H };
  }

  function spawnEnemy() {
    const type = Math.random() < FAST_SPAWN_RATIO ? 'fast' : 'strong';
    const base = ENEMY_BASE[type];
    const elapsedMinutes = elapsedTime / 60;
    const mult = 1 + elapsedMinutes * STAT_SCALE_PER_MIN;
    const pos = randomEdgeSpawn();
    const hp = base.hp * mult;
    enemies.push({
      type, x: pos.x, y: pos.y, angle: 0,
      hp, maxHp: hp,
      speed: base.speed,
      damage: base.damage * mult,
      attackRange: base.radius + townCore.radius + 6,
      attackCooldown: 0, attackRate: base.attackRate,
      radius: base.radius, goldValue: base.goldValue, color: base.color,
      flashTimer: 0
    });
  }

  function spawnProjectile(x, y, tx, ty, damage, owner) {
    const dx = tx - x, dy = ty - y;
    const dist = Math.hypot(dx, dy) || 1;
    projectiles.push({
      x, y, vx: dx / dist * PROJECTILE_SPEED, vy: dy / dist * PROJECTILE_SPEED,
      damage, radius: PROJECTILE_RADIUS, owner, life: PROJECTILE_LIFE
    });
  }

  function findNearestEnemyInRange(x, y, range) {
    let best = null, bestD2 = range * range;
    for (const e of enemies) {
      const d2 = dist2(x, y, e.x, e.y);
      if (d2 <= bestD2) { bestD2 = d2; best = e; }
    }
    return best;
  }

  // ---------- Update ----------
  function update(dt) {
    if (gameState !== 'playing') return;
    elapsedTime += dt;

    // Player movement
    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;
    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      player.x += (dx / len) * player.speed * dt;
      player.y += (dy / len) * player.speed * dt;
      player.x = clamp(player.x, player.radius, W - player.radius);
      player.y = clamp(player.y, player.radius, H - player.radius);
    }
    player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

    // Player shooting
    player.fireCooldown -= dt;
    if (firing && player.fireCooldown <= 0) {
      spawnProjectile(player.x, player.y,
        player.x + Math.cos(player.angle) * 100, player.y + Math.sin(player.angle) * 100,
        playerDamage(), 'player');
      player.fireCooldown = 1 / playerFireRate();
    }

    // Spawning
    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnEnemy();
      const interval = Math.max(MIN_SPAWN_INTERVAL, BASE_SPAWN_INTERVAL - (elapsedTime / 60) * SPAWN_DECAY_PER_MIN);
      spawnTimer = interval;
    }

    // Enemy AI
    for (const e of enemies) {
      if (e.flashTimer > 0) e.flashTimer = Math.max(0, e.flashTimer - dt);
      const ex = townCore.x - e.x, ey = townCore.y - e.y;
      const dist = Math.hypot(ex, ey) || 1;
      e.angle = Math.atan2(ey, ex);
      if (dist > e.attackRange) {
        e.x += (ex / dist) * e.speed * dt;
        e.y += (ey / dist) * e.speed * dt;
      } else {
        e.attackCooldown -= dt;
        if (e.attackCooldown <= 0) {
          townCore.hp -= e.damage;
          e.attackCooldown = 1 / e.attackRate;
          coreFlashTimer = CORE_FLASH_DURATION;
          shakeTimer = SHAKE_DURATION;
        }
      }
    }

    if (coreFlashTimer > 0) coreFlashTimer = Math.max(0, coreFlashTimer - dt);
    if (shakeTimer > 0) shakeTimer = Math.max(0, shakeTimer - dt);

    // Tower auto-fire
    for (const spot of towerSpots) {
      if (spot.state !== 'built') continue;
      spot.fireCooldown -= dt;
      const idx = spot.level - 1;
      const range = TOWER_RANGE[idx], damage = TOWER_DAMAGE[idx], fireRate = TOWER_FIRE_RATE[idx];
      if (spot.fireCooldown <= 0) {
        const target = findNearestEnemyInRange(spot.x, spot.y, range);
        if (target) {
          spawnProjectile(spot.x, spot.y, target.x, target.y, damage, 'tower');
          spot.fireCooldown = 1 / fireRate;
        }
      }
    }

    // Move projectiles
    for (const p of projectiles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0 || p.x < -60 || p.x > W + 60 || p.y < -60 || p.y > H + 60) p._dead = true;
    }

    // Projectile vs enemy collisions
    for (const p of projectiles) {
      if (p._dead) continue;
      for (const e of enemies) {
        if (e._dead) continue;
        if (dist2(p.x, p.y, e.x, e.y) <= (p.radius + e.radius) * (p.radius + e.radius)) {
          e.hp -= p.damage;
          e.flashTimer = ENEMY_FLASH_DURATION;
          p._dead = true;
          if (e.hp <= 0) {
            e._dead = true;
            goldPickups.push({ x: e.x, y: e.y, value: e.goldValue, radius: 8 });
          }
          break;
        }
      }
    }
    projectiles = projectiles.filter(p => !p._dead);
    enemies = enemies.filter(e => !e._dead);

    // Gold pickup
    for (const g of goldPickups) {
      if (dist2(player.x, player.y, g.x, g.y) <= GOLD_PICKUP_RADIUS * GOLD_PICKUP_RADIUS) {
        player.gold += g.value;
        g._dead = true;
      }
    }
    goldPickups = goldPickups.filter(g => !g._dead);

    townCore.hp = Math.max(0, townCore.hp);

    // Win / lose
    if (townCore.hp <= 0) {
      gameState = 'lost';
      showEnd(false);
      return;
    }
    if (elapsedTime >= WIN_TIME_SECONDS) {
      gameState = 'won';
      showEnd(true);
      return;
    }
  }

  // ---------- Rendering ----------
  function drawTriangle(x, y, angle, size, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.6);
    ctx.lineTo(-size * 0.7, -size * 0.6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawMiniBar(x, y, w, h, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x - w / 2, y, w * clamp(frac, 0, 1), h);
  }

  function drawGroundShadow(x, y, r) {
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.55, r * 0.95, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
  }

  function radialFill(x, y, r, lightArr, darkArr) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, Math.max(r * 0.05, 0.1), x, y, r);
    g.addColorStop(0, rgbStr(lightArr));
    g.addColorStop(1, rgbStr(darkArr));
    return g;
  }

  const FORGE_RGB = hexToRgb('#d9762e');
  const TOWER_RGB = hexToRgb('#4c6ea8');

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (shakeTimer > 0) {
      const mag = SHAKE_MAGNITUDE * (shakeTimer / SHAKE_DURATION);
      ctx.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
    }

    // Background
    ctx.fillStyle = '#16211a';
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, 300, 0, Math.PI * 2);
    ctx.fillStyle = '#2c4331';
    ctx.fill();

    // Town core
    const hpFrac = townCore.hp / townCore.maxHp;
    let coreBase = lerpArr([180, 40, 40], [90, 200, 100], hpFrac);
    if (coreFlashTimer > 0) coreBase = lerpArr(coreBase, [255, 255, 255], coreFlashTimer / CORE_FLASH_DURATION);
    drawGroundShadow(townCore.x, townCore.y, townCore.radius);
    ctx.beginPath();
    ctx.arc(townCore.x, townCore.y, townCore.radius, 0, Math.PI * 2);
    ctx.fillStyle = radialFill(townCore.x, townCore.y, townCore.radius,
      lerpArr(coreBase, [255, 255, 255], 0.5), lerpArr(coreBase, [0, 0, 0], 0.2));
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#f0e6c0';
    ctx.stroke();
    drawMiniBar(townCore.x, townCore.y - townCore.radius - 16, 70, 8, hpFrac, '#4caf50');

    // Forge
    drawGroundShadow(forge.x, forge.y, forge.radius);
    ctx.save();
    ctx.translate(forge.x, forge.y);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = radialFill(0, 0, forge.radius * 1.1,
      lerpArr(FORGE_RGB, [255, 255, 255], 0.45), lerpArr(FORGE_RGB, [0, 0, 0], 0.25));
    ctx.fillRect(-forge.radius * 0.7, -forge.radius * 0.7, forge.radius * 1.4, forge.radius * 1.4);
    ctx.restore();
    ctx.strokeStyle = '#fff2';
    for (let i = 0; i < FORGE_MAX_LEVEL; i++) {
      ctx.beginPath();
      ctx.arc(forge.x - 12 + i * 12, forge.y + forge.radius + 10, 3, 0, Math.PI * 2);
      ctx.fillStyle = i < forge.level ? '#ffd54a' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    }

    // Tower spots
    for (const spot of towerSpots) {
      if (spot.state === 'empty') {
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, spot.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('+', spot.x, spot.y + 5);
      } else {
        const r = spot.radius * (0.8 + spot.level * 0.15);
        drawGroundShadow(spot.x, spot.y, r);
        ctx.beginPath();
        ctx.arc(spot.x, spot.y, r, 0, Math.PI * 2);
        ctx.fillStyle = radialFill(spot.x, spot.y, r,
          lerpArr(TOWER_RGB, [255, 255, 255], 0.4), lerpArr(TOWER_RGB, [0, 0, 0], 0.25));
        ctx.fill();
        ctx.strokeStyle = '#cfe0ff';
        ctx.lineWidth = 2;
        ctx.stroke();
        for (let i = 0; i < TOWER_MAX_LEVEL; i++) {
          ctx.beginPath();
          ctx.arc(spot.x - 10 + i * 10, spot.y + r + 8, 3, 0, Math.PI * 2);
          ctx.fillStyle = i < spot.level ? '#a8d0ff' : 'rgba(255,255,255,0.25)';
          ctx.fill();
        }
      }
    }

    // Gold pickups
    const pulse = Math.sin(performance.now() / 150) * 1.5;
    for (const g of goldPickups) {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius + pulse, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd54a';
      ctx.fill();
      ctx.strokeStyle = '#a87c1a';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Enemies
    for (const e of enemies) {
      drawGroundShadow(e.x, e.y, e.radius);
      const color = e.flashTimer > 0 ? '#ffffff' : e.color;
      drawTriangle(e.x, e.y, e.angle, e.radius, color);
      if (e.hp < e.maxHp) {
        drawMiniBar(e.x, e.y - e.radius - 10, e.radius * 2, 4, e.hp / e.maxHp, '#ff5c5c');
      }
    }

    // Projectiles
    for (const p of projectiles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.owner === 'player' ? '#fff36b' : '#6bdcff';
      ctx.fill();
    }

    // Player
    drawGroundShadow(player.x, player.y, player.radius);
    drawTriangle(player.x, player.y, player.angle, player.radius, '#e8f0ff');
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = radialFill(player.x, player.y, player.radius * 0.5,
      lerpArr(TOWER_RGB, [255, 255, 255], 0.35), lerpArr(TOWER_RGB, [0, 0, 0], 0.2));
    ctx.fill();

    ctx.restore();
  }

  // ---------- HUD ----------
  const hpFillEl = document.getElementById('hp-bar-fill');
  const hpTextEl = document.getElementById('hp-text');
  const goldTextEl = document.getElementById('gold-text');
  const timerTextEl = document.getElementById('timer-text');
  const weaponTextEl = document.getElementById('weapon-text');
  const hintEl = document.getElementById('hint-overlay');
  const endOverlayEl = document.getElementById('end-overlay');
  const endTitleEl = document.getElementById('end-title');
  const endSubtitleEl = document.getElementById('end-subtitle');

  function updateHUD() {
    const frac = clamp(townCore.hp / townCore.maxHp, 0, 1);
    hpFillEl.style.width = (frac * 100) + '%';
    hpFillEl.style.backgroundColor = lerpColor([200, 60, 60], [76, 175, 80], frac);
    hpTextEl.textContent = `${Math.ceil(townCore.hp)} / ${townCore.maxHp}`;
    goldTextEl.textContent = `Gold: ${player.gold}`;
    const remaining = Math.max(0, WIN_TIME_SECONDS - elapsedTime);
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);
    timerTextEl.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    weaponTextEl.textContent = `Weapon Lv ${playerWeaponLevel()}`;
  }

  let hintDismissed = false;
  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    hintEl.classList.add('hidden');
  }
  setTimeout(dismissHint, 7000);

  function showEnd(won) {
    endTitleEl.textContent = won ? 'Victory!' : 'Defeat';
    endSubtitleEl.textContent = won
      ? 'You defended the village for 10 minutes.'
      : 'The town core has fallen.';
    endOverlayEl.classList.remove('hidden');
  }

  document.getElementById('reload-btn').addEventListener('click', () => location.reload());

  // ---------- Input ----------
  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    dismissHint();
  });
  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener('mousemove', e => {
    const pos = getWorldPos(e.clientX, e.clientY);
    mouse.x = pos.x;
    mouse.y = pos.y;
  });

  canvas.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const pos = getWorldPos(e.clientX, e.clientY);
    mouse.x = pos.x;
    mouse.y = pos.y;
    dismissHint();
    if (!tryInteract(pos.x, pos.y)) {
      firing = true;
    }
  });

  window.addEventListener('mouseup', e => {
    if (e.button !== 0) return;
    firing = false;
  });

  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- Main loop ----------
  let lastTime = null;
  function frame(ts) {
    if (lastTime === null) lastTime = ts;
    let dt = (ts - lastTime) / 1000;
    lastTime = ts;
    dt = Math.min(dt, 0.05);

    update(dt);
    render();
    updateHUD();

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
