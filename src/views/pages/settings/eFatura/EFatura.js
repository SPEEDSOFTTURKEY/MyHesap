import { cilSave } from "@coreui/icons";
import CIcon from "@coreui/icons-react";
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CFormTextarea,
  CRow,
  CToast,
  CToastBody,
  CToaster,
  CToastHeader,
} from "@coreui/react";
import { useRef, useState } from "react";

const EFatura = () => {
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const [activeTab, setActiveTab] = useState("eFaturaAyarlari");

  // Form verilerini tutan state
  const [formData, setFormData] = useState({
    // E-Fatura Ayarları
    faturaAltiMetin: "",
    bilgilendirmeEPosta: "",
    ePostaBaslik: "",
    ePostaMetin: "",
    gelenEFaturalar: false,
    satisAciklamasiGoster: false,
    bankaBilgileriniGoster: false,
    guncelBakiyeGoster: false,
    urunKodunuGoster: false,
    // E-İrsaliye Ayarları
    irsaliyeEPostaBaslik: "",
    irsaliyeEPostaMetin: "",
    aracPlakalari: "",
    soforIsimSoyisim: "",
    soforTCKimlikNo: "",
    // Firma Bilgileri
    firmaEPosta: "",
    firmaTelefonu: "",
    webSitesi: "",
    mersisNo: "",
    ticariSicilNo: "",
    vknTckn: "",
    vergiDairesi: "",
    adres: "",
  });

  const addToast = (message, type = "success") => {
    const id = Date.now();
    const toast = (
      <CToast
        key={id}
        autohide={true}
        visible={true}
        delay={5000}
        className={
          type === "error" ? "bg-danger text-white" : "bg-success text-white"
        }
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Burada API çağrısı yapılabilir
      await Promise.resolve(); // Simüle edilmiş API çağrısı
      addToast("Ayarlar başarıyla kaydedildi");
    } catch (err) {
      addToast("Ayarlar kaydedilirken bir hata oluştu!", "error");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "eFaturaAyarlari":
        return (
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Fatura Altı Sabit Metin</CFormLabel>
                <CFormTextarea
                  name="faturaAltiMetin"
                  value={formData.faturaAltiMetin}
                  onChange={handleInputChange}
                  rows="4"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Bilgilendirme E-Posta</CFormLabel>
                <CFormInput
                  type="email"
                  name="bilgilendirmeEPosta"
                  value={formData.bilgilendirmeEPosta}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>E-Posta Başlık</CFormLabel>
                <CFormInput
                  name="ePostaBaslik"
                  value={formData.ePostaBaslik}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>E-Posta Metin</CFormLabel>
                <CFormTextarea
                  name="ePostaMetin"
                  value={formData.ePostaMetin}
                  onChange={handleInputChange}
                  rows="4"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Gelen E-Faturalar</CFormLabel>
                <CFormSwitch
                  id="gelenEFaturalar"
                  checked={formData.gelenEFaturalar}
                  onChange={() => handleToggleChange("gelenEFaturalar")}
                  label={formData.gelenEFaturalar ? "Aktif" : "Pasif"}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Satış Açıklamasını Göster</CFormLabel>
                <CFormSwitch
                  id="satisAciklamasiGoster"
                  checked={formData.satisAciklamasiGoster}
                  onChange={() => handleToggleChange("satisAciklamasiGoster")}
                  label={formData.satisAciklamasiGoster ? "Aktif" : "Pasif"}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Banka Bilgilerini Göster</CFormLabel>
                <CFormSwitch
                  id="bankaBilgileriniGoster"
                  checked={formData.bankaBilgileriniGoster}
                  onChange={() => handleToggleChange("bankaBilgileriniGoster")}
                  label={formData.bankaBilgileriniGoster ? "Aktif" : "Pasif"}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Güncel Bakiye Göster</CFormLabel>
                <CFormSwitch
                  id="guncelBakiyeGoster"
                  checked={formData.guncelBakiyeGoster}
                  onChange={() => handleToggleChange("guncelBakiyeGoster")}
                  label={formData.guncelBakiyeGoster ? "Aktif" : "Pasif"}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ürün Kodunu Göster</CFormLabel>
                <CFormSwitch
                  id="urunKodunuGoster"
                  checked={formData.urunKodunuGoster}
                  onChange={() => handleToggleChange("urunKodunuGoster")}
                  label={formData.urunKodunuGoster ? "Aktif" : "Pasif"}
                />
              </CCol>
            </CRow>
          </CForm>
        );
      case "eIrsaliyeAyarlari":
        return (
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>E-Posta Başlık</CFormLabel>
                <CFormInput
                  name="irsaliyeEPostaBaslik"
                  value={formData.irsaliyeEPostaBaslik}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>E-Posta Metin</CFormLabel>
                <CFormTextarea
                  name="irsaliyeEPostaMetin"
                  value={formData.irsaliyeEPostaMetin}
                  onChange={handleInputChange}
                  rows="4"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Araç Plakaları</CFormLabel>
                <CFormInput
                  name="aracPlakalari"
                  value={formData.aracPlakalari}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Şoför İsim Soyisim</CFormLabel>
                <CFormInput
                  name="soforIsimSoyisim"
                  value={formData.soforIsimSoyisim}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Şoför T.C. Kimlik No</CFormLabel>
                <CFormInput
                  name="soforTCKimlikNo"
                  value={formData.soforTCKimlikNo}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
          </CForm>
        );
      case "firmaBilgileri":
        return (
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Firma E-Posta Adresi</CFormLabel>
                <CFormInput
                  type="email"
                  name="firmaEPosta"
                  value={formData.firmaEPosta}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Firma Telefonu</CFormLabel>
                <CFormInput
                  type="tel"
                  name="firmaTelefonu"
                  value={formData.firmaTelefonu}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Web Sitesi</CFormLabel>
                <CFormInput
                  name="webSitesi"
                  value={formData.webSitesi}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Mersis No</CFormLabel>
                <CFormInput
                  name="mersisNo"
                  value={formData.mersisNo}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ticari Sicil No</CFormLabel>
                <CFormInput
                  name="ticariSicilNo"
                  value={formData.ticariSicilNo}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>VKN/TCKN</CFormLabel>
                <CFormInput
                  name="vknTckn"
                  value={formData.vknTckn}
                  onChange={handleInputChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Vergi Dairesi</CFormLabel>
                <CFormInput
                  name="vergiDairesi"
                  value={formData.vergiDairesi}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Adres</CFormLabel>
                <CFormTextarea
                  name="adres"
                  value={formData.adres}
                  onChange={handleInputChange}
                  rows="4"
                />
              </CCol>
            </CRow>
          </CForm>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>

      <CButton type="submit" style={{ width: '150px', color:'white', backgroundColor:'#1D9030'}}>
        <CIcon icon={cilSave} /> Kaydet
      </CButton>
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
                  activeTab === "eFaturaAyarlari" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "eFaturaAyarlari" ? "#2965A8" : "#FFFFFF",
                border: "1px solid #FFFFFF",
              }}
              onClick={() => setActiveTab("eFaturaAyarlari")}
            >
              E-Fatura Ayarları
            </CButton>
            <CButton
              style={{
                backgroundColor:
                  activeTab === "eIrsaliyeAyarlari" ? "#FFFFFF" : "#2965A8",
                color:
                  activeTab === "eIrsaliyeAyarlari" ? "#2965A8" : "#FFFFFF",
                border: "1px solid #FFFFFF",
              }}
              onClick={() => setActiveTab("eIrsaliyeAyarlari")}
            >
              E-İrsaliye Ayarları
            </CButton>
            <CButton
              style={{
                backgroundColor:
                  activeTab === "firmaBilgileri" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "firmaBilgileri" ? "#2965A8" : "#FFFFFF",
                border: "1px solid #FFFFFF",
              }}
              onClick={() => setActiveTab("firmaBilgileri")}
            >
              Firma Bilgileri
            </CButton>
          </CButtonGroup>
        </CCardHeader>
        <CCardBody>{renderTabContent()}</CCardBody>
      </CCard>
    </>
  );
};

export default EFatura;
