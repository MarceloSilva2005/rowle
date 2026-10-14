// Mesma cor de fundo de packages/design/src/tokens.ts (colors.bg).
const BG = '#0B0D0C';

// Fontes embutidas no app na hora do build (sem download nem piscada na abertura).
const fonts = [
  '@expo-google-fonts/anton/400Regular/Anton_400Regular.ttf',
  '@expo-google-fonts/archivo/400Regular/Archivo_400Regular.ttf',
  '@expo-google-fonts/archivo/600SemiBold/Archivo_600SemiBold.ttf',
  '@expo-google-fonts/archivo/800ExtraBold/Archivo_800ExtraBold.ttf',
].map((file) => require.resolve(file));

module.exports = {
  expo: {
    name: 'Rowlê',
    slug: 'rowle',
    scheme: 'rowle',
    version: '0.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    backgroundColor: BG,
    platforms: ['android'],
    icon: './assets/icon.png',
    android: {
      package: 'br.com.rowle',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon-foreground.png',
        monochromeImage: './assets/adaptive-icon-monochrome.png',
        backgroundColor: BG,
      },
      predictiveBackGestureEnabled: false,
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          imageWidth: 180,
          backgroundColor: BG,
        },
      ],
      ['expo-font', { fonts }],
    ],
  },
};
