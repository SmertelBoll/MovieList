import { Box, InputAdornment } from '@mui/material';
import React, { useEffect, useRef } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useInputBox from '../_customMUI/useInputBox'

function RenameFolderInput({
    curFolderName,
    handleInputChange,
    handleUpdateFolderName,
    folder,
    handleClickDelete,
    isInputNewFolder
}) {
    const inputRef = useRef(null);
    const InputBox = useInputBox({ dense: true })

    // autoFocus doesn't fire when the Menu closes and returns focus to its trigger, so focus manually after
    // the close animation.
    useEffect(() => {
        const timer = setTimeout(() => { inputRef.current?.focus() }, 100)
        return () => clearTimeout(timer)
    }, []);

    return (
        <Box sx={{ py: 1 }}>
            <InputBox
                value={curFolderName}
                onChange={handleInputChange}
                required
                fullWidth
                id="curFolder"
                name="curFolder"
                inputRef={inputRef}
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