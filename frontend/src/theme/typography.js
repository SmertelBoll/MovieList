const MAXWIDTH = 1920;
const MINWIDTH = 320;

const largeFormula = (minSize, maxSize) => {
  return `calc(${minSize}px + ${maxSize - minSize} * (100vw / ${MAXWIDTH}))`;
};
const smallFormula = (minSize, maxSize) => {
  return `calc(${minSize}px + (${maxSize - minSize} + ${maxSize - minSize
    } * 0.7) * ((100vw - ${MINWIDTH}px) / ${MAXWIDTH}))`;
};

const typography = {
  fontFamily: "Kanit, Rubik, sans-serif",
  h1: {
    fontSize: smallFormula(48, 96),
    "@media (min-width:767px)": {
      fontSize: largeFormula(48, 96),
    },
    fontWeight: 600,
  },
  h2: {
    fontSize: smallFormula(24, 36),
    "@media (min-width:767px)": {
      fontSize: largeFormula(24, 36),
    },
    fontWeight: 600,
  },
  p: {
    fontSize: smallFormula(16, 28),
    "@media (min-width:767px)": {
      fontSize: largeFormula(16, 28),
    },
    fontWeight: 400,
    textTransform: "unset",
  },
  // description
  desc1: {
    fontSize: 20,
    fontWeight: 400,
    textTransform: "unset",
  },
  desc2: {
    fontSize: 14,
    fontWeight: 400,
    textTransform: "unset",
  },
  // Заголовок секції всередині сторінки (Cast, Crew, Timeline, My review...).
  // Стандартний h5 (1.5rem) завеликий на вузьких екранах.
  sectionTitle: {
    fontSize: "1.25rem",
    "@media (min-width:600px)": { fontSize: "1.5rem" },
    fontWeight: 500,
    textTransform: "unset",
  },
  // Назва сторінки в героєві (фільм, актор, компанія, жанр)
  heroTitle: {
    fontSize: "1.5rem",
    "@media (min-width:600px)": { fontSize: "2.125rem" },
    "@media (min-width:960px)": { fontSize: "3rem" },
    fontWeight: 700,
    lineHeight: 1.2,
    textTransform: "unset",
  },
  // Рядок під назвою в героєві
  heroSubtitle: {
    fontSize: "0.95rem",
    "@media (min-width:600px)": { fontSize: "1.25rem" },
    fontWeight: 400,
    textTransform: "unset",
  },
  // Назва в картці списку
  cardTitle: {
    fontSize: "0.95rem",
    "@media (min-width:600px)": { fontSize: "1.25rem" },
    fontWeight: 500,
    lineHeight: 1.3,
    textTransform: "unset",
  },
  logo: {
    fontSize: smallFormula(24, 44),
    "@media (min-width:767px)": {
      fontSize: largeFormula(24, 44),
    },
    fontWeight: 700,
  },
  button: {
    fontSize: smallFormula(16, 20),
    "@media (min-width:767px)": {
      fontSize: largeFormula(16, 20),
    },
    fontWeight: 400,
    textTransform: "unset",
  },
};

export default typography;
