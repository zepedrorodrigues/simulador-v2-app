// O orçamento de espera dos utilitários assíncronos da RNTL, num sítio só.
//
// ⚠️ **O de omissão são 1000 ms, e é um número da máquina a decidir um teste.**
// Medido a 2026-08-14 no `estados-da-lista.test.tsx`, teste do `429`: 150-166 ms
// em três corridas da suite completa com a cache do jest quente, e **503 ms** na
// primeira corrida depois de `jest --clearCache` — 3,3× sem que uma linha de
// código mudasse. Os testes irmãos do mesmo ficheiro não mexeram (58-142 ms).
//
// ⚠️ **E cruzou mesmo:** na primeira corrida desta sessão, com a cache fria e os
// 13 workers a transformar os módulos do Expo ao mesmo tempo, o teste do `429`
// falhou no `waitFor` — e passou sozinho em 155 ms logo a seguir. Um teste que
// falha por contenção não afirma nada sobre o produto: afirma que a máquina
// estava ocupada.
//
// O `waitFor` devolve **assim que a asserção passa**, portanto subir o tecto não
// atrasa nada que esteja certo — só dá mais folga a quem ainda não assentou. O
// que se paga é numa falha a sério, que demora mais a ser declarada.
import { configure } from "@testing-library/react-native";

configure({ asyncUtilTimeout: 5000 });
