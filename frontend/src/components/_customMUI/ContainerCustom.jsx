import { Container } from "@mui/material";
import React from "react";

function ContainerCustom({ paddingY = false, sx = {}, children }) {
  return (
    <Container
      sx={{
        maxWidth: { xl: "min(calc(100vw - 200px))" },
        // Side padding on phones is half the default (8px). sm is explicit (24px = Container gutter), otherwise the
        // base rule would override it on large screens.
        px: { xs: 1, sm: 3 },
        py: paddingY ? { xs: 1, sm: "clamp(16px, calc(16px + 1.8vw), 40px)" } : "auto",
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}

export default ContainerCustom;
