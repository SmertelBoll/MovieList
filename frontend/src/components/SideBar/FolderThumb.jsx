import { Box, CircularProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import FolderIcon from '@mui/icons-material/Folder'
import { getStatusColorToken } from '../../utils/folderStatus'

// Folder thumbnail: image, default icon or upload spinner in an equal-size box. With "Color folder icons" (profile) the
// icon takes the status color;
// folder-status-icon lets the parent restore dark on yellow.
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
                // No color (or no status) = inherit, so on yellow (hover / selected folder) the icon darkens
                // with the button text.
                <FolderIcon
                    className="folder-status-icon"
                    sx={{ fontSize: size, color: (colorByStatus && getStatusColorToken(folder?.status)) || 'inherit' }}
                />
            )}
        </Box>
    )
}

export default FolderThumb
