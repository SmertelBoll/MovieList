const palette = (mode) => {
  if (mode === "light")
    return {
      mode: "light",
      bg: {
        main: "#e6e4da",
        second: "#FAF8FF",
        selected: "#cccccc",
        reverseSecond: "#363636"
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
      // Кольори статусів папок. Світлі відтінки з темним текстом —
      // однакові в обох темах, тому читаються всюди
      status: {
        planned: "#8fa0f5",
        watching: "#7ed48a",
        watched: "#ffd240",
        dropped: "#ff7b6b",
      },
      // Напівпрозорі затемнення поверх зображень. Не залежать від теми:
      // світлий скрим на темному постері не працює
      overlay: {
        strong: "rgba(0,0,0,0.8)",
        medium: "rgba(0,0,0,0.75)",
        soft: "rgba(0,0,0,0.7)",
        none: "rgba(0,0,0,0)",
        onImage: "#FAF8FF",
      },
      danger: {
        main: "#dd3333",
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
      selected: "#595959",
      reverseSecond: "#FAF8FF"
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
    // Кольори статусів папок. Світлі відтінки з темним текстом —
    // однакові в обох темах, тому читаються всюди
    status: {
      planned: "#8fa0f5",
      watching: "#7ed48a",
      watched: "#ffd240",
      dropped: "#ff7b6b",
    },
    // Напівпрозорі затемнення поверх зображень. Не залежать від теми:
    // світлий скрим на темному постері не працює
    overlay: {
      strong: "rgba(0,0,0,0.8)",
      medium: "rgba(0,0,0,0.75)",
      soft: "rgba(0,0,0,0.7)",
      none: "rgba(0,0,0,0)",
      onImage: "#FAF8FF",
    },
    danger: {
      main: "#dd3333",
    },
    primary: {
      main: "#ffeb3b", // Використовуємо жовтий колір
      dark: "#F2DB0B",
      light: "#ffef62",
    },
  };
};

export default palette;
