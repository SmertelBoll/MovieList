import { Container } from "@mui/material";
import React from "react";

function ContainerCustom({ paddingY = false, sx = {}, children }) {
  return (
    <Container
      sx={{
        maxWidth: { xl: "min(calc(100vw - 200px))" },
        py: paddingY ? { xs: 3, sm: "clamp(16px, calc(16px + 1.8vw), 40px)" } : "auto",
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}

export default ContainerCustom;
