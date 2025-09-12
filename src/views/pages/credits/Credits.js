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
  CFormSwitch,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus } from "@coreui/icons";
import CreditTable from "../../../components/credits/CreditTable";
import CreditModal from "../../../components/credits/CreditModal";
import axios from "axios";

const Credits = () => {
  const [toasts, setToasts] = useState([]);
  const [credits, setCredits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPaidCredits, setShowPaidCredits] = useState(false);
  const [remainingPayments, setRemainingPayments] = useState(0);
  const [monthlyPayments, setMonthlyPayments] = useState(0);
  const toaster = useRef();
  const navigate = useNavigate();

  const paymentScheduleMap = {
    1: "monthly",
    2: "bimonthly",
    3: "quarterly",
    4: "quadmonthly",
    6: "semiannually",
    12: "annually",
  };
const API_BASE_URL = "https://speedsofttest.com/api";

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

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/Hesap/hesap-get-allaktif`,
        {
          headers: { accept: "*/*" },
        },
      );
      console.log("Hesaplar API response (Hesap/hesap-get-allaktif):", data);
      setAccounts(data);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Hesaplar yüklenemedi.";
      console.error("Hesaplar yüklenemedi:", err);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_BASE_URL}/kredi/get-all`,
        {
          headers: { accept: "*/*" },
        },
      );
      console.log("Krediler API response (kredi/get-all):", data);

      const mappedCredits = data
        .filter((credit) => credit.durumu === 1)
        .map((credit) => ({
          id: credit.id,
          name: credit.adi || `Kredi ${credit.id}`,
          totalAmount: credit.kalanBorc || 0,
          remainingAmount: credit.kalanBorc || 0,
          installmentCount: credit.kalanTaksit || 0,
          nextPaymentDate: credit.ilkTaksitTarih
            ? new Date(credit.ilkTaksitTarih).toISOString()
            : new Date().toISOString(),
          paymentSchedule: paymentScheduleMap[credit.odemeTakvim] || "monthly",
          accountId: credit.hesapId || 0,
          account: credit.hesap || { tanim: "Bilinmeyen Hesap" },
          notes: credit.notlar || "",
          durumu: credit.durumu !== undefined ? credit.durumu : 1,
        }));

      setCredits(mappedCredits);
      calculatePayments(mappedCredits);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Krediler yüklenemedi.";
      console.error("Krediler yüklenemedi:", err);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const calculatePayments = (credits) => {
    const activeCredits = credits.filter((credit) => credit.durumu === 1);
    const totalRemaining = activeCredits.reduce(
      (sum, credit) => sum + (credit.remainingAmount || 0),
      0,
    );

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const totalMonthly = activeCredits.reduce((sum, credit) => {
      if (!credit.nextPaymentDate) return sum;

      const paymentDate = new Date(credit.nextPaymentDate);
      if (
        paymentDate.getMonth() === currentMonth &&
        paymentDate.getFullYear() === currentYear
      ) {
        const installmentAmount =
          (credit.totalAmount || 0) / (credit.installmentCount || 1);
        return sum + installmentAmount;
      }
      return sum;
    }, 0);

    setRemainingPayments(totalRemaining);
    setMonthlyPayments(totalMonthly);
  };

  const handleCreditClick = (credit) => {
    try {
      if (!credit || !credit.id) {
        throw new Error("Geçersiz kredi verisi");
      }
      // Store credit data in sessionStorage
      sessionStorage.setItem("selectedCredit", JSON.stringify(credit));
      console.log(`Kredi detayına yönlendiriliyor, ID: ${credit.id}`);
      navigate("/app/credit-detail");
    } catch (error) {
      console.error("Yönlendirme hatası:", error);
      addToast("Kredi detayı açılamadı", "error");
    }
  };

  const handleNewCredit = () => {
    setShowModal(true);
  };

  const handleModalSubmit = async (creditData) => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    
    try {
      const odemeTakvim =
        Object.keys(paymentScheduleMap).find(
          (key) => paymentScheduleMap[key] === creditData.paymentSchedule,
        ) || 1;

      const payload = {
        Adi: creditData.name,
        KalanBorc: parseFloat(creditData.remainingAmount),
        KalanTaksit: parseInt(creditData.installmentCount),
        IlkTaksitTarih: creditData.nextPaymentDate,
        OdemeTakvim: odemeTakvim,
        HesapId: parseInt(creditData.accountId),
        Notlar: creditData.notes,
        Durumu: 1,
        kullaniciId: userId, // Kullanıcı ID'si eklendi
      };

      console.log("Kredi create payload:", payload);

      const response = await axios.post(
        `${API_BASE_URL}/kredi/create`,
        payload,
      );
      console.log("Kredi create API response (kredi/create):", response.data);

      if (response.data) {
        addToast("Kredi başarıyla eklendi.", "success");
        fetchCredits();
        setShowModal(false);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.Message || "Kredi eklenemedi: Bilinmeyen hata";
      console.error("Kredi ekleme hatası:", err);
      addToast(errorMessage, "error");
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchCredits();
  }, []);

  const filteredCredits = showPaidCredits
    ? credits
    : credits.filter(
        (credit) => (credit.remainingAmount || 0) > 0 && credit.durumu === 1,
      );

  return (
    <>
      <style>
        {`
          .custom-form-switch .form-check-input:checked {
            background-color: #34A149 !important;
            border-color: #2965A8 !important;
          }
          .custom-form-switch .form-check-input:checked::after {
            background-color: #ffffff !important;
          }
          .custom-form-switch .form-check-input:focus {
            box-shadow: 0 0 0 0.25rem rgba(41, 101, 168, 0.25) !important;
          }
          .custom-form-switch .form-check-label {
            color: #fff;
          }
          .custom-form-switch .form-check-input {
            transition: background-color 0.3s ease;
          }
        `}
      </style>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts}
      </CToaster>
      <CRow className="d-flex justify-content-between mb-3">
        <CCol>
          <CButton
            color="info"
            className="text-light"
            onClick={handleNewCredit}
          >
            <CIcon icon={cilPlus} /> Yeni Kredi Ekle
          </CButton>
        </CCol>
        <CCol className="d-flex gap-3 justify-content-end">
          <CCard className="p-3">
            <CCardBody>
              <h5>Kalan Ödemeler</h5>
              <p className="fw-bold fs-5 text-success">
                <span className="fs-4">₺</span>{" "}
                {remainingPayments.toLocaleString("tr-TR")}
              </p>
            </CCardBody>
          </CCard>
          <CCard className="p-3">
            <CCardBody>
              <h5>Bu Ayki Ödemeler</h5>
              <p className="fw-bold fs-5 text-warning">
                <span className="fs-4">₺</span>{" "}
                {monthlyPayments.toLocaleString("tr-TR")}
              </p>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
        >
          <div className="d-flex justify-content-between align-items-center">
            <span>Kredi Listesi</span>
            <CFormSwitch
              label="Borcu Bitenleri Göster"
              className="fs-6 custom-form-switch"
              checked={showPaidCredits}
              onChange={() => setShowPaidCredits(!showPaidCredits)}
              style={{
                backgroundColor: "#ccc",
                borderColor: "#ccc",
              }}
            />
          </div>
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          {error && <p className="text-danger">{error}</p>}
          {!loading && !error && (
            <CreditTable
              credits={filteredCredits}
              onCreditClick={handleCreditClick}
            />
          )}
        </CCardBody>
      </CCard>
      <CreditModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        addToast={addToast}
        accounts={accounts}
      />
    </>
  );
};

export default Credits;
