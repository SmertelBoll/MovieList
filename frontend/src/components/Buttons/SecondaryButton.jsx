import { Button } from "@mui/material";
import React from "react";

/**
 * Другорядна кнопка (папки в сайдбарі, дії у списках).
 *
 * Правило сайту: жовтий фон -> темний текст та іконки.
 * Вибране (active) — жовте; наведення на вибране — темніший жовтий,
 * щоб було видно різницю між «вибрано» і «вибрано + курсор».
 *
 * active навмисно не потрапляє в ...rest: інакше React віддав би його
 * у DOM як невідомий атрибут і попередив про це в консолі.
 */
function SecondaryButton({ isThreePoints, active = false, children, sx, ...rest }) {
  return (
    <Button
      {...rest}
      sx={{
        backgroundColor: active ? "yellow.main" : "transparent",
        color: active ? "yellow.contrastText" : "text.main",
        px: 2,
        paddingRight: isThreePoints ? 0 : "Auto",
        paddingY: isThreePoints ? 0 : "Auto",
        alignSelf: "center",
        borderRadius: 2,

        '@media (hover: hover) and (pointer: fine)': { ":hover": {
          backgroundColor: active ? "yellow.dark" : "yellow.main",
          color: "yellow.contrastText",
        } },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

export default SecondaryButton;
