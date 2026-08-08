import {
  eFalhaDaApi,
  FalhaDaApi,
  pedir,
  traduzirEstatuto,
  type EspecieDeFalha,
} from "@/api/cliente";
import { textos } from "@/textos";

describe("a tradução dos estatutos", () => {
  // ⚠️ **O 503 do contrato é o `banco_ocupado`, e NÃO «o servidor está em
  // baixo».** O contrato diz por palavras para que serve a distinção: «para a
  // app poder voltar a pedir este banco daqui a um instante em vez de o riscar
  // da lista». O banco está bem; quem não tinha lugar éramos nós, e isto passa
  // sozinho.
  //
  // ⚠️ **Este teste afirmava `semSerie` até 2026-08-07**, e a mensagem dele
  // dizia à pessoa o inverso do que agora é verdade: aquele 503 resolvia-se
  // correndo o varrimento e não esperando. Trocar os dois manda quem lê fazer
  // exactamente a coisa errada.
  it("lê o 503 como o banco ocupado, e não como o servidor em baixo", () => {
    expect(traduzirEstatuto(503)).toBe("bancoOcupado");
    expect(traduzirEstatuto(500)).toBe("servidorEmBaixo");
    expect(traduzirEstatuto(502)).toBe("servidorEmBaixo");
  });

  it("nomeia o tecto e o pedido inválido", () => {
    expect(traduzirEstatuto(429)).toBe("tectoExcedido");
    expect(traduzirEstatuto(400)).toBe("pedidoInvalido");
  });

  // ⚠️ Só se pede um banco cujo id veio do `GET /api/v1/bancos`: um 404 é defeito
  // nosso, e não um estado que valha a pena explicar a quem está do outro lado.
  it("não dá ao 404 espécie própria", () => {
    expect(traduzirEstatuto(404)).toBe("servidorEmBaixo");
  });
});

describe("as espécies de falha", () => {
  // ⚠️ Uma espécie sem frase escrita dá um ecrã de erro vazio, e é o tipo de
  // buraco que só aparece no dia em que o servidor devolve esse estatuto.
  it("têm todas texto escrito", () => {
    const especies: EspecieDeFalha[] = [
      "semRede",
      "servidorEmBaixo",
      "bancoOcupado",
      "tectoExcedido",
      "pedidoInvalido",
    ];
    for (const especie of especies) {
      expect(textos.erros[especie].titulo.length).toBeGreaterThan(0);
      expect(textos.erros[especie].corpo.length).toBeGreaterThan(0);
    }
  });
});

describe("o cliente", () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  function responderCom(estatuto: number, corpo: unknown, cabecalhos: Record<string, string> = {}) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: estatuto >= 200 && estatuto < 300,
      status: estatuto,
      headers: { get: (nome: string) => cabecalhos[nome] ?? null },
      json: async () => corpo,
    }) as unknown as typeof fetch;
  }

  it("devolve o corpo quando corre bem", async () => {
    responderCom(200, { bancos: [], inputs_canonicos: [] });
    await expect(pedir("/api/v1/bancos")).resolves.toEqual({ bancos: [], inputs_canonicos: [] });
  });

  it("traz o campo que o servidor nomeou num 400", async () => {
    responderCom(400, { erro: { codigo: "pedido_invalido", mensagem: "…", campo: "montante" } });

    await expect(pedir("/api/v1/ofertas/cgd")).rejects.toMatchObject({
      especie: "pedidoInvalido",
      campo: "montante",
    });
  });

  it("lê o Retry-After de um 429", async () => {
    responderCom(429, { erro: { codigo: "tecto_excedido", mensagem: "…" } }, { "Retry-After": "30" });

    await expect(pedir("/api/v1/ofertas/cgd")).rejects.toMatchObject({
      especie: "tectoExcedido",
      esperarSegundos: 30,
    });
  });

  // ⚠️ Isto acontece de verdade: um proxy à frente do servidor devolve HTML num
  // 502. O estatuto já disse o que interessa, e um corpo que não é o JSON do
  // contrato não é motivo para esconder a falha.
  it("não se engasga com um corpo que não é o do contrato", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 502,
      headers: { get: () => null },
      json: async () => {
        throw new Error("<html>");
      },
    }) as unknown as typeof fetch;

    await expect(pedir("/api/v1/bancos")).rejects.toMatchObject({ especie: "servidorEmBaixo" });
  });

  it("chama sem rede o que não chegou ao servidor", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Network request failed"));

    await expect(pedir("/api/v1/bancos")).rejects.toMatchObject({ especie: "semRede" });
  });

  it("reconhece a falha que ele próprio atirou", async () => {
    responderCom(503, { erro: { codigo: "banco_ocupado", mensagem: "…" } });

    try {
      await pedir("/api/v1/bancos");
      throw new Error("devia ter falhado");
    } catch (erro) {
      expect(eFalhaDaApi(erro)).toBe(true);
      expect(eFalhaDaApi(new Error("outra coisa"))).toBe(false);
    }
  });

  // ⚠️ **Este é o teste que justifica a marca, e o anterior não era.** Sob o
  // Jest, `instanceof` sobre a subclasse de `Error` funciona — trocar a marca
  // por `instanceof` não partia o teste de cima, e um teste que não distingue as
  // duas implementações não prova nenhuma delas.
  //
  // O que distingue é isto: uma falha que não foi construída por ESTA cópia da
  // classe. Acontece quando o módulo entra duas vezes no bundle, ou atravessa
  // uma fronteira de contexto — e é aí que o `instanceof` diz «não é uma falha
  // da API» sobre uma falha da API, e o `catch` a deixa passar em silêncio.
  it("reconhece uma falha que não foi construída por esta cópia da classe", () => {
    const deOutraCopia = Object.assign(new Error("semRede"), {
      marca: "falha-da-api",
      especie: "semRede",
    });

    expect(eFalhaDaApi(deOutraCopia)).toBe(true);
    expect(deOutraCopia instanceof FalhaDaApi).toBe(false);
  });
});
