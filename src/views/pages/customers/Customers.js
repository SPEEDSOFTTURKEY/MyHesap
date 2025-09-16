import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastBody,
  CToastHeader,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CSpinner,
  CModalFooter,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilCloudUpload } from "@coreui/icons";
import CustomerTable from "../../../components/customers/CustomerTable";
import CustomerModal from "../../../components/customers/CustomerModal";
import api from "../../../api/api";
import ErrorBoundary from "../products/ErrorBoundary";
const API_BASE_URL = "https://speedsofttest.com/api";

const Customers = () => {
  const [toasts, setToasts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllCustomers, setShowAllCustomers] = useState(true);
  const [showBalanceFilter, setShowBalanceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [seciliDosya, setSeciliDosya] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const toaster = useRef();
  const navigate = useNavigate();
  // Kullanıcı bilgileri
  const [user] = useState({
    id: 1002,
    aktiflikDurumu: 1,
    durumu: 1,
    yetkiId: 1,
    kullaniciAdi: "gizem",
  });

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

  const fetchData = async (url, setData) => {
    try {
      const { data } = await api.get(url);
      setData(Array.isArray(data) ? data : [data]);
      return data;
    } catch (err) {
      addToast(err.response?.data?.message || "Veriler yüklenemedi.", "error");
      return null;
    }
  };

  const mapApiCustomerToLocal = async (apiCustomer) => {
    let classificationName = "Bilinmiyor";
    try {
      if (apiCustomer.musteriSiniflandirmaId) {
        const classification = classifications.find(
          (c) => c.id === apiCustomer.musteriSiniflandirmaId,
        );
        if (classification) {
          classificationName = classification.adi;
        } else {
          const fetchedData = await fetchData(
            `${API_BASE_URL}/musteriSiniflandirma/get-by-id/${apiCustomer.musteriSiniflandirmaId}`,
            setClassifications,
          );
          classificationName =
            fetchedData && fetchedData.length > 0
              ? fetchedData[0].adi
              : "Bilinmiyor";
        }
      }
    } catch (err) {
      console.error("Dönüşüm Hatası:", err);
      classificationName = "Bilinmiyor";
    }

    return {
      id: apiCustomer.id,
      name: apiCustomer.unvani || "Bilinmiyor",
      openBalance: apiCustomer.acilisBakiye || 0,
      chequeBondBalance: 0,
      phone: apiCustomer.telefon || "",
      phone2: apiCustomer.telefon2 || "",
      classification: classificationName,
      email: apiCustomer.email || "",
      address: apiCustomer.adres || "",
      taxOffice: apiCustomer.vergiDairesi || "",
      taxOrIdNumber: apiCustomer.vergiNumarasi || "",
      accountingCode: apiCustomer.kodu || "",
      note: apiCustomer.aciklama || "",
      currency: apiCustomer.paraBirimi || "TRY",
      riskLimit: apiCustomer.riskLimiti || 0,
      dueDate: apiCustomer.vade || "",
      isTaxExempt: apiCustomer.vergiMuaf || false,
      bankInfo: apiCustomer.iban || apiCustomer.bankaBilgileri || "",
      contactPerson: apiCustomer.yetkiliKisi || "",
      otherContact: apiCustomer.diger || "",
      image: apiCustomer.fotograf || "",
      branches: apiCustomer.subeler || [],
      musteriSiniflandirmaId: apiCustomer.musteriSiniflandirmaId || 0,
    };
  };

  const fetchCustomers = async (updatedCustomerId = null) => {
    setLoading(true);
    try {
      await fetchData(`${API_BASE_URL}/musteriSiniflandirma/get-all`, setClassifications);
      const url = showAllCustomers
        ? `${API_BASE_URL}/musteri/musteri-get-all`
        : `${API_BASE_URL}/musteri/musteri-get-allaktif`;
      const { data } = await api.get(url);
      const mappedCustomers = await Promise.all(
        data.map(mapApiCustomerToLocal),
      );
      setCustomers(mappedCustomers);
      setError(null);

      // Eğer bir müşteri güncellendiyse, o müşteriyi bul ve modalı aç
      if (updatedCustomerId) {
        const updatedCustomer = mappedCustomers.find(
          (customer) => customer.id === updatedCustomerId,
        );
        if (updatedCustomer) {
          console.log("Seçilen müşteri:", updatedCustomer); // Seçilen müşteri verisini kontrol et
          setSelectedCustomer(updatedCustomer);
          setShowUpdateModal(true);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Müşteriler yüklenemedi.");
      addToast("Müşteriler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerClick = (customer) => {
    navigate(`/app/customer-detail/${customer.id}`, { state: { customer } });
  };

  const handleNewCustomer = () => {
    navigate(`/app/customer-new`);
  };

  const handleExcelUpload = () => {
    setShowExcelModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/musteri/download-template`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "musteri_sablonu.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast("Excel şablonu başarıyla indirildi.", "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Excel şablonu indirilemedi.",
        "error",
      );
    }
  };

  const handleFileChange = (e) => {
    setSeciliDosya(e.target.files[0]);
  };

  const handleUploadExcel = async () => {
    if (!seciliDosya) {
      addToast("Lütfen bir Excel dosyası seçin.", "error");
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", seciliDosya);
      formData.append("kullaniciId", user.id); // Kullanıcı ID'si (1002) ekleniyor

      // FormData içeriğini console'a yazdır
      console.log("Gönderilen FormData içeriği:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await api.post(`${API_BASE_URL}/musteri/upload-excel`, formData, {
        headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
      });
      await fetchCustomers(); // Müşterileri yeniden yükle
      addToast("Excel dosyası başarıyla yüklendi.", "success");
      setShowExcelModal(false);
      setSeciliDosya(null);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Excel dosyası yüklenemedi.",
        "error",
      );
    } finally {
      setUploadLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [showAllCustomers]);

  const filteredCustomers = customers
    .filter((customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((customer) =>
      showBalanceFilter === "balance" ? customer.openBalance > 0 : true,
    );

  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          <CButton
            color="success"
            style={{ color: "white" }}
            onClick={handleNewCustomer}
          >
            <CIcon icon={cilPlus} /> Yeni Müşteri Ekle
          </CButton>
          <CButton
            color="primary"
            style={{ color: "white" }}
            onClick={handleExcelUpload}
            className="ms-2"
          >
            <CIcon icon={cilCloudUpload} /> Excel'den Müşteri Yükle
          </CButton>
        </CCol>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            color: "#2965A8",
            padding: "5px 8px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
            maxWidth: "200px",
            textAlign: "center",
            margin: "10px 15px 0 0",
          }}
        >
          Toplam Müşteri: {filteredCustomers.length}
        </div>
      </CRow>
      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
        >
          <div className="d-flex flex-row justify-content-between align-items-center">
            <div className="d-flex">
              <div className="me-2">
                <CFormCheck
                  type="radio"
                  button={{ color: "light", variant: "outline" }}
                  name="statusFilter"
                  id="filterAll"
                  autoComplete="off"
                  label="Tüm Müşteriler"
                  checked={showAllCustomers}
                  onChange={() => setShowAllCustomers(true)}
                />
              </div>
              <div>
                <CFormCheck
                  type="radio"
                  button={{ color: "light", variant: "outline" }}
                  name="statusFilter"
                  id="filterActive"
                  autoComplete="off"
                  label="Aktif Müşteriler"
                  checked={!showAllCustomers}
                  onChange={() => setShowAllCustomers(false)}
                />
              </div>
            </div>
            <div className="d-flex flex-row">
              <CFormSelect
                value={showBalanceFilter}
                onChange={(e) => setShowBalanceFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="all">Hepsini Göster</option>
                <option value="balance">Bakiyesi Olanlar</option>
              </CFormSelect>
            </div>
            <CFormInput
              type="text"
              placeholder="Müşteri ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "200px" }}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && (
            <CustomerTable
              customers={filteredCustomers}
              onCustomerClick={handleCustomerClick}
              fetchCustomers={fetchCustomers}
            />
          )}
        </CCardBody>
      </CCard>
      <CModal
        size="lg"
        visible={showExcelModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setShowExcelModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Excel ile Müşteri Yükleme</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CButton
            color="primary"
            style={{ color: "white" }}
            onClick={handleDownloadTemplate}
            disabled={loading}
          >
            <CIcon icon={cilCloudUpload} /> Excel Şablonu İndir
          </CButton>
          <p className="mt-3">
            Müşterilerinizi tek tek tanımlamak yerine, Excel şablonunu indirin
            ve doldurun.
          </p>
          <CFormInput
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="mb-3"
          />
          <CButton
            color="success"
            style={{ color: "white" }}
            onClick={handleUploadExcel}
            disabled={uploadLoading || loading}
          >
            {uploadLoading ? (
              <CSpinner size="sm" />
            ) : (
              <>
                <CIcon icon={cilCloudUpload} /> Excel Şablonu Yükle
              </>
            )}
          </CButton>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowExcelModal(false)}
            disabled={uploadLoading || loading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
      <CustomerModal
        visible={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedCustomer(null);
        }}
        onSubmit={(data) => {
          setCustomers((prev) =>
            prev.map((customer) =>
              customer.id === data.id ? { ...customer, ...data } : customer,
            ),
          );
          addToast("Müşteri güncellendi.", "success");
          setShowUpdateModal(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        addToast={addToast}
      />
    </ErrorBoundary>
  );
};

export default Customers;