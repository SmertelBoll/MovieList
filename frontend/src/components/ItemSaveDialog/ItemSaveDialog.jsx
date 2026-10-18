import { Box, Dialog, DialogContent, DialogActions, Slider, useTheme, useMediaQuery, Typography } from '@mui/material';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import TextFieldCustom from '../_customMUI/TextFieldCustom';
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import MainButton from '../Buttons/MainButton';
import instance from '../../axios';
import { alertError, alertConfirm, alertSuccess } from '../../alerts';
import useTextPrompt from '../_customMUI/useTextPrompt';
import SideBar from '../SideBar/SideBar';
import FolderThumb from '../SideBar/FolderThumb';
import RatingDot from '../RatingDot';
import DropdownMenu from '../_customMUI/DropdownMenu';
import { getRatingLevels, hasRatingSystem as hasRatingSystemUtil } from '../../utils/ratingSystem';
import { parseDateOnly, toDateOnlyISO } from '../../utils/dates';
import { getTags } from '../../utils/tags';
import { useDispatch, useSelector } from 'react-redux';
import { setUserTypeCustom } from '../../redux/slices/AuthSlice';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';

const DEFAULT_RATE = null;
const DEFAULT_DATE = new Date();
const DEFAULT_TEXT = "";
const DEFAULT_TYPE_CUSTOM = [];

function ItemSaveDialog({
    isOpenDialogAdd,
    isOpenDialogEdit = false,
    isDeleteItem = false,
    handleCloseDialog,
    selectedFolder,
    setSelectedFolder,
    selectedItem,
    // update state if folder page
    objectOfFolderPage = null,
    setItems = () => { },
    sortItems = () => { },
    onAfterDelete = () => { },
    onSaved = null,
    // sidebar props
    folders,
    setFolders,
    setIsGetFolders,
}) {
    const theme = useTheme();
    // Введення тексту — власний діалог замість swal2-інпута
    const [promptText, textPromptDialog] = useTextPrompt()
    // Поточна мова — зберігається разом з елементом, щоб було видно,
    // якою мовою записано tmdbTitle
    const { language, dateFormat } = useSelector((state) => state.config)
    // Нижче sm діалог на весь екран, нижче md дві колонки складаються в одну
    const isFullScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isStacked = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch();
    // Список кастомних типів користувача (свій у кожного)
    const userTypes = useSelector((state) => state.auth.data?.typeCustom || []);
    // Власна система оцінок користувача
    const ratingSystem = useSelector((state) => state.auth.data?.ratingSystem || []);
    const hasRatingSystem = hasRatingSystemUtil(ratingSystem);
    const ratingLevels = getRatingLevels(ratingSystem);
    const InputBox = useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.bg.second, theme.palette.text.main]
    );

    // Підпис кнопки зберігання. Під час анімації закриття обидва прапорці вже false —
    // без запам'ятованого значення на мить зʼявлявся запасний текст.
    // Папка, в якій елемент лежав на момент відкриття редагування. Видалення йде саме з неї,
    // навіть якщо в сайдбарі вже обрано іншу папку для переносу.
    const editFolderRef = useRef(null);
    const submitLabelRef = useRef('Add');
    if (isOpenDialogAdd) submitLabelRef.current = 'Add';
    else if (isOpenDialogEdit) submitLabelRef.current = 'Update';

    const [rating, setRating] = useState(DEFAULT_RATE);
    const [selectedDate, setSelectedDate] = useState(DEFAULT_DATE);
    const [text, setText] = useState(DEFAULT_TEXT);
    const [typeCustom, setTypeCustom] = useState(DEFAULT_TYPE_CUSTOM);

    // -- USE EFFECTS -- //
    // Відкрито додавання фільму в папку
    useEffect(() => {
        if (!isOpenDialogAdd) return;

        setRating(DEFAULT_RATE);
        setSelectedDate(DEFAULT_DATE);
        setText(DEFAULT_TEXT);
        setTypeCustom(DEFAULT_TYPE_CUSTOM);
    }, [isOpenDialogAdd]);

    // Відкрито редагування фільму в папці
    useEffect(() => {
        if (!selectedItem || !isOpenDialogEdit) return;

        editFolderRef.current = selectedFolder;
        setRating(selectedItem.rating);
        // Календарний день, а не момент часу — інакше дата стрибає на добу
        // залежно від часового поясу (див. utils/dates.js).
        // null — дата не вказана; підставляти сьогодні не можна, інакше
        // видалену дату не вийшло б зберегти видаленою.
        setSelectedDate(parseDateOnly(selectedItem.dateAdded));
        setText(selectedItem.comment);
        setTypeCustom(getTags(selectedItem.customType));
    }, [isOpenDialogEdit]);

    // Видалення фільму з папки
    useEffect(() => {
        if (!isDeleteItem || !selectedItem || !selectedFolder) return;

        handleDeleteItem(selectedItem, selectedFolder);
    }, [isDeleteItem]);

    // -- HELP FUNCTIONS -- //
    // Оцінка
    const marks = Array.from({ length: 11 }, (_, index) => ({
        value: 10 * index,
        label: 10 * index,
    }));

    // 0 означає "оцінки немає" — зберігаємо як null
    const handleSliderChange = (event, newValue) => {
        setRating(newValue === 0 ? null : newValue);
    };
    const handleInputSliderChange = (event) => {
        const value = event.target.value;
        setRating(value === '' || Number(value) === 0 ? null : Number(value));
    };
    const handleBlur = () => {
        if (rating > 100) {
            setRating(100);
        } else if (rating < 0) {
            setRating(null);
        }
    };

    // Дата
    const handleDateChange = (newDate) => {
        setSelectedDate(newDate);
    };

    // Папка
    const handleFolderClick = (folder) => {
        setSelectedFolder(folder);
    };

    // Кастомний тип
    // Теги можна вибрати кілька: клік додає тег, повторний клік по обраному — знімає
    const handleSelectType = (type) => {
        setTypeCustom((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
    };

    // Додавання нового типу до списку користувача (зберігається в акаунті)
    const handleAddType = async () => {
        const newType = await promptText({
            title: 'New tag',
            label: 'Tag name',
            placeholder: 'e.g. Anime, Documentary...',
            confirmLabel: 'Add',
        });
        if (!newType) return;

        if (userTypes.includes(newType)) {
            setTypeCustom((prev) => (prev.includes(newType) ? prev : [...prev, newType]));
            return;
        }

        const newList = [...userTypes, newType];
        try {
            await instance.patch('/auth/settings', { typeCustom: newList });
            dispatch(setUserTypeCustom(newList));
            setTypeCustom((prev) => [...prev, newType]);
        } catch (err) {
            console.warn(err);
            alertError(err);
        }
    };

    // Нова папка з випадайки (мобільний вигляд): питаємо назву, створюємо й одразу вибираємо її.
    // Перейменування, порядок і видалення папок на малих екранах недоступні — це робиться на сторінці Folders.
    const handleCreateFolder = async () => {
        const name = await promptText({
            title: 'New folder',
            label: 'Folder name',
            confirmLabel: 'Create',
        });
        if (!name) return;

        try {
            const res = await instance.post('/folders', { name });
            const created = res.data.results;
            setFolders((prev) => [...prev, created]);
            setSelectedFolder(created);
        } catch (err) {
            console.warn(err);
            alertError(err);
        }
    };

    // -- API -- //
    // додавання фільму в папку (frontend)
    const addItem = (item) => {
        setItems(prev => sortItems([...prev, item]));
    }
    // оновлення фільму в папці (frontend)
    const updateItem = (item) => {
        setItems(prev => sortItems(prev.map(el => el._id === item._id ? item : el)));
    }
    // видалення фільму з папки (frontend)
    const removeItem = (item) => {
        setItems(prev => prev.filter(el => el._id !== item._id));
    }
    // додавання фільму в папку / оновлення фільму в папці (backend)
    const handleSubmit = () => {
        if (!selectedFolder) {
            alertError(null, 'Choose some folder!', '');
            return;
        }

        if (isOpenDialogAdd) {
            const tmdbType = selectedItem.media_type

            let params = {
                folderName: selectedFolder.name,
                tmdbId: selectedItem.id,
                dateAdded: toDateOnlyISO(selectedDate),
                rating: rating,
                comment: text,
                customType: typeCustom,
                // Фіксуємо, якою мовою збережено tmdbTitle нижче
                language: language
            }

            if (tmdbType === "movie") {
                params.tmdbTitle = selectedItem.title;
            }
            else if (tmdbType === "tv") {
                params.tmdbTitle = selectedItem.name;
                params.level = "tv"
            }

            instance
                .post(`/${tmdbType}`, params)
                .then((res) => {
                    alertSuccess(`${tmdbType} successfully added`);
                    if (objectOfFolderPage) {
                        addItem({
                            ...selectedItem,
                            ...res.data.results,
                        });
                    }
                    onSaved?.({ ...selectedItem, ...res.data.results });
                    handleCloseDialog();
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        }
        else if (isOpenDialogEdit) {
            const tmdbType = selectedItem.media_type

            let params = {
                folderName: selectedFolder.name,
                tmdbId: selectedItem.id,
                dateAdded: toDateOnlyISO(selectedDate),
                rating: rating,
                comment: text,
                customType: typeCustom
            }

            if (tmdbType === "movie") {
                params.tmdbTitle = selectedItem.title;
            }
            else if (tmdbType === "tv") {
                params.tmdbTitle = selectedItem.name;
            }

            instance
                .patch(`/${tmdbType}/${selectedItem._id}`, {
                    folderName: selectedFolder.name,
                    dateAdded: toDateOnlyISO(selectedDate),
                    rating: rating,
                    comment: text,
                    customType: typeCustom
                })
                .then((res) => {
                    alertSuccess(`${tmdbType} successfully updated`);
                    if (objectOfFolderPage?.name !== selectedFolder.name) {
                        removeItem(res.data.results);
                    } else {
                        updateItem({
                            ...selectedItem,
                            ...res.data.results,
                        });
                    }
                    onSaved?.({ ...selectedItem, ...res.data.results });
                    handleCloseDialog();
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        }
    };
    // видалення фільму з папки (backend)
    const handleDeleteItem = (item, folder) => {
        const title = item.tmdbTitle || item.title || item.name || "this item";
        alertConfirm(`Are you sure you want to delete "${title}" from this folder?`, () => {
            instance
                .delete(`/${item.media_type}`, {
                    data: {
                        mongoId: item._id,
                        folderName: folder.name
                    }
                })
                .then((res) => {
                    alertSuccess(`${item.media_type} successfully deleted`);
                    removeItem(item);
                    onAfterDelete();
                    handleCloseDialog()
                })
                .catch((err) => {
                    console.warn(err);
                    alertError(err);
                });
        });
    };

    return (
        <>
        <Dialog
            open={isOpenDialogAdd || isOpenDialogEdit}
            onClose={handleCloseDialog}
            fullWidth
            maxWidth="md"
            fullScreen={isFullScreen}
            disableEnforceFocus
        >
            <DialogContent
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: { xs: 2, md: 3 },
                    // На весь екран висоту диктує вікно, інакше — фіксовані 450px
                    minHeight: { xs: 'auto', md: 450 },
                    maxHeight: { xs: 'none', md: 450 },
                    overflowY: { xs: 'auto', md: 'visible' },
                    overflowX: 'visible',
                    backgroundColor: theme.palette.bg.second,
                    p: 2
                }}
            >
                {/* LEFT: Folders — бічна панель лише на широких екранах. На вузьких вона мала б власний скрол,
                    тому там папку вибирає випадайка в правому блоці. */}
                {!isStacked && (
                <Box sx={{
                    flex: { xs: '0 0 auto', md: 1 },
                    minWidth: 0,
                    // У колонку розділювач має бути знизу, а не збоку
                    borderRight: { xs: 'none', md: '1px solid' },
                    borderBottom: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                    pb: { xs: 2, md: 0 }
                }}>
                    <SideBar
                        folders={folders}
                        setFolders={setFolders}
                        setIsGetFolders={setIsGetFolders}
                        handleClickToFolder={handleFolderClick}
                        selectedFolder={selectedFolder}
                        sx={{
                            // Складеним списком папок не даємо з'їсти весь екран
                            maxHeight: { xs: '30vh', md: '100%' },
                            overflowY: 'auto',
                            p: 0,
                            backgroundColor: theme.palette.bg.second,
                            pr: { xs: 0, md: 2 }
                        }}
                    />
                </Box>

                )}

                {/* RIGHT: Description */}
                <Box sx={{ flex: { xs: '1 1 auto', md: 2 }, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* flex: 1 притискає кнопки до низу — доречно лише при фіксованій
                        висоті 450px. На весь екран це давало величезну порожнечу. */}
                    <Box sx={{ flex: { xs: '0 0 auto', md: 1 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Typography variant="p" sx={{ textAlign: 'left' }}>
                            Save {selectedItem.tmdbType} to {
                                selectedFolder?.name
                                    ? selectedFolder?.name.length > 20
                                        ? `"${selectedFolder?.name.slice(0, 20)}..."`
                                        : `"${selectedFolder?.name}"`
                                    : '...'
                            }

                        </Typography>
                        {/* Вузькі екрани: вибір папки випадайкою замість бічної панелі зі скролом */}
                        {isStacked && (
                            <DropdownMenu
                                width={280}
                                items={[
                                    ...[...(folders || [])].sort((x, y) => y.order - x.order).map((folder) => {
                                        const isSelected = Boolean(selectedFolder && selectedFolder.name === folder.name);
                                        return {
                                            key: folder.name,
                                            label: folder.name,
                                            icon: <FolderThumb folder={folder} size={20} />,
                                            selected: isSelected,
                                            endAdornment: isSelected ? <CheckIcon fontSize="small" /> : null,
                                            onClick: () => setSelectedFolder(folder),
                                        };
                                    }),
                                    { key: '__divider__', divider: true },
                                    {
                                        key: '__new__',
                                        label: 'New folder',
                                        icon: <AddIcon fontSize="small" />,
                                        onClick: handleCreateFolder,
                                    },
                                ]}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                renderTrigger={({ onClick }) => (
                                    <Box
                                        onClick={onClick}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            width: '100%',
                                            minHeight: 40,
                                            boxSizing: 'border-box',
                                            px: 1,
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: 'text.main',
                                            color: selectedFolder?.name ? 'text.main' : 'text.secondary',
                                        }}
                                    >
                                        {selectedFolder?.name && <FolderThumb folder={selectedFolder} size={20} />}
                                        <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                                            {selectedFolder?.name || 'Choose a folder'}
                                        </Typography>
                                        <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                                    </Box>
                                )}
                            />
                        )}
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: 'stretch',
                            gap: 2,
                            width: '100%'
                        }}>
                            {/* Дата — зліва */}
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    {/* x-date-pickers v7: renderInput видалено. Через нього поле
                                        лишалось нестилізованим і при фокусі бралo жовту обводку
                                        з primary. Тепер поле підставляється через slots. */}
                                    <DatePicker
                                        label="Choose date"
                                        // Формат дати з профілю
                                        format={dateFormat}
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        slots={{ textField: InputBox }}
                                        slotProps={{
                                            textField: {
                                                fullWidth: true,
                                                // У InputBox зменшений padding, тож поле ~39px, а не 56px.
                                                // Без size="small" MUI рахує лейбл під повну висоту
                                                // і в порожньому полі той з'їжджає до низу.
                                                size: 'small',
                                                sx: { width: '100%', mb: 0 },
                                            },
                                            // Хрестик очищення — дата не обов'язкова,
                                            // запис може лежати в папці зовсім без неї
                                            field: { clearable: true },
                                        }}
                                    />
                                </LocalizationProvider>
                            </Box>

                            {/* Випадайка тегів — справа, така ж ширина і висота як дата */}
                            <Box sx={{ flex: 1, minWidth: 0, display: 'flex', '& > div': { width: '100%', display: 'flex' } }}>
                            <DropdownMenu
                                width={200}
                                items={[
                                    ...userTypes.map((type) => ({
                                        key: type,
                                        label: type,
                                        selected: typeCustom.includes(type),
                                        icon: typeCustom.includes(type) ? <CheckIcon fontSize="small" /> : null,
                                        // Меню лишається відкритим — можна відмітити кілька тегів підряд
                                        closeOnClick: false,
                                        onClick: () => handleSelectType(type),
                                    })),
                                    ...(userTypes.length > 0 ? [{ key: '__divider__', divider: true }] : []),
                                    {
                                        key: '__add__',
                                        label: 'Add tag',
                                        icon: <AddIcon fontSize="small" />,
                                        onClick: handleAddType,
                                    },
                                ]}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                renderTrigger={({ onClick }) => (
                                    <Box
                                        onClick={onClick}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 0.5,
                                            width: '100%',
                                            minHeight: 40,        // тягнеться до висоти поля дати
                                            boxSizing: 'border-box',
                                            px: 1,
                                            borderRadius: '4px', // як у блока вибору дати
                                            cursor: 'pointer',
                                            border: '1px solid',
                                            borderColor: 'text.main',
                                            color: typeCustom.length ? 'text.main' : 'text.secondary',
                                            transition: 'border-color 0.15s',
                                            '@media (hover: hover)': { '&:hover': { borderColor: 'text.main' } },
                                        }}
                                    >
                                        <Typography variant="body2" noWrap>
                                            {typeCustom.length ? typeCustom.join(', ') : 'Tags'}
                                        </Typography>
                                        <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                                    </Box>
                                )}
                            />
                            </Box>
                        </Box>
                        {hasRatingSystem ? (
                            // Власна система оцінок — вибір рівня через випадайку
                            (() => {
                                const current = ratingLevels.find((l) => l.value === rating);
                                return (
                                    <Box>
                                        <DropdownMenu
                                            width={240}
                                            items={[
                                                ...ratingLevels.map((lvl) => ({
                                                    key: lvl.value,
                                                    label: lvl.name,
                                                    selected: rating === lvl.value,
                                                    // Кружечок кольору рівня; обране позначаємо галочкою справа
                                                    icon: <RatingDot color={lvl.color} />,
                                                    endAdornment: rating === lvl.value ? <CheckIcon fontSize="small" /> : null,
                                                    onClick: () => setRating(lvl.value),
                                                })),
                                                { key: '__divider__', divider: true },
                                                {
                                                    key: '__none__',
                                                    label: 'No rating',
                                                    selected: rating == null,
                                                    onClick: () => setRating(null),
                                                },
                                            ]}
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                                            renderTrigger={({ onClick }) => (
                                                <Box
                                                    onClick={onClick}
                                                    sx={{
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                        gap: 1, width: '100%', height: 40, boxSizing: 'border-box', p: 1,
                                                        borderRadius: '4px', cursor: 'pointer', border: '1px solid',
                                                        borderColor: 'text.main',
                                                        '@media (hover: hover)': { '&:hover': { borderColor: 'text.main' } },
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                                        {current && <RatingDot color={current.color} />}
                                                        <Typography
                                                        variant="body2"
                                                        noWrap
                                                        sx={{ color: current ? 'text.main' : 'text.secondary', minWidth: 0 }}
                                                    >                                                            {current ? current.name : 'Rating'}                                                        </Typography>
                                                    </Box>
                                                    <ArrowDropDownIcon fontSize="small" sx={{ color: 'text.main' }} />
                                                </Box>
                                            )}
                                        />
                                    </Box>
                                );
                            })()
                        ) : (
                            <Box sx={{ display: 'flex', gap: { xs: 3, md: 5 }, pt: 2, pl: 1 }}>
                                <Slider
                                    value={typeof rating === 'number' ? rating : 0}
                                    onChange={handleSliderChange}
                                    min={0}
                                    max={100}
                                    step={1}
                                    marks={marks}
                                    valueLabelDisplay="auto"
                                    color="text.dark"
                                />
                                <InputBox
                                    value={rating ? rating : ''}
                                    size="small"
                                    onChange={handleInputSliderChange}
                                    onBlur={handleBlur}
                                    inputProps={{
                                        step: 1,
                                        min: 1,
                                        max: 100,
                                        type: 'number',
                                    }}
                                    sx={{ '& .MuiInput-underline': { display: 'none' } }}
                                />
                            </Box>
                        )}
                        <InputBox
                            label="Enter text..."
                            fullWidth
                            multiline
                            rows={isStacked ? 4 : 6}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                    </Box>


                </Box>

            </DialogContent>

            {/* Кнопки — поза прокручуваним вмістом, тож завжди притиснуті до низу вікна
                (на телефоні вікно на весь екран, і вони не їдуть услід за довгою формою) */}
            <DialogActions
                sx={{
                    flexShrink: 0,
                    gap: 1,
                    px: 2,
                    pt: 1.5,
                    pb: 2,
                    backgroundColor: theme.palette.bg.second,
                    borderTop: { xs: '1px solid', md: 'none' },
                    borderColor: 'divider',
                }}
            >
                {/* Видалити — лише при редагуванні вже збереженого елемента */}
                {isOpenDialogEdit && (
                    <MainButton
                        onClick={() => handleDeleteItem(selectedItem, editFolderRef.current || selectedFolder)}
                        sx={{
                            flex: { xs: 1, sm: '0 0 auto' },
                            m: 0,
                            mr: { sm: 'auto' },
                            backgroundColor: 'danger.main',
                            color: 'danger.contrastText',
                            '@media (hover: hover)': { ':hover': { backgroundColor: 'danger.dark', color: 'danger.contrastText' } },
                        }}
                    >
                        Delete
                    </MainButton>
                )}
                <MainButton onClick={handleCloseDialog} sx={{ flex: { xs: 1, sm: '0 0 auto' }, m: 0 }}>
                    Cancel
                </MainButton>
                <MainButton onClick={handleSubmit} sx={{ flex: { xs: 1, sm: '0 0 auto' }, m: 0 }}>
                    {submitLabelRef.current}
                </MainButton>
            </DialogActions>
        </Dialog >

        {/* Діалог введення тексту (створення тегу) — рендериться поверх цього */}
        {textPromptDialog}
        </>
    );
}

export default ItemSaveDialog; 