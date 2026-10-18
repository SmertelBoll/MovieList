import { Box } from '@mui/material';
import React from 'react'
import { Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../redux/slices/AuthSlice';
import ContainerCustom from './_customMUI/ContainerCustom';

import HomeIcon from '@mui/icons-material/Home';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import NewReleasesOutlinedIcon from '@mui/icons-material/NewReleasesOutlined';
import PersonIcon from '@mui/icons-material/Person';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

// Висота нижньої навігації на телефоні (px). Від неї залежить відступ під контентом і позиція
// кнопки «нагору» (ScrollToTopButton).
export const BOTTOM_NAV_HEIGHT = 56;

function Footer() {
  const isAuth = useSelector(selectIsAuth);
  const { pathname } = useLocation();

  // Нижня навігація на телефоні. Профіль для гостя веде на вхід.
  const items = [
    { key: 'home', label: 'Home', to: '/', active: pathname === '/', Icon: HomeIcon, IconOff: HomeOutlinedIcon },
    { key: 'new', label: 'New releases', to: '/updates', active: pathname.startsWith('/updates'), Icon: NewReleasesIcon, IconOff: NewReleasesOutlinedIcon },
    {
      key: 'profile',
      label: 'Profile',
      to: isAuth ? '/profile' : '/login',
      active: pathname.startsWith('/profile') || (!isAuth && (pathname === '/login' || pathname === '/register')),
      Icon: PersonIcon,
      IconOff: PersonOutlineIcon,
    },
  ];

  return (
    <>
      {/* Десктоп / планшет: звичайний підвал */}
      <Box component="footer" bgcolor="bg.second" sx={{ boxShadow: 0, display: { xs: 'none', sm: 'block' } }}>
        <ContainerCustom sx={{ py: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>1</Box>

            <Box>Lyubomyr Sholop</Box>

            <Box>3</Box>
          </Box>
        </ContainerCustom>
      </Box>

      {/* Телефон: нижня навігація, завжди закріплена знизу — Home, New, Profile */}
      <Box
        component="nav"
        aria-label="Main navigation"
        bgcolor="bg.second"
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1000,
          height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))`,
          // Відступ під «жест вниз» / рядок home на сучасних телефонах
          pb: 'env(safe-area-inset-bottom)',
          borderTop: '1px solid',
          borderColor: 'divider',
          boxSizing: 'border-box',
        }}
      >
        {items.map(({ key, label, to, active, Icon, IconOff }) => {
          const Current = active ? Icon : IconOff
          return (
            <Box
              key={key}
              component={Link}
              to={to}
              aria-label={label}
              title={label}
              aria-current={active ? 'page' : undefined}
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Активна сторінка — іконка на жовтій плашці (жовтий фон → темна іконка) */}
              <Box
                sx={{
                  width: 56,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 4,
                  bgcolor: active ? 'yellow.main' : 'transparent',
                  color: active ? 'yellow.contrastText' : 'text.main',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
              >
                <Current />
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Місце під закріплену навігацію, щоб вона не перекривала кінець сторінки */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, height: `calc(${BOTTOM_NAV_HEIGHT}px + env(safe-area-inset-bottom))` }} />
    </>
  )
}

export default Footer
