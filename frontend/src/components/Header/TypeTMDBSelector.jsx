import React from 'react';
import { IconButton, Typography, useTheme } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setTypeTMDB, setCustomType } from '../../redux/slices/ConfigSlice';
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
    const { typeTMDB, customType } = useSelector((state) => state.config);
    // Кастомні типи користувача (свій список у кожного)
    const userTypes = useSelector((state) => state.auth.data?.typeCustom || []);
    const theme = useTheme();
    const location = useLocation();

    // Кастомні типи доступні на сторінках папок (дані з mongo): /folders та /folders/<name>
    const isFolderPage = location.pathname.startsWith('/folders');
    const showCustomTypes = isFolderPage && userTypes.length > 0;
    const activeCustomType = isFolderPage ? customType : '';

    const isActive = (codes) =>
        codes.length === typeTMDB.length && codes.every((code) => typeTMDB.includes(code));

    const activeCategory = TMDB_TYPES.find((c) => isActive(c.codes)) || TMDB_TYPES[0];
    // У тригері показуємо обраний кастомний тип, якщо він активний, інакше — категорію
    const triggerLabel = activeCustomType || activeCategory.name;

    const items = [
        ...TMDB_TYPES.map((cat) => ({
            key: cat.name,
            label: cat.name,
            // підсвічуємо категорію лише коли не обрано кастомний тип
            selected: !activeCustomType && isActive(cat.codes),
            // вибір категорії скидає фільтр кастомного типу
            onClick: () => {
                dispatch(setTypeTMDB(cat.codes));
                if (customType) dispatch(setCustomType(''));
            },
        })),
        // Кастомні типи користувача — лише на сторінці папки
        ...(showCustomTypes ? [{ key: '__divider__', divider: true }] : []),
        ...(showCustomTypes ? userTypes.map((type) => ({
            key: `custom_${type}`,
            label: type,
            selected: customType === type,
            icon: customType === type ? <CheckIcon fontSize="small" /> : null,
            // повторний клік знімає фільтр; вибір кастомного типу скидає фільтр movie/tv (показуємо все)
            onClick: () => {
                dispatch(setCustomType(customType === type ? '' : type));
                if (!isActive(['movie', 'tv'])) dispatch(setTypeTMDB(['movie', 'tv']));
            },
        })) : []),
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
                        {triggerLabel}
                    </Typography>
                </IconButton>
            )}
        />
    );
}

export default TypeTMDBSelector;
