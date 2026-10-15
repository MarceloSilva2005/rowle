import { describe, expect, it } from 'vitest';
import {
  combineExtractions,
  decodeEntities,
  extractFromHtml,
  extractFromText,
  findDate,
  findPrice,
  findTimes,
  guessCategory,
  isTicketingUrl,
} from './extract';

const TODAY = '2026-10-15';

describe('findDate', () => {
  it('lê data numérica e por extenso', () => {
    expect(findDate('sábado, 21/11 às 21h', TODAY)).toBe('2026-11-21');
    expect(findDate('Dia 5 de dezembro de 2026', TODAY)).toBe('2026-12-05');
    expect(findDate('21 NOV', TODAY)).toBe('2026-11-21');
    expect(findDate('em 3 de março', TODAY)).toBe('2027-03-03');
    expect(findDate('10/01/27', TODAY)).toBe('2027-01-10');
  });

  it('sem ano, usa a próxima ocorrência', () => {
    expect(findDate('15/10', TODAY)).toBe('2026-10-15');
    expect(findDate('14/10', TODAY)).toBe('2027-10-14');
  });

  it('ignora datas impossíveis e frações', () => {
    expect(findDate('31/02', TODAY)).toBeUndefined();
    expect(findDate('1/2 entrada', TODAY)).toBe('2027-02-01');
    expect(findDate('sem data', TODAY)).toBeUndefined();
  });
});

describe('findTimes', () => {
  it('lê os formatos comuns', () => {
    expect(findTimes('das 20h às 23h30')).toEqual(['20:00', '23:30']);
    expect(findTimes('abertura 19:30h')).toEqual(['19:30']);
    expect(findTimes('às 9h')).toEqual(['09:00']);
  });

  it('não confunde data ou preço com horário', () => {
    expect(findTimes('21/11 · R$ 30,00')).toEqual([]);
  });
});

describe('findPrice', () => {
  it('valor único, faixa e a partir de', () => {
    expect(findPrice('Ingresso R$ 30')).toEqual({ kind: 'fixed', amountCents: 3000 });
    expect(findPrice('Meia R$ 20,00 | Inteira R$ 40,00')).toEqual({ kind: 'range', minCents: 2000, maxCents: 4000 });
    expect(findPrice('A partir de R$ 1.200,50')).toEqual({ kind: 'from', amountCents: 120050 });
  });

  it('gratuito só com pista clara', () => {
    expect(findPrice('Entrada franca!')).toEqual({ kind: 'free' });
    expect(findPrice('Evento GRÁTIS')).toEqual({ kind: 'free' });
    expect(findPrice('Show na praça')).toBeUndefined();
  });

  it('valor manda mais que "grátis" solto', () => {
    expect(findPrice('Grátis até 22h, depois R$ 15')).toEqual({ kind: 'fixed', amountCents: 1500 });
  });
});

describe('links e categoria', () => {
  it('reconhece bilheterias', () => {
    expect(isTicketingUrl('https://www.sympla.com.br/evento/x/123')).toBe(true);
    expect(isTicketingUrl('https://instagram.com/p/abc')).toBe(false);
    expect(isTicketingUrl('não é link')).toBe(false);
  });

  it('chuta a categoria pelas palavras', () => {
    expect(guessCategory('Roda de Samba no Galpão')).toBe('shows-musica');
    expect(guessCategory('Feira de artesanato e brechó')).toBe('feiras-comunidades');
    expect(guessCategory('Reunião de condomínio')).toBeUndefined();
  });

  it('decodifica entidades', () => {
    expect(decodeEntities('Forr&oacute; &amp; Cia &#8211; 2&#x00AA;')).toBe('Forró & Cia – 2ª');
  });
});

describe('extractFromHtml', () => {
  const page = `<!doctype html><html><head>
    <title>Ignorado</title>
    <meta property="og:title" content="Título OG">
    <script type="application/ld+json">
    {"@context":"https://schema.org","@graph":[
      {"@type":"Organization","name":"Site"},
      {"@type":"MusicEvent","name":"Samba da Tia &amp; Convidados",
       "startDate":"2026-11-21T21:00:00-03:00","endDate":"2026-11-22T02:00:00-03:00",
       "description":"<p>Roda de samba</p>",
       "location":{"@type":"Place","name":"Galpão 17","address":{"streetAddress":"SIA Trecho 17","addressLocality":"Brasília"}},
       "organizer":{"name":"Produtora X"},
       "offers":[{"price":"20.00","priceCurrency":"BRL","url":"https://www.sympla.com.br/samba"},{"price":"40","priceCurrency":"BRL"}]}
    ]}
    </script></head><body></body></html>`;

  it('lê o evento do JSON-LD', () => {
    expect(extractFromHtml(page, 'https://exemplo.test/samba')).toEqual({
      sourceUrl: 'https://exemplo.test/samba',
      title: 'Samba da Tia & Convidados',
      description: 'Roda de samba',
      startsAtLocal: '2026-11-21T21:00',
      endsAtLocal: '2026-11-22T02:00',
      timeConfirmed: true,
      venueName: 'Galpão 17',
      venueAddress: 'SIA Trecho 17, Brasília',
      organizerName: 'Produtora X',
      price: { kind: 'range', minCents: 2000, maxCents: 4000 },
      ticketUrl: 'https://www.sympla.com.br/samba',
    });
  });

  it('converte horário UTC para Brasília e marca só data como horário a confirmar', () => {
    const utc = extractFromHtml(
      '<script type="application/ld+json">{"@type":"Event","name":"X","startDate":"2026-11-22T00:00:00Z"}</script>',
      'https://exemplo.test',
    );
    expect(utc.startsAtLocal).toBe('2026-11-21T21:00');
    const dateOnly = extractFromHtml(
      '<script type="application/ld+json">{"@type":"Event","name":"X","startDate":"2026-11-21"}</script>',
      'https://exemplo.test',
    );
    expect(dateOnly).toMatchObject({ startsAtLocal: '2026-11-21T00:00', timeConfirmed: false });
  });

  it('avisa cancelamento e trata oferta zerada como gratuita', () => {
    const r = extractFromHtml(
      '<script type="application/ld+json">[{"@type":"Event","name":"X","eventStatus":"https://schema.org/EventCancelled","offers":{"price":0}}]</script>',
      'https://exemplo.test',
    );
    expect(r.cancelled).toBe(true);
    expect(r.price).toEqual({ kind: 'free' });
  });

  it('sem JSON-LD, usa as meta tags; JSON quebrado não derruba a leitura', () => {
    const r = extractFromHtml(
      `<script type="application/ld+json">{quebrado</script>
       <meta content='Descri&ccedil;&atilde;o' name='description'><meta property="og:title" content="Feira do Livro">`,
      'https://exemplo.test/feira',
    );
    expect(r).toMatchObject({ title: 'Feira do Livro', description: 'Descrição' });
  });
});

describe('extractFromText', () => {
  const post = `🎶 RODA DE SAMBA DA TIA ZÉLIA 🎶
Sábado, 21/11, das 18h às 23h
📍 Galpão 17 - SIA Trecho 17, Brasília
Meia R$ 20 | Inteira R$ 40
Ingressos: https://www.sympla.com.br/roda-de-samba.
Realização: Coletivo Quintal
https://instagram.com/p/abc`;

  it('lê um post de rede social', () => {
    expect(extractFromText(post, TODAY)).toMatchObject({
      title: 'RODA DE SAMBA DA TIA ZÉLIA',
      startsAtLocal: '2026-11-21T18:00',
      endsAtLocal: '2026-11-21T23:00',
      timeConfirmed: true,
      venueName: 'Galpão 17',
      venueAddress: 'SIA Trecho 17, Brasília',
      organizerName: 'Coletivo Quintal',
      price: { kind: 'range', minCents: 2000, maxCents: 4000 },
      ticketUrl: 'https://www.sympla.com.br/roda-de-samba',
      sourceUrl: 'https://instagram.com/p/abc',
    });
  });

  it('data sem horário fica a confirmar', () => {
    expect(extractFromText('Feira de trocas\nDomingo 6 de dezembro', TODAY)).toMatchObject({
      title: 'Feira de trocas',
      startsAtLocal: '2026-12-06T00:00',
      timeConfirmed: false,
    });
  });
});

describe('combineExtractions', () => {
  it('página primeiro, texto completa; horário segue a origem da data', () => {
    const { data, origins } = combineExtractions(
      { title: 'Da página', startsAtLocal: '2026-11-21T00:00', timeConfirmed: false },
      { title: 'Do texto', startsAtLocal: '2026-11-21T21:00', timeConfirmed: true, endsAtLocal: '2026-11-21T23:00', venueName: 'Galpão' },
    );
    expect(data).toMatchObject({ title: 'Da página', startsAtLocal: '2026-11-21T00:00', timeConfirmed: false, venueName: 'Galpão' });
    expect(data.endsAtLocal).toBeUndefined();
    expect(origins).toMatchObject({ title: 'página', venueName: 'texto' });
  });
});

describe('descrição a partir do texto', () => {
  it('fica só com o texto corrido', () => {
    const r = extractFromText('Sarau no Quintal\nPoesia, violão e microfone aberto.\n21/11 às 19h\nEntrada R$ 10\nhttps://exemplo.test', TODAY);
    expect(r.description).toBe('Poesia, violão e microfone aberto.');
  });
});

describe('página sem dados de evento', () => {
  it('o título genérico da página perde para o texto colado', () => {
    const page = extractFromHtml('<meta property="og:title" content="Portal de Notícias">', 'https://exemplo.test/noticia');
    const text = extractFromText('Sarau no Quintal\n📍 Quintal da Tia - QNM 1\nPoesia e violão.', TODAY);
    const { data, origins } = combineExtractions(page, text);
    expect(data).toMatchObject({ title: 'Sarau no Quintal', description: 'Poesia e violão.', sourceUrl: 'https://exemplo.test/noticia' });
    expect(origins.title).toBe('texto');
    expect('weakFields' in data).toBe(false);
  });
});
