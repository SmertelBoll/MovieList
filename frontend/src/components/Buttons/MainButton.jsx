import { Button, Typography } from "@mui/material";
import React from "react";

// Main (yellow) button. Text is always dark. Disabled: muted yellow with darker text (MUI's grey
// action.disabled blended into yellow in dark theme).
function MainButton(props) {
  const { children, sx, sxTypography, ...rest } = props;
  return (
    <Button
      {...rest}
      sx={{
        backgroundColor: "yellow.main",
        color: "yellow.contrastText",
        borderRadius: 4,
        // 48px side padding was too wide on narrow screens
        px: { xs: 3, sm: 5 },
        alignSelf: "center",

        '@media (hover: hover) and (pointer: fine)': { ":hover": {
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
