import '@fontsource/libre-baskerville/400.css'
import '@fontsource/libre-baskerville/700.css'
import '@fontsource/source-sans-3/400.css'
import '@fontsource/source-sans-3/600.css'
import '@fontsource/source-sans-3/700.css'
import './style.css'
import { GameApp } from './ui/GameApp'

async function boot(): Promise<void> {
  const host = document.querySelector('#app')
  if (!(host instanceof HTMLElement)) return
  try {
    const app = new GameApp(host)
    await app.init()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo abrir la bodega.'
    host.replaceChildren()
    const note = document.createElement('p')
    note.id = 'boot-error'
    note.textContent = `Casillero no pudo partir: ${message}`
    host.appendChild(note)
  }
}

void boot()
