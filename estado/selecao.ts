// A junção das duas metades: o que o servidor publica e o que a pessoa escolheu.
//
// ⚠️ Vive num sítio só porque os três passos precisam da mesma resposta à mesma
// pergunta — «que bancos é que esta comparação leva?» — e três respostas
// escritas em três ecrãs divergem à primeira mudança.

import { useBancos } from "@/api/bancos";
import type { Banco } from "@/api/tipos";
import { bancosEfectivos, usarPedido } from "@/estado/pedido";

export type Selecao = {
  todos: Banco[];
  /** Os bancos que a comparação vai levar. Nunca `null`: já está resolvido. */
  escolhidos: Banco[];
  aEsperar: boolean;
  falhou: boolean;
  repetir: () => void;
};

export function useSelecao(): Selecao {
  const consulta = useBancos();
  const bancosEscolhidos = usarPedido((estado) => estado.bancosEscolhidos);

  const todos = consulta.data?.bancos ?? [];
  const ids = bancosEfectivos(
    bancosEscolhidos,
    todos.map((banco) => banco.id),
  );

  return {
    todos,
    escolhidos: todos.filter((banco) => ids.includes(banco.id)),
    aEsperar: consulta.isPending,
    falhou: consulta.isError,
    repetir: () => {
      void consulta.refetch();
    },
  };
}
