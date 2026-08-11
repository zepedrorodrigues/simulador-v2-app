// A espera e a falha, com cara desenhada.
//
// ⚠️ A A6 do `APP.md` — «os estados que não são o caminho feliz» — é uma fase
// inteira e ainda não é esta. O que está aqui é o mínimo para os três passos do
// pedido não mentirem enquanto `GET /api/v1/bancos` não responde ou falha: um
// alerta genérico do sistema seria exactamente o que essa fase existe para
// evitar. Quando a A6 chegar, é este ficheiro que cresce.

import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import type { EspecieDeFalha } from "@/api/cliente";
import { Botao } from "@/componentes/basicos";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { podeRepetir } from "@/dominio/lista";
import { textos } from "@/textos";

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
  rotuloDeRepetir?: string;
  aoRepetir?: () => void;
};

/**
 * Falha, com ou sem o que fazer a seguir.
 *
 * ⚠️ **Sem acção não leva botão, e não é economia de pixels.** Há uma falha em
 * que repetir não pode funcionar — a versão recusada pelo servidor —, e um
 * «tentar de novo» ali era um botão que promete uma coisa que não acontece: a
 * acção é actualizar, e está na loja e não dentro desta app.
 */
export function Falha({ titulo, corpo, rotuloDeRepetir, aoRepetir }: FalhaProps) {
  const tema = useTema();

  return (
    <View style={estilos.centro}>
      <Text style={[estilos.titulo, { color: tema.texto }]}>{titulo}</Text>
      <Text style={[estilos.corpo, { color: tema.textoFraco }]}>{corpo}</Text>
      {aoRepetir !== undefined && rotuloDeRepetir !== undefined && (
        <Botao titulo={rotuloDeRepetir} aoTocar={aoRepetir} variante="secundario" />
      )}
    </View>
  );
}

/**
 * Uma falha que vale para o ecrã inteiro, dita pela espécie.
 *
 * ⚠️ **Existe para não haver dois sítios a escolher a frase**, e antes havia
 * três — os passos do pedido e as ofertas escreviam à mão
 * `textos.erros.servidorEmBaixo`, fosse qual fosse a falha. Sem rede isso é
 * falso nas duas metades: não é «do nosso lado» e não passa «daqui a pouco».
 *
 * ⚠️ **O botão é uma decisão e não um adorno** (`podeRepetir`): num tecto
 * excedido ele bate na porta que o servidor acabou de fechar, e numa versão
 * recusada promete uma acção que vive na loja.
 */
export function FalhaDoEcra({
  especie,
  aoRepetir,
}: {
  especie: EspecieDeFalha;
  aoRepetir: () => void;
}) {
  const podeInsistir = podeRepetir(especie);

  return (
    <Falha
      titulo={textos.erros[especie].titulo}
      corpo={textos.erros[especie].corpo}
      rotuloDeRepetir={podeInsistir ? textos.comum.tentarDeNovo : undefined}
      aoRepetir={podeInsistir ? aoRepetir : undefined}
    />
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
