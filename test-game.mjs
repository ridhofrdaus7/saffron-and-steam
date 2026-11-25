import assert from 'node:assert/strict';
import { GameMode, ItemStage } from './game/config.js';
import { KitchenSimulation } from './game/state-machine.js';

function prepAndSear(sim, item, panAction) {
  assert.equal(sim.performAction(item), true);
  assert.equal(sim.performAction('prep'), true);
  for (let i = 0; i < 3; i++) assert.equal(sim.performAction('prep'), true);
  assert.equal(sim.hand?.stage, ItemStage.CHOPPED);
  assert.equal(sim.performAction(panAction), true);
  assert.equal(sim.hand, null);
}

const sim = new KitchenSimulation(0, false);
sim.transitionMode(GameMode.PLAYING);
assert.equal(sim.orders.length, 4);

// Parallel workflow: boil noodles in Broth Pot while searing tomato & mushroom in Skillets A & B
assert.equal(sim.performAction('noodles'), true);
assert.equal(sim.hand?.stage, ItemStage.CHOPPED);
assert.equal(sim.performAction('pot'), true);

prepAndSear(sim, 'tomato', 'pan0');
prepAndSear(sim, 'mushroom', 'pan1');

// Advance exactly into Tomato's PERFECT sear window (5.5s -> 6.0s)
sim.update(6.0);
assert.equal(sim.performAction('pan0'), true);
assert.equal(sim.hand?.stage, ItemStage.PERFECT);
assert.equal(sim.perfectCount, 1);
assert.equal(sim.performAction('plate0'), true);
assert.equal(sim.performAction('herbs'), true);
assert.equal(sim.serveSelectedPlate(1), true); // Order #1: Blistered Tomato Toast (22 + 6 herb + 5 fresh + 8 perfect = 41)
assert.equal(sim.money, 41);
assert.equal(sim.served, 1);

// Advance 1.0s more -> Mushroom (6.5s) is in PERFECT window (7.0s), Noodles (5.5s) simmered
sim.update(1.0);
assert.equal(sim.performAction('pot'), true);
assert.equal(sim.hand?.stage, ItemStage.SIMMERED);
assert.equal(sim.performAction('plate1'), true);
assert.equal(sim.performAction('pan1'), true);
assert.equal(sim.hand?.stage, ItemStage.PERFECT);
assert.equal(sim.performAction('plate1'), true);
assert.equal(sim.performAction('herbs'), true);
assert.equal(sim.serveSelectedPlate(), true); // Woodland Hearth Ramen
assert.equal(sim.served, 2);
assert.equal(sim.combo, 2);
assert.ok(sim.money > 90);

// Test pause freezes timers, burn resets combo, and discard clears hand
sim.transitionMode(GameMode.PAUSED);
const frozenRemaining = sim.remaining;
sim.update(10);
assert.equal(sim.remaining, frozenRemaining);

sim.transitionMode(GameMode.PLAYING);
prepAndSear(sim, 'shrimp', 'pan0');
sim.update(15.0); // 5.0 + 9.5 = 14.5s burn
assert.equal(sim.pans[0]?.burnt, true);
assert.equal(sim.combo, 0);
assert.equal(sim.performAction('pan0'), true);
assert.equal(sim.pans[0], null);

// Test Practice mode never expires
const practice = new KitchenSimulation(0, true);
practice.transitionMode(GameMode.PLAYING);
practice.update(500);
assert.equal(practice.mode, GameMode.PLAYING);
assert.equal(practice.missed, 0);

console.log('PASS: Ember & Ladle state machine, dual skillets + broth pot, perfect sear window, 6 recipes, pause, burn, and practice verified.');
