// `GET /api/v1/bancos` — a fonte do formulário adaptativo.
//
// ⚠️ **É a única fonte.** Não há em lado nenhum da app uma lista de bancos, de
// períodos fixos ou de indexantes escrita à mão. Está no `openapi.yaml`
// («a app não tem listas de bancos escritas à mão») e no `ECRAS.md` §1.3, e a
// razão é concreta: os bancos mudam o que aceitam sem avisar ninguém, e uma
// lista escrita na app só se descobre errada quando alguém se queixa.
//
// ⚠️ E é o caso de cache por excelência (`APP.md` §1): muda uma vez por
// varrimento, alimenta os três passos do pedido e é lido em três ecrãs.

import { useQuery } from "@tanstack/react-query";

import { pedir } from "./cliente";
import type { BancosResposta } from "./tipos";

export const chaveDosBancos = ["bancos"] as const;

export function obterBancos(): Promise<BancosResposta> {
  return pedir<BancosResposta>("/api/v1/bancos");
}

export function useBancos() {
  return useQuery({ queryKey: chaveDosBancos, queryFn: obterBancos });
}
