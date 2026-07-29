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

const horaEMinuto = new Intl.DateTimeFormat(localePortugues, {
  hour: "2-digit",
  minute: "2-digit",
});

const diaEMes = new Intl.DateTimeFormat(localePortugues, { day: "2-digit", month: "2-digit" });

/**
 * Um instante como a pessoa o lê — «hoje às 05:00», «ontem às 05:00»,
 * «28/07 às 05:00».
 *
 * ⚠️ **É a função de que depende a regra mais dura do projecto**: um preço sem
 * data não se serve. Por isso devolve `null` para o que não conseguir ler, em
 * vez de devolver uma cadeia vazia ou «Invalid Date» — quem chama tem de
 * decidir o que fazer sem hora, e não pode fazê-lo se lhe entregarem uma frase
 * com ar de válida.
 *
 * ⚠️ «Hoje» e «ontem» comparam-se pelo **dia civil local**, e não por diferença
 * de horas: um preço das 05:00 de hoje visto às 03:00 de amanhã tem 22 horas e
 * é de ontem, e dizer «há 22 horas» faz a pessoa contar de cabeça o que a app
 * já sabe.
 */
export function instante(iso: string, agora: Date): string | null {
  const quando = new Date(iso);
  if (Number.isNaN(quando.getTime())) return null;

  const hora = horaEMinuto.format(quando);
  const diasDeDiferenca = diasCivisEntre(quando, agora);

  if (diasDeDiferenca === 0) return `hoje às ${hora}`;
  if (diasDeDiferenca === 1) return `ontem às ${hora}`;
  return `${diaEMes.format(quando)} às ${hora}`;
}

function diasCivisEntre(antes: Date, depois: Date): number {
  const diaDe = (data: Date) =>
    Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) / 86_400_000;
  return diaDe(depois) - diaDe(antes);
}
