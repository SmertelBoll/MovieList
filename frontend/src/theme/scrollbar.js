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

// Горизонтальна стрічка карток (команда, каст, Timeline): тримається в межах падінгу контейнера,
// щоб смуга прокрутки не впиралась у краї екрана. На телефоні картки «прилипають» до початку.
export const scrollStripSx = {
  display: "flex",
  gap: 2,
  overflowX: "auto",
  pt: 1,
  pb: 2,
  scrollSnapType: { xs: "x proximity", sm: "none" },
  WebkitOverflowScrolling: "touch",
  "& > *": { scrollSnapAlign: { xs: "start", sm: "none" } },
  ...scrollbarSx,
};
