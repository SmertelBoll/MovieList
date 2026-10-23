import { Dialog, DialogActions, DialogContent, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import MainButton from '../Buttons/MainButton'
import { toDateOnlyISO } from '../../utils/dates'
import DateField from '../DateField'

// Bulk "watched" dialog (whole season): asks the watch date for all marked episodes (default today, can be cleared).
// onConfirm(dateAdded)
function MarkWatchedDialog({ open, title, description, onClose, onConfirm }) {
    const [date, setDate] = useState(new Date())
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

                <DateField value={date} onChange={(newDate) => setDate(newDate)} />

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
