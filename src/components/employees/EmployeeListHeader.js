import { CCard, CCardHeader } from "@coreui/react";

const EmployeeListHeader = ({ employeeCount }) => (
  <CCard className="my-3">
    <CCardHeader
      style={{
        backgroundColor: "#2965A8",
        color: "#ffffff",
        fontSize: "large",
      }}
    >
      <div className="d-flex justify-content-between align-items-center w-100">
        <span>Çalışan Kartları</span>
        <div
          style={{
            backgroundColor: "#fff",
            color: "#2965A8",
            padding: "5px 10px",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            minWidth: "40px",
            textAlign: "center",
          }}
        >
          Toplam Çalışan Sayısı: {employeeCount}
        </div>
      </div>
    </CCardHeader>
  </CCard>
);

export default EmployeeListHeader;
