import { CCol, CCard, CCardBody } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilUser } from "@coreui/icons";
import { useState, useEffect } from "react";

const BASE_PHOTO_URL = "https://localhost:44375";
const DEFAULT_PHOTO = "/default-profile.png";

// Zaman damgasını yalnızca bir kez eklemek için
const getPhotoUrl = (foto) => {
  const timestamp = Date.now();
  if (!foto || typeof foto !== "string" || foto === "null") {
    return DEFAULT_PHOTO;
  }
  if (foto.startsWith("https")) {
    return `${foto}?t=${timestamp}`;
  }
  const normalizedFoto = foto.startsWith("/") ? foto : `/${foto}`;
  return `${BASE_PHOTO_URL}${normalizedFoto}?t=${timestamp}`;
};

const EmployeeCard = ({ employee, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [employee.fotograf]);

  if (!employee?.id) {
    console.error("EmployeeCard - Geçersiz çalışan verisi:", employee);
    return null;
  }

  const photoUrl = getPhotoUrl(employee.fotograf);

  return (
    <CCol xs={12} sm={6} md={4} lg={3} className="mb-3">
      <CCard
        className="h-100 shadow-sm"
        style={{
          cursor: "pointer",
          transition: "background-color 0.2s, transform 0.2s",
          minWidth: "250px", // Kartın minimum genişliğini artırdık
        }}
        onClick={onClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f8f9fa";
          e.currentTarget.style.transform = "scale(1.02)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "white";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <CCardBody className="d-flex align-items-center">
          <div
            style={{
              width: "70px", // Fotoğraf boyutunu biraz artırdık
              height: "70px",
              borderRadius: "50%",
              overflow: "hidden",
              marginRight: "20px",
              backgroundColor: "#e9ecef",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!imageLoaded && <div style={{ fontSize: "12px" }}>Yükleniyor...</div>}
            <img
              src={imageError ? DEFAULT_PHOTO : photoUrl}
              alt="Çalışan Fotoğrafı"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: imageLoaded ? "block" : "none",
                opacity: imageLoaded ? 1 : 0,
                transition: "opacity 0.3s",
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(true);
                console.log("Fotoğraf yüklenemedi, varsayılan kullanıldı:", photoUrl);
              }}
            />
            <CIcon
              icon={cilUser}
              size="xl"
              style={{ display: imageLoaded && !imageError ? "none" : "block" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}> {/* Metin taşmasını önlemek için minWidth: 0 */}
            <h6 className="mb-0 text-break">{employee?.adiSoyadi || "-"}</h6> {/* text-break ile taşma önlendi */}
            <p className="mb-0 text-muted text-break">{employee?.email || "-"}</p> {/* text-break ile taşma önlendi */}
          </div>
        </CCardBody>
      </CCard>
    </CCol>
  );
};

export default EmployeeCard;