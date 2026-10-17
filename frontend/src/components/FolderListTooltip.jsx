import { Box } from '@mui/material'
import { STATUS_DISPLAY_ORDER, getStatusLabel } from '../utils/folderStatus'

/**
 * Вміст підказки зі списком папок, де лежить фільм/серіал, по блоках статусу:
 *
 *   Watched:
 *       Folder 1
 *       Folder 2
 *   Dropped:
 *       Folder 4
 *
 * Передавати як `title` в Tooltip. folders: [{ folderName, status }]; status — null
 * для папки без статусу (блок "No status").
 */
function FolderListTooltip({ folders = [] }) {
    const groups = STATUS_DISPLAY_ORDER
        .map((status) => ({
            status,
            // Копій фільму в одній папці може бути кілька — назву показуємо раз
            names: [...new Set(folders.filter((f) => (f.status || null) === status).map((f) => f.folderName))],
        }))
        .filter((group) => group.names.length > 0)

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {groups.map((group) => (
                <Box key={group.status ?? 'none'}>
                    <Box sx={{ fontWeight: 700 }}>{getStatusLabel(group.status)}:</Box>
                    {group.names.map((name) => (
                        <Box key={name} sx={{ pl: 2 }}>{name}</Box>
                    ))}
                </Box>
            ))}
        </Box>
    )
}

export default FolderListTooltip
