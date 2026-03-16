import { Box, InputAdornment, useTheme } from '@mui/material';
import React from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import TextFieldCustom from '../_customMUI/TextFieldCustom';

function RenameFolderInput({
    curFolderName,
    handleInputChange,
    handleUpdateFolderName,
    folder,
    handleClickDelete,
    isInputNewFolder
}) {
    const theme = useTheme();
    const InputBox = React.useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    return (
        <Box sx={{ py: 1 }}>
            <InputBox
                value={curFolderName}
                onChange={handleInputChange}
                required
                fullWidth
                id="curFolder"
                name="curFolder"
                autoFocus
                onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                        handleUpdateFolderName(folder, curFolderName);
                    }
                }}
                slotProps={{
                    input: {
                        endAdornment: (
                            <InputAdornment position="end">
                                <CheckIcon
                                    color="success"
                                    onClick={() => handleUpdateFolderName(folder, curFolderName)}
                                    style={{ cursor: 'pointer' }}
                                />
                                {
                                    isInputNewFolder && (
                                        <CloseIcon
                                            color="error"
                                            onClick={() => {
                                                handleClickDelete(folder, true);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    )
                                }
                            </InputAdornment>
                        ),
                    },
                }}
            />
        </Box>
    );
}

export default RenameFolderInput; 