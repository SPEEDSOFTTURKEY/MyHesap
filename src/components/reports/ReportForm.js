import { CForm, CButton } from "@coreui/react";

const ReportForm = ({ onSubmit, children }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <CForm id="report-form" onSubmit={handleSubmit}>
      {children}
      <CButton
        style={{ backgroundColor: "#4394FF", color: "white" }}
        type="submit"
        className="mt-3"
      >
        Raporu Hazırla
      </CButton>
    </CForm>
  );
};

export default ReportForm;
