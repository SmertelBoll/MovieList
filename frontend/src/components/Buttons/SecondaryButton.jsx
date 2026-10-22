import { Button } from "@mui/material";
import React from "react";

// Secondary button (sidebar folders, list actions). Yellow background -> dark text/icons.
// Active is yellow; hover on active is a darker yellow to tell "selected" from "selected + hover".
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
