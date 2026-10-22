// Shared hero layout for the Info pages (Actor / Crew / Company / Genre): one place instead of four copies
// that broke on narrow screens.

// Outer block. Pages add their background only via backgroundImage: the background shorthand would reset
// backgroundSize/Position below and pin the image to the top-left.
export const heroSectionSx = {
    position: "relative",
    minHeight: { xs: "auto", sm: 400 },
    borderRadius: 2,
    overflow: "hidden",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

export const heroInnerSx = {
    display: "flex",
    flexDirection: { xs: "column", sm: "row" },
    gap: { xs: 2, sm: 3 },
    alignItems: "center",
    maxWidth: "1200px",
    width: "100%",
    minWidth: 0,
    p: { xs: 2, sm: 3 },
};

export const heroPortraitSx = {
    width: { xs: 150, sm: 170, md: 200 },
    height: { xs: 225, sm: 255, md: 300 },
    flexShrink: 0,
    boxShadow: 3,
    borderRadius: 2,
};

// Fixed height everywhere so children with height: '100%' have something to resolve against.
export const heroLandscapeSx = {
    width: { xs: "100%", sm: 240, md: 300 },
    height: { xs: 170, sm: 160, md: 200 },
    flexShrink: 0,
    boxShadow: 3,
    borderRadius: 2,
};

export const heroMediaSx = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
};

export const heroInfoSx = {
    flex: 1,
    minWidth: 0,
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    textAlign: { xs: "center", sm: "left" },
    alignItems: { xs: "center", sm: "stretch" },
};

// Sizes live in the heroTitle typography variant; only long-title wrapping stays here.
export const heroTitleSx = {
    overflowWrap: "anywhere",
};

export const heroSubtitleSx = {};

export const heroStatsSx = {
    mt: { xs: 2, sm: 3 },
    display: "flex",
    gap: { xs: 3, sm: 4 },
    flexWrap: "wrap",
    justifyContent: { xs: "center", sm: "flex-start" },
};

export const heroStatValueSx = {
    fontWeight: "bold",
    color: "primary.main",
    fontSize: { xs: "1.5rem", sm: "2.125rem" },
};
