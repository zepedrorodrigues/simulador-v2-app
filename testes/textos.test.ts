import { textos } from "@/textos";

// ⚠️ O primeiro teste da app não é de um componente: é a afirmação de que as
// frases que a app diz sobre os números que serve continuam lá. Apagá-las por
// engano não parte nenhum ecrã, e é exactamente por isso que precisa de teste.
describe("os textos da postura", () => {
  // ⚠️ **Este teste dizia o contrário até 2026-08-07**, e afirmava-o com
  // convicção: «dizem que a TAEG é derivada», contra `/não vêm do banco/`. Era
  // verdade enquanto a TAEG saía de um modelo de encargos nosso sobre uma série
  // varrida com um titular neutro. Ao vivo é a que o simulador do banco cotou
  // para os valores desta pessoa, e a frase antiga passaria a ser uma afirmação
  // falsa sobre a proveniência de um número — que é a coisa que este ficheiro
  // existe para vigiar.
  it("dizem de onde vem a TAEG que se mostra", () => {
    expect(textos.postura.taegDoSimulador).toMatch(/simulador do banco/);
  });

  // ⚠️ **E esta não mudou, nem podia.** A distinção entre uma simulação e a TAEG
  // que vincula alguém não dependia do modelo de encargos: depende de o banco
  // ainda não ter avaliado quem pede. É o que sobra da regra, e é o que importa.
  it("dizem onde está a TAEG que vincula", () => {
    expect(textos.postura.taegOficial).toMatch(/ficha de informação normalizada/);
  });

  it("dizem que não é proposta nem aconselhamento", () => {
    expect(textos.postura.naoEProposta).toMatch(/não vinculam o banco/);
    expect(textos.postura.naoEProposta).toMatch(/não são aconselhamento financeiro/);
  });

  it("cobrem os estados que não são o caminho feliz", () => {
    for (const chave of [
      "semRede",
      "servidorEmBaixo",
      "bancoOcupado",
      "tectoExcedido",
    ] as const) {
      expect(textos.erros[chave].titulo.length).toBeGreaterThan(0);
      expect(textos.erros[chave].corpo.length).toBeGreaterThan(0);
    }
  });

  // ⚠️ O `banco_ocupado` diz que o banco está BEM e que quem não tinha lugar
  // éramos nós — e que passa por se esperar. O `semSerie` que ele substitui
  // dizia o oposto: não passava por se esperar, resolvia-se correndo o
  // varrimento. Uma frase que troque os dois manda a pessoa fazer a coisa errada.
  it("dizem, no banco ocupado, que se volta a tentar", () => {
    expect(textos.erros.bancoOcupado.corpo).toMatch(/tentar daqui a pouco/i);
  });
});
