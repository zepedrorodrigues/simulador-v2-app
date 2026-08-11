// A ordem das linhas enquanto a lista se enche, e quando é que a estrela se
// pode afirmar.
//
// ⚠️ **Vive aqui e não no ecrã pela mesma razão que o `melhores` e o `ordenar`:**
// são decisões sobre o que se afirma a quem compara créditos, e uma decisão
// dessas tem de poder falhar num teste sem se montar interface nenhuma.

import type { EspecieDeFalha } from "@/api/cliente";
import type { LinhaDaLista } from "@/estado/lista";

import { ordenar, type Metrica } from "./ofertas";

/**
 * A única espécie de falha que é mesmo **sobre aquele banco**.
 *
 * ⚠️ **O `503 banco_ocupado` conta pedidos NOSSOS em voo contra um banco** — é
 * por banco por construção, e dois bancos podem estar em estados diferentes ao
 * mesmo tempo. Todas as outras acontecem **uma vez** e valem para os cinco: não
 * há rede, o serviço não responde, o tecto por IP fechou, o pedido foi recusado,
 * a versão é velha.
 *
 * ⚠️ **É esta a distinção que decide se uma falha se mostra uma vez ou cinco**, e
 * mostrá-la cinco não é redundância inofensiva: põe o nome de um banco por cima
 * de uma coisa que não é dele. Foi o defeito do `426` a 2026-08-11 — cinco
 * cartões, um por banco, todos a dizer que a versão da app é velha.
 */
const especiesPorBanco: readonly EspecieDeFalha[] = ["bancoOcupado"];

export function eSobreOBanco(especie: EspecieDeFalha): boolean {
  return especiesPorBanco.includes(especie);
}

/**
 * Se insistir AGORA pode dar outro resultado.
 *
 * ⚠️ **É o que decide se o ecrã leva botão**, e a regra é a do `Estados.tsx`: um
 * «tentar de novo» que não pode funcionar é um botão que promete uma coisa que
 * não acontece. Duas espécies estão nesse caso, por razões diferentes:
 *
 * - `tectoExcedido` — o servidor mandou esperar a **janela inteira** e diz-lo no
 *   `Retry-After`. Ele não devolve o que falta dela de propósito, porque «dizer
 *   exactamente quando reabre convida a bater à porta ao segundo». Um botão aqui
 *   é bater à porta ao segundo, com o dedo de outra pessoa;
 * - `versaoDemasiadoAntiga` — a acção está na loja, fora desta app.
 *
 * ⚠️ **O `pedidoInvalido` leva botão na mesma, e é discutível**: repetir o mesmo
 * pedido dá o mesmo `400`. Leva-o porque a acção real — corrigir o campo — está a
 * dois toques daqui, e um ecrã sem saída nenhuma é pior do que um botão que
 * devolve a pessoa ao princípio.
 */
export function podeRepetir(especie: EspecieDeFalha): boolean {
  return especie !== "tectoExcedido" && especie !== "versaoDemasiadoAntiga";
}

/**
 * ordenarLinhas põe as linhas na ordem em que se lêem.
 *
 * Três grupos, e a ordem entre eles não é estética:
 *
 * 1. **as que têm preço**, ordenadas pela métrica escolhida — é o que a pessoa
 *    veio ver;
 * 2. **as que ainda esperam** — dizem que a lista não acabou, e é isso que
 *    impede alguém de decidir sobre metade dos bancos por pensar que são todos;
 * 3. **as que falharam**, sejam ofertas em falha (o banco recusou ou não
 *    respondeu) ou pedidos que não chegaram lá.
 *
 * ⚠️ **Nenhuma linha desaparece**, e é regra do `ECRAS.md` §3: «um banco que
 * desaparece parece um esquecimento; um banco que explica porque não tem oferta
 * é informação útil».
 *
 * ⚠️ **E as que falharam não se intercalam entre as que têm preço**, porque não
 * têm por onde ser ordenadas: intercalá-las obrigava a inventar-lhes um valor, e
 * o valor inventado decidia onde apareciam.
 *
 * ⚠️ **Dentro de cada grupo a ordem é a de entrada — a da API**, e não a de
 * chegada. Sem isto, as linhas por responder saltavam de sítio a cada resposta
 * que chegasse, e a lista mexia-se debaixo do dedo de quem estivesse a lê-la.
 */
export function ordenarLinhas(linhas: LinhaDaLista[], metrica: Metrica): LinhaDaLista[] {
  const servidas = linhas.flatMap((linha) => (linha.estado === "servida" ? [linha] : []));
  const porOferta = new Map(servidas.map((linha) => [linha.bancoId, linha]));

  const comPreco = ordenar(
    servidas.map((linha) => linha.oferta),
    metrica,
  );

  const ordenadas: LinhaDaLista[] = [];
  const emFalha: LinhaDaLista[] = [];
  for (const oferta of comPreco) {
    const linha = porOferta.get(oferta.banco_id);
    if (linha === undefined) continue;
    (oferta.sucesso ? ordenadas : emFalha).push(linha);
  }

  return [
    ...ordenadas,
    ...linhas.filter((linha) => linha.estado === "a-esperar"),
    ...emFalha,
    ...linhas.filter((linha) => linha.estado === "nao-chegou"),
  ];
}

/**
 * podeMarcarAsMelhores diz se a estrela já pode ser afirmada.
 *
 * ⚠️ **Falso enquanto faltar um banco por assentar, e é uma afirmação e não um
 * detalhe de apresentação.** A estrela diz «esta é a melhor», e a melhor de duas
 * de cinco desmente-se quando chega a terceira — a pessoa lê-a, decide, e o ecrã
 * muda-lhe a resposta debaixo dos olhos.
 *
 * ⚠️ É o mesmo argumento que o `melhores` já fazia para uma oferta só, aprendido
 * a correr contra o servidor a sério (2026-07-29): a CGD sozinha apanhava as
 * **cinco** estrelas, cada uma verdadeira e o conjunto falso. Uma estrela só diz
 * alguma coisa contra outra oferta — e, agora, contra todas as que ainda vêm a
 * caminho.
 */
export function podeMarcarAsMelhores(linhas: LinhaDaLista[]): boolean {
  return !linhas.some((linha) => linha.estado === "a-esperar");
}

/**
 * O que a lista é, no seu conjunto — e não linha a linha (A6 do `APP.md`).
 *
 * ⚠️ **Existe porque cinco linhas a dizer o mesmo não são cinco informações.**
 * Quando a mesma coisa aconteceu a todos, e essa coisa **não é sobre nenhum
 * banco**, a lista deixa de ser uma lista: é um facto único, repetido com o nome
 * de cinco bancos por cima. Mostra-se uma vez.
 */
export type ResumoDaLista =
  /** Há o que mostrar linha a linha. É o caso comum, e o misto cai aqui. */
  | { tipo: "lista" }
  /** Nada chegou, e o que impediu foi o mesmo para todos e não é de banco nenhum. */
  | { tipo: "falha-global"; especie: EspecieDeFalha }
  /** Todos responderam, e nenhum tem oferta para este pedido. */
  | { tipo: "nenhuma-oferta" };

/**
 * resumoDaLista decide entre mostrar a lista, um ecrã de falha, ou o vazio.
 *
 * ⚠️ **Uma linha à espera manda sempre mostrar a lista.** Um veredicto sobre o
 * conjunto antes de o conjunto estar fechado é a mesma falha da estrela dada a 2
 * de 5 — e aqui seria pior, porque «não há ofertas» faz a pessoa sair do ecrã.
 *
 * ⚠️ **E o misto fica na lista, de propósito.** Se um banco recusou e outro não
 * respondeu, aconteceram duas coisas diferentes; resumi-las numa frase obrigava
 * a escolher qual das duas contar. Cada cartão diz o que sabe.
 *
 * ⚠️ **`nenhuma-oferta` afirma sobre o PEDIDO, e por isso exige que todos tenham
 * respondido.** «Nenhum dos bancos tem oferta para este pedido» é uma conclusão
 * sobre o que se pediu; com um banco que nunca respondeu, o que se sabe é que não
 * se sabe. Era o que a lista dizia até aqui, sem essa condição.
 */
export function resumoDaLista(linhas: LinhaDaLista[]): ResumoDaLista {
  if (linhas.length === 0) return { tipo: "lista" };
  if (linhas.some((linha) => linha.estado === "a-esperar")) return { tipo: "lista" };

  const naoChegaram = linhas.flatMap((linha) => (linha.estado === "nao-chegou" ? [linha] : []));

  if (naoChegaram.length === linhas.length) {
    const [primeira] = naoChegaram;
    const iguais = naoChegaram.every((linha) => linha.especie === primeira.especie);
    if (iguais && !eSobreOBanco(primeira.especie)) {
      return { tipo: "falha-global", especie: primeira.especie };
    }
    return { tipo: "lista" };
  }

  const servidas = linhas.flatMap((linha) => (linha.estado === "servida" ? [linha] : []));
  if (servidas.length === linhas.length && servidas.every((linha) => !linha.oferta.sucesso)) {
    return { tipo: "nenhuma-oferta" };
  }

  return { tipo: "lista" };
}
