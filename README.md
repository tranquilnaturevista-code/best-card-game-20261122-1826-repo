# Emberfall Duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/tranquilnaturevista-code/best-card-game-20261122-1826-repo/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/tranquilnaturevista-code/best-card-game-20261122-1826-repo/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Emberfall Duel** — a turn-based card duel for the [make.fun best card game bounty](https://make.fun/bounty/best-card-game-20261122-1826). You play creatures and spells with mana against the Ash Warden, an AI that plays and attacks on its own turn. First to 0 life loses.

## The game

Four original suits, told apart by colour **and** shape:

- **Ember** (red flame) — aggressive creatures and direct damage
- **Tide** (blue wave) — tough guardians, healing and card draw
- **Thorn** (green leaf) — sturdy mid-range creatures
- **Gale** (gold gust) — Swift creatures that attack the turn they are played

Each turn your mana grows by one (up to 10) and refills; you draw a card, play what you can afford, and attack with creatures that are ready. Spells need a target: Ember Burst and Gale Gust hit any minion or hero, Tide Mend heals you, Thorn Bloom draws two cards.

## How to play

Serve the game locally and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080
```

- Click a card in your hand to play it (creatures join your board; spells ask for a target).
- Click one of your ready creatures, then click an enemy creature or the Ash Warden to attack.
- Click **END TURN** (or press `E`) to let the Ash Warden play.
- `Space` pauses, `Esc` deselects. Click the title screen to start; click the victory or defeat screen to play again.

The game is plain static files under `game/` — no build step, no network request.

## Layout

- `game/index.html` — the page; `game/src/main.js` boots the loop
- `game/src/config.js` — constants and the four suits
- `game/src/random.js` — seeded randomness (a seed always deals the same game)
- `game/src/cards.js` — every card and the 20-card deck
- `game/src/world.js` — the rules: turns, mana, playing, attacking, the AI
- `game/src/input.js` — mouse and keyboard, hit-tested on the layout
- `game/src/render.js` — the table, the cards, the screens
- `game/src/shots.js` — the staged screenshot scenes (`?shot=title|play|win|loss`)
- `main.ts` — hands the game in: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `screenshots/` — 4 real renders of the game's own code: title, table, victory, defeat

## License

MIT — see [LICENSE](LICENSE).
