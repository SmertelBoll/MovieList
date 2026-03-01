import { Box, Card, CardContent, CardMedia, IconButton, Rating, Typography } from '@mui/material'
import React from 'react'
import { useNavigate } from 'react-router-dom'
import AddIcon from '@mui/icons-material/Add';

// const defaultPhoto = "https://res.cloudinary.com/dw0qzruxp/image/upload/fl_preserve_transparency/v1733693499/depositphotos_247872612-stock-illustration-no-image-available-icon-vector_wckhll.jpg?_s=public-apps"

const defaultPhoto = "https://res.cloudinary.com/dw0qzruxp/image/upload/v1740604718/placeholder_ayyah4.png"

function MovieCart({
    movie,
    dbType,
    handleOpenDialogFolder = false,
    isImage = false,
    isTitle = false,
    isJob = false,
    isDescription = false,
    isComment = false,
    isDate = false,
    isRating = false
}) {
    const navigate = useNavigate();
    const imageBaseUrl = "https://image.tmdb.org/t/p/w342"; // базовий URL для отримання зображень
    // const movie = {
    //     "adult": false,
    //     "backdrop_path": "/tElnmtQ6yz1PjN1kePNl8yMSb59.jpg",
    //     "genre_ids": [16, 12, 10751, 35],
    //     "id": 1241982,
    //     "original_language": "en",
    //     "original_title": "Moana 2",
    //     "overview": "After receiving an unexpected call from her wayfinding ancestors, Moana journeys alongside Maui and a new crew to the far seas of Oceania and into dangerous, long-lost waters for an adventure unlike anything she's ever faced.",
    //     "popularity": 7121.204,
    //     "poster_path": "/4YZpsylmjHbqeWzjKpUEF8gcLNW.jpg",
    //     "release_date": "2024-11-27",
    //     "title": "Moana 2",
    //     "video": false,
    //     "vote_average": 7.1,
    //     "vote_count": 175
    // }

    const handleCardClick = (e) => {
        // Зупиняємо сповіщення події, щоб не спрацьовувало при кліку на кнопку Add
        e.stopPropagation();
        navigate(`/movie/${movie.id}`);
    };

    const handleAddClick = (e) => {
        e.stopPropagation();
        handleOpenDialogFolder(movie);
    };

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

            {handleOpenDialogFolder && <IconButton
                aria-label="added"
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
                        backgroundColor: "yellow.main", // Колір при наведенні
                        '& svg': {
                            color: "text.dark", // Колір іконки при наведенні на IconButton
                        },
                    }
                }}>
                <AddIcon sx={{
                    opacity: 1,
                    color: "bg.second"
                }} />
            </IconButton>}

            {isImage && <CardMedia
                component="img"
                alt={movie.title}
                image={
                    movie.poster_path
                        ? imageBaseUrl + movie.poster_path
                        : defaultPhoto
                }
            />}

            <CardContent>
                {isTitle && <Typography variant="h6" component="div" gutterBottom>
                    {movie.title}
                </Typography>}

                {isJob && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`Job: ${movie.job}`}
                </Typography>}

                {isDescription && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${movie?.overview.substring(0, 100)}${movie?.overview?.length > 100 ? "..." : ""}` || "No description"}
                </Typography>}

                {isComment && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {`${movie?.comment.substring(0, 100)}${movie?.comment?.length > 100 ? "..." : ""}` || "No comment"}
                </Typography>}

                {isDate && <Typography variant="body2" color="text.secondary">
                    {
                        {
                            tmdb: `Release: ${movie.release_date}`,
                            mongo: `Added: ${movie.dateAdded}`
                        }[dbType] || "Error dbType"
                    }
                </Typography>}

                {isRating && <Box display="flex" alignItems="center" mt={1}>
                    <Rating
                        name="movie-rating"
                        value={
                            {
                                tmdb: movie.vote_average / 2, // TMDb дає рейтинг від 0 до 10, MUI Rating - від 0 до 5
                                mongo: movie.rating / 20
                            }[dbType] || "Error dbType"
                        }
                        precision={0.1}
                        readOnly
                        size="small"
                    />
                    <Box sx={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {
                                {
                                    tmdb: Math.round(movie.vote_average * 10) / 10, // TMDb дає рейтинг від 0 до 10, MUI Rating - від 0 до 5
                                    mongo: movie.rating
                                }[dbType] ?? "Error dbType"
                            }/{
                                {
                                    tmdb: 10,
                                    mongo: 100
                                }[dbType] ?? "Error dbType"
                            }
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {movie.vote_count} votes
                        </Typography>
                    </Box>
                </Box>}
            </CardContent>
        </Card>
    )
}

export default MovieCart