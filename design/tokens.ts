// Os tokens de desenho. ⚠️ **Nenhum componente escreve uma cor ou um número de
// espaçamento à mão** — sai tudo daqui. É o que impede a deriva que o v1 teve,
// onde o `dashboard.html` tinha CSS embutido e cada acrescento inventava o seu
// tom de cinzento.

/** Escala de espaçamento, em múltiplos de 4. */
export const espaco = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
} as const;

export const raio = {
  s: 8,
  m: 12,
  l: 16,
} as const;

/** Tipografia. Os tamanhos são pontos; a app não usa `rem`. */
export const tipo = {
  gigante: { tamanho: 34, peso: "700" },
  titulo: { tamanho: 24, peso: "700" },
  seccao: { tamanho: 18, peso: "600" },
  corpo: { tamanho: 16, peso: "400" },
  nota: { tamanho: 14, peso: "400" },
  legenda: { tamanho: 12, peso: "500" },
} as const;

/** ⚠️ Alvo de toque mínimo, das regras transversais do `ECRAS.md`. Uma app
 * financeira lida com pessoas de todas as idades, e 44 pt é o mínimo que as
 * directrizes de acessibilidade das duas plataformas pedem. */
export const alvoMinimo = 44;

type Paleta = {
  fundo: string;
  superficie: string;
  borda: string;
  texto: string;
  textoFraco: string;
  primaria: string;
  primariaTexto: string;
  /** Avisos de ajuste — o `aplicado` não vazio do contrato. */
  aviso: string;
  avisoFundo: string;
  /** Um banco que não tem oferta. Não é um erro da app. */
  falha: string;
  falhaFundo: string;
  /** Marca a melhor de cada métrica. */
  destaque: string;
};

// ⚠️ As duas paletas nascem juntas, e não «o escuro fica para depois». O
// `ECRAS.md` põe o modo escuro nas regras transversais «desde o início», e um
// tema acrescentado no fim é um tema que se descobre estar cheio de cores
// escritas à mão.
export const claro: Paleta = {
  fundo: "#F7F7F8",
  superficie: "#FFFFFF",
  borda: "#E2E3E7",
  texto: "#16171A",
  textoFraco: "#5C5F6A",
  primaria: "#1B4DE4",
  primariaTexto: "#FFFFFF",
  aviso: "#8A5300",
  avisoFundo: "#FFF4E0",
  falha: "#8A1F1F",
  falhaFundo: "#FDECEC",
  destaque: "#0F7A4A",
};

export const escuro: Paleta = {
  fundo: "#0E0F12",
  superficie: "#191B20",
  borda: "#2C2F37",
  texto: "#F2F3F5",
  textoFraco: "#A0A4B0",
  primaria: "#7FA0FF",
  primariaTexto: "#0E0F12",
  aviso: "#FFC978",
  avisoFundo: "#332608",
  falha: "#FF9C9C",
  falhaFundo: "#3A1516",
  destaque: "#5FD3A0",
};

export type { Paleta };
