import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box } from '@mui/material'
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import instance from '../../axios';
import { alertError } from '../../alerts';
import GeneralItemList from '../../components/GereralItemList/GeneralItemList';

function FolderPage() {
    const { folderName } = useParams();

    const isAuth = useSelector(selectIsAuth);

    const [folders, setFolders] = useState([])                  // Папки
    const [curFolder, setCurFolder] = useState({})
    const [isGetFolders, setIsGetFolders] = useState(true)      // після видалення папки, у нас міняються order, тому треба новий запрос

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
                    console.warn(1111, err);
                    alertError(err);
                });
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth]);

    useEffect(() => {
        if (folders.length > 0) {
            const folder = folders.find((folder) => folder.name === folderName)
            setCurFolder(folder)
        }
    }, [folders, folderName])

    return (
        <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
            <Box sx={{
                flexGrow: 1,
                transition: "flex-basis 0.7s ease-in-out"
            }}>
                <GeneralItemList
                    // Бокова панель
                    folders={folders}
                    setFolders={setFolders}
                    setIsGetFolders={setIsGetFolders}
                    // Робота з базами даних
                    dbType="mongo"
                    urlParams={{}}
                    isPreperedData={false}
                    preperedData={false}
                    // Інформація сторінки
                    pageType="folder"
                    pageTitle={folderName}
                    isSearch={true}
                    isSort={true}
                    // Інше
                    objectOfFolderPage={curFolder}
                    customEndpoint={`${process.env.REACT_APP_URL_MONGO}/folders/${folderName}`}
                />
            </Box>
        </Box>
    )
}

export default FolderPage