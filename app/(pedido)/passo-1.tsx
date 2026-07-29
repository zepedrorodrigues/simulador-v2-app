import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import type { Finalidade } from "@/api/tipos";
import { Barra, Botao, Campo } from "@/componentes/basicos";
import {
  CampoNumero,
  Contador,
  Escolha,
  Segmentado,
  type OpcaoSegmentada,
} from "@/componentes/controlos";
import { EcraDePasso } from "@/componentes/EcraDePasso";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { anos, percentagem } from "@/dominio/formatar";
import {
  bancosForaDoPrazo,
  camposUsados,
  intervaloDePrazo,
  racioLtv,
} from "@/dominio/formulario";
import {
  passo1Pronto,
  prazoMaximoDoDominio,
  prazoMinimoDoDominio,
  usarPedido,
} from "@/estado/pedido";
import { frases, textos } from "@/textos";

const t = textos.pedido.passo1;

/**
 * Passo 1 — o imóvel e o empréstimo.
 *
 * ⚠️ **O LTV é calculado e mostrado ao vivo**, com a leitura do que significa.
 * É a correcção directa do v1, que tinha um campo `LTV` desactivado e sem
 * explicação nenhuma: o spread é uma função em degraus do LTV, e quem está a
 * 68,1 % beneficia de saber que baixar mil euros pode mudar o preço.
 *
 * ⚠️ E **a app não desenha os degraus**. Depois da KAN-35 sabe-se que eles não
 * são de 5 %, e que não são sequer da mesma forma: na CGD o preço desce quando o
 * LTV sobe e quebra aos 67 %, no Novo Banco sobe e quebra em 50/51, 70/71 e
 * 80/81, no Montepio não muda de todo. A app diz que o preço muda por patamares
 * e não inventa onde eles caem.
 *
 * ⚠️ Também **não diz «dentro dos limites de todos»**, que é o que o `ECRAS.md`
 * desenhava aqui. Não há em `GET /api/v1/bancos` campo nenhum de limite de LTV —
 * o `Banco` publica prazos, idade, períodos, indexantes e produtos, e mais nada.
 * Afirmá-lo era a app inventar uma garantia que não tem como saber.
 */
export default function Passo1() {
  const tema = useTema();
  const campos = usarPedido();
  const definir = usarPedido((estado) => estado.definir);

  return (
    <EcraDePasso passo={1} titulo={t.titulo}>
      {(selecao) => {
        const usados = camposUsados(selecao.escolhidos);
        const ltv = racioLtv(campos.valorImovel, campos.montante);
        const excede =
          campos.valorImovel !== null &&
          campos.montante !== null &&
          campos.montante > campos.valorImovel;

        const intervalo = intervaloDePrazo(selecao.escolhidos) ?? {
          min: prazoMinimoDoDominio,
          max: prazoMaximoDoDominio,
        };
        const foraDoPrazo = bancosForaDoPrazo(selecao.escolhidos, campos.prazoAnos);

        return (
          <>
            <Campo rotulo={t.valorImovel}>
              <CampoNumero
                rotulo={t.valorImovel}
                valor={campos.valorImovel}
                aoMudar={(valorImovel) => definir({ valorImovel })}
                sufixo="€"
              />
            </Campo>

            <Campo
              rotulo={t.montante}
              nota={excede ? t.montanteExcede : undefined}
              tomDaNota={excede ? "aviso" : "neutro"}
            >
              <CampoNumero
                rotulo={t.montante}
                valor={campos.montante}
                aoMudar={(montante) => definir({ montante })}
                sufixo="€"
              />
            </Campo>

            {ltv !== null && (
              <Campo rotulo={t.ltv} nota={t.ltvPorPatamares}>
                <View style={estilos.leituraDoLtv}>
                  <Text style={[estilos.valor, { color: tema.texto }]}>
                    {frases.ltv(percentagem(ltv, 1))}
                  </Text>
                  <Barra fraccao={ltv / 100} descricao={frases.ltv(percentagem(ltv, 1))} />
                </View>
              </Campo>
            )}

            <Campo
              rotulo={t.prazo}
              nota={
                foraDoPrazo.length > 0
                  ? frases.foraDoPrazo(foraDoPrazo.map((banco) => banco.nome))
                  : undefined
              }
              tomDaNota={foraDoPrazo.length > 0 ? "aviso" : "neutro"}
            >
              <Contador
                rotulo={t.prazo}
                valor={campos.prazoAnos}
                minimo={intervalo.min}
                maximo={intervalo.max}
                aoMudar={(prazoAnos) => definir({ prazoAnos })}
                formatar={anos}
              />
            </Campo>

            {usados.has("finalidade") && (
              <Campo rotulo={t.finalidade}>
                <Segmentado<Finalidade>
                  rotulo={t.finalidade}
                  opcoes={opcoesDeFinalidade}
                  valor={campos.finalidade}
                  aoEscolher={(finalidade) => definir({ finalidade })}
                />
              </Campo>
            )}

            {usados.has("localizacao") && (
              <Campo rotulo={t.localizacao}>
                <Segmentado<string>
                  rotulo={t.localizacao}
                  opcoes={opcoesDeLocalizacao}
                  valor={campos.localizacao}
                  aoEscolher={(localizacao) => definir({ localizacao })}
                />
              </Campo>
            )}

            {usados.has("garantia_publica") && (
              <Escolha
                rotulo={t.garantiaPublica}
                marcada={campos.garantiaPublica}
                aoAlternar={() => definir({ garantiaPublica: !campos.garantiaPublica })}
              />
            )}

            <Botao
              titulo={textos.comum.seguinte}
              desactivado={!passo1Pronto(campos)}
              aoTocar={() => router.push("/passo-2")}
            />
          </>
        );
      }}
    </EcraDePasso>
  );
}

const opcoesDeFinalidade: OpcaoSegmentada<Finalidade>[] = [
  { valor: "propria", rotulo: t.finalidades.propria },
  { valor: "secundaria", rotulo: t.finalidades.secundaria },
  { valor: "arrendamento", rotulo: t.finalidades.arrendamento },
];

const opcoesDeLocalizacao: OpcaoSegmentada<string>[] = [
  { valor: "continente", rotulo: t.localizacoes.continente },
  { valor: "acores", rotulo: t.localizacoes.acores },
  { valor: "madeira", rotulo: t.localizacoes.madeira },
];

const estilos = StyleSheet.create({
  leituraDoLtv: {
    gap: espaco.s,
  },
  valor: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
});
