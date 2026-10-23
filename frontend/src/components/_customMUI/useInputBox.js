import { useMemo } from 'react'
import { useTheme } from '@mui/material'
import TextFieldCustom from './TextFieldCustom'

// The themed text field used in dialogs and forms. dense: reduced padding (~39px high), for fields next to other dense
// controls; otherwise the regular height (needed when the field has a floating label). background: the theme surface
// the field sits on, for the autofill color.
function useInputBox({ dense = false, background = 'second' } = {}) {
    const theme = useTheme()
    const bg = theme.palette.bg[background]
    const text = theme.palette.text.main
    return useMemo(() => TextFieldCustom(bg, text, dense), [bg, text, dense])
}

export default useInputBox
