import { eFalhaDaApi, pedir, traduzirEstatuto, type EspecieDeFalha } from "@/api/cliente";
import { textos } from "@/textos";

describe("a tradução dos estatutos", () => {
  it("distingue o 503 de «o servidor está em baixo»", () => {
    // ⚠️ O 503 do contrato é `SerieIndisponivel`: o varrimento ainda não correu
    // para estes bancos, e resolve-se correndo `simulador varrer` — não
    // esperando. Empacotá-lo num «tente mais tarde» genérico mandava a pessoa
    // esperar por uma coisa que não vai acontecer sozinha.
    expect(traduzirEstatuto(503)).toBe("semSerie");
    expect(traduzirEstatuto(500)).toBe("servidorEmBaixo");
    expect(traduzirEstatuto(502)).toBe("servidorEmBaixo");
  });

  it("nomeia o tecto e o pedido inválido", () => {
    expect(traduzirEstatuto(429)).toBe("tectoExcedido");
    expect(traduzirEstatuto(400)).toBe("pedidoInvalido");
  });
});

describe("as espécies de falha", () => {
  // ⚠️ Uma espécie sem frase escrita dá um ecrã de erro vazio, e é o tipo de
  // buraco que só aparece no dia em que o servidor devolve esse estatuto.
  it("têm todas texto escrito", () => {
    const especies: EspecieDeFalha[] = [
      "semRede",
      "servidorEmBaixo",
      "semSerie",
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

    await expect(pedir("/api/v1/comparacoes")).rejects.toMatchObject({
      especie: "pedidoInvalido",
      campo: "montante",
    });
  });

  it("lê o Retry-After de um 429", async () => {
    responderCom(429, { erro: { codigo: "tecto_excedido", mensagem: "…" } }, { "Retry-After": "30" });

    await expect(pedir("/api/v1/comparacoes")).rejects.toMatchObject({
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

  // ⚠️ O `instanceof` sobre uma subclasse de `Error` devolve falso depois de
  // transpilada, e o sítio onde isso se descobre seria um `catch` que deixa
  // passar a falha em silêncio. É por isso que há uma marca.
  it("reconhece-se sem instanceof", async () => {
    responderCom(503, { erro: { codigo: "serie_indisponivel", mensagem: "…" } });

    try {
      await pedir("/api/v1/bancos");
      throw new Error("devia ter falhado");
    } catch (erro) {
      expect(eFalhaDaApi(erro)).toBe(true);
      expect(eFalhaDaApi(new Error("outra coisa"))).toBe(false);
    }
  });
});
