/**
 * Política de privacidade e termos de uso: um texto só para o site e o app.
 * Os prazos de guarda espelham supabase/migrations/20261022120000_retention.sql
 * (e os 30 dias de 20261021120000_automations.sql); os dois precisam mudar juntos.
 */

export const LEGAL_CONTROLLER = 'Marcelo Henrique Silva Costa';
export const LEGAL_CONTACT_EMAIL = 'marcelohsc7@gmail.com';

export const RETENTION = {
  submissionEmailDays: 180,
  reportDetailsYears: 1,
  historyYears: 2,
  rateLimitHours: 24,
  archivedAfterDays: 30,
} as const;

export type LegalSection = { heading: string; paragraphs?: string[]; items?: string[] };
export type LegalDocument = { slug: 'privacidade' | 'termos'; title: string; updatedAt: string; sections: LegalSection[] };

const R = RETENTION;

export const PRIVACY_POLICY: LegalDocument = {
  slug: 'privacidade',
  title: 'Política de privacidade',
  updatedAt: '2026-10-22',
  sections: [
    {
      heading: 'Quem é o responsável',
      paragraphs: [
        `O Rowlê é mantido por ${LEGAL_CONTROLLER}, responsável (controlador) pelos dados pessoais tratados no app, no site e no painel da curadoria.`,
        `Contato para assuntos de privacidade: ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: 'Usar o app',
      paragraphs: [
        'O app não tem cadastro nem login. Não pedimos nome, e-mail, telefone, CPF, data de nascimento ou localização.',
        'Os rolês salvos e a região preferida ficam só no seu aparelho. Não são enviados para nós; somem se você apagar os dados do app ou desinstalá-lo.',
        'Para mostrar a programação, o app consulta nosso banco de dados. Como em qualquer acesso à internet, o provedor registra dados técnicos da conexão, como endereço IP e horário.',
        'O app não usa publicidade, ferramentas de análise de uso nem rastreamento entre apps.',
      ],
    },
    {
      heading: 'Denúncias',
      paragraphs: [
        'A denúncia é anônima. Guardamos o motivo, o evento e o texto que você escrever. Não escreva dados pessoais no texto.',
        `Para evitar abuso, guardamos por ${R.rateLimitHours} horas um código gerado a partir do seu endereço IP (não o IP em si), usado só para limitar o número de envios.`,
        `O texto da denúncia é apagado ${R.reportDetailsYears} ano depois que ela é resolvida ou descartada.`,
      ],
    },
    {
      heading: 'Sugestões de evento',
      paragraphs: [
        'Ao divulgar um rolê, você envia os dados do evento e, se quiser, um e-mail de contato. O e-mail é usado só para falar sobre aquele envio e nunca aparece no app.',
        `O e-mail é apagado ${R.submissionEmailDays} dias depois que a sugestão é aceita ou recusada. O protocolo e o código de acompanhamento servem para consultar a situação; guardamos só uma versão cifrada do código.`,
        `Vale a mesma regra das denúncias para o limite de envios: código derivado do IP, apagado em ${R.rateLimitHours} horas.`,
      ],
    },
    {
      heading: 'Equipe da curadoria',
      paragraphs: [
        'Quem trabalha na curadoria entra com e-mail e senha. Registramos quem fez cada alteração no catálogo, para corrigir erros e responder por elas.',
        `O histórico de alterações é guardado por ${R.historyYears} anos.`,
      ],
    },
    {
      heading: 'Para que usamos os dados',
      items: [
        'Mostrar a programação e manter o catálogo correto.',
        'Analisar denúncias e sugestões e responder quem pediu contato.',
        'Proteger o serviço contra abuso e acesso indevido.',
      ],
      paragraphs: [
        'As bases legais são o legítimo interesse em manter um catálogo confiável e seguro e, nas sugestões, o seu próprio pedido. Não vendemos dados nem os usamos para publicidade.',
      ],
    },
    {
      heading: 'Com quem compartilhamos',
      paragraphs: [
        'O banco de dados fica na Supabase, e o site fica num serviço de hospedagem. Esses provedores guardam e processam os dados em nosso nome e podem fazer isso fora do Brasil, com as garantias previstas na LGPD.',
        'Ao abrir o link de ingresso, a rota no mapa ou uma imagem de capa hospedada em outro site, você passa a usar o serviço de terceiros, que tem a própria política de privacidade.',
        'Dados podem ser entregues a autoridades quando a lei exigir.',
      ],
    },
    {
      heading: 'Eventos encerrados',
      paragraphs: [
        `Eventos saem da programação quando acabam e são arquivados ${R.archivedAfterDays} dias depois da última sessão.`,
      ],
    },
    {
      heading: 'Seus direitos',
      paragraphs: ['Pela Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode pedir:'],
      items: [
        'confirmação de que tratamos seus dados e acesso a eles;',
        'correção de dados incompletos ou errados;',
        'anonimização, bloqueio ou exclusão de dados desnecessários;',
        'informação sobre com quem compartilhamos seus dados;',
        'portabilidade, quando aplicável.',
      ],
    },
    {
      heading: 'Como pedir',
      paragraphs: [
        `Escreva para ${LEGAL_CONTACT_EMAIL}. Se o pedido for sobre uma sugestão, informe o protocolo. O atendimento é gratuito.`,
        'Você também pode procurar a Autoridade Nacional de Proteção de Dados (ANPD).',
      ],
    },
    {
      heading: 'Menores de idade',
      paragraphs: [
        'O app pode ser usado sem fornecer dados pessoais. A classificação indicativa mostrada nos eventos é do evento, não de quem usa o app.',
      ],
    },
    {
      heading: 'Mudanças nesta política',
      paragraphs: ['Quando esta política mudar, a data de atualização no topo muda junto.'],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  slug: 'termos',
  title: 'Termos de uso',
  updatedAt: '2026-10-22',
  sections: [
    {
      heading: 'O que é o Rowlê',
      paragraphs: [
        'O Rowlê reúne eventos e atividades do Distrito Federal para você descobrir o que fazer. É gratuito e funciona sem cadastro.',
        `É mantido por ${LEGAL_CONTROLLER}. Contato: ${LEGAL_CONTACT_EMAIL}.`,
      ],
    },
    {
      heading: 'Ingressos e eventos',
      paragraphs: [
        'O Rowlê não vende ingressos e não organiza os eventos. O botão de ingresso leva ao canal indicado pelo organizador ou pela bilheteria; compra, preço, meia-entrada, troca, cancelamento e reembolso seguem as regras de quem vende.',
        'Datas, horários, preços e locais vêm dos organizadores e de fontes públicas e são conferidos pela curadoria, mas podem mudar sem aviso. Confirme no canal oficial antes de sair de casa.',
        'A curadoria pode corrigir, suspender ou retirar um evento a qualquer momento, inclusive por denúncia.',
      ],
    },
    {
      heading: 'Divulgar um rolê',
      paragraphs: ['Ao enviar uma sugestão, você declara que:'],
      items: [
        'as informações são verdadeiras e o evento existe;',
        'tem direito de usar a imagem e os textos enviados, ou eles são públicos do próprio organizador;',
        'o link de ingresso é do canal oficial de venda.',
      ],
    },
    {
      heading: 'Publicação',
      paragraphs: [
        'Toda sugestão passa por revisão. A curadoria pode editar os textos, pedir mais informações ou recusar o envio, informando o motivo pelo protocolo. Publicar é gratuito e não há garantia de publicação.',
        'Eventos com golpe, conteúdo ilegal, discriminatório ou que usem imagem sem autorização são recusados ou retirados.',
      ],
    },
    {
      heading: 'Denúncias',
      paragraphs: [
        'Use a denúncia para avisar de informação errada, cancelamento, link suspeito, golpe ou conteúdo impróprio. Denúncias falsas ou repetidas em excesso são bloqueadas.',
      ],
    },
    {
      heading: 'Marca e conteúdo',
      paragraphs: [
        'O nome Rowlê, o logo e a toupeira são da marca. Textos e imagens dos eventos pertencem aos organizadores ou aos autores indicados nos créditos.',
      ],
    },
    {
      heading: 'Disponibilidade',
      paragraphs: [
        'O serviço pode ficar fora do ar para manutenção ou por falhas técnicas. O Rowlê não responde por decisões tomadas só com base nas informações do app nem por problemas com eventos e compras feitas com terceiros.',
      ],
    },
    {
      heading: 'Privacidade',
      paragraphs: ['O tratamento de dados está descrito na política de privacidade.'],
    },
    {
      heading: 'Mudanças e lei aplicável',
      paragraphs: [
        'Estes termos podem mudar; a data de atualização no topo mostra a versão em vigor. Vale a legislação brasileira, inclusive o Código de Defesa do Consumidor quando aplicável.',
      ],
    },
  ],
};

export const LEGAL_DOCUMENTS = { privacidade: PRIVACY_POLICY, termos: TERMS_OF_USE } as const;

/** "22 de outubro de 2026", sem depender do fuso do aparelho. */
export function formatLegalDate(isoDay: string): string {
  const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const [y, m, d] = isoDay.split('-').map(Number);
  return `${d} de ${months[(m ?? 1) - 1]} de ${y}`;
}
