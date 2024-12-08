const palette = (mode) => {
  if (mode === "light")
    return {
      mode: "light",
      bg: {
        main: "#e6e4da",
        second: "#FAF8FF",
        card: "#DADADAFF"
      },
      text: {
        main: "#0C1618",
        second: "#696969",
        dark: "#0C1618",
      },
      yellow: {
        main: "#F9F919",
        dark: "#F2DB0B",
      },
    };

  return {
    mode: "dark",
    bg: {
      main: "#363636",
      second: "#171717",
    },
    text: {
      main: "#FAF8FF",
      second: "#999999",
      dark: "#0C1618",
    },
    yellow: {
      main: "#F9F919",
      dark: "#F2DB0B",
    },
  };
};

export default palette;
