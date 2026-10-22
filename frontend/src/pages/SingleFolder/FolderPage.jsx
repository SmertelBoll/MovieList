import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Chip } from '@mui/material'
import { useSelector } from 'react-redux';
import { selectIsAuth } from '../../redux/slices/AuthSlice';
import instance from '../../axios';
import { alertError } from '../../alerts';
import GeneralItemList from '../../components/GereralItemList/GeneralItemList';
import DropdownMenu from '../../components/_customMUI/DropdownMenu';
import { getStatusLabel, getStatusChipSx } from '../../utils/folderStatus';
import { buildStatusMenuItems } from '../../components/FolderStatusMenu';

function FolderPage() {
    const { folderName } = useParams();

    const isAuth = useSelector(selectIsAuth);

    const [folders, setFolders] = useState([])
    const [curFolder, setCurFolder] = useState({})
    const [isGetFolders, setIsGetFolders] = useState(true)

    //-- GET -- //
    useEffect(() => {
        if (isGetFolders && isAuth) {
            instance
                .get(`/folders`)
                .then((res) => {
                    setFolders(res.data.results)
                })
                .catch((err) => {
                    console.warn(1111, err);
                    alertError(err);
                });
            setIsGetFolders(false)
        }
    }, [isGetFolders, isAuth]);

    useEffect(() => {
        if (folders.length > 0) {
            const folder = folders.find((folder) => folder.name === folderName)
            setCurFolder(folder)
        }
    }, [folders, folderName])

    const handleChangeStatus = (status) => {
        instance
            .patch(`/folders/status/${folderName}`, { status })
            .then((res) => {
                const updated = res.data.results
                setCurFolder(prev => ({ ...prev, status: updated.status }))
                setFolders(prev => prev.map(f => f.name === folderName ? { ...f, status: updated.status } : f))
            })
            .catch((err) => { console.warn(err); alertError(err) })
    }

    const statusChip = (
        <DropdownMenu
            width={180}
            items={buildStatusMenuItems({ status: curFolder?.status, onChange: handleChangeStatus })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            renderTrigger={({ onClick }) => (
                <Chip
                    size="small"
                    label={getStatusLabel(curFolder?.status)}
                    onClick={onClick}
                    sx={{
                        ...getStatusChipSx(curFolder?.status),
                        cursor: 'pointer',
                        // Keep the chip's own color under hover/focus (MUI substitutes action.hover).
                        '&.MuiChip-clickable:hover, &.MuiChip-clickable.Mui-focusVisible': { bgcolor: getStatusChipSx(curFolder?.status).bgcolor },
                        '@media (hover: hover) and (pointer: fine)': { '&:hover': { opacity: 0.85 } },
                    }}
                />
            )}
        />
    )

    return (
        <Box sx={{ display: "flex", gap: 3, width: "100%" }}>
            <Box sx={{
                flexGrow: 1,
                transition: "flex-basis 0.7s ease-in-out"
            }}>
                <GeneralItemList
                    folders={folders}
                    setFolders={setFolders}
                    setIsGetFolders={setIsGetFolders}
                    dbType="mongo"
                    urlParams={{}}
                    isPreperedData={false}
                    preperedData={false}
                    pageType="folder"
                    pageTitle={folderName}
                    titleAdornment={statusChip}
                    isSearch={true}
                    isSort={true}
                    objectOfFolderPage={curFolder}
                    customEndpoint={`${process.env.REACT_APP_URL_MONGO}/folders/${folderName}`}
                />
            </Box>
        </Box>
    )
}

export default FolderPage