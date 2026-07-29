// Como os números aparecem à pessoa.
//
// ⚠️ **Nunca um número sem unidade nem contexto** — é a regra transversal do
// `ECRAS.md`, e a pergunta que a torna concreta está lá escrita: «3,61 % é TAEG
// ou TAN?». Estas funções põem a unidade; o rótulo ao lado é do ecrã.
//
// ⚠️ Locale `pt-PT` explícito e não o do dispositivo. Um telemóvel configurado
// em inglês formatava 250.000,00 € como 250,000.00 € no meio de uma interface
// toda em português — e num ecrã de crédito trocar o ponto pela vírgula não é
// uma questão de gosto.

const localePortugues = "pt-PT";

const emEuros = new Intl.NumberFormat(localePortugues, {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const emEurosAoCentimo = new Intl.NumberFormat(localePortugues, {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Dinheiro sem cêntimos — os montantes que a pessoa escreve. */
export function dinheiro(valor: number): string {
  return emEuros.format(valor);
}

/** Dinheiro ao cêntimo — prestações e MTIC, onde o cêntimo é a informação. */
export function dinheiroAoCentimo(valor: number): string {
  return emEurosAoCentimo.format(valor);
}

/** Percentagem com as casas pedidas. O LTV leva uma; as taxas levam duas ou três. */
export function percentagem(valor: number, casas = 1): string {
  return `${new Intl.NumberFormat(localePortugues, {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor)} %`;
}

/** «30 anos», «1 ano». ⚠️ O singular existe: um prazo mínimo de 1 ano é real. */
export function anos(quantidade: number): string {
  return quantidade === 1 ? "1 ano" : `${quantidade} anos`;
}

/** Agrupa os milhares enquanto a pessoa escreve, sem impor cêntimos. */
export function agruparMilhares(valor: number): string {
  return new Intl.NumberFormat(localePortugues, { maximumFractionDigits: 2 }).format(valor);
}
