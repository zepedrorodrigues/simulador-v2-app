// O tecto do fan-out: quantos pedidos nossos saem ao mesmo tempo.
//
// ⚠️ **Existe porque o fan-out vive aqui** (`ARQUITETURA.md` §7.4, D2). Cada
// banco escolhido é um `POST /api/v1/ofertas/{banco}`, e cada um desses vira 1 a
// 4 pedidos ao simulador público do banco — 1,00 no Banco CTT, 2,03 no Montepio,
// 4,00 no Santander, medido. Uma comparação a cinco bancos são ~10 pedidos a
// terceiros, com origem aparente do servidor. Disparar os cinco de uma vez põe
// esse pico todo no mesmo instante.
//
// ⚠️ **O servidor tem o seu tecto e não substitui este.** A `lotacao` dele conta
// pedidos em voo contra o MESMO banco (2 vagas) e protege cada banco de nós; esta
// fila conta pedidos deste cliente contra bancos DIFERENTES, e é a única coisa
// que decide quantos saem juntos. São tectos sobre eixos diferentes.

/**
 * criarFila devolve uma função que corre tarefas com um tecto de simultâneas.
 *
 * ⚠️ **Pura e sem React de propósito.** É o que permite afirmá-la sem montar ecrã
 * nenhum e sem servidor: um teste conta quantas estiveram em voo ao mesmo tempo,
 * e a reversão — chamar a tarefa directamente — falha a nomear esse número.
 *
 * ⚠️ Uma tarefa que rejeita **liberta a vaga na mesma**. Sem isso, um banco em
 * baixo consumia uma das três para sempre e a lista deixava de encher.
 */
export function criarFila(vagas: number): <T>(tarefa: () => Promise<T>) => Promise<T> {
  if (vagas < 1) throw new Error("uma fila com menos de uma vaga não deixa passar nada");

  let emVoo = 0;
  const espera: (() => void)[] = [];

  function sair() {
    emVoo -= 1;
    // ⚠️ A ordem é a de chegada, e não é indiferente: os bancos entram pela
    // ordem que a API os serve, e uma pilha punha o último a ser pedido
    // primeiro. A lista enche-se pela ordem em que as respostas chegam, mas
    // quem parte primeiro é quem foi pedido primeiro.
    const seguinte = espera.shift();
    if (seguinte !== undefined) seguinte();
  }

  return async function comVaga<T>(tarefa: () => Promise<T>): Promise<T> {
    if (emVoo >= vagas) {
      await new Promise<void>((libertar) => espera.push(libertar));
    }
    emVoo += 1;
    try {
      return await tarefa();
    } finally {
      sair();
    }
  };
}

/**
 * As vagas do fan-out.
 *
 * ⚠️ **Três, e o número é escolhido — não medido.** Diz-se qual das duas coisas
 * é, porque a casa não escreve números que não mediu como se os tivesse medido.
 *
 * O que **está** medido é a latência por banco (2026-08-06 às 17h13, 25
 * simulações frias, hora de expediente): Novo Banco 460 ms de mediana, Montepio
 * 2,01 s com **máximo de 8,4 s**. Com cinco bancos, três em voo são dois lotes e
 * o pior caso fica ~11 s; disparar os cinco fecharia em ~8,4 s. Compram-se 2,6 s
 * ao preço de nunca haver mais de três pedidos nossos em simultâneo — e é a
 * mesma troca, no mesmo sentido, que o servidor já fez ao escolher 2 vagas por
 * banco em vez de 4.
 *
 * ⚠️ **Subir isto não se faz procurando onde um banco parte.** Isso é um teste de
 * carga contra o simulador público de um terceiro, e o resultado que produz é
 * exactamente o que não se quer usar.
 */
export const filaDosBancos = criarFila(3);
