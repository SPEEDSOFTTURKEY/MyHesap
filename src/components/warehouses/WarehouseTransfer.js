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
  CFormSelect,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from "@coreui/react";
import api from "../../api/api";

// API Base URL
const API_BASE_URL = "https://localhost:44375/api";

const WarehouseTransfer = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [sourceWarehouseId, setSourceWarehouseId] = useState("");
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const navigate = useNavigate();

  // Toast mesajı ekleme
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

  // Depoları çek
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`${API_BASE_URL}/depo/get-all`);
      const result = Array.isArray(data)
        ? data.filter((item) => item.durumu === 1)
        : data.durumu === 1
          ? [data]
          : [];
      setWarehouses(result);
    } catch (err) {
      addToast(err.response?.data?.message || "Depolar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Kaynak depodaki ürünleri çek
  const fetchProducts = async (depoId) => {
    try {
      setLoading(true);
      const { data: stockData } = await api.get(
        `${API_BASE_URL}/depo/depolardaki-urunstoklar/${depoId}`,
      );
      if (!Array.isArray(stockData)) {
        throw new Error("Stok verisi dizi formatında değil.");
      }
      const activeStocks = stockData.filter((item) => item.durumu === 1);
      const productPromises = activeStocks.map(async (stock) => {
        try {
          const { data: productData } = await api.get(
            `${API_BASE_URL}/urun/urun-get-by-id/${stock.urunId}`,
          );
          return {
            id: stock.id,
            code: productData.urunKodu || "Yok",
            barcode: productData.barkod || "Yok",
            brand: productData.marka?.adi || "Yok",
            name: productData.adi || "Yok",
            quantity: stock.miktar || 0,
            urunId: stock.urunId,
            depoId: stock.depoId,
          };
        } catch (err) {
          console.error(
            `Ürün ID ${stock.urunId} için hata:`,
            err.response?.data || err.message,
          );
          return null;
        }
      });
      const productsData = await Promise.all(productPromises);
      const validProducts = productsData.filter((product) => product !== null);
      setProducts(validProducts);
    } catch (err) {
      addToast(err.response?.data?.message || "Ürünler yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Tüm ürünleri transfer et
  const handleTransferAll = async () => {
    if (!sourceWarehouseId || !targetWarehouseId) {
      addToast("Lütfen kaynak ve hedef depo seçin.", "error");
      return;
    }
    if (sourceWarehouseId === targetWarehouseId) {
      addToast("Kaynak ve hedef depo aynı olamaz.", "error");
      return;
    }
    try {
      setLoading(true);
      await api.post(
        `${API_BASE_URL}/depo/depo-tumurunleri-aktar/${sourceWarehouseId}/${targetWarehouseId}`,
      );
      addToast("Tüm ürünler başarıyla transfer edildi.", "success");
      setProducts([]);
      setSelectedProducts([]);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Transfer işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Seçili ürünleri transfer et
  const handleTransferSelected = async () => {
    if (!targetWarehouseId) {
      addToast("Lütfen hedef depo seçin.", "error");
      return;
    }
    if (selectedProducts.length === 0) {
      addToast("Lütfen transfer edilecek ürünleri seçin.", "error");
      return;
    }
    try {
      setLoading(true);
      const payload = { urunIds: selectedProducts, depoId: targetWarehouseId };
      await api.post(
        `${API_BASE_URL}/depo/secili-urun-aktar/${targetWarehouseId}`,
        payload,
      );
      addToast("Seçili ürünler başarıyla transfer edildi.", "success");
      setProducts((prev) =>
        prev.filter((product) => !selectedProducts.includes(product.urunId)),
      );
      setSelectedProducts([]);
    } catch (err) {
      addToast(
        err.response?.data?.message || "Transfer işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  // Ürün seçimi
  const handleSelectProduct = (urunId) => {
    setSelectedProducts((prev) =>
      prev.includes(urunId)
        ? prev.filter((id) => id !== urunId)
        : [...prev, urunId],
    );
  };

  // Depoları yükle
  useEffect(() => {
    fetchWarehouses();
  }, []);

  // Kaynak depo değiştiğinde ürünleri çek
  useEffect(() => {
    if (sourceWarehouseId) {
      fetchProducts(sourceWarehouseId);
    } else {
      setProducts([]);
      setSelectedProducts([]);
    }
  }, [sourceWarehouseId]);

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
              Depolar Arası Transfer
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormSelect
                    label="Kaynak Depo"
                    value={sourceWarehouseId}
                    onChange={(e) => setSourceWarehouseId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Depo Seçin</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.adi}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    label="Hedef Depo"
                    value={targetWarehouseId}
                    onChange={(e) => setTargetWarehouseId(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Depo Seçin</option>
                    {warehouses
                      .filter((w) => w.id !== parseInt(sourceWarehouseId))
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.adi}
                        </option>
                      ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mb-3">
                <CCol>
                  <CButton
                    color="success"
                    style={{ color: "white" }}
                    onClick={handleTransferAll}
                    disabled={
                      loading || !sourceWarehouseId || !targetWarehouseId
                    }
                  >
                    Tüm Ürünleri Transfer Et
                  </CButton>
                  <CButton
                    color="info"
                    style={{ color: "white" }}
                    onClick={handleTransferSelected}
                    disabled={loading || selectedProducts.length === 0}
                    className="ms-2"
                  >
                    Seçili Ürünleri Transfer Et
                  </CButton>
                </CCol>
              </CRow>
              {sourceWarehouseId && (
                <CCard>
                  <CCardHeader
                    style={{ backgroundColor: "#2965A8", color: "white" }}
                  >
                    Kaynak Depodaki Ürünler
                  </CCardHeader>
                  <CCardBody>
                    <CTable responsive hover>
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Seç</CTableHeaderCell>
                          <CTableHeaderCell>Kod</CTableHeaderCell>
                          <CTableHeaderCell>Barkod</CTableHeaderCell>
                          <CTableHeaderCell>Marka</CTableHeaderCell>
                          <CTableHeaderCell>Ürün</CTableHeaderCell>
                          <CTableHeaderCell>Miktar</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {products.map((product) => (
                          <CTableRow key={product.id}>
                            <CTableDataCell>
                              <input
                                type="checkbox"
                                checked={selectedProducts.includes(
                                  product.urunId,
                                )}
                                onChange={() =>
                                  handleSelectProduct(product.urunId)
                                }
                                disabled={loading}
                              />
                            </CTableDataCell>
                            <CTableDataCell>{product.code}</CTableDataCell>
                            <CTableDataCell>{product.barcode}</CTableDataCell>
                            <CTableDataCell>{product.brand}</CTableDataCell>
                            <CTableDataCell>{product.name}</CTableDataCell>
                            <CTableDataCell>{product.quantity}</CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </CCardBody>
                </CCard>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
};

export default WarehouseTransfer;