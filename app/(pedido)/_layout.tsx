import { Stack } from "expo-router";

import { textos } from "@/textos";

/**
 * Os três passos do pedido.
 *
 * ⚠️ Três rotas e não um ecrã com três secções. É a regra do `ECRAS.md`: **um
 * ecrã, uma pergunta**. O v1 tinha um formulário de ~25 campos e a tabela de
 * resultados na mesma página, num ficheiro de 874 linhas, e a issue #2 dele
 * dizia o que isso era: «visually too much information».
 *
 * ⚠️ E são rotas a sério, com URL, porque no alvo web esta app substitui o site
 * público do v1 (`APP.md` §1). O botão «para trás» do browser tem de devolver a
 * pessoa ao passo anterior com o que ela escreveu lá — que é o que a loja
 * Zustand garante.
 */
export default function EsquemaDoPedido() {
  return (
    <Stack>
      <Stack.Screen name="passo-1" options={{ title: textos.pedido.passo1.titulo }} />
      <Stack.Screen name="passo-2" options={{ title: textos.pedido.passo2.titulo }} />
      <Stack.Screen name="passo-3" options={{ title: textos.pedido.passo3.titulo }} />
    </Stack>
  );
}
