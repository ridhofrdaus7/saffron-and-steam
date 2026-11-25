// Composition root for Ember & Ladle.
// Coordinates KitchenSimulation, InputManager, KitchenRenderer, AudioEngine, and DOM HUD.

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  CHOPS_REQUIRED,
  GameMode,
  INGREDIENTS,
  MAX_DELTA_SEC,
  PAN_PERFECT_WINDOW_SEC,
  RECIPES,
  SHIFTS,
  STATIONS,
  findMatchingRecipe,
} from './config.js';
import { AudioEngine } from './audio-engine.js';
import { InputManager } from './input-manager.js';
import { KitchenRenderer } from './kitchen-renderer.js';
import { KitchenSimulation } from './state-machine.js';

const el = (id) => document.getElementById(id);
const canvas = el('kitchen');
const sim = new KitchenSimulation(0, false);
const renderer = new KitchenRenderer(canvas);
const audio = new AudioEngine();
const input = new InputManager();

let unlockedShift = 0;
let bestScore = 0;
let lastOrderKey = '';
let lastFrameMs = performance.now();
let uiRefreshAccum = 0;
let rafId = 0;

try {
  unlockedShift = Math.max(0, Math.min(2, Number(localStorage.getItem('ember-unlocked')) || 0));
  bestScore = Number(localStorage.getItem('ember-best')) || 0;
} catch {}

function buildStationButtons() {
  const host = el('station-controls');
  for (const station of STATIONS) {
    const btn = document.createElement('button');
    btn.className = 'station';
    btn.type = 'button';
    btn.id = `station-${station.id}`;
    btn.style.left = `${(station.x / CANVAS_WIDTH) * 100}%`;
    btn.style.top = `${(station.y / CANVAS_HEIGHT) * 100}%`;
    btn.setAttribute('aria-label', station.label);
    const keyGlyph = station.key === 'Enter' ? '↵' : station.key;
    btn.innerHTML = `<kbd>${keyGlyph}</kbd>${station.label}<small>Ready</small>`;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerAction(station.id);
    });
    host.append(btn);
  }
}

function flushCue() {
  if (sim.pendingCue) {
    audio.play(sim.pendingCue);
    sim.pendingCue = null;
  }
}

function triggerAction(actionId) {
  audio.unlock();
  if (actionId === 'close_or_toggle') {
    if (sim.mode === GameMode.PLAYING) openPauseModal();
    else if ([GameMode.PAUSED, GameMode.RECIPES, GameMode.HELP].includes(sim.mode)) closeModal();
    return;
  }
  if (actionId === 'pause') {
    if (sim.mode === GameMode.PLAYING) openPauseModal();
    else if (sim.mode === GameMode.PAUSED) closeModal();
    return;
  }
  if (actionId === 'recipes') {
    if (sim.mode === GameMode.PLAYING) openRecipesModal();
    return;
  }
  if (actionId === 'help') {
    if (sim.mode === GameMode.PLAYING) openHelpModal();
    return;
  }

  if (!sim.isPlaying()) {
    input.bufferAction(actionId);
    return;
  }

  sim.performAction(actionId);
  flushCue();
  syncHUD();
}

const unbindInput = input.onAction((action) => triggerAction(action));

function openModal(mode, html) {
  sim.transitionMode(mode);
  input.setContext('modal');
  el('modal').innerHTML = `<section class="modal-card" role="dialog" aria-modal="true">${html}</section>`;
  const firstBtn = el('modal').querySelector('button');
  if (firstBtn) firstBtn.focus();
}

function closeModal() {
  sim.transitionMode(GameMode.PLAYING);
  input.setContext('gameplay');
  el('modal').innerHTML = '';
  const buffered = input.consumeBuffered();
  if (buffered) {
    sim.performAction(buffered);
    flushCue();
  }
  syncHUD();
}

function startService(shiftIndex = 0, practice = false) {
  audio.unlock();
  sim.reset(shiftIndex, practice);
  sim.transitionMode(GameMode.PLAYING);
  input.setContext('gameplay');
  lastOrderKey = '';
  el('modal').innerHTML = '';
  sim.notice = 'Service started! Boil Noodles [4 -> 8] while searing toppings [1-3 -> 5 -> 6/7].';
  sim.noticeTime = 3.5;
  syncHUD();
}

function openTitleModal() {
  openModal(
    GameMode.TITLE,
    `<span class="eyebrow">OPEN-FIRE BISTRO KITCHEN</span>
     <div class="flourish">✦</div>
     <h2>Ember &amp; Ladle</h2>
     <p>Two copper skillets, a bubbling broth pot, and an order rail full of hungry guests.<br>Plan your route, hit the golden sear window, and plate signature bowls.</p>
     <div class="steps">
       <div class="step"><b>01 · Prep &amp; Simmer</b>Chop Tomato, Mushroom, or Shrimp [1–3] on the board [5]. Noodles [4] go straight into the Broth Pot [8].</div>
       <div class="step"><b>02 · Golden Sear</b>Sear toppings in Skillet A [6] or B [7]. Lift during the golden PERFECT window for +8 bonus coins!</div>
       <div class="step"><b>03 · Compose &amp; Garnish</b>Combine components on Plate 1 [9] or 2 [0]. Add Herb Finish [G] for +6 coins.</div>
       <div class="step"><b>04 · Serve &amp; Streak</b>Press [Enter] or click a glowing ticket. Consecutive fast serves build your zone multiplier.</div>
     </div>
     <button class="primary" id="btn-start" type="button">Start Bistro Lunch</button>
     <button id="btn-practice" type="button">Practice Mode (No Timer)</button>
     ${unlockedShift > 0 ? '<button id="btn-shifts" type="button">Choose Service</button>' : ''}
     <p style="font-size:11px;margin-top:12px">6 Recipes · Dual Appliances · Best Takings: ${bestScore} coins</p>`
  );
  el('btn-start').addEventListener('click', () => startService(0, false));
  el('btn-practice').addEventListener('click', () => startService(0, true));
  const shiftsBtn = el('btn-shifts');
  if (shiftsBtn) shiftsBtn.addEventListener('click', openShiftModal);
}

function openShiftModal() {
  openModal(
    GameMode.SHIFTS,
    `<span class="eyebrow">THREE BISTRO SERVICES</span>
     <h2>Select Your Shift</h2>
     <p>Hit each service goal to unlock higher-heat dinner rushes.</p>
     ${SHIFTS.map(
       (s, i) =>
         `<button id="shift-${i}" type="button" ${i > unlockedShift ? 'disabled' : ''}>${s.name} · Goal ${s.goal} coins${i > unlockedShift ? ' (Locked)' : ''}</button>`
     ).join('')}
     <div style="margin-top:12px"><button id="btn-back" type="button">Back</button></div>`
  );
  SHIFTS.forEach((s, i) => {
    el(`shift-${i}`).addEventListener('click', () => startService(i, false));
  });
  el('btn-back').addEventListener('click', openTitleModal);
}

function openRecipesModal() {
  openModal(
    GameMode.RECIPES,
    `<span class="eyebrow">BISTRO MENU</span>
     <h2>House Recipes</h2>
     <p>Garnish any completed plate with Herbs [G] for +6 coins. Lift skillets in the golden window for +8.</p>
     <div class="recipe-grid">
       ${RECIPES.map(
         (r) =>
           `<article class="recipe-card">
             <h3>${r.name} · ${r.price}c</h3>
             <p>${r.description}</p>
             <p><b>${r.short}</b></p>
           </article>`
       ).join('')}
     </div>
     <button class="primary" id="btn-resume" type="button">Back to Kitchen</button>`
  );
  el('btn-resume').addEventListener('click', closeModal);
}

function openHelpModal() {
  openModal(
    GameMode.HELP,
    `<span class="eyebrow">KITCHEN CONTROLS</span>
     <h2>Master the Line</h2>
     <div class="steps">
       <div class="step"><b>1–4 · Pantry</b>Pick Tomato, Mushroom, Shrimp, or Noodles.</div>
       <div class="step"><b>5 · Chop Board</b>Place raw item, then tap 3 times to slice.</div>
       <div class="step"><b>6 / 7 · Copper Skillets</b>Sear chopped ingredients. Watch the golden PERFECT marker!</div>
       <div class="step"><b>8 · Broth Pot</b>Simmer Noodles (no chop!) or chopped Tomato for broth.</div>
       <div class="step"><b>9 / 0 · Plates</b>Combine cooked items into single, duet, or 3-part bowls.</div>
       <div class="step"><b>G / Enter / X</b>Garnish [G], Serve [Enter], Compost [X], Pause [Space].</div>
     </div>
     <button class="primary" id="btn-resume" type="button">Resume Cooking</button>`
  );
  el('btn-resume').addEventListener('click', closeModal);
}

function openPauseModal() {
  openModal(
    GameMode.PAUSED,
    `<span class="eyebrow">SERVICE PAUSED</span>
     <h2>Take a Breather</h2>
     <p>Stoves and guest timers are held while you review your plan.</p>
     <button class="primary" id="btn-resume" type="button">Resume Service</button>
     <button id="btn-restart" type="button">Restart Shift</button>
     <button id="btn-home" type="button">Main Menu</button>`
  );
  el('btn-resume').addEventListener('click', closeModal);
  el('btn-restart').addEventListener('click', () => startService(sim.shift, sim.practice));
  el('btn-home').addEventListener('click', openTitleModal);
}

function openResultsModal() {
  const goal = SHIFTS[sim.shift].goal;
  const passed = sim.money >= goal;
  bestScore = Math.max(bestScore, sim.money);
  if (passed) unlockedShift = Math.max(unlockedShift, Math.min(2, sim.shift + 1));
  try {
    localStorage.setItem('ember-unlocked', String(unlockedShift));
    localStorage.setItem('ember-best', String(bestScore));
  } catch {}

  const stars = sim.money >= goal * 1.45 ? 3 : passed ? 2 : sim.served > 0 ? 1 : 0;
  openModal(
    GameMode.RESULTS,
    `<span class="eyebrow">SERVICE COMPLETE</span>
     <h2>${passed ? 'Standing Ovation!' : 'Service Wrapped'}</h2>
     <div class="rating">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
     <p>${SHIFTS[sim.shift].name} · Goal ${goal} coins</p>
     <div class="results">
       <div><strong>${sim.money}</strong><span>COINS EARNED</span></div>
       <div><strong>${sim.served}</strong><span>DISHES SERVED</span></div>
       <div><strong>${sim.perfectCount}</strong><span>PERFECT SEARS</span></div>
       <div><strong>${sim.bestCombo}x</strong><span>BEST STREAK</span></div>
     </div>
     <p>${sim.missed} missed · ${sim.wasted} wasted</p>
     <button class="primary" id="btn-again" type="button">Play Again</button>
     ${passed && sim.shift < 2 ? '<button id="btn-next" type="button">Next Service</button>' : ''}
     <button id="btn-home" type="button">Main Menu</button>`
  );
  el('btn-again').addEventListener('click', () => startService(sim.shift, sim.practice));
  el('btn-home').addEventListener('click', openTitleModal);
  const nextBtn = el('btn-next');
  if (nextBtn) nextBtn.addEventListener('click', () => startService(sim.shift + 1, false));
}

function syncOrderTickets() {
  const key = sim.orders.map((o) => o.id).join(',');
  if (key !== lastOrderKey) {
    lastOrderKey = key;
    el('orders').innerHTML = sim.orders
      .map((o) => {
        const chips = o.recipe.components
          .map((c) => {
            const ing = INGREDIENTS[c.item];
            return `<span class="chip" style="background:${ing.color}">${ing.shortName}</span>`;
          })
          .join('');
        return `<button class="ticket ${o.vip ? 'vip' : ''}" id="order-${o.id}" type="button" aria-label="Serve ${o.recipe.name}">
          <div class="ticket-head">
            <span>${o.vip ? '★ VIP #' + String(o.id).padStart(2, '0') : 'ORDER #' + String(o.id).padStart(2, '0')}</span>
            <b>${o.vip ? Math.round(o.recipe.price * 1.5) : o.recipe.price}c</b>
          </div>
          <h3>${o.recipe.name}</h3>
          <div class="ticket-chips">${chips}</div>
          <div class="patience"><i></i></div>
          <div class="ticket-foot"><span>${o.vip ? '1.5x VIP Tip' : 'Fresh +5c'}</span><span class="wait"></span></div>
        </button>`;
      })
      .join('');

    for (const o of sim.orders) {
      el(`order-${o.id}`).addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.unlock();
        if (!sim.isPlaying()) return;
        sim.serveSelectedPlate(o.id);
        flushCue();
        syncHUD();
      });
    }
  }

  const activePlateRecipe = findMatchingRecipe(sim.plates[sim.selectedPlate].components);
  for (const o of sim.orders) {
    const card = el(`order-${o.id}`);
    if (!card) continue;
    const ratio = Math.max(0, o.remaining / o.max);
    card.classList.toggle('urgent', ratio < 0.28);
    card.classList.toggle('ready', activePlateRecipe?.id === o.recipe.id && !sim.hand);
    card.querySelector('.patience i').style.width = `${ratio * 100}%`;
    card.querySelector('.wait').textContent = sim.practice ? 'Zen' : `${Math.ceil(o.remaining)}s`;
  }
}

function syncHUD() {
  const shift = SHIFTS[sim.shift];
  const mins = Math.floor(sim.remaining / 60);
  const secs = Math.floor(sim.remaining % 60);
  el('clock').textContent = sim.practice
    ? '∞'
    : `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  el('clock').style.color = sim.remaining < 30 && !sim.practice ? '#c44c36' : '';
  el('shift-label').textContent = sim.practice ? 'PRACTICE KITCHEN' : shift.name.toUpperCase();
  el('money').innerHTML = `${sim.money} <small>coins</small>`;
  el('time-bar').style.width = `${(sim.remaining / shift.seconds) * 100}%`;

  const comboEl = el('combo');
  if (sim.combo >= 3) {
    comboEl.textContent = `IN THE ZONE · ${sim.combo}x STREAK (+${Math.min(20, (sim.combo - 1) * 3)}c)`;
    comboEl.classList.add('zone');
  } else if (sim.combo > 1) {
    comboEl.textContent = `${sim.combo}x Streak · +${(sim.combo - 1) * 3}c`;
    comboEl.classList.remove('zone');
  } else {
    comboEl.textContent = `Goal: ${shift.goal} coins`;
    comboEl.classList.remove('zone');
  }

  el('rush-label').textContent = sim.practice
    ? 'No clock pressure. Experiment with combos.'
    : sim.elapsed < 60
    ? 'Opening service. Build your dual-appliance flow.'
    : sim.elapsed < 120
    ? 'Dinner rush! Keep both skillets & pot busy.'
    : 'Final push! Prioritize urgent & VIP tickets.';

  el('held').textContent = sim.hand
    ? `${INGREDIENTS[sim.hand.item].shortName} (${sim.hand.stage.toUpperCase()})`
    : 'Empty · pick an ingredient';
  el('hint').textContent = sim.getChefHint();
  el('stats').textContent = `${sim.served} served · ${sim.perfectCount} perfect · ${sim.missed} missed · ${sim.wasted} wasted`;
  el('room-status').textContent = sim.practice
    ? 'PRACTICE · ZEN MODE'
    : sim.combo >= 3
    ? 'IN THE ZONE · HOT STREAK'
    : sim.remaining < 35
    ? 'FINAL CALL · RUSH HOUR'
    : 'THE HEARTH IS LIT';

  const toast = el('toast');
  toast.textContent = sim.notice;
  toast.className = sim.noticeTime > 0 ? 'show' : '';

  syncOrderTickets();

  for (const station of STATIONS) {
    const btn = el(`station-${station.id}`);
    btn.classList.toggle('active', sim.lastAction === station.id);
    btn.classList.remove('ready', 'perfect', 'burn');
    let sub = station.group === 'pantry' ? 'Pick' : 'Use';

    if (station.id === 'prep') {
      sub = sim.prep ? `Slice ${sim.prep.chops}/${CHOPS_REQUIRED}` : 'Chop x3';
    } else if (station.id.startsWith('pan')) {
      const pan = sim.pans[station.id === 'pan0' ? 0 : 1];
      if (pan) {
        const need = INGREDIENTS[pan.item].searTime;
        if (pan.burnt) {
          sub = 'Scorched · Clean';
          btn.classList.add('burn');
        } else if (pan.time >= need && pan.time <= need + PAN_PERFECT_WINDOW_SEC) {
          sub = 'PERFECT · Lift!';
          btn.classList.add('perfect');
        } else if (pan.time >= need) {
          sub = 'Lift now!';
          btn.classList.add('ready');
        } else {
          sub = `Searing ${Math.ceil(need - pan.time)}s`;
        }
      } else {
        sub = 'Empty skillet';
      }
    } else if (station.id === 'pot') {
      if (sim.pot) {
        const need = INGREDIENTS[sim.pot.item].simmerTime;
        if (sim.pot.burnt) {
          sub = 'Dry · Rinse';
          btn.classList.add('burn');
        } else if (sim.pot.time >= need) {
          sub = 'Simmered · Lift';
          btn.classList.add('ready');
        } else {
          sub = `Simmer ${Math.ceil(need - sim.pot.time)}s`;
        }
      } else {
        sub = 'Noodles / Broth';
      }
    } else if (station.id.startsWith('plate')) {
      const idx = station.id === 'plate0' ? 0 : 1;
      const plate = sim.plates[idx];
      const match = findMatchingRecipe(plate.components);
      sub = match ? match.name : plate.components.length ? `${plate.components.length} plated` : 'Empty plate';
      if (plate.herbs) sub += ' +Herb';
      if (match) btn.classList.add('ready');
    } else if (station.id === 'herbs') {
      sub = '+6c Bonus';
    } else if (station.id === 'serve') {
      const match = findMatchingRecipe(sim.plates[sim.selectedPlate].components);
      sub = match && sim.orders.some((o) => o.recipe.id === match.id) ? 'READY · Serve!' : 'Ring Bell';
      if (sub.startsWith('READY')) btn.classList.add('ready');
    }

    btn.querySelector('small').textContent = sub;
  }
}

el('sound').addEventListener('click', () => {
  audio.unlock();
  audio.setMuted(!audio.isMuted());
  el('sound').textContent = audio.isMuted() ? 'Sound Off' : 'Sound On';
});
el('pause').addEventListener('click', () => triggerAction('pause'));
el('recipes').addEventListener('click', () => triggerAction('recipes'));
el('help').addEventListener('click', () => triggerAction('help'));
el('discard').addEventListener('click', () => triggerAction('discard'));

const onVisibility = () => {
  if (document.hidden && sim.isPlaying()) openPauseModal();
};
document.addEventListener('visibilitychange', onVisibility);

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(rafId);
  unbindInput();
  input.destroy();
  document.removeEventListener('visibilitychange', onVisibility);
});

function frame(nowMs) {
  const dt = Math.min(MAX_DELTA_SEC, Math.max(0, (nowMs - lastFrameMs) / 1000));
  lastFrameMs = nowMs;

  const prevMode = sim.mode;
  sim.update(dt);
  flushCue();
  renderer.render(sim, nowMs / 1000);

  uiRefreshAccum += dt;
  if (uiRefreshAccum >= 0.08) {
    syncHUD();
    uiRefreshAccum = 0;
  }
  if (prevMode === GameMode.PLAYING && sim.mode === GameMode.RESULTS) {
    openResultsModal();
  }

  rafId = requestAnimationFrame(frame);
}

buildStationButtons();
syncHUD();
openTitleModal();
rafId = requestAnimationFrame(frame);

// Expose read-only inspection helper for automated test verification
window.__emberDebug = { sim, startService, triggerAction };
