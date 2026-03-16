import { Box, CircularProgress, debounce, Grid2, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import Search from '../Sorting/Search'
import ItemCart from './ItemCart';
import instance from '../../axios';
import { alertError, alertConfirm, alertSuccess } from '../../alerts';
import { useLocation, useNavigate } from 'react-router-dom';
import MainButton from '../Buttons/MainButton';
import ItemSaveDialog from '../ItemSaveDialog/ItemSaveDialog';
import Sort from '../Sorting/Sort';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY

const CATEGORIES_SORT_BY = {
    tmdb: [
        {
            name: 'Popularity',
            keys: ['popularity'],
            order: 'desc'
        },
        {
            name: 'Rating',
            keys: ['vote_average'],
            order: 'desc'
        },
        {
            name: 'Release Date',
            keys: ['release_date', 'first_air_date'],
            order: 'desc'
        },
        {
            name: 'Vote Count',
            keys: ['vote_count'],
            order: 'desc'
        },
        {
            name: 'Title',
            keys: ['original_title'],
            order: 'asc'
        }
    ],
    mongo: [
        {
            name: 'Add Date',
            keys: ['dateAdded'],
            order: 'desc'
        },
        {
            name: 'Update Date',
            keys: ['updatedAt'],
            order: 'desc'
        },
        {
            name: 'Rating',
            keys: ['rating'],
            order: 'desc'
        },
        {
            name: 'Title',
            keys: ['movieTitle'],
            order: 'asc'
        }
    ]
}

const LIMIT_ITEMS = 12;

function GeneralItemList({
    // Бокова панель
    folders,
    setFolders,
    setIsGetFolders,
    // Робота з базами даних
    dbType,
    urlParams = false,
    isPreperedData = false,
    preperedData = [],
    // Інше
    pageType = "NotFound",
    pageTitle = "Page don't have title",
    isSearch = false,
    isSort = false,
    ...props
}) {
    const { typeTMDB } = useSelector((state) => state.config);
    const location = useLocation();
    const navigate = useNavigate();

    // Читаємо параметр з URL лише при першому рендері
    const initialFilter = new URLSearchParams(location.search).get('filter') || "";

    // об'єкти для search (input)
    const [inputText, setInputText] = useState(initialFilter);     // відповідає за відображення тексту в input
    const [searchValue, setSearchValue] = useState(initialFilter); // загружається кінцеве значення після debounce для запроса

    // об'єкти для query
    const [isLoadedItems, setIsLoadedItems] = useState(true);    // фільми загружені (T/F)
    const [items, setItems] = useState([])                       // об'єкти фільму
    const [displayedItems, setDisplayedItems] = useState(0)      // скільки фільмів на екрані
    const [page, setPage] = useState(1)                          // сторінка запиту
    const [totalPages, setTotalPages] = useState(1)              // загальна кількість сторінок

    // об'єкти для ItemsDialog
    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false);    // відкрито панель додавання фільму (T/F)
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false);  // відкрито панель редагування фільму (T/F)
    const [isDeleteItem, setIsDeleteItem] = useState(false);        // тригер видалення фільму (T/F)
    const [selectedFolder, setSelectedFolder] = useState({});      // яка папка (obj) обрана у ItemsDialog
    const [selectedItem, setSelectedItem] = useState({});        // який фільм (obj) обраний у ItemsDialog

    // робота з сортуванням
    const [nameSortBy, setNameSortBy] = useState(CATEGORIES_SORT_BY[dbType][0].name);
    const [sortDirection, setSortDirection] = useState(CATEGORIES_SORT_BY[dbType][0].order);


    // -- HELP FUNCTIONS -- //
    // Функція для отримання ключів сортування
    const getSortKeys = (nameSortBy) => {
        return CATEGORIES_SORT_BY[dbType].find(el => el.name === nameSortBy).keys;
    }
    // Функція для сортування фільмів на клієнті
    const sortItems = useCallback((items, nameSortBy, order) => {
        return [...items].sort((a, b) => {
            const sortByKeys = getSortKeys(nameSortBy);
            let aValue = sortByKeys.map(k => a[k]).find(v => v !== undefined)
            let bValue = sortByKeys.map(k => b[k]).find(v => v !== undefined)

            // Обробка спеціальних випадків
            if (nameSortBy === 'Release Date' || nameSortBy === 'Add Date' || nameSortBy === 'Update Date') {
                aValue = aValue ? new Date(aValue) : new Date(0);
                bValue = bValue ? new Date(bValue) : new Date(0);
            } else if (nameSortBy === 'Rating' || nameSortBy === 'Vote Count' || nameSortBy === 'Popularity') {
                aValue = aValue || 0;
                bValue = bValue || 0;
            } else if (nameSortBy === 'Title') {
                aValue = (aValue || '').toString().toLowerCase();
                bValue = (bValue || '').toString().toLowerCase();
            }

            if (order === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    }, []);

    // Отримання даних про фільм з TMDB
    const getItemsById = useCallback(async (item) => {
        const params = {
            api_key: API_KEY,
            language: "en-US",
        };

        try {
            const res = await instance.get(
                `${process.env.REACT_APP_URL_TMDB}/${item.media_type}/${item.tmdbId}`,
                { params }
            );
            return res.data
        } catch (err) {
            console.warn(err);
            alertError(err);
            return null;
        }
    }, []);


    // -- USE EFFECTS -- //
    // Очищуємо параметр filter з URL після завантаження, щоб він не застосовувався повторно
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        if (queryParams.has('filter')) {
            queryParams.delete('filter');
            const newSearch = queryParams.toString();
            navigate({ search: newSearch }, { replace: true });
        }
    }, [location.search, navigate]);

    useEffect(() => {
        setIsLoadedItems(false)
        setItems([])
        setDisplayedItems(0)
        setPage(1)
        setTotalPages(1)
    }, [searchValue, nameSortBy, sortDirection, typeTMDB])

    // Загрузка даних
    useEffect(() => {
        setIsLoadedItems(false);

        // Використовуємо передані дані
        if (isPreperedData && page === 1) {
            let resData = preperedData.filter(el => ((el?.title || el?.name) || "").toLowerCase().includes((searchValue || "").toLowerCase()))
            resData = sortItems(resData, nameSortBy, sortDirection)
            setDisplayedItems(resData.length)  // відображаємо усі фільми

            setItems(resData)
            setIsLoadedItems(true)
            setTotalPages(1)
            return
        }

        // Якщо нова сторінка уже завантажена, показуємо її
        if (page !== 1 && items.length - displayedItems >= LIMIT_ITEMS) {
            setDisplayedItems(prev => prev + LIMIT_ITEMS)
            setIsLoadedItems(true)
            return
        }

        if (dbType === "tmdb") {
            // Якщо пошуковий запит порожній, використовуємо популярні фільми
            const endpoint = `${process.env.REACT_APP_URL_TMDB}/${searchValue.trim() === "" ? "discover" : "search"}`

            let params = {
                api_key: API_KEY,
                language: "en-US",
                page: page,
                sort_by: `${CATEGORIES_SORT_BY[dbType]}.${sortDirection}`,
                ...urlParams
            };

            // Додаємо query тільки для пошукового запиту
            if (searchValue.trim() !== "") {
                params.query = searchValue;
            }

            Promise.all(
                typeTMDB.map(type =>
                    instance.get(`${endpoint}/${type}`, { params })
                        .then(res => ({
                            results: res.data.results.map(item => ({ ...item, media_type: type })),
                            totalPages: res.data.total_pages
                        }))
                )
            )
                .then((responses) => {
                    let combinedResults = responses.flatMap(r => r.results);
                    combinedResults = sortItems(combinedResults, nameSortBy, sortDirection);

                    setItems(prev => [...prev, ...combinedResults])
                    setTotalPages(Math.max(...responses.map(r => r.totalPages || 1)))
                    setDisplayedItems(prev => prev + LIMIT_ITEMS)
                    setIsLoadedItems(true);
                })
                .catch((err) => {
                    setItems([]);
                    setIsLoadedItems(true);
                    console.warn(err);
                    alertError(err);
                });
        }
        else if (dbType === "mongo") {
            // Якщо пошуковий запит порожній, використовуємо популярні фільми
            const endpoint = props.customEndpoint || process.env.REACT_APP_URL_MONGO

            let params = {
                page: page,
                sort_by: `${getSortKeys(nameSortBy)}.${sortDirection}`,
                limit: 24,
                ...urlParams
            };

            // Додаємо query тільки для пошукового запиту
            if (searchValue.trim() !== "") {
                params.query = searchValue;
            }

            instance
                .get(endpoint, { params })
                .then(async (res) => {
                    // Створюємо масив промісів для паралельного завантаження даних з TMDB
                    let results = res.data.results;

                    const resultsWithTmdb = await Promise.all(
                        results.map(async (item) => {
                            const tmdbData = await getItemsById(item);

                            return {
                                ...item,
                                ...tmdbData
                            };
                        })
                    );

                    setItems(prev => [...prev, ...resultsWithTmdb]);
                    setTotalPages(res.data.pagination.totalPages)
                    setDisplayedItems(prev => prev + LIMIT_ITEMS)  // При першому запиті відображаємо 24 фільмів
                    setIsLoadedItems(true);
                })
                .catch((err) => {
                    setItems([]);
                    setIsLoadedItems(true);
                    console.warn(err);
                    alertError(err);
                });
        }
    }, [page, preperedData]);


    // Обираємо за замовчуванням папку, яка відповідає сторінці
    useEffect(() => {
        setSelectedFolder(props.objectOfFolderPage);
    }, [props.objectOfFolderPage]);


    // -- SEARCH FUNCTIONS -- //
    const updateSearchValue = useCallback(
        debounce((str) => {
            setSearchValue(str);
        }, 500),
        [setSearchValue]
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


    // // -- FOLDER FUNCTIONS -- //
    // додавання фільму до папки
    const handleDialogAddItem = (item) => {
        setSelectedItem(item);
        setIsOpenDialogAdd(true);
    };
    // редагування фільму в папці
    const handleDialogEditItem = (item) => {
        setSelectedItem(item);
        setIsOpenDialogEdit(true);
    };
    // закриття діалогу
    const handleCloseDialog = () => {
        setIsOpenDialogAdd(false);
        setIsOpenDialogEdit(false);
        setIsDeleteItem(false)
        if (pageType !== "folder") {
            setSelectedFolder(null)
        }
    };
    // видалення фільму або серіалу
    const handleDeleteItem = (item) => {
        setSelectedItem(item)
        setIsDeleteItem(true);
    };


    // Кешуємо сітку фільмів, щоб вона не ререндерилася при кожному введі в інпут (Search)
    // чи зміні іншого стейту поза межами залежностей
    const renderedItemGrid = React.useMemo(() => (
        <Grid2 container spacing={2} justifyContent="center">
            {items.slice(0, displayedItems).map((item, i) => (
                <Grid2 item size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} key={`${item?.title}_${i}`}>
                    <ItemCart
                        item={item}
                        onAddItem={handleDialogAddItem}
                        onEditItem={handleDialogEditItem}
                        onDeleteItem={handleDeleteItem}
                        dbType={dbType}
                        mediaType={item.media_type || "movie"}
                        isImage={true}
                        isTitle={true}
                        isJob={pageType === "crew"}
                        isDate={true}
                        isRating={true}
                        isVoteCount={!Boolean(props.objectOfFolderPage)}
                        isDescription={dbType === "tmdb"}
                        isComment={dbType === "mongo"}
                        isFolderPage={Boolean(props.objectOfFolderPage)}
                    />
                </Grid2>
            ))}
        </Grid2>
    ), [
        items,
        displayedItems,
        dbType,
        pageType,
        props.objectOfFolderPage
    ]);

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="p" color="text.main" >{pageTitle}</Typography>

            {(isSearch || isSort) &&
                <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>

                    {isSearch && <Box sx={{ flex: isSort ? "75%" : "100%" }}>
                        <Search inputText={inputText} onChangeInput={onChangeInput} />
                    </Box>}

                    {isSort && <Box sx={{
                        flex: isSearch ? "25%" : "0%",
                        opacity: searchValue.trim() !== "" && dbType === "tmdb" && !preperedData ? 0.5 : 1,
                        pointerEvents: searchValue.trim() !== "" && dbType === "tmdb" && !preperedData ? "none" : "auto"
                    }}>
                        <Sort
                            nameSortBy={nameSortBy}
                            setNameSortBy={setNameSortBy}
                            sortDirection={sortDirection}
                            setSortDirection={setSortDirection}
                            categoriesSortBy={CATEGORIES_SORT_BY[dbType]}
                        />
                    </Box>}
                </Box>
            }

            {items.length > 0 && renderedItemGrid}

            <ItemSaveDialog
                isOpenDialogAdd={isOpenDialogAdd}
                isOpenDialogEdit={isOpenDialogEdit}
                isDeleteItem={isDeleteItem}
                handleCloseDialog={handleCloseDialog}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
                selectedItem={selectedItem}
                // update state if folder page
                objectOfFolderPage={props?.objectOfFolderPage}
                setItems={setItems}
                sortItems={(items) => sortItems(items, nameSortBy, sortDirection)}
                // sidebar props
                folders={folders}
                setFolders={setFolders}
                setIsGetFolders={setIsGetFolders}
            />

            <Box sx={{ mb: 2 }}>
                {
                    !isLoadedItems
                        ? <Box width="100%" textAlign="center">
                            <CircularProgress color="text.main" />
                        </Box>
                        : (totalPages > page || displayedItems < items.length) && items.length > 0
                            ? <Box display="flex" justifyContent="center" >
                                <MainButton onClick={() => setPage(prev => prev + 1)}>Give more</MainButton>
                            </Box>
                            : <></>
                }
            </Box>



        </Box >
    )
}

export default GeneralItemList