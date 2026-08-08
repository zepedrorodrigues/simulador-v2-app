// A ordem das linhas enquanto a lista se enche, e quando é que a estrela se
// pode afirmar.
//
// ⚠️ **Vive aqui e não no ecrã pela mesma razão que o `melhores` e o `ordenar`:**
// são decisões sobre o que se afirma a quem compara créditos, e uma decisão
// dessas tem de poder falhar num teste sem se montar interface nenhuma.

import type { LinhaDaLista } from "@/estado/lista";

import { ordenar, type Metrica } from "./ofertas";

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
