# JustACuber

App de cubo mágico 3x3: gerador de embaralhamento + cronômetro de speedcubing.

- **Embaralhamento oficial (random-state).** Um estado é sorteado uniformemente
  entre os 43 quintilhões possíveis e resolvido por um solver de duas fases
  (Kociemba, via [`cubejs`](https://github.com/ldez/cubejs)); o inverso da
  solução é o scramble. É o mesmo princípio do TNoodle, usado nas competições
  da WCA. As tabelas do solver vêm prontas (veja abaixo), então o primeiro
  embaralhamento sai em ~200 ms.
- **Cubo 3D animado.** O cubo gira movimento a movimento ao gerar um novo
  embaralhamento. Cada sticker é uma `View` posicionada por uma matriz 4x4
  completa — sem WebGL, sem dependência nativa de gráficos.
- **Cronômetro.** Segure para preparar (fica verde), solte para começar, toque
  para parar. Inspeção WCA de 15s opcional, com +2 e DNF automáticos.
- **Sessão.** Melhor tempo, ao5, ao12 e média, com penalidades editáveis por
  tempo. Os tempos ficam salvos no aparelho.

## Como rodar

```sh
npm start
```

Em outro terminal:

```sh
npm run android
```

ou

```sh
npm run ios
```

> As dependências nativas (`@react-native-async-storage/async-storage`) exigem
> recompilar o app — `npm run android` / `npm run ios` já fazem isso. No iOS,
> rode `bundle exec pod install` dentro de `ios/` antes.

## As tabelas do solver

O solver precisa de tabelas de busca. Construí-las leva **~25 s** no celular — o
Hermes interpreta o JavaScript, não compila, e os laços numéricos arrastam —
contra **~50 ms** para ler as mesmas tabelas já prontas de um JSON.

Por isso `scripts/build-solver-tables.js` as calcula uma vez, numa máquina com
JIT, e grava `src/lib/solverTables.js` (11 MB). Esse arquivo é **gerado, não
versionado**: o `postinstall` do npm o reconstrói sozinho. Para refazê-lo à mão:

```sh
npm run build:tables
```

Só é preciso rodar de novo se o `cubejs` for atualizado.

## Testes

```sh
npm test
```

## Organização

| Arquivo | O que faz |
| --- | --- |
| `src/lib/cube.ts` | Estado do cubo: cada sticker guarda posição e normal em 3D, e um movimento é uma rotação de verdade da camada. Validado contra o `cubejs`. |
| `src/lib/scramble.ts` | Geração random-state, com reserva random-move. |
| `src/lib/projection.ts` | Câmera, perspectiva, back-face culling e ordem de desenho. |
| `src/lib/matrix.ts` | Matrizes 4x4 em column-major (o formato que o React Native espera em `transform: [{matrix}]`). |
| `src/lib/stats.ts` | Tempos, penalidades e médias no padrão WCA. |
| `src/components/Cube3D.tsx` | Render e animação dos giros. |
| `src/screens/TimerScreen.tsx` | Tela principal. |
