import type { EspecieDeFalha } from "@/api/cliente";
import type { Oferta } from "@/api/tipos";
import {
  ordenarLinhas,
  podeMarcarAsMelhores,
  podeRepetir,
  resumoDaLista,
} from "@/dominio/lista";
import type { LinhaDaLista } from "@/estado/lista";

function servida(bancoId: string, taeg?: number, sucesso = true): LinhaDaLista {
  const oferta: Oferta = {
    banco_id: bancoId,
    banco_nome: bancoId.toUpperCase(),
    sucesso,
    ...(sucesso
      ? { taeg, capturado_em: "2026-08-07T10:00:00Z" }
      : { erro: { codigo: "banco_indisponivel", mensagem: `O ${bancoId} não respondeu.` } }),
  };
  return { estado: "servida", bancoId, bancoNome: bancoId.toUpperCase(), oferta };
}

function aEsperar(bancoId: string): LinhaDaLista {
  return { estado: "a-esperar", bancoId, bancoNome: bancoId.toUpperCase() };
}

function naoChegou(bancoId: string, especie: EspecieDeFalha = "semRede"): LinhaDaLista {
  return {
    estado: "nao-chegou",
    bancoId,
    bancoNome: bancoId.toUpperCase(),
    especie,
  };
}

const estados = (linhas: LinhaDaLista[]) => linhas.map((linha) => `${linha.bancoId}:${linha.estado}`);

describe("a ordem das linhas enquanto a lista se enche", () => {
  it("põe as que têm preço primeiro, ordenadas, e nunca perde nenhuma", () => {
    const linhas = [
      aEsperar("montepio"),
      servida("cgd", 4.2),
      naoChegou("santander"),
      servida("novobanco", 3.1),
      servida("bancoctt", undefined, false),
    ];

    expect(estados(ordenarLinhas(linhas, "taeg"))).toEqual([
      "novobanco:servida",
      "cgd:servida",
      "montepio:a-esperar",
      "bancoctt:servida",
      "santander:nao-chegou",
    ]);
  });

  // ⚠️ **Nenhuma linha desaparece** (`ECRAS.md` §3): «um banco que desaparece
  // parece um esquecimento; um banco que explica porque não tem oferta é
  // informação útil». Vale para quem falhou e para quem ainda não respondeu.
  it("devolve tantas linhas quantas recebeu", () => {
    const linhas = [aEsperar("a"), servida("b", 3), naoChegou("c"), servida("d", undefined, false)];
    expect(ordenarLinhas(linhas, "taeg")).toHaveLength(linhas.length);
  });

  // ⚠️ A ordem dentro de cada grupo é a de ENTRADA — a da API —, e não a de
  // chegada. Sem isto as linhas por responder saltavam de sítio a cada resposta
  // que chegasse, e a lista mexia-se debaixo do dedo de quem estivesse a lê-la.
  it("mantém as que esperam pela ordem da API", () => {
    const linhas = [aEsperar("cgd"), aEsperar("novobanco"), aEsperar("montepio")];
    expect(estados(ordenarLinhas(linhas, "taeg"))).toEqual([
      "cgd:a-esperar",
      "novobanco:a-esperar",
      "montepio:a-esperar",
    ]);
  });

  // ⚠️ Uma oferta a que falte a métrica vai para o fim das que têm preço, e não
  // para o princípio: é a regra do `ordenar`, e a lista de linhas herda-a.
  it("põe uma oferta sem a métrica depois das que a têm", () => {
    const linhas = [servida("cgd", undefined), servida("novobanco", 3.1)];
    expect(estados(ordenarLinhas(linhas, "taeg"))).toEqual(["novobanco:servida", "cgd:servida"]);
  });
});

describe("quando é que a estrela se pode afirmar", () => {
  // ⚠️ **É a afirmação que este ficheiro existe para guardar.** A estrela diz
  // «esta é a melhor», e a melhor de duas de cinco desmente-se quando chega a
  // terceira: a pessoa lê, decide, e o ecrã muda-lhe a resposta debaixo dos
  // olhos. Revertendo — marcar sempre —, este teste falha a dizer que se marcou
  // com bancos por responder.
  it("não se marca ninguém com um banco ainda por responder", () => {
    expect(podeMarcarAsMelhores([servida("cgd", 3.1), servida("novobanco", 4.2)])).toBe(true);
    expect(
      podeMarcarAsMelhores([servida("cgd", 3.1), servida("novobanco", 4.2), aEsperar("montepio")]),
    ).toBe(false);
  });

  // ⚠️ Um banco que não chegou já assentou: não vai mudar a comparação, e segurar
  // as estrelas por causa dele era escondê-las para sempre sempre que houvesse
  // um banco em baixo.
  it("um banco que falhou não segura as estrelas", () => {
    expect(
      podeMarcarAsMelhores([servida("cgd", 3.1), naoChegou("montepio"), servida("x", 4, false)]),
    ).toBe(true);
  });
});

// A A6 do `APP.md`: o que a lista é no seu conjunto, e não linha a linha.
//
// ⚠️ **O que se mede aqui é quantas vezes um facto se afirma.** Cinco linhas a
// dizer «não há rede», cada uma com o nome de um banco por cima, não são cinco
// informações — são uma, atribuída a cinco bancos que não têm nada com isso. Foi
// o defeito do 426 a 2026-08-11, e a regra é a mesma.
describe("o que a lista diz no seu conjunto", () => {
  it("uma falha igual em todos, que não é de banco nenhum, é um facto só", () => {
    const linhas = [naoChegou("cgd"), naoChegou("montepio"), naoChegou("novobanco")];
    expect(resumoDaLista(linhas)).toEqual({ tipo: "falha-global", especie: "semRede" });
  });

  // ⚠️ **O `bancoOcupado` é a excepção, e é por construção:** o 503 conta pedidos
  // NOSSOS em voo contra AQUELE banco. Colapsá-lo num ecrã dizia que o serviço
  // está indisponível quando o que há é fila em cada um deles.
  it("o banco ocupado fica linha a linha, mesmo em todos", () => {
    const linhas = [naoChegou("cgd", "bancoOcupado"), naoChegou("montepio", "bancoOcupado")];
    expect(resumoDaLista(linhas)).toEqual({ tipo: "lista" });
  });

  // ⚠️ Duas coisas diferentes não se resumem numa: escolher qual contar era
  // apagar a outra.
  it("espécies diferentes ficam linha a linha", () => {
    const linhas = [naoChegou("cgd", "semRede"), naoChegou("montepio", "servidorEmBaixo")];
    expect(resumoDaLista(linhas)).toEqual({ tipo: "lista" });
  });

  // ⚠️ **A guarda que mais interessa.** Um veredicto sobre o conjunto antes de o
  // conjunto estar fechado é a falha da estrela dada a 2 de 5 — e pior, porque
  // «não há ofertas» faz a pessoa sair do ecrã enquanto uma resposta vem a
  // caminho.
  it("com um banco por responder não há veredicto nenhum", () => {
    expect(resumoDaLista([naoChegou("cgd"), aEsperar("montepio")])).toEqual({ tipo: "lista" });
    expect(
      resumoDaLista([servida("cgd", undefined, false), aEsperar("montepio")]),
    ).toEqual({ tipo: "lista" });
  });

  // ⚠️ «Nenhum dos bancos tem oferta para este pedido» afirma sobre o PEDIDO, e
  // só se pode dizer quando todos responderam. Um banco que nunca respondeu não
  // sustenta essa conclusão — o que se sabe dele é que não se sabe.
  it("todos responderam e nenhum tem oferta é uma conclusão sobre o pedido", () => {
    const linhas = [servida("cgd", undefined, false), servida("montepio", undefined, false)];
    expect(resumoDaLista(linhas)).toEqual({ tipo: "nenhuma-oferta" });
  });

  it("um banco que não chegou tira essa conclusão da mesa", () => {
    const linhas = [servida("cgd", undefined, false), naoChegou("montepio")];
    expect(resumoDaLista(linhas)).toEqual({ tipo: "lista" });
  });

  it("uma oferta com preço no meio manda mostrar a lista", () => {
    expect(resumoDaLista([servida("cgd", 3.2), naoChegou("montepio")])).toEqual({ tipo: "lista" });
  });
});

// ⚠️ Um «tentar de novo» que não pode funcionar é um botão que promete uma coisa
// que não acontece — a regra está escrita no `Estados.tsx` desde o 426.
describe("quando é que insistir pode dar outro resultado", () => {
  it("sem rede e servidor em baixo passam por si", () => {
    expect(podeRepetir("semRede")).toBe(true);
    expect(podeRepetir("servidorEmBaixo")).toBe(true);
  });

  // ⚠️ O servidor manda esperar a JANELA INTEIRA e não diz o que falta dela, de
  // propósito: «dizer exactamente quando reabre convida a bater à porta ao
  // segundo». Um botão aqui é isso, com o dedo de outra pessoa.
  it("um tecto excedido não leva botão", () => {
    expect(podeRepetir("tectoExcedido")).toBe(false);
  });

  it("uma versão recusada também não — a acção está na loja", () => {
    expect(podeRepetir("versaoDemasiadoAntiga")).toBe(false);
  });
});
