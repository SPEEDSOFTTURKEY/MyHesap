import { useState, useEffect, useRef } from "react";
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
  CFormInput,
  CAlert,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import api from "../../api/api";

const API_BASE_URL = "https://localhost:44375/api";

const StockCount = () => {
  const { id: urunId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [product, setProduct] = useState(state?.product || null);
  const [stoklar, setStoklar] = useState([]);
  const [sayilanMiktarlar, setSayilanMiktarlar] = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const unitCost = 985.7; // API'den alınmalı

  const addToast = (message, type = "success") => {
    const id = Date.now();
    const toast = (
      <CToast
        key={id}
        autohide={true}
        visible={true}
        delay={5000}
        className={
          type === "error" ? "bg-danger text-white" : "bg-success text-white"
        }
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (!product) {
        console.log("Fetching product with ID:", urunId);
        const productResponse = await api.get(
          `${API_BASE_URL}/urun/urun-get-by-id/${urunId}`,
        );
        console.log("API Response from /urun/urun-get-by-id:", productResponse);
        console.log("Raw product data from API (urun-get-by-id):", productResponse.data);
        
        if (productResponse.data.durumu !== 1) {
          throw new Error("Ürün bulunamadı veya aktif değil.");
        }
        const mappedProduct = mapApiProductToLocal(productResponse.data);
        setProduct(mappedProduct);
      }

      console.log("Fetching stock data for urunId:", urunId);
      const stockResponse = await api.get(
        `${API_BASE_URL}/urun/urun-depolardaki-stoklar/${urunId}`,
      );
      console.log("API Response from /urun/urun-depolardaki-stoklar:", stockResponse);
      console.log("Raw stock data from API (urun-depolardaki-stoklar):", stockResponse.data);
      
      if (!Array.isArray(stockResponse.data)) {
        throw new Error("Stok verisi dizi formatında değil.");
      }
      const activeStocks = stockResponse.data.filter((stock) => stock.durumu === 1);
      console.log("Table stock data:", activeStocks);
      setStoklar(activeStocks);

      const initialSayilanMiktarlar = activeStocks.reduce((acc, stock) => {
        acc[stock.depoId] = stock.miktar || 0;
        return acc;
      }, {});
      setSayilanMiktarlar(initialSayilanMiktarlar);
      console.log("Initial stock data:", activeStocks);
    } catch (err) {
      console.error("Veri yükleme hatası:", err.response?.data || err.message);
      console.error("Error details:", err);
      const errorMessage =
        err.response?.status === 404
          ? "Stok verileri için endpoint bulunamadı."
          : err.response?.data?.message || "Veriler yüklenemedi.";
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const mapApiProductToLocal = (apiProduct) => {
    console.log("Mapping API product:", apiProduct);
    return {
      id: apiProduct.id,
      name: apiProduct.adi,
      salePrice: apiProduct.satisFiyat,
      stockQuantity: apiProduct.kritikStok || 0,
      unit: apiProduct.birimAdi === 0 ? "Adet" : apiProduct.birimAdi,
      type: apiProduct.urunTipi ? "Stoklu" : "Stoksuz",
      category: apiProduct.urunKategori?.adi || "Bilinmeyen Kategori",
      brand: apiProduct.urunMarka?.adi || "Bilinmeyen Marka",
      productCode: apiProduct.urunKodu,
      gtip: apiProduct.gtipKodu,
      countryCode: apiProduct.ulkeId?.toString() || "",
      stockAmount: apiProduct.stokMiktari,
      invoiceTitle: apiProduct.faturaBasligi,
      description: apiProduct.aciklama,
      barcode: apiProduct.barkod,
      shelfLocation: apiProduct.urunRaf?.adi || "Bilinmeyen Raf",
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
    };
  };

  const handleMiktarChange = (depoId, value) => {
    const miktar = parseInt(value, 10) || 0;
    setSayilanMiktarlar((prev) => ({
      ...prev,
      [depoId]: miktar >= 0 ? miktar : 0,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      const payload = {
        urunId: parseInt(urunId),
        kullaniciId: user.id,
        depoMiktarlari: Object.entries(sayilanMiktarlar).map(
          ([depoId, miktar]) => ({
            depoId: parseInt(depoId),
            miktar,
          }),
        ),
      };
      console.log("Saving stock data:", payload);
      
      const response = await api.post(
        `${API_BASE_URL}/urun/urun-toplu-depostok-guncelle`,
        payload,
      );
      console.log("API Response from /urun/urun-toplu-depostok-guncelle:", response);
      console.log("Response data from API (urun-toplu-depostok-guncelle):", response.data);
      
      addToast("Stoklar güncellendi.", "success");
      navigate(`/app/products/${urunId}`, { state: { product } });
    } catch (err) {
      console.error(
        "Stok güncelleme hatası:",
        err.response?.data || err.message,
      );
      console.error("Error details:", err);
      addToast(
        err.response?.data?.message || "Stoklar güncellenemedi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/app/products/${urunId}`, { state: { product } });
  };

  const handleUpdateUnitCost = () => {
    addToast("Birim maliyet güncelleme işlemi başlatıldı.", "success");
  };

  useEffect(() => {
    console.log(
      "useEffect triggered with urunId:",
      urunId,
      "product:",
      product,
      "state:",
      state,
    );
    if (!urunId) {
      addToast("Ürün ID'si bulunamadı.", "error");
      navigate("/app/products");
      return;
    }
    fetchData();
  }, [urunId, product, navigate, state]);

  if (loading || !product) {
    return (
      <CCard>
        <CCardHeader>Stok Sayımı</CCardHeader>
        <CCardBody>
          {loading ? <p>Yükleniyor...</p> : <p>Ürün bulunamadı.</p>}
          <CButton color="primary" onClick={() => navigate("/app/products")}>
            Geri Dön
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
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
          <div className="d-flex gap-2">
            <CButton
              color="success"
              style={{ color: "white" }}
              onClick={handleSave}
            >
              Kaydet
            </CButton>
            <CButton
              color="secondary"
              style={{ color: "white" }}
              onClick={handleBack}
            >
              Geri Dön
            </CButton>
          </div>
        </CCol>
        <CCol xs={12} className="mb-3">
          <CAlert color="warning">
            Sistemde kayıtlı depolarınız ve seçtiğiniz ürünün bu depolardaki
            güncel stok bilgisi aşağıdadır. Listedeki stok miktarını
            değiştirerek kaydettiğiniz anda stoklarınız güncellenecektir.
            <strong>
              Dikkat! Ürün güncel stok birim maliyeti{" "}
              {unitCost.toLocaleString("tr-TR")} TL olarak kayıtlı. Sayım
              işlemini kaydederken birim stok maliyetini de güncellemek
              istiyorsanız{" "}
              <a
                href="#"
                onClick={handleUpdateUnitCost}
                style={{ color: "blue", textDecoration: "underline" }}
              >
                tıklayın
              </a>
              .
            </strong>
          </CAlert>
        </CCol>
        <CCol xs={12}>
          <CCard>
            <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
              Depolardaki Stoklar
            </CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Bulunduğu Depo</CTableHeaderCell>
                    <CTableHeaderCell>Sistemdeki Miktar</CTableHeaderCell>
                    <CTableHeaderCell>Sayılan Miktar</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {stoklar.map((stock) => (
                    <CTableRow key={stock.depoId}>
                      <CTableDataCell>{stock.depo?.adi || "Bilinmeyen Depo"}</CTableDataCell>
                      <CTableDataCell>{stock.miktar}</CTableDataCell>
                      <CTableDataCell>
                        <CFormInput
                          type="number"
                          value={sayilanMiktarlar[stock.depoId] || 0}
                          onChange={(e) =>
                            handleMiktarChange(stock.depoId, e.target.value)
                          }
                          min="0"
                          style={{ width: "100px" }}
                        />
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default StockCount;