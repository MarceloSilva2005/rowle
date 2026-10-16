import { logoSvg } from '@rowle/design';
import { useLocalSearchParams } from 'expo-router';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFeed } from '../src/data/feed';
import { colors, fontFamily, space } from '../src/theme';
import { EstadoTela } from '../src/ui/EstadoTela';
import { EventCard } from '../src/ui/EventCard';
import { Mascote } from '../src/ui/Mascote';

// Proporção do viewBox do logo (748.8 × 238).
const LOGO_RATIO = 238 / 748.8;
const LOGO_WIDTH = 120;

export default function Descobrir() {
  const feed = useFeed();
  const { refreshing, refresh, retry } = feed;
  // Para capturas e testes locais: com EXPO_PUBLIC_PREVIEW_STATES=1, a URL força um
  // estado (rowle:///?previa=erro). Desligado nos builds publicados.
  const params = useLocalSearchParams<{ previa?: string }>();
  const previa = process.env.EXPO_PUBLIC_PREVIEW_STATES === '1' ? params.previa : undefined;
  const forced: Record<string, typeof feed.state> = { carregando: { status: 'loading' }, erro: { status: 'error' }, 'sem-internet': { status: 'offline' } };
  const state = previa === 'vazio' && feed.state.status === 'ready' ? { ...feed.state, sections: [] } : (previa && forced[previa]) || feed.state;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <SvgXml xml={logoSvg} width={LOGO_WIDTH} height={LOGO_WIDTH * LOGO_RATIO} accessibilityLabel="Rowlê" />
      </View>
      {state.status === 'loading' ? (
        <EstadoTela pose="carregando" title="Procurando rolês…" />
      ) : state.status === 'offline' ? (
        <EstadoTela
          pose="procurando"
          title="Sem internet"
          text="Confira a conexão e tente de novo."
          action={{ label: 'Tentar de novo', onPress: retry }}
        />
      ) : state.status === 'error' ? (
        <EstadoTela
          pose="erro"
          title="Não deu para carregar os rolês"
          text="Pode ser instabilidade. Tente de novo em instantes."
          action={{ label: 'Tentar de novo', onPress: retry }}
        />
      ) : state.sections.length === 0 ? (
        <EstadoTela
          pose="dormindo"
          title="Nenhum rolê marcado por enquanto"
          text="A agenda é atualizada todo dia."
          action={{ label: 'Atualizar', onPress: retry }}
        />
      ) : (
        <SectionList
          sections={state.sections.map((section) => ({ ...section, data: section.items }))}
          keyExtractor={(item) => item.session.sessionId}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle} accessibilityRole="header">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <EventCard
              item={item}
              regionName={state.lookups.regions.get(item.session.regionId)}
              categoryName={state.lookups.categories.get(item.session.categoryId)}
              now={state.loadedAt}
            />
          )}
          ItemSeparatorComponent={Separator}
          ListFooterComponent={Fim}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[colors.onBrand]}
              progressBackgroundColor={colors.brand}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

function Fim() {
  return (
    <View style={styles.end}>
      <Mascote pose="acenando" size={112} />
      <Text style={styles.endText}>Por agora é isso. Volte mais tarde.</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  list: { padding: space.lg, paddingBottom: space.xxxl },
  separator: { height: space.md },
  end: { alignItems: 'center', gap: space.sm, paddingTop: space.xxl },
  endText: { color: colors.textMuted, fontFamily: fontFamily.body, fontSize: 15 },
  sectionTitle: {
    color: colors.text,
    fontFamily: fontFamily.display,
    fontSize: 28,
    lineHeight: 34,
    textTransform: 'uppercase',
    marginTop: space.lg,
    marginBottom: space.md,
  },
});
