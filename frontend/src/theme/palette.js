// Контрастна пара для тексту поверх довільного кольору (рівні оцінок, чіпи).
// Експортується окремо, бо потрібна і в чистих утилітах без доступу до теми.
export const CONTRAST_DARK = "#0C1618";
export const CONTRAST_LIGHT = "#FAF8FF";

const YELLOW_MAIN = "#F9F919";
const YELLOW_DARK = "#F2DB0B";
// Доріжка смуги прокрутки. Те саме значення захардкоджене в styles/index.css
// для скролу сторінки — тримаємо їх однаковими, щоб усі смуги виглядали як одна.
const SCROLLBAR_TRACK = "#363636";

// Токени, однакові в обох темах. Тримаємо їх в одному місці, бо коли вони
// дублювалися в light і dark, зміна легко потрапляла лише в одну гілку.
const SHARED = {
  // Смуги прокрутки — жовті в обох темах, як основний скрол сторінки
  scrollbar: {
    track: SCROLLBAR_TRACK,
    thumb: YELLOW_MAIN,
    thumbHover: YELLOW_DARK,
  },
  yellow: {
    main: YELLOW_MAIN,
    dark: YELLOW_DARK,
    // Жовтий — світлий у будь-якій темі, тож текст та іконки поверх нього
    // ЗАВЖДИ темні. Це правило діє на весь сайт.
    contrastText: CONTRAST_DARK,
    // Заблокована кнопка: приглушений жовтий, але текст лишається читабельним
    disabled: "#d8d87a",
    disabledText: "#5c5c33",
  },
  primary: {
    main: "#ffeb3b", // Використовуємо жовтий колір
    dark: "#F2DB0B",
    light: "#ffef62",
  },
  // Статуси папок. Світлі відтінки з темним текстом — читаються в обох темах
  status: {
    planned: "#8fa0f5",
    watching: "#7ed48a",
    watched: "#ffd240",
    dropped: "#ff7b6b",
  },
  // Напівпрозорі шари поверх зображень. Навмисно не залежать від теми:
  // світлий скрим на темному постері не працює
  overlay: {
    strong: "rgba(0,0,0,0.8)",
    medium: "rgba(0,0,0,0.75)",
    soft: "rgba(0,0,0,0.7)",
    scrim: "rgba(0,0,0,0.45)",
    hairline: "rgba(0,0,0,0.2)",
    none: "rgba(0,0,0,0)",
    onImage: "#FAF8FF",
    // Чіпи поверх темного героя
    chip: "rgba(255,255,255,0.2)",
    chipSubtle: "rgba(255,255,255,0.05)",
  },
  // Шкала оцінок у тепловій карті епізодів. Самі кольори шкали однакові
  // в обох темах, а от нейтральна клітинка (cell/cellText) — ні: у темній
  // темі сітка з білих квадратів сліпить, тож вона задається окремо нижче.
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
  // Кнопки в діалогах swal2 (рендеряться поза деревом React)
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
      // Нейтральна клітинка теплової карти (без оцінки / чекбокс)
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
    // Темна клітинка зі світлим значком — інакше сітка світиться білим
    rating: { ...SHARED.rating, cell: "#1f1f1f", cellText: CONTRAST_LIGHT },
  };
};

export default palette;
