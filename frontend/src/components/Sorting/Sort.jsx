import React from 'react'
import { FormControl, MenuItem, InputLabel, Select, Box } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';


function Sort({ nameSortBy, setNameSortBy, sortDirection, setSortDirection, categoriesSortBy }) {

    const handleChange = (event) => {
        const newName = event.target.value;

        if (newName === nameSortBy) {
            // Якщо вибираємо той самий елемент - змінюємо order
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Якщо вибираємо новий елемент - встановлюємо його order за замовчуванням
            const selectedCategory = categoriesSortBy[newName]
            setSortDirection(selectedCategory.order);
            setNameSortBy(newName);
        }
    };

    const handleMenuItemClick = (categoryName) => {
        if (categoryName === nameSortBy) {
            // Якщо клікаємо на вже обраний елемент - змінюємо order
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        }
    };

    return (
        <FormControl fullWidth size="small"
            sx={{
                '& .MuiOutlinedInput-root': {
                    padding: '8px 8px',
                }
            }}
        >
            <InputLabel
                id="sort-select-label"
                sx={{
                    color: "text.main",
                    '&.Mui-focused': {
                        color: "text.main",
                    }
                }}
            >
                Sorting
            </InputLabel>
            <Select
                labelId="sort-select-label"
                id="sort-select"
                value={nameSortBy}
                label="Sorting"
                onChange={handleChange}
                MenuProps={{
                    disableScrollLock: true,
                }}
                sx={{
                    "& .MuiOutlinedInput-input": {
                        padding: "8px 14px",
                        color: "text.main",
                    },
                    "& .MuiSelect-icon": {
                        color: "text.main",
                    },
                    "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                            borderColor: "text.main",
                        },
                        "&:hover fieldset": {
                            borderColor: "text.main",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "text.main",
                        },
                    },
                    // Додаємо більш специфічні селектори для перекриття дефолтних стилів
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "text.main",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "text.main",
                    },
                    // Стилі для лейбла
                    "& .MuiInputLabel-root": {
                        color: "text.main",
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                        color: "text.main",
                    },
                }}
            >
                {Object.keys(categoriesSortBy).map((categoryName) => (
                    <MenuItem
                        key={categoryName}
                        value={categoryName}
                        onClick={() => handleMenuItemClick(categoryName)}
                        sx={{
                            '&:hover': {
                                backgroundColor: "yellow.main",
                            },
                            '&.Mui-selected': {
                                backgroundColor: "yellow.dark",
                                '&:hover': {
                                    backgroundColor: "yellow.main",
                                },
                            },
                            '&.Mui-selected.Mui-focusVisible': {
                                backgroundColor: "yellow.main",
                            },
                            '&.MuiMenuItem-root.Mui-selected': {
                                backgroundColor: "yellow.main",
                                '&:hover': {
                                    backgroundColor: "yellow.dark",
                                },
                            },
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span>{categoryName}</span>
                            {categoryName === nameSortBy && (
                                sortDirection === 'asc' ? (
                                    <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                                ) : (
                                    <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                                )
                            )}
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}

export default Sort