// Emberfall Duel — fixed numbers: table size, life, mana, hand and board limits.
// One job only: the constants every other module reads.
export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;
export const STEP = 1 / 60;

export const START_LIFE = 30;
export const MAX_MANA = 10;
export const START_HAND = 3;
export const MAX_HAND = 7;
export const MAX_BOARD = 7;
export const DECK_SIZE = 20;

export const BEST_KEY = 'emberfall-duel-best-turns';

// The four suits. Colour AND shape tell them apart, never text alone.
export const SUITS = {
  ember: { name: 'Ember', color: '#e2483d', dark: '#8f1f16', light: '#ffb199' },
  tide: { name: 'Tide', color: '#2f7fd0', dark: '#144a7d', light: '#a8d4f5' },
  thorn: { name: 'Thorn', color: '#3da35d', dark: '#1d5c31', light: '#a9e6bd' },
  gale: { name: 'Gale', color: '#e8a93c', dark: '#8a5f10', light: '#ffe6a3' },
};

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';
