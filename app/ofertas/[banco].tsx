import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Botao, Caixa } from "@/componentes/basicos";
import { AEsperar } from "@/componentes/Estados";
import { GraficoDeFases } from "@/componentes/GraficoDeFases";
import { useTema } from "@/design/tema";
import { espaco, tipo } from "@/design/tokens";
import { dinheiroAoCentimo, instante, percentagem } from "@/dominio/formatar";
import { pressupostosEmFalta, temAjuste } from "@/dominio/ofertas";
import { useOfertas } from "@/estado/comparacao";
import { frases, textos } from "@/textos";

const t = textos.detalhe;

/**
 * O detalhe de uma oferta.
 *
 * ⚠️ **É aqui que os `pressupostos` se mostram por inteiro**, sob a TAEG e o
 * MTIC. É a condição em que a §4 do `ARQUITETURA.md` permite servir números
 * derivados — «assumir e declarar», nunca uma sem a outra — e é o que o Anexo I,
 * Parte II e o Anexo II da MCD mandam fazer a um valor que depende de hipóteses.
 *
 * ⚠️ **E a proveniência e a hora aparecem sempre**, no rodapé. Não há cache: os
 * valores vêm todos de um varrimento anterior, e a hora não é uma excepção a
 * assinalar — é parte de cada oferta.
 */
export default function DetalheDaOferta() {
  const tema = useTema();
  const { banco } = useLocalSearchParams<{ banco: string }>();
  const { corpo, comparacao, aEsperar } = useOfertas();

  if (corpo === null || (comparacao === undefined && !aEsperar)) {
    return <SemDetalhe />;
  }
  if (comparacao === undefined) return <AEsperar descricao={textos.ofertas.aCalcular} />;

  const oferta = comparacao.ofertas.find((candidata) => candidata.banco_id === banco);
  if (oferta === undefined || !oferta.sucesso) return <SemDetalhe />;

  const agora = new Date();
  const capturado = oferta.capturado_em === undefined ? null : instante(oferta.capturado_em, agora);

  return (
    <ScrollView contentContainerStyle={estilos.pagina}>
      <Text style={[estilos.banco, { color: tema.texto }]}>{oferta.banco_nome}</Text>

      <View style={estilos.numeros}>
        {/* ⚠️ O `~` fica colado ao número, e o rótulo diz o que ele é. A regra
            transversal do ECRAS.md: nunca um número sem unidade nem contexto. */}
        <Numero
          rotulo={textos.ofertas.metricas.taeg}
          valor={oferta.taeg === undefined ? textos.ofertas.semTaeg : `~${percentagem(oferta.taeg, 2)}`}
        />
        {oferta.prestacao_mensal !== undefined && (
          <Numero
            rotulo={textos.ofertas.metricas.prestacao_mensal}
            valor={dinheiroAoCentimo(oferta.prestacao_mensal)}
          />
        )}
        {oferta.mtic !== undefined && (
          <Numero
            rotulo={textos.ofertas.metricas.mtic}
            valor={`~${dinheiroAoCentimo(oferta.mtic)}`}
          />
        )}
      </View>

      {temAjuste(oferta) && (
        <Caixa tom="aviso">
          {[textos.ofertas.ajustada, ...(oferta.notas ?? [])].join("\n")}
        </Caixa>
      )}

      <Seccao titulo={t.comoEvolui}>
        <GraficoDeFases fases={oferta.fases ?? []} />
      </Seccao>

      {oferta.tan !== undefined &&
        oferta.spread !== undefined &&
        oferta.euribor_indexante !== undefined &&
        oferta.euribor_valor !== undefined && (
          <Seccao titulo={t.composicao}>
            <Text style={[estilos.linha, { color: tema.texto }]}>
              {frases.composicaoDaTan(
                oferta.euribor_indexante,
                percentagem(oferta.euribor_valor, 3),
                percentagem(oferta.spread, 3),
                percentagem(oferta.tan, 3),
              )}
            </Text>
          </Seccao>
        )}

      {oferta.produtos_aplicados !== undefined && oferta.produtos_aplicados.length > 0 && (
        <Seccao titulo={t.produtosAplicados}>
          {oferta.produtos_aplicados.map((produto) => (
            <Text key={produto} style={[estilos.linha, { color: tema.texto }]}>
              ☑ {produto}
            </Text>
          ))}
        </Seccao>
      )}

      {/* ⚠️ Lista à parte das notas, e não misturada nelas: uma nota diz o que o
          banco fez a este pedido, um pressuposto declara em que assunções
          NOSSAS o número assenta. Empacotá-las juntas deixava a pessoa sem
          saber qual dos números vem do banco e qual sai de um modelo. */}
      {oferta.pressupostos !== undefined && oferta.pressupostos.length > 0 && (
        <Seccao titulo={t.pressupostos}>
          {oferta.pressupostos.map((pressuposto) => (
            <Text key={pressuposto} style={[estilos.linha, { color: tema.textoFraco }]}>
              • {pressuposto}
            </Text>
          ))}
        </Seccao>
      )}

      {pressupostosEmFalta(oferta) && <Caixa tom="aviso">{textos.ofertas.pressupostosEmFalta}</Caixa>}

      {oferta.notas !== undefined && oferta.notas.length > 0 && !temAjuste(oferta) && (
        <Seccao titulo={t.notas}>
          {oferta.notas.map((nota) => (
            <Text key={nota} style={[estilos.linha, { color: tema.textoFraco }]}>
              • {nota}
            </Text>
          ))}
        </Seccao>
      )}

      <Text style={[estilos.rodape, { color: tema.textoFraco }]}>{t.proveniencia}</Text>
      {capturado !== null && (
        <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
          {frases.precosDe(capturado)}
        </Text>
      )}
      {capturado === null && (
        <Text style={[estilos.rodape, { color: tema.aviso }]}>{textos.ofertas.semHora}</Text>
      )}
      <Text style={[estilos.rodape, { color: tema.textoFraco }]}>
        {textos.postura.taegDerivada} {textos.postura.taegOficial}
      </Text>
    </ScrollView>
  );
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  const tema = useTema();
  return (
    <View style={estilos.numero}>
      <Text style={[estilos.rotuloDoNumero, { color: tema.textoFraco }]}>{rotulo}</Text>
      <Text style={[estilos.valorDoNumero, { color: tema.texto }]}>{valor}</Text>
    </View>
  );
}

function Seccao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const tema = useTema();
  return (
    <View style={estilos.seccao}>
      <Text style={[estilos.tituloDaSeccao, { color: tema.texto }]}>{titulo}</Text>
      {children}
    </View>
  );
}

function SemDetalhe() {
  const tema = useTema();
  return (
    <View style={estilos.centro}>
      <Text style={[estilos.linha, { color: tema.textoFraco, textAlign: "center" }]}>
        {t.naoEncontrada}
      </Text>
      <Botao titulo={t.voltar} variante="secundario" aoTocar={() => router.replace("/ofertas")} />
    </View>
  );
}

const estilos = StyleSheet.create({
  pagina: {
    padding: espaco.l,
    gap: espaco.l,
  },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: espaco.m,
    padding: espaco.l,
  },
  banco: {
    fontSize: tipo.titulo.tamanho,
    fontWeight: tipo.titulo.peso,
  },
  numeros: {
    gap: espaco.s,
  },
  numero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: espaco.m,
  },
  rotuloDoNumero: {
    fontSize: tipo.nota.tamanho,
  },
  valorDoNumero: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  seccao: {
    gap: espaco.s,
  },
  tituloDaSeccao: {
    fontSize: tipo.seccao.tamanho,
    fontWeight: tipo.seccao.peso,
  },
  linha: {
    fontSize: tipo.nota.tamanho,
    lineHeight: 20,
  },
  rodape: {
    fontSize: tipo.legenda.tamanho,
    lineHeight: 18,
  },
});
