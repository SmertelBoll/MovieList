import React from 'react'
import { Box, Typography } from '@mui/material'
import SortIcon from '@mui/icons-material/Sort'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import DropdownMenu from '../_customMUI/DropdownMenu'

// Sort button shared by all pages. categoriesSortBy: { [category]: { order: 'asc' | 'desc', ... } }, order = default
// direction.
// A new category sets its default direction; clicking the selected one flips it.
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
                        '@media (hover: hover) and (pointer: fine)': { '&:hover': { bgcolor: 'yellow.main', color: 'yellow.contrastText', borderColor: 'yellow.main' } },
                    }}
                >
                    <SortIcon fontSize="small" />
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
