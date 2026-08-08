// `POST /api/v1/ofertas/{banco}` — um banco, um pedido.
//
// ⚠️ **Substitui o `POST /api/v1/comparacoes`, que foi retirado do servidor a
// 2026-08-07.** Não é a mesma rota com outro nome: aquela devolvia os N bancos
// de uma vez e esperava pelo mais lento para responder o primeiro preço. Aqui há
// N pedidos, cada um síncrono, e a lista enche-se à medida que chegam (D2).
//
// ⚠️ **É um POST servido por `useQuery` e não por `useMutation`, e a escolha
// mantém-se.** Uma mutação é uma acção que muda estado do outro lado; esta não
// muda nada — nada do pedido é persistido, e é por isso que nem existe um
// `GET /api/v1/ofertas/{id}`. O que isto é, na verdade, é uma **leitura cara com
// o pedido no corpo**: é POST por privacidade (data de nascimento e rendimento
// não viajam em query string), não por semântica. Servida como consulta, ganha a
// cache e o dedup do TanStack Query — e voltar atrás do detalhe para a lista não
// repete o pedido ao servidor, nem, portanto, ao banco.

import { useQueries } from "@tanstack/react-query";

import { eFalhaDaApi, publicar } from "./cliente";
import { filaDosBancos } from "./fila";
import type { Oferta, OfertaPedido } from "./tipos";

export function chaveDaOferta(bancoId: string, corpo: OfertaPedido | null) {
  return ["oferta", bancoId, corpo] as const;
}

export function pedirOferta(bancoId: string, corpo: OfertaPedido): Promise<Oferta> {
  // ⚠️ O id vai no caminho e tem de ser escapado. Hoje os cinco são `[a-z]+` e
  // isto não muda nada; um id com `/` ou `?` um dia mudava a rota que se chama.
  return publicar<Oferta>(`/api/v1/ofertas/${encodeURIComponent(bancoId)}`, corpo);
}

/**
 * Quantas vezes se repete um pedido a um banco, e quais.
 *
 * ⚠️ **Substitui o `retry: 2` da raiz, e a substituição é o ponto.** Aquele
 * default é razoável para um `GET /api/v1/bancos`, que custa uma consulta. Aqui
 * cada tentativa custa 1 a 4 pedidos ao simulador público de um banco — repetir
 * duas vezes uma falha de rede triplicava a carga que pomos em terceiros por
 * uma coisa que não é deles.
 *
 * ⚠️ **Repete-se SÓ o `banco_ocupado`**, e é a única que o merece: é a única
 * falha que o contrato diz passar sozinha — o banco está bem, quem não tem lugar
 * somos nós — e a única que traz `Retry-After` a dizer quando. Tudo o resto é
 * uma linha na lista com o banco nomeado, que é informação, e não uma segunda
 * ida ao banco.
 */
export const tentativasPorBanco = 2;

function repetir(tentativa: number, erro: unknown): boolean {
  return tentativa < tentativasPorBanco && eFalhaDaApi(erro) && erro.especie === "bancoOcupado";
}

/**
 * Quanto se espera antes de repetir um `banco_ocupado`.
 *
 * ⚠️ **O `Retry-After` do servidor manda**, e não uma escala nossa: ele sabe
 * quanto dura uma vaga e nós não. O 1 s de reserva é o que o servidor manda hoje
 * (`web.go`), e existe para o caso de um proxy comer o cabeçalho pelo caminho.
 */
function esperaAntesDeRepetir(erro: unknown): number {
  const segundos = eFalhaDaApi(erro) ? erro.esperarSegundos : undefined;
  return (segundos ?? 1) * 1000;
}

/** O que uma consulta a um banco devolve enquanto não assenta. */
export type ConsultaDeOferta = {
  bancoId: string;
  oferta: Oferta | undefined;
  aEsperar: boolean;
  erro: unknown;
};

/**
 * useOfertasPorBanco dispara um pedido por banco e devolve o estado de cada um.
 *
 * ⚠️ **`useQueries` e não um `useQuery` por ecrã**, porque o número de bancos vem
 * do servidor: os hooks do React não se chamam em ciclo, e uma lista de bancos
 * que cresça no `GET /api/v1/bancos` tem de aparecer aqui sem código nenhum.
 *
 * ⚠️ **A chave inclui o corpo**, e é o que faz o detalhe ler da lista sem repetir
 * o pedido: os dois ecrãs montam o mesmo corpo pelas mesmas regras, logo a mesma
 * chave, logo o mesmo acerto.
 */
export function useOfertasPorBanco(
  bancos: string[],
  corpoDe: (bancoId: string) => OfertaPedido | null,
): ConsultaDeOferta[] {
  return useQueries({
    queries: bancos.map((bancoId) => {
      const corpo = corpoDe(bancoId);
      return {
        queryKey: chaveDaOferta(bancoId, corpo),
        queryFn: () => filaDosBancos(() => pedirOferta(bancoId, corpo as OfertaPedido)),
        // ⚠️ Sem pedido não há consulta. Acontece de verdade: quem abrir
        // `/ofertas` por URL — e no alvo web abre — chega aqui com o formulário
        // por preencher.
        enabled: corpo !== null,
        // ⚠️ Voltar à janela não pode disparar cinco pedidos a cinco bancos. É
        // a mesma razão de sempre, e vale mais agora do que quando os preços
        // vinham de uma fotografia: aqui cada refetch é carga em terceiros.
        refetchOnWindowFocus: false,
        retry: repetir,
        retryDelay: (_: number, erro: unknown) => esperaAntesDeRepetir(erro),
      };
    }),
    combine: (resultados) =>
      resultados.map((resultado, i) => ({
        bancoId: bancos[i],
        oferta: resultado.data,
        // ⚠️ `isPending` sozinho seria verdadeiro para sempre numa consulta
        // desactivada — e é isso que uma consulta sem corpo é. Sem o `isFetching`
        // ao lado, um banco por pedir ficava eternamente «à espera» no ecrã.
        aEsperar: resultado.isPending && resultado.fetchStatus !== "idle",
        erro: resultado.error,
      })),
  });
}
