import { Box } from "@mui/material";
import React from "react";
import SkeletonCustom from "../../components/customMUI/SkeletonCustom";

const CommentSkeletonBlock = () => {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <SkeletonCustom circular width={40} height={40} />
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
        <SkeletonCustom width={50} height={12} />
        <SkeletonCustom width={120} height={12} />
      </Box>
    </Box>
  );
};

function CommentSkeleton({ count }) {
  return (
    <>
      {Array(count)
        .fill(0)
        .map((_, id) => (
          <CommentSkeletonBlock key={id} />
        ))}
    </>
  );
}

export default CommentSkeleton;
