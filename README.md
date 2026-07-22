# simulador-v2-app

App **Expo / React Native** do `simulador-v2` — comparação de crédito à
habitação dos bancos portugueses. iOS, Android e web a partir do mesmo código.

> **Estado: em planeamento.** Ainda não há código.

O backend é [`zepedrorodrigues/simulador-v2`](https://github.com/zepedrorodrigues/simulador-v2),
e é lá que vivem os documentos que os dois lados partilham:

| documento | o que fixa |
|---|---|
| [`docs/ECRAS.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/ECRAS.md) | os seis ecrãs, com as anotações de desenho |
| [`docs/APP.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/APP.md) | a stack, a estrutura e as fases |
| [`docs/API.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/API.md) | o contrato HTTP |
| [`docs/USO-RESPONSAVEL.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/USO-RESPONSAVEL.md) | ⚠️ bloqueia a publicação nas lojas |

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
