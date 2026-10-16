import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CatalogProvider } from '../src/data/catalog';
import { SavedProvider } from '../src/data/saved';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CatalogProvider>
        <SavedProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="(abas)" />
            <Stack.Screen name="evento/[slug]" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <StatusBar style="light" />
        </SavedProvider>
      </CatalogProvider>
    </SafeAreaProvider>
  );
}
