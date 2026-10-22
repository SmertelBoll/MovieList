import { Box } from '@mui/material'
import { STATUS_DISPLAY_ORDER, getStatusLabel } from '../utils/folderStatus'

// Tooltip content listing the folders that hold a movie/tv, grouped by status. Pass as Tooltip `title`;
// folders: [{ folderName, status }].
function FolderListTooltip({ folders = [] }) {
    const groups = STATUS_DISPLAY_ORDER
        .map((status) => ({
            status,
            // Several copies in one folder: show the name once
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
