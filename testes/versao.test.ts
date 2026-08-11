// ⚠️ O mock vive aqui e não no `cliente.test.ts` para o `expoConfig` ser
// controlável num ficheiro só: o `jest.mock` é hoisted para o topo do módulo e
// vale para tudo o que ele importe.
//
// ⚠️ E o nome tem de começar por `mock` — é a única forma de a fábrica do
// `jest.mock` poder ler uma variável de fora sem o Jest a recusar.
let mockVersao: unknown = "0.1.0";

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return { version: mockVersao };
    },
  },
}));

import { pedir } from "@/api/cliente";
import { cabecalhoDaVersao, versaoDaApp, versaoParaCabecalho } from "@/api/versao";

// ⚠️ Reposto ANTES de cada teste e não depois: um teste que mude a versão e
// falhe a meio não repõe nada, e os que vêm a seguir passam ou falham por causa
// dele. Já aconteceu aqui, ao escrever isto.
beforeEach(() => {
  mockVersao = "0.1.0";
});

describe("a versão que se manda no cabeçalho", () => {
  it("manda três números", () => {
    expect(versaoParaCabecalho("0.1.0")).toBe("0.1.0");
    expect(versaoParaCabecalho("1.10.0")).toBe("1.10.0");
  });

  // ⚠️ **Não se manda em vez de se mandar como está.** O servidor serve quem
  // não manda o cabeçalho e serve quem o manda ilegível — o resultado é o
  // mesmo —, mas o contrato declara `pattern: '^\d+\.\d+\.\d+$'`, e mandar fora
  // do padrão era violá-lo para não obter nada em troca.
  it("não manda o que não são três números", () => {
    expect(versaoParaCabecalho("1.2")).toBeNull();
    expect(versaoParaCabecalho("1.2.3.4")).toBeNull();
    expect(versaoParaCabecalho("v1.2.3")).toBeNull();
    expect(versaoParaCabecalho("")).toBeNull();
  });

  // ⚠️ Recusado dos dois lados pela mesma razão: nunca se publicou uma
  // pré-lançamento, e a ordem entre `1.2.3-rc1` e `1.2.3` não está decidida em
  // lado nenhum deste projecto.
  it("não manda uma versão com sufixo", () => {
    expect(versaoParaCabecalho("1.2.3-rc1")).toBeNull();
    expect(versaoParaCabecalho("1.2.3+build7")).toBeNull();
  });

  // ⚠️ Acontece de verdade: o `expoConfig` pode vir vazio, e ler a versão nunca
  // pode ser condição para a app falar com o servidor.
  it("não manda nada quando a versão não se lê", () => {
    expect(versaoParaCabecalho(undefined)).toBeNull();
    expect(versaoParaCabecalho(null)).toBeNull();
    expect(versaoParaCabecalho(3)).toBeNull();
  });

  it("lê a versão do app.json", () => {
    mockVersao = "1.4.2";
    expect(versaoDaApp()).toBe("1.4.2");
  });
});

describe("o cliente a dizer quem é", () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  function espiarOFetch() {
    const espia = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({}),
    });
    global.fetch = espia as unknown as typeof fetch;
    return espia;
  }

  function cabecalhosDaChamada(espia: jest.Mock): Record<string, string> {
    return espia.mock.calls[0][1].headers as Record<string, string>;
  }

  // ⚠️ Sem isto o servidor nunca reconhece a app, e o `426` dele é código que
  // não corre: ele só recusa uma versão CONHECIDA e velha.
  it("põe a versão no pedido", async () => {
    const espia = espiarOFetch();
    await pedir("/api/v1/bancos");

    expect(cabecalhosDaChamada(espia)[cabecalhoDaVersao]).toBe("0.1.0");
  });

  it("não põe cabeçalho nenhum quando a versão não se lê", async () => {
    mockVersao = undefined;
    const espia = espiarOFetch();
    await pedir("/api/v1/bancos");

    expect(cabecalhoDaVersao in cabecalhosDaChamada(espia)).toBe(false);
  });

  // ⚠️ A rota dos bancos é a primeira que a app chama, e é a única que ela
  // consegue montar quando está velha de mais para as outras — por isso o
  // cabeçalho é de todos os pedidos e não só dos que levam corpo.
  it("põe a versão também no pedido com corpo", async () => {
    const espia = espiarOFetch();
    await pedir("/api/v1/ofertas/cgd", { method: "POST", body: "{}" });

    expect(cabecalhosDaChamada(espia)[cabecalhoDaVersao]).toBe("0.1.0");
  });
});
