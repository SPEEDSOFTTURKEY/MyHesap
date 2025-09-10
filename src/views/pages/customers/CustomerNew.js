import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilActionUndo, cilSave } from "@coreui/icons";
import CustomerIdentity from "../../../components/customers/CustomerIdentity";
import CustomerFinancial from "../../../components/customers/CustomerFinancial";
import CustomerContact from "../../../components/customers/CustomerContact";
import CustomerOther from "../../../components/customers/CustomerOther";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

// Yeni müşteri ekleme sayfasını oluşturur
const CustomerNew = () => {
  const navigate = useNavigate();
  // Form verilerini tutar
  const [formData, setFormData] = useState({
    unvani: "",
    fotograf: null,
    vergiDairesi: "",
    vergiNumarasi: "",
    vergiMuaf: false,
    iban: "",
    paraBirimi: "TRY",
    riskLimiti: "",
    vade: "",
    iskonto: "",
    acilisBakiye: "",
    yetkiliKisi: "",
    email: "",
    adres: "",
    telefon: "",
    telefon2: "",
    diger: "",
    musteriSiniflandirmaId: "",
    kodu: "",
    aciklama: "",
  });
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(false);

  // Bildirim (toast) ekleme fonksiyonu
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

  // Form değişikliklerini yönet
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Resim yükleme işlemini yönet
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, fotograf: file }));
    }
  };

  // Form gönderimini yönet
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form gönderiliyor...", formData); // <-- teşhis
    console.log("Submit öncesi formData:", JSON.stringify(formData, null, 2));

    try {
      setLoading(true);

      const unvani = (formData.unvani ?? "").trim();
      const email = (formData.email ?? "").trim();

      if (!formData.unvani?.trim()) throw new Error("Müşteri unvanı zorunlu.");
      if (!formData.email?.trim()) throw new Error("E-posta zorunlu.");

      const customerData = {
        unvani,
        fotograf: formData.fotograf,
        vergiDairesi: formData.vergiDairesi || "",
        vergiNumarasi: formData.vergiNumarasi || "",
        vergiMuaf: formData.vergiMuaf ? 1 : 0,
        iban: formData.iban || "",
        paraBirimi: formData.paraBirimi || "TRY",
        riskLimiti: parseFloat(formData.riskLimiti) || 0,
        vade: parseInt(formData.vade) || 0,
        iskonto: parseFloat(formData.iskonto) || 0,
        acilisBakiye: parseFloat(formData.acilisBakiye) || 0,
        yetkiliKisi: formData.yetkiliKisi || "",
        email: formData.email?.trim() || "",
        adres: formData.adres || "",
        telefon: formData.telefon || "",
        telefon2: formData.telefon2 || "",
        diger: formData.diger || "",
        musteriSiniflandirmaId: parseInt(formData.musteriSiniflandirmaId) || 0,
        kodu: formData.kodu || "",
        aciklama: formData.aciklama || "",
        durumu: 1,
        aktif: 1,
      };

      const formDataToSend = new FormData();
      Object.entries(customerData).forEach(([k, v]) => {
        if (k === "fotograf" && v) formDataToSend.append(k, v);
        else formDataToSend.append(k, v == null ? "" : v);
      });

      const res = await api.post(
        `${API_BASE_URL}/musteri/musteri-create`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      console.log("API OK", res.status);
      addToast("Müşteri başarıyla eklendi.", "success");
      navigate("/app/customers");
    } catch (err) {
      console.error("Müşteri Ekleme Hatası:", {
        message: err?.response?.data?.message || err.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      addToast(
        err?.response?.data?.message ||
          "Müşteri eklenemedi. Lütfen veri formatını kontrol edin.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Geri dönme işlemini yönet
  const handleCancel = () => {
    navigate("/app/customers");
  };

  // Sekme içeriğini render et
  const renderTabContent = () => {
    switch (activeTab) {
      case "identity":
        return (
          <CustomerIdentity
            formData={formData}
            handleChange={handleChange}
            handleImageUpload={handleImageUpload}
          />
        );
      case "financial":
        return (
          <CustomerFinancial formData={formData} handleChange={handleChange} />
        );
      case "contact":
        return (
          <CustomerContact formData={formData} handleChange={handleChange} />
        );
      case "other":
        return (
          <CustomerOther formData={formData} handleChange={handleChange} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CToaster placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          <CButton
            type="submit"
            form="customerForm"
            style={{
              width: "150px",
              color: "white",
              backgroundColor: "#1D9030",
            }}
            disabled={loading}
          >
            <CIcon icon={cilSave} /> Kaydet
          </CButton>
          <CButton
            color="secondary"
            onClick={handleCancel}
            className="ms-2"
            disabled={loading}
          >
            <CIcon icon={cilActionUndo} /> Geri Dön
          </CButton>
        </CCol>
      </CRow>
      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
          }}
        >
          <CButtonGroup role="group" className="mb-0">
            {["identity", "financial", "contact", "other"].map((tab) => (
              <CButton
                key={tab}
                style={{
                  backgroundColor: activeTab === tab ? "#FFFFFF" : "#2965A8",
                  color: activeTab === tab ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #FFFFFF",
                }}
                onClick={() => setActiveTab(tab)}
                disabled={loading}
              >
                {tab === "identity"
                  ? "Kimlik Bilgileri"
                  : tab === "financial"
                    ? "Cari"
                    : tab === "contact"
                      ? "İletişim"
                      : "Diğer"}
              </CButton>
            ))}
          </CButtonGroup>
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          <CForm id="customerForm" onSubmit={handleSubmit}>
            {renderTabContent()}
          </CForm>
        </CCardBody>
      </CCard>
    </>
  );
};

export default CustomerNew;
