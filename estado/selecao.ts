// A junção das duas metades: o que o servidor publica e o que a pessoa escolheu.
//
// ⚠️ Vive num sítio só porque os três passos precisam da mesma resposta à mesma
// pergunta — «que bancos é que esta comparação leva?» — e três respostas
// escritas em três ecrãs divergem à primeira mudança.

import { useBancos } from "@/api/bancos";
import { eFalhaDaApi, type EspecieDeFalha } from "@/api/cliente";
import type { Banco } from "@/api/tipos";
import { bancosEfectivos, usarPedido } from "@/estado/pedido";

export type Selecao = {
  todos: Banco[];
  /** Os bancos que a comparação vai levar. Nunca `null`: já está resolvido. */
  escolhidos: Banco[];
  aEsperar: boolean;
  /**
   * A espécie da falha, ou nula se não falhou.
   *
   * ⚠️ **Era um `falhou: boolean`, e o booleano deitava fora a única coisa que a
   * pessoa precisava de saber.** O `cliente.ts` já traduz o estatuto numa
   * espécie, e há frase escrita para cada uma — mas o ecrã recebia um sim/não e
   * mostrava sempre «O serviço não está a responder / Isto é do nosso lado».
   * Sem rede, isso é falso e manda esperar por uma coisa que não passa sozinha:
   * a acção é ligar a Internet.
   */
  especieDaFalha: EspecieDeFalha | null;
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
    // ⚠️ Uma falha que não é nossa conhecida cai em `servidorEmBaixo`, e é a
    // omissão certa: se não se percebe o que aconteceu, o que se sabe é que a
    // culpa não é de quem está a ler.
    especieDaFalha: consulta.isError ? especieDe(consulta.error) : null,
    repetir: () => {
      void consulta.refetch();
    },
  };
}

function especieDe(erro: unknown): EspecieDeFalha {
  return eFalhaDaApi(erro) ? erro.especie : "servidorEmBaixo";
}
