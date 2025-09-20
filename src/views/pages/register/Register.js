import { useRef, useState } from "react";
import {
  CButton,
  CCard,
  CCardBody,
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
import {
  cilEnvelopeClosed,
  cilLockLocked,
  cilPhone,
  cilUser,
} from "@coreui/icons";
import { useNavigate } from "react-router-dom";
const API_BASE_URL = "https://localhost:44375/api";

const Register = () => {
  const [adiSoyadi, setAdiSoyadi] = useState("");
  const [firmaAdi, setFirmaAdi] = useState("");
  const [kullaniciAdi, setKullaniciAdi] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const toaster = useRef();

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, "");
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 4) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(
      3,
      6,
    )} ${phoneNumber.slice(6, 10)}`;
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Şifreler eşleşmiyor!");
      setToast({
        message: "Şifreler eşleşmiyor!",
        color: "danger",
      });
      return;
    }

    if (!validateEmail(email)) {
      setError("Geçerli bir e-posta adresi giriniz!");
      setToast({
        message: "Geçerli bir e-posta adresi giriniz!",
        color: "danger",
      });
      return;
    }

    const now = new Date().toISOString();

    const requestBody = {
      kullaniciAdi,
      adiSoyadi,
      telefon: phone,
      sifre: password,
      email,
      firma: {
        adi: firmaAdi,
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/register/register-create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text(); // Try to get error details from response body
        console.error("Sunucu Hatası:", errorData);
        throw new Error(
          `Kayıt başarısız. Sunucu yanıtı: ${response.status} ${response.statusText}. Detay: ${errorData}`,
        );
      }

      setSuccess("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      setToast({
        message: "Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...",
        color: "success",
      });
      setTimeout(() => navigate("/app/login"), 2000);
    } catch (err) {
      const errorMessage =
        err.message || "Bir hata oluştu. Lütfen tekrar deneyin.";
      console.error("Kayıt hatası:", err);
      setError(errorMessage);
      setToast({
        message: errorMessage,
        color: "danger",
      });
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
            <CCol md={9} lg={7} xl={6}>
              <CCard className="mx-4">
                <CCardBody className="p-4">
                  <CForm onSubmit={(e) => e.preventDefault()}>
                    <h1>Kayıt Ol</h1>
                    <p className="text-body-secondary">Hesabınızı oluşturun</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Ad Soyad"
                        autoComplete="name"
                        value={adiSoyadi}
                        onChange={(e) => setAdiSoyadi(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Firma Adı"
                        autoComplete="organization"
                        value={firmaAdi}
                        onChange={(e) => setFirmaAdi(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Kullanıcı Adı"
                        autoComplete="username"
                        value={kullaniciAdi}
                        onChange={(e) => setKullaniciAdi(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilPhone} />
                      </CInputGroupText>
                      <CFormInput
                        type="text"
                        placeholder="Telefon Numarası"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          const formattedPhone = formatPhoneNumber(
                            e.target.value,
                          );
                          setPhone(formattedPhone);
                        }}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilEnvelopeClosed} />
                      </CInputGroupText>
                      <CFormInput
                        placeholder="Email"
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
                        type="password"
                        placeholder="Şifre"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-4">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        type="password"
                        placeholder="Şifre tekrar!"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </CInputGroup>

                    {error && <p className="text-danger">{error}</p>}
                    {success && <p className="text-success">{success}</p>}

                    <div className="d-grid">
                      <CButton
                        color="light"
                        className="text-black"
                        onClick={handleRegister}
                      >
                        Hesap Oluştur
                      </CButton>
                    </div>
                  </CForm>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CContainer>
      </div>
    </>
  );
};

export default Register;
