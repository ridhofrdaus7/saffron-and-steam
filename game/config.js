// Game configuration constants, ingredients, recipes, stations, and service shifts.
// All tuning values live here to avoid magic numbers in simulation and rendering.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 500;
export const CHEF_MOVE_SPEED = 560; // pixels per second
export const MAX_DELTA_SEC = 0.05;
export const INPUT_BUFFER_MS = 160;
export const CHOPS_REQUIRED = 3;
export const PAN_PERFECT_WINDOW_SEC = 3.2;
export const PAN_BURN_TIME_SEC = 9.5;
export const POT_BURN_TIME_SEC = 16.0;
export const HERB_GARNISH_BONUS = 6;
export const FRESH_SERVE_BONUS = 5;
export const PERFECT_COOK_BONUS = 8;
export const MAX_STREAK_BONUS = 20;
export const VIP_MULTIPLIER = 1.5;

export const GameMode = Object.freeze({
  TITLE: 'title',
  SHIFTS: 'shifts',
  PLAYING: 'playing',
  PAUSED: 'paused',
  RECIPES: 'recipes',
  HELP: 'help',
  RESULTS: 'results',
});

export const ItemStage = Object.freeze({
  RAW: 'raw',
  CHOPPED: 'chopped',
  SEARED: 'seared',
  PERFECT: 'perfect',
  SIMMERED: 'simmered',
});

export const INGREDIENTS = Object.freeze({
  tomato: {
    id: 'tomato',
    name: 'Heirloom Tomato',
    shortName: 'Tomato',
    color: '#e04f3a',
    accent: '#ff8a65',
    needsChop: true,
    searTime: 5.5,
    simmerTime: 6.5,
    canSear: true,
    canSimmer: true,
  },
  mushroom: {
    id: 'mushroom',
    name: 'Forest Mushroom',
    shortName: 'Mushroom',
    color: '#9c744f',
    accent: '#d6b890',
    needsChop: true,
    searTime: 6.5,
    simmerTime: 0,
    canSear: true,
    canSimmer: false,
  },
  shrimp: {
    id: 'shrimp',
    name: 'Tiger Shrimp',
    shortName: 'Shrimp',
    color: '#ef7e56',
    accent: '#ffc3a0',
    needsChop: true,
    searTime: 5.0,
    simmerTime: 0,
    canSear: true,
    canSimmer: false,
  },
  noodles: {
    id: 'noodles',
    name: 'Artisan Noodles',
    shortName: 'Noodles',
    color: '#e5b84b',
    accent: '#fae08c',
    needsChop: false,
    searTime: 0,
    simmerTime: 5.5,
    canSear: false,
    canSimmer: true,
  },
});

export const RECIPES = Object.freeze([
  {
    id: 'bruschetta',
    name: 'Blistered Tomato Toast',
    components: [{ item: 'tomato', stage: 'seared' }],
    price: 22,
    short: 'Seared Tomato + Herbs',
    description: 'Charred heirloom tomatoes glazed on toasted sourdough.',
    badgeColor: '#e04f3a',
  },
  {
    id: 'truffle_skillet',
    name: 'Charred Mushroom Skillet',
    components: [{ item: 'mushroom', stage: 'seared' }],
    price: 26,
    short: 'Seared Mushroom + Herbs',
    description: 'Golden-seared forest mushrooms finished with thyme.',
    badgeColor: '#9c744f',
  },
  {
    id: 'garlic_shrimp',
    name: 'Ember Garlic Shrimp',
    components: [{ item: 'shrimp', stage: 'seared' }],
    price: 28,
    short: 'Seared Shrimp + Herbs',
    description: 'Crispy copper-seared tiger shrimp in herb butter.',
    badgeColor: '#ef7e56',
  },
  {
    id: 'tomato_bisque_noodles',
    name: 'Crimson Broth Noodles',
    components: [
      { item: 'noodles', stage: 'simmered' },
      { item: 'tomato', stage: 'simmered' },
    ],
    price: 40,
    short: 'Simmered Noodles + Tomato Broth',
    description: 'Silky hand-cut noodles steeped in sweet tomato broth.',
    badgeColor: '#d45a38',
  },
  {
    id: 'woodland_ramen',
    name: 'Woodland Hearth Ramen',
    components: [
      { item: 'noodles', stage: 'simmered' },
      { item: 'mushroom', stage: 'seared' },
    ],
    price: 44,
    short: 'Simmered Noodles + Seared Mushroom',
    description: 'Steaming noodle bowl crowned with crispy seared mushrooms.',
    badgeColor: '#b38246',
  },
  {
    id: 'royal_surf_bowl',
    name: 'Royal Ember Seafood Bowl',
    components: [
      { item: 'noodles', stage: 'simmered' },
      { item: 'shrimp', stage: 'seared' },
      { item: 'tomato', stage: 'seared' },
    ],
    price: 64,
    short: 'Noodles + Seared Shrimp + Tomato',
    description: 'Signature three-part bistro bowl with seared shrimp and tomato.',
    badgeColor: '#e28f3d',
  },
]);

export const SHIFTS = Object.freeze([
  {
    id: 0,
    name: 'Bistro Lunch',
    subtitle: 'Steady tickets, warm copper skillets',
    seconds: 180,
    basePatience: 95,
    goal: 180,
    vipChance: 0.15,
    recipePool: [0, 4, 5, 2, 3, 1, 5],
  },
  {
    id: 1,
    name: 'Sunset Rush',
    subtitle: 'Faster guests, more multi-part bowls',
    seconds: 180,
    basePatience: 80,
    goal: 260,
    vipChance: 0.25,
    recipePool: [2, 4, 3, 5, 1, 4, 5],
  },
  {
    id: 2,
    name: "Midnight Chef's Table",
    subtitle: 'High heat, VIP critics & signature orders',
    seconds: 180,
    basePatience: 68,
    goal: 340,
    vipChance: 0.35,
    recipePool: [5, 4, 3, 5, 2, 4, 5],
  },
]);

export const STATIONS = Object.freeze([
  { id: 'prep', x: 250, y: 218, chefX: 250, chefY: 312, key: '5', label: 'Chop Board', group: 'prep' },
  { id: 'pan0', x: 445, y: 218, chefX: 445, chefY: 312, key: '6', label: 'Skillet A', group: 'cook' },
  { id: 'pan1', x: 615, y: 218, chefX: 615, chefY: 312, key: '7', label: 'Skillet B', group: 'cook' },
  { id: 'pot', x: 785, y: 218, chefX: 785, chefY: 312, key: '8', label: 'Broth Pot', group: 'cook' },
  { id: 'plate0', x: 985, y: 218, chefX: 985, chefY: 312, key: '9', label: 'Plate 1', group: 'plate' },
  { id: 'plate1', x: 1145, y: 218, chefX: 1145, chefY: 312, key: '0', label: 'Plate 2', group: 'plate' },
  { id: 'tomato', x: 270, y: 446, chefX: 270, chefY: 334, key: '1', label: 'Tomato', group: 'pantry' },
  { id: 'mushroom', x: 405, y: 446, chefX: 405, chefY: 334, key: '2', label: 'Mushroom', group: 'pantry' },
  { id: 'shrimp', x: 540, y: 446, chefX: 540, chefY: 334, key: '3', label: 'Shrimp', group: 'pantry' },
  { id: 'noodles', x: 675, y: 446, chefX: 675, chefY: 334, key: '4', label: 'Noodles', group: 'pantry' },
  { id: 'herbs', x: 830, y: 446, chefX: 830, chefY: 334, key: 'G', label: 'Herb Finish', group: 'finish' },
  { id: 'serve', x: 1085, y: 446, chefX: 1085, chefY: 334, key: 'Enter', label: 'Serve Pass', group: 'serve' },
]);

export function normalizeStage(stage) {
  return stage === ItemStage.PERFECT ? ItemStage.SEARED : stage;
}

export function findMatchingRecipe(plateComponents) {
  if (!plateComponents.length) return null;
  const sig = plateComponents
    .map((c) => `${c.item}:${normalizeStage(c.stage)}`)
    .sort()
    .join('|');
  return (
    RECIPES.find(
      (r) =>
        r.components
          .map((c) => `${c.item}:${c.stage}`)
          .sort()
          .join('|') === sig
    ) || null
  );
}
