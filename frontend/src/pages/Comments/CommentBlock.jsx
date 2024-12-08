import { Avatar, Box, Typography } from "@mui/material";
import React from "react";

function CommentBlock({ text, avatarUrl, fullname, smallComment }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Avatar src={avatarUrl || ""} />

      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <Typography
          variant="desc1"
          sx={{
            color: "text.main",
            display: "-webkit-box",
            wordWrap: "break-word",
            wordBreak: "break-all",
            overflow: "hidden",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 1,
          }}
        >
          {fullname}
        </Typography>
        <Typography
          variant="desc2"
          sx={{
            color: "text.second",
            display: "-webkit-box",
            wordWrap: "break-word",
            wordBreak: "break-all",
            overflow: "hidden",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: smallComment ? 5 : "auto",
          }}
        >
          {text}
        </Typography>
      </Box>
    </Box>
  );
}

export default CommentBlock;
