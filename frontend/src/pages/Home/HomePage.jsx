import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'
import ContainerCustom from '../../components/_customMUI/ContainerCustom'
import SideBar from '../../components/SideBar/SideBar'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios';
import { alertConfirm, alertError } from '../../alerts'
import { useNavigate } from 'react-router-dom'
import GeneralMovieList from '../../components/GereralMovieList/GeneralMovieList'


function HomePage() {
  const isAuth = useSelector(selectIsAuth);
  const navigate = useNavigate();

  const [folders, setFolders] = useState([])                  // Папки
  const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const sidebarRef = React.useRef(null);

  // Логіка для показу/приховування SideBar при прокручуванні
  useEffect(() => {
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
  }, [sidebarHeight]);

  // Вимірюємо висоту SideBar після рендеру
  useEffect(() => {
    if (sidebarRef.current) {
      const height = sidebarRef.current.offsetHeight;
      setSidebarHeight(height);
    }
  }, [folders]); // Перераховуємо висоту коли змінюються папки


  //-- GET -- //
  // Отримати назви папок
  useEffect(() => {
    if (isGetFolders && isAuth) {
      instance
        .get(`/folders`)
        .then((res) => {
          setFolders(res.data)

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
    navigate(`user/folders/${folder.name}`);
  }


  return (
    <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
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

      <Box sx={{
        flexBasis: isAuth && showSidebar ? "70%" : "100%",
        flexGrow: 1,
        transition: "flex-basis 0.7s ease-in-out"
      }}>
        <GeneralMovieList
          folders={folders}
          setFolders={setFolders}
          setIsGetFolders={setIsGetFolders}
        />
      </Box>
    </Box>
  )
}

export default HomePage