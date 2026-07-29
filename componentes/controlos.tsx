// Os controlos de entrada.
//
// ⚠️ Todos com `accessibilityLabel` e todos com pelo menos `alvoMinimo` de
// altura. Não é polimento nem é opcional: está nas regras transversais do
// `ECRAS.md`, e a razão está lá escrita — uma app financeira lida com pessoas de
// todas as idades.

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { useTema } from "@/design/tema";
import { alvoMinimo, espaco, raio, tipo } from "@/design/tokens";
import { agruparMilhares } from "@/dominio/formatar";
import { numeroDeTexto } from "@/dominio/formulario";

type CampoNumeroProps = {
  rotulo: string;
  valor: number | null;
  aoMudar: (valor: number | null) => void;
  /** «€» à direita, para os campos de dinheiro. */
  sufixo?: string;
};

/**
 * Um número escrito à portuguesa.
 *
 * ⚠️ Agrupa os milhares quando o campo perde o foco, e **não** enquanto se
 * escreve. Reformatar a cada tecla move o cursor e é o defeito clássico destes
 * campos: escreve-se «250000» e sai «2 5 0.000» porque o cursor saltou.
 */
export function CampoNumero({ rotulo, valor, aoMudar, sufixo }: CampoNumeroProps) {
  const tema = useTema();
  const [emEdicao, definirEmEdicao] = useState<string | null>(null);

  const mostrado =
    emEdicao ?? (valor === null ? "" : agruparMilhares(valor));

  return (
    <View
      style={[
        estilos.moldura,
        { backgroundColor: tema.superficie, borderColor: tema.borda },
      ]}
    >
      <TextInput
        accessibilityLabel={rotulo}
        value={mostrado}
        onChangeText={(texto) => {
          definirEmEdicao(texto);
          aoMudar(numeroDeTexto(texto));
        }}
        onBlur={() => definirEmEdicao(null)}
        keyboardType="numeric"
        inputMode="decimal"
        style={[estilos.entrada, { color: tema.texto }]}
      />
      {sufixo !== undefined && (
        <Text style={[estilos.sufixo, { color: tema.textoFraco }]}>{sufixo}</Text>
      )}
    </View>
  );
}

type CampoDataProps = {
  rotulo: string;
  valor: string;
  aoMudar: (valor: string) => void;
};

/**
 * A data em «dd/mm/aaaa».
 *
 * ⚠️ Campo de texto e não um selector de calendário nativo. Uma data de
 * nascimento está trinta ou quarenta anos atrás, e um calendário que abre no mês
 * corrente obriga a quatrocentos toques para lá chegar. O `/` é posto por nós à
 * medida que se escreve.
 */
export function CampoData({ rotulo, valor, aoMudar }: CampoDataProps) {
  const tema = useTema();

  return (
    <View
      style={[
        estilos.moldura,
        { backgroundColor: tema.superficie, borderColor: tema.borda },
      ]}
    >
      <TextInput
        accessibilityLabel={rotulo}
        value={valor}
        onChangeText={(texto) => aoMudar(comBarras(texto))}
        keyboardType="numeric"
        inputMode="numeric"
        maxLength={10}
        placeholder="dd/mm/aaaa"
        placeholderTextColor={tema.textoFraco}
        style={[estilos.entrada, { color: tema.texto }]}
      />
    </View>
  );
}

/** Põe as barras nos sítios e deixa apagar. ⚠️ Sem `slice` cego: quem apaga uma
 * barra ficava com ela de volta na tecla seguinte e o campo não se conseguia
 * limpar. */
export function comBarras(texto: string): string {
  const digitos = texto.replace(/\D/g, "").slice(0, 8);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
}

export type OpcaoSegmentada<T extends string | number> = {
  valor: T;
  rotulo: string;
  /** Uma opção que existe mas que nem todos os bancos escolhidos têm. */
  esbatida?: boolean;
  /** O que o leitor de ecrã acrescenta — quem a tem e quem não a tem. */
  descricao?: string;
};

type SegmentadoProps<T extends string | number> = {
  rotulo: string;
  opcoes: OpcaoSegmentada<T>[];
  valor: T | null;
  aoEscolher: (valor: T) => void;
};

/**
 * Escolha de uma entre poucas.
 *
 * ⚠️ As opções `esbatidas` continuam a tocar-se. É a decisão do `ECRAS.md`
 * §1.3: um período que nem todos os bancos têm mostra-se a cinzento em vez de
 * desaparecer, para a pessoa ver a opção e ver o que ela custa — um banco a
 * menos na comparação — em vez de nunca saber que existia.
 */
export function Segmentado<T extends string | number>({
  rotulo,
  opcoes,
  valor,
  aoEscolher,
}: SegmentadoProps<T>) {
  const tema = useTema();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={rotulo} style={estilos.segmentos}>
      {opcoes.map((opcao) => {
        const escolhida = opcao.valor === valor;
        return (
          <Pressable
            key={String(opcao.valor)}
            onPress={() => aoEscolher(opcao.valor)}
            accessibilityRole="radio"
            accessibilityState={{ selected: escolhida }}
            accessibilityLabel={opcao.rotulo}
            accessibilityHint={opcao.descricao}
            style={[
              estilos.segmento,
              {
                backgroundColor: escolhida ? tema.primaria : tema.superficie,
                borderColor: escolhida ? tema.primaria : tema.borda,
                opacity: opcao.esbatida === true && !escolhida ? 0.5 : 1,
              },
            ]}
          >
            <Text
              style={[
                estilos.textoDoSegmento,
                { color: escolhida ? tema.primariaTexto : tema.texto },
              ]}
            >
              {opcao.rotulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type EscolhaProps = {
  rotulo: string;
  marcada: boolean;
  aoAlternar: () => void;
  /** Segunda linha, mais pequena: a descrição de um produto, por exemplo. */
  detalhe?: string;
  /** Recolhe a caixa para dentro, para as sub-listas. */
  recuada?: boolean;
};

/** Uma caixa de verificação com a área de toque da linha inteira. */
export function Escolha({ rotulo, marcada, aoAlternar, detalhe, recuada }: EscolhaProps) {
  const tema = useTema();

  return (
    <Pressable
      onPress={aoAlternar}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: marcada }}
      accessibilityLabel={rotulo}
      accessibilityHint={detalhe}
      style={[estilos.escolha, recuada === true && estilos.recuada]}
    >
      <View
        style={[
          estilos.caixinha,
          {
            borderColor: marcada ? tema.primaria : tema.borda,
            backgroundColor: marcada ? tema.primaria : "transparent",
          },
        ]}
      >
        {marcada && <Text style={[estilos.visto, { color: tema.primariaTexto }]}>✓</Text>}
      </View>
      <View style={estilos.textoDaEscolha}>
        <Text style={[estilos.rotuloDaEscolha, { color: tema.texto }]}>{rotulo}</Text>
        {detalhe !== undefined && (
          <Text style={[estilos.detalhe, { color: tema.textoFraco }]}>{detalhe}</Text>
        )}
      </View>
    </Pressable>
  );
}

type ContadorProps = {
  rotulo: string;
  valor: number;
  minimo: number;
  maximo: number;
  aoMudar: (valor: number) => void;
  /** Como o valor se lê — «30 anos». */
  formatar: (valor: number) => string;
};

/**
 * Menos, mais, e o valor no meio.
 *
 * ⚠️ O `ECRAS.md` desenha aqui um deslizador, e isto é um contador — a troca é
 * deliberada e é de duas coisas. Um deslizador em React Native é um módulo
 * nativo a mais para manter, e o alvo web é o primeiro a publicar-se (`APP.md`
 * §5); e um prazo é um inteiro pequeno onde acertar em 30 com o dedo num
 * deslizador de 1 a 50 é pior do que carregar duas vezes. Se um dia entrar
 * deslizador, entra por aqui e nenhum ecrã muda.
 */
export function Contador({ rotulo, valor, minimo, maximo, aoMudar, formatar }: ContadorProps) {
  const tema = useTema();
  const podeDescer = valor > minimo;
  const podeSubir = valor < maximo;

  return (
    <View style={estilos.contador}>
      <Pressable
        onPress={() => aoMudar(valor - 1)}
        disabled={!podeDescer}
        accessibilityRole="button"
        accessibilityLabel={`Menos um: ${rotulo}`}
        accessibilityState={{ disabled: !podeDescer }}
        style={[
          estilos.passo,
          { borderColor: tema.borda, backgroundColor: tema.superficie, opacity: podeDescer ? 1 : 0.4 },
        ]}
      >
        <Text style={[estilos.sinal, { color: tema.texto }]}>−</Text>
      </Pressable>

      <Text
        accessibilityLabel={`${rotulo}: ${formatar(valor)}`}
        style={[estilos.valorDoContador, { color: tema.texto }]}
      >
        {formatar(valor)}
      </Text>

      <Pressable
        onPress={() => aoMudar(valor + 1)}
        disabled={!podeSubir}
        accessibilityRole="button"
        accessibilityLabel={`Mais um: ${rotulo}`}
        accessibilityState={{ disabled: !podeSubir }}
        style={[
          estilos.passo,
          { borderColor: tema.borda, backgroundColor: tema.superficie, opacity: podeSubir ? 1 : 0.4 },
        ]}
      >
        <Text style={[estilos.sinal, { color: tema.texto }]}>+</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  moldura: {
    minHeight: alvoMinimo,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: espaco.m,
    borderRadius: raio.m,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entrada: {
    flex: 1,
    fontSize: tipo.corpo.tamanho,
    paddingVertical: espaco.s,
  },
  sufixo: {
    fontSize: tipo.corpo.tamanho,
    marginLeft: espaco.s,
  },
  segmentos: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: espaco.s,
  },
  segmento: {
    minHeight: alvoMinimo,
    minWidth: alvoMinimo,
    paddingHorizontal: espaco.m,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: raio.s,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textoDoSegmento: {
    fontSize: tipo.nota.tamanho,
    fontWeight: tipo.legenda.peso,
  },
  escolha: {
    minHeight: alvoMinimo,
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.m,
  },
  recuada: {
    paddingLeft: espaco.l,
  },
  caixinha: {
    width: 24,
    height: 24,
    borderRadius: raio.s,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  visto: {
    fontSize: tipo.nota.tamanho,
    fontWeight: tipo.titulo.peso,
  },
  textoDaEscolha: {
    flex: 1,
  },
  rotuloDaEscolha: {
    fontSize: tipo.corpo.tamanho,
  },
  detalhe: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 16,
  },
  contador: {
    flexDirection: "row",
    alignItems: "center",
    gap: espaco.m,
  },
  passo: {
    width: alvoMinimo,
    height: alvoMinimo,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: raio.s,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sinal: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.titulo.peso,
  },
  valorDoContador: {
    flex: 1,
    textAlign: "center",
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
});
