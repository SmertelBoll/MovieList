import { Box, Card, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import ItemFolderButton from '../ItemFolderButton'
import StretchedLink from '../StretchedLink'
import { formatRatingLabel } from '../../utils/ratingSystem'
import { formatDateOnly } from '../../utils/dates'
import { getItemHref } from '../../utils/itemLinks'
import { tmdbImageOrDefault } from '../../utils/tmdbImage'


// Same columns in every row so date and rating line up: poster | title + subtitle | date | rating. Room on
// the right for the button.
const COLUMNS = { xs: '36px minmax(0, 1fr)', md: '36px minmax(0, 1fr) 100px 96px' }

// Compact row: the list-view alternative to ItemCart, same props and behavior.
function ItemRow({
    item,
    dbType,
    mediaType,
    onAddItem = () => { },
    onEditItem = () => { },
    onDeleteItem = () => { },
    isJob = false,
    isDescription = false,
    isComment = false,
    isDate = false,
    isRating = false,
    isVoteCount = false,
    isFolderPage = false,
}) {
    const isAuth = useSelector(selectIsAuth)
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])

    const href = getItemHref(item, dbType)
    const tmdbId = item.tmdbId ?? item.id
    const title = mediaType === 'movie' ? item.title : item.name

    const dateText = (dbType === 'tmdb'
        ? formatDateOnly(mediaType === 'movie' ? item.release_date : item.first_air_date)
        : formatDateOnly(item.dateAdded)) || '—'
    const ratingText = dbType === 'mongo'
        ? (item.rating == null ? '-' : formatRatingLabel(item.rating, ratingSystem))
        : `${Math.round((item.vote_average || 0) * 10) / 10}/10`

    const subtitle = isJob ? `Job: ${item.job}` : isDescription ? item.overview : isComment ? item.comment : ''

    return (
        <Card
            sx={{
                position: 'relative',
                borderRadius: 2,
                cursor: 'pointer',
                pl: 1,
                pr: isAuth ? 7.5 : 1,
                py: 0.5,
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                alignItems: 'center',
                columnGap: 2,
                transition: 'box-shadow 0.2s ease-in-out',
                '@media (hover: hover) and (pointer: fine)': { '&:hover': { boxShadow: 4 } },
            }}
        >
            {href && <StretchedLink to={href} label={title} />}

            {/*
               The button lives in its own overlay layer: its menu wrapper would otherwise become another grid item and shift all columns.
               pointer-events: none on the layer, so only the button takes clicks; the rest stays a row link.
            */}
            {isAuth && (
                <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                    <ItemFolderButton
                        mediaType={mediaType}
                        tmdbId={tmdbId}
                        itemTitle={title}
                        isCopy={isFolderPage}
                        stopPropagation
                        sx={{ top: '50%', right: 12, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                        onAdd={() => onAddItem(item)}
                        onEdit={(copy) => onEditItem(item, copy)}
                        onDelete={(copy) => onDeleteItem(item, copy)}
                    />
                </Box>
            )}

            <Box
                component="img"
                alt={title}
                src={tmdbImageOrDefault(item.poster_path, 'w185')}
                loading="lazy"
                sx={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 0.5, display: 'block' }}
            />

            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: 'text.main',
                        overflowWrap: 'anywhere',
                        display: '-webkit-box',
                        WebkitLineClamp: { xs: 2, md: 1 },
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}
                >
                    {title}
                </Typography>
                {subtitle && (
                    <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
                        {subtitle}
                    </Typography>
                )}
                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, color: 'text.secondary' }}>
                    {[isDate && dateText, isRating && ratingText].filter(Boolean).join(' · ')}
                </Typography>
            </Box>

            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary' }}>
                {isDate ? dateText : ''}
            </Typography>

            <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                {isRating && (
                    <>
                        <Typography variant="body2" sx={{ color: 'text.main', fontWeight: 600 }}>
                            {ratingText}
                        </Typography>
                        {isVoteCount && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {item.vote_count} votes
                            </Typography>
                        )}
                    </>
                )}
            </Box>
        </Card>
    )
}

export default ItemRow
