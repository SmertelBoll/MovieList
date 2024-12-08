import { Box, Button, Typography } from "@mui/material";
import React from "react";
import UpdateFolder from '../SideBar/UpdateFolder';


function SecondaryButton({ isThreePoints, ...props }) {
  const { children, sx, active } = props;

  return (
    <Button
      {...props}
      sx={{
        backgroundColor: active ? "yellow.main" : "",
        color: active ? "text.dark" : "text.main",
        px: 2,
        paddingRight: isThreePoints ? "0px" : "Auto",
        paddingY: isThreePoints ? "0px" : "Auto",
        alignSelf: "center",
        borderRadius: 2,

        ":hover": {
          backgroundColor: "yellow.main",
          color: "text.dark",
        },
        ...sx,
      }}
    >
      {children}
    </Button>
  );
}

export default SecondaryButton;
