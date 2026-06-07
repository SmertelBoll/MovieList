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
    // Кастомні типи користувача (свій список у кожного)
    const userTypes = useSelector((state) => state.auth.data?.typeCustom || []);
    const theme = useTheme();
    const location = useLocation();

    // Кастомні типи доступні на сторінках папок (дані з mongo): /folders та /folders/<name>
    const isFolderPage = location.pathname.startsWith('/folders');

    // Залишаючи сторінки папок, скидаємо фільтр кастомних типів,
    // щоб при поверненні був активний обраний tmdbType
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
    // Назва тегу для показу (спецзначення → "No tag")
    const tagLabel = (t) => (t === NO_TAG ? 'No tag' : t);

    // У тригері завжди показуємо tmdbType на початку, далі через "|" — обрані теги
    const triggerLabel = activeCustomTypes.length
        ? `${activeCategory.name} | ${activeCustomTypes.map(tagLabel).join(', ')}`
        : activeCategory.name;

    // Перемикання одного кастомного типу в множинному виборі
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
            // tmdbType і customTypes — незалежні фільтри (комбінуються через AND)
            onClick: () => dispatch(setTypeTMDB(cat.codes)),
        })),
        // Кастомні типи користувача — лише на сторінці папки, множинний вибір
        ...(showCustomTypes ? [{ key: '__divider__', divider: true }] : []),
        ...(showCustomTypes ? [...userTypes].map((type) => ({
            key: `custom_${type}`,
            label: type,
            selected: customTypes.includes(type),
            icon: customTypes.includes(type) ? <CheckIcon fontSize="small" /> : null,
            // не закриваємо меню, щоб зручно обрати кілька
            closeOnClick: false,
            onClick: () => toggleCustomType(type),
        })) : []),
        // Окрема опція — показати збережене без тегів
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
