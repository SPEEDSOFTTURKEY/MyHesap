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
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

// Seçili EDM ID'sini localStorage'dan al
const getSelectedEdmId = () => {
  try {
    return parseInt(localStorage.getItem("selectedEdmId")) || null;
  } catch (err) {
    console.error("Seçili EDM ID'si alınırken hata:", err);
    return null;
  }
};

// Seçili EDM ID'sini localStorage'a kaydet
const saveSelectedEdmId = (edmId) => {
  try {
    localStorage.setItem("selectedEdmId", edmId);
  } catch (err) {
    console.error("Seçili EDM ID'si kaydedilirken hata:", err);
  }
};

const EFatura = () => {
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const [edmBilgileriList, setEdmBilgileriList] = useState([]);
  const [showEdmModal, setShowEdmModal] = useState(false);
  const [showEdmUpdateModal, setShowEdmUpdateModal] = useState(false);
  const [showEdmDeleteModal, setShowEdmDeleteModal] = useState(false);
  const [showEdmListModal, setShowEdmListModal] = useState(false);
  const [selectedEdm, setSelectedEdm] = useState(null);
  const [selectedEdmId, setSelectedEdmId] = useState(getSelectedEdmId());
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

  // Faturalar için yeni state'ler
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceHtml, setSelectedInvoiceHtml] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState("");

  // localStorage değişikliklerini dinle ve userId'yi güncelle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const newUserId = getUserId();
        setUserId(newUserId);
        setEdmFormData((prev) => ({ ...prev, kullaniciId: newUserId }));
      }
      if (e.key === "selectedEdmId") {
        setSelectedEdmId(getSelectedEdmId());
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Initial check
    const initialUserId = getUserId();
    setUserId(initialUserId);
    setEdmFormData((prev) => ({ ...prev, kullaniciId: initialUserId }));
    setSelectedEdmId(getSelectedEdmId());

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
        console.log("EDM Data:", data);
        setEdmBilgileriList(data);
        console.log("Filtered EDM List:", data);
      } else {
        addToast("EDM bilgileri yüklenirken hata oluştu!", "error");
      }
    } catch (err) {
      console.error("Fetch EDM Error:", err);
      addToast("Sunucuya bağlanılamadı.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch All Invoices
  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/EFatura/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      } else {
        addToast("Faturalar yüklenirken hata oluştu!", "error");
      }
    } catch (err) {
      console.error("Fetch Invoices Error:", err);
      addToast("Sunucuya bağlanılamadı.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Invoice HTML
  const fetchInvoiceHtml = async (invoiceNumber) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/EFatura/invoice-html/${invoiceNumber}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedInvoiceHtml(data.htmlContent || "");
        setShowInvoiceModal(true);
      } else {
        addToast("Fatura HTML'i yüklenirken hata oluştu!", "error");
      }
    } catch (err) {
      console.error("Fetch Invoice HTML Error:", err);
      addToast("Sunucuya bağlanılamadı.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Print Invoice
  const printInvoice = () => {
    const content = document.getElementById("invoice-html").innerHTML;
    const printWindow = window.open("", "", "height=800, width=1000");
    printWindow.document.write(`
      <html>
        <head>
          <title>Yazdır</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              color: #000;
              background-color: #fff;
              margin: 0;
              padding: 20px;
            }
            .invoice-container {
              border: 1px solid #ddd;
              padding: 20px;
              background-color: #fff;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Download PDF
  const downloadPdf = () => {
    const input = document.getElementById("invoice-html");
    
    // Yazdırma için özel stiller ekleyelim
    const originalStyles = input.innerHTML;
    const printStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #000;
          background-color: #fff;
          margin: 0;
          padding: 20px;
        }
        .invoice-container {
          border: 1px solid #ddd;
          padding: 20px;
          background-color: #fff;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
      </style>
    `;
    
    input.innerHTML = printStyles + originalStyles;
    
    html2canvas(input, { scale: 2 }).then((canvas) => {
      // Orijinal içeriği geri yükle
      input.innerHTML = originalStyles;
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`fatura_${selectedInvoiceNumber}.pdf`);
    });
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
      console.error("Add EDM Error:", err);
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
      console.error("Update EDM Error:", err);
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
        if (selectedEdmId === selectedEdm.id) {
          setSelectedEdmId(null);
          saveSelectedEdmId(null);
        }
        fetchEdmBilgileri();
      } else {
        const errorData = await response.json();
        addToast(errorData.message || "EDM bilgisi silinemedi.", "error");
      }
    } catch (err) {
      console.error("Delete EDM Error:", err);
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

  // Handle EDM Selection
  const handleSelectEdm = (edm) => {
    setSelectedEdmId(edm.id);
    saveSelectedEdmId(edm.id);
    addToast(`${edm.unvan} seçildi.`, "success");
    setShowEdmListModal(false);
  };

  // Handle EDM form input change
  const handleEdmFormChange = (e) => {
    const { name, value } = e.target;
    setEdmFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle EDM List Modal Open
  const handleOpenEdmListModal = () => {
    setShowEdmListModal(true);
    fetchEdmBilgileri();
  };

  // Show Invoice
  const handleShowInvoice = (invoice) => {
    setSelectedInvoiceNumber(invoice.faturaNumarasi);
    fetchInvoiceHtml(invoice.faturaNumarasi);
  };

  // Fetch EDM Bilgileri and Invoices on component mount
  useEffect(() => {
    fetchEdmBilgileri();
    fetchInvoices();
  }, []);

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>

      <div style={{ display: "flex", gap: "10px", marginBottom: "1rem" }}>
        <CButton
          style={{ width: "150px", color: "white", backgroundColor: "#2965A8" }}
          onClick={handleOpenEdmListModal}
          disabled={loading}
        >
          EDM Bilgileri
        </CButton>
      </div>

      {/* Faturalar Listesi */}
      <CCard>
        <CCardHeader>Faturalar</CCardHeader>
        <CCardBody>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : invoices.length === 0 ? (
            <p>Fatura bulunamadı.</p>
          ) : (
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Fatura Numarası</CTableHeaderCell>
                  <CTableHeaderCell>Fatura Tarihi</CTableHeaderCell>
                  <CTableHeaderCell>Unvan</CTableHeaderCell>
                  <CTableHeaderCell>İşlemler</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {invoices.map((invoice) => (
                  <CTableRow key={invoice.id}>
                    <CTableDataCell>{invoice.faturaNumarasi || "Bilinmiyor"}</CTableDataCell>
                    <CTableDataCell>{invoice.faturaTarih || "Yok"}</CTableDataCell>
                    <CTableDataCell>{invoice.unvan || "Yok"}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        size="sm"
                        onClick={() => handleShowInvoice(invoice)}
                        style={{ color: "white" }}
                        disabled={loading}
                      >
                        Göster
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
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
                  <CTableHeaderCell>Durum</CTableHeaderCell>
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
                      {selectedEdmId === edm.id ? (
                        <span style={{ color: "green", fontWeight: "bold" }}>Seçili</span>
                      ) : (
                        <span>-</span>
                      )}
                    </CTableDataCell>
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
                          onClick={() => handleSelectEdm(edm)}
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

      {/* Modal for Showing Invoice HTML */}
      <CModal visible={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} size="xl">
        <CModalHeader>
          <CModalTitle>Fatura Görüntüle - {selectedInvoiceNumber}</CModalTitle>
        </CModalHeader>
        <CModalBody style={{ backgroundColor: 'white', color: 'black' }}>
          <div 
            id="invoice-html" 
            dangerouslySetInnerHTML={{ __html: selectedInvoiceHtml }} 
            style={{ 
              backgroundColor: 'white', 
              color: 'black',
              padding: '20px',
              border: '1px solid #ddd'
            }}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowInvoiceModal(false)}>
            Kapat
          </CButton>
          <CButton color="info" onClick={printInvoice} disabled={loading}>
            Yazdır
          </CButton>
          <CButton color="success" onClick={downloadPdf} disabled={loading}>
            PDF İndir
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EFatura;