// Emberfall Duel — mouse and keyboard input, hit-tested against the renderer's layout.
// One job only: turn clicks and keys into game actions. It never draws or rules.
import { boardRects, endTurnRect, handRects, heroRect, pointInRect } from './render.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_END_TURN = 4;

/**
 * Find what a logical point touches: a hand card, a board minion, a hero,
 * the End Turn button, or nothing.
 */
export function hitTest(state, point) {
  const hand = handRects(state.player.hand.length);
  for (let index = hand.length - 1; index >= 0; index -= 1) {
    if (pointInRect(point, hand[index])) return { type: 'hand', uid: state.player.hand[index].uid, index };
  }
  const playerBoard = boardRects(state.player.board.length);
  for (let index = 0; index < playerBoard.length; index += 1) {
    const rect = { ...playerBoard[index], y: 402 };
    if (pointInRect(point, rect)) return { type: 'board', uid: state.player.board[index].uid, index };
  }
  const aiBoard = boardRects(state.ai.board.length);
  for (let index = 0; index < aiBoard.length; index += 1) {
    const rect = { ...aiBoard[index], y: 190 };
    if (pointInRect(point, rect)) return { type: 'board-ai', uid: state.ai.board[index].uid, index };
  }
  const aiHero = heroRect('ai');
  const dxAi = point.x - aiHero.x;
  const dyAi = point.y - aiHero.y;
  if (dxAi * dxAi + dyAi * dyAi <= aiHero.r * aiHero.r) return { type: 'hero-ai' };
  const playerHero = heroRect('player');
  const dx = point.x - playerHero.x;
  const dy = point.y - playerHero.y;
  if (dx * dx + dy * dy <= playerHero.r * playerHero.r) return { type: 'hero-player' };
  if (pointInRect(point, endTurnRect())) return { type: 'end-turn' };
  return null;
}

export function createInput(canvas, toLogical) {
  let actions = 0;
  let lastClick = null;
  let lastMove = null;

  function keyToAction(event) {
    if (event.code === 'Space' || event.code === 'Enter') return ACTION_CONFIRM;
    if (event.code === 'Escape' || event.code === 'KeyP') return ACTION_PAUSE;
    if (event.code === 'KeyE') return ACTION_END_TURN;
    return 0;
  }

  window.addEventListener('keydown', (event) => {
    if (event.code === 'Space') event.preventDefault();
    actions |= keyToAction(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    actions |= ACTION_CONFIRM;
    lastClick = toLogical(event.clientX, event.clientY);
  });
  canvas.addEventListener('pointermove', (event) => {
    lastMove = toLogical(event.clientX, event.clientY);
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  function takeActions() {
    const taken = actions;
    actions = 0;
    return taken;
  }
  function takeClick() {
    const click = lastClick;
    lastClick = null;
    return click;
  }
  function takeMove() {
    return lastMove;
  }
  function clearClick() {
    lastClick = null;
  }
  return { takeActions, takeClick, takeMove, clearClick };
}
