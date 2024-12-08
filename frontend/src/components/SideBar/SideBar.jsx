import { Box, Button, InputAdornment, Typography } from '@mui/material'
import React, { useEffect, useMemo, useState } from 'react'
import SecondaryButton from '../Buttons/SecondaryButton'
import FolderIcon from '@mui/icons-material/Folder';
import TextFieldCustom from '../customMUI/TextFieldCustom';
import { useTheme } from '@emotion/react';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { Link, useNavigate } from 'react-router-dom';
import { alertConfirm, alertError } from '../../alerts';
import axiosInstance from '../../axios';
import UpdateFolder from './UpdateFolder';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';



function SideBar() {
    const isAuth = useSelector(selectIsAuth);

    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    const [folders, setFolders] = useState([])  // Папки
    const [curFolderToRename, setCurFolderToRename] = useState(false);  // order, якій папці міняємо назву
    const [curFolderName, setCurFolderName] = useState(false)           // значення в інпуті для папки, якій міняємо назву
    const [isGetFolders, setIsGetFolders] = useState(true)              // після видалення папки, у нас міняються order, тому треба новий запрос

    const navigate = useNavigate();

    //-- GET -- //
    // Отримати назви папок
    useEffect(() => {
        if (isGetFolders && isAuth) {
            axiosInstance
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

    //-- ADD -- //
    // Додаємо нову папку
    const handleAddFolder = () => {
        if (!curFolderToRename) {
            const timestamp = Date.now();
            const newFolderName = `${timestamp}`; // Назва нової папки

            axiosInstance
                .post(`/folders/create`, { name: newFolderName })
                .then((res) => {
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
        setCurFolderToRename(order)
        setCurFolderName(name)
    }

    // Відслідковує input при зміні назви папки
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setCurFolderName(value);
    };

    // Міняє назву папки у базі даних, оновлюємо state
    const handleUpdateFolderName = (order, newFolderName) => {
        axiosInstance
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
    const handleClickDelete = (order) => {
        alertConfirm("Are you sure?", () => deleteFolder(order));
    };

    // Видалення папки
    const deleteFolder = (order) => {
        axiosInstance
            .delete(`/folders/${order}`)
            .then((res) => {
                setFolders((prevFolders) =>
                    prevFolders.filter((folder) => folder.order !== order)
                );
                setIsGetFolders(true)

            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }

    //-- CHANGE ORDER -- //
    // Перемістити вверх по черзі
    const handleIncrementOrder = (order) => {
        axiosInstance
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
        axiosInstance
            .patch(`/folders/orderDecrement/${order}`)
            .then((res) => {
                if (res.data.success) setIsGetFolders(true)
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    }

    const handleOpenFolder = (name) => {
        // Ви можете виконати тут будь-які додаткові дії
        navigate(`user/folders/${name}`); // Перехід на /folders/folder0
    };


    return (
        <Box bgcolor="bg.second" sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2, borderRadius: 2 }}>
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
                                ? <Box sx={{ py: 1 }}>
                                    <InputBox
                                        value={curFolderName}
                                        onChange={handleInputChange}
                                        required
                                        fullWidth
                                        id="curFolder"
                                        name="curFolder"
                                        autoFocus
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                handleUpdateFolderName(folder.order, curFolderName); // Викликаємо функцію при натисканні Enter
                                            }
                                        }} // Додаємо обробник клавіші
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <CheckIcon
                                                            color="success"
                                                            onClick={() => handleUpdateFolderName(folder.order, curFolderName)} // Додаємо подію на клік
                                                            style={{ cursor: 'pointer' }} // Змінюємо курсор, щоб вказати, що це клікабельний елемент
                                                        />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>
                                : <SecondaryButton
                                    startIcon={<FolderIcon />}
                                    isThreePoints={true}
                                    onClick={() => { handleOpenFolder(folder.name) }}
                                    fullWidth
                                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
                            // : <Box display="flex" justifyContent="space-between" alignItems="center">
                            //     <Typography
                            //         noWrap
                            //         sx={{
                            //             overflow: 'hidden',
                            //             textOverflow: 'ellipsis',
                            //             whiteSpace: 'nowrap',
                            //             flexGrow: 1, // текст займе всю доступну ширину
                            //         }}
                            //     >
                            //         Це дуже довгий текст, який може не поміститися в одному рядку і буде обрізаний, якщо не вистачить місця.
                            //     </Typography>
                            //     <UpdateFolder
                            //         actionFunctions={{
                            //             handleClickRename: () => handleClickRename(folder.order, folder.name),
                            //             handleClickDelete: () => handleClickDelete(folder.order)
                            //         }}
                            //     />
                            // </Box>
                        }

                    </React.Fragment>
                ))}
            </Box>

            {/* <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "start" }}>
                {folders.sort((a, b) => b.order - a.order).map(folder => (
                    <React.Fragment key={folder.order}>
                        {
                            curFolderToRename === folder.order
                                ? <Box sx={{ py: 1 }}>
                                    <InputBox
                                        value={curFolderName}
                                        onChange={handleInputChange}
                                        required
                                        fullWidth
                                        id="curFolder"
                                        name="curFolder"
                                        autoFocus
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                handleUpdateFolderName(folder.order, curFolderName); // Викликаємо функцію при натисканні Enter
                                            }
                                        }} // Додаємо обробник клавіші
                                        slotProps={{
                                            input: {
                                                endAdornment: (
                                                    <InputAdornment position="end">
                                                        <CheckIcon
                                                            color="success"
                                                            onClick={() => handleUpdateFolderName(folder.order, curFolderName)} // Додаємо подію на клік
                                                            style={{ cursor: 'pointer' }} // Змінюємо курсор, щоб вказати, що це клікабельний елемент
                                                        />
                                                    </InputAdornment>
                                                ),
                                            },
                                        }}
                                    />
                                </Box>
                                :
                                // <Link to={`/folders/${folder.order}`}>
                                <SecondaryButton

                                    startIcon={<FolderIcon />}
                                    // objUpdate={{ order: folder.order, folders, setFolders }}
                                    // actionFunctions={{
                                    //     handleClickRename: () => handleClickRename(folder.order, folder.name),
                                    //     handleClickDelete: () => handleClickDelete(folder.order)
                                    // }}
                                    onClick={() => { handleOpenFolder(folder.name) }}
                                    fullWidth
                                    sx={{ display: "flex", justifyContent: "flex-start" }}
                                >
                                    <Typography variant="desc1">{folder.name}</Typography>
                                </SecondaryButton>
                            // </Link>
                        }
                    </React.Fragment>
                ))}




            </Box> */}
        </Box>
    )
}

export default SideBar