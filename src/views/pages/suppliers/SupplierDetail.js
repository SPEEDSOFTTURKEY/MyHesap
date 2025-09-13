import { useState, useEffect, useCallback } from "react";
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CDropdownDivider,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import {
  cilPlus,
  cilList,
  cilPencil,
  cilTrash,
  cilReload,
} from "@coreui/icons";
import SupplierModal from "../../../components/suppliers/SupplierModal";
import api from "../../../api/api";

const API_BASE_URL = "https://localhost:44375/api";
const DEFAULT_PHOTO = "/fotograf/default-avatar.png";

const getPhotoUrl = (foto) => {
  if (!foto || typeof foto !== "string" || foto === "null") {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="#e9ecef"/>
        <circle cx="50" cy="35" r="15" fill="#6c757d"/>
        <path d="M20 80 Q50 60 80 80" stroke="#6c757d" stroke-width="3" fill="none"/>
        <text x="50" y="95" text-anchor="middle" font-family="Arial" font-size="8" fill="#6c757d">Fotoğraf Yok</text>
      </svg>
    `;
    const base64 = window.btoa(unescape(encodeURIComponent(svg)));
    return `data:image/svg+xml;base64,${base64}`;
  }
  if (foto.startsWith("https")) {
    return `${foto}?t=${new Date().getTime()}`;
  }
  const normalizedFoto = foto.startsWith("/") ? foto : `/${foto}`;
  return `${API_BASE_URL}${normalizedFoto}?t=${new Date().getTime()}`;
};

const SupplierDetail = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(state?.supplier || null);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [classifications, setClassifications] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    tedarikciId: null,
    paraBirimi: "TRY",
    tutar: "",
    aciklama: "",
  });

  // DÖVİZ KURU STATE'İ EKLENDİ
  const [exchangeRates, setExchangeRates] = useState({
    USD: 32.5,
    EUR: 35.2,
    lastUpdated: new Date(),
    loading: false,
    error: null,
  });

  // Önbellek anahtarı
  const EXCHANGE_CACHE_KEY = "doviz_kurlari_cache_supplier";

  // Hızlı döviz kuru API'leri (PurchasesTable'dan kopyalandı)
  const getExchangeRatesFast = async () => {
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      const cacheTime = new Date(cachedData.lastUpdated).getTime();
      const currentTime = new Date().getTime();

      if (currentTime - cacheTime < 5 * 60 * 1000) {
        return cachedData;
      }
    }

    const quickApis = [
      {
        url: "https://api.fastforex.io/fetch-multi?from=TRY&to=USD,EUR&api_key=demo",
        parser: (data) => ({
          USD: data.results?.USD ? 1 / data.results.USD : 32.5,
          EUR: data.results?.EUR ? 1 / data.results.EUR : 35.2,
        }),
      },
      {
        url: "https://api.exchangerate.host/latest?base=TRY&symbols=USD,EUR",
        parser: (data) => ({
          USD: data.rates?.USD ? 1 / data.rates.USD : 32.5,
          EUR: data.rates?.EUR ? 1 / data.rates.EUR : 35.2,
        }),
      },
      {
        url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/try.json",
        parser: (data) => ({
          USD: data.try?.usd ? 1 / data.try.usd : 32.5,
          EUR: data.try?.eur ? 1 / data.try.eur : 35.2,
        }),
      },
    ];

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), 3000),
    );

    for (const apiConfig of quickApis) {
      try {
        const apiPromise = fetch(apiConfig.url).then((response) => {
          if (!response.ok) throw new Error("API error");
          return response.json();
        });

        const data = await Promise.race([apiPromise, timeoutPromise]);
        const rates = apiConfig.parser(data);

        const result = {
          USD: rates.USD,
          EUR: rates.EUR,
          lastUpdated: new Date(),
          loading: false,
          error: null,
        };

        localStorage.setItem(EXCHANGE_CACHE_KEY, JSON.stringify(result));
        return result;
      } catch (error) {
        console.log(`API ${apiConfig.url} çalışmadı:`, error);
        continue;
      }
    }

    throw new Error("Tüm hızlı API'ler çalışmadı");
  };

  // Hızlı döviz kuru çekme fonksiyonu
  const fetchExchangeRatesFast = async () => {
    try {
      setExchangeRates((prev) => ({ ...prev, loading: true, error: null }));

      const rates = await getExchangeRatesFast();
      setExchangeRates(rates);
      addToast("Döviz kurları güncellendi.", "success");
    } catch (error) {
      console.log("Hızlı API'ler çalışmadı, fallback kullanılıyor");

      const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setExchangeRates(cachedData);
        addToast("Güncel kurlar alınamadı, önbellek kullanılıyor", "warning");
        return;
      }

      setExchangeRates({
        USD: 32.5,
        EUR: 35.2,
        lastUpdated: new Date(),
        loading: false,
        error: "Gerçek kurlar alınamadı, yaklaşık değerler kullanılıyor",
      });

      addToast(
        "Döviz kurları alınamadı, yaklaşık değerler kullanılıyor.",
        "warning",
      );
    }
  };

  // PARA BİRİMİNE GÖRE TOPLAM HESAPLAMA FONKSİYONLARI
  const calculatePurchasesTotals = () => {
    const totalTRY = purchases.reduce((sum, purchase) => {
      return (purchase.currency || "TRY") === "TRY"
        ? sum + (purchase.amount || 0)
        : sum;
    }, 0);

    const totalEUR = purchases.reduce((sum, purchase) => {
      return (purchase.currency || "TRY") === "EUR"
        ? sum + (purchase.amount || 0)
        : sum;
    }, 0);

    const totalUSD = purchases.reduce((sum, purchase) => {
      return (purchase.currency || "TRY") === "USD"
        ? sum + (purchase.amount || 0)
        : sum;
    }, 0);

    const totalEURinTRY = totalEUR * exchangeRates.EUR;
    const totalUSDinTRY = totalUSD * exchangeRates.USD;
    const totalAllInTRY = totalTRY + totalEURinTRY + totalUSDinTRY;

    return {
      totalTRY,
      totalEUR,
      totalUSD,
      totalEURinTRY,
      totalUSDinTRY,
      totalAllInTRY,
    };
  };

  const calculatePaymentsTotals = () => {
    const totalTRY = payments.reduce((sum, payment) => {
      return (payment.currency || "TRY") === "TRY"
        ? sum + (payment.amount || 0)
        : sum;
    }, 0);

    const totalEUR = payments.reduce((sum, payment) => {
      return (payment.currency || "TRY") === "EUR"
        ? sum + (payment.amount || 0)
        : sum;
    }, 0);

    const totalUSD = payments.reduce((sum, payment) => {
      return (payment.currency || "TRY") === "USD"
        ? sum + (payment.amount || 0)
        : sum;
    }, 0);

    const totalEURinTRY = totalEUR * exchangeRates.EUR;
    const totalUSDinTRY = totalUSD * exchangeRates.USD;
    const totalAllInTRY = totalTRY + totalEURinTRY + totalUSDinTRY;

    return {
      totalTRY,
      totalEUR,
      totalUSD,
      totalEURinTRY,
      totalUSDinTRY,
      totalAllInTRY,
    };
  };

  // TARİH FORMATLAMA
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const addToast = (message, type = "success") => {
    setToasts((prev) => [...prev, { id: Date.now(), message, type }]);
  };

  const fetchData = async (url, setData) => {
    try {
      const { data } = await api.get(url);
      console.log(`API Response for ${url}:`, data);
      const filteredData = Array.isArray(data)
        ? data.filter((item) => item.durumu === 1)
        : [data].filter((item) => item.durumu === 1);
      setData(filteredData);
      return filteredData;
    } catch (err) {
      console.error(`Error fetching data from ${url}:`, err.response?.data || err.message);
      addToast(err.response?.data?.message || "Veriler yüklenemedi.", "error");
      return [];
    }
  };

  const mapApiSupplierToLocal = async (apiSupplier) => {
    console.log("Mapping supplier data:", apiSupplier);

    let classificationName = "Bilinmiyor";
    try {
      if (apiSupplier.tedarikciSiniflandirmaId) {
        const classification = classifications.find(
          (c) => c.id === apiSupplier.tedarikciSiniflandirmaId,
        );

        if (classification) {
          classificationName = classification.adi || classificationName;
        } else {
          try {
            const classificationResponse = await api.get(
              `${API_BASE_URL}/tedarikciSiniflandirma/get-by-id/${apiSupplier.tedarikciSiniflandirmaId}`,
              { headers: { accept: "*/*" } },
            );
            console.log("Classification API response (tedarikciSiniflandirma/get-by-id):", classificationResponse.data);
            if (classificationResponse.data) {
              classificationName =
                classificationResponse.data.adi || classificationName;
            }
          } catch (classificationErr) {
            console.warn("Sınıflandırma detayı alınamadı:", classificationErr);
          }
        }
      }
    } catch (err) {
      console.error("Sınıflandırma dönüşüm hatası:", err);
    }

    const mappedSupplier = {
      id: apiSupplier.id || 0,
      name: apiSupplier.unvan || apiSupplier.name || "Bilinmiyor",
      openBalance: Number(apiSupplier.acilisBakiyesi) || 0,
      chequeBondBalance: 0,
      phone: apiSupplier.telefon || apiSupplier.phone || "",
      classification: classificationName,
      email: apiSupplier.email || "",
      address: apiSupplier.adres || apiSupplier.address || "",
      taxOffice: apiSupplier.vergiDairesi || "",
      taxOrIdNumber: apiSupplier.vergiNo || "",
      accountingCode: apiSupplier.kodu || "",
      note: apiSupplier.aciklama || "",
      currency: apiSupplier.paraBirimi || "TRY",
      dueDate: apiSupplier.vadeGun || "",
      isTaxExempt: Boolean(apiSupplier.vergiMuaf) || false,
      bankInfo: apiSupplier.bankaBilgileri || "",
      contactPerson: apiSupplier.yetkiliKisi || "",
      otherContact: apiSupplier.diger || "",
      fotograf: getPhotoUrl(apiSupplier.fotograf),
    };

    console.log("Mapped supplier:", mappedSupplier);
    return mappedSupplier;
  };

  const fetchSupplier = useCallback(async () => {
    setLoading(true);
    try {
      try {
        await fetchData(
          `${API_BASE_URL}/tedarikciSiniflandirma/get-all`,
          setClassifications,
          { headers: { accept: "*/*" } },
        );
      } catch (classificationErr) {
        console.warn("Sınıflandırmalar yüklenemedi:", classificationErr);
      }

      console.log("Tedarikçi ID:", id);
      const { data } = await api.get(
        `${API_BASE_URL}/tedarikci/tedarikci-get-by-Id/${id}`,
        { headers: { accept: "*/*" } },
      );

      console.log("API Response (tedarikci/tedarikci-get-by-Id):", data);

      if (!data) {
        throw new Error("Tedarikçi verisi alınamadı.");
      }

      const supplierData = Array.isArray(data) ? data[0] : data;

      if (!supplierData) {
        throw new Error("Tedarikçi bulunamadı.");
      }

      if (supplierData.durumu !== undefined && supplierData.durumu !== 1) {
        throw new Error("Tedarikçi aktif değil.");
      }

      const mappedSupplier = await mapApiSupplierToLocal(supplierData);
      setSupplier(mappedSupplier);
      fetchPurchasesAndPayments();
      setError(null);
    } catch (err) {
      console.error("Tedarikçi yükleme hatası:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Tedarikçi yüklenemedi.";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchPurchasesAndPayments = async () => {
    try {
      setPurchases([]);
      setPayments([]);

      const { data } = await api.get(
        `${API_BASE_URL}/alis/alis-get-by-tedarikci-id/${id}`,
        { headers: { accept: "*/*" } },
      );

      console.log("Purchases API response (alis/alis-get-by-tedarikci-id):", data);

      const items = Array.isArray(data) ? data : [];

      const mappedPurchases = items
        .filter((item) =>
          typeof item?.durumu === "number" ? item.durumu === 1 : true,
        )
        .map((item) => {
          const miktar = Number(item?.miktar ?? 0) || 0;
          const fiyat = Number(item?.fiyat ?? item?.birimFiyat ?? 0) || 0;
          const indirimOrani = Number(item?.indirim ?? 0) || 0;
          const hesaplananToplam = miktar * fiyat * (1 - indirimOrani / 100);

          const rawAmount =
            item?.toplam ??
            item?.tutar ??
            item?.toplamTutar ??
            item?.genelToplam ??
            hesaplananToplam;
          const numericAmount = Number(rawAmount) || 0;

          const rawDate =
            item?.tarih || item?.islemTarihi || item?.olusturmaTarihi || "";
          const dateObj = rawDate ? new Date(rawDate) : null;

          return {
            id: item?.id ?? item?.fisId ?? item?.islemId ?? Math.random(),
            date: dateObj ? dateObj.toLocaleDateString("tr-TR") : "",
            no: item?.no || item?.fisNo || item?.belgeNo || item?.numara || "",
            status:
              typeof item?.durumu === "number"
                ? item.durumu === 1
                  ? "Aktif"
                  : "Pasif"
                : item?.durum || "",
            amount: numericAmount,
            currency: item?.paraBirimi || "TRY", // Para birimi eklendi
            quantity: miktar,
            productId: item?.urunId ?? null,
            name:
              item?.urunAdi ||
              item?.hizmetAdi ||
              item?.urun?.adi ||
              item?.adi ||
              item?.aciklama ||
              "",
            price: fiyat || numericAmount,
            description: item?.aciklama || "",
            user: item?.kullanici || item?.olusturanKullanici || "Bilinmiyor",
          };
        });

      let finalPurchases = mappedPurchases;
      const needsProductLookup = mappedPurchases.some(
        (p) => (!p.name || p.name.trim() === "") && p.productId,
      );
      if (needsProductLookup) {
        try {
          const productsResponse = await api.get(
            `${API_BASE_URL}/urun/urun-get-all`,
            { headers: { accept: "*/*" } },
          );
          console.log("Products API response (urun/urun-get-all):", productsResponse.data);
          const products = Array.isArray(productsResponse.data)
            ? productsResponse.data
            : [];
          const idToName = new Map(products.map((pr) => [pr.id, pr.adi]));
          finalPurchases = mappedPurchases.map((p) => ({
            ...p,
            name:
              p.name && p.name.trim() !== ""
                ? p.name
                : idToName.get(p.productId) || p.name || "",
          }));
        } catch (e) {
          console.error("Ürün isimleri yüklenemedi:", e);
          // Ürün isimleri doldurulamazsa, mevcut isimleri kullanmaya devam et
        }
      }

      setPurchases(finalPurchases);

      try {
        const paymentsResponse = await api.get(
          `${API_BASE_URL}/tedarikciodeme/tedarikciodeme-get-by-tedarikciId/${id}`,
          { headers: { accept: "*/*" } },
        );
        console.log("Payments API response (tedarikciodeme/tedarikciodeme-get-by-tedarikciId):", paymentsResponse.data);
        const paymentsData = Array.isArray(paymentsResponse.data)
          ? paymentsResponse.data
          : [];

        const mappedPayments = paymentsData
          .filter((item) =>
            typeof item?.durumu === "number" ? item.durumu === 1 : true,
          )
          .map((item) => {
            const rawDate =
              item?.eklenmeTarihi || item?.guncellenmeTarihi || "";
            const dateObj = rawDate ? new Date(rawDate) : null;

            return {
              id: item?.id ?? Math.random(),
              date: dateObj ? dateObj.toLocaleDateString("tr-TR") : "",
              no: item?.id?.toString() || "",
              status:
                typeof item?.durumu === "number"
                  ? item.durumu === 1
                    ? "Aktif"
                    : "Pasif"
                  : "Aktif",
              amount: Number(item?.tutar ?? 0) || 0,
              currency: item?.paraBirimi || "TRY",
              description: item?.aciklama || "",
              supplierId: item?.tedarikciId,
            };
          });

        setPayments(mappedPayments);
      } catch (paymentsErr) {
        console.error("Ödemeler yüklenirken hata:", paymentsErr);
        addToast("Ödemeler yüklenemedi.", "error");
        setPayments([]);
      }
    } catch (err) {
      console.error("Alışlar ve ödemeler yüklenirken hata:", err);
      addToast(err.response?.data?.message || "Veriler yüklenemedi.", "error");
      setPurchases([]);
      setPayments([]);
    }
  };

  useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id, fetchSupplier]);

  // DÖVİZ KURLARI İÇİN useEffect
  useEffect(() => {
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      setExchangeRates(cachedData);
    }

    setTimeout(fetchExchangeRatesFast, 100);
  }, []);

  const handlePurchaseClick = (purchase) => {
    setSelectedPurchase(purchase);
    setShowPurchaseModal(true);
  };

  const handlePurchaseAction = () => {
    navigate("/app/purchases/registered-supplier-purchase", {
      state: { supplier },
    });
  };

  const handleAction = (action) => {
    addToast(`${action} özelliği henüz uygulanmadı.`, "info");
  };

  const handlePaymentModalOpen = () => {
    setPaymentForm({
      tedarikciId: id,
      paraBirimi: "TRY",
      tutar: "",
      aciklama: "",
      tarih: "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setPaymentForm({
      tedarikciId: null,
      paraBirimi: "TRY",
      tutar: "",
      aciklama: "",
      tarih: "",
    });
  };

  const handlePaymentFormChange = (field, value) => {
    setPaymentForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePaymentSave = async () => {
    if (!paymentForm.tutar || Number(paymentForm.tutar) <= 0) {
      addToast("Lütfen geçerli bir tutar giriniz.", "error");
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (!user.id) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }

      const paymentData = {
        tedarikciId: Number(paymentForm.tedarikciId),
        paraBirimi: paymentForm.paraBirimi || "TRY", // NULL KORUMA
        tutar: Number(paymentForm.tutar),
        aciklama: paymentForm.aciklama,
        tarih: paymentForm.tarih,
        durumu: 1,
        aktif: 1,
        kullaniciId: user.id, // Kullanıcı ID'si eklendi
      };
      console.log("Payment create payload:", paymentData);
      const response = await api.post(
        `${API_BASE_URL}/tedarikciodeme/tedarikciodeme-create`,
        paymentData,
        { headers: { "Content-Type": "multipart/form-data", accept: "*/*" } },
      );
      console.log("Payment create API response (tedarikciodeme/tedarikciodeme-create):", response.data);
      addToast("Ödeme başarıyla kaydedildi.", "success");
      handlePaymentModalClose();

      fetchPurchasesAndPayments();
    } catch (err) {
      console.error("Ödeme kaydedilirken hata:", err);
      addToast(
        err.response?.data?.message ||
          "Ödeme kaydedilemedi. Lütfen tekrar deneyin.",
        "error",
      );
    }
  };

  const handleDelete = async () => {
    if (!id) {
      console.error("ID eksik:", id);
      addToast("Tedarikçi ID'si bulunamadı.", "error");
      setLoading(false);
      setShowDeleteModal(false);
      return;
    }
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      if (!user.id) {
        addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
        return;
      }
      console.log("Silme isteği gönderiliyor: ID =", id, "Kullanıcı ID =", user.id);
      const response = await api.delete(
        `${API_BASE_URL}/tedarikci/tedarikci-delete/${id}?kullaniciId=${user.id}`,
        { headers: { accept: "*/*" } },
      );
      console.log("Delete API response (tedarikci/tedarikci-delete):", response.data);
      addToast("Tedarikçi başarıyla silindi.", "success");
      navigate("/app/suppliers");
    } catch (err) {
      console.error("Silme Hatası:", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      addToast(
        err.response?.data?.message ||
          "Tedarikçi silinemedi. Lütfen tekrar deneyin.",
        "error",
      );
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <CCard>
        <CCardHeader style={{ backgroundColor: "#2965A8", color: "white" }}>
          Tedarikçi Bilgisi
        </CCardHeader>
        <CCardBody>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Yükleniyor...</span>
            </div>
            <h5>Tedarikçi bilgileri yükleniyor...</h5>
            <p className="text-muted">Lütfen bekleyiniz.</p>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  if (error || !supplier) {
    return (
      <CCard>
        <CCardHeader style={{ backgroundColor: "#dc3545", color: "white" }}>
          Tedarikçi Bilgisi
        </CCardHeader>
        <CCardBody>
          <div className="text-center">
            <h5 className="text-danger mb-3">
              {error || "Tedarikçi bulunamadı."}
            </h5>
            <p className="text-muted mb-3">Tedarikçi ID: {id}</p>
            <div className="d-flex gap-2 justify-content-center">
              <CButton
                color="primary"
                onClick={() => navigate("/app/suppliers")}
              >
                Tedarikçi Listesine Dön
              </CButton>
              <CButton
                color="secondary"
                onClick={() => window.location.reload()}
              >
                Sayfayı Yenile
              </CButton>
            </div>
          </div>
        </CCardBody>
      </CCard>
    );
  }

  // TOPLAM HESAPLAMALARI
  const purchasesTotals = calculatePurchasesTotals();
  const paymentsTotals = calculatePaymentsTotals();

  return (
    <>
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
              <CRow className="align-items-center">
                <CCol xs={2}>
                  <img
                    src={supplier.fotograf}
                    alt="Tedarikçi resmi"
                    style={{
                      width: "100px",
                      height: "100px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.src = getPhotoUrl(null);
                    }}
                  />
                </CCol>
                <CCol xs={10}>
                  <h3>{supplier.name.toUpperCase()}</h3>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Telefon:</strong> {supplier.phone}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>E-Posta:</strong> {supplier.email}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Adres:</strong> {supplier.address}
                  </p>
                  <p style={{ fontSize: "14px" }}>
                    <strong>Vergi Dairesi/No:</strong>{" "}
                    {supplier.taxOffice || "Yok"}/{supplier.taxOrIdNumber}
                  </p>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className="bg-danger"
                      style={{ color: "white" }}
                    >
                      Açık Bakiye
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {supplier.openBalance.toLocaleString("tr-TR")} TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol>
                  <CCard>
                    <CCardHeader
                      className="bg-warning"
                      style={{ color: "white" }}
                    >
                      Çek Bakiyesi
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {supplier.chequeBondBalance.toLocaleString("tr-TR")} TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
                <CCol>
                  <CCard>
                    <CCardHeader className="bg-info" style={{ color: "white" }}>
                      Senet Bakiyesi
                    </CCardHeader>
                    <CCardBody>
                      <p className="fw-bold">
                        {supplier.chequeBondBalance.toLocaleString("tr-TR")} TRY
                      </p>
                    </CCardBody>
                  </CCard>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        {/* DÖVİZ KURU BİLGİSİ PANELİ EKLENDİ */}
        <CCol xs={12} className="my-3">
          <CCard>
            <CCardHeader style={{ backgroundColor: "#6f42c1", color: "white" }}>
              Döviz Kuru Bilgileri
            </CCardHeader>
            <CCardBody>
              <CRow className="align-items-center">
                <CCol md={8}>
                  <div
                    style={{
                      display: "flex",
                      gap: "30px",
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <strong>USD:</strong> {exchangeRates.USD.toFixed(2)} TRY
                    </div>
                    <div>
                      <strong>EUR:</strong> {exchangeRates.EUR.toFixed(2)} TRY
                    </div>
                    {exchangeRates.lastUpdated && (
                      <div style={{ fontSize: "12px", color: "#6c757d" }}>
                        Son güncelleme: {formatDate(exchangeRates.lastUpdated)}
                      </div>
                    )}
                    {exchangeRates.error && (
                      <div style={{ fontSize: "12px", color: "#dc3545" }}>
                        {exchangeRates.error}
                      </div>
                    )}
                  </div>
                </CCol>
                <CCol md={4} className="text-end">
                  <CButton
                    color="secondary"
                    size="sm"
                    onClick={fetchExchangeRatesFast}
                    disabled={exchangeRates.loading}
                  >
                    <CIcon icon={cilReload} style={{ marginRight: "5px" }} />
                    {exchangeRates.loading
                      ? "Güncelleniyor..."
                      : "Kurları Güncelle"}
                  </CButton>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} className="my-3">
          <div className="d-flex gap-2">
            <CDropdown>
              <CDropdownToggle color="success" style={{ color: "white" }}>
                Alış Yap
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={handlePurchaseAction}>
                  Ürün Al
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={handlePurchaseAction}>
                  Hizmet Al
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CDropdown>
              <CDropdownToggle color="primary" style={{ color: "white" }}>
                Ödeme/Tahsilat
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={handlePaymentModalOpen}>
                  Yeni Ödeme Ekle
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={() => handleAction("Çek")}>
                  Çek
                </CDropdownItem>
                <CDropdownItem onClick={() => handleAction("Senet")}>
                  Senet
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={() => handleAction("Tahsilat İste")}>
                  Tahsilat İste
                </CDropdownItem>
                <CDropdownItem onClick={() => handleAction("Bakiye Düzelt")}>
                  Bakiye Düzelt
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  onClick={() => handleAction("Borç-Alacak Fişleri")}
                >
                  Borç-Alacak Fişleri
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={() => handleAction("Cari Virman")}>
                  Cari Virman
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CDropdown>
              <CDropdownToggle
                color="info"
                disabled={true}
                style={{ color: "white" }}
              >
                Hesap Ekstresi
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => handleAction("Ekstre Linki")}>
                  Ekstre Linki
                </CDropdownItem>
                <CDropdownItem onClick={() => handleAction("Ekstre")}>
                  Ekstre
                </CDropdownItem>
                <CDropdownItem onClick={() => handleAction("Detaylı Ekstre")}>
                  Detaylı Ekstre
                </CDropdownItem>
                <CDropdownItem
                  onClick={() => handleAction("Mutabakat Mektubu")}
                >
                  Mutabakat Mektubu
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
            <CButton
              color="warning"
              style={{ color: "white" }}
              onClick={() => handleAction("Dökümanlar")}
              disabled={true}
            >
              <CIcon icon={cilList} /> Dökümanlar
            </CButton>
            <CDropdown>
              <CDropdownToggle color="secondary" style={{ color: "white" }}>
                Diğer İşlemler
              </CDropdownToggle>
              <CDropdownMenu>
                <CDropdownItem onClick={() => setShowUpdateModal(true)}>
                  Tedarikçi Bilgilerini Güncelle
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleAction("Tedarikçiye Satış Yap")}
                >
                  Tedarikçiye Satış Yap
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleAction("Tedarikçiye İade Ver")}
                >
                  Tedarikçiye İade Ver
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem onClick={() => setShowDeleteModal(true)}>
                  Tedarikçiyi Sil
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  disabled={true}
                  onClick={() => handleAction("Etiket Yazdır")}
                >
                  Etiket Yazdır
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
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Önceki Ürün/Hizmet Alışları</span>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {/* DÖVİZ KURU TOPLAM BİLGİLERİ EKLENDİ */}
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "15px",
                      marginBottom: "20px",
                      borderRadius: "5px",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <h6
                      style={{
                        margin: 0,
                        color: "#2965A8",
                        marginBottom: "10px",
                      }}
                    >
                      Genel Toplam (TRY):{" "}
                      {purchasesTotals.totalAllInTRY.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TRY
                    </h6>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ color: "#2965A8", fontWeight: "bold" }}>
                        TRY:{" "}
                        {purchasesTotals.totalTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        EUR:{" "}
                        {purchasesTotals.totalEUR.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        EUR ≈{" "}
                        {purchasesTotals.totalEURinTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                      <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                        USD:{" "}
                        {purchasesTotals.totalUSD.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD ≈{" "}
                        {purchasesTotals.totalUSDinTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                    </div>
                  </div>

                  <CTable responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>No</CTableHeaderCell>
                        <CTableHeaderCell>Ürün/Hizmet</CTableHeaderCell>
                        <CTableHeaderCell>Miktar</CTableHeaderCell>
                        <CTableHeaderCell>Para Birimi</CTableHeaderCell>
                        <CTableHeaderCell>Durum</CTableHeaderCell>
                        <CTableHeaderCell>Tutar</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {purchases.map((purchase) => (
                        <CTableRow
                          key={purchase.id}
                          onClick={() => handlePurchaseClick(purchase)}
                        >
                          <CTableDataCell>{purchase.date}</CTableDataCell>
                          <CTableDataCell>{purchase.no}</CTableDataCell>
                          <CTableDataCell>
                            {purchase.name || "-"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {purchase.quantity ?? "-"}
                          </CTableDataCell>
                          <CTableDataCell>
                            {purchase.currency || "TRY"}
                          </CTableDataCell>
                          <CTableDataCell>{purchase.status}</CTableDataCell>
                          <CTableDataCell>
                            {purchase.amount.toLocaleString("tr-TR")}{" "}
                            {purchase.currency || "TRY"}
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
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Önceki Ödemeler</span>
                  </div>
                </CCardHeader>
                <CCardBody>
                  {/* ÖDEMELER İÇİN DÖVİZ KURU TOPLAM BİLGİLERİ */}
                  <div
                    style={{
                      backgroundColor: "#f8f9fa",
                      padding: "15px",
                      marginBottom: "20px",
                      borderRadius: "5px",
                      border: "1px solid #dee2e6",
                    }}
                  >
                    <h6
                      style={{
                        margin: 0,
                        color: "#2965A8",
                        marginBottom: "10px",
                      }}
                    >
                      Genel Toplam (TRY):{" "}
                      {paymentsTotals.totalAllInTRY.toLocaleString("tr-TR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      TRY
                    </h6>

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "5px",
                        fontSize: "14px",
                      }}
                    >
                      <span style={{ color: "#2965A8", fontWeight: "bold" }}>
                        TRY:{" "}
                        {paymentsTotals.totalTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                      <span style={{ color: "#28a745", fontWeight: "bold" }}>
                        EUR:{" "}
                        {paymentsTotals.totalEUR.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        EUR ≈{" "}
                        {paymentsTotals.totalEURinTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                      <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                        USD:{" "}
                        {paymentsTotals.totalUSD.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD ≈{" "}
                        {paymentsTotals.totalUSDinTRY.toLocaleString("tr-TR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        TRY
                      </span>
                    </div>
                  </div>

                  <CTable responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Tarih</CTableHeaderCell>
                        <CTableHeaderCell>No</CTableHeaderCell>
                        <CTableHeaderCell>Açıklama</CTableHeaderCell>
                        <CTableHeaderCell>Para Birimi</CTableHeaderCell>
                        <CTableHeaderCell>Durum</CTableHeaderCell>
                        <CTableHeaderCell>Tutar</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {payments.map((payment) => (
                        <CTableRow key={payment.id}>
                          <CTableDataCell>{payment.date}</CTableDataCell>
                          <CTableDataCell>{payment.no}</CTableDataCell>
                          <CTableDataCell>
                            {payment.description || "-"}
                          </CTableDataCell>
                          <CTableDataCell>{payment.currency}</CTableDataCell>
                          <CTableDataCell>{payment.status}</CTableDataCell>
                          <CTableDataCell>
                            {payment.amount.toLocaleString("tr-TR")}{" "}
                            {payment.currency}
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
      <CModal
        visible={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle>Alış Detayları</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Ürün/Hizmet Adı</CTableHeaderCell>
                <CTableHeaderCell>Fiyat</CTableHeaderCell>
                <CTableHeaderCell>Tutar</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {selectedPurchase && (
                <CTableRow>
                  <CTableDataCell>{selectedPurchase.name}</CTableDataCell>
                  <CTableDataCell>
                    {selectedPurchase.price.toLocaleString("tr-TR")}{" "}
                    {selectedPurchase.currency || "TRY"}
                  </CTableDataCell>
                  <CTableDataCell>
                    {selectedPurchase.amount.toLocaleString("tr-TR")}{" "}
                    {selectedPurchase.currency || "TRY"}
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
          <p>
            <strong>Açıklama:</strong> {selectedPurchase?.description || "Yok"}
          </p>
          <p>
            <strong>Kullanıcı:</strong> {selectedPurchase?.user || "Bilinmiyor"}
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => navigate("/app/purchases")}>
            Alış Ekranına Gir
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setShowPurchaseModal(false)}
          >
            Kapat
          </CButton>
        </CModalFooter>
      </CModal>
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        backdrop="static"
      >
        <CModalHeader
          style={{
            backgroundColor: "var(--danger-color)",
            color: "var(--white-color)",
          }}
        >
          <CModalTitle>Tedarikçiyi Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            <strong>{supplier.name}</strong> adlı tedarikçiyi silmek
            istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            style={{
              backgroundColor: "var(--danger-color)",
              color: "var(--white-color)",
            }}
            onClick={handleDelete}
            disabled={loading}
          >
            Evet, Sil
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
      <SupplierModal
        visible={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={(data) => {
          setSupplier({
            ...supplier,
            ...data,
            fotograf: data.fotograf || supplier.fotograf,
          });
          addToast("Tedarikçi güncellendi.", "success");
          setShowUpdateModal(false);
        }}
        supplier={supplier}
        addToast={addToast}
      />
      <CModal
        visible={showPaymentModal}
        onClose={handlePaymentModalClose}
        backdrop="static"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Yeni Ödeme Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow>
              <CCol md={6}>
                <CFormLabel htmlFor="paraBirimi">Para Birimi *</CFormLabel>
                <CFormSelect
                  id="paraBirimi"
                  value={paymentForm.paraBirimi || "TRY"}
                  onChange={(e) =>
                    handlePaymentFormChange("paraBirimi", e.target.value)
                  }
                  required
                >
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Amerikan Doları</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="tutar">Tutar *</CFormLabel>
                <CFormInput
                  id="tutar"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={paymentForm.tutar}
                  onChange={(e) =>
                    handlePaymentFormChange("tutar", e.target.value)
                  }
                  required
                />
              </CCol>
            </CRow>

            <CRow className="mt-3">
              <CCol md={6}>
                <CFormLabel htmlFor="tarih">Tarih *</CFormLabel>
                <CFormInput
                  id="tarih"
                  type="date"
                  value={paymentForm.tarih}
                  onChange={(e) =>
                    handlePaymentFormChange("tarih", e.target.value)
                  }
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="aciklama">Açıklama</CFormLabel>
                <CFormTextarea
                  id="aciklama"
                  rows={4}
                  placeholder="Ödeme açıklaması..."
                  value={paymentForm.aciklama}
                  onChange={(e) =>
                    handlePaymentFormChange("aciklama", e.target.value)
                  }
                />
              </CCol>
            </CRow>

            <CRow className="mt-3">
              <CCol md={12}>
                <div className="alert alert-info">
                  <strong>Tedarikçi:</strong> {supplier?.name} (ID:{" "}
                  {paymentForm.tedarikciId})
                </div>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="success"
            style={{ color: "#fff" }}
            onClick={handlePaymentSave}
          >
            Kaydet
          </CButton>
          <CButton color="secondary" onClick={handlePaymentModalClose}>
            İptal
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default SupplierDetail;