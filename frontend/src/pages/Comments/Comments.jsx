import { Avatar, Box, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "../../axios";
import { useTheme } from "@mui/material/styles";

import { alertError } from "../../alerts";
import TextFieldCustom from "../../components/customMUI/TextFieldCustom";
import MainButton from "../../components/Buttons/MainButton";
import CommentBlock from "./CommentBlock";
import CommentSkeleton from "./CommentSkeleton";
import CircularProgressCustom from "../../components/customMUI/CircularProgressCustom";

import TelegramIcon from "@mui/icons-material/Telegram";

function Comments({
  addCommnet,
  items,
  isLoaded,
  postId,
  onUpdate,
  smallComment,
  hasMore,
  ownArticle,
  commentPage,
}) {
  const theme = useTheme();
  const InputBox = useMemo(
    () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main),
    [theme.palette.mode]
  );

  const { data: userData, isLoaded: isLoadedDataUser } = useSelector((state) => state.auth);
  const [commentText, setCommentText] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const isPoints = items?.length >= 5;

  const handleChange = (e) => {
    setCommentText(e.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (postId) {
      axios
        .post(`/comments`, { text: commentText, postId })
        .then((res) => {
          setCommentText("");
          onUpdate();
        })
        .catch((err) => {
          console.warn(err);
          alertError(err);
        });
    } else {
      alertError({ title: "Comment error", msg: "Unable to send comment" });
    }
  };

  return (
    <Box
      sx={{
        backgroundColor: "bg.second",
        borderRadius: 2,
        p: 2,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        alignSelf: "start",
        boxSizing: "border-box",
        width: "100%",
        boxShadow: 0,
      }}
    >
      {(smallComment || Boolean(items?.length)) && (
        <Typography variant="p" sx={{ color: "text.main" }}>
          {smallComment ? "Last comments" : "Comments"}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: "100%" }}>
        {addCommnet && isLoadedDataUser && !ownArticle && isLoaded && (
          <Box sx={{ display: "flex", gap: 2, mb: 2, width: "100%" }}>
            <Avatar src={userData.avatar || ""} sx={{ display: { xs: "none", sm: "flex" } }} />

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1,
                width: "100%",
              }}
            >
              <InputBox
                value={commentText}
                onChange={handleChange}
                fullWidth
                autoComplete="off"
                id="Comment"
                placeholder="Add your comment..."
                name="Comment"
                sx={{ "& .MuiOutlinedInput-notchedOutline": { borderRadius: "8px" } }}
              />
              <MainButton type="submit" endIcon={<TelegramIcon />} sx={{ alignSelf: "flex-start" }}>
                Send
              </MainButton>
            </Box>
          </Box>
        )}
        {isLoaded ? (
          <>
            {Boolean(items?.length) ? (
              items.map((obj) => (
                <CommentBlock
                  key={obj._id}
                  text={obj.text}
                  avatarUrl={obj?.user?.avatar}
                  fullname={obj.user?.fullName}
                  smallComment={smallComment}
                />
              ))
            ) : (
              <>
                {(ownArticle || commentPage) && (
                  <Box
                    sx={{
                      height: "100%",
                      minHeight: "40vh",
                      p: 2,
                      display: "flex",
                      flexDirection: "column",
                      textAlign: "center",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography variant="h2" color="text.main">
                      You have no comments. Keep writing more great articles and they will be coming soon!
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </>
        ) : (
          <CommentSkeleton count={5} />
        )}
        {hasMore && (
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <CircularProgressCustom />
          </Box>
        )}
        {isPoints && isLoaded && smallComment && (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="p" sx={{ color: "text.second" }}>
              ...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default Comments;
