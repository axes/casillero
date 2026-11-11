# Casillero

Entran juntos a la bodega, roban vino y tienen que salir antes del 666. La primera incursión la cubre una vela: el primer 6 la apaga y no bloquea un dado. Después se baja más hondo, la botella vale más y el Diablo ya está escuchando. El grupo necesita **20 puntos** entre todos. Gana quien más aseguró en su colección, si el Diablo no lo manchó en la última incursión.

Este repositorio es el primer prototipo digital de las reglas v0.2. La mesa de verdad sigue siendo el lugar donde se afina. El título es de trabajo: «Casillero del Diablo» es marca registrada de Viña Concha y Toro.

Las reglas completas están en [docs/casillero-reglas-v0.2.md](docs/casillero-reglas-v0.2.md).

## Cómo correrlo

Hace falta Node 20 o más nuevo.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Es una mesa local, en el mismo computador: se pasan el celular o se sientan juntos frente a la pantalla. No hay servidor ni cuentas.

Otros comandos:

```bash
npm test       # motor de reglas, Vitest
npm run lint   # ESLint
npm run typecheck
npm run build  # typecheck + Vite
```

## Cómo se juega

1. Elijan de 3 a 6 nombres y, si quieren repetir la misma partida, una semilla. Si la dejan vacía, se arma una al azar y queda escrita arriba durante la partida.
2. La partida tiene tres incursiones: **Las tinajas** (×1, con vela), **Las cavas** (×2) y **La sacristía** (×3, ya entra un 6 bloqueado).
3. En cada saqueo, quien tiene el turno roba **una** botella a su botín expuesto y tira solo los dados que siguen libres. Todo 6 natural se bloquea y no se vuelve a tirar en esa incursión.
4. La amenaza se lee en los 6 bloqueados: duerme, escuchó algo, está cerca, aparece. Con tres 6 despierta el Diablo.
5. Si no aparece, cada persona que sigue dentro vota en secreto: **seguir** o **salir**. Pásense el celular; el voto no se muestra hasta que votaron todos.
6. La salida segura pide unanimidad. Ahí todo el botín expuesto pasa a la colección segura.
7. Si alguien quiere seguir, quienes votaron salir eligen: **huir** (se mezcla el botín, se pierde una carta al azar y el resto queda seguro; esa persona queda fuera hasta la próxima incursión) o **quedarse y arriesgar**.
8. Si aparece el Diablo, quienes seguían dentro pierden lo expuesto. Lo ya asegurado no se toca. En la tercera incursión, además, quedan manchados y no pueden ganar.
9. Al cierre se ve qué se aseguró, qué se perdió y, en este prototipo, que no hay botellas misteriosas. Después del recuento: si la ofrenda no llega a 20, no gana nadie. Si llega, gana quien tenga más puntos entre quienes pueden ganar. Un empate se comparte.

En la mesa, el botín expuesto (rojo, «en juego») y la colección segura (borde dorado, «a salvo») van separados a propósito. Solo lo seguro cuenta para la ofrenda y para ganar.

## Cómo está armado

- `src/config.ts` tiene los números del prototipo: dados, vela, multiplicadores, ofrenda, pena de huida. La vista los lee de ahí.
- `src/engine/` es el motor puro. El azar es una semilla (mulberry32); la misma semilla repite la bodega y las tiradas. No dibuja nada.
- `src/ui/` es la mesa en PixiJS 8 (`new Application()` y después `await app.init()`), con animación de la carta y del 666. Los textos están en castellano de Chile.
- `tests/` cubre el bloqueo de los 6, la vela, el 666, la unanimidad, la huida, la curva de las tres incursiones y el recuento.

## Decisiones que el diseño puede cambiar

El motor tuvo que cerrar huecos que las reglas v0.2 no escriben. Si alguna de estas no era la intención, se cambia en la config o en el motor y se vuelve a probar.

1. **Varios 6 con la vela todavía encendida.** La vela perdona exactamente un dado: el primer 6 de esa tirada. Los otros 6 del mismo tiro sí se bloquean. Por eso 6-6-6 con la vela y cero dados trabados deja dos 6, no al Diablo. Calza con «con la vela encendida es imposible el 666» en la curva publicada (se entra con cero 6).
2. **El 6 que se comió la vela no queda bloqueado.** Se puede volver a tirar. El siguiente 6, ya a oscuras, se bloquea como cualquier otro.
3. **«El Diablo vuelve a dormir, salvo lo indicado en la regla 6».** En la lista numerada, la 6 es la huida y la 8 es la curva. Leí la excepción como la tercera incursión, que entra con un 6 ya bloqueado (amenaza «escuchó algo»), no como un Diablo que sigue despierto entre incursiones. Cada incursión parte sin botín expuesto y con todo el mundo otra vez dentro. La mancha solo existe si el 666 cae en la última.
4. **Voto secreto y huida.** Primero todos votan salir o seguir, sin ver el voto de los demás. Si hay unanimidad, salen a salvo. Si no, un voto de salir no saca a nadie solo: esa persona elige huir (pierde 1 al azar) o quedarse. Quien queda solo y vota salir hace unanimidad consigo mismo y asegura todo; huir en ese caso sería peor y el motor no se lo ofrece.
5. **Una botella por saqueo, para quien tiene el turno.** No roba cada jugador. El turno rota entre quienes siguen dentro. La primera persona de cada incursión también rota un asiento (`rotateFirstActorEachIncursion`).
6. **Huida con pocas cartas.** Se mezcla el botín con la semilla y se pierden las primeras cartas de esa mezcla, hasta la pena (1 en v0.2). Si hay menos cartas que la pena, se pierden todas. Si no hay botín, la huida no cuesta y esa persona igual queda fuera.
7. **Orden de las huidas** en la misma decisión: desde quien acaba de robar, en el sentido de la mesa.
8. **Ofrenda.** Suma la colección segura de todas las personas, también de las manchadas. Lo expuesto no suma. Bajo 20 no gana nadie. Si la ofrenda está pero todos los que podían ganar están manchados, tampoco. Si el máximo se empata, incluso en 0, el empate se comparte.
9. **La bodega tiene 72 botellas** con cepas chilenas. En v0.2 no hay poderes ni colecciones de cepa: el valor es solo el multiplicador de la incursión en que se robó. Las perdidas van al descarte y no vuelven (`discardLostBottles`). Si el mazo se acaba, lo expuesto se asegura y la incursión cierra. No está en las reglas; con 72 cartas casi no ocurre.
10. **Botellas misteriosas.** La config trae `mysteryBottles: 0`. El cierre lo dice. Si más adelante el número sube, el motor revela esa cantidad desde el mazo al terminar la incursión, las muestra y las manda al descarte. No puntúan.
11. **`unanimousLeave: false`** (no es el v0.2). Un voto de salir asegura el botín de esa persona y la saca, sin pena y sin esperar al resto.
12. **`soloSaqueoCap`.** En v0.2 es `null` (sin tope: quien queda solo decide cuánto arriesga). Si fuera un número, al llegar a ese tope de saqueos en solitario lo expuesto se asegura y la incursión termina.
13. **Dobles y triples** no hacen nada mientras `specialDiceEffects` sea false.
14. **La cara mala es siempre el 6** y el dado es un d6. `dice` en la config es la cantidad de dados, no las caras.
