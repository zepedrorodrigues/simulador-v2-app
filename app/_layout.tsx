import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { repetirNaRaiz } from "@/api/cliente";
import { Falha } from "@/componentes/Estados";
import { useTema } from "@/design/tema";
import { usarVersaoRecusada } from "@/estado/versao";
import { textos } from "@/textos";

// ⚠️ O cliente é criado FORA do componente, uma vez. Criado lá dentro, cada
// render fazia um cliente novo e a cache era deitada fora a cada mudança de
// ecrã — que é o oposto do que ele serve para fazer.
const clienteDeConsultas = new QueryClient({
  defaultOptions: {
    queries: {
      // ⚠️ Cinco minutos, e o número deixou de ser arbitrário: é o
      // `CACHE_VALIDADE` do servidor. Uma consulta que se dê por velha antes
      // disso volta a pedir para receber o mesmo acerto de cache; depois disso,
      // o servidor volta mesmo a perguntar ao banco.
      staleTime: 5 * 60 * 1000,
      // Duas tentativas e desiste. ⚠️ Insistir mais contra um servidor em baixo
      // é bater à porta de quem já disse que não está — e a app tem ecrã
      // desenhado para esse caso (`textos.erros`), que é melhor do que um
      // spinner eterno.
      //
      // ⚠️ **E NÃO se aplica ao caminho dos bancos**, que o sobrepõe (ver
      // `api/ofertas.ts`): aqui uma tentativa custa uma consulta, ali custa 1 a
      // 4 pedidos ao simulador público de um banco. Lá repete-se só o
      // `banco_ocupado`, que é a única falha que passa sozinha.
      //
      // ⚠️ Era um `retry: 2` simples, e mandava o mesmo pedido três vezes a um
      // servidor que já tinha dito que esta app é velha de mais. Ver o
      // `repetirNaRaiz`.
      retry: repetirNaRaiz,
    },
  },
});

/**
 * Raiz — e, quando o servidor recusa esta versão, o ecrã inteiro.
 *
 * ⚠️ **O 426 ocupa a raiz e não um cartão, porque não é sobre nenhum ecrã em
 * particular:** nenhuma rota desta app funciona contra este servidor. Mostrá-lo
 * dentro da lista dava cinco cartões iguais, um por banco, a atribuir a cada
 * banco uma coisa que é nossa — e o `estado/lista.ts` existe em boa parte para
 * essa confusão não acontecer.
 *
 * ⚠️ **E não leva botão de repetir.** A acção é actualizar, e está na loja.
 */
export default function Raiz() {
  const tema = useTema();
  const escuro = useColorScheme() === "dark";
  const versaoRecusada = usarVersaoRecusada((estado) => estado.recusada);

  if (versaoRecusada) {
    return (
      <SafeAreaProvider>
        <StatusBar style={escuro ? "light" : "dark"} />
        <View style={{ flex: 1, backgroundColor: tema.fundo }}>
          <Falha
            titulo={textos.erros.versaoDemasiadoAntiga.titulo}
            corpo={textos.erros.versaoDemasiadoAntiga.corpo}
          />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <QueryClientProvider client={clienteDeConsultas}>
      <SafeAreaProvider>
        {/* ⚠️ A barra de estado segue o tema. Sem isto, o modo escuro fica com
            ícones pretos sobre fundo preto no iOS. */}
        <StatusBar style={escuro ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: tema.superficie },
            headerTintColor: tema.texto,
            contentStyle: { backgroundColor: tema.fundo },
          }}
        >
          <Stack.Screen name="index" options={{ title: textos.app.nome }} />
          {/* ⚠️ O grupo `(pedido)` traz o seu próprio `Stack` — sem esconder o
              cabeçalho daqui, os três passos apareciam com dois, um por cima do
              outro. */}
          <Stack.Screen name="(pedido)" options={{ headerShown: false }} />
          <Stack.Screen name="ofertas/index" options={{ title: textos.ofertas.titulo }} />
          {/* ⚠️ O título do detalhe é o nome do banco, e esse só se sabe depois
              de a resposta chegar — por isso fica vazio aqui e o ecrã escreve-o
              no corpo. Pôr «Detalhe» era um cabeçalho que não diz de quem. */}
          <Stack.Screen name="ofertas/[banco]" options={{ title: "" }} />
        </Stack>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
