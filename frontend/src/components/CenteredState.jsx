import { Box, CircularProgress, Typography } from '@mui/material'

// A block centered in the page for loading, "not found", "log in" and empty states. loading: a spinner; otherwise the
// children are the message.
function CenteredState({ loading = false, minHeight = 300, children }) {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={minHeight}>
            {loading
                ? <CircularProgress color="primary" />
                : <Typography variant="h6" color="text.secondary">{children}</Typography>}
        </Box>
    )
}

export default CenteredState
