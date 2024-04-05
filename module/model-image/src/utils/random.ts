/* eslint-disable no-mixed-operators */
export function rnGen(seed: number) {
    // mulberry32
    // from <https://stackoverflow.com/questions/521295/seeding-the-random-number-generator-in-javascript>

    return function() {
      var t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

export function rnGenInt(seed: number, max: number) {
  const rng = rnGen(seed)

  return function() {
    return Math.floor(rng() * max)
  }
}