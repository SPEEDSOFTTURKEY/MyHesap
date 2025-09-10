import { CCard, CCardHeader, CCardBody } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilUser } from "@coreui/icons";

const EmployeeHeader = ({ employee }) => (
  <CCard className="mb-3 shadow-sm w-50">
    <CCardHeader
      className="p-3"
      style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}
    >
      <h4>
        <strong>{employee?.adiSoyadi || "Çalışan Bilgisi"}</strong>
      </h4>
    </CCardHeader>
    <CCardBody className="d-flex">
      <div
        className="d-flex align-items-center justify-content-center me-4"
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          overflow: "hidden",
          backgroundColor: "#e9ecef",
        }}
      >
        {employee?.fotograf ? (
          <img
            src={employee.fotograf}
            alt="Çalışan Fotoğrafı"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none"; // Hata durumunda resmi gizle
              e.target.nextSibling.style.display = "block"; // Varsayılan ikonu göster
            }}
          />
        ) : null}
        <CIcon
          icon={cilUser}
          size="xl"
          style={{ display: employee?.fotograf ? "none" : "block" }}
        />
      </div>
      <div>
        <p className="mb-1">
          <strong>Telefon:</strong> {employee?.telefon || "Bilinmiyor"}
        </p>
        <p className="mb-1">
          <strong>E-posta:</strong> {employee?.email || "Bilinmiyor"}
        </p>
        <p className="mb-1">
          <strong>Bakiye:</strong> {employee?.balance || "Veri bulunamadı"}
        </p>
      </div>
    </CCardBody>
  </CCard>
);

export default EmployeeHeader;
