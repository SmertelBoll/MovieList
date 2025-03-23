import { Box, Card, CardContent, CardMedia, Grid2, IconButton, Rating, Typography } from '@mui/material'
import React from 'react'
import MainButton from '../Buttons/MainButton';
import AddIcon from '@mui/icons-material/Add';

// const defaultPhoto = "https://res.cloudinary.com/dw0qzruxp/image/upload/fl_preserve_transparency/v1733693499/depositphotos_247872612-stock-illustration-no-image-available-icon-vector_wckhll.jpg?_s=public-apps"

const defaultPhoto = "https://res-console.cloudinary.com/dw0qzruxp/thumbnails/v1/image/upload/v1740604718/cGxhY2Vob2xkZXJfYXl5YWg0/drilldown"
function MovieCart({ movie, handleOpenDialogFolder }) {
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

    return (
        <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} >
            <Card sx={{ borderRadius: 2, minHeight: "100%", position: "relative" }}>

                <IconButton
                    aria-label="added"
                    onClick={() => handleOpenDialogFolder(movie.id)} // Виклик функції при натисканні
                    sx={{
                        position: "absolute",
                        right: 5,
                        top: 5,
                        backgroundColor: "text.main",
                        opacity: 0.8,
                        '&:hover': {
                            opacity: 1,
                            backgroundColor: "yellow.main", // Колір при наведенні
                            '& svg': {
                                color: "text.main", // Колір іконки при наведенні на IconButton
                            },
                        }
                    }}>
                    <AddIcon sx={{
                        opacity: 1,
                        color: "bg.second"
                    }} />
                </IconButton>

                <CardMedia
                    component="img"
                    alt={movie.title}
                    image={movie.poster_path ? imageBaseUrl + movie.poster_path : defaultPhoto}
                />
                <CardContent>
                    <Typography variant="h6" component="div" gutterBottom>
                        {movie.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        {`${movie.overview.substring(0, 100)}...`}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                        Release: {movie.release_date}
                    </Typography>

                    <Box display="flex" alignItems="center" mt={1}>
                        <Rating
                            name="movie-rating"
                            value={movie.vote_average / 2} // TMDb дає рейтинг від 0 до 10, MUI Rating - від 0 до 5
                            precision={0.1}
                            readOnly
                            size="small"
                        />
                        <Box sx={{ width: "100%", display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {Math.round(movie.vote_average * 10) / 10}/10
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                                {movie.vote_count} votes
                            </Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Grid2>
    )
}

export default MovieCart