const tintColorLight = '#4f46e5'; // Indigo-600
const tintColorDark = '#818cf8'; // Indigo-400

export default {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#8e8e93',
    tabIconSelected: tintColorLight,
    border: '#e5e5ea',
    muted: '#8e8e93',
    surface: '#f2f2f7',
    danger: '#ff3b30',
    success: '#34c759',
    card: '#ffffff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0b0b0f',
    tint: tintColorDark,
    tabIconDefault: '#8e8e93',
    tabIconSelected: tintColorDark,
    border: '#38383a',
    muted: '#8e8e93',
    surface: '#1c1c1e',
    danger: '#ff453a',
    success: '#32d74b',
    card: '#1c1c1e',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};
