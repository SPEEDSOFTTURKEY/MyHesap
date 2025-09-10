import React, { useState } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CButton,
} from "@coreui/react";

const SupplierBranchModal = ({ visible, onClose, onSubmit }) => {
  const [branchData, setBranchData] = useState({
    name: "",
    address: "",
    code: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBranchData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedData = {
      name: branchData.name.trim(),
      address: branchData.address.trim(),
      code: branchData.code.trim(),
    };
    if (!trimmedData.name) return alert("Şube adı zorunlu.");
    onSubmit(trimmedData);
    setBranchData({ name: "", address: "", code: "" });
    if (onClose) onClose();
  };

  const handleClose = () => {
    setBranchData({ name: "", address: "", code: "" });
    if (onClose) onClose();
  };

  return (
    <CModal visible={visible} onClose={handleClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>Yeni Şube Ekle</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm id="branchForm" onSubmit={handleSubmit}>
          <CFormLabel htmlFor="branch-name">Şube Adı</CFormLabel>
          <CFormInput
            id="branch-name"
            name="name"
            value={branchData.name}
            onChange={handleChange}
            className="mb-3"
            required
            autoFocus
            placeholder="Örn. Merkez Şube"
          />
          <CFormLabel htmlFor="branch-address">Adres</CFormLabel>
          <CFormInput
            id="branch-address"
            name="address"
            value={branchData.address}
            onChange={handleChange}
            className="mb-3"
            placeholder="Adres giriniz"
          />
          <CFormLabel htmlFor="branch-code">Şube Kodu</CFormLabel>
          <CFormInput
            id="branch-code"
            name="code"
            value={branchData.code}
            onChange={handleChange}
            className="mb-3"
            placeholder="Örn. S-001"
          />
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton color="primary" type="submit" form="branchForm">
          Kaydet
        </CButton>
        <CButton color="secondary" onClick={handleClose}>
          Vazgeç
        </CButton>
      </CModalFooter>
    </CModal>
  );
};
export default SupplierBranchModal;