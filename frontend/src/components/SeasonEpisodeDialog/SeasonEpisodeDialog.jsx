import { Box, Checkbox, Dialog, DialogContent, DialogActions, FormControlLabel, useTheme, Typography } from '@mui/material';
import RatingInput from '../RatingInput';
import React, { useMemo, useState, useEffect } from 'react';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import MainButton from '../Buttons/MainButton';
import { parseDateOnly, toDateOnlyISO } from '../../utils/dates';
import { alertConfirm } from '../../alerts';
import DateField from '../DateField'

function SeasonEpisodeDialog({
    open,
    mode = "season", // "season" | "episode"
    title = "",
    initial = {},
    // New record (not in the DB yet): default the date to today. For an existing one an empty date means it
    // was removed on purpose.
    isNew = false,
    onClose,
    onSave,
    onDelete,
}) {
    const theme = useTheme();
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    );
    // Without reduced padding, to match the date field height (DatePicker).
    const InputBoxRegular = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, false),
        [theme.palette.bg.second, theme.palette.text.main]
    );


    const [rating, setRating] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [text, setText] = useState("");
    const [watchedCount, setWatchedCount] = useState(1);
    // Skipped episode: not watched and not planned to be; rating, views and date don't apply.
    const [skipped, setSkipped] = useState(false);

    useEffect(() => {
        if (!open) return;
        setRating(initial.rating ?? null);
        setSelectedDate(parseDateOnly(initial.dateAdded) || (isNew ? new Date() : null));
        setText(initial.comment ?? "");
        setWatchedCount(initial.watchedCount ?? 1);
        setSkipped(Boolean(initial.skipped));
    }, [open]);

    // Skipping clears the date (not watched), unskipping sets today.
    const handleSkippedChange = (checked) => {
        setSkipped(checked);
        setSelectedDate(checked ? null : new Date());
    };

    const skippedSx = skipped ? { opacity: 0.4, pointerEvents: 'none' } : {};

    const handleWatchedChange = (event) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        setWatchedCount(value < 0 ? 0 : value);
    };

    const handleSubmit = () => {
        onSave({
            rating: mode === "episode" && skipped ? null : rating,
            comment: text,
            dateAdded: toDateOnlyISO(selectedDate),
            ...(mode === "episode" ? { watchedCount: skipped ? 0 : watchedCount, skipped } : {})
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="p" sx={{ textAlign: 'left' }}>
                        {title}
                    </Typography>
                    {mode === "episode" && (
                        <FormControlLabel
                            control={<Checkbox checked={skipped} onChange={(e) => handleSkippedChange(e.target.checked)} />}
                            label="Skip"
                            sx={{ m: 0, flexShrink: 0 }}
                        />
                    )}
                </Box>

                <RatingInput value={rating} onChange={setRating} sx={skippedSx} />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: mode === "episode" ? 'space-between' : 'flex-end', width: '100%', ...skippedSx }}>
                    {mode === "episode" && (
                        <InputBoxRegular
                            label="Times watched"
                            value={watchedCount}
                            onChange={handleWatchedChange}
                            inputProps={{ step: 1, min: 0, type: 'number' }}
                            sx={{ mb: 0 }}
                        />
                    )}
                    <DateField value={selectedDate} onChange={(newDate) => setSelectedDate(newDate)} />
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
                    {!isNew && onDelete && (
                        <MainButton
                            onClick={() => alertConfirm(
                                mode === "episode"
                                    ? 'Delete this episode from your list?'
                                    : 'Delete this season and all its episodes from your list?',
                                onDelete
                            )}
                            sx={{
                                mr: 'auto',
                                backgroundColor: 'danger.main',
                                color: 'danger.contrastText',
                                '@media (hover: hover) and (pointer: fine)': { ':hover': { backgroundColor: 'danger.dark', color: 'danger.contrastText' } },
                            }}
                        >
                            Delete
                        </MainButton>
                    )}
                    <MainButton onClick={onClose}>Cancel</MainButton>
                    <MainButton onClick={handleSubmit}>Save</MainButton>
                </DialogActions>
            </DialogContent>
        </Dialog>
    );
}

export default SeasonEpisodeDialog;
