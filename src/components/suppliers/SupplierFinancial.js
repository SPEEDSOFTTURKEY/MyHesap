import {
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
} from "@coreui/react";
import { IMaskInput } from "react-imask";

const SupplierFinancial = ({
  formData,
  handleChange,
  errors = {},
  setErrors,
}) => {
  return (
    <CRow>
      <CCol>
        <CFormLabel>Vergi Dairesi</CFormLabel>
        <CFormInput
          name="vergiDairesi"
          value={formData.vergiDairesi || ""}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>Vergi/TC Kimlik No</CFormLabel>
        <IMaskInput
          mask="00000000000"
          name="vergiNo"
          value={formData.vergiNo || ""}
          onAccept={(value) =>
            handleChange({ target: { name: "vergiNo", value } })
          }
          placeholder="11 haneli sayı girin"
          className="form-control mb-3"
        />
        <CFormCheck
          label="Vergiden Muaf?"
          name="vergiMuaf"
          checked={formData.vergiMuaf || false}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>Banka Bilgileri (IBAN)</CFormLabel>
        <IMaskInput
          mask="TR00 0000 0000 0000 0000 0000 00"
          name="bankaBilgileri"
          value={formData.bankaBilgileri || ""}
          onAccept={(value) =>
            handleChange({ target: { name: "bankaBilgileri", value } })
          }
          placeholder="TRXX XXXX XXXX XYZW XXXX XXXX XX"
          className="form-control mb-3"
        />
      </CCol>
      <CCol>
        <CFormLabel>Tedarikçi Para Birimi</CFormLabel>
        <CFormSelect
          name="paraBirimi"
          value={formData.paraBirimi || "TRY"}
          onChange={handleChange}
          className="mb-3"
        >
          <option value="TRY">TL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </CFormSelect>
        <CFormLabel>Vade (Gün)</CFormLabel>
        <CFormInput
          type="number"
          name="vadeGun"
          value={formData.vadeGun || ""}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>Açılış Bakiyesi</CFormLabel>
        <CFormInput
          type="number"
          name="acilisBakiyesi"
          value={formData.acilisBakiyesi || ""}
          onChange={handleChange}
          className="mb-3"
          step="0.01"
        />
      </CCol>
    </CRow>
  );
};

export default SupplierFinancial;