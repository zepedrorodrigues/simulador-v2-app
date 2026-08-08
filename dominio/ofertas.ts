// As regras puras da lista de ofertas: ordenar, marcar a melhor, separar o que
// falhou.
//
// ⚠️ **Nada aqui calcula crédito.** Não há prestação, TAEG nem spread a serem
// produzidos — os números vêm todos da resposta. O que há é ordenação e
// comparação entre números que já existem, que é a parte que o `ECRAS.md` §3
// exige e a parte que se parte em silêncio.

import type { Oferta } from "@/api/tipos";

/** As métricas por que se pode ordenar. Todas «menor é melhor». */
export const metricas = ["taeg", "prestacao_mensal", "tan", "spread", "mtic"] as const;
export type Metrica = (typeof metricas)[number];

function valorDe(oferta: Oferta, metrica: Metrica): number | undefined {
  return oferta[metrica];
}

/** Uma oferta em que o banco mudou alguma coisa face ao pedido. */
export function temAjuste(oferta: Oferta): boolean {
  return oferta.aplicado !== undefined && Object.keys(oferta.aplicado).length > 0;
}

/**
 * separar divide as ofertas em quem tem preço e quem não tem.
 *
 * ⚠️ **Os bancos que falharam ficam, e ficam no fim.** Ficam porque «um banco que
 * desaparece parece um esquecimento; um banco que explica porque não tem oferta
 * é informação útil» (`ECRAS.md` §3). E ficam no fim porque não têm por onde ser
 * ordenados: intercalá-los entre preços obrigava a inventar-lhes um valor, e o
 * valor que se inventasse decidia onde apareciam.
 */
export function separar(ofertas: Oferta[]): { comPreco: Oferta[]; semOferta: Oferta[] } {
  return {
    comPreco: ofertas.filter((oferta) => oferta.sucesso),
    semOferta: ofertas.filter((oferta) => !oferta.sucesso),
  };
}

/**
 * ordenar devolve as ofertas com preço pela métrica pedida, e as que falharam
 * depois.
 *
 * ⚠️ **Uma oferta a que falte a métrica não vai para o princípio nem para o
 * meio: vai para o fim das que têm preço.** `undefined` numa comparação
 * numérica devolve `NaN`, e um `sort` com `NaN` deixa a lista por ordem
 * arbitrária — que é a pior avaria possível aqui, porque parece ordenada. A §4
 * do `ARQUITETURA.md` permite omitir uma TAEG que não se consegue dar, portanto
 * este caso é legítimo e não hipotético.
 */
export function ordenar(ofertas: Oferta[], metrica: Metrica): Oferta[] {
  const { comPreco, semOferta } = separar(ofertas);

  const ordenadas = [...comPreco].sort((a, b) => {
    const va = valorDe(a, metrica);
    const vb = valorDe(b, metrica);
    if (va === undefined && vb === undefined) return 0;
    if (va === undefined) return 1;
    if (vb === undefined) return -1;
    return va - vb;
  });

  return [...ordenadas, ...semOferta];
}

/**
 * melhores diz, de cada métrica, qual o banco que a ganha.
 *
 * ⚠️ **Uma oferta ajustada não ganha estrela nenhuma, e é uma decisão desta app**
 * (2026-07-29). A `KAN-26` está aberta com o problema exacto: «ordenar uma oferta
 * ajustada ao lado das outras compara coisas diferentes sem o dizer». A lista
 * di-lo — a nota do ajuste vive no cartão — mas uma estrela não é uma nota: é a
 * afirmação «esta é a melhor». Dá-la a quem foi simulado a 35 anos quando se
 * pediram 40 é afirmar uma coisa falsa sobre o pedido que a pessoa fez. A oferta
 * continua na lista e continua ordenada; o que não leva é a marca.
 *
 * ⚠️ E um empate não dá estrela a ninguém: duas ofertas iguais na mesma métrica
 * não têm «a melhor», e marcar a primeira era deixar a ordem de chegada decidir.
 *
 * ⚠️ **Com uma só oferta elegível não há estrela nenhuma** — e isto aprendeu-se
 * a correr a app contra o servidor a sério (2026-07-29). Com série de dois
 * bancos e um deles sem o cenário pedido, a CGD ficava sozinha e o cartão dela
 * apanhava as **cinco** estrelas: melhor TAEG, melhor prestação, melhor TAN,
 * melhor spread, melhor MTIC. Cada uma era verdadeira e o conjunto era falso —
 * lia-se como uma recomendação forte quando não havia comparação nenhuma. Uma
 * estrela só diz alguma coisa contra outra oferta.
 */
export function melhores(ofertas: Oferta[]): Partial<Record<Metrica, string>> {
  const elegiveis = ofertas.filter((oferta) => oferta.sucesso && !temAjuste(oferta));
  const marcadas: Partial<Record<Metrica, string>> = {};

  if (elegiveis.length < 2) return marcadas;

  for (const metrica of metricas) {
    const comValor = elegiveis.filter((oferta) => valorDe(oferta, metrica) !== undefined);
    if (comValor.length === 0) continue;

    const minimo = Math.min(...comValor.map((oferta) => valorDe(oferta, metrica) as number));
    const empatadas = comValor.filter((oferta) => valorDe(oferta, metrica) === minimo);
    if (empatadas.length === 1) marcadas[metrica] = empatadas[0].banco_id;
  }

  return marcadas;
}

// ⚠️ **Havia aqui um `temNumerosDerivados` e um `pressupostosEmFalta`**, e saem
// a 2026-08-07 com o campo `pressupostos` do contrato. Decidiam a marca `~` antes
// da TAEG e do MTIC, e a caixa vermelha «é uma falha do nosso servidor» quando um
// deles vinha sem as hipóteses declaradas. Faziam sentido enquanto a TAEG era
// **derivada** por um modelo de encargos nosso sobre uma série varrida com um
// titular neutro; ao vivo é a que o simulador do banco cotou para esta pessoa.
//
// ⚠️ **E ia partir todos os cartões.** O servidor ao vivo nunca preenche
// `pressupostos`, logo `pressupostosEmFalta` era verdadeiro em **toda** a oferta
// com preço: cada cartão da lista traria a caixa vermelha a acusar-nos de um
// defeito que não existe. Não chegou a ver-se num ecrã — a app ainda chamava a
// rota antiga, que dava 404 — e apanhou-se a ler o código.
//
// ⚠️ **O que a app continua obrigada a dizer fica**, em `textos.postura`: uma
// simulação não é uma proposta e não vincula o banco. Mudou o motivo, não o
// dever — é a distinção entre simulação e proposta, e já não entre estimado e
// cotado.

/**
 * idadeDosPrecos devolve o `capturado_em` mais antigo das ofertas com preço.
 *
 * ⚠️ O mais antigo, e não o mais recente. O rodapé faz uma afirmação sobre a
 * lista inteira, e a afirmação verdadeira sobre um conjunto de preços de horas
 * diferentes é a do mais velho — dizer a hora do mais fresco apresentava os
 * outros como sendo dessa hora.
 */
export function idadeDosPrecos(ofertas: Oferta[]): string | null {
  const instantes = ofertas
    .filter((oferta) => oferta.sucesso)
    .map((oferta) => oferta.capturado_em)
    .filter((instante): instante is string => instante !== undefined);

  if (instantes.length === 0) return null;
  return instantes.reduce((maisAntigo, actual) => (actual < maisAntigo ? actual : maisAntigo));
}

/**
 * O que o cartão é obrigado a avisar sobre uma oferta.
 *
 * ⚠️ Vive aqui e não no componente para poder ser afirmado sem renderizar nada —
 * é a mesma razão do `melhores` e do `pressupostosEmFalta`. Devolve decisões,
 * não frases: as frases estão em `textos`, e as `notas` vêm do servidor palavra
 * por palavra.
 */
export type AvisosDoCartao = {
  ajustada: boolean;
  notas: string[];
};

/**
 * avisosDoCartao reúne o que tem de aparecer no cartão desta oferta.
 *
 * ⚠️ **Tinha um terceiro aviso, o `emDuvida`**, ligado ao `fiabilidade` do
 * contrato (KAN-49): a sonda tinha discordado da grelha de onde o preço saía.
 * Sai com o campo, a 2026-08-07 — ao vivo não há grelha entre a resposta do
 * banco e o que se serve, logo não há terceira coisa sobre que ter uma opinião.
 *
 * ⚠️ **A regra que ele carregava fica**, e vale para o que vier: `confirmada` e
 * `por_confirmar` mostravam-se com silêncio, porque uma etiqueta de «confirmada»
 * em toda a gente é ruído com aspecto de informação e treina quem lê a saltar a
 * única que importa (`ECRAS.md` §3).
 *
 * ⚠️ E as `notas` entram sempre que existem, e não só quando há ajuste. Até
 * 2026-08-05 pendiam do ajuste no cartão, e uma nota sem ajuste não chegava lá.
 * O detalhe mostrava-a; o cartão, que é o que quase toda a gente lê, não.
 */
export function avisosDoCartao(oferta: Oferta): AvisosDoCartao {
  return {
    ajustada: temAjuste(oferta),
    notas: oferta.notas ?? [],
  };
}

/** deveAvisar diz se há alguma coisa para mostrar. */
export function deveAvisar(a: AvisosDoCartao): boolean {
  return a.ajustada || a.notas.length > 0;
}
