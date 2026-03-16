import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Divider,
    InputAdornment,
    useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LanguageIcon from '@mui/icons-material/Language';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage } from '../../redux/slices/ConfigSlice';
import TextFieldCustom from '../_customMUI/TextFieldCustom';

const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
];

function LanguageSelector() {
    const dispatch = useDispatch();
    const { language } = useSelector((state) => state.config);
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const SearchBox = useMemo(() => TextFieldCustom(
        theme.palette.bg.main,
        theme.palette.text.main,
        false
    ), [theme.palette.bg.main, theme.palette.text.main]);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSearchQuery('');
    };

    const handleExited = () => {
        setAnchorEl(null);
    };

    const handleSelect = (code) => {
        dispatch(setLanguage(code));
        handleClose();
    };

    const filteredLanguages = useMemo(() => {
        return LANGUAGES.filter(lang =>
            lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.code.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [searchQuery]);

    useEffect(() => {
        if (open) {
            window.addEventListener('scroll', handleClose);
        }
        return () => {
            window.removeEventListener('scroll', handleClose);
        };
    }, [open]);

    return (
        <Box>
            <IconButton
                onClick={handleOpen}
                color="inherit"
                sx={{
                    borderRadius: 2,
                    p: 1,
                    gap: 1,
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <LanguageIcon sx={{ color: theme.palette.text.main }} />
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.text.main,
                        textTransform: 'uppercase',
                        display: { xs: 'none', sm: 'block' }
                    }}
                >
                    {language}
                </Typography>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableAutoFocusItem={true}
                disableScrollLock={true}
                TransitionProps={{
                    onExited: handleExited
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        width: 250,
                        maxHeight: 400,
                        borderRadius: 2,
                        boxShadow: 4,
                        bgcolor: 'bg.second',
                        '& .MuiList-root': {
                            p: 0
                        }
                    }
                }}
            >
                <Box sx={{ p: 2, pb: 1 }}>
                    <SearchBox
                        fullWidth
                        size="small"
                        placeholder="Search language..."
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
                            }
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2,
                            }
                        }}
                    />
                </Box>
                <Divider />
                <Box sx={{ overflowY: 'auto', maxHeight: 300 }}>
                    {filteredLanguages.length > 0 ? (
                        filteredLanguages.map((lang) => (
                            <MenuItem
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                selected={lang.code === language}
                                sx={{
                                    py: 1,
                                    px: 2,
                                    gap: 1,
                                    '&.Mui-selected': {
                                        bgcolor: 'bg.selected',
                                        color: 'text.main',
                                        '&:hover': { bgcolor: 'yellow.main', color: 'text.dark' }
                                    },
                                    '&:hover': {
                                        bgcolor: 'yellow.main',
                                        color: 'text.dark'
                                    }
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 25 }}>
                                    {lang.code.toUpperCase()}
                                </Typography>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body2">{lang.name}</Typography>
                                    <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                        {lang.nativeName}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))
                    ) : (
                        <Box sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                                No languages found
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Menu>
        </Box>
    );
}

export default LanguageSelector;
