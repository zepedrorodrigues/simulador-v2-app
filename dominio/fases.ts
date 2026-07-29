// As fases de um plano: onde começa cada troço, onde acaba, e a que taxa.
//
// ⚠️ **Este ficheiro existe por causa de uma armadilha de uma palavra.** O
// `ate_mes` do contrato é **acumulado desde o início do contrato, não a duração
// da fase** — está escrito no domínio do backend, e é o contrário do que os
// bancos devolvem («FaseDuracao é como os bancos devolvem: a duração da fase,
// não o acumulado»). Lê-lo como duração dá «Anos 1-5» seguido de «Anos 6-11»
// numa mista de 5 anos a 30, e o erro **parece certo**: os números são
// plausíveis, estão por ordem, e ninguém repara sem somar.

import type { Fase } from "@/api/tipos";

export type Troco = {
  /** Mês em que o troço começa, contado desde 1. */
  deMes: number;
  /** Mês em que acaba, inclusive. É o `ate_mes` do contrato. */
  ateMes: number;
  taxa: number;
  prestacao: number;
};

/**
 * trocos converte as fases acumuladas do contrato em troços com princípio e fim.
 *
 * ⚠️ Ordena por `ate_mes` antes de repartir. O contrato não promete ordem, e uma
 * fase fora de sítio dava um troço a começar depois de acabar.
 */
export function trocos(fases: Fase[]): Troco[] {
  const ordenadas = [...fases].sort((a, b) => a.ate_mes - b.ate_mes);

  const saida: Troco[] = [];
  let anterior = 0;
  for (const fase of ordenadas) {
    // ⚠️ Fases com o mesmo `ate_mes`, ou com um `ate_mes` que não avança, não
    // são um troço: seriam um intervalo vazio ou invertido.
    if (fase.ate_mes <= anterior) continue;
    saida.push({
      deMes: anterior + 1,
      ateMes: fase.ate_mes,
      taxa: fase.taxa,
      prestacao: fase.prestacao,
    });
    anterior = fase.ate_mes;
  }
  return saida;
}

/**
 * A fracção do plano que cada troço ocupa, para o desenho das barras.
 *
 * ⚠️ Proporcional à duração e não igual para todos. Numa mista de 5 anos fixos a
 * 30, desenhar dois blocos do mesmo tamanho diz que metade do crédito é à taxa
 * do chamariz — e a §4 diz que é precisamente aí que o v1 induzia em erro.
 */
export function fraccoes(trocosDoPlano: Troco[]): number[] {
  const total = trocosDoPlano.reduce((soma, troco) => soma + (troco.ateMes - troco.deMes + 1), 0);
  if (total <= 0) return trocosDoPlano.map(() => 0);
  return trocosDoPlano.map((troco) => (troco.ateMes - troco.deMes + 1) / total);
}

/**
 * O rótulo de um troço em anos — «Anos 1-5», «Ano 1».
 *
 * ⚠️ Só se lê em anos quando os meses batem certo em anos inteiros. Um troço de
 * 42 meses não é «Anos 1-3», e arredondá-lo para caber na frase era mentir por
 * conveniência de formatação: nesse caso diz-se em meses.
 */
export function rotuloDoTroco(troco: Troco): string {
  const comecaEmAnoInteiro = (troco.deMes - 1) % 12 === 0;
  const acabaEmAnoInteiro = troco.ateMes % 12 === 0;

  if (!comecaEmAnoInteiro || !acabaEmAnoInteiro) {
    return troco.deMes === troco.ateMes
      ? `Mês ${troco.deMes}`
      : `Meses ${troco.deMes}-${troco.ateMes}`;
  }

  const primeiroAno = (troco.deMes - 1) / 12 + 1;
  const ultimoAno = troco.ateMes / 12;
  return primeiroAno === ultimoAno ? `Ano ${primeiroAno}` : `Anos ${primeiroAno}-${ultimoAno}`;
}
