// Por que métrica a lista está ordenada.
//
// ⚠️ Loja à parte da do pedido, e não um `useState` no ecrã. A razão é a mesma
// por que a loja do pedido existe: no alvo web o botão «para trás» do browser
// devolve a pessoa do detalhe à lista, e um `useState` do ecrã tinha voltado à
// omissão — ela tinha ordenado por prestação, foi ver uma oferta, e encontrava a
// lista por TAEG outra vez.
//
// ⚠️ E fica fora da loja do pedido porque não é o pedido: isto não viaja para o
// servidor, e misturá-lo com o que viaja era arriscar mandá-lo.

import { create } from "zustand";

import type { Metrica } from "@/dominio/ofertas";

type Ordenacao = {
  criterio: Metrica;
  definir: (criterio: Metrica) => void;
};

export const usarOrdenacao = create<Ordenacao>((set) => ({
  // ⚠️ TAEG por omissão, e é a escolha certa: é a métrica que a MCD define
  // precisamente para se poderem comparar créditos entre si. Ordenar por
  // prestação por omissão premiava o prazo mais longo, que é o mais caro.
  criterio: "taeg",
  definir: (criterio) => set({ criterio }),
}));
