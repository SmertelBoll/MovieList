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

// Вигляд кнопки. corner — у куті постера картки, hero — у шапці сторінки фільму/серіалу.
// Правило сайту: кнопки на постері завжди справа зверху.
const hoverSx = {
    '@media (hover: hover)': { '&:hover': {
        opacity: 1,
        backgroundColor: 'yellow.main',
        '& svg': { color: 'text.dark' },
    } },
}
const TONES = {
    corner: {
        plate: { position: 'absolute', right: 5, top: 5, backgroundColor: 'text.main', opacity: 0.8, zIndex: 1, borderRadius: 2, ...hoverSx },
        icon: 'bg.second',
    },
    hero: {
        plate: { position: 'absolute', right: { xs: 12, sm: 20 }, top: { xs: 12, sm: 20 }, backgroundColor: 'overlay.onImage', opacity: 0.9, zIndex: 2, borderRadius: 2, ...hoverSx },
        icon: 'text.dark',
    },
}

/**
 * Єдина кнопка «додати в папку / редагувати збережене» для фільму чи серіалу.
 * Знає, в яких папках лежить елемент, з індексу збережених (redux `saved`).
 *
 *  - Не збережений: плюс → onAdd().
 *  - Збережений, variant="menu": меню Add / Edit / Delete.
 *  - Збережений, variant="direct": значок статусу, клік → одразу редагування.
 *
 * Якщо елемент лежить у кількох папках, перед Edit / Delete (чи кліком у direct)
 * з'являється вікно вибору папки. Одна папка — діалог відкривається одразу.
 *
 * isCopy — кнопка стоїть на конкретній копії (сторінка папки, /user/movie/:id):
 * меню є завжди, а Edit / Delete стосуються саме цієї копії (onEdit(null) / onDelete(null)),
 * вибору папки немає. Інакше onEdit / onDelete отримують обрану копію
 * { mongoId, folderName, status, image }.
 *
 * Підказка при наведенні перелічує всі папки елемента по блоках статусу.
 */
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

    // Копія, з якою працюємо: на копії — вона сама (null), інакше обрана користувачем.
    // undefined — користувач закрив вікно вибору, дію скасовано.
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
