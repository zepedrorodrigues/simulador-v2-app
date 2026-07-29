import type { CamposDoPedido } from "@/estado/pedido";
import {
  bancosEfectivos,
  paraComparacaoPedido,
  passo1Pronto,
  passo2Pronto,
  pedeRendimento,
  produtosDoBanco,
  usarPedido,
} from "@/estado/pedido";

import { cgd, montepio, novobanco } from "./ajudas";

const hoje = new Date("2026-07-29T00:00:00Z");

function camposDeTeste(retoques: Partial<CamposDoPedido> = {}): CamposDoPedido {
  return {
    valorImovel: 250_000,
    montante: 200_000,
    prazoAnos: 30,
    finalidade: "propria",
    localizacao: "continente",
    garantiaPublica: false,
    jaCliente: false,
    titulares: [{ dataNascimento: "12/04/1990", rendimentoMensal: 2200 }],
    tipoTaxa: "mista",
    periodoFixoAnos: 5,
    indexante: "6m",
    bancosEscolhidos: null,
    produtos: {},
    ...retoques,
  };
}

describe("os bancos escolhidos", () => {
  // ⚠️ `null` é «todos os que houver» e não «nenhum». É o que faz um banco novo
  // entrar na comparação no momento em que a API o serve, sem código nenhum.
  it("por omissão são todos", () => {
    expect(bancosEfectivos(null, ["cgd", "novobanco"])).toEqual(["cgd", "novobanco"]);
  });

  it("mantêm a ordem da API e não a das marcações", () => {
    expect(bancosEfectivos(["novobanco", "cgd"], ["cgd", "novobanco", "montepio"])).toEqual([
      "cgd",
      "novobanco",
    ]);
  });

  it("materializam-se ao primeiro que se desmarca", () => {
    usarPedido.getState().limpar();
    usarPedido.getState().alternarBanco("cgd", ["cgd", "novobanco", "montepio"]);
    expect(usarPedido.getState().bancosEscolhidos).toEqual(["novobanco", "montepio"]);
  });
});

describe("as bonificações", () => {
  // ⚠️ Está medido o que custa errar isto: a 2026-07-26, com as do Novo Banco
  // ligadas por omissão e as da CGD não, a comparação aparecia invertida.
  it("por omissão são as que o banco liga", () => {
    expect(produtosDoBanco({}, "novobanco", ["novobanco:primeiro_banco"])).toEqual([
      "novobanco:primeiro_banco",
    ]);
  });

  it("desmarcar todas é uma escolha e não uma ausência de escolha", () => {
    expect(produtosDoBanco({ novobanco: [] }, "novobanco", ["novobanco:primeiro_banco"])).toEqual(
      [],
    );
  });
});

describe("o passo 1", () => {
  it("exige valor, montante e prazo", () => {
    expect(passo1Pronto(camposDeTeste())).toBe(true);
    expect(passo1Pronto(camposDeTeste({ valorImovel: null }))).toBe(false);
  });

  // ⚠️ É uma regra do domínio («o montante não pode exceder o valor do imóvel»)
  // e está aqui para o botão ser honesto — não para substituir o servidor.
  // Deixá-la só lá fazia a pessoa preencher três passos para receber um 400.
  it("recusa financiar mais do que o imóvel vale", () => {
    expect(passo1Pronto(camposDeTeste({ valorImovel: 200_000, montante: 250_000 }))).toBe(false);
  });
});

describe("o passo 2", () => {
  it("exige uma data válida e maioridade", () => {
    expect(passo2Pronto(camposDeTeste(), hoje, true)).toBe(true);
    expect(
      passo2Pronto(
        camposDeTeste({ titulares: [{ dataNascimento: "12/04/2015", rendimentoMensal: 0 }] }),
        hoje,
        true,
      ),
    ).toBe(false);
  });

  // ⚠️ O rendimento só é obrigatório quando algum banco escolhido o usa. Sem
  // isto, quem comparasse CGD com Montepio ficava com o botão desactivado à
  // espera de um campo que a app decidiu — com razão — não lhe mostrar.
  it("não exige rendimento quando ninguém o usa", () => {
    const semRendimento = camposDeTeste({
      titulares: [{ dataNascimento: "12/04/1990", rendimentoMensal: null }],
    });
    expect(passo2Pronto(semRendimento, hoje, false)).toBe(true);
    expect(passo2Pronto(semRendimento, hoje, true)).toBe(false);
  });

  it("pergunta o rendimento só quando algum banco o declara", () => {
    expect(pedeRendimento([cgd, montepio])).toBe(false);
    expect(pedeRendimento([cgd, novobanco])).toBe(true);
  });
});

describe("o corpo de POST /api/v1/comparacoes", () => {
  const todos = [cgd, novobanco, montepio];

  it("leva os bancos, o pedido e as bonificações por omissão", () => {
    const corpo = paraComparacaoPedido(camposDeTeste(), todos, hoje);

    expect(corpo).not.toBeNull();
    expect(corpo?.bancos).toEqual(["cgd", "novobanco", "montepio"]);
    expect(corpo?.pedido.valor_imovel).toBe(250_000);
    expect(corpo?.pedido.titulares[0].data_nascimento).toBe("1990-04-12");
    // Só o Novo Banco tem produto ligado por omissão.
    expect(corpo?.produtos).toEqual({ novobanco: ["novobanco:primeiro_banco"] });
  });

  // ⚠️ Mandar `fixed_period_years` numa taxa variável é um 400 do domínio: «a
  // taxa variável não tem período fixo». O campo fica no estado quando a pessoa
  // recua e muda de taxa, e é aqui que se decide que ele não viaja.
  it("não leva período fixo numa taxa variável", () => {
    const corpo = paraComparacaoPedido(
      camposDeTeste({ tipoTaxa: "variavel", periodoFixoAnos: 5 }),
      todos,
      hoje,
    );
    expect(corpo?.pedido.fixed_period_years).toBeUndefined();
    expect(corpo?.pedido.euribor_indexante).toBe("6m");
  });

  // ⚠️ E numa fixa não há Euribor nenhuma a que indexar.
  it("não leva indexante numa taxa fixa", () => {
    const corpo = paraComparacaoPedido(camposDeTeste({ tipoTaxa: "fixa" }), todos, hoje);
    expect(corpo?.pedido.euribor_indexante).toBeUndefined();
    expect(corpo?.pedido.fixed_period_years).toBe(5);
  });

  // ⚠️ Zero e não um ordenado inventado: o campo é obrigatório no contrato e
  // inerte em todos os bancos que esta comparação leva.
  it("manda zero de rendimento quando não o perguntou", () => {
    const corpo = paraComparacaoPedido(
      camposDeTeste({
        bancosEscolhidos: ["cgd", "montepio"],
        titulares: [{ dataNascimento: "12/04/1990", rendimentoMensal: null }],
      }),
      todos,
      hoje,
    );
    expect(corpo?.bancos).toEqual(["cgd", "montepio"]);
    expect(corpo?.pedido.titulares[0].rendimento_mensal).toBe(0);
  });

  it("não monta pedido nenhum sem bancos", () => {
    expect(paraComparacaoPedido(camposDeTeste({ bancosEscolhidos: [] }), todos, hoje)).toBeNull();
  });

  it("não monta pedido nenhum com o passo 1 por acabar", () => {
    expect(paraComparacaoPedido(camposDeTeste({ montante: null }), todos, hoje)).toBeNull();
  });
});
