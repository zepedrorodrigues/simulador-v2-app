# simulador-v2-app

App **Expo / React Native** do `simulador-v2` — comparação de crédito à
habitação dos bancos portugueses. iOS, Android e web a partir do mesmo código.

> **Estado: pergunta aos bancos, e a lista enche-se.** Expo SDK 57 +
> expo-router, tokens e os dois temas, o contrato sincronizado do backend, os
> **três passos do pedido** com o formulário adaptado ao que `GET /api/v1/bancos`
> publica, e a **lista de ofertas e o detalhe** com as notas de ajuste e a idade
> do preço.
>
> ⚠️ **O fan-out vive aqui** (2026-08-07). Cada banco escolhido é um
> `POST /api/v1/ofertas/{banco}`, **três em voo** de cada vez, e a lista aparece
> logo com todos e preenche-se à medida que respondem. Uma linha tem três
> estados: à espera, servida, ou **não chegou** — e este último não se disfarça
> de oferta em falha, porque essa traz a razão *do banco*.
>
> ⚠️ **Esteve partida entre 2026-08-06 e 2026-08-07, com a suite verde.** Chamava
> o `POST /api/v1/comparacoes`, retirado do backend, e nenhum teste desta app
> fala com o servidor. O que o denunciou foi ler o código — é a razão de a
> confirmação de ponta a ponta abaixo não ser opcional.
>
> ⚠️ **A TAEG e o MTIC deixaram de vir com `~`.** Eram derivados de um modelo de
> encargos do servidor; ao vivo são os que o simulador do banco cotou. O que a
> app continua obrigada a dizer é que uma simulação não é uma proposta.

O backend é [`zepedrorodrigues/simulador-v2`](https://github.com/zepedrorodrigues/simulador-v2),
e é lá que vivem os documentos que os dois lados partilham:

| documento | o que fixa |
|---|---|
| [`docs/ECRAS.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/ECRAS.md) | os ecrãs, com as anotações de desenho |
| [`docs/APP.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/APP.md) | a stack, a estrutura e as fases |
| [`docs/API.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/API.md) | o contrato HTTP |

⚠️ **A publicação nas lojas deixou de estar bloqueada** (2026-08-11): as perguntas
jurídicas saíram do projecto por decisão do dono, e a A8 passou a ser trabalho por
fazer. Apontava-se aqui o `docs/USO-RESPONSAVEL.md`, que saiu do backend no
`d155928` — recupera-se com `git show 35eb7a5:docs/USO-RESPONSAVEL.md`.

## Stack

Expo (*managed*) · expo-router · TanStack Query · Zustand · StyleSheet com
tokens · Jest + React Native Testing Library · EAS Build/Submit.

## O contrato

Os tipos TypeScript são **gerados** do `api/openapi.yaml` do backend e ficam
**commitados** aqui. `npm run sincronizar-api` regenera-os; o CI reprova se o
resultado diferir do que está no repositório.

⚠️ Commitados de propósito: um `.d.ts` buscado em tempo de build faz a app mudar
de comportamento sem ninguém lhe mexer. Assim, uma mudança de contrato é um diff
que alguém aprova.

## Regras

Interface toda em **português de Portugal**, sem frases dentro de componentes.
Modo claro e escuro desde o início. A app **não guarda dados pessoais** — os
inputs vivem no estado do ecrã e desaparecem.

## Correr

```bash
npm ci
npm run sincronizar-api   # copia o openapi.yaml do backend irmão e gera os tipos
npm run web               # abre no browser
npm run verificar         # o portão: contrato em dia, tipos, testes
```

⚠️ O `sincronizar-api` procura o backend em `../simulador-v2`. Se o tiveres
noutro sítio, aponta o `SIMULADOR_V2` ao ficheiro `openapi.yaml` — a mensagem de
erro di-lo.
