/**
 * The beginner's method, layer by layer, starting from the daisy.
 *
 * Every algorithm here was checked against the cube engine: see
 * __tests__/tutorial.test.ts, which confirms that each one leaves the layers
 * it claims to leave alone and cycles the pieces the text says it cycles.
 *
 * The text assumes the cube is held with yellow up and white down, which is
 * how the demo on screen shows it.
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
    id: 'notacao',
    title: 'Como ler os movimentos',
    goal: 'Entender R, U, F e o resto antes de começar.',
    body: [
      'Cada letra é uma face: R (direita), L (esquerda), U (cima), D (baixo), F (frente) e B (trás). A letra sozinha significa girar aquela face 90° no sentido horário, olhando de fora para ela.',
      "O apóstrofo inverte: R' é anti-horário. O 2 é meia volta: R2 dá no mesmo nos dois sentidos.",
      'As letras minúsculas x, y e z giram o cubo inteiro na mão, sem mexer em nenhuma camada em relação às outras. Servem só para mudar o que fica de frente.',
      'Cuidado com uma pegadinha: D é girar a face de baixo horário vista de baixo. É fácil errar o sentido dessa.',
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
    id: 'margarida',
    title: 'A margarida',
    goal: 'Quatro arestas brancas em volta do centro amarelo.',
    body: [
      'Segure o cubo com o centro amarelo para cima. Procure as quatro arestas brancas — as peças de duas cores que tenham branco — e leve cada uma para junto do amarelo, formando uma flor.',
      'Aqui não há algoritmo, e não precisa: gire a face lateral onde a aresta está até ela chegar em cima.',
      'O único cuidado é não derrubar as pétalas já colocadas. Se o lugar de cima já estiver ocupado, gire U para abrir espaço antes de subir a próxima.',
    ],
  },
  {
    id: 'cruz',
    title: 'A cruz branca',
    goal: 'As quatro arestas brancas na face branca, com as cores laterais batendo.',
    body: [
      'Olhe uma pétala: além do branco, ela tem outra cor, virada para um dos lados. Gire U até essa cor ficar de frente para o centro da mesma cor.',
      'Com as duas casadas, gire aquela face 180° — F2, R2, L2 ou B2. A aresta desce direto para o lugar dela na face branca.',
      'Repita com as quatro. No fim, a face branca tem uma cruz e, visto de lado, cada aresta forma um T com o centro da cor dela.',
    ],
    warning: 'Girar só 90° coloca a peça no lugar errado. É sempre meia volta.',
  },
  {
    id: 'cantos-brancos',
    title: 'Os cantos brancos',
    goal: 'A primeira camada inteira, branca e com as laterais certas.',
    body: [
      'Vire o cubo: branco para baixo, amarelo para cima. Agora faltam os quatro cantos brancos.',
      'Procure um canto com branco na camada de cima e gire U até ele ficar exatamente acima do buraco dele — aquele entre os dois centros das outras duas cores dele.',
      'Com o canto na frente-direita de cima, repita o algoritmo abaixo até ele descer encaixado. Pode precisar de uma, três ou cinco repetições, dependendo de como ele está virado.',
      'Se um canto branco estiver preso embaixo no lugar errado, use o segundo algoritmo para tirá-lo para cima e recomece com ele.',
    ],
    algorithms: [
      {
        label: 'Encaixar o canto',
        moves: "R U R' U'",
        note: 'Repita até entrar.',
      },
      {
        label: 'Tirar canto preso',
        moves: "R U R'",
        note: 'Com o canto na frente-direita de baixo.',
      },
    ],
  },
  {
    id: 'segunda-camada',
    title: 'A segunda camada',
    goal: 'As quatro arestas do meio no lugar.',
    body: [
      'Agora só interessam as arestas de cima que não tenham amarelo. Gire U até a cor da frente dessa aresta casar com o centro da frente — ela forma um T de cabeça para baixo.',
      'Olhe a cor de cima da aresta: se for igual ao centro da direita, ela precisa ir para a direita; se for igual ao da esquerda, para a esquerda.',
      'Se não sobrar nenhuma aresta sem amarelo em cima, é porque alguma está no meio virada ou no lugar errado. Aplique um dos dois algoritmos com qualquer aresta de cima naquela posição: isso expulsa a intrusa para cima, e aí você a resolve normalmente.',
    ],
    algorithms: [
      { label: 'Para a direita', moves: "U R U' R' U' F' U F" },
      { label: 'Para a esquerda', moves: "U' L' U L U F U' F'" },
    ],
  },
  {
    id: 'cruz-amarela',
    title: 'A cruz amarela',
    goal: 'Uma cruz amarela no topo, sem olhar as laterais.',
    body: [
      'Daqui para frente só importa o amarelo de cima; as cores laterais do topo ficam para depois.',
      'Olhe o desenho que o amarelo faz na face de cima. Pode ser um ponto, um L ou uma linha. O mesmo algoritmo atende aos três, aplicado na posição certa:',
      'Linha: deixe-a deitada, na horizontal. L: gire U até as duas pontas apontarem para a esquerda e para cima. Ponto: aplique de qualquer jeito.',
      'Ponto vira L, L vira linha, linha vira cruz. No pior caso são três aplicações.',
    ],
    algorithms: [{ label: 'Cruz amarela', moves: "F R U R' U' F'" }],
  },
  {
    id: 'posicionar-cantos',
    title: 'Posicionar os cantos amarelos',
    goal: 'Cada canto de cima no seu lugar, mesmo torto.',
    body: [
      'Antes de virar o amarelo dos cantos, leve cada um para o canto certo. Um canto está no lugar certo quando as três cores dele batem com os três centros ao redor — não importa se o amarelo está para o lado.',
      'Procure um canto que já esteja certo e segure o cubo com ele na frente-direita de cima. O algoritmo gira os outros três entre si e não toca nesse.',
      'Se nenhum canto estiver certo, aplique uma vez em qualquer posição: aparece pelo menos um, e aí você segura esse e repete.',
    ],
    algorithms: [
      {
        label: 'Girar três cantos',
        moves: "U R U' L' U R' U' L",
        note: 'O canto da frente-direita fica parado.',
      },
    ],
  },
  {
    id: 'virar-cantos',
    title: 'Virar os cantos amarelos',
    goal: 'A face amarela inteira pronta.',
    body: [
      'Segure o cubo com um canto ainda torto na frente-direita de cima. Repita o algoritmo até o amarelo daquele canto apontar para cima — duas ou quatro vezes.',
      'Sem girar o cubo na mão, gire só U para trazer o próximo canto torto para a mesma posição da frente-direita, e repita.',
      'Quando todos estiverem virados, um último U fecha o resto.',
    ],
    algorithms: [
      {
        label: 'Virar o canto',
        moves: "R' D' R D",
        note: 'Duas ou quatro vezes.',
      },
    ],
    warning:
      'No meio desse passo o cubo parece todo desmontado. É normal: enquanto você não girar o cubo na mão e só mexer em U entre um canto e outro, tudo volta ao lugar no fim.',
  },
  {
    id: 'posicionar-arestas',
    title: 'Posicionar as arestas amarelas',
    goal: 'Cubo resolvido.',
    body: [
      'Falta rodar as arestas de cima. Gire U e procure um lado em que a aresta de cima já esteja na cor do centro.',
      'Segure o cubo com essa aresta para trás. O algoritmo gira as outras três entre si.',
      'Se nenhuma aresta estiver certa, aplique uma vez de qualquer jeito: uma delas acerta, e aí você a deixa atrás e repete.',
    ],
    algorithms: [
      {
        label: 'Girar três arestas',
        moves: "R U' R U R U R U' R' U' R2",
        note: 'A aresta de trás fica parada.',
      },
    ],
  },
];
