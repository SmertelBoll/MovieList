import Swal from "sweetalert2";
import "./styles/swal.css";
import palette from "./theme/palette";

// swal2 renders outside React, so no useTheme: read the mode from the same localStorage key as ConfigSlice, colors from
// the same palette.
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

// Text input intentionally isn't swal2 (see useTextPrompt); only messages and confirmations stay here.

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
