// Emberfall Duel — the rules: turns, mana, playing cards, attacking, the AI.
// One job only: the game state and what a move does to it. No drawing, no input.
// Everything here is synchronous and deterministic, so screenshots can play a
// whole game forward from a seed and the live loop can step the AI one move at a time.
import { MAX_BOARD, MAX_HAND, MAX_MANA, START_HAND, START_LIFE } from './config.js';
import { DECK_LIST, makeCard, resetCardIds } from './cards.js';

function makeSide(name) {
  return {
    name,
    life: START_LIFE,
    maxLife: START_LIFE,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    board: [],
    fatigue: 0,
  };
}

function drawCard(side, log, who) {
  if (side.deck.length === 0) {
    side.fatigue += 1;
    side.life -= side.fatigue;
    log.push(`${who} is out of cards and takes ${side.fatigue} fatigue.`);
    checkWinner(world);
    return;
  }
  if (side.hand.length >= MAX_HAND) {
    side.deck.pop();
    log.push(`${who}'s hand is full; a card is burned.`);
    return;
  }
  side.hand.push(side.deck.pop());
}

function startTurn(world, side, who) {
  const me = world[side];
  me.maxMana = Math.min(MAX_MANA, me.maxMana + 1);
  me.mana = me.maxMana;
  me.board.forEach((minion) => { minion.canAttack = true; });
  drawCard(me, world.log, who);
  world.turn += side === 'player' ? 1 : 0;
}

function removeDead(world, side) {
  const me = world[side];
  me.board = me.board.filter((minion) => {
    if (minion.health > 0) return true;
    world.log.push(`${minion.name} falls.`);
    return false;
  });
}

function checkWinner(world) {
  if (world.winner) return;
  if (world.ai.life <= 0) {
    world.winner = 'player';
    world.log.push('The Ash Warden falls. Victory!');
  } else if (world.player.life <= 0) {
    world.winner = 'ai';
    world.log.push('Your ember goes out. Defeat.');
  }
}

/** A target is { side: 'player' | 'ai', kind: 'hero' | 'minion', uid?: number }. */
export function resolveTarget(world, target) {
  if (!target) return null;
  if (target.kind === 'hero') return { side: target.side, kind: 'hero' };
  const board = world[target.side].board;
  const minion = board.find((item) => item.uid === target.uid);
  return minion ? { side: target.side, kind: 'minion', minion } : null;
}

function dealDamage(world, target, amount, sourceName) {
  const found = resolveTarget(world, target);
  if (!found) return false;
  if (found.kind === 'hero') {
    world[found.side].life -= amount;
    world.log.push(`${sourceName} deals ${amount} to ${found.side === 'ai' ? 'the Ash Warden' : 'you'}.`);
  } else {
    found.minion.health -= amount;
    world.log.push(`${sourceName} deals ${amount} to ${found.minion.name}.`);
    removeDead(world, found.side);
  }
  checkWinner(world);
  return true;
}

export function createWorld(random) {
  const world = {
    random,
    turn: 0,
    active: 'player',
    player: makeSide('You'),
    ai: makeSide('Ash Warden'),
    log: [],
    winner: null,
    stats: { cardsPlayed: 0, damageDealt: 0, turnsPlayed: 0 },
  };

  function reset(seed) {
    resetCardIds();
    world.turn = 0;
    world.active = 'player';
    world.player = makeSide('You');
    world.ai = makeSide('Ash Warden');
    world.log = [];
    world.winner = null;
    world.stats = { cardsPlayed: 0, damageDealt: 0, turnsPlayed: 0 };
    const rng = random;
    for (const side of [world.player, world.ai]) {
      side.deck = rng.shuffle(DECK_LIST.map((defId) => makeCard(defId)));
      for (let index = 0; index < START_HAND; index += 1) side.hand.push(side.deck.pop());
    }
    startTurn(world, 'player', 'You');
    world.log.push('The duel begins. Your move.');
  }

  /** Legal targets for a card in hand (null when the card needs none). */
  function legalTargets(card) {
    if (card.kind === 'creature') return null;
    if (card.target === 'self') return [{ side: 'player', kind: 'hero' }];
    if (card.target === 'any') {
      const targets = [{ side: 'ai', kind: 'hero' }, { side: 'player', kind: 'hero' }];
      world.ai.board.forEach((minion) => targets.push({ side: 'ai', kind: 'minion', uid: minion.uid }));
      world.player.board.forEach((minion) => targets.push({ side: 'player', kind: 'minion', uid: minion.uid }));
      return targets;
    }
    return null;
  }

  function canPlay(side, card) {
    const me = world[side];
    if (world.winner || world.active !== side) return false;
    if (me.mana < card.cost) return false;
    if (card.kind === 'creature' && me.board.length >= MAX_BOARD) return false;
    return true;
  }

  /** Play a card from a hand. `target` is only needed for targeted spells. */
  function playCard(side, cardUid, target) {
    const me = world[side];
    const index = me.hand.findIndex((card) => card.uid === cardUid);
    if (index === -1) return false;
    const card = me.hand[index];
    if (!canPlay(side, card)) return false;
    if (card.kind === 'spell' && card.target === 'any' && !resolveTarget(world, target)) return false;
    me.hand.splice(index, 1);
    me.mana -= card.cost;
    world.stats.cardsPlayed += 1;
    const who = side === 'player' ? 'You play' : 'Ash Warden plays';
    if (card.kind === 'creature') {
      me.board.push({
        uid: card.uid, defId: card.defId, name: card.name, suit: card.suit,
        cost: card.cost, text: card.text,
        attack: card.attack, health: card.health, maxHealth: card.health,
        swift: !!card.swift, canAttack: !!card.swift,
      });
      world.log.push(`${who} ${card.name}.`);
      return true;
    }
    world.log.push(`${who} ${card.name}.`);
    if (card.damage) {
      if (side === 'player') world.stats.damageDealt += card.damage;
      dealDamage(world, target, card.damage, card.name);
    }
    if (card.heal) {
      me.life = Math.min(me.maxLife, me.life + card.heal);
      world.log.push(`${who === 'You play' ? 'You restore' : 'Ash Warden restores'} ${card.heal} life.`);
    }
    if (card.draw) {
      for (let count = 0; count < card.draw; count += 1) drawCard(me, world.log, who === 'You play' ? 'You' : 'Ash Warden');
    }
    checkWinner(world);
    return true;
  }

  function canAttack(side, minionUid) {
    if (world.winner || world.active !== side) return false;
    const minion = world[side].board.find((item) => item.uid === minionUid);
    return !!minion && minion.canAttack;
  }

  /** A minion strikes a hero or an enemy minion. */
  function attack(side, minionUid, target) {
    const me = world[side];
    const foe = side === 'player' ? 'ai' : 'player';
    const minion = me.board.find((item) => item.uid === minionUid);
    if (!minion || !minion.canAttack || world.winner || world.active !== side) return false;
    const found = resolveTarget(world, target);
    if (!found || found.side !== foe) return false;
    minion.canAttack = false;
    if (found.kind === 'hero') {
      world[foe].life -= minion.attack;
      if (side === 'player') world.stats.damageDealt += minion.attack;
      world.log.push(`${minion.name} hits ${foe === 'ai' ? 'the Ash Warden' : 'you'} for ${minion.attack}.`);
    } else {
      found.minion.health -= minion.attack;
      minion.health -= found.minion.attack;
      world.log.push(`${minion.name} trades with ${found.minion.name}.`);
      removeDead(world, foe);
      removeDead(world, side);
    }
    checkWinner(world);
    return true;
  }

  /** End the player's turn; the AI then moves one action at a time via aiNextAction. */
  function endTurn() {
    if (world.winner || world.active !== 'player') return false;
    world.active = 'ai';
    world.ai.maxMana = Math.min(MAX_MANA, world.ai.maxMana + 1);
    world.ai.mana = world.ai.maxMana;
    world.ai.board.forEach((minion) => { minion.canAttack = true; });
    drawCard(world.ai, world.log, 'Ash Warden');
    world.log.push("Ash Warden's turn.");
    return true;
  }

  function startPlayerTurn() {
    world.active = 'player';
    world.stats.turnsPlayed += 1;
    startTurn(world, 'player', 'You');
    world.log.push(`Turn ${world.turn}. Your move.`);
  }

  // ---- The AI: one greedy move at a time, so the live loop can pace it. ----
  function aiNextAction() {
    if (world.winner || world.active !== 'ai') return null;
    const me = world.ai;
    const foe = world.player;
    // 1. Play the most expensive creature we can afford.
    const creatures = me.hand.filter((card) => card.kind === 'creature' && canPlay('ai', card));
    if (creatures.length > 0 && me.board.length < MAX_BOARD) {
      creatures.sort((a, b) => b.cost - a.cost);
      return { type: 'play', cardUid: creatures[0].uid, target: null };
    }
    // 2. Spells: finish the player, heal when hurt, draw when the hand is thin.
    const spells = me.hand.filter((card) => card.kind === 'spell' && canPlay('ai', card));
    for (const card of spells) {
      if (card.damage && foe.life <= card.damage) return { type: 'play', cardUid: card.uid, target: { side: 'player', kind: 'hero' } };
    }
    for (const card of spells) {
      if (card.heal && me.life <= 15) return { type: 'play', cardUid: card.uid, target: { side: 'ai', kind: 'hero' } };
      if (card.draw && me.hand.length <= 3) return { type: 'play', cardUid: card.uid, target: null };
    }
    for (const card of spells) {
      if (card.damage) {
        const big = foe.board.slice().sort((a, b) => b.attack - a.attack)[0];
        if (big && big.attack >= 4) return { type: 'play', cardUid: card.uid, target: { side: 'player', kind: 'minion', uid: big.uid } };
        return { type: 'play', cardUid: card.uid, target: { side: 'player', kind: 'hero' } };
      }
    }
    // 3. Attack: trade up when a foe minion would kill us next, else go face.
    const ready = me.board.filter((minion) => minion.canAttack);
    for (const minion of ready) {
      const threat = foe.board.find((enemy) => enemy.attack >= minion.health && minion.attack >= enemy.health);
      if (threat) return { type: 'attack', minionUid: minion.uid, target: { side: 'player', kind: 'minion', uid: threat.uid } };
    }
    if (ready.length > 0) return { type: 'attack', minionUid: ready[0].uid, target: { side: 'player', kind: 'hero' } };
    return null;
  }

  function applyAiAction(action) {
    if (!action) return false;
    if (action.type === 'play') return playCard('ai', action.cardUid, action.target);
    if (action.type === 'attack') return attack('ai', action.minionUid, action.target);
    return false;
  }

  return {
    state: world,
    reset,
    legalTargets,
    canPlay,
    playCard,
    canAttack,
    attack,
    endTurn,
    startPlayerTurn,
    aiNextAction,
    applyAiAction,
  };
}
