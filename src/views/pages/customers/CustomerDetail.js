import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CFormSelect,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPen, cilPlus, cilTrash } from "@coreui/icons";
import CustomerModal from "../../../components/customers/CustomerModal";
import api from "../../../api/api";

const CustomerDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(state?.customer || null);
  const [sales, setSales] = useState([]);
  const [offers, setOffers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState("");
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showBranchUpdateModal, setShowBranchUpdateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [formData, setFormData] = useState({
    adi: "",
    adres: "",
    kodu: "",
    aktif: true,
  });
  const API_BASE_URL = "https://localhost:44375/api";

  const [saleFormData, setSaleFormData] = useState({
    barkod: "",
    urunAdi: "",
    fiyat: "",
    birim: "adet",
    miktar: "",
    toplamFiyat: "",
    musteriId: id,
  });
  const [saleItems, setSaleItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaleUpdateModal, setShowSaleUpdateModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    console.log("Müşteri image:", customer?.image);
  }, [customer]);

  const addToast = (message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide={true} visible={true} delay={5000}>
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error"
              ? "Hata"
              : type === "warning"
                ? "Uyarı"
                : "Başarılı"}
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
      const result = Array.isArray(data)
        ? data.filter((item) => item.durumu === 1)
        : data?.durumu === 1
          ? [data]
          : [];
      setData(result);
      return result;
    } catch (err) {
      console.error("Veri Yükleme Hatası:", {
        url,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(err.response?.data?.message || "Veriler yüklenemedi.", "error");
      return null;
    }
  };

  const mapApiCustomer = async (apiCustomer) => {
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
      chequeBalance: 0,
      bondBalance: 0,
      turnover: 0,
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
      bankInfo: apiCustomer.bankaBilgileri || "",
      contactPerson: apiCustomer.yetkiliKisi || "",
      otherContact: apiCustomer.diger || "",
      image: apiCustomer.fotograf || null,
    };
  };

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData(
        `${API_BASE_URL}/musteriSiniflandirma/get-all`,
        setClassifications,
      );
      const { data } = await api.get(
        `${API_BASE_URL}/musteri/musteri-get-by-id/${id}`,
      );
      console.log("Müşteri API Yanıtı:", data);

      const customerData = Array.isArray(data) ? data[0] : data;

      if (!customerData || customerData.durumu !== 1) {
        throw new Error("Müşteri bulunamadı veya aktif değil.");
      }

      const mappedCustomer = await mapApiCustomer(customerData);
      setCustomer(mappedCustomer);
      setError(null);
    } catch (err) {
      console.error("Müşteri Yükleme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || "Müşteri yüklenemedi.");
      addToast("Müşteri yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchBranches = async () => {
    try {
      const data = await fetchData(
        `${API_BASE_URL}/sube/sube-get-by-musteriId/${id}`,
        setBranches,
      );
      if (data) {
        setBranches(data);
      }
    } catch (err) {
      addToast("Şube verileri yüklenemedi.", "error");
    }
  };

  const fetchSales = async () => {
    try {
      const data = await fetchData(
        `${API_BASE_URL}/musteriSatis/musteriSatis-get-by-musteri/${id}`,
        setSales,
      );
      if (data) {
        setSales(data);
      }
    } catch (err) {
      addToast("Satış verileri yüklenemedi.", "error");
    }
  };

  // Debounce yardımcı fonksiyonu
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Barkod ile ürün getirme fonksiyonu
  const fetchProductByBarcode = async (barcode) => {
    if (!barcode || barcode.length < 3) return;

    try {
      const { data } = await api.get(
        `${API_BASE_URL}/urun/urun-get-barcode?barkod=${barcode}`,
      );

      if (data && data.length > 0) {
        const product = data[0];

        setSaleFormData((prev) => ({
          ...prev,
          barkod: barcode,
          urunAdi: product.adi || "",
          fiyat: product.satisFiyat ? product.satisFiyat.toString() : "",
          birim: product.birimAdi || "adet",
          miktar: prev.miktar,
          toplamFiyat: prev.miktar
            ? (parseFloat(prev.miktar) * product.satisFiyat).toFixed(2)
            : "",
          musteriId: id,
        }));

        // Stok durumunu kontrol et
        if (product.stokMiktari !== undefined && product.stokMiktari <= 0) {
          addToast("Uyarı: Bu ürün stokta yok!", "warning");
        } else if (
          product.kritikStok &&
          product.stokMiktari <= product.kritikStok
        ) {
          addToast(
            `Uyarı: Stok kritik seviyede (${product.stokMiktari} adet)`,
            "warning",
          );
        }
      }
    } catch (err) {
      console.error("Barkod ile ürün getirme hatası:", err);
    }
  };

  // Debounced barkod değişiklik handler'ı
  const handleBarcodeChange = useCallback(
    debounce((value) => {
      fetchProductByBarcode(value);
    }, 800),
    [],
  );

  const handleAddBranch = async () => {
    if (!formData.adi) {
      addToast("Şube adı zorunludur.", "error");
      return;
    }
    if (!id || isNaN(parseInt(id))) {
      addToast("Geçersiz müşteri ID'si.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        adi: formData.adi,
        adres: formData.adres || "a",
        kodu: formData.kodu || "b",
        aktif: formData.aktif ? 1 : 0,
        musteriId: parseInt(id),
      };
      console.log("Şube Ekleme Payload:", payload);
      const { data } = await api.post(
        `${API_BASE_URL}/sube/sube-create`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
        },
      );
      console.log("Şube Ekleme Yanıtı:", data);
      addToast(data.message || "Şube başarıyla eklendi.", "success");
      await fetchBranches();
      setShowBranchModal(false);
      setFormData({ adi: "", adres: "", kodu: "", aktif: true });
    } catch (err) {
      console.error("Şube Ekleme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(err.response?.data?.message || "Şube eklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      adi: branch.adi,
      adres: branch.adres,
      kodu: branch.kodu,
      aktif: branch.aktif === 1,
    });
    setShowBranchUpdateModal(true);
  };

  const handleUpdateBranch = async () => {
    if (!formData.adi) {
      addToast("Şube adı zorunludur.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: selectedBranch.id,
        adi: formData.adi,
        adres: formData.adres || "",
        kodu: formData.kodu || "",
        aktif: formData.aktif ? 1 : 0,
        musteriId: parseInt(id),
      };
      await api.put(`${API_BASE_URL}/sube/sube-update`, payload, {
        headers: { "Content-Type": "application/json" },
      });
      addToast("Şube güncellendi.", "success");
      setShowBranchUpdateModal(false);
      await fetchBranches();
    } catch (err) {
      addToast(err.response?.data?.message || "Şube güncellenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/sube/sube-delete/${branchId}`,
      );
      addToast("Şube başarıyla silindi.", "success");
      await fetchBranches();
    } catch (err) {
      console.error("Şube Silme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(err.response?.data?.message || "Şube silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchTablesData = async () => {
    try {
      await fetchSales();
      setOffers([]);
      setPurchases([]);
      setPayments([]);
      await fetchBranches();
      addToast("Tablo verileri yüklenemedi, API sağlanmadı.", "error");
    } catch (err) {
      addToast("Veriler yüklenemedi.", "error");
    }
  };

  useEffect(() => {
    if (id && (!customer || !customer.id)) {
      fetchCustomer();
    } else {
      fetchCustomer();
    }
    fetchSales();
    fetchBranches();
  }, [id, fetchCustomer]);

  const handleItemClick = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setShowModal(true);
  };

  const handleAction = (action) => {
    if (action === "Satış Yap") {
      setShowSaleModal(true);
    } else {
      addToast(`${action} işlemi başlatıldı.`, "success");
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteri/musteri-delete/${customer.id}`,
      );
      addToast("Müşteri silindi.", "success");
      navigate("/app/customers");
    } catch (err) {
      console.error("Müşteri Silme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(err.response?.data?.message || "Müşteri silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      await api.put(
        `${API_BASE_URL}/musteri/musteri-aktif/${customer.id}`,
      );
      addToast("Müşteri aktif edildi.", "success");
      fetchCustomer();
    } catch (err) {
      console.error("Müşteri Aktif Etme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(
        err.response?.data?.message || "Müşteri aktif edilemedi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddSaleItem = () => {
    if (
      !saleFormData.barkod ||
      !saleFormData.urunAdi ||
      !saleFormData.fiyat ||
      !saleFormData.miktar
    ) {
      addToast("Tüm alanlar doldurulmalıdır.", "error");
      return;
    }
    if (
      isNaN(saleFormData.fiyat) ||
      isNaN(saleFormData.miktar) ||
      parseFloat(saleFormData.fiyat) <= 0 ||
      parseFloat(saleFormData.miktar) <= 0
    ) {
      addToast("Fiyat ve miktar pozitif sayılar olmalıdır.", "error");
      return;
    }

    const newItem = {
      id: Date.now(),
      barkod: saleFormData.barkod,
      urunAdi: saleFormData.urunAdi,
      fiyat: parseFloat(saleFormData.fiyat),
      birim: saleFormData.birim,
      miktar: parseFloat(saleFormData.miktar),
      toplamFiyat:
        parseFloat(saleFormData.fiyat) * parseFloat(saleFormData.miktar),
      musteriId: id,
    };

    setSaleItems((prev) => [...prev, newItem]);
    setSaleFormData({
      barkod: "",
      urunAdi: "",
      fiyat: "",
      birim: "adet",
      miktar: "",
      toplamFiyat: "",
      musteriId: id,
    });
    addToast("Ürün sepete eklendi.", "success");

    // Barkod input'una tekrar focus ver
    setTimeout(() => {
      document.querySelector('input[name="barkod"]')?.focus();
    }, 100);
  };

  const handleDeleteSaleItem = (itemId) => {
    setSaleItems((prev) => prev.filter((item) => item.id !== itemId));
    addToast("Ürün silindi.", "success");
  };

  const calculateTotalPrice = () => {
    return saleItems
      .reduce((sum, item) => sum + item.toplamFiyat, 0)
      .toLocaleString("tr-TR");
  };

  const handleSaveSales = async () => {
    if (saleItems.length === 0) {
      addToast("En az bir ürün ekleyin.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = saleItems.map((item) => ({
        barkod: item.barkod,
        urunAdi: item.urunAdi,
        fiyat: item.fiyat,
        birim: item.birim,
        miktar: item.miktar,
        toplamFiyat: item.toplamFiyat,
        musteriId: parseInt(id),
      }));
      await api.post(
        `${API_BASE_URL}/musteriSatis/musteriSatis-create`,
        payload,
      );
      addToast("Satış(lar) kaydedildi.", "success");
      setShowSaleModal(false);
      setSaleItems([]);
      fetchSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış kaydedilemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setSaleFormData({
      barkod: sale.barkod,
      urunAdi: sale.urunAdi,
      fiyat: sale.fiyat,
      birim: sale.birim,
      miktar: sale.miktar,
      toplamFiyat: sale.toplamFiyat,
      musteriId: id,
    });
    setShowSaleUpdateModal(true);
  };

  const handleUpdateSale = async () => {
    if (
      !saleFormData.barkod ||
      !saleFormData.urunAdi ||
      !saleFormData.fiyat ||
      !saleFormData.miktar
    ) {
      addToast("Tüm alanlar doldurulmalıdır.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: selectedSale.id,
        barkod: saleFormData.barkod,
        urunAdi: saleFormData.urunAdi,
        fiyat: parseFloat(saleFormData.fiyat),
        birim: saleFormData.birim,
        miktar: parseFloat(saleFormData.miktar),
        toplamFiyat:
          parseFloat(saleFormData.fiyat) * parseFloat(saleFormData.miktar),
        musteriId: parseInt(id),
      };
      await api.put(
        `${API_BASE_URL}/musteriSatis/musteriSatis-update`,
        payload,
      );
      addToast("Satış güncellendi.", "success");
      setShowSaleUpdateModal(false);
      fetchSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış güncellenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId) => {
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteriSatis/musteriSatis-delete/${saleId}`,
      );
      addToast("Satış silindi.", "success");
      fetchSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !customer) {
    return (
      <CCard>
        <CCardHeader>Müşteri Bilgisi</CCardHeader>
        <CCardBody>
          {loading ? <p>Yükleniyor...</p> : <p>Müşteri bulunamadı.</p>}
          <CButton color="primary" onClick={() => navigate("/app/customers")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CToaster placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader
              style={{
                backgroundColor: "#2965A8",
                color: "#fff",
                fontSize: "24px",
              }}
            >
              <CRow className="align-items-center">
                <CCol xs={2}>
                  <img
                    src={
                      customer.image
                        ? `https://speedsofttest.com/${customer.image}`
                        : `https://speedsofttest.com/${customer.image}`
                    }
                    alt="Müşteri resmi"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                  />
                </CCol>
                <CCol xs={8}>
                  <h3>{customer.name.toUpperCase()}</h3>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Telefon:</strong> {customer.phone}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Telefon 2:</strong> {customer.phone2 || "Yok"}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>E-Posta:</strong> {customer.email}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Adres:</strong> {customer.address}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Vergi Dairesi/No:</strong> {customer.taxOffice}/
                    {customer.taxOrIdNumber}
                  </p>
                </CCol>
                <CCol
                  xs={2}
                  className="d-flex justify-content-end align-items-center gap-2"
                ></CCol>
              </CRow>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className="bg-danger"
                      style={{ color: "white" }}
                    >
                      Açık Bakiye
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {(customer.openBalance || 0).toLocaleString("tr-TR")}{" "}
                        TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className="bg-warning"
                      style={{ color: "white" }}
                    >
                      Çek Bakiyesi
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {(customer.chequeBalance || 0).toLocaleString("tr-TR")}{" "}
                        TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol>
                  <CCard>
                    <CCardHeader className="bg-info" style={{ color: "white" }}>
                      Senet Bakiyesi
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {(customer.bondBalance || 0).toLocaleString("tr-TR")}{" "}
                        TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className="bg-success"
                      style={{ color: "white" }}
                    >
                      Ciro
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {(customer.turnover || 0).toLocaleString("tr-TR")} TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} className="my-3 d-flex">
          <div className="d-flex gap-2">
            <CButton
              color="success"
              style={{ color: "white" }}
              onClick={() => handleAction("Satış Yap")}
              disabled={false}
            >
              Satış Yap
            </CButton>
            <CButton
              color="primary"
              style={{ color: "white", backgroundColor: "#2965A8" }}
              onClick={() => setShowBranchModal(true)}
              disabled={loading}
            >
              Yeni Şube Ekle
            </CButton>
            <CDropdown>
              <CDropdownToggle
                color="info"
                style={{ color: "white" }}
                disabled={true}
              >
                Ödeme/Tahsilat
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  onClick={() => handleAction("Nakit-Kredi Kartı-Banka")}
                  disabled={true}
                >
                  Nakit-Kredi Kartı-Banka
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Temazsız Kredi Kartı")}
                  disabled={true}
                >
                  Temazsız Kredi Kartı
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Çek")}
                  disabled={true}
                >
                  Çek
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Müşteriden Senet Al")}
                  disabled={true}
                >
                  Müşteriden Senet Al
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Müşteriye Senet Ver")}
                  disabled={true}
                >
                  Müşteriye Senet Ver
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Bakiye Düzelt")}
                  disabled={true}
                >
                  Bakiye Düzelt
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Borç-Alacak Fişleri")}
                  disabled={true}
                >
                  Borç-Alacak Fişleri
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Cari Virman")}
                  disabled={true}
                >
                  Cari Virman
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>

            <CDropdown>
              <CDropdownToggle color="secondary" disabled={true}>
                Hesap Ekstresi
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  onClick={() => handleAction("Ekstre Linki")}
                  disabled={true}
                >
                  Ekstre Linki
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Ekstre")}
                  disabled={true}
                >
                  Ekstre
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Detaylı Ekstre")}
                  disabled={true}
                >
                  Detaylı Ekstre
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Mutabakat Mektubu")}
                  disabled={true}
                >
                  Mutabakat Mektubu
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CButton
              color="primary"
              style={{ color: "white" }}
              onClick={() => handleAction("Döküman Yükle")}
              disabled={true}
            >
              Döküman Yükle
            </CButton>
            <CDropdown>
              <CDropdownToggle color="secondary">
                Diğer İşlemler
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setShowUpdateModal(true)}>
                  Müşteri Bilgilerini Güncelle
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("E-Posta Gönderi Durumu")}
                  disabled={true}
                >
                  E-Posta Gönderi Durumu
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Alış Yap")}
                  disabled={true}
                >
                  Alış Yap
                </CDropdownItem>
                <CDropdownItem onClick={() => setShowDeleteModal(true)}>
                  Müşteriyi Sil
                </CDropdownItem>
                <CDropdownItem onClick={handleActivate}>
                  Müşteriyi Aktif Et
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Etiket Yazdır")}
                  disabled={true}
                >
                  Etiket Yazdır
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCol>
        <CCol xs={12}>
          <CRow>
            {[
              { title: "Önceki Satışlar", data: sales, type: "sales" },
              { title: "Önceki Ödemeler", data: payments, type: "payments" },
              { title: "Şubeler", data: branches, type: "branches" },
            ].map((table) => (
              <CCol key={table.title} className="mt-3">
                <CCard>
                  <CCardHeader
                    style={{ backgroundColor: "#2965A8", color: "white" }}
                  >
                    {table.title}
                  </CCardHeader>
                  <CCardBody>
                    <CTable responsive>
                      <CTableHead>
                        <CTableRow>
                          {table.type === "branches" ? (
                            <>
                              <CTableHeaderCell>Şube Adı</CTableHeaderCell>
                              <CTableHeaderCell>Adres</CTableHeaderCell>
                              <CTableHeaderCell>Kod</CTableHeaderCell>
                              <CTableHeaderCell>Aktif</CTableHeaderCell>
                              <CTableHeaderCell>İşlemler</CTableHeaderCell>
                            </>
                          ) : table.type === "sales" ? (
                            <>
                              <CTableHeaderCell>Barkod</CTableHeaderCell>
                              <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                              <CTableHeaderCell>Fiyat</CTableHeaderCell>
                              <CTableHeaderCell>Birim</CTableHeaderCell>
                              <CTableHeaderCell>Miktar</CTableHeaderCell>
                              <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                              <CTableHeaderCell>İşlemler</CTableHeaderCell>
                            </>
                          ) : (
                            <>
                              <CTableHeaderCell>Tarih</CTableHeaderCell>
                              <CTableHeaderCell>No</CTableHeaderCell>
                              <CTableHeaderCell>Durum</CTableHeaderCell>
                              <CTableHeaderCell>Tutar</CTableHeaderCell>
                            </>
                          )}
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {table.type === "branches"
                          ? branches.map((branch) => (
                              <CTableRow key={branch.id}>
                                <CTableDataCell>
                                  {branch.adi || "Bilinmiyor"}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {branch.adres || "Yok"}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {branch.kodu || "Yok"}
                                </CTableDataCell>
                                <CTableDataCell>
                                  {branch.aktif ? "Evet" : "Hayır"}
                                </CTableDataCell>
                                <CTableDataCell>
                                  <div className="d-flex gap-2">
                                    <CButton
                                      color="info"
                                      size="sm"
                                      onClick={() => handleEditBranch(branch)}
                                      style={{ color: "white" }}
                                    >
                                      <CIcon icon={cilPen} />
                                    </CButton>
                                    <CButton
                                      color="danger"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteBranch(branch.id)
                                      }
                                      style={{ color: "white" }}
                                    >
                                      <CIcon icon={cilTrash} />
                                    </CButton>
                                  </div>
                                </CTableDataCell>
                              </CTableRow>
                            ))
                          : table.type === "sales"
                            ? sales.map((sale) => (
                                <CTableRow key={sale.id}>
                                  <CTableDataCell>{sale.barkod}</CTableDataCell>
                                  <CTableDataCell>
                                    {sale.urunAdi}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    {sale.fiyat.toLocaleString("tr-TR")} TRY
                                  </CTableDataCell>
                                  <CTableDataCell>{sale.birim}</CTableDataCell>
                                  <CTableDataCell>{sale.miktar}</CTableDataCell>
                                  <CTableDataCell>
                                    {sale.toplamFiyat.toLocaleString("tr-TR")}{" "}
                                    TRY
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <div className="d-flex gap-2">
                                      <CButton
                                        color="info"
                                        size="sm"
                                        onClick={() => handleEditSale(sale)}
                                        style={{ color: "white" }}
                                      >
                                        <CIcon icon={cilPen} />
                                      </CButton>
                                      <CButton
                                        color="danger"
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteSale(sale.id)
                                        }
                                        style={{ color: "white" }}
                                      >
                                        <CIcon icon={cilTrash} />
                                      </CButton>
                                    </div>
                                  </CTableDataCell>
                                </CTableRow>
                              ))
                            : table.data.map((item) => (
                                <CTableRow
                                  key={item.id}
                                  onClick={() =>
                                    handleItemClick(item, table.type)
                                  }
                                >
                                  <CTableDataCell>
                                    <CButton
                                      color="success"
                                      size="sm"
                                      style={{ color: "white" }}
                                      onClick={() =>
                                        handleItemClick(null, table.type)
                                      }
                                    >
                                      <CIcon icon={cilPlus} /> Yeni
                                    </CButton>
                                  </CTableDataCell>
                                  <CTableDataCell>{item.date}</CTableDataCell>
                                  <CTableDataCell>{item.no}</CTableDataCell>
                                  <CTableDataCell>{item.status}</CTableDataCell>
                                  <CTableDataCell>
                                    {item.amount.toLocaleString("tr-TR")} TRY
                                  </CTableDataCell>
                                </CTableRow>
                              ))}
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>
        </CCol>
      </CRow>
      <CModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>
            {modalType.charAt(0).toUpperCase() + modalType.slice(1)} Detayları
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Ürün/Hizmet Adı</CTableHeaderCell>
                <CTableHeaderCell>Fiyat</CTableHeaderCell>
                <CTableHeaderCell>Tutar</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {selectedItem && (
                <CTableRow>
                  <CTableDataCell>{selectedItem.name}</CTableDataCell>
                  <CTableDataCell>
                    {selectedItem.price.toLocaleString("tr-TR")} TRY
                  </CTableDataCell>
                  <CTableDataCell>
                    {selectedItem.amount.toLocaleString("tr-TR")} TRY
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
          <p>
            <strong>Açıklama:</strong> {selectedItem?.description || "Yok"}
          </p>
          <p>
            <strong>Kullanıcı:</strong> {selectedItem?.user || "Bilinmiyor"}
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={() => navigate(`/app/${modalType}-entry`)}
            style={{ color: "white" }}
          >
            Satış Ekranına Git
          </CButton>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showBranchModal}
        onClose={() => setShowBranchModal(false)}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
          <CModalTitle>Yeni Şube Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Adı</CFormLabel>
              <CFormInput
                type="text"
                name="adi"
                value={formData.adi}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adi: e.target.value }))
                }
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Adresi</CFormLabel>
              <CFormInput
                type="text"
                name="adres"
                value={formData.adres}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adres: e.target.value }))
                }
              />
            </div>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Kodu</CFormLabel>
              <CFormInput
                type="text"
                name="kodu"
                value={formData.kodu}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, kodu: e.target.value }))
                }
              />
            </div>
            <div className="mb-3">
              <CFormCheck
                label="Aktif"
                name="aktif"
                checked={formData.aktif}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, aktif: e.target.checked }))
                }
                style={{ color: "white" }}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            style={{ backgroundColor: "#2965A8", color: "white" }}
            onClick={handleAddBranch}
            disabled={loading}
          >
            Ekle
          </CButton>
          <CButton
            color="secondary"
            style={{ color: "white" }}
            onClick={() => {
              setShowBranchModal(false);
              setFormData({ adi: "", adres: "", kodu: "", aktif: true });
            }}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showBranchUpdateModal}
        onClose={() => setShowBranchUpdateModal(false)}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
          <CModalTitle>Şube Güncelle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Adı</CFormLabel>
              <CFormInput
                type="text"
                name="adi"
                value={formData.adi}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adi: e.target.value }))
                }
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Adresi</CFormLabel>
              <CFormInput
                type="text"
                name="adres"
                value={formData.adres}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, adres: e.target.value }))
                }
              />
            </div>
            <div className="mb-3">
              <CFormLabel className="form-label">Şube Kodu</CFormLabel>
              <CFormInput
                type="text"
                name="kodu"
                value={formData.kodu}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, kodu: e.target.value }))
                }
              />
            </div>
            <div className="mb-3">
              <CFormCheck
                label="Aktif"
                name="aktif"
                checked={formData.aktif}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, aktif: e.target.checked }))
                }
                style={{ color: "white" }}
              />
            </div>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            style={{ backgroundColor: "#2965A8", color: "white" }}
            onClick={handleUpdateBranch}
            disabled={loading}
          >
            Güncelle
          </CButton>
          <CButton
            color="secondary"
            style={{ color: "white" }}
            onClick={() => setShowBranchUpdateModal(false)}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showSaleModal}
        onClose={() => {
          setShowSaleModal(false);
          setSaleFormData({
            barkod: "",
            urunAdi: "",
            fiyat: "",
            birim: "adet",
            miktar: "",
            toplamFiyat: "",
            musteriId: id,
          });
          setSaleItems([]);
        }}
        backdrop="static"
        size="lg"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
          <CModalTitle>Yeni Satış</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6} className="mb-3">
                <CFormLabel className="form-label">Barkod</CFormLabel>
                <CFormInput
                  type="text"
                  name="barkod"
                  value={saleFormData.barkod}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSaleFormData((prev) => ({
                      ...prev,
                      barkod: value,
                    }));
                    handleBarcodeChange(value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      fetchProductByBarcode(saleFormData.barkod);
                    }
                  }}
                  placeholder="Barkod girin veya okutun"
                  autoFocus
                />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel className="form-label">Ürün Adı</CFormLabel>
                <CFormInput
                  type="text"
                  name="urunAdi"
                  value={saleFormData.urunAdi}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      urunAdi: e.target.value,
                    }))
                  }
                  placeholder="Ürün adı girin"
                  required
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Fiyat (TRY)</CFormLabel>
                <CFormInput
                  type="number"
                  name="fiyat"
                  value={saleFormData.fiyat}
                  onChange={(e) => {
                    const fiyat = e.target.value;
                    const miktar = parseFloat(saleFormData.miktar) || 0;
                    const toplamFiyat =
                      fiyat && miktar
                        ? (parseFloat(fiyat) * miktar).toFixed(2)
                        : "";

                    setSaleFormData((prev) => ({
                      ...prev,
                      fiyat: fiyat,
                      toplamFiyat: toplamFiyat,
                    }));
                  }}
                  placeholder="Fiyat girin"
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Birim</CFormLabel>
                <CFormSelect
                  name="birim"
                  value={saleFormData.birim}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      birim: e.target.value,
                    }))
                  }
                >
                  <option value="adet">Adet</option>
                  <option value="metre">Metre</option>
                  <option value="kilogram">Kilogram</option>
                  <option value="litre">Litre</option>
                </CFormSelect>
              </CCol>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Miktar</CFormLabel>
                <CFormInput
                  type="number"
                  name="miktar"
                  value={saleFormData.miktar}
                  onChange={(e) => {
                    const miktar = e.target.value;
                    const fiyat = parseFloat(saleFormData.fiyat) || 0;
                    const toplamFiyat =
                      miktar && fiyat
                        ? (parseFloat(miktar) * fiyat).toFixed(2)
                        : "";

                    setSaleFormData((prev) => ({
                      ...prev,
                      miktar: miktar,
                      toplamFiyat: toplamFiyat,
                    }));
                  }}
                  placeholder="Miktar girin"
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
            </CRow>
            <CButton
              color="primary"
              style={{ color: "white", backgroundColor: "#2965A8" }}
              onClick={handleAddSaleItem}
            >
              Ürün Ekle
            </CButton>
          </CForm>
          <hr />
          <h5>Eklenen Ürünler</h5>
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Barkod</CTableHeaderCell>
                <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                <CTableHeaderCell>Fiyat</CTableHeaderCell>
                <CTableHeaderCell>Birim</CTableHeaderCell>
                <CTableHeaderCell>Miktar</CTableHeaderCell>
                <CTableHeaderCell>Toplam</CTableHeaderCell>
                <CTableHeaderCell>İşlemler</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {saleItems.length > 0 ? (
                saleItems.map((item) => (
                  <CTableRow key={item.id}>
                    <CTableDataCell>{item.barkod || "Yok"}</CTableDataCell>
                    <CTableDataCell>{item.urunAdi}</CTableDataCell>
                    <CTableDataCell>
                      {item.fiyat.toLocaleString("tr-TR")} TRY
                    </CTableDataCell>
                    <CTableDataCell>{item.birim}</CTableDataCell>
                    <CTableDataCell>{item.miktar}</CTableDataCell>
                    <CTableDataCell>
                      {item.toplamFiyat.toLocaleString("tr-TR")} TRY
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="danger"
                        size="sm"
                        style={{ color: "white" }}
                        onClick={() => handleDeleteSaleItem(item.id)}
                        disabled={loading}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={7}>
                    Henüz ürün eklenmedi.
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
          <div className="mt-3">
            <strong>Toplam Fiyat: </strong>
            {calculateTotalPrice()} TRY
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            style={{ backgroundColor: "#2965A8", color: "white" }}
            onClick={handleSaveSales}
            disabled={loading}
          >
            Kaydet
          </CButton>
          <CButton
            color="secondary"
            style={{ color: "white" }}
            onClick={() => {
              setShowSaleModal(false);
              setSaleFormData({
                barkod: "",
                urunAdi: "",
                fiyat: "",
                birim: "adet",
                miktar: "",
                toplamFiyat: "",
                musteriId: id,
              });
              setSaleItems([]);
            }}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showSaleUpdateModal}
        onClose={() => setShowSaleUpdateModal(false)}
        backdrop="static"
        size="lg"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
          <CModalTitle>Satış Güncelle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6} className="mb-3">
                <CFormLabel className="form-label">Barkod</CFormLabel>
                <CFormInput
                  type="text"
                  name="barkod"
                  value={saleFormData.barkod}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      barkod: e.target.value,
                    }))
                  }
                  placeholder="Barkod girin"
                />
              </CCol>
              <CCol md={6} className="mb-3">
                <CFormLabel className="form-label">Ürün Adı</CFormLabel>
                <CFormInput
                  type="text"
                  name="urunAdi"
                  value={saleFormData.urunAdi}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      urunAdi: e.target.value,
                    }))
                  }
                  placeholder="Ürün adı girin"
                  required
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Fiyat (TRY)</CFormLabel>
                <CFormInput
                  type="number"
                  name="fiyat"
                  value={saleFormData.fiyat}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      fiyat: e.target.value,
                    }))
                  }
                  placeholder="Fiyat girin"
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Birim</CFormLabel>
                <CFormSelect
                  name="birim"
                  value={saleFormData.birim}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      birim: e.target.value,
                    }))
                  }
                >
                  <option value="adet">Adet</option>
                  <option value="metre">Metre</option>
                  <option value="kilogram">Kilogram</option>
                  <option value="litre">Litre</option>
                </CFormSelect>
              </CCol>
              <CCol md={4} className="mb-3">
                <CFormLabel className="form-label">Miktar</CFormLabel>
                <CFormInput
                  type="number"
                  name="miktar"
                  value={saleFormData.miktar}
                  onChange={(e) =>
                    setSaleFormData((prev) => ({
                      ...prev,
                      miktar: e.target.value,
                    }))
                  }
                  placeholder="Miktar girin"
                  min="0"
                  step="0.01"
                  required
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            style={{ backgroundColor: "#2965A8", color: "white" }}
            onClick={handleUpdateSale}
            disabled={loading}
          >
            Güncelle
          </CButton>
          <CButton
            color="secondary"
            style={{ color: "white" }}
            onClick={() => setShowSaleUpdateModal(false)}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
      <CustomerModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={(data) => {
          fetchCustomer();
          setCustomer({ ...customer, ...data });
          addToast("Müşteri güncellendi.", "success");
          setShowUpdateModal(false);
        }}
        customer={customer}
        addToast={addToast}
      />
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#dc3545", color: "white" }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Bu müşteriyi silmek istediğinizden emin misiniz? Bu işlem geri
          alınamaz.
        </CModalBody>
        <CModalFooter>
          <CButton color="danger" onClick={handleDelete}>
            Evet, Sil
          </CButton>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Hayır
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CustomerDetail;
