import { Box, Card, CardContent, CardMedia, Rating, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import StretchedLink from '../StretchedLink'
import { getItemHref } from '../../utils/itemLinks'
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import ItemFolderButton from '../ItemFolderButton';
import { formatRatingLabel } from '../../utils/ratingSystem';
import { formatDateOnly } from '../../utils/dates';
import { tmdbImageOrDefault } from '../../utils/tmdbImage'
import { liftHoverSx } from '../../theme/hoverSx'


function ItemCart({
    item,
    dbType,
    mediaType,
    onAddItem = () => { },
    onEditItem = () => { },
    onDeleteItem = () => { },
    isImage = false,
    isTitle = false,
    isJob = false,
    isDescription = false,
    isComment = false,
    isDate = false,
    isRating = false,
    isVoteCount = false,
    isFolderPage = false
}) {
    const isAuth = useSelector(selectIsAuth);
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || []);

    // mongo: level name (if matched) or rating/100; tmdb: x/10
    const mongoRatingText = item.rating == null ? '-' : formatRatingLabel(item.rating, ratingSystem);
    const tmdbRatingText = `${Math.round((item.vote_average || 0) * 10) / 10}/10`;

    const href = getItemHref(item, dbType);

    // tmdbId: on folder-page cards tmdb data is mixed into the document, so id = tmdbId.
    const tmdbId = item.tmdbId ?? item.id;

    return (
        <Card
            sx={{
                borderRadius: 2,
                minHeight: "100%",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                ...liftHoverSx(4),
            }}
        >
            {href && <StretchedLink to={href} label={mediaType === "movie" ? item.title : item.name} />}

            {isAuth && (
                <ItemFolderButton
                    mediaType={mediaType}
                    tmdbId={tmdbId}
                    itemTitle={mediaType === "movie" ? item.title : item.name}
                    isCopy={isFolderPage}
                    stopPropagation
                    onAdd={() => onAddItem(item)}
                    onEdit={(copy) => onEditItem(item, copy)}
                    onDelete={(copy) => onDeleteItem(item, copy)}
                />
            )}


            {
                isImage && <CardMedia
                    component="img"
                    alt={item.title}
                    image={tmdbImageOrDefault(item.poster_path, 'w342')}
                />
            }

            <CardContent sx={{
                p: { xs: 1, sm: 2 },
                "&:last-child": { pb: { xs: 1, sm: 2 } }
            }}>
                {isTitle && <Typography
                    variant="cardTitle"
                    component="div"
                    gutterBottom
                    sx={{ overflowWrap: "anywhere" }}
                >
                    {mediaType === "movie" ? item.title : mediaType === "tv" ? item.name : "No title"}
                </Typography>}

                {isJob && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`Job: ${item.job}`}
                </Typography>}

                {isDescription && <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, display: { xs: "none", sm: "block" } }}
                >
                    {`${(item?.overview ?? "").substring(0, 100)}${item?.overview?.length > 100 ? "..." : ""}` || "No description"}
                </Typography>}

                {isComment && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {/* comment may be missing: the schema has no default (e.g. imported records). */}
                    {`${(item?.comment ?? "").substring(0, 100)}${item?.comment?.length > 100 ? "..." : ""}` || "No comment"}
                </Typography>}

                {isDate && <Typography variant="body2" color="text.secondary">
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        {{ tmdb: "Release: ", mongo: "Added: " }[dbType]}
                    </Box>
                    {
                        {
                            tmdb: (mediaType === "movie" ? formatDateOnly(item.release_date) : mediaType === "tv" ? formatDateOnly(item.first_air_date) : "") || "—",
                            mongo: formatDateOnly(item.dateAdded) || "—"
                        }[dbType] || "Error dbType"
                    }
                </Typography>}

                {isRating && <Box display="flex" alignItems="center" mt={1}>
                    <Rating
                        name="item-rating"
                        value={
                            {
                                tmdb: item.vote_average / 2, // TMDb rating is 0-10, MUI Rating is 0-5
                                mongo: item.rating / 20
                            }[dbType] || 0
                        }
                        // precision 0.1 made MUI draw 50 SVGs per card (~94% of its DOM): a theme switch repainted tens
                        // of thousands of nodes. The number shows the exact value.
                        precision={0.5}
                        readOnly
                        size="small"
                        sx={{ display: { xs: "none", sm: "inline-flex" } }}
                    />
                    <Box sx={{
                        width: "100%",
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: { xs: 'flex-start', sm: 'flex-end' }
                    }}>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: { xs: 0, sm: 1 } }}>
                            {dbType === "mongo" ? mongoRatingText : tmdbRatingText}
                        </Typography>
                        {isVoteCount && <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ ml: { xs: 0, sm: 1 }, display: { xs: "none", sm: "block" } }}
                        >
                            {item.vote_count} votes
                        </Typography>}
                    </Box>
                </Box>}
            </CardContent>
        </Card >
    )
}

export default ItemCart