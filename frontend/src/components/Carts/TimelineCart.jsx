import { Box, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { selectSavedCopies } from '../../redux/slices/SavedSlice'
import { DIMMED_POSTER_SX, getBestStatus, isDimmedStatus } from '../../utils/folderStatus'
import ItemFolderButton from '../ItemFolderButton'
import StretchedLink from '../StretchedLink'

const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG
const IMAGE_BASE_URL_W342 = `${process.env.REACT_APP_TMDB_IMG}/w342`; // w342 — щоб постер був чіткий на retina

// Картка однієї частини колекції для блоку Timeline.
// Кнопка в куті: плюс (додати), для збереженої — значок статусу (редагувати; кілька папок — вибір папки).
// onAdd(part), onEdit(part, copy) — діалог відкриває сторінка.
function TimelineCart({ part, isCurrent, onAdd, onEdit }) {
    const isAuth = useSelector(selectIsAuth)
    // Переглянуту й кинуту частину приглушуємо так само, як на сторінці New releases
    const copies = useSelector(selectSavedCopies('movie', part.id))
    const isDimmed = isDimmedStatus(getBestStatus(copies.map((c) => c.status)))

    const year = part.release_date ? part.release_date.slice(0, 4) : null
    // Без дати — це анонсована частина; з датою в майбутньому — ще не вийшла
    const isUpcoming = !part.release_date || new Date(part.release_date) > new Date()

    return (
        <Box
            sx={{
                position: 'relative',
                flexShrink: 0,
                width: 150,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                cursor: isCurrent ? 'default' : 'pointer',
                // Піднімаємо картку цілком (разом з назвою). Висота підйому й
                // підсилення тіні — як у карток фільмів у списках
                transition: 'transform 0.2s ease-in-out',
                ...(isCurrent ? {} : {
                    '@media (hover: hover)': { '&:hover': {
                        transform: (theme) => theme.hoverLift,
                        '& .timeline-poster': { boxShadow: 6 },
                    } },
                }),
            }}
        >
            {/* Справжнє посилання на всю картку (крім поточного фільму) */}
            {!isCurrent && <StretchedLink to={`/movie/${part.id}`} label={part.title} />}

            {/* Постер */}
            <Box
                className="timeline-poster"
                sx={{
                    position: 'relative',
                    width: 150,
                    height: 225,
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: 2,
                    bgcolor: 'bg.second',
                    transition: 'box-shadow 0.2s ease-in-out',
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
                        ...(isDimmed && DIMMED_POSTER_SX),
                    }}
                />

                {/* Затемнення знизу, щоб рік читався на будь-якому постері */}
                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: (theme) => `linear-gradient(to top, ${theme.palette.overlay.strong} 0%, ${theme.palette.overlay.none} 45%)`,
                        pointerEvents: 'none',
                    }}
                />

                {/* Рік виходу */}
                <Typography
                    sx={{
                        position: 'absolute',
                        left: 8,
                        bottom: 6,
                        color: 'overlay.onImage',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        letterSpacing: '0.5px',
                        textShadow: (theme) => `0 1px 3px ${theme.palette.overlay.soft}`,
                    }}
                >
                    {year || 'TBA'}
                </Typography>

                {/* Кнопки на постері — справа зверху, як у картках списків */}
                {isAuth && (
                    <ItemFolderButton
                        variant="direct"
                        mediaType="movie"
                        tmdbId={part.id}
                        itemTitle={part.title}
                        stopPropagation
                        onAdd={() => onAdd?.(part)}
                        onEdit={(copy) => onEdit?.(part, copy)}
                    />
                )}

                {/* Бейдж стану */}
                {(isCurrent || isUpcoming) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            px: 0.75,
                            py: 0.25,
                            borderRadius: '6px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            bgcolor: isCurrent ? 'yellow.main' : 'overlay.medium',
                            color: isCurrent ? 'text.dark' : 'overlay.onImage',
                        }}
                    >
                        {isCurrent ? 'Now' : 'Soon'}
                    </Box>
                )}
            </Box>

            {/* Назва */}
            <Typography
                variant="body2"
                // Повна назва на наведення (в картці вона обрізана до двох рядків).
                // Не на кореневому Box: native-підказка батька накладалась би на підказку значка.
                title={part.title}
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
