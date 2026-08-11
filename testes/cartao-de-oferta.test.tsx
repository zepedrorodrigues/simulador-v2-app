// O rótulo do cartão de uma oferta em falha — de quem é a falha (KAN-30).
//
// ⚠️ **Renderiza, e é essa a diferença que faz este ficheiro existir.** O
// `ofertas.test.ts` afirma a regra pura (`eFalhaNossa`) e continuaria verde com
// o componente a ignorá-la — foi exactamente esse o defeito do `fila.test.ts` a
// 2026-08-08: a peça estava presa e o **fio** entre ela e o ecrã não estava. O
// que se conta aqui é o texto que a pessoa lê.

// ⚠️ **O `render` da RNTL 14 é assíncrono, e sem `await` falha em silêncio útil.**
// Devolve uma Promise — não o objecto de consultas —, portanto `ecra.getByText`
// é `undefined` e o `screen` responde «`render` function has not been called».
// Nenhuma das duas mensagens diz «faltou o await», e o teste que as apanha
// parece um erro de importação.
import { render, screen } from "@testing-library/react-native";
import React from "react";

import type { Oferta } from "@/api/tipos";
import { CartaoDeOferta } from "@/componentes/CartaoDeOferta";
import { textos } from "@/textos";

function emFalha(codigo: string, mensagem: string): Oferta {
  return {
    banco_id: "cgd",
    banco_nome: "CGD",
    sucesso: false,
    erro: { codigo, mensagem },
  };
}

async function mostrar(oferta: Oferta) {
  await render(<CartaoDeOferta oferta={oferta} melhorEm={[]} aoAbrir={() => {}} />);
}

describe("o cartão de uma oferta em falha", () => {
  // ⚠️ «Sem oferta» é uma afirmação sobre o banco: foi perguntado e não tem
  // preço para este pedido. Num `erro_interno` isso não se apurou — rebentou do
  // nosso lado e ele pode nem ter sido interrogado.
  it("uma falha nossa não veste o nome do banco", async () => {
    await mostrar(
      emFalha("erro_interno", "Não se conseguiu pedir a simulação à CGD por uma falha nossa."),
    );

    expect(screen.queryByText(new RegExp(textos.ofertas.semOferta))).toBeNull();
    expect(screen.getByText(new RegExp(textos.ofertas.falhaNossa))).toBeTruthy();
  });

  // ⚠️ E a frase continua a ser a do servidor. É o que distingue este cartão do
  // `CartaoNaoChegou`, onde não há frase e não se inventa uma.
  it("mostra a frase que o servidor escreveu, e não uma nossa", async () => {
    const mensagem = "Não se conseguiu pedir a simulação à CGD por uma falha nossa.";
    await mostrar(emFalha("erro_interno", mensagem));

    expect(screen.getByText(mensagem)).toBeTruthy();
  });

  it("uma recusa do banco continua a ser «sem oferta»", async () => {
    await mostrar(emFalha("prazo_impossivel", "O crédito terminaria aos 78 anos."));

    expect(screen.getByText(new RegExp(textos.ofertas.semOferta))).toBeTruthy();
    expect(screen.queryByText(new RegExp(textos.ofertas.falhaNossa))).toBeNull();
  });
});
