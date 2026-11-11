# Casillero

Entran con un solo dado. Cada 6 deja una marca; a la tercera aparece el Diablo. Las cartas de la bodega prenden o apagan el ruido: más dados, más seises. La primera bajada es más quieta; más abajo el vino vale más y ya hay una marca. Hay que juntar **14 puntos** entre todos. Gana quien más aseguró, si el Diablo no lo manchó en la última incursión.

Este repositorio es el prototipo digital de las reglas v0.3, jugado encima del v0.2. La mesa de verdad sigue siendo el lugar donde se afina. El título es de trabajo: «Casillero del Diablo» es marca registrada de Viña Concha y Toro.

- Reglas v0.3: [docs/casillero-reglas-v0.3.md](docs/casillero-reglas-v0.3.md)
- Reglas v0.2, por si hay que comparar: [docs/casillero-reglas-v0.2.md](docs/casillero-reglas-v0.2.md)

## Cómo correrlo

Hace falta Node 20 o más nuevo.

```bash
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Es una mesa local: se pasan el celular para el voto secreto. La semilla de arriba repite la misma bodega y las mismas tiradas.

El botón **Sonido / Bajo / Mudo** (arriba a la izquierda) cambia el volumen. El audio es procedural, con la Web Audio API: no hay samples. Si el sistema pide «reducir movimiento», las ramas y la vela se mueven mucho menos.

Otros comandos:

```bash
npm test       # motor de reglas, Vitest
npm run lint   # ESLint
npm run typecheck
npm run build  # typecheck + Vite
```

## Cómo se juega

1. Elijan de 3 a 6 nombres y, si quieren, una semilla.
2. Tres incursiones, siempre partiendo con **un dado**: **Las tinajas** (×1, cero marcas), **Las cavas** (×2, una marca) y **La sacristía** (×3, una marca).
3. En cada saqueo, quien tiene el turno roba la carta de arriba.
   - Si es **botella**, va a su botín expuesto.
   - Si es **evento**, se resuelve al tiro. Ruido y Barrica cae suman dados (máximo 3). Silencio y, a veces, Vela los quitan (mínimo 1). Vela apaga una marca si hay. Eco le saca una botella a quien tiene dos o más expuestas. Encrucijada deja elegir: otra botella y un dado, o pasar. Pisada suma una marca y puede despertar al Diablo sin tirar. Trasiego cambia el botín expuesto con quien más tiene.
4. Si el Diablo no apareció con la carta, se tiran los dados que hay en juego. Si sale **algún** 6, se suma **una** marca, aunque varios dados muestren 6.
5. Tres marcas: aparece el Diablo. La bodega se oscurece con cada marca (velas, ramas, bichos, crujidos; en dos marcas, un latido). Al empezar otra incursión el ambiente vuelve al nivel de las marcas de entrada.
6. Si no aparece, votan en secreto quienes siguen dentro: **seguir** o **salir**. La salida segura pide unanimidad. Si no la hay, quien votó salir **huye** (pierde 1 al azar) o se queda.
7. Quienes seguían dentro y los pilla el Diablo pierden lo expuesto. Lo ya asegurado no se toca. En la tercera incursión, además, quedan manchados y no pueden ganar.
8. Al cierre no hay botellas misteriosas. Si entre todos no juntan 14 en la colección segura, no gana nadie. Si juntan, gana quien tenga más entre quienes pueden. El empate se comparte.

En la mesa, el botín expuesto y la colección segura van separados. Solo lo seguro cuenta para la ofrenda y para ganar. Los 12 eventos se reponen al empezar cada incursión; las botellas perdidas no vuelven.

## Cómo está armado

- `src/config.ts` tiene los números de v0.3: dados, marcas, eventos, ofrenda. La vista no los repite.
- `src/engine/` es el motor puro, con semilla. No dibuja ni suena.
- `src/ui/` es la mesa en PixiJS 8 (`new Application()` y después `await app.init()`). La atmósfera (vigneta, vela, ramas) y el audio viven ahí, separados de las reglas.
- `tests/` cubre el tope de una marca por tirada, el umbral, el piso y el techo de dados, cada evento, la reposición del mazo, las marcas de entrada, la unanimidad, la huida y el recuento.

## Decisiones que el diseño puede cambiar

1. **Ofrenda 14.** El archivo la deja como sugerencia y pregunta abierta. El diseñador la confirmó para este prototipo. 20 sigue en el documento como la alternativa que casi nadie califica.
2. **Eco: qué botella se pierde.** No está dicho. Se mezcla el botín de cada persona (desde quien acaba de robar, en el sentido de la mesa) y se va la primera de esa mezcla al descarte. No vuelve a la bodega.
3. **Trasiego empatado.** Si dos tienen la misma cantidad, y es la mayor por encima de quien roba, cambia con la primera en el sentido de la mesa.
4. **Encrucijada.** «Tomar» saca la primera botella que quede en el mazo y deja los eventos en su orden. Si no queda ninguna, el botón no se ofrece. Después de elegir, igual se tira.
5. **Pisada que llega a 3** no tira los dados. La incursión termina ahí.
6. **Tope de dados y de marcas.** Si un efecto pediría bajar de 1 o subir de 3, se queda en el límite y no pasa nada más. Una tirada suma como máximo `maxCountersPerRoll` (1): varios 6 cuentan como una marca.
7. **`candleAbsorbsFirstSix` y `startLocked`** siguen en la config, en false y ceros, para no arrastrar la v0.2. El motor no los usa. La vela es solo la carta.
8. **Dobles y triples** no hacen nada, aunque `specialDiceEffects` estuviera en true: v0.3 no apila otro sistema de caos.
9. **Eventos que sobran** se botan al empezar la incursión siguiente y entra un mazo fresco de 12, mezclado con las botellas que aún no se han robado.
10. **Voto y huida** siguen como en v0.2: salir sin unanimidad no saca a nadie; después se huye o se queda. Quien queda solo y vota salir asegura todo.
11. **Sonido.** No hay archivos de audio. Ratas, crujidos, susurros, latido y el drone del 666 se arman con osciladores y ruido en el navegador. El primer toque en la pantalla lo habilita.
