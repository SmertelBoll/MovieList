import { Box, InputAdornment, useTheme } from '@mui/material';
import React, { useEffect, useRef } from 'react';
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
    const inputRef = useRef(null);
    const InputBox = React.useMemo(
        () => TextFieldCustom(theme.palette.bg.second, theme.palette.text.main, true),
        [theme.palette.mode]
    );

    // autoFocus не спрацьовує коли Menu закривається і повертає фокус на тригер —
    // тому фокусуємо вручну після того як Menu завершить анімацію закриття
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