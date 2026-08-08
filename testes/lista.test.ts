import type { Oferta } from "@/api/tipos";
import { ordenarLinhas, podeMarcarAsMelhores } from "@/dominio/lista";
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

function naoChegou(bancoId: string): LinhaDaLista {
  return {
    estado: "nao-chegou",
    bancoId,
    bancoNome: bancoId.toUpperCase(),
    especie: "semRede",
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
