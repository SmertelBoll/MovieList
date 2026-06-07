import Swal from "sweetalert2";
import "./styles/swal.css";

const defaultProp = {
  showConfirmButton: false,
  color: "#0C1618",
  background: "#FAF8FF",
};

export const alertError = (err, title, msg) => {
  let finishTitle = title || err?.response?.data?.title || "Validation error"
  let finishMsg = msg || err?.response?.data?.message || err?.response?.data[0]?.msg

  Swal.fire({
    ...defaultProp,
    icon: "error",
    title: finishTitle,
    text: finishMsg,
  });

};

export const alertSuccess = (title) => {
  Swal.fire({
    ...defaultProp,
    timer: 2500,
    icon: "success",
    title: title,
  });
};

// Запитує у користувача текст. Повертає введене значення або null (якщо скасовано/порожньо)
export const alertInput = async (title, placeholder = "", defaultValue = "") => {
  const result = await Swal.fire({
    ...defaultProp,
    title: title,
    input: "text",
    inputPlaceholder: placeholder,
    inputValue: defaultValue,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return "Please enter a value";
      }
    },
  });

  return result.isConfirmed ? result.value.trim() : null;
};

export const alertConfirm = (title, funcIfTrue) => {
  Swal.fire({
    ...defaultProp,
    icon: "question",
    title: title,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
  }).then((result) => {
    if (result.isConfirmed) {
      funcIfTrue();
    }
  });
};
