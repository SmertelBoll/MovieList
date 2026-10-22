import { Box } from '@mui/material'

// Dot in the color of a custom rating level (for rating dropdowns); no color = empty ring. The 24x24 wrapper
// matches MUI icon size so labels line up.
function RatingDot({ color, size = 14 }) {
    return (
        <Box sx={{ width: 24, height: 24, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    bgcolor: color || 'transparent',
                    border: '1px solid',
                    borderColor: color ? 'rgba(0,0,0,0.25)' : 'text.secondary',
                }}
            />
        </Box>
    )
}

export default RatingDot
