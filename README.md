# Casillero

Entran de noche a las cavas. Cada quien tiene su pasillo de cartas. Roban a la vez, miran, y deciden si se van con lo de esta noche o se quedan a otra ronda. Un 6 y el Diablo los descubre: quienes seguían dentro pierden lo de esa noche. Hasta tres robos por noche, cuatro noches. Desde la segunda, se atacan con cartas ocultas. Gana quien más vino aseguró. Si empatan, se reparten la cava.

Este prototipo sigue las reglas v0.4. Las versiones anteriores quedan en `docs/` para comparar. El título es de trabajo: «Casillero del Diablo» es marca registrada de Viña Concha y Toro.

- Reglas v0.4: [docs/casillero-reglas-v0.4.md](docs/casillero-reglas-v0.4.md)

## Cómo correrlo

Hace falta Node 20 o más nuevo.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Es una mesa local: se pasan el celular cuando una mano o un voto tienen que quedar ocultos. La semilla repite el reparto.

**Sonido / Bajo / Mudo**, arriba a la izquierda, cambia el volumen. El audio es procedural (Web Audio API): no hay samples que atribuir. Si el sistema pide reducir movimiento, las ramas y la vela se mueven menos. El ambiente sube con las rondas que sobreviven y con los dados de más, y llega al clímax cuando sale el 6.

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## Cómo se juega

1. De 3 a 6 jugadores. La bodega tiene 60 cartas y se reparte en pilas personales: 20, 15, 12 o 10.
2. Una cortina «Noche k» muestra los puntos seguros. En la primera, todos parten en 0.
3. Cada noche empieza con un dado compartido. Puede haber hasta tres si sale Ruido, Barrica cae, Guardia, Delación o Alarma. Silencio quita uno, pero no el de la Guardia.
4. En cada ronda, quienes siguen dentro roban a la vez la carta de arriba de su pila. El botín (1, 2 o 3) queda boca arriba. El evento se resuelve al tiro y no se guarda.
5. Si no es la tercera ronda, cada quien decide en secreto: **me voy** (asegura lo de esta noche) o **sigo**. Después se tira el dado. Un 6 corta la noche y quienes seguían dentro pierden ese botín. Sombra, si se jugó, salva al dueño.
6. Tras la tercera ronda sin 6, lo expuesto se asegura solo. No hay cuarta tirada.
7. Desde la Noche 2, al empezar, cada jugador puede jugar una acción o pasar. La mano solo se ve en su turno. Tranca se juega en el acto si te apuntan. Al cerrar cada noche, menos la cuarta, cada quien roba una acción. La mano no pasa de tres.
8. Después de la Noche 4 gana quien más puntos aseguró. El empate se comparte.

## Cómo está armado

- `src/config.ts` tiene los números de v0.4. La vista no los repite.
- `src/engine/` es el motor puro, con semilla. No dibuja ni suena.
- `src/ui/` es la mesa en PixiJS 8. La atmósfera y el audio no entran al motor.
- `tests/` cubre el reparto de pilas, el flujo de ronda y noche, el 6, salir, el cierre automático de la tercera ronda, las cuatro noches, el empate compartido y cada acción.

## Decisiones que el diseño puede cambiar

1. **Empate compartido.** El archivo sugiere desempatar por cartas que quedan en la pila. El diseñador pidió compartir el empate, sin desempate. `tiebreakLeftoverPile` queda en false; si se pone en true, el motor usa esa regla.
2. **Cuatro noches y el 6 se lleva lo expuesto** de quienes seguían dentro. También lo confirmó el diseñador. Quienes ya habían salido conservan lo suyo.
3. **Reparto.** Las 60 cartas se dan en ronda: la primera de cada pila es la primera que esa persona roba.
4. **Eventos del mismo robo** se resuelven desde quien abre la noche, en el sentido de la mesa.
5. **Guardia.** El dado que de verdad se sumó no lo baja Silencio. Si ya había tres dados y Guardia no suma ninguno, no protege un dado viejo.
6. **Pila vacía.** Esa persona no roba y sigue en la noche con lo que ya tenía expuesto. Igual vota.
7. **Tranca** no se juega al empezar la noche. Es reacción y no gasta la acción de ese comienzo. Cancela Saqueo, Quebranto, Trasiego y Vistazo: las dos cartas se descartan. Escondite impide las tres primeras, no el Vistazo.
8. **Sombra** asegura tu botín de la noche si sale 6. Los demás que seguían dentro igual lo pierden.
9. **Saqueo** pasa la botella a tu colección segura, no a lo de esta noche. Al cerrar la noche, las acciones se roban desde quien abrió esa noche.
10. **Si todos salen**, no hay tirada. La noche termina con el botín asegurado.
11. Los contadores del Diablo, la ofrenda y la mancha de v0.3 no están. `offeringThreshold` queda en null.
