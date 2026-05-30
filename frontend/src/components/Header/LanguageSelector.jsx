import React from 'react';
import { IconButton, Typography, useTheme } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import { useSelector, useDispatch } from 'react-redux';
import { setLanguage } from '../../redux/slices/ConfigSlice';
import DropdownMenu from '../_customMUI/DropdownMenu';

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

    const items = LANGUAGES.map((lang) => ({
        key: lang.code,
        code: lang.code,
        label: lang.name,
        subLabel: lang.nativeName,
        selected: lang.code === language,
        onClick: () => dispatch(setLanguage(lang.code)),
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
