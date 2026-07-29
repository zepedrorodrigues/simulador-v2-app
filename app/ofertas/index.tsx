import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { eFalhaDaApi } from "@/api/cliente";
import { Botao, Caixa } from "@/componentes/basicos";
import { CartaoDeOferta } from "@/componentes/CartaoDeOferta";
import { Segmentado, type OpcaoSegmentada } from "@/componentes/controlos";
import { AEsperar, Falha } from "@/componentes/Estados";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { instante } from "@/dominio/formatar";
import { idadeDosPrecos, melhores, metricas, ordenar, type Metrica } from "@/dominio/ofertas";
import { useOfertas } from "@/estado/comparacao";
import { usarOrdenacao } from "@/estado/ordenacao";
import { frases, textos } from "@/textos";

const t = textos.ofertas;

/**
 * Ofertas — a lista.
 *
 * ⚠️ **Não há aqui barra de progresso nem chegada progressiva**, e a ausência é
 * a decisão. O ecrã «A comparar» saiu do `ECRAS.md` a 2026-07-28: desde a
 * inversão da §1 uma comparação não fala com banco nenhum, custa uma consulta e
 * aritmética, e uma barra sobre milissegundos é teatro — «teatro num sítio onde
 * se comparam créditos ensina a pessoa a desconfiar do resto do ecrã».
 *
 * ⚠️ **E a idade dos preços aparece sempre, no rodapé.** É a regra mais dura do
 * projecto: um preço sem data não se serve. Um preço de ontem continua a ser
 * informação; um preço de ontem apresentado como o de agora, não.
 */
export default function Ofertas() {
  const tema = useTema();
  const { corpo, comparacao, aEsperar, erro, repetir } = useOfertas();
  const criterio = usarOrdenacao((estado) => estado.criterio);
  const definirCriterio = usarOrdenacao((estado) => estado.definir);

  // ⚠️ Quem abrir `/ofertas` por URL chega aqui sem pedido — e no alvo web abre,
  // porque as rotas são reais. Não é um erro: é uma pessoa no sítio errado, e
  // manda-se para o princípio em vez de se lhe mostrar uma falha.
  if (corpo === null) {
    return (
      <View style={estilos.centro}>
        <Text style={[estilos.vazio, { color: tema.textoFraco }]}>{t.semPedido}</Text>
        <Botao
          titulo={t.irParaOPedido}
          variante="secundario"
          aoTocar={() => router.replace("/passo-1")}
        />
      </View>
    );
  }

  if (aEsperar) return <AEsperar descricao={t.aCalcular} />;

  if (erro !== null && erro !== undefined) {
    const especie = eFalhaDaApi(erro) ? erro.especie : "servidorEmBaixo";
    return (
      <Falha
        titulo={textos.erros[especie].titulo}
        corpo={textos.erros[especie].corpo}
        rotuloDeRepetir={textos.comum.tentarDeNovo}
        aoRepetir={repetir}
      />
    );
  }

  if (comparacao === undefined) return <AEsperar descricao={t.aCalcular} />;

  const ofertas = ordenar(comparacao.ofertas, criterio);
  const marcadas = melhores(comparacao.ofertas);
  const maisAntigo = idadeDosPrecos(comparacao.ofertas);
  const agora = new Date();

  const metricasDe = (bancoId: string): Metrica[] =>
    metricas.filter((metrica) => marcadas[metrica] === bancoId);

  return (
    <ScrollView contentContainerStyle={estilos.pagina}>
      <Text style={[estilos.rotulo, { color: tema.textoFraco }]}>{t.ordenarPor}</Text>
      <Segmentado<Metrica>
        rotulo={t.ordenarPor}
        opcoes={opcoesDeOrdenacao}
        valor={criterio}
        aoEscolher={definirCriterio}
      />

      <Caixa>{t.taegEstimada}</Caixa>

      {ofertas.length === 0 ? (
        <Text style={[estilos.vazio, { color: tema.textoFraco }]}>{t.nenhumaOferta}</Text>
      ) : (
        ofertas.map((oferta) => (
          <CartaoDeOferta
            key={oferta.banco_id}
            oferta={oferta}
            melhorEm={metricasDe(oferta.banco_id)}
            aoAbrir={() => router.push(`/ofertas/${oferta.banco_id}`)}
          />
        ))
      )}

      <Text style={[estilos.rodape, { color: tema.textoFraco }]}>{t.estrelaExplicada}</Text>

      {/* ⚠️ Duas horas diferentes, e as duas aparecem. O `capturado_em` é quando
          o preço foi medido no banco; o `calculado_em` é quando esta resposta foi
          feita. É a diferença entre os dois que diz a idade do preço — juntá-los
          numa só apagava-a. */}
      {maisAntigo !== null && instante(maisAntigo, agora) !== null && (
        <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
          {frases.precosDe(instante(maisAntigo, agora) as string)}
        </Text>
      )}
      {instante(comparacao.calculado_em, agora) !== null && (
        <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
          {frases.calculadoEm(instante(comparacao.calculado_em, agora) as string)}
        </Text>
      )}

      <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
        {textos.postura.naoEProposta}
      </Text>
    </ScrollView>
  );
}

const opcoesDeOrdenacao: OpcaoSegmentada<Metrica>[] = metricas.map((metrica) => ({
  valor: metrica,
  rotulo: t.metricas[metrica],
}));

const estilos = StyleSheet.create({
  pagina: {
    padding: espaco.l,
    gap: espaco.m,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: espaco.m,
    padding: espaco.l,
  },
  rotulo: {
    fontSize: tipo.nota.tamanho,
    fontWeight: tipo.legenda.peso,
  },
  vazio: {
    fontSize: tipo.corpo.tamanho,
    lineHeight: 22,
    textAlign: "center",
  },
  rodape: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 18,
  },
});
