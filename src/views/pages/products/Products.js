import { useState, useEffect, useRef } from "react";
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
  CFormSwitch,
  CFormInput,
  CFormLabel,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilPlus,
  cilCloudUpload,
  cilPencil,
  cilTrash,
  cilWarning,
  cilFolder,
  cilBadge,
} from "@coreui/icons";
import ProductTable from "../../../components/products/ProductTable";
import api from "../../../api/api";
import ErrorBoundary from "./ErrorBoundary";
const API_BASE_URL = "https://speedsofttest.com/api";

const Products = () => {
  const [toasts, setToasts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(true);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [shelfName, setShelfName] = useState("");
  const [shelfLoading, setShelfLoading] = useState(false);
  const [editingShelfId, setEditingShelfId] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmLoading, setConfirmLoading] = useState(false);
  const toaster = useRef();
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

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

  const showConfirmDialog = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    if (confirmAction) {
      setConfirmLoading(true);
      try {
        await confirmAction();
      } catch (err) {
        console.error("Confirm action error:", err);
      } finally {
        setConfirmLoading(false);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setConfirmMessage("");
      }
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const fetchData = async (url, setData) => {
    try {
      const { data } = await api.get(url);
      console.log(`API response from ${url}:`, data);

      if (Array.isArray(data)) {
        const filteredData = data.filter((item) => item.durumu === 1);
        setData(filteredData);
        if (filteredData.length === 0) {
          console.log(`No active data found for ${url}`);
        }
      } else if (data) {
        setData([data].filter((item) => item.durumu === 1));
      } else {
        setData([]);
        console.log(`No data returned from ${url}`);
      }
    } catch (err) {
      console.error("Fetch Data Error:", err);
      setData([]);
      if (err.response?.status !== 404) {
        addToast(
          err.response?.data?.message || "Veriler yüklenemedi.",
          "error",
        );
      }
    }
  };

  const mapApiProductToLocal = async (apiProduct) => {
    let categoryName = "Bilinmeyen Kategori";
    let brandName = "Bilinmeyen Marka";
    let shelfName = "Raf Yok";
    console.log(apiProduct);
    try {
      if (apiProduct.urunKategoriId && apiProduct.urunKategoriId !== 0) {
        const category =
          categories.find((c) => c.id === apiProduct.urunKategoriId) ||
          (
            await api.get(
              `${API_BASE_URL}/urunKategori/get-by-id/${apiProduct.urunKategoriId}`,
            )
          ).data;
        categoryName = category?.adi || categoryName;
        if (!category)
          console.warn(`Kategori bulunamadı: ID ${apiProduct.urunKategoriId}`);
      }
      if (apiProduct.urunMarkaId && apiProduct.urunMarkaId !== 0) {
        const brand =
          brands.find((b) => b.id === apiProduct.urunMarkaId) ||
          (await api.get(`${API_BASE_URL}/urunMarka/get-by-id/${apiProduct.urunMarkaId}`))
            .data;
        brandName = brand?.adi || brandName;
        if (!brand)
          console.warn(`Marka bulunamadı: ID ${apiProduct.urunMarkaId}`);
      }
      if (apiProduct.urunRafId && apiProduct.urunRafId !== 0) {
        const shelf =
          shelves.find((s) => s.id === apiProduct.urunRafId) ||
          (await api.get(`${API_BASE_URL}/urunRaf/get-by-id/${apiProduct.urunRafId}`))
            .data;
        shelfName = shelf?.adi || shelfName;
        if (!shelf) console.warn(`Raf bulunamadı: ID ${apiProduct.urunRafId}`);
      }
    } catch (err) {
      console.error("Dönüşüm Hatası:", err.message, err.stack);
    }

    return {
      id: apiProduct.id,
      name: apiProduct.adi || "Bilinmiyor",
      salePrice: apiProduct.satisFiyat || 0,
      stockQuantity: apiProduct.stokMiktari || 0,
      unit:
        apiProduct.birimAdi === "0" ? "Adet" : apiProduct.birimAdi || "Adet",
      type: apiProduct.urunTipi ? "Stoklu" : "Stoksuz",
      category: categoryName,
      brand: brandName,
      categoryId: apiProduct.urunKategoriId || 0,
      brandId: apiProduct.urunMarkaId || 0,
      shelfId: apiProduct.urunRafId || 0,
      depoId: apiProduct.depoId || 0,
      productCode: apiProduct.urunKodu || "-",
      gtip: apiProduct.gtipKodu || "-",
      countryCode: apiProduct.ulkeId?.toString() || "TR",
      stockAmount: apiProduct.stokMiktari || 0,
      invoiceTitle: apiProduct.faturaBasligi || "",
      description: apiProduct.aciklama || "",
      barcode: apiProduct.barkod || "",
      shelfLocation: shelfName,
      trackStock: apiProduct.stokTakip === "Evet",
      criticalStock: apiProduct.kritikStok || 0,
      tags: apiProduct.etiketler
        ? apiProduct.etiketler.split(",").map((tag) => tag.trim())
        : [],
      purchasePrice: apiProduct.alisFiyat || 0,
      saleVatRate: apiProduct.satisKDV || 0,
      saleVatIncluded: apiProduct.satisKdvDahilmi || false,
      purchaseVatRate: apiProduct.alisKDV || 0,
      purchaseVatIncluded: apiProduct.alisKdvDahilmi || false,
      purchaseDiscount: apiProduct.alisIskontosu || 0,
      otvRate: apiProduct.oivOrani || 0,
      otvType: apiProduct.otvTipi || "Yok",
      images: apiProduct.fotograf ? [apiProduct.fotograf] : [],
      saleCurrency: apiProduct.paraBirimi || "TRY",
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      await fetchData(`${API_BASE_URL}/urunKategori/get-all`, setCategories);
      await fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
      await fetchData(`${API_BASE_URL}/urunRaf/get-all`, setShelves);
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-all`);

      console.log("Fetched products:", data);
      const mappedProducts = await Promise.all(
        data
          .filter((product) => product.durumu === 1)
          .map(mapApiProductToLocal),
      );

      setProducts(mappedProducts);
      setError(null);
    } catch (err) {
      console.error("Fetch Products Error:", err.message, err.stack);
      setError(err.response?.data?.message || "Ürünler yüklenemedi.");
      addToast("Ürünler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      addToast("Lütfen silmek için en az bir ürün seçin.", "error");
      return;
    }
    setShowDeleteModal(true);
  };

  const handleConfirmBulkDelete = async () => {
    setLoading(true);
    setShowDeleteModal(false);
    try {
      const idsToDelete = [...selectedIds];
      await Promise.all(
        idsToDelete.map((id) => api.delete(`${API_BASE_URL}/urun/urun-delete/${id}`)),
      );

      await fetchProducts();
      setSelectedIds([]);
      addToast(`${idsToDelete.length} ürün silindi.`, "success");
    } catch (err) {
      addToast(
        err.response?.data?.message || "Silme işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (product) => {
    navigate(`/app/products/${product.id}`, { state: { product } });
  };

  const handleNewProduct = () => {
    navigate(`/app/product-new`);
  };

  const handleAddCategory = () => {
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      addToast("Lütfen kategori adını girin.", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    setCategoryLoading(true);
    try {
      if (editingCategoryId) {
        const existingCategory = categories.find(
          (c) => c.id === editingCategoryId,
        );
        if (!existingCategory) {
          addToast("Kategori bulunamadı.", "error");
          return;
        }

        const categoryData = {
          ...existingCategory,
          adi: categoryName.trim(),
          guncellenmeTarihi: new Date().toISOString(),
          KullaniciId: user.id,
        };

        await api.put(`${API_BASE_URL}/urunKategori/update`, categoryData);
        addToast("Kategori başarıyla güncellendi.", "success");
        setCategoryName("");
        setEditingCategoryId(null);
      } else {
        const categoryData = {
          id: 0,
          adi: categoryName.trim(),
          eklenmeTarihi: new Date().toISOString(),
          guncellenmeTarihi: new Date().toISOString(),
          durumu: 1,
          KullaniciId: user.id,
        };

        await api.post(`${API_BASE_URL}/urunKategori/create`, categoryData);
        addToast("Kategori başarıyla eklendi.", "success");
        setCategoryName("");
      }

      await fetchData(`${API_BASE_URL}/urunKategori/get-all`, setCategories);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Kategori kaydedilirken hata oluştu.",
        "error",
      );
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleCancelCategory = () => {
    setShowCategoryModal(false);
    setCategoryName("");
    setEditingCategoryId(null);
  };

  const handleAddBrand = () => {
    setShowBrandModal(true);
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      addToast("Lütfen marka adını girin.", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    setBrandLoading(true);
    try {
      if (editingBrandId) {
        const existingBrand = brands.find((b) => b.id === editingBrandId);
        if (!existingBrand) {
          addToast("Marka bulunamadı.", "error");
          return;
        }

        const brandData = {
          ...existingBrand,
          adi: brandName.trim(),
          guncellenmeTarihi: new Date().toISOString(),
          KullaniciId: user.id,
        };

        await api.put(`${API_BASE_URL}/urunMarka/update`, brandData);
        addToast("Marka başarıyla güncellendi.", "success");
        setBrandName("");
        setEditingBrandId(null);
      } else {
        const brandData = {
          id: 0,
          adi: brandName.trim(),
          eklenmeTarihi: new Date().toISOString(),
          guncellenmeTarihi: new Date().toISOString(),
          durumu: 1,
          KullaniciId: user.id,
        };

        await api.post(`${API_BASE_URL}/urunMarka/create`, brandData);
        addToast("Marka başarıyla eklendi.", "success");
        setBrandName("");
      }

      await fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Marka kaydedilirken hata oluştu.",
        "error",
      );
    } finally {
      setBrandLoading(false);
    }
  };

  const handleCancelBrand = () => {
    setShowBrandModal(false);
    setBrandName("");
    setEditingBrandId(null);
  };

  const handleAddShelf = () => {
    setShowShelfModal(true);
  };

  const handleSaveShelf = async () => {
    if (!shelfName.trim()) {
      addToast("Lütfen raf adını girin.", "error");
      return;
    }

    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    setShelfLoading(true);
    try {
      if (editingShelfId) {
        const existingShelf = shelves.find((s) => s.id === editingShelfId);
        if (!existingShelf) {
          addToast("Raf bulunamadı.", "error");
          return;
        }

        const shelfData = {
          ...existingShelf,
          adi: shelfName.trim(),
          guncellenmeTarihi: new Date().toISOString(),
          KullaniciId: user.id,
        };

        await api.put(`${API_BASE_URL}/urunRaf/update`, shelfData);
        addToast("Raf başarıyla güncellendi.", "success");
        setShelfName("");
        setEditingShelfId(null);
      } else {
        const shelfData = {
          id: 0,
          adi: shelfName.trim(),
          eklenmeTarihi: new Date().toISOString(),
          guncellenmeTarihi: new Date().toISOString(),
          durumu: 1,
          KullaniciId: user.id,
        };

        await api.post(`${API_BASE_URL}/urunRaf/create`, shelfData);
        addToast("Raf başarıyla eklendi.", "success");
        setShelfName("");
      }

      await fetchData(`${API_BASE_URL}/urunRaf/get-all`, setShelves);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Raf kaydedilirken hata oluştu.",
        "error",
      );
    } finally {
      setShelfLoading(false);
    }
  };

  const handleCancelShelf = () => {
    setShowShelfModal(false);
    setShelfName("");
    setEditingShelfId(null);
  };

  const handleEditCategory = (category) => {
    setCategoryName(category.adi);
    setEditingCategoryId(category.id);
  };

  const handleDeleteCategory = async (categoryId) => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    const deleteAction = async () => {
      setCategoryLoading(true);
      try {
        await api.delete(`${API_BASE_URL}/urunKategori/delete/${categoryId}?kullaniciId=${user.id}`);
        await fetchData(`${API_BASE_URL}/urunKategori/get-all`, setCategories);
        addToast("Kategori başarıyla silindi.", "success");
      } catch (err) {
        addToast(
          err.response?.data?.message || "Kategori silinirken hata oluştu.",
          "error",
        );
      } finally {
        setCategoryLoading(false);
      }
    };

    showConfirmDialog(
      "Bu kategoriyi silmek istediğinizden emin misiniz?",
      deleteAction,
    );
  };

  const handleEditBrand = (brand) => {
    setBrandName(brand.adi);
    setEditingBrandId(brand.id);
  };

  const handleDeleteBrand = async (brandId) => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    const deleteAction = async () => {
      setBrandLoading(true);
      try {
        await api.delete(`${API_BASE_URL}/urunMarka/delete/${brandId}?kullaniciId=${user.id}`);
        await fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
        addToast("Marka başarıyla silindi.", "success");
      } catch (err) {
        addToast(
          err.response?.data?.message || "Marka silinirken hata oluştu.",
          "error",
        );
      } finally {
        setBrandLoading(false);
      }
    };

    showConfirmDialog(
      "Bu markayı silmek istediğinizden emin misiniz?",
      deleteAction,
    );
  };

  const handleEditShelf = (shelf) => {
    setShelfName(shelf.adi);
    setEditingShelfId(shelf.id);
  };

  const handleDeleteShelf = async (shelfId) => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (user.id === 0) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    const deleteAction = async () => {
      setShelfLoading(true);
      try {
        await api.delete(`${API_BASE_URL}/urunRaf/delete/${shelfId}?kullaniciId=${user.id}`);
        await fetchData(`${API_BASE_URL}/urunRaf/get-all`, setShelves);
        addToast("Raf başarıyla silindi.", "success");
      } catch (err) {
        addToast(
          err.response?.data?.message || "Raf silinirken hata oluştu.",
          "error",
        );
      } finally {
        setShelfLoading(false);
      }
    };

    showConfirmDialog(
      "Bu rafı silmek istediğinizden emin misiniz?",
      deleteAction,
    );
  };

  const handleExcelUpload = () => {
    setShowExcelModal(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get(`${API_BASE_URL}/urun/download-template`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "urun_sablonu.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast("Excel şablonu başarıyla indirildi.", "success");
    } catch (err) {
      console.error("Şablon indirme hatası:", err);
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
      await api.post(`${API_BASE_URL}/urun/upload-excel`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          accept: "*/*",
        },
      });
      await fetchProducts();
      addToast("Excel dosyası başarıyla yüklendi.", "success");
      setShowExcelModal(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Excel yükleme hatası:", err);
      addToast(
        err.response?.data?.message || "Excel dosyası yüklenemedi.",
        "error",
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const handleBulkUpdate = () => {
    addToast("Toplu ürün güncelleme işlemi başlatıldı.", "success");
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {}, [products, searchTerm]);

  const filteredProducts = showAllProducts
    ? products.filter((product) =>
        product.name?.toLowerCase().includes((searchTerm || "").toLowerCase()),
      )
    : products.filter(
        (product) =>
          product.stockQuantity > 0 &&
          product.name
            ?.toLowerCase()
            .includes((searchTerm || "").toLowerCase()),
      );

  const totalStock = filteredProducts.reduce((sum, product) => {
    return sum + (product.stockQuantity || 0);
  }, 0);

  const productsWithStock = filteredProducts.filter(
    (p) => p.stockQuantity > 0,
  ).length;
  const productsWithoutStock = filteredProducts.filter(
    (p) => p.stockQuantity === 0,
  ).length;

  const visibleIds = filteredProducts.map((p) => p.id);
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const visibleAllSelected = visibleIds.every((id) => prev.includes(id));
      return visibleAllSelected
        ? prev.filter((id) => !visibleIds.includes(id))
        : Array.from(new Set([...prev, ...visibleIds]));
    });
  };

  const toggleOne = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          <div className="d-flex gap-2">
            <CButton
              color="success"
              style={{
                color: "white",
                paddingLeft: "5px",
                paddingRight: "5px",
              }}
              className="text-light"
              onClick={handleNewProduct}
            >
              <CIcon icon={cilPlus} /> Yeni Ürün/Hizmet Ekle
            </CButton>
            <CButton
              color="info"
              style={{
                color: "white",
                paddingLeft: "5px",
                paddingRight: "5px",
              }}
              onClick={handleAddCategory}
            >
              <CIcon icon={cilFolder} /> Kategori Ekle
            </CButton>
            <CButton
              color="secondary"
              style={{
                color: "white",
                paddingLeft: "5px",
                paddingRight: "5px",
              }}
              onClick={handleAddBrand}
            >
              <CIcon icon={cilBadge} /> Marka Ekle
            </CButton>
            <CButton
              color="primary"
              style={{
                color: "white",
                paddingLeft: "5px",
                paddingRight: "5px",
              }}
              onClick={handleAddShelf}
            >
              <CIcon icon={cilFolder} /> Raf Ekle
            </CButton>
          </div>
        </CCol>
        <CCol className="d-flex gap-2">
          <CButton
            color="primary"
            style={{ color: "white" }}
            onClick={handleExcelUpload}
          >
            <CIcon icon={cilCloudUpload} /> Excel'den Yükle
          </CButton>
          <CButton
            color="warning"
            style={{ color: "white" }}
            onClick={handleBulkUpdate}
            disabled={true}
          >
            <CIcon icon={cilPencil} /> Toplu Güncelle
          </CButton>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={handleBulkDelete}
            disabled={selectedIds.length === 0}
          >
            <CIcon icon={cilTrash} /> Toplu Sil
          </CButton>
        </CCol>
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
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
              <CFormSwitch
                label="Tüm Ürünler"
                checked={showAllProducts}
                onChange={() => setShowAllProducts(!showAllProducts)}
              />
              <CFormSwitch
                label="Aktif Ürünler"
                checked={!showAllProducts}
                onChange={() => setShowAllProducts(!showAllProducts)}
              />
            </div>
            <CFormInput
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "200px", color: "#000000" }}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && (
            <>
              <CRow className="mb-4">
                <CCol sm={3}>
                  <div className="border-start border-start-4 border-start-info py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">
                      Toplam Ürün
                    </div>
                    <div className="fs-5 fw-semibold">
                      {filteredProducts.length}
                    </div>
                  </div>
                </CCol>
                <CCol sm={3}>
                  <div className="border-start border-start-4 border-start-success py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">
                      Toplam Stok
                    </div>
                    <div className="fs-5 fw-semibold text-success">
                      {totalStock.toLocaleString("tr-TR")} Adet
                    </div>
                  </div>
                </CCol>
                <CCol sm={3}>
                  <div className="border-start border-start-4 border-start-warning py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">
                      Stoklu Ürün
                    </div>
                    <div className="fs-5 fw-semibold">{productsWithStock}</div>
                  </div>
                </CCol>
                <CCol sm={3}>
                  <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                    <div className="text-medium-emphasis small">
                      Stoksuz Ürün
                    </div>
                    <div className="fs-5 fw-semibold">
                      {productsWithoutStock}
                    </div>
                  </div>
                </CCol>
              </CRow>

              {filteredProducts.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted">Henüz ürün bulunmuyor.</p>
                  <CButton
                    color="success"
                    style={{ color: "white" }}
                    onClick={handleNewProduct}
                    className="mt-2"
                  >
                    <CIcon icon={cilPlus} /> İlk Ürünü Ekle
                  </CButton>
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onProductClick={handleProductClick}
                  selectedIds={selectedIds}
                  allSelected={allSelected}
                  onToggleAll={toggleAll}
                  onToggleOne={toggleOne}
                />
              )}
            </>
          )}
        </CCardBody>
      </CCard>
      <CModal
        visible={showExcelModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setShowExcelModal(false)}
      >
        <CModalHeader>
          <CModalTitle>Excel ile Ürün Yükleme</CModalTitle>
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
            Eğer mevcut ürünlerinizi tek tek tanımlamak uzun sürecekse,
            yukarıdaki "Excel Şablonu İndir" düğmesini tıklayarak şablon
            dosyasını bilgisayarınıza indirin.
          </p>
          <ul
            style={{
              padding: "35px",
              backgroundColor: "#fff3cd",
              borderRadius: "15px",
            }}
          >
            <li>Şablon üzerindeki kolonları değiştirmeyin.</li>
            <li>
              Şablonda sadece 'Ürün Adı' ve 'KDV Oranı' alanı zorunludur, diğer
              tüm alanlar isteğe bağlıdır.
            </li>
            <li>
              'KDV Oranı' alanına 0, 1, 10, 20 değerlerini kullanabilirsiniz.
            </li>
            <li>
              Dosyadaki ürün fiyatlarınız KDV dahilse 'KDV Dahil mi?' kolonuna E
              yazın, değilse H yazın veya boş bırakın.
            </li>
            <li>
              'Ürün Tipi' alanında stoklu ürünler için S yazın. Stok
              tutmadığınız ürünlerde (örneğin hizmet, danışmanlık vs) boş
              bırakın.
            </li>
            <li>
              Para birimi alanında TL, EUR, USD, GBP, CHF... gibi ürün kartında
              gördüğünüz para birimlerini kullanın, boş bırakırsanız TL olarak
              işlenecektir.
            </li>
            <li>
              Alış ya da satış fiyatı alanlarında kuruş ayracı olarak nokta
              yerine virgül kullanın. Örneğin 10,50 (10 lira 50 kuruş)
            </li>
            <li>
              Sistemde benzer isimli veya barkodlu ürün varsa yeni kayıt
              açılmayacak, mevcut kayıt güncellenecektir.
            </li>
            <li>
              'Ürün Tipi' alanında stoklu ürünler için S yazın. Stok
              tutmadığınız (örneğin hizmet, danışmanlık vs) ürünleriniz için ise
              H yazın.
            </li>
            <li>
              'Birim' kolonunu boş bırakırsanız 'adet' olarak işlenecektir.
              Sistemdeki geçerli birim listesi için{" "}
              <a href="/app/birimler" target="_blank">
                tıklayın
              </a>
              .
            </li>
          </ul>
          <p>
            Mevcut ürün listenizi şablon dosyasına kaydettikten sonra, aşağıdaki
            "Excel Şablonu Yükle" düğmesi ile sisteme yükleyin.
          </p>
          <p>
            Doldurduğunuz excel dosyasını aşağıdaki düğme ile sisteme yükleyin.
          </p>
          <CFormInput
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="mb-3"
            style={{ color: "#000000" }}
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
          <p className="mt-3">
            İşlem esnasında çözemediğiniz bir problem olursa excel dosyanızı{" "}
            <a href="mailto:destek@speedsoft.com.tr">destek@speedsoft.com.tr</a>{" "}
            adresine gönderin.
          </p>
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
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <CModalHeader style={{ backgroundColor: "#DC3545", color: "white" }}>
          <CModalTitle>Ürünleri Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div
            style={{
              backgroundColor: "#fff3cd",
              padding: "15px",
              borderRadius: "5px",
            }}
          >
            <p>
              <span style={{ color: "#DC3545" }}>
                <CIcon icon={cilWarning} /> Dikkat
              </span>
            </p>
            <p>
              Seçili <strong>{selectedIds.length}</strong> ürünü silmek
              üzeresiniz. Bu işlemi onaylıyor musunuz?
            </p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={handleConfirmBulkDelete}
            disabled={loading}
          >
            {loading ? "Siliniyor..." : "Evet"}
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            Hayır
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showCategoryModal}
        onClose={handleCancelCategory}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            {editingCategoryId ? "Kategori Düzenle" : "Kategori Yönetimi"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <CFormLabel htmlFor="categoryName">
              {editingCategoryId
                ? "Kategori Adını Düzenle"
                : "Yeni Kategori Adı"}
            </CFormLabel>
            <div className="d-flex gap-2">
              <CFormInput
                type="text"
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Kategori adını girin..."
                disabled={categoryLoading}
                className="flex-grow-1"
                style={{ color: "#ffffff" }}
              />
              <CButton
                color="success"
                style={{ color: "white" }}
                onClick={handleSaveCategory}
                disabled={categoryLoading || !categoryName.trim()}
              >
                {categoryLoading ? (
                  <CSpinner size="sm" />
                ) : editingCategoryId ? (
                  "Güncelle"
                ) : (
                  "Ekle"
                )}
              </CButton>
              {editingCategoryId && (
                <CButton
                  color="secondary"
                  style={{ color: "white" }}
                  onClick={() => {
                    setCategoryName("");
                    setEditingCategoryId(null);
                  }}
                >
                  İptal
                </CButton>
              )}
            </div>
          </div>
          <hr />
          <div>
            <h6>Mevcut Kategoriler ({categories.length})</h6>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {categories.length === 0 ? (
                <p className="text-muted">Henüz kategori bulunmuyor.</p>
              ) : (
                <div className="list-group">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{category.adi}</span>
                      <div className="d-flex gap-1">
                        <CButton
                          color="info"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleEditCategory(category)}
                          disabled={categoryLoading}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                        <CButton
                          color="danger"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={categoryLoading}
                        >
                          <CIcon icon={cilTrash} size="sm" />
                        </CButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelCategory}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showBrandModal}
        onClose={handleCancelBrand}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            {editingBrandId ? "Marka Düzenle" : "Marka Yönetimi"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <CFormLabel htmlFor="brandName">
              {editingBrandId ? "Marka Adını Düzenle" : "Yeni Marka Adı"}
            </CFormLabel>
            <div className="d-flex gap-2">
              <CFormInput
                type="text"
                id="brandName"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Marka adını girin..."
                disabled={brandLoading}
                className="flex-grow-1"
                style={{ color: "#ffff" }}
              />
              <CButton
                color="success"
                style={{ color: "white" }}
                onClick={handleSaveBrand}
                disabled={brandLoading || !brandName.trim()}
              >
                {brandLoading ? (
                  <CSpinner size="sm" />
                ) : editingBrandId ? (
                  "Güncelle"
                ) : (
                  "Ekle"
                )}
              </CButton>
              {editingBrandId && (
                <CButton
                  color="secondary"
                  style={{ color: "white" }}
                  onClick={() => {
                    setBrandName("");
                    setEditingBrandId(null);
                  }}
                >
                  İptal
                </CButton>
              )}
            </div>
          </div>
          <hr />
          <div>
            <h6>Mevcut Markalar ({brands.length})</h6>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {brands.length === 0 ? (
                <p className="text-muted">Henüz marka bulunmuyor.</p>
              ) : (
                <div className="list-group">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{brand.adi}</span>
                      <div className="d-flex gap-1">
                        <CButton
                          color="info"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleEditBrand(brand)}
                          disabled={brandLoading}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                        <CButton
                          color="danger"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleDeleteBrand(brand.id)}
                          disabled={brandLoading}
                        >
                          <CIcon icon={cilTrash} size="sm" />
                        </CButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelBrand}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showShelfModal}
        onClose={handleCancelShelf}
        backdrop="static"
        keyboard={false}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>
            {editingShelfId ? "Raf Düzenle" : "Raf Yönetimi"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div className="mb-4">
            <CFormLabel htmlFor="shelfName">
              {editingShelfId ? "Raf Adını Düzenle" : "Yeni Raf Adı"}
            </CFormLabel>
            <div className="d-flex gap-2">
              <CFormInput
                type="text"
                id="shelfName"
                value={shelfName}
                onChange={(e) => setShelfName(e.target.value)}
                placeholder="Raf adını girin..."
                disabled={shelfLoading}
                className="flex-grow-1"
                style={{ color: "#fffff" }}
              />
              <CButton
                color="success"
                style={{ color: "white" }}
                onClick={handleSaveShelf}
                disabled={shelfLoading || !shelfName.trim()}
              >
                {shelfLoading ? (
                  <CSpinner size="sm" />
                ) : editingShelfId ? (
                  "Güncelle"
                ) : (
                  "Ekle"
                )}
              </CButton>
              {editingShelfId && (
                <CButton
                  color="secondary"
                  style={{ color: "white" }}
                  onClick={() => {
                    setShelfName("");
                    setEditingShelfId(null);
                  }}
                >
                  İptal
                </CButton>
              )}
            </div>
          </div>
          <hr />
          <div>
            <h6>Mevcut Raflar ({shelves.length})</h6>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              {shelves.length === 0 ? (
                <p className="text-muted">Henüz raf bulunmuyor.</p>
              ) : (
                <div className="list-group">
                  {shelves.map((shelf) => (
                    <div
                      key={shelf.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <span>{shelf.adi}</span>
                      <div className="0d-flex gap-1">
                        <CButton
                          color="info"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleEditShelf(shelf)}
                          disabled={shelfLoading}
                        >
                          <CIcon icon={cilPencil} size="sm" />
                        </CButton>
                        <CButton
                          color="danger"
                          style={{ color: "white" }}
                          size="sm"
                          onClick={() => handleDeleteShelf(shelf.id)}
                          disabled={shelfLoading}
                        >
                          <CIcon icon={cilTrash} size="sm" />
                        </CButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelShelf}>
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showConfirmModal}
        onClose={handleCancelConfirm}
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader style={{ backgroundColor: "#DC3545", color: "white" }}>
          <CModalTitle>Onay</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <div
            style={{
              backgroundColor: "#fff3cd",
              padding: "15px",
              borderRadius: "5px",
            }}
          >
            <p>
              <span style={{ color: "#DC3545" }}>
                <CIcon icon={cilWarning} /> Dikkat
              </span>
            </p>
            <p>{confirmMessage}</p>
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={handleConfirm}
            disabled={confirmLoading}
          >
            {confirmLoading ? (
              <>
                <CSpinner size="sm" className="me-2" />
                İşleniyor...
              </>
            ) : (
              "Evet"
            )}
          </CButton>
          <CButton
            color="secondary"
            onClick={handleCancelConfirm}
            disabled={confirmLoading}
          >
            Hayır
          </CButton>
        </CModalFooter>
      </CModal>
    </ErrorBoundary>
  );
};

export default Products;