/** Cores do Rowlê. Fundo escuro por padrão; verde-lima é ênfase, não superfície grande. */
export const colors = {
  bg: '#0B0D0C',
  surface: '#171A18',
  surfaceRaised: '#1F2420',
  border: '#303630',
  text: '#F3F5F0',
  textMuted: '#A9B1A8',
  brand: '#C6FF36',
  onBrand: '#0B0D0C',
  warning: '#FFB020',
  onWarning: '#0B0D0C',
  danger: '#FF6B5E',
  info: '#7FD4FF',
  sticker: '#F3F5F0',
} as const;

/** Cores do mascote; não usar em texto ou interface. */
export const mascotColors = {
  fur: '#8C7563',
  belly: '#B49A84',
  nose: '#FF8FA3',
  dirt: '#6B5646',
} as const;

export const fonts = {
  display: 'Anton',
  body: 'Archivo',
} as const;

/** Tamanhos em px (no app, multiplicados pela escala de fonte do sistema). */
export const typeScale = {
  displayXl: { family: fonts.display, size: 48, lineHeight: 50 },
  displayLg: { family: fonts.display, size: 32, lineHeight: 35 },
  displayMd: { family: fonts.display, size: 24, lineHeight: 27 },
  bodyLg: { family: fonts.body, size: 18, lineHeight: 26, weight: '600' },
  body: { family: fonts.body, size: 16, lineHeight: 24, weight: '400' },
  bodyStrong: { family: fonts.body, size: 16, lineHeight: 24, weight: '800' },
  caption: { family: fonts.body, size: 14, lineHeight: 20, weight: '400' },
  label: { family: fonts.body, size: 13, lineHeight: 18, weight: '800', letterSpacing: 1 },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 6, md: 10, lg: 14, pill: 999 } as const;

/** Área mínima de toque recomendada no Android (48dp). */
export const minTouchTarget = 48;

export type ColorToken = keyof typeof colors;
