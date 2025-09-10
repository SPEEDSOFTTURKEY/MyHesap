import { CFormLabel, CFormInput, CFormTextarea } from "@coreui/react";
import { IMaskInput } from "react-imask";
import { CRow, CCol } from "@coreui/react";

const SupplierContact = ({ formData = {}, handleChange, errors = {} }) => {
  return (
    <CRow>
      <CCol>
        <CFormLabel>Yetkili Kişi</CFormLabel>
        <CFormInput
          name="yetkiliKisi"
          value={formData.yetkiliKisi || ""}
          onChange={handleChange}
          className="mb-3"
        />

        <CFormLabel>E-Posta</CFormLabel>
        <CFormInput
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          invalid={!!errors.email}
          feedbackInvalid={errors?.email}
          className="mb-3"
        />

        <CFormLabel>Telefon</CFormLabel>
        <IMaskInput
          mask="(500) 000 00 00"
          name="telefon"
          value={formData.telefon || ""}
          onAccept={(value) =>
            handleChange({ target: { name: "telefon", value } })
          }
          placeholder="(5XX) XXX XX XX"
          className="form-control mb-3"
        />
        {errors.telefon && (
          <div className="invalid-feedback" style={{ display: "block" }}>
            {errors.telefon}
          </div>
        )}
      </CCol>
      <CCol>
        <CFormLabel>Adres</CFormLabel>
        <CFormTextarea
          rows={3}
          name="adres"
          value={formData.adres || ""}
          onChange={handleChange}
          className="mb-3"
        />

        <CFormLabel>Diğer Erişim Bilgileri</CFormLabel>
        <CFormTextarea
          name="diger"
          value={formData.diger || ""}
          onChange={handleChange}
          className="mb-3"
          rows="4"
        />
      </CCol>
    </CRow>
  );
};

export default SupplierContact;