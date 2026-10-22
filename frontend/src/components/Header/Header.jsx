import { Box, IconButton, Typography } from "@mui/material";
import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { toggleThemeMode } from "../../redux/slices/ConfigSlice";

import { logout, selectIsAuth } from "../../redux/slices/AuthSlice";
import { alertConfirm } from "../../alerts";
import ContainerCustom from "../_customMUI/ContainerCustom";
import MainButton from "../Buttons/MainButton";
import BurgerMenu from "./BurgerMenu";
import LanguageSelector from "./LanguageSelector";
import TypeTMDBSelector from "./TypeTMDBSelector";

import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";



function Header({ mode }) {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuth = useSelector(selectIsAuth);
  const isChecking = useSelector((state) => state.auth.isChecking);

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // The header is position: fixed, so content is offset by its real height, published as a CSS variable
  // (adapts when the header grows, e.g. on mobile).
  const headerRef = useRef(null);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const applyHeight = () => {
      document.documentElement.style.setProperty("--header-height", `${el.offsetHeight}px`);
    };
    applyHeight();
    const observer = new ResizeObserver(applyHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  const logOutFunc = () => {
    window.localStorage.removeItem(process.env.REACT_APP_TOKEN_KEY);
    dispatch(logout());
    navigate("/");
    window.location.reload()
  };

  const onClickLogout = () => {
    alertConfirm("Are you sure?", logOutFunc);
  };

  return (
    <Box
      component="header"
      ref={headerRef}
      bgcolor="bg.second"
      sx={{
        boxShadow: 0,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out'
      }}
    >
      <ContainerCustom sx={{ py: 1 }}>
        {/*
           Three-block grid: logo left, selectors centered, menu/login right. Side columns are equal (minmax(0, 1fr)), so the middle block stays centered.
           On phones the selectors move to a second full-width row.
        */}
        <Box sx={{
          display: "grid",
          gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(0, 1fr) auto minmax(0, 1fr)" },
          gridTemplateAreas: { xs: '"logo menu" "controls controls"', sm: '"logo controls menu"' },
          alignItems: "center",
          columnGap: 1,
          rowGap: { xs: 0.5, sm: 0 },
        }}>
          <Box sx={{ gridArea: "logo", justifySelf: "start" }}>
            {/* Text logo: "Movie" plain, "List" on a yellow plate with dark text. The Bungee font comes from styles/index.css. */}
            <Link to="/" aria-label="MovieList — home" style={{ display: "inline-flex" }}>
              <Typography
                variant="logo"
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  fontFamily: "Bungee, Kanit, sans-serif",
                  fontWeight: 400,
                  fontSize: { xs: "1.25rem", sm: "1.75rem" },
                  lineHeight: 1,
                  color: "text.main",
                }}
              >
                Movie
                <Box
                  component="span"
                  sx={{
                    ml: 0.5,
                    px: 0.75,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: "yellow.main",
                    color: "yellow.contrastText",
                  }}
                >
                  List
                </Box>
              </Typography>
            </Link>
          </Box>

          <Box sx={{
            gridArea: "controls",
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "space-around", sm: "center" },
            gap: 1,
            justifySelf: { xs: "stretch", sm: "center" },
          }}>
            <LanguageSelector />

            <IconButton onClick={() => dispatch(toggleThemeMode())} color="inherit">
              {mode === "light" ? (
                <DarkModeIcon style={{ color: theme.palette.text.main }} />
              ) : (
                <LightModeIcon style={{ color: theme.palette.text.main }} />
              )}
            </IconButton>

            <TypeTMDBSelector />
          </Box>

          {/* button menu */}
          <Box sx={{ gridArea: "menu", justifySelf: "end", display: "flex", alignItems: "center", gap: 2 }}>
            {isChecking ? (
              // While the auth check runs we don't know what to show (Sign up / Log in or profile): only a
              // disabled burger menu.
              <BurgerMenu disabled onClickLogout={onClickLogout} />
            ) : !isAuth ? (
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

        </Box>


      </ContainerCustom>
    </Box>
  )
}

export default Header