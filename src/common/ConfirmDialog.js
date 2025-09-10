import React from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
} from "@coreui/react";

const ConfirmDialog = ({
  visible,
  title = "Onay",
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <CModal visible={visible} onClose={onCancel} backdrop="static">
      <CModalHeader>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>{message}</CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onCancel} disabled={loading}>
          İptal
        </CButton>
        <CButton color="danger" onClick={onConfirm} disabled={loading}>
          {loading ? <CSpinner size="sm" /> : "Onayla"}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ConfirmDialog;
