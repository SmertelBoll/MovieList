import { Box, Typography, Chip } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'

const defaultPhoto = "https://res.cloudinary.com/dw0qzruxp/image/upload/v1740604718/placeholder_ayyah4.png"

function ActorCart({ person, role }) {
    const navigate = useNavigate();
    const imageBaseUrl = "https://image.tmdb.org/t/p/w185"

    const handleClick = () => {
        // Визначаємо, чи це актор чи член команди
        const isActor = ['Director', 'Producer', 'Writer', 'Screenplay', 'Editor', 'Cinematography', 'Production Design', 'Costume Design', 'Makeup', 'Sound'].includes(role);

        if (isActor) {
            navigate(`/crew/${person.id}`);
        } else {
            navigate(`/actor/${person.id}`);
        }
    };

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            minWidth: 100,
            maxWidth: 100,
            p: 1,
            cursor: "pointer",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
                transform: "translateY(-2px)"
            }
        }}
            onClick={handleClick}
        >
            <Box
                component="img"
                src={person.profile_path ? imageBaseUrl + person.profile_path : defaultPhoto}
                alt={person.name}
                sx={{
                    width: 100,
                    height: 150,
                    objectFit: "cover",
                    borderRadius: 2,
                    boxShadow: 2
                }}
            />
            <Box sx={{ textAlign: "center", width: "100%" }}>
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: "medium",
                        fontSize: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}
                >
                    {person.name}
                </Typography>
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                        fontSize: "0.7rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                    }}
                >
                    {role}
                </Typography>
            </Box>
        </Box>
    )
}

export default ActorCart 