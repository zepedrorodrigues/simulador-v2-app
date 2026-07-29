// As regras puras da lista de ofertas: ordenar, marcar a melhor, separar o que
// falhou.
//
// ⚠️ **Nada aqui calcula crédito.** Não há prestação, TAEG nem spread a serem
// produzidos — os números vêm todos da resposta. O que há é ordenação e
// comparação entre números que já existem, que é a parte que o `ECRAS.md` §3
// exige e a parte que se parte em silêncio.

import type { Oferta } from "@/api/tipos";

/** As métricas por que se pode ordenar. Todas «menor é melhor». */
export const metricas = ["taeg", "prestacao_mensal", "tan", "spread", "mtic"] as const;
export type Metrica = (typeof metricas)[number];

function valorDe(oferta: Oferta, metrica: Metrica): number | undefined {
  return oferta[metrica];
}

/** Uma oferta em que o banco mudou alguma coisa face ao pedido. */
export function temAjuste(oferta: Oferta): boolean {
  return oferta.aplicado !== undefined && Object.keys(oferta.aplicado).length > 0;
}

/**
 * separar divide as ofertas em quem tem preço e quem não tem.
 *
 * ⚠️ **Os bancos que falharam ficam, e ficam no fim.** Ficam porque «um banco que
 * desaparece parece um esquecimento; um banco que explica porque não tem oferta
 * é informação útil» (`ECRAS.md` §3). E ficam no fim porque não têm por onde ser
 * ordenados: intercalá-los entre preços obrigava a inventar-lhes um valor, e o
 * valor que se inventasse decidia onde apareciam.
 */
export function separar(ofertas: Oferta[]): { comPreco: Oferta[]; semOferta: Oferta[] } {
  return {
    comPreco: ofertas.filter((oferta) => oferta.sucesso),
    semOferta: ofertas.filter((oferta) => !oferta.sucesso),
  };
}

/**
 * ordenar devolve as ofertas com preço pela métrica pedida, e as que falharam
 * depois.
 *
 * ⚠️ **Uma oferta a que falte a métrica não vai para o princípio nem para o
 * meio: vai para o fim das que têm preço.** `undefined` numa comparação
 * numérica devolve `NaN`, e um `sort` com `NaN` deixa a lista por ordem
 * arbitrária — que é a pior avaria possível aqui, porque parece ordenada. A §4
 * do `ARQUITETURA.md` permite omitir uma TAEG que não se consegue dar, portanto
 * este caso é legítimo e não hipotético.
 */
export function ordenar(ofertas: Oferta[], metrica: Metrica): Oferta[] {
  const { comPreco, semOferta } = separar(ofertas);

  const ordenadas = [...comPreco].sort((a, b) => {
    const va = valorDe(a, metrica);
    const vb = valorDe(b, metrica);
    if (va === undefined && vb === undefined) return 0;
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    return va - vb;
  });

  return [...ordenadas, ...semOferta];
}

/**
 * melhores diz, de cada métrica, qual o banco que a ganha.
 *
 * ⚠️ **Uma oferta ajustada não ganha estrela nenhuma, e é uma decisão desta app**
 * (2026-07-29). A `KAN-26` está aberta com o problema exacto: «ordenar uma oferta
 * ajustada ao lado das outras compara coisas diferentes sem o dizer». A lista
 * di-lo — a nota do ajuste vive no cartão — mas uma estrela não é uma nota: é a
 * afirmação «esta é a melhor». Dá-la a quem foi simulado a 35 anos quando se
 * pediram 40 é afirmar uma coisa falsa sobre o pedido que a pessoa fez. A oferta
 * continua na lista e continua ordenada; o que não leva é a marca.
 *
 * ⚠️ E um empate não dá estrela a ninguém: duas ofertas iguais na mesma métrica
 * não têm «a melhor», e marcar a primeira era deixar a ordem de chegada decidir.
 */
export function melhores(ofertas: Oferta[]): Partial<Record<Metrica, string>> {
  const elegiveis = ofertas.filter((oferta) => oferta.sucesso && !temAjuste(oferta));
  const marcadas: Partial<Record<Metrica, string>> = {};

  for (const metrica of metricas) {
    const comValor = elegiveis.filter((oferta) => valorDe(oferta, metrica) !== undefined);
    if (comValor.length === 0) continue;

    const minimo = Math.min(...comValor.map((oferta) => valorDe(oferta, metrica) as number));
    const empatadas = comValor.filter((oferta) => valorDe(oferta, metrica) === minimo);
    if (empatadas.length === 1) marcadas[metrica] = empatadas[0].banco_id;
  }

  return marcadas;
}

/**
 * derivada diz se um número desta oferta assenta em hipóteses declaradas.
 *
 * ⚠️ É o que decide a marca `~` antes da TAEG e do MTIC. O contrato é explícito:
 * `pressupostos` **não vem vazio** sempre que a `taeg` ou o `mtic` vêm
 * preenchidos, e vazio com um deles preenchido «é defeito nosso, e não um caso
 * legítimo». A app trata a ausência como o que ela é — um defeito do servidor —
 * e marca à mesma: um número derivado servido com ar de cotado é exactamente a
 * falha que este projecto herdou como regra.
 */
export function temNumerosDerivados(oferta: Oferta): boolean {
  return oferta.taeg !== undefined || oferta.mtic !== undefined;
}

/** ⚠️ Verdadeiro quando o servidor derivou números e não declarou as hipóteses.
 * É defeito dele, e o ecrã di-lo em vez de o esconder. */
export function pressupostosEmFalta(oferta: Oferta): boolean {
  return (
    temNumerosDerivados(oferta) &&
    (oferta.pressupostos === undefined || oferta.pressupostos.length === 0)
  );
}

/**
 * idadeDosPrecos devolve o `capturado_em` mais antigo das ofertas com preço.
 *
 * ⚠️ O mais antigo, e não o mais recente. O rodapé faz uma afirmação sobre a
 * lista inteira, e a afirmação verdadeira sobre um conjunto de preços de horas
 * diferentes é a do mais velho — dizer a hora do mais fresco apresentava os
 * outros como sendo dessa hora.
 */
export function idadeDosPrecos(ofertas: Oferta[]): string | null {
  const instantes = ofertas
    .filter((oferta) => oferta.sucesso)
    .map((oferta) => oferta.capturado_em)
    .filter((instante): instante is string => instante !== undefined);

  if (instantes.length === 0) return null;
  return instantes.reduce((maisAntigo, actual) => (actual < maisAntigo ? actual : maisAntigo));
}
