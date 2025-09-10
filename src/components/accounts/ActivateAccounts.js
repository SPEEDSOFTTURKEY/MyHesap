import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilLockLocked } from "@coreui/icons";
import api from "../../api/api";

const ActivateAccount = () => {
  const [email, setEmail] = useState("");
  const [lisansAnahtari, setLisansAnahtari] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Geçerli bir e-posta adresi girin");
      return false;
    }
    if (lisansAnahtari.length < 8) {
      setError("Lisans anahtarı en az 8 karakter olmalı");
      return false;
    }
    return true; 
  };

  const handleActivate = async () => {
    setError("");
    setToast(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Örnek aktivasyon endpoint'i
      const response = await api.post("/kullanicilar/activate", {
        email,
        lisansAnahtari,
      });
      setToast({ message: "Hesap başarıyla aktif edildi!", color: "success" });
      navigate("/app/login");
    } catch (err) {
      console.error("Aktivasyon hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage =
        err.response?.data?.message || "Aktivasyon başarısız!";
      setError(errorMessage);
      setToast({ message: errorMessage, color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <CCard>
              <CCardHeader>Hesap Aktivasyonu</CCardHeader>
              <CCardBody>
                <CForm onSubmit={(e) => e.preventDefault()}>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilEnvelopeClosed} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="E-Mail"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </CInputGroup>
                  <CInputGroup className="mb-3">
                    <CInputGroupText>
                      <CIcon icon={cilLockLocked} />
                    </CInputGroupText>
                    <CFormInput
                      placeholder="Lisans Anahtarı"
                      value={lisansAnahtari}
                      onChange={(e) => setLisansAnahtari(e.target.value)}
                    />
                  </CInputGroup>

                  {error && <p className="text-danger">{error}</p>}

                  <CButton
                    color="primary"
                    className="px-4"
                    onClick={handleActivate}
                    disabled={isLoading}
                  >
                    {isLoading ? "Yükleniyor..." : "Hesabı Aktif Et"}
                  </CButton>
                </CForm>
              </CCardBody>
            </CCard>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  );
};

export default ActivateAccount;
