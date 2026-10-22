// Horizontal scrollbar inside blocks (cast, crew, seasons), same as the page one (styles/index.css): a yellow pill with
// a track-colored border.
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

// Horizontal card strip (cast, crew, Timeline): stays within the container padding so the scrollbar doesn't
// touch the screen edges. On phones cards snap to the start.
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
