import { Box } from '@mui/material'

// Dot in the color of a custom rating level (for rating dropdowns); no color = empty ring in the text color of the
// row, so it turns dark together with the text on the yellow hover. The 24x24 wrapper matches MUI icon size so labels
// line up.
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
                    borderColor: color ? 'overlay.hairline' : 'currentColor',
                    opacity: color ? 1 : 0.7,
                }}
            />
        </Box>
    )
}

export default RatingDot
