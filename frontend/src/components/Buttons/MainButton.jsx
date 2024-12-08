import { Button, Typography } from "@mui/material";
import React from "react";

function MainButton(props) {
  const { children, sx, sxTypography, ...rest } = props;
  return (
    <Button
      {...rest}
      sx={{
        backgroundColor: "yellow.main",
        color: "text.dark",
        borderRadius: 4,
        px: 5,
        alignSelf: "center",

        ":hover": {
          backgroundColor: "yellow.dark",
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
