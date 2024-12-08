import { Skeleton } from "@mui/material";
import React from "react";

function SkeletonCustom({ circular, width, height, sx }) {
  return (
    <Skeleton
      variant={circular ? "circular" : "rectangular"}
      animation="wave"
      width={width}
      height={height}
      sx={{ borderRadius: circular ? "auto" : 2, ...sx }}
    />
  );
}

export default SkeletonCustom;
