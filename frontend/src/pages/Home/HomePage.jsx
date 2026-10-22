import { Box, useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import React, { useEffect, useMemo, useState } from 'react'
import SideBar from '../../components/SideBar/SideBar'
import { useSelector } from 'react-redux'
import { selectIsAuth } from '../../redux/slices/AuthSlice'
import instance from '../../axios';
import { alertError } from '../../alerts'
import GeneralItemList from '../../components/GereralItemList/GeneralItemList'


function HomePage() {
  const isAuth = useSelector(selectIsAuth);
  const { typeTMDB } = useSelector((state) => state.config);


  const [folders, setFolders] = useState([])
  const [isGetFolders, setIsGetFolders] = useState(true) // Deleting a folder changes order values, so the list needs refetching.
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarHeight, setSidebarHeight] = useState(0);
  const sidebarRef = React.useRef(null);

  // The sidebar column is 280px; below md there's no room beside the list, so it isn't rendered at all:
  // folders are in the burger menu.
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (isCompact) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > sidebarHeight + 300) {
        setShowSidebar(false);
      } else {
        setShowSidebar(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sidebarHeight, isCompact]);

  useEffect(() => {
    if (sidebarRef.current) {
      const height = sidebarRef.current.offsetHeight;
      setSidebarHeight(height);
    }
  }, [folders, isCompact]);


  //-- GET -- //
  useEffect(() => {
    if (isGetFolders && isAuth) {
      instance
        .get(`/folders`)
        .then((res) => {
          setFolders(res.data.results)

        })
        .catch((err) => {
          console.warn(err);
          alertError(err);
        });
      setIsGetFolders(false)
    }
  }, [isGetFolders, isAuth]);


  // Memoized so GeneralItemList doesn't re-render while scrolling toggles showSidebar.
  const generalItemList = useMemo(() => (
    <GeneralItemList
      folders={folders}
      setFolders={setFolders}
      setIsGetFolders={setIsGetFolders}
      dbType="tmdb"
      urlParams={false}
      isPreperedData={false}
      preperedData={false}
      pageType="home"
      pageTitle="Here can be your advertisement"
      isSearch={true}
      isSort={true}
    />
  ), [folders, isAuth]);

  return (
    // No gap on the container: it left a gap even beside the collapsed zero-width column and pushed content
    // off-center. The gap lives on the column and disappears with it.
    <Box sx={{ display: "flex", width: "100%" }}>
      {!isCompact && isAuth && (
        <Box
          ref={sidebarRef}
          sx={{
            flexBasis: showSidebar ? "30%" : "0%",
            flexGrow: showSidebar ? 1 : 0,
            maxWidth: showSidebar ? "280px" : "0px",
            mr: showSidebar ? 3 : 0,
            overflow: "hidden",
            transition: "all 0.7s ease-in-out",
            opacity: showSidebar ? 1 : 0,
            transform: showSidebar ? "translateX(0)" : "translateX(-100%)"
          }}
        >
          <SideBar
            folders={folders}
            setFolders={setFolders}
            setIsGetFolders={setIsGetFolders}
            getFolderHref={(folder) => `/folders/${encodeURIComponent(folder.name)}`}
            selectedFolder={false}
          />
        </Box>
      )}

      <Box sx={{
        flexBasis: !isCompact && isAuth && showSidebar ? "70%" : "100%",
        flexGrow: 1,
        // Without this a flex child won't let the list shrink and the page overflows sideways.
        minWidth: 0,
        transition: "flex-basis 0.7s ease-in-out"
      }}>
        {generalItemList}
      </Box>
    </Box>
  )
}

export default HomePage