import { Box, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { selectSavedCopies } from '../../redux/slices/SavedSlice'
import { DIMMED_POSTER_SX, getBestStatus, isDimmedStatus } from '../../utils/folderStatus'
import ItemFolderButton from '../ItemFolderButton'
import StretchedLink from '../StretchedLink'
import { tmdbImageOrDefault } from '../../utils/tmdbImage'


function TimelineCart({ part, isCurrent, onAdd, onEdit }) {
    const isAuth = useSelector(selectIsAuth)
    const copies = useSelector(selectSavedCopies('movie', part.id))
    const isDimmed = isDimmedStatus(getBestStatus(copies.map((c) => c.status)))

    const year = part.release_date ? part.release_date.slice(0, 4) : null
    // No date = announced; a future date = not released yet
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
                transition: 'transform 0.2s ease-in-out',
                ...(isCurrent ? {} : {
                    '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                        transform: (theme) => theme.hoverLift,
                        '& .timeline-poster': { boxShadow: 6 },
                    } },
                }),
            }}
        >
            {!isCurrent && <StretchedLink to={`/movie/${part.id}`} label={part.title} />}

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
                    // w342 keeps the poster sharp on retina
                    src={tmdbImageOrDefault(part.poster_path, 'w342')}
                    alt={part.title}
                    loading="lazy"
                    sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                        filter: isUpcoming && !isCurrent ? 'grayscale(0.45)' : 'none',
                        ...(isDimmed && DIMMED_POSTER_SX),
                    }}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        background: (theme) => `linear-gradient(to top, ${theme.palette.overlay.strong} 0%, ${theme.palette.overlay.none} 45%)`,
                        pointerEvents: 'none',
                    }}
                />

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

            <Typography
                variant="body2"
                // Full title on hover (the card truncates it to two lines). Not on the root Box: the parent's
                // native tooltip would overlap the badge's.
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
