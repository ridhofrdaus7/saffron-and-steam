// Deterministic kitchen simulation and explicit state machine.
// Uses delta-time updates, pooled particles/floaters, and clear transition guards.

import {
  CHEF_MOVE_SPEED,
  CHOPS_REQUIRED,
  FRESH_SERVE_BONUS,
  GameMode,
  HERB_GARNISH_BONUS,
  INGREDIENTS,
  ItemStage,
  MAX_STREAK_BONUS,
  PAN_BURN_TIME_SEC,
  PAN_PERFECT_WINDOW_SEC,
  PERFECT_COOK_BONUS,
  POT_BURN_TIME_SEC,
  RECIPES,
  SHIFTS,
  STATIONS,
  VIP_MULTIPLIER,
  findMatchingRecipe,
} from './config.js';
import { FloatingTextPool, ParticlePool } from './object-pool.js';

export class KitchenSimulation {
  constructor(shiftIndex = 0, practice = false) {
    this.particles = new ParticlePool();
    this.floaters = new FloatingTextPool();
    this.mode = GameMode.TITLE;
    this.reset(shiftIndex, practice);
  }

  reset(shiftIndex = 0, practice = false) {
    const shift = SHIFTS[shiftIndex] || SHIFTS[0];
    this.shift = shiftIndex;
    this.practice = practice;
    this.remaining = shift.seconds;
    this.elapsed = 0;
    this.money = 0;
    this.served = 0;
    this.missed = 0;
    this.wasted = 0;
    this.perfectCount = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hand = null;
    this.prep = null;
    this.pans = [null, null];
    this.pot = null;
    this.plates = [
      { components: [], herbs: false },
      { components: [], herbs: false },
    ];
    this.selectedPlate = 0;
    this.orders = [];
    this.nextOrderId = 1;
    this.orderCursor = 0;
    this.chef = {
      x: 420,
      y: 325,
      tx: 420,
      ty: 325,
      facing: 1,
      chopPulse: 0,
      servePulse: 0,
    };
    this.shake = 0;
    this.steamAccum = 0;
    this.lastAction = '';
    this.notice = '';
    this.noticeTime = 0;
    this.pendingCue = null;
    this.particles.clear();
    this.floaters.clear();

    for (let i = 0; i < 4; i++) {
      this._spawnOrder(i * 10);
    }
  }

  transitionMode(nextMode) {
    if (!Object.values(GameMode).includes(nextMode)) return false;
    this.mode = nextMode;
    return true;
  }

  isPlaying() {
    return this.mode === GameMode.PLAYING;
  }

  _notify(text, cue = 'tap') {
    this.notice = text;
    this.noticeTime = 3.0;
    this.pendingCue = cue;
  }

  _spawnOrder(extraPatience = 0) {
    const shift = SHIFTS[this.shift];
    const recipeIndex = shift.recipePool[this.orderCursor % shift.recipePool.length];
    const recipe = RECIPES[recipeIndex];
    const vip = this.orderCursor > 1 && (this.orderCursor % 5 === 4);
    this.orderCursor += 1;

    const complexityGrace = (recipe.components.length - 1) * 20;
    const rampPenalty = Math.min(18, Math.floor(this.elapsed / 55) * 5);
    const vipPenalty = vip ? 12 : 0;
    const maxPatience = Math.max(38, shift.basePatience + extraPatience + complexityGrace - rampPenalty - vipPenalty);

    this.orders.push({
      id: this.nextOrderId++,
      recipe,
      vip,
      remaining: maxPatience,
      max: maxPatience,
    });
  }

  update(dt) {
    this.particles.update(dt);
    this.floaters.update(dt);

    if (this.mode !== GameMode.PLAYING) return;

    this.elapsed += dt;
    if (!this.practice) {
      this.remaining = Math.max(0, this.remaining - dt);
    }
    this.noticeTime = Math.max(0, this.noticeTime - dt);
    this.shake = Math.max(0, this.shake - dt * 18);

    const c = this.chef;
    c.chopPulse = Math.max(0, c.chopPulse - dt * 6);
    c.servePulse = Math.max(0, c.servePulse - dt * 3);

    const dx = c.tx - c.x;
    const dy = c.ty - c.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      c.facing = dx >= 0 ? 1 : -1;
      const step = Math.min(dist, CHEF_MOVE_SPEED * dt);
      c.x += (dx / dist) * step;
      c.y += (dy / dist) * step;
    }

    this.steamAccum += dt;
    const emitSteam = this.steamAccum >= 0.22;
    if (emitSteam) this.steamAccum = 0;

    for (let i = 0; i < this.pans.length; i++) {
      const pan = this.pans[i];
      if (!pan) continue;
      const prev = pan.time;
      pan.time += dt;
      const need = INGREDIENTS[pan.item].searTime;
      const burnAt = need + PAN_BURN_TIME_SEC;
      const px = i === 0 ? 445 : 615;

      if (prev < need && pan.time >= need) {
        this._notify(`${INGREDIENTS[pan.item].shortName} is seared! Lift it in the golden window.`, 'ready');
        this.floaters.spawn('SEARED!', px, 108, '#ffd166', 1.1);
      }
      if (prev < burnAt && pan.time >= burnAt) {
        pan.burnt = true;
        this.wasted += 1;
        this.combo = 0;
        this.shake = 5;
        this._notify('Skillet scorched! Click it with empty hands to clear.', 'bad');
        this.floaters.spawn('SCORCHED!', px, 108, '#ff7b5c', 1.3);
      }
      if (emitSteam) {
        this.particles.spawn(
          'steam',
          px + ((pan.time * 13) % 24) - 12,
          178,
          ((pan.time * 7) % 10) - 5,
          -24,
          pan.burnt ? 10 : 7,
          0.75,
          pan.burnt ? '#463b36bb' : '#fff5df88'
        );
      }
    }

    if (this.pot) {
      const prev = this.pot.time;
      this.pot.time += dt;
      const need = INGREDIENTS[this.pot.item].simmerTime;
      const burnAt = need + POT_BURN_TIME_SEC;
      if (prev < need && this.pot.time >= need) {
        this._notify(`${INGREDIENTS[this.pot.item].shortName} finished simmering!`, 'ready');
        this.floaters.spawn('SIMMERED!', 785, 102, '#a8e6cf', 1.1);
      }
      if (prev < burnAt && this.pot.time >= burnAt) {
        this.pot.burnt = true;
        this.wasted += 1;
        this.combo = 0;
        this._notify('Broth pot boiled dry! Clear it with empty hands.', 'bad');
      }
      if (emitSteam) {
        this.particles.spawn(
          'steam',
          785 + ((this.pot.time * 17) % 22) - 11,
          174,
          0,
          -28,
          9,
          0.85,
          this.pot.burnt ? '#463b36bb' : '#eef7f499'
        );
      }
    }

    if (!this.practice) {
      for (const order of this.orders) {
        order.remaining -= dt;
      }
      const expired = this.orders.filter((o) => o.remaining <= 0);
      if (expired.length > 0) {
        this.missed += expired.length;
        this.combo = 0;
        this.shake = 4;
        this.orders = this.orders.filter((o) => o.remaining > 0);
        for (let i = 0; i < expired.length; i++) {
          this._spawnOrder();
        }
        this._notify('A guest walked out. Reset your rhythm on the next ticket.', 'bad');
      }
      if (this.remaining <= 0) {
        this.transitionMode(GameMode.RESULTS);
      }
    }
  }

  performAction(actionId) {
    if (this.mode !== GameMode.PLAYING) return false;

    const station = STATIONS.find((s) => s.id === actionId);
    if (station) {
      this.chef.tx = station.chefX;
      this.chef.ty = station.chefY;
    }
    this.lastAction = actionId;

    if (INGREDIENTS[actionId]) {
      return this._pickIngredient(actionId);
    }
    if (actionId === 'prep') return this._interactPrep();
    if (actionId === 'pan0' || actionId === 'pan1') return this._interactPan(actionId === 'pan0' ? 0 : 1);
    if (actionId === 'pot') return this._interactPot();
    if (actionId === 'plate0' || actionId === 'plate1') return this._interactPlate(actionId === 'plate0' ? 0 : 1);
    if (actionId === 'herbs') return this._applyHerbs();
    if (actionId === 'serve') return this.serveSelectedPlate();
    if (actionId === 'discard') return this._discardHeldOrPlate();
    return false;
  }

  _pickIngredient(itemId) {
    if (this.hand) {
      this._notify('Hands are full — place or discard what you are holding first.', 'bad');
      return false;
    }
    const spec = INGREDIENTS[itemId];
    this.hand = {
      item: itemId,
      stage: spec.needsChop ? ItemStage.RAW : ItemStage.CHOPPED,
      perfect: false,
    };
    this._notify(
      spec.needsChop
        ? `${spec.shortName} in hand. Bring it to the Chop Board [5].`
        : `${spec.shortName} ready! Drop straight into the Broth Pot [8].`,
      'tap'
    );
    return true;
  }

  _interactPrep() {
    if (this.hand) {
      if (this.hand.stage !== ItemStage.RAW) {
        this._notify('Already prepped — move straight to Skillet [6/7] or Broth Pot [8].', 'bad');
        return false;
      }
      if (this.prep) {
        this._notify('Finish chopping the ingredient already on the board.', 'bad');
        return false;
      }
      this.prep = { item: this.hand.item, chops: 0 };
      this.hand = null;
      this._notify('On the board! Tap [5] three times to slice cleanly.', 'tap');
      return true;
    }

    if (!this.prep) {
      this._notify('Grab Tomato [1], Mushroom [2], or Shrimp [3] first.', 'bad');
      return false;
    }

    this.prep.chops += 1;
    this.chef.chopPulse = 1;
    this.shake = 2.2;
    this.particles.emitBurst('spark', 250, 178, 7, INGREDIENTS[this.prep.item].accent, 85);

    if (this.prep.chops >= CHOPS_REQUIRED) {
      const doneItem = this.prep.item;
      this.hand = { item: doneItem, stage: ItemStage.CHOPPED, perfect: false };
      this.prep = null;
      const spec = INGREDIENTS[doneItem];
      this.floaters.spawn('PREPPED!', 250, 108, '#ffd166', 0.9);
      this._notify(
        spec.canSimmer
          ? `${spec.shortName} diced! Sear in Skillet [6/7] or simmer in Pot [8].`
          : `${spec.shortName} prepped! Sear in Skillet A [6] or Skillet B [7].`,
        'chop_done'
      );
      return true;
    }

    this._notify(`Slicing ${this.prep.chops}/${CHOPS_REQUIRED}...`, 'chop');
    return true;
  }

  _interactPan(index) {
    const pan = this.pans[index];
    const px = index === 0 ? 445 : 615;

    if (pan) {
      if (this.hand) {
        this._notify('Empty your hands before lifting from the skillet.', 'bad');
        return false;
      }
      if (pan.burnt) {
        this.pans[index] = null;
        this.particles.emitBurst('spark', px, 185, 8, '#a09388', 70);
        this._notify('Skillet scrubbed clean.', 'tap');
        return true;
      }
      const need = INGREDIENTS[pan.item].searTime;
      if (pan.time < need) {
        this._notify(`Still searing (${Math.ceil(need - pan.time)}s left) — prep another order!`, 'bad');
        return false;
      }
      const inPerfectWindow = pan.time <= need + PAN_PERFECT_WINDOW_SEC;
      this.hand = {
        item: pan.item,
        stage: inPerfectWindow ? ItemStage.PERFECT : ItemStage.SEARED,
        perfect: inPerfectWindow,
      };
      this.pans[index] = null;
      if (inPerfectWindow) {
        this.perfectCount += 1;
        this.particles.emitBurst('spark', px, 180, 10, '#ffd166', 105);
        this.floaters.spawn(`PERFECT +${PERFECT_COOK_BONUS}`, px, 152, '#ffd166', 1.2);
        this._notify(`Perfect sear! Plate on [9] or [0] for +${PERFECT_COOK_BONUS} coins.`, 'perfect');
      } else {
        this._notify('Seared! Plate onto Plate 1 [9] or Plate 2 [0].', 'ready');
      }
      return true;
    }

    if (!this.hand || this.hand.stage !== ItemStage.CHOPPED) {
      this._notify('Chop an ingredient first before placing it in a skillet.', 'bad');
      return false;
    }
    const spec = INGREDIENTS[this.hand.item];
    if (!spec.canSear) {
      this._notify(`${spec.shortName} belongs in the Broth Pot [8], not a dry skillet!`, 'bad');
      return false;
    }

    this.pans[index] = { item: this.hand.item, time: 0, burnt: false };
    this.hand = null;
    this.particles.emitBurst('spark', px, 188, 6, '#ffb74d', 65);
    this._notify(`Searing in Skillet ${index === 0 ? 'A' : 'B'}! Keep moving while it cooks.`, 'sizzle');
    return true;
  }

  _interactPot() {
    if (this.pot) {
      if (this.hand) {
        this._notify('Empty your hands before ladling from the Broth Pot.', 'bad');
        return false;
      }
      if (this.pot.burnt) {
        this.pot = null;
        this._notify('Broth Pot rinsed out.', 'tap');
        return true;
      }
      const need = INGREDIENTS[this.pot.item].simmerTime;
      if (this.pot.time < need) {
        this._notify(`Simmering (${Math.ceil(need - this.pot.time)}s left) — sear toppings meanwhile!`, 'bad');
        return false;
      }
      this.hand = { item: this.pot.item, stage: ItemStage.SIMMERED, perfect: false };
      this.pot = null;
      this.particles.emitBurst('steam', 785, 178, 6, '#b8e8d8', 60);
      this._notify('Simmered to perfection! Add to Plate 1 [9] or Plate 2 [0].', 'ready');
      return true;
    }

    if (!this.hand || this.hand.stage !== ItemStage.CHOPPED) {
      this._notify('Bring Noodles [4] or chopped Tomato to the Broth Pot.', 'bad');
      return false;
    }
    const spec = INGREDIENTS[this.hand.item];
    if (!spec.canSimmer) {
      this._notify(`${spec.shortName} needs high heat in Skillet A [6] or B [7].`, 'bad');
      return false;
    }

    this.pot = { item: this.hand.item, time: 0, burnt: false };
    this.hand = null;
    this.particles.emitBurst('steam', 785, 184, 5, '#d5f2ea', 55);
    this._notify(`${spec.shortName} simmering! Prep your next topping now.`, 'simmer');
    return true;
  }

  _interactPlate(index) {
    this.selectedPlate = index;
    const plate = this.plates[index];

    if (!this.hand) {
      const matched = findMatchingRecipe(plate.components);
      this._notify(
        matched
          ? `Plate ${index + 1}: ${matched.name} ready! Garnish [G] or Serve [Enter].`
          : plate.components.length
          ? `Plate ${index + 1} selected — add the remaining recipe component.`
          : `Plate ${index + 1} selected — add cooked food here.`,
        'tap'
      );
      return true;
    }

    const validCooked =
      this.hand.stage === ItemStage.SEARED ||
      this.hand.stage === ItemStage.PERFECT ||
      this.hand.stage === ItemStage.SIMMERED;
    if (!validCooked) {
      this._notify('Cook ingredients in a skillet or pot before plating.', 'bad');
      return false;
    }

    const dup = plate.components.some((c) => c.item === this.hand.item);
    if (dup || plate.components.length >= 3) {
      this._notify('This plate already holds that component or is full — try the other plate.', 'bad');
      return false;
    }

    plate.components.push({
      item: this.hand.item,
      stage: this.hand.stage,
      perfect: this.hand.perfect,
    });
    plate.herbs = false;
    this.hand = null;

    const px = index === 0 ? 985 : 1145;
    this.particles.emitBurst('spark', px, 185, 6, '#f6e08a', 60);
    const matched = findMatchingRecipe(plate.components);
    this._notify(
      matched
        ? `${matched.name} plated! Add Herb Finish [G] (+${HERB_GARNISH_BONUS}) or Serve [Enter].`
        : 'Component plated! Add the remaining ingredient for a signature dish.',
      'plate'
    );
    return true;
  }

  _applyHerbs() {
    if (this.hand) {
      this._notify('Set down what you are holding before garnishing.', 'bad');
      return false;
    }
    const plate = this.plates[this.selectedPlate];
    if (!plate.components.length) {
      this._notify('Plate cooked ingredients before adding fresh herbs.', 'bad');
      return false;
    }
    if (plate.herbs) {
      this._notify('Already garnished with microgreens & herb oil!', 'tap');
      return false;
    }
    plate.herbs = true;
    const px = this.selectedPlate === 0 ? 985 : 1145;
    this.particles.emitBurst('spark', px, 182, 8, '#7ad38a', 75);
    this.floaters.spawn(`+HERB ${HERB_GARNISH_BONUS}`, px, 152, '#8ef0a2', 1.0);
    this._notify('Fresh herbs added (+6 coins)! Press [Enter] or click the ticket to serve.', 'herb');
    return true;
  }

  serveSelectedPlate(targetOrderId = null) {
    if (this.mode !== GameMode.PLAYING) return false;
    if (this.hand) {
      this._notify('Plate or set down your held ingredient before serving.', 'bad');
      return false;
    }

    const plate = this.plates[this.selectedPlate];
    const recipe = findMatchingRecipe(plate.components);
    if (!recipe) {
      this._notify(
        plate.components.length
          ? 'No order matches this combination yet — check the Recipe Book [R].'
          : 'Plate a finished dish first!',
        'bad'
      );
      return false;
    }

    const order = this.orders.find((o) => (!targetOrderId || o.id === targetOrderId) && o.recipe.id === recipe.id);
    if (!order) {
      this._notify(`No open ticket for ${recipe.name} right now!`, 'bad');
      return false;
    }

    const fresh = order.remaining / order.max > 0.5;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    const perfectCount = plate.components.filter((c) => c.perfect).length;
    const herbBonus = plate.herbs ? HERB_GARNISH_BONUS : 0;
    const freshBonus = fresh ? FRESH_SERVE_BONUS : 0;
    const streakBonus = Math.min(MAX_STREAK_BONUS, (this.combo - 1) * 3);
    const perfectBonus = perfectCount * PERFECT_COOK_BONUS;
    const subtotal = recipe.price + herbBonus + freshBonus + streakBonus + perfectBonus;
    const earned = order.vip ? Math.round(subtotal * VIP_MULTIPLIER) : subtotal;

    this.money += earned;
    this.served += 1;
    this.orders = this.orders.filter((o) => o !== order);
    this._spawnOrder();

    plate.components = [];
    plate.herbs = false;
    this.chef.tx = 1085;
    this.chef.ty = 334;
    this.chef.servePulse = 1;
    this.shake = 3.5;

    this.particles.emitBurst('spark', 1085, 390, 16, order.vip ? '#ffd166' : '#8ef0a2', 120);
    this.floaters.spawn(
      `+${earned}${order.vip ? ' VIP!' : ''}`,
      1085,
      355,
      order.vip ? '#ffd166' : '#a7f3b5',
      1.45
    );
    this._notify(
      `Served ${recipe.name}! +${earned} coins${this.combo > 1 ? ` · ${this.combo}x Streak!` : ''}`,
      'serve'
    );
    return true;
  }

  _discardHeldOrPlate() {
    if (this.hand) {
      this.hand = null;
      this.wasted += 1;
      this.combo = 0;
      this._notify('Composted ingredient in hand.', 'bad');
      return true;
    }
    const plate = this.plates[this.selectedPlate];
    if (plate.components.length > 0) {
      plate.components = [];
      plate.herbs = false;
      this.wasted += 1;
      this.combo = 0;
      this._notify('Cleared selected plate.', 'bad');
      return true;
    }
    if (this.prep) {
      this.prep = null;
      this.wasted += 1;
      this._notify('Cleared Chop Board.', 'bad');
      return true;
    }
    this._notify('Nothing to discard.', 'tap');
    return false;
  }

  getChefHint() {
    if (this.hand) {
      if (this.hand.stage === ItemStage.RAW) {
        return 'Bring your ingredient to the Chop Board [5], then slice 3 times.';
      }
      if (this.hand.stage === ItemStage.CHOPPED) {
        const spec = INGREDIENTS[this.hand.item];
        return spec.canSear && spec.canSimmer
          ? 'Sear Tomato in Skillet [6/7] or simmer for broth in Pot [8].'
          : spec.canSimmer
          ? 'Drop Noodles into the Broth Pot [8] to simmer.'
          : 'Place chopped food into Skillet A [6] or Skillet B [7].';
      }
      return 'Add your cooked component to Plate 1 [9] or Plate 2 [0].';
    }

    if (this.pans.some((p) => p && p.burnt) || this.pot?.burnt) {
      return 'Burnt cookware! Click it with empty hands to scrub clean.';
    }
    if (this.pans.some((p) => p && p.time >= INGREDIENTS[p.item].searTime)) {
      return 'A skillet is ready! Lift it in the golden PERFECT window for +8 coins.';
    }
    if (this.pot && this.pot.time >= INGREDIENTS[this.pot.item].simmerTime) {
      return 'The Broth Pot is done simmering! Ladle it onto a plate.';
    }
    if (this.prep) {
      return `Keep slicing on the Chop Board [5] (${this.prep.chops}/${CHOPS_REQUIRED}).`;
    }

    const activePlate = this.plates[this.selectedPlate];
    const matched = findMatchingRecipe(activePlate.components);
    if (matched) {
      return activePlate.herbs
        ? `Press [Enter] or click the glowing ${matched.name} ticket to serve!`
        : `Add Herb Finish [G] (+${HERB_GARNISH_BONUS} coins), then Serve [Enter].`;
    }
    if (activePlate.components.length > 0) {
      return 'Add the next cooked ingredient to finish your multi-part dish.';
    }
    return 'Plan your route: boil Noodles [4 -> 8] while searing toppings [1-3 -> 5 -> 6/7]!';
  }
}
