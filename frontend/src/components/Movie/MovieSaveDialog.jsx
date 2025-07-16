import { Box, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemButton, ListItemText, InputAdornment, Slider, useTheme, Typography } from '@mui/material';
import React, { useMemo, useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import CheckIcon from '@mui/icons-material/Check';
import TextFieldCustom from '../customMUI/TextFieldCustom';
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import MainButton from '../Buttons/MainButton';
import instance from '../../axios';
import { alertError, alertSuccess } from '../../alerts';
import RenameFolderInput from '../SideBar/RenameFolderInput';
import SideBar from '../SideBar/SideBar';

const DEFAULT_RATE = 0;
const DEFAULT_DATE = new Date();
const DEFAULT_TEXT = "";

function MovieSaveDialog({
    open,
    onClose,
    folders,
    selectedFolder,
    setSelectedFolder,
    selectedMovieId,
    setFolders,
    setIsGetFolders
}) {
    const [rating, setRating] = useState(DEFAULT_RATE);
    const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
    const [text, setText] = useState(DEFAULT_TEXT);

    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    useEffect(() => {
        setRating(DEFAULT_RATE);
        setSelectedDate(DEFAULT_DATE);
        setText(DEFAULT_TEXT);
    }, [open]);

    const handleFolderClick = (folder) => {
        setSelectedFolder(folder);
    };

    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    const handleSubmit = () => {
        console.log(selectedFolder)
        if (!selectedFolder) {
            alertError(null, null, 'Choose some folder!');
            return;
        }
        instance
            .patch(`/folders/addmovie`, {
                folderName: selectedFolder.name,
                movieId: selectedMovieId,
                dateAdded: selectedDate,
                rating: rating,
                comment: text
            })
            .then((res) => {
                alertSuccess('Movie successfully added');
                onClose();
            })
            .catch((err) => {
                console.warn(err);
                alertError(err);
            });
    };

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

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            {/* <DialogTitle sx={{ textAlign: 'center' }}>Save movie to {selectedFolder?.name || '...'}</DialogTitle> */}
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
                            Save movie to {
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
                                    min: 1,
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
                        <MainButton onClick={onClose}>Cancel</MainButton>
                        <MainButton onClick={handleSubmit}>Save</MainButton>
                    </DialogActions>

                </Box>

            </DialogContent>
        </Dialog >
    );
}

export default MovieSaveDialog; 