import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import PurchasesContext from "../../../context/PurchasesContext";
import PurchasesHeader from "../../../components/purchases/PurchasesHeader";
import PurchasesCard from "../../../components/purchases/PurchasesCard";
import SupplierModal from "../../../components/purchases/SupplierModal";
import api from "../../../api/api";
import ErrorBoundary from "../products/ErrorBoundary";
const API_BASE_URL = "https://localhost:44375/api";

const Purchases = () => {
  const [toasts, setToasts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState("Tümünü seç");
  const [timeFilter, setTimeFilter] = useState("Tamamını Göster");
  const [searchType, setSearchType] = useState("Tedarikçi İsmi / Belge No");
  const [contentType, setContentType] = useState("Ürünler");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const toaster = useRef();
  const navigate = useNavigate();
  const location = useLocation();

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

  const addToast = (message, type = "success") => {
    const toast = (
      <CToast key={Date.now()} autohide={true} visible={true} delay={5000}>
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

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      console.log("metod:fetchPurchases");
      const { data } = await api.get(
        `${API_BASE_URL}/alis/alis-get-all`,
        { headers: { accept: "*/*" } }
      );
      console.log(
        "Fetched Purchases (Full Data):",
        JSON.stringify(data, null, 2),
      );
      data.forEach((purchase, index) => {
        console.log(`Purchase ${index + 1}:`, {
          id: purchase.id,
          toplam: purchase.toplam,
          urunAdi: purchase.Urun?.Adi || "Bilinmiyor",
          tedarikciId: purchase.tedarikciId,
          belgeNo: purchase.belgeNo,
          tarih: purchase.tarih,
          durumu: purchase.durumu,
          urun: purchase.Urun,
        });
      });
      setPurchases(data);
      setError(null);
    } catch (err) {
      console.error("Fetch Purchases Error:", err.response?.data || err);
      setError(err.response?.data?.message || "Alışlar yüklenemedi.");
      addToast("Alışlar yüklenemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/tedarikci/tedarikci-get-all`,
        { headers: { accept: "*/*" } },
      );
      setSuppliers(data.filter((item) => item.durumu === 1));
    } catch (err) {
      console.error("Fetch Suppliers Error:", err.response?.data || err);
      addToast("Tedarikçiler yüklenemedi.", "error");
    }
  };

  const handleCancelPurchase = async (purchaseId) => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      await api.delete(
        `${API_BASE_URL}/alis/alis-delete/${purchaseId}/${userId}`,
        { headers: { accept: "*/*" } }
      );
      addToast("Alış başarıyla iptal edildi.", "success");
      fetchPurchases();
    } catch (err) {
      console.error("Alış iptal edilirken hata:", err.response?.data || err);
      addToast("Alış iptal edilemedi.", "error");
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchSuppliers();
  }, [location]);

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesDocType =
      docTypeFilter === "Tümünü seç" ||
      purchase.docType === docTypeFilter ||
      (docTypeFilter === "Faturalaşmış" && purchase.durumu === 1);

    const matchesTime = () => {
      const purchaseDate = new Date(purchase.tarih);
      const now = new Date();
      if (timeFilter === "Bu yılın Satışlarını Göster") {
        return purchaseDate.getFullYear() === now.getFullYear();
      } else if (timeFilter === "Son 1 Ay") {
        return purchaseDate >= new Date(now.setMonth(now.getMonth() - 1));
      } else if (timeFilter === "Son 3 Ay") {
        return purchaseDate >= new Date(now.setMonth(now.getMonth() - 3));
      } else if (timeFilter === "Bugün") {
        return purchaseDate.toDateString() === new Date().toDateString();
      }
      return true;
    };

    const matchesSearch = () => {
      if (searchTerm.length < 3) return true;
      const term = searchTerm.toLowerCase();
      if (searchType === "Tedarikçi İsmi / Belge No") {
        return (
          (purchase.tedarikciId &&
            suppliers
              .find((s) => s.id === purchase.tedarikciId)
              ?.unvan?.toLowerCase()
              .includes(term)) ||
          purchase.belgeNo?.toLowerCase().includes(term)
        );
      } else if (searchType === "Ürün Adı / Kodu / Barkodu") {
        return (
          purchase.Urun?.Adi?.toLowerCase().includes(term) ||
          purchase.Urun?.UrunKodu?.toLowerCase().includes(term) ||
          purchase.Urun?.Barkod?.toLowerCase().includes(term)
        );
      } else if (searchType === "Belge Açıklaması") {
        return purchase.aciklamaAlis?.toLowerCase().includes(term);
      } else if (searchType === "Satır Açıklaması") {
        return purchase.aciklamaUrun?.toLowerCase().includes(term);
      }
      return true;
    };

    const matchesCancelled = showCancelled ? true : purchase.durumu !== 0;

    return (
      matchesDocType && matchesTime() && matchesSearch() && matchesCancelled
    );
  });

  return (
    <ErrorBoundary>
      <PurchasesContext.Provider
        value={{
          toasts,
          setToasts,
          purchases,
          setPurchases,
          suppliers,
          setSuppliers,
          loading,
          setLoading,
          error,
          setError,
          showCancelled,
          setShowCancelled,
          searchTerm,
          setSearchTerm,
          docTypeFilter,
          setDocTypeFilter,
          timeFilter,
          setTimeFilter,
          searchType,
          setSearchType,
          contentType,
          setContentType,
          showSupplierModal,
          setShowSupplierModal,
          addToast,
          navigate,
          filteredPurchases,
          handleCancelPurchase,
        }}
      >
        <CToaster ref={toaster} placement="top-end" className="p-3">
          {toasts}
        </CToaster>
        <CRow className="mb-3">
          <CCol>
            <PurchasesHeader />
          </CCol>
        </CRow>
        <PurchasesCard />
        <SupplierModal />
      </PurchasesContext.Provider>
    </ErrorBoundary>
  );
};

export default Purchases;