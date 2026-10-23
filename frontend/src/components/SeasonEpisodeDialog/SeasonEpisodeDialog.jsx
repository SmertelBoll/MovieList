import { Box, Checkbox, Dialog, DialogContent, DialogActions, FormControlLabel, useTheme, Typography } from '@mui/material';
import RatingSlider from '../RatingSlider';
import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import MainButton from '../Buttons/MainButton';
import DropdownMenu from '../_customMUI/DropdownMenu';
import { getRatingLevels, hasRatingSystem } from '../../utils/ratingSystem';
import { parseDateOnly, toDateOnlyISO } from '../../utils/dates';
import { alertConfirm } from '../../alerts';
import RatingDot from '../RatingDot';
import CheckIcon from '@mui/icons-material/Check';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

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

    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || []);
    const useRatingSystem = hasRatingSystem(ratingSystem);
    const dateFormat = useSelector((state) => state.config.dateFormat);
    const ratingLevels = getRatingLevels(ratingSystem);

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

                {useRatingSystem ? (
                    (() => {
                        const current = ratingLevels.find((l) => l.value === rating);
                        return (
                            <Box sx={{ pt: 1, ...skippedSx }}>
                                <DropdownMenu
                                    width={240}
                                    items={[
                                        ...ratingLevels.map((lvl) => ({
                                            key: lvl.value,
                                            label: lvl.name,
                                            selected: rating === lvl.value,
                                            icon: <RatingDot color={lvl.color} />,
                                            endAdornment: rating === lvl.value ? <CheckIcon fontSize="small" /> : null,
                                            onClick: () => setRating(lvl.value),
                                        })),
                                        { key: '__divider__', divider: true },
                                        {
                                            key: '__none__',
                                            label: 'No rating',
                                            selected: rating == null,
                                            onClick: () => setRating(null),
                                        },
                                    ]}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                    renderTrigger={({ onClick }) => (
                                        <Box
                                            onClick={onClick}
                                            sx={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                gap: 1, width: '100%', minHeight: 40, boxSizing: 'border-box', px: 1,
                                                borderRadius: '4px', cursor: 'pointer', border: '1px solid',
                                                borderColor: 'text.main',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                {current && <RatingDot color={current.color} />}
                                                <Typography variant="body2" noWrap sx={{ color: current ? 'text.main' : 'text.secondary' }}>                                                    {current ? current.name : 'Rating'}                                                </Typography>
                                            </Box>
                                            <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                                        </Box>
                                    )}
                                />
                            </Box>
                        );
                    })()
                ) : (
                    <RatingSlider value={typeof rating === 'number' ? rating : 0} onChange={handleSliderChange} sx={skippedSx}>
                        <InputBox
                            value={rating ?? ''}
                            size="small"
                            onChange={handleInputSliderChange}
                            onBlur={handleBlur}
                            inputProps={{ step: 1, min: 0, max: 100, type: 'number' }}
                            sx={{ width: 112, flexShrink: 0, mt: -0.5, '& .MuiInput-underline': { display: 'none' } }}
                        />
                    </RatingSlider>
                )}

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
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        {/* x-date-pickers v7 dropped renderInput: the field is plugged in via slots (otherwise unstyled, with a yellow primary focus ring). */}
                        <DatePicker
                            label="Choose date"
                            format={dateFormat}
                            value={selectedDate}
                            onChange={(newDate) => setSelectedDate(newDate)}
                            slots={{ textField: InputBoxRegular }}
                            slotProps={{
                                textField: { fullWidth: true, sx: { mb: 0 } },
                                field: { clearable: true },
                            }}
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
