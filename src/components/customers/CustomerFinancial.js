import {
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
} from "@coreui/react";
import { IMaskInput } from "react-imask";

const CustomerFinancial = ({ formData, handleChange }) => {
  return (
    <CRow>
      <CCol>
        <CFormLabel>Vergi Dairesi</CFormLabel>
        <CFormInput
          name="vergiDairesi"
          value={formData.vergiDairesi}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>Vergi/TC Kimlik No</CFormLabel>
        <IMaskInput
          mask="00000000000"
          value={formData.vergiNumarasi}
          onAccept={(value) =>
            handleChange({ target: { name: "vergiNumarasi", value } })
          }
          placeholder="11 haneli sayı girin"
          className="form-control mb-3"
        />
        <CFormCheck
          label="Vergiden Muaf?"
          name="vergiMuaf"
          checked={formData.vergiMuaf}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>IBAN Numarası</CFormLabel>
        <IMaskInput
          mask="TR00 0000 0000 0000 0000 0000 00"
          value={formData.iban}
          onAccept={(value) =>
            handleChange({ target: { name: "iban", value } })
          }
          placeholder="TRXX XXXX XXXX XXXX XXXX XXXX XX"
          className="form-control mb-3"
        />
        <CFormLabel>Müşteri Para Birimi</CFormLabel>
        <CFormSelect
          name="paraBirimi"
          value={formData.paraBirimi}
          onChange={handleChange}
          className="mb-3"
        >
          <option value="TRY">TL</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </CFormSelect>
      </CCol>
      <CCol>
        <CFormLabel>Açık Hesap Risk Limiti</CFormLabel>
        <CFormInput
          type="number"
          name="riskLimiti"
          value={formData.riskLimiti}
          onChange={handleChange}
          className="mb-3"
          step="0.01"
        />
        <CFormLabel>Vade (Gün)</CFormLabel>
        <CFormInput
          type="number"
          name="vade"
          value={formData.vade}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>İskonto (%)</CFormLabel>
        <CFormInput
          type="number"
          name="iskonto"
          value={formData.iskonto}
          onChange={handleChange}
          className="mb-3"
          step="0.01"
        />
        <CFormLabel>Açılış Bakiyesi</CFormLabel>
        <CFormInput
          type="number"
          name="acilisBakiye"
          value={formData.acilisBakiye}
          onChange={handleChange}
          className="mb-3"
          step="0.01"
        />
      </CCol>
    </CRow>
  );
};

export default CustomerFinancial;
