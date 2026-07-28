// ⚠️ `jest-expo` e não o preset de `react-native`: é ele que sabe transformar
// os módulos do Expo e que resolve o alvo certo (nativo ou web).
//
// ⚠️ O `@testing-library/react-native` traz os matchers já embutidos desde a
// v12.4 — não há `extend-expect` para carregar, e apontá-lo faz o Jest recusar
// arrancar. Fica escrito aqui porque é o tipo de linha que se copia de um
// tutorial antigo.
module.exports = {
  preset: "jest-expo",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
};
