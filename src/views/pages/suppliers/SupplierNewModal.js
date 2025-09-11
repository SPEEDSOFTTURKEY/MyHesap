import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSave } from "@coreui/icons";
import SupplierIdentity from "../../../components/suppliers/SupplierIdentity";
import SupplierFinancial from "../../../components/suppliers/SupplierFinancial";
import SupplierContact from "../../../components/suppliers/SupplierContact";
import SupplierOther from "../../../components/suppliers/SupplierOther";

// Configure Axios instance
const api = axios.create({
  baseURL: "https://localhost:44375/api",
  headers: {
    "Content-Type": "multipart/form-data",
  },
});

const SupplierNewModal = ({ visible, onClose, onSupplierCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    unvan: "",
    vergiDairesi: "",
    vergiNo: "",
    vergiMuaf: false,
    bankaBilgileri: "",
    paraBirimi: "TRY",
    vadeGun: "",
    acilisBakiyesi: "",
    yetkiliKisi: "",
    email: "",
    adres: "",
    telefon: "",
    diger: "",
    tedarikciSiniflandirmaId: "",
    kodu: "",
    aciklama: "",
    durumu: 1,
    aktif: 0,
    fotograf: null,
    kullaniciId: 0,
  });
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("identity");
  const [errors, setErrors] = useState({});

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        addToast(
          "Lütfen yalnızca JPEG, PNG veya GIF formatında resim yükleyin.",
          "error",
        );
        return;
      }
      setFormData((prev) => ({ ...prev, fotograf: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Kullanıcı ID'sini al
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (!user.id) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }

      const supplierData = {
        unvan: formData.unvan?.trim() || "",
        fotograf: formData.fotograf,
        vergiDairesi: formData.vergiDairesi || "",
        vergiNo: formData.vergiNo || "",
        vergiMuaf: formData.vergiMuaf ? 1 : 0,
        bankaBilgileri: formData.bankaBilgileri || "",
        paraBirimi: formData.paraBirimi || "TRY",
        vadeGun: parseInt(formData.vadeGun) || 0,
        acilisBakiyesi: parseFloat(formData.acilisBakiyesi) || 0,
        yetkiliKisi: formData.yetkiliKisi || "",
        email: formData.email?.trim() || "",
        adres: formData.adres || "",
        telefon: formData.telefon || "",
        diger: formData.diger || "",
        tedarikciSiniflandirmaId:
          parseInt(formData.tedarikciSiniflandirmaId) || 0,
        kodu: formData.kodu || "",
        aciklama: formData.aciklama || "",
        durumu: 1,
        aktif: 0,
        kullaniciId: user.id, // Kullanıcı ID'si eklendi
      };

      console.log("Supplier data payload:", supplierData);

      const formDataToSend = new FormData();
      Object.entries(supplierData).forEach(([k, v]) => {
        if (k === "fotograf" && v) {
          formDataToSend.append("fotograf", v);
        } else {
          formDataToSend.append(k, v == null ? "" : v);
        }
      });

      console.log("FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const res = await api.post("/tedarikci/tedarikci-create", formDataToSend);

      // API cevabını konsola yazdır
      console.log("API Response (tedarikci/tedarikci-create):", res.data);
      console.log("API OK", res.status);

      addToast("Tedarikçi başarıyla eklendi.", "success");
      onSupplierCreated(res.data); // Yeni tedarikçiyi üst bileşene gönder

      // Yeni tedarikçinin Id'sini al
      const supplierId = res.data?.Data?.id || res.data?.data?.id;
      if (supplierId && supplierId !== 0) {
        console.log("Yönlendirme yapılıyor, supplierId:", supplierId);
        // Yönlendirme URL'sini query parametresi olmadan tanımlıyoruz
        const redirectUrl = "/app/purchases/registered-supplier-purchase";
        // supplierId'yi state ile gönderiyoruz
        setTimeout(() => {
          try {
            navigate(redirectUrl, { state: { supplierId } });
            console.log("Yönlendirme tamamlandı, URL:", window.location.href);
            onClose(); // Modal'ı yönlendirme sonrası kapat
          } catch (navError) {
            console.error("Yönlendirme hatası:", navError);
            addToast(
              "Yönlendirme başarısız oldu, lütfen tekrar deneyin.",
              "error",
            );
          }
        }, 100); // Kısa bir gecikme ekliyoruz
      } else {
        console.error(
          "Tedarikçi ID'si alınamadı veya sıfır, API cevabı:",
          res.data,
        );
        addToast(
          "Tedarikçi ID'si alınamadı veya geçersiz, lütfen tekrar deneyin.",
          "error",
        );
      }
    } catch (err) {
      console.error("Tedarikçi Ekleme Hatası:", {
        message: err?.response?.data?.message || err.message,
        status: err?.response?.status,
        data: err?.response?.data,
      });
      let errorMessage =
        err?.response?.data?.message || "Tedarikçi eklenemedi.";
      if (err.response?.status === 415) {
        errorMessage =
          "Sunucu dosya tipini desteklemiyor. Lütfen doğru formatta veri gönderin.";
      }
      addToast(errorMessage, "error");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "identity":
        return (
          <SupplierIdentity
            formData={formData}
            handleChange={handleChange}
            handleImageUpload={handleImageUpload}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "financial":
        return (
          <SupplierFinancial formData={formData} handleChange={handleChange} />
        );
      case "contact":
        return (
          <SupplierContact formData={formData} handleChange={handleChange} />
        );
      case "other":
        return (
          <SupplierOther formData={formData} handleChange={handleChange} />
        );
      default:
        return null;
    }
  };

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static" size="lg">
      <CToaster placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CModalHeader>
        <CModalTitle>Yeni Tedarikçi Ekle</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CRow className="mb-3">
          <CCol>
            <CButtonGroup role="group" className="mb-0">
              <CButton
                style={{
                  backgroundColor:
                    activeTab === "identity" ? "#FFFFFF" : "#2965A8",
                  color: activeTab === "identity" ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #FFFFFF",
                }}
                onClick={() => setActiveTab("identity")}
              >
                Kimlik Bilgileri
              </CButton>
              <CButton
                style={{
                  backgroundColor:
                    activeTab === "financial" ? "#FFFFFF" : "#2965A8",
                  color: activeTab === "financial" ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #FFFFFF",
                }}
                onClick={() => setActiveTab("financial")}
              >
                Cari
              </CButton>
              <CButton
                style={{
                  backgroundColor:
                    activeTab === "contact" ? "#FFFFFF" : "#2965A8",
                  color: activeTab === "contact" ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #FFFFFF",
                }}
                onClick={() => setActiveTab("contact")}
              >
                İletişim
              </CButton>
              <CButton
                style={{
                  backgroundColor:
                    activeTab === "other" ? "#FFFFFF" : "#2965A8",
                  color: activeTab === "other" ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #FFFFFF",
                }}
                onClick={() => setActiveTab("other")}
              >
                Diğer
              </CButton>
            </CButtonGroup>
          </CCol>
        </CRow>
        <CForm id="supplierForm" onSubmit={handleSubmit}>
          {renderTabContent()}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton
          type="submit"
          form="supplierForm"
          style={{
            width: "150px",
            color: "white",
            backgroundColor: "#1D9030",
          }}
        >
          <CIcon icon={cilSave} /> Kaydet
        </CButton>
        <CButton color="secondary" onClick={onClose}>
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default SupplierNewModal;