import { Box } from '@mui/material'
import { useSelector } from 'react-redux'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { getContrastText, getRatingAbbr, getRatingLevelColor } from '../utils/ratingSystem'

// The rating of a saved movie as a small label, styled like the SOON / NOW label of the Timeline: in the top-left
// corner of a poster (the status button sits in the top-right one), or inline in a list row. With the user's own rating
// system it takes the level's color and abbreviation; a rating that matches no level is shown as the number.
function RatingLabel({ rating, inline = false }) {
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    if (rating == null) return null

    const levelColor = getRatingLevelColor(rating, ratingSystem)
    const label = String(getRatingAbbr(rating, ratingSystem) ?? rating)
    return (
        <Box
            component="span"
            aria-label={`Rating ${label}`}
            sx={{
                ...(inline ? { flexShrink: 0 } : { position: 'absolute', top: 6, left: 6, zIndex: 1 }),
                display: 'inline-flex', alignItems: 'center', gap: '3px',
                px: 0.75, py: 0.25, borderRadius: '6px',
                fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.3, letterSpacing: '0.5px', textTransform: 'uppercase',
                pointerEvents: 'none',
                bgcolor: levelColor || 'overlay.medium',
                color: levelColor ? getContrastText(levelColor) : 'overlay.onImage',
            }}
        >
            <StarRoundedIcon sx={{ fontSize: 12, color: levelColor ? 'inherit' : 'yellow.main' }} />
            {label}
        </Box>
    )
}

export default RatingLabel
