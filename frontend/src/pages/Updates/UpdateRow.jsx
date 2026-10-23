import { Box, ButtonBase, Card, Chip, Collapse, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { alertError } from '../../alerts'
import { getTmdbLanguage } from '../../utils/languages'
import { formatDateOnly } from '../../utils/dates'
import { getContrastText, getRatingAbbr, getRatingLevelColor } from '../../utils/ratingSystem'
import RatingLabel from '../../components/RatingLabel'
import ItemFolderButton from '../../components/ItemFolderButton'
import DropdownMenu from '../../components/_customMUI/DropdownMenu'
import SavedItemOpener from '../../components/SavedItemOpener'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone'
import NotificationsOffOutlinedIcon from '@mui/icons-material/NotificationsOffOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked'
import LockIcon from '@mui/icons-material/Lock'
import { DIMMED_POSTER_SX, isDimmedStatus } from '../../utils/folderStatus'
import { tmdbImageOrDefault } from '../../utils/tmdbImage'
import { tmdbGet } from '../../utils/tmdbApi'


const poster = (path) => tmdbImageOrDefault(path, 'w185')
// TMDB dates are already yyyy-mm-dd, while dateAdded is an ISO string
const asDate = (value) => formatDateOnly(value) || '—'

// State icon of an episode. A watched one with a rating shows the rating inside the same yellow circle instead of the
// check: the level color and abbreviation of the user's rating system, otherwise the number.
function EpisodeMark({ saved }) {
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    if (saved?.skipped) return <CancelIcon fontSize="small" sx={{ color: 'status.skipped' }} />
    if (!saved) return <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
    if (saved.rating == null) return <CheckCircleIcon fontSize="small" sx={{ color: 'status.watched' }} />

    const levelColor = getRatingLevelColor(saved.rating, ratingSystem)
    const label = String(getRatingAbbr(saved.rating, ratingSystem) ?? saved.rating)
    return (
        <Box
            component="span"
            // rating-circle: on the yellow row hover the circle turns dark like the check icons do
            className={levelColor ? undefined : 'rating-circle'}
            aria-label={`Rating ${label}`}
            sx={{
                // The circle of the small check icon is 17px inside its 20px box (1.5px of margin each side), so the same
                // size and the same slot keep the circle and the titles lined up
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                width: 17, height: 17, m: '1.5px', borderRadius: '50%', boxSizing: 'border-box',
                bgcolor: levelColor || 'status.watched',
                color: levelColor ? getContrastText(levelColor) : 'text.dark',
                // Longer labels ("100", two letters) need a smaller size to fit the circle
                fontSize: label.length > 2 ? 7 : label.length === 2 ? 9 : 10, fontWeight: 800, lineHeight: 1,
                letterSpacing: label.length > 2 ? '-0.3px' : 0,
                // Capitals sit in the middle of the line; lowercase letters look pushed down
                textTransform: 'uppercase',
            }}
        >
            {label}
        </Box>
    )
}

// One list row: a movie collection or a series. A click expands details.
function UpdateRow({ row, mutedMode = null, onMute, onUnmute, onMoviePlus, onMovieCheck, onEpisodeMark, onEpisodeEdit, onSeasonMarkAll }) {
    const { language, viewMode } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)

    // The row poster opens the series, or for a collection its FIRST part (by release date).
    // SavedItemOpener decides what opens (TMDB / saved / folder picker).
    // Parts not released yet (SOON in Timeline) aren't shown on Updates
    const visibleParts = row.kind === 'collection' ? row.parts.filter((p) => !p.upcoming) : []
    const targetPart = row.kind === 'collection' ? visibleParts[0] || row.parts[0] : null

    const [open, setOpen] = useState(false)
    // A set, not one value: seasons expand independently.
    const [openSeasons, setOpenSeasons] = useState(() => new Set())
    const [episodesBySeason, setEpisodesBySeason] = useState({})
    const [loadingSeason, setLoadingSeason] = useState(null)

    const canEditEpisodes = row.kind === 'tv' && Boolean(row.mongoId)

    // Episodes are fetched only when a season is actually expanded; loaded ones aren't fetched twice.
    const loadSeasonEpisodes = async (seasonNumber) => {
        if (episodesBySeason[seasonNumber]) return
        try {
            setLoadingSeason(seasonNumber)
            const data = await tmdbGet(`/tv/${row.id}/season/${seasonNumber}`, { language: tmdbLanguage })
            setEpisodesBySeason((prev) => ({ ...prev, [seasonNumber]: data.episodes || [] }))
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

    // Expanding a series opens the season with the lowest-numbered unwatched episode (skipped don't count); other
    // seasons collapse so the state is fresh.
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

    // Numbers of a season's unwatched episodes: the real numbers if episodes are loaded (not always 1..N),
    // otherwise 1..episodeCount.
    const unwatchedNumbers = (season) => {
        const loaded = episodesBySeason[season.seasonNumber]
        const all = loaded
            ? loaded.map((e) => e.episode_number)
            : Array.from({ length: season.episodeCount }, (_, i) => i + 1)
        return all.filter((n) => !season.watchedEpisodes[String(n)])
    }

    const isCaughtUp = row.unwatchedCount === 0
    const baseSubtitle = isCaughtUp
        ? 'All caught up'
        : row.kind === 'collection'
        ? `${row.unwatchedCount} unwatched of ${row.releasedCount}`
        : `${row.unwatchedCount} new ${row.unwatchedCount === 1 ? 'episode' : 'episodes'} of ${row.episodeCount}`
    const subtitle = mutedMode
        ? `${baseSubtitle} · ${mutedMode === 'forever' ? 'Skipped' : 'Skipped until a new part'}`
        : baseSubtitle

    // Follow state of a franchise, a bell like a channel's: the chip shows it and opens the actions. It sits in the
    // expanded row, so the header looks the same for movies and series.
    const followItems = mutedMode
        ? [{ key: 'unmute', label: 'Follow again', onClick: () => onUnmute(row) }]
        : [
            { key: 'mute-forever', label: 'Stop following', onClick: () => onMute(row, 'forever') },
            { key: 'mute-new-part', label: 'Stop until a new part', onClick: () => onMute(row, 'new-part') },
        ]
    const followLabel = mutedMode ? 'Skipped' : 'Following'

    return (
        // Card, so the background matches the movie cards (background.paper)
        <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box
                onClick={handleRowToggle}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 2, p: { xs: 1, sm: 2 },
                    cursor: 'pointer',
                    transition: 'background-color 0.15s, color 0.15s',
                    '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                        bgcolor: 'yellow.main',
                        color: 'yellow.contrastText',
                        '& .MuiTypography-root': { color: 'yellow.contrastText' },
                        '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                        // The counter is yellow too and would blend into a yellow row: darker yellow, same
                        // trick as selected + hover.
                        '& .MuiChip-root': {
                            bgcolor: 'yellow.contrastText',
                            color: 'yellow.main',
                        },
                    } },
                }}
            >
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
                        // Nothing new left: muted counter (the row disappears on the next visit)
                        bgcolor: isCaughtUp ? 'action.selected' : 'yellow.main',
                        color: isCaughtUp ? 'text.secondary' : 'yellow.contrastText',
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
                    {row.kind === 'collection' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                        <DropdownMenu
                            width={220}
                            items={followItems}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            renderTrigger={({ onClick, open: isMenuOpen }) => (
                                <ButtonBase
                                    onClick={onClick}
                                    disableRipple
                                    aria-label="follow options"
                                    aria-haspopup="menu"
                                    aria-expanded={isMenuOpen}
                                    sx={{
                                        // Same shape as the Sort control
                                        display: 'inline-flex', alignItems: 'center', gap: 1,
                                        height: 40, px: 2, boxSizing: 'border-box', borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'text.main',
                                        color: 'text.main',
                                        transition: 'background-color 0.15s, border-color 0.15s, color 0.15s',
                                        '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                                            bgcolor: 'yellow.main',
                                            borderColor: 'yellow.main',
                                            color: 'yellow.contrastText',
                                        } },
                                    }}
                                >
                                    {mutedMode ? <NotificationsOffOutlinedIcon fontSize="small" /> : <NotificationsNoneIcon fontSize="small" />}
                                    <Typography variant="body2" component="span" sx={{ color: 'inherit', lineHeight: 1 }}>
                                        {followLabel}
                                    </Typography>
                                    <ArrowDropDownIcon fontSize="small" />
                                </ButtonBase>
                            )}
                        />
                        </Box>
                    )}
                    {row.kind === 'collection' ? (
                        viewMode === 'list' ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {visibleParts.map((part) => (
                                    <Box
                                        key={part.id}
                                        sx={{
                                            position: 'relative',
                                            // Watched / dropped / skipped: the whole row goes grey (on cards
                                            // only the poster does)
                                            ...(isDimmedStatus(part.status) && DIMMED_POSTER_SX),
                                            display: 'flex', alignItems: 'center', gap: 2,
                                            pl: 1, pr: 7.5, py: 0.5,
                                            borderRadius: 2,
                                            border: '1px solid', borderColor: 'divider',
                                            transition: 'box-shadow 0.2s ease-in-out',
                                            '@media (hover: hover) and (pointer: fine)': { '&:hover': { boxShadow: 4 } },
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
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    {asDate(part.releaseDate)}
                                                </Typography>
                                                <RatingLabel rating={part.saved?.rating} inline />
                                            </Box>
                                        </Box>

                                        <ItemFolderButton
                                            variant="direct"
                                            mediaType="movie"
                                            tmdbId={part.id}
                                            itemTitle={part.title}
                                            stopPropagation
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
                            {visibleParts.map((part) => (
                                <Box
                                    key={part.id}
                                    sx={{
                                        display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0,
                                        transition: 'transform 0.2s ease-in-out',
                                        '@media (hover: hover) and (pointer: fine)': { '&:hover': {
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
                                        <SavedItemOpener mediaType="movie" tmdbId={part.id} title={part.title} sx={{ display: 'block' }}>
                                            <Box
                                                component="img"
                                                src={poster(part.posterPath)}
                                                alt={part.title}
                                                loading="lazy"
                                                sx={{
                                                    width: '100%', aspectRatio: '2 / 3', objectFit: 'cover', display: 'block',
                                                    ...(isDimmedStatus(part.status) && DIMMED_POSTER_SX),
                                                }}
                                            />
                                        </SavedItemOpener>

                                        <ItemFolderButton
                                            variant="direct"
                                            mediaType="movie"
                                            tmdbId={part.id}
                                            itemTitle={part.title}
                                            stopPropagation
                                            onAdd={() => onMoviePlus(part)}
                                            onEdit={(copy) => onMovieCheck(part, copy)}
                                        />
                                        <RatingLabel rating={part.saved?.rating} />
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
                                                '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                                                    bgcolor: 'yellow.main',
                                                    '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                    '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                } },
                                            }}
                                        >
                                            {seasonWatched
                                                ? <CheckCircleIcon fontSize="small" sx={{ color: 'status.watched' }} />
                                                : <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.secondary' }} />}

                                            {/* On phones the counter goes on its own line under the title: next to the Watch all button it broke the season name. */}
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

                                            {canEditEpisodes && season.unwatchedCount > 0 && (
                                                <Box
                                                    onClick={(e) => {
                                                        // Otherwise the click would also expand/collapse the
                                                        // season
                                                        e.stopPropagation()
                                                        onSeasonMarkAll(season.seasonNumber, unwatchedNumbers(season))
                                                    }}
                                                    sx={{
                                                        flexShrink: 0, px: 1, py: 0.25, borderRadius: 1, cursor: 'pointer',
                                                        border: '1px solid', borderColor: 'text.main',
                                                        transition: 'background-color 0.15s, color 0.15s',
                                                        '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'yellow.dark', color: 'yellow.contrastText', borderColor: 'yellow.dark' } },
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
                                                                    '@media (hover: hover) and (pointer: fine)': { '&:hover': {
                                                                        bgcolor: 'yellow.main',
                                                                        '& .MuiTypography-root': { color: 'yellow.contrastText' },
                                                                        '& .MuiSvgIcon-root': { color: 'yellow.contrastText' },
                                                                        '& .rating-circle': { bgcolor: 'yellow.contrastText', color: 'yellow.main' },
                                                                    } },
                                                                }),
                                                            }}
                                                        >
                                                            <EpisodeMark saved={saved} />

                                                            <Typography variant="body2" color="text.main" sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
                                                                {episode.episode_number}. {episode.name}
                                                            </Typography>

                                                            {watched ? (
                                                                <Typography variant="caption" sx={{ color: 'text.secondary', flexShrink: 0 }}>
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
                                                                        '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' } },
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
