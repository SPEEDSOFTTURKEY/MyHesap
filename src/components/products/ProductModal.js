import { useState } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CButton,
  CButtonGroup,
  CRow,
  CCol,
} from "@coreui/react";
import ProductDefinition from "./ProductDefinition";
import Pricing from "./Pricing";
import OtherInfo from "./OtherInfo";
import Images from "./Images";
import api from "../../api/api";

const API_BASE_URL = "https://localhost:44375/api";

const ProductModal = ({
  visible,
  onClose,
  onSubmit,
  addToast,
  product = null,
}) => {
  const [formData, setFormData] = useState({
    id: product?.id || "",
    name: product?.name || "",
    unit: product?.unit || "Adet",
    type: product?.type || "Stoklu",
    categoryId: product?.categoryId || "",
    brandId: product?.brandId || "",
    shelfId: product?.shelfId || "",
    depoId:product?.depoId || "",
    salePrice: product?.salePrice ? String(product.salePrice) : "",
    saleCurrency: product?.saleCurrency || "TRY",
    purchaseCurrency: product?.purchaseCurrency || "TRY",
    saleVatRate: product?.saleVatRate ? String(product.saleVatRate) : "",
    saleVatIncluded: product?.saleVatIncluded || false,
    otvRate: product?.otvRate ? String(product.otvRate) : "",
    otvType: product?.otvType || "Yok",
    purchasePrice: product?.purchasePrice ? String(product.purchasePrice) : "",
    purchaseVatRate: product?.purchaseVatRate
      ? String(product.purchaseVatRate)
      : "",
    purchaseVatIncluded: product?.purchaseVatIncluded || false,
    purchaseDiscount: product?.purchaseDiscount
      ? String(product.purchaseDiscount)
      : "",
    productCode: product?.productCode || "",
    gtip: product?.gtip || "",
    countryCode: product?.countryCode || "TR",
    stockAmount: product?.stockAmount ? String(product.stockAmount) : "",
    invoiceTitle: product?.invoiceTitle || "",
    description: product?.description || "",
    barcode: product?.barcode || "",
    trackStock: product?.trackStock || false,
    criticalStock: product?.criticalStock ? String(product.criticalStock) : "",
    tags: Array.isArray(product?.tags) ? product.tags.join(", ") : "",
    images: Array.isArray(product?.images) ? product.images : [],
  });

  const [activeTab, setActiveTab] = useState("productDefinition");
  const [loading, setLoading] = useState(false);
  const [showConfirmUpdateModal, setShowConfirmUpdateModal] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.salePrice || !formData.unit) {
      addToast({
        message: "Ürün Adı, Satış Fiyatı ve Birim zorunlu alanlardır.",
        color: "danger",
      });
      return;
    }
    setShowConfirmUpdateModal(true);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      // Kullanıcı ID'sini al
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      
      const productFormData = new FormData();
      productFormData.append("Id", formData.id || 0);
      productFormData.append("Adi", formData.name || "");
      productFormData.append("UrunTipi", formData.type === "Stoklu");
      productFormData.append(
        "BirimAdi",
        formData.unit === "Adet" ? "adet" : formData.unit || "adet",
      );

      // Sayısal değerleri güvenli şekilde ekle
      const salePrice = parseFloat(formData.salePrice.replace(",", ".")) || 0;
      const purchasePrice =
        parseFloat(formData.purchasePrice.replace(",", ".")) || 0;
      const saleVatRate =
        parseFloat(formData.saleVatRate.replace(",", ".")) || 0;
      const purchaseVatRate =
        parseFloat(formData.purchaseVatRate.replace(",", ".")) || 0;
      const otvRate = parseFloat(formData.otvRate.replace(",", ".")) || 0;
      const purchaseDiscount =
        parseFloat(formData.purchaseDiscount.replace(",", ".")) || 0;
      const stockAmount = parseInt(formData.stockAmount) || 0;
      const criticalStock = parseInt(formData.criticalStock) || 0;

      productFormData.append("SatisFiyat", salePrice);
      productFormData.append("AlisFiyat", purchasePrice);
      productFormData.append("SatisKDV", saleVatRate);
      productFormData.append("AlisKDV", purchaseVatRate);
      productFormData.append("SatisKdvDahilmi", formData.saleVatIncluded);
      productFormData.append("AlisKdvDahilmi", formData.purchaseVatIncluded);
      productFormData.append("OIVOrani", otvRate);
      productFormData.append("AlisIskontosu", purchaseDiscount);
      productFormData.append(
        "OTVTipi",
        formData.otvType === "Yok" ? null : formData.otvType,
      );
      productFormData.append(
        "UrunKategoriId",
        parseInt(formData.categoryId) || 0,
      );
      productFormData.append("UrunMarkaId", parseInt(formData.brandId) || 0);
      productFormData.append("UrunRafId", parseInt(formData.shelfId) || 0);
            productFormData.append("DepoId", parseInt(formData.depoId) || 0);

      productFormData.append("UrunKodu", formData.productCode || "");
      productFormData.append("GTIPKodu", formData.gtip || "");
      productFormData.append("UlkeId", parseInt(formData.countryCode) || 0);
      productFormData.append("StokMiktari", stockAmount);
      productFormData.append("FaturaBasligi", formData.invoiceTitle || "");
      productFormData.append("Aciklama", formData.description || "");
      productFormData.append("Barkod", formData.barcode || "");
      productFormData.append(
        "StokTakip",
        formData.trackStock ? "Evet" : "Hayır",
      );
      productFormData.append("KritikStok", criticalStock);
      productFormData.append("Etiketler", formData.tags || "");
      productFormData.append("Durumu", 1);
      
      // Kullanıcı ID'sini ekle
      productFormData.append("KullaniciId", user.id);

      // Fotoğraf ekleme (async for-of kullanıldı)
      if (formData.images.length > 0) {
        for (const img of formData.images) {
          if (img instanceof File) {
            productFormData.append("Fotograf", img);
          } else if (typeof img === "string" && img.startsWith("data:image")) {
            const blob = await (await fetch(img)).blob();
            productFormData.append("Fotograf", blob, "image.png");
          }
        }
      } else if (product?.images?.[0]) {
        productFormData.append("Fotograf", product.images[0]);
      }

      const endpoint = product?.id
        ? `${API_BASE_URL}/urun/urun-update`
        : `${API_BASE_URL}/urun/urun-create`;
      const response = await api[product?.id ? "put" : "post"](
        endpoint,
        productFormData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (
        response.data.message === "Güncelleme Başarılı." ||
        response.data.message === "Ekleme Başarılı."
      ) {
        let categoryName = "",
          brandName = "",
          shelfName = "";
        try {
          if (formData.categoryId) {
            const res = await api.get(
              `${API_BASE_URL}/urunKategori/get-by-id/${formData.categoryId}`,
            );
            categoryName = res.data.adi || "";
          }
          if (formData.brandId) {
            const res = await api.get(
              `${API_BASE_URL}/urunMarka/get-by-id/${formData.brandId}`,
            );
            brandName = res.data.adi || "";
          }
          if (formData.shelfId) {
            const res = await api.get(
              `${API_BASE_URL}/urunRaf/get-by-id/${formData.shelfId}`,
            );
            shelfName = res.data.adi || "";
          }
             if (formData.depoId) {
            const res = await api.get(
              `${API_BASE_URL}/depo/depo-get-by-id/${formData.depoId}`,
            );
            shelfName = res.data.adi || "";
          }
        } catch (err) {
          console.error("Error fetching names:", err);
          addToast("Kategori, marka veya raf isimleri alınamadı.", "error");
        }

        onSubmit({
          id: product?.id || response.data.id,
          name: formData.name,
          unit: formData.unit,
          type: formData.type,
          categoryId: parseInt(formData.categoryId) || 0,
          brandId: parseInt(formData.brandId) || 0,
          shelfId: parseInt(formData.shelfId) || 0,
          depoId:parseInt(formData.depoId) || 0,
          category: categoryName,
          brand: brandName,
          shelfLocation: shelfName,
          salePrice,
          saleCurrency: formData.saleCurrency,
          purchaseCurrency: formData.purchaseCurrency,
          saleVatRate,
          saleVatIncluded: formData.saleVatIncluded,
          otvRate,
          otvType: formData.otvType,
          purchasePrice,
          purchaseVatRate,
          purchaseVatIncluded: formData.purchaseVatIncluded,
          purchaseDiscount,
          productCode: formData.productCode,
          gtip: formData.gtip,
          countryCode: formData.countryCode,
          stockAmount,
          invoiceTitle: formData.invoiceTitle,
          description: formData.description,
          barcode: formData.barcode,
          trackStock: formData.trackStock,
          criticalStock,
          tags: formData.tags
            ? formData.tags.split(",").map((t) => t.trim())
            : [],
          images: formData.images,
        });

        addToast(
          product?.id
            ? "Ürün başarıyla güncellendi."
            : "Ürün başarıyla eklendi.",
          "success",
        );
        setShowConfirmUpdateModal(false);
        onClose();
      } else {
        throw new Error("Sunucu yanıtı beklenmedik: " + response.data.message);
      }
    } catch (err) {
      console.error("Submit Error:", err.message, err.stack);
      addToast(
        err.response?.data?.message || "Ürün işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowConfirmUpdateModal(false);
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "productDefinition":
        return (
          <ProductDefinition formData={formData} handleChange={handleChange} />
        );
      case "pricing":
        return <Pricing formData={formData} handleChange={handleChange} />;
      case "otherInfo":
        return <OtherInfo formData={formData} handleChange={handleChange} />;
      case "images":
        return (
          <Images formData={formData} handleImageUpload={handleImageUpload} />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <CModal
        visible={visible}
        onClose={handleClose}
        backdrop="static"
        size="lg"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "#fff" }}>
          <CModalTitle>
            {product?.id ? "Ürün/Hizmet Güncelle" : "Yeni Ürün/Hizmet Ekle"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleSaveClick}>
            <CButtonGroup role="group" className="mb-4 w-100">
              {["productDefinition", "pricing", "otherInfo", "images"].map(
                (tab) => (
                  <CButton
                    key={tab}
                    style={{
                      backgroundColor:
                        activeTab === tab ? "#FFFFFF" : "#2965A8",
                      color: activeTab === tab ? "#2965A8" : "#FFFFFF",
                      border: "1px solid #2965A8",
                      flex: 1,
                      textAlign: "center",
                    }}
                    onClick={() => setActiveTab(tab)}
                    disabled={loading}
                  >
                    {tab === "productDefinition"
                      ? "Ürün/Hizmet Tanımı"
                      : tab === "pricing"
                        ? "Fiyatlandırma"
                        : tab === "otherInfo"
                          ? "Diğer Bilgiler"
                          : "Resimler"}
                  </CButton>
                ),
              )}
            </CButtonGroup>
            <div style={{ padding: "0 15px" }}>{renderTabContent()}</div>
            <CModalFooter>
              <CButton
                color="secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Vazgeç
              </CButton>
              <CButton color="primary" type="submit" disabled={loading}>
                {loading ? "Kaydediliyor..." : "Kaydet"}
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Güncelleme Onayı Modalı */}
      <CModal
        visible={showConfirmUpdateModal}
        onClose={() => setShowConfirmUpdateModal(false)}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#2965A8", color: "#FFFFFF" }}>
          <CModalTitle>Güncelleme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Ürün "<strong>{formData?.name || "Bilinmeyen Ürün"}</strong>"{" "}
            {product?.id ? "güncellenecek" : "eklenecek"}, emin misiniz?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowConfirmUpdateModal(false)}
          >
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleSubmit}
            className="text-white"
          >
            Onayla
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default ProductModal;