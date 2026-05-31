import { Box, Typography } from '@mui/material'
import React, { useState } from 'react'
import SecondaryButton from '../Buttons/SecondaryButton'
import FolderIcon from '@mui/icons-material/Folder';
import { useTheme } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import { alertConfirm, alertError } from '../../alerts';

import UpdateFolder from './UpdateFolder';
import RenameFolderInput from './RenameFolderInput';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import instance from '../../axios';
import { useNavigate } from 'react-router-dom';



function SideBar({
    folders,
    setFolders,
    setIsGetFolders,
    handleClickToFolder,
    selectedFolder,
    sx
}) {
    const isAuth = useSelector(selectIsAuth);
    const navigate = useNavigate();

    const theme = useTheme();

    const [isInputNewFolder, setIsInputNewFolder] = useState(false)     // чи активовано поле інпуту для створення нової папки (T/F)
    const [curFolderToRename, setCurFolderToRename] = useState(false);  // obj папки, якій міняємо назву
    const [curFolderName, setCurFolderName] = useState(false)           // значення в інпуті для папки, якій міняємо назву

    //-- ADD -- //
    // Додаємо нову папку
    const handleAddFolder = () => {
        if (!curFolderToRename) {
            const timestamp = Date.now();
            const newFolderName = `${timestamp}`; // Назва нової папки

            instance
                .post(`/folders`, { name: newFolderName })
                .then((res) => {
                    setIsInputNewFolder(true)
                    setFolders(prev => [...prev, res.data.results])
                    setCurFolderToRename(res.data.results)
                    setCurFolderName("folder")
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        }
    }

    //-- RENAME -- //
    // Натиснуто кнопку rename в панелі вибору дій. Перетворюємо папку на input
    const handleClickRename = (folder) => {
        setIsInputNewFolder(false)
        setCurFolderToRename(folder)
        setCurFolderName(folder.name)
    }

    // Відслідковує input при зміні назви папки
    const handleInputChange = (event) => {
        const { _, value } = event.target;
        setCurFolderName(value);
    };

    // Міняє назву папки у базі даних, оновлюємо state
    const handleUpdateFolderName = (folder, newFolderName) => {
        instance
            .patch(`/folders/${folder.name}`, { name: newFolderName })
            .then((res) => {
                setFolders((prevFolders) =>
                    [...prevFolders.filter((el) => el.name !== folder.name), res.data.results]
                );
                setCurFolderToRename(false)
                setCurFolderName(false)
            })
            .catch((err) => {
                console.warn(err);
                console.log(err)
                alertError(err);
            });
    };

    //-- DELETE -- //
    // Натиснуто кнопку delete в панелі вибору дій. Запитуємо чи користувач впевнений
    const handleClickDelete = (folder, pressure = false) => {
        if (pressure) {
            deleteFolder(folder)
        } else {
            alertConfirm("Are you sure?", () => deleteFolder(folder));
        }
    };
    // Видалення папки
    const deleteFolder = (folder) => {
        instance
            .delete(`/folders/${folder.name}`)
            .then((res) => {
                setFolders((prevFolders) =>
                    prevFolders.filter((el) => el.name !== folder.name)
                );
                setIsGetFolders(true)
                setCurFolderToRename(false)
                setCurFolderName(false)

            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }

    //-- CHANGE ORDER -- //
    // Перемістити вверх по черзі
    const handleIncrementOrder = (folder) => {
        instance
            .patch(`/folders/orderIncrement/${folder.name}`)
            .then((res) => {
                if (res.data.success) { setIsGetFolders(true) }
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }
    // Перемістити вниз по черзі
    const handleDecrementOrder = (folder) => {
        instance
            .patch(`/folders/orderDecrement/${folder.name}`)
            .then((res) => {
                if (res.data.success) setIsGetFolders(true)
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }

    return (
        <Box bgcolor="bg.second" sx={{
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            borderRadius: 2,
            ...sx
        }}>
            <Typography
                variant="p"
                color="text.main"
                onClick={() => navigate('/folders')}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
            >
                My folders
            </Typography>

            <Box>
                <SecondaryButton
                    startIcon={<AddIcon />}
                    fullWidth
                    onClick={handleAddFolder}
                    sx={{ display: "flex", justifyContent: "flex-start" }}
                >
                    <Typography variant="desc1">add folder</Typography>
                </SecondaryButton>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "start" }}>
                {folders.sort((a, b) => b.order - a.order).map(folder => (
                    <React.Fragment key={folder.order}>
                        {
                            curFolderToRename?.order === folder.order
                                ? <RenameFolderInput
                                    curFolderName={curFolderName}
                                    handleInputChange={handleInputChange}
                                    handleUpdateFolderName={handleUpdateFolderName}
                                    folder={folder}
                                    handleClickDelete={handleClickDelete}
                                    isInputNewFolder={isInputNewFolder}
                                />
                                : <SecondaryButton
                                    startIcon={<FolderIcon />}
                                    isThreePoints={true}
                                    onClick={() => { handleClickToFolder(folder) }}
                                    fullWidth
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        backgroundColor:
                                            selectedFolder && selectedFolder.order === folder.order
                                                ? theme.palette.bg.selected
                                                : 'inherit',
                                    }}
                                >
                                    <Typography
                                        variant="desc1"
                                        noWrap
                                        sx={{
                                            textAlign: 'left',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            flexGrow: 1, // текст займе всю доступну ширину
                                        }}
                                    >
                                        {folder.name}
                                    </Typography>
                                    <UpdateFolder
                                        actionFunctions={{
                                            handleClickRename: () => handleClickRename(folder),
                                            handleClickDelete: () => handleClickDelete(folder),
                                            handleIncrementOrder: () => handleIncrementOrder(folder),
                                            handleDecrementOrder: () => handleDecrementOrder(folder),
                                        }}
                                    />
                                </SecondaryButton>

                        }

                    </React.Fragment>
                ))}
            </Box>
        </Box>
    )
}

export default SideBar