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
import { cilSave } from "@coreui/icons";
import SupplierIdentity from "../../../components/suppliers/SupplierIdentity";
import SupplierFinancial from "../../../components/suppliers/SupplierFinancial";
import SupplierContact from "../../../components/suppliers/SupplierContact";
import SupplierOther from "../../../components/suppliers/SupplierOther";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

const SupplierNew = () => {
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
    fotograf: null, // Changed to match backend IFormFile parameter
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
      // Validate file type
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
    console.log("Submit öncesi formData:", JSON.stringify(formData, null, 2));

    try {
      // Kullanıcı ID'sini al
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (!user.id) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }

      // Validate required fields
      const unvan = (formData.unvan ?? "").trim();
      const email = (formData.email ?? "").trim();
      if (!unvan) {
        throw new Error("Tedarikçi unvanı zorunlu.");
      }
      if (!email && !formData.telefon.trim()) {
        throw new Error("E-posta veya telefon numarası zorunlu.");
      }

      // Prepare supplier data matching TedarikciQueryViewModel
      const supplierData = {
        unvan: unvan,
        fotograf: formData.fotograf,
        vergiDairesi: formData.vergiDairesi || "",
        vergiNo: formData.vergiNo || "",
        vergiMuaf: formData.vergiMuaf ? 1 : 0,
        bankaBilgileri: formData.bankaBilgileri || "",
        paraBirimi: formData.paraBirimi || "TRY",
        vadeGun: parseInt(formData.vadeGun) || 0,
        acilisBakiyesi: parseFloat(formData.acilisBakiyesi) || 0,
        yetkiliKisi: formData.yetkiliKisi || "",
        email: email,
        adres: formData.adres || "",
        telefon: formData.telefon || "",
        diger: formData.diger || "",
        tedarikciSiniflandirmaId:
          parseInt(formData.tedarikciSiniflandirmaId) || 0,
        kodu: formData.kodu || "",
        aciklama: formData.aciklama || "",
        durumu: 1,
        aktif: 0,
        kullaniciId: user.id,
      };

      console.log("Supplier data payload:", supplierData);

      const formDataToSend = new FormData();
      Object.entries(supplierData).forEach(([k, v]) => {
        if (k === "fotograf" && v) {
          formDataToSend.append(k, v);
        } else {
          formDataToSend.append(k, v == null ? "" : v);
        }
      });

      console.log("FormData contents:");
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }

      const res = await api.post(
        `${API_BASE_URL}/tedarikci/tedarikci-create`,
        formDataToSend,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      console.log("API Response (tedarikci/tedarikci-create):", res.data);
      console.log("API OK", res.status);
      addToast("Tedarikçi başarıyla eklendi.", "success");
      navigate("/app/suppliers");
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

  const handleCancel = () => {
    navigate("/app/suppliers");
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
    <>
      <CToaster placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
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
          <CButton color="secondary" onClick={handleCancel} className="ms-2">
            Geri Dön
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
                backgroundColor: activeTab === "other" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "other" ? "#2965A8" : "#FFFFFF",
                border: "1px solid #FFFFFF",
              }}
              onClick={() => setActiveTab("other")}
            >
              Diğer
            </CButton>
          </CButtonGroup>
        </CCardHeader>
        <CCardBody>
          <CForm id="supplierForm" onSubmit={handleSubmit}>
            {renderTabContent()}
          </CForm>
        </CCardBody>
      </CCard>
    </>
  );
};

export default SupplierNew;