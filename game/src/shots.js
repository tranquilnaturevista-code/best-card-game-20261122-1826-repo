// Emberfall Duel — the screenshot scenes behind ?shot=title|play|win|loss.
// One job only: stage a real game state for each screenshot. Every scene plays the
// real rules forward from a fresh world with a fixed seed, steered by a simple
// autopilot, so the frame is what a short game really looks like and the same
// seed always gives the same frame.
import { SCREEN_LOSS, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const MAX_TURNS = 60;

/** The autopilot's one move: play the best card it can, then attack face. */
function autopilotMove(world, side, style) {
  const me = world.state[side];
  const foeSide = side === 'player' ? 'ai' : 'player';
  const foe = world.state[foeSide];
  if (style === 'passive') return false;
  // Play creatures first, most expensive first.
  const creatures = me.hand.filter((card) => card.kind === 'creature' && world.canPlay(side, card));
  if (creatures.length > 0 && me.board.length < 7) {
    creatures.sort((a, b) => b.cost - a.cost);
    return world.playCard(side, creatures[0].uid, null);
  }
  // Spells: lethal first, then heal when hurt, draw when thin, else face damage.
  const spells = me.hand.filter((card) => card.kind === 'spell' && world.canPlay(side, card));
  for (const card of spells) {
    if (card.damage && foe.life <= card.damage) return world.playCard(side, card.uid, { side: foeSide, kind: 'hero' });
  }
  for (const card of spells) {
    if (card.heal && me.life <= 15) return world.playCard(side, card.uid, { side, kind: 'hero' });
    if (card.draw && me.hand.length <= 3) return world.playCard(side, card.uid, null);
  }
  for (const card of spells) {
    if (card.damage) {
      const big = foe.board.slice().sort((a, b) => b.attack - a.attack)[0];
      if (big && big.attack >= 4) return world.playCard(side, card.uid, { side: foeSide, kind: 'minion', uid: big.uid });
      return world.playCard(side, card.uid, { side: foeSide, kind: 'hero' });
    }
  }
  // Attack with every ready minion, at the enemy hero.
  const ready = me.board.filter((minion) => minion.canAttack);
  if (ready.length > 0) return world.attack(side, ready[0].uid, { side: foeSide, kind: 'hero' });
  return false;
}

/** Play one full side's turn with the given style ('aggro' or 'passive'). */
function playSideTurn(world, side, style) {
  let guard = 0;
  while (autopilotMove(world, side, style) && guard < 40) guard += 1;
}

/**
 * Set `world` to the named scene (title, play, win or loss; any other name is
 * title) and return the screen to draw over it.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'win' && name !== 'loss') {
    return { screen: SCREEN_TITLE };
  }
  if (name === 'play') {
    // A real mid-game: both sides trade for four turns, then stop at the
    // start of the player's fifth turn, hands full and boards alive.
    for (let turn = 0; turn < 4 && !world.state.winner; turn += 1) {
      playSideTurn(world, 'player', 'aggro');
      if (world.state.winner) break;
      world.endTurn();
      playSideTurn(world, 'ai', 'aggro');
      if (world.state.winner) break;
      world.startPlayerTurn();
    }
    return { screen: SCREEN_PLAY };
  }
  const playerStyle = name === 'win' ? 'aggro' : 'passive';
  const aiStyle = name === 'win' ? 'passive' : 'aggro';
  for (let turn = 0; turn < MAX_TURNS && !world.state.winner; turn += 1) {
    playSideTurn(world, 'player', playerStyle);
    if (world.state.winner) break;
    world.endTurn();
    playSideTurn(world, 'ai', aiStyle);
    if (world.state.winner) break;
    world.startPlayerTurn();
  }
  const won = world.state.winner === 'player';
  return { screen: won ? SCREEN_WIN : SCREEN_LOSS };
}
