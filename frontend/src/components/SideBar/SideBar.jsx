import { Box, Button, InputAdornment, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import SecondaryButton from '../Buttons/SecondaryButton'
import FolderIcon from '@mui/icons-material/Folder';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { alertConfirm, alertError } from '../../alerts';
import axiosInstance from '../../axios';
import UpdateFolder from './UpdateFolder';
import RenameFolderInput from './RenameFolderInput';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import instance from '../../axios';



function SideBar({
    folders,
    setFolders,
    setIsGetFolders,
    handleClickToFolder,
    selectedFolder,
    sx
}) {
    const isAuth = useSelector(selectIsAuth);

    const theme = useTheme();

    const [curFolderToRename, setCurFolderToRename] = useState(false);  // order, якій папці міняємо назву
    const [curFolderName, setCurFolderName] = useState(false)           // значення в інпуті для папки, якій міняємо назву
    const [isNewFolder, setIsNewFolder] = useState(false)

    //-- ADD -- //
    // Додаємо нову папку
    const handleAddFolder = () => {
        if (!curFolderToRename) {
            const timestamp = Date.now();
            const newFolderName = `${timestamp}`; // Назва нової папки

            instance
                .post(`/folders/create`, { name: newFolderName })
                .then((res) => {
                    setIsNewFolder(true)
                    setFolders(prev => [...prev, res.data])
                    setCurFolderToRename(res.data.order)
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
    const handleClickRename = (order, name) => {
        setIsNewFolder(false)
        setCurFolderToRename(order)
        setCurFolderName(name)
    }

    // Відслідковує input при зміні назви папки
    const handleInputChange = (event) => {
        const { _, value } = event.target;
        setCurFolderName(value);
    };

    // Міняє назву папки у базі даних, оновлюємо state
    const handleUpdateFolderName = (order, newFolderName) => {
        instance
            .patch(`/folders/rename/${order}`, { name: newFolderName })
            .then((res) => {
                setFolders((prevFolders) =>
                    [...prevFolders.filter((folder) => folder.order !== order), res.data]
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
    const handleClickDelete = (order, pressure = false) => {
        if (pressure) {
            deleteFolder(order)
        } else {
            alertConfirm("Are you sure?", () => deleteFolder(order));
        }
    };

    // Видалення папки
    const deleteFolder = (order) => {
        instance
            .delete(`/folders/${order}`)
            .then((res) => {
                setFolders((prevFolders) =>
                    prevFolders.filter((folder) => folder.order !== order)
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
    const handleIncrementOrder = (order) => {
        instance
            .patch(`/folders/orderIncrement/${order}`)
            .then((res) => {
                if (res.data.success) { setIsGetFolders(true) }
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }

    // Перемістити вниз по черзі
    const handleDecrementOrder = (order) => {
        instance
            .patch(`/folders/orderDecrement/${order}`)
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
            <Typography variant="p" color="text.main" >My folders</Typography>

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
                            curFolderToRename === folder.order
                                ? <RenameFolderInput
                                    curFolderName={curFolderName}
                                    handleInputChange={handleInputChange}
                                    handleUpdateFolderName={handleUpdateFolderName}
                                    folderOrder={folder.order}
                                    handleClickDelete={handleClickDelete}
                                    isNewFolder={isNewFolder}
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
                                            handleClickRename: () => handleClickRename(folder.order, folder.name),
                                            handleClickDelete: () => handleClickDelete(folder.order),
                                            handleIncrementOrder: () => handleIncrementOrder(folder.order),
                                            handleDecrementOrder: () => handleDecrementOrder(folder.order),
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