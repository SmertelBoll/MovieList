import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Input, InputAdornment, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Slider, TextField, Typography, useTheme } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react'
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import TextFieldCustom from '../customMUI/TextFieldCustom';
import CheckIcon from '@mui/icons-material/Check';

import { Add, Remove } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { Grid } from '@mui/system';
import MainButton from '../Buttons/MainButton';
import instance from '../../axios';
import { alertError, alertSuccess } from '../../alerts';


const DEFAULT_RATE = 0
const DEFAULT_DATE = new Date()
const DEFAULT_TEXT = ""

function DescriptionDialog({
    handleCloseDialogDescription,
    selectedFolder,
    selectedMovieId,
    openDialogDescription,
    folders,
    curFolderName,
    curFolderToRename,
    handleUpdateFolderName,
    handleInputChange,
    handleAddFolder

}) {
    const [rating, setRating] = useState(DEFAULT_RATE); // Початкова оцінка
    const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
    const [text, setText] = useState(DEFAULT_TEXT);

    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    useEffect(() => {
        setRating(DEFAULT_RATE)
        setSelectedDate(DEFAULT_DATE)
        setText(DEFAULT_TEXT)
    }, [openDialogDescription]);

    const handleClose = () => {
        handleCloseDialogDescription(selectedFolder);
        setText("")
    };

    // Оновлення дати
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };


    // Надсилання даних
    const handleSubmit = () => {
        // onSubmit({ rating, selectedDate, text });
        instance
            .patch(`/folders/addmovie`, {
                folderName: selectedFolder.name,
                movieId: selectedMovieId,
                dateAdded: selectedDate,
                rating: rating,
                comment: text
            })
            .then((res) => {

                alertSuccess("Movie successfully added")
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
        handleClose();
    };

    const marks = Array.from({ length: 11 }, (_, index) => ({
        value: 10 * index,
        label: 10 * index,
    }));


    // -- SLISER for rate --
    const handleSliderChange = (event, newValue) => {
        setRating(newValue);
    };
    const handleInputSliderChange = (event) => {
        setRating(event.target.value === '' ? 0 : Number(event.target.value));
    };
    // Валідація оцінки
    const handleBlur = () => {
        if (rating < 0) {
            setRating(0);
        } else if (rating > 100) {
            setRating(100);
        }
    };

    return (
        <Dialog
            open={openDialogDescription}
            onClose={handleCloseDialogDescription}
            fullWidth
            sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                "& .MuiDialogContent-root": {
                    overflow: "visible", // Забезпечує видимість дочірніх елементів
                },
            }} // Стилі для Paper
        >
            <DialogTitle sx={{ p: 3 }} >Save in "{selectedFolder.name}"</DialogTitle>

            <DialogContent sx={{
                display: "flex",
                flexDirection: 'column',
                minWidth: { xl: '25vw' },
                gap: 2,
            }}>
                {/* Блок з повзунком */}
                <Box sx={{ display: "flex", gap: { xs: 3, md: 5 }, pt: 2, pl: 1 }} >
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
                            min: 1,
                            max: 10,
                            type: 'number',
                        }}
                        sx={{
                            '& .MuiInput-underline': {
                                display: 'none', // Це повністю приховує підкреслення
                            },
                        }}
                    />
                </Box>


                {/* Вибір дати */}
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
                                    sx={{
                                        width: '100%',
                                        mb: 0,
                                    }} />
                            )}
                        />
                    </LocalizationProvider>
                </Box>


                {/* Текстове поле */}
                <InputBox
                    label="Enter text..."
                    fullWidth
                    multiline
                    rows={3}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <MainButton onClick={handleCloseDialogDescription}>
                    Cancel
                </MainButton>
                <MainButton onClick={handleSubmit}>
                    Save
                </MainButton>
            </DialogActions>
        </Dialog >
    );
}

export default DescriptionDialog