# Casillero — Reglas prototipo v0.3

Propuesta después de jugar el prototipo v0.2 (PR https://github.com/axes/casillero/pull/1). Gino: «se siente bien, pero faltan más elementos de caos», y propuso partir con 1d6, sumar un contador si sale un 6, y que los eventos agreguen dados (máximo 3), con un solo contador por tirada. Esta versión recoge esa idea. Sigue el espíritu del GDD: 6 es malo, 666 es el Diablo, pocas reglas, nada que memorizar. No es un cierre: se afina en mesa.

Fecha: 11 nov 2026 (America/Santiago).

## Qué se eligió, y por qué

La curva que mejor cumple “la primera se siente segura, las siguientes más difíciles, ninguna política domina, la ambiciosa gana a veces y se estrella a menudo, 15–25 min” es esta combinación:

1. **Se parte siempre con 1d6.** Un 6 agrega **un** contador del Diablo, aunque salgan varios 6 en la misma tirada. No se puede saltar de 0 a 3 de un golpe.
2. **El Diablo aparece a los 3 contadores.** Se mantiene «666 = Diablo». Un umbral de 4 se simuló y se descarta como valor por defecto: alarga la mesa (~27 min en mixta de 4, ~24 min aun con 4 cautas) y se sale del techo de 25.
3. **Eventos en el mazo de la Bodega (12 cartas), no dobles ni triples.** El caos entra por cartas, no por una segunda tabla de dados. Cada evento debe mover la pregunta «¿una botella más?».
4. **Curva 0 / 1 / 1 contadores de entrada**, siempre 1d6 al comenzar. Las tinajas arrancan quietas (la primera tirada no puede despertar al Diablo). Las cavas y la sacristía ya tienen una marca: hay menos botellas «gratis» antes de decidir, y el vino vale 2 o 3.
5. **Ofrenda colectiva de 14 puntos (sugerencia).** En v0.2 era 20, calibrada a un botín más alto (3d6 desde el inicio, vela, sin eventos que reemplazan botellas). Con esta curva, una mesa mixta de 4 suma de media ~14,3 puntos (mediana 13). Dejar 20 haría que nadie gane en ~75 % de esas partidas. 14 recupera un calificar cercano al de v0.2 (~47 % frente a 51 %). Es un ajuste, no un cierre.
6. **Mancha del Diablo en la última incursión**, salida unánime y huida con una carta menos: se mantienen.

Se descartó, con simulación (12.000 partidas por celda, salvo donde se indica):

- Umbral 4: demasiado lento, aunque el reparto de victorias es un poco más parejo.
- Empezar la sacristía con 2 contadores: el final nace casi en 1/6 más Pisada; una mesa cauta asegura ~0,6 botellas y casi no llega a la ofrenda (20 % con umbral 20). Es el mismo problema que se rechazó en v0.2.
- Empezar la sacristía con 2 dados: la mixta califica aún menos; se puede probar después, no como valor por defecto.
- Partir las tres incursiones en 0 contadores: la curva se aplana y la mixta de 4 se va al techo (~25 min).
- Sumar un dado automático en cada 6: le quitaría el trabajo a los eventos.

La vela deja de ser una regla fija de la 1.ª incursión y pasa a ser una carta (quita un contador, o un dado si no hay).

## Reglas

1. Jugadores: 3 a 6. No hay antagonista. Todos juegan con las mismas reglas.
2. La partida tiene **tres incursiones**. Al empezar cada una no hay botín expuesto. Los dados y los contadores se reinician a lo indicado en la regla 9.
3. Se parte con **un dado de seis caras**. En cada saqueo, después de resolver la carta, se lanzan los dados en juego. Si **algún** 6 aparece, se agrega **un** contador del Diablo (nunca más de uno por tirada). **Tres contadores despiertan al Diablo.**
4. Puede haber de **1 a 3 dados**. Solo los eventos agregan o quitan dados. Si un efecto pediría bajar de 1 o subir de 3, no pasa nada más.
5. Ciclo de saqueo: el jugador activo roba la carta superior de la Bodega.
    1. Si es una **botella**, va a su botín expuesto.
    2. Si es un **evento**, se resuelve de inmediato (algunos pueden despertar al Diablo).
    3. Si el Diablo no apareció, lanza los dados y se revisa el contador. Si no aparece, el grupo decide.
    El turno rota entre quienes siguen dentro. Si el mazo se acaba, la incursión termina y quienes siguen dentro aseguran su botín expuesto.
6. **Salida segura:** requiere unanimidad de quienes siguen dentro. Todos aseguran por completo su botín de esa incursión.
7. **Huida individual:** quien no quiera quedarse huye, mezcla su botín actual, pierde una carta al azar y asegura el resto. Queda fuera hasta la próxima incursión.
8. Si aparece el Diablo, la incursión termina. Quienes seguían dentro pierden el botín de esa incursión. Lo ya asegurado no se toca. Quienes ya habían salido o huido conservan lo suyo.
9. Curva de las tres incursiones (siempre se entra con 1d6):
    1. **Las tinajas** (valor ×1, joven). 0 contadores al entrar.
    2. **Las cavas** (valor ×2, reserva). 1 contador al entrar: el Diablo ya escuchó algo.
    3. **La sacristía** (valor ×3, gran reserva). 1 contador al entrar.
10. **Ofrenda:** al terminar la tercera incursión, si el grupo no tiene al menos **14 puntos** en colecciones seguras, nadie gana (el Diablo se queda con la bodega). *Sugerencia de ajuste: en v0.2 el umbral era 20; ver «Números».*
11. **Mancha:** si el Diablo aparece en la tercera incursión, quienes seguían dentro no pueden ganar, aunque la ofrenda se cumpla. Gana, entre las personas elegibles, quien tenga más puntos en su colección segura. Un empate se comparte.
12. Las botellas perdidas (Diablo o huida) van al descarte y no se rebarajan en la misma partida.
13. **Eventos de la Bodega.** Hay 12 cartas de evento (lista abajo). Al **empezar cada incursión**, se retiran del mazo los eventos que hayan quedado, se baraja un mazo fresco de las 12, y se mezcla con las botellas que aún no se han robado. Así cada bajón vuelve a tener caos, aunque el vino se vaya acabando.
14. En este prototipo no hay dobles, triples ni botellas misteriosas. El caos entra por los eventos y por los dados que esos eventos encienden.

### Cómo se explica en un minuto

Entran con un solo dado. Cada 6 deja una marca; a la tercera, el Diablo. Las cartas de la bodega encienden o apagan el ruido: más dados, más seises. La primera bajada es más quieta; más abajo el vino vale más y ya hay una marca. Tienen que juntar 14 puntos entre todos, pero gana quien más aseguró… si no lo pilló el Diablo en el último bajón.

## Cartas de evento (12)

| Carta | Copias | Efecto | Por qué mueve «¿una más?» |
| --- | ---: | --- | --- |
| Ruido | 3 | +1 dado (máx. 3). | La próxima tirada asusta más; ¿salimos ahora? |
| Barrica cae | 2 | +2 dados (máx. 3). | Un salto brusco de ruido. Con 1 dado pasa a 3. |
| Silencio | 2 | −1 dado (mín. 1). | Se calma el sótano: puede valer quedarse. |
| Vela | 1 | Quita 1 contador si hay alguno; si no, −1 dado (mín. 1). | Un respiro raro. ¿Aprovechamos o desconfiamos? |
| Eco | 1 | Cada quien que sigue dentro y tiene 2 o más botellas expuestas pierde 1. | Castiga el pozo grande y tienta a asegurar antes. |
| Encrucijada | 1 | El jugador activo elige: tomar una botella extra y +1 dado, o pasar. | La pregunta del juego, escrita en una carta. |
| Pisada | 1 | +1 contador. Si con eso se llega a 3, el Diablo aparece de inmediato, sin tirada. | El único salto que puede despertarlo sin quedarse en 2 marcas. |
| Trasiego | 1 | Si alguien dentro tiene **estrictamente** más botellas expuestas que el activo, intercambian su botín expuesto con esa persona (la que más tiene). Si nadie tiene más, no ocurre nada. | El que va arriba puede perder el pozo; el de atrás se tienta a seguir. |

No hay tabla que memorizar: el texto va en la carta. Con dos o más dados no se usan dobles ni triples en esta versión (no se apilan dos sistemas de caos).

## Números de la simulación

Método: 12.000 partidas por celda, 11 nov 2026. Políticas fijas (no juegan «perfecto»): **cauta** sale al llegar a 2 contadores; **media** acepta 0/1/2 saqueos extra según la incursión (y un poco más en la última si va atrás o falta la ofrenda); **ambiciosa** acepta 1/3/5. Con 3 dados, medias y ambiciosas piden un extra menos (la tirada da más miedo). En mesa mixta, si alguien se queda, los demás huyen o arriesgan. Tiempos de mesa: supuestos (45 s por saqueo con 3–4 jugadores, 60 s con 6; más 45 s por incursión y 75 s de preparación).

Probabilidades de al menos un 6, y por tanto de sumar un contador: 1 dado 1/6 (~16,7 %); 2 dados 11/36 (~30,6 %); 3 dados 91/216 (~42,1 %). Sin eventos, con 1d6 fijo, se esperan 12 tiradas hasta 2 contadores y 18 hasta 3: demasiado lento y, si se sale en 2, el Diablo nunca aparece. Los eventos aceleran el ritmo (una mesa cauta ve ~1,9 eventos y un máximo medio de ~2,1 dados en la 1.ª) y Pisada es lo único que puede despertarlo si el grupo sale siempre en 2 marcas.

Ofrenda = 14 (sugerencia). Curva v0.3: umbral 3, contadores de entrada 0/1/1, siempre 1d6. Mancha en la 3.ª.

| Mesa | Llega a 14 | Tiradas (media) | Minutos (est.) | Supervivencia por incursión (no aparece el Diablo) |
| --- | ---: | ---: | ---: | --- |
| 4 cautas | 78 % | 17,0 | 16 | 98 % / 98 % / 98 % |
| 4 medias | 66 % | 19,5 | 18 | 98 % / 80 % / 49 % |
| 4 ambiciosas | 40 % | 22,4 | 20 | 83 % / 40 % / 17 % |
| Mixta 4 (1 cauta, 2 medias, 1 ambiciosa) | 47 % | 22,4 | 20 | 82 % / 42 % / 18 % |
| Mixta 3 (1 de cada) | 49 % | 22,4 | 20 | 83 % / 41 % / 18 % |
| Mixta 6 (2 de cada) | 43 % | 22,5 | 26 | 83 % / 41 % / 16 % |

En mesa mixta de 4, puntos medios por persona: cauta 3,57; media 3,40; ambiciosa 3,87. Victoria única por asiento: cauta 8,8 %; media 7,3 %; ambiciosa 13,2 %. Incluyendo empates: 12,4 %, 10,9 % y 15,9 %. La ambiciosa gana a veces y se queda fuera a menudo (la mancha de la 3.ª la pilla en ~69 % de las partidas si seguía dentro). Nadie gana en ~53 % de las partidas mixtas de 4. Con 3 el reparto es casi parejo (14,4 % / 11,6 % / 14,9 % de victoria única). Con 6 también se aplana (3,9 % / 5,0 % / 5,7 %).

Si el grupo sale siempre al ver 2 contadores, la 1.ª rinde ~6,1 botellas, la 2.ª ~3,2 y la 3.ª ~3,1. La primera tirada de las tinajas no puede despertar al Diablo (0→1). En cavas y sacristía se entra con 1: la primera tirada llega a 2, no a 3. El riesgo de la 1.ª es el de quedarse o de ver Pisada ya en 2 marcas.

Nota de diseño: una mesa **toda cauta** sobrevive ~98 % también en la 3.ª. La dificultad que sí sube para ellas es el botín (menos botellas «gratis») y el valor en juego, no la tasa del Diablo. La curva se siente en mesas medias, ambiciosas y mixtas (98/80/49 y 83/40/17). Con 6, la mixta se va a ~26 min, un poco sobre el techo; igual que en v0.2 (~25).

Si se deja la ofrenda en 20, la mixta de 4 solo califica el 25 % de las veces (3: 27 %; 6: 24 %). Con 16, la mixta de 4 llega al 38 %; con 12, al 56 %. 14 es el valor más cercano al 51 % de v0.2.

Estos perfiles son estereotipos de simulación. En una mesa real la gente cambia de idea; el prototipo sirve para ver si la curva se siente así.

## Comparación breve con v0.2

Misma mesa mixta de 4, mismos estereotipos, misma mancha, mismos supuestos de tiempo (~20 min, ~22 tiradas):

- La 1.ª es más segura (supervivencia mixta 82 % frente a 76 %; la primera tirada ya no puede ser 666). Las siguientes son más duras para quien se queda (42 % y 18 % frente a 53 % y 36 %).
- El botín total baja (eventos que no son botella, y las incursiones 2 y 3 arrancan con una marca). Por eso se sugiere bajar la ofrenda de 20 a 14: así la mixta sigue calificando cerca de la mitad de las partidas (47 % frente a 51 %).
- Ninguna política domina. En v0.2 la ambiciosa ganaba sola el 25 % frente a ~4 % de las otras; en v0.3 es 13 % frente a 9 % y 7 %. Sigue ganando un poco más, y se estrella más (supervivencia final 18 % frente a 36 %; una mesa toda ambiciosa califica 40 % frente a 56 %).
- El caos es visible: de media se ven ~2 eventos por incursión en mesas que se quedan, y el máximo de dados llega a ~2,2.

## Configuración del prototipo digital

Valores que el motor debe leer de un config, no de literales repartidos en la vista:

```json
{
  "playersMin": 3,
  "playersMax": 6,
  "incursions": 3,
  "startDice": [1, 1, 1],
  "minDice": 1,
  "maxDice": 3,
  "devilAtCounters": 3,
  "maxCountersPerRoll": 1,
  "startCounters": [0, 1, 1],
  "valueMultiplier": [1, 2, 3],
  "incursionNames": ["Las tinajas", "Las cavas", "La sacristía"],
  "offeringThreshold": 14,
  "fleePenalty": 1,
  "unanimousLeave": true,
  "lastIncursionDevilIneligible": true,
  "rotateFirstActorEachIncursion": true,
  "discardLostBottles": true,
  "bottleCount": 40,
  "eventsRestockEachIncursion": true,
  "events": {
    "ruido": { "count": 3, "addDice": 1 },
    "barricaCae": { "count": 2, "addDice": 2 },
    "silencio": { "count": 2, "removeDice": 1 },
    "vela": { "count": 1, "removeCounterOrDie": true },
    "eco": { "count": 1, "loseExposedIfAtLeast": 2 },
    "encrucijada": { "count": 1, "choiceBottleAndDie": true },
    "pisada": { "count": 1, "addCounter": 1 },
    "trasiego": { "count": 1, "swapWithRichestExposed": true }
  },
  "candleAbsorbsFirstSix": false,
  "startLocked": [0, 0, 0],
  "soloSaqueoCap": null,
  "mysteryBottles": 0,
  "specialDiceEffects": false
}
```

El motor de reglas va separado del render, con RNG de semilla, en el proyecto existente. Los campos `candleAbsorbsFirstSix` y `startLocked` quedan en false / ceros para no arrastrar la v0.2. Validar lint, tests y build en cada fase.

## Preguntas abiertas

1. **¿Ofrenda 14 o 20?** Es la decisión que más cambia la mesa. 14 deja la mixta cerca del ritmo de v0.2 (~47 % califica). 20 hace que en tres de cada cuatro partidas mixtas nadie gane. También se puede probar 15 o 16 (mixta de 4: 42 % y 38 %).
2. **¿Confirmas el umbral en 3 contadores?** Encaja con «666 = Diablo» y con el tiempo de mesa. El 4 equilibra un poco más las políticas, pero se va de minutos.
3. **¿La sacristía entra con 1 contador, con 2, o con 2 dados?** Se recomienda 1 contador y 1d6. Dos contadores deja el final demasiado corto; dos dados se puede ensayar después.
4. **¿Pisada es demasiado picante?** Es 1 de 12, y la única forma de que una mesa que sale siempre en 2 marcas aún pueda ver al Diablo. Si en mesa se siente injusta, se puede cambiar por otro Ruido o por un Silencio.
5. **¿Eventos o dobles/triples?** Se recomienda solo eventos en v0.3, para no apilar dos sistemas. Los dobles pueden entrar después si el mazo no basta.
6. **¿Los 12 eventos se reponen en cada incursión?** Así está simulado (caos constante, botellas que no vuelven). La alternativa es un solo mazo para toda la partida: las últimas incursiones tendrían menos eventos si ya salieron.
7. **¿Se implementa v0.3 sobre el repo y el PR #1?** El motor deja de bloquear dados y pasa a contadores + mazo de eventos; hay que rehacer tests y la mesa en Pixi.

Si se publica, “Casillero del Diablo” es marca registrada de Viña Concha y Toro. Este título es de trabajo.
