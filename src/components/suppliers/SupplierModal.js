import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CButtonGroup,
  CForm,
  CSpinner,
} from "@coreui/react";
import { useState, useEffect } from "react";
import SupplierIdentity from "./SupplierIdentity";
import SupplierFinancial from "./SupplierFinancial";
import SupplierContact from "./SupplierContact";
import SupplierOther from "./SupplierOther";
import api from "../../api/api";

// API Base URL
const API_BASE_URL = "https://speedsofttest.com/api";

const SupplierModal = ({
  visible,
  onClose,
  onSubmit,
  addToast,
  supplier = null,
}) => {
  const [formData, setFormData] = useState({
    id: 0,
    unvan: "",
    image: null,
    fotograf: "",
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
    kullaniciId: 0,
  });
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [errors, setErrors] = useState({});
  const [classifications, setClassifications] = useState([]);

  useEffect(() => {
    if (supplier) {
      setFormData({
        id: supplier.id || 0,
        unvan: supplier.name || "",
        image: null,
        fotograf: supplier.fotograf || "",
        vergiDairesi: supplier.taxOffice || "",
        vergiNo: supplier.taxOrIdNumber || "",
        vergiMuaf: supplier.isTaxExempt || false,
        bankaBilgileri: supplier.bankInfo || "",
        paraBirimi: supplier.currency || "TRY",
        vadeGun: supplier.dueDate || "",
        acilisBakiyesi: supplier.openBalance || "",
        yetkiliKisi: supplier.contactPerson || "",
        email: supplier.email || "",
        adres: supplier.address || "",
        telefon: supplier.phone || "",
        diger: supplier.otherContact || "",
        tedarikciSiniflandirmaId: supplier.classification || "",
        kodu: supplier.accountingCode || "",
        aciklama: supplier.note || "",
        kullaniciId: 0, // Will be updated with actual user ID
      });
    }
  }, [supplier]);

  const fetchClassifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(
        `${API_BASE_URL}/tedarikciSiniflandirma/get-all`
      );
      console.log("Classifications API response (tedarikciSiniflandirma/get-all):", data);
      setClassifications(data.filter((item) => item.durumu === 1));
      setErrorMessage(null);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Sınıflandırmalar yüklenemedi.";
      console.error("Sınıflandırma yükleme hatası:", err.response?.data || err.message);
      setErrorMessage(errorMsg);
      addToast(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, []);

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
      setFormData((prev) => ({
        ...prev,
        image: file,
        fotograf: URL.createObjectURL(file),
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.unvan?.trim()) {
      newErrors.unvan = "Tedarikçi unvanı zorunlu";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "E-posta adı zorunlu";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Geçerli bir e-posta adresi giriniz";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Lütfen zorunlu alanları doğru şekilde doldurun.", "error");
      return;
    }
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (!user.id) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }

      const supplierData = {
        id: formData.id || 0,
        unvan: formData.unvan || "",
        vergiDairesi: formData.vergiDairesi || "",
        vergiNo: formData.vergiNo || "",
        vergiMuaf: formData.vergiMuaf ? 1 : 0,
        bankaBilgileri: formData.bankaBilgileri || "",
        paraBirimi: formData.paraBirimi || "TRY",
        vadeGun: parseInt(formData.vadeGun) || 0,
        acilisBakiyesi: parseFloat(formData.acilisBakiyesi) || 0,
        yetkiliKisi: formData.yetkiliKisi || "",
        email: formData.email || "",
        adres: formData.adres || "",
        telefon: formData.telefon || "",
        diger: formData.diger || "",
        tedarikciSiniflandirmaId: parseInt(formData.tedarikciSiniflandirmaId) || 0,
        kodu: formData.kodu || "",
        aciklama: formData.aciklama || "",
        fotograf: formData.image || formData.fotograf || "",
        kullaniciId: user.id,
      };

      const formDataToSend = new FormData();
      for (const key in supplierData) {
        if (key === "fotograf" && formData.image) {
          formDataToSend.append("fotograf", formData.image);
        } else {
          formDataToSend.append(
            key,
            supplierData[key] === null ? "" : supplierData[key]
          );
        }
      }

      const response = formData.id
        ? await api.put(
            `${API_BASE_URL}/tedarikci/tedarikci-update`,
            formDataToSend,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          )
        : await api.post(
            `${API_BASE_URL}/tedarikci/tedarikci-create`,
            formDataToSend,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

      console.log(
        formData.id
          ? "Update API response (tedarikci/tedarikci-update):"
          : "Create API response (tedarikci/tedarikci-create):",
        response.data
      );

      onSubmit({
        ...supplierData,
        fotograf: response.data.data?.fotograf || formData.fotograf,
      });
      addToast(
        formData.id
          ? "Tedarikçi başarıyla güncellendi."
          : "Tedarikçi başarıyla oluşturuldu.",
        "success"
      );
      handleClose();
    } catch (err) {
      console.error("Tedarikçi Güncelleme/Oluşturma Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(
        err.response?.data?.message ||
          "Tedarikçi güncellenemedi/oluşturulamadı. Lütfen veri formatını kontrol edin.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      id: 0,
      unvan: "",
      image: null,
      fotograf: "",
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
      kullaniciId: 0,
    });
    setErrors({});
    setErrorMessage(null);
    onClose();
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
            classifications={classifications}
          />
        );
      case "financial":
        return (
          <SupplierFinancial
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "contact":
        return (
          <SupplierContact
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case "other":
        return (
          <SupplierOther
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <CModal visible={visible} onClose={handleClose} backdrop="static" size="lg">
      <CModalHeader
        style={{
          backgroundColor: "var(--primary-color)",
          color: "var(--white-color)",
        }}
      >
        <CModalTitle>
          {formData.id ? "Tedarikçi Bilgilerini Güncelle" : "Yeni Tedarikçi Ekle"}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading && <p>Yükleniyor...</p>}
        {errorMessage && <div className="text-danger">{errorMessage}</div>}
        <CForm id="supplierUpdateForm" onSubmit={handleSubmit}>
          <CButtonGroup role="group" className="mb-3">
            {["identity", "financial", "contact", "other"].map((tab) => (
              <CButton
                key={tab}
                style={{
                  backgroundColor:
                    activeTab === tab ? "#FFFFFF" : "var(--primary-color)",
                  color:
                    activeTab === tab
                      ? "var(--primary-color)"
                      : "var(--white-color)",
                  border: "1px solid var(--primary-color)",
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
          {renderTabContent()}
        </CForm>
      </CModalBody>
      <CModalFooter>
        <CButton
          type="submit"
          form="supplierUpdateForm"
          style={{
            backgroundColor: "var(--primary-color)",
            color: "var(--white-color)",
          }}
          disabled={loading}
        >
          Kaydet
        </CButton>
        <CButton
          style={{
            backgroundColor: "var(--secondary-color)",
            color: "var(--white-color)",
          }}
          onClick={handleClose}
          disabled={loading}
        >
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default SupplierModal;
