function pxToRem(value) {
  return `${value / 16}rem`;
}

// Historical scale: integer indices must stay as they are (spacing(5) = 48px is used in MainButton). It was an array,
// which in MUI takes only integer indices (spacing(0.5) gave undefined);
// now fractions work too (8px step): p: 0.5 = 4px.
const STEPS = [0, 8, 16, 24, 32, 48, 64];

const spacing = (factor) =>
  pxToRem(
    Number.isInteger(factor) && factor >= 0 && factor < STEPS.length
      ? STEPS[factor]
      : factor * 8
  );

export default spacing;
