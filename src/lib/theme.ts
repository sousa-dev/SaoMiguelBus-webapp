/** Applies brand colours from /api/v3/bootstrap onto the CSS custom properties. */

function onColorFor(hex: string): string {
  const c = hex.replace('#', '');
  if (c.length < 6) return '#ffffff';
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Relative luminance (sRGB) — dark text on light brand, light text on dark.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1a1a1a' : '#ffffff';
}

export function applyBrandTheme(theme: {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}): void {
  const root = document.documentElement.style;
  root.setProperty('--color-primary', theme.primaryColor);
  root.setProperty('--color-on-primary', onColorFor(theme.primaryColor));
  root.setProperty('--color-secondary', theme.secondaryColor);
  root.setProperty('--color-accent', theme.accentColor);
  root.setProperty('--color-on-accent', onColorFor(theme.accentColor));
}
