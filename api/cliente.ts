// O cliente HTTP. Um sítio só que fala com o servidor.
//
// ⚠️ **Traduz os estatutos do contrato para as espécies de falha que os textos
// já nomeiam.** É a razão de existir deste ficheiro: sem ele, cada ecrã olhava
// para um `response.status` e inventava a sua mensagem, e a A6 do `APP.md` — «os
// estados que não são o caminho feliz» — ficava espalhada por toda a app em vez
// de estar num sítio que se testa.
//
// ⚠️ O `/api/v1` **não leva chave**. A `X-API-Key` é do `/api/rate-catalog`, que
// esta app não consome, e o `openapi.yaml` declara o `security` só lá. Uma chave
// dentro de um bundle de browser é uma chave pública — está no `RESUME.md`.

import type { RespostaErro } from "./tipos";

/**
 * A base do servidor.
 *
 * ⚠️ `EXPO_PUBLIC_` não é decorativo: só as variáveis com esse prefixo são
 * inlinadas no bundle pelo Expo. Sem ele, isto era `undefined` em produção e a
 * app falhava a falar com o servidor — em produção, que é onde ninguém está a
 * olhar.
 *
 * O valor por omissão é o do backend em desenvolvimento (`.env.example`:
 * «Vazio vale 127.0.0.1:8080»).
 */
export const baseDaApi = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8080";

/**
 * As espécies de falha que a app sabe mostrar.
 *
 * ⚠️ São exactamente as chaves de `textos.erros`. Não é coincidência e há teste
 * a afirmá-lo: uma espécie nova sem frase escrita dava um ecrã de erro vazio.
 */
export type EspecieDeFalha =
  | "semRede"
  | "servidorEmBaixo"
  | "semSerie"
  | "tectoExcedido"
  | "pedidoInvalido";

const marcaDaFalha = "falha-da-api";

/**
 * FalhaDaApi é o que sai deste módulo quando um pedido não corre bem.
 *
 * ⚠️ Traz uma `marca` e não se confia no `instanceof`. Estender `Error` e
 * atravessar a transpilação para ES5 é o caso clássico em que o `instanceof`
 * devolve falso — e o sítio onde isso se descobre seria um `catch` que deixa
 * passar a falha em silêncio. O `eFalhaDaApi` abaixo é o que se usa.
 */
export class FalhaDaApi extends Error {
  readonly marca = marcaDaFalha;
  readonly especie: EspecieDeFalha;
  /** O `codigo` do contrato, quando o servidor o deu. Para decidir, não para ler. */
  readonly codigo?: string;
  /** O campo que o servidor nomeou, num 400. */
  readonly campo?: string;
  /** O `Retry-After` de um 429, em segundos. */
  readonly esperarSegundos?: number;

  constructor(
    especie: EspecieDeFalha,
    detalhe?: { codigo?: string; campo?: string; esperarSegundos?: number; causa?: unknown },
  ) {
    super(especie);
    this.especie = especie;
    this.codigo = detalhe?.codigo;
    this.campo = detalhe?.campo;
    this.esperarSegundos = detalhe?.esperarSegundos;
    Object.setPrototypeOf(this, FalhaDaApi.prototype);
  }
}

export function eFalhaDaApi(erro: unknown): erro is FalhaDaApi {
  return typeof erro === "object" && erro !== null && (erro as FalhaDaApi).marca === marcaDaFalha;
}

/** ⚠️ Um pedido que nunca responde é pior do que um que falha: o ecrã fica a
 * girar para sempre e a pessoa não tem o que fazer. Quinze segundos é folgado
 * para uma consulta e aritmética local, que é tudo o que uma comparação custa
 * desde a inversão da §1. */
const limiteDeEspera = 15_000;

async function lerErro(resposta: Response): Promise<{ codigo?: string; campo?: string }> {
  try {
    const corpo = (await resposta.json()) as RespostaErro;
    return { codigo: corpo.erro?.codigo, campo: corpo.erro?.campo };
  } catch {
    // ⚠️ Um corpo que não é o JSON do contrato não é motivo para esconder a
    // falha: o estatuto já disse o que interessa. Isto acontece de verdade —
    // um proxy à frente do servidor devolve HTML num 502.
    return {};
  }
}

/**
 * traduzirEstatuto mapeia o estatuto HTTP para a espécie de falha.
 *
 * ⚠️ O 503 é o `SerieIndisponivel` do contrato e **não** «o servidor está em
 * baixo»: quer dizer que o varrimento ainda não correu para estes bancos, e
 * resolve-se correndo `simulador varrer`, não esperando. Empacotá-lo num «tente
 * mais tarde» genérico mandava a pessoa esperar por uma coisa que não vai
 * acontecer sozinha. É a distinção que o próprio `openapi.yaml` manda fazer.
 */
export function traduzirEstatuto(estatuto: number): EspecieDeFalha {
  if (estatuto === 400) return "pedidoInvalido";
  if (estatuto === 429) return "tectoExcedido";
  if (estatuto === 503) return "semSerie";
  return "servidorEmBaixo";
}

function segundosDoRetryAfter(cabecalho: string | null): number | undefined {
  if (cabecalho === null) return undefined;
  const segundos = Number(cabecalho);
  return Number.isFinite(segundos) && segundos >= 0 ? segundos : undefined;
}

/**
 * pedir faz o pedido e devolve o corpo já tipado, ou atira uma `FalhaDaApi`.
 *
 * O tipo `T` vem sempre de `api/tipos.ts` — que vem do contrato. Não se
 * inventa aqui a forma de nenhuma resposta.
 */
export async function pedir<T>(caminho: string, opcoes?: RequestInit): Promise<T> {
  const abortar = new AbortController();
  const relogio = setTimeout(() => abortar.abort(), limiteDeEspera);

  let resposta: Response;
  try {
    resposta = await fetch(`${baseDaApi}${caminho}`, {
      ...opcoes,
      signal: abortar.signal,
      headers: { Accept: "application/json", ...opcoes?.headers },
    });
  } catch (causa) {
    // ⚠️ O `fetch` só atira por rede ou por corte: um 500 é uma resposta e
    // chega ao caminho de baixo. Aqui é mesmo «não se chegou ao servidor».
    throw new FalhaDaApi("semRede", { causa });
  } finally {
    clearTimeout(relogio);
  }

  if (!resposta.ok) {
    const { codigo, campo } = await lerErro(resposta);
    throw new FalhaDaApi(traduzirEstatuto(resposta.status), {
      codigo,
      campo,
      esperarSegundos: segundosDoRetryAfter(resposta.headers.get("Retry-After")),
    });
  }

  return (await resposta.json()) as T;
}

export async function publicar<T>(caminho: string, corpo: unknown): Promise<T> {
  return pedir<T>(caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
}
