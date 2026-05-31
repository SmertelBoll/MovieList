import { Box, Typography } from '@mui/material'

const EpisodeCart = ({
    unique_key,
    backgroundColor,
    textColor,
    isHoverActive,
    onClick,
    width = 35,
    children
}) => {
    return (
        <Box
            key={unique_key}
            onClick={onClick}
            sx={{
                width: width,
                height: 35,
                borderRadius: 2,
                backgroundColor: backgroundColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "transform 0.1s, box-shadow 0.1s",
                cursor: isHoverActive ? (onClick ? "pointer" : "help") : "default",
                "&:hover": isHoverActive ? {
                    transform: "scale(1.05)",
                    boxShadow: 3,
                    zIndex: 1
                } : {}
            }}
        >
            {children && (
                <Typography variant="h6" component="div" sx={{
                    fontWeight: "bold",
                    color: textColor,
                    fontSize: "1rem",
                    lineHeight: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    {children}
                </Typography>
            )}
        </Box>
    )
}

export default EpisodeCart