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
import { cilPen, cilPlus, cilTrash, cilBan } from "@coreui/icons";
import CustomerModal from "../../../components/customers/CustomerModal";
import api from "../../../api/api";

const API_BASE_URL = "https://localhost:44375/api";
const KULLANICI_ID = 1; // Bu değeri session, context veya props'tan almalısınız

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
  const [depots, setDepots] = useState({}); // Product ID to depot list mapping
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSaleUpdateModal, setShowSaleUpdateModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedSales, setSelectedSales] = useState([]); // Toplu iptal için seçili satışlar

  // Toast bildirimi ekleme
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

  // Genel veri çekme fonksiyonu
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

  // Müşteri verilerini API'den dönüştürme
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

  // Müşteri bilgilerini getir
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

  // Şube bilgilerini getir
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

  // Satış bilgilerini getir
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

  // Ürünleri getir
  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-all`);
      setProducts(data);
    } catch (err) {
      console.error("Ürünleri Getirme Hatası:", err);
      addToast("Ürünler yüklenemedi.", "error");
    }
  };

  // Ürün için depoları getir
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

  // Debounce yardımcı fonksiyonu
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

  // Barkod ile ürün getirme
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

  // Şube ekleme
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
        adres: formData.adres || "",
        kodu: formData.kodu || "",
        aktif: formData.aktif ? 1 : 0,
        musteriId: parseInt(id),
        KullaniciId: KULLANICI_ID,
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

  // Şube güncelleme
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
        KullaniciId: KULLANICI_ID,
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

  // Şube silme
  const handleDeleteBranch = async (branchId) => {
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/sube/sube-delete/${branchId}?kullaniciId=${KULLANICI_ID}`
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

  // Satış ekleme
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
      kullaniciId: KULLANICI_ID,
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

  // Satış kalemini silme
  const handleDeleteSaleItem = (itemId) => {
    setSaleItems((prev) => prev.filter((item) => item.id !== itemId));
    addToast("Ürün silindi.", "success");
  };

  // Depo değişikliğini yönet
  const handleDepotChange = (index, depoId) => {
    setSaleItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, depoId: parseInt(depoId) } : item
      )
    );
  };

  // Toplam fiyat hesaplama
  const calculateTotalPrice = () => {
    return saleItems
      .reduce((sum, item) => sum + item.toplamFiyat, 0)
      .toLocaleString("tr-TR");
  };

  // Satış kaydetme
  const handleSaveSales = async () => {
    if (saleItems.length === 0) {
      addToast("En az bir ürün ekleyin.", "error");
      return;
    }
    if (saleItems.some((item) => !item.depoId)) {
      addToast("Tüm ürünler için bir depo seçilmelidir.", "error");
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
        kullaniciId: KULLANICI_ID,
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
    } catch (err) {
      addToast(err.response?.data?.message || "Satış kaydedilemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Satış güncelleme
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
        kullaniciId: KULLANICI_ID,
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
    } catch (err) {
      addToast(err.response?.data?.message || "Satış güncellenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Satış iptal (tek veya toplu)
  const handleCancelSales = useCallback(async (satisIds) => {
    if (!window.confirm(`${Array.isArray(satisIds) ? "Seçili satışları" : "Bu satışı"} iptal etmek istediğinizden emin misiniz?`)) {
      return;
    }

    setLoading(true);
    try {
      const ids = Array.isArray(satisIds) ? satisIds : [satisIds];
      await Promise.all(
        ids.map(async (satisId) => {
          await api.post(`${API_BASE_URL}/musteriSatis/musteriSatis-iptal`, null, {
            params: { satisId, kullaniciId: KULLANICI_ID }
          });
        })
      );
      addToast(`${ids.length} satış iptal edildi.`);
      setSelectedSales([]);
      fetchSales();
    } catch (err) {
      console.error("Satış İptal Hatası:", err);
      addToast(err.response?.data?.Message || "Satış iptal edilemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, fetchSales]);

  // Satış seçimi (toplu iptal için)
  const handleSelectSale = (saleId) => {
    setSelectedSales((prev) =>
      prev.includes(saleId)
        ? prev.filter((id) => id !== saleId)
        : [...prev, saleId]
    );
  };

  // Toplu iptal butonu
  const handleBulkCancel = () => {
    if (selectedSales.length === 0) {
      addToast("Lütfen en az bir satış seçin.", "error");
      return;
    }
    handleCancelSales(selectedSales);
  };

  // Satış silme
  const handleDeleteSale = async (saleId) => {
    if (!window.confirm("Bu satış kaydını silmek istediğinizden emin misiniz?")) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteriSatis/musteriSatis-delete/${saleId}?kullaniciId=${KULLANICI_ID}`
      );
      addToast("Satış silindi.", "success");
      fetchSales();
    } catch (err) {
      addToast(err.response?.data?.message || "Satış silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Müşteri silme
  const handleDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/musteri/musteri-delete/${customer.id}?kullaniciId=${KULLANICI_ID}`
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

  // Müşteri aktif etme
  const handleActivate = async () => {
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

  // Component mount olduğunda verileri getir
  useEffect(() => {
    if (id && (!customer || !customer.id)) {
      fetchCustomer();
    } else {
      fetchCustomer();
    }
    fetchSales();
    fetchBranches();
    fetchProducts();
  }, [id, fetchCustomer]);

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
              onClick={() => setShowSaleModal(true)}
            >
              Satış Yap
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
              <CDropdownToggle
                color="info"
                style={{ color: "white" }}
                disabled={true}
              >
                Ödeme/Tahsilat
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
                              <CTableHeaderCell>
                                <CFormInput
                                  type="checkbox"
                                  checked={selectedSales.length === sales.length}
                                  onChange={() =>
                                    setSelectedSales(
                                      selectedSales.length === sales.length
                                        ? []
                                        : sales.map((sale) => sale.satisId)
                                    )
                                  }
                                />
                              </CTableHeaderCell>
                              <CTableHeaderCell>Barkod</CTableHeaderCell>
                              <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                              <CTableHeaderCell>Fiyat</CTableHeaderCell>
                              <CTableHeaderCell>Birim</CTableHeaderCell>
                              <CTableHeaderCell>Miktar</CTableHeaderCell>
                              <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                              <CTableHeaderCell>Durumu</CTableHeaderCell>
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
                                      onClick={() => handleDeleteBranch(branch.id)}
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
                                <CTableDataCell>
                                  <CFormInput
                                    type="checkbox"
                                    checked={selectedSales.includes(sale.satisId)}
                                    onChange={() => handleSelectSale(sale.satisId)}
                                  />
                                </CTableDataCell>
                                <CTableDataCell>{sale.barkod}</CTableDataCell>
                                <CTableDataCell>{sale.urunAdi}</CTableDataCell>
                                <CTableDataCell>{sale.fiyat}</CTableDataCell>
                                <CTableDataCell>{sale.birim}</CTableDataCell>
                                <CTableDataCell>{sale.miktar}</CTableDataCell>
                                <CTableDataCell>{sale.toplamFiyat}</CTableDataCell>
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
                            ))
                          : table.data.map((item, index) => (
                              <CTableRow key={index}>
                                <CTableDataCell>
                                  {new Date().toLocaleDateString()}
                                </CTableDataCell>
                                <CTableDataCell>{item.no || "Yok"}</CTableDataCell>
                                <CTableDataCell>
                                  {item.durum || "Bilinmiyor"}
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
              </CCol>
            ))}
          </CRow>
        </CCol>
      </CRow>

      {/* Müşteri Güncelleme Modal */}
      <CustomerModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        customer={customer}
        onSave={() => {
          fetchCustomer();
          setShowUpdateModal(false);
        }}
      />

      {/* Şube Ekleme Modal */}
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
            disabled={loading || !formData.adi}
          >
            Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Şube Güncelleme Modal */}
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
            disabled={loading || !formData.adi}
          >
            Güncelle
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Satış Ekleme Modal */}
      <CModal visible={showSaleModal} onClose={() => setShowSaleModal(false)}>
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
                        {depot.depo?.adi || "Bilinmeyen Depo"} (Stok: {depot.miktar})
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
            <CRow className="mb-3">
              <CCol>
                <CButton color="primary" onClick={handleAddSaleItem}>
                  Ürün Ekle
                </CButton>
              </CCol>
            </CRow>
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Barkod</CTableHeaderCell>
                  <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                  <CTableHeaderCell>Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>Birim</CTableHeaderCell>
                  <CTableHeaderCell>Depo</CTableHeaderCell>
                  <CTableHeaderCell>Miktar</CTableHeaderCell>
                  <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>İşlemler</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {saleItems.map((item, index) => {
                  const productDepots = item.urunId ? depots[item.urunId] || [] : [];
                  return (
                    <CTableRow key={item.id}>
                      <CTableDataCell>{item.barkod}</CTableDataCell>
                      <CTableDataCell>{item.urunAdi}</CTableDataCell>
                      <CTableDataCell>{item.fiyat}</CTableDataCell>
                      <CTableDataCell>{item.birim}</CTableDataCell>
                      <CTableDataCell>
                        <CFormSelect
                          value={item.depoId}
                          onChange={(e) => handleDepotChange(index, e.target.value)}
                        >
                          <option value="">Depo Seçin</option>
                          {productDepots.map((depo) => (
                            <option key={depo.depoId} value={depo.depoId}>
                              {depo.depo?.adi || "Bilinmeyen Depo"} (Stok: {depo.miktar})
                            </option>
                          ))}
                        </CFormSelect>
                      </CTableDataCell>
                      <CTableDataCell>{item.miktar}</CTableDataCell>
                      <CTableDataCell>{item.toplamFiyat}</CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="danger"
                          size="sm"
                          onClick={() => handleDeleteSaleItem(item.id)}
                        >
                          Sil
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
            <CRow>
              <CCol>
                <strong>Toplam: {calculateTotalPrice()} TRY</strong>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowSaleModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveSales}
            disabled={loading || saleItems.length === 0 || saleItems.some((item) => !item.depoId)}
          >
            Satışı Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Satış Güncelleme Modal */}
      <CModal
        visible={showSaleUpdateModal}
        onClose={() => setShowSaleUpdateModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Satış Güncelle</CModalTitle>
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
                        {depot.depo?.adi || "Bilinmeyen Depo"} (Stok: {depot.miktar})
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
            color="secondary"
            onClick={() => setShowSaleUpdateModal(false)}
          >
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleUpdateSale}
            disabled={loading || !saleFormData.depoId}
          >
            Güncelle
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Müşteri Silme Onay Modal */}
      <CModal visible={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <CModalHeader>
          <CModalTitle>Müşteriyi Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            {customer.name} adlı müşteriyi silmek istediğinizden emin misiniz?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            İptal
          </CButton>
          <CButton color="danger" onClick={handleDelete} disabled={loading}>
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CustomerDetail;