import React, { useEffect, useState } from 'react'
import { Route, Routes } from "react-router-dom";
import Header from './components/Header/Header'
import Footer from './components/Footer'
import ScrollToTopButton from './components/Buttons/ScrollToTopButton'
import { ThemeProvider } from "@mui/material";
import { getTheme } from "./theme/theme";

import HomePage from "./pages/Home/HomePage";
import RegistrationForm from "./pages/Auth/RegistrationForm";
import LoginForm from "./pages/Auth/LoginForm";
import NotFound from "./pages/NotFound";
import MoviePage from "./pages/Info/Movie/MoviePage";
import ActorPage from "./pages/Info/Actor/ActorPage";
import CrewPage from "./pages/Info/Crew/CrewPage";
import { useDispatch } from 'react-redux';
import { fetchAuthMe } from './redux/slices/AuthSlice';
import ContainerCustom from './components/_customMUI/ContainerCustom';

function App() {
  const dispatch = useDispatch();
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  useEffect(() => {
    dispatch(fetchAuthMe())
  }, []);

  // Логіка для кнопки "Scroll to top"
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Показуємо кнопку "Scroll to top" коли прокручуємо вниз більше ніж на 500px
      if (currentScrollY > 500) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const savedMode = window.localStorage.getItem("MovieList-mode");
  const [mode, setMode] = React.useState(savedMode ? savedMode : "light");

  const colorMode = React.useMemo(
    () => ({
      // The dark mode switch would invoke this method
      toggleColorMode: () => {
        window.localStorage.setItem("MovieList-mode", mode === "light" ? "dark" : "light");
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
      },
    }),
    []
  );
  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header colorMode={colorMode} mode={mode} />
        <main style={{ flex: "1 1 auto", backgroundColor: theme.palette.bg.main, paddingTop: "80px" }}>
          <ContainerCustom paddingY bgcolor="bg.main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/actor/:id" element={<ActorPage />} />
              <Route path="/crew/:id" element={<CrewPage />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ContainerCustom>
        </main>
        <Footer />
        <ScrollToTopButton isVisible={showScrollToTop} />
      </div>
    </ThemeProvider >
  )
}

export default App