import { Box } from '@mui/material'
import React from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import ImageIcon from '@mui/icons-material/Image';
import HideImageIcon from '@mui/icons-material/HideImage';
import DropdownMenu from '../_customMUI/DropdownMenu';


function UpdateFolder({ actionFunctions, hasImage = false }) {
    const items = [
        { key: "Rename", label: "Rename", icon: <EditIcon />, onClick: actionFunctions.handleClickRename },
        { key: "AddImage", label: "Add image", icon: <ImageIcon />, onClick: actionFunctions.handleClickAddImage },
        ...(hasImage
            ? [{ key: "RemoveImage", label: "Remove image", icon: <HideImageIcon />, onClick: actionFunctions.handleClickRemoveImage }]
            : []),
        { key: "Up", label: "Up", icon: <ArrowUpwardIcon />, onClick: actionFunctions.handleIncrementOrder },
        { key: "Down", label: "Down", icon: <ArrowDownwardIcon />, onClick: actionFunctions.handleDecrementOrder },
        { key: "Delete", label: "Delete", icon: <ClearIcon />, onClick: actionFunctions.handleClickDelete },
    ]

    return (
        <DropdownMenu
            width={160}
            stopPropagation
            items={items}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            renderTrigger={({ onClick }) => (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MoreVertIcon
                        aria-haspopup="true"
                        onClick={onClick}
                        sx={{
                            py: "12px",
                            px: 1,
                            borderRadius: 2,
                            ":hover": {
                                backgroundColor: "yellow.dark",
                            },
                        }}
                    />
                </Box>
            )}
        />
    )
}

export default UpdateFolder
