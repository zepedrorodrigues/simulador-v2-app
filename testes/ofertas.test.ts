import type { Oferta } from "@/api/tipos";
import {
  idadeDosPrecos,
  melhores,
  ordenar,
  pressupostosEmFalta,
  separar,
  temAjuste,
} from "@/dominio/ofertas";

function oferta(retoques: Partial<Oferta> & Pick<Oferta, "banco_id">): Oferta {
  return {
    banco_nome: retoques.banco_id.toUpperCase(),
    sucesso: true,
    taeg: 3.61,
    tan: 3.25,
    spread: 0.9,
    prestacao_mensal: 870.42,
    mtic: 313_351.2,
    pressupostos: ["Derivada dos encargos medidos, não cotada."],
    capturado_em: "2026-07-29T05:00:00Z",
    ...retoques,
  };
}

describe("separar quem tem preço de quem não tem", () => {
  it("os bancos que falharam ficam na lista", () => {
    const lista = [
      oferta({ banco_id: "cgd" }),
      oferta({
        banco_id: "bancoctt",
        sucesso: false,
        erro: { codigo: "prazo_impossivel", mensagem: "O crédito terminaria aos 78 anos." },
      }),
    ];

    // ⚠️ Um banco que desaparece parece um esquecimento; um banco que explica
    // porque não tem oferta é informação útil.
    expect(separar(lista).semOferta.map((o) => o.banco_id)).toEqual(["bancoctt"]);
    expect(separar(lista).comPreco).toHaveLength(1);
  });
});

describe("a ordenação", () => {
  const cgd = oferta({ banco_id: "cgd", taeg: 3.74, prestacao_mensal: 891.1 });
  const novobanco = oferta({ banco_id: "novobanco", taeg: 3.61, prestacao_mensal: 870.42 });
  const montepio = oferta({ banco_id: "montepio", taeg: 3.68, prestacao_mensal: 880.0 });

  it("põe a TAEG mais baixa à frente", () => {
    expect(ordenar([cgd, novobanco, montepio], "taeg").map((o) => o.banco_id)).toEqual([
      "novobanco",
      "montepio",
      "cgd",
    ]);
  });

  it("ordena por outra métrica quando se pede", () => {
    expect(
      ordenar([cgd, novobanco, montepio], "prestacao_mensal").map((o) => o.banco_id),
    ).toEqual(["novobanco", "montepio", "cgd"]);
  });

  // ⚠️ O teste que interessa. `undefined` numa subtracção dá `NaN`, e um `sort`
  // com `NaN` deixa a lista por ordem arbitrária — que parece ordenada. A §4 do
  // ARQUITETURA.md permite omitir uma TAEG que não se consegue dar, portanto
  // este caso é legítimo e não hipotético.
  it("manda para o fim das que têm preço a oferta sem a métrica", () => {
    const semTaeg = oferta({ banco_id: "santander", taeg: undefined });
    const ordem = ordenar([semTaeg, cgd, novobanco], "taeg").map((o) => o.banco_id);
    expect(ordem).toEqual(["novobanco", "cgd", "santander"]);
  });

  it("os que falharam ficam sempre no fim, seja qual for a métrica", () => {
    const falhou = oferta({ banco_id: "bancoctt", sucesso: false, taeg: undefined });
    expect(ordenar([falhou, cgd, novobanco], "taeg").map((o) => o.banco_id)).toEqual([
      "novobanco",
      "cgd",
      "bancoctt",
    ]);
  });
});

describe("a estrela da melhor", () => {
  it("marca uma só por métrica", () => {
    const marcadas = melhores([
      oferta({ banco_id: "cgd", taeg: 3.74, prestacao_mensal: 800 }),
      oferta({ banco_id: "novobanco", taeg: 3.61, prestacao_mensal: 900 }),
    ]);
    expect(marcadas.taeg).toBe("novobanco");
    expect(marcadas.prestacao_mensal).toBe("cgd");
  });

  // ⚠️ A decisão desta app sobre a KAN-26: «ordenar uma oferta ajustada ao lado
  // das outras compara coisas diferentes sem o dizer». A nota do ajuste está no
  // cartão, mas uma estrela não é uma nota — é a afirmação «esta é a melhor», e
  // dá-la a quem foi simulado noutras condições afirma uma coisa falsa.
  it("não a dá a uma oferta que o banco ajustou", () => {
    const ajustada = oferta({ banco_id: "montepio", taeg: 3.1, aplicado: { prazo_anos: 35 } });
    const limpa = oferta({ banco_id: "cgd", taeg: 3.74 });
    // ⚠️ Duas limpas, senão a regra de baixo — «uma oferta sozinha não é a
    // melhor de nada» — decidia este teste em vez da que ele quer exercer.
    const outraLimpa = oferta({ banco_id: "bancoctt", taeg: 3.9 });

    expect(temAjuste(ajustada)).toBe(true);
    expect(melhores([ajustada, limpa, outraLimpa]).taeg).toBe("cgd");
    // ⚠️ Mas continua na lista e continua ordenada — o que não leva é a marca.
    expect(ordenar([limpa, ajustada], "taeg").map((o) => o.banco_id)).toEqual([
      "montepio",
      "cgd",
    ]);
  });

  it("um empate não dá estrela a ninguém", () => {
    const marcadas = melhores([
      oferta({ banco_id: "cgd", taeg: 3.61 }),
      oferta({ banco_id: "novobanco", taeg: 3.61 }),
    ]);
    expect(marcadas.taeg).toBeUndefined();
  });

  // ⚠️ Encontrado a correr a app contra o servidor a sério (2026-07-29): com
  // série de dois bancos e um deles sem o cenário pedido, a CGD ficava sozinha e
  // apanhava as CINCO estrelas. Cada uma era verdadeira e o conjunto era falso —
  // lia-se como recomendação forte onde não havia comparação nenhuma.
  it("uma oferta sozinha não é a melhor de nada", () => {
    const marcadas = melhores([
      oferta({ banco_id: "cgd" }),
      oferta({ banco_id: "novobanco", sucesso: false, taeg: undefined }),
    ]);
    expect(marcadas).toEqual({});
  });

  it("não marca um banco que falhou", () => {
    // ⚠️ A TAEG do que falhou é a mais baixa de propósito: se ele contasse,
    // ganhava. Duas com sucesso para a regra da oferta sozinha não decidir isto.
    const marcadas = melhores([
      oferta({ banco_id: "bancoctt", sucesso: false, taeg: 0.1 }),
      oferta({ banco_id: "cgd", taeg: 3.74 }),
      oferta({ banco_id: "novobanco", taeg: 3.9 }),
    ]);
    expect(marcadas.taeg).toBe("cgd");
  });
});

describe("os pressupostos", () => {
  // ⚠️ O contrato é explícito: `pressupostos` não vem vazio sempre que a `taeg`
  // ou o `mtic` vêm preenchidos, e vazio com um deles preenchido «é defeito
  // nosso». A app di-lo em vez de o esconder.
  it("em falta com números derivados é defeito, e nomeia-se", () => {
    expect(pressupostosEmFalta(oferta({ banco_id: "cgd", pressupostos: [] }))).toBe(true);
    expect(pressupostosEmFalta(oferta({ banco_id: "cgd", pressupostos: undefined }))).toBe(true);
  });

  it("uma oferta sem TAEG nem MTIC não precisa deles", () => {
    expect(
      pressupostosEmFalta(
        oferta({ banco_id: "cgd", taeg: undefined, mtic: undefined, pressupostos: [] }),
      ),
    ).toBe(false);
  });
});

describe("a idade dos preços", () => {
  // ⚠️ O mais ANTIGO. O rodapé faz uma afirmação sobre a lista inteira, e dizer
  // a hora do preço mais fresco apresentava os outros como sendo dessa hora.
  it("é a do preço mais antigo da lista", () => {
    const lista = [
      oferta({ banco_id: "cgd", capturado_em: "2026-07-29T05:00:00Z" }),
      oferta({ banco_id: "novobanco", capturado_em: "2026-07-28T05:00:00Z" }),
    ];
    expect(idadeDosPrecos(lista)).toBe("2026-07-28T05:00:00Z");
  });

  it("não conta a hora de um banco que falhou", () => {
    const lista = [
      oferta({ banco_id: "cgd", capturado_em: "2026-07-29T05:00:00Z" }),
      oferta({ banco_id: "bancoctt", sucesso: false, capturado_em: "2020-01-01T00:00:00Z" }),
    ];
    expect(idadeDosPrecos(lista)).toBe("2026-07-29T05:00:00Z");
  });

  it("é nula quando nenhuma oferta traz hora", () => {
    expect(idadeDosPrecos([oferta({ banco_id: "cgd", capturado_em: undefined })])).toBeNull();
  });
});
