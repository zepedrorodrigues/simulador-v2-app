import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { useTema } from "@/design/tema";
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
      retry: 2,
    },
  },
});

export default function Raiz() {
  const tema = useTema();
  const escuro = useColorScheme() === "dark";

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
