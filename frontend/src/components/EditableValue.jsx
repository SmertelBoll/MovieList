import { Box, Rating, Typography, useTheme } from '@mui/material'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import CheckIcon from '@mui/icons-material/Check'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DropdownMenu from './_customMUI/DropdownMenu'
import TextFieldCustom from './_customMUI/TextFieldCustom'
import MainButton from './Buttons/MainButton'
import RatingDot from './RatingDot'
import RatingSlider from './RatingSlider'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { formatRatingLabel, getRatingLevels, hasRatingSystem } from '../utils/ratingSystem'
import { formatDateOnly, parseDateOnly, toDateOnlyISO } from '../utils/dates'

const clamp = (number) => Math.min(100, Math.max(0, number))

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
    const theme = useTheme()
    const isRatingDate = type === 'ratingDate'
    const dateFormat = useSelector((state) => state.config.dateFormat)

    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    const useRatingSystem = hasRatingSystem(ratingSystem)
    const levels = getRatingLevels(ratingSystem)

    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, isRatingDate),
        [theme.palette.bg.second, theme.palette.text.main, isRatingDate]
    )

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
        const currentLevel = levels.find((level) => level.value === draft.rating)

        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: { sm: 380 } }}>
                {useRatingSystem ? (
                    <DropdownMenu
                        width={240}
                        items={[
                            ...levels.map((level) => ({
                                key: level.value,
                                label: level.name,
                                selected: draft.rating === level.value,
                                icon: <RatingDot color={level.color} />,
                                endAdornment: draft.rating === level.value ? <CheckIcon fontSize="small" /> : null,
                                onClick: () => setRating(level.value),
                            })),
                            { key: '__divider__', divider: true },
                            { key: '__none__', label: 'No rating', selected: draft.rating === 0, onClick: () => setRating(0) },
                        ]}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        renderTrigger={({ onClick }) => (
                            <Box
                                onClick={onClick}
                                sx={{
                                    display: 'flex', alignItems: 'center', gap: 0.5, minHeight: 40, boxSizing: 'border-box',
                                    px: 1, borderRadius: '4px', cursor: 'pointer', border: '1px solid', borderColor: 'text.main',
                                }}
                            >
                                {currentLevel && <RatingDot color={currentLevel.color} />}
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{ flexGrow: 1, minWidth: 0, color: currentLevel ? 'text.main' : 'text.secondary' }}
                                >
                                    {currentLevel ? currentLevel.name : 'Rating'}
                                </Typography>
                                <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                            </Box>
                        )}
                    />
                ) : (
                    <RatingSlider value={draft.rating} onChange={(e, next) => setRating(next)}>
                        <InputBox
                            value={draft.rating}
                            size="small"
                            onChange={(e) => setRating(e.target.value === '' ? 0 : clamp(Number(e.target.value)))}
                            onKeyDown={handleKeyDown}
                            inputProps={{ step: 1, min: 0, max: 100, type: 'number' }}
                            sx={{ width: 112, flexShrink: 0, mt: -0.5 }}
                        />
                    </RatingSlider>
                )}

                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Added"
                        format={dateFormat}
                        value={draft.date}
                        onChange={(next) => setDraft((prev) => ({ ...prev, date: next }))}
                        slots={{ textField: InputBox }}
                        slotProps={{
                            textField: { fullWidth: true, size: 'small', sx: { mb: 0 } },
                            field: { clearable: true },
                        }}
                    />
                </LocalizationProvider>

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
