import { Box } from '@mui/material'
import { Link } from 'react-router-dom'

// Invisible link over a whole card (stretched link). Cards can't be one <a> (they contain buttons), so the card stays a
// div with an overlay link under the buttons.
function StretchedLink({ to, label }) {
    return (
        <Box
            component={Link}
            to={to}
            aria-label={label}
            sx={{ position: 'absolute', inset: 0, zIndex: 1, display: 'block', borderRadius: 'inherit' }}
        />
    )
}

export default StretchedLink
