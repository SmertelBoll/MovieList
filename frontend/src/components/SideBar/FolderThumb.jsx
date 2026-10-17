import { Box, CircularProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import FolderIcon from '@mui/icons-material/Folder'
import { getStatusColorToken } from '../../utils/folderStatus'

/**
 * Мініатюра папки: показує картинку папки (folder.image), якщо вона є,
 * інакше — стандартну іконку. Під час завантаження — спіннер.
 * size — розмір зарезервованого квадрата (px).
 *
 * Картинка, іконка і спіннер рендеряться у боксі однакового розміру,
 * тож текст поряд завжди починається з тієї самої позиції.
 *
 * Якщо в профілі ввімкнено «Color folder icons» (за замовчуванням вимкнено), стандартна іконка
 * фарбується в колір статусу папки; без статусу — звичайний колір тексту.
 * Клас folder-status-icon дозволяє кнопці-батьку повернути темний колір на жовтому фоні.
 */
function FolderThumb({ folder, size = 24, loading = false }) {
    const colorByStatus = useSelector((state) => Boolean(state.auth.data?.colorFolderIcons))
    return (
        <Box
            sx={{
                width: size,
                height: size,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {loading ? (
                <CircularProgress size={size * 0.8} color="inherit" />
            ) : folder?.image ? (
                <Box
                    component="img"
                    src={folder.image}
                    alt={folder.name}
                    sx={{
                        width: size,
                        height: size,
                        objectFit: 'cover',
                        borderRadius: 1,
                        display: 'block',
                    }}
                />
            ) : (
                // Без кольору (чи без статусу) inherit — щоб на жовтому фоні (наведення / вибрана папка)
                // іконка темніла разом з текстом кнопки
                <FolderIcon
                    className="folder-status-icon"
                    sx={{ fontSize: size, color: (colorByStatus && getStatusColorToken(folder?.status)) || 'inherit' }}
                />
            )}
        </Box>
    )
}

export default FolderThumb
