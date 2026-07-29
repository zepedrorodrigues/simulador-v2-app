// A loja do formulário: os três passos partilham este estado.
//
// ⚠️ **Sem `persist`, e não por esquecimento.** O `ECRAS.md` e o `APP.md` §6
// dizem a mesma coisa por palavras diferentes: os inputs vivem no estado do
// ecrã e desaparecem. Aqui isso é literal — a loja é memória do processo, e
// fechar a app leva-a. O que se escreve neste formulário é data de nascimento e
// rendimento; guardá-los «para dar jeito» era transformar uma app que não
// recolhe dados pessoais numa que recolhe.
//
// ⚠️ E é **estado de formulário**, não de servidor: por isso é Zustand e não
// TanStack Query (`APP.md` §1). A regra de repartição é essa e não muda: o que
// vem do servidor é do Query, o que a pessoa escreve é daqui.

import { create } from "zustand";

import type { Banco, ComparacaoPedido, Finalidade, Indexante, TipoTaxa } from "@/api/tipos";
import { camposUsados, dataParaIso } from "@/dominio/formulario";

/** Um titular como está a ser escrito — a data ainda em «dd/mm/aaaa». */
export type TitularEmEdicao = {
  dataNascimento: string;
  rendimentoMensal: number | null;
};

export type CamposDoPedido = {
  valorImovel: number | null;
  montante: number | null;
  prazoAnos: number;
  finalidade: Finalidade;
  localizacao: string;
  garantiaPublica: boolean;
  jaCliente: boolean;
  titulares: TitularEmEdicao[];
  tipoTaxa: TipoTaxa;
  periodoFixoAnos: number | null;
  indexante: Indexante;
  /**
   * ⚠️ `null` quer dizer **todos os bancos que houver**, e não «nenhum».
   *
   * A alternativa era encher isto com os ids assim que a resposta de
   * `GET /api/v1/bancos` chegasse, com um efeito a sincronizar as duas coisas —
   * e um efeito desses tem sempre a mesma avaria: um banco novo aparece na API e
   * a loja, já «iniciada», nunca o inclui. Com `null`, um banco novo entra na
   * comparação no momento em que a API o serve, sem código nenhum.
   */
  bancosEscolhidos: string[] | null;
  /** Produtos escolhidos por banco, pelos ids prefixados do contrato. */
  produtos: Record<string, string[]>;
};

const inicial: CamposDoPedido = {
  valorImovel: null,
  montante: null,
  prazoAnos: 30,
  finalidade: "propria",
  localizacao: "continente",
  garantiaPublica: false,
  jaCliente: false,
  titulares: [{ dataNascimento: "", rendimentoMensal: null }],
  // ⚠️ `variavel` por omissão, e é uma escolha. A app não pré-selecciona um
  // produto de crédito por quem a usa: a mista com cinco anos fixos é a que os
  // simuladores dos bancos costumam abrir, e abrir nela era empurrar para o
  // produto que mais lhes convém mostrar.
  tipoTaxa: "variavel",
  periodoFixoAnos: null,
  indexante: "6m",
  bancosEscolhidos: null,
  produtos: {},
};

type AccoesDoPedido = {
  definir: (campos: Partial<CamposDoPedido>) => void;
  definirTitular: (indice: number, campos: Partial<TitularEmEdicao>) => void;
  acrescentarTitular: () => void;
  removerTitular: (indice: number) => void;
  alternarBanco: (id: string, todos: string[]) => void;
  alternarProduto: (bancoId: string, produtoId: string, porOmissao: string[]) => void;
  limpar: () => void;
};

export const usarPedido = create<CamposDoPedido & AccoesDoPedido>((set) => ({
  ...inicial,

  definir: (campos) => set(campos),

  definirTitular: (indice, campos) =>
    set((estado) => ({
      titulares: estado.titulares.map((titular, i) =>
        i === indice ? { ...titular, ...campos } : titular,
      ),
    })),

  // ⚠️ Dois é o tecto, e é do domínio: «um pedido tem um ou dois titulares».
  acrescentarTitular: () =>
    set((estado) =>
      estado.titulares.length >= 2
        ? estado
        : { titulares: [...estado.titulares, { dataNascimento: "", rendimentoMensal: null }] },
    ),

  removerTitular: (indice) =>
    set((estado) =>
      estado.titulares.length <= 1
        ? estado
        : { titulares: estado.titulares.filter((_, i) => i !== indice) },
    ),

  // ⚠️ `todos` entra por parâmetro porque é aqui que o `null` se materializa: ao
  // primeiro banco que se desmarca, «todos» passa a ser uma lista concreta menos
  // esse. A loja não conhece a API e continua sem a conhecer.
  alternarBanco: (id, todos) =>
    set((estado) => {
      const actuais = estado.bancosEscolhidos ?? todos;
      const seguintes = actuais.includes(id)
        ? actuais.filter((outro) => outro !== id)
        : [...actuais, id];
      return { bancosEscolhidos: seguintes };
    }),

  // ⚠️ Mesmo desenho: a entrada só aparece no mapa quando a pessoa mexe nela. Um
  // banco sem entrada leva os produtos `por_omissao`, que é o que o simulador
  // dele mostra a quem lá chega — ver `produtosDoBanco`.
  alternarProduto: (bancoId, produtoId, porOmissao) =>
    set((estado) => {
      const actuais = estado.produtos[bancoId] ?? porOmissao;
      const seguintes = actuais.includes(produtoId)
        ? actuais.filter((outro) => outro !== produtoId)
        : [...actuais, produtoId];
      return { produtos: { ...estado.produtos, [bancoId]: seguintes } };
    }),

  limpar: () => set(inicial),
}));

// --- Leituras puras sobre o estado. Testáveis sem montar ecrã nenhum. ---

/** Os bancos que a comparação vai levar: os escolhidos, ou todos se ninguém mexeu. */
export function bancosEfectivos(escolhidos: string[] | null, todos: string[]): string[] {
  if (escolhidos === null) return todos;
  // ⚠️ A ordem é a da API e não a das marcações. Sem isto, desmarcar e voltar a
  // marcar um banco mandava-o para o fim da lista do pedido.
  return todos.filter((id) => escolhidos.includes(id));
}

/** Os produtos que um banco vai levar: os escolhidos, ou os `por_omissao`. */
export function produtosDoBanco(
  escolhidos: Record<string, string[]>,
  bancoId: string,
  porOmissao: string[],
): string[] {
  return escolhidos[bancoId] ?? porOmissao;
}

/**
 * O que falta para o passo 1 estar de pé.
 *
 * ⚠️ Estas guardas são as do domínio, e estão aqui para o botão ser honesto —
 * não para substituir o servidor. «O montante não pode exceder o valor do
 * imóvel» é uma regra de `pedido.go`; deixá-la só lá fazia a pessoa preencher
 * três passos para receber um 400 no fim.
 */
export function passo1Pronto(campos: CamposDoPedido): boolean {
  const { valorImovel, montante, prazoAnos } = campos;
  if (valorImovel === null || montante === null) return false;
  if (valorImovel <= 0 || montante <= 0) return false;
  if (montante > valorImovel) return false;
  return prazoAnos >= prazoMinimoDoDominio && prazoAnos <= prazoMaximoDoDominio;
}

/**
 * Os limites absolutos do prazo.
 *
 * ⚠️ São o tecto do **domínio** e não o de nenhum banco: cada banco tem o seu,
 * mais baixo, e vem em `prazo_min`/`prazo_max`. Estes só existem para o
 * formulário não deixar escrever disparates — a mesma razão por que estão no
 * `pedido.go` («só existe para recusar disparates antes de se gastar um
 * scrape»).
 */
export const prazoMinimoDoDominio = 1;
export const prazoMaximoDoDominio = 50;

/** A idade mínima é do domínio: 18 anos. */
export const idadeMinima = 18;

/**
 * pedeRendimento diz se vale a pena perguntar o ordenado.
 *
 * ⚠️ **Dos cinco bancos, um.** Só o Novo Banco declara `rendimento_mensal` com
 * `usa: true`, e a nota dele diz que nem aí mexe no preço. Perguntá-lo a quem
 * não escolheu esse banco era recolher o ordenado de uma pessoa para não fazer
 * nada com ele — e esta app diz, no primeiro ecrã, que não guarda dados
 * pessoais. Quando ninguém o usa, não se pergunta e vai zero no pedido: o campo
 * é obrigatório no contrato e inerte em todos os bancos que a comparação leva.
 */
export function pedeRendimento(escolhidos: Banco[]): boolean {
  return camposUsados(escolhidos).has("rendimento_mensal");
}

export function passo2Pronto(campos: CamposDoPedido, hoje: Date, comRendimento: boolean): boolean {
  if (campos.titulares.length < 1 || campos.titulares.length > 2) return false;
  return campos.titulares.every((titular) => {
    const iso = dataParaIso(titular.dataNascimento);
    if (iso === null) return false;
    if (idadeEmAnos(iso, hoje) < idadeMinima) return false;
    if (!comRendimento) return true;
    return titular.rendimentoMensal !== null && titular.rendimentoMensal >= 0;
  });
}

/** Idade em anos completos. Serve a guarda dos 18; não decide ofertas. */
export function idadeEmAnos(dataIso: string, hoje: Date): number {
  const [ano, mes, dia] = dataIso.split("-").map(Number);
  let idade = hoje.getFullYear() - ano;
  const jaFezAnos =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia);
  if (!jaFezAnos) idade -= 1;
  return idade;
}

/**
 * paraComparacaoPedido monta o corpo de `POST /api/v1/comparacoes`.
 *
 * Devolve `null` quando o formulário ainda não está de pé — o ecrã não chega a
 * chamar isto com o botão desactivado, e a garantia fica escrita à mesma.
 */
export function paraComparacaoPedido(
  campos: CamposDoPedido,
  todosOsBancos: Banco[],
  hoje: Date,
): ComparacaoPedido | null {
  const ids = todosOsBancos.map((banco) => banco.id);
  const escolhidosIds = bancosEfectivos(campos.bancosEscolhidos, ids);
  if (escolhidosIds.length === 0) return null;

  const escolhidos = todosOsBancos.filter((banco) => escolhidosIds.includes(banco.id));
  const comRendimento = pedeRendimento(escolhidos);

  if (!passo1Pronto(campos) || !passo2Pronto(campos, hoje, comRendimento)) return null;

  const titulares = campos.titulares.map((titular) => ({
    // O `passo2Pronto` já garantiu que a data converte.
    data_nascimento: dataParaIso(titular.dataNascimento) as string,
    // ⚠️ Zero quando não se perguntou — ver `pedeRendimento`. Não é um ordenado
    // inventado: é o valor inerte de um campo que o contrato exige e que nenhum
    // dos bancos escolhidos lê.
    rendimento_mensal: comRendimento ? (titular.rendimentoMensal as number) : 0,
  }));

  const produtos: Record<string, string[]> = {};
  for (const banco of escolhidos) {
    const porOmissao = banco.produtos
      .filter((produto) => produto.por_omissao)
      .map((produto) => produto.id);
    const dele = produtosDoBanco(campos.produtos, banco.id, porOmissao);
    if (dele.length > 0) produtos[banco.id] = dele;
  }

  return {
    bancos: escolhidosIds,
    pedido: {
      valor_imovel: campos.valorImovel as number,
      montante: campos.montante as number,
      prazo_anos: campos.prazoAnos,
      rate_type: campos.tipoTaxa,
      // ⚠️ O período fixo só viaja quando a taxa tem um. Mandá-lo numa variável
      // é um 400 do domínio: «a taxa variável não tem período fixo».
      ...(campos.tipoTaxa !== "variavel" && campos.periodoFixoAnos !== null
        ? { fixed_period_years: campos.periodoFixoAnos }
        : {}),
      // ⚠️ E o indexante só quando há fase indexada. Numa fixa não há Euribor
      // nenhuma a que indexar, e o campo seria ruído no pedido.
      ...(campos.tipoTaxa !== "fixa" ? { euribor_indexante: campos.indexante } : {}),
      titulares,
      finalidade: campos.finalidade,
      localizacao: campos.localizacao,
      garantia_publica: campos.garantiaPublica,
      ja_cliente: campos.jaCliente,
    },
    ...(Object.keys(produtos).length > 0 ? { produtos } : {}),
  };
}
