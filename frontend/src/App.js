import React, { useEffect, useRef, useState } from 'react'
import { Route, Routes } from "react-router-dom";
import Header from './components/Header/Header'
import Footer from './components/Footer'
import ScrollToTopButton from './components/Buttons/ScrollToTopButton'
import { Box, CircularProgress, ThemeProvider } from "@mui/material";
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
import UpdatesPage from "./pages/Updates/UpdatesPage";
import { useSelector, useDispatch } from "react-redux";
import { fetchAuthMe } from "./redux/slices/AuthSlice";
import { fetchSaved, clearSaved } from "./redux/slices/SavedSlice";
import { SAVED_CHANGED_EVENT } from "./axios";
import { setMode, setLanguage, setDateFormat } from "./redux/slices/ConfigSlice";
import { isDateFormat } from "./utils/dateFormats";
import ContainerCustom from './components/_customMUI/ContainerCustom';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAuthMe())
  }, [dispatch]);

  const authData = useSelector((state) => state.auth.data);
  const isChecking = useSelector((state) => state.auth.isChecking);

  // Підтягуємо тему та мову з профілю користувача (сервер — джерело істини після входу)
  // Робимо це один раз на користувача, а не при кожній зміні authData: інакше будь-яке оновлення
  // профілю (напр. галочка в налаштуваннях) повертало б тему й мову до старих значень із authData.
  const syncedUserId = useRef(null);
  useEffect(() => {
    if (!authData) { syncedUserId.current = null; return; }
    if (syncedUserId.current === authData._id) return;
    syncedUserId.current = authData._id;
    if (authData.themeMode) dispatch(setMode(authData.themeMode));
    if (authData.language) dispatch(setLanguage(authData.language));
  }, [authData, dispatch]);

  // Індекс збережених елементів: де лежить кожен фільм/серіал. Завантажуємо після входу
  // і оновлюємо після кожної зміни папок/елементів (axios шле подію).
  const isAuth = Boolean(authData);
  useEffect(() => {
    if (!isAuth) {
      dispatch(clearSaved());
      return;
    }
    dispatch(fetchSaved());

    // Кілька запитів поспіль (напр. перенос + оновлення) збираємо в одне оновлення
    let timer = null;
    const onChanged = () => {
      clearTimeout(timer);
      timer = setTimeout(() => dispatch(fetchSaved()), 300);
    };
    window.addEventListener(SAVED_CHANGED_EVENT, onChanged);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(SAVED_CHANGED_EVENT, onChanged);
    };
  }, [isAuth, dispatch]);

  const { mode, dateFormat } = useSelector((state) => state.config);

  // Формат дат: сервер — джерело істини після входу. Якщо він відрізняється від локально збереженого
  // (інший пристрій), застосовуємо його й перемонтовуємо сторінки — вони вже могли показати дати
  // у старому форматі. Зміна формату з профілю сюди не потрапляє: там authData оновлюється разом зі store.
  const [remountKey, setRemountKey] = useState(0);
  useEffect(() => {
    const serverFormat = authData?.dateFormat;
    if (!isDateFormat(serverFormat) || serverFormat === dateFormat) return;
    dispatch(setDateFormat(serverFormat));
    setRemountKey((key) => key + 1);
  }, [authData?.dateFormat]); // eslint-disable-line react-hooks/exhaustive-deps

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Header
          mode={mode}
        />
        {/* Відступ = реальна висота фіксованої шапки (її публікує Header).
            80px — лише запасне значення до першого виміру. */}
        <main style={{ flex: "1 1 auto", backgroundColor: theme.palette.bg.main, paddingTop: "var(--header-height, 80px)" }}>
          <ContainerCustom paddingY bgcolor="bg.main">
            {isChecking ? (
              // Чекаємо відповідь про вхід, щоб сторінки не блимали «увійдіть» при оновленні
              <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                <CircularProgress color="primary" />
              </Box>
            ) : (
            <Routes key={remountKey}>
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
              <Route path="/updates" element={<UpdatesPage />} />
              <Route path="/folders" element={<FoldersPage />} />
              <Route path="/folders/:folderName" element={<FolderPage />} />
              <Route path="/register" element={<RegistrationForm />} />
              <Route path="/login" element={<LoginForm />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            )}
          </ContainerCustom>
        </main>
        <Footer />
        <ScrollToTopButton />
      </div>
    </ThemeProvider >
  )
}

export default App