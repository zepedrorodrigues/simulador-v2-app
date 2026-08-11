// O 426 não é sobre banco nenhum, e tem de sair da lista.
//
// ⚠️ **O que se afirma aqui é o que a pessoa VÊ**, e não que o estado ficou
// marcado: sem o ecrã da raiz, um 426 no ecrã das ofertas dava cinco cartões
// `nao-chegou` — um por banco, cada um a atribuir a um banco uma coisa que é
// nossa. O `CartaoDeOferta.tsx` lê mesmo `textos.erros[especie]`, portanto os
// cinco traziam a frase de actualizar com o nome de um banco por cima.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import { useBancos } from "@/api/bancos";
import { pedir, repetirNaRaiz, FalhaDaApi } from "@/api/cliente";
import Raiz from "@/app/_layout";
import { usarVersaoRecusada } from "@/estado/versao";
import { textos } from "@/textos";

// ⚠️ **O `SafeAreaProvider` a sério não desenha os filhos em teste** — espera
// pela medição que nunca chega —, e a árvore fica num `<RNCSafeAreaProvider />`
// vazio. Sem este mock, um `queryByText(...)` a dar `null` não prova nada: dá
// nulo porque não há ecrã nenhum. Medido aqui: o teste do «não oferece repetir»
// passava assim, e passava pela razão errada. O mock é o que a própria
// biblioteca publica para isto.
jest.mock("react-native-safe-area-context", () =>
  jest.requireActual("react-native-safe-area-context/jest/mock").default,
);

// ⚠️ O `Stack` do `expo-router` é substituído por uma marca legível: o que este
// ficheiro tem de distinguir é «a app normal» de «o ecrã de actualizar», e
// montar o router a sério trazia navegação que não é o que se está a medir.
jest.mock("expo-router", () => ({
  Stack: Object.assign(
    ({ children }: { children?: ReactNode }) => {
      const { Text } = jest.requireActual("react-native");
      return <Text>a app normal</Text>;
    },
    { Screen: () => null },
  ),
}));

const fetchOriginal = global.fetch;

beforeEach(() => {
  // ⚠️ A loja não tem `esquecer()` de propósito (ver `estado/versao.ts`), e os
  // testes repõem-na pela porta das traseiras do `zustand`. Aqui é reposição de
  // ambiente; na app seria um caminho de volta que não existe.
  usarVersaoRecusada.setState({ recusada: false });
});

afterEach(() => {
  global.fetch = fetchOriginal;
});

function responderCom(estatuto: number, corpo: unknown) {
  const espia = jest.fn().mockResolvedValue({
    ok: estatuto >= 200 && estatuto < 300,
    status: estatuto,
    headers: { get: () => null },
    json: async () => corpo,
  });
  global.fetch = espia as unknown as typeof fetch;
  return espia;
}

const erro426 = {
  erro: { codigo: "versao_demasiado_antiga", mensagem: "Actualiza para a 2.0.0." },
};

describe("o cliente perante um 426", () => {
  it("marca a versão como recusada", async () => {
    responderCom(426, erro426);

    await expect(pedir("/api/v1/bancos")).rejects.toMatchObject({
      especie: "versaoDemasiadoAntiga",
    });
    expect(usarVersaoRecusada.getState().recusada).toBe(true);
  });

  // ⚠️ Marcar não chega: quem chamou tem de saber que este pedido não trouxe
  // nada. Só a marca deixava a consulta eternamente à espera.
  it("atira na mesma, para a consulta não ficar à espera", async () => {
    responderCom(426, erro426);

    await expect(pedir("/api/v1/bancos")).rejects.toBeInstanceOf(FalhaDaApi);
  });

  it("não marca nada quando a falha é outra", async () => {
    responderCom(503, { erro: { codigo: "banco_ocupado", mensagem: "…" } });

    await expect(pedir("/api/v1/ofertas/cgd")).rejects.toMatchObject({
      especie: "bancoOcupado",
    });
    expect(usarVersaoRecusada.getState().recusada).toBe(false);
  });
});

// ⚠️ O `render` do `@testing-library/react-native` 14 devolve uma promessa, e
// sem o `await` o que se destrutura é a promessa — «getByText is not a
// function», que é como isto se manifestou.
describe("a raiz da app", () => {
  it("mostra a app quando a versão não foi recusada", async () => {
    const { getByText } = await render(<Raiz />);

    expect(getByText("a app normal")).toBeTruthy();
  });

  // ⚠️ **É este o teste que substitui os cinco cartões.** Marcada a recusa, não
  // há app nenhuma por baixo: nenhuma rota funciona contra este servidor.
  it("substitui a app inteira pelo ecrã de actualizar", async () => {
    usarVersaoRecusada.setState({ recusada: true });
    const { getByText, queryByText } = await render(<Raiz />);

    expect(getByText(textos.erros.versaoDemasiadoAntiga.titulo)).toBeTruthy();
    expect(queryByText("a app normal")).toBeNull();
  });

  // ⚠️ Um «tentar de novo» aqui promete uma coisa que não pode acontecer: a
  // acção é actualizar, e está na loja e não dentro desta app.
  it("não oferece repetir", async () => {
    usarVersaoRecusada.setState({ recusada: true });
    const { queryByText } = await render(<Raiz />);

    expect(queryByText(textos.comum.tentarDeNovo)).toBeNull();
  });
});

describe("a repetição na raiz", () => {
  it("não repete uma versão recusada", () => {
    const falha = new FalhaDaApi("versaoDemasiadoAntiga");

    expect(repetirNaRaiz(0, falha)).toBe(false);
  });

  it("continua a repetir duas vezes o resto", () => {
    const falha = new FalhaDaApi("servidorEmBaixo");

    expect(repetirNaRaiz(0, falha)).toBe(true);
    expect(repetirNaRaiz(1, falha)).toBe(true);
    expect(repetirNaRaiz(2, falha)).toBe(false);
  });

  // ⚠️ **Conta chamadas ao `fetch`**, como o `fan-out.test.tsx`, e pela mesma
  // razão: o que se afirma não é «a regra devolve false» — é que não saem três
  // pedidos a um servidor cuja recusa é certa à primeira.
  //
  // ⚠️ E mede-se no `useBancos`, que é quem usa a omissão do cliente. O caminho
  // dos bancos escolhidos sobrepõe-na (`api/ofertas.ts`) e não provava nada
  // sobre esta regra.
  it("faz UM pedido e não três, medido no fetch", async () => {
    const espia = responderCom(426, erro426);
    const cliente = new QueryClient({
      defaultOptions: { queries: { retry: repetirNaRaiz, gcTime: 0 } },
    });
    const embrulho = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    );

    const { result } = await renderHook(() => useBancos(), { wrapper: embrulho });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(espia).toHaveBeenCalledTimes(1);
    expect(usarVersaoRecusada.getState().recusada).toBe(true);
  });
});
