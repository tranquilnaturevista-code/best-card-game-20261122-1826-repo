// Emberfall Duel — seeded random numbers, so a seed always deals the same game.
// One job only: deterministic randomness for shuffles and draws.
export function createRandom(seed) {
  let value = (seed >>> 0) || 1;
  function next() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function nextInt(count) {
    return Math.floor(next() * count);
  }
  function shuffle(list) {
    for (let index = list.length - 1; index > 0; index -= 1) {
      const other = nextInt(index + 1);
      const held = list[index];
      list[index] = list[other];
      list[other] = held;
    }
    return list;
  }
  return { next, nextInt, shuffle };
}
