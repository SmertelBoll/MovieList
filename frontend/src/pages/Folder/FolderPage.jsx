import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, Typography, Button } from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import instance from '../../axios';
import { alertError } from '../../alerts';
import SideBar from '../../components/SideBar/SideBar';
import GeneralMovieList from '../../components/GereralMovieList/GeneralMovieList';

const rawUrl = `http://localhost:4444/folders`

function FolderPage() {
    const { folderName } = useParams();
    const url = {
        main: `${rawUrl}/${folderName}`,
        search: `${rawUrl}/${folderName}`
    }

    const isAuth = useSelector(selectIsAuth);
    const navigate = useNavigate();

    const [folders, setFolders] = useState([])                  // Папки
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос
    const [showSidebar, setShowSidebar] = useState(true);
    const [sidebarHeight, setSidebarHeight] = useState(0);
    const sidebarRef = React.useRef(null);

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

    return (
        <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
            <Box sx={{
                flexGrow: 1,
                transition: "flex-basis 0.7s ease-in-out"
            }}>
                <GeneralMovieList
                    folders={folders}
                    setFolders={setFolders}
                    setIsGetFolders={setIsGetFolders}
                    url={url}
                    dbType="mongo"
                    pageTitle={folderName}
                />
            </Box>
        </Box>
    )
}

export default FolderPage