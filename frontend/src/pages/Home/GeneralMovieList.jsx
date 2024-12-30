import { Box, Button, CircularProgress, debounce, Grid2, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import Search from '../../components/Sorting/Search'
import Movie from '../../components/Movie/Movie';
import instance from '../../axios';
import { alertError } from '../../alerts';
import MainButton from '../../components/Buttons/MainButton';
import FoldersDialog from '../../components/Movie/FoldersDialog';
import DescriptionDialog from '../../components/Movie/DescriptionDialog';

const API_KEY = "87a25607799e5d9eea1f25a49eb8063e"


const MovieGrid = React.memo(({ searchMovieItems }) => (
    <Grid2
        container
        spacing={2}
        justifyContent="center"
    >
        {searchMovieItems.map((obj, i) => (
            <Movie movie={obj} key={`${obj?.title}_${i}`} />
        ))}
    </Grid2>
));


function GeneralMovieList({
    folders,
    curFolderName,
    curFolderToRename,
    handleUpdateFolderName,
    handleInputChange,
    handleAddFolder,
    setCurFolderToRename,
    setCurFolderName
}) {
    const [isLoadedSearchMovies, setIsLoadedSearchMovies] = useState(true);
    const [inputText, setInputText] = useState(""); // відповідає за відображення тексту в input
    const [searchValue, setSearchValue] = useState(""); // загружається кінцеве значення після debounce для запроса
    const [searchMovieItems, setSearchMovieItems] = useState([])  // об'єкти фільму
    const [page, setPage] = useState(1) // сторінка для запросу фільмів

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

    const [openDialogFolder, setOpenDialogFolder] = useState(false);
    const [openDialogDescription, setOpenDialogDescription] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(false);

    const handleClickOpen = () => {
        setOpenDialogFolder(true);
    };

    const handleCloseDialogFolder = (value) => {
        setOpenDialogFolder(false);
        setSelectedFolder(value);
        setCurFolderToRename(false)
        setCurFolderName(false)

        setOpenDialogDescription(true);

    };

    const handleCloseDialogDescription = (value) => {
        setOpenDialogDescription(false)
    };

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 4 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="p" color="text.main" >Movies</Typography>
                <Search inputText={inputText} onChangeInput={onChangeInput} />
            </Box>

            {searchMovieItems.length > 0 && <MovieGrid searchMovieItems={getMaxObjectsDivisibleBy12(searchMovieItems)} />}

            <Box>
                <Typography variant="subtitle1" component="div">
                    Selected: {selectedFolder.name}
                </Typography>
                <br />
                <Button variant="outlined" onClick={handleClickOpen}>
                    Open simple dialog
                </Button>
                <FoldersDialog
                    selectedFolder={selectedFolder}
                    open={openDialogFolder}
                    onClose={handleCloseDialogFolder}
                    folders={folders}
                    curFolderName={curFolderName}
                    curFolderToRename={curFolderToRename}
                    handleUpdateFolderName={handleUpdateFolderName}
                    handleInputChange={handleInputChange}
                    handleAddFolder={handleAddFolder}
                />
                <DescriptionDialog
                    selectedFolder={selectedFolder}
                    open={openDialogDescription}
                    onClose={handleCloseDialogDescription}
                    folders={folders}
                    curFolderName={curFolderName}
                    curFolderToRename={curFolderToRename}
                    handleUpdateFolderName={handleUpdateFolderName}
                    handleInputChange={handleInputChange}
                    handleAddFolder={handleAddFolder}
                />
            </Box>

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