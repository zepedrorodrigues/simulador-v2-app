import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import type { Indexante, TipoTaxa } from "@/api/tipos";
import { Botao, Caixa, Campo } from "@/componentes/basicos";
import { Escolha, Segmentado, type OpcaoSegmentada } from "@/componentes/controlos";
import { EcraDePasso } from "@/componentes/EcraDePasso";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { anos } from "@/dominio/formatar";
import {
  bancosComPeriodosObservados,
  camposUsados,
  leituraDoIndexante,
  periodosFixosOferecidos,
} from "@/dominio/formulario";
import { montarPedido, produtosDoBanco, usarPedido } from "@/estado/pedido";
import { frases, textos } from "@/textos";

const t = textos.pedido.passo3;

/**
 * Passo 3 — a taxa e os bancos.
 *
 * ⚠️ **Não há aqui tempo por banco, e a razão mudou.** Estava desenhado «☑ CGD
 * ~2 s / ☐ Banco BPI ~50 s», e o campo que o alimentava saiu do contrato quando
 * deixou de haver espera nenhuma. **Volta a haver** (2026-08-06): cada banco
 * escolhido é um pedido, e o Montepio chegou a passar dos 10 s. O número
 * continua a não se anunciar, agora por outro motivo — com um pedido por banco,
 * a lista **enche-se à medida que chegam**, e um tempo total é o do banco mais
 * lento anunciado a quem já está a ver quatro preços.
 *
 * ⚠️ **As bonificações estão aqui, e por omissão vão as do banco.** É a decisão
 * do domínio — «quem escolhe é a pessoa: o `por_omissao` diz à app o que
 * pré-seleccionar, e mais nada» — e o custo de a ignorar está medido: a
 * 2026-07-26, no mesmo cenário, a CGD respondia com o preçário base e o Novo
 * Banco com as duas bonificações já ligadas. Lado a lado isso dizia que o Novo
 * Banco era 0,45 p.p. mais barato, quando em pé de igualdade é a CGD a mais
 * barata por 0,25 p.p.
 */
export default function Passo3() {
  const tema = useTema();
  const campos = usarPedido();
  const definir = usarPedido((estado) => estado.definir);
  const alternarBanco = usarPedido((estado) => estado.alternarBanco);
  const alternarProduto = usarPedido((estado) => estado.alternarProduto);

  return (
    <EcraDePasso passo={3} titulo={t.titulo}>
      {(selecao) => {
        const idsDeTodos = selecao.todos.map((banco) => banco.id);
        const escolhidos = selecao.escolhidos.map((banco) => banco.id);
        const usados = camposUsados(selecao.escolhidos);

        const periodos = periodosFixosOferecidos(selecao.escolhidos);
        const algumEsbatido = periodos.some((periodo) => !periodo.todos);
        const observados = bancosComPeriodosObservados(selecao.escolhidos);
        const indexante = leituraDoIndexante(selecao.escolhidos);

        const nomeDe = (id: string) =>
          selecao.escolhidos.find((banco) => banco.id === id)?.nome ?? id;

        return (
          <>
            <Campo rotulo={t.tipoDeTaxa}>
              <Segmentado<TipoTaxa>
                rotulo={t.tipoDeTaxa}
                opcoes={opcoesDeTaxa}
                valor={campos.tipoTaxa}
                aoEscolher={(tipoTaxa) => definir({ tipoTaxa })}
              />
            </Campo>

            {campos.tipoTaxa !== "variavel" && periodos.length > 0 && (
              <Campo
                rotulo={t.periodoFixo}
                nota={
                  observados.length > 0
                    ? t.periodosObservados
                    : algumEsbatido
                      ? t.periodoNemTodos
                      : undefined
                }
              >
                <Segmentado<number>
                  rotulo={t.periodoFixo}
                  opcoes={periodos.map((periodo) => ({
                    valor: periodo.anos,
                    rotulo: anos(periodo.anos),
                    esbatida: !periodo.todos,
                    descricao: periodo.todos
                      ? undefined
                      : frases.periodoSo(periodo.bancos.map(nomeDe)),
                  }))}
                  valor={campos.periodoFixoAnos}
                  aoEscolher={(periodoFixoAnos) => definir({ periodoFixoAnos })}
                />
              </Campo>
            )}

            {campos.tipoTaxa !== "fixa" && (
              <Campo rotulo={t.indexante}>
                {indexante.escolhiveis.length > 0 ? (
                  <Segmentado<Indexante>
                    rotulo={t.indexante}
                    opcoes={indexante.escolhiveis.map((tenor) => ({
                      valor: tenor,
                      rotulo: tenor.toUpperCase(),
                    }))}
                    valor={campos.indexante}
                    aoEscolher={(escolhido) => definir({ indexante: escolhido })}
                  />
                ) : (
                  <Caixa>{t.semIndexanteEscolhivel}</Caixa>
                )}
              </Campo>
            )}

            {/* ⚠️ Nomeia quem impõe. «Alguns bancos impõem o seu» deixava a
                pessoa sem saber a que ofertas é que a escolha dela chegou. */}
            {indexante.impostos.length > 0 && (
              <Caixa>
                {frases.indexanteImposto(indexante.impostos.map((imposto) => imposto.nome))}
              </Caixa>
            )}

            {usados.has("ja_cliente") && (
              <Escolha
                rotulo={t.jaCliente}
                marcada={campos.jaCliente}
                aoAlternar={() => definir({ jaCliente: !campos.jaCliente })}
              />
            )}

            <View style={estilos.bancos}>
              <View style={estilos.cabecalhoDosBancos}>
                <Text style={[estilos.titulo, { color: tema.texto }]}>{t.bancos}</Text>
                <Text style={[estilos.contagem, { color: tema.textoFraco }]}>
                  {frases.bancosEscolhidos(escolhidos.length, selecao.todos.length)}
                </Text>
              </View>

              {selecao.todos.map((banco) => {
                const marcado = escolhidos.includes(banco.id);
                const porOmissao = banco.produtos
                  .filter((produto) => produto.por_omissao)
                  .map((produto) => produto.id);
                const escolhidosDoBanco = produtosDoBanco(campos.produtos, banco.id, porOmissao);

                return (
                  <View key={banco.id} style={estilos.banco}>
                    <Escolha
                      rotulo={banco.nome}
                      marcada={marcado}
                      aoAlternar={() => alternarBanco(banco.id, idsDeTodos)}
                    />

                    {marcado &&
                      banco.produtos.map((produto) => (
                        <Escolha
                          key={produto.id}
                          recuada
                          rotulo={produto.rotulo}
                          detalhe={produto.descricao}
                          marcada={escolhidosDoBanco.includes(produto.id)}
                          aoAlternar={() => alternarProduto(banco.id, produto.id, porOmissao)}
                        />
                      ))}
                  </View>
                );
              })}

              <Caixa>{t.produtosMudamOPreco}</Caixa>
            </View>

            <View style={estilos.navegacao}>
              <Botao
                titulo={textos.comum.anterior}
                variante="secundario"
                aoTocar={() => router.back()}
              />
              {/* ⚠️ A guarda é o `montarPedido` inteiro e não «há bancos
                  marcados»: quem chegue a este ecrã por URL — e no alvo web
                  chega, porque as rotas são reais — salta os dois primeiros
                  passos, e sem isto submetia um pedido sem valor de imóvel para
                  receber um 400 do outro lado. */}
              <Botao
                titulo={frases.compararComContagem(escolhidos.length)}
                desactivado={montarPedido(campos, selecao.todos, new Date()) === null}
                descricao={escolhidos.length === 0 ? t.nenhumBanco : undefined}
                aoTocar={() => router.push("/ofertas")}
              />
            </View>
          </>
        );
      }}
    </EcraDePasso>
  );
}

const opcoesDeTaxa: OpcaoSegmentada<TipoTaxa>[] = [
  { valor: "variavel", rotulo: t.variavel },
  { valor: "mista", rotulo: t.mista },
  { valor: "fixa", rotulo: t.fixa },
];

const estilos = StyleSheet.create({
  bancos: {
    gap: espaco.s,
  },
  cabecalhoDosBancos: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titulo: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  contagem: {
    fontSize: tipo.nota.tamanho,
  },
  banco: {
    gap: espaco.xs,
  },
  navegacao: {
    gap: espaco.m,
  },
});
