import { IconButton, Tooltip } from '@mui/material'
import { useSelector } from 'react-redux'
import AddIcon from '@mui/icons-material/Add'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import { selectSavedCopies } from '../redux/slices/SavedSlice'
import { STATUS_CORNER_ICON, getBestStatus } from '../utils/folderStatus'
import useFolderPicker from '../hooks/useFolderPicker'
import DropdownMenu from './_customMUI/DropdownMenu'
import FolderListTooltip from './FolderListTooltip'

// Button look: corner = on a card poster, hero = on the movie/tv page header. Buttons on posters are always
// top right.
const hoverSx = {
    '@media (hover: hover) and (pointer: fine)': { '&:hover': {
        opacity: 1,
        backgroundColor: 'yellow.main',
        '& svg': { color: 'text.dark' },
    } },
}
// On touch MUI sets a transparent IconButton background (specificity 0,2,0) under sticky :hover,
// so the own background is repeated under &.MuiIconButton-root.
const TONES = {
    corner: {
        plate: { position: 'absolute', right: 5, top: 5, backgroundColor: 'text.main', '&.MuiIconButton-root': { backgroundColor: 'text.main' }, opacity: 0.8, zIndex: 1, borderRadius: 2, ...hoverSx },
        icon: 'bg.second',
    },
    hero: {
        plate: { position: 'absolute', right: { xs: 12, sm: 20 }, top: { xs: 12, sm: 20 }, backgroundColor: 'overlay.onImage', '&.MuiIconButton-root': { backgroundColor: 'overlay.onImage' }, opacity: 0.9, zIndex: 2, borderRadius: 2, ...hoverSx },
        icon: 'text.dark',
    },
}

// Add-to-folder / edit-saved button for a movie or tv (folders come from the saved index). Not saved: plus -> onAdd().
// Saved: variant "menu" = Add/Edit/Delete menu, "direct" = edit right away. Several folders: a folder picker comes
// first.
function ItemFolderButton({
    mediaType,
    tmdbId,
    itemTitle,
    isCopy = false,
    variant = 'menu',
    tone = 'corner',
    stopPropagation = false,
    onAdd,
    onEdit,
    onDelete,
    sx,
}) {
    const copies = useSelector(selectSavedCopies(mediaType, tmdbId))
    const [pickFolder, pickerDialog] = useFolderPicker()
    const { plate, icon: iconColor } = TONES[tone]

    const isSaved = isCopy || copies.length > 0

    const tooltipTitle = copies.length > 0
        ? <FolderListTooltip folders={copies} />
        : (isSaved ? '' : 'Add to folder')

    const stop = (e) => { if (stopPropagation) e.stopPropagation() }

    // The copy to act on: itself on a copy page (null), otherwise the one the user picked. undefined = picker
    // dismissed, action cancelled.
    const resolveCopy = async (action) => {
        if (isCopy) return null
        const copy = await pickFolder({ copies, title: `${action} in which folder?`, subtitle: itemTitle, filterText: itemTitle })
        return copy || undefined
    }

    const handleEdit = async () => {
        const copy = await resolveCopy('Edit')
        if (copy !== undefined) onEdit?.(copy)
    }
    const handleDelete = async () => {
        const copy = await resolveCopy('Delete')
        if (copy !== undefined) onDelete?.(copy)
    }

    const buttonSx = { ...plate, ...sx }
    const iconSx = { opacity: 1, color: iconColor }

    let content
    if (!isSaved) {
        content = (
            <Tooltip title={tooltipTitle} arrow placement="top">
                <IconButton
                    aria-label="add to folder"
                    onClick={(e) => { stop(e); onAdd?.() }}
                    sx={buttonSx}
                >
                    <AddIcon sx={iconSx} />
                </IconButton>
            </Tooltip>
        )
    } else if (variant === 'direct') {
        const Icon = STATUS_CORNER_ICON[getBestStatus(copies.map((c) => c.status))] || BookmarkIcon
        content = (
            <Tooltip title={tooltipTitle} arrow placement="top">
                <IconButton
                    aria-label="edit saved"
                    onClick={(e) => { stop(e); handleEdit() }}
                    sx={buttonSx}
                >
                    <Icon sx={iconSx} />
                </IconButton>
            </Tooltip>
        )
    } else {
        content = (
            <DropdownMenu
                width={140}
                stopPropagation={stopPropagation}
                items={[
                    { key: 'Add', label: 'Add', onClick: () => onAdd?.() },
                    { key: 'Edit', label: 'Edit', onClick: handleEdit },
                    { key: 'Delete', label: 'Delete', onClick: handleDelete },
                ]}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                renderTrigger={({ onClick }) => (
                    <Tooltip title={tooltipTitle} arrow placement="top">
                        <IconButton aria-label="edit saved" onClick={onClick} sx={buttonSx}>
                            <MoreVertIcon sx={iconSx} />
                        </IconButton>
                    </Tooltip>
                )}
            />
        )
    }

    return (
        <>
            {content}
            {pickerDialog}
        </>
    )
}

export default ItemFolderButton
