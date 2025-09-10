import React, { useState, useEffect, useRef } from "react";
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CCardFooter,
  CRow,
  CCol,
  CFormInput,
  CFormLabel,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CFormTextarea,
} from "@coreui/react";
import api from "../../../../api/api";
import ErrorBoundary from "../../products/ErrorBoundary";
import CIcon from "@coreui/icons-react";
import { cilFax, cilFile, cilPlus, cilTrash, cilPencil } from "@coreui/icons";
import IMask from "imask";
const API_BASE_URL = "https://localhost:44375/api";

const MembershipDetail = () => {
  const [toasts, setToasts] = useState([]);
  const [membershipData, setMembershipData] = useState({
    membershipStart: "2025-01-01",
    membershipEnd: "2025-07-05",
    firmId: "12345-ABCDE-67890",
  });
  const [businessData, setBusinessData] = useState({
    commercialTitle: "",
    address: "",
    phone: "",
    bankDetails: "",
    logo: "",
  });
  const toaster = useRef();
  const phoneInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const addToast = (message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide={true} visible={true} delay={5000}>
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prev) => [...prev, toast]);
  };

  // Üyelik bitiş tarihine kalan günleri hesapla
  const calculateDaysLeft = () => {
    const endDate = new Date(membershipData.membershipEnd);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} gün sonra` : "Süresi doldu";
  };

  // İşyeri bilgilerini güncelleme
  const handleBusinessInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessData((prev) => ({ ...prev, [name]: value }));
  };

  // Telefon maskeleme
  useEffect(() => {
    if (phoneInputRef.current) {
      const mask = IMask(phoneInputRef.current, {
        mask: "(000) 000 00 00",
      });

      return () => mask.destroy();
    }
  }, []);

  // Logo yükleme
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBusinessData((prev) => ({ ...prev, logo: file.name }));
      addToast("Logo seçildi: " + file.name, "success");
    }
  };

  const handleUpdateBusinessInfo = async () => {
    try {
      await api.put(`${API_BASE_URL}/business/update`, businessData);
      addToast("İşyeri bilgileri başarıyla güncellendi.", "success");
    } catch (err) {
      console.error(
        "İşyeri bilgileri güncellenirken hata:",
        err.response?.data || err
      );
      addToast("İşyeri bilgileri güncellenemedi.", "error");
    }
  };

  // Örnek veri yükleme
  useEffect(() => {
    const fetchMembershipData = async () => {
      try {
        // Örnek API çağrısı
        // const { data } = await api.get("/api/membership/details");
        // setMembershipData(data);
      } catch (err) {
        console.error(
          "Üyelik bilgileri yüklenirken hata:",
          err.response?.data || err
        );
        addToast("Üyelik bilgileri yüklenemedi.", "error");
      }
    };
    fetchMembershipData();
  }, []);

  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow>
        <CCol md={6}>
          <CCard className="my-3">
            <CCardHeader
              style={{
                backgroundColor: "#2E7D32", // Koyu yeşil ton
                color: "#FFFFFF",
                fontSize: "large",
                fontWeight: "bold",
              }}
            >
              Üyelik Bilgileri
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={12}>
                  <CFormLabel className="fw-bold">Üyelik Tarihi</CFormLabel>
                  <p>
                    {new Date(
                      membershipData.membershipStart
                    ).toLocaleDateString("tr-TR")}
                  </p>
                </CCol>
                <CCol xs={12}>
                  <CFormLabel className="fw-bold">Üyelik Bitişi</CFormLabel>
                  <p>
                    {new Date(membershipData.membershipEnd).toLocaleDateString(
                      "tr-TR"
                    )}{" "}
                    ({calculateDaysLeft()})
                  </p>
                </CCol>
                <CCol xs={12}>
                  <CFormLabel className="fw-bold">Api Key (FirmID)</CFormLabel>
                  <p>{membershipData.firmId}</p>
                </CCol>
              </CRow>
            </CCardBody>

            <CCardFooter className="d-flex flex-wrap grap-1 ">

              <CButton
                color="success"
                style={{
                  color: "white",
                  marginRight: "2px",
                  marginBottom: "2px",
                }}
                disabled={true}
              >
                <CIcon icon={cilPlus} /> Süre Ekleyin
              </CButton>
              <CButton
                color="info"
                style={{
                  color: "white",
                  marginRight: "2px",
                  marginBottom: "2px",
                }}
                disabled={true}
              >
                <CIcon icon={cilFax} /> Faturalarınız
              </CButton>
              <CButton
                color="danger"
                style={{ color: "white", marginBottom: "2px" }}
                disabled={true}
              >
                <CIcon icon={cilTrash} /> Tüm Bilgilerinizi Silin
              </CButton>
            </CCardFooter>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="my-3">
            <CCardHeader
              style={{
                backgroundColor: "#2965A8",
                color: "#FFFFFF",
                fontSize: "large",
                fontWeight: "bold",
              }}
            >
              İşyeri Bilgileri
            </CCardHeader>
            <CCardBody>
              <p
                style={{
                  backgroundColor: "#FFC107",
                  padding: "10px",
                  borderRadius: "4px",
                }}
              >

                hazırladığınız hesap ekstrelerini, teklifleri veya satış
                faturalarının bir kopyasını müşterinize e-posta olarak göndermek
                isterseniz bu kısımdaki bilgileri kullanırız.
              </p>
              <CRow>
                <CCol xs={12}>
                  <CFormLabel>Ticari Unvanınız</CFormLabel>
                  <CFormInput
                    name="commercialTitle"
                    value={businessData.commercialTitle}
                    onChange={handleBusinessInputChange}
                    className="mb-3"
                  />
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Adresiniz</CFormLabel>
                  <CFormTextarea
                    name="address"
                    value={businessData.address}
                    onChange={handleBusinessInputChange}
                    className="mb-3"
                    rows={4}
                  />
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Telefonunuz</CFormLabel>
                  <CFormInput
                    name="phone"
                    value={businessData.phone}
                    onChange={handleBusinessInputChange}
                    className="mb-3"
                    ref={phoneInputRef}
                    placeholder="(555) 555 55 55"
                  />
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Banka Hesap Bilgileriniz</CFormLabel>
                  <CFormInput
                    name="bankDetails"
                    value={businessData.bankDetails}
                    onChange={handleBusinessInputChange}
                    className="mb-3"
                  />
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Logonuz</CFormLabel>
                  <div
                    style={{
                      width: "200px",
                      height: "200px",
                      backgroundColor: businessData.logo
                        ? "#F5F5F5"
                        : "#FFFFFF",
                      border: "1px solid #ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                    }}
                    onClick={() => fileInputRef.current.click()}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#E0E0E0")
                    }
                    onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = businessData.logo
                      ? "#F5F5F5"
                      : "#FFFFFF")
                    }
                  >
                    {businessData.logo ? (
                      <span>{businessData.logo}</span>
                    ) : (
                      <CIcon
                        icon={cilPencil}
                        size="xl"
                        style={{ opacity: 0, transition: "opacity 0.3s" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.opacity = 1)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.opacity = 0)
                        }
                      />
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                </CCol>
              </CRow>
              <CRow>
                <CCol className="text-right mt-3">
                  <CButton
                    color="primary"
                    style={{ color: "white" }}
                    onClick={handleUpdateBusinessInfo}
                  >
                    Güncelle
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </ErrorBoundary>
  );
};

export default MembershipDetail;
