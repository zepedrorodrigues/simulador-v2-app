// Todas as frases da interface, num sítio só.
//
// ⚠️ **Nenhuma frase é escrita dentro de um componente.** É a regra do `APP.md`
// §1, e a razão é dupla: acrescentar uma língua passa a ser mecânico em vez de
// ser uma reescrita, e — o que importa mais aqui — as frases que explicam
// números de crédito ficam todas à vista umas das outras, onde se lê se estão a
// dizer a mesma coisa.
//
// Português de Portugal. Sem gerúndio brasileiro.

export const textos = {
  app: {
    nome: "Simulador de Crédito",
    subtitulo: "Compare o crédito à habitação dos bancos portugueses",
  },

  comum: {
    seguinte: "Seguinte",
    anterior: "Anterior",
    comparar: "Comparar",
    fechar: "Fechar",
    tentarDeNovo: "Tentar de novo",
    comecar: "Começar",
    aCarregar: "A carregar os bancos…",
  },

  // Os três passos do pedido (`ECRAS.md` §1). Um passo, uma pergunta.
  pedido: {
    passo1: {
      titulo: "O imóvel",
      valorImovel: "Valor do imóvel",
      montante: "Quanto quer financiar",
      prazo: "Prazo",
      finalidade: "Finalidade",
      // ⚠️ Os rótulos das opções vivem aqui e não a par dos valores do contrato:
      // `propria` é o que viaja no JSON, «Habitação própria» é o que se lê.
      finalidades: {
        propria: "Habitação própria",
        secundaria: "Habitação secundária",
        arrendamento: "Arrendamento",
      },
      localizacao: "Localização",
      localizacoes: {
        continente: "Continente",
        acores: "Açores",
        madeira: "Madeira",
      },
      garantiaPublica: "Garantia Pública para Jovens",
      // ⚠️ A leitura do LTV é a razão de o mostrar ao vivo. O v1 tinha um campo
      // `LTV` desactivado, sem explicação nenhuma ao lado.
      ltv: "Rácio de financiamento (LTV)",
      ltvPorPatamares:
        "O preço muda por patamares de LTV, e cada banco tem os seus: baixar o montante pode mudar a taxa.",
      montanteExcede: "O montante não pode exceder o valor do imóvel.",
      prazoForaDeAlguns: "Nem todos os bancos escolhidos aceitam este prazo.",
    },

    passo2: {
      titulo: "Os titulares",
      primeiroTitular: "1.º titular",
      segundoTitular: "2.º titular",
      nascimento: "Data de nascimento",
      rendimento: "Rendimento mensal",
      acrescentar: "Acrescentar 2.º titular",
      remover: "Remover 2.º titular",
      // ⚠️ Esta caixa é obrigatória por desenho: pedir dados pessoais sem
      // justificar é o que faz uma app parecer um funil de recolha.
      porqueANascimento:
        "A idade define o prazo máximo: cada banco exige que o crédito termine até certa idade.",
      dataInvalida: "Escreva a data como dd/mm/aaaa.",
      idadeMinima: "Um titular tem de ter pelo menos 18 anos.",
      // ⚠️ Medido, não suposto: dos cinco bancos, só o Novo Banco declara que
      // usa o rendimento — e a nota dele diz que nem lá mexe no preço.
      rendimentoNaoPedido:
        "Nenhum dos bancos escolhidos usa o rendimento para calcular o preço, por isso não o pedimos.",
      oQueOsBancosDizem: "O que cada banco faz com isto",
    },

    passo3: {
      titulo: "A taxa e os bancos",
      tipoDeTaxa: "Tipo de taxa",
      variavel: "Variável",
      mista: "Mista",
      fixa: "Fixa",
      periodoFixo: "Período fixo",
      // ⚠️ Não diz «nem todos os bancos os têm» sem dizer quais: é a nota que
      // acompanha as opções esbatidas, e nomeia quem falta.
      periodoNemTodos: "As opções esbatidas não existem em todos os bancos escolhidos.",
      periodosObservados:
        "Em alguns bancos esta lista é o que se observou no simulador deles, e pode não ser tudo o que praticam.",
      indexante: "Indexante Euribor",
      jaCliente: "Já sou cliente do banco",
      bancos: "Bancos",
      semIndexanteEscolhivel:
        "Nenhum dos bancos escolhidos deixa escolher o indexante: cada um aplica o seu.",
      produtosDoBanco: "Bonificações",
      // ⚠️ A frase mais importante deste ecrã, e está medida: a 2026-07-26, com
      // as bonificações do Novo Banco ligadas por omissão e as da CGD não, a
      // comparação aparecia invertida.
      produtosMudamOPreco:
        "As bonificações mudam o preço. Comparam-se as que estiverem marcadas, banco a banco.",
      nenhumBanco: "Escolha pelo menos um banco.",
    },
  },

  // ⚠️ Estas quatro dizem o que a app é e o que não é. Saem do
  // `USO-RESPONSAVEL.md` e não são texto de rodapé decorativo: são a diferença
  // entre informar e induzir em erro.
  postura: {
    naoEProposta:
      "Valores indicativos, de simuladores públicos. Não são propostas, não vinculam o banco e não são aconselhamento financeiro.",
    taegDerivada:
      "A TAEG e o MTIC não vêm do banco: são calculados a partir dos encargos medidos.",
    taegOficial:
      "A TAEG que vincula alguém vem na ficha de informação normalizada, depois de o banco avaliar quem pede.",
    semDadosPessoais:
      "O que escrever aqui não é guardado: fica no ecrã e desaparece quando sair.",
  },

  // ⚠️ O ecrã das ofertas é da fase A5 e ainda não existe. O que está aqui é o
  // suficiente para o passo 3 ter para onde levar a pessoa sem lhe mentir: diz
  // que o pedido está montado e que a lista ainda não foi construída. Um ecrã
  // que fingisse resultados era pior do que um que os não tem.
  ofertas: {
    titulo: "Ofertas",
    porConstruir: "O pedido está completo. A lista de ofertas é a fase seguinte da app.",
  },

  // Os erros que a app tem de saber mostrar, um a um. ⚠️ A A6 do `APP.md` diz
  // que isto não é polimento: uma app que só se viu com tudo a responder bem é
  // uma app que ninguém sabe como se comporta quando não responde.
  erros: {
    semRede: {
      titulo: "Sem ligação",
      corpo: "Não foi possível falar com o servidor. Verifique a ligação à Internet.",
    },
    servidorEmBaixo: {
      titulo: "O serviço não está a responder",
      corpo: "Isto é do nosso lado. Tente daqui a pouco.",
    },
    semSerie: {
      titulo: "Ainda não há preços para comparar",
      corpo:
        "Os preços vêm de um varrimento aos simuladores dos bancos, e ainda não correu nenhum. Tente mais tarde.",
    },
    tectoExcedido: {
      titulo: "Demasiadas comparações",
      corpo: "Fez muitos pedidos em pouco tempo. Espere um pouco antes de tentar de novo.",
    },
    pedidoInvalido: {
      titulo: "Falta rever o pedido",
      corpo: "Há um campo que o servidor não aceitou.",
    },
  },
} as const;

/**
 * As frases que levam números ou nomes lá dentro.
 *
 * ⚠️ Vivem aqui pela mesma razão que as outras, e por uma a mais: são
 * exactamente as que a pressa faz escrever no meio do JSX, com o plural errado e
 * o número colado ao símbolo. Ficando neste ficheiro, lêem-se todas ao lado umas
 * das outras — que é onde se vê se estão a dizer a mesma coisa.
 */
export const frases = {
  /** «5 de 5». */
  bancosEscolhidos: (escolhidos: number, total: number) => `${escolhidos} de ${total}`,

  /** «Comparar (5)» — o botão diz quantos bancos leva. */
  compararComContagem: (quantos: number) => `${textos.comum.comparar} (${quantos})`,

  /** ⚠️ Nomeia quem impõe, em vez de dizer «alguns bancos». */
  indexanteImposto: (nomes: string[]) =>
    nomes.length === 1
      ? `${nomes[0]} impõe o seu indexante — a escolha aplica-se aos restantes.`
      : `${listar(nomes)} impõem o seu indexante — a escolha aplica-se aos restantes.`,

  /**
   * ⚠️ As idades saem dos dados (`idade_maxima_fim`) e não estão escritas à mão.
   * Estavam «75-83» no `ECRAS.md`, e um número escrito à mão numa frase é um
   * número que fica errado quando entra o sexto banco.
   */
  idadeLimite: (min: number, max: number) =>
    min === max
      ? `Nos bancos escolhidos, o crédito tem de terminar até aos ${min} anos.`
      : `Nos bancos escolhidos, o crédito tem de terminar até aos ${min}-${max} anos, conforme o banco.`,

  /** Quem fica de fora com o prazo escolhido. */
  foraDoPrazo: (nomes: string[]) => `${listar(nomes)}: prazo fora do que aceitam.`,

  /** Quem tem um período fixo que os outros não têm. */
  periodoSo: (nomes: string[]) => `Só em ${listar(nomes)}.`,

  /** «LTV 80,0 %» já formatado pelo chamador. */
  ltv: (percentagem: string) => `LTV ${percentagem}`,

  /** ⚠️ A nota é a do banco, palavra por palavra: vem do contrato e não se reescreve. */
  notaDoBanco: (banco: string, nota: string) => `${banco}: ${nota}`,
};

/** «A, B e C» — com o «e» no sítio, que é onde a interpolação preguiçosa falha. */
function listar(nomes: string[]): string {
  if (nomes.length === 0) return "";
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}
