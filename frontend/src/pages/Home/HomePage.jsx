import { Box, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React, { useEffect, useMemo, useState } from 'react'
import SideBar from '../../components/SideBar/SideBar'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios';
import { alertError } from '../../alerts'
import { useNavigate } from 'react-router-dom'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'


function HomePage() {
  const isAuth = useSelector(selectIsAuth);
  const navigate = useNavigate();
  const { typeTMDB } = useSelector((state) => state.config);


  const [folders, setFolders] = useState([])                  // Папки
  const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const sidebarRef = React.useRef(null);

  // Колонка сайдбару — 280px. Нижче md на неї немає місця поруч зі списком,
  // тому там вона не рендериться взагалі: папки доступні через бургер-меню.
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  // Логіка для показу/приховування SideBar при прокручуванні
  useEffect(() => {
    // У компактному режимі колонки немає — ховати нема чого
    if (isCompact) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Приховуємо SideBar коли прокручуємо вниз більше ніж на висоту SideBar
      if (currentScrollY > sidebarHeight + 300) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sidebarHeight, isCompact]);

  // Вимірюємо висоту SideBar після рендеру
  useEffect(() => {
    if (sidebarRef.current) {
      const height = sidebarRef.current.offsetHeight;
      setSidebarHeight(height);
    }
  }, [folders, isCompact]); // Перераховуємо висоту коли змінюються папки


  //-- GET -- //
  // Отримати назви папок
  useEffect(() => {
    if (isGetFolders && isAuth) {
      instance
        .get(`/folders`)
        .then((res) => {
          setFolders(res.data.results)

        })
        .catch((err) => {
          console.warn(err);
          alertError(err);
        });
      setIsGetFolders(false)
    }
  }, [isGetFolders, isAuth]);

  //-- OPEN FOLDER -- //
  const handleOpenFolder = (folder) => {
    navigate(`folders/${folder.name}`);
  }


  // Кешуємо GeneralItemList, щоб він не ререндерився кожен раз, 
  // коли ми просто гортаємо сторінку і showSidebar змінюється
  const generalItemList = useMemo(() => (
    <GeneralItemList
      // Бокова панель
      folders={folders}
      setFolders={setFolders}
      setIsGetFolders={setIsGetFolders}
      // Робота з базами даних
      dbType="tmdb"
      urlParams={false}
      isPreperedData={false}
      preperedData={false}
      // Інформація сторінки
      pageType="home"
      pageTitle="Here can be your advertisement"
      isSearch={true}
      isSort={true}
    />
  ), [folders, isAuth]);

  return (
    <Box sx={{ display: "flex", gap: { xs: 2, md: 3 }, width: "100%" }}>
      {/* Колонка сайдбару — тільки від md */}
      {!isCompact && (
        <Box
          ref={sidebarRef}
          sx={{
            flexBasis: isAuth && showSidebar ? "30%" : "0%",
            flexGrow: isAuth && showSidebar ? 1 : 0,
            maxWidth: isAuth && showSidebar ? "280px" : "0px",
            overflow: "hidden",
            transition: "all 0.7s ease-in-out",
            opacity: isAuth && showSidebar ? 1 : 0,
            transform: isAuth && showSidebar ? "translateX(0)" : "translateX(-100%)"
          }}
        >
          {isAuth && (
            <SideBar
              folders={folders}
              setFolders={setFolders}
              setIsGetFolders={setIsGetFolders}
              handleClickToFolder={handleOpenFolder}
              selectedFolder={false}
            />
          )}
        </Box>
      )}

      <Box sx={{
        flexBasis: !isCompact && isAuth && showSidebar ? "70%" : "100%",
        flexGrow: 1,
        // Без цього флекс-дитина не дає списку стискатись і сторінка їде вбік
        minWidth: 0,
        transition: "flex-basis 0.7s ease-in-out"
      }}>
        {generalItemList}
      </Box>
    </Box>
  )
}

export default HomePage