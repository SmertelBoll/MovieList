import React, { useState } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    useTheme
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setTypeTMDB } from '../../redux/slices/ConfigSlice';
import TuneIcon from '@mui/icons-material/Tune';

const TMDB_TYPES = [
    { name: 'All', codes: ['movie', 'tv'] },
    { name: 'Movie', codes: ['movie'] },
    { name: 'TV shows', codes: ['tv'] },
];

function TypeTMDBSelector() {
    const dispatch = useDispatch();
    const { typeTMDB } = useSelector((state) => state.config);
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState(null);
    const [open, setOpen] = useState(false);

    const handleOpen = (event) => {
        setAnchorEl(event.currentTarget);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleExited = () => {
        setAnchorEl(null);
    };

    const handleSelect = (codes) => {
        dispatch(setTypeTMDB(codes));
        handleClose();
    };

    React.useEffect(() => {
        if (open) {
            window.addEventListener('scroll', handleClose);
        }
        return () => {
            window.removeEventListener('scroll', handleClose);
        };
    }, [open]);

    // Знаходимо активну категорію за збігом масиву кодів
    const activeCategory = TMDB_TYPES.find(c =>
        c.codes.length === typeTMDB.length &&
        c.codes.every(code => typeTMDB.includes(code))
    ) || TMDB_TYPES[0];

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
                <TuneIcon sx={{ color: theme.palette.text.main }} />
                <Typography
                    variant="body2"
                    sx={{
                        fontWeight: 600,
                        color: theme.palette.text.main,
                        textTransform: 'uppercase',
                        display: { xs: 'none', sm: 'block' }
                    }}
                >
                    {activeCategory.name}
                </Typography>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                disableScrollLock={true}
                TransitionProps={{
                    onExited: handleExited
                }}
                PaperProps={{
                    sx: {
                        mt: 1,
                        width: 160,
                        borderRadius: 2,
                        boxShadow: 4,
                        bgcolor: 'bg.second',
                        '& .MuiList-root': {
                            p: 0
                        }
                    }
                }}
            >
                <Box sx={{ py: 1 }}>
                    {TMDB_TYPES.map((cat) => (
                        <MenuItem
                            key={cat.name}
                            onClick={() => handleSelect(cat.codes)}
                            selected={typeTMDB.length === cat.codes.length && typeTMDB.every(code => cat.codes.includes(code))}
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
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {cat.name}
                            </Typography>
                        </MenuItem>
                    ))}
                </Box>
            </Menu>
        </Box>
    );
}

export default TypeTMDBSelector;
