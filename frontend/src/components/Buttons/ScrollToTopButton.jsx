import React, { useEffect, useState } from 'react';
import { Fab, Zoom } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { useTheme } from '@mui/material/styles';

function ScrollToTopButton() {
    const theme = useTheme();
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 500) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <Zoom in={isVisible}>
            <Fab
                // ... (rest of the code unchanged)
                color="primary"
                size="medium"
                onClick={scrollToTop}
                sx={{
                    position: 'fixed',
                    bottom: {
                        // Над закріпленою нижньою навігацією на телефоні (BOTTOM_NAV_HEIGHT у Footer.jsx) з запасом
                        xs: 'calc(56px + 16px + env(safe-area-inset-bottom))',
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