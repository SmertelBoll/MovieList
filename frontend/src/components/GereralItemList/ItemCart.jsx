import { Box, Card, CardContent, CardMedia, Rating, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import StretchedLink from '../StretchedLink'
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import ItemFolderButton from '../ItemFolderButton';
import { formatRatingLabel } from '../../utils/ratingSystem';
import { formatDateOnly } from '../../utils/dates';

const IMAGE_DEFAULT = process.env.REACT_APP_DEFAULT_IMG
const IMAGE_BASE_URL_W342 = `${process.env.REACT_APP_TMDB_IMG}/w342`; // базовий URL для отримання зображень

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

    // Текст оцінки: для mongo — назва рівня (якщо збігається) або "rating/100"; для tmdb — "x/10"
    const mongoRatingText = item.rating == null ? '-' : formatRatingLabel(item.rating, ratingSystem);
    const tmdbRatingText = `${Math.round((item.vote_average || 0) * 10) / 10}/10`;

    // Куди веде картка: збережена копія — /user/..., каталог TMDB — /movie|tv/...
    const href = item.media_type === "movie" || item.media_type === "tv"
        ? (dbType === "mongo" ? `/user/${item.media_type}/${item._id}` : `/${item.media_type}/${item.id}`)
        : null;

    // tmdbId: у mongo-картки (сторінка папки) tmdb-дані змішані з документом, id = tmdbId
    const tmdbId = item.tmdbId ?? item.id;

    return (
        <Card
            sx={{
                borderRadius: 2,
                minHeight: "100%",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                    transform: (theme) => theme.hoverLift,
                    boxShadow: 4
                }
            }}
        >
            {/* Справжнє посилання на всю картку: працюють колесо миші та Ctrl/Cmd+клік */}
            {href && <StretchedLink to={href} label={mediaType === "movie" ? item.title : item.name} />}

            {/* Кнопка додавання в папку / редагування збереженого. На сторінці папки картка — конкретна копія */}
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
                    image={
                        item.poster_path
                            ? IMAGE_BASE_URL_W342 + item.poster_path
                            : IMAGE_DEFAULT
                    }
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

                {/* На вузьких екранах картка вдвічі вужча — опис туди не влазить */}
                {isDescription && <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1, display: { xs: "none", sm: "block" } }}
                >
                    {`${item?.overview.substring(0, 100)}${item?.overview?.length > 100 ? "..." : ""}` || "No description"}
                </Typography>}

                {isComment && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${item?.comment.substring(0, 100)}${item?.comment?.length > 100 ? "..." : ""}` || "No comment"}
                </Typography>}

                {isDate && <Typography variant="body2" color="text.secondary">
                    {/* На вузькій картці лишаємо саму дату — підпис з'їдає місце */}
                    <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                        {{ tmdb: "Release: ", mongo: "Added: " }[dbType]}
                    </Box>
                    {
                        {
                            tmdb: (mediaType === "movie" ? formatDateOnly(item.release_date) : mediaType === "tv" ? formatDateOnly(item.first_air_date) : "") || "—",
                            // Дата не обов'язкова — без неї показуємо прочерк
                            mongo: formatDateOnly(item.dateAdded) || "—"
                        }[dbType] || "Error dbType"
                    }
                </Typography>}

                {isRating && <Box display="flex" alignItems="center" mt={1}>
                    <Rating
                        name="item-rating"
                        value={
                            {
                                tmdb: item.vote_average / 2, // TMDb дає рейтинг від 0 до 10, MUI Rating - від 0 до 5
                                mongo: item.rating / 20
                            }[dbType] || 0
                        }
                        // precision 0.1 змушує MUI малювати по 10 сегментів на зірку —
                        // 50 SVG на картку, ~94% її DOM. У списках це сотні карток,
                        // через що перемикання теми перемальовувало десятки тисяч вузлів.
                        // Точне значення однаково показане цифрою поруч.
                        precision={0.5}
                        readOnly
                        size="small"
                        // Зірочки на вузькій картці не влазять — лишається саме значення оцінки
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