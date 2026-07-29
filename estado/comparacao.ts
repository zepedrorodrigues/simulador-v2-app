// O pedido montado e a resposta, num sítio só.
//
// ⚠️ **A lista e o detalhe chamam isto os dois, e é de propósito.** O corpo do
// pedido é montado do mesmo estado pelas mesmas regras, portanto a chave da
// consulta é a mesma, portanto o detalhe lê da cache o que a lista já trouxe —
// abrir uma oferta e voltar atrás não custa um pedido ao servidor. Se em vez
// disto o detalhe recebesse a oferta por parâmetro de rota, uma actualização à
// lista deixava-o a mostrar números velhos sem ninguém dar por isso.

import { useMemo } from "react";

import { useComparacao } from "@/api/comparacoes";
import type { ComparacaoPedido } from "@/api/tipos";
import { paraComparacaoPedido, usarPedido } from "@/estado/pedido";
import { useSelecao } from "@/estado/selecao";

export function useOfertas() {
  const campos = usarPedido();
  const selecao = useSelecao();

  const corpo: ComparacaoPedido | null = useMemo(
    () => paraComparacaoPedido(campos, selecao.todos, new Date()),
    [campos, selecao.todos],
  );

  const consulta = useComparacao(corpo);

  return {
    corpo,
    comparacao: consulta.data,
    // ⚠️ `aEsperar` só é verdade quando há pedido. Sem pedido a consulta está
    // desactivada e fica em `pending` para sempre — mostrar «a calcular…» nesse
    // estado era uma roda a girar sobre coisa nenhuma.
    aEsperar: corpo !== null && (selecao.aEsperar || consulta.isPending),
    erro: selecao.falhou ? new Error("bancos") : consulta.error,
    repetir: () => {
      void consulta.refetch();
    },
  };
}
