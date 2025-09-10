import { CFormLabel } from "@coreui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const DatePickerField = ({ label, value, onChange }) => {
  return (
    <div className="mb-3">
      <CFormLabel className="block text-sm font-semibold mb-3">{label}</CFormLabel>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DatePicker
          value={value}
          onChange={onChange}
          format="DD.MM.YYYY"
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              size: "small",
              className: "form-control",
            },
          }}
        />
      </LocalizationProvider>
    </div>
  );
};

export default DatePickerField;