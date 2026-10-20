import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontFamily } from '../theme';
import { Icon, type IconName } from './Icon';

const TABS: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Rolês', icon: 'roles' },
  agenda: { label: 'Agenda', icon: 'agenda' },
  explorar: { label: 'Explorar', icon: 'explorar' },
  voce: { label: 'Você', icon: 'voce' },
};

export const TAB_BAR_HEIGHT = 66;

/** Barra de abas: ícone em pílula lima na aba atual. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8), height: TAB_BAR_HEIGHT + Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, i) => {
        const tab = TABS[route.name];
        if (!tab) return null;
        const focused = state.index === i;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tab.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            style={styles.tab}
          >
            <View style={[styles.pill, focused && styles.pillOn]}>
              <Icon name={tab.icon} size={22} color={focused ? colors.onBrand : colors.textMuted} on={focused} />
            </View>
            <Text style={[styles.label, focused && styles.labelOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  tab: { flex: 1, alignItems: 'center', gap: 4 },
  pill: { width: 56, height: 30, borderRadius: 15, overflow: 'hidden', backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.brand },
  label: { color: colors.textMuted, fontFamily: fontFamily.bodyBold, fontSize: 12 },
  labelOn: { color: colors.brand },
});
