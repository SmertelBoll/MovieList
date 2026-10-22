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
    // How far a card lifts on hover: one value for the whole site (it used to be scattered -2px/-3px/-4px).
    // From the spacing scale: spacing(1) = 8px.
    hoverLift: `translateY(-${spacing(1)})`,
    zIndex: {
      modal: 1000,
    },
    components: {
      // Site-wide rule: yellow background -> dark text and icons; selected + hover -> darker yellow.
      // Checkbox defaults to primary (yellow), invisible on light forms: drive it from text.main.
      MuiCheckbox: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.second,
            "&.Mui-checked": {
              color: theme.palette.text.main,
            },
          }),
        },
      },
      // Date picker calendar. Without this it uses MUI defaults: a light backdrop in dark theme and a yellow
      // accent with light text.
      MuiPickersPopper: {
        styleOverrides: {
          paper: ({ theme }) => ({
            backgroundColor: theme.palette.bg.second,
            backgroundImage: "none",
            color: theme.palette.text.main,
            border: "1px solid",
            borderColor: theme.palette.bg.selected,
          }),
        },
      },
      // Date picker Cancel / OK default to primary: yellow text on white is unreadable. Theme text color; yellow
      // background + dark text on hover/focus.
      // The action bar is a DialogActions (class MuiPickersLayout-actionBar), not a theme slot: styled via a nested
      // selector from root.
      MuiPickersLayout: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiPickersLayout-actionBar .MuiButton-root": {
              color: theme.palette.text.main,
              "&:focus-visible": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
              // Hover only on devices with a cursor: it sticks after a touch on phones
              "@media (hover: hover) and (pointer: fine)": {
                "&:hover": {
                  backgroundColor: theme.palette.yellow.main,
                  color: theme.palette.yellow.contrastText,
                },
              },
            },
          }),
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.main,
            "@media (hover: hover) and (pointer: fine)": {
              "&:hover": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
              "&:focus": {
                backgroundColor: theme.palette.yellow.dark,
                color: theme.palette.yellow.contrastText,
              },
              "@media (hover: hover) and (pointer: fine)": {
                "&:hover": {
                  backgroundColor: theme.palette.yellow.dark,
                  color: theme.palette.yellow.contrastText,
                },
              },
            },
            "&.MuiPickersDay-today": {
              borderColor: theme.palette.text.main,
            },
          }),
        },
      },
      MuiPickersCalendarHeader: {
        styleOverrides: {
          root: ({ theme }) => ({ color: theme.palette.text.main }),
          label: ({ theme }) => ({ color: theme.palette.text.main }),
          switchViewButton: ({ theme }) => ({ color: theme.palette.text.main }),
        },
      },
      MuiPickersArrowSwitcher: {
        styleOverrides: {
          button: ({ theme }) => ({ color: theme.palette.text.main }),
        },
      },
      MuiDayCalendar: {
        styleOverrides: {
          weekDayLabel: ({ theme }) => ({ color: theme.palette.text.second }),
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: ({ theme }) => ({
            "@media (hover: hover) and (pointer: fine)": {
              "&:hover": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
              // After a touch the item stays :hover and MUI's ".Mui-selected:hover" (@media (hover: none)) paints it
              // pale with higher specificity; same selector here, in yellow.
              "&:hover": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
              "@media (hover: hover) and (pointer: fine)": {
                "&:hover": {
                  backgroundColor: theme.palette.yellow.dark,
                  color: theme.palette.yellow.contrastText,
                },
              },
            },
            "&.Mui-focusVisible, &.Mui-selected.Mui-focusVisible": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
            },
          }),
        },
      },
      MuiTypography: {
        defaultProps: {
          // Custom variants without this map render as <span>: headings would lose both semantics and block
          // behavior.
          variantMapping: {
            heroTitle: "h1",
            sectionTitle: "h2",
            heroSubtitle: "p",
            cardTitle: "h3",
            p: "p",
            desc1: "p",
            desc2: "p",
            logo: "span",
          },
        },
      },
    },
  });
