import { Box, IconButton } from "@mui/material";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";

import { logout, selectIsAuth } from "../../redux/slices/AuthSlice";
import { alertConfirm } from "../../alerts";
import ContainerCustom from "../customMUI/ContainerCustom";
import MainButton from "../Buttons/MainButton";
import BurgerMenu from "./BurgerMenu";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";



function Header({ colorMode, mode }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuth);
  // const isAuth = true

  const logOutFunc = () => {
    window.localStorage.removeItem("MovieList-token");
    dispatch(logout());
    navigate("/");
    window.location.reload()
  };

  const onClickLogout = () => {
    alertConfirm("Are you sure?", logOutFunc);
  };

  return (
    <Box component="header" bgcolor="bg.second" sx={{ boxShadow: 0 }}>
      <ContainerCustom sx={{ py: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/">
            logo
          </Link>

          <IconButton sx={{ ml: 1 }} onClick={colorMode.toggleColorMode} color="inherit">
            {mode === "light" ? (
              <DarkModeIcon style={{ color: theme.palette.text.main }} />
            ) : (
              <LightModeIcon style={{ color: theme.palette.text.main }} />
            )}
          </IconButton>

          {/* button menu */}
          {!isAuth ? (
            <>
              <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2, alignItems: "center" }}>
                <Link to="/register">
                  <MainButton>Sign up</MainButton>
                </Link>
                <Link to="/login">
                  <MainButton>Log in</MainButton>
                </Link>
              </Box>
              <BurgerMenu sx={{ display: { xs: "flex", md: "none" } }} onClickLogout={onClickLogout} />
            </>
          ) : (
            <BurgerMenu onClickLogout={onClickLogout} />
          )}

        </Box>


      </ContainerCustom>
    </Box>
  )
}

export default Header