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



function SideBar({
    folders,
    curFolderName,
    curFolderToRename,
    handleAddFolder,
    handleClickRename,
    handleInputChange,
    handleUpdateFolderName,
    handleClickDelete,
    handleIncrementOrder,
    handleDecrementOrder,
}) {
    const isAuth = useSelector(selectIsAuth);

    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    const navigate = useNavigate();

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

                        }

                    </React.Fragment>
                ))}
            </Box>
        </Box>
    )
}

export default SideBar