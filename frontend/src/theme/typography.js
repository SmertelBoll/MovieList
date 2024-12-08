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
  fontFamily: "Kanit",
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
