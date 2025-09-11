
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  CFormInput,
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
  CFormSelect,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPencil } from "@coreui/icons";
import WarehouseModal from "../../../components/warehouses/WarehouseModal";
import api from "../../../api/api";

const API_BASE_URL = "https://localhost:44375/api";

const WarehouseDetail = () => {
  const { id: paramId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [warehouse, setWarehouse] = useState(state?.warehouse || null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAllTransferModal, setShowAllTransferModal] = useState(false);
  const [showSingleTransferModal, setShowSingleTransferModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const toaster = useRef();

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
    setToasts((prev) => [...(Array.isArray(prev) ? prev : []), toast]);
    return id;
  };

  const fetchWarehouse = async (depoId) => {
    try {
      setLoading(true);
      console.log("Fetching warehouse with ID:", depoId);
      if (!depoId || isNaN(depoId)) {
        throw new Error("Geçersiz depo ID'si.");
      }
      const { data } = await api.get(
        `${API_BASE_URL}/depo/get-by-id/${depoId}`,
      );
      console.log("Warehouse API response (depo/get-by-id):", data);
      if (!data || data.durumu !== 1) {
        throw new Error("Depo bulunamadı veya aktif değil.");
      }
      setWarehouse({ id: data.id, adi: data.adi || "Bilinmeyen Depo" });
      await fetchProducts(data.id);
    } catch (err) {
      console.error("Depo yükleme hatası:", err.response?.data || err.message);
      addToast(err.response?.data?.message || "Depo yüklenemedi.", "error");
      navigate("/app/warehouses");
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/depo/get-all`);
      console.log("Warehouses API response (depo/get-all):", data);
      const result = Array.isArray(data)
        ? data.filter(
            (item) =>
              item.durumu === 1 &&
              item.id !== parseInt(warehouse?.id || paramId),
          )
        : data?.durumu === 1 && data.id !== parseInt(warehouse?.id || paramId)
        ? [data]
        : [];
      setWarehouses(result);
    } catch (err) {
      console.error(
        "Depolar yükleme hatası:",
        err.response?.data || err.message,
      );
      addToast(err.response?.data?.message || "Depolar yüklenemedi.", "error");
    }
  };

  const fetchProducts = async (depoId) => {
    try {
      setLoading(true);
      console.log("Fetching products for depoId:", depoId);
      const { data: stockData } = await api.get(
        `${API_BASE_URL}/depo/depolardaki-urunstoklar/${depoId}`,
      );
      console.log("Stock API response (depo/depolardaki-urunstoklar):", stockData);

      if (!Array.isArray(stockData)) {
        throw new Error("Stok verisi dizi formatında değil.");
      }

      const activeStocks = stockData.filter((item) => item.durumu === 1);
      console.log("Active stocks:", activeStocks);

      const productsData = activeStocks.map((stock) => {
        try {
          const productData = stock.urun;
          console.log(`Product data for urunId ${stock.urunId}:`, productData);
          const alisFiyat = productData?.alisFiyat || 0;
          const satisFiyat = productData?.satisFiyat || 0;
          const miktar = stock.miktar ?? 0;
          return {
            id: stock.id,
            code: productData?.urunKodu || "Bilinmeyen Kod",
            barcode: productData?.barkod || "Bilinmeyen Barkod",
            brand: productData?.urunMarka?.adi || "Bilinmeyen Marka",
            name: productData?.adi || "Bilinmeyen Ürün",
            quantity: miktar,
            alisFiyat: alisFiyat,
            satisFiyat: satisFiyat,
            urunId: stock.urunId,
            depoId: stock.depoId,
          };
        } catch (err) {
          console.error(`Ürün ID ${stock.urunId} için hata:`, err.message);
          return null;
        }
      });

      const validProducts = productsData.filter((product) => product !== null);
      console.log("Fetched products:", validProducts);
      setProducts(validProducts);
    } catch (err) {
      console.error("Ürün yükleme hatası:", err.response?.data || err.message);
      const errorMessage =
        err.response?.status === 404
          ? "Stok verileri için endpoint bulunamadı."
          : err.response?.data?.message || "Ürünler yüklenemedi.";
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferAll = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (!user.id) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    if (!targetWarehouseId) {
      addToast("Lütfen hedef depo seçin.", "error");
      return;
    }
    try {
      setLoading(true);
      const response = await api.post(
        `${API_BASE_URL}/depo/depo-tumurunleri-aktar/${warehouse.id}/${targetWarehouseId}?kullaniciId=${user.id}`,
      );
      console.log("Transfer all API response (depo/depo-tumurunleri-aktar):", response.data);
      addToast(response.data.mesaj || "Tüm ürünler başarıyla transfer edildi.", "success");
      setProducts([]);
      setShowAllTransferModal(false);
      setTargetWarehouseId("");
    } catch (err) {
      console.error("Transfer hatası:", err.response?.data || err.message);
      addToast(
        err.response?.data?.mesaj || "Transfer işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSingle = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (!user.id) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    if (!targetWarehouseId) {
      addToast("Lütfen hedef depo seçin.", "error");
      return;
    }
    if (!transferQuantity || transferQuantity <= 0) {
      addToast("Lütfen geçerli bir miktar girin.", "error");
      return;
    }
    if (transferQuantity > selectedProduct?.quantity) {
      addToast("Girilen miktar, mevcut stok miktarını aşıyor.", "error");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        id: selectedProduct.id,
        urunId: selectedProduct.urunId,
        miktar: parseInt(transferQuantity),
        kullaniciId: user.id,
      };
      console.log("Transfer single payload:", payload);
      const response = await api.post(
        `${API_BASE_URL}/depo/secili-urun-aktar/${targetWarehouseId}`,
        payload,
      );
      console.log("Transfer single API response (depo/secili-urun-aktar):", response.data);
      addToast(response.data.mesaj || "Ürün başarıyla transfer edildi.", "success");
      setProducts((prev) =>
        prev
          .map((product) =>
            product.urunId === selectedProduct.urunId
              ? {
                  ...product,
                  quantity: product.quantity - parseInt(transferQuantity),
                }
              : product,
          )
          .filter((product) => product.quantity > 0),
      );
      setShowSingleTransferModal(false);
      setSelectedProduct(null);
      setTargetWarehouseId("");
      setTransferQuantity("");
    } catch (err) {
      console.error("Transfer hatası:", err.response?.data || err.message);
      addToast(
        err.response?.data?.mesaj || "Transfer işlemi başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStockCount = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (!user.id) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    try {
      setLoading(true);
      const payload = products.map((product) => ({
        urunId: product.urunId,
        miktar: product.quantity,
        fiyat: product.alisFiyat,
        kullaniciId: user.id,
      }));
      console.log("Stock count payload:", payload);
      const response = await api.post(
        `${API_BASE_URL}/depo/stok-sayim/${warehouse.id}`,
        payload,
      );
      console.log("Stock count API response (depo/stok-sayim):", response.data);
      addToast(response.data.mesaj || "Stok sayımı başarıyla tamamlandı.", "success");
      navigate(`/app/warehouses/${warehouse.id}/stock-count`, {
        state: { warehouse },
      });
    } catch (err) {
      console.error("Stok sayım hatası:", err.response?.data || err.message);
      addToast(
        err.response?.data?.mesaj || "Stok sayımı başarısız.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (formData) => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (!user.id) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    try {
      setLoading(true);
      const payload = {
        id: warehouse.id,
        adi: formData.adi,
        durumu: 1,
        kullaniciId: user.id,
      };
      console.log("Update payload:", payload);
      const response = await api.put(`${API_BASE_URL}/depo/update`, payload);
      console.log("Update API response (depo/update):", response.data);
      setWarehouse(payload);
      setShowUpdateModal(false);
      addToast(response.data.message || "Depo güncellendi.", "success");
    } catch (err) {
      console.error(
        "Depo güncelleme hatası:",
        err.response?.data || err.message,
      );
      addToast(
        err.response?.data?.message || "Depo güncellenemedi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
    if (!user.id) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    try {
      setLoading(true);
      const response = await api.delete(
        `${API_BASE_URL}/depo/delete/${warehouse.id}?kullaniciId=${user.id}`,
      );
      console.log("Delete API response (depo/delete):", response.data);
      addToast(response.data.message || "Depo başarıyla silindi.", "success");
      setShowDeleteModal(false);
      navigate("/app/warehouses");
    } catch (err) {
      console.error("Silme hatası:", err.response?.data || err.message);
      addToast(
        err.response?.data?.message || "Depo silinemedi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(
      "useEffect triggered with paramId:",
      paramId,
      "warehouse:",
      warehouse,
    );
    const depoId = warehouse?.id || paramId;
    if (!depoId) {
      console.error("Depo ID'si bulunamadı:", { paramId, warehouse });
      addToast("Depo ID'si bulunamadı.", "error");
      navigate("/app/warehouses");
      return;
    }
    if (!warehouse || warehouse.id !== parseInt(depoId)) {
      fetchWarehouse(depoId);
    } else {
      fetchProducts(warehouse.id);
    }
    fetchWarehouses();
  }, [paramId, warehouse, navigate]);

  const filteredProducts = products.filter(
    (product) =>
      (product.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (product.brand || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalAlisDegeri = products.reduce(
    (sum, product) => sum + (product.alisFiyat || 0),
    0,
  );

  const totalSatisDegeri = products.reduce(
    (sum, product) => sum + (product.satisFiyat || 0),
    0,
  );

  if (loading || !warehouse) {
    return (
      <CCard>
        <CCardHeader>Depo Bilgisi</CCardHeader>
        <CCardBody>
          {loading ? <p>Yükleniyor...</p> : <p>Depo bulunamadı.</p>}
          <CButton color="primary" onClick={() => navigate("/app/warehouses")}>
            Geri
          </CButton>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
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
              {warehouse.adi?.toUpperCase() || "DEPO ADI YOK"}
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol md={6}>
                  <CCard>
                    <CCardHeader className="bg-info" style={{ color: "white" }}>
                      Toplam Alış Değeri
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {totalAlisDegeri.toLocaleString("tr-TR")} TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol md={6}>
                  <CCard>
                    <CCardHeader className="bg-success" style={{ color: "white" }}>
                      Toplam Satış Değeri
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {totalSatisDegeri.toLocaleString("tr-TR")} TRY
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
              color="primary"
              style={{ color: "white" }}
              onClick={() => setShowUpdateModal(true)}
            >
              <CIcon icon={cilPencil} /> Güncelle
            </CButton>
            <CButton
              color="success"
              style={{ color: "white" }}
              onClick={handleStockCount}
            >
              Stok Sayımı Yap
            </CButton>
            <CDropdown>
              <CDropdownToggle color="info" style={{ color: "white" }}>
                Depolar Arası Transfer
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setShowAllTransferModal(true)}>
                  Tamamını Başka Depoya Gönder
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CButton
              color="danger"
              style={{ color: "white" }}
              onClick={() => setShowDeleteModal(true)}
            >
              Sil
            </CButton>
          </div>
        </CCol>
        <CCol xs={12}>
          <CCard>
            <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
              Depodaki Ürünler
            </CCardHeader>
            <CCardBody>
              <CFormInput
                type="text"
                placeholder="Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-3"
              />
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Kod</CTableHeaderCell>
                    <CTableHeaderCell>Barkod</CTableHeaderCell>
                    <CTableHeaderCell>Marka</CTableHeaderCell>
                    <CTableHeaderCell>Ürün</CTableHeaderCell>
                    <CTableHeaderCell>Miktar</CTableHeaderCell>
                    <CTableHeaderCell>Alış Fiyatı (TL)</CTableHeaderCell>
                    <CTableHeaderCell>Satış Fiyatı (TL)</CTableHeaderCell>
                    <CTableHeaderCell>Transfer</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredProducts.map((product) => (
                    <CTableRow key={product.id}>
                      <CTableDataCell>{product.code}</CTableDataCell>
                      <CTableDataCell>{product.barcode}</CTableDataCell>
                      <CTableDataCell>{product.brand}</CTableDataCell>
                      <CTableDataCell>{product.name}</CTableDataCell>
                      <CTableDataCell>{product.quantity}</CTableDataCell>
                      <CTableDataCell>
                        {product.alisFiyat.toLocaleString("tr-TR")} TRY
                      </CTableDataCell>
                      <CTableDataCell>
                        {product.satisFiyat.toLocaleString("tr-TR")} TRY
                      </CTableDataCell>
                      <CTableDataCell>
                        <CButton
                          color="info"
                          size="sm"
                          style={{ color: "white" }}
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowSingleTransferModal(true);
                          }}
                          disabled={loading}
                        >
                          Transfer
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Tüm Ürünleri Transfer Modal'ı */}
      <CModal
        visible={showAllTransferModal}
        onClose={() => {
          setShowAllTransferModal(false);
          setTargetWarehouseId("");
        }}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Tüm Ürünleri Transfer Et</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CFormSelect
            label="Hedef Depo"
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            disabled={loading}
          >
            <option value="">Depo Seçin</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.adi || "Bilinmeyen Depo"}
              </option>
            ))}
          </CFormSelect>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={handleTransferAll}
            disabled={loading || !targetWarehouseId}
          >
            Transfer Et
          </CButton>
          <CButton
            color="secondary"
            onClick={() => {
              setShowAllTransferModal(false);
              setTargetWarehouseId("");
            }}
            disabled={loading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Tek Ürün Transfer Modal'ı */}
      <CModal
        visible={showSingleTransferModal}
        onClose={() => {
          setShowSingleTransferModal(false);
          setSelectedProduct(null);
          setTargetWarehouseId("");
          setTransferQuantity("");
        }}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>
            {selectedProduct
              ? `${selectedProduct.name} Ürününü Transfer Et`
              : "Ürün Transferi"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedProduct && (
            <p>
              Mevcut Miktar: <strong>{selectedProduct.quantity}</strong>
            </p>
          )}
          <CFormSelect
            label="Hedef Depo"
            value={targetWarehouseId}
            onChange={(e) => setTargetWarehouseId(e.target.value)}
            disabled={loading}
            className="mb-3"
          >
            <option value="">Depo Seçin</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.adi || "Bilinmeyen Depo"}
              </option>
            ))}
          </CFormSelect>
          <CFormInput
            type="number"
            label="Transfer Miktarı"
            value={transferQuantity}
            onChange={(e) => setTransferQuantity(e.target.value)}
            min="1"
            max={selectedProduct?.quantity}
            disabled={loading}
            required
          />
        </CModalBody>
        <CModalFooter>
          <CButton
            color="primary"
            onClick={handleTransferSingle}
            disabled={loading || !targetWarehouseId || !transferQuantity}
          >
            Transfer Et
          </CButton>
          <CButton
            color="secondary"
            onClick={() => {
              setShowSingleTransferModal(false);
              setSelectedProduct(null);
              setTargetWarehouseId("");
              setTransferQuantity("");
            }}
            disabled={loading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Depo Silme Modal'ı */}
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Depo Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>Bu depoyu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            Sil
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>

      <WarehouseModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={handleUpdateSubmit}
        loading={loading}
        warehouse={warehouse}
      />
    </>
  );
};

export default WarehouseDetail;
