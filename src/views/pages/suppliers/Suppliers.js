import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
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
  CModalFooter,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilCloudUpload } from "@coreui/icons";
import SupplierTable from "../../../components/suppliers/SupplierTable";
import SupplierModal from "../../../components/suppliers/SupplierModal";
import api from "../../../api/api";
import ErrorBoundary from "../products/ErrorBoundary";
const API_BASE_URL = "https://localhost:44375/api";

const Suppliers = () => {
  const [toasts, setToasts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllSuppliers, setShowAllSuppliers] = useState(true);
  const [selectedClassification, setSelectedClassification] = useState("");
  const [showBalanceFilter, setShowBalanceFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // States for update functionality
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // States for delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const toaster = useRef();
  const navigate = useNavigate();

  const addToast = useCallback((message, type = "success") => {
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
  }, []);

  const fetchData = useCallback(
    async (url, setData) => {
      try {
        const { data } = await api.get(url);
        const result = Array.isArray(data) ? data : [data];
        const filtered = result.filter((item) => item.durumu === 1);
        setData(filtered);
        console.log(`fetchData (${url}) sonucu:`, filtered);
        return filtered;
      } catch (err) {
        console.error(`fetchData Hatası (${url}):`, {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        addToast(
          err.response?.data?.message || "Veriler yüklenemedi.",
          "error",
        );
        return [];
      }
    },
    [addToast],
  );

  const mapApiSupplierToLocal = (apiSupplier, classifications) => {
    const classification = apiSupplier.tedarikciSiniflandirmaId
      ? classifications.find(
          (c) => c.id === apiSupplier.tedarikciSiniflandirmaId,
        )
      : null;
    const classificationName = classification?.adi || "Bilinmiyor";

    if (apiSupplier.tedarikciSiniflandirmaId && !classification) {
      console.warn(
        `Sınıflandırma bulunamadı (Tedarikçi ID: ${apiSupplier.id}, Sınıflandırma ID: ${apiSupplier.tedarikciSiniflandirmaId})`,
      );
    }

    return {
      id: apiSupplier.id,
      name: apiSupplier.unvan || "Bilinmiyor",
      openBalance: apiSupplier.acilisBakiyesi || 0,
      chequeBondBalance: 0,
      phone: apiSupplier.telefon || "",
      classification: classificationName,
      email: apiSupplier.email || "",
      address: apiSupplier.adres || "",
      taxOffice: apiSupplier.vergiDairesi || "",
      taxOrIdNumber: apiSupplier.vergiNo || "",
      accountingCode: apiSupplier.kodu || "",
      note: apiSupplier.aciklama || "",
      currency: apiSupplier.paraBirimi || "TRY",
      dueDate: apiSupplier.vadeGun || "",
      isTaxExempt: apiSupplier.vergiMuaf || false,
      bankInfo: apiSupplier.bankaBilgileri || "",
      contactPerson: apiSupplier.yetkiliKisi || "",
      otherContact: apiSupplier.diger || "",
      // Add API fields for update operations
      tedarikciSiniflandirmaId: apiSupplier.tedarikciSiniflandirmaId,
    };
  };

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const classificationsData = await fetchData(
        `${API_BASE_URL}/tedarikciSiniflandirma/get-all`,
        setClassifications,
      );
      if (!classificationsData.length) {
        console.warn("Sınıflandırmalar boş, veri tutarsızlığı olabilir.");
      }

      const url = showAllSuppliers
        ? `${API_BASE_URL}/tedarikci/tedarikci-get-all`
        : `${API_BASE_URL}/tedarikci/tedarikci-get-allaktif`;
      const { data } = await api.get(url);
      console.log("Tedarikçi verileri:", data);
      const mappedSuppliers = data
        .filter((supplier) => supplier.durumu === 1)
        .map((supplier) =>
          mapApiSupplierToLocal(supplier, classificationsData),
        );
      setSuppliers(mappedSuppliers);
      setError(null);
      addToast("Tedarikçiler başarıyla yüklendi.", "success");
    } catch (err) {
      console.error("Tedarikçi Yükleme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || "Tedarikçiler yüklenemedi.");
      addToast("Tedarikçiler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAllSuppliers, fetchData, addToast]);

  // Handle supplier update
  const handleSupplierUpdate = (supplier) => {
    setSelectedSupplier(supplier);
    setShowUpdateModal(true);
  };

  // Handle showing delete modal
  const handleShowDeleteModal = (supplierId) => {
    setSupplierToDelete(supplierId);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;

    setDeleteLoading(true);
    try {
      console.log("Silme isteği gönderiliyor: ID =", supplierToDelete);

      const response = await api.delete(
        `${API_BASE_URL}/tedarikci/tedarikci-delete/${supplierToDelete}`,
        { headers: { accept: "*/*" } },
      );

      if (response.status === 200 || response.status === 204) {
        addToast("Tedarikçi başarıyla silindi.", "success");
        await fetchSuppliers();
      } else {
        throw new Error("Silme işlemi başarısız");
      }
    } catch (err) {
      console.error("Silme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(
        err.response?.data?.message ||
          "Tedarikçi silinemedi. Lütfen tekrar deneyin.",
        "error",
      );
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
      setSupplierToDelete(null);
    }
  };

  // Handle supplier update submission
  const handleUpdateSubmit = (updatedData) => {
    if (!selectedSupplier) return;

    // The API update is already handled in SupplierModal.js handleSubmit
    // Here we just handle UI updates: close modal, refresh table
    setShowUpdateModal(false);
    setSelectedSupplier(null);
    fetchSuppliers();
  };

  const handleSupplierClick = (supplier) => {
    navigate(`/app/supplier-detail/${supplier.id}`, { state: { supplier } });
  };

  const handleNewSupplier = () => {
    navigate(`/app/supplier-new`);
  };

  const handleExcelUpload = () => {
    setShowExcelModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/tedarikci/download-template`,
        {
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "tedarikci_sablonu.xlsx");
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
    setSelectedFile(e.target.files[0]);
  };

  const handleUploadExcel = async () => {
    if (!selectedFile) {
      addToast("Lütfen bir Excel dosyası seçin.", "error");
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      await api.post(
        `${API_BASE_URL}/tedarikci/upload-excel`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            accept: "*/*",
          },
        },
      );
      await fetchSuppliers();
      addToast("Excel dosyası başarıyla yüklendi.", "success");
      setShowExcelModal(false);
      setSelectedFile(null);
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
    fetchSuppliers();
  }, [fetchSuppliers]);

  const filteredSuppliers = suppliers
    .filter((supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((supplier) =>
      selectedClassification
        ? supplier.classification === selectedClassification
        : true,
    )
    .filter((supplier) =>
      showBalanceFilter === "balance"
        ? supplier.openBalance > 0 || supplier.chequeBondBalance > 0
        : true,
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
            style={{
              color: "white",
              marginRight: "10px",
              marginBottom: "15px",
            }}
            onClick={handleNewSupplier}
          >
            <CIcon icon={cilPlus} /> Yeni Tedarikçi Ekle
          </CButton>
          <CButton
            color="primary"
            style={{
              color: "white",
              marginRight: "10px",
              marginBottom: "15px",
            }}
            onClick={handleExcelUpload}
          >
            <CIcon icon={cilCloudUpload} /> Excel'den Tedarikçi Yükle
          </CButton>
        </CCol>

        <div
          style={{
            backgroundColor: "#FFFFFF",
            color: "#2965A8",
            padding: "5px 10px",
            borderRadius: "4px",
            fontWeight: "bold",
            fontSize: "14px",
            maxHeight: "35px",
            maxWidth: "200px",
            textAlign: "center",
            margin: "10px 15px 0 0",
          }}
        >
          Toplam Tedarikçi: {filteredSuppliers.length}
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
            {/* Sekmeler */}
            <div className="d-flex align-items-center gap-2">
              <CFormCheck
                type="radio"
                button={{ color: "light", variant: "outline" }}
                name="statusFilter"
                id="filterAll"
                autoComplete="off"
                label="Tüm Tedarikçiler"
                checked={showAllSuppliers}
                onChange={() => setShowAllSuppliers(true)}
              />
              <CFormCheck
                type="radio"
                button={{ color: "light", variant: "outline" }}
                name="statusFilter"
                id="filterActive"
                autoComplete="off"
                label="Aktif Tedarikçiler"
                checked={!showAllSuppliers}
                onChange={() => setShowAllSuppliers(false)}
              />
            </div>

            {/* Filtreler */}
            <div className="d-flex align-items-center gap-2">
              <CFormSelect
                value={selectedClassification}
                onChange={(e) => setSelectedClassification(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="">Tüm Sınıflandırmalar</option>
                {classifications.map((c) => (
                  <option key={c.id} value={c.adi}>
                    {c.adi}
                  </option>
                ))}
              </CFormSelect>

              <CFormSelect
                value={showBalanceFilter}
                onChange={(e) => setShowBalanceFilter(e.target.value)}
                style={{ width: "200px" }}
              >
                <option value="all">Hepsini Göster</option>
                <option value="balance">Bakiyesi Olanları Göster</option>
              </CFormSelect>
            </div>

            {/* Arama */}
            <CFormInput
              type="text"
              placeholder="Tedarikçi ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "200px" }}
              className="ms-2"
            />
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <p className="text-danger">{error}</p>}
          <SupplierTable
            suppliers={filteredSuppliers}
            onSupplierClick={handleSupplierClick}
            onUpdate={handleSupplierUpdate}
            onDelete={handleShowDeleteModal} // Changed to show modal
            loading={loading}
          />
        </CCardBody>
      </CCard>

      {/* Excel Upload Modal */}
      <CModal
        size="lg"
        visible={showExcelModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setShowExcelModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Excel ile Tedarikçi Yükleme</CModalTitle>
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
            Tedarikçilerinizi tek tek tanımlamak yerine, Excel şablonunu indirin
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

      {/* Update Supplier Modal */}
      <SupplierModal
        visible={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleUpdateSubmit}
        supplier={selectedSupplier}
        addToast={addToast}
        classifications={classifications}
      />

      {/* Delete Confirmation Modal */}
      <CModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSupplierToDelete(null);
        }}
        backdrop="static"
      >
        <CModalHeader
          style={{
            backgroundColor: "var(--primary-color)",
            color: "var(--white-color)",
          }}
        >
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Bu tedarikçiyi silmek istediğinizden emin misiniz?</p>
        </CModalBody>
        <CModalFooter>
          <CButton
            style={{
              backgroundColor: "var(--primary-color)",
              color: "var(--white-color)",
            }}
            onClick={handleConfirmDelete}
            disabled={deleteLoading}
          >
            {deleteLoading ? <CSpinner size="sm" /> : "Tamam"}
          </CButton>
          <CButton
            style={{
              backgroundColor: "var(--secondary-color)",
              color: "var(--white-color)",
            }}
            onClick={() => {
              setShowDeleteModal(false);
              setSupplierToDelete(null);
            }}
            disabled={deleteLoading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
    </ErrorBoundary>
  );
};

export default Suppliers;
