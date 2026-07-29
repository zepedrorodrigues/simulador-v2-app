import { StyleSheet, Text, View } from "react-native";

import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { textos } from "@/textos";

/**
 * Ofertas — **por construir**. É a fase A5 do `APP.md`.
 *
 * ⚠️ Este ecrã existe para o passo 3 ter destino, e não faz nada mais de
 * propósito. A §3 do `ECRAS.md` exige coisas que não se fazem pela metade: a
 * marca de derivada na TAEG, os `pressupostos`, a nota de ajuste no cartão
 * sempre que `aplicado` não vem vazio, os bancos que falharam com a razão em
 * português, e a idade do preço no rodapé. Um ecrã de ofertas a meio — com
 * números certos e sem a marca de que são derivados — é exactamente a falha que
 * o v1 registou e que este projecto herdou como regra.
 */
export default function Ofertas() {
  const tema = useTema();

  return (
    <View style={estilos.pagina}>
      <Text style={[estilos.corpo, { color: tema.textoFraco }]}>
        {textos.ofertas.porConstruir}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    flex: 1,
    justifyContent: "center",
    padding: espaco.l,
  },
  corpo: {
    fontSize: tipo.corpo.tamanho,
    lineHeight: 22,
    textAlign: "center",
  },
});
