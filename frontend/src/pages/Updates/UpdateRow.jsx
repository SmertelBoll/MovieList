import { Box, Card, Chip, Collapse, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import instance from '../../axios'
import { alertError } from '../../alerts'
import { getTmdbLanguage } from '../../utils/languages'
import { formatDateOnly } from '../../utils/dates'
import ItemFolderButton from '../../components/ItemFolderButton'
import SavedItemOpener from '../../components/SavedItemOpener'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import LockIcon from '@mui/icons-material/Lock'
import { DIMMED_POSTER_SX, isDimmedStatus } from '../../utils/folderStatus'

const API_KEY = process.env.REACT_APP_TMDB_API_KEY
const TMDB = process.env.REACT_APP_URL_TMDB
const IMG_W185 = `${process.env.REACT_APP_TMDB_IMG}/w185`
const IMG_DEFAULT = process.env.REACT_APP_DEFAULT_IMG

const poster = (path) => (path ? IMG_W185 + path : IMG_DEFAULT)
// TMDB віддає дати вже як yyyy-mm-dd, а dateAdded — ISO-рядок
const asDate = (value) => formatDateOnly(value) || '—'

/** Один рядок списку: колекція фільмів або серіал. Клік розкриває деталі. */
function UpdateRow({ row, onMoviePlus, onMovieCheck, onEpisodeMark, onEpisodeEdit, onSeasonMarkAll }) {
    // viewMode — спільний із General: картки або компактні рядки
    const { language, viewMode } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)

    // Постер у рядку відкриває серіал, а для колекції — її ПЕРШУ частину (за датою виходу).
    // Що саме відкриється (TMDB / збережена / вибір папки) вирішує SavedItemOpener.
    const targetPart = row.kind === 'collection' ? row.parts[0] : null

    const [open, setOpen] = useState(false)
    // Множина, а не одне значення: сезони розкриваються незалежно один від одного
    const [openSeasons, setOpenSeasons] = useState(() => new Set())
    const [episodesBySeason, setEpisodesBySeason] = useState({})
    const [loadingSeason, setLoadingSeason] = useState(null)

    const canEditEpisodes = row.kind === 'tv' && Boolean(row.mongoId)

    // Серії тягнемо лише коли сезон реально розкрили; вже підвантажені не качаємо вдруге
    const loadSeasonEpisodes = async (seasonNumber) => {
        if (episodesBySeason[seasonNumber]) return
        try {
            setLoadingSeason(seasonNumber)
            const res = await instance.get(`${TMDB}/tv/${row.id}/season/${seasonNumber}`, {
                params: { api_key: API_KEY, language: tmdbLanguage },
            })
            setEpisodesBySeason((prev) => ({ ...prev, [seasonNumber]: res.data.episodes || [] }))
        } catch (err) {
            console.warn(err)
            alertError(err, 'Failed to load episodes')
        } finally {
            setLoadingSeason(null)
        }
    }

    const toggleSeason = async (seasonNumber) => {
        const wasOpen = openSeasons.has(seasonNumber)
        setOpenSeasons((prev) => {
            const next = new Set(prev)
            if (wasOpen) next.delete(seasonNumber)
            else next.add(seasonNumber)
            return next
        })
        if (!wasOpen) await loadSeasonEpisodes(seasonNumber)
    }

    // Кожного разу, коли серіал розкривають, відкриваємо один сезон — той, де є найменша
    // непереглянута серія (найнижчий номер сезону з непереглянутими). Пропущені серії не рахуються
    // непереглянутими. Сезони, які були відкриті раніше, при цьому згортаємо: стан щоразу «свіжий»,
    // і він враховує серії, відмічені з минулого разу.
    const handleRowToggle = () => {
        const willOpen = !open
        setOpen(willOpen)

        if (willOpen && row.kind === 'tv') {
            const target = row.seasons
                .filter((season) => season.unwatchedCount > 0)
                .reduce((min, season) => (min && min.seasonNumber < season.seasonNumber ? min : season), null)
            setOpenSeasons(new Set(target ? [target.seasonNumber] : []))
            if (target) loadSeasonEpisodes(target.seasonNumber)
        }
    }

    // Номери непереглянутих серій сезону.
    // Якщо серії вже підвантажені — беремо їхні справжні номери (вони не завжди
    // йдуть підряд від 1); якщо сезон ще не розкривали — рахуємо 1..episodeCount.
    const unwatchedNumbers = (season) => {
        const loaded = episodesBySeason[season.seasonNumber]
        const all = loaded
            ? loaded.map((e) => e.episode_number)
            : Array.from({ length: season.episodeCount }, (_, i) => i + 1)
        return all.filter((n) => !season.watchedEpisodes[String(n)])
    }

    const subtitle = row.kind === 'collection'
        ? `${row.unwatchedCount} unwatched of ${row.parts.length}`
        : `${row.unwatchedCount} new ${row.unwatchedCount === 1 ? 'episode' : 'episodes'} of ${row.episodeCount}`

    return (
        // Card — щоб фон збігався з картками фільмів (background.paper)
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {/* Рядок */}
            <Box
                onClick={handleRowToggle}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: { xs: 1, sm: 2 },
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, color 0.15s',
                    '@media (hover: hover)': { '&:hover': {
                        bgcolor: 'yellow.main',
                        color: 'yellow.contrastText',
                        '& .MuiTypography-root': { color: 'yellow.contrastText' },
                        '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                        // Лічильник теж жовтий, тож на жовтому рядку зливався б.
                        // Темніший жовтий — той самий прийом, що для "вибране + наведення"
                        '& .MuiChip-root': {
                            bgcolor: 'yellow.contrastText',
                            color: 'yellow.main',
                        },
                    } },
                }}
            >
                {/* Клік по постеру відкриває фільм/серіал за єдиною логікою (див. SavedItemOpener) */}
                <SavedItemOpener
                    mediaType={row.kind === 'tv' ? 'tv' : 'movie'}
                    tmdbId={row.kind === 'tv' ? row.id : targetPart?.id}
                    title={row.kind === 'tv' ? row.title : (targetPart?.title || row.title)}
                    sx={{ display: 'flex', flexShrink: 0 }}
                >
                    <Box
                        component="img"
                        src={poster(row.posterPath)}
                        alt={row.title}
                        loading="lazy"
                        sx={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 1, boxShadow: 2 }}
                    />
                </SavedItemOpener>

                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography variant="body1" color="text.main" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>
                        {row.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {row.kind === 'collection' ? 'Movie collection' : 'TV series'} · {subtitle}
                    </Typography>
                </Box>

                <Chip
                    size="small"
                    label={row.unwatchedCount}
                    sx={{
                        bgcolor: 'yellow.main',
                        color: 'yellow.contrastText',
                        fontWeight: 700,
                        flexShrink: 0,
                        transition: 'background-color 0.15s, color 0.15s',
                    }}
                />
                <ExpandMoreIcon
                    sx={{
                        color: 'text.main', flexShrink: 0,
                        transition: 'transform 0.2s',
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </Box>

            <Collapse in={open} unmountOnExit>
                <Box sx={{ px: { xs: 1, sm: 2 }, pb: 2, pt: 1 }}>
                    {row.kind === 'collection' ? (
                        // --- Частини колекції: компактні рядки (режим «list», як у General) або картки ---
                        viewMode === 'list' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {row.parts.map((part) => (
                                    <Box
                                        key={part.id}
                                        sx={{
                                            position: 'relative',
                                            // Переглянуте / кинуте / пропущене — сірий увесь рядок (у картках сіріє постер)
                                            ...(isDimmedStatus(part.status) && DIMMED_POSTER_SX),
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            // Праворуч місце під кнопку (як у ItemRow)
                                            pl: 1, pr: 7.5, py: 0.5,
                                            borderRadius: 2,
                                            border: '1px solid', borderColor: 'divider',
                                            transition: 'box-shadow 0.2s ease-in-out',
                                            '@media (hover: hover)': { '&:hover': { boxShadow: 4 } },
                                        }}
                                    >
                                        <SavedItemOpener mediaType="movie" tmdbId={part.id} title={part.title} sx={{ display: 'flex', flexShrink: 0 }}>
                                            <Box
                                                component="img"
                                                src={poster(part.posterPath)}
                                                alt={part.title}
                                                loading="lazy"
                                                sx={{
                                                    width: 36, height: 54, objectFit: 'cover', borderRadius: 0.5, display: 'block',
                                                }}
                                            />
                                        </SavedItemOpener>

                                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                                            <Typography variant="body1" sx={{
                                                fontWeight: 600, lineHeight: 1.3, color: 'text.main', overflowWrap: 'anywhere',
                                                display: '-webkit-box', WebkitLineClamp: { xs: 2, md: 1 }, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {part.title}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                {asDate(part.releaseDate)}
                                            </Typography>
                                        </Box>

                                        <ItemFolderButton
                                            variant="direct"
                                            mediaType="movie"
                                            tmdbId={part.id}
                                            itemTitle={part.title}
                                            stopPropagation
                                            // Кнопка по центру висоти рядка, а не в куті
                                            sx={{ top: '50%', right: 12, transform: 'translateY(-50%)' }}
                                            onAdd={() => onMoviePlus(part)}
                                            onEdit={(copy) => onMovieCheck(part, copy)}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                        <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(140px, 1fr))' },
                            gap: 2,
                        }}>
                            {row.parts.map((part) => (
                                <Box
                                    key={part.id}
                                    sx={{
                                        display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0,
                                        // Підйом при наведенні — як у карток фільмів у списках
                                        transition: 'transform 0.2s ease-in-out',
                                        '@media (hover: hover)': { '&:hover': {
                                            transform: (theme) => theme.hoverLift,
                                            '& .update-poster': { boxShadow: 6 },
                                        } },
                                    }}
                                >
                                    <Box
                                        className="update-poster"
                                        sx={{
                                            position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 2,
                                            transition: 'box-shadow 0.2s ease-in-out',
                                        }}
                                    >
                                        {/* Та сама логіка, що й у постера рядка: TMDB / збережена / вибір папки */}
                                        <SavedItemOpener mediaType="movie" tmdbId={part.id} title={part.title} sx={{ display: 'block' }}>
                                            <Box
                                                component="img"
                                                src={poster(part.posterPath)}
                                                alt={part.title}
                                                loading="lazy"
                                                sx={{
                                                    width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', display: 'block',
                                                    // Приглушуємо тільки переглянуте й кинуте —
                                                    // те, що дивляться зараз, лишається яскравим
                                                    ...(isDimmedStatus(part.status) && DIMMED_POSTER_SX),
                                                }}
                                            />
                                        </SavedItemOpener>

                                        {/* Плюс (додати) або значок статусу (редагувати). Підказка — усі папки фільму;
                                            кілька папок — перед редагуванням з'являється вибір папки */}
                                        <ItemFolderButton
                                            variant="direct"
                                            mediaType="movie"
                                            tmdbId={part.id}
                                            itemTitle={part.title}
                                            stopPropagation
                                            onAdd={() => onMoviePlus(part)}
                                            onEdit={(copy) => onMovieCheck(part, copy)}
                                        />
                                    </Box>

                                    <Typography variant="body2" color="text.main" sx={{
                                        fontWeight: 500, lineHeight: 1.3,
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                    }}>
                                        {part.title}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        {asDate(part.releaseDate)}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                        )
                    ) : (
                        // --- Сезони серіалу ---
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {!canEditEpisodes && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <LockIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        Saved {row.copies} times — watched episodes are merged, but marking is disabled
                                    </Typography>
                                </Box>
                            )}

                            {row.seasons.map((season) => {
                                const isSeasonOpen = openSeasons.has(season.seasonNumber)
                                const seasonWatched = season.unwatchedCount === 0
                                return (
                                    <Box
                                        key={season.seasonNumber}
                                        sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}
                                    >
                                        <Box
                                            onClick={() => toggleSeason(season.seasonNumber)}
                                            sx={{
                                                display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, p: 1,
                                                cursor: 'pointer',
                                                transition: 'background-color 0.15s, color 0.15s',
                                                '@media (hover: hover)': { '&:hover': {
                                                    bgcolor: 'yellow.main',
                                                    '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                    '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                } },
                                            }}
                                        >
                                            {seasonWatched
                                                ? <CheckCircleIcon fontSize="small" sx={{ color: 'status.watched' }} />
                                                : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}

                                            {/* На телефоні лічильник іде окремим рядком під назвою:
                                                в один рядок з кнопкою "Watch all" він ламав назву сезону */}
                                            <Box sx={{
                                                flexGrow: 1, minWidth: 0, display: 'flex',
                                                flexDirection: { xs: 'column', sm: 'row' },
                                                alignItems: { xs: 'flex-start', sm: 'center' },
                                                gap: { xs: 0.25, sm: 2 },
                                            }}>
                                                <Typography variant="body2" color="text.main" sx={{ fontWeight: 600, flexGrow: 1, minWidth: 0 }}>
                                                    {season.name || `Season ${season.seasonNumber}`}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                                                    {season.unwatchedCount > 0
                                                        ? `${season.unwatchedCount} of ${season.episodeCount} new`
                                                        : 'watched'}
                                                </Typography>
                                            </Box>

                                            {/* Позначити весь сезон одним кліком */}
                                            {canEditEpisodes && season.unwatchedCount > 0 && (
                                                <Box
                                                    onClick={(e) => {
                                                        // Інакше клік ще й розгорне/згорне сезон
                                                        e.stopPropagation()
                                                        onSeasonMarkAll(season.seasonNumber, unwatchedNumbers(season))
                                                    }}
                                                    sx={{
                                                        flexShrink: 0, px: 1, py: 0.25, borderRadius: 1, cursor: 'pointer',
                                                        border: '1px solid', borderColor: 'text.main',
                                                        transition: 'background-color 0.15s, color 0.15s',
                                                        '@media (hover: hover)': { '&:hover': { bgcolor: 'yellow.dark', color: 'yellow.contrastText', borderColor: 'yellow.dark' } },
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                                                        Watch all
                                                    </Typography>
                                                </Box>
                                            )}

                                            <ExpandMoreIcon
                                                fontSize="small"
                                                sx={{
                                                    color: 'text.main', flexShrink: 0,
                                                    transition: 'transform 0.2s',
                                                    transform: isSeasonOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                }}
                                            />
                                        </Box>

                                        <Collapse in={isSeasonOpen} unmountOnExit>
                                            <Box sx={{ p: 1, pt: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                {loadingSeason === season.seasonNumber && (
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', p: 1 }}>
                                                        Loading episodes…
                                                    </Typography>
                                                )}
                                                {(episodesBySeason[season.seasonNumber] || []).map((episode) => {
                                                    const saved = season.watchedEpisodes[String(episode.episode_number)]
                                                    const watched = Boolean(saved)
                                                    // Клік по переглянутій серії відкриває редагування
                                                    const clickable = watched && canEditEpisodes
                                                    return (
                                                        <Box
                                                            key={episode.id}
                                                            onClick={clickable
                                                                ? () => onEpisodeEdit(season.seasonNumber, episode.episode_number, saved)
                                                                : undefined}
                                                            sx={{
                                                                display: 'flex', alignItems: 'center', gap: 1,
                                                                px: 1, py: 0.5, borderRadius: 1,
                                                                cursor: clickable ? 'pointer' : 'default',
                                                                transition: 'background-color 0.15s, color 0.15s',
                                                                ...(clickable && {
                                                                    '@media (hover: hover)': { '&:hover': {
                                                                        bgcolor: 'yellow.main',
                                                                        '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                                        '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                                    } },
                                                                }),
                                                            }}
                                                        >
                                                            {/* Пропущена серія — хрестик, переглянута — галочка */}
                                                            {saved?.skipped
                                                                ? <CancelIcon fontSize="small" sx={{ color: 'status.skipped' }} />
                                                                : watched
                                                                    ? <CheckCircleIcon fontSize="small" sx={{ color: 'status.watched' }} />
                                                                    : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}

                                                            <Typography variant="body2" color="text.main" sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                                                                {episode.episode_number}. {episode.name}
                                                            </Typography>

                                                            {watched ? (
                                                                // Дата перегляду, а не виходу
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                                                                    {/* Без дати перегляду — текст, а не прочерк */}
                                                                    {saved.skipped ? 'Skipped' : (formatDateOnly(saved.dateAdded) || 'No date')}
                                                                </Typography>
                                                            ) : canEditEpisodes ? (
                                                                <Box
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onEpisodeMark(season.seasonNumber, episode.episode_number)
                                                                    }}
                                                                    sx={{
                                                                        flexShrink: 0, px: 1, py: 0.25, borderRadius: 1, cursor: 'pointer',
                                                                        border: '1px solid', borderColor: 'text.main',
                                                                        transition: 'background-color 0.15s, color 0.15s',
                                                                        '@media (hover: hover)': { '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' } },
                                                                    }}
                                                                >
                                                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'inherit' }}>
                                                                        Watched
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Tooltip title={`Saved ${row.copies} times — cannot mark`} arrow>
                                                                    <LockIcon fontSize="small" sx={{ color: 'text.secondary', flexShrink: 0 }} />
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                        </Collapse>
                                    </Box>
                                )
                            })}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Card>
    )
}

export default UpdateRow
