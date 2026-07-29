// A espera e a falha, com cara desenhada.
//
// ⚠️ A A6 do `APP.md` — «os estados que não são o caminho feliz» — é uma fase
// inteira e ainda não é esta. O que está aqui é o mínimo para os três passos do
// pedido não mentirem enquanto `GET /api/v1/bancos` não responde ou falha: um
// alerta genérico do sistema seria exactamente o que essa fase existe para
// evitar. Quando a A6 chegar, é este ficheiro que cresce.

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/componentes/basicos";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";

export function AEsperar({ descricao }: { descricao: string }) {
  const tema = useTema();

  return (
    <View style={estilos.centro}>
      <ActivityIndicator color={tema.primaria} />
      <Text style={[estilos.corpo, { color: tema.textoFraco }]}>{descricao}</Text>
    </View>
  );
}

type FalhaProps = {
  titulo: string;
  corpo: string;
  rotuloDeRepetir: string;
  aoRepetir: () => void;
};

export function Falha({ titulo, corpo, rotuloDeRepetir, aoRepetir }: FalhaProps) {
  const tema = useTema();

  return (
    <View style={estilos.centro}>
      <Text style={[estilos.titulo, { color: tema.texto }]}>{titulo}</Text>
      <Text style={[estilos.corpo, { color: tema.textoFraco }]}>{corpo}</Text>
      <Botao titulo={rotuloDeRepetir} aoTocar={aoRepetir} variante="secundario" />
    </View>
  );
}

const estilos = StyleSheet.create({
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: espaco.m,
    padding: espaco.l,
  },
  titulo: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
    textAlign: "center",
  },
  corpo: {
    fontSize: tipo.nota.tamanho,
    lineHeight: 20,
    textAlign: "center",
  },
});
