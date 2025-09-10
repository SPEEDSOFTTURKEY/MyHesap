import { useNavigate } from "react-router-dom";
import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
} from "@coreui/react";

const Reports = () => {
  const navigate = useNavigate();

  const reportSections = [
    { title: "Satışlar - Alışlar", path: "/app/reports/sales-purchases" },
    { title: "Finansal Raporlar", path: "/app/reports/financial" },
    { title: "Stok Raporları", path: "/app/reports/stock" },
    { title: "Müşteri Listesi", path: "/app/reports/customer-list" },
  ];

  return (
    <CCard>
      <CCardHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        Raporlar
      </CCardHeader>
      <CCardBody>
        <CRow>
          {reportSections.map((section, index) => (
            <CCol md={6} key={index} className="mb-3">
              <CCard
                onClick={() => navigate(section.path)}
                style={{ cursor: "pointer" }}
              >
                <CCardBody>{section.title}</CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CCardBody>
    </CCard>
  );
};

export default Reports;
