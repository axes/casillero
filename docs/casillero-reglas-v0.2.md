# Casillero — Reglas prototipo v0.2

Propuesta para el primer prototipo (mesa y digital). Sigue el espíritu del GDD v0.1: 6 es malo, 666 es el Diablo, pocos componentes, nada que memorizar. No es un cierre: se afina en mesa.

Fecha: 11 nov 2026 (America/Santiago).

## Qué se eligió, y por qué

La curva que mejor cumple “la primera se siente segura, las siguientes más difíciles, y la ambición gana o pierde” es esta combinación:

1. **Vela en la 1.ª incursión.** El primer 6 apaga la vela y no bloquea un dado. No se puede despertar al Diablo antes de esa señal. Además rinde más botellas (unas 6,4 si el grupo sale al ver dos 6, frente a 4,6 sin vela).
2. **2.ª incursión estándar.** Tres dados libres, como en el GDD.
3. **3.ª incursión con un 6 ya bloqueado.** Se entra con dos dados: el Diablo ya escuchó. La primera tirada puede ser 666 con 1/36 (2,8%), no con 1/216.
4. **Más profundo, mejor el vino.** Cada botella vale 1, 2 o 3 puntos según la incursión (joven, reserva, gran reserva). Quedarse en la fase de un dado puede ser correcto si vas atrás o si al grupo le falta la ofrenda.
5. **Ofrenda colectiva de 20 puntos.** Si el grupo no llega, nadie gana. El umbral es el mismo con 3–6 jugadores: el botín del grupo no crece con el número de personas (una botella por saqueo).
6. **Mancha del Diablo en la última incursión.** Si aparece el 666 en la 3.ª, quienes seguían dentro no pueden ganar, aunque la ofrenda se cumpla con lo ya asegurado. Quien ya había salido o huido sí puede. Así, quedarse a “una más” en el final puede darte la partida… o dejarte fuera.

Se descartó, con simulación:

- Un 4.º dado en la 1.ª: si el Diablo sigue en tres 6, la incursión es más peligrosa, no más segura; si se pide 6666, se rompe la frase “666 = el Diablo”.
- Subir solo el valor de las botellas y no tocar los dados: las apuestas crecen, pero la 1.ª no se siente distinta de la 3.ª.
- Empezar la 3.ª con dos 6 ya bloqueados: el final nace en 1/6, demasiado corto y binario.
- Cuatro incursiones: con 6 jugadores y una mesa ambiciosa se va a ~29 min, sobre el techo de 25.
- Un tope de saqueos si quedas solo: casi no mueve el balance y choca con el GDD (“si queda uno, decide cuánto arriesga”).

## Reglas

1. Jugadores: 3 a 6. No hay antagonista. Todos juegan con las mismas reglas.
2. La partida tiene **tres incursiones**. Al empezar cada una no hay botín expuesto y el Diablo vuelve a dormir, salvo lo indicado en la regla 6.
3. Hay **tres dados de seis caras**. En cada saqueo se lanzan solo los dados todavía libres. Todo 6 natural se bloquea y no se vuelve a lanzar en esa incursión. **666 despierta al Diablo.**
4. Ciclo de saqueo: el jugador activo roba una botella a su botín expuesto, lanza los dados libres, bloquea los 6 y se revisa al Diablo. Si no aparece, el grupo decide. El turno de saqueo rota entre quienes siguen dentro.
5. **Salida segura:** requiere unanimidad de quienes siguen dentro. Todos aseguran por completo su botín de esa incursión.
6. **Huida individual:** quien no quiera quedarse huye, mezcla su botín actual, pierde una carta al azar y asegura el resto. Queda fuera hasta la próxima incursión.
7. Si aparece el Diablo, la incursión termina. Quienes seguían dentro pierden el botín de esa incursión. Lo ya asegurado no se toca. Quienes ya habían salido o huido conservan lo suyo.
8. Curva de las tres incursiones:
    1. **Las tinajas** (valor ×1, joven). Hay una vela encendida. El primer 6 de la incursión apaga la vela y **no** bloquea un dado. A partir de ahí, las reglas normales. Con la vela encendida es imposible el 666.
    2. **Las cavas** (valor ×2, reserva). Tres dados libres, reglas normales.
    3. **La sacristía** (valor ×3, gran reserva). Al entrar, un dado ya está bloqueado en 6. Se juega con dos dados desde el primer saqueo.
9. **Ofrenda:** al terminar la tercera incursión, si el grupo no tiene al menos **20 puntos** en colecciones seguras, nadie gana (el Diablo se queda con la bodega).
10. **Mancha:** si el Diablo aparece en la tercera incursión, quienes seguían dentro no pueden ganar, aunque la ofrenda se cumpla. Gana, entre las personas elegibles, quien tenga más puntos en su colección segura. Un empate se comparte.
11. Las botellas perdidas (Diablo o huida) van al descarte y no se rebarajan en la misma partida.
12. En este prototipo no hay dobles, triples, cartas que muevan dados ni colecciones extra. Las botellas misteriosas quedan fuera del primer motor; se pueden sumar después si el ciclo se aguanta.

### Cómo se explica en un minuto

Entran juntos, roban vino y salen antes del 666. La primera vez una vela los cubre; cada vez bajan más profundo, el vino vale más y el Diablo está más cerca. Tienen que juntar 20 puntos entre todos, pero gana quien más aseguró… si no lo pilló el Diablo en el último bajón.

## Números de la simulación

Método: 15.000 partidas por celda, 11 nov 2026. Políticas fijas (no juegan “perfecto”): **cauta** sale al ver dos 6; **media** acepta 0/1/2 saqueos extra según la incursión (y un poco más en la última si va atrás o falta la ofrenda); **ambiciosa** acepta 1/3/5. En mesa mixta, si alguien se queda, los demás huyen o arriesgan. Tiempos de mesa: supuestos (45 s por saqueo con 3–4 jugadores, 60 s con 6; más 45 s por incursión y 75 s de preparación).

Ofrenda = 20. Curva v0.2. Mancha del Diablo en la 3.ª.

| Mesa | Llega a 20 | Tiradas (media) | Minutos (est.) | Supervivencia por incursión (no aparece el 666) |
| --- | ---: | ---: | ---: | --- |
| 4 cautas | 63 % | 15,5 | 15 | 92 % / 91 % / 91 % |
| 4 medias | 65 % | 18,0 | 17 | 91 % / 77 % / 63 % |
| 4 ambiciosas | 56 % | 22,0 | 20 | 76 % / 53 % / 37 % |
| Mixta 4 (1 cauta, 2 medias, 1 ambiciosa) | 51 % | 22,0 | 20 | 76 % / 53 % / 36 % |
| Mixta 3 (1 de cada) | 53 % | 22,0 | 20 | 77 % / 53 % / 36 % |
| Mixta 6 (2 de cada) | 54 % | 21,8 | 25 | 76 % / 53 % / 36 % |

En mesa mixta de 4, puntos medios por persona: cauta 4,6; media 4,7; ambiciosa 7,4. Victoria única por asiento: cauta 4,4 %; media 4,6 %; ambiciosa 25 %. Incluyendo empates: 7 %, 8 % y 31 %. La ambiciosa gana a veces y se queda fuera a menudo (en esa mesa, el 666 de la 3.ª la pilla en ~64 % de las partidas si seguía dentro). La cauta rara vez gana en solitario. Nadie gana en ~49 % de las partidas mixtas de 4 (no se llega a 20, o todos los elegibles quedan manchados). Con 6 el reparto es más parejo (victorias únicas por asiento: 1,4 % / 4,4 % / 10,3 %; con empates, 6,7 % / 11 % / 19 %).

Si el grupo sale siempre al ver dos 6, la 1.ª rinde ~6,4 botellas, la 2.ª ~4,6 y la 3.ª ~3,0. El riesgo de la primera tirada de cada incursión es 0, 0,46 % y 2,8 %.

Estos perfiles son estereotipos de simulación. En una mesa real la gente cambia de idea; el prototipo sirve para ver si la curva se siente así.

## Configuración del prototipo digital

Valores que el motor debe leer de un config, no de literales repartidos en la vista:

```json
{
  "playersMin": 3,
  "playersMax": 6,
  "incursions": 3,
  "dice": 3,
  "devilAtLockedSixes": 3,
  "startLocked": [0, 0, 1],
  "candleAbsorbsFirstSix": [true, false, false],
  "valueMultiplier": [1, 2, 3],
  "incursionNames": ["Las tinajas", "Las cavas", "La sacristía"],
  "offeringThreshold": 20,
  "fleePenalty": 1,
  "unanimousLeave": true,
  "lastIncursionDevilIneligible": true,
  "rotateFirstActorEachIncursion": true,
  "discardLostBottles": true,
  "soloSaqueoCap": null,
  "mysteryBottles": 0,
  "specialDiceEffects": false
}
```

El motor de reglas va separado del render, con RNG de semilla, en un proyecto independiente. Primer hito: hot-seat local. Validar lint, tests y build en cada fase.

## Qué no entra todavía

Dobles, triples, eventos, cartas que muevan dados, colecciones de cepas y botellas misteriosas. El §38 del GDD pide probar primero si el ciclo es entretenido.

Si se publica, “Casillero del Diablo” es marca registrada de Viña Concha y Toro. Este título es de trabajo.
