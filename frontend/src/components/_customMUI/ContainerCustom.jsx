import { Container } from "@mui/material";
import React from "react";

function ContainerCustom({ paddingY = false, sx = {}, children }) {
  return (
    <Container
      sx={{
        maxWidth: { xl: "min(calc(100vw - 200px))" },
        // xs: 2 — та сама шкала, з якої Container бере бічні гутери (theme.spacing(2)),
        // тож на телефоні відступ зверху дорівнює відступу до країв екрана.
        py: paddingY ? { xs: 2, sm: "clamp(16px, calc(16px + 1.8vw), 40px)" } : "auto",
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}

export default ContainerCustom;
