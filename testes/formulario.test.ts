import {
  bancosComPeriodosObservados,
  bancosForaDoPrazo,
  camposUsados,
  dataParaIso,
  intervaloDeIdadeMaxima,
  intervaloDePrazo,
  leituraDoIndexante,
  notasDeCampo,
  numeroDeTexto,
  periodosFixosOferecidos,
  racioLtv,
} from "@/dominio/formulario";

import { cgd, montepio, novobanco } from "./ajudas";

describe("o LTV", () => {
  it("é o montante sobre o valor do imóvel, em percentagem", () => {
    expect(racioLtv(250_000, 200_000)).toBeCloseTo(80, 10);
  });

  // ⚠️ O teste que interessa. Um formulário por preencher não afirma nada, e
  // mostrar «LTV 0 %» a quem ainda não escreveu o valor do imóvel é dizer-lhe
  // uma coisa falsa no ecrã onde ela está a decidir quanto pedir.
  it("não existe enquanto não houver valor do imóvel", () => {
    expect(racioLtv(null, 200_000)).toBeNull();
    expect(racioLtv(0, 200_000)).toBeNull();
  });

  it("passa dos 100 % em vez de fingir que não passa", () => {
    // O passo 1 é que bloqueia o botão; a leitura mostra o que a pessoa escreveu.
    expect(racioLtv(200_000, 250_000)).toBeCloseTo(125, 10);
  });
});

describe("os períodos fixos", () => {
  it("junta os de todos os bancos e diz quem tem cada um", () => {
    const periodos = periodosFixosOferecidos([cgd, novobanco, montepio]);

    expect(periodos.map((periodo) => periodo.anos)).toEqual([5, 10, 15, 20]);

    const cinco = periodos.find((periodo) => periodo.anos === 5);
    expect(cinco?.todos).toBe(true);

    // ⚠️ 15 é só da CGD e 20 só do Novo Banco. É esta distinção que faz a opção
    // aparecer esbatida em vez de desaparecer — e é a diferença entre a pessoa
    // ver a opção e o que ela custa, ou nunca saber que existia.
    const quinze = periodos.find((periodo) => periodo.anos === 15);
    expect(quinze?.todos).toBe(false);
    expect(quinze?.bancos).toEqual(["cgd"]);
  });

  it("nomeia os bancos cuja lista foi observada e não declarada", () => {
    // ⚠️ `do-html` quer dizer «foi o que se viu da última vez». Um período que
    // não está lá não está provado que não exista.
    expect(bancosComPeriodosObservados([cgd, novobanco]).map((banco) => banco.id)).toEqual(["cgd"]);
  });
});

describe("o indexante", () => {
  it("só oferece os tenores que algum banco deixa escolher", () => {
    expect(leituraDoIndexante([novobanco]).escolhiveis).toEqual(["3m", "6m", "12m"]);
  });

  // ⚠️ O contrato di-lo por palavras: `euribor_opcoes` vazio **não é «não sei»**,
  // é «o banco impõe o seu e ignora a escolha». Tratar o vazio como desconhecido
  // levava a app a oferecer três tenores e a mostrar depois preços de outro.
  it("não oferece nada quando todos impõem o seu", () => {
    const leitura = leituraDoIndexante([cgd, montepio]);
    expect(leitura.escolhiveis).toEqual([]);
    expect(leitura.impostos.map((imposto) => imposto.indexante)).toEqual(["6m", "12m"]);
  });

  it("nomeia quem impõe mesmo quando há escolha para os outros", () => {
    const leitura = leituraDoIndexante([cgd, novobanco]);
    expect(leitura.escolhiveis).toEqual(["3m", "6m", "12m"]);
    expect(leitura.impostos.map((imposto) => imposto.nome)).toEqual(["CGD"]);
  });
});

describe("os campos que os bancos usam", () => {
  // ⚠️ A medição que mudou o desenho do passo 2: dos bancos a sério, só um
  // declara usar o rendimento. Perguntá-lo a quem não o escolheu é recolher o
  // ordenado de uma pessoa para não fazer nada com ele.
  it("o rendimento só entra quando algum banco escolhido o usa", () => {
    expect(camposUsados([cgd, montepio]).has("rendimento_mensal")).toBe(false);
    expect(camposUsados([cgd, novobanco]).has("rendimento_mensal")).toBe(true);
  });

  it("traz as notas do banco em vez de uma explicação nossa", () => {
    const notas = notasDeCampo([cgd, novobanco], "data_nascimento");
    expect(notas).toHaveLength(2);
    expect(notas[0]).toMatchObject({ banco: "CGD", usa: false });
    expect(notas[0].nota).toMatch(/só entra no prazo máximo/);
  });
});

describe("o prazo e a idade", () => {
  it("abre o intervalo mais largo dos bancos escolhidos", () => {
    expect(intervaloDePrazo([cgd, montepio])).toEqual({ min: 5, max: 40 });
  });

  // ⚠️ Nota e não bloqueio: quem escolhe 40 anos com um banco que só vai aos 35
  // vê quem fica de fora, e continua a poder escolher 40.
  it("nomeia quem fica de fora com o prazo escolhido", () => {
    expect(bancosForaDoPrazo([cgd, montepio], 40).map((banco) => banco.id)).toEqual(["montepio"]);
    expect(bancosForaDoPrazo([cgd, montepio], 30)).toEqual([]);
  });

  // ⚠️ As idades da caixa saem dos dados. Estavam «75-83» escritas à mão no
  // ECRAS.md, e um número escrito à mão numa frase fica errado quando entra o
  // sexto banco.
  it("dá o intervalo de idades-limite dos bancos escolhidos", () => {
    expect(intervaloDeIdadeMaxima([cgd, montepio])).toEqual({ min: 70, max: 76 });
  });
});

describe("a leitura do que a pessoa escreve", () => {
  it("aceita os milhares à portuguesa", () => {
    expect(numeroDeTexto("250 000")).toBe(250_000);
    expect(numeroDeTexto("250.000")).toBe(250_000);
    expect(numeroDeTexto("2 200,50")).toBe(2200.5);
  });

  it("um campo vazio não é um imóvel que vale zero", () => {
    expect(numeroDeTexto("")).toBeNull();
    expect(numeroDeTexto("abc")).toBeNull();
  });

  it("converte a data para o que o contrato pede", () => {
    expect(dataParaIso("12/04/1990")).toBe("1990-04-12");
  });

  // ⚠️ O teste que justifica a validação por ida e volta: «31/02» passa em
  // qualquer verificação de «dia entre 1 e 31», e o Date normaliza-a para 3 de
  // Março sem se queixar.
  it("recusa uma data que não existe", () => {
    expect(dataParaIso("31/02/1990")).toBeNull();
    expect(dataParaIso("12-04-1990")).toBeNull();
    expect(dataParaIso("")).toBeNull();
  });
});
