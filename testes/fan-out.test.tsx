// O tecto do fan-out, medido onde ele tem de valer: nos pedidos que saem.
//
// ⚠️ **O `fila.test.ts` não cobre isto, e foi medido a 2026-08-08.** Ele monta a
// `criarFila` directamente e afirma que ela respeita as vagas — o que é verdade e
// continua a ser útil. Mas nenhum teste importava o `useOfertasPorBanco`, e por
// isso o **fio** entre a fila e o pedido não estava preso: trocar o `queryFn`
// para chamar o `pedirOferta` sem fila nenhuma deixava os 87 testes verdes e o
// `tsc` também. É o defeito de disparar cinco pedidos de uma vez, e passava.
//
// ⚠️ **Conta chamadas ao `fetch`, e não tarefas.** O que se afirma não é «a fila
// funciona» — é «não saem mais de três pedidos nossos ao mesmo tempo», que é a
// promessa que fazemos aos simuladores públicos de terceiros. Contar tarefas
// media a fila; contar `fetch` mede o que chega lá fora.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import React, { type ReactNode } from "react";

import { useOfertasPorBanco } from "@/api/ofertas";
import type { OfertaPedido } from "@/api/tipos";
import { montarPedido, paraOfertaPedido, type CamposDoPedido } from "@/estado/pedido";

import { bancoDeTeste } from "./ajudas";

// Cinco, como os bancos a sério: é preciso haver mais do que vagas para o tecto
// ter o que travar.
const bancos = ["um", "dois", "tres", "quatro", "cinco"].map((id) =>
  bancoDeTeste(id, id.toUpperCase()),
);

const hoje = new Date("2026-08-08T10:00:00Z");

const campos: CamposDoPedido = {
  valorImovel: 250_000,
  montante: 200_000,
  prazoAnos: 30,
  finalidade: "propria",
  localizacao: "continente",
  garantiaPublica: false,
  jaCliente: false,
  titulares: [{ dataNascimento: "12/04/1990", rendimentoMensal: 2200 }],
  tipoTaxa: "mista",
  periodoFixoAnos: 5,
  indexante: "6m",
  bancosEscolhidos: null,
  produtos: {},
};

// ⚠️ O corpo é real — sai do `montarPedido` como sairia da app —, mas o que ele
// leva **não** importa aqui: o que se conta são pedidos em voo. Real para o
// `enabled` ser verdadeiro pela mesma razão que é na app, e não por um `null`
// escrito à mão passar a valer outra coisa amanhã.
const montado = montarPedido(campos, bancos, hoje);
const corpoDe = (bancoId: string): OfertaPedido | null =>
  montado === null ? null : paraOfertaPedido(montado, bancoId);

/**
 * Um `fetch` que não responde sozinho, e que regista quantos estiveram em voo ao
 * mesmo tempo.
 *
 * ⚠️ Regista o **máximo**, e não o valor no fim: no fim são sempre zero, e um
 * teste que só olhasse para lá passava com fila nenhuma.
 */
function contadorDeFetch() {
  let emVoo = 0;
  let maximo = 0;
  let total = 0;
  const libertar: (() => void)[] = [];

  global.fetch = jest.fn(() => {
    emVoo += 1;
    total += 1;
    maximo = Math.max(maximo, emVoo);
    return new Promise((resolver) => {
      libertar.push(() => {
        emVoo -= 1;
        resolver({
          ok: true,
          status: 200,
          headers: { get: () => null },
          json: async () => ({ banco_id: "um", banco_nome: "UM", sucesso: true }),
        });
      });
    });
  }) as unknown as typeof fetch;

  return {
    get maximo() {
      return maximo;
    },
    get total() {
      return total;
    },
    /** Deixa responder o que já partiu, e cede o ciclo para os seguintes irem. */
    async libertarTodas() {
      while (libertar.length > 0) {
        libertar.shift()?.();
        await Promise.resolve();
        await Promise.resolve();
      }
    },
  };
}

function comCliente({ children }: { children: ReactNode }) {
  // ⚠️ Sem repetições e sem cache entre testes: o que se conta são pedidos, e uma
  // repetição ou um acerto mudavam a conta por uma razão que não é a que se mede.
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>;
}

describe("o fan-out da app", () => {
  const fetchOriginal = global.fetch;

  afterEach(() => {
    global.fetch = fetchOriginal;
  });

  // ⚠️ **É este o teste que faltava.** A reversão é tirar a `filaDosBancos` do
  // `queryFn` do `useOfertasPorBanco`, e nessa montagem esta afirmação falha a
  // dizer que saíram 5 pedidos ao mesmo tempo — não «esperava true».
  it("nunca deixa sair mais do que três pedidos ao mesmo tempo", async () => {
    const obs = contadorDeFetch();
    const ids = bancos.map((banco) => banco.id);

    renderHook(() => useOfertasPorBanco(ids, corpoDe), { wrapper: comCliente });

    await waitFor(() => expect(obs.total).toBe(3));
    expect(obs.maximo).toBe(3);

    // E os cinco saem — o tecto atrasa, não deita fora. Sem isto, uma fila que
    // engolisse os dois últimos passava neste teste com o máximo em três.
    await act(async () => {
      await obs.libertarTodas();
    });
    await waitFor(() => expect(obs.total).toBe(5));
    expect(obs.maximo).toBe(3);
  });
});
