# Casillero — Reglas prototipo v0.4

Propuesta después de jugar v0.3 (PR https://github.com/axes/casillero/pull/1). Gino reestructura el juego: los bandidos entran de noche a las cavas; cortinas «Noche 1», «Noche 2»…; un mazo de ~60 cartas en pilas según el número de jugadores (3→20, 4→15, 5→12, 6→10); cada ronda todos roban la carta superior, la miran y se la quedan; un dado (o más, si un evento lo pide) puede interrumpir la noche con un 6; hasta 3 robos por noche; desde la Noche 2 se juegan cartas de acción (ataques); el botín vale 1 a 3 puntos y va boca arriba; en la mano, solo acciones, ocultas. El juego pasa a ser competitivo. Esta versión respeta esas decisiones y marca como sugerencia todo lo que se rellena para que siga habiendo «¿seguimos?», partidas de 15–25 min y «6 = malo».

Fecha: 11 nov 2026 (America/Santiago).

## Qué se eligió, y por qué

Gino confirmó que **tiene que existir la decisión «¿seguimos?»**. Sin ella, un 6 que solo corta la noche no es push-your-luck: solo es suerte. La pregunta que queda es hasta dónde se puede estirar esa decisión con pilas de 10 a 20 cartas.

Se simuló el ritmo de las pilas (cálculo exacto con 1d6, sin eventos) y 8.000 partidas por celda con eventos y acciones. La propuesta que mejor cumple «seguir vale la pena, las pilas no se vacían de golpe, 3–6 jugadores terminan en un tiempo parecido» es esta:

1. **Un solo 6 interrumpe la noche.** Se retiran los contadores del Diablo de v0.3: con como máximo dos tiradas por noche, casi nunca se llegarían a 3 marcas. El 6 *es* el Diablo (los descubrió). Los eventos sí pueden agregar dados (máx. 3), como pidió Gino. *Sugerencia que interpreta su texto.*
2. **El botín de la noche queda expuesto.** Después de robar (y ver la carta), cada jugador decide si **sale** (asegura lo de esta noche) o **sigue**. Si sale un 6, quienes seguían dentro pierden el botín de esa noche. Lo de noches anteriores no se toca. Después de la 3.ª ronda sin 6, quienes siguen dentro aseguran automático (no hay tirada tras el último robo). *Sugerencia; es lo que hace valer el «¿seguimos?». Gino confirmó la decisión; esto fija el precio.*
3. **Máximo 3 robos por noche**, como dijo Gino. No se abre una 4.ª ronda: con un dado extra esa cuarta carta es, en esperanza, un mal negocio (1,93 botellas aseguradas vs 2,08 si te detienes en 3) y en 6 jugadores vacía la pila de 10 aún más rápido. El «una más» vive en la 2.ª y la 3.ª carta de cada noche.
4. **La partida dura 4 noches**, no hasta vaciar las pilas. Las pilas son un **presupuesto personal**, no el reloj. Con 4 noches y tope de 3, una política ambiciosa espera ~2,53 robos por noche y ~10,1 cartas en total: cabe holgada en 3–5 jugadores (pilas de 20/15/12) y **justo en el límite de 10 cartas con 6**. Si el reloj fuera «se acaba cuando se vacía una pila», una mesa ambiciosa de 3 tarda ~29 min y una de 6, ~21: no cabe en 15–25 para todos. Cinco noches empujan a 6 jugadores a vaciar la pila (~60 % de las mixtas se quedan sin carta) y se van a ~21–22 min.
5. **Pilas personales.** Cada quien roba siempre de la suya (lectura simple de «se divide en pilas»). No se elige pila ajena en esta versión.
6. **Mazo de acciones aparte**, como sugirió Gino. Tras cada noche (menos la última) cada jugador roba 1 acción. Se juegan a partir de la Noche 2, una por noche, al empezar, en orden. Límite de mano: 3. Solo las acciones se esconden; el botín va boca arriba.
7. **Se retiran la ofrenda colectiva y la mancha.** Gana quien más puntos tiene en su colección segura. *Empate (sugerencia):* gana quien le quedan más cartas en la pila (el que no agotó su pasillo). Si sigue el empate, se comparte.

La primera carta de cada noche es un robo que todos pueden tomar; el riesgo empieza cuando decides quedarte a la tirada. «6 = malo» se siente de inmediato, no a la tercera marca.

## Hasta dónde llega el «¿seguimos?»

Sin eventos, con 1d6, si el 6 hace perder el botín de la noche:

| Política | Robos / noche | Asegura / noche (cartas) | Noches hasta vaciar 3 / 4 / 5 / 6 jug. (20 / 15 / 12 / 10) |
| --- | ---: | ---: | --- |
| Cauta (sale tras 1) | 1,00 | 1,00 | 20 / 15 / 12 / 10 |
| Media (sale tras 2) | 1,83 | 1,67 | 10,9 / 8,2 / 6,5 / 5,5 |
| Ambiciosa (va a 3) | 2,53 | 2,08 | 7,9 / 5,9 / 4,8 / 4,0 |
| 4.ª ronda con +1 dado | 3,01 | 1,93 | 6,6 / 5,0 / 4,0 / 3,3 |

En **4 noches** (recomendado), una ambiciosa espera 10,1 robos: le quedan ~10 / 5 / 2 / 0 cartas según sean 3, 4, 5 o 6 jugadores. Una cauta roba 4 y le sobran 16 / 11 / 8 / 6. El «seguimos» se estira **dentro de la noche** (1→2→3) y, en mesas grandes, también **como ración**: con 6, la ambiciosa casi gasta el sótano; con 3, le sobra la mitad de la pila. Por eso las cartas que quedan sirven de desempate, no de reloj.

Se descartó, con números:

- Vaciar pilas como fin de partida: 3 jugadores se van a ~9–12 noches y 25–31 min.
- 5 noches fijas: en 6 jugadores la ambiciosa se queda sin pila (salta el robo en ~60 % de las mixtas) y la media empieza a ganarle; el tiempo sube a ~21–22 min.
- 3 noches: ~10–13 min en mixta, solo dos ventanas de acciones, sobran demasiadas cartas.
- Permitir una 4.ª ronda más cara: casi no se usa si la gente juega bien (es −EV con el dado extra) y con 6 vacía antes. No justifica una regla más, y Gino ya fijó el tope en 3.

## Reglas

1. Jugadores: 3 a 6. El juego es **competitivo**. No hay antagonista ni ofrenda colectiva.
2. La partida tiene **cuatro noches** (*sugerencia*). Al empezar el juego, y entre noche y noche, una cortina «Noche k» muestra el botín seguro de cada jugador (en la Noche 1, todos en 0).
3. Se baraja un mazo de **60 cartas** de bodega (botín + eventos) y se reparte en **una pila personal por jugador**, boca abajo: 20 / 15 / 12 / 10 cartas con 3 / 4 / 5 / 6 jugadores. Cada quien roba siempre de la suya. Hay un mazo aparte de **acciones**.
4. Cada noche empieza con **1 dado**. Puede haber de 1 a 3; solo eventos y algunas acciones agregan o quitan dados. Al comenzar la noche, los dados vuelven a 1 (salvo lo que jueguen las acciones de ese comienzo).
5. Una noche tiene como máximo **3 rondas de robo**. En cada ronda, **al mismo tiempo**, cada jugador que sigue dentro toma la carta superior de su pila, la mira y se la queda:
    1. Si es **botín**, la pone **boca arriba** en su botín expuesto de esta noche (1, 2 o 3 puntos).
    2. Si es un **evento**, se revela y se resuelve de inmediato. No se guarda en la mano.
    Si la pila de alguien está vacía, esa persona no roba y sigue en la noche con lo que ya tenía expuesto.
6. Después de robar (y de resolver eventos), si no es la 3.ª ronda, cada quien que sigue dentro decide en secreto y se revela a la vez: **salir** o **seguir**. Quien sale asegura su botín expuesto de esta noche (pasa a su colección segura, boca arriba) y ya no roba más hasta la próxima noche.
7. Si queda alguien dentro, se lanza **un dado compartido** (o más, si hay dados extra). **Si sale al menos un 6, la noche se interrumpe:** quienes seguían dentro pierden el botín expuesto de esta noche (va al descarte). Quienes ya habían salido conservan lo asegurado. No se juegan más rondas esa noche.
8. Si no sale 6, se juega la siguiente ronda. Tras la 3.ª ronda sin 6, quienes siguen dentro **aseguran automático** (no hay cuarta tirada).
9. Desde la **Noche 2**, al comenzar la noche y antes del primer robo, en orden de turno cada jugador puede **jugar una carta de acción** de su mano, o pasar. Las acciones son ataques u otras jugadas contra rivales (lista abajo). «Tranca» se puede jugar fuera de turno, al momento, para cancelar una acción que te acaba de apuntar.
10. Al **terminar cada noche**, excepto la cuarta, cada jugador roba **1 carta del mazo de acciones**, a la mano, oculta. Límite de mano: 3; si te pasas, descartas hasta 3 (tú eliges). En la Noche 1 no se juegan acciones (aún no hay mano, o no se pueden usar).
11. Solo las acciones pueden quedar en la mano, ocultas. El botín, expuesto o seguro, está siempre boca arriba: todos ven los puntos.
12. Al terminar la Noche 4, gana quien más puntos tiene en su **colección segura**. Si hay empate, gana quien le quedan más cartas en su pila. Si sigue el empate, se comparte.
13. El primer jugador (para acciones y para resolver eventos del mismo instante) rota cada noche.

### Cómo se explica en un minuto

Entran de noche a las cavas. Cada uno tiene su pasillo de cartas. Roban a la vez, miran, y deciden si se van con lo de esta noche o se quedan a otra ronda. Un 6 y el Diablo los descubre: quienes seguían dentro pierden lo de esa noche. Hasta tres robos por noche, cuatro noches en total. Desde la segunda, se atacan con cartas ocultas. Gana quien más vino aseguró.

## Cartas de bodega (60, se reparte en pilas)

| Carta | Copias | Efecto |
| --- | ---: | --- |
| Vino joven (1 punto) | 24 | Botín. Boca arriba. |
| Reserva (2 puntos) | 16 | Botín. Boca arriba. |
| Gran reserva (3 puntos) | 10 | Botín. Boca arriba. |
| Ruido | 4 | +1 dado esta noche (máx. 3). |
| Barrica cae | 2 | +2 dados esta noche (máx. 3). |
| Silencio | 2 | −1 dado esta noche (mín. 1). |
| Guardia | 2 | +1 dado esta noche (máx. 3); ese dado no baja aunque salga Silencio después, hasta el fin de la noche. |

Total: 50 botines (valor medio 1,72) y 10 eventos. Los dados extra duran el resto de la noche, salvo Silencio. No hay tabla que memorizar: el texto va en la carta.

## Cartas de acción (30, mazo aparte)

| Carta | Copias | Efecto |
| --- | ---: | --- |
| Saqueo | 5 | Elige 1 botella de la colección **segura** de un rival (boca arriba) y tómala. |
| Quebranto | 4 | Elige 1 botella de la colección segura de un rival; va al descarte. |
| Trasiego | 3 | Intercambia 1 botella tuya segura por 1 segura de un rival (tú eliges ambas). |
| Delación | 4 | Esta noche empieza con +1 dado (máx. 3). |
| Alarma | 2 | Esta noche empieza con +2 dados (máx. 3). |
| Tranca | 3 | Juega en el acto para cancelar una acción que te acaba de apuntar. |
| Escondite | 3 | Hasta el fin de esta noche nadie puede robarte ni quebrarte ni forzarte un trasiego. |
| Vistazo | 3 | Mira la mano de un rival. |
| Sombra | 3 | Si sale 6 esta noche, tú sí aseguras tu botín expuesto. |

## Números de la simulación

Método: 8.000 partidas por celda, 11 nov 2026. Políticas fijas: **cauta** sale siempre tras la 1.ª carta; **media** va a la 2.ª y se va antes de la segunda tirada (en la última noche, si va muy atrás, puede ir a 3); **ambiciosa** va a 3, salvo un pozo grande con 3 dados. Acciones: la media y la ambiciosa atacan al que va primero; la cauta se protege o ataca solo si está muy atrás. Tiempos de mesa: supuestos (robos simultáneos; ~12 s + 6 s por jugador por ronda, 15 s de decisión, 8 s de tirada; acciones en orden; 25 s de cortina; 60 s de preparación).

Variante recomendada: 4 noches, máximo 3 rondas, el 6 pierde el botín expuesto de quienes seguían dentro, pilas personales, desempate por cartas que quedan.

| Mesa | Minutos (est.) | Noches | Rondas | Puntos medios | Brecha (máx−mín) | Noches que acaban en 1 / 2 / 3 | Un 6 corta |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 4 cautas | 10 | 4 | 4,2 | 5,6 | 3,0 | 95 / 5 / 0 % | 1 % |
| 4 medias | 12 | 4 | 6,5 | 6,9 | 3,9 | 45 / 49 / 6 % | 21 % |
| 4 ambiciosas | 14 | 4 | 8,9 | 8,5 | 4,5 | 28 / 21 / 51 % | 49 % |
| Mixta 4 (1 cauta, 2 medias, 1 ambiciosa) | 14 | 4 | 9,0 | 7,0 | 5,3 | 28 / 19 / 53 % | 46 % |
| Mixta 3 (1 de cada) | 13 | 4 | 9,3 | 7,5 | 5,4 | 25 / 18 / 57 % | 42 % |
| Mixta 5 | 16 | 4 | 8,9 | 6,5 | 5,3 | 29 / 19 / 52 % | 47 % |
| Mixta 6 (2 de cada) | 17 | 4 | 8,8 | 6,5 | 5,5 | 30 / 20 / 50 % | 50 % |

En la mixta de 4, puntos medios: cauta 5,6; media 7,2; ambiciosa 8,1. Robos totales: 4,1 / 5,9 / 9,0. Cartas aseguradas: 3,4 / 4,5 / 5,7. Le quedan en la pila: 10,9 / 9,1 / 6,0. Victoria única por asiento: 11 % / 22 % / 41 %. La ambiciosa gana más (roba más) y se le cae la noche a menudo (~la mitad de las noches termina en 6 porque alguien se quedó). En ~18 % de esas partidas hay empate en puntos y entra el desempate de la pila. Con 6, la ambiciosa se acerca al fondo (le quedan ~1,5; en el 16 % de las partidas alguien no puede robar al final); con 3 le sobran ~11. Las 60 cartas alcanzan como pozo para repartir; no hace falta gastarlas todas.

Una mesa toda cauta dura ~9–12 min (todos salen tras la primera: casi no hay tirada). Es corto, y es el precio de no arriesgar. Las mixtas y las ambiciosas caen en 13–17 min, dentro del techo de 25.

Estos perfiles son estereotipos. En una mesa real la gente cambia de idea.

## Comparación breve con v0.3

v0.3 era semicooperativo (ofrenda, mancha, un dado que sumaba contadores hasta 3). v0.4 es competitivo, por noches, con pilas personales, un 6 que corta la noche y acciones de ataque. El «¿una botella más?» se concentra en 2 o 3 robos por noche, no en una incursión larga. El reloj estimado baja un poco (robos a la vez): ~14 min en mixta de 4 frente a ~20 en v0.3. La primera carta de cada noche es un regalo si sales; el riesgo es quedarse.

## Configuración del prototipo digital

```json
{
  "playersMin": 3,
  "playersMax": 6,
  "nights": 4,
  "maxRoundsPerNight": 3,
  "startDice": 1,
  "minDice": 1,
  "maxDice": 3,
  "sharedDie": true,
  "sixEndsNight": true,
  "devilCounters": false,
  "exposedLostOnSix": true,
  "autoBankAfterLastRound": true,
  "simultaneousDraw": true,
  "personalPiles": true,
  "pileSizeByPlayers": {"3": 20, "4": 15, "5": 12, "6": 10},
  "bodegaSize": 60,
  "loot": {"1": 24, "2": 16, "3": 10},
  "events": {
    "ruido": {"count": 4, "addDice": 1},
    "barricaCae": {"count": 2, "addDice": 2},
    "silencio": {"count": 2, "removeDice": 1},
    "guardia": {"count": 2, "addDice": 1, "persistent": true}
  },
  "actions": {
    "deckSize": 30,
    "drawAfterEachNightExceptLast": true,
    "handLimit": 3,
    "playFromNight": 2,
    "playsPerNight": 1,
    "cards": {
      "saqueo": 5,
      "quebranto": 4,
      "trasiego": 3,
      "delacion": 4,
      "alarma": 2,
      "tranca": 3,
      "escondite": 3,
      "vistazo": 3,
      "sombra": 3
    }
  },
  "tiebreakLeftoverPile": true,
  "curtainShowsScores": true,
  "rotateFirstPlayer": true,
  "offeringThreshold": null,
  "lastIncursionDevilIneligible": false
}
```

Cortinas: al inicio y entre noches, «Noche k» con los puntos seguros de cada jugador. El motor separado del render, RNG con semilla. Validar lint, tests y build.

## Preguntas abiertas

1. **¿4 noches fijas?** Es la recomendación (cabe en 15–25 min, el «seguimos» llega justo al fondo de la pila de 6). Alternativas ya medidas: 5 noches (en 6 se vacía la pila ambiciosa) o terminar cuando se vacía una pila (demasiado largo con 3).
2. **¿Confirmas que un 6 hace perder el botín expuesto de quienes seguían dentro?** Es el precio del «¿seguimos?». La otra lectura de tu texto (el 6 solo corta, el botín ya robado se queda) deja la tensión casi solo en las acciones.
3. **¿Desempate por cartas que quedan en la pila?** Le da valor a no gastar el pasillo, sobre todo con 3 o 4 jugadores, donde sobran cartas. Si no, el empate se comparte.
4. **¿Pilas solo personales, o se puede robar de la pila de otro?** Aquí cada uno tiene la suya. Elegir pila suma interacción y complejidad.
5. **¿Te sirve esta lista de 9 acciones y 10 eventos, o quieres otra?** Sombra (tú te salvas del 6) y Alarma/Delación (suben el dado para todos) son las que más cambian la noche; si en mesa se sienten duras, se bajan copias.
6. **¿Se implementa v0.4 sobre el repo y el PR #1?** Es un cambio grande de flujo (noches, pilas, acciones, sin contadores ni ofrenda).

Si se publica, “Casillero del Diablo” es marca registrada de Viña Concha y Toro. Este título es de trabajo.
