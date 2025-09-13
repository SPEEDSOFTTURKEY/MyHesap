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
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
  CAlert,
} from "@coreui/react";
import api from "../../api/api";

// API Base URL
const API_BASE_URL = "https://localhost:44375/api";

const WarehouseStockCount = () => {
  const { id: depoId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(state?.warehouse || null);
  const [products, setProducts] = useState([]);
  const [sayilanMiktarlar, setSayilanMiktarlar] = useState({});
  const [birimMaliyetler, setBirimMaliyetler] = useState({});
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();

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

  const fetchWarehouse = async (depoId) => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      navigate("/app/warehouses");
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching warehouse with ID:", depoId, "for userId:", userId);
      if (!depoId || isNaN(depoId)) {
        throw new Error("Geçersiz depo ID'si.");
      }
      const response = await api.get(
        `${API_BASE_URL}/depo/get-by-id/${depoId}`,
        {
          headers: { "kullaniciId": userId.toString() } // Kullanıcı ID'si eklendi
        }
      );
      console.log("API Response from /depo/get-by-id:", response);
      console.log("Raw warehouse data from API:", response.data);

      if (response.data.durumu !== 1) {
        throw new Error("Depo bulunamadı veya aktif değil.");
      }
      setWarehouse({ id: response.data.id, adi: response.data.adi, kullaniciId: userId });
      fetchProducts(response.data.id, userId);
    } catch (err) {
      console.error("Depo yükleme hatası:", err.response?.data || err.message);
      console.error("Error details:", err);
      addToast(err.response?.data?.message || "Depo yüklenemedi.", "error");
      navigate("/app/warehouses");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (depoId, userId) => {
    try {
      setLoading(true);
      console.log("Fetching products for depoId:", depoId, "userId:", userId);
      const response = await api.get(
        `${API_BASE_URL}/depo/depolardaki-urunstoklar/${depoId}`,
        {
          headers: { "kullaniciId": userId.toString() } // Kullanıcı ID'si eklendi
        }
      );
      console.log("API Response from /depo/depolardaki-urunstoklar:", response);
      console.log("Raw stock data from API:", response.data);

      if (!Array.isArray(response.data)) {
        throw new Error("Stok verisi dizi formatında değil.");
      }

      const activeStocks = response.data; // Tüm ürünleri al (durumu filtresi kaldırıldı)

      const validProducts = activeStocks
        .filter((stock) => stock.urun) // Urun nesnesinin varlığını kontrol et
        .map((stock) => ({
          id: stock.id,
          code: stock.urun?.urunKodu || "Bilinmiyor",
          barcode: stock.urun?.barkod || "Bilinmiyor",
          name: stock.urun?.adi || "Bilinmiyor",
          quantity: stock.miktar || 0,
          unitCost: stock.fiyat || 0,
          urunId: stock.urunId,
          depoId: stock.depoId,
          kullaniciId: userId, // Kullanıcı ID'si eklendi
        }));

      setProducts(validProducts);

      const initialSayilanMiktarlar = validProducts.reduce((acc, product) => {
        acc[product.urunId] = product.quantity;
        return acc;
      }, {});
      setSayilanMiktarlar(initialSayilanMiktarlar);

      const initialBirimMaliyetler = validProducts.reduce((acc, product) => {
        acc[product.urunId] = product.unitCost;
        return acc;
      }, {});
      setBirimMaliyetler(initialBirimMaliyetler);

      console.log("Fetched products:", validProducts);
    } catch (err) {
      console.error("Ürün yükleme hatası:", err.response?.data || err.message);
      console.error("Error details:", err);
      const errorMessage =
        err.response?.status === 404
          ? "Stok verileri için endpoint bulunamadı."
          : err.response?.data?.message || "Ürünler yüklenemedi.";
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMiktarChange = (urunId, value) => {
    const miktar = parseInt(value, 10) || 0;
    setSayilanMiktarlar((prev) => ({
      ...prev,
      [urunId]: miktar >= 0 ? miktar : 0,
    }));
  };

  const handleBirimMaliyetChange = (urunId, value) => {
    const maliyet = parseFloat(value) || 0;
    setBirimMaliyetler((prev) => ({
      ...prev,
      [urunId]: maliyet >= 0 ? maliyet : 0,
    }));
  };

  const handleSave = async () => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      setLoading(true);
      const payloads = products.map((product) => ({
        urunId: product.urunId,
        depoMiktarlari: [
          {
            depoId: parseInt(depoId),
            miktar: sayilanMiktarlar[product.urunId] || 0,
          },
        ],
        birimMaliyet: birimMaliyetler[product.urunId] || product.unitCost,
        kullaniciId: userId, // Kullanıcı ID'si eklendi
      }));

      console.log("Saving stock data:", payloads);

      const responses = await Promise.all(
        payloads.map((payload) =>
          api.post(
            `${API_BASE_URL}/urun/urun-toplu-depostok-guncelle`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
                accept: "*/*",
                "kullaniciId": userId.toString(), // Kullanıcı ID'si header'a eklendi
              },
            }
          ),
        ),
      );

      console.log("All save responses from API:", responses);
      responses.forEach((response, index) => {
        console.log(`Save response ${index + 1} from API:`, response);
        console.log(`Response data ${index + 1}:`, response.data);
      });

      addToast("Stoklar güncellendi.", "success");
      navigate(`/app/warehouses/${depoId}`, { state: { warehouse } });
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
    navigate(`/app/warehouses/${depoId}`, { state: { warehouse } });
  };

  const handleUpdateUnitCost = () => {
    addToast("Birim maliyet güncelleme işlemi başlatıldı.", "success");
  };

  useEffect(() => {
    const userId = getUserId();
    console.log(
      "useEffect triggered with depoId:",
      depoId,
      "warehouse:",
      warehouse,
      "userId:",
      userId
    );
    if (!depoId) {
      addToast("Depo ID'si bulunamadı.", "error");
      navigate("/app/warehouses");
      return;
    }
    if (!warehouse || warehouse.id !== parseInt(depoId)) {
      fetchWarehouse(depoId);
    } else {
      fetchProducts(warehouse.id, userId);
    }
  }, [depoId, warehouse, navigate]);

  if (loading || !warehouse) {
    return (
      <CCard>
        <CCardHeader>Ana Depo Sayılan Ürünler</CCardHeader>
        <CCardBody>
          {loading ? <p>Yükleniyor...</p> : <p>Depo bulunamadı.</p>}
          <CButton color="primary" onClick={() => navigate("/app/warehouses")}>
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
              Ana Depo Sayılan Ürünler
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={6}>
                  <h5>
                    <strong>Depo Adı:</strong> {warehouse.adi}
                  </h5>
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
              disabled={loading}
            >
              Kaydet
            </CButton>
            <CButton
              color="secondary"
              style={{ color: "white" }}
              onClick={handleBack}
              disabled={loading}
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
              {products.length > 0
                ? products[0].unitCost.toLocaleString("tr-TR")
                : "0"}{" "}
              TL olarak kayıtlı. Sayım işlemini kaydederken birim stok
              maliyetini de güncellemek istiyorsanız{" "}
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
              Ana Depo Sayılan Ürünler
            </CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Kod</CTableHeaderCell>
                    <CTableHeaderCell>Ürün</CTableHeaderCell>
                    <CTableHeaderCell>Barkod</CTableHeaderCell>
                    <CTableHeaderCell>Sistemdeki Miktar</CTableHeaderCell>
                    <CTableHeaderCell>Sayılan Miktar</CTableHeaderCell>
                    <CTableHeaderCell>Birim Maliyet</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {products.map((product) => (
                    <CTableRow key={product.id}>
                      <CTableDataCell>{product.code}</CTableDataCell>
                      <CTableDataCell>{product.name}</CTableDataCell>
                      <CTableDataCell>{product.barcode}</CTableDataCell>
                      <CTableDataCell>{product.quantity}</CTableDataCell>
                      <CTableDataCell>
                        <CFormInput
                          type="number"
                          value={sayilanMiktarlar[product.urunId] || 0}
                          onChange={(e) =>
                            handleMiktarChange(product.urunId, e.target.value)
                          }
                          min="0"
                          style={{ width: "100px" }}
                          disabled={loading}
                        />
                      </CTableDataCell>
                      <CTableDataCell>
                        <CFormInput
                          type="number"
                          step="0.01"
                          value={
                            birimMaliyetler[product.urunId] || product.unitCost
                          }
                          onChange={(e) =>
                            handleBirimMaliyetChange(
                              product.urunId,
                              e.target.value,
                            )
                          }
                          min="0"
                          style={{ width: "100px" }}
                          disabled={loading}
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

export default WarehouseStockCount;