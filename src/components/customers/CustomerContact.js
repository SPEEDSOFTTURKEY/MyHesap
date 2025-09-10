import { CFormInput, CFormLabel, CFormSelect } from "@coreui/react";
import { IMaskInput } from "react-imask";

const CustomerContact = ({ formData, handleChange, errors = {} }) => {
  return (
    <div className="row">
      <div className="col-md-6">
        <CFormLabel>Yetkili Kişi</CFormLabel>
        <CFormInput
          name="yetkiliKisi"
          value={formData.yetkiliKisi || ""}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel htmlFor="email">E-Posta</CFormLabel>
        <CFormInput
          type="email"
          id="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          invalid={!!errors.email}
          feedbackInvalid={errors.email}
          className="mb-3"
        />

        <CFormLabel>Telefon</CFormLabel>
        <IMaskInput
          mask="(500) 000 00 00"
          value={formData.telefon}
          onAccept={(value) =>
            handleChange({ target: { name: "telefon", value } })
          }
          placeholder="(5XX) XXX XX XX"
          className="form-control mb-3"
        />
      </div >
      <div className="col-md-6">
        <CFormLabel>Telefon 2</CFormLabel>
        <IMaskInput
          mask="(500) 000 00 00"
          value={formData.telefon2}
          onAccept={(value) =>
            handleChange({ target: { name: "telefon2", value } })
          }
          placeholder="(5XX) XXX XX XX"
          className="form-control mb-3"
        />
        <CFormLabel>Adres</CFormLabel>
        <CFormInput
          name="adres"
          value={formData.adres || ""}
          onChange={handleChange}
          className="mb-3"
        />
        <CFormLabel>Diğer</CFormLabel>
        <CFormInput
          type="textarea"
          name="diger"
          value={formData.diger || ""}
          onChange={handleChange}
          className="mb-3"
          rows="4"
        />
      </div>
    </div >
  );
};

export default CustomerContact;
