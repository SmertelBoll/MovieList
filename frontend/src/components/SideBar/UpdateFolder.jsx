import { Box, Button, Menu, MenuItem, Typography } from '@mui/material'
import React, { useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';


function UpdateFolder({ objUpdate, actionFunctions }) {
    const updateItems = [
        { title: "Rename", icon: <EditIcon />, func: actionFunctions.handleClickRename },
        { title: "Up", icon: <ArrowUpwardIcon />, func: actionFunctions.handleIncrementOrder },
        { title: "Down", icon: <ArrowDownwardIcon />, func: actionFunctions.handleDecrementOrder },
        { title: "Delete", icon: <ClearIcon />, func: actionFunctions.handleClickDelete },
    ]

    const [updateElement, setUpdateElement] = useState(null);
    const open = Boolean(updateElement);
    const handleClick = (event) => {
        event.stopPropagation()
        setUpdateElement(event.currentTarget);
    };

    const handleClose = (event) => {
        event.stopPropagation()
        setUpdateElement(null);
    };

    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            <MoreVertIcon
                id="basic-button"
                aria-controls={open ? 'basic-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                onClick={handleClick}
                sx={{
                    py: "12px",
                    px: 1,
                    borderRadius: 2,
                    ":hover": {
                        backgroundColor: "yellow.dark",
                    },
                }}
            >
            </MoreVertIcon>
            <Menu
                id="basic-menu"
                anchorEl={updateElement}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
                anchorOrigin={{
                    vertical: 'top',  // вертикальне положення
                    horizontal: 'right', // горизонтальне положення
                }}
                transformOrigin={{
                    vertical: 'top',  // вертикальне положення
                    horizontal: 'left', // горизонтальне положення
                }}
            >
                {updateItems.map((obj) => (
                    <MenuItem
                        key={obj.title}
                        onClick={(event) => {
                            event.stopPropagation(); // Зупиняємо сповіщення події
                            obj.func();
                            setUpdateElement(null);
                        }}
                        sx={{ display: "flex", gap: 1 }}>
                        {obj.icon}
                        <Typography>{obj.title}</Typography>
                    </MenuItem>
                ))}

            </Menu >
        </Box>
    )
}

export default UpdateFolder