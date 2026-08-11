// A versão desta app, e o que dela se diz ao servidor.
//
// ⚠️ **Um módulo próprio para o número ter UMA fonte:** o `expo.version` do
// `app.json`, que é o mesmo que a loja publica. Escrito à mão no cliente HTTP
// havia duas versões — a que se instala e a que a app diz ser — e a segunda
// ficava para trás sem ninguém dar por isso, no dia em que a primeira subisse.

import Constants from "expo-constants";

/**
 * O cabeçalho onde a app diz qual é.
 *
 * ⚠️ O nome é o do servidor (`internal/infra/web/versao.go`), e um cabeçalho e
 * não um campo do corpo: vale para **todas** as rotas, incluindo o
 * `GET /api/v1/bancos`, que é a primeira que a app chama e a única que ela
 * consegue montar quando está velha de mais para as outras.
 */
export const cabecalhoDaVersao = "X-App-Versao";

/** O que o contrato aceita: três números e mais nada. */
const tresNumeros = /^\d+\.\d+\.\d+$/;

/**
 * versaoParaCabecalho devolve a versão a mandar, ou `null` para não mandar nada.
 *
 * ⚠️ **O que não for três números não se manda — e não se manda em vez de se
 * mandar como está.** O servidor SERVE quem não manda o cabeçalho, e serve quem
 * o manda ilegível (`versao.go`): as duas ausências de informação passam. Mas o
 * contrato declara `pattern: '^\d+\.\d+\.\d+$'`, e mandar fora do padrão era a
 * app a violar o contrato para obter o mesmo resultado que o silêncio já dá.
 *
 * ⚠️ Um sufixo — `1.2.3-rc1`, `1.2.3+build` — cai aqui de propósito. Do outro
 * lado é recusado pela mesma razão: nunca se publicou uma pré-lançamento, e a
 * ordem entre `1.2.3-rc1` e `1.2.3` não está decidida em lado nenhum.
 */
export function versaoParaCabecalho(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  return tresNumeros.test(bruto) ? bruto : null;
}

/**
 * versaoDaApp é a versão instalada, quando se consegue ler.
 *
 * ⚠️ **`null` acontece de verdade.** Sob o `jest-expo` o `expoConfig` pode vir
 * vazio, e no alvo web depende de como o bundle foi exportado. É por isso que
 * ler isto nunca pode ser condição para a app falar com o servidor.
 */
export function versaoDaApp(): string | null {
  return versaoParaCabecalho(Constants.expoConfig?.version);
}

/** O cabeçalho pronto a juntar aos outros, ou nada. */
export function cabecalhoDeVersao(): Record<string, string> {
  const versao = versaoDaApp();
  return versao === null ? {} : { [cabecalhoDaVersao]: versao };
}
