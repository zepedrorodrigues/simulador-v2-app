// O cliente HTTP. Um sítio só que fala com o servidor.
//
// ⚠️ **Traduz os estatutos do contrato para as espécies de falha que os textos
// já nomeiam.** É a razão de existir deste ficheiro: sem ele, cada ecrã olhava
// para um `response.status` e inventava a sua mensagem, e a A6 do `APP.md` — «os
// estados que não são o caminho feliz» — ficava espalhada por toda a app em vez
// de estar num sítio que se testa.
//
// ⚠️ O `/api/v1` **não leva chave**, e desde 2026-08-07 não há chave nenhuma a
// levar: o `/api/rate-catalog` saiu do servidor e com ele o único
// `securitySchemes` do contrato. O que protege esta API é o tecto por IP, e não
// uma credencial — uma chave dentro de um bundle de browser é uma chave pública.

import { marcarVersaoRecusada } from "@/estado/versao";

import type { operations } from "./api";
import type { RespostaErro } from "./tipos";
import { cabecalhoDeVersao } from "./versao";

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
  | "bancoOcupado"
  | "tectoExcedido"
  | "pedidoInvalido"
  | "versaoDemasiadoAntiga";

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

/**
 * Quanto se espera por uma resposta antes de desistir.
 *
 * ⚠️ Um pedido que nunca responde é pior do que um que falha: o ecrã fica a
 * girar para sempre e a pessoa não tem o que fazer.
 *
 * ⚠️ **Tem de EXCEDER o prazo por banco do servidor, que são 15 s** — e eram 15 s
 * aqui também. Os dois iguais é o pior valor possível: o cliente abortava no
 * mesmo instante em que o servidor ia responder `200` com a oferta em falha e o
 * banco nomeado, e a pessoa via um erro anónimo em vez de «o Banco Montepio não
 * respondeu». Uma falha nomeada pelo servidor ganha sempre a uma anónima nossa,
 * e para isso ele tem de chegar primeiro.
 *
 * ⚠️ O que fixa os 15 s do outro lado está medido: 8,4 s foi o pior caso
 * observado (Montepio, 2026-08-06), e o prazo do servidor é ~1,8× isso. Estes
 * 25 s dão-lhe 10 s de folga para responder depois de desistir do banco.
 */
const limiteDeEspera = 25_000;

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
 * ⚠️ **O 503 é o `banco_ocupado` e NÃO «o servidor está em baixo»**, e o contrato
 * diz por palavras para que serve a distinção: «para a app poder voltar a pedir
 * este banco daqui a um instante em vez de o riscar da lista». O banco está bem;
 * quem não tem lugar somos nós, e isto passa sozinho — daí o `Retry-After`. É a
 * única falha que se repete (ver `pedirOferta`).
 *
 * ⚠️ Era o `SerieIndisponivel` («o varrimento ainda não correu para estes
 * bancos») até 2026-08-07. Aquele resolvia-se correndo o varrimento e não
 * esperando; este é o inverso. Empacotar os dois num «tente mais tarde» genérico
 * mandava a pessoa esperar por uma coisa que não ia acontecer sozinha.
 *
 * ⚠️ **O 404 cai no `servidorEmBaixo`, de propósito.** Só se pede um banco cujo
 * id veio do `GET /api/v1/bancos`; se o servidor não o conhece, o defeito é
 * nosso e não um estado que valha a pena explicar a quem está do outro lado.
 * O 500 (`erro_interno`, declarado no contrato desde 2026-08-27) cai no mesmo
 * sítio pela mesma razão: quem está avariado somos nós.
 *
 * ⚠️ **O 426 tem espécie própria, e sem ela caía no `servidorEmBaixo`** — que
 * diria «Isto é do nosso lado. Tente daqui a pouco.» a quem só precisa de
 * actualizar. É a diferença entre mandar esperar por uma coisa que passa
 * sozinha e uma que não passa: a acção está na loja, fora desta app.
 */
export function traduzirEstatuto(estatuto: number): EspecieDeFalha {
  return (traducoesDoContrato as Record<number, EspecieDeFalha | undefined>)[estatuto] ?? "servidorEmBaixo";
}

/** As chaves de uma união, uma a uma — `keyof` de uma união só dá as comuns. */
type ChavesDe<T> = T extends unknown ? keyof T : never;

/** Todos os estatutos que alguma rota do contrato declara, menos o 200. */
type EstatutoDeErroDoContrato = Exclude<
  ChavesDe<operations[keyof operations]["responses"]>,
  200
>;

/**
 * A tradução de CADA estatuto de erro que o contrato declara.
 *
 * ⚠️ **É um `Record` sobre os estatutos do `api.d.ts`, e é isso que o torna um
 * teste.** Um estatuto novo no contrato sem entrada aqui é um erro de `tsc`, e
 * um estatuto que saia do contrato deixa uma entrada a mais — também erro. O 426
 * e o 429 entraram no servidor antes de a app os saber ler, e foi a ler código
 * que se deu por isso; a partir daqui é o `npm run tipos` que dá.
 */
const traducoesDoContrato: Record<EstatutoDeErroDoContrato, EspecieDeFalha> = {
  400: "pedidoInvalido",
  404: "servidorEmBaixo",
  426: "versaoDemasiadoAntiga",
  429: "tectoExcedido",
  500: "servidorEmBaixo",
  503: "bancoOcupado",
};

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
      // ⚠️ A versão vai em TODOS os pedidos, e é aqui que isso se garante — um
      // cabeçalho posto em cada sítio que chama a API é um cabeçalho que falta
      // no sítio que alguém esquecer. Ausente quando não se consegue ler: ver
      // `versao.ts`.
      headers: { Accept: "application/json", ...cabecalhoDeVersao(), ...opcoes?.headers },
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
    const especie = traduzirEstatuto(resposta.status);

    // ⚠️ **Marca-se, E atira-se na mesma.** A marca é o que faz o 426 sair da
    // lista e ocupar o ecrã (ver `estado/versao.ts`); a falha continua a subir
    // porque quem chamou tem de saber que este pedido não trouxe nada. Só a
    // marca deixava as consultas eternamente à espera.
    if (especie === "versaoDemasiadoAntiga") marcarVersaoRecusada();

    throw new FalhaDaApi(especie, {
      codigo,
      campo,
      esperarSegundos: segundosDoRetryAfter(resposta.headers.get("Retry-After")),
    });
  }

  return (await resposta.json()) as T;
}

/**
 * Quantas vezes se repete um pedido que NÃO é a um banco. Duas, e desiste.
 *
 * ⚠️ Não vale para o caminho dos bancos, que a sobrepõe com uma regra mais
 * apertada — ver `api/ofertas.ts`.
 */
export const tentativasNaRaiz = 2;

/**
 * repetirNaRaiz é o `retry` do `QueryClient`.
 *
 * ⚠️ **Uma versão recusada não se repete, e é o que esta função existe para
 * dizer.** O `retry: 2` simples mandava o mesmo `GET /api/v1/bancos` três vezes
 * contra um servidor que já disse que esta app é velha de mais — e a segunda e a
 * terceira recusas são certas antes de saírem. Insistir só atrasa o ecrã que diz
 * à pessoa o que fazer.
 */
export function repetirNaRaiz(tentativa: number, erro: unknown): boolean {
  if (eFalhaDaApi(erro) && erro.especie === "versaoDemasiadoAntiga") return false;
  return tentativa < tentativasNaRaiz;
}

export async function publicar<T>(caminho: string, corpo: unknown): Promise<T> {
  return pedir<T>(caminho, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
}
