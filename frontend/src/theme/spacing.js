function pxToRem(value) {
  return `${value / 16}rem`;
}

// Історична шкала проєкту. Цілі індекси мають лишатися саме такими:
// напр. spacing(5) = 48px використовується в MainButton.
const STEPS = [0, 8, 16, 24, 32, 48, 64];

// Раніше це був масив. Масив у MUI підтримує ТІЛЬКИ цілі індекси:
// spacing(0.5) давало undefined, і властивість мовчки зникала з CSS.
// Через це по коду розповзлися обхідні значення на кшталт py: '6px'.
//
// Функція зберігає всі цілі значення байт-у-байт і додатково дозволяє дробові
// (крок 8px), тож p: 0.5 = 4px, gap: 1.5 = 12px.
const spacing = (factor) =>
  pxToRem(
    Number.isInteger(factor) && factor >= 0 && factor < STEPS.length
      ? STEPS[factor]
      : factor * 8
  );

export default spacing;
