import { Typography } from "@mui/material";
import React from "react";

function TagButton({ children, onClick }) {
  return (
    <Typography
      variant="disc2"
      onClick={onClick}
      sx={{
        color: "text.second",
        '@media (hover: hover) and (pointer: fine)': { ":hover": {
          color: "text.main",
          cursor: "pointer",
        } },
        display: "-webkit-box",
        wordWrap: "break-word",
        wordBreak: "break-all",
      }}
    >
      {children}
    </Typography>
  );
}

export default TagButton;
