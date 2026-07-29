import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Botao, Caixa, Campo } from "@/componentes/basicos";
import { CampoData, CampoNumero } from "@/componentes/controlos";
import { EcraDePasso } from "@/componentes/EcraDePasso";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { dataParaIso, intervaloDeIdadeMaxima, notasDeCampo } from "@/dominio/formulario";
import {
  idadeEmAnos,
  idadeMinima,
  passo2Pronto,
  pedeRendimento,
  usarPedido,
} from "@/estado/pedido";
import { frases, textos } from "@/textos";

const t = textos.pedido.passo2;

/**
 * Passo 2 — os titulares.
 *
 * ⚠️ **A caixa que explica porque é que a data de nascimento é pedida não é
 * decoração**, e as idades que ela nomeia saem dos dados. O `ECRAS.md` tinha
 * «75-83» escrito à mão; aqui vem do `idade_maxima_fim` dos bancos escolhidos, e
 * acompanha-os quando mudarem.
 *
 * ⚠️ **O rendimento só se pergunta a quem o vai usar.** Dos cinco bancos, um
 * declara que o usa — e a nota dele diz que nem aí mexe no preço. Quando nenhum
 * dos escolhidos o lê, o campo não aparece e o ecrã diz porquê. É a diferença
 * entre um formulário e um funil.
 *
 * ⚠️ **A idade não é aplicada aqui.** A app explica a regra; quem decide que um
 * banco não tem oferta é o servidor, que devolve a razão em português. A
 * `KAN-34` está aberta precisamente porque o `idade_maxima_fim` é um número só e
 * na CGD depende da finalidade — pré-julgar com ele daria uma recusa que o
 * servidor não faria.
 */
export default function Passo2() {
  const tema = useTema();
  const campos = usarPedido();
  const definirTitular = usarPedido((estado) => estado.definirTitular);
  const acrescentarTitular = usarPedido((estado) => estado.acrescentarTitular);
  const removerTitular = usarPedido((estado) => estado.removerTitular);

  const hoje = new Date();

  return (
    <EcraDePasso passo={2} titulo={t.titulo}>
      {(selecao) => {
        const comRendimento = pedeRendimento(selecao.escolhidos);
        const idades = intervaloDeIdadeMaxima(selecao.escolhidos);
        const notasDaData = notasDeCampo(selecao.escolhidos, "data_nascimento");

        return (
          <>
            {campos.titulares.map((titular, indice) => {
              const iso = dataParaIso(titular.dataNascimento);
              const escreveu = titular.dataNascimento.length > 0;
              const notaDaData =
                escreveu && iso === null
                  ? t.dataInvalida
                  : iso !== null && idadeEmAnos(iso, hoje) < idadeMinima
                    ? t.idadeMinima
                    : undefined;

              return (
                <View key={indice} style={estilos.titular}>
                  <Text style={[estilos.cabecalho, { color: tema.texto }]}>
                    {indice === 0 ? t.primeiroTitular : t.segundoTitular}
                  </Text>

                  <Campo
                    rotulo={t.nascimento}
                    nota={notaDaData}
                    tomDaNota={notaDaData === undefined ? "neutro" : "aviso"}
                  >
                    <CampoData
                      rotulo={t.nascimento}
                      valor={titular.dataNascimento}
                      aoMudar={(dataNascimento) => definirTitular(indice, { dataNascimento })}
                    />
                  </Campo>

                  {comRendimento && (
                    <Campo rotulo={t.rendimento}>
                      <CampoNumero
                        rotulo={t.rendimento}
                        valor={titular.rendimentoMensal}
                        aoMudar={(rendimentoMensal) =>
                          definirTitular(indice, { rendimentoMensal })
                        }
                        sufixo="€"
                      />
                    </Campo>
                  )}

                  {indice === 1 && (
                    <Botao
                      titulo={t.remover}
                      variante="secundario"
                      aoTocar={() => removerTitular(indice)}
                    />
                  )}
                </View>
              );
            })}

            {campos.titulares.length < 2 && (
              <Botao titulo={t.acrescentar} variante="secundario" aoTocar={acrescentarTitular} />
            )}

            {!comRendimento && <Caixa>{t.rendimentoNaoPedido}</Caixa>}

            <Caixa>
              {idades === null
                ? t.porqueANascimento
                : `${t.porqueANascimento} ${frases.idadeLimite(idades.min, idades.max)}`}
            </Caixa>

            {notasDaData.length > 0 && (
              <View style={estilos.notas}>
                <Text style={[estilos.cabecalho, { color: tema.texto }]}>
                  {t.oQueOsBancosDizem}
                </Text>
                {notasDaData.map((nota) => (
                  <Text key={nota.banco} style={[estilos.nota, { color: tema.textoFraco }]}>
                    {frases.notaDoBanco(nota.banco, nota.nota)}
                  </Text>
                ))}
              </View>
            )}

            <View style={estilos.navegacao}>
              <Botao
                titulo={textos.comum.anterior}
                variante="secundario"
                aoTocar={() => router.back()}
              />
              <Botao
                titulo={textos.comum.seguinte}
                desactivado={!passo2Pronto(campos, hoje, comRendimento)}
                aoTocar={() => router.push("/passo-3")}
              />
            </View>
          </>
        );
      }}
    </EcraDePasso>
  );
}

const estilos = StyleSheet.create({
  titular: {
    gap: espaco.m,
  },
  cabecalho: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  notas: {
    gap: espaco.s,
  },
  nota: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 18,
  },
  navegacao: {
    gap: espaco.m,
  },
});
