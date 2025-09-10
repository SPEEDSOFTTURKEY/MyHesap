import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CForm,
  CFormInput,
} from "@coreui/react";
import { useState } from "react";

const WarehouseModal = ({ visible, onClose, onSubmit, loading, warehouse }) => {
  const [formData, setFormData] = useState({
    adi: warehouse?.adi || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>
          {warehouse ? "Depo Güncelle" : "Yeni Depo Ekle"}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm id="warehouseForm" onSubmit={handleSubmit}>
          <CFormInput
            type="text"
            label="Depo Adı"
            name="adi"
            value={formData.adi}
            onChange={handleChange}
            required
          />
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton
          color="primary"
          type="submit"
          form="warehouseForm"
          disabled={loading}
        >
          Kaydet
        </CButton>
        <CButton color="secondary" onClick={onClose} disabled={loading}>
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default WarehouseModal;
