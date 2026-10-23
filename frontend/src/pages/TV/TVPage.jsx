import { Box, Typography, CircularProgress, Chip, Card, CardMedia, Tooltip, Menu, MenuItem, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import { selectSavedCopies } from '../../redux/slices/SavedSlice'
import { getRatingAbbr, getRatingLevelColor, getContrastText, hasRatingSystem, getRatingLevels } from '../../utils/ratingSystem'
import instance from '../../axios'
import { getTmdbLanguage } from '../../utils/languages'
import { toDateOnlyISO, formatDateOnly } from '../../utils/dates'
import { alertError, alertSuccess } from '../../alerts'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CloseIcon from '@mui/icons-material/Close'
import ItemSaveDialog from '../../components/ItemSaveDialog/ItemSaveDialog'
import SeasonEpisodeDialog from '../../components/SeasonEpisodeDialog/SeasonEpisodeDialog'
import MarkWatchedDialog from '../../components/MarkWatchedDialog/MarkWatchedDialog'
import ActorCart from '../../components/Carts/ActorCart'
import EpisodeCart from '../../components/Carts/EpisodeCart'
import DropdownMenu from '../../components/_customMUI/DropdownMenu'
import ItemFolderButton from '../../components/ItemFolderButton'
import EditableValue from '../../components/EditableValue'
import StretchedLink from '../../components/StretchedLink'
import { scrollbarSx, scrollStripSx } from '../../theme/scrollbar'
import { fetchSavedDoc } from '../../utils/savedItems'
import { IMAGE_DEFAULT, tmdbImage } from '../../utils/tmdbImage'
import { tmdbGet } from '../../utils/tmdbApi'
import { liftHoverSx } from '../../theme/hoverSx'


// Memoized episode cell: re-renders only when its own primitive props change, so saving one episode doesn't touch
// hundreds of cells. onClick must be stable.
const EpisodeCell = memo(function EpisodeCell({ sNum, eNum, bg, text, kind, content, active, onClick, watched, dateAdded }) {
    let node = content
    if (kind === 'empty') node = <CheckBoxOutlineBlankIcon sx={{ fontSize: 20, color: "rating.cellText" }} />
    else if (kind === 'checked') node = <CheckBoxIcon sx={{ fontSize: 20, color: "rating.cellText" }} />
    else if (kind === 'skipped') node = <CloseIcon sx={{ fontSize: 20, color: "rating.cellText" }} />

    const cart = (
        <EpisodeCart
            unique_key={`${sNum}_${eNum}`}
            backgroundColor={bg}
            textColor={text}
            isHoverActive={active}
            onClick={active && onClick ? (e) => onClick(e, sNum, eNum) : undefined}
        >
            {node}
        </EpisodeCart>
    )

    if (active && (watched != null || dateAdded || kind === 'skipped')) {
        const tooltipTitle = (
            <Box sx={{ p: 0.5 }}>
                {kind === 'skipped' && (
                    <Typography variant="caption" sx={{ display: "block" }}>Skipped</Typography>
                )}
                {watched != null && (
                    <Typography variant="caption" sx={{ display: "block" }}>Views: {watched}</Typography>
                )}
                {dateAdded && (
                    <Typography variant="caption" sx={{ display: "block" }}>Added: {dateAdded}</Typography>
                )}
            </Box>
        )
        return (
            <Tooltip title={tooltipTitle} arrow disableInteractive>
                <Box component="span" sx={{ display: "inline-flex" }}>{cart}</Box>
            </Tooltip>
        )
    }

    return cart
})

function TVPage({ isSaved = false }) {
    const { id } = useParams()
    const theme = useTheme()
    const isAuth = useSelector(selectIsAuth)
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || [])
    const { language } = useSelector((state) => state.config)
    const tmdbLanguage = getTmdbLanguage(language)
    const useRatingSystem = hasRatingSystem(ratingSystem)
    const ratingLevels = useMemo(() => getRatingLevels(ratingSystem), [ratingSystem])
    const [serial, setSerial] = useState(null)
    const [seasonDetails, setSeasonDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true)

    // Always-current serial ref for stable callbacks (no re-creation).
    const serialRef = useRef(serial)
    useEffect(() => { serialRef.current = serial }, [serial])

    const [currentFolderName, setCurrentFolderName] = useState(null)

    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false)
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false)
    const [isDeleteItem, setIsDeleteItem] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState(false)
    // Dialog item when it isn't the page's tv: the copy chosen via the button; null = the page's tv
    const [dialogItem, setDialogItem] = useState(null)
    const [folders, setFolders] = useState([])
    const [isGetFolders, setIsGetFolders] = useState(true)

    const [itemFolders, setItemFolders] = useState([])
    const savedCopies = useSelector(selectSavedCopies('tv', serial?.tmdbId))

    // Folder chip target: one copy in the folder -> its page; several (duplicates) -> the folder filtered by
    // title.
    const savedFolderPath = (folderName) => {
        const inFolder = savedCopies.filter((c) => c.folderName === folderName)
        return inFolder.length === 1
            ? `/user/tv/${inFolder[0].mongoId}`
            : `/folders/${encodeURIComponent(folderName)}?filter=${encodeURIComponent(serial.name)}`
    }
    const [isLoadingItemFolders, setIsLoadingItemFolders] = useState(true)

    const navigate = useNavigate()

    useEffect(() => {
        setIsLoading(true)

        const loadTmdb = (tmdbId, savedFields = {}) => {
            tmdbGet(`/tv/${tmdbId}`, { language: tmdbLanguage, append_to_response: "credits" })
                .then((data) => {
                    setSerial({ ...data, media_type: "tv", tmdbId: data.id, ...savedFields })

                    const seasonPromises = data.seasons
                        .filter(s => s.season_number > 0)
                        .map(s => tmdbGet(`/tv/${tmdbId}/season/${s.season_number}`, { language: tmdbLanguage }));

                    Promise.all(seasonPromises)
                        .then(responses => {
                            const seasonMap = {};
                            responses.forEach(r => {
                                const season = r;
                                const episodeMap = {};
                                season.episodes.forEach(e => {
                                    episodeMap[e.episode_number] = e;
                                });
                                seasonMap[season.season_number] = episodeMap;
                            });
                            setSeasonDetails(seasonMap);
                            setIsLoading(false);
                        })
                        .catch(err => {
                            console.warn(err);
                            alertError(err, "Failed to fetch seasons")
                            setIsLoading(false);
                        });
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load TV show")
                    setIsLoading(false)
                })
        }

        if (isSaved) {
            instance
                .get(`/tv/mongo/${id}`)
                .then((res) => {
                    const saved = res.data.results
                    setCurrentFolderName(saved.folderName)
                    loadTmdb(saved.tmdbId, {
                        _id: saved._id,
                        tmdbId: saved.tmdbId,
                        rating: saved.rating,
                        comment: saved.comment,
                        dateAdded: saved.dateAdded,
                        updatedAt: saved.updatedAt,
                        customType: saved.customType,
                        seasons: saved.seasons
                    })
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err, "Failed to load TV show")
                    setIsLoading(false)
                })
        } else {
            loadTmdb(id)
        }
    }, [id, isSaved, tmdbLanguage])

    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance
                .get(`/folders`)
                .then((res) => {
                    setFolders(res.data.results)
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                })
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth])

    useEffect(() => {
        const tmdbId = serial?.tmdbId
        if (isAuth && tmdbId) {
            setIsLoadingItemFolders(true)
            instance
                .get(`/folders/tv/${tmdbId}`)
                .then((res) => {
                    setItemFolders(res.data.results)
                    setIsLoadingItemFolders(false)
                })
                .catch((err) => {
                    console.warn(err)
                    setIsLoadingItemFolders(false)
                })
        } else {
            setItemFolders([])
            setIsLoadingItemFolders(false)
        }
    }, [serial?.tmdbId, isAuth, isGetFolders])

    const handleOpenDialogAdd = () => {
        setSelectedFolder(false)
        setIsOpenDialogAdd(true)
    }
    const handleOpenDialogEdit = () => {
        setSelectedFolder(currentFolderName ? { name: currentFolderName } : false)
        setIsOpenDialogEdit(true)
    }
    const handleDeleteItem = () => {
        setSelectedFolder(currentFolderName ? { name: currentFolderName } : false)
        setIsDeleteItem(true)
    }
    const handleCloseDialog = () => {
        setIsOpenDialogAdd(false)
        setIsOpenDialogEdit(false)
        setIsDeleteItem(false)
        setSelectedFolder(false)
        setDialogItem(null)
    }

    const folderOfCopy = (copy) => folders.find((f) => f.name === copy.folderName) || { name: copy.folderName, status: copy.status }

    // Edit/delete of the copy chosen via the button on the TMDB tv page (on a copy page the button calls the
    // regular handleOpenDialogEdit / handleDeleteItem).
    const handleEditCopy = async (copy) => {
        if (!copy) return handleOpenDialogEdit()
        try {
            const doc = await fetchSavedDoc('tv', copy.mongoId)
            setDialogItem({ ...serial, ...doc })
            setSelectedFolder(folderOfCopy(copy))
            setIsOpenDialogEdit(true)
        } catch (err) {
            console.warn(err)
            alertError(err)
        }
    }
    const handleDeleteCopy = (copy) => {
        if (!copy) return handleDeleteItem()
        setDialogItem({ ...serial, _id: copy.mongoId })
        setSelectedFolder(folderOfCopy(copy))
        setIsDeleteItem(true)
    }

    const isSmall = useMediaQuery(theme.breakpoints.down('sm'))
    const overviewRef = useRef(null)
    const [overviewExpanded, setOverviewExpanded] = useState(false)
    const [overviewOverflows, setOverviewOverflows] = useState(false)

    // Whether the overview really overflows the collapsed view, otherwise "Show more" lies. Not recomputed
    // when expanded: scrollHeight always equals clientHeight there.
    useEffect(() => {
        if (!isSmall) {
            setOverviewOverflows(false)
            return
        }
        if (overviewExpanded) return
        const el = overviewRef.current
        if (!el) return
        setOverviewOverflows(el.scrollHeight > el.clientHeight + 1)
    }, [serial?.overview, isSmall, overviewExpanded])

    useEffect(() => {
        setOverviewExpanded(false)
    }, [serial?.tmdbId])

    // In-place comment/rating edit. Other fields are sent as is so nothing is wiped.
    const saveFields = async (changes) => {
        try {
            const res = await instance.patch(`/tv/${serial._id}`, {
                comment: serial.comment,
                rating: serial.rating,
                dateAdded: serial.dateAdded,
                customType: serial.customType,
                ...changes,
            })
            const saved = res.data.results
            setSerial((prev) => ({ ...prev, comment: saved.comment, rating: saved.rating, dateAdded: saved.dateAdded, updatedAt: saved.updatedAt }))
        } catch (err) {
            console.warn(err)
            alertError(err)
            throw err
        }
    }
    const handleSaveReview = (comment) => saveFields({ comment })
    const handleSaveRatingDate = ({ rating, dateAdded }) => saveFields({ rating, dateAdded })

    const handleItemSaved = (updated) => {
        // Another copy was saved: leave the page data alone.
        if (isSaved && !dialogItem) {
            setSerial(prev => ({ ...prev, ...updated }))
            if (updated.folderName) setCurrentFolderName(updated.folderName)
        }
        setIsGetFolders(true)
    }


    const [ratingDialogOpen, setRatingDialogOpen] = useState(false)
    const [ratingMode, setRatingMode] = useState("season")
    const [ratingTarget, setRatingTarget] = useState({ season: null, episode: null })
    const [ratingInitial, setRatingInitial] = useState({})
    const [ratingIsNew, setRatingIsNew] = useState(false)

    const findMongoSeason = (sNum) => serial?.seasons?.find(s => s.season === Number(sNum))
    const findMongoEpisode = (sNum, eNum) => findMongoSeason(sNum)?.episodes?.find(e => e.episode === Number(eNum))

    // Fast O(1) lookup maps for rendering the grid (recomputed only when data changes); key "season_episode"
    // -> mongo episode.
    const mongoEpisodeMap = useMemo(() => {
        const map = {}
        serial?.seasons?.forEach(s => {
            s.episodes?.forEach(e => { map[`${s.season}_${e.episode}`] = e })
        })
        return map
    }, [serial?.seasons])

    // Per-season offset (first episode -> first column), computed once.
    const seasonOffsets = useMemo(() => {
        const offsets = {}
        Object.keys(seasonDetails).forEach(sNum => {
            const nums = Object.keys(seasonDetails[sNum] || {}).map(Number).sort((a, b) => a - b)
            offsets[sNum] = nums.length ? nums[0] - 1 : 0
        })
        return offsets
    }, [seasonDetails])

    const openSeasonDialog = (sNum) => {
        const s = findMongoSeason(sNum)
        setRatingMode("season")
        setRatingTarget({ season: Number(sNum), episode: null })
        // A season not in the DB yet: the dialog defaults the date to today.
        setRatingIsNew(!s)
        setRatingInitial({ rating: s?.rating, comment: s?.comment, dateAdded: s?.dateAdded })
        setRatingDialogOpen(true)
    }
    const openEpisodeDialog = (sNum, eNum) => {
        const ep = findMongoEpisode(sNum, eNum)
        setRatingMode("episode")
        setRatingTarget({ season: Number(sNum), episode: Number(eNum) })
        setRatingIsNew(!ep)
        setRatingInitial({ rating: ep?.rating, comment: ep?.comment, dateAdded: ep?.dateAdded, watchedCount: ep?.watchedCount, skipped: ep?.skipped })
        setRatingDialogOpen(true)
    }
    const handleSaveRating = (values) => {
        const { season, episode } = ratingTarget
        const url = ratingMode === "episode"
            ? `/tv/${serial._id}/season/${season}/episode/${episode}`
            : `/tv/${serial._id}/season/${season}`

        instance
            .patch(url, values)
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
                setRatingDialogOpen(false)
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    const getSeasonWatchedCount = (sNum) => {
        const total = Object.keys(seasonDetails[sNum] || {}).length
        const seasonDoc = findMongoSeason(sNum)
        const watched = seasonDoc?.episodes?.filter(e => (e.watchedCount ?? 0) > 0).length ?? 0
        const skipped = seasonDoc?.episodes?.filter(e => e.skipped).length ?? 0
        return { watched, skipped, total }
    }

    // Bulk action: instead of a plain confirm, open a dialog to pick the watch date (default today). State: {
    // season, epNums, remaining } or null.
    const [markDialog, setMarkDialog] = useState(null)
    const handleMarkSeasonWatched = (sNum) => {
        const epNums = Object.keys(seasonDetails[sNum] || {}).map(Number)
        const { watched, skipped, total } = getSeasonWatchedCount(sNum)
        const remaining = Math.max(0, total - watched - skipped)
        // The backend only touches unwatched episodes; nothing to do if there are none.
        if (!remaining) return

        setMarkDialog({ season: sNum, epNums, remaining })
    }

    const handleConfirmMarkSeason = (dateAdded) => {
        const { season, epNums } = markDialog
        setMarkDialog(null)
        instance
            .patch(`/tv/${serial._id}/season/${season}/watched`, { episodes: epNums, dateAdded })
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    const handleDeleteEpisode = (sNum, eNum) => {
        instance
            .delete(`/tv/${serial._id}/season/${sNum}/episode/${eNum}`)
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    const handleDeleteSeason = (sNum) => {
        instance
            .delete(`/tv/${serial._id}/season/${sNum}`)
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    // Skip/unskip. A skipped episode is unwatched (watchedCount 0, no rating); unskipping keeps it with 0 views.
    // The comment is kept; skipping clears the date, unskipping sets today.
    const handleSkipEpisode = (sNum, eNum, skip) => {
        const ep = findMongoEpisode(sNum, eNum)
        instance
            .patch(`/tv/${serial._id}/season/${sNum}/episode/${eNum}`, {
                skipped: skip,
                watchedCount: skip ? 0 : (ep?.watchedCount ?? 0),
                rating: skip ? null : (ep?.rating ?? null),
                comment: ep?.comment ?? "",
                dateAdded: skip ? null : toDateOnlyISO(new Date()),
            })
            .then((res) => {
                setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
            })
            .catch((err) => {
                console.warn(err)
                alertError(err)
            })
    }

    // One shared Edit/Skip/Delete menu for all episodes (faster than a DropdownMenu per cell).
    const [episodeMenuAnchor, setEpisodeMenuAnchor] = useState(null)
    const [episodeMenuTarget, setEpisodeMenuTarget] = useState({ season: null, episode: null })

    // Stable callback (not re-created when serial changes) so EpisodeCell doesn't re-render because of it;
    // serial is read from a ref.
    const handleEpisodeCellClick = useCallback((e, sNum, eNum) => {
        const current = serialRef.current
        const season = current?.seasons?.find(s => s.season === Number(sNum))
        const ep = season?.episodes?.find(item => item.episode === Number(eNum))
        // A skipped episode counts as saved: a click opens Edit/Delete (to unskip) instead of adding a view.
        const isEpisodeSaved = Boolean(ep && ((ep.watchedCount ?? 0) > 0 || ep.skipped))

        if (isEpisodeSaved) {
            setEpisodeMenuAnchor(e.currentTarget)
            setEpisodeMenuTarget({ season: sNum, episode: eNum })
        } else {
            instance
                .patch(`/tv/${current._id}/season/${sNum}/episode/${eNum}`, {
                    watchedCount: 1,
                    dateAdded: toDateOnlyISO(new Date()),
                    rating: ep?.rating ?? null,
                    comment: ep?.comment ?? ""
                })
                .then((res) => {
                    setSerial(prev => ({ ...prev, seasons: res.data.results.seasons }))
                })
                .catch((err) => {
                    console.warn(err)
                    alertError(err)
                })
        }
    }, [])
    const closeEpisodeMenu = () => setEpisodeMenuAnchor(null)


    const getRatingColor = (rating) => {
        if (!rating || rating === 0) return theme.palette.rating.empty;
        if (rating >= 9) return theme.palette.rating.awesome; // Awesome
        if (rating >= 8) return theme.palette.rating.great; // Great
        if (rating >= 7) return theme.palette.rating.good; // Good
        if (rating >= 6) return theme.palette.rating.regular; // Regular
        if (rating >= 5) return theme.palette.rating.bad; // Bad
        return theme.palette.rating.garbage; // Garbage (< 5)
    };
    const getTextColor = (rating) => {
        if (!rating || rating === 0) return theme.palette.text.main;
        if (rating >= 7.0 && rating < 8.0) return theme.palette.text.dark; // Dark text for yellow
        return theme.palette.text.white;
    };

    const getSeasonCell = (sNum) => {
        const season = findMongoSeason(sNum);
        const rating = season?.rating ? season.rating : null; // 0-100
        if (rating == null) {
            return { bg: theme.palette.rating.cell, text: theme.palette.rating.cellText, content: "-" };
        }
        const abbr = getRatingAbbr(rating, ratingSystem);
        const content = abbr || `${rating}`;
        const customColor = getRatingLevelColor(rating, ratingSystem);
        const bg = useRatingSystem ? (customColor || theme.palette.rating.cell) : getRatingColor(rating / 10);
        const text = useRatingSystem
            ? (customColor ? getContrastText(customColor) : theme.palette.rating.cellText)
            : getTextColor(rating / 10);
        return { bg, text, content };
    };

    // Episode cell state as PRIMITIVES (for React.memo): 'empty'/'checked' make EpisodeCell render the icon
    // itself (no JSX as a prop).
    // kind: 'none' | 'empty' | 'checked' | 'rating' | 'dash'
    const getEpisodeCellState = (sNum, eNum) => {
        const exists = Boolean(seasonDetails[sNum]?.[eNum]);
        if (!exists) {
            return { bg: theme.palette.rating.empty, text: theme.palette.text.main, kind: "none", content: "", active: false };
        }

        if (isSaved) {
            // mongo: not watched -> empty checkbox (even with a rating); watched with a rating -> number;
            // without -> check.
            const ep = mongoEpisodeMap[`${sNum}_${eNum}`];
            const isWatched = (ep?.watchedCount ?? 0) > 0;
            const watched = isWatched ? ep.watchedCount : null;
            const dateAdded = ep?.dateAdded ? formatDateOnly(ep.dateAdded) : null;

            if (ep?.skipped) {
                return { bg: theme.palette.rating.cell, text: theme.palette.rating.cellText, kind: "skipped", content: "", active: true, watched: null, dateAdded };
            }

            if (!isWatched) {
                return { bg: theme.palette.rating.cell, text: theme.palette.rating.cellText, kind: "empty", content: "", active: true, watched: null, dateAdded: null };
            }
            const rating = ep?.rating ? ep.rating / 10 : null;
            if (rating != null) {
                const abbr = getRatingAbbr(ep.rating, ratingSystem);
                const content = abbr || rating.toFixed(1);
                const customColor = getRatingLevelColor(ep.rating, ratingSystem);
                // Custom rating system without a color: neutral background (not the default scale).
                const bg = useRatingSystem ? (customColor || theme.palette.rating.cell) : getRatingColor(rating);
                const text = useRatingSystem
                    ? (customColor ? getContrastText(customColor) : theme.palette.rating.cellText)
                    : getTextColor(rating);
                return { bg, text, kind: "rating", content, active: true, watched, dateAdded };
            }
            return { bg: theme.palette.rating.cell, text: theme.palette.rating.cellText, kind: "checked", content: "", active: true, watched, dateAdded };
        }

        const episode = seasonDetails[sNum]?.[eNum];
        const rating = episode?.vote_average ? episode.vote_average : null;
        if (rating == null) {
            return { bg: theme.palette.rating.cell, text: theme.palette.rating.cellText, kind: "dash", content: "-", active: true };
        }
        return { bg: getRatingColor(rating), text: getTextColor(rating), kind: "rating", content: rating.toFixed(1), active: true };
    };

    // Season offset: if numbering doesn't start at 1 (e.g. first episode 65), shift so the first episode
    // lands in the first column.
    const getSeasonOffset = (sNum) => seasonOffsets[sNum] ?? 0;

    const getEpisodeTooltip = (sNum, eNum) => {
        const ep = seasonDetails[sNum]?.[eNum];
        if (!ep) return "";
        return (
            <Box sx={{ p: 0.5 }}>
                <Typography variant="caption" sx={{ display: "block", fontWeight: "bold" }}>
                    Episode {ep.episode_number}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                    Votes: {ep.vote_count ?? 0}
                </Typography>
                <Typography variant="caption" sx={{ display: "block" }}>
                    Air date: {formatDateOnly(ep.air_date) || "—"}
                </Typography>
            </Box>
        );
    };

    const seasonNumbers = useMemo(
        () => Object.keys(seasonDetails).sort((a, b) => a - b),
        [seasonDetails]
    );
    const maxEpisodes = useMemo(
        () => Math.max(
            ...seasonNumbers.map(sNum => {
                const nums = Object.keys(seasonDetails[sNum] || {}).map(Number).sort((a, b) => a - b);
                if (nums.length === 0) return 0;
                return nums[nums.length - 1] - (nums[0] - 1);
            }),
            0
        ),
        [seasonNumbers, seasonDetails]
    );

    // Legend Component.
    // The legend mirrors how the grid is actually colored: own ratings + custom system -> user levels with
    // abbreviations;
    // everything else (incl. the TMDB page) -> default ranges.
    const Legend = () => {
        const items = useRatingSystem && isSaved
            ? ratingLevels.map((level) => ({
                key: level.name,
                label: level.name,
                color: level.color || theme.palette.rating.cell,
                abbr: level.abbr || level.name.slice(0, 2).toUpperCase(),
                abbrColor: level.color ? getContrastText(level.color) : theme.palette.rating.cellText,
            }))
            : [
                { key: "90-100", label: "90-100", color: theme.palette.rating.awesome },
                { key: "80-89", label: "80-89", color: theme.palette.rating.great },
                { key: "70-79", label: "70-79", color: theme.palette.rating.good },
                { key: "60-69", label: "60-69", color: theme.palette.rating.regular },
                { key: "50-59", label: "50-59", color: theme.palette.rating.bad },
                { key: "1-49", label: "1-49", color: theme.palette.rating.garbage },
            ];

        return (
            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3, justifyContent: "center" }}>
                {items.map((item) => (
                    <Box key={item.key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box sx={{
                            minWidth: 16, height: 16, px: item.abbr ? 0.5 : 0, borderRadius: "4px",
                            backgroundColor: item.color,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            {item.abbr && (
                                <Typography variant="caption" sx={{ fontSize: 10, lineHeight: 1, fontWeight: "bold", color: item.abbrColor }}>
                                    {item.abbr}
                                </Typography>
                            )}
                        </Box>
                        <Typography variant="caption" color="text.main" sx={{ fontWeight: "bold", opacity: 0.8 }}>{item.label}</Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    // Episode grid. Memoized so menu/dialog state changes don't repaint hundreds of cells; recomputed only
    // when seasonDetails / serial.seasons / isSaved change.
    const heatmapGrid = useMemo(() => (
        <Box sx={{ minWidth: "fit-content", display: "flex", flexDirection: "column", gap: 1 }}>
            {/* Column Headers (Episodes) */}
            <Box sx={{ display: "flex", gap: 1 }}>
                <EpisodeCart
                    unique_key={'A1'}
                    backgroundColor={getRatingColor()}
                    textColor={theme.palette.text.main}
                    isHoverActive={false}
                />
                {isSaved && (
                    <EpisodeCart
                        unique_key={'A_watched'}
                        width={60}
                        backgroundColor={getRatingColor()}
                        textColor={theme.palette.text.main}
                        isHoverActive={false}
                    >
                        Seen
                    </EpisodeCart>
                )}
                {isSaved && (
                    <EpisodeCart
                        unique_key={'A_season'}
                        width={80}
                        backgroundColor={getRatingColor()}
                        textColor={theme.palette.text.main}
                        isHoverActive={false}
                    >
                        Rate
                    </EpisodeCart>
                )}
                <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                    {Array.from({ length: maxEpisodes }, (_, i) => (
                        <EpisodeCart
                            unique_key={i}
                            backgroundColor={getRatingColor()}
                            textColor={theme.palette.text.main}
                            isHoverActive={false}
                        >
                            E{i + 1}
                        </EpisodeCart>
                    ))}
                </Box>
            </Box>

            {/* Rows (Seasons) */}
            {seasonNumbers.map((sNum) => {
                const seasonCell = getSeasonCell(sNum);
                return (
                    <Box key={sNum} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <EpisodeCart
                            unique_key={sNum}
                            backgroundColor={getRatingColor()}
                            textColor={theme.palette.text.main}
                            isHoverActive={isSaved}
                            onClick={isSaved ? () => openSeasonDialog(sNum) : undefined}
                        >
                            S{sNum}
                        </EpisodeCart>
                        {isSaved && (() => {
                            const wc = getSeasonWatchedCount(sNum);
                            return (
                                <DropdownMenu
                                    width={180}
                                    items={[
                                        { key: 'all', label: 'Mark all as watched', onClick: () => handleMarkSeasonWatched(sNum) },
                                    ]}
                                    renderTrigger={({ onClick }) => (
                                        <EpisodeCart
                                            unique_key={`${sNum}_watched`}
                                            width={60}
                                            backgroundColor={theme.palette.rating.cell}
                                            textColor={theme.palette.rating.cellText}
                                            isHoverActive={true}
                                            onClick={onClick}
                                        >
                                            {/* Skipped count too: a season is closed when everything is watched or skipped. */}
                                            {`${wc.watched + wc.skipped}/${wc.total}`}
                                        </EpisodeCart>
                                    )}
                                />
                            );
                        })()}
                        {isSaved && (
                            <EpisodeCart
                                unique_key={`${sNum}_season`}
                                width={80}
                                backgroundColor={seasonCell.bg}
                                textColor={seasonCell.text}
                                isHoverActive={true}
                                onClick={() => openSeasonDialog(sNum)}
                            >
                                {seasonCell.content}
                            </EpisodeCart>
                        )}
                        <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                            {Array.from({ length: maxEpisodes }, (_, i) => {
                                const eNum = i + 1 + getSeasonOffset(sNum);
                                const cell = getEpisodeCellState(sNum, eNum);

                                if (isSaved) {
                                    return (
                                        <EpisodeCell
                                            key={`${sNum}_${eNum}`}
                                            sNum={sNum}
                                            eNum={eNum}
                                            bg={cell.bg}
                                            text={cell.text}
                                            kind={cell.kind}
                                            content={cell.content}
                                            active={cell.active}
                                            onClick={handleEpisodeCellClick}
                                            watched={cell.watched}
                                            dateAdded={cell.dateAdded}
                                        />
                                    );
                                }

                                const episodeCart = (
                                    <EpisodeCell
                                        sNum={sNum}
                                        eNum={eNum}
                                        bg={cell.bg}
                                        text={cell.text}
                                        kind={cell.kind}
                                        content={cell.content}
                                        active={cell.active}
                                    />
                                );

                                if (!isSaved && cell.active) {
                                    return (
                                        <Tooltip key={`${sNum}_${eNum}`} title={getEpisodeTooltip(sNum, eNum)} arrow>
                                            <Box component="span" sx={{ display: "inline-flex" }}>
                                                {episodeCart}
                                            </Box>
                                        </Tooltip>
                                    );
                                }

                                return <Box key={`${sNum}_${eNum}`} component="span" sx={{ display: "inline-flex" }}>{episodeCart}</Box>
                            })}
                        </Box>
                    </Box>
                );
            })}
        </Box>
        // theme must be a dependency: cell colors come from the palette as VALUES (not sx paths), so without
        // it the grid kept old colors after a theme change (white cells in dark).
        // theme is stable (useMemo on mode in App.js), so memoization holds.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [seasonDetails, serial?.seasons, isSaved, maxEpisodes, seasonNumbers, mongoEpisodeMap, seasonOffsets, ratingSystem, theme]);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress color="primary" />
            </Box>
        )
    }

    if (!serial) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography variant="h6" color="text.secondary">
                    TV Show not found
                </Typography>
            </Box>
        )
    }

    // Poster is portrait, backdrop landscape; card and background take different images (as on the movie page).
    const posterUrl = tmdbImage(serial.poster_path, 'w500')
    const backdropUrl = tmdbImage(serial.backdrop_path, 'w780')
    const backdropFullUrl = tmdbImage(serial.backdrop_path, 'original')
    const heroImage = (isSmall ? backdropUrl || posterUrl : posterUrl || backdropUrl) || IMAGE_DEFAULT
    const heroBackground = isSmall ? posterUrl || backdropFullUrl : backdropFullUrl || posterUrl

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
            {/* Hero Section */}
            <Box sx={{
                position: "relative",
                minHeight: { xs: "auto", sm: 400 },
                borderRadius: 2,
                overflow: "hidden",
                backgroundImage: [
                    `linear-gradient(${theme.palette.overlay.soft}, ${theme.palette.overlay.soft})`,
                    heroBackground && `url(${heroBackground})`,
                ].filter(Boolean).join(", "),
                backgroundSize: "cover",
                backgroundPosition: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                {isAuth && (
                    <ItemFolderButton
                        tone="hero"
                        mediaType="tv"
                        tmdbId={serial.tmdbId}
                        itemTitle={serial.name}
                        isCopy={isSaved}
                        onAdd={handleOpenDialogAdd}
                        onEdit={handleEditCopy}
                        onDelete={handleDeleteCopy}
                    />
                )}
                <Box sx={{
                    display: "flex",
                    // Column on phones, row from sm: at 360px the poster would eat almost all the width.
                    flexDirection: { xs: "column", sm: "row" },
                    gap: { xs: 2, sm: 3 },
                    alignItems: "center",
                    maxWidth: "1200px",
                    width: "100%",
                    minWidth: 0,
                    p: { xs: 2, sm: 3 }
                }}>
                    {/* Poster */}
                    <Tooltip title={isSaved ? "Open the TV page" : ""} arrow placement="top">
                        <Card
                            sx={{
                                position: "relative",
                                // Phones: wide 16:9 frame full width; the vertical poster took too much
                                // height.
                                width: { xs: "100%", sm: 170, md: 200 },
                                height: { xs: "auto", sm: 255, md: 300 },
                                flexShrink: 0,
                                boxShadow: 3,
                                borderRadius: 2,
                                ...(isSaved && {
                                    cursor: "pointer",
                                    transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                                    ...liftHoverSx(6),
                                })
                            }}
                        >
                            {isSaved && <StretchedLink to={`/tv/${serial.tmdbId}`} label="Open the TV page" />}
                            <CardMedia
                                component="img"
                                image={heroImage}
                                sx={{
                                    width: "100%",
                                    height: { xs: "auto", sm: "100%" },
                                    aspectRatio: { xs: "16 / 9", sm: "auto" },
                                    objectFit: "cover",
                                    display: "block"
                                }}
                            />
                        </Card>
                    </Tooltip>

                    {/* Serial Info */}
                    <Box sx={{
                        color: "text.white",
                        flex: 1,
                        minWidth: 0,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        gap: { xs: 1, sm: 2 },
                        textAlign: { xs: "center", sm: "left" },
                        alignItems: { xs: "center", sm: "stretch" }
                    }}>
                        {/* Title */}
                        <Typography variant="heroTitle" sx={{ overflowWrap: "anywhere" }}>
                            {serial.name}
                        </Typography>

                        {/* Genres */}
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", width: "100%", justifyContent: { xs: "center", sm: "flex-start" } }}>
                            {serial.genres?.map((genre) => (
                                <Chip
                                    key={genre.id}
                                    label={genre.name}
                                    size="small"
                                    component={Link}
                                    to={`/genre/${genre.id}`}
                                    sx={{
                                        cursor: 'pointer',
                                        backgroundColor: "overlay.chip",
                                        color: "text.white",
                                        transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                        '@media (hover: hover) and (pointer: fine)': {
                                            '&.MuiChip-root:hover': {
                                                backgroundColor: 'yellow.main',
                                                color: 'text.dark',
                                                borderColor: 'text.dark',
                                            }
                                        }
                                    }}
                                />
                            ))}
                        </Box>

                        <Box sx={{ width: "100%" }}>
                            <Typography
                                ref={overviewRef}
                                variant="body1"
                                onClick={overviewOverflows ? () => setOverviewExpanded((v) => !v) : undefined}
                                sx={{
                                    opacity: 0.9,
                                    textAlign: "left",
                                    ...(overviewOverflows && { cursor: "pointer" }),
                                    ...(isSmall && !overviewExpanded && {
                                        display: "-webkit-box",
                                        WebkitLineClamp: 4,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden"
                                    })
                                }}
                            >
                                {serial.overview}
                            </Typography>

                            {overviewOverflows && (
                                <Typography
                                    component="button"
                                    variant="body2"
                                    onClick={() => setOverviewExpanded((v) => !v)}
                                    sx={{
                                        mt: 1,
                                        p: 0,
                                        border: "none",
                                        background: "none",
                                        font: "inherit",
                                        fontWeight: 700,
                                        color: "yellow.main",
                                        cursor: "pointer",
                                        display: "block"
                                    }}
                                >
                                    {overviewExpanded ? "Show less" : "Show more"}
                                </Typography>
                            )}
                        </Box>

                        {/* Rating and Release Date */}
                        <Box sx={{ display: "flex", gap: { xs: 2, sm: 3 }, alignItems: "center", flexWrap: "wrap", width: "100%", justifyContent: { xs: "center", sm: "flex-start" } }}>
                            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                                ⭐ {serial.vote_average?.toFixed(1)}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                {formatDateOnly(serial.first_air_date)} • {serial.number_of_seasons} Seasons • {serial.number_of_episodes} Episodes
                            </Typography>
                        </Box>

                        {/* Block with saved folders */}
                        {isAuth && !isLoadingItemFolders && itemFolders.length > 0 && (
                            <Box sx={{ width: "100%" }}>
                                <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexWrap: "wrap", alignItems: "center", justifyContent: { xs: "center", sm: "flex-start" } }}>
                                    <Typography variant="body1">
                                        Saved in:
                                    </Typography>
                                    {itemFolders.map((folder) => (
                                        <Chip
                                            key={folder.name}
                                            label={folder.name}
                                            variant="outlined"
                                            component={Link}
                                            to={savedFolderPath(folder.name)}
                                            sx={{
                                                cursor: 'pointer',
                                                backgroundColor: "overlay.chipSubtle",
                                                color: "text.white",
                                                borderColor: "overlay.chip",
                                                transition: (theme) => theme.transitions.create(['background-color', 'color', 'border-color']),
                                                '@media (hover: hover) and (pointer: fine)': {
                                                    '&.MuiChip-root:hover': {
                                                        backgroundColor: 'yellow.main',
                                                        color: 'text.dark',
                                                        borderColor: 'text.dark',
                                                    }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            {isSaved && (
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: { xs: 2, sm: 3 } }}>
                    <EditableValue
                        type="text"
                        value={serial.comment}
                        onSave={handleSaveReview}
                        sx={{ order: { xs: 2, sm: 1 }, flex: 1, minWidth: 0, borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}
                    />

                    <Box bgcolor="bg.second" sx={{ order: { xs: 1, sm: 2 }, flex: "0 0 auto", borderRadius: 2, p: { xs: 2, sm: 3 }, display: "flex", flexDirection: "column", gap: 1 }}>
                        <EditableValue
                            type="ratingDate"
                            value={{ rating: serial.rating, dateAdded: serial.dateAdded }}
                            onSave={handleSaveRatingDate}
                        />
                    </Box>
                </Box>
            )}

            {/* Ratings Heatmap Section */}
            <Box>
                <Typography variant="sectionTitle" color="text.main" sx={{ mb: 2, textAlign: "center" }}>Episode Ratings</Typography>

                {/* Legend sits outside the scroll container: inside it, it would scroll away with the episodes instead of staying centered under the title. */}
                <Legend />

                <Box sx={{ overflowX: "auto", pb: 2, px: 1, ...scrollbarSx }}>
                    {heatmapGrid}
                </Box>
            </Box>

            {/* Top Cast Section */}
            {serial.credits?.cast && serial.credits.cast.length > 0 && (
                <Box>
                    <Typography variant="sectionTitle" sx={{ mb: 2, color: "text.main" }}>
                        Top Cast
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {serial.credits.cast.map((actor) => (
                            <ActorCart
                                key={actor.id}
                                person={actor}
                                role={actor.character}
                            />
                        ))}
                    </Box>
                </Box>
            )}

            {/* Top Crew Section */}
            {serial.credits.crew && serial.credits.crew.length > 0 && (
                <Box>
                    <Typography variant="sectionTitle" sx={{ mb: 2, color: "text.main" }}>
                        Top Crew
                    </Typography>
                    <Box sx={scrollStripSx}>
                        {serial.credits.crew
                            .map((member) => (
                                <ActorCart
                                    key={member.id}
                                    person={member}
                                    role={member.job}
                                />
                            ))}
                    </Box>
                </Box>
            )}

            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                isOpenDialogEdit={isOpenDialogEdit}
                isDeleteItem={isDeleteItem}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={dialogItem || serial}
                onSaved={handleItemSaved}
                // After deleting the copy the page is open on, go back.
                onAfterDelete={() => { if (isSaved && !dialogItem) navigate(-1) }}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            <SeasonEpisodeDialog
                open={ratingDialogOpen}
                mode={ratingMode}
                title={ratingMode === "episode"
                    ? `S${ratingTarget.season} · E${ratingTarget.episode}`
                    : `Season ${ratingTarget.season}`}
                initial={ratingInitial}
                isNew={ratingIsNew}
                onClose={() => setRatingDialogOpen(false)}
                onSave={handleSaveRating}
                onDelete={() => {
                    if (ratingMode === "episode") handleDeleteEpisode(ratingTarget.season, ratingTarget.episode)
                    else handleDeleteSeason(ratingTarget.season)
                    setRatingDialogOpen(false)
                }}
            />

            <MarkWatchedDialog
                open={Boolean(markDialog)}
                title={markDialog ? `Season ${markDialog.season}` : ''}
                description={markDialog
                    ? `Mark ${markDialog.remaining} remaining ${markDialog.remaining === 1 ? 'episode' : 'episodes'} as watched. Choose the date they were watched.`
                    : ''}
                onClose={() => setMarkDialog(null)}
                onConfirm={handleConfirmMarkSeason}
            />

            <Menu
                anchorEl={episodeMenuAnchor}
                open={Boolean(episodeMenuAnchor)}
                onClose={closeEpisodeMenu}
                disableScrollLock
                slotProps={{
                    paper: {
                        sx: {
                            width: 140,
                            borderRadius: 2,
                            boxShadow: 4,
                            bgcolor: 'bg.second',
                            color: 'text.main',
                            '& .MuiList-root': { p: 0 },
                        },
                    },
                }}
            >
                {[
                    { key: 'edit', label: 'Edit', onClick: () => openEpisodeDialog(episodeMenuTarget.season, episodeMenuTarget.episode) },
                    (() => {
                        const isSkipped = Boolean(findMongoEpisode(episodeMenuTarget.season, episodeMenuTarget.episode)?.skipped)
                        return {
                            key: 'skip',
                            label: isSkipped ? 'Unskip' : 'Skip',
                            onClick: () => handleSkipEpisode(episodeMenuTarget.season, episodeMenuTarget.episode, !isSkipped),
                        }
                    })(),
                    { key: 'delete', label: 'Delete', onClick: () => handleDeleteEpisode(episodeMenuTarget.season, episodeMenuTarget.episode) },
                ].map((item) => (
                    <MenuItem
                        key={item.key}
                        onClick={() => { item.onClick(); closeEpisodeMenu(); }}
                        sx={{
                            py: 1,
                            px: 2,
                            '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'yellow.main', color: 'text.dark' } },
                        }}
                    >
                        {item.label}
                    </MenuItem>
                ))}
            </Menu>
        </Box>
    )
}

export default TVPage;
