import { Tabs } from 'expo-router/js-tabs';
import { colors } from '../../src/theme';
import { TabBar } from '../../src/ui/TabBar';

/** Quatro abas: Rolês (um por tela), Agenda (linha do tempo), Explorar e Você. */
export default function AbasLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Rolês' }} />
      <Tabs.Screen name="agenda" options={{ title: 'Agenda' }} />
      <Tabs.Screen name="explorar" options={{ title: 'Explorar' }} />
      <Tabs.Screen name="voce" options={{ title: 'Você' }} />
    </Tabs>
  );
}
