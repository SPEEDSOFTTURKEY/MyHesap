import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormLabel,
  CFormInput,
  CSpinner,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilSave, cilFolder, cilBadge } from "@coreui/icons";
import ProductDefinition from "../../../components/products/ProductDefinition";
import Pricing from "../../../components/products/Pricing";
import OtherInfo from "../../../components/products/OtherInfo";
import api from "../../../api/api";

const API_BASE_URL = "https://speedsofttest.com/api";

const ProductNew = () => {
  const navigate = useNavigate();
  const toaster = useRef();
  const [formData, setFormData] = useState({
    name: "",
    unit: "Adet",
    type: "Stoklu",
    salePrice: "",
    saleCurrency: "TRY",
    saleVatRate: "",
    saleVatIncluded: false,
    otvRate: "",
    otvType: "Yok",
    purchasePrice: "",
    purchaseVatRate: "",
    purchaseVatIncluded: false,
    purchaseDiscount: "",
    categoryId: "",
    brandId: "",
    productCode: "",
    gtip: "",
    countryCode: "TR",
    invoiceTitle: "",
    description: "",
    barcode: "",
    shelfId: "",
    trackStock: false,
    criticalStock: "",
    tags: "",
    images: [],
  });
  const [previews, setPreviews] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [activeTab, setActiveTab] = useState("productDefinition");
  const [selectedImage, setSelectedImage] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandLoading, setBrandLoading] = useState(false);
  const [showShelfModal, setShowShelfModal] = useState(false);
  const [shelfName, setShelfName] = useState("");
  const [shelfLoading, setShelfLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Log user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user")) || {
          id: null,
          username: "Unknown",
          email: "Unknown",
        };
        console.log("Logged-in user data:", {
          id: user.id,
          username: user.username,
          email: user.email,
        });
      } catch (err) {
        console.error("Error fetching user data:", err.message);
      }
    };
    fetchUserData();
  }, []);

  const addToast = (message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide visible delay={5000}>
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

  const handleAddCategory = () => setShowCategoryModal(true);
  const handleCancelCategory = () => {
    setShowCategoryModal(false);
    setCategoryName("");
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) {
      addToast("Lütfen kategori adını girin.", "error");
      return;
    }
    setCategoryLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      const response = await api.post(`${API_BASE_URL}/urunKategori/create`, {
        id: 0,
        adi: categoryName.trim(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
        KullaniciId: user.id,
      });
      addToast("Kategori başarıyla eklendi.");
      setShowCategoryModal(false);
      setCategoryName("");
      setRefreshTrigger((prev) => prev + 1);
      if (response.data?.id) {
        setFormData((prev) => ({ ...prev, categoryId: response.data.id }));
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Kategori eklenemedi.", "error");
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleAddBrand = () => setShowBrandModal(true);
  const handleCancelBrand = () => {
    setShowBrandModal(false);
    setBrandName("");
  };

  const handleSaveBrand = async () => {
    if (!brandName.trim()) {
      addToast("Lütfen marka adını girin.", "error");
      return;
    }
    setBrandLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      const response = await api.post(`${API_BASE_URL}/urunMarka/create`, {
        id: 0,
        adi: brandName.trim(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
        KullaniciId: user.id,
      });
      addToast("Marka başarıyla eklendi.");
      setShowBrandModal(false);
      setBrandName("");
      setRefreshTrigger((prev) => prev + 1);
      if (response.data?.id) {
        setFormData((prev) => ({ ...prev, brandId: response.data.id }));
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Marka eklenemedi.", "error");
    } finally {
      setBrandLoading(false);
    }
  };

  const handleAddShelf = () => setShowShelfModal(true);
  const handleCancelShelf = () => {
    setShowShelfModal(false);
    setShelfName("");
  };

  const handleSaveShelf = async () => {
    if (!shelfName.trim()) {
      addToast("Lütfen raf adını girin.", "error");
      return;
    }
    setShelfLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      const response = await api.post(`${API_BASE_URL}/urunRaf/create`, {
        id: 0,
        adi: shelfName.trim(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
        KullaniciId: user.id,
      });
      addToast("Raf başarıyla eklendi.");
      setShowShelfModal(false);
      setShelfName("");
      setRefreshTrigger((prev) => prev + 1);
      if (response.data?.id) {
        setFormData((prev) => ({ ...prev, shelfId: response.data.id }));
      }
    } catch (err) {
      addToast(err.response?.data?.message || "Raf eklenemedi.", "error");
    } finally {
      setShelfLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleRemoveImage = (index) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    if (selectedImage === index) {
      setSelectedImage(null);
    } else if (selectedImage > index) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.name || !formData.salePrice || !formData.unit) {
        throw new Error(
          "Zorunlu alanları doldurun: Ürün Adı, Satış Fiyatı ve Birim.",
        );
      }

      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      const productFormData = new FormData();
      productFormData.append("Adi", formData.name);
      productFormData.append("UrunTipi", formData.type === "Stoklu");
      productFormData.append("BirimAdi", formData.unit);
      productFormData.append("SatisFiyat", parseFloat(formData.salePrice));
      productFormData.append(
        "AlisFiyat",
        parseFloat(formData.purchasePrice || 0),
      );
      productFormData.append("SatisKDV", parseFloat(formData.saleVatRate || 0));
      productFormData.append(
        "AlisKDV",
        parseFloat(formData.purchaseVatRate || 0),
      );
      productFormData.append("AlisKdvDahilmi", formData.purchaseVatIncluded);
      productFormData.append("SatisKdvDahilmi", formData.saleVatIncluded);
      productFormData.append("OIVOrani", parseFloat(formData.otvRate || 0));
      productFormData.append(
        "AlisIskontosu",
        parseFloat(formData.purchaseDiscount || 0),
      );
      productFormData.append("OTVTipi", formData.otvType);
      productFormData.append(
        "UrunKategoriId",
        parseInt(formData.categoryId) || 0,
      );
      productFormData.append("UrunMarkaId", parseInt(formData.brandId) || 0);
      productFormData.append("UrunKodu", formData.productCode || "");
      productFormData.append("GTIPKodu", formData.gtip || "");
      productFormData.append("UlkeId", parseInt(formData.countryCode) || 0);
      productFormData.append("FaturaBasligi", formData.invoiceTitle || "");
      productFormData.append("Aciklama", formData.description || "");
      productFormData.append("Barkod", formData.barcode || "");
      productFormData.append("UrunRafId", parseInt(formData.shelfId) || 0);
      productFormData.append(
        "StokTakip",
        formData.trackStock ? "Evet" : "Hayır",
      );
      productFormData.append(
        "KritikStok",
        parseInt(formData.criticalStock || 0),
      );
      productFormData.append("Etiketler", formData.tags || "");
      productFormData.append("ParaBirimi", formData.saleCurrency);
      productFormData.append("KullaniciId", user.id);

      if (formData.images.length > 0) {
        formData.images.forEach((img) =>
          productFormData.append("Fotograf", img),
        );
      } else {
        productFormData.append("Fotograf", "");
      }

      await api.post(`${API_BASE_URL}/urun/urun-create`, productFormData, {
        headers: { "Content-Type": "multipart/form-data", accept: "*/*" },
      });

      addToast("Ürün başarıyla eklendi.");
      navigate("/app/products");
    } catch (err) {
      addToast(err.response?.data?.message || "Ürün eklenemedi.", "error");
    }
  };

  const handleCancel = () => navigate("/app/products");

  const imageContainerStyle = {
    display: "flex",
    gap: "0.75rem",
    flexWrap: "wrap",
    marginTop: "1rem",
  };

  const imageStyle = {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "0.375rem",
    border: "1px solid #dee2e6",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    transition: "all 0.2s ease",
    cursor: "pointer",
  };

  const selectedImageStyle = {
    ...imageStyle,
    border: "2px solid #3498db",
    boxShadow: "0 0 0 3px rgba(52, 152, 219, 0.3)",
  };

  const emptyStateStyle = {
    textAlign: "center",
    padding: "2rem",
    color: "#6c757d",
    fontStyle: "italic",
    backgroundColor: "#fff",
    borderRadius: "0.375rem",
    border: "1px dashed #dee2e6",
  };

  const previewContainerStyle = {
    marginTop: "1.5rem",
    padding: "1rem",
    backgroundColor: "#fff",
    borderRadius: "0.5rem",
    border: "1px solid #dee2e6",
  };

  const previewImageStyle = {
    maxWidth: "100%",
    maxHeight: "300px",
    borderRadius: "0.375rem",
    border: "1px solid #dee2e6",
  };

  const buttonStyle = {
    fontSize: "0.8rem",
    padding: "0.25rem 0.5rem",
    marginTop: "0.5rem",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "productDefinition":
        return (
          <ProductDefinition
            formData={formData}
            handleChange={handleChange}
            refreshTrigger={refreshTrigger}
          />
        );
      case "pricing":
        return <Pricing formData={formData} handleChange={handleChange} />;
      case "otherInfo":
        return <OtherInfo formData={formData} handleChange={handleChange} />;
      case "images":
        return (
          <div style={{ padding: "1rem" }}>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel style={{ fontWeight: "600" }}>
                  Ürün Resimleri
                </CFormLabel>
                <div
                  className="border rounded-3 p-4 text-center cursor-pointer"
                  style={{
                    background: "#f9f9f9",
                    border: "2px dashed #dee2e6 !important",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.target.style.borderColor = "#3498db")}
                  onMouseLeave={(e) => (e.target.style.borderColor = "#dee2e6")}
                  onClick={() => document.getElementById("imageInput").click()}
                >
                  <p className="m-0 text-muted">
                    📷 Resim yüklemek için tıklayın veya sürükleyin
                  </p>
                  <small className="text-muted">
                    (JPEG, PNG, GIF - Max 5MB)
                  </small>
                  <CFormInput
                    type="file"
                    id="imageInput"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handleImageUpload}
                    style={{ color: "#000000" }}
                  />
                </div>
              </CCol>
            </CRow>

            {previews.length > 0 ? (
              <>
                <div style={imageContainerStyle}>
                  {previews.map((preview, index) => (
                    <div key={index} style={{ position: "relative" }}>
                      <img
                        src={preview.url}
                        alt={`Ürün resmi ${index + 1}`}
                        style={
                          selectedImage === index
                            ? selectedImageStyle
                            : imageStyle
                        }
                        onMouseEnter={(e) => {
                          e.target.style.transform = "scale(1.05)";
                          e.target.style.boxShadow =
                            "0 4px 8px rgba(0,0,0,0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = "scale(1)";
                          e.target.style.boxShadow =
                            selectedImage === index
                              ? "0 0 0 3px rgba(52, 152, 219, 0.3)"
                              : "0 2px 4px rgba(0,0,0,0.1)";
                        }}
                        onClick={() => setSelectedImage(index)}
                      />
                      <CButton
                        color="danger"
                        size="sm"
                        style={{
                          position: "absolute",
                          top: "-8px",
                          right: "-8px",
                          borderRadius: "50%",
                          width: "24px",
                          height: "24px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.7rem",
                          padding: 0,
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        &times;
                      </CButton>
                    </div>
                  ))}
                </div>

                {selectedImage !== null && (
                  <div style={previewContainerStyle}>
                    <h6 style={{ marginBottom: "0.75rem", color: "#495057" }}>
                      Büyük Ön İzleme
                    </h6>
                    <div style={{ textAlign: "center" }}>
                      <img
                        src={previews[selectedImage].url}
                        alt={`Büyük ön izleme ${selectedImage + 1}`}
                        style={previewImageStyle}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "1rem",
                      }}
                    >
                      <CButton
                        color="primary"
                        size="sm"
                        style={buttonStyle}
                        onClick={() => setSelectedImage(null)}
                      >
                        Ön İzlemeyi Kapat
                      </CButton>
                      <CButton
                        color="danger"
                        size="sm"
                        style={buttonStyle}
                        onClick={() => {
                          handleRemoveImage(selectedImage);
                          setSelectedImage(null);
                        }}
                      >
                        Bu Resmi Sil
                      </CButton>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={emptyStateStyle}>
                <p>Henüz hiç resim eklenmemiş</p>
                <small>Yukarıdaki alandan resim yükleyebilirsiniz</small>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>

      <CModal visible={showCategoryModal} onClose={handleCancelCategory}>
        <CModalHeader>
          <CModalTitle>Yeni Kategori Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel>Kategori Adı</CFormLabel>
          <CFormInput
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Kategori adını giriniz"
            style={{ color: "#ffff" }}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelCategory}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveCategory}
            disabled={categoryLoading}
          >
            {categoryLoading ? <CSpinner size="sm" /> : "Kaydet"}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={showBrandModal} onClose={handleCancelBrand}>
        <CModalHeader>
          <CModalTitle>Yeni Marka Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel>Marka Adı</CFormLabel>
          <CFormInput
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Marka adını giriniz"
            style={{ color: "#ffff" }}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelBrand}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveBrand}
            disabled={brandLoading}
          >
            {brandLoading ? <CSpinner size="sm" /> : "Kaydet"}
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={showShelfModal} onClose={handleCancelShelf}>
        <CModalHeader>
          <CModalTitle>Yeni Raf Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormLabel>Raf Adı</CFormLabel>
          <CFormInput
            value={shelfName}
            onChange={(e) => setShelfName(e.target.value)}
            placeholder="Raf adını giriniz"
            style={{ color: "#fffff" }}
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={handleCancelShelf}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleSaveShelf}
            disabled={shelfLoading}
          >
            {shelfLoading ? <CSpinner size="sm" /> : "Kaydet"}
          </CButton>
        </CModalFooter>
      </CModal>

      <CRow className="mb-3">
        <CCol>
          <div className="d-flex gap-2">
            <CButton
              type="submit"
              form="productForm"
              style={{
                width: "150px",
                color: "white",
                backgroundColor: "#1D9030",
              }}
            >
              <CIcon icon={cilSave} /> Kaydet
            </CButton>
            <CButton color="secondary" onClick={handleCancel}>
              Vazgeç
            </CButton>
            <CButton
              color="info"
              style={{ color: "white" }}
              onClick={handleAddCategory}
            >
              <CIcon icon={cilFolder} /> Kategori Ekle
            </CButton>
            <CButton
              color="secondary"
              style={{ color: "white" }}
              onClick={handleAddBrand}
            >
              <CIcon icon={cilBadge} /> Marka Ekle
            </CButton>
            <CButton
              color="primary"
              style={{ color: "white" }}
              onClick={handleAddShelf}
            >
              <CIcon icon={cilFolder} /> Raf Ekle
            </CButton>
          </div>
        </CCol>
      </CRow>

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
                  activeTab === "productDefinition" ? "#FFFFFF" : "#2965A8",
                color:
                  activeTab === "productDefinition" ? "#2965A8" : "#FFFFFF",
              }}
              onClick={() => setActiveTab("productDefinition")}
            >
              Ürün/Hizmet Tanımı
            </CButton>
            <CButton
              style={{
                backgroundColor:
                  activeTab === "pricing" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "pricing" ? "#2965A8" : "#FFFFFF",
              }}
              onClick={() => setActiveTab("pricing")}
            >
              Fiyatlandırma
            </CButton>
            <CButton
              style={{
                backgroundColor:
                  activeTab === "otherInfo" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "otherInfo" ? "#2965A8" : "#FFFFFF",
              }}
              onClick={() => setActiveTab("otherInfo")}
            >
              Diğer Bilgiler
            </CButton>
            <CButton
              style={{
                backgroundColor: activeTab === "images" ? "#FFFFFF" : "#2965A8",
                color: activeTab === "images" ? "#2965A8" : "#FFFFFF",
              }}
              onClick={() => setActiveTab("images")}
            >
              Resimler
            </CButton>
          </CButtonGroup>
        </CCardHeader>
        <CCardBody>
          <CForm id="productForm" onSubmit={handleSubmit}>
            {renderTabContent()}
          </CForm>
        </CCardBody>
      </CCard>
    </>
  );
};

export default ProductNew;