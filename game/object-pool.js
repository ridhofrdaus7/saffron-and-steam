// Pre-allocated object pools for particles and floating score popups.
// Eliminates per-frame heap allocations inside the simulation update loop.

const MAX_PARTICLES = 120;
const MAX_FLOATERS = 24;

export class ParticlePool {
  constructor() {
    this.items = Array.from({ length: MAX_PARTICLES }, () => ({
      active: false,
      kind: 'spark',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 4,
      life: 0,
      maxLife: 1,
      color: '#ffd166',
    }));
  }

  spawn(kind, x, y, vx, vy, size, life, color) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.items[i];
      if (!p.active) {
        p.active = true;
        p.kind = kind;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.size = size;
        p.life = life;
        p.maxLife = life;
        p.color = color;
        return p;
      }
    }
    return null;
  }

  emitBurst(kind, x, y, count, color, speed = 90) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (i % 2) * 0.25;
      const mag = speed * (0.55 + ((i * 37) % 10) / 20);
      this.spawn(
        kind,
        x,
        y,
        Math.cos(angle) * mag,
        Math.sin(angle) * mag - 35,
        kind === 'steam' ? 8 : 4,
        kind === 'steam' ? 0.9 : 0.55,
        color
      );
    }
  }

  update(dt) {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = this.items[i];
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.kind === 'steam') {
        p.vx *= Math.max(0, 1 - 1.5 * dt);
        p.vy -= 18 * dt;
      } else {
        p.vy += 220 * dt;
      }
    }
  }

  clear() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.items[i].active = false;
    }
  }
}

export class FloatingTextPool {
  constructor() {
    this.items = Array.from({ length: MAX_FLOATERS }, () => ({
      active: false,
      text: '',
      x: 0,
      y: 0,
      vy: -42,
      life: 0,
      maxLife: 1.2,
      color: '#fff4d2',
    }));
  }

  spawn(text, x, y, color = '#fff4d2', life = 1.25) {
    for (let i = 0; i < MAX_FLOATERS; i++) {
      const f = this.items[i];
      if (!f.active) {
        f.active = true;
        f.text = text;
        f.x = x;
        f.y = y;
        f.vy = -44;
        f.life = life;
        f.maxLife = life;
        f.color = color;
        return f;
      }
    }
    return null;
  }

  update(dt) {
    for (let i = 0; i < MAX_FLOATERS; i++) {
      const f = this.items[i];
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) {
        f.active = false;
        continue;
      }
      f.y += f.vy * dt;
    }
  }

  clear() {
    for (let i = 0; i < MAX_FLOATERS; i++) {
      this.items[i].active = false;
    }
  }
}
