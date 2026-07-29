import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/componentes/basicos";
import { useTema } from "@/design/tema";
import { espaco, raio, tipo } from "@/design/tokens";
import { textos } from "@/textos";

/**
 * O ecrã de entrada.
 *
 * ⚠️ **A postura aparece antes do formulário, e não depois.** É deliberado: o
 * `USO-RESPONSAVEL.md` pede que a app diga o que é e o que não é onde é preciso,
 * e o sítio onde é preciso é antes de a pessoa escrever o que quer que seja —
 * não escondido nas definições nem em letra pequena por baixo dos resultados.
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

      <Botao titulo={textos.comum.comecar} aoTocar={() => router.push("/passo-1")} />
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
