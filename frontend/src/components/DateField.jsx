
import { useSelector } from 'react-redux'
import { DatePicker } from '@mui/x-date-pickers'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import useInputBox from './_customMUI/useInputBox'

// The date field of every dialog, in the user's date format, with a clear button (the date is optional).
// dense: reduced padding (~39px) like the other dense fields; otherwise the regular height next to a plain field.
// x-date-pickers v7 dropped renderInput: the field is plugged in via slots (otherwise it is unstyled, with a yellow
// primary focus ring).
function DateField({ label = 'Choose date', value, onChange, dense = false, sx }) {
    const dateFormat = useSelector((state) => state.config.dateFormat)
    const InputBox = useInputBox({ dense: dense })

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                label={label}
                format={dateFormat}
                value={value}
                onChange={onChange}
                slots={{ textField: InputBox }}
                slotProps={{
                    textField: {
                        fullWidth: true,
                        // With reduced padding MUI sizes the label for full height and it sinks in an empty field
                        // unless the field is small.
                        ...(dense && { size: 'small' }),
                        sx: { mb: 0, ...sx },
                    },
                    field: { clearable: true },
                }}
            />
        </LocalizationProvider>
    )
}

export default DateField
