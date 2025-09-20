
import { useState, useEffect, useCallback, useRef } from "react";
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
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CModal,
  CModalHeader,
  CModalBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil, cilList, cilTrash } from "@coreui/icons";
import ProductModal from "../../../components/products/ProductModal";
import StockMovementModal from "../../../components/products/StockMovementModal";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

const ProductDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(state?.product || null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [stockMovements, setStockMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const toaster = useRef();

  const addToast = (message, type = "success") => {
    const toast = (
      <CToast
        key={Date.now()}
        autohide={type !== "confirm"}
        visible={true}
        delay={5000}
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error"
              ? "Hata"
              : type === "confirm"
                ? "Onay"
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
      console.log(`Fetching data from: ${url}`);
      const { data } = await api.get(url);
      console.log(`API response from ${url}:`, data);
      const result = Array.isArray(data)
        ? data.filter((item) => item.durumu === 1)
        : data.durumu === 1
          ? [data]
          : [];
      setData(result);
      return result;
    } catch (err) {
      console.error(
        `Error fetching ${url}:`,
        err.response?.data || err.message,
      );
      addToast(err.response?.data?.message || "Veriler yüklenemedi.", "error");
      return [];
    }
  };

  const mapApiProductToLocal = async (apiProduct) => {
    let categoryName = "Bilinmeyen Kategori";
    let brandName = "Bilinmeyen Marka";
    let shelfName = "Raf Yok";

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
      name: apiProduct.adi,
      salePrice: apiProduct.satisFiyat,
      stockQuantity: apiProduct.kritikStok || 0,
      unit: apiProduct.birimAdi === 0 ? "Adet" : apiProduct.birimAdi,
      type: apiProduct.urunTipi ? "Stoklu" : "Stoksuz",
      category: categoryName,
      brand: brandName,
      categoryId: apiProduct.urunKategoriId || 0,
      brandId: apiProduct.urunMarkaId || 0,
      shelfId: apiProduct.urunRafId || 0,
      depoId:apiProduct.depoId || 0,
      productCode: apiProduct.urunKodu,
      gtip: apiProduct.gtipKodu,
      countryCode: apiProduct.ulkeId?.toString() || "",
      stockAmount: apiProduct.stokMiktari,
      invoiceTitle: apiProduct.faturaBasligi,
      description: apiProduct.aciklama,
      barcode: apiProduct.barkod,
      shelfLocation: shelfName,
      trackStock: apiProduct.stokTakip === "Evet",
      criticalStock: apiProduct.kritikStok,
      tags: apiProduct.etiketler
        ? apiProduct.etiketler.split(",").map((tag) => tag.trim())
        : [],
      purchasePrice: apiProduct.alisFiyat,
      saleVatRate: apiProduct.satisKDV,
      saleVatIncluded: apiProduct.satisKdvDahilmi,
      purchaseVatRate: apiProduct.alisKDV,
      purchaseVatIncluded: apiProduct.alisKdvDahilmi,
      purchaseDiscount: apiProduct.alisIskontosu,
      otvRate: apiProduct.oivOrani,
      otvType: apiProduct.otvTipi,
      images: apiProduct.fotograf ? [apiProduct.fotograf] : [],
      saleCurrency: apiProduct.paraBirimi || "TRY",
    };
  };

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData( `${API_BASE_URL}/urunKategori/get-all`, setCategories);
      await fetchData(`${API_BASE_URL}/urunMarka/get-all`, setBrands);
      await fetchData(`${API_BASE_URL}/urunRaf/get-all`, setShelves);
      console.log("Fetching product with ID:", id);
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-by-id/${id}`);
      if (data.durumu !== 1) {
        throw new Error("Ürün bulunamadı veya aktif değil.");
      }
      setProduct(await mapApiProductToLocal(data));

      setError(null);
    } catch (err) {
      console.error("Ürün yükleme hatası:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Ürün yüklenemedi.");
      addToast("Ürün yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleDelete = () => {
    setShowDeleteToast(true);
  };

  const confirmDelete = async () => {
    setLoading(true);
    setShowDeleteToast(false);
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (user.id === 0) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }
      await api.delete(`${API_BASE_URL}/urun/urun-delete/${id}?kullaniciId=${user.id}`);
      addToast("Ürün silindi.", "success");
      navigate("/app/products");
    } catch (err) {
      console.error("Ürün silme hatası:", err.response?.data || err.message);
      addToast(err.response?.data?.message || "Ürün silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteToast(false);
  };

  useEffect(() => {
    console.log(
      "useEffect triggered with id:",
      id,
      "product:",
      product,
      "showUpdateModal:",
      showUpdateModal,
    );
    if (id && !product) {
      fetchProduct();
    }
  }, [id, product, fetchProduct]);

  const handleUpdate = () => {
    console.log("handleUpdate called, setting showUpdateModal to true");
    setShowUpdateModal(true);
  };

  const handleStockEntry = (type) => {
    console.log("handleStockEntry called with type:", type);
    if (type === "Manuel Giriş-Çıkış") {
      setShowStockModal(true);
    } else if (type === "Stok Sayımı") {
      navigate(`/app/products/${id}/stock-count`, { state: { product } });
    } else {
      addToast(`${type} işlemi başlatıldı.`, "success");
    }
  };

  const handleStockStatement = () => {
    console.log("handleStockStatement called");
    addToast("Stok ekstresi oluşturuldu.", "success");
  };

  const handleOtherAction = (action) => {
    console.log("handleOtherAction called with action:", action);
    if (action === "Ürün Silme") {
      handleDelete();
    } else {
      addToast(`${action} işlemi başlatıldı.`, "success");
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error || !product) {
    return (
      <CCard>
        <CCardHeader>Ürün Bilgisi</CCardHeader>
        <CCardBody>
          <p>{error || "Ürün bulunamadı."}</p>
          <CButton color="primary" onClick={() => navigate("/app/products")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }
  const stockValue = product.stockQuantity * product.salePrice;
  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
        {showDeleteToast && (
          <CModal visible={true} autohide={false}>
            <CModalHeader
              style={{ backgroundColor: "#DC3545", color: "white" }}
            >
              <strong className="me-auto">Ürün Silme Onayı</strong>
            </CModalHeader>
            <CModalBody>
              <p>Ürünü silmek istediğinize emin misiniz?</p>
              <div className="d-flex gap-2">
                <CButton
                  color="danger"
                  style={{ color: "white" }}
                  onClick={confirmDelete}
                >
                  Evet
                </CButton>
                <CButton color="secondary" onClick={cancelDelete}>
                  Hayır
                </CButton>
              </div>
            </CModalBody>
          </CModal>
        )}
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
              {product.name}
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={6}>
                  <h5>
                    <strong>Barkod:</strong> {product.barcode}
                  </h5>
                  <div className="mt-3">
                    {console.log(product.images[0])}
                    {product.images &&
                    product.images.length > 0 &&
                    product.images[0] &&
                    product.images[0].trim() !== "" ? (
                      <>
                        <img
                          src={`https://localhost:44375/${product.images[0]}`}
                          alt={product.name}
                          style={{
                            maxWidth: "200px",
                            maxHeight: "200px",
                            objectFit: "contain",
                          }}
                          onLoad={() => {
                            console.log(
                              "Resim başarıyla yüklendi:",
                              product.images[0],
                            );
                          }}
                        />
                      </>
                    ) : (
                      <div
                        style={{
                          width: "200px",
                          height: "200px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: "#f8f9fa",
                          border: "2px dashed #dee2e6",
                          borderRadius: "8px",
                          color: "#6c757d",
                          fontSize: "14px",
                          textAlign: "center",
                        }}
                      >
                        <div>
                          <strong>Ürün Görseli Yok</strong>
                          <br />
                          <small>Görsel ekleyin</small>
                        </div>
                      </div>
                    )}
                  </div>
                </CCol>
                <CCol xs={6}>
                  <p>
                    <strong>Ürün Kodu:</strong> {product.productCode}
                  </p>
                  <p>
                    <strong>Kategori:</strong> {product.category}
                  </p>
                  <p>
                    <strong>Marka:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>KDV Oranı:</strong> %{product.saleVatRate}
                  </p>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} className="my-3">
          <CRow>
            <CCol>
              <CCard>
                <CCardHeader className="bg-danger" style={{ color: "white" }}>
                  Alış Fiyatı
                </CCardHeader>
                <CCardBody>
                  <p className="fw-bold">
                    {product.saleCurrency || "TRY"}{" "}
                    {product.purchasePrice.toLocaleString("tr-TR")}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol>
              <CCard>
                <CCardHeader className="bg-success" style={{ color: "white" }}>
                  Satış Fiyatı
                </CCardHeader>
                <CCardBody>
                  <p className="fw-bold">
                    {product.saleCurrency || "TRY"}{" "}
                    {product.salePrice.toLocaleString("tr-TR")}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol>
              <CCard>
                <CCardHeader className="bg-warning" style={{ color: "white" }}>
                  Toplam Stok
                </CCardHeader>
                <CCardBody>
                  <p className="fw-bold">{product.stockQuantity} Adet</p>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol>
              <CCard>
                <CCardHeader className="bg-info" style={{ color: "white" }}>
                  Stok Değeri
                </CCardHeader>
                <CCardBody>
                  <p className="fw-bold">
                    {product.saleCurrency || "TRY"}{" "}
                    {(stockValue * product.stockQuantity).toLocaleString(
                      "tr-TR",
                    )}
                  </p>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
        <CCol xs={12} className="mb-3">
          <div className="d-flex gap-2">
            <CButton
              style={{ color: "white" }}
              color="warning"
              onClick={handleUpdate}
            >
              <CIcon icon={cilPencil} style={{ color: "white" }} /> Güncelle
            </CButton>
            <CDropdown>
              <CDropdownToggle color="primary">
                <CIcon icon={cilList} /> Stoklara Giriş Yap
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleStockEntry("Tedarikçi Girişi")}
                >
                  Tedarikçiden Ürün Girişi Yap
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleStockEntry("Manuel Giriş-Çıkış")}
                >
                  Manuel Giriş-Çıkış İşlemleri
                </CDropdownItem>
                <CDropdownItem onClick={() => handleStockEntry("Stok Sayımı")}>
                  Stok Sayımı Yap
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CButton
              style={{ color: "white" }}
              color="info"
              onClick={handleStockStatement}
              disabled={true}
            >
              <CIcon icon={cilList} style={{ color: "white" }} /> Stok Ekstresi
            </CButton>
            <CDropdown>
              <CDropdownToggle color="secondary">
                <CIcon icon={cilList} /> Diğer İşlemler
              </CDropdownToggle>
              <CDropdownMenu>
                {/* <CDropdownItem
                  disabled={true}
                  onClick={() => handleOtherAction("Döküman Yükle")}
                >
                  Döküman Yükle
                </CDropdownItem>
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleOtherAction("Etiket Yazdır")}
                >
                  Etiket Yazdır
                </CDropdownItem>
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleOtherAction("Müşteri Kodları")}
                >
                  Müşteri Kodları
                </CDropdownItem> */}
                <CDropdownItem onClick={() => handleOtherAction("Ürün Silme")}>
                  Ürünü Sil
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CCol>
        <CCol xs={12}>
          <CRow>
            <CCol className="mt-3">
              <CCard>
                <CCardHeader
                  style={{ backgroundColor: "#2965A8", color: "white" }}
                >
                  Önceki Satışlar
                </CCardHeader>
                <CCardBody>
                  <CTable responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>Açıklama</CTableHeaderCell>
                        <CTableHeaderCell>Miktar</CTableHeaderCell>
                        <CTableHeaderCell>Fiyat</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {stockMovements
                        .filter((m) => m.description === "Satış")
                        .map((movement) => (
                          <CTableRow key={movement.id}>
                            <CTableDataCell>{movement.date}</CTableDataCell>
                            <CTableDataCell>
                              {movement.description}
                            </CTableDataCell>
                            <CTableDataCell>{movement.quantity}</CTableDataCell>
                            <CTableDataCell>
                              {movement.price.toLocaleString("tr-TR")}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol className="mt-3">
              <CCard>
                <CCardHeader
                  style={{ backgroundColor: "#2965A8", color: "white" }}
                >
                  Önceki Alışlar
                </CCardHeader>
                <CCardBody>
                  <CTable responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>Açıklama</CTableHeaderCell>
                        <CTableHeaderCell>Miktar</CTableHeaderCell>
                        <CTableHeaderCell>Fiyat</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {stockMovements
                        .filter((m) => m.description === "Tedarikçi Girişi")
                        .map((movement) => (
                          <CTableRow key={movement.id}>
                            <CTableDataCell>{movement.date}</CTableDataCell>
                            <CTableDataCell>
                              {movement.description}
                            </CTableDataCell>
                            <CTableDataCell>{movement.quantity}</CTableDataCell>
                            <CTableDataCell>
                              {movement.price.toLocaleString("tr-TR")}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CCol>
            <CCol className="mt-3">
              <CCard>
                <CCardHeader
                  style={{ backgroundColor: "#2965A8", color: "white" }}
                >
                  Manuel Stok Hareketleri
                </CCardHeader>
                <CCardBody>
                  <CTable responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>Açıklama</CTableHeaderCell>
                        <CTableHeaderCell>Miktar</CTableHeaderCell>
                        <CTableHeaderCell>Fiyat</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {stockMovements
                        .filter(
                          (m) =>
                            m.description !== "Satış" &&
                            m.description !== "Tedarikçi Girişi",
                        )
                        .map((movement) => (
                          <CTableRow key={movement.id}>
                            <CTableDataCell>{movement.date}</CTableDataCell>
                            <CTableDataCell>
                              {movement.description}
                            </CTableDataCell>
                            <CTableDataCell>{movement.quantity}</CTableDataCell>
                            <CTableDataCell>
                              {movement.price.toLocaleString("tr-TR")}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
      </CRow>
      {showUpdateModal !== undefined && (
        <ProductModal
          visible={showUpdateModal}
          onClose={() => {
            console.log("Closing ProductModal");
            setShowUpdateModal(false);
          }}
          onSubmit={(data) => {
            console.log("ProductModal submitted with data:", data);
            setProduct({ ...product, ...data });
            addToast("Ürün güncellendi.", "success");
            setShowUpdateModal(false);
          }}
          product={product}
          addToast={addToast}
        />
      )}
      {showStockModal !== undefined && (
        <StockMovementModal
          visible={showStockModal}
          onClose={() => {
            console.log("Closing StockMovementModal");
            setShowStockModal(false);
          }}
          onSubmit={(newMovement) => {
            console.log("StockMovementModal submitted with data:", newMovement);
            setStockMovements((prev) => [...prev, newMovement]);
            addToast("Stok hareketi kaydedildi.", "success");
            setShowStockModal(false);
          }}
          product={product}
          addToast={addToast}
        />
      )}
    </>
  );
};

export default ProductDetail;