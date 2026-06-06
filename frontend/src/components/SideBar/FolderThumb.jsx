import { Box, CircularProgress } from '@mui/material'
import FolderIcon from '@mui/icons-material/Folder'

/**
 * Мініатюра папки: показує картинку папки (folder.image), якщо вона є,
 * інакше — стандартну іконку. Під час завантаження — спіннер.
 * size — розмір зарезервованого квадрата (px).
 *
 * Картинка, іконка і спіннер рендеряться у боксі однакового розміру,
 * тож текст поряд завжди починається з тієї самої позиції.
 */
function FolderThumb({ folder, size = 24, loading = false }) {
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
                <FolderIcon sx={{ fontSize: size, color: 'text.main' }} />
            )}
        </Box>
    )
}

export default FolderThumb
