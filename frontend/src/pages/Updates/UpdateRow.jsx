import { Box, Card, Chip, Collapse, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import instance from '../../axios'
import { alertError } from '../../alerts'
import { getTmdbLanguage } from '../../utils/languages'
import { formatDateOnly } from '../../utils/dates'
import ItemFolderButton from '../../components/ItemFolderButton'

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
    const { language } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)

    const [open, setOpen] = useState(false)
    // Множина, а не одне значення: сезони розкриваються незалежно один від одного
    const [openSeasons, setOpenSeasons] = useState(() => new Set())
    const [episodesBySeason, setEpisodesBySeason] = useState({})
    const [loadingSeason, setLoadingSeason] = useState(null)

    const canEditEpisodes = row.kind === 'tv' && Boolean(row.mongoId)

    // Серії тягнемо лише коли сезон реально розкрили
    const toggleSeason = async (seasonNumber) => {
        const wasOpen = openSeasons.has(seasonNumber)
        setOpenSeasons((prev) => {
            const next = new Set(prev)
            if (wasOpen) next.delete(seasonNumber)
            else next.add(seasonNumber)
            return next
        })
        if (wasOpen || episodesBySeason[seasonNumber]) return
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
                onClick={() => setOpen((v) => !v)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: { xs: 1, sm: 2 },
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, color 0.15s',
                    '&:hover': {
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
                    },
                }}
            >
                {/* Картинка — справжнє посилання на сторінку TMDB (а не onClick з navigate):
                    так працюють колесо миші та Ctrl/Cmd+клік — відкриття в новій вкладці.
                    У колекції власної сторінки немає — ведемо на першу частину франшизи. */}
                <Box
                    component={Link}
                    to={row.kind === 'tv' ? `/tv/${row.id}` : `/movie/${row.parts[0]?.id}`}
                    // Клік по картинці не розгортає рядок
                    onClick={(e) => e.stopPropagation()}
                    sx={{ display: 'flex', flexShrink: 0 }}
                >
                    <Box
                        component="img"
                        src={poster(row.posterPath)}
                        alt={row.title}
                        loading="lazy"
                        sx={{ width: 48, height: 72, objectFit: 'cover', borderRadius: 1, boxShadow: 2 }}
                    />
                </Box>

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
                        // --- Частини колекції ---
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
                                        '&:hover': {
                                            transform: (theme) => theme.hoverLift,
                                            '& .update-poster': { boxShadow: 6 },
                                        },
                                    }}
                                >
                                    <Box
                                        className="update-poster"
                                        sx={{
                                            position: 'relative', borderRadius: 2, overflow: 'hidden', boxShadow: 2,
                                            transition: 'box-shadow 0.2s ease-in-out',
                                        }}
                                    >
                                        {/* Справжнє посилання — працюють колесо миші та Ctrl/Cmd+клік */}
                                        <Box component={Link} to={`/movie/${part.id}`} sx={{ display: 'block' }}>
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
                                        </Box>

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
                                                '&:hover': {
                                                    bgcolor: 'yellow.main',
                                                    '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                    '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                },
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
                                                        '&:hover': { bgcolor: 'yellow.dark', color: 'yellow.contrastText', borderColor: 'yellow.dark' },
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
                                                                    '&:hover': {
                                                                        bgcolor: 'yellow.main',
                                                                        '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                                        '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                                    },
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
                                                                    {saved.skipped ? 'Skipped' : asDate(saved.dateAdded)}
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
                                                                        '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' },
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
