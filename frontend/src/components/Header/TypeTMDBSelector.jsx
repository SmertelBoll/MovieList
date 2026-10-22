import React, { useEffect } from 'react';
import { IconButton, Typography, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setTypeTMDB, setCustomTypes, NO_TAG } from '../../redux/slices/ConfigSlice';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';
import DropdownMenu from '../_customMUI/DropdownMenu';

const TMDB_TYPES = [
    { name: 'All', codes: ['movie', 'tv'] },
    { name: 'Movie', codes: ['movie'] },
    { name: 'TV shows', codes: ['tv'] },
];

function TypeTMDBSelector() {
    const dispatch = useDispatch();
    const { typeTMDB, customTypes } = useSelector((state) => state.config);
    const userTypes = useSelector((state) => state.auth.data?.typeCustom || []);
    const theme = useTheme();
    const location = useLocation();

    // Custom types exist where data comes from mongo: folder pages and the Updates page.
    const isFolderPage = location.pathname.startsWith('/folders')
        || location.pathname.startsWith('/updates');

    // Leaving folder pages resets the custom-type filter so the chosen tmdbType is active on return.
    useEffect(() => {
        if (!isFolderPage && customTypes.length) {
            dispatch(setCustomTypes([]));
        }
    }, [isFolderPage, customTypes.length, dispatch]);

    const showCustomTypes = isFolderPage && userTypes.length > 0;
    const activeCustomTypes = isFolderPage ? customTypes : [];

    const isActive = (codes) =>
        codes.length === typeTMDB.length && codes.every((code) => typeTMDB.includes(code));

    const activeCategory = TMDB_TYPES.find((c) => isActive(c.codes)) || TMDB_TYPES[0];
    const tagLabel = (t) => (t === NO_TAG ? 'No tag' : t);

    const triggerLabel = activeCustomTypes.length
        ? `${activeCategory.name} | ${activeCustomTypes.map(tagLabel).join(', ')}`
        : activeCategory.name;

    const toggleCustomType = (type) => {
        const next = customTypes.includes(type)
            ? customTypes.filter((t) => t !== type)
            : [...customTypes, type];
        dispatch(setCustomTypes(next));
    };

    const items = [
        ...TMDB_TYPES.map((cat) => ({
            key: cat.name,
            label: cat.name,
            selected: isActive(cat.codes),
            // tmdbType and customTypes are independent filters (AND).
            onClick: () => dispatch(setTypeTMDB(cat.codes)),
        })),
        ...(showCustomTypes ? [{ key: '__divider__', divider: true }] : []),
        ...(showCustomTypes ? [...userTypes].map((type) => ({
            key: `custom_${type}`,
            label: type,
            selected: customTypes.includes(type),
            icon: customTypes.includes(type) ? <CheckIcon fontSize="small" /> : null,
            closeOnClick: false,
            onClick: () => toggleCustomType(type),
        })) : []),
        ...(showCustomTypes ? [{
            key: 'no_tag',
            label: 'No tag',
            selected: customTypes.includes(NO_TAG),
            icon: customTypes.includes(NO_TAG) ? <CheckIcon fontSize="small" /> : null,
            closeOnClick: false,
            onClick: () => toggleCustomType(NO_TAG),
        }] : []),
    ];

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
                        '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'action.hover' } },
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
                        {triggerLabel}
                    </Typography>
                </IconButton>
            )}
        />
    );
}

export default TypeTMDBSelector;
