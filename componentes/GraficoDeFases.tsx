// O plano por fases, lado a lado.
//
// ⚠️ **É a informação que o v1 não dava bem, e a razão está no `ECRAS.md` §4:**
// numa taxa mista, a TAN dos primeiros anos não é o custo do crédito — é o
// chamariz. Mostrar as fases lado a lado, com a largura de cada uma proporcional
// à duração, é a diferença entre comparar e ser induzido em erro.

import { StyleSheet, Text, View } from "react-native";

import type { Fase } from "@/api/tipos";
import { useTema } from "@/design/tema";
import { espaco, raio, tipo } from "@/design/tokens";
import { dinheiroAoCentimo, percentagem } from "@/dominio/formatar";
import { fraccoes, rotuloDoTroco, trocos } from "@/dominio/fases";
import { textos } from "@/textos";

export function GraficoDeFases({ fases }: { fases: Fase[] }) {
  const tema = useTema();
  const troços = trocos(fases);

  if (troços.length === 0) {
    return <Text style={[estilos.vazio, { color: tema.textoFraco }]}>{textos.detalhe.semFases}</Text>;
  }

  const larguras = fraccoes(troços);

  return (
    <View style={estilos.tudo}>
      <View
        // ⚠️ A barra é decorativa: a informação toda está nas linhas de baixo, e
        // um leitor de ecrã que lesse doze rectângulos não ganhava nada.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={estilos.barra}
      >
        {troços.map((troco, indice) => (
          <View
            key={troco.deMes}
            style={{
              flex: larguras[indice],
              height: 28,
              // Alterna para as fases se distinguirem sem depender de cor.
              backgroundColor: indice % 2 === 0 ? tema.primaria : tema.borda,
            }}
          />
        ))}
      </View>

      {troços.map((troco) => (
        <View key={troco.deMes} style={estilos.linha}>
          <Text style={[estilos.periodo, { color: tema.textoFraco }]}>{rotuloDoTroco(troco)}</Text>
          <Text style={[estilos.valores, { color: tema.texto }]}>
            {percentagem(troco.taxa, 3)} · {dinheiroAoCentimo(troco.prestacao)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  tudo: {
    gap: espaco.xs,
  },
  barra: {
    flexDirection: "row",
    borderRadius: raio.s,
    overflow: "hidden",
  },
  linha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: espaco.s,
  },
  periodo: {
    fontSize: tipo.nota.tamanho,
  },
  valores: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: tipo.nota.tamanho,
    fontWeight: tipo.legenda.peso,
  },
  vazio: {
    fontSize: tipo.nota.tamanho,
  },
});
