function pxToRem(value) {
  return `${value / 16}rem`;
}

const spacing = [pxToRem(0), pxToRem(8), pxToRem(16), pxToRem(24), pxToRem(32), pxToRem(48), pxToRem(64)];

export default spacing;
