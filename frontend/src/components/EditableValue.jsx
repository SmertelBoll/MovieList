import { Box, Rating, Slider, Typography, useTheme } from '@mui/material'
import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import CheckIcon from '@mui/icons-material/Check'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DropdownMenu from './_customMUI/DropdownMenu'
import TextFieldCustom from './_customMUI/TextFieldCustom'
import MainButton from './Buttons/MainButton'
import RatingDot from './RatingDot'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { formatRatingLabel, getRatingLevels, hasRatingSystem } from '../utils/ratingSystem'
import { formatDateOnly, parseDateOnly, toDateOnlyISO } from '../utils/dates'

// Мітки під повзунком: 0, 20, … 100 (рідше, ніж у діалозі збереження, — тут менше місця)
const SLIDER_MARKS = Array.from({ length: 6 }, (_, index) => ({ value: 20 * index, label: 20 * index }))

const clamp = (number) => Math.min(100, Math.max(0, number))

// Cancel / Save: однакові в обох режимах
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
                    '@media (hover: hover)': { ':hover': { bgcolor: 'bg.selected' } },
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

/**
 * Значення на сторінці збереженого фільму/серіалу, яке редагується прямо на місці. Тип задає параметр \`type\`:
 *
 *  type="text" (за замовчуванням) — блок «My review» з коментарем.
 *    Дотик / клік по тексту вмикає поле вводу. Save (Ctrl/Cmd+Enter), Cancel (Esc).
 *    value — рядок; sx — стилі зовнішнього блока; title — заголовок; emptyText — що показати без коментаря.
 *
 *  type="ratingDate" — оцінка Й дата перегляду разом. Дотик по будь-якому з двох рядків відкриває
 *    ОДИН редактор для обох полів з одними кнопками Save / Cancel.
 *    value — { rating, dateAdded } (число 0–100 / null; ISO-рядок / null).
 *    Власна система оцінок: рівень вибирається зі списку (з кольоровими кружечками);
 *    стандартна шкала: повзунок з числом. Дата — вибір дати у форматі з профілю, поле можна очистити.
 *    Рендериться без власного блока — вставляється у блок сторінки.
 *
 * onSave(value) — рядок (text) або { rating, dateAdded } (ratingDate); має повернути проміс.
 * Якщо він відхиляється, лишаємось у редагуванні (помилку показує той, хто викликає).
 *
 * Подвійний клік не використовуємо: на телефоні подвійний дотик збільшує сторінку.
 */
function EditableValue({ type = 'text', value, onSave, sx, title = 'My review', emptyText = 'No comment' }) {
    const theme = useTheme()
    const isRatingDate = type === 'ratingDate'
    const dateFormat = useSelector((state) => state.config.dateFormat)

    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    const useRatingSystem = hasRatingSystem(ratingSystem)
    const levels = getRatingLevels(ratingSystem)

    // Для оцінки й дати — менший padding поля (компактні редактори), для тексту — звичайний
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, isRatingDate),
        [theme.palette.bg.second, theme.palette.text.main, isRatingDate]
    )

    const [isEditing, setIsEditing] = useState(false)
    // text: рядок; ratingDate: { rating: число 0–100 (0 = без оцінки), date: Date | null }
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
            // помилку вже показано — лишаємо значення в полі, щоб його не втратити
        } finally {
            setIsSaving(false)
        }
    }

    // ---------- оцінка + дата ----------
    if (isRatingDate) {
        const rating = value?.rating

        if (!isEditing) {
            // Обидва рядки — одна область: дотик по будь-якому відкриває редактор для обох полів
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
                    // Власна система: вибір рівня (зберігається разом з датою кнопкою Save)
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
                    // Стандартна шкала: повзунок + число, як у діалозі збереження
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 3, md: 5 }, pt: 2, pl: 1 }}>
                        <Slider
                            value={draft.rating}
                            onChange={(e, next) => setRating(next)}
                            min={0}
                            max={100}
                            step={1}
                            // Вигляд як у діалозі збереження (ItemSaveDialog): темний повзунок і мітки 0–100, але кожні 20
                            marks={SLIDER_MARKS}
                            valueLabelDisplay="auto"
                            color="text.dark"
                            sx={{ flexGrow: 1 }}
                        />
                        <InputBox
                            value={draft.rating}
                            size="small"
                            onChange={(e) => setRating(e.target.value === '' ? 0 : clamp(Number(e.target.value)))}
                            onKeyDown={handleKeyDown}
                            inputProps={{ step: 1, min: 0, max: 100, type: 'number' }}
                            // Достатньо широке, щоб «100» влазило разом зі стрілками числового поля
                            sx={{ width: 112, flexShrink: 0, mt: -0.5 }}
                        />
                    </Box>
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
                            // Хрестик очищення — дату можна прибрати
                            field: { clearable: true },
                        }}
                    />
                </LocalizationProvider>

                <EditActions onCancel={cancel} onSave={saveDraft} isSaving={isSaving} />
            </Box>
        )
    }

    // ---------- текст (коментар) ----------
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
