import { Box } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { FOLDER_STATUS_OPTIONS, getStatusColorToken } from '../utils/folderStatus'

// Colored status dot; no status = empty ring. The 24x24 wrapper matches MUI icon size so menu labels line up.
export function StatusDot({ status, size = 10 }) {
    const token = getStatusColorToken(status)
    return (
        <Box sx={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    flexShrink: 0,
                    bgcolor: token || 'transparent',
                    ...(token ? {} : { border: '1px solid', borderColor: 'text.secondary' }),
                }}
            />
        </Box>
    )
}

// Status items for DropdownMenu: single source for the ⋮ menu and the folder page chip. onChange(value): status code or
// null (remove).
export function buildStatusMenuItems({ status, onChange }) {
    return [
        ...FOLDER_STATUS_OPTIONS.map((option) => ({
            key: option.value,
            label: option.label,
            selected: status === option.value,
            icon: <StatusDot status={option.value} />,
            endAdornment: status === option.value ? <CheckIcon fontSize="small" /> : null,
            onClick: () => onChange(option.value),
        })),
        ...(status
            ? [
                { key: '__removeDivider__', divider: true },
                {
                    key: '__remove__',
                    label: 'Remove status',
                    icon: <RemoveCircleOutlineIcon fontSize="small" />,
                    onClick: () => onChange(null),
                },
            ]
            : []),
    ]
}
