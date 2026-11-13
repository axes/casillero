/** Mulberry32. El estado es un uint32: la misma semilla reproduce la partida. */
export interface RngState {
  s: number
}

export function normalizeSeed(seed: number): number {
  if (!Number.isFinite(seed)) {
    throw new Error('Semilla inválida.')
  }
  return seed >>> 0
}

export function rngFromSeed(seed: number): RngState {
  return { s: normalizeSeed(seed) || 1 }
}

export function nextUint(rng: RngState): { rng: RngState; value: number } {
  const s = (rng.s + 0x6d2b79f5) >>> 0
  let t = Math.imul(s ^ (s >>> 15), 1 | s)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = (t ^ (t >>> 14)) >>> 0
  return { rng: { s }, value }
}

/** Entero inclusivo en [min, max]. */
export function nextInt(rng: RngState, min: number, max: number): { rng: RngState; value: number } {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new Error('Rango de azar inválido.')
  }
  const span = max - min + 1
  const rolled = nextUint(rng)
  return { rng: rolled.rng, value: min + (rolled.value % span) }
}

export function shuffle<T>(rng: RngState, items: readonly T[]): { rng: RngState; items: T[] } {
  const arr = items.slice()
  let state = rng
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const pick = nextInt(state, 0, i)
    state = pick.rng
    const swap = arr[i]
    arr[i] = arr[pick.value] as T
    arr[pick.value] = swap as T
  }
  return { rng: state, items: arr }
}
