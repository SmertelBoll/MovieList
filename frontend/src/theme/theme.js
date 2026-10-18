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
    // Наскільки картка піднімається при наведенні. Одне значення на весь сайт —
    // до цього по коду було розкидано -2px, -3px і -4px. Береться зі шкали
    // відступів, тож без хардкоду: spacing(1) = 8px.
    hoverLift: `translateY(-${spacing(1)})`,
    zIndex: {
      modal: 1000, // Знижуємо для Dialog
    },
    components: {
      // Загальне правило сайту: жовтий фон -> темний текст та іконки.
      // Вибране + наведення -> темніший жовтий (щоб було видно різницю).
      // Іконки MUI успадковують color, тож стрілки й галочки темніють самі.
      // Чекбокс за замовчуванням фарбується в primary (жовтий) — на світлому
      // тлі форми його не видно. Ведемо від text.main: темний у світлій темі,
      // світлий у темній, тож контраст є завжди.
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
      // Календар вибору дати. Без цього він малюється дефолтними стилями MUI:
      // світла підкладка в темній темі й жовтий акцент зі світлим текстом.
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
      // Кнопки Cancel / OK у вікні вибору дати (на телефоні календар відкривається модально).
      // За замовчуванням вони кольору primary — жовтий текст на білому не читається.
      // Текст — звичайний колір теми, а на наведенні/фокусі — жовтий фон з темним текстом (правило сайту).
      // Панель дій — це DialogActions із класом MuiPickersLayout-actionBar, а не слот теми, тому
      // стилізуємо її вкладеним селектором із root (ключ actionBar у styleOverrides не існує).
      MuiPickersLayout: {
        styleOverrides: {
          root: ({ theme }) => ({
            "& .MuiPickersLayout-actionBar .MuiButton-root": {
              color: theme.palette.text.main,
              "&:hover, &:focus-visible": {
                backgroundColor: theme.palette.yellow.main,
                color: theme.palette.yellow.contrastText,
              },
            },
          }),
        },
      },
      MuiPickersDay: {
        styleOverrides: {
          root: ({ theme }) => ({
            color: theme.palette.text.main,
            "&:hover": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
              "&:hover, &:focus": {
                backgroundColor: theme.palette.yellow.dark,
                color: theme.palette.yellow.contrastText,
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
            "&:hover": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
            },
            "&.Mui-selected": {
              backgroundColor: theme.palette.yellow.main,
              color: theme.palette.yellow.contrastText,
              "&:hover": {
                backgroundColor: theme.palette.yellow.dark,
                color: theme.palette.yellow.contrastText,
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
          // Кастомні варіанти без цієї мапи рендеряться як <span> —
          // заголовки втратили б і семантику, і блокову поведінку
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
