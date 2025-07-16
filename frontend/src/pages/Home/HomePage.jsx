import { Box } from '@mui/material'
import React, { useEffect, useState } from 'react'
import ContainerCustom from '../../components/customMUI/ContainerCustom'
import SideBar from '../../components/SideBar/SideBar'
import GeneralMovieList from './GeneralMovieList'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios';
import { alertConfirm, alertError } from '../../alerts'
import { useNavigate } from 'react-router-dom'


function HomePage() {
  const isAuth = useSelector(selectIsAuth);
  const navigate = useNavigate();

  const [folders, setFolders] = useState([])                  // Папки
  const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос


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
    <ContainerCustom paddingY bgcolor="bg.main" sx={{ display: "flex", gap: 3, width: "100%" }}>
      {isAuth
        ? <Box sx={{ flexBasis: "30%", flexGrow: 1, maxWidth: "280px" }}>
          <SideBar
            folders={folders}
            setFolders={setFolders}
            setIsGetFolders={setIsGetFolders}
            handleClickToFolder={handleOpenFolder}
            selectedFolder={false}
          />
        </Box>
        : null
      }

      <Box sx={{ flexBasis: isAuth ? "70%" : "100%", flexGrow: 1 }}>
        <GeneralMovieList
          folders={folders}
          setFolders={setFolders}
          setIsGetFolders={setIsGetFolders}
        />
      </Box>
    </ContainerCustom>
  )
}

export default HomePage