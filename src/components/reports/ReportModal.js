import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
} from "@coreui/react";

const ReportModal = ({ visible, onClose, onSubmit, title, children }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader style={{ backgroundColor: "#4394FF", color: "white" }}>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <form onSubmit={handleSubmit}>{children}</form>
      </CModalBody>
      <CModalFooter>
        <CButton
          style={{ backgroundColor: "#4394FF", color: "white" }}
          type="submit"
          form="report-form"
        >
          Raporu Hazırla
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          Vazgeç
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ReportModal;
