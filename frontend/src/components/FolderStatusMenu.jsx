import { Box } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import { FOLDER_STATUS_OPTIONS, getStatusColorToken } from '../utils/folderStatus'

// Кольорова крапка статусу. Без статусу — порожнє кільце.
// Обгортка 24×24 збігається з розміром іконок MUI, тож підписи в меню
// вирівнюються однаково незалежно від того, крапка це чи іконка.
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

/**
 * Пункти вибору статусу для DropdownMenu — єдине джерело для всіх місць,
 * де статус змінюється (меню «⋮» і чіп на сторінці папки).
 *
 * onChange(value) — value це код статусу або null («прибрати статус»).
 * Пункт «Remove status» з'являється лише коли статус є, інакше він нічого не робив би.
 */
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
