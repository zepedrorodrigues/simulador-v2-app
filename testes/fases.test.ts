import { fraccoes, rotuloDoTroco, trocos } from "@/dominio/fases";
import { instante } from "@/dominio/formatar";

describe("as fases de um plano", () => {
  // ⚠️ **O teste que justifica o ficheiro inteiro.** O `ate_mes` do contrato é
  // acumulado desde o início, não a duração da fase — o contrário do que os
  // bancos devolvem. Lido como duração, uma mista de 5 anos fixos a 30 dá «Anos
  // 1-5» e depois «Anos 6-11», e o erro *parece certo*: os números são
  // plausíveis, estão por ordem, e ninguém repara sem somar.
  it("reparte os meses acumulados em troços com princípio e fim", () => {
    const plano = trocos([
      { ate_mes: 60, taxa: 3.25, prestacao: 870.42 },
      { ate_mes: 360, taxa: 3.9, prestacao: 910.1 },
    ]);

    expect(plano).toEqual([
      { deMes: 1, ateMes: 60, taxa: 3.25, prestacao: 870.42 },
      { deMes: 61, ateMes: 360, taxa: 3.9, prestacao: 910.1 },
    ]);
  });

  it("ordena as fases antes de as repartir", () => {
    const plano = trocos([
      { ate_mes: 360, taxa: 3.9, prestacao: 910.1 },
      { ate_mes: 60, taxa: 3.25, prestacao: 870.42 },
    ]);
    expect(plano.map((troco) => troco.deMes)).toEqual([1, 61]);
  });

  it("ignora uma fase que não avança", () => {
    const plano = trocos([
      { ate_mes: 60, taxa: 3.25, prestacao: 870.42 },
      { ate_mes: 60, taxa: 9.99, prestacao: 999 },
    ]);
    expect(plano).toHaveLength(1);
  });
});

describe("a largura de cada fase", () => {
  // ⚠️ Proporcional à duração e não igual para todas. Numa mista de 5 anos a 30,
  // dois blocos do mesmo tamanho diziam que metade do crédito é à taxa do
  // chamariz — que é precisamente onde o v1 induzia em erro.
  it("é proporcional à duração", () => {
    const larguras = fraccoes([
      { deMes: 1, ateMes: 60, taxa: 3.25, prestacao: 870 },
      { deMes: 61, ateMes: 360, taxa: 3.9, prestacao: 910 },
    ]);
    expect(larguras[0]).toBeCloseTo(60 / 360, 10);
    expect(larguras[1]).toBeCloseTo(300 / 360, 10);
  });

  it("não rebenta com um plano vazio", () => {
    expect(fraccoes([])).toEqual([]);
  });
});

describe("o rótulo de um troço", () => {
  it("lê-se em anos quando os meses batem certo", () => {
    expect(rotuloDoTroco({ deMes: 1, ateMes: 60, taxa: 3, prestacao: 1 })).toBe("Anos 1-5");
    expect(rotuloDoTroco({ deMes: 1, ateMes: 12, taxa: 3, prestacao: 1 })).toBe("Ano 1");
    expect(rotuloDoTroco({ deMes: 61, ateMes: 360, taxa: 3, prestacao: 1 })).toBe("Anos 6-30");
  });

  // ⚠️ Um troço de 42 meses não é «Anos 1-3». Arredondá-lo para caber na frase
  // era mentir por conveniência de formatação.
  it("cai para meses quando não bate certo em anos", () => {
    expect(rotuloDoTroco({ deMes: 1, ateMes: 42, taxa: 3, prestacao: 1 })).toBe("Meses 1-42");
  });
});

describe("a hora de um preço", () => {
  const agora = new Date(2026, 6, 29, 9, 30);

  it("diz hoje e ontem pelo dia civil, não por horas de diferença", () => {
    // ⚠️ Um preço das 05:00 de ontem visto às 09:30 de hoje tem 28 horas; um das
    // 23:00 de ontem tem 10. Os dois são de ontem, e é isso que a pessoa lê.
    expect(instante(new Date(2026, 6, 29, 5, 0).toISOString(), agora)).toMatch(/^hoje às /);
    expect(instante(new Date(2026, 6, 28, 23, 0).toISOString(), agora)).toMatch(/^ontem às /);
    expect(instante(new Date(2026, 6, 28, 5, 0).toISOString(), agora)).toMatch(/^ontem às /);
  });

  it("mais para trás dá a data", () => {
    expect(instante(new Date(2026, 6, 20, 5, 0).toISOString(), agora)).toMatch(/^20\/07 às /);
  });

  // ⚠️ Devolve null e não uma frase com ar de válida: quem chama tem de poder
  // decidir o que faz sem hora, e um preço sem data não se serve.
  it("é nula para uma data ilegível", () => {
    expect(instante("nem sequer é uma data", agora)).toBeNull();
    expect(instante("", agora)).toBeNull();
  });
});
