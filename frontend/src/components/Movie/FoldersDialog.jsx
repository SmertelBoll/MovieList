import { Box, Dialog, DialogTitle, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, useTheme } from '@mui/material';
import React, { useMemo } from 'react'
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import TextFieldCustom from '../customMUI/TextFieldCustom';
import CheckIcon from '@mui/icons-material/Check';



function FoldersDialog({
    onClose,
    selectedFolder,
    open,
    folders,
    curFolderName,
    curFolderToRename,
    handleUpdateFolderName,
    handleInputChange,
    handleAddFolder

}) {
    const handleClose = () => {
        onClose(selectedFolder);
    };

    const handleListItemClick = (value) => {
        onClose(value);
    };

    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    return (
        <Dialog
            onClose={handleClose}
            open={open}
            PaperProps={{
                sx: { minWidth: "300px" }, // Стилі для Paper
            }}>
            <DialogTitle sx={{ textAlign: "center" }} >Choose folder</DialogTitle>
            <List sx={{ pt: 0 }}>
                <ListItem disablePadding>
                    <ListItemButton
                        autoFocus
                        onClick={() => handleAddFolder()}
                        sx={{
                            display: 'flex',
                            gap: 2,
                            ":hover": {
                                backgroundColor: "yellow.main",
                                color: "text.dark",
                            },
                        }}
                    >
                        <AddIcon />
                        <ListItemText>add folder</ListItemText>
                    </ListItemButton>
                </ListItem>

                {curFolderToRename && <ListItem >
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
                                handleUpdateFolderName(curFolderToRename, curFolderName); // Викликаємо функцію при натисканні Enter
                            }
                        }} // Додаємо обробник клавіші
                        slotProps={{
                            input: {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <CheckIcon
                                            color="success"
                                            onClick={() => handleUpdateFolderName(curFolderToRename, curFolderName)} // Додаємо подію на клік
                                            style={{ cursor: 'pointer' }} // Змінюємо курсор, щоб вказати, що це клікабельний елемент
                                        />
                                    </InputAdornment>
                                ),
                            },
                        }}
                    />
                </ListItem>
                }

                {folders?.map((folder) => (
                    <React.Fragment key={folder.order}>
                        {
                            curFolderToRename !== folder.order
                                ? <ListItem disablePadding key={folder.name}>
                                    <ListItemButton
                                        onClick={() => handleListItemClick(folder)}
                                        sx={{
                                            display: 'flex', gap: 2, ":hover": {
                                                backgroundColor: "yellow.main",
                                                color: "text.dark",
                                            },
                                        }}
                                    >
                                        <FolderIcon />
                                        <ListItemText>
                                            {folder.name.length > 30 ? `${folder.name.slice(0, 30)}...` : folder.name}
                                        </ListItemText>
                                    </ListItemButton>
                                </ListItem>
                                : <></>
                        }
                    </React.Fragment>

                ))}
            </List>
        </Dialog >
    );
}

export default FoldersDialog