const theme = {
  colors: {
    primary: '#1E3A5F',
    primaryDark: '#0F172A',
    primaryLight: '#2D4A6B',
    accent: '#CD7F32',
    accentGold: '#D4AF37',
    accentLight: '#E8C28A',
    background: '#FFFEF0',
    backgroundCream: '#FAF3E0',
    backgroundLight: '#FFFEF8',
    text: '#1E3A5F',
    textLight: '#FFFEF0',
    textDark: '#0F172A',
  },
} as const;

export type ThemeColors = typeof theme.colors;
export type ThemeConfig = typeof theme;

export function getThemeColor(colorName: string): string | undefined {
  const color = theme.colors[colorName as keyof ThemeColors];
  return typeof color === 'string' ? color : undefined;
}

export function getTheme(): ThemeConfig {
  return theme;
}

export function getColorNames(): string[] {
  return Object.keys(theme.colors);
}

export function hasThemeColor(colorName: string): boolean {
  return getThemeColor(colorName) !== undefined;
}

export function getThemeColorVar(colorName: string): string {
  const color = getThemeColor(colorName);
  if (!color) return '';
  const cssVar = `--color-${colorName}`;
  return `var(${cssVar})`;
}
