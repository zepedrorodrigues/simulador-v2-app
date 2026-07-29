// `POST /api/v1/comparacoes` — o cálculo, de uma vez.
//
// ⚠️ **É um POST servido por `useQuery` e não por `useMutation`, e a escolha tem
// razão.** Uma mutação é uma acção que muda estado do outro lado; esta não muda
// nada — o contrato di-lo por palavras: «nada do pedido é persistido», não há
// recurso a que voltar, e é por isso que nem existe `GET /api/v1/comparacoes/{id}`.
// O que isto é, na verdade, é uma **leitura cara com o pedido no corpo**. Servida
// como consulta, ganha a cache, o dedup e a repetição com recuo que o `APP.md`
// §1 diz serem a razão de a biblioteca cá estar — e voltar atrás do detalhe para
// a lista não repete o pedido ao servidor.

import { useQuery } from "@tanstack/react-query";

import { publicar } from "./cliente";
import type { Comparacao, ComparacaoPedido } from "./tipos";

export function chaveDaComparacao(corpo: ComparacaoPedido | null) {
  return ["comparacao", corpo] as const;
}

export function compararOfertas(corpo: ComparacaoPedido): Promise<Comparacao> {
  return publicar<Comparacao>("/api/v1/comparacoes", corpo);
}

export function useComparacao(corpo: ComparacaoPedido | null) {
  return useQuery({
    queryKey: chaveDaComparacao(corpo),
    queryFn: () => compararOfertas(corpo as ComparacaoPedido),
    // ⚠️ Sem pedido não há consulta. Acontece de verdade: quem abrir `/ofertas`
    // por URL — e no alvo web abre — chega aqui com o formulário por preencher.
    enabled: corpo !== null,
    // ⚠️ Os preços são de um varrimento, não de agora: repetir a consulta ao
    // voltar à janela não traz números novos, traz só carga. O `staleTime` da
    // raiz já é generoso; aqui desliga-se o refetch por foco de vez.
    refetchOnWindowFocus: false,
  });
}
