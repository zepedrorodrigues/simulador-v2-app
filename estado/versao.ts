// Se este servidor já recusou esta app por ser velha de mais.
//
// ⚠️ **Uma flag global, e não uma falha por consulta — é a razão de o módulo
// existir.** O `426` responde a TODOS os pedidos, e não a um banco. Deixado a
// viajar só como falha de cada consulta, o ecrã das ofertas mostrava cinco
// cartões `nao-chegou`, um por banco, cada um com o nome de um banco, todos a
// dizer que a versão é velha. E uma linha `nao-chegou` existe para dizer o que a
// APP sabe sobre aquele banco (ver `estado/lista.ts`) — «a tua versão é velha»
// não é sobre banco nenhum.
//
// ⚠️ **Não há `esquecer()`.** Não se sai deste estado dentro desta versão da
// app: a acção é actualizar, e está na loja. Um caminho de volta só serviria os
// testes, e na app devolvia a pessoa a um ecrã que não pode funcionar. Os testes
// repõem com `setState`, que é a porta das traseiras do `zustand` e não uma
// afirmação sobre o produto.

import { create } from "zustand";

type VersaoRecusada = {
  recusada: boolean;
  marcar: () => void;
};

export const usarVersaoRecusada = create<VersaoRecusada>((set) => ({
  recusada: false,
  marcar: () => set({ recusada: true }),
}));

/**
 * marcarVersaoRecusada, para quem não é um componente.
 *
 * ⚠️ O cliente HTTP não pode chamar um hook, e é ele que vê o `426` primeiro.
 */
export function marcarVersaoRecusada() {
  usarVersaoRecusada.getState().marcar();
}
