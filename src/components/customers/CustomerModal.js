import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CButtonGroup,
  CForm,
} from "@coreui/react";
import { useState } from "react";
import CustomerIdentity from "./CustomerIdentity";
import CustomerFinancial from "./CustomerFinancial";
import CustomerContact from "./CustomerContact";
import CustomerOther from "./CustomerOther";
import api from "../../api/api";

const API_BASE_URL = "https://localhost:44375/api";

const CustomerModal = ({ visible, onClose, onSubmit, customer, addToast }) => {
  // Form verilerini başlangıçta müşteri verileriyle veya boş değerlerle doldur
  const [formData, setFormData] = useState({
    id: customer?.id || 0,
    unvani: customer?.name || "",
    fotograf: customer?.fotograf || null,
    vergiDairesi: customer?.taxOffice || "",
    vergiNumarasi: customer?.taxOrIdNumber || "",
    vergiMuaf: customer?.isTaxExempt || false,
    iban: customer?.bankInfo || "",
    paraBirimi: customer?.currency || "TRY",
    riskLimiti: customer?.riskLimit || 0,
    vade: customer?.dueDate || 0,
    iskonto: customer?.iskonto || 0,
    acilisBakiye: customer?.openBalance || 0,
    yetkiliKisi: customer?.contactPerson || "",
    email: customer?.email || "",
    adres: customer?.address || "",
    telefon: customer?.phone || "",
    telefon2: customer?.phone2 || "",
    diger: customer?.otherContact || "",
    musteriSiniflandirmaId: customer?.musteriSiniflandirmaId || 0,
    kodu: customer?.accountingCode || "",
    aciklama: customer?.note || "",
  });
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form değişikliklerini yönet
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Resim yükleme işlemini yönet
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, fotograf: file }));
    }
  };

  // Form verilerini doğrula
  const validateForm = () => {
    const newErrors = {};
    if (!formData.unvani?.trim()) {
      newErrors.unvani = "Müşteri unvanı zorunlu";
    }
    if (!formData.email?.trim()) {
      newErrors.email = "E-posta zorunlu";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form gönderimini yönet
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast("Lütfen zorunlu alanları doldurun.", "error");
      return;
    }
    try {
      setLoading(true);
      // API için müşteri verisi hazırla
      const customerData = {
        id: customer?.id || 0,
        unvani: formData.unvani,
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
        email: formData.email || "",
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

      // Çok parçalı veri ile API'ye gönder
      const formDataToSend = new FormData();
      for (const key in customerData) {
        if (key === "fotograf" && customerData[key]) {
          formDataToSend.append(key, customerData[key]);
        } else {
          formDataToSend.append(
            key,
            customerData[key] === null ? "" : customerData[key]
          );
        }
      }

      // API çağrısı ile müşteri güncelleme
      await api.put(`${API_BASE_URL}/musteri/musteri-update`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Güncellenen veriyi onSubmit callback'ine gönder
      onSubmit({ id: customer.id, ...customerData });
    } catch (err) {
      console.error("Müşteri Güncelleme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(
        err.response?.data?.message ||
          "Müşteri güncellenemedi. Lütfen veri formatını kontrol edin.",
        "error"
      );
    } finally {
      setLoading(false);
    }
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
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "financial":
        return (
          <CustomerFinancial
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            setErrors={setErrors}
          />
        );
      case "contact":
        return (
          <CustomerContact
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />
        );
      case "other":
        return (
          <CustomerOther
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
    <CModal visible={visible} onClose={onClose} backdrop="static" size="lg">
      <CModalHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
        <CModalTitle>Müşteri Bilgilerini Güncelle</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading && <p>Yükleniyor...</p>}
        <CForm id="customerUpdateForm" onSubmit={handleSubmit}>
          <CButtonGroup role="group" className="mb-3">
            {["identity", "financial", "contact", "other"].map((tab) => (
              <CButton
                key={tab}
                style={{
                  backgroundColor: activeTab === tab ? "#FFFFFF" : "#2965A8",
                  color: activeTab === tab ? "#2965A8" : "#FFFFFF",
                  border: "1px solid #2965A8",
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
          form="customerUpdateForm"
          color="primary"
          disabled={loading}
        >
          Kaydet
        </CButton>
        <CButton color="secondary" onClick={onClose} disabled={loading}>
          İptal
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default CustomerModal;