import { Box, Typography } from '@mui/material'
import StretchedLink from '../StretchedLink'

const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG
const IMAGE_BASE_URL_W185 = `${process.env.REACT_APP_TMDB_IMG}/w185`; // базовий URL для отримання зображень

function ActorCart({ person, role }) {
    // Визначаємо, чи це актор чи член команди
    const isCrew = ['Director', 'Producer', 'Writer', 'Screenplay', 'Editor', 'Cinematography', 'Production Design', 'Costume Design', 'Makeup', 'Sound'].includes(role);
    const href = isCrew ? `/crew/${person.id}` : `/actor/${person.id}`;

    return (
        <Box sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            minWidth: 100,
            maxWidth: 100,
            position: "relative",
            p: 1,
            cursor: "pointer",
            transition: "transform 0.2s ease-in-out",
            "&:hover": {
                transform: (theme) => theme.hoverLift
            }
        }}
        >
            {/* Справжнє посилання на всю картку: працюють колесо миші та Ctrl/Cmd+клік */}
            <StretchedLink to={href} label={person.name} />
            <Box
                component="img"
                src={person.profile_path ? IMAGE_BASE_URL_W185 + person.profile_path : IMAGE_DEFAULT}
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
                    color="text.main"
                    sx={{
                        fontWeight: "medium",
                        fontSize: "0.75rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "wrap"
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
                        whiteSpace: "wrap"
                    }}
                >
                    {role}
                </Typography>
            </Box>
        </Box>
    )
}

export default ActorCart 