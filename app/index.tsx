import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useTema } from "@/design/tema";
import { espaco, raio, tipo } from "@/design/tokens";
import { textos } from "@/textos";

/**
 * O ecrã de entrada.
 *
 * ⚠️ Por agora prova o que a fase A1 tem de provar: que os tokens e os dois
 * temas funcionam, e que nenhuma frase está escrita dentro do componente. Os
 * ecrãs a sério — o pedido em três passos, as ofertas, o detalhe — entram nas
 * fases seguintes, do `ECRAS.md`.
 */
export default function Entrada() {
  const tema = useTema();

  return (
    <ScrollView
      style={{ backgroundColor: tema.fundo }}
      contentContainerStyle={estilos.pagina}
    >
      <Text style={[estilos.titulo, { color: tema.texto }]}>{textos.app.nome}</Text>
      <Text style={[estilos.subtitulo, { color: tema.textoFraco }]}>
        {textos.app.subtitulo}
      </Text>

      {/* ⚠️ A postura aparece no primeiro ecrã, e não escondida nas definições.
          É o que o USO-RESPONSAVEL.md pede: uma postura escondida não é
          postura. */}
      <View
        style={[
          estilos.cartao,
          { backgroundColor: tema.superficie, borderColor: tema.borda },
        ]}
      >
        <Text style={[estilos.nota, { color: tema.textoFraco }]}>
          {textos.postura.naoEProposta}
        </Text>
      </View>

      <View
        style={[
          estilos.cartao,
          { backgroundColor: tema.avisoFundo, borderColor: tema.borda },
        ]}
      >
        <Text style={[estilos.nota, { color: tema.aviso }]}>
          {textos.postura.taegDerivada} {textos.postura.taegOficial}
        </Text>
      </View>

      <View
        style={[
          estilos.cartao,
          { backgroundColor: tema.superficie, borderColor: tema.borda },
        ]}
      >
        <Text style={[estilos.nota, { color: tema.textoFraco }]}>
          {textos.postura.semDadosPessoais}
        </Text>
      </View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    padding: espaco.l,
    gap: espaco.m,
  },
  titulo: {
    fontSize: tipo.gigante.tamanho,
    fontWeight: tipo.gigante.peso,
  },
  subtitulo: {
    fontSize: tipo.corpo.tamanho,
    marginBottom: espaco.s,
  },
  cartao: {
    padding: espaco.m,
    borderRadius: raio.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  nota: {
    fontSize: tipo.nota.tamanho,
    lineHeight: 20,
  },
});
