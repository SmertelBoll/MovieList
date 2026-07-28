// Мови інтерфейсу та пошуку.
//
// `code`         — короткий код, який зберігається в налаштуваннях (redux/localStorage/профіль)
// `tmdbLanguage` — локаль у форматі TMDB (ISO 639-1 + ISO 3166-1), яку приймає параметр `language`
//
// Значення tmdbLanguage звірені з ендпоінтом TMDB /configuration/primary_translations:
// усі 22 локалі нижче є в його списку. Де TMDB пропонує кілька регіонів для однієї
// мови (напр. pt-BR / pt-PT, ar-SA / ar-AE), обрано варіант із найбільшим покриттям перекладів.
export const LANGUAGES = [
    { code: 'en', name: 'English', nativeName: 'English', tmdbLanguage: 'en-US' },
    { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', tmdbLanguage: 'uk-UA' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', tmdbLanguage: 'de-DE' },
    { code: 'fr', name: 'French', nativeName: 'Français', tmdbLanguage: 'fr-FR' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', tmdbLanguage: 'es-ES' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', tmdbLanguage: 'it-IT' },
    { code: 'pl', name: 'Polish', nativeName: 'Polski', tmdbLanguage: 'pl-PL' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', tmdbLanguage: 'pt-BR' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', tmdbLanguage: 'ja-JP' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', tmdbLanguage: 'ko-KR' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', tmdbLanguage: 'zh-CN' },
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', tmdbLanguage: 'tr-TR' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', tmdbLanguage: 'ar-SA' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', tmdbLanguage: 'hi-IN' },
    { code: 'cs', name: 'Czech', nativeName: 'Čeština', tmdbLanguage: 'cs-CZ' },
    { code: 'da', name: 'Danish', nativeName: 'Dansk', tmdbLanguage: 'da-DK' },
    { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', tmdbLanguage: 'el-GR' },
    { code: 'fi', name: 'Finnish', nativeName: 'Suomi', tmdbLanguage: 'fi-FI' },
    { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', tmdbLanguage: 'hu-HU' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', tmdbLanguage: 'nl-NL' },
    { code: 'no', name: 'Norwegian', nativeName: 'Norsk', tmdbLanguage: 'no-NO' },
    { code: 'sv', name: 'Swedish', nativeName: 'Svenska', tmdbLanguage: 'sv-SE' },
];

export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_TMDB_LANGUAGE = 'en-US';

const BY_CODE = LANGUAGES.reduce((acc, lang) => {
    acc[lang.code] = lang;
    return acc;
}, {});

// Короткий код -> локаль TMDB. Невідомий код відкочується на en-US,
// щоб запит до TMDB не пішов з порожнім чи хибним параметром.
export const getTmdbLanguage = (code) => BY_CODE[code]?.tmdbLanguage || DEFAULT_TMDB_LANGUAGE;

export const getLanguage = (code) => BY_CODE[code] || BY_CODE[DEFAULT_LANGUAGE];
