import { Box, Card, CardContent, CardMedia, IconButton, Rating, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import DropdownMenu from '../_customMUI/DropdownMenu';

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
    const navigate = useNavigate();

    const isAuth = useSelector(selectIsAuth);

    const handleCardClick = (e) => {
        e.stopPropagation();
        if (item.media_type === "movie") {
            if (dbType === "mongo") {
                navigate(`/user/movie/${item._id}`);
            } else {
                navigate(`/movie/${item.id}`);
            }
        } else if (item.media_type === "tv") {
            if (dbType === "mongo") {
                navigate(`/user/tv/${item._id}`);
            } else {
                navigate(`/tv/${item.id}`);
            }
        }
    };

    const handleAddClick = (e) => {
        e.stopPropagation();
        onAddItem(item);
    };

    const handleEditClick = (e) => {
        e.stopPropagation();
        onEditItem(item)
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        onDeleteItem(item)
    };

    const menuItems = [
        { key: 'Add', label: 'Add', onClick: handleAddClick },
        { key: 'Edit', label: 'Edit', onClick: handleEditClick },
        { key: 'Delete', label: 'Delete', onClick: handleDeleteClick },
    ];

    return (
        <Card
            sx={{
                borderRadius: 2,
                minHeight: "100%",
                position: "relative",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: 4
                }
            }}
            onClick={handleCardClick}
        >

            {/* Кнопка додавання в папку */}
            {isAuth &&
                <>
                    {isFolderPage
                        ? (
                            <DropdownMenu
                                width={140}
                                stopPropagation
                                items={menuItems}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                renderTrigger={({ onClick }) => (
                                    <IconButton
                                        aria-label="choose"
                                        onClick={onClick}
                                        sx={{
                                            position: "absolute",
                                            right: 5,
                                            top: 5,
                                            backgroundColor: "text.main",
                                            opacity: 0.8,
                                            zIndex: 1,
                                            borderRadius: 2,
                                            '&:hover': {
                                                opacity: 1,
                                                backgroundColor: "yellow.main",
                                                '& svg': {
                                                    color: "text.dark",
                                                },
                                            }
                                        }}>
                                        <MoreVertIcon sx={{
                                            opacity: 1,
                                            color: "bg.second"
                                        }} />
                                    </IconButton>
                                )}
                            />
                        )
                        : (
                            <>
                                <IconButton
                                    aria-label="add"
                                    onClick={handleAddClick}
                                    sx={{
                                        position: "absolute",
                                        right: 5,
                                        top: 5,
                                        backgroundColor: "text.main",
                                        opacity: 0.8,
                                        zIndex: 1,
                                        borderRadius: 2,
                                        '&:hover': {
                                            opacity: 1,
                                            backgroundColor: "yellow.main",
                                            '& svg': {
                                                color: "text.dark",
                                            },
                                        }
                                    }}>
                                    <AddIcon sx={{
                                        opacity: 1,
                                        color: "bg.second"
                                    }} />
                                </IconButton>
                            </>
                        )
                    }
                </>
            }

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

            <CardContent>
                {isTitle && <Typography variant="h6" component="div" gutterBottom>
                    {mediaType === "movie" ? item.title : mediaType === "tv" ? item.name : "No title"}
                </Typography>}

                {isJob && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`Job: ${item.job}`}
                </Typography>}

                {isDescription && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${item?.overview.substring(0, 100)}${item?.overview?.length > 100 ? "..." : ""}` || "No description"}
                </Typography>}

                {isComment && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${item?.comment.substring(0, 100)}${item?.comment?.length > 100 ? "..." : ""}` || "No comment"}
                </Typography>}

                {isDate && <Typography variant="body2" color="text.secondary">
                    {
                        {
                            tmdb: `Release: ${mediaType === "movie" ? item.release_date : mediaType === "tv" ? item.first_air_date : "No date"}`,
                            mongo: `Added: ${item.dateAdded?.split('T')[0] || item.dateAdded}`
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
                        precision={0.1}
                        readOnly
                        size="small"
                    />
                    <Box sx={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {
                                {
                                    tmdb: Math.round(item.vote_average * 10) / 10, // TMDb дає рейтинг від 0 до 10, MUI Rating - від 0 до 5
                                    mongo: item.rating
                                }[dbType] ?? "-"
                            }/{
                                {
                                    tmdb: 10,
                                    mongo: 100
                                }[dbType] ?? "-"
                            }
                        </Typography>
                        {isVoteCount && <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {item.vote_count} votes
                        </Typography>}
                    </Box>
                </Box>}
            </CardContent>
        </Card >
    )
}

export default ItemCart