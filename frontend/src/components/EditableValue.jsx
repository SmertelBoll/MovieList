import { Box, Rating, Typography } from '@mui/material'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import MainButton from './Buttons/MainButton'
import RatingInput from './RatingInput'
import { formatRatingLabel } from '../utils/ratingSystem'
import { formatDateOnly, parseDateOnly, toDateOnlyISO } from '../utils/dates'
import DateField from './DateField'
import useInputBox from './_customMUI/useInputBox'

function EditActions({ onCancel, onSave, isSaving }) {
    return (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <MainButton
                onClick={onCancel}
                disabled={isSaving}
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
            <MainButton onClick={onSave} disabled={isSaving} sx={{ m: 0 }}>
                {isSaving ? 'Saving...' : 'Save'}
            </MainButton>
        </Box>
    )
}

// In-place editor for a saved item's values: type="text" (comment) or type="ratingDate" (rating + date saved
// together). A tap enables editing.
function EditableValue({ type = 'text', value, onSave, sx, title = 'My review', emptyText = 'No comment' }) {
    const isRatingDate = type === 'ratingDate'

    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])

    const InputBox = useInputBox({ dense: isRatingDate })

    const [isEditing, setIsEditing] = useState(false)
    // text: string; ratingDate: { rating 0-100 (0 = none), date: Date | null }
    const [draft, setDraft] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const startEditing = () => {
        setDraft(isRatingDate
            ? { rating: value?.rating || 0, date: parseDateOnly(value?.dateAdded) }
            : (value || ''))
        setIsEditing(true)
    }
    const cancel = () => setIsEditing(false)

    const saveDraft = async () => {
        if (isSaving) return
        setIsSaving(true)
        try {
            await onSave(isRatingDate
                ? { rating: draft.rating === 0 ? null : draft.rating, dateAdded: toDateOnlyISO(draft.date) }
                : draft)
            setIsEditing(false)
        } catch {
            // The error is already shown; keep the value in the field so it isn't lost.
        } finally {
            setIsSaving(false)
        }
    }

    if (isRatingDate) {
        const rating = value?.rating

        if (!isEditing) {
            // Both rows are one tap area: a tap on either opens the editor for both fields.
            return (
                <Box
                    onClick={startEditing}
                    title="Click to edit"
                    sx={{ display: 'flex', flexDirection: 'column', gap: 1, cursor: 'pointer' }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Rating name="user-rating" value={(rating || 0) / 20} precision={0.1} readOnly />
                        <Typography variant="h6" color="text.main" sx={{ whiteSpace: 'nowrap' }}>
                            {rating == null ? '-' : formatRatingLabel(rating, ratingSystem)}
                        </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                        Added: {formatDateOnly(value?.dateAdded) || 'No date'}
                    </Typography>
                </Box>
            )
        }

        const setRating = (next) => setDraft((prev) => ({ ...prev, rating: next }))
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault()
                cancel()
            } else if (e.key === 'Enter') {
                e.preventDefault()
                saveDraft()
            }
        }

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: { sm: 380 } }}>
                <RatingInput value={draft.rating || null} onChange={(next) => setRating(next ?? 0)} onKeyDown={handleKeyDown} />

                <DateField
                    label="Added"
                    value={draft.date}
                    onChange={(next) => setDraft((prev) => ({ ...prev, date: next }))}
                    dense
                />

                <EditActions onCancel={cancel} onSave={saveDraft} isSaving={isSaving} />
            </Box>
        )
    }

    const handleTextKeyDown = (e) => {
        if (e.key === 'Escape') {
            e.preventDefault()
            cancel()
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            saveDraft()
        }
    }

    return (
        <Box bgcolor="bg.second" sx={sx}>
            <Typography variant="h5" color="text.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                {title}
            </Typography>

            {isEditing ? (
                <>
                    <InputBox
                        autoFocus
                        fullWidth
                        multiline
                        minRows={4}
                        placeholder="Write your review..."
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleTextKeyDown}
                        disabled={isSaving}
                    />
                    <EditActions onCancel={cancel} onSave={saveDraft} isSaving={isSaving} />
                </>
            ) : (
                <Typography
                    variant="body1"
                    color="text.main"
                    onClick={startEditing}
                    title="Click to edit"
                    sx={{ whiteSpace: 'pre-wrap', cursor: 'pointer', overflowWrap: 'anywhere' }}
                >
                    {value || emptyText}
                </Typography>
            )}
        </Box>
    )
}

export default EditableValue
