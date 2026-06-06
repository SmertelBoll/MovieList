import React, { useEffect } from 'react'
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
import MoviePage from "./pages/Movie/MoviePage";
import TVPage from "./pages/TV/TVPage";
import ActorPage from "./pages/Info/ActorPage";
import CrewPage from "./pages/Info/CrewPage";
import CompanyPage from "./pages/Info/CompanyPage";
import GenrePage from "./pages/Info/GenrePage";
import FolderPage from "./pages/SingleFolder/FolderPage";
import FoldersPage from "./pages/Folders/FoldersPage";
import ProfilePage from "./pages/Profile/ProfilePage";
import { useSelector, useDispatch } from "react-redux";
import { fetchAuthMe } from "./redux/slices/AuthSlice";
import { setMode, setLanguage } from "./redux/slices/ConfigSlice";
import ContainerCustom from './components/_customMUI/ContainerCustom';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAuthMe())
  }, [dispatch]);

  const authData = useSelector((state) => state.auth.data);

  // Підтягуємо тему та мову з профілю користувача (сервер — джерело істини після входу)
  useEffect(() => {
    if (!authData) return;
    if (authData.themeMode) dispatch(setMode(authData.themeMode));
    if (authData.language) dispatch(setLanguage(authData.language));
  }, [authData, dispatch]);

  const { mode } = useSelector((state) => state.config);

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header
          mode={mode}
        />
        <main style={{ flex: "1 1 auto", backgroundColor: theme.palette.bg.main, paddingTop: "80px" }}>
          <ContainerCustom paddingY bgcolor="bg.main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/movie/:id" element={<MoviePage />} />
              <Route path="/user/movie/:id" element={<MoviePage isSaved />} />
              <Route path="/tv/:id" element={<TVPage />} />
              <Route path="/user/tv/:id" element={<TVPage isSaved />} />
              <Route path="/actor/:id" element={<ActorPage />} />
              <Route path="/crew/:id" element={<CrewPage />} />
              <Route path="/company/:id" element={<CompanyPage />} />
              <Route path="/genre/:id" element={<GenrePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/folders" element={<FoldersPage />} />
              <Route path="/folders/:folderName" element={<FolderPage />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ContainerCustom>
        </main>
        <Footer />
        <ScrollToTopButton />
      </div>
    </ThemeProvider >
  )
}

export default App