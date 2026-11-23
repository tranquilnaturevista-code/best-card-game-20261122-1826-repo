// Emberfall Duel — boot and the one loop: input is read every frame, the AI
// takes one paced step at a time, and the renderer paints what is there. The game
// moves between five screens: title, play, paused, win and loss.
//
// ?seed=N fixes the deal. ?shot=title|play|win|loss (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot.
import { BEST_KEY, SCREEN_LOSS, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './config.js';
import { createRandom } from './random.js';
import { createWorld } from './world.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_PAUSE, createInput, hitTest } from './input.js';
import { createRenderer, SCREEN_LOSS as RENDER_LOSS, SCREEN_PAUSED as RENDER_PAUSED, SCREEN_PLAY as RENDER_PLAY, SCREEN_TITLE as RENDER_TITLE, SCREEN_WIN as RENDER_WIN } from './render.js';
import { stageShot } from './shots.js';

const AI_STEP_MS = 550;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  const screen = scene.screen === SCREEN_WIN ? RENDER_WIN
    : scene.screen === SCREEN_LOSS ? RENDER_LOSS
    : scene.screen === SCREEN_PLAY ? RENDER_PLAY : RENDER_TITLE;
  let painted = 0;
  function paint() {
    renderer.draw(screen, world.state, { selected: null, hover: null, targeting: null }, 0);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas, (x, y) => renderer.toLogical(x, y));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let selected = null; // { type: 'hand' | 'board', uid } or null
  let targeting = null; // card uid of a spell awaiting a target, or null
  let hover = null; // hit-test result under the pointer, or null
  let aiPending = false;
  let aiNextAt = 0;

  world.reset();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    selected = null;
    targeting = null;
    aiPending = false;
    screen = SCREEN_PLAY;
    announce(`Playing. Turn ${world.state.turn}.`);
  }

  function endGame() {
    screen = world.state.winner === 'player' ? SCREEN_WIN : SCREEN_LOSS;
    if (world.state.winner === 'player' && (best === 0 || world.state.turn < best)) {
      best = world.state.turn;
      saveBest(best);
    }
    announce(world.state.winner === 'player'
      ? `Victory in ${world.state.turn} turns.`
      : `Defeat on turn ${world.state.turn}.`);
  }

  function targetOf(hit) {
    if (hit.type === 'hero-ai') return { side: 'ai', kind: 'hero' };
    if (hit.type === 'hero-player') return { side: 'player', kind: 'hero' };
    if (hit.type === 'board-ai') return { side: 'ai', kind: 'minion', uid: hit.uid };
    return null;
  }

  function handleClick(point) {
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSS) {
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      return;
    }
    if (world.state.winner) {
      endGame();
      return;
    }
    if (world.state.active !== 'player' || aiPending) return;
    const hit = hitTest(world.state, point);
    if (!hit) {
      selected = null;
      targeting = null;
      return;
    }
    if (hit.type === 'end-turn') {
      selected = null;
      targeting = null;
      if (world.endTurn()) {
        aiPending = true;
        aiNextAt = performance.now() + 400;
        announce("Ash Warden's turn.");
      }
      return;
    }
    if (targeting) {
      const target = targetOf(hit);
      if (target) {
        const cardUid = targeting;
        targeting = null;
        selected = null;
        if (world.playCard('player', cardUid, target) && world.state.winner) endGame();
      } else {
        targeting = null;
        selected = null;
      }
      return;
    }
    if (hit.type === 'hand') {
      const card = world.state.player.hand.find((item) => item.uid === hit.uid);
      if (!card) return;
      if (selected && selected.type === 'hand' && selected.uid === card.uid) {
        selected = null;
        return;
      }
      if (!world.canPlay('player', card)) {
        announce('Not enough mana, or the board is full.');
        return;
      }
      selected = { type: 'hand', uid: card.uid };
      if (card.kind === 'creature') {
        if (world.playCard('player', card.uid, null) && world.state.winner) endGame();
        selected = null;
      } else if (card.target === 'any') {
        targeting = card.uid;
        announce(`${card.name}: choose a target.`);
      } else if (card.target === 'self') {
        if (world.playCard('player', card.uid, { side: 'player', kind: 'hero' }) && world.state.winner) endGame();
        selected = null;
      } else {
        if (world.playCard('player', card.uid, null) && world.state.winner) endGame();
        selected = null;
      }
      return;
    }
    if (hit.type === 'board') {
      const minion = world.state.player.board.find((item) => item.uid === hit.uid);
      if (!minion) return;
      if (selected && selected.type === 'board' && selected.uid === minion.uid) {
        selected = null;
        return;
      }
      if (!world.canAttack('player', minion.uid)) {
        announce(`${minion.name} already attacked, or just arrived.`);
        return;
      }
      selected = { type: 'board', uid: minion.uid };
      announce(`${minion.name}: choose a target.`);
      return;
    }
    if (hit.type === 'board-ai' || hit.type === 'hero-ai') {
      if (selected && selected.type === 'board') {
        const target = targetOf(hit);
        const attackerUid = selected.uid;
        selected = null;
        if (world.attack('player', attackerUid, target) && world.state.winner) endGame();
      }
      return;
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & ACTION_PAUSE && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    if (actions & ACTION_END_TURN && screen === SCREEN_PLAY && world.state.active === 'player' && !aiPending) {
      if (world.endTurn()) {
        aiPending = true;
        aiNextAt = performance.now() + 400;
      }
    }
    const click = input.takeClick();
    if (click && (actions & ACTION_CONFIRM)) handleClick(click);
    else if (click) handleClick(click);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const move = input.takeMove();
    if (move && screen === SCREEN_PLAY && world.state.active === 'player' && !aiPending) {
      hover = hitTest(world.state, move);
    } else if (move && screen !== SCREEN_PLAY) {
      hover = null;
    }
    handleActions();
    if (aiPending && now >= aiNextAt) {
      const action = world.aiNextAction();
      if (action) {
        world.applyAiAction(action);
        aiNextAt = now + AI_STEP_MS;
        if (world.state.winner) {
          aiPending = false;
          endGame();
        }
      } else {
        aiPending = false;
        world.startPlayerTurn();
        if (world.state.winner) endGame();
        else announce(`Turn ${world.state.turn}. Your move.`);
      }
    }
    const ui = { selected, hover, targeting };
    renderer.draw(
      screen === SCREEN_WIN ? RENDER_WIN
        : screen === SCREEN_LOSS ? RENDER_LOSS
        : screen === SCREEN_PAUSED ? RENDER_PAUSED
        : screen === SCREEN_TITLE ? RENDER_TITLE : RENDER_PLAY,
      world.state,
      ui,
      best,
    );
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Emberfall Duel. Click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
