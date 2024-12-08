import { CircularProgress } from "@mui/material";
import React from "react";

function CircularProgressCustom() {
  return <CircularProgress sx={{ color: (theme) => theme.palette.text.second }} />;
}

export default CircularProgressCustom;
