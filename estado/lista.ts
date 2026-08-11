// A lista de ofertas: N pedidos, um por banco, e o que já chegou.
//
// ⚠️ **Era um pedido só** (`POST /api/v1/comparacoes`, com `useComparacao`), e a
// rota foi retirada do servidor a 2026-08-07. O que a substitui não é a mesma
// coisa com outro nome: são N consultas independentes, e a espera passa a ser
// visível — a lista aparece com todos os bancos e enche-se à medida que
// respondem (D2, `ECRAS.md` §2).
//
// ⚠️ **A lista e o detalhe chamam isto os dois, e é de propósito.** O corpo do
// pedido é montado do mesmo estado pelas mesmas regras, portanto as chaves das
// consultas são as mesmas, portanto o detalhe lê o que a lista já trouxe — abrir
// uma oferta e voltar atrás não custa um pedido ao servidor nem, portanto, ao
// banco.

import { useCallback, useMemo } from "react";

import { eFalhaDaApi, type EspecieDeFalha } from "@/api/cliente";
import { useOfertasPorBanco } from "@/api/ofertas";
import type { Oferta, OfertaPedido } from "@/api/tipos";
import { montarPedido, paraOfertaPedido, usarPedido, type PedidoMontado } from "@/estado/pedido";
import { useSelecao } from "@/estado/selecao";

/**
 * Uma linha da lista, e os três estados em que um banco pode estar.
 *
 * ⚠️ **`nao-chegou` NÃO se disfarça de oferta em falha, e a distinção é a razão
 * de este tipo existir.** Uma `Oferta` com `sucesso: false` traz a razão **do
 * banco**, escrita pelo servidor em português — «o Banco Montepio não respondeu
 * dentro do prazo». Um pedido que nem chegou ao servidor não tem essa frase, e
 * fabricar-lhe uma era a app a afirmar o que o banco disse. O que ela sabe é
 * outra coisa, e diz-se com as palavras dela: não houve rede, o serviço não
 * respondeu, o tecto foi atingido.
 */
export type LinhaDaLista =
  | { estado: "a-esperar"; bancoId: string; bancoNome: string }
  | { estado: "servida"; bancoId: string; bancoNome: string; oferta: Oferta }
  | { estado: "nao-chegou"; bancoId: string; bancoNome: string; especie: EspecieDeFalha };

export type ListaDeOfertas = {
  /** Nulo enquanto o formulário não estiver de pé. */
  montado: PedidoMontado | null;
  linhas: LinhaDaLista[];
  /** As ofertas que já chegaram, para ordenar e comparar entre si. */
  ofertas: Oferta[];
  /**
   * Verdadeiro enquanto faltar um banco por assentar.
   *
   * ⚠️ É o que segura as estrelas — ver `ofertas/index.tsx`. Marcar a melhor
   * entre 2 de 5 é uma afirmação que se desmente quando chega a terceira.
   */
  aChegar: boolean;
  /** A espera que ocupa o ecrã inteiro: só a lista de bancos. */
  aEsperarBancos: boolean;
  /** A espécie da falha do `GET /api/v1/bancos`, ou nula se ele respondeu. */
  especieDosBancos: EspecieDeFalha | null;
  repetirBancos: () => void;
  /**
   * Volta a perguntar a todos os bancos.
   *
   * ⚠️ **Só se usa quando NADA chegou** (`resumoDaLista` → `falha-global`).
   * Chamado com meia lista servida, repetia pedidos a bancos que já tinham
   * respondido — carga em terceiros por uma resposta que já se tem.
   */
  repetirOfertas: () => void;
};

export function useOfertas(): ListaDeOfertas {
  const campos = usarPedido();
  const selecao = useSelecao();

  const montado = useMemo(
    () => montarPedido(campos, selecao.todos, new Date()),
    [campos, selecao.todos],
  );

  // ⚠️ O nome do banco sai da `selecao`, que já o tem, e não se inventa a partir
  // do id. Uma linha à espera e uma linha que não chegou têm de dizer de quem
  // são, e `banco_nome` só vem dentro de uma oferta que tenha chegado.
  const nomes = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const banco of selecao.todos) mapa.set(banco.id, banco.nome);
    return mapa;
  }, [selecao.todos]);

  const bancos = montado?.bancos ?? [];
  const corpoDe = useCallback(
    (bancoId: string): OfertaPedido | null =>
      montado === null ? null : paraOfertaPedido(montado, bancoId),
    [montado],
  );

  const consultas = useOfertasPorBanco(bancos, corpoDe);

  const linhas = useMemo(
    () =>
      consultas.map((consulta): LinhaDaLista => {
        const bancoId = consulta.bancoId;
        const bancoNome = nomes.get(bancoId) ?? bancoId;
        if (consulta.oferta !== undefined) {
          return { estado: "servida", bancoId, bancoNome, oferta: consulta.oferta };
        }
        if (consulta.erro !== null && consulta.erro !== undefined) {
          const especie = eFalhaDaApi(consulta.erro) ? consulta.erro.especie : "servidorEmBaixo";
          return { estado: "nao-chegou", bancoId, bancoNome, especie };
        }
        return { estado: "a-esperar", bancoId, bancoNome };
      }),
    [consultas, nomes],
  );

  return {
    montado,
    linhas,
    ofertas: linhas.flatMap((linha) => (linha.estado === "servida" ? [linha.oferta] : [])),
    aChegar: linhas.some((linha) => linha.estado === "a-esperar"),
    aEsperarBancos: selecao.aEsperar,
    especieDosBancos: selecao.especieDaFalha,
    repetirBancos: selecao.repetir,
    repetirOfertas: () => {
      for (const consulta of consultas) consulta.refazer();
    },
  };
}

/** A oferta de um banco, para o ecrã de detalhe. Lê da mesma cache que a lista. */
export function useOfertaDoBanco(bancoId: string): LinhaDaLista | undefined {
  const { linhas } = useOfertas();
  return linhas.find((linha) => linha.bancoId === bancoId);
}
