import { colors, space } from '@rowle/design';

/**
 * Nomes das fontes embutidas pelo plugin expo-font (app.config.js).
 * No Android o nome da família é o nome do arquivo, sem a extensão.
 */
export const fontFamily = {
  display: 'Anton_400Regular',
  body: 'Archivo_400Regular',
  bodySemiBold: 'Archivo_600SemiBold',
  bodyBold: 'Archivo_800ExtraBold',
} as const;

export { colors, space };
