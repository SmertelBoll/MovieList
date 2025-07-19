import React from 'react';
import { Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTheme } from '@mui/material/styles';

function ScrollToTopButton({ isVisible }) {
    const theme = useTheme();

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <Zoom in={isVisible}>
            <Fab
                color="primary"
                size="medium"
                onClick={scrollToTop}
                sx={{
                    position: 'fixed',
                    bottom: {
                        xs: 'calc(40px + 24px)',
                        sm: 'calc(40px + clamp(16px, calc(16px + 1.8vw), 40px))'
                    },
                    right: 20,
                    zIndex: 1000,
                    backgroundColor: theme.palette.yellow.main,
                    color: theme.palette.text.dark,
                    '&:hover': {
                        backgroundColor: theme.palette.yellow.dark,
                    },
                    boxShadow: theme.shadows[8],
                }}
                aria-label="scroll to top"
            >
                <KeyboardArrowUpIcon />
            </Fab>
        </Zoom>
    );
}

export default ScrollToTopButton; 