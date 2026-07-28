import React from 'react';
import { IconButton, Typography, useTheme } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useSelector, useDispatch } from 'react-redux';
import { changeLanguage } from '../../redux/slices/ConfigSlice';
import DropdownMenu from '../_customMUI/DropdownMenu';
import { LANGUAGES } from '../../utils/languages';

function LanguageSelector() {
    const dispatch = useDispatch();
    const { language } = useSelector((state) => state.config);
    const theme = useTheme();

    const items = LANGUAGES.map((lang) => ({
        key: lang.code,
        code: lang.code,
        label: lang.name,
        subLabel: lang.nativeName,
        selected: lang.code === language,
        onClick: () => dispatch(changeLanguage(lang.code)),
        icon: (
            <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 25 }}>
                {lang.code.toUpperCase()}
            </Typography>
        ),
    }));

    const filterItem = (item, q) =>
        item.label.toLowerCase().includes(q) ||
        item.subLabel.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);

    return (
        <DropdownMenu
            width={250}
            searchable
            searchPlaceholder="Search language..."
            filterItem={filterItem}
            emptyText="No languages found"
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
                    <LanguageIcon sx={{ color: theme.palette.text.main }} />
                    <Typography
                        variant="body2"
                        sx={{
                            fontWeight: 600,
                            color: theme.palette.text.main,
                            textTransform: 'uppercase',
                            display: { xs: 'none', sm: 'block' },
                        }}
                    >
                        {language}
                    </Typography>
                </IconButton>
            )}
        />
    );
}

export default LanguageSelector;
