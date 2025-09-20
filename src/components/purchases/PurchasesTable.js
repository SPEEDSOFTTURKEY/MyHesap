import { useContext, useState, useEffect, useRef } from "react";
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalFooter,
  CModalBody,
  CPagination,
  CPaginationItem,
} from "@coreui/react";
import PurchasesContext from "../../context/PurchasesContext";
import { CIcon } from "@coreui/icons-react";
import {
  cilPencil,
  cilTrash,
  cilFile,
  cilSave,
  cilReload,
} from "@coreui/icons";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const API_BASE_URL = "https://localhost:44375/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

const PurchasesTable = () => {
  const {
    filteredPurchases,
    navigate,
    addToast,
    suppliers,
    handleCancelPurchase,
    products,
  } = useContext(PurchasesContext);

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [exchangeRates, setExchangeRates] = useState({
    USD: 32.5,
    EUR: 35.2,
    lastUpdated: new Date(),
    loading: false,
    error: null,
  });

  // Önbellek anahtarı
  const EXCHANGE_CACHE_KEY = "doviz_kurlari_cache";

  // Kullanıcı ID'sini al (NewExpense'deki gibi)
  const getUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user")) || { id: 0 };
      return user.id;
    } catch (err) {
      console.error("Kullanıcı ID'si alınırken hata:", err);
      return 0;
    }
  };

  // Hızlı döviz kuru API'leri
  const getExchangeRatesFast = async () => {
    // Önce önbelleği kontrol et
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      const cacheTime = new Date(cachedData.lastUpdated).getTime();
      const currentTime = new Date().getTime();

      // 5 dakikadan eski değilse önbelleği kullan
      if (currentTime - cacheTime < 5 * 60 * 1000) {
        return cachedData;
      }
    }

    // Hızlı API'ler - timeout ile
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

    // Timeout ile en hızlı API'yi bul
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

        // Önbelleğe kaydet
        localStorage.setItem(EXCHANGE_CACHE_KEY, JSON.stringify(result));
        return result;
      } catch (error) {
        console.log(`API ${apiConfig.url} çalışmadı:`, error);
        continue;
      }
    }

    throw new Error("Tüm hızlı API'ler çalışmadı");
  };

  // Hızlı döviz kuru çekme
  const fetchExchangeRatesFast = async () => {
    try {
      setExchangeRates((prev) => ({ ...prev, loading: true, error: null }));

      const rates = await getExchangeRatesFast();
      setExchangeRates(rates);
      addToast("Döviz kurları güncellendi.", "success");
    } catch (error) {
      console.log("Hızlı API'ler çalışmadı, fallback kullanılıyor");

      // Fallback - önbellek varsa onu kullan
      const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
      if (cached) {
        const cachedData = JSON.parse(cached);
        setExchangeRates(cachedData);
        addToast("Güncel kurlar alınamadı, önbellek kullanılıyor", "warning");
        return;
      }

      // Hiçbiri yoksa varsayılan değerler
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

  // Component mount olduğunda döviz kurlarını çek
  useEffect(() => {
    // Önce önbelleği yükle
    const cached = localStorage.getItem(EXCHANGE_CACHE_KEY);
    if (cached) {
      const cachedData = JSON.parse(cached);
      setExchangeRates(cachedData);
    }

    // Sonra arka planda güncelle
    setTimeout(fetchExchangeRatesFast, 100);
  }, []);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPurchases.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);

  // Calculate total amounts for different currencies
  const totalAmountTRY = filteredPurchases.reduce((sum, purchase) => {
    return purchase.paraBirimi === "TRY" ? sum + (purchase.toplam || 0) : sum;
  }, 0);

  const totalAmountEUR = filteredPurchases.reduce((sum, purchase) => {
    return purchase.paraBirimi === "EUR" ? sum + (purchase.toplam || 0) : sum;
  }, 0);

  const totalAmountUSD = filteredPurchases.reduce((sum, purchase) => {
    return purchase.paraBirimi === "USD" ? sum + (purchase.toplam || 0) : sum;
  }, 0);

  // Döviz kurlarına göre TRY cinsinden toplamlar
  const totalAmountEURinTRY = totalAmountEUR * exchangeRates.EUR;
  const totalAmountUSDinTRY = totalAmountUSD * exchangeRates.USD;

  // Genel toplam (TRY cinsinden)
  const totalAmountAll =
    totalAmountTRY + totalAmountEURinTRY + totalAmountUSDinTRY;

  // Get supplier name by ID
  const getSupplierName = (supplierId) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.unvan : "Bilinmiyor";
  };

  // Get product name
  const getProductName = (purchase) => {
    if (purchase.urun && purchase.urun.adi) {
      return purchase.urun.adi;
    }

    if (purchase.urunId && products && products.length > 0) {
      const product = products.find((p) => p.id === purchase.urunId);
      if (product && product.adi) {
        return product.adi;
      }
    }

    return purchase.urunId ? `Ürün ID: ${purchase.urunId}` : "Bilinmiyor";
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = filteredPurchases.map((purchase, index) => ({
      No: index + 1,
      Tarih: new Date(purchase.tarih).toLocaleDateString("tr-TR"),
      Tedarikçi: getSupplierName(purchase.tedarikciId),
      "Ürün Adı": getProductName(purchase),
      Miktar: purchase.miktar || 0,
      "Belge No": purchase.belgeNo || "",
      "Para Birimi": purchase.paraBirimi || "TRY",
      Tutar: purchase.toplam
        ? `${purchase.toplam.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${purchase.paraBirimi || "TRY"}`
        : `0 ${purchase.paraBirimi || "TRY"}`,
      Durumu: purchase.durumu === 1 ? "Faturalaşmış" : "İptal",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Alışlar");

    // Auto-size columns
    const colWidths = [
      { wch: 5 }, // No
      { wch: 12 }, // Tarih
      { wch: 30 }, // Tedarikçi
      { wch: 40 }, // Ürün Adı
      { wch: 15 }, // Miktar
      { wch: 25 }, // Belge No
      { wch: 15 }, // Para Birimi
      { wch: 20 }, // Tutar
      { wch: 15 }, // Durumu
    ];
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `Alışlar_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.xlsx`,
    );
    addToast("Excel dosyası başarıyla indirildi.", "success");
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF("landscape");

    // Title
    doc.setFontSize(16);
    doc.text("Alislar Raporu", 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Olusturulma Tarihi: ${new Date().toLocaleDateString("tr-TR")}`,
      14,
      30,
    );

    // Döviz kuru bilgileri
    doc.text(
      `Döviz Kurları: USD: ${exchangeRates.USD.toFixed(2)} TRY, EUR: ${exchangeRates.EUR.toFixed(2)} TRY`,
      14,
      37,
    );
    doc.text(
      `Kur Güncelleme: ${exchangeRates.lastUpdated ? formatDate(exchangeRates.lastUpdated) : "Bilinmiyor"}`,
      14,
      44,
    );

    if (exchangeRates.error) {
      doc.setTextColor(220, 53, 69);
      doc.text(`Uyarı: ${exchangeRates.error}`, 14, 51);
      doc.setTextColor(0, 0, 0);
    }

    // Toplam bilgileri
    let yPosition = exchangeRates.error ? 58 : 51;

    doc.text(
      `Toplam TRY: ${totalAmountTRY.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} TRY`,
      14,
      yPosition,
    );
    doc.text(
      `Toplam EUR: ${totalAmountEUR.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} EUR (${totalAmountEURinTRY.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} TRY)`,
      14,
      yPosition + 7,
    );
    doc.text(
      `Toplam USD: ${totalAmountUSD.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD (${totalAmountUSDinTRY.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} TRY)`,
      14,
      yPosition + 14,
    );
    doc.text(
      `Genel Toplam (TRY): ${totalAmountAll.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} TRY`,
      14,
      yPosition + 21,
    );

    // Table data
    const tableData = filteredPurchases.map((purchase, index) => [
      index + 1,
      new Date(purchase.tarih).toLocaleDateString("tr-TR"),
      getSupplierName(purchase.tedarikciId),
      getProductName(purchase),
      purchase.miktar || 0,
      purchase.belgeNo || "",
      purchase.paraBirimi || "TRY",
      purchase.toplam
        ? `${purchase.toplam.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} ${purchase.paraBirimi || "TRY"}`
        : `0 ${purchase.paraBirimi || "TRY"}`,
      purchase.durumu === 1 ? "Faturalasmis" : "Iptal",
    ]);

    doc.autoTable({
      startY: yPosition + 28,
      head: [
        [
          "No",
          "Tarih",
          "Tedarikci",
          "Urun Adi",
          "Miktar",
          "Belge No",
          "Para Birimi",
          "Tutar",
          "Durumu",
        ],
      ],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 101, 168],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 25 },
        2: { cellWidth: 55 },
        3: { cellWidth: 75 },
        4: { cellWidth: 20 },
        5: { cellWidth: 30 },
        6: { cellWidth: 20 },
        7: { cellWidth: 30 },
        8: { cellWidth: 25 },
      },
    });

    doc.save(
      `Alışlar_${new Date().toLocaleDateString("tr-TR").replace(/\./g, "-")}.pdf`,
    );
    addToast("PDF dosyası başarıyla indirildi.", "success");
  };

  const handleDeleteClick = (id) => {
    setSelectedPurchaseId(id);
    setDeleteModalVisible(true);
  };

  const handleDeleteConfirm = async () => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      setDeleteModalVisible(false);
      setSelectedPurchaseId(null);
      return;
    }

    try {
      await api.delete(`${API_BASE_URL}/alis/alis-delete/${selectedPurchaseId}/${userId}`, {
        headers: { accept: "*/*" },
      });
      addToast("Alış başarıyla silindi.", "success");
      handleCancelPurchase(selectedPurchaseId);
      setDeleteModalVisible(false);
      setSelectedPurchaseId(null);
    } catch (err) {
      console.error("Alış silinirken hata:", err);
      const errorMessage =
        err.response?.status === 404
          ? `Alış ID ${selectedPurchaseId} bulunamadı.`
          : err.response?.data?.message ||
            err.response?.data?.error ||
            "Alış silinemedi. Lütfen tekrar deneyin.";
      addToast(errorMessage, "error");
      setDeleteModalVisible(false);
      setSelectedPurchaseId(null);
    }
  };

  return (
    <>
      {/* Total Amount Display and Export Buttons */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          marginBottom: "20px",
          borderRadius: "5px",
          border: "1px solid #dee2e6",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "15px",
          }}
        >
          <div style={{ flex: 1 }}>
            <h5 style={{ margin: 0, color: "#2965A8", marginBottom: "10px" }}>
              Genel Toplam (TRY):{" "}
              {totalAmountAll.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              TRY
            </h5>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "#2965A8", fontWeight: "bold" }}>
                TRY:{" "}
                {totalAmountTRY.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TRY
              </span>
              <span style={{ color: "#28a745", fontWeight: "bold" }}>
                EUR:{" "}
                {totalAmountEUR.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                EUR ≈{" "}
                {totalAmountEURinTRY.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TRY
              </span>
              <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                USD:{" "}
                {totalAmountUSD.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                USD ≈{" "}
                {totalAmountUSDinTRY.toLocaleString("tr-TR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                TRY
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              minWidth: "250px",
            }}
          >
            {/* Döviz Kuru Bilgileri */}
            <div
              style={{
                backgroundColor: "#e9ecef",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #dee2e6",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  marginBottom: "5px",
                  color: "#495057",
                }}
              >
                Döviz Kurları
              </div>
              <div style={{ fontSize: "13px", color: "#6c757d" }}>
                <div>USD: {exchangeRates.USD.toFixed(2)} TRY</div>
                <div>EUR: {exchangeRates.EUR.toFixed(2)} TRY</div>
                {exchangeRates.lastUpdated && (
                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "5px",
                      color: "#868e96",
                    }}
                  >
                    Son güncelleme: {formatDate(exchangeRates.lastUpdated)}
                  </div>
                )}
                {exchangeRates.error && (
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dc3545",
                      marginTop: "5px",
                    }}
                  >
                    {exchangeRates.error}
                  </div>
                )}
              </div>
              <CButton
                color="secondary"
                size="sm"
                onClick={fetchExchangeRatesFast}
                disabled={exchangeRates.loading}
                style={{ marginTop: "8px", fontSize: "12px" }}
              >
                <CIcon icon={cilReload} style={{ marginRight: "5px" }} />
                {exchangeRates.loading
                  ? "Güncelleniyor..."
                  : "Kurları Güncelle"}
              </CButton>
            </div>

            {/* Export Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              <CButton
                color="success"
                size="sm"
                onClick={exportToExcel}
                style={{ color: "white", flex: 1 }}
              >
                <CIcon icon={cilFile} style={{ marginRight: "5px" }} />
                Excel
              </CButton>
              <CButton
                color="danger"
                size="sm"
                onClick={exportToPDF}
                style={{ color: "white", flex: "1" }}
              >
                <CIcon icon={cilSave} style={{ marginRight: "5px" }} />
                PDF
              </CButton>
            </div>
          </div>
        </div>
      </div>

      {/* Tablo ve diğer bileşenler aynı kalacak */}
      <CTable hover responsive>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>No</CTableHeaderCell>
            <CTableHeaderCell>Tarih</CTableHeaderCell>
            <CTableHeaderCell>Tedarikçi</CTableHeaderCell>
            <CTableHeaderCell>Ürün Adı</CTableHeaderCell>
            <CTableHeaderCell>Miktar</CTableHeaderCell>
            <CTableHeaderCell>Belge No</CTableHeaderCell>
            <CTableHeaderCell>Para Birimi</CTableHeaderCell>
            <CTableHeaderCell>Tutar</CTableHeaderCell>
            <CTableHeaderCell>Durumu</CTableHeaderCell>
            <CTableHeaderCell>İşlemler</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {currentItems.map((purchase, index) => (
            <CTableRow key={purchase.id}>
              <CTableDataCell>{indexOfFirstItem + index + 1}</CTableDataCell>
              <CTableDataCell>
                {new Date(purchase.tarih).toLocaleDateString("tr-TR")}
              </CTableDataCell>
              <CTableDataCell>
                {getSupplierName(purchase.tedarikciId)}
              </CTableDataCell>
              <CTableDataCell>{getProductName(purchase)}</CTableDataCell>
              <CTableDataCell>{purchase.miktar}</CTableDataCell>
              <CTableDataCell>{purchase.belgeNo || "-"}</CTableDataCell>
              <CTableDataCell>{purchase.paraBirimi || "TRY"}</CTableDataCell>
              <CTableDataCell>
                {purchase.toplam
                  ? purchase.toplam.toLocaleString("tr-TR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) + ` ${purchase.paraBirimi || "TRY"}`
                  : `0 ${purchase.paraBirimi || "TRY"}`}
              </CTableDataCell>
              <CTableDataCell>
                {purchase.durumu === 1 ? "Faturalaşmış" : "İptal"}
              </CTableDataCell>
              <CTableDataCell>
                <div style={{ display: "flex", gap: "10px" }}>
                  <CButton
                    color="info"
                    size="sm"
                    onClick={() =>
                      navigate("/app/purchases/purchase-detail", {
                        state: { purchaseId: purchase.id || null },
                      })
                    }
                    style={{
                      color: "white",
                    }}
                  >
                    <CIcon icon={cilPencil} />
                  </CButton>
                  <CButton
                    color="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(purchase.id)}
                    style={{
                      color: "white",
                    }}
                  >
                    <CIcon icon={cilTrash} />
                  </CButton>
                </div>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginTop: "20px",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span style={{ color: "#6c757d" }}>
            Sayfa {currentPage} / {totalPages} ({filteredPurchases.length}{" "}
            kayıt)
          </span>
          <CPagination aria-label="Sayfalama">
            <CPaginationItem
              aria-label="Önceki"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              style={{ cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >
              Önceki
            </CPaginationItem>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <CPaginationItem
                key={page}
                active={page === currentPage}
                onClick={() => setCurrentPage(page)}
                style={{ cursor: "pointer" }}
              >
                {page}
              </CPaginationItem>
            ))}

            <CPaginationItem
              aria-label="Sonraki"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              style={{
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Sonraki
            </CPaginationItem>
          </CPagination>
        </div>
      )}

      <CModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedPurchaseId(null);
        }}
      >
        <CModalHeader>
          <CModalTitle>Alışı Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Bu alışı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setDeleteModalVisible(false);
              setSelectedPurchaseId(null);
            }}
          >
            Hayır
          </CButton>
          <CButton color="danger" onClick={handleDeleteConfirm}>
            Evet
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default PurchasesTable;