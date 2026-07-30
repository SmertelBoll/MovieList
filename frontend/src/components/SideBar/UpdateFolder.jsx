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
    // DropdownMenu не має вкладених підменю, тож робимо drill-down усередині
    // одного попапу: пункт "Status" не закриває меню, а перемикає його вміст.
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
                // Поточний статус видно одразу, без зайвого кліку
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
        // Спільний список — той самий, що й у чіпа на сторінці папки
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
                        // Меню завжди відкривається з головного списку:
                        // DropdownMenu не повідомляє про закриття, тож скидаємо тут
                        onClick={(e) => { setView('main'); onClick(e); }}
                        sx={{
                            py: 1.5,
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
