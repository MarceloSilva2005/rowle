import { formatCardDate } from '@rowle/core';
import { Alert, Linking, Share } from 'react-native';

/** Abre o app de mapas do aparelho no endereço (sem mapa embutido, decisão D3). */
export async function openRoute(venueName: string, address: string | null) {
  const query = encodeURIComponent([venueName, address, 'Distrito Federal'].filter(Boolean).join(', '));
  const geo = `geo:0,0?q=${query}`;
  const web = `https://www.google.com/maps/search/?api=1&query=${query}`;
  try {
    await Linking.openURL((await Linking.canOpenURL(geo)) ? geo : web);
  } catch {
    Alert.alert('Não deu para abrir o mapa', 'Copie o endereço e procure no seu app de mapas.');
  }
}

/** Abre a bilheteria oficial da sessão no navegador. */
export async function openTicket(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Não deu para abrir o link', 'Tente de novo em instantes.');
  }
}

/** Compartilha o rolê em texto (a página pública com link chega no M5). */
export async function shareEvent(e: { title: string; startsAt: string; timeConfirmed: boolean; venueName: string }) {
  const when = formatCardDate(e.startsAt, e.timeConfirmed, new Date());
  try {
    await Share.share({ message: `${e.title}\n${when} · ${e.venueName}\nVi no Rowlê` });
  } catch {
    // Cancelado pela pessoa: nada a fazer.
  }
}
