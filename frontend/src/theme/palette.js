const palette = (mode) => {
  if (mode === "light")
    return {
      mode: "light",
      bg: {
        main: "#e6e4da",
        second: "#FAF8FF",
        selected: "#cccccc"
      },
      text: {
        main: "#0C1618",
        second: "#696969",
        dark: "#0C1618",
        white: "#FAF8FF",
      },
      yellow: {
        main: "#F9F919",
        dark: "#F2DB0B",
      },
      primary: {
        main: "#ffeb3b", // Використовуємо жовтий колір
        dark: "#F2DB0B",
        light: "#ffef62",
      },
    };

  return {
    mode: "dark",
    bg: {
      main: "#363636",
      second: "#171717",
      selected: "#595959"
    },
    text: {
      main: "#FAF8FF",
      second: "#999999",
      dark: "#0C1618",
      white: "#FAF8FF",
    },
    yellow: {
      main: "#F9F919",
      dark: "#F2DB0B",
    },
    primary: {
      main: "#ffeb3b", // Використовуємо жовтий колір
      dark: "#F2DB0B",
      light: "#ffef62",
    },
  };
};

export default palette;
