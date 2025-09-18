import { cilSave, cilPencil, cilTrash } from "@coreui/icons";
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
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import { useRef, useState, useEffect } from "react";

const API_BASE_URL = "https://localhost:44375/api";

// Kullanıcı ID'sini localStorage'dan al
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    return user.id;
  } catch (err) {
    console.error("Kullanıcı ID'si alınırken hata:", err);
    return 0;
  }
};

const EFatura = () => {
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const [activeTab, setActiveTab] = useState("eFaturaAyarlari");
  const [edmBilgileriList, setEdmBilgileriList] = useState([]);
  const [showEdmModal, setShowEdmModal] = useState(false);
  const [showEdmUpdateModal, setShowEdmUpdateModal] = useState(false);
  const [showEdmDeleteModal, setShowEdmDeleteModal] = useState(false);
  const [showEdmViewModal, setShowEdmViewModal] = useState(false);
  const [showEdmListModal, setShowEdmListModal] = useState(false);
  const [selectedEdm, setSelectedEdm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(getUserId());
  const [edmFormData, setEdmFormData] = useState({
    unvan: "",
    vergiDairesi: "",
    vergiNumrasi: "",
    adres: "",
    il: "",
    ilce: "",
    postaKodu: "",
    email: "",
    telefon: "",
    kullaniciAdi: "",
    sifre: "",
    kullaniciId: userId,
  });

  // Form verileri for other settings
  const [formData, setFormData] = useState({
    faturaAltiMetin: "",
    bilgilendirmeEPosta: "",
    ePostaBaslik: "",
    ePostaMetin: "",
    gelenEFaturalar: false,
    satisAciklamasiGoster: false,
    bankaBilgileriniGoster: false,
    guncelBakiyeGoster: false,
    urunKodunuGoster: false,
    irsaliyeEPostaBaslik: "",
    irsaliyeEPostaMetin: "",
    aracPlakalari: "",
    soforIsimSoyisim: "",
    soforTCKimlikNo: "",
    firmaEPosta: "",
    firmaTelefonu: "",
    webSitesi: "",
    mersisNo: "",
    ticariSicilNo: "",
    vknTckn: "",
    vergiDairesi: "",
    adres: "",
  });

  // localStorage değişikliklerini dinle ve userId'yi güncelle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const newUserId = getUserId();
        setUserId(newUserId);
        setEdmFormData((prev) => ({ ...prev, kullaniciId: newUserId }));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Initial check
    const initialUserId = getUserId();
    setUserId(initialUserId);
    setEdmFormData((prev) => ({ ...prev, kullaniciId: initialUserId }));

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  // Fetch EDM Bilgileri
  const fetchEdmBilgileri = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/edmBilgileri/edmBilgileri-get-all`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("EDM Data:", data); // Debug: Log raw API response
        // Remove durumu filter since it may not exist in the data
        setEdmBilgileriList(data);
        console.log("Filtered EDM List:", data); // Debug: Log filtered list
      } else {
        addToast("EDM bilgileri yüklenirken hata oluştu!", "error");
      }
    } catch (err) {
      console.error("Fetch EDM Error:", err); // Debug: Log error
      addToast("Sunucuya bağlanılamadı.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Create EDM Bilgileri
  const handleAddEdm = async () => {
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    if (!edmFormData.unvan || !edmFormData.vergiNumrasi) {
      addToast("Ünvan ve Vergi Numarası zorunludur.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        unvan: edmFormData.unvan,
        vergiDairesi: edmFormData.vergiDairesi,
        vergiNumrasi: edmFormData.vergiNumrasi,
        adres: edmFormData.adres,
        il: edmFormData.il,
        ilce: edmFormData.ilce,
        postaKodu: edmFormData.postaKodu,
        email: edmFormData.email,
        telefon: edmFormData.telefon,
        kullaniciAdi: edmFormData.kullaniciAdi,
        sifre: edmFormData.sifre,
        kullaniciId: userId,
      };
      const response = await fetch(`${API_BASE_URL}/edmBilgileri/edmBilgileri-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        addToast(data.message || "EDM bilgisi başarıyla eklendi.", "success");
        setShowEdmModal(false);
        setEdmFormData({
          unvan: "",
          vergiDairesi: "",
          vergiNumrasi: "",
          adres: "",
          il: "",
          ilce: "",
          postaKodu: "",
          email: "",
          telefon: "",
          kullaniciAdi: "",
          sifre: "",
          kullaniciId: userId,
        });
        fetchEdmBilgileri();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || "EDM bilgisi eklenemedi.", "error");
      }
    } catch (err) {
      console.error("Add EDM Error:", err); // Debug: Log error
      addToast("EDM bilgisi eklenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Update EDM Bilgileri
  const handleUpdateEdm = async () => {
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    if (!edmFormData.unvan || !edmFormData.vergiNumrasi) {
      addToast("Ünvan ve Vergi Numarası zorunludur.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: selectedEdm.id,
        unvan: edmFormData.unvan,
        vergiDairesi: edmFormData.vergiDairesi,
        vergiNumrasi: edmFormData.vergiNumrasi,
        adres: edmFormData.adres,
        il: edmFormData.il,
        ilce: edmFormData.ilce,
        postaKodu: edmFormData.postaKodu,
        email: edmFormData.email,
        telefon: edmFormData.telefon,
        kullaniciAdi: edmFormData.kullaniciAdi,
        sifre: edmFormData.sifre,
        kullaniciId: userId,
      };
      const response = await fetch(`${API_BASE_URL}/edmBilgileri/edmBilgileri-update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = await response.json();
        addToast(data.message || "EDM bilgisi başarıyla güncellendi.", "success");
        setShowEdmUpdateModal(false);
        setSelectedEdm(null);
        fetchEdmBilgileri();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || "EDM bilgisi güncellenemedi.", "error");
      }
    } catch (err) {
      console.error("Update EDM Error:", err); // Debug: Log error
      addToast("EDM bilgisi güncellenirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Delete EDM Bilgileri
  const handleDeleteEdm = async () => {
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/edmBilgileri/edmBilgileri-delete/${selectedEdm.id}?kullaniciId=${userId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const data = await response.json();
        addToast(data.message || "EDM bilgisi başarıyla silindi.", "success");
        setShowEdmDeleteModal(false);
        setSelectedEdm(null);
        fetchEdmBilgileri();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || "EDM bilgisi silinemedi.", "error");
      }
    } catch (err) {
      console.error("Delete EDM Error:", err); // Debug: Log error
      addToast("EDM bilgisi silinirken hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Edit EDM Bilgileri
  const handleEditEdm = (edm) => {
    setSelectedEdm(edm);
    setEdmFormData({
      unvan: edm.unvan || "",
      vergiDairesi: edm.vergiDairesi || "",
      vergiNumrasi: edm.vergiNumrasi || "",
      adres: edm.adres || "",
      il: edm.il || "",
      ilce: edm.ilce || "",
      postaKodu: edm.postaKodu || "",
      email: edm.email || "",
      telefon: edm.telefon || "",
      kullaniciAdi: edm.kullaniciAdi || "",
      sifre: edm.sifre || "",
      kullaniciId: userId,
    });
    setShowEdmUpdateModal(true);
  };

  // Handle input change for existing form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle toggle change for existing form
  const handleToggleChange = (name) => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // Handle EDM form input change
  const handleEdmFormChange = (e) => {
    const { name, value } = e.target;
    setEdmFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle submit for existing settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call for existing settings
      await Promise.resolve();
      addToast("Ayarlar başarıyla kaydedildi");
    } catch (err) {
      addToast("Ayarlar kaydedilirken bir hata oluştu!", "error");
    }
  };

  // Handle EDM List Modal Open
  const handleOpenEdmListModal = () => {
    setShowEdmListModal(true);
    fetchEdmBilgileri();
  };

  // Fetch EDM Bilgileri on component mount
  useEffect(() => {
    fetchEdmBilgileri();
  }, []);

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
                  checked={formData.bankaBilgileriGoster}
                  onChange={() => handleToggleChange("bankaBilgileriGoster")}
                  label={formData.bankaBilgileriGoster ? "Aktif" : "Pasif"}
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
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <CButton
          type="submit"
          style={{ width: "150px", color: "white", backgroundColor: "#1D9030" }}
          onClick={handleSubmit}
          disabled={activeTab === "edmBilgileri"}
        >
          <CIcon icon={cilSave} /> Kaydet
        </CButton>
        <CButton
          style={{ width: "150px", color: "white", backgroundColor: "#2965A8" }}
          onClick={handleOpenEdmListModal}
          disabled={loading}
        >
          EDM Bilgileri
        </CButton>
      </div>

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
                color: activeTab === "eIrsaliyeAyarlari" ? "#2965A8" : "#FFFFFF",
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

      {/* Modal for EDM List */}
      <CModal visible={showEdmListModal} onClose={() => setShowEdmListModal(false)} size="xl">
        <CModalHeader>
          <CModalTitle>EDM Bilgileri</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CButton
            color="primary"
            style={{ color: "white", backgroundColor: "#2965A8", marginBottom: "1rem" }}
            onClick={() => {
              setEdmFormData({
                unvan: "",
                vergiDairesi: "",
                vergiNumrasi: "",
                adres: "",
                il: "",
                ilce: "",
                postaKodu: "",
                email: "",
                telefon: "",
                kullaniciAdi: "",
                sifre: "",
                kullaniciId: userId,
              });
              setShowEdmModal(true);
              setShowEdmListModal(false);
            }}
            disabled={loading || !userId || userId === 0}
          >
            Yeni EDM Bilgisi Ekle
          </CButton>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : edmBilgileriList.length === 0 ? (
            <p>EDM bilgisi bulunamadı.</p>
          ) : (
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ünvan</CTableHeaderCell>
                  <CTableHeaderCell>Vergi Numarası</CTableHeaderCell>
                  <CTableHeaderCell>E-Posta</CTableHeaderCell>
                  <CTableHeaderCell>Telefon</CTableHeaderCell>
                  <CTableHeaderCell>İşlemler</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {edmBilgileriList.map((edm) => (
                  <CTableRow key={edm.id}>
                    <CTableDataCell>{edm.unvan || "Bilinmiyor"}</CTableDataCell>
                    <CTableDataCell>{edm.vergiNumrasi || "Yok"}</CTableDataCell>
                    <CTableDataCell>{edm.email || "Yok"}</CTableDataCell>
                    <CTableDataCell>{edm.telefon || "Yok"}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <CButton
                          color="info"
                          size="sm"
                          onClick={() => {
                            handleEditEdm(edm);
                            setShowEdmListModal(false);
                          }}
                          style={{ color: "white" }}
                          disabled={loading}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedEdm(edm);
                            setShowEdmDeleteModal(true);
                            setShowEdmListModal(false);
                          }}
                          style={{ color: "white" }}
                          disabled={loading}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                        <CButton
                          color="success"
                          size="sm"
                          style={{ color: "white" }}
                          disabled={loading}
                        >
                          Seç
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEdmListModal(false)}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Viewing EDM Bilgileri */}
      <CModal visible={showEdmViewModal} onClose={() => setShowEdmViewModal(false)} size="xl">
        <CModalHeader>
          <CModalTitle>EDM Bilgileri</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CButton
            color="primary"
            style={{ color: "white", backgroundColor: "#2965A8", marginBottom: "1rem" }}
            onClick={() => {
              setEdmFormData({
                unvan: "",
                vergiDairesi: "",
                vergiNumrasi: "",
                adres: "",
                il: "",
                ilce: "",
                postaKodu: "",
                email: "",
                telefon: "",
                kullaniciAdi: "",
                sifre: "",
                kullaniciId: userId,
              });
              setShowEdmModal(true);
            }}
            disabled={loading || !userId || userId === 0}
          >
            Yeni EDM Bilgisi Ekle
          </CButton>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : edmBilgileriList.length === 0 ? (
            <p>EDM bilgisi bulunamadı.</p>
          ) : (
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ünvan</CTableHeaderCell>
                  <CTableHeaderCell>Vergi Numarası</CTableHeaderCell>
                  <CTableHeaderCell>E-Posta</CTableHeaderCell>
                  <CTableHeaderCell>Telefon</CTableHeaderCell>
                  <CTableHeaderCell>İşlemler</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {edmBilgileriList.map((edm) => (
                  <CTableRow key={edm.id}>
                    <CTableDataCell>{edm.unvan || "Bilinmiyor"}</CTableDataCell>
                    <CTableDataCell>{edm.vergiNumrasi || "Yok"}</CTableDataCell>
                    <CTableDataCell>{edm.email || "Yok"}</CTableDataCell>
                    <CTableDataCell>{edm.telefon || "Yok"}</CTableDataCell>
                    <CTableDataCell>
                      <div className="d-flex gap-2">
                        <CButton
                          color="info"
                          size="sm"
                          onClick={() => {
                            handleEditEdm(edm);
                            setShowEdmViewModal(false);
                          }}
                          style={{ color: "white" }}
                          disabled={loading}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => {
                            setSelectedEdm(edm);
                            setShowEdmDeleteModal(true);
                            setShowEdmViewModal(false);
                          }}
                          style={{ color: "white" }}
                          disabled={loading}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEdmViewModal(false)}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Adding EDM Bilgileri */}
      <CModal visible={showEdmModal} onClose={() => setShowEdmModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Yeni EDM Bilgisi Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ünvan</CFormLabel>
                <CFormInput
                  name="unvan"
                  value={edmFormData.unvan}
                  onChange={handleEdmFormChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Vergi Dairesi</CFormLabel>
                <CFormInput
                  name="vergiDairesi"
                  value={edmFormData.vergiDairesi}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Vergi Numarası</CFormLabel>
                <CFormInput
                  name="vergiNumrasi"
                  value={edmFormData.vergiNumrasi}
                  onChange={handleEdmFormChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Adres</CFormLabel>
                <CFormTextarea
                  name="adres"
                  value={edmFormData.adres}
                  onChange={handleEdmFormChange}
                  rows="4"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>İl</CFormLabel>
                <CFormInput
                  name="il"
                  value={edmFormData.il}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>İlçe</CFormLabel>
                <CFormInput
                  name="ilce"
                  value={edmFormData.ilce}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Posta Kodu</CFormLabel>
                <CFormInput
                  name="postaKodu"
                  value={edmFormData.postaKodu}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>E-Posta</CFormLabel>
                <CFormInput
                  type="email"
                  name="email"
                  value={edmFormData.email}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Telefon</CFormLabel>
                <CFormInput
                  type="tel"
                  name="telefon"
                  value={edmFormData.telefon}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Kullanıcı Adı</CFormLabel>
                <CFormInput
                  name="kullaniciAdi"
                  value={edmFormData.kullaniciAdi}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Şifre</CFormLabel>
                <CFormInput
                  type="password"
                  name="sifre"
                  value={edmFormData.sifre}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEdmModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleAddEdm}
            disabled={loading || !edmFormData.unvan || !edmFormData.vergiNumrasi}
          >
            Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Updating EDM Bilgileri */}
      <CModal visible={showEdmUpdateModal} onClose={() => setShowEdmUpdateModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>EDM Bilgisini Güncelle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ünvan</CFormLabel>
                <CFormInput
                  name="unvan"
                  value={edmFormData.unvan}
                  onChange={handleEdmFormChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Vergi Dairesi</CFormLabel>
                <CFormInput
                  name="vergiDairesi"
                  value={edmFormData.vergiDairesi}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Vergi Numarası</CFormLabel>
                <CFormInput
                  name="vergiNumrasi"
                  value={edmFormData.vergiNumrasi}
                  onChange={handleEdmFormChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Adres</CFormLabel>
                <CFormTextarea
                  name="adres"
                  value={edmFormData.adres}
                  onChange={handleEdmFormChange}
                  rows="4"
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>İl</CFormLabel>
                <CFormInput
                  name="il"
                  value={edmFormData.il}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>İlçe</CFormLabel>
                <CFormInput
                  name="ilce"
                  value={edmFormData.ilce}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Posta Kodu</CFormLabel>
                <CFormInput
                  name="postaKodu"
                  value={edmFormData.postaKodu}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>E-Posta</CFormLabel>
                <CFormInput
                  type="email"
                  name="email"
                  value={edmFormData.email}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Telefon</CFormLabel>
                <CFormInput
                  type="tel"
                  name="telefon"
                  value={edmFormData.telefon}
                  onChange={handleEdmFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Kullanıcı Adı</CFormLabel>
                <CFormInput
                  name="kullaniciAdi"
                  value={edmFormData.kullaniciAdi}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Şifre</CFormLabel>
                <CFormInput
                  type="password"
                  name="sifre"
                  value={edmFormData.sifre}
                  onChange={handleEdmFormChange}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEdmUpdateModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateEdm}
            disabled={loading || !edmFormData.unvan || !edmFormData.vergiNumrasi}
          >
            Güncelle
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal for Deleting EDM Bilgileri */}
      <CModal visible={showEdmDeleteModal} onClose={() => setShowEdmDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>EDM Bilgisini Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            {selectedEdm?.unvan} adlı EDM bilgisini silmek istediğinizden emin misiniz?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowEdmDeleteModal(false)}>
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={handleDeleteEdm}
            disabled={loading}
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EFatura;