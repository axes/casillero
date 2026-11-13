import type { GameState } from '../engine'

export interface Screen {
  destroy(): void
  onKey?(event: KeyboardEvent): void
}

/** Lo que las pantallas necesitan de la aplicación, sin importar Pixi al revés. */
export interface TableApi {
  state: GameState | null
  busy: boolean
  names: string[]
  count: number
  seedInput: string
  commit(state: GameState, animate?: boolean): void
  goSetup(): void
  setThreat(level: number): void
  cycleVolume(): void
  volumeLabel: string
}
