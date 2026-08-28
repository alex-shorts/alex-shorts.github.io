/** Text roles. Pair with THEMES. Fonts are OFL, loaded from assets/fonts. */
export const FONTS = {
  title: '"Nunito", "Segoe UI", sans-serif',
  pixel: '"Nunito", "Segoe UI", sans-serif',
  retro: '"Nunito", "Segoe UI", sans-serif',
  display: '"Nunito", "Segoe UI", sans-serif',
  displayLg: '"Nunito", "Segoe UI", sans-serif',
  tiny: '"Nunito", "Segoe UI", sans-serif',
  body: '"Nunito", "Segoe UI", sans-serif',
  ui: '"Nunito", "Segoe UI", sans-serif',
};

const CLEAR = '"Nunito", "Segoe UI", sans-serif';

/** Large, smooth UI type for the HD brawler. */
export function clearStyle(color, px) {
  return {
    fontFamily: CLEAR,
    fontSize: `${px}px`,
    color,
    resolution: 3,
  };
}

export function textStyle(theme, role = "body") {
  const ink = "#" + theme.ink.toString(16).padStart(6, "0");
  const muted = "#" + theme.muted.toString(16).padStart(6, "0");
  const accent = "#" + theme.accent.toString(16).padStart(6, "0");
  const map = {
    title: { fontFamily: FONTS.title, fontSize: "10px", color: ink, lineSpacing: 8 },
    subtitle: { fontFamily: FONTS.pixel, fontSize: "14px", color: accent },
    body: { fontFamily: FONTS.body, fontSize: "13px", color: ink, wordWrap: { width: 280 } },
    ui: { fontFamily: FONTS.ui, fontSize: "13px", color: ink },
    caption: { fontFamily: FONTS.tiny, fontSize: "12px", color: muted },
    battle: { fontFamily: FONTS.pixel, fontSize: "13px", color: ink },
    score: { fontFamily: FONTS.display, fontSize: "22px", color: accent },
    dialogue: { fontFamily: FONTS.body, fontSize: "14px", color: ink, wordWrap: { width: 360 } },
  };
  return { ...map[role] };
}
