// As regras puras do formulário adaptativo.
//
// ⚠️ **Puro de propósito, e fora dos componentes.** Nada aqui importa React,
// nem o cliente HTTP, nem a loja. É o que permite testar o que o formulário
// decide sem montar um ecrã — e o que o formulário decide (que períodos fixos
// mostrar, que indexante é escolhível, que campos sequer perguntar) é a parte
// que se parte em silêncio quando um banco muda o que aceita.
//
// ⚠️ **Isto não calcula crédito.** Não há aqui prestação, TAEG nem spread: os
// números são dos bancos e vêm da comparação (`APP.md` §6). O que há é
// aritmética sobre o que o pedido diz e sobre o que `GET /api/v1/bancos`
// publica.

import type { Banco, Indexante } from "@/api/tipos";

/** A ordem por que os tenores se mostram. Não é alfabética nem é a da resposta. */
const ordemDosTenores: Indexante[] = ["3m", "6m", "12m"];

function eIndexante(valor: string): valor is Indexante {
  return (ordemDosTenores as string[]).includes(valor);
}

/**
 * racioLtv devolve o LTV em percentagem, ou `null` quando ainda não dá para o
 * calcular.
 *
 * ⚠️ `null` e não `0`: um LTV de zero é uma afirmação — «não está a financiar
 * nada» — e um formulário por preencher não afirma nada. Mostrar `0 %` a quem
 * ainda não escreveu o valor do imóvel é dizer-lhe uma coisa falsa.
 */
export function racioLtv(valorImovel: number | null, montante: number | null): number | null {
  if (valorImovel === null || montante === null) return null;
  if (!Number.isFinite(valorImovel) || !Number.isFinite(montante)) return null;
  if (valorImovel <= 0 || montante < 0) return null;
  return (montante / valorImovel) * 100;
}

export type OpcaoDePeriodo = {
  anos: number;
  /** Os bancos escolhidos que oferecem este período. */
  bancos: string[];
  /** Verdadeiro só quando **todos** os bancos escolhidos o oferecem. */
  todos: boolean;
};

/**
 * periodosFixosOferecidos junta os períodos de todos os bancos escolhidos e diz,
 * de cada um, quem o oferece.
 *
 * ⚠️ A união e não a intersecção. O `ECRAS.md` §1.3 desenha os períodos que nem
 * todos têm a cinzento, e não escondidos: escondê-los fazia desaparecer opções
 * reais só por um dos bancos escolhidos não as ter, e a pessoa nunca saberia
 * que existiam. A cinzento, ela vê a opção e vê o preço que paga por ela — um
 * banco a menos na comparação.
 */
export function periodosFixosOferecidos(bancos: Banco[]): OpcaoDePeriodo[] {
  const porAnos = new Map<number, string[]>();
  for (const banco of bancos) {
    for (const anos of banco.periodos_fixos) {
      const jaTem = porAnos.get(anos) ?? [];
      if (!jaTem.includes(banco.id)) jaTem.push(banco.id);
      porAnos.set(anos, jaTem);
    }
  }

  return [...porAnos.entries()]
    .map(([anos, ids]) => ({ anos, bancos: ids, todos: ids.length === bancos.length }))
    .sort((a, b) => a.anos - b.anos);
}

/**
 * bancosComPeriodosObservados devolve os bancos cuja lista de períodos fixos foi
 * **observada** em vez de declarada.
 *
 * ⚠️ O `periodos_fixos_modo` do contrato não é decorativo. `lista` é uma lista
 * que nós fixámos; `da-api` e `do-html` são o que se viu da última vez que se
 * foi lá. Nesses dois, uma lista sem um período não prova que o banco não o
 * tenha — prova que não apareceu. A app diz isso em vez de apresentar o
 * observado como se fosse a oferta completa do banco.
 */
export function bancosComPeriodosObservados(bancos: Banco[]): Banco[] {
  return bancos.filter((banco) => banco.periodos_fixos_modo !== "lista");
}

export type LeituraDoIndexante = {
  /** Os tenores que a escolha da pessoa alcança, pela ordem de sempre. */
  escolhiveis: Indexante[];
  /** Os bancos que impõem o seu e ignoram a escolha. */
  impostos: { id: string; nome: string; indexante: string }[];
};

/**
 * leituraDoIndexante diz o que a escolha de indexante alcança e o que não
 * alcança.
 *
 * ⚠️ `euribor_opcoes` vazio **não é «não sei»** — o contrato di-lo por
 * palavras: é «o banco impõe o seu e ignora a escolha». Tratar o vazio como
 * desconhecido levava a app a oferecer três tenores e a mostrar depois preços
 * de outro, sem nunca o explicar.
 */
export function leituraDoIndexante(bancos: Banco[]): LeituraDoIndexante {
  const vistos = new Set<Indexante>();
  const impostos: LeituraDoIndexante["impostos"] = [];

  for (const banco of bancos) {
    for (const opcao of banco.euribor_opcoes) {
      if (eIndexante(opcao)) vistos.add(opcao);
    }
    if (banco.euribor_imposto !== null && banco.euribor_imposto !== "") {
      impostos.push({ id: banco.id, nome: banco.nome, indexante: banco.euribor_imposto });
    }
  }

  return {
    escolhiveis: ordemDosTenores.filter((tenor) => vistos.has(tenor)),
    impostos,
  };
}

/**
 * camposUsados devolve as chaves canónicas que ao menos um dos bancos escolhidos
 * usa de facto.
 *
 * ⚠️ É isto que faz o formulário encolher quando se desmarcam bancos, e a
 * medição diz que não é hipotético: dos cinco bancos, o **rendimento mensal** é
 * usado por **um** — e a nota do próprio Novo Banco diz que «não mexe no preço:
 * só entra na recomendação e no rácio de esforço». Perguntar o ordenado a quem
 * compara CGD com Montepio é perguntar por nada, e é o que faz uma app parecer
 * um funil de recolha.
 *
 * ⚠️ **Mas `usa: false` não quer dizer «irrelevante».** Quer dizer «o simulador
 * daquele banco não pergunta isto». A data de nascimento é o caso: a CGD não a
 * pergunta e ela entra à mesma no prazo máximo, que a CGD limita a terminar aos
 * 70 anos. Campos assim continuam a perguntar-se, e o que a app faz com o
 * `usa: false` é mostrar a **nota** do banco ao lado — ver `notasDeCampo`.
 */
export function camposUsados(bancos: Banco[]): Set<string> {
  const usados = new Set<string>();
  for (const banco of bancos) {
    for (const input of banco.inputs) {
      if (input.usa) usados.add(input.chave);
    }
  }
  return usados;
}

export type NotaDeCampo = { banco: string; usa: boolean; nota: string };

/**
 * notasDeCampo devolve o que os bancos escolhidos declaram sobre um campo.
 *
 * ⚠️ O `nota` do contrato existe para isto e não estava a ser usado por
 * ninguém: «O simulador da CGD não pergunta a idade. Ela só entra no prazo
 * máximo, que a CGD limita a terminar aos 70 anos» é a resposta exacta à
 * pergunta que a pessoa faz quando lhe pedem a data de nascimento. Deixá-la no
 * JSON e escrever uma frase nossa por cima era ter duas versões da mesma
 * explicação, e só uma a acompanhar o banco quando ele mudar.
 */
export function notasDeCampo(bancos: Banco[], chave: string): NotaDeCampo[] {
  const notas: NotaDeCampo[] = [];
  for (const banco of bancos) {
    for (const input of banco.inputs) {
      if (input.chave === chave && input.nota !== undefined && input.nota !== "") {
        notas.push({ banco: banco.nome, usa: input.usa, nota: input.nota });
      }
    }
  }
  return notas;
}

export type IntervaloDePrazo = { min: number; max: number };

/**
 * intervaloDePrazo devolve o intervalo mais largo entre os bancos escolhidos.
 *
 * ⚠️ O mais largo, e não a intersecção — pela mesma razão da união dos períodos.
 * Quem escolhe 40 anos com um banco que só vai aos 35 vê a nota de
 * `bancosForaDoPrazo`; não fica sem poder escolher 40.
 */
export function intervaloDePrazo(bancos: Banco[]): IntervaloDePrazo | null {
  if (bancos.length === 0) return null;
  return {
    min: Math.min(...bancos.map((banco) => banco.prazo_min)),
    max: Math.max(...bancos.map((banco) => banco.prazo_max)),
  };
}

/** Os bancos escolhidos que não aceitam este prazo. Alimenta uma nota, não um bloqueio. */
export function bancosForaDoPrazo(bancos: Banco[], anos: number): Banco[] {
  return bancos.filter((banco) => anos < banco.prazo_min || anos > banco.prazo_max);
}

/**
 * intervaloDeIdadeMaxima devolve as idades-limite mais baixa e mais alta entre os
 * bancos escolhidos, para a caixa que explica porque é que a app pede a data de
 * nascimento.
 *
 * ⚠️ **Devolve o intervalo e não um juízo por banco, de propósito.** Seria fácil
 * calcular aqui a idade no fim do crédito e marcar já os bancos que o recusam —
 * e estaria errado: a `KAN-34` está aberta precisamente porque o
 * `idade_maxima_fim` é um número só e na CGD depende da finalidade. Quem decide
 * que um banco não tem oferta é o servidor, que devolve a razão em português
 * (`ECRAS.md` §3). A app explica a regra; não a aplica.
 */
export function intervaloDeIdadeMaxima(bancos: Banco[]): { min: number; max: number } | null {
  if (bancos.length === 0) return null;
  const idades = bancos.map((banco) => banco.idade_maxima_fim);
  return { min: Math.min(...idades), max: Math.max(...idades) };
}

/**
 * numeroDeTexto lê um número escrito à portuguesa.
 *
 * Aceita o espaço e o ponto como separador de milhares e a vírgula como
 * decimal — «250 000», «250.000», «250000,50». ⚠️ Devolve `null` para o que não
 * for número, e `null` não é `0`: um campo vazio não é um imóvel que vale zero.
 */
export function numeroDeTexto(texto: string): number | null {
  const limpo = texto
    .replace(/\s| /g, "")
    .replace(/€/g, "")
    .replace(/\./g, "")
    .replace(/,/g, ".");
  if (limpo === "") return null;
  const numero = Number(limpo);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * dataParaIso converte «12/04/1990» na data ISO que o contrato pede.
 *
 * ⚠️ Valida por ida e volta em vez de por intervalos: «31/02/1990» passa em
 * qualquer teste de «dia entre 1 e 31» e não é uma data. O `Date` normaliza-a
 * para 3 de Março, e é a comparação com o que se escreveu que a apanha.
 */
export function dataParaIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (partes === null) return null;

  const [, dia, mes, ano] = partes;
  const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, Number(dia)));
  if (
    data.getUTCFullYear() !== Number(ano) ||
    data.getUTCMonth() !== Number(mes) - 1 ||
    data.getUTCDate() !== Number(dia)
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
}
