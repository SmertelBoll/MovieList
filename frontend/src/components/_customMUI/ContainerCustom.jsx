import { Container } from "@mui/material";
import React from "react";

function ContainerCustom({ paddingY = false, sx = {}, children }) {
  return (
    <Container
      sx={{
        maxWidth: { xl: "min(calc(100vw - 200px))" },
        // Бічні відступи на телефоні вдвічі менші за стандартні (8px замість 16px), щоб контенту було більше місця.
        // sm зазначено явно (24px = стандартний гутер Container): інакше базове правило перекрило б його й на великих екранах.
        px: { xs: 1, sm: 3 },
        // xs: 1 — як бічні відступи, тож на телефоні відступ зверху дорівнює відступу до країв екрана.
        py: paddingY ? { xs: 1, sm: "clamp(16px, calc(16px + 1.8vw), 40px)" } : "auto",
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}

export default ContainerCustom;
