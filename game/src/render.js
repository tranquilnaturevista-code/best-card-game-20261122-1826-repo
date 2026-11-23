// Emberfall Duel — everything the player sees: the table, the cards, the screens.
// One job only: drawing. It never changes the rules; it reads state and paints it.
// Layout helpers are exported so input.js hit-tests the same rectangles it draws.
import { SUITS, VIEW_HEIGHT, VIEW_WIDTH } from './config.js';
import { suitOf } from './cards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';

const HAND_W = 118;
const HAND_H = 164;
const BOARD_W = 104;
const BOARD_H = 146;
const BACK_W = 56;
const BACK_H = 78;

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.35);
  ctx.bezierCurveTo(x - size, y - size * 0.5, x - size * 0.45, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.45, y - size, x + size, y - size * 0.5, x, y + size * 0.35);
  ctx.fill();
}

function drawDiamond(ctx, x, y, size, color, filled) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  if (filled) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

/** Suit symbols, drawn as shapes so colour and form both tell the suit apart. */
export function drawSuitSymbol(ctx, suit, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = SUITS[suit].color;
  ctx.strokeStyle = SUITS[suit].color;
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (suit === 'ember') {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.9, -size * 0.1, size * 0.55, size * 0.7, 0, size * 0.9);
    ctx.bezierCurveTo(-size * 0.55, size * 0.7, -size * 0.9, -size * 0.1, 0, -size);
    ctx.fill();
    ctx.fillStyle = '#ffd27a';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.2);
    ctx.bezierCurveTo(size * 0.4, size * 0.25, size * 0.2, size * 0.6, 0, size * 0.65);
    ctx.bezierCurveTo(-size * 0.2, size * 0.6, -size * 0.4, size * 0.25, 0, -size * 0.2);
    ctx.fill();
  } else if (suit === 'tide') {
    for (let row = -1; row <= 1; row += 1) {
      ctx.beginPath();
      ctx.moveTo(-size, row * size * 0.55);
      ctx.quadraticCurveTo(-size * 0.5, row * size * 0.55 - size * 0.55, 0, row * size * 0.55);
      ctx.quadraticCurveTo(size * 0.5, row * size * 0.55 + size * 0.55, size, row * size * 0.55);
      ctx.stroke();
    }
  } else if (suit === 'thorn') {
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.quadraticCurveTo(size, -size * 0.4, size * 0.45, size * 0.7);
    ctx.quadraticCurveTo(-size * 0.3, size * 0.9, -size * 0.75, size * 0.2);
    ctx.quadraticCurveTo(-size * 0.7, -size * 0.6, 0, -size);
    ctx.fill();
    ctx.strokeStyle = '#1d5c31';
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.7);
    ctx.lineTo(0, size * 0.8);
    ctx.stroke();
  } else {
    for (let row = -1; row <= 1; row += 1) {
      ctx.beginPath();
      ctx.arc(0, row * size * 0.5, size * 0.55, Math.PI * 0.15, Math.PI * 1.15);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---- Layout: the same rectangles the renderer draws and input hit-tests. ----
export function handRects(count) {
  // Fan the hand inside a fixed band so it never covers the mana row.
  const overlap = count > 1 ? Math.max(0, Math.min(48, (count * HAND_W - 540) / Math.max(1, count - 1))) : 0;
  const total = count * HAND_W - Math.max(0, count - 1) * overlap;
  const startX = (VIEW_WIDTH - total) / 2;
  const rects = [];
  for (let index = 0; index < count; index += 1) {
    rects.push({ x: startX + index * (HAND_W - overlap), y: VIEW_HEIGHT - HAND_H - 12, w: HAND_W, h: HAND_H });
  }
  return rects;
}

export function boardRects(count) {
  const gap = 14;
  const total = count * BOARD_W + Math.max(0, count - 1) * gap;
  const startX = (VIEW_WIDTH - total) / 2;
  const rects = [];
  for (let index = 0; index < count; index += 1) {
    rects.push({ x: startX + index * (BOARD_W + gap), w: BOARD_W, h: BOARD_H });
  }
  return rects;
}

export function heroRect(side) {
  return side === 'ai'
    ? { x: 56, y: 44, r: 40 }
    : { x: 56, y: VIEW_HEIGHT - 116, r: 40 };
}

export function endTurnRect() {
  return { x: VIEW_WIDTH - 168, y: VIEW_HEIGHT - 108, w: 132, h: 52 };
}

export function pointInRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

// ---- Card painting ----
function drawCardFace(ctx, card, x, y, w, h, options) {
  const suit = suitOf(card);
  const lift = options.lift || 0;
  const yy = y - lift;
  ctx.save();
  if (options.dimmed) ctx.globalAlpha = 0.55;
  if (options.glow) {
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = 18;
  }
  roundRect(ctx, x, yy, w, h, 10);
  ctx.fillStyle = '#f7efdc';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = options.selected ? '#ffd24a' : suit.color;
  ctx.stroke();
  // Suit band.
  ctx.save();
  roundRect(ctx, x, yy, w, 26, 10);
  ctx.clip();
  ctx.fillStyle = suit.color;
  ctx.fillRect(x, yy, w, 26);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(suit.name.toUpperCase(), x + w / 2, yy + 14);
  // Cost gem, on the suit band's corner so it never covers the name.
  ctx.beginPath();
  ctx.arc(x + 15, yy + 13, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#3a6fd8';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#dfe9ff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(String(card.cost), x + 15, yy + 14);
  // Name.
  ctx.fillStyle = '#241a10';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(card.name, x + w / 2, yy + 44);
  // Suit symbol.
  drawSuitSymbol(ctx, card.suit, x + w / 2, yy + h * 0.52, Math.min(26, w * 0.2));
  // Text.
  ctx.fillStyle = '#5a4a33';
  ctx.font = 'italic 11px system-ui, sans-serif';
  const words = (card.text || '').split(' ').filter(Boolean);
  let line = '';
  let lineY = yy + h - 34;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > w - 16 && line) {
      ctx.fillText(line, x + w / 2, lineY);
      line = word;
      lineY += 13;
    } else line = test;
  }
  if (line) ctx.fillText(line, x + w / 2, lineY);
  // Creature stats.
  if (card.kind === 'creature') {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c2571b';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(String(card.attack), x + 10, yy + h - 12);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#b01e24';
    ctx.fillText(String(card.health), x + w - 10, yy + h - 12);
    ctx.textAlign = 'center';
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = '#274b73';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#c9a227';
  ctx.stroke();
  drawDiamond(ctx, x + w / 2, y + h / 2, Math.min(w, h) * 0.22, '#c9a227', true);
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x + 5, y + 5, w - 10, h - 10, 6);
  ctx.stroke();
}

function drawMana(ctx, mana, maxMana, x, y) {
  ctx.fillStyle = '#dfe9ff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('MANA', x, y);
  for (let index = 0; index < 10; index += 1) {
    const cx = x + 52 + index * 16;
    const filled = index < mana;
    const shown = index < maxMana;
    drawDiamond(ctx, cx, y, 7, filled ? '#3a6fd8' : '#5a6a86', filled);
    if (!shown) {
      ctx.globalAlpha = 0.35;
      drawDiamond(ctx, cx, y, 7, '#5a6a86', false);
      ctx.globalAlpha = 1;
    }
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`${mana}/${maxMana}`, x + 52 + 10 * 16 + 6, y);
}

function drawHero(ctx, side, life, maxLife, x, y, r, label, color, letter) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#e8c96a';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${r * 0.9}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, x, y + 2);
  ctx.restore();
  // Life bar.
  const barX = x + r + 14;
  const barW = 150;
  const barY = y - 14;
  ctx.fillStyle = '#1c1c22';
  roundRect(ctx, barX, barY, barW, 20, 6);
  ctx.fill();
  ctx.fillStyle = '#c0392b';
  const frac = Math.max(0, life / maxLife);
  if (frac > 0) {
    roundRect(ctx, barX + 2, barY + 2, (barW - 4) * frac, 16, 5);
    ctx.fill();
  }
  drawHeart(ctx, barX + barW + 16, barY + 10, 9, '#e2483d');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.max(0, life)}`, barX + barW + 30, barY + 11);
  ctx.fillStyle = '#e8dcc0';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(label, barX, barY + 34);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fitCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth || VIEW_WIDTH;
    const height = canvas.clientHeight || VIEW_HEIGHT;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(width / VIEW_WIDTH, height / VIEW_HEIGHT);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (width - VIEW_WIDTH * scale) / 2, dpr * (height - VIEW_HEIGHT * scale) / 2);
    return scale;
  }

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / VIEW_WIDTH, rect.height / VIEW_HEIGHT);
    const offsetX = (rect.width - VIEW_WIDTH * scale) / 2;
    const offsetY = (rect.height - VIEW_HEIGHT * scale) / 2;
    return { x: (clientX - rect.left - offsetX) / scale, y: (clientY - rect.top - offsetY) / scale };
  }

  function drawTable() {
    const gradient = ctx.createRadialGradient(640, 380, 80, 640, 400, 900);
    gradient.addColorStop(0, '#2c5a44');
    gradient.addColorStop(0.6, '#224739');
    gradient.addColorStop(1, '#152e26');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 4;
    roundRect(ctx, 10, 10, VIEW_WIDTH - 20, VIEW_HEIGHT - 20, 18);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201,162,39,0.25)';
    ctx.lineWidth = 1;
    roundRect(ctx, 22, 22, VIEW_WIDTH - 44, VIEW_HEIGHT - 44, 12);
    ctx.stroke();
  }

  function drawBoard(state, ui) {
    const player = state.player;
    const ai = state.ai;
    // Opponent hand (face down) with count.
    const backCount = ai.hand.length;
    const backTotal = backCount * BACK_W - Math.max(0, backCount - 1) * 30;
    let backX = (VIEW_WIDTH - backTotal) / 2;
    for (let index = 0; index < backCount; index += 1) {
      drawCardBack(ctx, backX, 30, BACK_W, BACK_H);
      backX += BACK_W - 30;
    }
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Ash Warden's hand: ${backCount} cards`, VIEW_WIDTH / 2, 128);
    // Heroes.
    const aiHero = heroRect('ai');
    drawHero(ctx, 'ai', ai.life, ai.maxLife, aiHero.x, aiHero.y, aiHero.r, 'ASH WARDEN', '#7a2a20', 'A');
    drawMana(ctx, ai.mana, ai.maxMana, 220, 96);
    const playerHero = heroRect('player');
    drawHero(ctx, 'player', player.life, player.maxLife, playerHero.x, playerHero.y, playerHero.r, 'YOU', '#1f6f5c', 'Y');
    drawMana(ctx, player.mana, player.maxMana, 108, VIEW_HEIGHT - 64);
    // Board rows.
    const aiRects = boardRects(ai.board.length);
    ai.board.forEach((minion, index) => {
      const rect = aiRects[index];
      const targeted = ui.targeting && ui.hover && ui.hover.type === 'board-ai' && ui.hover.uid === minion.uid;
      drawCardFace(ctx, minion, rect.x, 190, rect.w, rect.h, {
        glow: targeted ? '#ffd24a' : (ui.selected && ui.selected.type === 'board' ? '#ffd24a' : null),
        dimmed: false,
      });
      if (!minion.canAttack) {
        ctx.fillStyle = 'rgba(20,20,30,0.25)';
        roundRect(ctx, rect.x, 190, rect.w, rect.h, 10);
        ctx.fill();
      }
    });
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— ASH WARDEN —', VIEW_WIDTH / 2, 178);
    ctx.fillText('— YOUR CREATURES —', VIEW_WIDTH / 2, 392);
    const playerRects = boardRects(player.board.length);
    player.board.forEach((minion, index) => {
      const rect = playerRects[index];
      const isSelected = ui.selected && ui.selected.type === 'board' && ui.selected.uid === minion.uid;
      const hovered = ui.hover && ui.hover.type === 'board' && ui.hover.uid === minion.uid;
      drawCardFace(ctx, minion, rect.x, 402, rect.w, rect.h, {
        glow: isSelected ? '#ffd24a' : (minion.canAttack && state.active === 'player' ? '#7ee2a8' : null),
        lift: hovered ? 8 : 0,
      });
    });
    // Player hand.
    const hand = handRects(player.hand.length);
    player.hand.forEach((card, index) => {
      const rect = hand[index];
      const isSelected = ui.selected && ui.selected.type === 'hand' && ui.selected.uid === card.uid;
      const hovered = ui.hover && ui.hover.type === 'hand' && ui.hover.uid === card.uid;
      const playable = state.active === 'player' && player.mana >= card.cost && !(card.kind === 'creature' && player.board.length >= 7);
      drawCardFace(ctx, card, rect.x, rect.y, rect.w, rect.h, {
        lift: hovered || isSelected ? 22 : 0,
        selected: isSelected,
        glow: isSelected ? '#ffd24a' : null,
        dimmed: !playable && state.active === 'player',
      });
    });
    // End Turn button.
    const button = endTurnRect();
    const active = state.active === 'player' && !state.winner;
    roundRect(ctx, button.x, button.y, button.w, button.h, 10);
    ctx.fillStyle = active ? '#c9a227' : '#5a5a5a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fff2c0';
    ctx.stroke();
    ctx.fillStyle = active ? '#241a10' : '#cfcfcf';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.active === 'ai' ? 'ASH WARDEN…' : 'END TURN', button.x + button.w / 2, button.y + button.h / 2 + 1);
    // Turn + log (the log hides once the duel is over, so it never ghosts
    // through the victory/defeat overlay).
    ctx.fillStyle = '#e8dcc0';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(`TURN ${Math.max(1, state.turn)}`, VIEW_WIDTH - 102, 620);
    if (!state.winner) {
      const lastLog = state.log[state.log.length - 1] || '';
      ctx.font = 'italic 14px system-ui, sans-serif';
      ctx.fillStyle = '#d8cfae';
      ctx.fillText(lastLog, VIEW_WIDTH / 2, 372);
    }
    // Targeting hint.
    if (ui.targeting) {
      ctx.fillStyle = '#ffd24a';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText('Choose a target: click an enemy, or a hero.', VIEW_WIDTH / 2, 352);
    }
  }

  function drawTitle(best) {
    ctx.fillStyle = 'rgba(10, 16, 12, 0.82)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    // Decorative fanned cards.
    const deco = [
      { defId: 'flame-drake', name: 'Flame Drake', suit: 'ember', cost: 4, kind: 'creature', attack: 5, health: 4, text: 'A small sun.' },
      { defId: 'reef-guard', name: 'Reef Guardian', suit: 'tide', cost: 3, kind: 'creature', attack: 2, health: 5, text: 'Holds the line.' },
      { defId: 'storm-kite', name: 'Storm Kite', suit: 'gale', cost: 3, kind: 'creature', attack: 4, health: 3, swift: true, text: 'Swift: attacks at once.' },
    ];
    ctx.save();
    ctx.translate(VIEW_WIDTH / 2, 300);
    deco.forEach((card, index) => {
      ctx.save();
      ctx.translate((index - 1) * 150, Math.abs(index - 1) * 14);
      ctx.rotate((index - 1) * 0.12);
      drawCardFace(ctx, card, -59, -82, HAND_W, HAND_H, {});
      ctx.restore();
    });
    ctx.restore();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8c96a';
    ctx.font = 'bold 84px Georgia, serif';
    ctx.fillText('EMBERFALL', VIEW_WIDTH / 2, 500);
    ctx.font = 'bold 44px Georgia, serif';
    ctx.fillStyle = '#f7efdc';
    ctx.fillText('— D U E L —', VIEW_WIDTH / 2, 556);
    ctx.font = 'italic 20px Georgia, serif';
    ctx.fillStyle = '#d8cfae';
    ctx.fillText('Four suits. One ember. Outplay the Ash Warden.', VIEW_WIDTH / 2, 596);
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd24a';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('CLICK TO START', VIEW_WIDTH / 2, 664);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#b8ac8a';
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillText('Play cards with mana · Attack with your creatures · Reduce the Ash Warden to 0 life', VIEW_WIDTH / 2, 706);
    if (best) {
      ctx.fillStyle = '#7ee2a8';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillText(`Best victory: ${best} turns`, VIEW_WIDTH / 2, 740);
    }
  }

  function drawEndOverlay(win, state) {
    ctx.fillStyle = win ? 'rgba(60, 44, 4, 0.88)' : 'rgba(30, 6, 6, 0.88)';
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
    ctx.textAlign = 'center';
    ctx.fillStyle = win ? '#ffd24a' : '#ff8a7a';
    ctx.font = 'bold 76px Georgia, serif';
    ctx.fillText(win ? 'VICTORY!' : 'DEFEAT', VIEW_WIDTH / 2, 330);
    ctx.fillStyle = '#f7efdc';
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText(
      win ? 'The Ash Warden falls. Your ember burns brightest.' : 'The Ash Warden wins this duel. Your ember goes out.',
      VIEW_WIDTH / 2, 386,
    );
    ctx.fillStyle = '#d8cfae';
    ctx.font = '18px system-ui, sans-serif';
    ctx.fillText(`Turns: ${state.turn}   ·   Cards played: ${state.stats.cardsPlayed}   ·   Damage dealt: ${state.stats.damageDealt}`, VIEW_WIDTH / 2, 440);
    const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ffd24a';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('CLICK TO PLAY AGAIN', VIEW_WIDTH / 2, 520);
    ctx.globalAlpha = 1;
  }

  function draw(screen, state, ui, best) {
    fitCanvas();
    ctx.textBaseline = 'middle';
    drawTable();
    if (screen === SCREEN_TITLE) {
      drawTitle(best);
      return;
    }
    drawBoard(state, ui);
    if (screen === SCREEN_WIN) drawEndOverlay(true, state);
    else if (screen === SCREEN_LOSS) drawEndOverlay(false, state);
    else if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(10, 16, 12, 0.7)';
      ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
      ctx.fillStyle = '#f7efdc';
      ctx.font = 'bold 48px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', VIEW_WIDTH / 2, 380);
      ctx.font = '18px system-ui, sans-serif';
      ctx.fillText('Press Space or click to continue.', VIEW_WIDTH / 2, 430);
    }
  }

  return { draw, toLogical };
}
