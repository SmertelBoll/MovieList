import { Box } from '@mui/material'
import React, { useState } from 'react'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ClearIcon from '@mui/icons-material/Clear';
import ImageIcon from '@mui/icons-material/Image';
import HideImageIcon from '@mui/icons-material/HideImage';
import LabelIcon from '@mui/icons-material/Label';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DropdownMenu from '../_customMUI/DropdownMenu';
import { getStatusLabel } from '../../utils/folderStatus';
import { StatusDot, buildStatusMenuItems } from '../FolderStatusMenu';

function UpdateFolder({ actionFunctions, hasImage = false, status = null }) {
    // DropdownMenu has no submenus, so drill down inside one popup: the "Status" item switches the menu
    // content instead of closing it.
    const [view, setView] = useState('main')

    const canChangeStatus = Boolean(actionFunctions.handleChangeStatus)

    const mainItems = [
        { key: "Rename", label: "Rename", icon: <EditIcon />, onClick: actionFunctions.handleClickRename },
        { key: "AddImage", label: "Add image", icon: <ImageIcon />, onClick: actionFunctions.handleClickAddImage },
        ...(hasImage
            ? [{ key: "RemoveImage", label: "Remove image", icon: <HideImageIcon />, onClick: actionFunctions.handleClickRemoveImage }]
            : []),
        ...(canChangeStatus
            ? [{
                key: "Status",
                label: "Status",
                subLabel: getStatusLabel(status),
                icon: <LabelIcon />,
                endAdornment: <StatusDot status={status} />,
                closeOnClick: false,
                onClick: () => setView('status'),
            }]
            : []),
        { key: "Up", label: "Up", icon: <ArrowUpwardIcon />, onClick: actionFunctions.handleIncrementOrder },
        { key: "Down", label: "Down", icon: <ArrowDownwardIcon />, onClick: actionFunctions.handleDecrementOrder },
        { key: "Delete", label: "Delete", icon: <ClearIcon />, onClick: actionFunctions.handleClickDelete },
    ]

    const statusItems = [
        {
            key: "__back__",
            label: "Status",
            icon: <ArrowBackIcon />,
            closeOnClick: false,
            onClick: () => setView('main'),
        },
        { key: "__statusDivider__", divider: true },
        ...buildStatusMenuItems({ status, onChange: actionFunctions.handleChangeStatus }),
    ]

    return (
        <DropdownMenu
            width={200}
            stopPropagation
            items={view === 'status' ? statusItems : mainItems}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            renderTrigger={({ onClick }) => (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                    <MoreVertIcon
                        aria-haspopup="true"
                        // The menu always opens on the main list; DropdownMenu doesn't report closing, so
                        // reset here.
                        onClick={(e) => { setView('main'); onClick(e); }}
                        sx={{
                            py: 1.5,
                            px: 1,
                            borderRadius: 2,
                            '@media (hover: hover) and (pointer: fine)': { ":hover": {
                                backgroundColor: "yellow.dark",
                            } },
                        }}
                    />
                </Box>
            )}
        />
    )
}

export default UpdateFolder
