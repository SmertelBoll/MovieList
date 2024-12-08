import { Box } from '@mui/material'
import React from 'react'
import ContainerCustom from '../../components/customMUI/ContainerCustom'
import SideBar from '../../components/SideBar/SideBar'
import GeneralMovieList from './GeneralMovieList'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'

function HomePage() {
  const isAuth = useSelector(selectIsAuth);

  return (
    <ContainerCustom paddingY bgcolor="bg.main" sx={{ display: "flex", gap: 3, width: "100%" }}>
      {isAuth
        ? <Box sx={{ flexBasis: "30%", flexGrow: 1, maxWidth: "280px" }}>
          <SideBar />
        </Box>
        : null
      }
      <Box sx={{ flexBasis: isAuth ? "70%" : "100%", flexGrow: 1 }}>
        <GeneralMovieList />
      </Box>
    </ContainerCustom>
  )
}

export default HomePage