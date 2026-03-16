import { Box, Typography } from '@mui/material'

const EpisodeCart = ({
    unique_key,
    backgroundColor,
    textColor,
    isHoverActive,
    children
}) => {
    return (
        <Box
            key={unique_key}
            sx={{
                width: 35,
                height: 35,
                borderRadius: 2,
                backgroundColor: backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.1s, box-shadow 0.1s",
                cursor: isHoverActive ? "help" : "default",
                "&:hover": isHoverActive ? {
                    transform: "scale(1.05)",
                    boxShadow: 3,
                    zIndex: 1
                } : {}
            }}
        >
            {children && (
                <Typography variant="h6" sx={{
                    fontWeight: "bold",
                    color: textColor,
                    fontSize: "1rem"
                }}>
                    {children}
                </Typography>
            )}
        </Box>
    )
}

export default EpisodeCart