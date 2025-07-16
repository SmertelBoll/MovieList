import { Box, Button, CircularProgress, debounce, Grid2, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import Search from '../../components/Sorting/Search'
import MovieCart from '../../components/Movie/MovieCart';
import instance from '../../axios';
import { alertError } from '../../alerts';
import MainButton from '../../components/Buttons/MainButton';
import MovieSaveDialog from '../../components/Movie/MovieSaveDialog';

const API_KEY = "87a25607799e5d9eea1f25a49eb8063e"


const MovieGrid = React.memo(({ searchMovieItems, handleOpenDialogFolder }) => (
    <Grid2
        container
        spacing={2}
        justifyContent="center"
    >
        {searchMovieItems.map((obj, i) => (
            <MovieCart
                key={`${obj?.title}_${i}`}
                movie={obj}
                handleOpenDialogFolder={handleOpenDialogFolder}
            />
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

    // Кількість фільмів повинна бути кратна 12
    const getMaxObjectsDivisibleBy12 = useCallback(
        (array) => {
            const remainder = array.length % 12;
            return remainder === 0 ? array : array.slice(0, array.length - remainder);
        },
        []
    );

    // search
    useEffect(() => {
        setIsLoadedSearchMovies(false);
        setPage(1)

        instance
            .get(`https://api.themoviedb.org/3/search/movie`, {
                params: {
                    api_key: API_KEY,
                    query: searchValue,
                    language: "en-US",
                    page: 1,
                },
            })
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
    }, [searchValue]);

    // newPage
    useEffect(() => {
        setIsLoadedSearchMovies(false);

        if (page !== 1) {
            instance
                .get(`https://api.themoviedb.org/3/search/movie`, {
                    params: {
                        api_key: API_KEY,
                        query: searchValue,
                        language: "en-US",
                        page: page,
                    },
                })
                .then((res) => {
                    setSearchMovieItems(prev => [...prev, ...res.data.results])
                    setIsLoadedSearchMovies(true);

                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err.response.data.title, err.response.data.message);
                });
        }
    }, [page]);

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
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="p" color="text.main" >Movies</Typography>
                <Search inputText={inputText} onChangeInput={onChangeInput} />
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