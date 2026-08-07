// Os nomes curtos dos tipos do contrato.
//
// ⚠️ **Não há aqui um único tipo escrito à mão** — são todos aliases do
// `api.d.ts`, que é gerado do `openapi.yaml` do backend (`APP.md` §2). Um tipo
// escrito à mão é um tipo que deixa de acompanhar o contrato sem ninguém
// reparar, e o portão da app não o apanharia: ele compara o gerado com o
// esquema, não o que escrevemos com nenhum dos dois.
//
// Este ficheiro existe só para o resto da app não ter de escrever
// `components["schemas"]["…"]` em todo o lado.

import type { components } from "./api";

export type BancosResposta = components["schemas"]["BancosResposta"];
export type Banco = components["schemas"]["Banco"];
export type BancoInput = components["schemas"]["BancoInput"];
export type Produto = components["schemas"]["Produto"];
export type InputCanonico = components["schemas"]["InputCanonico"];

export type OfertaPedido = components["schemas"]["OfertaPedido"];
export type Pedido = components["schemas"]["Pedido"];
export type Titular = components["schemas"]["Titular"];

export type Oferta = components["schemas"]["Oferta"];
export type Fase = components["schemas"]["Fase"];

export type RespostaErro = components["schemas"]["RespostaErro"];

/** ⚠️ `rate_type` e `fixed_period_years` são heranças em inglês do v1, e ficam:
 * arrumá-los partia o contrato de uma app publicada (`API.md`, `requisitos.go`).
 * Os aliases daqui dão-lhes nome português do lado de cá sem lhes tocar. */
export type TipoTaxa = Pedido["rate_type"];
export type Finalidade = Pedido["finalidade"];
export type Indexante = NonNullable<Pedido["euribor_indexante"]>;
