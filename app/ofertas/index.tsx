import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Botao } from "@/componentes/basicos";
import {
  CartaoAEsperar,
  CartaoDeOferta,
  CartaoNaoChegou,
} from "@/componentes/CartaoDeOferta";
import { Segmentado, type OpcaoSegmentada } from "@/componentes/controlos";
import { AEsperar, Falha } from "@/componentes/Estados";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { instante } from "@/dominio/formatar";
import { ordenarLinhas, podeMarcarAsMelhores } from "@/dominio/lista";
import { idadeDosPrecos, melhores, metricas, type Metrica } from "@/dominio/ofertas";
import { useOfertas } from "@/estado/lista";
import { usarOrdenacao } from "@/estado/ordenacao";
import { frases, textos } from "@/textos";

const t = textos.ofertas;

/**
 * Ofertas — a lista.
 *
 * ⚠️ **A lista enche-se, e é essa a espera** (`ECRAS.md` §2, 2026-08-06). Cada
 * banco escolhido é um `POST /api/v1/ofertas/{banco}`; a lista aparece logo, com
 * todos, e cada linha troca de estado quando o seu banco responde.
 *
 * ⚠️ **Não volta o ecrã de espera do v1, e a distinção decide o desenho.** Não há
 * trabalho assíncrono nosso a que se pergunte «já está?», logo não há barra de
 * progresso nem nada a cancelar a não ser sair do ecrã. Uma barra afirmaria a
 * existência de um trabalho que não existe — e teatro num sítio onde se comparam
 * créditos ensina a pessoa a desconfiar do resto do ecrã.
 *
 * ⚠️ **E o ecrã inteiro de espera só vale para a lista de BANCOS.** Enquanto o
 * `GET /api/v1/bancos` não responder não se sabe sequer quantas linhas há; a
 * partir daí não há mais nada a esperar em bloco.
 *
 * ⚠️ **A idade dos preços aparece sempre, no rodapé.** É a regra mais dura do
 * projecto: um preço sem data não se serve. Ao vivo quase todos são de segundos
 * atrás — mas um acerto de cache pode ser de há cinco minutos, e é isso que esta
 * linha diz.
 */
export default function Ofertas() {
  const tema = useTema();
  const { montado, linhas, ofertas, aEsperarBancos, bancosFalharam, repetirBancos } = useOfertas();
  const criterio = usarOrdenacao((estado) => estado.criterio);
  const definirCriterio = usarOrdenacao((estado) => estado.definir);

  if (aEsperarBancos) return <AEsperar descricao={textos.comum.aCarregar} />;

  if (bancosFalharam) {
    return (
      <Falha
        titulo={textos.erros.servidorEmBaixo.titulo}
        corpo={textos.erros.servidorEmBaixo.corpo}
        rotuloDeRepetir={textos.comum.tentarDeNovo}
        aoRepetir={repetirBancos}
      />
    );
  }

  // ⚠️ Quem abrir `/ofertas` por URL chega aqui sem pedido — e no alvo web abre,
  // porque as rotas são reais. Não é um erro: é uma pessoa no sítio errado, e
  // manda-se para o princípio em vez de se lhe mostrar uma falha.
  if (montado === null) {
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

  const ordenadas = ordenarLinhas(linhas, criterio);
  // ⚠️ Com bancos por responder não se marca ninguém. Ver `podeMarcarAsMelhores`:
  // a estrela é uma afirmação, e a melhor de duas de cinco desmente-se sozinha.
  const marcadas = podeMarcarAsMelhores(linhas) ? melhores(ofertas) : {};
  const maisAntigo = idadeDosPrecos(ofertas);
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

      {ordenadas.length === 0 ? (
        <Text style={[estilos.vazio, { color: tema.textoFraco }]}>{t.nenhumaOferta}</Text>
      ) : (
        ordenadas.map((linha) => {
          switch (linha.estado) {
            case "a-esperar":
              return <CartaoAEsperar key={linha.bancoId} bancoNome={linha.bancoNome} />;
            case "nao-chegou":
              return (
                <CartaoNaoChegou
                  key={linha.bancoId}
                  bancoNome={linha.bancoNome}
                  especie={linha.especie}
                />
              );
            case "servida":
              return (
                <CartaoDeOferta
                  key={linha.bancoId}
                  oferta={linha.oferta}
                  melhorEm={metricasDe(linha.bancoId)}
                  aoAbrir={() => router.push(`/ofertas/${linha.bancoId}`)}
                />
              );
          }
        })
      )}

      <Text style={[estilos.rodape, { color: tema.textoFraco }]}>{t.estrelaExplicada}</Text>

      {/* ⚠️ O instante é o do preço MAIS ANTIGO da lista, e não o do mais fresco:
          o rodapé faz uma afirmação sobre o conjunto, e a afirmação verdadeira
          sobre preços de horas diferentes é a do mais velho. */}
      {maisAntigo !== null && instante(maisAntigo, agora) !== null && (
        <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
          {frases.precosDe(instante(maisAntigo, agora) as string)}
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
