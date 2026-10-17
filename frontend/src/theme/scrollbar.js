// Смуга горизонтального скролу всередині блоків (команда, каст, сезони): така сама, як у скролу
// сторінки (styles/index.css) — жовта «пігулка» з рамкою кольору доріжки.
// Один спільний стиль, щоб усі горизонтальні стрічки на сайті виглядали однаково.
export const scrollbarSx = {
  "&::-webkit-scrollbar": {
    height: { xs: 10, sm: 14 },
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "scrollbar.track",
    borderRadius: "100vw",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "scrollbar.thumb",
    borderRadius: "100vw",
    border: "3px solid",
    borderColor: "scrollbar.track",
    "&:hover": {
      backgroundColor: "scrollbar.thumbHover",
    },
  },
};
