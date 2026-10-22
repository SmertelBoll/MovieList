import { Box, Dialog, DialogActions, DialogContent, Typography, useTheme } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import TextFieldCustom from '../_customMUI/TextFieldCustom'
import MainButton from '../Buttons/MainButton'
import { toDateOnlyISO } from '../../utils/dates'

/**
 * Діалог масового «переглянуто» (весь сезон): запитує дату перегляду, яку отримають усі позначені серії.
 * За замовчуванням — сьогодні; поле можна очистити, тоді серії позначаються без дати.
 *
 * onConfirm(dateAdded) — dateAdded: ISO-рядок календарного дня або null (без дати).
 */
function MarkWatchedDialog({ open, title, description, onClose, onConfirm }) {
    const theme = useTheme()
    const dateFormat = useSelector((state) => state.config.dateFormat)
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, false),
        [theme.palette.bg.second, theme.palette.text.main]
    )

    const [date, setDate] = useState(new Date())
    // Щоразу при відкритті починаємо із сьогоднішньої дати
    useEffect(() => {
        if (open) setDate(new Date())
    }, [open])

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogContent sx={{ bgcolor: 'bg.second', display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
                <Typography variant="p" sx={{ textAlign: 'left' }}>
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {description}
                    </Typography>
                )}

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Choose date"
                        format={dateFormat}
                        value={date}
                        onChange={(newDate) => setDate(newDate)}
                        slots={{ textField: InputBox }}
                        slotProps={{
                            textField: { fullWidth: true, sx: { mb: 0 } },
                            // Хрестик очищення — серії можна позначити без дати
                            field: { clearable: true },
                        }}
                    />
                </LocalizationProvider>

                <DialogActions sx={{ p: 0, gap: 1 }}>
                    <MainButton
                        onClick={onClose}
                        sx={{
                            m: 0,
                            bgcolor: 'transparent',
                            color: 'text.main',
                            border: '1px solid',
                            borderColor: 'text.secondary',
                            '@media (hover: hover) and (pointer: fine)': { ':hover': { bgcolor: 'bg.selected' } },
                        }}
                    >
                        Cancel
                    </MainButton>
                    <MainButton onClick={() => onConfirm(toDateOnlyISO(date))} sx={{ m: 0 }}>
                        Mark as watched
                    </MainButton>
                </DialogActions>
            </DialogContent>
        </Dialog>
    )
}

export default MarkWatchedDialog
