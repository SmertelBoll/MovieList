import { Button, Typography } from "@mui/material";
import React from "react";

/**
 * Основна (жовта) кнопка сайту.
 *
 * Текст завжди темний — жовтий світлий у будь-якій темі.
 * Заблокований стан: приглушений жовтий із темнішим текстом. MUI за
 * замовчуванням підставив би сірий action.disabled, який у темній темі
 * зливався з жовтим тлом і робив підпис нечитабельним.
 */
function MainButton(props) {
  const { children, sx, sxTypography, ...rest } = props;
  return (
    <Button
      {...rest}
      sx={{
        backgroundColor: "yellow.main",
        color: "yellow.contrastText",
        borderRadius: 4,
        // 48px падінгу з боків завеликі для вузьких екранів — кнопка вилазила за межі
        px: { xs: 3, sm: 5 },
        alignSelf: "center",

        '@media (hover: hover)': { ":hover": {
          backgroundColor: "yellow.dark",
          color: "yellow.contrastText",
        } },

        "&.Mui-disabled": {
          backgroundColor: "yellow.disabled",
          color: "yellow.disabledText",
        },
        ...sx,
      }}
    >
      <Typography variant="button" {...sxTypography}>
        {children}
      </Typography>
    </Button>
  );
}

export default MainButton;
