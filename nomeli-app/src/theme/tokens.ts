// Nomeli brand tokens. Soft food-inspired palette: cream/off-white base,
// avocado green accents used sparingly (not a bright-green UI), calm and
// premium rather than "supermarket loyalty app".

export const color = {
  // backgrounds
  background: '#FBF6EE',
  backgroundAlt: '#F3EBDA',
  surface: '#FFFFFF',
  surfaceSunken: '#F6F0E4',

  // green family
  avocado: '#5C8A5A',
  avocadoDark: '#33604A',
  avocadoDarker: '#264A39',
  sage: '#A9C9A0',
  sageSoft: '#E4EFDF',
  leafHighlight: '#C9D96A',

  // ink / neutrals (warm-biased, not pure grey)
  ink: '#2B2A26',
  inkDim: '#6F6B5F',
  inkFaint: '#A6A192',
  line: '#E9E1D0',
  lineStrong: '#D8CDB4',

  // urgency (restrained — not aggressively red unless truly urgent)
  urgentToday: '#B65036',
  urgentTodaySoft: '#F6DDD3',
  urgentTomorrow: '#C97F35',
  urgentTomorrowSoft: '#F6E8D2',
  urgentSoon: '#B69A3B',
  urgentSoonSoft: '#F2EBD3',
  neutralLater: '#6F6B5F',
  neutralLaterSoft: '#EFEAE0',

  white: '#FFFFFF',
  overlay: 'rgba(43,42,38,0.45)',
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const font = {
  // Baloo 2: rounded, friendly display face for the wordmark and headings —
  // matches the softer, more illustrated character-led direction.
  // Caveat: a casual handwriting face used ONLY for the small hand-drawn
  // annotations ("Tap me for details!"), never for real UI copy.
  // Body text stays on the system stack for legibility at small sizes.
  display: 'Baloo2_700Bold',
  displaySemiBold: 'Baloo2_600SemiBold',
  hand: 'Caveat_600SemiBold',
  body: undefined, // system default
} as const;

export const type = {
  wordmark: { fontFamily: font.display, fontSize: 40, lineHeight: 44 },
  hero: { fontFamily: font.display, fontSize: 26, lineHeight: 32 },
  h1: { fontFamily: font.display, fontSize: 22, lineHeight: 28 },
  h2: { fontFamily: font.displaySemiBold, fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, lineHeight: 21, fontWeight: '600' as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
  hand: { fontFamily: font.hand, fontSize: 17, lineHeight: 20 },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#2B2A26',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;
