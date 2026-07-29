// A barra de progresso dos três passos.
//
// ⚠️ **Isto é progresso de formulário, e é o único progresso que a app mostra.**
// O ecrã «A comparar», com barra a encher enquanto os bancos respondiam, saiu do
// `ECRAS.md` a 2026-07-28: desde a inversão da §1 uma comparação é uma consulta
// e aritmética local, e uma barra sobre milissegundos é teatro — «teatro num
// sítio onde se comparam créditos ensina a pessoa a desconfiar do resto do
// ecrã». Aqui não há teatro nenhum: são três passos e a pessoa está no segundo.

import { StyleSheet, Text, View } from "react-native";

import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";

type PassosProps = {
  /** 1, 2 ou 3. */
  actual: number;
  total: number;
  titulo: string;
};

export function Passos({ actual, total, titulo }: PassosProps) {
  const tema = useTema();

  return (
    <View style={estilos.linha}>
      <View
        // ⚠️ Um único rótulo para o grupo. Três pontos lidos um a um pelo leitor
        // de ecrã são «círculo, círculo, círculo» — que não é informação.
        accessibilityRole="text"
        accessibilityLabel={`Passo ${actual} de ${total}`}
        style={estilos.pontos}
      >
        {Array.from({ length: total }, (_, i) => (
          <View
            key={i}
            style={[
              estilos.ponto,
              { backgroundColor: i < actual ? tema.primaria : tema.borda },
            ]}
          />
        ))}
      </View>
      <Text style={[estilos.titulo, { color: tema.texto }]}>{titulo}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: espaco.m,
  },
  pontos: {
    flexDirection: "row",
    gap: espaco.xs,
  },
  ponto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  titulo: {
    flexShrink: 1,
    textAlign: "right",
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
});
