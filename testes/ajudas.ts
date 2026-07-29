// Bancos de teste.
//
// ⚠️ Fabricados **a partir do que os bancos a sério declaram**, e não inventados
// à sorte: a CGD não pergunta a data de nascimento nem o rendimento e impõe a
// Euribor a 6 meses; o Novo Banco deixa escolher o tenor e é o único que declara
// usar o rendimento; o Montepio publica períodos fixos que os outros não têm.
// Um teste com bancos simétricos não teria apanhado nada do que estes apanham.

import type { Banco } from "@/api/tipos";

type Retoques = Partial<Banco>;

export function bancoDeTeste(id: string, nome: string, retoques: Retoques = {}): Banco {
  return {
    id,
    nome,
    inputs: [
      { chave: "valor_imovel", usa: true },
      { chave: "montante", usa: true },
      { chave: "prazo_anos", usa: true },
      { chave: "rate_type", usa: true },
      { chave: "finalidade", usa: true },
      { chave: "data_nascimento", usa: true },
      { chave: "rendimento_mensal", usa: false, nota: "O simulador não o pede." },
    ],
    periodos_fixos: [5, 10],
    periodos_fixos_modo: "lista",
    euribor_opcoes: ["3m", "6m", "12m"],
    euribor_imposto: null,
    prazo_min: 5,
    prazo_max: 40,
    idade_maxima_fim: 75,
    produtos: [],
    notas: [],
    ...retoques,
  };
}

/** A CGD: impõe o indexante, não pergunta idade nem rendimento, e a lista de
 * períodos foi lida do HTML dela. */
export const cgd = bancoDeTeste("cgd", "CGD", {
  inputs: [
    { chave: "valor_imovel", usa: true },
    { chave: "montante", usa: true },
    { chave: "prazo_anos", usa: true },
    { chave: "finalidade", usa: true },
    { chave: "garantia_publica", usa: true },
    {
      chave: "data_nascimento",
      usa: false,
      nota: "O simulador da CGD não pergunta a idade. Ela só entra no prazo máximo.",
    },
    { chave: "rendimento_mensal", usa: false, nota: "O simulador da CGD não pergunta o rendimento." },
  ],
  periodos_fixos: [5, 10, 15],
  periodos_fixos_modo: "do-html",
  euribor_opcoes: [],
  euribor_imposto: "6m",
  prazo_min: 5,
  prazo_max: 40,
  idade_maxima_fim: 70,
});

/** O Novo Banco: escolhe-se o tenor, e é o único que declara usar o rendimento. */
export const novobanco = bancoDeTeste("novobanco", "Novo Banco", {
  inputs: [
    { chave: "valor_imovel", usa: true },
    { chave: "montante", usa: true },
    { chave: "prazo_anos", usa: true },
    { chave: "finalidade", usa: true },
    { chave: "data_nascimento", usa: true, nota: "Usa-a para o prazo máximo." },
    {
      chave: "rendimento_mensal",
      usa: true,
      nota: "O simulador exige-o, mas ele não mexe no preço.",
    },
  ],
  periodos_fixos: [5, 10, 20],
  euribor_opcoes: ["3m", "6m", "12m"],
  euribor_imposto: null,
  prazo_max: 40,
  idade_maxima_fim: 75,
  produtos: [
    {
      id: "novobanco:primeiro_banco",
      rotulo: "Primeiro Banco",
      descricao: "Domiciliar o ordenado.",
      por_omissao: true,
    },
    {
      id: "novobanco:protecao",
      rotulo: "Proteção",
      descricao: "Seguros do banco.",
      por_omissao: false,
    },
  ],
});

/** O Montepio: prazo mais curto e um indexante imposto diferente do da CGD. */
export const montepio = bancoDeTeste("montepio", "Banco Montepio", {
  periodos_fixos: [5],
  euribor_opcoes: [],
  euribor_imposto: "12m",
  prazo_min: 10,
  prazo_max: 35,
  idade_maxima_fim: 76,
});
