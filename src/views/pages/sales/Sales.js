import { useState, useEffect, useRef, useCallback } from "react";
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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
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
  CForm,
  CFormLabel,
  CFormSelect,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus } from "@coreui/icons";
import api from "../../../api/api";
import ErrorBoundary from "../products/ErrorBoundary";

const API_BASE_URL = "https://localhost:44375/api";

const Sales = () => {
  const [toasts, setToasts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("Tümünü seç");
  const [timeFilter, setTimeFilter] = useState("Tamamını Göster");
  const [searchType, setSearchType] = useState("Müşteri İsmi / Belge No");
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [registeredCustomerModal, setRegisteredCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [selectedCustomerFilter, setSelectedCustomerFilter] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    unvani: "",
    email: "",
    telefon: "",
    vergiDairesi: "",
    vergiNumarasi: "",
    adres: "",
  });
  const [saleItems, setSaleItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const toaster = useRef();

  // Toast bildirimi ekleme
  const addToast = useCallback((message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide={true} visible={true} delay={5000}>
        <CToastHeader closeButton>
          <strong className="me-auto">{type === "error" ? "Hata" : "Başarılı"}</strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prev) => [...prev, toast]);
  }, []);

  // Satışları getir
  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/musteriSatis/musteriSatis-get-all`;
      if (selectedCustomerFilter) {
        url = `${API_BASE_URL}/musteriSatis/musteriSatis-get-by-musteri/${selectedCustomerFilter}`;
      }
      const { data } = await api.get(url);
      setSales(data);
      setError(null);
    } catch (err) {
      console.error("Satışları Getirme Hatası:", err);
      setError(err.response?.data?.message || "Satışlar yüklenemedi.");
      addToast("Satışlar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  }, [addToast, selectedCustomerFilter]);

  // Aktif müşterileri getir
  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/musteri/musteri-get-allaktif`);
      setCustomers(data);
    } catch (err) {
      console.error("Müşterileri Getirme Hatası:", err);
      addToast("Müşteriler yüklenemedi.", "error");
    }
  }, [addToast]);

  // Aktif ürünleri getir
  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get(`${API_BASE_URL}/urun/urun-get-all`);
      setProducts(data);
    } catch (err) {
      console.error("Ürünleri Getirme Hatası:", err);
      addToast("Ürünler yüklenemedi.", "error");
    }
  }, [addToast]);

  // Component mount olduğunda satışları ve müşterileri getir
  useEffect(() => {
    fetchSales();
    fetchCustomers();
  }, [fetchSales, fetchCustomers]);

  // Yeni müşteri satış modalını aç
  const handleNewCustomerSale = () => {
    setNewCustomerModal(true);
    setNewCustomer({
      unvani: "",
      email: "",
      telefon: "",
      vergiDairesi: "",
      vergiNumarasi: "",
      adres: "",
    });
    setSaleItems([]);
    fetchProducts();
  };

  // Kayıtlı müşteri satış modalını aç
  const handleRegisteredCustomerSale = () => {
    setRegisteredCustomerModal(true);
    setSelectedCustomer("");
    setSaleItems([]);
    fetchCustomers();
    fetchProducts();
  };

  // Yeni müşteri formu değişikliklerini yönet
  const handleNewCustomerChange = (e) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  // Ürünü satış kalemlerine ekle
  const addProductToSale = () => {
    if (!selectedProduct) {
      addToast("Lütfen bir ürün seçin.", "error");
      return;
    }
    const product = products.find((p) => p.id === parseInt(selectedProduct));
    if (!product) {
      addToast("Ürün bulunamadı.", "error");
      return;
    }
    if (saleItems.some((item) => item.barkod === product.barkod)) {
      addToast("Bu ürün zaten eklenmiş.", "error");
      return;
    }
    setSaleItems((prev) => [
      ...prev,
      {
        barkod: product.barkod,
        urunAdi: product.adi,
        fiyat: product.satisFiyat,
        birim: product.birimAdi,
        miktar: 1,
        toplamFiyat: product.satisFiyat,
      },
    ]);
    setSelectedProduct("");
  };

  // Satış kalemi miktarını değiştir ve toplam fiyatı güncelle
  const handleQuantityChange = (index, value) => {
    const quantity = parseInt(value) || 1;
    setSaleItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              miktar: quantity,
              toplamFiyat: quantity * item.fiyat,
            }
          : item
      )
    );
  };

  // Satış kalemini kaldır
  const removeSaleItem = (index) => {
    setSaleItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Yeni müşteri ve satış oluştur
  const handleNewCustomerSaleSubmit = async () => {
    try {
      if (!newCustomer.unvani || !newCustomer.email) {
        addToast("Unvan ve e-posta zorunlu.", "error");
        return;
      }
      if (saleItems.length === 0) {
        addToast("En az bir ürün eklenmeli.", "error");
        return;
      }

      const customerData = {
        unvani: newCustomer.unvani,
        email: newCustomer.email,
        telefon: newCustomer.telefon,
        vergiDairesi: newCustomer.vergiDairesi,
        vergiNumarasi: newCustomer.vergiNumarasi,
        adres: newCustomer.adres,
        durumu: 1,
        aktif: 1,
      };

      const customerResponse = await api.post(`${API_BASE_URL}/musteri/musteri-create`, customerData);
      const customerId = customerResponse.data.Data.id;

      const saleData = saleItems.map((item) => ({
        musteriId: customerId,
        barkod: item.barkod,
        urunAdi: item.urunAdi,
        fiyat: item.fiyat,
        birim: item.birim,
        miktar: item.miktar,
        toplamFiyat: item.toplamFiyat,
      }));

      const response = await api.post(`${API_BASE_URL}/musteriSatis/musteriSatis-create`, saleData);
      addToast(response.data.Message || "Satış başarıyla kaydedildi.");
      setNewCustomerModal(false);
      fetchSales();
    } catch (err) {
      console.error("Yeni Müşteri Satış Hatası:", err);
      addToast(err.response?.data?.Message || "Satış kaydedilemedi.", "error");
    }
  };

  // Kayıtlı müşteri için satış oluştur
  const handleRegisteredCustomerSaleSubmit = async () => {
    if (!selectedCustomer) {
      addToast("Lütfen bir müşteri seçin.", "error");
      return;
    }
    if (saleItems.length === 0) {
      addToast("En az bir ürün eklenmeli.", "error");
      return;
    }

    try {
      const saleData = saleItems.map((item) => ({
        musteriId: parseInt(selectedCustomer),
        barkod: item.barkod,
        urunAdi: item.urunAdi,
        fiyat: item.fiyat,
        birim: item.birim,
        miktar: item.miktar,
        toplamFiyat: item.toplamFiyat,
      }));

      const response = await api.post(`${API_BASE_URL}/musteriSatis/musteriSatis-create`, saleData);
      addToast(response.data.Message || "Satış başarıyla kaydedildi.");
      setRegisteredCustomerModal(false);
      fetchSales();
    } catch (err) {
      console.error("Kayıtlı Müşteri Satış Hatası:", err);
      addToast(err.response?.data?.Message || "Satış kaydedilemedi.", "error");
    }
  };

  // Satışları filtrele
  const filteredSales = sales.filter((sale) => {
    const matchesDocType =
      docTypeFilter === "Tümünü seç" ||
      sale.docType === docTypeFilter ||
      (docTypeFilter === "E-Faturalaşmış" && sale.durumu === 1) ||
      (docTypeFilter === "E-Faturalaşmamış" && sale.durumu === 0);

    const matchesTime = () => {
      const saleDate = new Date(sale.eklenmeTarihi);
      const now = new Date();
      if (timeFilter === "Bu yılın Satışlarını Göster") {
        return saleDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === "Son 1 Ay") {
        return saleDate >= new Date(now.setMonth(now.getMonth() - 1));
      } else if (timeFilter === "Son 3 Ay") {
        return saleDate >= new Date(now.setMonth(now.getMonth() - 3));
      } else if (timeFilter === "Bugün") {
        return saleDate.toDateString() === new Date().toDateString();
      } else if (timeFilter === "İleri Tarihli Planlı Satışlar") {
        return saleDate > now;
      }
      return true;
    };

    const matchesSearch = () => {
      if (searchTerm.length < 3) return true;
      const term = searchTerm.toLowerCase();
      if (searchType === "Müşteri İsmi / Belge No") {
        return (
          sale.musteri?.unvani?.toLowerCase().includes(term) ||
          sale.satisId?.toLowerCase().includes(term)
        );
      } else if (searchType === "Ürün Adı / Kodu / Barkodu") {
        return (
          sale.urunAdi?.toLowerCase().includes(term) ||
          sale.barkod?.toLowerCase().includes(term)
        );
      } else if (searchType === "Belge Açıklaması") {
        return sale.aciklama?.toLowerCase().includes(term);
      } else if (searchType === "Satır Açıklaması") {
        return sale.aciklama?.toLowerCase().includes(term);
      }
      return true;
    };

    const matchesCancelled = showCancelled ? true : sale.durumu !== 0;

    return matchesDocType && matchesTime() && matchesSearch() && matchesCancelled;
  });

  return (
    <ErrorBoundary>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="mb-3">
        <CCol>
          <CButton
            color="primary"
            style={{ color: "white", marginRight: "10px", marginBottom: "10px" }}
            onClick={handleNewCustomerSale}
          >
            <CIcon icon={cilPlus} /> Yeni Müşteriye Satış Gir
          </CButton>
          <CButton
            color="info"
            style={{ color: "white", marginRight: "10px", marginBottom: "10px" }}
            onClick={handleRegisteredCustomerSale}
          >
            <CIcon icon={cilPlus} /> Kayıtlı Müşteriye Satış Gir
          </CButton>
        </CCol>
      </CRow>
      <CCard className="mb-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
        >
          <CRow className="d-flex justify-content-between align-items-center">
            <CCol className="d-flex align-items-center justify-content-between">
              <div className="d-flex gap-2">
      
                <CDropdown>
                  <CDropdownToggle color="light">{timeFilter}</CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => setTimeFilter("Bu yılın Satışlarını Göster")}>
                      Bu yılın Satışlarını Göster
                    </CDropdownItem>
                    <CDropdownItem onClick={() => setTimeFilter("Son 1 Ay")}>Son 1 Ay</CDropdownItem>
                    <CDropdownItem onClick={() => setTimeFilter("Son 3 Ay")}>Son 3 Ay</CDropdownItem>
                    <CDropdownItem onClick={() => setTimeFilter("Bugün")}>Bugün</CDropdownItem>
                    <CDropdownItem onClick={() => setTimeFilter("Tamamını Göster")}>Tamamını Göster</CDropdownItem>
                    <CDropdownItem onClick={() => setTimeFilter("İleri Tarihli Planlı Satışlar")}>
                      İleri Tarihli Planlı Satışlar
                    </CDropdownItem>
                  </CDropdownMenu>
                </CDropdown>
                <CDropdown>
                  <CDropdownToggle color="light">
                    {selectedCustomerFilter
                      ? customers.find((c) => c.id === parseInt(selectedCustomerFilter))?.unvani || "Müşteri Seç"
                      : "Müşteri Seç"}
                  </CDropdownToggle>
                  <CDropdownMenu>
                    <CDropdownItem onClick={() => setSelectedCustomerFilter("")}>Tüm Müşteriler</CDropdownItem>
                    <CDropdownDivider />
                    {customers.map((customer) => (
                      <CDropdownItem
                        key={customer.id}
                        onClick={() => setSelectedCustomerFilter(customer.id.toString())}
                      >
                        {customer.unvani}
                      </CDropdownItem>
                    ))}
                  </CDropdownMenu>
                </CDropdown>
              </div>
              <CFormSwitch
                label="İptalleri de göster"
                checked={showCancelled}
                onChange={() => setShowCancelled(!showCancelled)}
              />
            </CCol>
          </CRow>
    
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && (
            <>
              <p>Satış Sayısı: {filteredSales.length}</p>
              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Tarih</CTableHeaderCell>
                    <CTableHeaderCell>Müşteri</CTableHeaderCell>
                    <CTableHeaderCell>Belge No</CTableHeaderCell>
                    <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                    <CTableHeaderCell>Adet</CTableHeaderCell>
                    <CTableHeaderCell>Tutar</CTableHeaderCell>
                    <CTableHeaderCell>Durumu</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredSales.map((sale) => (
                    <CTableRow key={sale.id}>
                      <CTableDataCell>{new Date(sale.eklenmeTarihi).toLocaleDateString()}</CTableDataCell>
                      <CTableDataCell>{sale.musteri?.unvani}</CTableDataCell>
                      <CTableDataCell>{sale.satisId}</CTableDataCell>
                      <CTableDataCell>{sale.urunAdi}</CTableDataCell>
                      <CTableDataCell>{sale.miktar}</CTableDataCell>
                      <CTableDataCell>{sale.toplamFiyat}</CTableDataCell>
                      <CTableDataCell>{sale.durumu === 1 ? "Aktif" : "İptal"}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </>
          )}
        </CCardBody>
      </CCard>

      {/* Yeni Müşteri Satış Modal */}
      <CModal visible={newCustomerModal} onClose={() => setNewCustomerModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Yeni Müşteriye Satış</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Unvan</CFormLabel>
                <CFormInput
                  name="unvani"
                  value={newCustomer.unvani}
                  onChange={handleNewCustomerChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>E-posta</CFormLabel>
                <CFormInput
                  name="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={handleNewCustomerChange}
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Telefon</CFormLabel>
                <CFormInput
                  name="telefon"
                  value={newCustomer.telefon}
                  onChange={handleNewCustomerChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Adres</CFormLabel>
                <CFormInput
                  name="adres"
                  value={newCustomer.adres}
                  onChange={handleNewCustomerChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Vergi Dairesi</CFormLabel>
                <CFormInput
                  name="vergiDairesi"
                  value={newCustomer.vergiDairesi}
                  onChange={handleNewCustomerChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Vergi Numarası</CFormLabel>
                <CFormInput
                  name="vergiNumarasi"
                  value={newCustomer.vergiNumarasi}
                  onChange={handleNewCustomerChange}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={8}>
                <CFormLabel>Ürün Seç</CFormLabel>
                <CFormSelect
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Ürün Seçin</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.adi} (Barkod: {product.barkod}, Fiyat: {product.satisFiyat})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4} className="d-flex align-items-end">
                <CButton color="primary" onClick={addProductToSale}>
                  Ürün Ekle
                </CButton>
              </CCol>
            </CRow>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                  <CTableHeaderCell>Barkod</CTableHeaderCell>
                  <CTableHeaderCell>Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>Birim</CTableHeaderCell>
                  <CTableHeaderCell>Miktar</CTableHeaderCell>
                  <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>İşlem</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {saleItems.map((item, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{item.urunAdi}</CTableDataCell>
                    <CTableDataCell>{item.barkod}</CTableDataCell>
                    <CTableDataCell>{item.fiyat}</CTableDataCell>
                    <CTableDataCell>{item.birim}</CTableDataCell>
                    <CTableDataCell>
                      <CFormInput
                        type="number"
                        min="1"
                        value={item.miktar}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={{ width: "100px" }}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{item.toplamFiyat}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="danger" onClick={() => removeSaleItem(index)}>
                        Sil
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setNewCustomerModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleNewCustomerSaleSubmit}
            disabled={saleItems.length === 0 || !newCustomer.unvani || !newCustomer.email}
          >
            Satışı Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Kayıtlı Müşteri Satış Modal */}
      <CModal visible={registeredCustomerModal} onClose={() => setRegisteredCustomerModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Kayıtlı Müşteriye Satış</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Müşteri Seç</CFormLabel>
                <CFormSelect
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Müşteri Seçin</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.unvani}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={8}>
                <CFormLabel>Ürün Seç</CFormLabel>
                <CFormSelect
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                >
                  <option value="">Ürün Seçin</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.adi} (Barkod: {product.barkod}, Fiyat: {product.satisFiyat})
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4} className="d-flex align-items-end">
                <CButton color="primary" onClick={addProductToSale}>
                  Ürün Ekle
                </CButton>
              </CCol>
            </CRow>
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
                  <CTableHeaderCell>Barkod</CTableHeaderCell>
                  <CTableHeaderCell>Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>Birim</CTableHeaderCell>
                  <CTableHeaderCell>Miktar</CTableHeaderCell>
                  <CTableHeaderCell>Toplam Fiyat</CTableHeaderCell>
                  <CTableHeaderCell>İşlem</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {saleItems.map((item, index) => (
                  <CTableRow key={index}>
                    <CTableDataCell>{item.urunAdi}</CTableDataCell>
                    <CTableDataCell>{item.barkod}</CTableDataCell>
                    <CTableDataCell>{item.fiyat}</CTableDataCell>
                    <CTableDataCell>{item.birim}</CTableDataCell>
                    <CTableDataCell>
                      <CFormInput
                        type="number"
                        min="1"
                        value={item.miktar}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        style={{ width: "100px" }}
                      />
                    </CTableDataCell>
                    <CTableDataCell>{item.toplamFiyat}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="danger" onClick={() => removeSaleItem(index)}>
                        Sil
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setRegisteredCustomerModal(false)}>
            İptal
          </CButton>
          <CButton
            color="primary"
            onClick={handleRegisteredCustomerSaleSubmit}
            disabled={saleItems.length === 0 || !selectedCustomer}
          >
            Satışı Kaydet
          </CButton>
        </CModalFooter>
      </CModal>
    </ErrorBoundary>
  );
};

export default Sales;