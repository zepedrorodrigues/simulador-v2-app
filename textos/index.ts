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
