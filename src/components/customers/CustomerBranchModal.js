import { useState } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
} from "@coreui/react";

const CustomerBranchModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    Adi: "",
    Adres: "",
    Kodu: "",
    Aktif: true,
    MusteriId: parseInt(id),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert("Şube adı zorunludur.");
      return;
    }
    onSubmit(formData);
    setFormData({ Adi: "", Adres: "", Kodu: "", Aktif: true });
  };

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>Yeni Şube Ekle</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <div className="mb-3">
            <CFormLabel>Şube Adı</CFormLabel>
            <CFormInput
              type="text"
              name="name"
              value={formData.Adi}
              onChange={handleChange}
              required
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Şube Adresi</CFormLabel>
            <CFormInput
              type="text"
              name="address"
              value={formData.Adres}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <CFormLabel>Şube Kodu</CFormLabel>
            <CFormInput
              type="text"
              name="code"
              value={formData.Kodu}
              onChange={handleChange}
            />
          </div>
          <div className="mb-3">
            <CFormCheck
              label="Aktif"
              name="aktif"
              checked={formData.Aktif}
              onChange={handleChange}
            />
          </div>
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" onClick={handleSubmit}>
          Kaydet
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CustomerBranchModal;
