// O cartão de uma oferta na lista.
//
// ⚠️ **Quatro coisas são obrigatórias neste cartão**, e nenhuma delas é
// decoração — são as que separam comparar de induzir em erro (`ECRAS.md` §3):
//
// 1. a marca `~` na TAEG e no MTIC, porque são derivados e não cotados;
// 2. a nota do ajuste, sempre que `aplicado` não vem vazio;
// 3. as bonificações aplicadas, senão um banco com descontos por omissão parece
//    simplesmente mais barato;
// 4. os bancos que falharam, com a razão em português;
// 5. o aviso de um preço que a sonda contradisse (`fiabilidade: em_duvida`).

import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Oferta } from "@/api/tipos";
import { useTema } from "@/design/tema";
import { espaco, raio, tipo } from "@/design/tokens";
import { dinheiroAoCentimo, percentagem } from "@/dominio/formatar";
import { avisosDoCartao, deveAvisar, pressupostosEmFalta, type Metrica } from "@/dominio/ofertas";
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
  // ⚠️ Só o `em_duvida` se mostra. `confirmada` e `por_confirmar` mostram-se com
  // SILÊNCIO — uma etiqueta de «confirmada» em toda a gente é ruído com aspecto
  // de informação, e treina quem lê a saltar a única que importa (ECRAS.md §3).
  const avisos = avisosDoCartao(oferta);
  const { ajustada, emDuvida, notas } = avisos;

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

      {/* ⚠️ O `~` e o rótulo andam juntos. Um número grande sozinho num ecrã de
          crédito lê-se como a taxa do contrato, e esta não é: é derivada. */}
      <Text style={[estilos.taeg, { color: tema.texto }]}>
        {oferta.taeg === undefined ? t.semTaeg : `${t.metricas.taeg} ~${percentagem(oferta.taeg, 2)}`}
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
          {emDuvida && (
            <Text style={[estilos.textoDoAviso, { color: tema.aviso }]}>{t.emDuvida}</Text>
          )}
          {notas.map((nota) => (
            <Text key={nota} style={[estilos.textoDoAviso, { color: tema.aviso }]}>
              {nota}
            </Text>
          ))}
        </View>
      )}

      {/* ⚠️ Defeito nosso, dito em voz alta. O contrato obriga os `pressupostos`
          sempre que a TAEG ou o MTIC vêm preenchidos. */}
      {pressupostosEmFalta(oferta) && (
        <View style={[estilos.aviso, { backgroundColor: tema.falhaFundo }]}>
          <Text style={[estilos.textoDoAviso, { color: tema.falha }]}>{t.pressupostosEmFalta}</Text>
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
