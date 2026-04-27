export const colors = {
  primary: '#2D6A4F',
  primaryLight: '#40916C',
  primaryDark: '#1B4332',

  accent: '#F4A261',
  accentLight: '#FFDDD2',

  danger: '#E63946',
  dangerLight: '#FDECEA',

  warning: '#F4A261',
  warningLight: '#FFF3E0',

  success: '#52B788',
  successLight: '#E8F5E9',

  info: '#4A90D9',
  infoLight: '#E3F0FC',

  background: '#F4F6F3',
  surface: '#FFFFFF',
  surfaceSecondary: '#F0F2F0',

  textPrimary: '#1B2E1F',
  textSecondary: '#5A6B5D',
  textDisabled: '#9CA89E',
  textInverse: '#FFFFFF',

  border: '#DDE3DD',
  borderLight: '#EEF1EE',

  overlay: 'rgba(0,0,0,0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyBold: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  captionBold: { fontSize: 13, fontWeight: '600' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
