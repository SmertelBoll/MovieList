import { Box, Card, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import ItemFolderButton from '../ItemFolderButton'
import StretchedLink from '../StretchedLink'
import { formatRatingLabel } from '../../utils/ratingSystem'
import { formatDateOnly } from '../../utils/dates'
import { getItemHref } from '../../utils/itemLinks'

const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG
const IMAGE_BASE_URL_W185 = `${process.env.REACT_APP_TMDB_IMG}/w185`

// Однакові колонки в усіх рядках, щоб дата й оцінка стояли рівно одна під одною:
// постер | назва + підпис | дата | оцінка. Праворуч лишається місце під кнопку.
const COLUMNS = { xs: '36px minmax(0, 1fr)', md: '36px minmax(0, 1fr) 100px 96px' }

/**
 * Компактний рядок елемента — альтернатива картці (ItemCart) для режиму «таблиця».
 * Ті самі пропси й поведінка, що в ItemCart: посилання на весь рядок, кнопка додати/редагувати.
 */
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

    // Підпис під назвою: посада (команда), опис (TMDB) або коментар (мої)
    const subtitle = isJob ? `Job: ${item.job}` : isDescription ? item.overview : isComment ? item.comment : ''

    return (
        <Card
            sx={{
                position: 'relative',
                borderRadius: 2,
                cursor: 'pointer',
                // Праворуч місце під кнопку додати/редагувати
                pl: 1,
                // Кнопка: 40 px + відступ 12 px справа = 52 px; ще трохи повітря
                pr: isAuth ? 7.5 : 1,
                py: 0.5,
                display: 'grid',
                gridTemplateColumns: COLUMNS,
                alignItems: 'center',
                columnGap: 2,
                transition: 'box-shadow 0.2s ease-in-out',
                '@media (hover: hover)': { '&:hover': { boxShadow: 4 } },
            }}
        >
            {href && <StretchedLink to={href} label={title} />}

            {/* Кнопка стоїть у власному шарі поверх рядка. Без цього обгортка меню (звичайний <Box>)
                ставала б ще одним елементом сітки й зсувала всі колонки. Шар не перехоплює кліки
                (pointer-events: none) — лише сама кнопка, решта лишається посиланням на рядок. */}
            {isAuth && (
                <Box sx={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
                    <ItemFolderButton
                        mediaType={mediaType}
                        tmdbId={tmdbId}
                        itemTitle={title}
                        isCopy={isFolderPage}
                        stopPropagation
                        // Кнопка по центру висоти рядка, а не в куті
                        sx={{ top: '50%', right: 12, transform: 'translateY(-50%)', pointerEvents: 'auto' }}
                        onAdd={() => onAddItem(item)}
                        onEdit={(copy) => onEditItem(item, copy)}
                        onDelete={(copy) => onDeleteItem(item, copy)}
                    />
                </Box>
            )}

            {/* Постер */}
            <Box
                component="img"
                alt={title}
                src={item.poster_path ? IMAGE_BASE_URL_W185 + item.poster_path : IMAGE_DEFAULT}
                loading="lazy"
                sx={{ width: 36, height: 54, objectFit: 'cover', borderRadius: 0.5, display: 'block' }}
            />

            {/* Назва, підпис і (на вузьких екранах) стисла мета */}
            <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <Typography
                    variant="body1"
                    sx={{
                        fontWeight: 600,
                        lineHeight: 1.3,
                        color: 'text.main',
                        overflowWrap: 'anywhere',
                        display: '-webkit-box',
                        // Один рядок на десктопі (рядок тоншає), два — на телефоні, де тексту менше місця
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
                {/* На телефоні колонок немає — дата й оцінка йдуть одним рядком під назвою */}
                <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, color: 'text.secondary' }}>
                    {[isDate && dateText, isRating && ratingText].filter(Boolean).join(' · ')}
                </Typography>
            </Box>

            {/* Дата */}
            <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, color: 'text.secondary' }}>
                {isDate ? dateText : ''}
            </Typography>

            {/* Оцінка (і кількість голосів на каталозі TMDB) */}
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
