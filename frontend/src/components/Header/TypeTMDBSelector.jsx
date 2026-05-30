import React from 'react';
import { IconButton, Typography, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { setTypeTMDB } from '../../redux/slices/ConfigSlice';
import TuneIcon from '@mui/icons-material/Tune';
import DropdownMenu from '../_customMUI/DropdownMenu';

const TMDB_TYPES = [
    { name: 'All', codes: ['movie', 'tv'] },
    { name: 'Movie', codes: ['movie'] },
    { name: 'TV shows', codes: ['tv'] },
];

function TypeTMDBSelector() {
    const dispatch = useDispatch();
    const { typeTMDB } = useSelector((state) => state.config);
    const theme = useTheme();

    const isActive = (codes) =>
        codes.length === typeTMDB.length && codes.every((code) => typeTMDB.includes(code));

    const activeCategory = TMDB_TYPES.find((c) => isActive(c.codes)) || TMDB_TYPES[0];

    const items = TMDB_TYPES.map((cat) => ({
        key: cat.name,
        label: cat.name,
        selected: isActive(cat.codes),
        onClick: () => dispatch(setTypeTMDB(cat.codes)),
    }));

    return (
        <DropdownMenu
            width={160}
            closeOnScroll
            items={items}
            renderTrigger={({ onClick }) => (
                <IconButton
                    onClick={onClick}
                    color="inherit"
                    sx={{
                        borderRadius: 2,
                        p: 1,
                        gap: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <TuneIcon sx={{ color: theme.palette.text.main }} />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: theme.palette.text.main,
                            textTransform: 'uppercase',
                            display: { xs: 'none', sm: 'block' },
                        }}
                    >
                        {activeCategory.name}
                    </Typography>
                </IconButton>
            )}
        />
    );
}

export default TypeTMDBSelector;
