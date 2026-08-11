// A moldura comum aos três passos.
//
// ⚠️ Faz duas coisas e é por isso que existe: põe a barra de passos no mesmo
// sítio nos três ecrãs, e **guarda a porta** — nenhum passo se desenha antes de
// `GET /api/v1/bancos` responder. Sem essa guarda, o passo 1 abria com o prazo
// de 1 a 50 (o tecto do domínio) e mudava debaixo dos olhos da pessoa quando a
// resposta chegasse com os limites reais dos bancos.

import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { AEsperar, FalhaDoEcra } from "@/componentes/Estados";
import { Passos } from "@/componentes/Passos";
import { espaco } from "@/design/tokens";
import { useSelecao, type Selecao } from "@/estado/selecao";
import { textos } from "@/textos";

const totalDePassos = 3;

type Props = {
  passo: number;
  titulo: string;
  children: (selecao: Selecao) => ReactNode;
};

export function EcraDePasso({ passo, titulo, children }: Props) {
  const selecao = useSelecao();

  if (selecao.aEsperar) {
    return <AEsperar descricao={textos.comum.aCarregar} />;
  }

  if (selecao.especieDaFalha !== null) {
    // ⚠️ Sem os bancos não há formulário: a lista de períodos, os indexantes e
    // os limites de prazo saem todos de lá. Mostrar um formulário com valores
    // inventados enquanto se espera era pior do que não mostrar nada.
    //
    // ⚠️ **E diz-se qual foi a falha.** Estava fixo em «O serviço não está a
    // responder / Isto é do nosso lado», e sem rede as duas metades são falsas.
    return <FalhaDoEcra especie={selecao.especieDaFalha} aoRepetir={selecao.repetir} />;
  }

  return (
    <ScrollView contentContainerStyle={estilos.pagina}>
      <Passos actual={passo} total={totalDePassos} titulo={titulo} />
      <View style={estilos.corpo}>{children(selecao)}</View>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    padding: espaco.l,
    gap: espaco.l,
  },
  corpo: {
    gap: espaco.l,
  },
});
