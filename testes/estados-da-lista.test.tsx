// A A6, medida onde ela vale: no ecrã das Ofertas.
//
// ⚠️ **O `lista.test.ts` afirma as regras puras e continuaria verde com o ecrã a
// ignorá-las.** É a lição do `fila.test.ts` a 2026-08-08 — a peça presa e o fio
// entre ela e o ecrã por prender —, e nestes dois defeitos o fio era exactamente
// o que faltava: a espécie da falha existia, tinha frase escrita, e morria num
// booleano a meio do caminho.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import Ofertas from "@/app/ofertas/index";
import { usarPedido } from "@/estado/pedido";
import { textos } from "@/textos";

import { cgd, montepio, novobanco } from "./ajudas";

function Envolver({ children }: { children: ReactNode }) {
  // ⚠️ `retry: false` — o que se mede é o que o ecrã mostra, não a política de
  // repetição, e as duas tentativas da raiz só atrasavam cada caso em segundos.
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

// ⚠️ O `await` não é opcional: o `render` da RNTL 14 devolve uma Promise, e sem
// ele o `screen` responde «`render` function has not been called» — mensagem que
// não aponta para o `await` nenhuma vez.
async function mostrar() {
  await render(
    <Envolver>
      <Ofertas />
    </Envolver>,
  );
}

/** O pedido preenchido, como sai dos três passos. Sem ele não há consultas. */
function comPedidoPreenchido() {
  usarPedido.getState().limpar();
  usarPedido.setState({
    valorImovel: 250_000,
    montante: 200_000,
    prazoAnos: 30,
    tipoTaxa: "variavel",
    titulares: [{ dataNascimento: "12/04/1990", rendimentoMensal: 2200 }],
  });
}

/**
 * Um `fetch` que serve os bancos e depois faz o que se lhe mandar nas ofertas.
 *
 * ⚠️ O `GET /api/v1/bancos` responde sempre bem aqui: o que se está a medir são
 * as ofertas, e um ecrã de falha da lista de bancos abafava-as.
 */
function servidor(ofertas: () => Response) {
  global.fetch = jest.fn((entrada: RequestInfo | URL) => {
    const url = String(entrada);
    if (url.includes("/api/v1/bancos")) {
      return Promise.resolve(
        new Response(JSON.stringify({ bancos: [cgd, novobanco, montepio], inputs_canonicos: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(ofertas());
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  comPedidoPreenchido();
});

describe("a falha da lista de bancos diz o que aconteceu", () => {
  // ⚠️ **O defeito, e era de uma linha:** o `useSelecao` devolvia `falhou: boolean`
  // e o ecrã mostrava sempre `servidorEmBaixo` — «Isto é do nosso lado. Tente
  // daqui a pouco.» Sem rede as duas metades são falsas, e a segunda manda esperar
  // por uma coisa que não passa sozinha: a acção é ligar a Internet.
  it("sem rede não diz que o serviço está em baixo", async () => {
    global.fetch = jest.fn(() => Promise.reject(new TypeError("Network request failed")));

    await mostrar();

    await waitFor(() => {
      expect(screen.getByText(textos.erros.semRede.titulo)).toBeTruthy();
    });
    expect(screen.queryByText(textos.erros.servidorEmBaixo.titulo)).toBeNull();
  });
});

describe("o que aconteceu a todos mostra-se uma vez", () => {
  // ⚠️ **É a forma exacta do defeito do 426**, um estatuto abaixo: o `429` é o
  // tecto por IP, acontece uma vez e vale para os cinco, e o fan-out dava um
  // cartão por banco — cada um com o nome de um banco por cima de uma coisa que
  // não é dele.
  it("um tecto excedido não vira um cartão por banco", async () => {
    servidor(
      () =>
        new Response(JSON.stringify({ erro: { codigo: "tecto_excedido", mensagem: "" } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "60" },
        }),
    );

    await mostrar();

    await waitFor(() => {
      expect(screen.getByText(textos.erros.tectoExcedido.titulo)).toBeTruthy();
    });
    // Uma vez, e não três: nenhum banco é nomeado por uma coisa que é nossa.
    expect(screen.queryByText(new RegExp(textos.ofertas.naoChegou))).toBeNull();
    expect(screen.queryByText(cgd.nome)).toBeNull();
  });

  // ⚠️ E o ecrã dele **não leva botão**: o servidor mandou esperar a janela
  // inteira, e insistir é bater na porta que ele acabou de fechar.
  it("e o ecrã do tecto não convida a insistir", async () => {
    servidor(
      () =>
        new Response(JSON.stringify({ erro: { codigo: "tecto_excedido", mensagem: "" } }), {
          status: 429,
          headers: { "Content-Type": "application/json", "Retry-After": "60" },
        }),
    );

    await mostrar();

    await waitFor(() => {
      expect(screen.getByText(textos.erros.tectoExcedido.titulo)).toBeTruthy();
    });
    expect(screen.queryByText(textos.comum.tentarDeNovo)).toBeNull();
  });

  // ⚠️ **O `503 banco_ocupado` é a excepção que confirma a regra**, e é por
  // construção: conta pedidos nossos em voo contra AQUELE banco. Aqui os cartões
  // ficam, com o banco nomeado, porque é mesmo sobre cada um deles.
  //
  // ⚠️ **Espera-se pela FRASE do cartão e não pelo nome do banco, e a diferença
  // apanhou este teste a passar por engano.** O nome aparece logo, na linha «a
  // perguntar»; a frase só aparece depois de a consulta assentar — e o
  // `banco_ocupado` é a única que se repete, duas vezes, com o `Retry-After` de
  // permeio. Medido revertendo a regra: com o `bancoOcupado` a contar como
  // global, a versão que esperava pelo nome **passava na mesma**, porque nessa
  // altura ainda nada tinha assentado.
  it("um banco ocupado continua a ser uma linha por banco", async () => {
    servidor(
      () =>
        new Response(JSON.stringify({ erro: { codigo: "banco_ocupado", mensagem: "" } }), {
          status: 503,
          headers: { "Content-Type": "application/json", "Retry-After": "0" },
        }),
    );

    await mostrar();

    await waitFor(
      () => {
        expect(screen.getAllByText(textos.erros.bancoOcupado.corpo)).toHaveLength(3);
      },
      { timeout: 5000 },
    );
    // Três linhas, uma por banco — e nenhum ecrã a falar pelos três.
    expect(screen.getByText(cgd.nome)).toBeTruthy();
    expect(screen.queryByText(textos.erros.tectoExcedido.titulo)).toBeNull();
  });
});
