import { Box, Typography, useTheme } from '@mui/material'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import CheckIcon from '@mui/icons-material/Check'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DropdownMenu from './_customMUI/DropdownMenu'
import TextFieldCustom from './_customMUI/TextFieldCustom'
import RatingDot from './RatingDot'
import RatingSlider from './RatingSlider'
import { getRatingLevels, hasRatingSystem } from '../utils/ratingSystem'

const clamp = (number) => Math.min(100, Math.max(0, number))

// The one way to enter a rating: the user's own levels (dropdown) when they have a rating system, otherwise the 0-100
// slider with a number field. value / onChange use null for "no rating" (0 counts as none).
function RatingInput({ value, onChange, onKeyDown, sx }) {
    const theme = useTheme()
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    )

    if (hasRatingSystem(ratingSystem)) {
        const levels = getRatingLevels(ratingSystem)
        const current = levels.find((level) => level.value === value)
        return (
            <Box sx={sx}>
                <DropdownMenu
                    width={240}
                    items={[
                        ...levels.map((level) => ({
                            key: level.value,
                            label: level.name,
                            selected: value === level.value,
                            icon: <RatingDot color={level.color} />,
                            endAdornment: value === level.value ? <CheckIcon fontSize="small" /> : null,
                            onClick: () => onChange(level.value),
                        })),
                        { key: '__divider__', divider: true },
                        { key: '__none__', label: 'No rating', selected: !value, onClick: () => onChange(null) },
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
                            {current && <RatingDot color={current.color} />}
                            <Typography
                                variant="body2"
                                noWrap
                                sx={{ flexGrow: 1, minWidth: 0, color: current ? 'text.main' : 'text.secondary' }}
                            >
                                {current ? current.name : 'Rating'}
                            </Typography>
                            <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                        </Box>
                    )}
                />
            </Box>
        )
    }

    return (
        <RatingSlider value={value || 0} onChange={(e, next) => onChange(next === 0 ? null : next)} sx={sx}>
            <InputBox
                value={value || ''}
                size="small"
                onChange={(e) => onChange(e.target.value === '' || Number(e.target.value) === 0 ? null : clamp(Number(e.target.value)))}
                onKeyDown={onKeyDown}
                inputProps={{ step: 1, min: 0, max: 100, type: 'number' }}
                sx={{ width: 112, flexShrink: 0, mt: -0.5, '& .MuiInput-underline': { display: 'none' } }}
            />
        </RatingSlider>
    )
}

export default RatingInput
