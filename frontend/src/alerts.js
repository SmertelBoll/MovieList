import Swal from "sweetalert2";
import "./styles/swal.css";
import palette from "./theme/palette";

// swal2 рендериться поза деревом React, тож useTheme тут недоступний.
// Читаємо режим із того самого ключа localStorage, що й ConfigSlice,
// і беремо кольори з тієї ж палітри — щоб вікна не лишалися світлими в темній темі.
const getColors = () => {
  const mode = window.localStorage.getItem("MovieList-mode") || "light";
  const p = palette(mode);
  return {
    color: p.text.main,
    background: p.bg.second,
    confirmButtonColor: p.action.confirm,
    cancelButtonColor: p.danger.main,
  };
};

const baseProps = () => {
  const { color, background } = getColors();
  return { showConfirmButton: false, color, background };
};

export const alertError = (err, title, msg) => {
  let finishTitle = title || err?.response?.data?.title || "Validation error"
  let finishMsg = msg || err?.response?.data?.message || err?.response?.data[0]?.msg

  Swal.fire({
    ...baseProps(),
    icon: "error",
    title: finishTitle,
    text: finishMsg,
  });

};

export const alertSuccess = (title) => {
  Swal.fire({
    ...baseProps(),
    timer: 2500,
    icon: "success",
    title: title,
  });
};

// Введення тексту навмисно НЕ через swal2 — для цього є useTextPrompt
// (components/_customMUI/useTextPrompt.jsx). Тут лишаються тільки повідомлення
// та підтвердження.

export const alertConfirm = (title, funcIfTrue) => {
  const { confirmButtonColor, cancelButtonColor } = getColors();

  Swal.fire({
    ...baseProps(),
    icon: "question",
    title: title,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonColor,
    cancelButtonColor,
  }).then((result) => {
    if (result.isConfirmed) {
      funcIfTrue();
    }
  });
};
