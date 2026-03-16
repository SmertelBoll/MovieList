import { Box, Dialog, DialogContent, DialogActions, Slider, useTheme, Typography } from '@mui/material';
import React, { useMemo, useState, useEffect } from 'react';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import MainButton from '../Buttons/MainButton';
import instance from '../../axios';
import { alertError, alertConfirm, alertSuccess } from '../../alerts';
import SideBar from '../SideBar/SideBar';

const DEFAULT_RATE = null;
const DEFAULT_DATE = new Date();
const DEFAULT_TEXT = "";
const DEFAULT_TYPE_CUSTOM = null;

function ItemSaveDialog({
    isOpenDialogAdd,
    isOpenDialogEdit = false,
    isDeleteItem = false,
    handleCloseDialog,
    selectedFolder,
    setSelectedFolder,
    selectedItem,
    // update state if folder page
    objectOfFolderPage = null,
    setItems = () => { },
    sortItems = () => { },
    // sidebar props
    folders,
    setFolders,
    setIsGetFolders,
}) {
    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    );

    const [rating, setRating] = useState(DEFAULT_RATE);
    const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
    const [text, setText] = useState(DEFAULT_TEXT);
    const [typeCustom, setTypeCustom] = useState(DEFAULT_TYPE_CUSTOM);

    // -- USE EFFECTS -- //
    // Відкрито додавання фільму в папку
    useEffect(() => {
        if (!isOpenDialogAdd) return;

        setRating(DEFAULT_RATE);
        setSelectedDate(DEFAULT_DATE);
        setText(DEFAULT_TEXT);
    }, [isOpenDialogAdd]);

    // Відкрито редагування фільму в папці
    useEffect(() => {
        if (!selectedItem || !isOpenDialogEdit) return;

        const curDate = selectedItem.dateAdded || ""
        setRating(selectedItem.rating);
        setSelectedDate(new Date(curDate.replace('Z', '')));
        setText(selectedItem.comment);
    }, [isOpenDialogEdit]);

    // Видалення фільму з папки
    useEffect(() => {
        if (!isDeleteItem || !selectedItem || !selectedFolder) return;

        handleDeleteItem(selectedItem, selectedFolder);
    }, [isDeleteItem]);

    // -- HELP FUNCTIONS -- //
    // Оцінка
    const marks = Array.from({ length: 11 }, (_, index) => ({
        value: 10 * index,
        label: 10 * index,
    }));

    const handleSliderChange = (event, newValue) => {
        setRating(newValue);
    };
    const handleInputSliderChange = (event) => {
        setRating(event.target.value === '' ? 0 : Number(event.target.value));
    };
    const handleBlur = () => {
        if (rating < 0) {
            setRating(0);
        } else if (rating > 100) {
            setRating(100);
        }
    };

    // Дата
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    // Папка
    const handleFolderClick = (folder) => {
        setSelectedFolder(folder);
    };

    // -- API -- //
    // додавання фільму в папку (frontend)
    const addItem = (item) => {
        setItems(prev => sortItems([...prev, item]));
    }
    // оновлення фільму в папці (frontend)
    const updateItem = (item) => {
        setItems(prev => sortItems(prev.map(el => el._id === item._id ? item : el)));
    }
    // видалення фільму з папки (frontend)
    const removeItem = (item) => {
        setItems(prev => prev.filter(el => el._id !== item._id));
    }
    // додавання фільму в папку / оновлення фільму в папці (backend)
    const handleSubmit = () => {
        if (!selectedFolder) {
            alertError(null, 'Choose some folder!', '');
            return;
        }

        if (isOpenDialogAdd) {
            const tmdbType = selectedItem.media_type

            let params = {
                folderName: selectedFolder.name,
                tmdbId: selectedItem.id,
                dateAdded: selectedDate,
                rating: rating,
                comment: text,
                customType: typeCustom
            }

            if (tmdbType === "movie") {
                params.tmdbTitle = selectedItem.title;
            }
            else if (tmdbType === "tv") {
                params.tmdbTitle = selectedItem.name;
                params.level = "tv"
            }

            instance
                .post(`/${tmdbType}`, params)
                .then((res) => {
                    alertSuccess(`${tmdbType} successfully added`);
                    if (objectOfFolderPage) {
                        addItem({
                            ...selectedItem,
                            ...res.data.results,
                        });
                    }
                    handleCloseDialog();
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        }
        else if (isOpenDialogEdit) {
            const tmdbType = selectedItem.media_type

            let params = {
                folderName: selectedFolder.name,
                tmdbId: selectedItem.id,
                dateAdded: selectedDate,
                rating: rating,
                comment: text,
                customType: typeCustom
            }

            if (tmdbType === "movie") {
                params.tmdbTitle = selectedItem.title;
            }
            else if (tmdbType === "tv") {
                params.tmdbTitle = selectedItem.name;
            }

            instance
                .patch(`/${tmdbType}/${selectedItem._id}`, {
                    folderName: selectedFolder.name,
                    dateAdded: selectedDate,
                    rating: rating,
                    comment: text,
                    customType: typeCustom
                })
                .then((res) => {
                    alertSuccess(`${tmdbType} successfully updated`);
                    if (objectOfFolderPage?.name !== selectedFolder.name) {
                        removeItem(res.data.results);
                    } else {
                        updateItem({
                            ...selectedItem,
                            ...res.data.results,
                        });
                    }
                    handleCloseDialog();
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        }
    };
    // видалення фільму з папки (backend)
    const handleDeleteItem = (item, folder) => {
        alertConfirm(`Are you sure you want to delete "${item.tmdbTitle}" from this folder?`, () => {
            instance
                .delete(`/${item.media_type}`, {
                    data: {
                        mongoId: item._id,
                        folderName: folder.name
                    }
                })
                .then((res) => {
                    alertSuccess(`${item.media_type} successfully deleted`);
                    removeItem(item);
                    handleCloseDialog()
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        });
    };

    return (
        <Dialog open={isOpenDialogAdd || isOpenDialogEdit} onClose={handleCloseDialog} fullWidth maxWidth="md">
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: 3,
                    minHeight: 450,
                    maxHeight: 450,
                    overflow: 'visible',
                    backgroundColor: theme.palette.bg.second,
                    p: 2
                }}
            >
                {/* LEFT: Folders */}
                <Box sx={{ flex: 1, borderRight: '1px solid', borderColor: 'divider' }}>
                    <SideBar
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        handleClickToFolder={handleFolderClick}
                        selectedFolder={selectedFolder}
                        sx={{
                            maxHeight: '100%',
                            overflowY: 'auto',
                            p: 0,
                            backgroundColor: theme.palette.bg.second,
                            pr: 2
                        }}
                    />
                </Box>

                {/* RIGHT: Description */}
                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="p" sx={{ textAlign: 'left' }}>
                            Save {selectedItem.tmdbType} to {
                                selectedFolder?.name
                                    ? selectedFolder?.name.length > 20
                                        ? `"${selectedFolder?.name.slice(0, 20)}..."`
                                        : `"${selectedFolder?.name}"`
                                    : '...'
                            }

                        </Typography>
                        <Box sx={{ display: 'flex', gap: { xs: 3, md: 5 }, pt: 2, pl: 1 }}>
                            <Slider
                                value={typeof rating === 'number' ? rating : 0}
                                onChange={handleSliderChange}
                                min={0}
                                max={100}
                                step={1}
                                marks={marks}
                                valueLabelDisplay="auto"
                                color="text.dark"
                            />
                            <InputBox
                                value={rating}
                                size="small"
                                onChange={handleInputSliderChange}
                                onBlur={handleBlur}
                                inputProps={{
                                    step: 1,
                                    min: 0,
                                    max: 10,
                                    type: 'number',
                                }}
                                sx={{ '& .MuiInput-underline': { display: 'none' } }}
                            />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                            <LocalizationProvider dateAdapter={AdapterDateFns}>
                                <DatePicker
                                    label="Choose date"
                                    value={selectedDate}
                                    onChange={handleDateChange}
                                    renderInput={(params) => (
                                        <InputBox
                                            {...params}
                                            fullWidth
                                            sx={{ width: '100%', mb: 0 }}
                                        />
                                    )}
                                />
                            </LocalizationProvider>
                        </Box>
                        <InputBox
                            label="Enter text..."
                            fullWidth
                            multiline
                            rows={6}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </Box>

                    <DialogActions sx={{ p: 0 }}>
                        <MainButton onClick={handleCloseDialog}>Cancel</MainButton>
                        <MainButton onClick={handleSubmit}>
                            {isOpenDialogAdd ? 'Add' : isOpenDialogEdit ? 'Update' : 'Ops.. Error'}
                        </MainButton>
                    </DialogActions>

                </Box>

            </DialogContent>
        </Dialog >
    );
}

export default ItemSaveDialog; 