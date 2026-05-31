import { Box, Dialog, DialogContent, DialogActions, Slider, useTheme, Typography } from '@mui/material';
import React, { useMemo, useState, useEffect } from 'react';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import MainButton from '../Buttons/MainButton';

function SeasonEpisodeDialog({
    open,
    mode = "season", // "season" | "episode"
    title = "",
    initial = {},
    onClose,
    onSave,
}) {
    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    );
    // Без зменшеного padding — щоб висота збігалася з полем дати (DatePicker)
    const InputBoxRegular = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, false),
        [theme.palette.bg.second, theme.palette.text.main]
    );

    const [rating, setRating] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [text, setText] = useState("");
    const [watchedCount, setWatchedCount] = useState(1);

    // Заповнюємо поля при відкритті
    useEffect(() => {
        if (!open) return;
        setRating(initial.rating ?? null);
        setSelectedDate(initial.dateAdded ? new Date(String(initial.dateAdded).replace('Z', '')) : new Date());
        setText(initial.comment ?? "");
        setWatchedCount(initial.watchedCount ?? 1);
    }, [open]);

    const marks = Array.from({ length: 11 }, (_, index) => ({
        value: 10 * index,
        label: 10 * index,
    }));

    const handleSliderChange = (event, newValue) => setRating(newValue);
    const handleInputSliderChange = (event) => setRating(event.target.value === '' ? 0 : Number(event.target.value));
    const handleBlur = () => {
        if (rating < 0) setRating(0);
        else if (rating > 100) setRating(100);
    };

    const handleWatchedChange = (event) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        setWatchedCount(value < 0 ? 0 : value);
    };

    const handleSubmit = () => {
        onSave({
            rating,
            comment: text,
            dateAdded: selectedDate,
            ...(mode === "episode" ? { watchedCount } : {})
        });
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    minHeight: 450,
                    maxHeight: 450,
                    overflow: 'visible',
                    backgroundColor: theme.palette.bg.second,
                    p: 2
                }}
            >
                <Typography variant="p" sx={{ textAlign: 'left' }}>
                    {title}
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
                        value={rating ?? ''}
                        size="small"
                        onChange={handleInputSliderChange}
                        onBlur={handleBlur}
                        inputProps={{ step: 1, min: 0, max: 100, type: 'number' }}
                        sx={{ '& .MuiInput-underline': { display: 'none' } }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, justifyContent: mode === "episode" ? 'space-between' : 'flex-end', width: '100%' }}>
                    {mode === "episode" && (
                        <InputBoxRegular
                            label="Times watched"
                            value={watchedCount}
                            onChange={handleWatchedChange}
                            inputProps={{ step: 1, min: 0, type: 'number' }}
                            sx={{ mb: 0 }}
                        />
                    )}
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                            label="Choose date"
                            value={selectedDate}
                            onChange={(newDate) => setSelectedDate(newDate)}
                            renderInput={(params) => (
                                <InputBox {...params} sx={{ mb: 0 }} />
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

                <DialogActions sx={{ p: 0 }}>
                    <MainButton onClick={onClose}>Cancel</MainButton>
                    <MainButton onClick={handleSubmit}>Save</MainButton>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
}

export default SeasonEpisodeDialog;
