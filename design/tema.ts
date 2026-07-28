import { useColorScheme } from "react-native";

import { claro, escuro, type Paleta } from "./tokens";

/**
 * useTema devolve a paleta do modo em que o sistema está.
 *
 * ⚠️ Segue o sistema e não tem interruptor próprio — por agora. Uma app que
 * impõe o seu modo ignora quem configurou o telemóvel em escuro por precisar
 * dele, e isso é acessibilidade e não gosto. Se um dia houver interruptor, ele
 * passa por aqui e mais nada muda.
 */
export function useTema(): Paleta {
  return useColorScheme() === "dark" ? escuro : claro;
}

export type { Paleta };
