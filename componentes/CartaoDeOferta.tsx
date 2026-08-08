// O cartão de uma oferta na lista.
//
// ⚠️ **Três coisas são obrigatórias neste cartão**, e nenhuma delas é decoração —
// são as que separam comparar de induzir em erro (`ECRAS.md` §3):
//
// 1. a nota do ajuste, sempre que `aplicado` não vem vazio;
// 2. as bonificações aplicadas, senão um banco com descontos por omissão parece
//    simplesmente mais barato;
// 3. os bancos que falharam, com a razão em português.
//
// ⚠️ **Eram cinco, e duas saíram a 2026-08-07** — a marca `~` na TAEG e no MTIC,
// e o aviso de um preço que a sonda contradisse (`fiabilidade: em_duvida`). As
// duas descreviam coisas que já não existem: os números são os que o banco cotou,
// e não há grelha para uma sonda contradizer.

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { EspecieDeFalha } from "@/api/cliente";
import type { Oferta } from "@/api/tipos";
import { useTema } from "@/design/tema";
import { espaco, raio, tipo } from "@/design/tokens";
import { dinheiroAoCentimo, percentagem } from "@/dominio/formatar";
import { avisosDoCartao, deveAvisar, type Metrica } from "@/dominio/ofertas";
import { frases, textos } from "@/textos";

const t = textos.ofertas;

type Props = {
  oferta: Oferta;
  /** As métricas em que esta oferta é a melhor. Vazio é o caso comum. */
  melhorEm: Metrica[];
  aoAbrir: () => void;
};

export function CartaoDeOferta({ oferta, melhorEm, aoAbrir }: Props) {
  const tema = useTema();
  const avisos = avisosDoCartao(oferta);
  const { ajustada, notas } = avisos;

  if (!oferta.sucesso) {
    return <CartaoSemOferta oferta={oferta} />;
  }

  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={oferta.banco_nome}
      accessibilityHint={t.verDetalhe}
      style={[estilos.cartao, { backgroundColor: tema.superficie, borderColor: tema.borda }]}
    >
      <View style={estilos.topo}>
        <Text style={[estilos.banco, { color: tema.texto }]}>{oferta.banco_nome}</Text>
        <View style={estilos.estrelas}>
          {melhorEm.map((metrica) => (
            <Text key={metrica} style={[estilos.estrela, { color: tema.destaque }]}>
              {frases.melhorEm(t.metricas[metrica])}
            </Text>
          ))}
        </View>
      </View>

      {/* ⚠️ O rótulo vai colado ao número, e é a regra transversal do ECRAS.md:
          nunca um número sem unidade nem contexto. Um «3,61 %» grande e sozinho
          num ecrã de crédito não diz se é TAEG ou TAN. */}
      <Text style={[estilos.taeg, { color: tema.texto }]}>
        {oferta.taeg === undefined ? t.semTaeg : `${t.metricas.taeg} ${percentagem(oferta.taeg, 2)}`}
      </Text>

      {oferta.prestacao_mensal !== undefined && (
        <Text style={[estilos.prestacao, { color: tema.texto }]}>
          {dinheiroAoCentimo(oferta.prestacao_mensal)}
          {t.porMes}
        </Text>
      )}

      {oferta.tan !== undefined && oferta.spread !== undefined && (
        <Text style={[estilos.linha, { color: tema.textoFraco }]}>
          {frases.tanESpread(percentagem(oferta.tan, 2), percentagem(oferta.spread, 2))}
        </Text>
      )}

      {oferta.produtos_aplicados !== undefined && oferta.produtos_aplicados.length > 0 && (
        <Text style={[estilos.linha, { color: tema.textoFraco }]}>
          🏷 {oferta.produtos_aplicados.join(", ")}
        </Text>
      )}

      {/* ⚠️ O aviso vive no cartão e não numa gaveta. Números diferentes dos
          pedidos sem o dizer, numa comparação de crédito, são enganadores — e o
          mesmo vale para um preço que uma verificação contradisse (ECRAS.md §3).

          ⚠️ As `notas` mostram-se sempre que existem, e não só quando há ajuste.
          Até aqui pendiam do `ajustada`, e uma nota sem ajuste — a do degrau de
          LTV por resolver, por exemplo — não chegava ao cartão. O detalhe já a
          mostrava, o cartão não, e é o cartão que quase toda a gente lê. */}
      {deveAvisar(avisos) && (
        <View style={[estilos.aviso, { backgroundColor: tema.avisoFundo }]}>
          {ajustada && (
            <Text style={[estilos.textoDoAviso, { color: tema.aviso }]}>{t.ajustada}</Text>
          )}
          {notas.map((nota) => (
            <Text key={nota} style={[estilos.textoDoAviso, { color: tema.aviso }]}>
              {nota}
            </Text>
          ))}
        </View>
      )}

      {/* ⚠️ Uma oferta com preço e sem `capturado_em` não se apresenta como
          preço de agora. O contrato promete o campo em toda a oferta com
          sucesso; se ele faltar, é a promessa que falhou, e cala-se a hora em
          vez de se inventar uma. */}
      {oferta.capturado_em === undefined && (
        <Text style={[estilos.linha, { color: tema.aviso }]}>{t.semHora}</Text>
      )}
    </Pressable>
  );
}

/** ⚠️ Fica na lista, e com a razão do banco em português. Um banco que
 * desaparece parece um esquecimento. */
function CartaoSemOferta({ oferta }: { oferta: Oferta }) {
  const tema = useTema();

  return (
    <View
      accessibilityRole="text"
      style={[estilos.cartao, { backgroundColor: tema.falhaFundo, borderColor: tema.borda }]}
    >
      <View style={estilos.topo}>
        <Text style={[estilos.banco, { color: tema.texto }]}>{oferta.banco_nome}</Text>
        <Text style={[estilos.estrela, { color: tema.falha }]}>✕ {textos.ofertas.semOferta}</Text>
      </View>
      {oferta.erro !== undefined && (
        <Text style={[estilos.linha, { color: tema.falha }]}>{oferta.erro.mensagem}</Text>
      )}
    </View>
  );
}

/**
 * A linha de um banco a quem ainda se está a perguntar.
 *
 * ⚠️ **É a lista a encher-se, e não uma barra de progresso** (`ECRAS.md` §2). A
 * diferença não é estética: uma barra afirma que existe um trabalho nosso a
 * avançar, e não existe — são N pedidos independentes. Aqui cada linha diz por
 * si, com o banco nomeado, e uma que já respondeu não volta a este estado.
 */
export function CartaoAEsperar({ bancoNome }: { bancoNome: string }) {
  const tema = useTema();

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={frases.aPerguntarAo(bancoNome)}
      style={[estilos.cartao, { backgroundColor: tema.superficie, borderColor: tema.borda }]}
    >
      <View style={estilos.topo}>
        <Text style={[estilos.banco, { color: tema.texto }]}>{bancoNome}</Text>
        <ActivityIndicator color={tema.primaria} />
      </View>
      <Text style={[estilos.linha, { color: tema.textoFraco }]}>
        {textos.ofertas.aPerguntar}
      </Text>
    </View>
  );
}

/**
 * A linha de um banco a quem o pedido não chegou.
 *
 * ⚠️ **Não é o `CartaoSemOferta`, e a distinção é do desenho e não do estilo.**
 * Ali a razão é **do banco** e vem escrita pelo servidor — «o Banco Montepio não
 * respondeu dentro do prazo». Aqui o pedido nem lá chegou: não há frase do banco
 * a mostrar, e fabricar-lhe uma era a app a afirmar o que ele disse. Diz-se o que
 * a app sabe, com as palavras dela.
 */
export function CartaoNaoChegou({
  bancoNome,
  especie,
}: {
  bancoNome: string;
  especie: EspecieDeFalha;
}) {
  const tema = useTema();

  return (
    <View
      accessibilityRole="text"
      style={[estilos.cartao, { backgroundColor: tema.falhaFundo, borderColor: tema.borda }]}
    >
      <View style={estilos.topo}>
        <Text style={[estilos.banco, { color: tema.texto }]}>{bancoNome}</Text>
        <Text style={[estilos.estrela, { color: tema.falha }]}>✕ {textos.ofertas.naoChegou}</Text>
      </View>
      <Text style={[estilos.linha, { color: tema.falha }]}>{textos.erros[especie].corpo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    padding: espaco.m,
    borderRadius: raio.m,
    borderWidth: StyleSheet.hairlineWidth,
    gap: espaco.xs,
  },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: espaco.s,
  },
  banco: {
    flexShrink: 1,
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  estrelas: {
    alignItems: "flex-end",
  },
  estrela: {
    fontSize: tipo.legenda.tamanho,
    fontWeight: tipo.legenda.peso,
  },
  taeg: {
    fontSize: tipo.titulo.tamanho,
    fontWeight: tipo.titulo.peso,
  },
  prestacao: {
    fontSize: tipo.corpo.tamanho,
  },
  linha: {
    fontSize: tipo.nota.tamanho,
    lineHeight: 20,
  },
  aviso: {
    marginTop: espaco.xs,
    padding: espaco.s,
    borderRadius: raio.s,
    gap: espaco.xs,
  },
  textoDoAviso: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 18,
  },
});
