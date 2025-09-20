import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilUser, cilLockLocked } from "@coreui/icons";
import { useUser } from "../../../context/UserContext";
import api from "../../../api/api";

const API_BASE_URL = "https://speedsofttest.com/api";

const Login = () => {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const { setUser } = useUser();
  const toaster = useRef();

  const validateForm = () => {
    if (!userName.trim()) {
      setError("Kullanıcı Adı Boş Olamaz");
      return false;
    }
    if (password.length < 2) {
      setError("Şifre en az 2 karakter olmalı");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError("");
    setToast(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log("Giriş isteği gönderiliyor:", { userName, password });

      // POST isteği ile giriş yap
      const response = await api.post(
        `${API_BASE_URL}/kullanicilar/login`,
        { userName, password },
        {
          headers: {
            Authorization: undefined, // Token başlığını kaldır
          },
        }
      );
      const data = response.data;

      // Yanıt yapısını konsola yazdır
      console.log("API Yanıtı:", data);

      // Yanıtın bir dizi olduğundan ve içinde veri olduğundan emin ol
      if (!Array.isArray(data) || data.length === 0 || !data[0].kullanici) {
        throw new Error(`Geçersiz yanıt yapısı: ${JSON.stringify(data)}`);
      }

      // Kullanıcıyı Context'e kaydet
      setUser(data[0].kullanici);
      console.log(data[0].kullanici);

      setToast({ message: "Giriş başarılı!", color: "success" });
      navigate("/app/dashboard");
    } catch (err) {
      console.error("Giriş hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      console.log("Kullanıcı adı:", userName);
      console.log("Şifre:", password);
      let errorMessage =
        err.response?.data?.message || "Kullanıcı adı veya şifre hatalı!";
      if (
        err.response?.status === 403 &&
        err.response?.data?.message?.includes("lisans")
      ) {
        errorMessage =
          "Hesabınız aktif değil. Aktivasyon sayfasına yönlendiriliyorsunuz.";
        setTimeout(() => navigate("/app/activate"), 2000);
      }
      setError(errorMessage);
      setToast({ message: errorMessage, color: "danger" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toast && (
          <CToast
            autohide={5000}
            visible={!!toast}
            color={toast.color}
            className="text-white shadow-lg"
            onClose={() => setToast(null)}
          >
            <CToastHeader closeButton={{ label: "Kapat" }}>
              <strong className="me-auto">Bildirim</strong>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        )}
      </CToaster>
      <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
        <CContainer>
          <CRow className="justify-content-center">
            <CCol md={8}>
              <CCardGroup>
                <CCard className="p-4">
                  <CCardBody>
                    <CForm onSubmit={(e) => e.preventDefault()}>
                      <h1>Giriş Yap</h1>
                      <p className="text-body-secondary">
                        Hesabınıza giriş yapın
                      </p>
                      <CInputGroup className="mb-3">
                        <CInputGroupText>
                          <CIcon icon={cilUser} />
                        </CInputGroupText>
                        <CFormInput
                          placeholder="Kullanıcı Adı"
                          autoComplete="username"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                        />
                      </CInputGroup>
                      <CInputGroup className="mb-4">
                        <CInputGroupText>
                          <CIcon icon={cilLockLocked} />
                        </CInputGroupText>
                        <CFormInput
                          type="password"
                          placeholder="Şifre"
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </CInputGroup>

                      {error && <p className="text-danger">{error}</p>}

                      <CRow>
                        <CCol xs={6}>
                          <CButton
                            color="primary"
                            className="px-4"
                            onClick={handleLogin}
                            disabled={isLoading}
                          >
                            {isLoading ? "Yükleniyor..." : "Giriş Yap"}
                          </CButton>
                        </CCol>
                        <CCol xs={6} className="text-right">
                          <CButton color="link" className="px-0">
                            Şifremi unuttum?
                          </CButton>
                        </CCol>
                      </CRow>
                    </CForm>
                  </CCardBody>
                </CCard>
                <CCard
                  className="text-white bg-primary py-5"
                  style={{ width: "44%" }}
                >
                  <CCardBody className="text-center">
                    <div>
                      <h2>Kayıt Ol</h2>
                      <p>
                        My Hesap'a hoşgeldiniz. Yeni bir hesap oluşturmak için
                        aşağıdaki butona tıklayınız.
                      </p>
                      <Link to="/register">
                        <CButton
                          color="primary"
                          className="mt-3"
                          active
                          tabIndex={-1}
                        >
                          Hemen Kaydol!
                        </CButton>
                      </Link>
                    </div>
                  </CCardBody>
                </CCard>
              </CCardGroup>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </>
  );
};

export default Login;