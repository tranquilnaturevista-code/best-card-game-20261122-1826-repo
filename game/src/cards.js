// Emberfall Duel — every card in the game and the two 20-card decks.
// One job only: card definitions. No rules live here, only data.
import { SUITS } from './config.js';

// kind: 'creature' fights on the board; 'spell' resolves at once.
// target: null (no target), 'any' (any minion or hero), 'self' (your own hero).
// swift: a Gale creature may attack the turn it is played.
export const CARD_DEFS = {
  'ember-imp': { id: 'ember-imp', name: 'Ember Imp', suit: 'ember', cost: 1, kind: 'creature', attack: 2, health: 1, text: 'Quick spark.' },
  'cinder-pup': { id: 'cinder-pup', name: 'Cinder Pup', suit: 'ember', cost: 2, kind: 'creature', attack: 3, health: 2, text: 'Bites twice.' },
  'flame-drake': { id: 'flame-drake', name: 'Flame Drake', suit: 'ember', cost: 4, kind: 'creature', attack: 5, health: 4, text: 'A small sun.' },
  'tide-sprite': { id: 'tide-sprite', name: 'Tide Sprite', suit: 'tide', cost: 1, kind: 'creature', attack: 1, health: 3, text: 'Calm water.' },
  'reef-guard': { id: 'reef-guard', name: 'Reef Guardian', suit: 'tide', cost: 3, kind: 'creature', attack: 2, health: 5, text: 'Holds the line.' },
  'thorn-sprout': { id: 'thorn-sprout', name: 'Thorn Sprout', suit: 'thorn', cost: 1, kind: 'creature', attack: 2, health: 1, text: 'Grows fast.' },
  'briar-wolf': { id: 'briar-wolf', name: 'Briar Wolf', suit: 'thorn', cost: 2, kind: 'creature', attack: 3, health: 2, text: 'Hunts in pairs.' },
  'oak-sentinel': { id: 'oak-sentinel', name: 'Oak Sentinel', suit: 'thorn', cost: 4, kind: 'creature', attack: 4, health: 6, text: 'Older than war.' },
  'gale-falcon': { id: 'gale-falcon', name: 'Gale Falcon', suit: 'gale', cost: 2, kind: 'creature', attack: 3, health: 1, swift: true, text: 'Swift: attacks at once.' },
  'storm-kite': { id: 'storm-kite', name: 'Storm Kite', suit: 'gale', cost: 3, kind: 'creature', attack: 4, health: 3, swift: true, text: 'Swift: attacks at once.' },
  'ember-burst': { id: 'ember-burst', name: 'Ember Burst', suit: 'ember', cost: 2, kind: 'spell', target: 'any', damage: 3, text: 'Deal 3 damage.' },
  'tide-mend': { id: 'tide-mend', name: 'Tide Mend', suit: 'tide', cost: 2, kind: 'spell', target: 'self', heal: 5, text: 'Restore 5 life.' },
  'thorn-bloom': { id: 'thorn-bloom', name: 'Thorn Bloom', suit: 'thorn', cost: 2, kind: 'spell', target: null, draw: 2, text: 'Draw 2 cards.' },
  'gale-gust': { id: 'gale-gust', name: 'Gale Gust', suit: 'gale', cost: 1, kind: 'spell', target: 'any', damage: 2, text: 'Deal 2 damage.' },
};

export function suitOf(card) {
  return SUITS[card.suit];
}

// The 20-card deck both sides draw from (same list, shuffled per side).
export const DECK_LIST = [
  'ember-imp', 'ember-imp',
  'cinder-pup', 'cinder-pup',
  'flame-drake',
  'tide-sprite', 'tide-sprite',
  'reef-guard',
  'thorn-sprout', 'thorn-sprout',
  'briar-wolf', 'briar-wolf',
  'oak-sentinel',
  'gale-falcon', 'gale-falcon',
  'storm-kite',
  'ember-burst', 'ember-burst',
  'tide-mend',
  'thorn-bloom',
  'gale-gust',
];

let nextUid = 1;

/** A fresh copy of a card definition, with its own id for the board and hand. */
export function makeCard(defId) {
  const def = CARD_DEFS[defId];
  return { uid: nextUid++, defId, ...def };
}

export function resetCardIds() {
  nextUid = 1;
}
