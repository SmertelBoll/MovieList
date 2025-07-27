import React, { useState, useMemo } from 'react'
import { FormControl, MenuItem, InputLabel, Select, Box } from '@mui/material'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const categories = [
    {
        name: 'Popularity',
        key: 'popularity',
        order: 'desc'
    },
    {
        name: 'Views',
        key: 'views',
        order: 'desc'
    },
    {
        name: 'Date',
        key: 'release_date',
        order: 'desc'
    }
]

function Sort() {
    const [sortBy, setSortBy] = useState(categories[0].key);
    const [currentOrder, setCurrentOrder] = useState(categories[0].order);

    const handleChange = (event) => {
        const newKey = event.target.value;

        if (newKey === sortBy) {
            // Якщо вибираємо той самий елемент - змінюємо order
            setCurrentOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Якщо вибираємо новий елемент - встановлюємо його order за замовчуванням
            const selectedCategory = categories.find(cat => cat.key === newKey);
            setCurrentOrder(selectedCategory.order);
            setSortBy(newKey);
        }
    };

    const handleMenuItemClick = (categoryKey) => {
        if (categoryKey === sortBy) {
            // Якщо клікаємо на вже обраний елемент - змінюємо order
            setCurrentOrder(prev => prev === 'asc' ? 'desc' : 'asc');
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
                value={sortBy}
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
                {categories.map((category) => (
                    <MenuItem
                        key={category.key}
                        value={category.key}
                        onClick={() => handleMenuItemClick(category.key)}
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
                            <span>{category.name}</span>
                            {category.key === sortBy && (
                                currentOrder === 'asc' ? (
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