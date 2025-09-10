import { useNavigate } from "react-router-dom";
import { CRow, CCol, CCard, CCardHeader, CCardBody } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilChartLine,
  cilDollar,
  cilPeople,
  cilUserX,
  cilTruck,
  cilActionRedo,
  cilPaperPlane,
  cilCalendar,
  cilStorage,
} from "@coreui/icons";

const reportCards = [
  // {
  //   title: "Basit Satış Raporu",
  //   path: "/app/sales-purchases/simple-sales",
  //   icon: cilChartLine,
  //   color: "#1D9030", // Green
  // },
  {
    title: "Ürün Alış-Satış Raporu",
    path: "/app/sales-purchases/product-sales",
    icon: cilDollar,
    color: "#2965A8", // Blue (matches header)
  },
  {
    title: "Müşteri Ciroları",
    path: "/app/sales-purchases/customer-turnovers",
    icon: cilPeople,
    color: "#C0392B", // Red
  },
  {
    title: "Satış Olmayan Müşteriler",
    path: "/app/sales-purchases/non-sales-customers",
    icon: cilUserX,
    color: "#7D3C98", // Purple
  },
  // {
  //   title: "Alışlar",
  //   path: "/app/sales-purchases/purchases",
  //   icon: cilTruck,
  //   color: "#F39C12", // Orange
  // },
  {
    title: "İadeler",
    path: "/app/sales-purchases/returns",
    icon: cilActionRedo,
    color: "#3498DB", // Light Blue
  },
  {
    title: "Teklifler",
    path: "/app/sales-purchases/offers",
    icon: cilPaperPlane,
    color: "#16A085", // Teal
  },
  {
    title: "6 Aylık Satışlar",
    path: "/app/sales-purchases/six-month-sales",
    icon: cilCalendar,
    color: "#E74C3C", // Bright Red
  },
  {
    title: "Stok-Satış Karşılama",
    path: "/app/sales-purchases/stock-sales-coverage",
    icon: cilStorage,
    color: "#2ECC71", // Emerald
  },
];

const SalesPurchases = () => {
  const navigate = useNavigate();

  return (
    <CCard>
      <CCardHeader
        className="fs-5"
        style={{ backgroundColor: "#2965A8", color: "#fff" }}
      >
        Satışlar - Alışlar
      </CCardHeader>
      <CCardBody>
        <CRow>
          {reportCards.map((card, index) => (
            <CCol md={4} key={index} className="mb-3">
              <CCard
                onClick={() => navigate(card.path)}
                style={{
                  cursor: "pointer",
                  backgroundColor: card.color,
                  color: "#fff",
                  transition: "transform 0.2s",
                }}
                className="h-100"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                <CCardBody className="d-flex align-items-center">
                  <CIcon icon={card.icon} size="xl" className="me-3" />
                  <span>{card.title}</span>
                </CCardBody>
              </CCard>
            </CCol>
          ))}
        </CRow>
      </CCardBody>
    </CCard>
  );
};

export default SalesPurchases;
