import { Box, CircularProgress, debounce, Grid2, Tooltip, Typography } from '@mui/material'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setViewMode, setCustomTypes } from '../../redux/slices/ConfigSlice'
import { getTmdbLanguage } from '../../utils/languages'
import Search from '../Sorting/Search'
import ItemCart from './ItemCart';
import ItemRow from './ItemRow';
import SegmentedSwitch from '../SegmentedSwitch';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import instance from '../../axios';
import { alertError } from '../../alerts';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import MainButton from '../Buttons/MainButton';
import ItemSaveDialog from '../ItemSaveDialog/ItemSaveDialog';
import Sort from '../Sorting/Sort';
import { fetchSavedDoc } from '../../utils/savedItems';

const API_KEY = process.env.REACT_APP_TMDB_API_KEY

const CATEGORIES_SORT_BY = {
    tmdb: {
        'Popularity': {
            keys: { movie: 'popularity', tv: 'popularity' },
            order: 'desc'
        },
        'Rating': {
            keys: { movie: 'vote_average', tv: 'vote_average' },
            order: 'desc'
        },
        'Release Date': {
            keys: { movie: 'release_date', tv: 'first_air_date' },
            order: 'desc'
        },
        'Vote Count': {
            keys: { movie: 'vote_count', tv: 'vote_count' },
            order: 'desc'
        },
        'Title': {
            keys: { movie: 'title', tv: 'name' },
            order: 'asc'
        }

    },
    mongo: {
        'Add Date': {
            keys: { movie: 'dateAdded', tv: 'dateAdded' },
            order: 'desc'
        },
        'Update Date': {
            keys: { movie: 'updatedAt', tv: 'updatedAt' },
            order: 'desc'
        },
        'Rating': {
            keys: { movie: 'rating', tv: 'rating' },
            order: 'desc'
        },
        'Title': {
            keys: { movie: 'tmdbTitle', tv: 'tmdbTitle' },
            order: 'asc'
        }
    }
}

const LIMIT_ITEMS = 12;

function GeneralItemList({
    folders,
    setFolders,
    setIsGetFolders,
    dbType,
    urlParams = false,
    isPreperedData = false,
    preperedData = [],
    pageType = "NotFound",
    pageTitle = "Page don't have title",
    titleAdornment = null,
    isSearch = false,
    isSort = false,
    ...props
}) {
    const { typeTMDB, customTypes, language, viewMode } = useSelector((state) => state.config);
    const dispatch = useDispatch();
    const tmdbLanguage = getTmdbLanguage(language);
    // Custom types apply only to mongo pages; ignored for tmdb.
    const effectiveCustomTypes = dbType === "mongo" ? customTypes : [];
    const customTypesKey = effectiveCustomTypes.join(",");
    const location = useLocation();
    const navigate = useNavigate();
    const navigationType = useNavigationType();

    // Search/sort/tags are kept in sessionStorage per page URL and restored only on back navigation (POP); entering via
    // a link starts clean.
    const listStateKey = `MovieList-list:${location.pathname}`;
    const [restored] = useState(() => {
        if (navigationType !== 'POP') return null;
        try {
            return JSON.parse(window.sessionStorage.getItem(listStateKey));
        } catch {
            return null;
        }
    });

    // A ?filter= URL param beats the stored search.
    const initialFilter = new URLSearchParams(location.search).get('filter') || restored?.search || "";

    const [inputText, setInputText] = useState(initialFilter);
    const [searchValue, setSearchValue] = useState(initialFilter);

    const [isLoadedItems, setIsLoadedItems] = useState(true);
    const [items, setItems] = useState([])
    const [displayedItems, setDisplayedItems] = useState(0)
    const [page, setPage] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const [isOpenDialogAdd, setIsOpenDialogAdd] = useState(false);
    const [isOpenDialogEdit, setIsOpenDialogEdit] = useState(false);
    const [isDeleteItem, setIsDeleteItem] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState({});
    const [selectedItem, setSelectedItem] = useState({});

    const [nameSortBy, setNameSortBy] = useState(
        restored?.sortBy in CATEGORIES_SORT_BY[dbType] ? restored.sortBy : Object.keys(CATEGORIES_SORT_BY[dbType])[0]
    );
    const [sortDirection, setSortDirection] = useState(
        restored?.sortBy in CATEGORIES_SORT_BY[dbType] && (restored.direction === 'asc' || restored.direction === 'desc') ? restored.direction : 'desc'
    );


    // -- HELP FUNCTIONS -- //
    const sortItems = useCallback((items, nameSortBy, order) => {
        return [...items].sort((a, b) => {
            let aValue = a[CATEGORIES_SORT_BY[dbType][nameSortBy]["keys"][a.media_type]]
            let bValue = b[CATEGORIES_SORT_BY[dbType][nameSortBy]["keys"][b.media_type]]

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

    const getItemsById = useCallback(async (item) => {
        const params = {
            api_key: API_KEY,
            language: tmdbLanguage,
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
    }, [tmdbLanguage]);


    // -- USE EFFECTS -- //
    // Tags live in redux and are reset when leaving folder pages (TypeTMDBSelector), so restore them from the
    // saved state on back navigation.
    useEffect(() => {
        if (dbType === "mongo" && Array.isArray(restored?.tags)) dispatch(setCustomTypes(restored.tags));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        try {
            window.sessionStorage.setItem(listStateKey, JSON.stringify({
                search: searchValue,
                sortBy: nameSortBy,
                direction: sortDirection,
                tags: dbType === "mongo" ? customTypes : [],
            }));
        } catch {
        }
    }, [listStateKey, searchValue, nameSortBy, sortDirection, customTypesKey, dbType]); // eslint-disable-line react-hooks/exhaustive-deps

    // Clear the filter param after loading so it isn't applied again.
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
        setTotalPages(1)
        setPage(0)
        // tmdbLanguage resets the list too: titles and descriptions must be refetched.
    }, [searchValue, nameSortBy, sortDirection, typeTMDB, customTypesKey, tmdbLanguage])

    useEffect(() => {
        setIsLoadedItems(false);

        if (page === 0) {
            setPage(1)
            return
        }

        if (isPreperedData && page === 1) {
            let resData = preperedData.filter(el => ((el?.title || el?.name) || "").toLowerCase().includes((searchValue || "").toLowerCase()))
            resData = sortItems(resData, nameSortBy, sortDirection)
            setDisplayedItems(resData.length)

            setItems(resData)
            setIsLoadedItems(true)
            setTotalPages(1)
            return
        }

        if (page !== 1 && items.length - displayedItems >= LIMIT_ITEMS) {
            setDisplayedItems(prev => prev + LIMIT_ITEMS)
            setIsLoadedItems(true)
            return
        }

        if (dbType === "tmdb") {
            const endpoint = `${process.env.REACT_APP_URL_TMDB}/${searchValue.trim() === "" ? "discover" : "search"}`

            let params = {
                api_key: API_KEY,
                language: tmdbLanguage,
                page: page,
                ...urlParams
            };

            if (searchValue.trim() !== "") {
                params.query = searchValue;
            }

            Promise.all(
                typeTMDB.map(type =>
                    instance.get(`${endpoint}/${type}`, {
                        params: {
                            ...params,
                            sort_by: `${CATEGORIES_SORT_BY[dbType][nameSortBy]["keys"][type]}.${sortDirection}`,
                        }
                    })
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
            const endpoint = props.customEndpoint || process.env.REACT_APP_URL_MONGO

            let params = {
                page: page,
                sort_by: `${CATEGORIES_SORT_BY[dbType][nameSortBy]["keys"]["movie"]}.${sortDirection}`,
                limit: 24,
                type: typeTMDB.join(","),
                ...(customTypesKey ? { customType: customTypesKey } : {}),
                ...urlParams
            };

            if (searchValue.trim() !== "") {
                params.query = searchValue;
            }

            instance
                .get(endpoint, { params })
                .then(async (res) => {
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
    }, [page, preperedData]);


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
            setInputText("");
            updateSearchValue("");
        } else {
            setInputText(e.target.value);
            updateSearchValue(e.target.value);
        }
    };


    // // -- FOLDER FUNCTIONS -- //
    const handleDialogAddItem = (item) => {
        setSelectedItem(item);
        setIsOpenDialogAdd(true);
    };
    // Saved-index copy -> full folder object (the dialog sidebar highlights the selection by order).
    const folderOfCopy = (copy) => folders?.find((f) => f.name === copy.folderName) || { name: copy.folderName, status: copy.status };

    // copy = the copy chosen via the button on tmdb list pages: load its data (rating, comment...) by
    // mongoId. Without copy the card already is a copy.
    const handleDialogEditItem = async (item, copy = null) => {
        if (!copy) {
            setSelectedItem(item);
            setIsOpenDialogEdit(true);
            return;
        }
        try {
            const doc = await fetchSavedDoc(item.media_type, copy.mongoId);
            setSelectedFolder(folderOfCopy(copy));
            setSelectedItem({ ...item, ...doc });
            setIsOpenDialogEdit(true);
        } catch (err) {
            console.warn(err);
            alertError(err);
        }
    };
    const handleCloseDialog = () => {
        setIsOpenDialogAdd(false);
        setIsOpenDialogEdit(false);
        setIsDeleteItem(false)
        if (pageType !== "folder") {
            setSelectedFolder(null)
        }
    };
    // delete a movie or tv (copy comes from the saved index when the card isn't a copy itself)
    const handleDeleteItem = (item, copy = null) => {
        if (copy) {
            setSelectedFolder(folderOfCopy(copy))
            setSelectedItem({ ...item, _id: copy.mongoId })
        } else {
            setSelectedItem(item)
        }
        setIsDeleteItem(true);
    };


    // Memoized so typing in Search doesn't re-render the whole grid.
    const itemProps = (item) => ({
        item,
        onAddItem: handleDialogAddItem,
        onEditItem: handleDialogEditItem,
        onDeleteItem: handleDeleteItem,
        dbType,
        mediaType: item.media_type || "movie",
        isJob: pageType === "crew",
        isDate: true,
        isRating: true,
        isVoteCount: !Boolean(props.objectOfFolderPage),
        isDescription: dbType === "tmdb",
        isComment: dbType === "mongo",
        isFolderPage: Boolean(props.objectOfFolderPage),
    });

    const renderedItemGrid = React.useMemo(() => viewMode === "list" ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {items.slice(0, displayedItems).map((item, i) => (
                <ItemRow key={item?._id || item?.id || i} {...itemProps(item)} />
            ))}
        </Box>
    ) : (
        <Grid2 container spacing={2} justifyContent="center">
            {items.slice(0, displayedItems).map((item, i) => (
                <Grid2 item size={{ xs: 6, sm: 6, md: 4, lg: 3, xl: 2, xxxl: 1 }} key={item?._id || item?.id || i}>
                    <ItemCart {...itemProps(item)} isImage isTitle />
                </Grid2>
            ))}
        </Grid2>
    ), [
        items,
        displayedItems,
        dbType,
        pageType,
        viewMode,
        props.objectOfFolderPage,
        // Edit/delete handlers take the copy's folder from the folder list.
        folders
    ]);

    const isEmpty = (isPreperedData && preperedData.length === 0)
        || (!isPreperedData && items.length === 0 && isLoadedItems && page > 0 && searchValue.trim() === "");

    return (
        <Box bgcolor="bg.second" sx={{ borderRadius: 2, p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", minWidth: 0 }}>
                    <Typography variant="p" color="text.main">{pageTitle}</Typography>
                    {titleAdornment}
                </Box>

                <SegmentedSwitch
                    compact
                    value={viewMode}
                    onChange={(mode) => dispatch(setViewMode(mode))}
                    sx={{ ml: "auto" }}
                    options={[
                        { value: "cards", label: <GridViewIcon fontSize="small" />, ariaLabel: "Show as cards" },
                        { value: "list", label: <ViewListIcon fontSize="small" />, ariaLabel: "Show as list" },
                    ]}
                />
            </Box>

            {isEmpty
                ? <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    No items to display
                </Typography>
                : <>
                    {(isSearch || isSort) &&
                        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>

                            {isSearch && <Box sx={{
                                flex: { xs: "0 0 auto", sm: isSort ? "75%" : "100%" },
                                width: { xs: "100%", sm: "auto" }
                            }}>
                                <Search inputText={inputText} onChangeInput={onChangeInput} />
                            </Box>}

                            {isSort && (() => {
                                const isSearching = searchValue.trim() !== "";
                                const isBothTypes = typeTMDB.length > 1;
                                const isSortDisabled = dbType === "tmdb" && !preperedData && (isSearching || isBothTypes);
                                const disabledReason = [
                                    isBothTypes && "Select only movies or only TV shows",
                                    isSearching && "clear the search",
                                ].filter(Boolean).join(" and ");
                                return (
                                    <Tooltip
                                        title={isSortDisabled ? `Sorting is not available for the current filters. ${disabledReason}.` : ""}
                                        arrow
                                        placement="top"
                                    >
                                        <Box sx={{
                                            flex: { xs: "0 0 auto", sm: isSearch ? "25%" : "0%" },
                                            width: { xs: "100%", sm: "auto" }
                                        }}>
                                            <Box sx={{
                                                opacity: isSortDisabled ? 0.5 : 1,
                                                pointerEvents: isSortDisabled ? "none" : "auto"
                                            }}>
                                                <Sort
                                                    nameSortBy={nameSortBy}
                                                    setNameSortBy={setNameSortBy}
                                                    sortDirection={sortDirection}
                                                    setSortDirection={setSortDirection}
                                                    categoriesSortBy={CATEGORIES_SORT_BY[dbType]}
                                                />
                                            </Box>
                                        </Box>
                                    </Tooltip>
                                );
                            })()}
                        </Box>
                    }

                    {items.length > 0 && renderedItemGrid}

                    {items.length === 0 && isLoadedItems && page > 0 &&
                        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                            No items to display
                        </Typography>
                    }

                    <ItemSaveDialog
                        isOpenDialogAdd={isOpenDialogAdd}
                        isOpenDialogEdit={isOpenDialogEdit}
                        isDeleteItem={isDeleteItem}
                        handleCloseDialog={handleCloseDialog}
                        selectedFolder={selectedFolder}
                        setSelectedFolder={setSelectedFolder}
                        selectedItem={selectedItem}
                        objectOfFolderPage={props?.objectOfFolderPage}
                        setItems={setItems}
                        sortItems={(items) => sortItems(items, nameSortBy, sortDirection)}
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                    />

                    {/* Bottom of the list: spinner or "Give more". Not rendered when empty, otherwise its gap/margin would make the bottom look too big. */}
                    {!isLoadedItems
                        ? <Box width="100%" textAlign="center">
                            <CircularProgress color="text.main" />
                        </Box>
                        : (totalPages > page || displayedItems < items.length) && items.length > 0
                            ? <Box display="flex" justifyContent="center" >
                                <MainButton onClick={() => setPage(prev => prev + 1)}>Give more</MainButton>
                            </Box>
                            : null}
                </>
            }

        </Box >
    )
}

export default GeneralItemList