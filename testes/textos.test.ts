import { textos } from "@/textos";

// ⚠️ O primeiro teste da app não é de um componente: é a afirmação de que as
// frases que a app diz sobre os números que serve continuam lá. A `taegDerivada`
// e a `taegOficial` são a condição em que a §4 do ARQUITETURA.md permite servir
// uma TAEG derivada — apagá-las por engano não parte nenhum ecrã, e é
// exactamente por isso que precisa de teste.
describe("os textos da postura", () => {
  it("dizem que a TAEG é derivada e onde está a oficial", () => {
    expect(textos.postura.taegDerivada).toMatch(/não vêm do banco/);
    expect(textos.postura.taegOficial).toMatch(/ficha de informação normalizada/);
  });

  it("dizem que não é proposta nem aconselhamento", () => {
    expect(textos.postura.naoEProposta).toMatch(/não vinculam o banco/);
    expect(textos.postura.naoEProposta).toMatch(/não são aconselhamento financeiro/);
  });

  it("cobrem os estados que não são o caminho feliz", () => {
    for (const chave of ["semRede", "servidorEmBaixo", "semSerie", "tectoExcedido"] as const) {
      expect(textos.erros[chave].titulo.length).toBeGreaterThan(0);
      expect(textos.erros[chave].corpo.length).toBeGreaterThan(0);
    }
  });
});
