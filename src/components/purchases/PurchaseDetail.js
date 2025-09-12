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
} from "@coreui/icons";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import axios from "axios";
import ErrorBoundary from "../../views/pages/products/ErrorBoundary";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import dayjs from "dayjs";

const API_BASE_URL = "https://speedsofttest.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const PurchaseDetail = () => {
  const { state } = useLocation();
  const purchaseId = state?.purchaseId || null;
  const supplier = state?.supplier || null;
  const navigate = useNavigate();

  // Kullanıcı ID'sini al (NewExpense'deki gibi)
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      return user.id;
    } catch (err) {
      console.error("Kullanıcı ID'si alınırken hata:", err);
      return 0;
    }
  };

  const [toasts, setToasts] = useState([]);
  const [mode, setMode] = useState(
    purchaseId && !isNaN(purchaseId) ? "view" : "create",
  );
  const [suppliers, setSuppliers] = useState(state?.suppliers || []);
  const [mainCategories, setMainCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [formData, setFormData] = useState({
    tedarikciId: supplier?.id || 0,
    belgeNo: "",
    tarih: dayjs(),
    vadeTarih: null,
    aciklamaAlis: "",
    masrafAnaKategoriId: null,
    masrafAltKategoriId: null,
    kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
  });
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [productForm, setProductForm] = useState({
    urunId: null,
    adi: "",
    urunKodu: "",
    barkod: "",
    miktar: 1,
    depoId: "",
    fiyat: 0,
    paraBirimi: "TRY",
    kdv: 1,
    indirim: 0,
    aciklamaUrun: "",
    kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
  });
  const toaster = useRef();

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

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/tedarikci/tedarikci-get-all`, {
        headers: { accept: "*/*" },
      });
      setSuppliers(data.filter((item) => item.durumu === 1));
    } catch (err) {
      console.error("Fetch Suppliers Error:", err.response?.data || err);
      addToast("Tedarikçiler yüklenemedi.", "error");
    }
  };

  const fetchMainCategories = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`, {
        headers: { accept: "*/*" },
      });
      setMainCategories(data);
    } catch (err) {
      console.error("Masraf ana kategoriler yüklenirken hata:", err);
      addToast("Masraf ana kategoriler yüklenemedi.", "error");
    }
  };

  const fetchSubCategories = async (mainCategoryId) => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/masrafAltKategori/masrafAnaAltKategori-get-by-Id/${mainCategoryId}`, {
        headers: { accept: "*/*" },
      });
      setSubCategories(data);
    } catch (err) {
      console.error("Masraf alt kategoriler yüklenirken hata:", err);
      addToast("Masraf alt kategoriler yüklenemedi.", "error");
    }
  };

  const fetchPurchase = async (id) => {
    try {
      console.log("Fetching purchase with ID:", id);
      const { data } = await api.get(`${API_BASE_URL}/alis/alis-get-by-id/${id}`, {
        headers: { accept: "*/*" },
      });

      let purchaseData = Array.isArray(data) ? data[0] : data;

      if (!purchaseData) {
        throw new Error("Alış kaydı bulunamadı.");
      }

      if (!purchaseData.urunId) {
        throw new Error("Alış kaydında ürün ID'si eksik.");
      }

      const productResponse = await api.get(`${API_BASE_URL}/urun/urun-get-all`, {
        headers: { accept: "*/*" },
      });
      const productData = productResponse.data.find(
        (p) => p.id === purchaseData.urunId,
      );

      if (!productData) {
        throw new Error(
          `Ürün ID ${purchaseData.urunId} bulunamadı. Lütfen ürünün sistemde kayıtlı olduğundan emin olun.`,
        );
      }

      const kdvRate = (productData.alisKDV || 1) / 100;
      const afterDiscount =
        purchaseData.miktar *
        purchaseData.fiyat *
        (1 - (purchaseData.indirim || 0) / 100);
      const net = (afterDiscount / (1 + kdvRate)).toFixed(2);
      const toplam = (Number(net) * (1 + kdvRate)).toFixed(2);

      const selectedProduct = {
        urunId: purchaseData.urunId,
        urunAdi: productData.adi,
        urunKodu: productData.urunKodu,
        barkod: productData.barkod || "",
        miktar: purchaseData.miktar || 0,
        depoId: purchaseData.depoId || null,
        fiyat: purchaseData.fiyat || 0,
        paraBirimi: purchaseData.paraBirimi || "TRY",
        kdv: productData.alisKDV || 1,
        indirim: purchaseData.indirim || 0,
        aciklamaUrun: purchaseData.aciklamaUrun || "",
        net: Number(net),
        toplam: Number(toplam),
        urunKategoriId: productData.urunKategoriId || "-",
        kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
      };

      setFormData({
        tedarikciId: purchaseData.tedarikciId || 0,
        belgeNo: purchaseData.belgeNo || "",
        tarih: purchaseData.tarih ? dayjs(purchaseData.tarih) : dayjs(),
        vadeTarih: purchaseData.vadeTarih
          ? dayjs(purchaseData.vadeTarih)
          : null,
        aciklamaAlis: purchaseData.aciklamaAlis || "",
        masrafAnaKategoriId: purchaseData.masrafAnaKategoriId || null,
        masrafAltKategoriId: purchaseData.masrafAltKategoriId || null,
        kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
      });
      setSelectedProducts([selectedProduct]);
      setMode("view");
    } catch (err) {
      console.error("Alış detayları yüklenirken hata:", err);
      addToast(`Alış detayları yüklenemedi: ${err.message}`, "error");
    }
  };

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-all`, {
        headers: { accept: "*/*" },
      });
      setProducts(data);
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err.message);
      addToast("Ürünler yüklenemedi: " + err.message, "error");
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/depo/get-all`, {
        headers: { accept: "*/*" },
      });
      setWarehouses(data);
    } catch (err) {
      console.error("Depolar yüklenirken hata:", err.message);
      addToast("Depolar yüklenemedi: " + err.message, "error");
    }
  };

  useEffect(() => {
    if (!purchaseId || isNaN(purchaseId)) {
      addToast("Alış ID'si bulunamadı, lütfen bir alış seçin.", "error");
      navigate("/app/purchases");
      return;
    }
    fetchSuppliers();
    fetchProducts();
    fetchWarehouses();
    fetchMainCategories();
    fetchPurchase(purchaseId);
  }, [purchaseId, navigate]);

  useEffect(() => {
    if (formData.masrafAnaKategoriId) {
      fetchSubCategories(formData.masrafAnaKategoriId);
    } else {
      setSubCategories([]);
      setFormData((prev) => ({ ...prev, masrafAltKategoriId: null }));
    }
  }, [formData.masrafAnaKategoriId]);

  const handleFormChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "masrafAnaKategoriId" ? { masrafAltKategoriId: null } : {}),
      kullaniciId: getUserId(), // Kullanıcı ID'sini güncelle
    }));
  };

  const handleProductFormChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({
      ...prev,
      [name]: value,
      kullaniciId: getUserId(), // Kullanıcı ID'sini güncelle
    }));
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setProductForm({
      urunId: product.id,
      adi: product.adi,
      urunKodu: product.urunKodu,
      barkod: product.barkod || "",
      miktar: 1,
      depoId: "",
      fiyat: product.alisFiyat || 0,
      paraBirimi: "TRY",
      kdv: product.alisKDV || 1,
      indirim: 0,
      aciklamaUrun: "",
      kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
    });
    setEditingProductIndex(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (index) => {
    const product = selectedProducts[index];
    const originalProduct = products.find((p) => p.id === product.urunId);
    setSelectedProduct(originalProduct);
    setProductForm({
      urunId: product.urunId,
      adi: product.urunAdi,
      urunKodu: product.urunKodu,
      barkod: product.barkod,
      miktar: product.miktar,
      depoId: product.depoId || "",
      fiyat: product.fiyat,
      paraBirimi: product.paraBirimi || "TRY",
      kdv: product.kdv,
      indirim: product.indirim,
      aciklamaUrun: product.aciklamaUrun,
      kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
    });
    setEditingProductIndex(index);
    setShowProductModal(true);
  };

  const handleAddProduct = () => {
    if (!selectedProduct) {
      addToast("Lütfen bir ürün seçin.", "error");
      return;
    }

    if (editingProductIndex === null && selectedProducts.length >= 1) {
      addToast("Yalnızca bir ürün eklenebilir.", "error");
      return;
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
      kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
    };

    if (editingProductIndex !== null) {
      setSelectedProducts((prev) => {
        const updated = [...prev];
        updated[editingProductIndex] = newProduct;
        return updated;
      });
      addToast("Ürün güncellendi.", "success");
    } else {
      setSelectedProducts((prev) => [...prev, newProduct]);
      addToast("Ürün eklendi.", "success");
    }

    setShowProductModal(false);
    setProductForm({
      urunId: null,
      adi: "",
      urunKodu: "",
      barkod: "",
      miktar: 1,
      depoId: "",
      fiyat: 0,
      paraBirimi: "TRY",
      kdv: 1,
      indirim: 0,
      aciklamaUrun: "",
      kullaniciId: getUserId(), // Kullanıcı ID'si eklendi
    });
    setSelectedProduct(null);
    setEditingProductIndex(null);
  };

  const handleDeleteProduct = (index) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    addToast("Ürün silindi.", "success");
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
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      if (!formData.tedarikciId) {
        addToast("Tedarikçi seçimi zorunludur.", "error");
        return;
      }
      if (selectedProducts.length === 0) {
        addToast("En az bir ürün eklemelisiniz.", "error");
        return;
      }
      if (selectedProducts.length > 1) {
        addToast(
          "Yalnızca bir ürün eklenebilir. Lütfen yalnızca bir ürün seçtiğinizden emin olun.",
          "error",
        );
        return;
      }
      if (!formData.tarih) {
        addToast("Tarih alanı zorunludur.", "error");
        return;
      }
      if (mode === "edit" && (!purchaseId || isNaN(purchaseId))) {
        addToast("Geçersiz alış ID'si. Güncelleme işlemi yapılamadı.", "error");
        return;
      }

      const product = selectedProducts[0];
      if (!product.urunId || !product.urunKodu) {
        addToast(
          `Ürün ID: ${product.urunId} için zorunlu alanlar eksik.`,
          "error",
        );
        return;
      }

      const totals = calculateTotals();
      const safeParaBirimi = product.paraBirimi || "TRY";

      const purchaseData = {
        id: mode === "edit" ? Number(purchaseId) : 0,
        tedarikciId: Number(formData.tedarikciId),
        urunId: Number(product.urunId),
        depoId: product.depoId ? Number(product.depoId) : null,
        miktar: Number(product.miktar),
        fiyat: Number(product.fiyat),
        indirim: Number(product.indirim) || 0,
        toplam: Number(totals.toplam),
        aciklamaUrun: product.aciklamaUrun || null,
        aciklamaAlis: formData.aciklamaAlis || null,
        belgeNo: formData.belgeNo || null,
        tarih: formData.tarih.format("YYYY-MM-DD"),
        vadeTarih: formData.vadeTarih
          ? formData.vadeTarih.format("YYYY-MM-DD")
          : null,
        masrafAnaKategoriId: formData.masrafAnaKategoriId || null,
        masrafAltKategoriId: formData.masrafAltKategoriId || null,
        durumu: 1,
        eklenmeTarihi: mode === "edit" ? undefined : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        paraBirimi: safeParaBirimi,
        kullaniciId: userId, // Kullanıcı ID'si eklendi
      };

      console.log("Request Payload (kullaniciId dahil):", purchaseData);

      let response;
      if (mode === "edit") {
        console.log("Güncelleme isteği gönderiliyor: /api/alis/alis-update");
        response = await api.put(`${API_BASE_URL}/alis/alis-update`, purchaseData, {
          headers: { "Content-Type": "application/json", accept: "*/*" },
        });
      } else {
        console.log("Kayıt isteği gönderiliyor: /api/alis/alis-create");
        response = await api.post(`${API_BASE_URL}/alis/alis-create`, purchaseData, {
          headers: { "Content-Type": "application/json", accept: "*/*" },
        });
      }

      console.log("API Response:", response.data);

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
      console.error("Alış kaydedilirken/güncellenirken hata:", err);
      const errorMessage =
        err.response?.status === 404
          ? `Güncelleme işlemi başarısız: Alış ID ${purchaseId} bulunamadı. Lütfen doğru bir alış seçtiğinizden emin olun veya sistem yöneticisiyle iletişime geçin.`
          : err.response?.data?.message ||
            err.response?.data?.error ||
            "Alış kaydedilemedi/güncellenemedi. Lütfen tekrar deneyin.";
      addToast(errorMessage, "error");
    }
  };

  const handleCancelPurchase = async () => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      await api.delete(`${API_BASE_URL}/alis/alis-delete/${purchaseId}/${userId}`, {
        headers: { accept: "*/*" },
      });
      addToast("Alış başarıyla iptal edildi.", "success");
      navigate("/app/purchases");
    } catch (err) {
      console.error("Alış iptal edilirken hata:", err.response?.data || err);
      addToast("Alış iptal edilemedi.", "error");
    }
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    doc.addFont(
      "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.68/fonts/Roboto-Regular.ttf",
      "Roboto",
      "normal",
    );
    doc.setFont("Roboto");
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
    y += 10;
    doc.text(`Kullanıcı ID: ${formData.kullaniciId || "-"}`, 10, y); // Kullanıcı ID'si eklendi
    y += 15;

    doc.setFontSize(14);
    doc.text("Alınan Ürün Detayları", 10, y);
    y += 10;

    doc.setFontSize(10);
    doc.line(10, y, 200, y);
    y += 5;
    doc.text("Ürün Kodu", 10, y);
    doc.text("Ürün Adı", 40, y);
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
  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          {mode === "view" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              <CButton
                color="warning"
                style={{ color: "white" }}
                onClick={handleEdit}
              >
                <CIcon icon={cilPencil} /> Düzenle
              </CButton>
              <CButton
                color="danger"
                style={{ color: "white" }}
                onClick={handleCancelPurchase}
              >
                <CIcon icon={cilTrash} /> İptal
              </CButton>
              <CButton
                color="secondary"
                style={{ color: "white" }}
                onClick={() => navigate("/app/purchases")}
              >
                <CIcon icon={cilActionUndo} /> Geri Dön
              </CButton>
            </div>
          ) : (
            <>
              <CButton
                color="success"
                style={{ color: "white" }}
                onClick={handleSubmit}
              >
                <CIcon icon={cilSave} /> Fatura Kaydet
              </CButton>
              <CButton
                color="secondary"
                style={{ color: "white", marginLeft: "10px" }}
                onClick={() => navigate("/app/purchases")}
              >
                <CIcon icon={cilActionUndo} /> Geri Dön
              </CButton>
            </>
          )}
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
              Ürünler
            </CCardHeader>
            <CCardBody>
              {mode !== "view" && selectedProducts.length < 1 && (
                <CDropdown>
                  <CDropdownToggle color="light">Ürün Seçin</CDropdownToggle>
                  <CDropdownMenu>
                    {products.map((product) => (
                      <CDropdownItem
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                      >
                        {product.urunKodu} - {product.adi} (Barkod:{" "}
                        {product.barkod || "-"}, Kategori:{" "}
                        {product.urunKategoriId}, Stok:{" "}
                        {product.stokMiktari || 0})
                      </CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              )}
            </CCardBody>
          </CCard>
          <CCard className="my-3">
            <CCardHeader
              style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}
            >
              Alınan Ürünler Detay
            </CCardHeader>
            <CCardBody>
              {selectedProducts.length === 0 ? (
                <p>Ürün eklenmedi. Lütfen bir ürün seçin.</p>
              ) : (
                <CTable responsive hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Ürün Kodu</CTableHeaderCell>
                      <CTableHeaderCell>Açıklama</CTableHeaderCell>
                      <CTableHeaderCell>Miktar</CTableHeaderCell>
                      <CTableHeaderCell>Fiyat</CTableHeaderCell>
                      <CTableHeaderCell>Tutar</CTableHeaderCell>
                      <CTableHeaderCell>İndirim</CTableHeaderCell>
                      <CTableHeaderCell>Net</CTableHeaderCell>
                      <CTableHeaderCell>KDV</CTableHeaderCell>
                      {mode !== "view" && (
                        <CTableHeaderCell>İşlemler</CTableHeaderCell>
                      )}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {selectedProducts.map((product, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>{index + 1}</CTableDataCell>
                        <CTableDataCell>{product.urunKodu}</CTableDataCell>
                        <CTableDataCell>{product.urunAdi}</CTableDataCell>
                        <CTableDataCell>{product.miktar}</CTableDataCell>
                        <CTableDataCell>
                          {product.fiyat.toLocaleString("tr-TR")}{" "}
                          {product.paraBirimi || "TRY"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {(product.miktar * product.fiyat).toLocaleString(
                            "tr-TR",
                          )}{" "}
                          {product.paraBirimi || "TRY"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {product.indirim ? `${product.indirim} %` : "-"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {product.net.toLocaleString("tr-TR")}{" "}
                          {product.paraBirimi || "TRY"}
                        </CTableDataCell>
                        <CTableDataCell>{product.kdv}%</CTableDataCell>
                        {mode !== "view" && (
                          <CTableDataCell>
                            <CButton
                              color="warning"
                              size="sm"
                              onClick={() => handleEditProduct(index)}
                              className="me-2"
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={() => handleDeleteProduct(index)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        )}
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
              <CRow className="mt-3">
                <CCol className="text-right">
                  <p>
                    <strong>Toplam Miktar (Adet):</strong> {totals.totalMiktar}
                  </p>
                  <p>
                    <strong>Brüt Toplam (TL):</strong>{" "}
                    {totals.brutToplam.toLocaleString("tr-TR")}
                  </p>
                  <p>
                    <strong>İndirim (TL):</strong>{" "}
                    {totals.indirimToplam
                      ? totals.indirimToplam.toLocaleString("tr-TR")
                      : "0"}
                  </p>
                  <p>
                    <strong>Net Toplam (TL):</strong>{" "}
                    {totals.netToplam.toLocaleString("tr-TR")}
                  </p>
                  <p>
                    <strong>KDV (TL):</strong>{" "}
                    {totals.kdvToplam.toLocaleString("tr-TR")}
                  </p>
                  <p>
                    <strong>TOPLAM (TL):</strong>{" "}
                    {totals.toplam.toLocaleString("tr-TR")}
                  </p>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      {mode !== "view" && (
        <CModal
          visible={showProductModal}
          onClose={() => setShowProductModal(false)}
          backdrop="static"
        >
          <CModalHeader>
            <CModalTitle>
              {selectedProduct?.urunKodu} - {selectedProduct?.adi}
            </CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow>
              <CCol>
                <CFormLabel>Miktar (Ad)</CFormLabel>
                <CFormInput
                  type="number"
                  name="miktar"
                  value={productForm.miktar}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  min="1"
                />
              </CCol>
              <CCol>
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
              <CCol>
                <CFormLabel>Fiyat</CFormLabel>
                <CFormInput
                  type="number"
                  name="fiyat"
                  value={productForm.fiyat}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  step="0.01"
                />
              </CCol>
              <CCol>
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
              <CCol>
                <CFormLabel>KDV Oranı (%)</CFormLabel>
                <CFormSelect
                  name="kdv"
                  value={productForm.kdv}
                  onChange={handleProductFormChange}
                  className="mb-3"
                >
                  {[1, 8, 10, 18, 20].map((rate) => (
                    <option key={rate} value={rate}>
                      %{rate}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow>
              <CCol>
                <CFormLabel>İndirim (%)</CFormLabel>
                <CFormInput
                  type="number"
                  name="indirim"
                  value={productForm.indirim}
                  onChange={handleProductFormChange}
                  className="mb-3"
                  step="0.01"
                />
              </CCol>
              <CCol>
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
                      : "-"
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
                />
              </CCol>
            </CRow>
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

export default PurchaseDetail;