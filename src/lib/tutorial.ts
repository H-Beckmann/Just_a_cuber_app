/**
 * The beginner's method — layer by layer, in seven steps.
 *
 * It follows the ONCUBE tutorial (blog.oncube.com.br), including its order,
 * its algorithms and the Brazilian names for the pieces: centro, meio, canto.
 * Two steps come before theirs: the pieces and the notation.
 *
 * Nothing here was taken on trust. Every algorithm, and every rule about how
 * to hold the cube, was run against the cube engine — see
 * __tests__/tutorial.test.ts, which walks each procedure over every position
 * the last layer can be in and checks that it always finishes. The counts
 * quoted in the text ("no máximo duas aplicações") come from those runs.
 *
 * The text holds the cube with yellow up and white down, which is how the
 * demo on screen shows it.
 */

export interface TutorialAlgorithm {
  label: string;
  /** Standard notation; parsed and played on the demo cube. */
  moves: string;
  note?: string;
}

export interface TutorialStep {
  id: string;
  title: string;
  /** One line: what you have when the step is done. */
  goal: string;
  body: string[];
  algorithms?: TutorialAlgorithm[];
  warning?: string;
}

export const TUTORIAL: TutorialStep[] = [
  {
    id: 'pecas',
    title: 'As peças do cubo',
    goal: 'Saber o que é centro, meio e canto.',
    body: [
      'O cubo não é feito de 54 adesivos soltos: são 26 peças de três tipos, e cada peça só para onde cabe uma do mesmo tipo.',
      'Centro: uma cor só, no miolo da face. São seis, e nunca trocam de lugar entre si — por isso é o centro que decide a cor da face. Se o centro de cima é amarelo, a face de cima é a amarela, mesmo que ainda não tenha nenhum amarelo em volta.',
      'Meio: duas cores, entre dois centros. São doze. Em outros tutoriais essa peça aparece como "aresta" — é a mesma coisa.',
      'Canto: três cores, nas quinas. São oito.',
      'As cores opostas no padrão original: branco e amarelo, azul e verde, laranja e vermelho. Se o seu cubo for diferente, descubra quais são as opostas dele antes de começar.',
    ],
  },
  {
    id: 'notacao',
    title: 'Como ler os movimentos',
    goal: 'Entender R, U, F e o resto antes de começar.',
    body: [
      'Cada letra é uma face: R (direita), L (esquerda), U (cima), D (baixo), F (frente) e B (trás). A letra sozinha é girar aquela face 90° no sentido horário, olhando de fora para ela.',
      "O apóstrofo inverte: R' é anti-horário. O 2 é meia volta: R2 dá no mesmo nos dois sentidos.",
      'M é a camada do meio, entre L e R, girando no mesmo sentido do L. Ela só aparece no último passo.',
      'As letras minúsculas x, y e z giram o cubo inteiro na mão, sem mexer em nenhuma camada em relação às outras.',
      'Durante um algoritmo, não gire o cubo na mão. Girar no meio da sequência é o jeito mais fácil de aplicar um movimento na face errada e desmontar o que já estava pronto.',
    ],
    algorithms: [
      {
        label: "Exemplo: R U R' U'",
        moves: "R U R' U'",
        note: 'Repetido seis vezes, volta ao início. Toque para ver.',
      },
    ],
  },
  {
    id: 'cruz-branca',
    title: '1. A cruz branca',
    goal: 'Os quatro meios brancos na face branca, com as laterais casadas.',
    body: [
      'Esse é o único passo sem fórmula — é o que se resolve pensando, e por isso costuma ser o mais difícil no começo. O caminho mais fácil passa pela margarida.',
      'Margarida: segure o cubo com o centro amarelo para cima e leve os quatro meios brancos para junto dele, formando uma flor. Achou um meio branco na lateral? Gire aquela camada para subi-lo. Está embaixo? Gire a face duas vezes para levá-lo direto para cima.',
      'Se o lugar lá em cima já estiver ocupado por outro branco, gire U antes, para não derrubar a pétala que já estava lá.',
      'Com a margarida pronta, transforme-a na cruz: escolha uma pétala, gire U até a cor lateral dela encontrar o centro da mesma cor e então gire aquela face 180° (F2, R2, L2 ou B2). O meio branco desce já casado.',
      'Repita até não sobrar nenhum meio branco em cima. No fim, cada meio liga o centro branco ao centro da cor dele.',
    ],
    warning:
      'Girar 90° em vez de 180° coloca a peça no lugar errado. Nessa segunda etapa é sempre meia volta.',
  },
  {
    id: 'primeira-camada',
    title: '2. A primeira camada',
    goal: 'A face branca inteira, com os cantos.',
    body: [
      'Vire a cruz branca para baixo e não a tire mais de lá. Agora faltam os quatro cantos brancos.',
      'O caso fácil é o canto branco estar na camada de cima com o branco virado para o lado. Olhe a cor ao lado do adesivo branco, gire U até essa cor encontrar o centro dela, e o canto ficará exatamente acima do buraco onde ele entra.',
      'Aí é só ver de que lado o canto está e aplicar a fórmula correspondente. Ela é curta: joga a camada de cima para o lado oposto, levanta a lateral, devolve a camada de cima e desce a lateral.',
      'Se o canto estiver na camada de cima com o branco para cima, ou preso embaixo no lugar errado, use as fórmulas de tirar: elas transformam o caso no caso fácil, e aí você resolve normalmente.',
    ],
    algorithms: [
      { label: 'Canto à direita', moves: "U R U' R'" },
      { label: 'Canto à esquerda', moves: "U' L' U L" },
      {
        label: 'Branco para cima',
        moves: "R U' R'",
        note: 'Deixe o canto sobre um espaço ainda vazio.',
      },
      {
        label: 'Preso embaixo',
        moves: "R U R'",
        note: 'Com o canto à sua direita.',
      },
    ],
  },
  {
    id: 'segunda-camada',
    title: '3. A segunda camada',
    goal: 'As quatro peças de meio da camada do meio no lugar.',
    body: [
      'Procure na camada de cima um meio que não tenha amarelo — nem no topo, nem na lateral.',
      'Olhe a cor dele virada para você e gire U até ela encontrar o centro da mesma cor. A peça forma um T de cabeça para baixo com esse centro.',
      'Agora olhe a cor de cima dessa mesma peça e veja de que lado está o centro daquela cor: é para lá que ela vai. Aplique a fórmula do lado certo.',
      'Acabaram os meios sem amarelo e a camada não fechou? É porque tem uma peça errada encaixada, ou a certa mas invertida. Aplique qualquer uma das duas fórmulas no lugar dela: a intrusa sobe para a camada de cima, e aí você a encaixa direito.',
    ],
    algorithms: [
      { label: 'Para a direita', moves: "U R U' R' U' F' U F" },
      { label: 'Para a esquerda', moves: "U' L' U L U F U' F'" },
    ],
  },
  {
    id: 'cruz-amarela',
    title: '4. A cruz amarela',
    goal: 'Uma cruz amarela no topo, sem olhar as laterais.',
    body: [
      'Daqui para frente só importa o amarelo de cima. Neste passo ignore os cantos e olhe apenas os meios.',
      'O topo vai estar num de quatro estados: ponto, L, linha ou a cruz pronta. Uma única fórmula atende a todos, mudando só a posição em que você aplica.',
      'Ponto: aplique de qualquer jeito. L: gire U até as duas pontas apontarem para a esquerda e para trás. Linha: deixe-a deitada, na horizontal.',
      'Ponto vira L, L vira linha, linha vira cruz. No pior caso são três aplicações.',
    ],
    algorithms: [{ label: 'Cruz amarela', moves: "F R U R' U' F'" }],
    warning:
      'Não dá para ficar com um ou três meios amarelos em cima. Se isso aconteceu, algo saiu errado antes — provavelmente na segunda camada.',
  },
  {
    id: 'face-amarela',
    title: '5. A face amarela',
    goal: 'A face de cima toda amarela.',
    body: [
      'Agora os cantos. Conte quantos já estão com o amarelo para cima: serão zero, um ou dois, nunca três.',
      'Use sempre o canto de cima da frente-esquerda como referência e gire U até deixá-lo assim: com zero amarelos em cima, um canto com o amarelo apontando para a esquerda; com dois, um canto com o amarelo apontando para a frente; com um, o próprio canto que já está amarelo.',
      'Posicionado, aplique o Sune. Conte de novo e repita se ainda faltar — do começo ao fim são no máximo três aplicações.',
    ],
    algorithms: [{ label: 'Sune', moves: "R U R' U R U2 R'" }],
    warning:
      'No meio desse passo o cubo parece desmontado. É normal: enquanto você só girar U entre uma aplicação e outra, sem virar o cubo na mão, tudo volta ao lugar.',
  },
  {
    id: 'permutar-cantos',
    title: '6. Permutação dos cantos',
    goal: 'Cada canto de cima no seu lugar.',
    body: [
      'Procure, numa das quatro laterais, dois cantos de cima mostrando a mesma cor — um par. Pode girar U para procurar.',
      'Deixe esse par virado para a frente e aplique a fórmula. É a mais longa do método; atenção redobrada nos movimentos B e nos duplos.',
      'Se não houver nenhum par, aplique a fórmula de qualquer jeito: o par aparece. Com o par na frente, são no máximo duas aplicações.',
      'No fim, gire U até a última camada alinhar com as laterais.',
    ],
    algorithms: [
      {
        label: 'Permutar os cantos',
        moves: "R B' R F2 R' B R F2 R2",
        note: 'Com o par de cantos virado para a frente.',
      },
    ],
  },
  {
    id: 'permutar-meios',
    title: '7. Permutação dos meios',
    goal: 'Cubo resolvido.',
    body: [
      'Falta girar os meios de cima. Procure uma lateral que já esteja inteira, de uma cor só.',
      'Deixe essa face virada para trás. A fórmula gira os outros três meios entre si e não toca no de trás.',
      'Olhe para onde os meios precisam ir e escolha o sentido. As duas fórmulas são iguais, mudando só os dois movimentos de U.',
      'Se nenhuma lateral estiver inteira, aplique qualquer uma das duas: uma face fecha, e aí você a deixa atrás e aplica de novo. São no máximo duas aplicações.',
      'Esse é o único passo com o movimento M, a camada do meio. Segure as duas laterais com os dedos e gire só o miolo.',
    ],
    algorithms: [
      { label: 'Sentido horário', moves: "F2 U M' U2 M U F2" },
      { label: 'Sentido anti-horário', moves: "F2 U' M' U2 M U' F2" },
    ],
  },
];
