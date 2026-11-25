// Layered HTML5 Canvas renderer for Ember & Ladle.
// Caches the static bistro architecture on an offscreen buffer and draws dynamic cookware,
// food assembly, chef animation, pooled particles, and floating score popups at 60 FPS.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CHOPS_REQUIRED,
  INGREDIENTS,
  ItemStage,
  PAN_BURN_TIME_SEC,
  PAN_PERFECT_WINDOW_SEC,
  POT_BURN_TIME_SEC,
  findMatchingRecipe,
} from './config.js';

function roundRect(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1.5) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function oval(ctx, x, y, rx, ry, fill, stroke = null, lineWidth = 1.5) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

function drawLine(ctx, x1, y1, x2, y2, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

function dropShadow(ctx, x, y, rx, ry) {
  oval(ctx, x, y, rx, ry, 'rgba(18, 28, 22, 0.28)');
}

function drawTextLabel(ctx, text, x, y, font = 'bold 11px Georgia, serif', color = '#e9dfc4') {
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

export function drawIngredientArt(ctx, item, x, y, scale = 1, stage = ItemStage.RAW) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const isChopped = stage === ItemStage.CHOPPED;
  const isCooked = stage === ItemStage.SEARED || stage === ItemStage.PERFECT || stage === ItemStage.SIMMERED;
  const isPerfect = stage === ItemStage.PERFECT;

  if (isChopped || (isCooked && item !== 'shrimp' && item !== 'noodles')) {
    const pieces = item === 'tomato' ? 6 : 7;
    for (let i = 0; i < pieces; i++) {
      const px = Math.sin(i * 2.15) * 18;
      const py = Math.cos(i * 2.15) * 9;
      if (item === 'tomato') {
        oval(ctx, px, py, 8, 6, isCooked ? '#b53b28' : '#df4f3a');
        oval(ctx, px - 1, py - 1.5, 5, 3, isCooked ? '#df754c' : '#ff8c6b');
        if (isCooked) oval(ctx, px + 2, py + 1, 2.5, 1.5, '#3b1c15');
      } else if (item === 'mushroom') {
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate((i - 3) * 0.45);
        roundRect(ctx, -3, -1, 6, 9, 2, isCooked ? '#b89463' : '#e4cfb0');
        oval(ctx, 0, -2, 10, 5, isCooked ? '#755031' : '#9c744f');
        oval(ctx, -2, -3, 6, 2.5, isCooked ? '#d0a36f' : '#c7a477');
        ctx.restore();
      } else if (item === 'shrimp') {
        oval(ctx, px, py, 9, 5.5, '#ef8056');
        oval(ctx, px - 1, py - 1, 5, 3, '#ffc2a0');
      }
    }
    if (isPerfect) {
      oval(ctx, -14, -10, 2.5, 2.5, '#ffe57f');
      oval(ctx, 15, -6, 2, 2, '#ffe57f');
    }
    ctx.restore();
    return;
  }

  if (item === 'tomato') {
    dropShadow(ctx, 0, 12, 21, 7);
    oval(ctx, -5, 1, 16, 15, '#c63d2b');
    oval(ctx, 6, 0, 16, 15, '#e2533c');
    oval(ctx, 3, -5, 10, 8, '#f57c5e');
    oval(ctx, 8, -8, 3.5, 5, 'rgba(255, 232, 215, 0.55)');
    ctx.fillStyle = '#477643';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const r = i % 2 ? 4 : 12;
      const vx = Math.cos(a) * r;
      const vy = -12 + Math.sin(a) * r * 0.45;
      if (i === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();
    drawLine(ctx, 0, -13, 3, -21, '#396136', 3);
  } else if (item === 'mushroom') {
    dropShadow(ctx, 0, 14, 22, 6);
    roundRect(ctx, -6, -1, 12, 19, 5, '#e8d7b9');
    oval(ctx, 0, -2, 25, 12, '#6d4e34');
    ctx.beginPath();
    ctx.arc(0, -3, 25, Math.PI, 0);
    ctx.fillStyle = '#9e764e';
    ctx.fill();
    oval(ctx, -6, -12, 13, 6, '#bd976b');
    for (let i = 0; i < 4; i++) {
      oval(ctx, -14 + i * 9, -7 + (i % 2) * 3, 2.2, 1.5, '#7c593c');
    }
  } else if (item === 'shrimp') {
    dropShadow(ctx, 0, 12, 22, 6);
    ctx.lineCap = 'round';
    ctx.strokeStyle = isCooked ? '#e0623c' : '#e68466';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.arc(1, 0, 15, 0.4, Math.PI * 1.78);
    ctx.stroke();
    ctx.strokeStyle = isCooked ? '#ffb88a' : '#f7ba9c';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(1, -2, 14, 0.5, Math.PI * 1.65);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = 0.7 + i * 0.7;
      drawLine(
        ctx,
        1 + Math.cos(a) * 10,
        -2 + Math.sin(a) * 10,
        1 + Math.cos(a) * 19,
        -2 + Math.sin(a) * 19,
        '#c85838',
        2
      );
    }
    ctx.fillStyle = isCooked ? '#d85535' : '#da7355';
    ctx.beginPath();
    ctx.moveTo(13, -14);
    ctx.lineTo(28, -18);
    ctx.lineTo(23, -8);
    ctx.closePath();
    ctx.fill();
  } else if (item === 'noodles') {
    dropShadow(ctx, 0, 12, 24, 7);
    oval(ctx, 0, 2, 23, 13, '#d9a438');
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 1, 19 - i * 2.5, 10 - i * 1.2, (i % 2 ? 0.2 : -0.2), 0, Math.PI * 2);
      ctx.strokeStyle = i % 2 ? '#fbe08c' : '#efc358';
      ctx.lineWidth = 2.6;
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawHerbSprig(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  drawLine(ctx, 0, 11, 0, -11, '#3d7442', 2);
  for (let i = 0; i < 3; i++) {
    oval(ctx, -5, -7 + i * 6.5, 5.5, 3, '#62a866');
    oval(ctx, 5, -10 + i * 6.5, 5.5, 3, '#448c4d');
  }
  ctx.restore();
}

function drawPlatedDish(ctx, x, y, plate, selected) {
  dropShadow(ctx, x, y + 22, 62, 16);
  if (selected) {
    oval(ctx, x, y + 6, 67, 38, 'rgba(244, 192, 86, 0.32)', '#f5c258', 2.5);
  }
  oval(ctx, x, y + 9, 60, 34, '#b8b29b');
  oval(ctx, x, y + 3, 60, 34, '#fcf8eb', '#d8cfba', 1.5);
  oval(ctx, x, y + 1, 47, 25, '#efe7d0');

  const hasTomatoSimmer = plate.components.some(
    (c) => c.item === 'tomato' && c.stage === ItemStage.SIMMERED
  );
  const hasNoodles = plate.components.some((c) => c.item === 'noodles');

  if (hasTomatoSimmer) {
    oval(ctx, x, y + 1, 43, 22, '#c84a31');
    oval(ctx, x - 6, y - 3, 26, 11, '#df6245');
  } else if (hasNoodles) {
    oval(ctx, x, y + 1, 43, 22, '#b88339');
  }

  if (hasNoodles) {
    drawIngredientArt(ctx, 'noodles', x, y - 1, 1.35, ItemStage.SIMMERED);
  }

  const toppings = plate.components.filter((c) => c.item !== 'noodles' && !(c.item === 'tomato' && c.stage === ItemStage.SIMMERED));
  toppings.forEach((comp, idx) => {
    const offsetX = toppings.length > 1 ? (idx === 0 ? -18 : 18) : 0;
    const offsetY = toppings.length > 1 ? (idx === 0 ? -4 : 3) : -3;
    drawIngredientArt(ctx, comp.item, x + offsetX, y + offsetY, 0.78, comp.stage);
  });

  if (plate.herbs) {
    for (let i = 0; i < 5; i++) {
      drawHerbSprig(ctx, x - 24 + i * 12, y - 6 + Math.sin(i * 1.9) * 7, 0.45);
    }
    oval(ctx, x - 14, y + 5, 3, 2, '#d84f2a');
    oval(ctx, x + 16, y + 4, 2.5, 2, '#d84f2a');
  }
}

function drawCounterBlock(ctx, x, y, w, h) {
  roundRect(ctx, x + 3, y + 12, w, h, 8, 'rgba(14, 22, 18, 0.25)');
  roundRect(ctx, x, y + 7, w, h, 7, '#8d6034');
  roundRect(ctx, x, y, w, h - 14, 7, '#d8ae74', '#9e703f', 1.5);
  drawLine(ctx, x + 8, y + 5, x + w - 8, y + 5, '#f0d2a2', 2);
  for (let row = 0; row < 3; row++) {
    drawLine(ctx, x + 12, y + 22 + row * 19, x + w - 12, y + 22 + row * 19, 'rgba(130, 86, 40, 0.22)', 1.5);
  }
}

function drawPottedPlant(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  dropShadow(ctx, 0, 28, 22, 7);
  roundRect(ctx, -16, 0, 32, 28, [4, 4, 11, 11], '#b86e43');
  oval(ctx, 0, 0, 16, 6, '#7a4b2c');
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI + (i * Math.PI) / 6;
    const lx = Math.cos(a) * 22;
    const ly = Math.sin(a) * 30 - 6;
    drawLine(ctx, 0, 2, lx, ly, '#3b663f', 2);
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(a + 0.5);
    oval(ctx, 0, 0, 7, 15, i % 2 ? '#598d59' : '#335d42');
    ctx.restore();
  }
  ctx.restore();
}

function drawStaticBackdrop(ctx) {
  // Warm slate-sage bistro floor & tile backsplash
  ctx.fillStyle = '#233b33';
  ctx.fillRect(0, 0, CANVAS_WIDTH, 132);

  for (let y = 0; y < 128; y += 26) {
    for (let x = 0; x < CANVAS_WIDTH; x += 56) {
      const shade = (x / 56 + y / 26) % 3 === 0 ? '#2b473e' : '#315046';
      roundRect(ctx, x + 2, y + 2, 52, 22, 3, shade, '#1c312a', 1);
      drawLine(ctx, x + 5, y + 4, x + 49, y + 4, 'rgba(255,244,214,0.08)', 1);
    }
  }

  // Checkerboard terracotta/cream bistro floor
  ctx.fillStyle = '#d8cbb0';
  ctx.fillRect(0, 232, CANVAS_WIDTH, CANVAS_HEIGHT - 232);
  for (let y = 232; y < CANVAS_HEIGHT; y += 44) {
    for (let x = -40; x < CANVAS_WIDTH + 40; x += 68) {
      const xx = x + (Math.floor(y / 44) % 2) * 34;
      const alt = (Math.floor((x + 40) / 68) + Math.floor(y / 44)) % 2 === 0;
      ctx.fillStyle = alt ? '#e3d6bc' : '#cbbba0';
      ctx.fillRect(xx + 1, y + 1, 66, 42);
    }
  }

  // Warm ambient overhead pendant glow
  const glow = ctx.createRadialGradient(640, 90, 30, 640, 230, 620);
  glow.addColorStop(0, 'rgba(255, 214, 138, 0.22)');
  glow.addColorStop(1, 'rgba(255, 214, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Arched bistro window on the left
  roundRect(ctx, 28, 34, 128, 178, 12, '#1c3029', '#496a59', 2);
  const sky = ctx.createLinearGradient(0, 42, 0, 204);
  sky.addColorStop(0, '#f3c683');
  sky.addColorStop(0.55, '#e8966d');
  sky.addColorStop(1, '#637d75');
  roundRect(ctx, 36, 42, 112, 162, 8, sky);
  oval(ctx, 64, 152, 34, 38, 'rgba(40, 68, 53, 0.55)');
  oval(ctx, 114, 158, 30, 34, 'rgba(34, 58, 46, 0.55)');
  drawLine(ctx, 92, 42, 92, 204, '#243c32', 5);
  drawLine(ctx, 36, 118, 148, 118, '#243c32', 5);
  roundRect(ctx, 22, 210, 140, 11, 3, '#b88851');
  drawPottedPlant(ctx, 92, 188, 0.65);

  // Brass copper shelf & hanging utensils
  roundRect(ctx, 182, 46, 1054, 10, 3, '#c99352');
  roundRect(ctx, 186, 56, 1046, 5, 2, 'rgba(10, 18, 14, 0.35)');
  for (let i = 0; i < 5; i++) {
    roundRect(ctx, 206 + i * 32, 19, 22, 27, 4, i % 2 ? '#e5d4ad' : '#f1e4c6');
    roundRect(ctx, 205 + i * 32, 15, 24, 5, 2, '#7d5634');
    roundRect(ctx, 210 + i * 32, 28, 14, 9, 1, '#c66f4b');
  }
  roundRect(ctx, 495, 16, 260, 26, 6, '#1a2d26', '#c69a55', 1.5);
  drawTextLabel(ctx, 'EMBER & LADLE · OPEN FIRE BISTRO', 625, 33, 'bold 11px Georgia, serif', '#f4d99b');

  // Hanging copper pans & ladles
  for (let i = 0; i < 4; i++) {
    const ux = 825 + i * 38;
    drawLine(ctx, ux, 58, ux, 88, '#d9a45b', 3);
    if (i === 0) oval(ctx, ux, 97, 9, 11, '#c97b42', '#e7b17b', 1.5);
    else if (i === 1) roundRect(ctx, ux - 7, 86, 14, 18, 3, '#d6b479');
    else oval(ctx, ux, 95, 7, 12, '#d8c59b');
  }
  drawPottedPlant(ctx, 1196, 24, 0.62);

  // Rear cooking & plating bench
  drawCounterBlock(ctx, 174, 118, 1066, 112);
  ctx.fillStyle = '#254237';
  ctx.fillRect(180, 214, 1054, 34);
  for (let cx = 190; cx < 1210; cx += 130) {
    roundRect(ctx, cx, 220, 116, 22, 3, '#2f5245', '#1d362d', 1);
    drawLine(ctx, cx + 44, 227, cx + 72, 227, '#d4af68', 3);
  }

  // Chopping board base
  roundRect(ctx, 193, 134, 114, 68, 9, '#7a4b29');
  roundRect(ctx, 190, 129, 114, 68, 9, '#b87d4b', '#8d5a32', 1.5);
  for (let g = 0; g < 6; g++) {
    drawLine(ctx, 200, 138 + g * 9, 292, 138 + g * 9, 'rgba(232, 194, 145, 0.25)', 1.5);
  }
  oval(ctx, 200, 163, 3.5, 7, '#6b4122');

  // Gas range bed for two skillets & one broth pot
  roundRect(ctx, 360, 126, 505, 82, 8, '#23322c', '#141f1b', 2);
  for (const bx of [445, 615, 785]) {
    oval(ctx, bx, 166, 62, 31, '#16211d');
    for (let g = 0; g < 4; g++) {
      const ang = (g * Math.PI) / 2 + Math.PI / 4;
      drawLine(
        ctx,
        bx + Math.cos(ang) * 28,
        166 + Math.sin(ang) * 16,
        bx + Math.cos(ang) * 58,
        166 + Math.sin(ang) * 30,
        '#69776a',
        4
      );
    }
  }
  for (let k = 0; k < 6; k++) {
    oval(ctx, 395 + k * 84, 200, 7, 4.5, '#d6af64');
    drawLine(ctx, 395 + k * 84, 195, 395 + k * 84, 200, '#5a4932', 2);
  }

  // Olive oil & chili oil cruets between stove and plates
  roundRect(ctx, 885, 142, 14, 42, 4, '#9ea845');
  roundRect(ctx, 888, 131, 8, 13, 2, '#495a3c');
  roundRect(ctx, 904, 147, 13, 37, 4, '#c75133');
  roundRect(ctx, 907, 137, 7, 11, 2, '#624833');

  // Zone headers above rear bench
  drawTextLabel(ctx, 'PREP', 248, 108, 'bold 9px Arial, sans-serif', '#d7caa8');
  drawTextLabel(ctx, 'SEAR & SIMMER', 615, 108, 'bold 9px Arial, sans-serif', '#d7caa8');
  drawTextLabel(ctx, 'PLATING STATION', 1065, 108, 'bold 9px Arial, sans-serif', '#d7caa8');

  // Front Pantry & Service Pass counter
  drawCounterBlock(ctx, 198, 366, 1044, 116);
  roundRect(ctx, 204, 464, 1032, 26, 3, '#254237');

  // 4 Pantry Trays
  for (const px of [270, 405, 540, 675]) {
    roundRect(ctx, px - 56, 375, 112, 56, 7, '#705837');
    roundRect(ctx, px - 52, 378, 104, 49, 5, px === 540 ? '#c4d8dc' : '#b8a97e');
  }
  drawIngredientArt(ctx, 'tomato', 248, 398, 0.72);
  drawIngredientArt(ctx, 'tomato', 288, 405, 0.8);
  drawIngredientArt(ctx, 'tomato', 272, 386, 0.68);

  drawIngredientArt(ctx, 'mushroom', 383, 404, 0.76);
  drawIngredientArt(ctx, 'mushroom', 421, 396, 0.78);
  drawIngredientArt(ctx, 'mushroom', 405, 412, 0.65);

  for (let s = 0; s < 4; s++) {
    drawIngredientArt(ctx, 'shrimp', 514 + (s % 2) * 44, 392 + Math.floor(s / 2) * 20, 0.6);
  }
  drawIngredientArt(ctx, 'noodles', 653, 398, 0.88);
  drawIngredientArt(ctx, 'noodles', 693, 404, 0.84);

  // Herb garnish tray
  roundRect(ctx, 766, 376, 128, 55, 7, '#d9d3b6', '#9b9474', 1.5);
  for (let h = 0; h < 8; h++) {
    drawHerbSprig(ctx, 782 + (h % 4) * 30, 390 + Math.floor(h / 4) * 22, 0.72);
  }

  // Service Pass & Brass Bell
  roundRect(ctx, 926, 374, 300, 58, 8, '#f5ecd4', '#b89f6d', 2);
  drawLine(ctx, 945, 404, 1205, 404, '#c7b892', 1.5);
  drawTextLabel(ctx, 'THE PASS · SERVE HERE', 1068, 396, 'bold 11px Georgia, serif', '#695335');
  drawTextLabel(ctx, 'Hot plates first · Freshness earns tips', 1068, 420, '10px Arial, sans-serif', '#8a7a5c');

  // Brass Bell
  oval(ctx, 1202, 396, 17, 7.5, '#7e5a2c');
  ctx.fillStyle = '#dba84c';
  ctx.beginPath();
  ctx.arc(1202, 393, 13.5, Math.PI, 0);
  ctx.fill();
  oval(ctx, 1202, 379, 4, 3, '#f6da8d');

  // Chef's Rug & Rice/Flour Sack on left
  roundRect(ctx, 32, 378, 96, 68, 14, '#c9b385');
  roundRect(ctx, 40, 372, 80, 12, 5, '#decba0');
  drawTextLabel(ctx, 'ARTISAN', 80, 406, 'bold 10px Arial, sans-serif', '#6d613e');
  drawTextLabel(ctx, 'FLOUR', 80, 422, 'bold 12px Georgia, serif', '#6d613e');
  roundRect(ctx, 46, 266, 114, 62, 10, '#784839');
  for (let r = 0; r < 6; r++) {
    drawLine(ctx, 54, 275 + r * 8, 152, 275 + r * 8, '#a66953', 2);
  }
}

export class KitchenRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.backdrop = null;
  }

  _ensureBackdrop() {
    if (this.backdrop || typeof document === 'undefined') return;
    this.backdrop = document.createElement('canvas');
    this.backdrop.width = CANVAS_WIDTH;
    this.backdrop.height = CANVAS_HEIGHT;
    drawStaticBackdrop(this.backdrop.getContext('2d'));
  }

  _drawBurnerAndPan(ctx, pan, x, t) {
    if (pan) {
      const need = INGREDIENTS[pan.item].searTime;
      const ready = pan.time >= need;
      const inPerfect = ready && pan.time <= need + PAN_PERFECT_WINDOW_SEC;
      const danger = ready && pan.time > need + PAN_PERFECT_WINDOW_SEC;
      const flameColor = pan.burnt
        ? '#55443d'
        : inPerfect
        ? '#ffd166'
        : danger
        ? '#ff6b4a'
        : '#eb9338';
      oval(ctx, x, 170, 52, 26, flameColor);
      for (let i = 0; i < 8; i++) {
        const a = i * 0.78 + t * 2.8;
        oval(
          ctx,
          x + Math.cos(a) * 43,
          172 + Math.sin(a) * 20,
          3.2,
          2.2,
          inPerfect ? '#fff2aa' : '#ffbf59'
        );
      }
    }

    // Copper-rimmed skillet
    roundRect(ctx, x + 36, 159, 48, 9, 4, '#24302a');
    roundRect(ctx, x + 62, 159, 24, 9, 4, '#b87643');
    oval(ctx, x, 160, 49, 26, '#c67d46');
    oval(ctx, x, 158, 45, 23, '#222b28');
    oval(ctx, x, 157, 39, 19, '#394540');

    if (!pan) return;

    const need = INGREDIENTS[pan.item].searTime;
    const ready = pan.time >= need;
    const inPerfect = ready && pan.time <= need + PAN_PERFECT_WINDOW_SEC;
    const danger = ready && pan.time > need + PAN_PERFECT_WINDOW_SEC;

    drawIngredientArt(
      ctx,
      pan.item,
      x,
      154,
      0.86,
      inPerfect ? ItemStage.PERFECT : ready ? ItemStage.SEARED : ItemStage.CHOPPED
    );

    if (pan.burnt) {
      oval(ctx, x, 156, 33, 15, 'rgba(38, 28, 24, 0.85)');
      drawTextLabel(ctx, 'SCORCHED!', x, 134, 'bold 10px Arial, sans-serif', '#ff8c73');
    } else if (inPerfect) {
      oval(ctx, x, 158, 52, 28, null, '#ffd166', 2.5);
      drawTextLabel(
        ctx,
        `PERFECT · ${Math.max(0, Math.ceil(need + PAN_PERFECT_WINDOW_SEC - pan.time))}s`,
        x,
        134,
        'bold 10px Arial, sans-serif',
        '#ffe58f'
      );
    } else if (danger) {
      const left = Math.max(0, Math.ceil(need + PAN_BURN_TIME_SEC - pan.time));
      drawTextLabel(ctx, `LIFT NOW! ${left}s`, x, 134, 'bold 10px Arial, sans-serif', '#ff9e7d');
    }

    // Cook + perfect window progress bar
    const totalWindow = need + PAN_BURN_TIME_SEC;
    const ratio = Math.min(1, pan.time / need);
    const barW = 88;
    const bx = x - barW / 2;
    roundRect(ctx, bx, 189, barW, 7, 3.5, '#192621');
    if (pan.burnt) {
      roundRect(ctx, bx, 189, barW, 7, 3.5, '#c24f3c');
    } else if (ready) {
      const burnProgress = Math.min(1, (pan.time - need) / PAN_BURN_TIME_SEC);
      roundRect(ctx, bx, 189, barW, 7, 3.5, inPerfect ? '#ffd166' : '#f0714d');
      roundRect(ctx, bx + barW * burnProgress, 189, barW * (1 - burnProgress), 7, 3.5, inPerfect ? '#f4b942' : '#d65a3c');
    } else {
      roundRect(ctx, bx, 189, barW * ratio, 7, 3.5, '#72c27e');
    }
    void totalWindow;
  }

  _drawBrothPot(ctx, pot, x, t) {
    if (pot) {
      oval(ctx, x, 170, 52, 26, pot.burnt ? '#55443d' : '#53b8a2');
    }

    // Copper Stockpot
    oval(ctx, x - 44, 154, 8, 5, '#b87643');
    oval(ctx, x + 44, 154, 8, 5, '#b87643');
    roundRect(ctx, x - 38, 138, 76, 36, [6, 6, 14, 14], '#b96f3c', '#854c24', 1.5);
    oval(ctx, x, 138, 38, 16, '#d89359');
    oval(ctx, x, 138, 33, 13, pot ? (pot.item === 'tomato' ? '#b8422b' : '#b7894a') : '#465e54');

    if (!pot) return;

    const need = INGREDIENTS[pot.item].simmerTime;
    const ready = pot.time >= need;
    // Simmering bubbles
    for (let b = 0; b < 5; b++) {
      const bx = x - 18 + ((b * 11 + Math.floor(t * 6)) % 36);
      const by = 135 + Math.sin(t * 5 + b) * 4;
      oval(ctx, bx, by, 3, 2, 'rgba(255, 248, 224, 0.7)');
    }
    if (pot.item === 'noodles') {
      drawIngredientArt(ctx, 'noodles', x, 138, 0.72, ItemStage.SIMMERED);
    } else {
      drawIngredientArt(ctx, pot.item, x, 138, 0.65, ItemStage.SIMMERED);
    }

    if (pot.burnt) {
      oval(ctx, x, 138, 32, 12, 'rgba(32, 24, 22, 0.85)');
      drawTextLabel(ctx, 'BOILED DRY!', x, 122, 'bold 10px Arial, sans-serif', '#ff8c73');
    } else if (ready) {
      const left = Math.max(0, Math.ceil(need + POT_BURN_TIME_SEC - pot.time));
      oval(ctx, x, 138, 41, 18, null, '#8ce6c0', 2);
      drawTextLabel(ctx, `SIMMERED · ${left}s`, x, 121, 'bold 10px Arial, sans-serif', '#a8f2d4');
    }

    const barW = 84;
    const bx = x - barW / 2;
    roundRect(ctx, bx, 189, barW, 7, 3.5, '#192621');
    roundRect(
      ctx,
      bx,
      189,
      barW * Math.min(1, pot.time / need),
      7,
      3.5,
      pot.burnt ? '#c24f3c' : ready ? '#7ee0b8' : '#e6b856'
    );
  }

  _drawChef(ctx, sim, t) {
    const c = sim.chef;
    const moving = Math.hypot(c.x - c.tx, c.y - c.ty) > 2;
    const bob = moving ? Math.sin(t * 20) * 3 : Math.sin(t * 2.5) * 0.8;

    ctx.save();
    ctx.translate(c.x, c.y + bob);
    dropShadow(ctx, 0, 26, 25, 8);

    // Trousers & shoes
    roundRect(ctx, -14, 10, 11, 18, 4, '#243a31');
    roundRect(ctx, 4, 10, 11, 18, 4, '#243a31');
    oval(ctx, -9, 27, 10, 4.5, '#1b2b25');
    oval(ctx, 10, 27, 10, 4.5, '#1b2b25');

    // Jacket & copper-strapped apron
    roundRect(ctx, -24, -22, 48, 44, 17, '#f4eed8');
    roundRect(ctx, -13, -11, 26, 33, 5, '#b8683a');
    drawLine(ctx, -12, -13, -7, -25, '#b8683a', 3);
    drawLine(ctx, 13, -13, 7, -25, '#b8683a', 3);
    roundRect(ctx, -8, 5, 16, 9, 2, '#d18652');

    // Hands & head
    const armLift = c.servePulse * 8;
    oval(ctx, -23, 1 - armLift, 6.5, 9, '#c68c60');
    oval(ctx, 24, 0 - armLift, 6.5, 9, '#c68c60');
    oval(ctx, 0, -31, 18, 19, '#dba377');
    oval(ctx, -6, -29, 2, 2.5, '#3b3324');
    oval(ctx, 7, -29, 2, 2.5, '#3b3324');
    ctx.beginPath();
    ctx.arc(1, -24, 5.5, 0.2, Math.PI - 0.2);
    ctx.strokeStyle = '#8b5d3c';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Tall pleated toque
    roundRect(ctx, -20, -52, 40, 18, 5, '#fbf7e6');
    oval(ctx, -14, -54, 12, 11, '#fffdf2');
    oval(ctx, 0, -59, 14, 12, '#ffffff');
    oval(ctx, 14, -54, 12, 11, '#faf5e4');
    drawLine(ctx, -17, -38, 17, -38, '#d4cab0', 2);

    if (sim.hand) {
      const hx = 34 * c.facing;
      oval(ctx, hx, -10 - armLift, 19, 8, '#ebe3cb', '#b8ab8a', 1);
      drawIngredientArt(ctx, sim.hand.item, hx, -16 - armLift, 0.62, sim.hand.stage);
    }

    ctx.restore();
  }

  render(sim, timeSec) {
    this._ensureBackdrop();
    const ctx = this.ctx;
    ctx.save();

    if (sim.shake > 0.1) {
      const sx = Math.sin(timeSec * 65) * sim.shake;
      const sy = Math.cos(timeSec * 53) * sim.shake * 0.7;
      ctx.translate(sx, sy);
    }

    if (this.backdrop) {
      ctx.drawImage(this.backdrop, 0, 0);
    }

    // Prep board + animated knife
    if (sim.prep) {
      drawIngredientArt(
        ctx,
        sim.prep.item,
        247,
        162,
        0.9,
        sim.prep.chops > 0 ? ItemStage.CHOPPED : ItemStage.RAW
      );
      for (let i = 0; i < CHOPS_REQUIRED; i++) {
        oval(ctx, 229 + i * 18, 189, 5, 3.5, i < sim.prep.chops ? '#ffd166' : '#6b4225');
      }
    }
    ctx.save();
    ctx.translate(314, 158 - sim.chef.chopPulse * 14);
    ctx.rotate(0.24 - sim.chef.chopPulse * 0.55);
    roundRect(ctx, -4, -22, 8, 24, 2, '#e6ece8');
    drawLine(ctx, -4, -22, -4, 2, '#9aa8a0', 2);
    roundRect(ctx, -4, 2, 8, 24, 2, '#344c40');
    ctx.restore();

    // Dual Skillets & Broth Pot
    this._drawBurnerAndPan(ctx, sim.pans[0], 445, timeSec);
    this._drawBurnerAndPan(ctx, sim.pans[1], 615, timeSec);
    this._drawBrothPot(ctx, sim.pot, 785, timeSec);

    // Two Plating Stations
    for (let i = 0; i < sim.plates.length; i++) {
      const px = i === 0 ? 985 : 1145;
      drawPlatedDish(ctx, px, 162, sim.plates[i], i === sim.selectedPlate);
      if (i === sim.selectedPlate) {
        drawTextLabel(ctx, 'ACTIVE PLATE', px, 204, 'bold 9px Arial, sans-serif', '#ffd166');
      }
    }

    // Highlight pass glow if selected plate is servable
    const matched = findMatchingRecipe(sim.plates[sim.selectedPlate].components);
    if (matched && sim.orders.some((o) => o.recipe.id === matched.id)) {
      roundRect(ctx, 924, 372, 304, 62, 9, null, '#7ae582', 3);
    }

    // Chef character
    this._drawChef(ctx, sim, timeSec);

    // Pooled particles
    for (let i = 0; i < sim.particles.items.length; i++) {
      const p = sim.particles.items[i];
      if (!p.active) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      oval(ctx, p.x, p.y, p.size, p.size, p.color);
    }
    ctx.globalAlpha = 1;

    // Pooled floating score popups
    for (let i = 0; i < sim.floaters.items.length; i++) {
      const f = sim.floaters.items[i];
      if (!f.active) continue;
      const alpha = Math.min(1, (f.life / f.maxLife) * 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(15, 25, 20, 0.85)';
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
