import { Box, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG
const IMAGE_BASE_URL_W342 = `${process.env.REACT_APP_TMDB_IMG}/w342`; // w342 — щоб постер був чіткий на retina

// Картка однієї частини колекції для блоку Timeline.
// УВАГА: theme.spacing — масив, тож дробові відступи (p: 1.5) не працюють — тільки цілі або явні px.
function TimelineCart({ part, isCurrent }) {
    const navigate = useNavigate()

    const year = part.release_date ? part.release_date.slice(0, 4) : null
    // Без дати — це анонсована частина; з датою в майбутньому — ще не вийшла
    const isUpcoming = !part.release_date || new Date(part.release_date) > new Date()

    return (
        <Box
            onClick={isCurrent ? undefined : () => navigate(`/movie/${part.id}`)}
            title={part.title}
            sx={{
                flexShrink: 0,
                width: 150,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: isCurrent ? 'default' : 'pointer',
                // Піднімаємо картку цілком (разом з назвою) — як у Cast / Crew
                transition: 'transform 0.2s ease-in-out',
                ...(isCurrent ? {} : { '&:hover': { transform: 'translateY(-2px)' } }),
            }}
        >
            {/* Постер */}
            <Box
                sx={{
                    position: 'relative',
                    width: 150,
                    height: 225,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2,
                    bgcolor: 'bg.second',
                }}
            >
                <Box
                    component="img"
                    src={part.poster_path ? IMAGE_BASE_URL_W342 + part.poster_path : IMAGE_DEFAULT}
                    alt={part.title}
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        // Ще не вийшла — приглушуємо, щоб хронологія читалась з першого погляду
                        filter: isUpcoming && !isCurrent ? 'grayscale(0.45)' : 'none',
                    }}
                />

                {/* Затемнення знизу, щоб рік читався на будь-якому постері */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 45%)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Рік виходу */}
                <Typography
                    sx={{
                        position: 'absolute',
                        left: 8,
                        bottom: 6,
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.5px',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                    }}
                >
                    {year || 'TBA'}
                </Typography>

                {/* Бейдж стану */}
                {(isCurrent || isUpcoming) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            px: '6px',
                            py: '2px',
                            borderRadius: '6px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            bgcolor: isCurrent ? 'yellow.main' : 'rgba(0,0,0,0.75)',
                            color: isCurrent ? 'text.dark' : '#fff',
                        }}
                    >
                        {isCurrent ? 'Now' : 'Soon'}
                    </Box>
                )}
            </Box>

            {/* Назва */}
            <Typography
                variant="body2"
                sx={{
                    fontWeight: 500,
                    fontSize: '0.78rem',
                    lineHeight: 1.35,
                    color: 'text.main',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {part.title}
            </Typography>
        </Box>
    )
}

export default TimelineCart
