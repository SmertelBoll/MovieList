import { Box, Button, CircularProgress, debounce, Grid2, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import Search from '../../components/Sorting/Search'
import MovieCart from '../../components/Movie/MovieCart';
import instance from '../../axios';
import { alertError } from '../../alerts';
import MainButton from '../../components/Buttons/MainButton';
import MovieSaveDialog from '../../components/Movie/MovieSaveDialog';
import Sort from '../../components/Sorting/Sort';

const API_KEY = process.env.REACT_APP_MOVIE_API_KEY

const categories = [
    {
        name: 'Popularity',
        key: 'popularity',
        order: 'desc'
    },
    {
        name: 'Rating',
        key: 'vote_average',
        order: 'desc'
    },
    {
        name: 'Release Date',
        key: 'release_date',
        order: 'desc'
    },
    {
        name: 'Vote Count',
        key: 'vote_count',
        order: 'desc'
    },
    {
        name: 'Title',
        key: 'original_title',
        order: 'asc'
    }
]

const MovieGrid = React.memo(({ searchMovieItems, handleOpenDialogFolder }) => (
    <Grid2
        container
        spacing={2}
        justifyContent="center"
    >
        {searchMovieItems.map((obj, i) => (
            <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} >
                <MovieCart
                    key={`${obj?.title}_${i}`}
                    movie={obj}
                    handleOpenDialogFolder={handleOpenDialogFolder}
                />
            </Grid2>
        ))}
    </Grid2>
));


function GeneralMovieList({
    folders,
    setFolders,
    setIsGetFolders
}) {
    const [isLoadedSearchMovies, setIsLoadedSearchMovies] = useState(true);
    const [inputText, setInputText] = useState(""); // відповідає за відображення тексту в input
    const [searchValue, setSearchValue] = useState(""); // загружається кінцеве значення після debounce для запроса
    const [searchMovieItems, setSearchMovieItems] = useState([])  // об'єкти фільму
    const [page, setPage] = useState(1) // сторінка для запросу фільмів

    const [openMovieSaveDialog, setOpenMovieSaveDialog] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(false);
    const [selectedMovieId, setSelectedMovieId] = useState(false);

    // робота з сортуванням
    const [sortBy, setSortBy] = useState(categories[0].key);
    const [currentOrder, setCurrentOrder] = useState(categories[0].order);

    // Кількість фільмів повинна бути кратна 12
    const getMaxObjectsDivisibleBy12 = useCallback(
        (array) => {
            const remainder = array.length % 12;
            return remainder === 0 ? array : array.slice(0, array.length - remainder);
        },
        []
    );

    // Функція для сортування фільмів на клієнті
    const sortMovies = useCallback((movies, sortBy, order) => {
        return [...movies].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];

            // Обробка спеціальних випадків
            if (sortBy === 'release_date') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            } else if (sortBy === 'vote_average' || sortBy === 'vote_count' || sortBy === 'popularity') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            } else if (sortBy === 'original_title') {
                aValue = (aValue || '').toLowerCase();
                bValue = (bValue || '').toLowerCase();
            }

            if (order === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    }, []);

    // search
    useEffect(() => {
        setIsLoadedSearchMovies(false);
        setPage(1)

        // Якщо пошуковий запит порожній, використовуємо популярні фільми
        const endpoint = searchValue.trim() === ""
            ? `https://api.themoviedb.org/3/discover/movie`
            : `https://api.themoviedb.org/3/search/movie`;

        const params = {
            api_key: API_KEY,
            language: "en-US",
            page: 1,
            sort_by: `${sortBy}.${currentOrder}`,
        };

        // Додаємо query тільки для пошукового запиту
        if (searchValue.trim() !== "") {
            params.query = searchValue;
        }

        instance
            .get(endpoint, { params })
            .then((res) => {
                setSearchMovieItems(res.data.results)
                setIsLoadedSearchMovies(true);

            })
            .catch((err) => {
                setSearchMovieItems([]);
                setIsLoadedSearchMovies(true);
                console.warn(err);
                alertError(err.response.data.title, err.response.data.message);
            });
    }, [searchValue, sortBy, currentOrder]);

    // newPage
    useEffect(() => {
        setIsLoadedSearchMovies(false);

        if (page !== 1) {
            // Якщо пошуковий запит порожній, використовуємо популярні фільми
            const endpoint = searchValue.trim() === ""
                ? `https://api.themoviedb.org/3/discover/movie`
                : `https://api.themoviedb.org/3/search/movie`;

            const params = {
                api_key: API_KEY,
                language: "en-US",
                page: page,
            };

            // Додаємо sort_by тільки для discover endpoint
            if (searchValue.trim() === "") {
                params.sort_by = `${sortBy}.${currentOrder}`;
            }

            // Додаємо query тільки для пошукового запиту
            if (searchValue.trim() !== "") {
                params.query = searchValue;
            }

            instance
                .get(endpoint, { params })
                .then((res) => {
                    let results = res.data.results;

                    // Сортуємо результати на клієнті для пошукових запитах
                    if (searchValue.trim() !== "") {
                        results = sortMovies(results, sortBy, currentOrder);
                    }

                    setSearchMovieItems(prev => [...prev, ...results])
                    setIsLoadedSearchMovies(true);

                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err.response.data.title, err.response.data.message);
                });
        }
    }, [page, sortBy, currentOrder, searchValue]);

    // робота з пошуком
    const updateSearchValue = useCallback(
        debounce((str) => {
            setSearchValue(str);
        }, 500),
        []
    );
    const onChangeInput = (e, empty = false) => {
        if (empty) {
            // затираємо значення
            setInputText("");
            updateSearchValue("");
        } else {
            setInputText(e.target.value);
            updateSearchValue(e.target.value);
        }
    };

    // Відкривання діалогу з MovieSaveDialog
    const handleOpenDialogFolder = (movieId) => {
        setSelectedMovieId(movieId);
        setOpenMovieSaveDialog(true);
    };
    const handleCloseMovieSaveDialog = () => {
        setOpenMovieSaveDialog(false);
        setSelectedFolder(false);
    };

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="p" color="text.main" >Movies</Typography>
            <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                <Box sx={{ flex: "75%" }}>
                    <Search inputText={inputText} onChangeInput={onChangeInput} />
                </Box>
                <Box sx={{
                    flex: "25%",
                    opacity: searchValue.trim() !== "" ? 0.5 : 1,
                    pointerEvents: searchValue.trim() !== "" ? "none" : "auto"
                }}>
                    <Sort
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        currentOrder={currentOrder}
                        setCurrentOrder={setCurrentOrder}
                        categories={categories}
                    />
                </Box>
            </Box>

            {searchMovieItems.length > 0 && <MovieGrid
                searchMovieItems={getMaxObjectsDivisibleBy12(searchMovieItems)}
                handleOpenDialogFolder={handleOpenDialogFolder}
            />}

            <MovieSaveDialog
                open={openMovieSaveDialog}
                onClose={handleCloseMovieSaveDialog}
                folders={folders}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
                selectedMovieId={selectedMovieId}
            />

            <Box sx={{ mb: 2 }}>
                {
                    !isLoadedSearchMovies
                        ? <Box width="100%" textAlign="center">
                            <CircularProgress color="test.main" />
                        </Box>
                        : isLoadedSearchMovies && searchMovieItems.length > 0
                            ? <Box display="flex" justifyContent="center" >
                                <MainButton onClick={() => setPage(prev => prev + 1)}>Give more</MainButton>
                            </Box>
                            : <></>
                }
            </Box>



        </Box >
    )
}

export default GeneralMovieList