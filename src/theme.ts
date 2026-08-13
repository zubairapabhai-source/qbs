/**
 * Quran, Bible and Science — design tokens.
 * Deep emerald-and-gold Islamic palette (parchment, jade, gold, cream).
 * Replaces the earlier midnight-blue theme per user feedback.
 */
export const colors = {
  // surfaces — deep forest emerald with cream undertones
  bg: '#0E2A22',                 // brighter forest emerald
  bgElevated: '#163E33',
  bgOverlay: 'rgba(14, 42, 34, 0.86)',
  card: '#1B4A3C',
  cardHi: '#235847',
  cardBorder: 'rgba(212, 185, 106, 0.22)',     // gold tint
  cardBorderHi: 'rgba(212, 185, 106, 0.45)',
  divider: 'rgba(212, 185, 106, 0.16)',

  // silver — cool accent (used sparingly)
  silver: '#D4E0CE',
  silverHi: '#EBF1E5',
  silverDim: '#9DAD9A',
  silverDeep: '#71867F',

  // gold — primary accent (replaces white headings)
  gold: '#E8C66A',
  goldHi: '#F5DD8C',
  goldDeep: '#A8862F',

  // domain accents (warm, varied for tile gradients)
  emerald: '#4FA381',
  emeraldHi: '#7BD0A5',
  emeraldDeep: '#26684F',
  cyan: '#5BB3C2',
  cyanHi: '#8FE0EC',
  cyanDeep: '#2D7A87',
  rose: '#D17A7A',
  roseHi: '#EFB1B1',
  roseDeep: '#8C4B4B',
  amber: '#E2A957',
  amberHi: '#F7CE8A',
  amberDeep: '#9B6F2E',
  violet: '#9F8AC6',
  violetHi: '#C2B0E6',
  violetDeep: '#5E4C82',

  // text
  text: '#F6F4E8',               // warm cream
  textDim: '#C9D5C1',
  textMuted: '#8FA188',
  parchment: '#F4E9C9',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const radius = { sm: 6, md: 10, lg: 14, xl: 22, pill: 999 };

export const type = {
  micro: { fontSize: 9, letterSpacing: 1.2, fontWeight: '700' as const, textTransform: 'uppercase' as const },
  tiny: { fontSize: 11, letterSpacing: 0.2 },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 1.4, textTransform: 'uppercase' as const },
  small: { fontSize: 13, lineHeight: 19 },
  body: { fontSize: 14, lineHeight: 22 },
  bodyLarge: { fontSize: 15, lineHeight: 24 },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '700' as const },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '800' as const },
  arabic: { fontSize: 20, lineHeight: 36, fontWeight: '500' as const },
  arabicLarge: { fontSize: 24, lineHeight: 42, fontWeight: '500' as const },
  caption: { fontSize: 12 },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
};
