import { Avatar, Box, IconButton, Typography } from "@mui/material";
import React, { useMemo, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "../../axios";
import { useTheme } from "@mui/material/styles";

import { alertError } from "../../alerts";
import { fetchRegister, selectIsAuth } from "../../redux/slices/AuthSlice";
import TextFieldCustom from "../../components/_customMUI/TextFieldCustom";
import ContainerCustom from "../../components/_customMUI/ContainerCustom";
import MainButton from "../../components/Buttons/MainButton";

import HighlightOffIcon from "@mui/icons-material/HighlightOff";

function RegistrationForm() {
  const theme = useTheme();
  const InputBox = useMemo(
    () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main),
    [theme.palette.mode]
  );

  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuth);
  const [localData, setLocalData] = useState({
    fullName: "",
    email: "",
    password: "",
    avatar: null,
  });
  const [avatarUrl, setAvatarUrl] = useState("");

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setLocalData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Обробка завантаженого аватару
  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    event.target.value = null;

    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file);

      setLocalData((prevData) => ({
        ...prevData,
        avatar: file,
      }));
      setAvatarUrl(imageUrl);
    }
  };

  const handleDeleteAvatar = () => {
    setLocalData((prevData) => ({
      ...prevData,
      avatar: null,
    }));
    setAvatarUrl("");
  };

  const inputRef = useRef(null);

  const handleAvatarClick = () => {
    inputRef.current.click();
  };

  const setFileToBase = () => {
    return new Promise((resolve) => {
      const render = new FileReader();
      render.readAsDataURL(localData.avatar);
      render.onloadend = () => {
        const formDataImg = {
          image: render.result,
        };
        resolve(formDataImg);
      };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let avatar = null;
    if (localData.avatar && typeof localData.avatar !== "string") {
      const formDataImg = await setFileToBase();

      try {
        const { data } = await axios.post("/upload", formDataImg);

        avatar = data.url;
      } catch (err) {
        console.warn(err);
        alertError(err);
        return;
      }
    }

    let formData = {
      fullName: localData.fullName,
      email: localData.email,
      password: localData.password,
    };

    if (avatar) formData["avatar"] = avatar;

    const resData = await dispatch(fetchRegister(formData));

    if (resData?.payload?.error) {
      const err = resData.payload.error;
      console.warn(err);

      if (err.response.data[0]) alertError({ title: "Authorization error", msg: err.response.data[0].msg });
      else alertError(err);
    } else {
      if (resData?.payload?.data?.token) {
        window.localStorage.setItem(process.env.TOKEN_KEY, resData.payload.data.token);
      } else {
        alertError({ title: "Ooops..", msg: "something went wrong, please try again later" });
      }
    }
  };

  if (isAuth) {
    return <Navigate to="/" />;
  }

  return (
    <ContainerCustom sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box
        sx={{
          maxWidth: "500px",
          width: "100%",
          boxSizing: "border-box",
          textAlign: "center",
          bgcolor: "bg.second",
          borderRadius: 2,
          my: 4,
          p: { xs: 2, sm: 3, md: 5 },
          boxShadow: 0,
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        <Typography color="text.main" variant="h2">
          Create your account
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              onClick={handleAvatarClick}
              src={avatarUrl}
              sx={{ width: 90, height: 90, cursor: "pointer" }}
            />
            <input
              type="file"
              onChange={handleFileInputChange}
              style={{ display: "none" }}
              ref={inputRef}
              accept="image/*"
            />

            {avatarUrl && (
              <IconButton sx={{ position: "absolute", top: -25, right: -25, color: "text.main" }}>
                <HighlightOffIcon fontSize="large" onClick={handleDeleteAvatar} />
              </IconButton>
            )}
          </Box>

          <InputBox
            value={localData.fullName}
            onChange={handleInputChange}
            required
            fullWidth
            id="fullname"
            label="Full Name"
            name="fullName"
            autoFocus
          />
          <InputBox
            value={localData.email}
            onChange={handleInputChange}
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
          />
          <InputBox
            value={localData.password}
            onChange={handleInputChange}
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
          />

          <MainButton type="submit" fullWidth sx={{ borderRadius: 1 }}>
            Sign up
          </MainButton>
        </Box>
      </Box>
    </ContainerCustom>
  );
}

export default RegistrationForm;
