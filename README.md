# simulador-v2-app

App **Expo / React Native** do `simulador-v2` — comparação de crédito à
habitação dos bancos portugueses. iOS, Android e web a partir do mesmo código.

> **Estado: pede e mostra.** Expo SDK 57 + expo-router, tokens e os dois temas,
> o contrato sincronizado do backend, os **três passos do pedido** com o
> formulário adaptado ao que `GET /api/v1/bancos` publica, e a **lista de ofertas
> e o detalhe** com a marca de derivada na TAEG, os pressupostos, as notas de
> ajuste e a idade do preço.
>
> ⚠️ **Confirmada uma vez, e a confirmação está velha.** A 2026-07-29 correu-se
> o ciclo inteiro em local — Postgres em contentor, `migrar`, `varrer -bancos
> cgd,novobanco` com 57 observações de 49 pontos reais, `servir`, e a app **web**
> contra ele. Pagou-se: foi essa corrida que encontrou as cinco estrelas num
> cartão sozinho ([#13](https://github.com/zepedrorodrigues/simulador-v2-app/pull/13)).
>
> ⚠️ **Falta refazê-la.** A `KAN-45` do backend entrou a 2026-08-01, **depois**
> desta confirmação, e mudou quem aparece na lista: a resposta passou a trazer
> uma oferta por banco **pedido** e não por banco medido. E confirmou-se só a
> web — iOS e Android nunca falaram com o servidor.

O backend é [`zepedrorodrigues/simulador-v2`](https://github.com/zepedrorodrigues/simulador-v2),
e é lá que vivem os documentos que os dois lados partilham:

| documento | o que fixa |
|---|---|
| [`docs/ECRAS.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/ECRAS.md) | os ecrãs, com as anotações de desenho |
| [`docs/APP.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/APP.md) | a stack, a estrutura e as fases |
| [`docs/API.md`](https://github.com/zepedrorodrigues/simulador-v2/blob/development/docs/API.md) | o contrato HTTP |

⚠️ **A publicação nas lojas está bloqueada pela `KAN-24`**, que carrega as
perguntas jurídicas por responder. Apontava-se aqui o `docs/USO-RESPONSAVEL.md`,
que saiu do backend no `d155928` — recupera-se com
`git show 35eb7a5:docs/USO-RESPONSAVEL.md`.

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
