import { Box, IconButton } from "@mui/material";
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
  // const isAuth = true

  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Шапка position: fixed, тож контент під нею треба відсунути на її висоту.
  // Публікуємо реальну висоту в CSS-змінну — щоб не тримати це числом у коді
  // і щоб відступ сам підлаштувався, коли шапка стане вищою (напр. на телефоні).
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

      // Показуємо хедер коли прокручуємо вгору або на початку сторінки
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else {
        // Ховаємо хедер коли прокручуємо вниз
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link to="/">
            logo
          </Link>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Вибір мови */}
            <LanguageSelector />

            {/* Зміна теми */}
            <IconButton onClick={() => dispatch(toggleThemeMode())} color="inherit">
              {mode === "light" ? (
                <DarkModeIcon style={{ color: theme.palette.text.main }} />
              ) : (
                <LightModeIcon style={{ color: theme.palette.text.main }} />
              )}
            </IconButton>

            {/* Вибір категорії */}
            <TypeTMDBSelector />
          </Box>

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