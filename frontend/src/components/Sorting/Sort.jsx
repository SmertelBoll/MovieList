import React from 'react'
import { Box, Typography } from '@mui/material'
import SortIcon from '@mui/icons-material/Sort'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DropdownMenu from '../_customMUI/DropdownMenu'

/**
 * Кнопка сортування — спільна для всіх сторінок.
 *
 * categoriesSortBy: { [назва категорії]: { order: 'asc' | 'desc', ... } }
 *   order — напрямок за замовчуванням для цієї категорії. Решта полів
 *   об'єкта (напр. keys) потрібні сторінці, а не самій кнопці.
 *
 * Клік по новій категорії ставить її напрямок за замовчуванням,
 * повторний клік по вже обраній — перевертає напрямок.
 */
function Sort({ nameSortBy, setNameSortBy, sortDirection, setSortDirection, categoriesSortBy, width = 200 }) {

    const handleSelect = (categoryName) => {
        if (categoryName === nameSortBy) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
            return
        }
        setSortDirection(categoriesSortBy[categoryName].order)
        setNameSortBy(categoryName)
    }

    const DirectionIcon = sortDirection === 'asc' ? ArrowUpwardIcon : ArrowDownwardIcon

    return (
        <DropdownMenu
            width={width}
            items={Object.keys(categoriesSortBy).map((categoryName) => ({
                key: categoryName,
                label: categoryName,
                selected: categoryName === nameSortBy,
                // Стрілка лише в обраної категорії — вона ж показує напрямок
                endAdornment: categoryName === nameSortBy ? <DirectionIcon sx={{ fontSize: 16 }} /> : null,
                onClick: () => handleSelect(categoryName),
            }))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            renderTrigger={({ onClick }) => (
                <Box
                    onClick={onClick}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        px: 2,
                        height: 40,
                        boxSizing: 'border-box',
                        borderRadius: 2,
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'text.main',
                        color: 'text.main',
                        transition: 'background-color 0.15s, color 0.15s',
                        '@media (hover: hover)': { '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' } },
                    }}
                >
                    <SortIcon fontSize="small" />
                    {/* flexGrow тримає стрілку праворуч, коли кнопку розтягнуто на всю ширину */}
                    <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
                        {nameSortBy}
                    </Typography>
                    <DirectionIcon sx={{ fontSize: 16 }} />
                </Box>
            )}
        />
    )
}

export default Sort
