import { useState, useEffect, useCallback, useMemo } from "react";
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
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CInputGroup,
  CInputGroupText,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPen, cilPlus, cilTrash, cilBan, cilSearch } from "@coreui/icons";
import CustomerModal from "../../../components/customers/CustomerModal";
import api from "../../../api/api";

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

const CustomerDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(state?.customer || null);
  const [sales, setSales] = useState([]);
  const [groupedSales, setGroupedSales] = useState([]);
  const [cariMovements, setCariMovements] = useState([]);
  const [balance, setBalance] = useState({ total: 0, status: 'neutral' });
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    adi: "",
    adres: "",
    kodu: "",
    aktif: true,
  });
  const [paymentFormData, setPaymentFormData] = useState({
    tutar: "",
    aciklama: "",
    musteriId: id,
    musteriSatisId: null,
  });
  const [saleFormData, setSaleFormData] = useState({
    barkod: "",
    urunAdi: "",
    fiyat: "",
    birim: "adet",
    miktar: "",
    toplamFiyat: "",
    musteriId: id,
    urunId: "",
    depoId: "",
  });
  const [saleItems, setSaleItems] = useState([]);
  const [depots, setDepots] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaleUpdateModal, setShowSaleUpdateModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]);
  const [userId, setUserId] = useState(getUserId());
  const [activeTab, setActiveTab] = useState("sales");
const [invoicedSales, setInvoicedSales] = useState(() => {
  const savedInvoicedSales = localStorage.getItem(`invoicedSales_${id}`);
  return savedInvoicedSales ? new Set(JSON.parse(savedInvoicedSales)) : new Set();
});
  const [salesSearchTerm, setSalesSearchTerm] = useState(""); // Satışlar için arama terimi
  const [groupedSalesSearchTerm, setGroupedSalesSearchTerm] = useState(""); // Gruplanmış satışlar için arama
  const [cariSearchTerm, setCariSearchTerm] = useState(""); // Cari için arama
  const [paymentsSearchTerm, setPaymentsSearchTerm] = useState(""); // Ödemeler için arama
  const [branchesSearchTerm, setBranchesSearchTerm] = useState(""); // Şubeler için arama

  // localStorage değişikliklerini dinle ve userId'yi güncelle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        const newUserId = getUserId();
        setUserId(newUserId);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // Initial check
    const initialUserId = getUserId();
    setUserId(initialUserId);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);
useEffect(() => {
  localStorage.setItem(`invoicedSales_${id}`, JSON.stringify([...invoicedSales]));
}, [invoicedSales, id]);
  const addToast = useCallback((message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide={true} visible={true} delay={5000}>
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : type === "warning" ? "Uyarı" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prev) => [...prev, toast]);
  }, []);

  const handleOpenPaymentModal = () => {
    setSelectedSales([]);
    setPaymentFormData({
      tutar: "",
      aciklama: "",
      musteriId: id,
      musteriSatisId: null,
    });
    setShowPaymentModal(true);
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

  const fetchCariMovements = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/musteriSatis/musteriCari-get-by-musteri/${id}`);
      setCariMovements(data || []);
      // Filter for payments (IslemTuruId === 1003)
      setPayments(data.filter(m => m.islemTuruId === 1003) || []);
    } catch (err) {
      addToast("Cari hareketler yüklenemedi.", "error");
    }
  }, [id, addToast]);

  const fetchBalance = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/musteriSatis/musteriCari-bakiye-get-by-musteri/${id}`);
      setBalance(data || { total: 0, status: 'neutral' });
    } catch (err) {
      addToast("Bakiye hesaplanamadı.", "error");
    }
  }, [id, addToast]);

// fetchGroupedSales fonksiyonunu güncelleyin
const fetchGroupedSales = async () => {
  try {
    const { data } = await api.get(`${API_BASE_URL}/musteriSatis/musteriSatis-faturaget-all`);
    
    // API'den gelen faturaDurumu'nu kullan, yoksa localStorage'daki bilgiyi kullan
    const enhancedData = data.map(sale => ({
      ...sale,
      faturaDurumu: sale.faturaDurumu !== undefined ? sale.faturaDurumu : 
                   (invoicedSales.has(sale.satisId) ? 1 : 0)
    }));
    
    setGroupedSales(enhancedData || []);
  } catch (err) {
    console.error("Gruplanmış satışları getirme hatası:", err);
    addToast("Gruplanmış satışlar yüklenemedi.", "error");
  }
};

// handleGenerateInvoice fonksiyonunu güncelleyin
const handleGenerateInvoice = async (satisId) => {
  if (!userId || userId === 0) {
    addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
    return;
  }
  setLoading(true);
  try {
    const payload = [{ SatisId: satisId.toString() }];
    const response = await api.post(`${API_BASE_URL}/FaturaEkle/generate-invoice-list`, payload);
    if (response.status === 200 || response.data.success) {
      addToast(`Satış ID ${satisId} için fatura oluşturuldu.`, "success");
      setInvoicedSales((prev) => {
        const newSet = new Set([...prev, satisId]);
        return newSet;
      });
      
      // Gruplanmış satışları güncelle
      setGroupedSales(prev => prev.map(sale => 
        sale.satisId === satisId ? {...sale, faturaDurumu: 1} : sale
      ));
    } else {
      addToast("Fatura oluşturulamadı.", "error");
    }
  } catch (err) {
    console.error("Fatura oluşturma hatası:", err);
    addToast(err.response?.data?.message || "Fatura oluşturulamadı.", "error");
  } finally {
    setLoading(false);
  }
};
  const mapApiCustomer = async (apiCustomer) => {
    let classificationName = "Bilinmiyor";
    try {
      if (apiCustomer.musteriSiniflandirmaId) {
        const classification = classifications.find(
          (c) => c.id === apiCustomer.musteriSiniflandirmaId
        );
        if (classification) {
          classificationName = classification.adi;
        } else {
          const fetchedData = await fetchData(
            `${API_BASE_URL}/musteriSiniflandirma/get-by-id/${apiCustomer.musteriSiniflandirmaId}`,
            setClassifications
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
        setClassifications
      );
      const { data } = await api.get(
        `${API_BASE_URL}/musteri/musteri-get-by-id/${id}`
      );
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
  }, [id, addToast]);

  const fetchBranches = async () => {
    try {
      const data = await fetchData(
        `${API_BASE_URL}/sube/sube-get-by-musteriId/${id}`,
        setBranches
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
        setSales
      );
      if (data) {
        setSales(data);
      }
    } catch (err) {
      addToast("Satış verileri yüklenemedi.", "error");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-all`);
      setProducts(data);
    } catch (err) {
      console.error("Ürünleri Getirme Hatası:", err);
      addToast("Ürünler yüklenemedi.", "error");
    }
  };

  const fetchDepotsForProduct = async (urunId) => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-depolardaki-stoklar/${urunId}`);
      if (Array.isArray(data)) {
        const activeDepots = data.filter((stock) => stock.durumu === 1);
        setDepots((prev) => ({
          ...prev,
          [urunId]: activeDepots,
        }));
      } else {
        throw new Error("Depo verisi dizi formatında değil.");
      }
    } catch (err) {
      console.error("Depoları Getirme Hatası:", err);
      addToast(`Ürün ID ${urunId} için depolar yüklenemedi.`, "error");
      setDepots((prev) => ({
        ...prev,
        [urunId]: [],
      }));
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const fetchProductByBarcode = async (barcode) => {
    if (!barcode || barcode.length < 3) return;
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/urun/urun-get-barcode?barkod=${barcode}`
      );
      if (data && data.length > 0) {
        const product = data[0];
        setSaleFormData((prev) => ({
          ...prev,
          barkod: barcode,
          urunAdi: product.adi || "",
          fiyat: product.satisFiyat ? product.satisFiyat.toString() : "",
          birim: product.birimAdi || "adet",
          miktar: prev.miktar || "1",
          toplamFiyat: prev.miktar
            ? (parseFloat(prev.miktar) * product.satisFiyat).toFixed(2)
            : product.satisFiyat.toString(),
          musteriId: id,
          urunId: product.id.toString(),
          depoId: "",
        }));
        await fetchDepotsForProduct(product.id);
        if (product.stokMiktari !== undefined && product.stokMiktari <= 0) {
          addToast("Uyarı: Bu ürün stokta yok!", "warning");
        } else if (
          product.kritikStok &&
          product.stokMiktari <= product.kritikStok
        ) {
          addToast(
            `Uyarı: Stok kritik seviyede (${product.stokMiktari} adet)`,
            "warning"
          );
        }
      } else {
        addToast("Ürün bulunamadı.", "error");
      }
    } catch (err) {
      console.error("Barkod ile ürün getirme hatası:", err);
      addToast("Ürün yüklenemedi.", "error");
    }
  };

  const handleBarcodeChange = useCallback(
    debounce((value) => {
      fetchProductByBarcode(value);
    }, 800),
    []
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
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        adi: formData.adi,
        adres: formData.adres || "",
        kodu: formData.kodu || "",
        aktif: formData.aktif ? 1 : 0,
        musteriId: parseInt(id),
        kullaniciId: userId,
      };
      const { data } = await api.post(
        `${API_BASE_URL}/sube/sube-create`,
        payload
      );
      addToast(data.message || "Şube başarıyla eklendi.", "success");
      await fetchBranches();
      setShowBranchModal(false);
      setFormData({ adi: "", adres: "", kodu: "", aktif: true });
    } catch (err) {
      console.error("Şube Ekleme Hatası:", err);
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
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
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
        kullaniciId: userId,
      };
      await api.put(`${API_BASE_URL}/sube/sube-update`, payload);
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
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/sube/sube-delete/${branchId}?kullaniciId=${userId}`
      );
      addToast("Şube başarıyla silindi.", "success");
      await fetchBranches();
    } catch (err) {
      console.error("Şube Silme Hatası:", err);
      addToast(err.response?.data?.message || "Şube silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSaleItem = () => {
    if (
      !saleFormData.barkod ||
      !saleFormData.urunAdi ||
      !saleFormData.fiyat ||
      !saleFormData.miktar ||
      !saleFormData.depoId
    ) {
      addToast("Tüm alanlar (barkod, ürün adı, fiyat, miktar, depo) doldurulmalıdır.", "error");
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
    if (saleItems.some((item) => item.barkod === saleFormData.barkod && item.depoId === saleFormData.depoId)) {
      addToast("Bu ürün ve depo kombinasyonu zaten eklenmiş.", "error");
      return;
    }

    const newItem = {
      id: Date.now(),
      barkod: saleFormData.barkod,
      urunAdi: saleFormData.urunAdi,
      fiyat: parseFloat(saleFormData.fiyat),
      birim: saleFormData.birim,
      miktar: parseFloat(saleFormData.miktar),
      toplamFiyat: parseFloat(saleFormData.fiyat) * parseFloat(saleFormData.miktar),
      musteriId: id,
      kullaniciId: userId,
      depoId: parseInt(saleFormData.depoId),
      urunId: parseInt(saleFormData.urunId),
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
      urunId: "",
      depoId: "",
    });
    setDepots((prev) => ({ ...prev, [newItem.urunId]: prev[newItem.urunId] }));
    addToast("Ürün sepete eklendi.", "success");

    setTimeout(() => {
      document.querySelector('input[name="barkod"]')?.focus();
    }, 100);
  };

  const handleDeleteSaleItem = (itemId) => {
    setSaleItems((prev) => prev.filter((item) => item.id !== itemId));
    addToast("Ürün silindi.", "success");
  };

  const handleDepotChange = (index, depoId) => {
    setSaleItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, depoId: parseInt(depoId) } : item
      )
    );
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
    if (saleItems.some((item) => !item.depoId)) {
      addToast("Tüm ürünler için bir depo seçilmelidir.", "error");
      return;
    }
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
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
        kullaniciId: userId,
        depoId: item.depoId,
      }));
      await api.post(
        `${API_BASE_URL}/musteriSatis/musteriSatis-create`,
        payload
      );
      addToast("Satış(lar) kaydedildi.", "success");
      setShowSaleModal(false);
      setSaleItems([]);
      setDepots({});
      fetchSales();
      fetchCariMovements();
      fetchBalance();
      fetchGroupedSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış kaydedilemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePayment = async () => {
    if (!paymentFormData.tutar || parseFloat(paymentFormData.tutar) <= 0) {
      addToast("Tutar pozitif olmalıdır.", "error");
      return;
    }
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        tutar: parseFloat(paymentFormData.tutar),
        aciklama: paymentFormData.aciklama,
        musteriId: parseInt(id),
        kullaniciId: userId,
        musteriSatisId: paymentFormData.musteriSatisId || null,
      };
      await api.post(`${API_BASE_URL}/musteriSatis/odemeAl-create`, payload);
      addToast("Ödeme kaydedildi.", "success");
      setShowPaymentModal(false);
      setPaymentFormData({ tutar: "", aciklama: "", musteriId: id, musteriSatisId: null });
      fetchCariMovements();
      fetchBalance();
      fetchSales();
      fetchGroupedSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Ödeme kaydedilemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSale = (sale) => {
    setSelectedSale(sale);
    setSaleFormData({
      id: sale.id,
      barkod: sale.barkod,
      urunAdi: sale.urunAdi,
      fiyat: sale.fiyat.toString(),
      birim: sale.birim,
      miktar: sale.miktar.toString(),
      toplamFiyat: sale.toplamFiyat.toString(),
      musteriId: id,
      urunId: products.find((p) => p.barkod === sale.barkod)?.id.toString() || "",
      depoId: sale.depoId?.toString() || "",
    });
    if (sale.barkod) {
      const product = products.find((p) => p.barkod === sale.barkod);
      if (product) {
        fetchDepotsForProduct(product.id);
      }
    }
    setShowSaleUpdateModal(true);
  };

  const handleSaleFormChange = (e) => {
    const { name, value } = e.target;
    setSaleFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "fiyat" || name === "miktar") {
      const fiyat = name === "fiyat" ? parseFloat(value) || 0 : parseFloat(saleFormData.fiyat) || 0;
      const miktar = name === "miktar" ? parseFloat(value) || 0 : parseFloat(saleFormData.miktar) || 0;
      const toplamFiyat = (fiyat * miktar).toFixed(2);
      setSaleFormData((prev) => ({
        ...prev,
        [name]: value,
        toplamFiyat: toplamFiyat,
      }));
    }
    if (name === "barkod") {
      handleBarcodeChange(value);
    }
    if (name === "urunId") {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        setSaleFormData((prev) => ({
          ...prev,
          urunId: value,
          barkod: product.barkod,
          urunAdi: product.adi,
          fiyat: product.satisFiyat.toString(),
          birim: product.birimAdi || "adet",
          miktar: prev.miktar || "1",
          toplamFiyat: prev.miktar
            ? (parseFloat(prev.miktar) * product.satisFiyat).toFixed(2)
            : product.satisFiyat.toString(),
          depoId: "",
        }));
        fetchDepotsForProduct(product.id);
      }
    }
  };

  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectSaleForPayment = (saleId) => {
    const selectedSale = sales.find(s => s.id === saleId);
    if (selectedSale) {
      const odenenToplam = cariMovements
        .filter(m => m.musteriSatisId === selectedSale.id && m.islemTuruId === 1003)
        .reduce((sum, m) => sum + m.tutar, 0);
      
      const kalanBorc = (selectedSale.toplamFiyat || 0) - odenenToplam;
      
      setPaymentFormData(prev => ({
        ...prev,
        musteriSatisId: selectedSale.id,
        tutar: kalanBorc > 0 ? kalanBorc.toString() : prev.tutar
      }));
    }
  };

  const handleUpdateSale = async () => {
    if (
      !saleFormData.barkod ||
      !saleFormData.urunAdi ||
      !saleFormData.fiyat ||
      !saleFormData.miktar ||
      !saleFormData.depoId
    ) {
      addToast("Tüm alanlar (barkod, ürün adı, fiyat, miktar, depo) doldurulmalıdır.", "error");
      return;
    }
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        id: parseInt(saleFormData.id),
        barkod: saleFormData.barkod,
        urunAdi: saleFormData.urunAdi,
        fiyat: parseFloat(saleFormData.fiyat),
        birim: saleFormData.birim,
        miktar: parseFloat(saleFormData.miktar),
        toplamFiyat: parseFloat(saleFormData.toplamFiyat),
        musteriId: parseInt(id),
        kullaniciId: userId,
        depoId: parseInt(saleFormData.depoId),
      };
      await api.put(
        `${API_BASE_URL}/musteriSatis/musteriSatis-update`,
        payload
      );
      addToast("Satış güncellendi.", "success");
      setShowSaleUpdateModal(false);
      setDepots({});
      fetchSales();
      fetchCariMovements();
      fetchBalance();
      fetchGroupedSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış güncellenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSales = useCallback(async (satisIds) => {
    if (!window.confirm(`${Array.isArray(satisIds) ? "Seçili satışları" : "Bu satışı"} iptal etmek istediğinizden emin misiniz?`)) {
      return;
    }
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      const ids = Array.isArray(satisIds) ? [...new Set(satisIds)] : [satisIds];
      await Promise.all(
        ids.map(async (satisId) => {
          await api.post(`${API_BASE_URL}/musteriSatis/musteriSatis-iptal`, null, {
            params: { satisId, kullaniciId: userId }
          });
        })
      );
      addToast(`${ids.length} satış iptal edildi.`);
      setSelectedSales([]);
      fetchSales();
      fetchCariMovements();
      fetchBalance();
      fetchGroupedSales();
    } catch (err) {
      console.error("Satış İptal Hatası:", err);
      addToast(err.response?.data?.Message || "Satış iptal edilemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchSales, fetchCariMovements, fetchBalance, userId]);

  const handleSelectSale = (saleId) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  const handleBulkCancel = () => {
    if (selectedSales.length === 0) {
      addToast("Lütfen en az bir satış seçin.", "error");
      return;
    }
    handleCancelSales(selectedSales);
  };

  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Bu satış kaydını silmek istediğinizden emin misiniz?")) {
      return;
    }
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteriSatis/musteriSatis-delete/${saleId}?kullaniciId=${userId}`
      );
      addToast("Satış silindi.", "success");
      fetchSales();
      fetchCariMovements();
      fetchBalance();
      fetchGroupedSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteri/musteri-delete/${customer.id}?kullaniciId=${userId}`
      );
      addToast("Müşteri silindi.", "success");
      navigate("/app/customers");
    } catch (err) {
      console.error("Müşteri Silme Hatası:", err);
      addToast(err.response?.data?.message || "Müşteri silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!userId || userId === 0) {
      addToast("Kullanıcı kimliği bulunamadı. Lütfen oturum açın.", "error");
      return;
    }
    setLoading(true);
    try {
      await api.put(`${API_BASE_URL}/musteri/musteri-aktif/${customer.id}`);
      addToast("Müşteri aktif edildi.", "success");
      fetchCustomer();
    } catch (err) {
      console.error("Müşteri Aktif Etme Hatası:", err);
      addToast(
        err.response?.data?.message || "Müşteri aktif edilemedi.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer();
      fetchSales();
      fetchBranches();
      fetchProducts();
      fetchCariMovements();
      fetchBalance();
      fetchGroupedSales();
    }
  }, [id]);

  const uniqueSatisIds = useMemo(() => [...new Set(sales.map(sale => sale.satisId))], [sales]);

  // Filtrelemeler
  const filteredSales = sales.filter(sale => sale.satisId.toString().includes(salesSearchTerm));
  const filteredGroupedSales = groupedSales.filter(sale => sale.satisId.toString().includes(groupedSalesSearchTerm));
  const filteredCariMovements = cariMovements.filter(movement => new Date(movement.tarih).toLocaleDateString().includes(cariSearchTerm) || movement.aciklama?.includes(cariSearchTerm));
  const filteredPayments = payments.filter(payment => new Date(payment.tarih).toLocaleDateString().includes(paymentsSearchTerm) || payment.musteriSatisId?.toString().includes(paymentsSearchTerm));
  const filteredBranches = branches.filter(branch => branch.adi?.includes(branchesSearchTerm) || branch.kodu?.includes(branchesSearchTerm));

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
                        : "https://via.placeholder.com/100"
                    }
                    alt="Müşteri resmi"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                      borderRadius: "8px",
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
              </CRow>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className={balance.status === 'borclu' ? "bg-danger" : balance.status === 'alacakli' ? "bg-success" : "bg-secondary"}
                      style={{ color: "white" }}
                    >
                      Açık Bakiye ({balance.status === 'borclu' ? 'Borçlu' : balance.status === 'alacakli' ? 'Alacaklı' : 'Nötr'})
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {Math.abs(balance.total).toLocaleString("tr-TR")} TRY
                        {balance.status === 'borclu' && ' (Borçlu)'}
                        {balance.status === 'alacakli' && ' (Alacaklı)'}
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
              onClick={() => setShowSaleModal(true)}
            >
              Satış Yap
            </CButton>
            <CButton
              color="primary"
              style={{ color: "white" }}
              onClick={handleOpenPaymentModal}
            >
              Ödeme Al
            </CButton>
            <CButton
              color="warning"
              style={{ color: "white" }}
              onClick={handleBulkCancel}
              disabled={selectedSales.length === 0}
            >
              <CIcon icon={cilBan} /> Seçili Satışları İptal Et
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
              <CDropdownToggle color="secondary" disabled={true}>
                Ödeme Al
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem disabled>Nakit-Kredi Kartı-Banka</CDropdownItem>
                <CDropdownItem disabled>Temazsız Kredi Kartı</CDropdownItem>
                <CDropdownItem disabled>Çek</CDropdownItem>
                <CDropdownItem disabled>Müşteriden Senet Al</CDropdownItem>
                <CDropdownItem disabled>Müşteriye Senet Ver</CDropdownItem>
                <CDropdownItem disabled>Bakiye Düzelt</CDropdownItem>
                <CDropdownItem disabled>Borç-Alacak Fişleri</CDropdownItem>
                <CDropdownItem disabled>Cari Virman</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CDropdown>
              <CDropdownToggle color="secondary" disabled={true}>
                Hesap Ekstresi
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem disabled>Ekstre Linki</CDropdownItem>
                <CDropdownItem disabled>Ekstre</CDropdownItem>
                <CDropdownItem disabled>Detaylı Ekstre</CDropdownItem>
                <CDropdownItem disabled>Mutabakat Mektubu</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CButton
              color="primary"
              style={{ color: "white" }}
              onClick={() => addToast("Döküman Yükle işlemi başlatıldı.", "success")}
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
                <CDropdownItem disabled>E-Posta Gönderi Durumu</CDropdownItem>
                <CDropdownItem disabled>Alış Yap</CDropdownItem>
                <CDropdownItem onClick={() => setShowDeleteModal(true)}>
                  Müşteriyi Sil
                </CDropdownItem>
                <CDropdownItem onClick={handleActivate}>
                  Müşteriyi Aktif Et
                </CDropdownItem>
                <CDropdownItem disabled>Etiket Yazdır</CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCol>
        <CCol xs={12}>
          <CNav variant="tabs" role="tablist">
            <CNavItem>
              <CNavLink
                active={activeTab === "sales"}
                onClick={() => setActiveTab("sales")}
              >
                Önceki Satışlar
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === "groupedSales"}
                onClick={() => setActiveTab("groupedSales")}
              >
                Gruplanmış Satışlar
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === "cari"}
                onClick={() => setActiveTab("cari")}
              >
                Cari Hareketleri
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === "payments"}
                onClick={() => setActiveTab("payments")}
              >
                Önceki Ödemeler
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === "branches"}
                onClick={() => setActiveTab("branches")}
              >
                Şubeler
              </CNavLink>
            </CNavItem>
          </CNav>
          <CTabContent>
            <CTabPane visible={activeTab === "sales"}>
              <CCard>
                <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
                  <CRow className="align-items-center">
                    <CCol>Önceki Satışlar</CCol>
                    <CCol xs={4}>
                      <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput
                          placeholder="Satış ID Ara..."
                          value={salesSearchTerm}
                          onChange={(e) => setSalesSearchTerm(e.target.value)}
                        />
                      </CInputGroup>
                    </CCol>
                  </CRow>
                </CCardHeader>
                <CCardBody>
                  <CTable responsive striped hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell>
                          <CFormCheck
                            checked={selectedSales.length === uniqueSatisIds.length}
                            onChange={() =>
                              setSelectedSales(
                                selectedSales.length === uniqueSatisIds.length
                                  ? []
                                  : uniqueSatisIds
                              )
                            }
                          />
                        </CTableHeaderCell>
                        <CTableHeaderCell>Satış ID</CTableHeaderCell>
                        <CTableHeaderCell>Barkod</CTableHeaderCell>
                        <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                        <CTableHeaderCell>Fiyat</CTableHeaderCell>
                        <CTableHeaderCell>Birim</CTableHeaderCell>
                        <CTableHeaderCell>Miktar</CTableHeaderCell>
                        <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                        <CTableHeaderCell>Durumu</CTableHeaderCell>
                        <CTableHeaderCell>İşlemler</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredSales.map((sale) => (
                        <CTableRow key={sale.id}>
                          <CTableDataCell>
                            <CFormCheck
                              checked={selectedSales.includes(sale.satisId)}
                              onChange={() => handleSelectSale(sale.satisId)}
                            />
                          </CTableDataCell>
                          <CTableDataCell>{sale.satisId}</CTableDataCell>
                          <CTableDataCell>{sale.barkod}</CTableDataCell>
                          <CTableDataCell>{sale.urunAdi}</CTableDataCell>
                          <CTableDataCell>{sale.fiyat.toLocaleString("tr-TR")} TRY</CTableDataCell>
                          <CTableDataCell>{sale.birim}</CTableDataCell>
                          <CTableDataCell>{sale.miktar}</CTableDataCell>
                          <CTableDataCell>{sale.toplamFiyat.toLocaleString("tr-TR")} TRY</CTableDataCell>
                          <CTableDataCell>{sale.durumu === 1 ? "Aktif" : "İptal"}</CTableDataCell>
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
                                onClick={() => handleDeleteSale(sale.id)}
                                style={{ color: "white" }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                              <CButton
                                color="warning"
                                size="sm"
                                onClick={() => handleCancelSales(sale.satisId)}
                                style={{ color: "white" }}
                                disabled={sale.durumu === 0}
                              >
                                <CIcon icon={cilBan} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CTabPane>
            <CTabPane visible={activeTab === "groupedSales"}>
              <CCard>
                <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
                  <CRow className="align-items-center">
                    <CCol>Gruplanmış Satışlar</CCol>
                    <CCol xs={4}>
                      <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput
                          placeholder="Satış ID Ara..."
                          value={groupedSalesSearchTerm}
                          onChange={(e) => setGroupedSalesSearchTerm(e.target.value)}
                        />
                      </CInputGroup>
                    </CCol>
                  </CRow>
                </CCardHeader>
                <CCardBody>
                  <CTable responsive striped hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell>Satış ID</CTableHeaderCell>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>Ürünler</CTableHeaderCell>
                        <CTableHeaderCell>Birimler</CTableHeaderCell>
                        <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                        <CTableHeaderCell>İşlemler</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredGroupedSales.map((sale) => (
                        <CTableRow key={sale.satisId}>
                          <CTableDataCell>{sale.satisId}</CTableDataCell>
                          <CTableDataCell>
                            {new Date(sale.eklenmeTarihi).toLocaleDateString()}
                          </CTableDataCell>
                          <CTableDataCell>{sale.urunAdi}</CTableDataCell>
                          <CTableDataCell>{sale.birim}</CTableDataCell>
                          <CTableDataCell>
                            {(sale.toplamFiyat || 0).toLocaleString("tr-TR")} TRY
                          </CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color={sale.faturaDurumu === 1 ? "secondary" : "primary"}
                              size="sm"
                              onClick={() => sale.faturaDurumu === 0 && handleGenerateInvoice(sale.satisId)}
                              style={{ color: "white" }}
                              disabled={loading || sale.faturaDurumu === 1}
                            >
                              {sale.faturaDurumu === 1 ? "Fatura Kesildi" : "Fatura Kes"}
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CTabPane>
            <CTabPane visible={activeTab === "cari"}>
              <CCard>
                <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
                  <CRow className="align-items-center">
                    <CCol>Cari Hareketleri</CCol>
                    <CCol xs={4}>
                      <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput
                          placeholder="Tarih veya Açıklama Ara..."
                          value={cariSearchTerm}
                          onChange={(e) => setCariSearchTerm(e.target.value)}
                        />
                      </CInputGroup>
                    </CCol>
                  </CRow>
                </CCardHeader>
                <CCardBody>
                  <CTable responsive striped hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>Tür</CTableHeaderCell>
                        <CTableHeaderCell>Açıklama</CTableHeaderCell>
                        <CTableHeaderCell>Tutar</CTableHeaderCell>
                        <CTableHeaderCell>Bakiye</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredCariMovements.map((movement, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>{new Date(movement.tarih).toLocaleDateString()}</CTableDataCell>
                          <CTableDataCell>{movement.islemTuruId === 1001 ? 'Satış' : movement.islemTuruId === 1003 ? 'Ödeme' : 'Diğer'}</CTableDataCell>
                          <CTableDataCell>{movement.aciklama || 'Yok'}</CTableDataCell>
                          <CTableDataCell className={movement.tutar < 0 ? 'text-danger' : 'text-success'}>
                            {Math.abs(movement.tutar).toLocaleString("tr-TR")} TRY {movement.tutar < 0 ? '(Borç)' : '(Alacak)'}
                          </CTableDataCell>
                          <CTableDataCell>{movement.bakiye?.toLocaleString("tr-TR")} TRY</CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CTabPane>
            <CTabPane visible={activeTab === "payments"}>
              <CCard>
                <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
                  <CRow className="align-items-center">
                    <CCol>Önceki Ödemeler</CCol>
                    <CCol xs={4}>
                      <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput
                          placeholder="Tarih veya Satış No Ara..."
                          value={paymentsSearchTerm}
                          onChange={(e) => setPaymentsSearchTerm(e.target.value)}
                        />
                      </CInputGroup>
                    </CCol>
                  </CRow>
                </CCardHeader>
                <CCardBody>
                  <CTable responsive striped hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>No</CTableHeaderCell>
                        <CTableHeaderCell>Durum</CTableHeaderCell>
                        <CTableHeaderCell>Tutar</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredPayments.map((item, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>
                            {new Date(item.tarih).toLocaleDateString()}
                          </CTableDataCell>
                          <CTableDataCell>{item.musteriSatisId || "Yok"}</CTableDataCell>
                          <CTableDataCell>
                            {item.islemTuruId === 1003 ? "Ödeme" : "Bilinmiyor"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {(item.tutar || 0).toLocaleString("tr-TR")} TRY
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CTabPane>
            <CTabPane visible={activeTab === "branches"}>
              <CCard>
                <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
                  <CRow className="align-items-center">
                    <CCol>Şubeler</CCol>
                    <CCol xs={4}>
                      <CInputGroup>
                        <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                        <CFormInput
                          placeholder="Şube Adı veya Kod Ara..."
                          value={branchesSearchTerm}
                          onChange={(e) => setBranchesSearchTerm(e.target.value)}
                        />
                      </CInputGroup>
                    </CCol>
                  </CRow>
                </CCardHeader>
                <CCardBody>
                  <CTable responsive striped hover>
                    <CTableHead color="dark">
                      <CTableRow>
                        <CTableHeaderCell>Şube Adı</CTableHeaderCell>
                        <CTableHeaderCell>Adres</CTableHeaderCell>
                        <CTableHeaderCell>Kod</CTableHeaderCell>
                        <CTableHeaderCell>Aktif</CTableHeaderCell>
                        <CTableHeaderCell>İşlemler</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {filteredBranches.map((branch) => (
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
                                onClick={() => handleDeleteBranch(branch.id)}
                                style={{ color: "white" }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CTabPane>
          </CTabContent>
        </CCol>
      </CRow>

      <CustomerModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        customer={customer}
        onSave={() => {
          fetchCustomer();
          setShowUpdateModal(false);
        }}
      />

      <CModal
        visible={showBranchModal}
        onClose={() => setShowBranchModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Yeni Şube Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Şube Adı</CFormLabel>
                <CFormInput
                  value={formData.adi}
                  onChange={(e) =>
                    setFormData({ ...formData, adi: e.target.value })
                  }
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Adres</CFormLabel>
                <CFormInput
                  value={formData.adres}
                  onChange={(e) =>
                    setFormData({ ...formData, adres: e.target.value })
                  }
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Kod</CFormLabel>
                <CFormInput
                  value={formData.kodu}
                  onChange={(e) =>
                    setFormData({ ...formData, kodu: e.target.value })
                  }
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  label="Aktif"
                  checked={formData.aktif}
                  onChange={(e) =>
                    setFormData({ ...formData, aktif: e.target.checked })
                  }
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowBranchModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleAddBranch}
            disabled={loading || !formData.adi || !userId || userId === 0}
          >
            Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={showBranchUpdateModal}
        onClose={() => setShowBranchUpdateModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Şube Güncelle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Şube Adı</CFormLabel>
                <CFormInput
                  value={formData.adi}
                  onChange={(e) =>
                    setFormData({ ...formData, adi: e.target.value })
                  }
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Adres</CFormLabel>
                <CFormInput
                  value={formData.adres}
                  onChange={(e) =>
                    setFormData({ ...formData, adres: e.target.value })
                  }
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Kod</CFormLabel>
                <CFormInput
                  value={formData.kodu}
                  onChange={(e) =>
                    setFormData({ ...formData, kodu: e.target.value })
                  }
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck
                  label="Aktif"
                  checked={formData.aktif}
                  onChange={(e) =>
                    setFormData({ ...formData, aktif: e.target.checked })
                  }
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowBranchUpdateModal(false)}
          >
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateBranch}
            disabled={loading || !formData.adi || !userId || userId === 0}
          >
            Güncelle
          </CButton>
        </CModalFooter>
      </CModal>
{/* Sale Modal */}
      <CModal visible={showSaleModal} onClose={() => setShowSaleModal(false)} size="xl">
        <CModalHeader>
          <CModalTitle>Satış Yap</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ürün Seç</CFormLabel>
                <CFormSelect
                  name="urunId"
                  value={saleFormData.urunId}
                  onChange={handleSaleFormChange}
                >
                  <option value="">Ürün Seçin</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.adi} (Barkod: {product.barkod}, Fiyat: {product.satisFiyat})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Barkod</CFormLabel>
                <CFormInput
                  name="barkod"
                  value={saleFormData.barkod}
                  onChange={handleSaleFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Ürün Adı</CFormLabel>
                <CFormInput
                  name="urunAdi"
                  value={saleFormData.urunAdi}
                  onChange={handleSaleFormChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Depo</CFormLabel>
                <CFormSelect
                  name="depoId"
                  value={saleFormData.depoId}
                  onChange={handleSaleFormChange}
                >
                  <option value="">Depo Seçin</option>
                  {saleFormData.urunId &&
                    depots[saleFormData.urunId]?.map((depot) => (
                      <option key={depot.depoId} value={depot.depoId}>
                        {depot.depo?.adi || 'Bilinmeyen Depo'} (Stok: {depot.miktar})
                      </option>
                    ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Fiyat</CFormLabel>
                <CFormInput
                  name="fiyat"
                  type="number"
                  step="0.01"
                  value={saleFormData.fiyat}
                  onChange={handleSaleFormChange}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Birim</CFormLabel>
                <CFormSelect
                  name="birim"
                  value={saleFormData.birim}
                  onChange={handleSaleFormChange}
                >
                  <option value="adet">Adet</option>
                  <option value="kg">Kg</option>
                  <option value="lt">Lt</option>
                  <option value="m">Metre</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Miktar</CFormLabel>
                <CFormInput
                  name="miktar"
                  type="number"
                  step="0.01"
                  value={saleFormData.miktar}
                  onChange={handleSaleFormChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Toplam Fiyat</CFormLabel>
                <CFormInput
                  value={saleFormData.toplamFiyat}
                  readOnly
                  disabled
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={handleUpdateSale}
            disabled={loading || !saleFormData.depoId || !userId}
          >
            Güncelle
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Delete Customer Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Müşteriyi Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>{customer.name} adlı müşteriyi silmek istediğinizden emin misiniz?</p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={loading || !userId}>
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CustomerDetail;