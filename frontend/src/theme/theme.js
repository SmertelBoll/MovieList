import { createTheme } from "@mui/material/styles";
import palette from "./palette.js";
import spacing from "./spacing.js";
import typography from "./typography.js";
import breakpoints from "./breakpoints.js";

export const getTheme = (mode) =>
  createTheme({
    palette: palette(mode),
    typography,
    spacing,
    shadows: [
      ...createTheme({}).shadows.map((shadow, i) => (i === 0 ? "4px 4px 24px rgba(0, 0, 0, 0.25)" : shadow)),
    ],
    breakpoints,
    zIndex: {
      modal: 1000, // Знижуємо для Dialog
    },
  });
