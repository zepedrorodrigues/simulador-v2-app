// Os blocos de que os ecrãs são feitos.
//
// ⚠️ **Nenhum deles escreve uma cor ou um espaçamento à mão** — sai tudo dos
// tokens, e a paleta vem do `useTema()`. É o que impede a deriva que o v1 teve.
//
// ⚠️ E nenhum deles tem uma frase lá dentro: o texto entra por propriedade e
// vem sempre de `textos/` (`APP.md` §1).

import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTema } from "@/design/tema";
import { alvoMinimo, espaco, raio, tipo } from "@/design/tokens";

type BotaoProps = {
  titulo: string;
  aoTocar: () => void;
  /** `primario` é a acção que faz avançar; há um só por ecrã. */
  variante?: "primario" | "secundario";
  desactivado?: boolean;
  /** O que o leitor de ecrã diz quando o botão está desactivado e não é óbvio porquê. */
  descricao?: string;
};

export function Botao({
  titulo,
  aoTocar,
  variante = "primario",
  desactivado = false,
  descricao,
}: BotaoProps) {
  const tema = useTema();
  const primario = variante === "primario";

  return (
    <Pressable
      onPress={aoTocar}
      disabled={desactivado}
      accessibilityRole="button"
      accessibilityState={{ disabled: desactivado }}
      accessibilityHint={descricao}
      style={({ pressed }) => [
        estilos.botao,
        {
          backgroundColor: primario ? tema.primaria : "transparent",
          borderColor: primario ? tema.primaria : tema.borda,
          // ⚠️ A opacidade é o único sinal de desactivado que funciona nas duas
          // plataformas e no web sem cor nova. Não substitui o
          // `accessibilityState`, que é o que o leitor de ecrã lê.
          opacity: desactivado ? 0.45 : pressed ? 0.75 : 1,
        },
      ]}
    >
      <Text
        style={[
          estilos.textoDoBotao,
          { color: primario ? tema.primariaTexto : tema.texto },
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

type CaixaProps = {
  children: ReactNode;
  /** `nota` explica; `aviso` chama a atenção para uma diferença face ao pedido. */
  tom?: "nota" | "aviso";
};

/**
 * A caixa ⓘ dos ecrãs.
 *
 * ⚠️ Existe porque explicar porque é que um campo é pedido não é decoração. O
 * `ECRAS.md` §1.2 di-lo do sítio onde mais custa: pedir a data de nascimento sem
 * justificar é o que faz uma app parecer um funil de recolha.
 */
export function Caixa({ children, tom = "nota" }: CaixaProps) {
  const tema = useTema();
  const aviso = tom === "aviso";

  return (
    <View
      style={[
        estilos.caixa,
        {
          backgroundColor: aviso ? tema.avisoFundo : tema.superficie,
          borderColor: tema.borda,
        },
      ]}
    >
      <Text style={[estilos.textoDaCaixa, { color: aviso ? tema.aviso : tema.textoFraco }]}>
        {children}
      </Text>
    </View>
  );
}

type CampoProps = {
  rotulo: string;
  children: ReactNode;
  /** Uma linha abaixo do controlo: a leitura do que ele significa, ou o que falta. */
  nota?: string;
  tomDaNota?: "neutro" | "aviso";
};

/** Rótulo, controlo e nota. ⚠️ O rótulo é sempre visível — não é `placeholder`.
 * Um `placeholder` desaparece assim que se escreve, e num formulário de crédito
 * a pessoa fica sem saber o que está no campo que preencheu há dois ecrãs. */
export function Campo({ rotulo, children, nota, tomDaNota = "neutro" }: CampoProps) {
  const tema = useTema();

  return (
    <View style={estilos.campo}>
      <Text style={[estilos.rotulo, { color: tema.textoFraco }]}>{rotulo}</Text>
      {children}
      {nota !== undefined && (
        <Text
          style={[
            estilos.nota,
            { color: tomDaNota === "aviso" ? tema.aviso : tema.textoFraco },
          ]}
        >
          {nota}
        </Text>
      )}
    </View>
  );
}

type BarraProps = {
  /** De 0 a 1. Valores fora do intervalo são cortados — não desenham fora da barra. */
  fraccao: number;
  /** O que a barra está a mostrar, para o leitor de ecrã. */
  descricao: string;
};

/**
 * A barra do LTV.
 *
 * ⚠️ É uma **leitura**, não um controlo: não se arrasta. O rácio sai do valor do
 * imóvel e do montante, que são os campos que a pessoa escreve; uma barra
 * arrastável seria um terceiro sítio a dizer a mesma coisa, e os três a
 * discordar entre si ao primeiro arredondamento.
 *
 * ⚠️ E **não desenha degraus**. O `ECRAS.md` §1.1 é explícito depois da KAN-35:
 * na CGD o preço desce quando o LTV sobe e quebra aos 67 %, no Novo Banco sobe e
 * quebra em 50/51, 70/71 e 80/81, no Montepio não muda de todo. São três formas
 * diferentes e são as dos bancos — marcar degraus nossos era inventar onde eles
 * caem.
 */
export function Barra({ fraccao, descricao }: BarraProps) {
  const tema = useTema();
  const cortada = Math.max(0, Math.min(1, fraccao));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={descricao}
      style={[estilos.calha, { backgroundColor: tema.borda }]}
    >
      <View
        style={[
          estilos.enchimento,
          { backgroundColor: tema.primaria, width: `${cortada * 100}%` },
        ]}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: alvoMinimo,
    paddingHorizontal: espaco.l,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: raio.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textoDoBotao: {
    fontSize: tipo.corpo.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  caixa: {
    padding: espaco.m,
    borderRadius: raio.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textoDaCaixa: {
    fontSize: tipo.nota.tamanho,
    lineHeight: 20,
  },
  campo: {
    gap: espaco.xs,
  },
  rotulo: {
    fontSize: tipo.nota.tamanho,
    fontWeight: tipo.legenda.peso,
  },
  nota: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 16,
  },
  calha: {
    height: 6,
    borderRadius: raio.s,
    overflow: "hidden",
  },
  enchimento: {
    height: "100%",
  },
});
