import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

import { alertError } from "../../alerts";
import { fetchAuth, selectIsAuth } from "../../redux/slices/AuthSlice";
import TextFieldCustom from "../../components/_customMUI/TextFieldCustom";
import ContainerCustom from "../../components/_customMUI/ContainerCustom";
import MainButton from "../../components/Buttons/MainButton";
import SecondaryButton from "../../components/Buttons/SecondaryButton";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

function LoginForm() {
  const theme = useTheme();
  const InputBox = useMemo(
    () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main),
    [theme.palette.mode]
  );

  const dispatch = useDispatch();
  const isAuth = useSelector(selectIsAuth);
  const [isSavePassword, setIsSavePassword] = useState(false)
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSavePassword = (event) => {
    setIsSavePassword(event.target.checked);
  };

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const data = await dispatch(fetchAuth(formData));

    if (data?.payload?.token) {
      window.localStorage.setItem("MovieList-token", data.payload.token);
    } else {
      alertError({ title: "Authorization error", msg: "Incorrect login or password" });
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
          position: "relative",
        }}
      >
        <Typography variant="h2" color="text.main" sx={{ mt: 2 }}>
          Welcome
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
        >
          <InputBox
            value={formData.email}
            onChange={handleInputChange}
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoFocus
            autoComplete={isSavePassword ? 'on' : 'off'}
          />
          <InputBox
            value={formData.password}
            onChange={handleInputChange}
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete={isSavePassword ? 'on' : 'off'}
          />

          <FormControlLabel
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "start",
              mt: "-15px",
              "& .MuiFormControlLabel-label": {
                color: "text.main"
              }
            }}
            control={
              <Checkbox
                checked={isSavePassword}
                onChange={handleSavePassword}
                name="savePassword"
              />
            }
            label="save password"
          />

          <MainButton type="submit" fullWidth sx={{ borderRadius: 1 }}>
            Log in
          </MainButton>
        </Box>

        <Button
          onClick={handleClickOpen}
          sx={{
            alignSelf: "center",
            color: "text.second",
            position: "absolute",
            top: 2,
            right: 5,
            "&:hover": { bgcolor: "transparent", color: "text.main" },
          }}
        >
          <InfoOutlinedIcon />
          <Typography sx={{ ml: "2px" }}>test account</Typography>
        </Button>

        <Dialog
          open={openDialog}
          onClose={handleClose}
          PaperProps={{
            style: {
              backgroundColor: theme.palette.bg.main,
            },
          }}
        >
          <DialogTitle variant="p" sx={{ color: "text.main" }}>
            Test account
          </DialogTitle>
          <DialogContent>
            <DialogTitle variant="p" sx={{ color: "text.main" }}>
              ordinary user
            </DialogTitle>
            <DialogContentText variant="p" sx={{ color: "text.second" }}>
              login: user@gmail.com
            </DialogContentText>
            <DialogContentText variant="p" sx={{ color: "text.second" }}>
              password: 12345
            </DialogContentText>
            <DialogTitle variant="p" sx={{ color: "text.main" }}>
              admin user
            </DialogTitle>
            <DialogContentText variant="p" sx={{ color: "text.second" }}>
              login: admin@gmail.com
            </DialogContentText>
            <DialogContentText variant="p" sx={{ color: "text.second" }}>
              password: 12345
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <SecondaryButton onClick={handleClose}>OK</SecondaryButton>
          </DialogActions>
        </Dialog>
      </Box>
    </ContainerCustom>
  );
}

export default LoginForm;
