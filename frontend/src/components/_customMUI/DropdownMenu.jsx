import React, { useState, useMemo, useEffect } from 'react';
import { Box, Menu, MenuItem, Typography, Divider, InputAdornment, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TextFieldCustom from './TextFieldCustom';

/**
 * Універсальний випадаючий список.
 *
 * items: масив об'єктів:
 *   { key, label, subLabel, icon, endAdornment, selected, disabled, onClick, closeOnClick }
 *
 * renderTrigger: ({ onClick, open }) => ReactNode — елемент, що відкриває меню.
 */
function DropdownMenu({
    renderTrigger,
    items = [],
    searchable = false,
    searchPlaceholder = 'Search...',
    // (item, query) => bool. За замовчуванням фільтруємо за label/subLabel
    filterItem,
    width = 200,
    paperSx = {},
    anchorOrigin,
    transformOrigin,
    closeOnScroll = false,
    stopPropagation = false,
    emptyText = 'No results',
}) {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const SearchBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.main, theme.palette.text.main, false),
        [theme.palette.bg.main, theme.palette.text.main]
    );

    const handleOpen = (event) => {
        if (stopPropagation) event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleClose = (event) => {
        if (stopPropagation && event?.stopPropagation) event.stopPropagation();
        setOpen(false);
        setSearchQuery('');
    };

    const handleExited = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (event, item) => {
        if (stopPropagation) event.stopPropagation();
        if (item.disabled) return;
        item.onClick?.(event);
        if (item.closeOnClick !== false) handleClose(event);
    };

    useEffect(() => {
        if (closeOnScroll && open) {
            const onScroll = () => handleClose();
            window.addEventListener('scroll', onScroll);
            return () => window.removeEventListener('scroll', onScroll);
        }
    }, [closeOnScroll, open]);

    const filteredItems = useMemo(() => {
        if (!searchable || searchQuery.trim() === '') return items;
        const q = searchQuery.toLowerCase();
        const defaultFilter = (item) =>
            [item.label, item.subLabel]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q));
        return items.filter((item) => (filterItem ? filterItem(item, q) : defaultFilter(item)));
    }, [items, searchable, searchQuery, filterItem]);

    return (
        <Box>
            {renderTrigger({ onClick: handleOpen, open })}

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableScrollLock
                disableAutoFocusItem={searchable}
                anchorOrigin={anchorOrigin}
                transformOrigin={transformOrigin}
                TransitionProps={{ onExited: handleExited }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            width,
                            borderRadius: 2,
                            boxShadow: 4,
                            bgcolor: 'bg.second',
                            color: 'text.main',
                            '& .MuiList-root': { p: 0 },
                            ...paperSx,
                        },
                    },
                }}
            >
                {searchable && (
                    <Box>
                        <Box sx={{ p: 2, pb: 1 }}>
                            <SearchBox
                                fullWidth
                                size="small"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon fontSize="small" />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                        </Box>
                        <Divider />
                    </Box>
                )}

                <Box sx={{ py: searchable ? 0 : 1, overflowY: 'auto', maxHeight: searchable ? 300 : undefined }}>
                    {filteredItems.length > 0 ? (
                        filteredItems.map((item) => (
                            <MenuItem
                                key={item.key ?? item.label}
                                onClick={(e) => handleItemClick(e, item)}
                                selected={Boolean(item.selected)}
                                disabled={Boolean(item.disabled)}
                                sx={{
                                    py: 1,
                                    px: 2,
                                    gap: 1,
                                    '&.Mui-selected': {
                                        bgcolor: 'yellow.main',
                                        color: 'text.dark',
                                        '&:hover': { bgcolor: 'yellow.dark', color: 'text.dark' },
                                    },
                                    '&:hover': {
                                        bgcolor: 'yellow.main',
                                        color: 'text.dark',
                                    },
                                }}
                            >
                                {item.icon && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>{item.icon}</Box>
                                )}
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    {typeof item.label === 'string' ? (
                                        <Typography variant="body2" noWrap>
                                            {item.label}
                                        </Typography>
                                    ) : (
                                        item.label
                                    )}
                                    {item.subLabel && (
                                        <Typography variant="caption" sx={{ opacity: 0.7 }} noWrap>
                                            {item.subLabel}
                                        </Typography>
                                    )}
                                </Box>
                                {item.endAdornment && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>{item.endAdornment}</Box>
                                )}
                            </MenuItem>
                        ))
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                {emptyText}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Menu>
        </Box>
    );
}

export default DropdownMenu;
