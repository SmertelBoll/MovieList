// Contrast pair for text on any color (rating levels, chips). Exported separately: needed in pure utils
// without theme access.
export const CONTRAST_DARK = "#0C1618";
export const CONTRAST_LIGHT = "#FAF8FF";

const YELLOW_MAIN = "#F9F919";
const YELLOW_DARK = "#F2DB0B";
// Scrollbar track. The same value is hardcoded in styles/index.css for the page scroll: keep them equal so
// all bars look the same.
const SCROLLBAR_TRACK = "#363636";

// Tokens identical in both themes, kept in one place: duplicated in light and dark, a change easily landed in
// only one branch.
const SHARED = {
  scrollbar: {
    track: SCROLLBAR_TRACK,
    thumb: YELLOW_MAIN,
    thumbHover: YELLOW_DARK,
  },
  yellow: {
    main: YELLOW_MAIN,
    dark: YELLOW_DARK,
    // Yellow is light in every theme, so text and icons on it are ALWAYS dark. Site-wide rule.
    contrastText: CONTRAST_DARK,
    disabled: "#d8d87a",
    disabledText: "#5c5c33",
  },
  primary: {
    main: "#ffeb3b",
    dark: "#F2DB0B",
    light: "#ffef62",
  },
  status: {
    planned: "#8fa0f5",
    watching: "#7ed48a",
    watched: "#ffd240",
    dropped: "#ff7b6b",
    skipped: "#b4b4c4",
  },
  // Semi-transparent layers over images. Deliberately theme-independent: a light scrim on a dark poster
  // doesn't work.
  overlay: {
    strong: "rgba(0,0,0,0.8)",
    medium: "rgba(0,0,0,0.75)",
    soft: "rgba(0,0,0,0.7)",
    scrim: "rgba(0,0,0,0.45)",
    hairline: "rgba(0,0,0,0.2)",
    none: "rgba(0,0,0,0)",
    onImage: "#FAF8FF",
    chip: "rgba(255,255,255,0.2)",
    chipSubtle: "rgba(255,255,255,0.05)",
  },
  // Episode heat-map scale: same colors in both themes, except the neutral cell (cell/cellText): a grid of white
  // squares glares in dark, so it's set separately below.
  rating: {
    awesome: "#1b5e20",
    great: "#4caf50",
    good: "#fbc02d",
    regular: "#ff9800",
    bad: "#f44336",
    garbage: "#9c27b0",
    empty: "rgba(255,255,255,0)",
  },
  danger: {
    main: "#dd3333",
    dark: "#b32020",
    contrastText: "#FAF8FF",
  },
  // Buttons in swal2 dialogs (rendered outside the React tree)
  action: {
    confirm: "#3085d6",
  },
};

const palette = (mode) => {
  if (mode === "light")
    return {
      ...SHARED,
      mode: "light",
      bg: {
        main: "#e6e4da",
        second: "#FAF8FF",
        selected: "#cccccc",
        reverseSecond: "#363636",
      },
      text: {
        main: CONTRAST_DARK,
        second: "#696969",
        dark: CONTRAST_DARK,
        white: CONTRAST_LIGHT,
      },
      rating: { ...SHARED.rating, cell: "#ffffff", cellText: CONTRAST_DARK },
    };

  return {
    ...SHARED,
    mode: "dark",
    bg: {
      main: "#363636",
      second: "#171717",
      selected: "#595959",
      reverseSecond: "#FAF8FF",
    },
    text: {
      main: CONTRAST_LIGHT,
      second: "#999999",
      dark: CONTRAST_DARK,
      white: CONTRAST_LIGHT,
    },
    // Dark cell with a light mark, otherwise the grid glares white
    rating: { ...SHARED.rating, cell: "#1f1f1f", cellText: CONTRAST_LIGHT },
  };
};

export default palette;
