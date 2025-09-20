import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CRow,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilSave,
  cilActionUndo,
  cilTrash,
  cilPrint,
  cilPencil,
  cilPlus,
} from "@coreui/icons";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import ErrorBoundary from "../../views/pages/products/ErrorBoundary";
import { jsPDF } from "jspdf";
import dayjs from "dayjs";

const API_BASE_URL = "https://localhost:44375/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Kullanıcı ID'sini al
const getUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    return user.id;
  } catch (err) {
    console.error("Kullanıcı ID'si alınırken hata:", err);
    return 0;
  }
};

const RegisteredSupplierPurchase = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  // Extract supplier and supplierId from state
  const supplier = state?.supplier || null;
  const suppliers = state?.suppliers || [];
  const purchaseId = state?.purchaseId || null;
  const supplierIdFromState = state?.supplierId || supplier?.id || null;
  
  // Kullanıcı ID'sini getUserId fonksiyonu ile al
  const currentUserId = getUserId();

  const [toasts, setToasts] = useState([]);
  const [mode, setMode] = useState(
    purchaseId && !isNaN(purchaseId) ? "view" : "create",
  );
  const [formData, setFormData] = useState({
    tedarikciId: supplierIdFromState ? Number(supplierIdFromState) : 0,
    belgeNo: "",
    tarih: dayjs(),
    vadeTarih: null,
    aciklamaAlis: "",
    masrafAnaKategoriId: null,
    masrafAltKategoriId: null,
    urunTipi: "urun",
    paraBirimi: "TRY",
    kullaniciId: currentUserId, 
  });
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [productForm, setProductForm] = useState({
    miktar: 1,
    depoId: "",
    fiyat: 0,
    paraBirimi: "TRY",
    kdv: 20,
    indirim: 0,
    aciklamaUrun: "",
    kullaniciId: currentUserId, // Her ürün için de kullanıcı ID'si
  });
  const toaster = useRef();
  const itemLabel = formData.urunTipi === "urun" ? "Ürün" : "Hizmet";

  // Validate and set tedarikciId on component mount
  useEffect(() => {
    if (!supplierIdFromState || isNaN(supplierIdFromState)) {
      console.error("Invalid or missing supplierId", { state });
      addToast(
        "Tedarikçi seçimi zorunludur. Lütfen bir tedarikçi seçin.",
        "error",
      );
      navigate("/app/purchases");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tedarikciId: Number(supplierIdFromState),
      kullaniciId: currentUserId, // Kullanıcı ID'si güncellendi
    }));
  }, [supplierIdFromState, navigate, currentUserId]);

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

  const fetchPurchase = async (id) => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/alis/alis-get-by-id/${id}`,
      );

      // Çoklu ürün desteği için kontrol
      if (data.urunler && Array.isArray(data.urunler)) {
        // Çoklu ürün varsa
        const productResponse = await api.get(
          `${API_BASE_URL}/urun/urun-get-all`,
        );

        const selectedProductsList = data.urunler
          .map((item) => {
            const productData = productResponse.data.find(
              (p) => p.id === item.urunId,
            );
            if (!productData) return null;

            const kdvRate = (productData.alisKDV || 20) / 100;
            const afterDiscount =
              item.miktar * item.fiyat * (1 - (item.indirim || 0) / 100);
            const net = (afterDiscount / (1 + kdvRate)).toFixed(2);
            const toplam = (Number(net) * (1 + kdvRate)).toFixed(2);

            return {
              urunId: item.urunId,
              urunAdi: productData.adi,
              urunKodu: productData.urunKodu,
              barkod: productData.barkod || "",
              miktar: item.miktar || 0,
              depoId: item.depoId || null,
              fiyat: item.fiyat || 0,
              paraBirimi: item.paraBirimi || "TRY",
              kdv: productData.alisKDV || 20,
              indirim: item.indirim || 0,
              aciklamaUrun: item.aciklamaUrun || "",
              net: Number(net),
              toplam: Number(toplam),
              urunKategoriId: productData.urunKategoriId || "-",
              urunTipi: productData.urunTipi,
              kullaniciId: currentUserId, // Her ürün için kullanıcı ID'si
            };
          })
          .filter((p) => p !== null);

        setSelectedProducts(selectedProductsList);
      } else if (data.urunId) {
        // Tek ürün (eski format)
        const productResponse = await api.get(
          `${API_BASE_URL}/urun/urun-get-all`,
        );
        const productData = productResponse.data.find(
          (p) => p.id === data.urunId,
        );

        if (!productData) {
          throw new Error(`Ürün ID ${data.urunId} bulunamadı.`);
        }

        const kdvRate = (productData.alisKDV || 20) / 100;
        const afterDiscount =
          data.miktar * data.fiyat * (1 - (data.indirim || 0) / 100);
        const net = (afterDiscount / (1 + kdvRate)).toFixed(2);
        const toplam = (Number(net) * (1 + kdvRate)).toFixed(2);

        const selectedProduct = {
          urunId: data.urunId,
          urunAdi: productData.adi,
          urunKodu: productData.urunKodu,
          barkod: productData.barkod || "",
          miktar: data.miktar || 0,
          depoId: data.depoId || null,
          fiyat: data.fiyat || 0,
          paraBirimi: data.paraBirimi || "TRY",
          kdv: productData.alisKDV || 20,
          indirim: data.indirim || 0,
          aciklamaUrun: data.aciklamaUrun || "",
          net: Number(net),
          toplam: Number(toplam),
          urunKategoriId: productData.urunKategoriId || "-",
          urunTipi: productData.urunTipi,
          kullaniciId: currentUserId, // Kullanıcı ID'si eklendi
        };

        setSelectedProducts([selectedProduct]);
      }
      
      setFormData({
        tedarikciId: data.tedarikciId || Number(supplierIdFromState),
        belgeNo: data.belgeNo || "",
        tarih: data.tarih ? dayjs(data.tarih) : dayjs(),
        vadeTarih: data.vadeTarih ? dayjs(data.vadeTarih) : null,
        aciklamaAlis: data.aciklamaAlis || "",
        masrafAnaKategoriId: data.masrafAnaKategoriId || null,
        masrafAltKategoriId: data.masrafAltKategoriId || null,
        urunTipi: data.urunTipi ? "urun" : "hizmet",
        paraBirimi: data.paraBirimi || "TRY",
        kullaniciId: currentUserId, // Kullanıcı ID'si eklendi
      });
      setMode("view");
    } catch (err) {
      console.error("Alış detayları yüklenirken hata:", err);
      addToast(`Alış detayları yüklenemedi: ${err.message}`, "error");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/urun/urun-get-all`,
      );
      setProducts(data);
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err);
      addToast("Ürünler yüklenemedi.", "error");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/depo/get-all`,
      );
      setWarehouses(data);
    } catch (err) {
      console.error("Depolar yüklenirken hata:", err.message);
      addToast("Depolar yüklenemedi: " + err.message, "error");
    }
  };

  const fetchMainCategories = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
      );
      setMainCategories(data);
    } catch (err) {
      console.error("Masraf ana kategoriler yüklenirken hata:", err);
      addToast("Masraf ana kategoriler yüklenemedi.", "error");
    }
  };

  const fetchSubCategories = async (mainCategoryId) => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAltKategori/masrafAnaAltKategori-get-by-Id/${mainCategoryId}`,
      );
      setSubCategories(data);
    } catch (err) {
      console.error("Masraf alt kategoriler yüklenirken hata:", err);
      addToast("Masraf alt kategoriler yüklenemedi.", "error");
    }
  };

  useEffect(() => {
    if (purchaseId && !isNaN(purchaseId)) {
      fetchPurchase(purchaseId);
    } else if (purchaseId) {
      addToast("Geçersiz alış ID'si.", "error");
      navigate("/app/purchases");
    }
    fetchProducts();
    fetchWarehouses();
    fetchMainCategories();
  }, [purchaseId, navigate, currentUserId]);

  useEffect(() => {
    if (formData.masrafAnaKategoriId) {
      fetchSubCategories(formData.masrafAnaKategoriId);
    } else {
      setSubCategories([]);
      setFormData((prev) => ({ ...prev, masrafAltKategoriId: null }));
    }
  }, [formData.masrafAnaKategoriId]);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "urunTipi") {
      setSelectedProducts([]);
    }
    if (name === "masrafAnaKategoriId") {
      setFormData((prev) => ({ ...prev, masrafAltKategoriId: null }));
    }
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ 
      ...prev, 
      [name]: value,
      kullaniciId: currentUserId // Her değişiklikte kullanıcı ID'sini koru
    }));
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductForm({
      miktar: 1,
      depoId: "",
      fiyat: product.alisFiyat || 0,
      paraBirimi: product.paraBirimi || "TRY",
      kdv: product.alisKDV || 20,
      indirim: 0,
      aciklamaUrun: "",
      kullaniciId: currentUserId, // Kullanıcı ID'si eklendi
    });
    setEditingProductIndex(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (index) => {
    const product = selectedProducts[index];
    const originalProduct = products.find((p) => p.id === product.urunId);
    setSelectedProduct(originalProduct);
    setProductForm({
      miktar: product.miktar,
      depoId: product.depoId || "",
      fiyat: product.fiyat,
      paraBirimi: product.paraBirimi || "TRY",
      kdv: product.kdv,
      indirim: product.indirim,
      aciklamaUrun: product.aciklamaUrun,
      kullaniciId: currentUserId, // Kullanıcı ID'si eklendi
    });
    setEditingProductIndex(index);
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      addToast(`Lütfen bir ${itemLabel.toLowerCase()} seçin.`, "error");
      return;
    }

    // Aynı ürünün tekrar eklenmesini kontrol et
    if (editingProductIndex === null) {
      const existingProduct = selectedProducts.find(
        (p) => p.urunId === selectedProduct.id,
      );
      if (existingProduct) {
        addToast(
          `Bu ${itemLabel.toLowerCase()} zaten eklenmiş. Düzenlemek için kalem ikonuna tıklayın.`,
          "error",
        );
        return;
      }
    }

    const discountRate = productForm.indirim / 100;
    const indirimliFiyat =
      productForm.miktar * productForm.fiyat * (1 - discountRate);
    const net = (indirimliFiyat / (1 + productForm.kdv / 100)).toFixed(2);
    const toplam = (Number(net) * (1 + productForm.kdv / 100)).toFixed(2);

    const newProduct = {
      urunId: selectedProduct.id,
      urunAdi: selectedProduct.adi,
      urunKodu: selectedProduct.urunKodu,
      barkod: selectedProduct.barkod || "",
      miktar: Number(productForm.miktar) || 0,
      depoId: productForm.depoId || null,
      fiyat: Number(productForm.fiyat) || 0,
      paraBirimi: productForm.paraBirimi || "TRY",
      kdv: Number(productForm.kdv) || 1,
      indirim: Number(productForm.indirim) || 0,
      aciklamaUrun: productForm.aciklamaUrun || "",
      net: Number(net),
      toplam: Number(toplam),
      urunKategoriId: selectedProduct.urunKategoriId || "-",
      urunTipi: selectedProduct.urunTipi,
      kullaniciId: currentUserId, // Kullanıcı ID'si eklendi
    };

    if (editingProductIndex !== null) {
      setSelectedProducts((prev) => {
        const updated = [...prev];
        updated[editingProductIndex] = newProduct;
        return updated;
      });
      addToast(`${itemLabel} güncellendi.`, "success");
    } else {
      setSelectedProducts((prev) => [...prev, newProduct]);
      addToast(`${itemLabel} eklendi.`, "success");
    }

    setShowProductModal(false);
    setProductForm({
      miktar: 1,
      depoId: "",
      fiyat: 0,
      paraBirimi: "TRY",
      kdv: 20,
      indirim: 0,
      aciklamaUrun: "",
      kullaniciId: currentUserId, // Reset için kullanıcı ID'si
    });
    setSelectedProduct(null);
    setEditingProductIndex(null);
  };

  const handleDeleteProduct = (index) => {
    const product = selectedProducts[index];
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    addToast(`${product.urunAdi} silindi.`, "success");
  };

  const calculateTotals = () => {
    const totalMiktar = selectedProducts.reduce(
      (sum, p) => sum + Number(p.miktar || 0),
      0,
    );
    const brutToplam = selectedProducts.reduce(
      (sum, p) => sum + Number(p.miktar || 0) * Number(p.fiyat || 0),
      0,
    );
    const indirimToplam = selectedProducts.reduce(
      (sum, p) =>
        sum +
        Number(p.miktar || 0) *
          Number(p.fiyat || 0) *
          (Number(p.indirim || 0) / 100),
      0,
    );
    const netToplam = selectedProducts.reduce(
      (sum, p) => sum + Number(p.net || 0),
      0,
    );
    const kdvToplam = selectedProducts.reduce(
      (sum, p) => sum + Number(p.net || 0) * (Number(p.kdv || 0) / 100),
      0,
    );
    const toplam = selectedProducts.reduce(
      (sum, p) => sum + Number(p.toplam || 0),
      0,
    );

    return {
      totalMiktar,
      brutToplam,
      indirimToplam,
      netToplam,
      kdvToplam,
      toplam,
    };
  };

  const handleSubmit = async () => {
    try {
      const effectiveTedarikciId = Number(formData.tedarikciId);
      const effectiveKullaniciId = Number(formData.kullaniciId);
      
      if (!effectiveTedarikciId || isNaN(effectiveTedarikciId)) {
        console.error("Invalid tedarikciId", {
          formData,
          supplierIdFromState,
          state,
        });
        addToast("Tedarikçi seçimi zorunludur.", "error");
        return;
      }

      if (!effectiveKullaniciId || isNaN(effectiveKullaniciId)) {
        console.error("Invalid kullaniciId", { formData, currentUserId });
        addToast("Kullanıcı bilgisi eksik.", "error");
        return;
      }

      if (selectedProducts.length === 0) {
        addToast(
          `En az bir ${itemLabel.toLowerCase()} eklemelisiniz.`,
          "error",
        );
        return;
      }

      if (!formData.tarih) {
        addToast("Tarih alanı zorunludur.", "error");
        return;
      }

      if (mode === "edit" && (!purchaseId || isNaN(purchaseId))) {
        addToast("Geçersiz alış ID'si.", "error");
        return;
      }

      const totals = calculateTotals();

      // ANA PARA BİRİMİNİ BELİRLE - NULL KORUMA İLE
      let mainCurrency = formData.paraBirimi || "TRY";

      // Ürünlerdeki para birimlerini filtrele (null/undefined değerleri çıkar)
      const productCurrencies = [
        ...new Set(
          selectedProducts
            .map((p) => p.paraBirimi)
            .filter((currency) => currency && currency.trim() !== ""),
        ),
      ];

      if (productCurrencies.length > 1) {
        // Farklı para birimleri varsa TRY yap
        mainCurrency = "TRY";
      } else if (productCurrencies.length === 1) {
        // Tek para birimi varsa onu kullan
        mainCurrency = productCurrencies[0] || "TRY";
      }

      // Son güvenlik kontrolü
      mainCurrency = mainCurrency || "TRY";

      // Çoklu ürün için veri yapısı - Kullanıcı ID'si eklendi
      const purchaseData = {
        id: mode === "edit" ? Number(purchaseId) : 0,
        tedarikciId: effectiveTedarikciId,
        belgeNo: formData.belgeNo || null,
        tarih: formData.tarih.format("YYYY-MM-DD"),
        vadeTarih: formData.vadeTarih
          ? formData.vadeTarih.format("YYYY-MM-DD")
          : null,
        aciklamaAlis: formData.aciklamaAlis || null,
        masrafAnaKategoriId: formData.masrafAnaKategoriId || null,
        masrafAltKategoriId: formData.masrafAltKategoriId || null,
        toplam: Number(totals.toplam),
        durumu: 1,
        eklenmeTarihi: mode === "edit" ? undefined : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        urunTipi: formData.urunTipi === "urun" ? true : false,
        paraBirimi: mainCurrency,
        kullaniciId: effectiveKullaniciId, // ANA KULLANICI ID'Sİ EKLENDİ
        // Çoklu ürün dizisi - KDV ve kullanıcı ID'si eklendi
        urunler: selectedProducts.map((product) => ({
          urunId: Number(product.urunId),
          depoId: product.depoId ? Number(product.depoId) : null,
          miktar: Number(product.miktar),
          fiyat: Number(product.fiyat),
          indirim: Number(product.indirim) || 0,
          kdv: Number(product.kdv) || 20,
          aciklamaUrun: product.aciklamaUrun || null,
          paraBirimi: product.paraBirimi || "TRY",
          kullaniciId: currentUserId, // HER ÜRÜN İÇİN KULLANICI ID'Sİ
        })),
      };

      // Eğer API henüz çoklu ürün desteklemiyorsa, tek ürün gönder (geçici çözüm)
      if (selectedProducts.length === 1) {
        const product = selectedProducts[0];
        purchaseData.urunId = Number(product.urunId);
        purchaseData.depoId = product.depoId ? Number(product.depoId) : null;
        purchaseData.miktar = Number(product.miktar);
        purchaseData.fiyat = Number(product.fiyat);
        purchaseData.indirim = Number(product.indirim) || 0;
        purchaseData.kdv = Number(product.kdv) || 20;
        purchaseData.aciklamaUrun = product.aciklamaUrun || null;
        purchaseData.paraBirimi = product.paraBirimi || "TRY";
        purchaseData.kullaniciId = currentUserId; // TEK ÜRÜN İÇİN KULLANICI ID'Sİ
        // urunler dizisini kaldır
        delete purchaseData.urunler;
      }

      console.log("Gönderilen veri (kullaniciId dahil):", purchaseData);

      let response;
      if (mode === "edit") {
        console.log("Güncelleme isteği:", purchaseData);
        response = await api.put(`${API_BASE_URL}/alis/alis-update`, purchaseData);
      } else {
        console.log("Kayıt isteği:", purchaseData);
        response = await api.post(`${API_BASE_URL}/alis/alis-create`, purchaseData);
      }

      console.log("Alış kaydedildi, API cevabı:", response.data);
      addToast(
        mode === "edit"
          ? "Alış başarıyla güncellendi."
          : "Alış başarıyla kaydedildi.",
        "success",
      );
      navigate("/app/purchases", {
        state: { supplier, suppliers, refresh: true },
      });
    } catch (err) {
      console.error("Alış kaydedilirken/güncellenirken hata:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      const errorMessage =
        err.response?.status === 404
          ? `Güncelleme işlemi başarısız: Alış ID ${purchaseId} bulunamadı.`
          : err.response?.data?.message ||
            err.response?.data?.error ||
            "Alış kaydedilemedi/güncellenemedi.";
      addToast(errorMessage, "error");
    }
  };

  const handleCancelPurchase = async () => {
    try {
      // DELETE endpoint'ine de kullanıcı ID'si gönder
      await api.delete(`${API_BASE_URL}/alis/alis-delete/${purchaseId}/${currentUserId}`);
      addToast("Alış başarıyla iptal edildi.", "success");
      navigate("/app/purchases");
    } catch (err) {
      console.error("Alış iptal edilirken hata:", err);
      addToast("Alış iptal edilemedi.", "error");
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    const totals = calculateTotals();
    let y = 10;

    doc.setFontSize(18);
    doc.text("Alış Faturası", 90, y, { align: "center" });
    y += 10;

    doc.setFontSize(12);
    doc.text(
      `Tedarikçi: ${suppliers.find((s) => s.id === formData.tedarikciId)?.unvan || supplier?.unvan || "-"}`,
      10,
      y,
    );
    y += 10;
    doc.text(`Belge No: ${formData.belgeNo || "-"}`, 10, y);
    y += 10;
    doc.text(`Tarih: ${formData.tarih.format("DD.MM.YYYY HH:mm")}`, 10, y);
    y += 10;
    doc.text(
      `Vade Tarihi: ${formData.vadeTarih ? formData.vadeTarih.format("DD.MM.YYYY HH:mm") : "-"}`,
      10,
      y,
    );
    y += 10;
    doc.text(`Açıklama: ${formData.aciklamaAlis || "-"}`, 10, y);
    y += 10;
    doc.text(`Tür: ${formData.urunTipi === "urun" ? "Ürün" : "Hizmet"}`, 10, y);
    y += 10;
    doc.text(
      `Kullanıcı ID: ${formData.kullaniciId || "-"}`, // Kullanıcı bilgisi eklendi
      10,
      y,
    );
    y += 10;
    doc.text(
      `Masraf Ana Kategori: ${mainCategories.find((c) => c.id === formData.masrafAnaKategoriId)?.adi || "-"}`,
      10,
      y,
    );
    y += 10;
    doc.text(
      `Masraf Alt Kategori: ${subCategories.find((c) => c.id === formData.masrafAltKategoriId)?.adi || "-"}`,
      10,
      y,
    );
    y += 15;

    doc.setFontSize(14);
    doc.text(`Alınan ${itemLabel} Detayları`, 10, y);
    y += 10;

    doc.setFontSize(10);
    doc.line(10, y, 200, y);
    y += 5;
    doc.text(`${itemLabel} Kodu`, 10, y);
    doc.text(`${itemLabel} Adı`, 40, y);
    doc.text("Kategori ID", 80, y);
    doc.text("Miktar", 110, y);
    doc.text("Fiyat (TRY)", 130, y);
    doc.text("Toplam (TRY)", 160, y);
    y += 5;
    doc.line(10, y, 200, y);

    selectedProducts.forEach((product) => {
      y += 5;
      doc.text(product.urunKodu || "-", 10, y);
      doc.text(product.urunAdi || "-", 40, y);
      doc.text(`${product.urunKategoriId || "-"}`, 80, y);
      doc.text(`${product.miktar || 0}`, 110, y);
      doc.text(`${(product.fiyat || 0).toLocaleString("tr-TR")}`, 130, y);
      doc.text(`${(product.toplam || 0).toLocaleString("tr-TR")}`, 160, y);
    });

    y += 10;
    doc.line(10, y, 200, y);
    y += 5;

    doc.text(`Toplam Miktar: ${totals.totalMiktar}`, 10, y);
    y += 5;
    doc.text(
      `Brüt Toplam: ${totals.brutToplam.toLocaleString("tr-TR")} TL`,
      10,
      y,
    );
    y += 5;
    doc.text(
      `İndirim: ${totals.indirimToplam ? totals.indirimToplam.toLocaleString("tr-TR") : "0"} TL`,
      10,
      y,
    );
    y += 5;
    doc.text(
      `Net Toplam: ${totals.netToplam.toLocaleString("tr-TR")} TL`,
      10,
      y,
    );
    y += 5;
    doc.text(`KDV: ${totals.kdvToplam.toLocaleString("tr-TR")} TL`, 10, y);
    y += 5;
    doc.text(`TOPLAM: ${totals.toplam.toLocaleString("tr-TR")} TL`, 10, y);

    doc.setFontSize(10);
    doc.text(
      `Yazdırılma Tarihi: ${dayjs().format("DD.MM.YYYY HH:mm")}`,
      10,
      280,
    );

    doc.save(
      `Alis_Faturasi_${formData.belgeNo || "BelgeNo_" + Date.now()}.pdf`,
    );
    window.open(doc.output("bloburl"), "_blank");
  };

  const handleEdit = () => {
    setMode("edit");
  };
  
  const totals = calculateTotals();
  const filteredProducts = products;
  
  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          <div className="d-flex flex-wrap gap-3 mb-3">
            {mode === "view" ? (
              <>
                <CButton color="primary" onClick={handlePrint}>
                  <CIcon icon={cilPrint} /> Yazdır
                </CButton>
                <CButton color="warning" onClick={handleEdit}>
                  <CIcon icon={cilPencil} /> Düzenle
                </CButton>
                <CButton color="danger" onClick={handleCancelPurchase}>
                  <CIcon icon={cilTrash} /> İptal
                </CButton>
                <CButton
                  color="secondary"
                  onClick={() => navigate("/app/purchases")}
                >
                  <CIcon icon={cilActionUndo} /> Geri Dön
                </CButton>
              </>
            ) : (
              <>
                <CButton
                  color="success"
                  onClick={handleSubmit}
                  style={{ color: "white" }}
                >
                  <CIcon icon={cilSave} /> Fatura Kaydet
                </CButton>
                <CButton
                  color="secondary"
                  onClick={() => navigate("/app/purchases")}
                >
                  <CIcon icon={cilActionUndo} /> Geri Dön
                </CButton>
              </>
            )}
          </div>
        </CCol>
      </CRow>
      <CRow>
        <CCol md={6}>
          <CCard className="my-3">
            <CCardHeader
              style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}
            >
              {suppliers.find((s) => s.id === formData.tedarikciId)?.unvan ||
                supplier?.unvan ||
                "Tedarikçi"}
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={12}>
                  <CFormLabel>Tür</CFormLabel>
                  {mode === "view" ? (
                    <p>{formData.urunTipi === "urun" ? "Ürün" : "Hizmet"}</p>
                  ) : (
                    <CFormSelect
                      name="urunTipi"
                      value={formData.urunTipi}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                    >
                      <option value="urun">Ürün</option>
                      <option value="hizmet">Hizmet</option>
                    </CFormSelect>
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Belge No</CFormLabel>
                  {mode === "view" ? (
                    <p>{formData.belgeNo || "-"}</p>
                  ) : (
                    <CFormInput
                      name="belgeNo"
                      value={formData.belgeNo}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                    />
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel className="block text-sm font-semibold">
                    Tarih
                  </CFormLabel>
                  {mode === "view" ? (
                    <p>{formData.tarih.format("DD.MM.YYYY")}</p>
                  ) : (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={formData.tarih}
                        onChange={(value) => handleFormChange("tarih", value)}
                        format="DD.MM.YYYY"
                        className="mb-3"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            className: "form-control",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel className="block text-sm font-semibold">
                    Vade Tarihi
                  </CFormLabel>
                  {mode === "view" ? (
                    <p>
                      {formData.vadeTarih
                        ? formData.vadeTarih.format("DD.MM.YYYY")
                        : "-"}
                    </p>
                  ) : (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={formData.vadeTarih}
                        onChange={(value) =>
                          handleFormChange("vadeTarih", value)
                        }
                        format="DD.MM.YYYY"
                        className="mb-3"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: "outlined",
                            size: "small",
                            className: "form-control",
                          },
                        }}
                      />
                    </LocalizationProvider>
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Açıklama</CFormLabel>
                  {mode === "view" ? (
                    <p>{formData.aciklamaAlis || "-"}</p>
                  ) : (
                    <CFormInput
                      name="aciklamaAlis"
                      value={formData.aciklamaAlis}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                    />
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Masraf Ana Kategori</CFormLabel>
                  {mode === "view" ? (
                    <p>
                      {mainCategories.find(
                        (c) => c.id === formData.masrafAnaKategoriId,
                      )?.adi || "-"}
                    </p>
                  ) : (
                    <CFormSelect
                      name="masrafAnaKategoriId"
                      value={formData.masrafAnaKategoriId || ""}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                    >
                      <option value="">Seç</option>
                      {mainCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.adi}
                        </option>
                      ))}
                    </CFormSelect>
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Masraf Alt Kategori</CFormLabel>
                  {mode === "view" ? (
                    <p>
                      {subCategories.find(
                        (c) => c.id === formData.masrafAltKategoriId,
                      )?.adi || "-"}
                    </p>
                  ) : (
                    <CFormSelect
                      name="masrafAltKategoriId"
                      value={formData.masrafAltKategoriId || ""}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                      disabled={!formData.masrafAnaKategoriId}
                    >
                      <option value="">Seç</option>
                      {subCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.adi}
                        </option>
                      ))}
                    </CFormSelect>
                  )}
                </CCol>
                <CCol xs={12}>
                  <CFormLabel>Para Birimi</CFormLabel>
                  {mode === "view" ? (
                    <p>{formData.paraBirimi || "TRY"}</p>
                  ) : (
                    <CFormSelect
                      name="paraBirimi"
                      value={formData.paraBirimi || "TRY"}
                      onChange={(e) =>
                        handleFormChange(e.target.name, e.target.value)
                      }
                      className="mb-3"
                    >
                      <option value="TRY">TL</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </CFormSelect>
                  )}
                </CCol>
                {/* Debug için - production'da kaldırın */}
                {process.env.NODE_ENV === 'development' && (
                  <CCol xs={12}>
                    <CFormLabel className="text-muted small">Debug - Kullanıcı ID</CFormLabel>
                    <p className="text-muted small">{formData.kullaniciId}</p>
                  </CCol>
                )}
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={6}>
          <CCard className="my-3">
            <CCardHeader
              style={{ backgroundColor: "#34A149", color: "#FFFFFF" }}
            >
              <div className="d-flex justify-content-between align-items-center">
                <span>{itemLabel}ler</span>
                {mode !== "view" && (
                  <span className="badge bg-light text-dark">
                    {selectedProducts.length} {itemLabel.toLowerCase()} eklendi
                  </span>
                )}
              </div>
            </CCardHeader>
            <CCardBody>
              {mode !== "view" && (
                <div className="d-flex gap-2">
                  <CDropdown>
                    <CDropdownToggle color="primary">
                      <CIcon icon={cilPlus} /> {itemLabel} Ekle
                    </CDropdownToggle>
                    <CDropdownMenu
                      style={{ maxHeight: "400px", overflowY: "auto" }}
                    >
                      {filteredProducts.length === 0 ? (
                        <CDropdownItem disabled>
                          Hiç {itemLabel.toLowerCase()} bulunamadı
                        </CDropdownItem>
                      ) : (
                        filteredProducts.map((product) => (
                          <CDropdownItem
                            key={product.id}
                            onClick={() => handleProductSelect(product)}
                            disabled={selectedProducts.some(
                              (p) => p.urunId === product.id,
                            )}
                          >
                            <div>
                              <strong>{product.urunKodu}</strong> -{" "}
                              {product.adi}
                              <br />
                              <small className="text-muted">
                                Barkod: {product.barkod || "-"} | Kategori:{" "}
                                {product.urunKategoriId} | Stok:{" "}
                                {product.stokMiktari || 0}
                              </small>
                            </div>
                          </CDropdownItem>
                        ))
                      )}
                    </CDropdownMenu>
                  </CDropdown>
                </div>
              )}
            </CCardBody>
          </CCard>
          <CCard className="my-3">
            <CCardHeader
              style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}
            >
              Alınan {itemLabel}ler Detay
            </CCardHeader>
            <CCardBody>
              {selectedProducts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">
                    Henüz {itemLabel.toLowerCase()} eklenmedi.
                  </p>
                  {mode !== "view" && (
                    <p className="text-muted small">
                      Yukarıdaki "{itemLabel} Ekle" butonunu kullanarak{" "}
                      {itemLabel.toLowerCase()} ekleyebilirsiniz.
                    </p>
                  )}
                </div>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>{itemLabel} Kodu</CTableHeaderCell>
                      <CTableHeaderCell>Açıklama</CTableHeaderCell>
                      <CTableHeaderCell>Miktar</CTableHeaderCell>
                      <CTableHeaderCell>Fiyat</CTableHeaderCell>
                      <CTableHeaderCell>Tutar</CTableHeaderCell>
                      <CTableHeaderCell>İndirim</CTableHeaderCell>
                      <CTableHeaderCell>Net</CTableHeaderCell>
                      <CTableHeaderCell>KDV</CTableHeaderCell>
                      {mode !== "view" && (
                        <CTableHeaderCell>İşlem</CTableHeaderCell>
                      )}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {selectedProducts.map((product, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>
                          <strong>{product.urunKodu}</strong>
                        </CTableDataCell>
                        <CTableDataCell>{product.urunAdi}</CTableDataCell>
                        <CTableDataCell>{product.miktar}</CTableDataCell>
                        <CTableDataCell>
                          {product.fiyat.toLocaleString("tr-TR")}{" "}
                          {product.paraBirimi}
                        </CTableDataCell>
                        <CTableDataCell>
                          {(product.miktar * product.fiyat).toLocaleString(
                            "tr-TR",
                          )}{" "}
                          {product.paraBirimi}
                        </CTableDataCell>
                        <CTableDataCell>
                          {product.indirim ? `${product.indirim}%` : "-"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {product.net.toLocaleString("tr-TR")}{" "}
                          {product.paraBirimi}
                        </CTableDataCell>
                        <CTableDataCell>{product.kdv}%</CTableDataCell>
                        {mode !== "view" && (
                          <CTableDataCell>
                            <div className="d-flex gap-1">
                              <CButton
                                color="info"
                                size="sm"
                                onClick={() => handleEditProduct(index)}
                                title="Düzenle"
                                style={{ color: "white" }}
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                              <CButton
                                color="danger"
                                size="sm"
                                onClick={() => handleDeleteProduct(index)}
                                title="Sil"
                                style={{ color: "white" }}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            </div>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
              {selectedProducts.length > 0 && (
                <CRow className="mt-3">
                  <CCol className="text-end">
                    <div className="border-top pt-3">
                      <p className="mb-2">
                        <strong>Toplam Miktar:</strong> {totals.totalMiktar}{" "}
                        adet
                      </p>
                      <p className="mb-2">
                        <strong>Brüt Toplam:</strong>{" "}
                        {totals.brutToplam.toLocaleString("tr-TR")}
                      </p>
                      {totals.indirimToplam > 0 && (
                        <p className="mb-2">
                          <strong>İndirim:</strong>{" "}
                          {totals.indirimToplam.toLocaleString("tr-TR")}
                        </p>
                      )}
                      <p className="mb-2">
                        <strong>Net Toplam:</strong>{" "}
                        {totals.netToplam.toLocaleString("tr-TR")}
                      </p>
                      <p className="mb-2">
                        <strong>KDV:</strong>{" "}
                        {totals.kdvToplam.toLocaleString("tr-TR")}
                      </p>
                      <h5 className="text-primary">
                        <strong>GENEL TOPLAM:</strong>{" "}
                        {totals.toplam.toLocaleString("tr-TR")}
                      </h5>
                    </div>
                  </CCol>
                </CRow>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      {mode !== "view" && (
        <CModal
          visible={showProductModal}
          onClose={() => setShowProductModal(false)}
          backdrop="static"
          size="lg"
        >
          <CModalHeader>
            <CModalTitle>
              {editingProductIndex !== null ? "Ürün Düzenle" : "Ürün Ekle"}:{" "}
              {selectedProduct?.urunKodu} - {selectedProduct?.adi}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow>
              <CCol md={6}>
                <CFormLabel>
                  Miktar <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="miktar"
                  value={productForm.miktar}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  min="1"
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Depo</CFormLabel>
                <CFormSelect
                  name="depoId"
                  value={productForm.depoId}
                  onChange={handleProductFormChange}
                  className="mb-3"
                >
                  <option value="">Seç</option>
                  {warehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.adi}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={4}>
                <CFormLabel>
                  Fiyat <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput
                  type="number"
                  name="fiyat"
                  value={productForm.fiyat}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  step="0.01"
                  min="0"
                  required
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Para Birimi</CFormLabel>
                <CFormSelect
                  name="paraBirimi"
                  value={productForm.paraBirimi || "TRY"}
                  onChange={handleProductFormChange}
                  className="mb-3"
                >
                  <option value="TRY">TL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>KDV Oranı (%)</CFormLabel>
                <CFormSelect
                  name="kdv"
                  value={productForm.kdv}
                  onChange={handleProductFormChange}
                  className="mb-3"
                >
                  {[0, 1, 8, 10, 18, 20].map((rate) => (
                    <option key={rate} value={rate}>
                      %{rate}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow>
              <CCol md={6}>
                <CFormLabel>İndirim (%)</CFormLabel>
                <CFormInput
                  type="number"
                  name="indirim"
                  value={productForm.indirim}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  step="0.01"
                  min="0"
                  max="100"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Toplam (KDV Dahil)</CFormLabel>
                <CFormInput
                  type="text"
                  value={
                    productForm.miktar && productForm.fiyat
                      ? (
                          productForm.miktar *
                          productForm.fiyat *
                          (1 - productForm.indirim / 100) *
                          (1 + productForm.kdv / 100)
                        ).toLocaleString("tr-TR") +
                        " " +
                        (productForm.paraBirimi || "TRY")
                      : "0 " + (productForm.paraBirimi || "TRY")
                  }
                  disabled
                  className="mb-3"
                />
              </CCol>
            </CRow>
            <CRow>
              <CCol>
                <CFormLabel>Açıklama</CFormLabel>
                <CFormInput
                  name="aciklamaUrun"
                  value={productForm.aciklamaUrun}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  placeholder="Ürün ile ilgili not ekleyebilirsiniz..."
                />
              </CCol>
            </CRow>
            {/* Debug için - production'da kaldırın */}
            {process.env.NODE_ENV === 'development' && (
              <CRow>
                <CCol>
                  <CFormLabel className="text-muted small">Debug - Ürün Kullanıcı ID</CFormLabel>
                  <p className="text-muted small">{productForm.kullaniciId}</p>
                </CCol>
              </CRow>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton
              color="success"
              style={{ color: "white" }}
              onClick={handleAddProduct}
            >
              {editingProductIndex !== null ? "Güncelle" : "Ekle"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => setShowProductModal(false)}
            >
              İptal
            </CButton>
          </CModalFooter>
        </CModal>
      )}
    </ErrorBoundary>
  );
};

export default RegisteredSupplierPurchase;