import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CreditModal from "../../../components/credits/CreditModal";
import dayjs from "dayjs";
import axios from "axios";
import DatePickerField from "../../../components/credits/DatePickerField";
import CIcon from "@coreui/icons-react";
import { cilCalendar, cilPen, cilTrash } from "@coreui/icons";

const paymentScheduleMap = {
  1: "Aylık",
  2: "İki Aylık",
  3: "Üç Aylık",
  4: "Dört Aylık",
  6: "Altı Aylık",
  12: "Yıllık",
};

const CreditDetail = () => {
  const navigate = useNavigate();
  const [credit, setCredit] = useState(null);
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [modalState, setModalState] = useState({
    update: false,
    payment: false,
    delete: false,
  });
  const [paymentForm, setPaymentForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    amount: "",
    hesapId: "",
    kullaniciId: 0,
  });
  const API_BASE_URL = "https://localhost:44375/api";

  const [paymentDate, setPaymentDate] = useState(dayjs());
  const toaster = useRef();

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

  const fetchCredit = useCallback(async () => {
    setLoading(true);
    try {
      const storedCredit = sessionStorage.getItem("selectedCredit");
      if (!storedCredit) {
        throw new Error("Kredi verisi bulunamadı.");
      }
      const parsedCredit = JSON.parse(storedCredit);
      if (!parsedCredit.id) {
        throw new Error("Geçersiz kredi verisi: ID eksik.");
      }
      parsedCredit.adi =
        parsedCredit.kredi?.adi || parsedCredit.name || "İsimsiz Kredi";
      parsedCredit.hesapName = parsedCredit.hesapName || "Bilinmeyen Hesap";
      parsedCredit.hesapId = parsedCredit.hesapId || null;
      parsedCredit.notlar = parsedCredit.kredi?.notlar || parsedCredit.notlar || "-";
      console.log("Credits verisi (parsedCredit):", parsedCredit);
      setCredit(parsedCredit);
      setError(null);
    } catch (err) {
      const errorMessage = err.message || "Kredi yüklenemedi.";
      setError(errorMessage);
      addToast(errorMessage, "error");
      navigate("/app/credits");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const storedCredit = sessionStorage.getItem("selectedCredit");
      if (!storedCredit) {
        throw new Error("Kredi verisi bulunamadı.");
      }
      const parsedCredit = JSON.parse(storedCredit);
      const creditId = parsedCredit.id;

      const { data } = await axios.get(
        `${API_BASE_URL}/kredi/kredidetay-get-by-id/${creditId}`,
        {
          headers: { accept: "*/*" },
        },
      );
      console.log("Ödemeler API response (kredi/kredidetay-get-by-id):", data);

      const paymentData = data;
      const mappedPayments = Array.isArray(paymentData)
        ? paymentData.map((payment, index) => ({
            id: payment.id || index + 1,
            creditId: payment.krediId || parseInt(creditId),
            date: payment.tarih
              ? new Date(payment.tarih).toISOString()
              : new Date().toISOString(),
            amount: payment.tutar || 0,
            hesapId: payment.hesapId,
            hesapname: payment.hesap?.tanim || "Bilinmeyen Hesap",
            paid: payment.odemeDurum === 1,
            installmentNumber: payment.taksitNo || index + 1,
          }))
        : [];
      setPayments(mappedPayments);
      setError(null);
    } catch (err) {
      const errorMessage =
        err.response?.data?.Message || "Ödemeler yüklenemedi.";
      setError(errorMessage);
      addToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payments.length > 0) {
      const kalanBorc = payments
        .filter((p) => !p.paid)
        .reduce((total, p) => total + (p.amount || 0), 0);

      const kalanTaksit = payments.filter((p) => !p.paid).length;

      const sorted = [...payments].sort(
        (a, b) => new Date(a.date) - new Date(b.date),
      );

      const firstDateFormatted = sorted[0]?.date
        ? dayjs(sorted[0].date).format("DD/MM/YYYY")
        : "-";

      let odemeAralik = "Bilinmiyor";
      if (sorted.length >= 2) {
        const monthDiff = dayjs(sorted[1].date).diff(
          dayjs(sorted[0].date),
          "month",
        );
        if (monthDiff > 0) {
          odemeAralik = monthDiff === 1 ? "Aylık" : `${monthDiff} ayda 1`;
        }
      }

      setCredit((prev) => ({
        ...prev,
        kalanBorc,
        kalanTaksit,
        odemeTakvimText: odemeAralik,
        ilkTaksitTarihi: firstDateFormatted,
      }));
    }
  }, [payments]);

  useEffect(() => {
    fetchAccounts();
    fetchCredit();
    fetchPayments();
    return () => {
      sessionStorage.removeItem("selectedCredit");
    };
  }, [fetchCredit]);

  const handleUpdateModal = () => {
    setModalState((prev) => ({ ...prev, update: true }));
  };

  const handlePaymentModal = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    if (!paymentForm.date || !paymentForm.amount) {
      addToast("Tarih ve tutar zorunlu.", "error");
      return;
    }
    try {
      const storedCredit = sessionStorage.getItem("selectedCredit");
      if (!storedCredit) {
        throw new Error("Kredi verisi bulunamadı.");
      }
      const parsedCredit = JSON.parse(storedCredit);
      const creditId = parsedCredit.id;

      let hesapId = paymentForm.hesapId || parsedCredit.hesapId;

      if (!hesapId && payments.length > 0) {
        hesapId = payments[0].hesapId;
      }

      if (!hesapId) {
        addToast("Lütfen hesap seçin.", "error");
        return;
      }

      console.log("Credit data:", parsedCredit);
      console.log("Selected hesapId:", hesapId);

      const payload = {
        KrediId: parseInt(creditId),
        HesapId: parseInt(hesapId),
        Tarih: paymentForm.date,
        Tutar: parseFloat(paymentForm.amount),
        OdemeDurum: 0,
        TaksitNo: payments.length + 1,
        kullaniciId: userId,
      };

      console.log("Ödeme ekleme payload:", payload);

      const response = await axios.post(
        `${API_BASE_URL}/kredi/kredidetay-create`,
        payload,
      );
      console.log("Ödeme ekleme API response (kredi/kredidetay-create):", response.data);

      if (response.data) {
        const newPayment = {
          id: response.data.id || payments.length + 1,
          creditId: parseInt(creditId),
          date: paymentForm.date,
          amount: parseFloat(paymentForm.amount),
          hesapId: parseInt(hesapId),
          hesapname:
            accounts.find((a) => a.id === parseInt(hesapId))
              ?.tanim || "Bilinmeyen Hesap",
          paid: false,
          installmentNumber: payments.length + 1,
        };
        setPayments([...payments, newPayment]);
        addToast("Ödeme eklendi.", "success");
        setModalState((prev) => ({ ...prev, payment: false }));
        setPaymentForm({
          date: dayjs().format("YYYY-MM-DD"),
          amount: "",
          hesapId: "",
          kullaniciId: userId,
        });
        setPaymentDate(dayjs());
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.Message || err.message || "Bilinmeyen hata";
      addToast(`Ödeme eklenemedi: ${errorMessage}`, "error");
      console.error("Payment creation error:", err);
    }
  };

  const handleDeleteModal = async () => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      const storedCredit = sessionStorage.getItem("selectedCredit");
      if (!storedCredit) {
        throw new Error("Kredi verisi bulunamadı.");
      }
      const parsedCredit = JSON.parse(storedCredit);
      const creditId = parsedCredit.id;

      console.log("Kredi silme isteği: ID =", creditId, "Kullanıcı ID =", userId);

      const response = await axios.delete(
        `${API_BASE_URL}/kredi/delete/${creditId}?kullaniciId=${userId}`,
        {
          headers: { accept: "*/*" },
        },
      );
      console.log("Kredi delete API response (kredi/delete):", response.data);

      addToast("Kredi başarıyla silindi.", "success");
      sessionStorage.removeItem("selectedCredit");
      navigate("/app/credits");
    } catch (err) {
      const errorMessage =
        err.response?.data?.Message || err.message || "Bilinmeyen hata";
      addToast(`Kredi silinemedi: ${errorMessage}`, "error");
    } finally {
      setModalState((prev) => ({ ...prev, delete: false }));
    }
  };

  const handlePaymentMake = async (paymentId) => {
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }

    try {
      const storedCredit = sessionStorage.getItem("selectedCredit");
      if (!storedCredit) {
        throw new Error("Kredi verisi bulunamadı.");
      }
      const parsedCredit = JSON.parse(storedCredit);
      const creditId = parsedCredit.id;

      const payload = {
        Id: paymentId,
        KrediId: parseInt(creditId),
        OdemeDurum: 1,
        kullaniciId: userId,
      };

      console.log("Ödeme yapma payload:", payload);

      const response = await axios.put(
        `${API_BASE_URL}/kredi/kredidetay-update/${paymentId}`,
        payload,
      );
      console.log("Ödeme yapma API response (kredi/kredidetay-update):", response.data);

      const updatedPayments = payments.map((p) =>
        p.id === paymentId ? { ...p, paid: true } : p,
      );
      console.log("Updated payments:", updatedPayments);
      setPayments(updatedPayments);
      addToast("Ödeme işlemi başlatıldı.", "success");
    } catch (err) {
      const errorMessage =
        err.response?.data?.Message || err.message || "Bilinmeyen hata";
      addToast(`Ödeme işlemi başarısız: ${errorMessage}`, "error");
    }
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (error || !credit) {
    return (
      <CCard>
        <CCardHeader>Kredi Bilgisi</CCardHeader>
        <CCardBody>
          <p>{error || "Kredi bulunamadı."}</p>
          <CButton color="primary" onClick={() => navigate("/app/credits")}>
            Geri Dön
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
              className="fw-bold fs-4"
              style={{ backgroundColor: "#2965A8", color: "#fff" }}
            >
              {credit.kredi?.adi || credit.adi || "Kredi Adı Bulunamadı"}
            </CCardHeader>
            <CCardBody>
              <p>
                <strong>Kalan Tutar:</strong>{" "}
                {credit.kalanBorc !== undefined && credit.kalanBorc !== null
                  ? credit.kalanBorc.toLocaleString("tr-TR")
                  : "Bilinmeyen"}{" "}
                TRY
              </p>
              <p>
                <strong>Kalan Taksit:</strong>{" "}
                {credit.kalanTaksit !== undefined
                  ? credit.kalanTaksit
                  : "Bilinmeyen"}
              </p>
              <p>
                <strong>Ödeme Planı:</strong>{" "}
                {credit.odemeTakvimText ||
                  paymentScheduleMap[credit.kredi?.odemeTakvim] ||
                  "Bilinmeyen"}
              </p>
              <p>
                <strong>İlk Taksit Tarihi:</strong>{" "}
                {credit.ilkTaksitTarihi ||
                  (credit.kredi?.ilkTaksitTarih
                    ? dayjs(credit.kredi.ilkTaksitTarih).format("DD/MM/YYYY")
                    : "-")}
              </p>
              <p>
                <strong>Notlar:</strong>{" "}
                {credit.notlar || credit.kredi?.notlar || "-"}
              </p>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol xs={12} className="my-3">
          <div className="d-flex gap-2">
            <CButton
              color="info"
              style={{ color: "white" }}
              onClick={handleUpdateModal}
            >
              <CIcon icon={cilPen} /> Güncelle
            </CButton>
            <CButton
              color="warning"
              style={{ color: "white" }}
              onClick={() =>
                setModalState((prev) => ({ ...prev, payment: true }))
              }
            >
              <CIcon icon={cilCalendar} /> Taksit Tarihi Ekle
            </CButton>
            <CButton
              color="danger"
              style={{ color: "white" }}
              onClick={() =>
                setModalState((prev) => ({ ...prev, delete: true }))
              }
            >
              <CIcon icon={cilTrash} /> Krediyi Sil
            </CButton>
          </div>
        </CCol>
        <CCol xs={12}>
          <CCard>
            <CCardHeader>Ödeme Tarihleri</CCardHeader>
            <CCardBody>
              <CTable responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Taksit No</CTableHeaderCell>
                    <CTableHeaderCell>Tarih</CTableHeaderCell>
                    <CTableHeaderCell>Tutar</CTableHeaderCell>
                    <CTableHeaderCell>Hesap</CTableHeaderCell>
                    <CTableHeaderCell>Ödenen</CTableHeaderCell>
                    <CTableHeaderCell>İşlem</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {payments.length > 0 ? (
                    payments.map((payment) => (
                      <CTableRow key={payment.id}>
                        <CTableDataCell>
                          {payment.installmentNumber || "-"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {payment.date
                            ? dayjs(payment.date).format("DD.MM.YYYY")
                            : "-"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {payment.amount !== undefined &&
                          payment.amount !== null
                            ? payment.amount.toLocaleString("tr-TR")
                            : "Bilinmeyen"}{" "}
                          TRY
                        </CTableDataCell>
                        <CTableDataCell>
                          {payment.hesapname || "Bilinmeyen Hesap"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {payment.paid ? "Evet" : "Hayır"}
                        </CTableDataCell>
                        <CTableDataCell>
                          {payment.paid ? (
                            <span>Ödeme Yapıldı</span>
                          ) : (
                            <CButton
                              color="success"
                              style={{ color: "white" }}
                              size="sm"
                              onClick={() => handlePaymentMake(payment.id)}
                            >
                              Ödeme Yap
                            </CButton>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  ) : (
                    <CTableRow>
                      <CTableDataCell colSpan="6">
                        Ödeme planı bulunamadı.
                      </CTableDataCell>
                    </CTableRow>
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CreditModal
        visible={modalState.update}
        onClose={() => setModalState((prev) => ({ ...prev, update: false }))}
        onSubmit={async (data) => {
          try {
            const storedCredit = sessionStorage.getItem("selectedCredit");
            if (!storedCredit) {
              throw new Error("Kredi verisi bulunamadı.");
            }
            const parsedCredit = JSON.parse(storedCredit);
            const creditId = parsedCredit.id;

            const odemeTakvim =
              Object.keys(paymentScheduleMap).find(
                (key) => paymentScheduleMap[key] === data.paymentSchedule,
              ) || 1;

            const userId = getUserId();
            if (!userId) {
              addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
              return;
            }

            const payload = {
              Id: creditId,
              Adi: data.name,
              KalanBorc: parseFloat(data.remainingAmount),
              KalanTaksit: parseInt(data.installmentCount),
              IlkTaksitTarih: data.nextPaymentDate,
              OdemeTakvim: odemeTakvim,
              HesapId: parseInt(data.accountId),
              Notlar: data.notes,
              Durumu: 1,
              EklenmeTarihi: parsedCredit.eklenmeTarihi,
              GuncellenmeTarihi: new Date().toISOString(),
              kullaniciId: userId,
            };

            console.log("Kredi güncelleme payload:", payload);

            const response = await axios.put(
              `${API_BASE_URL}/kredi/update/${creditId}`,
              payload,
              {
                headers: { "Content-Type": "application/json" },
              },
            );
            console.log("Kredi update API response (kredi/update):", response.data);

            const updatedCredit = {
              ...parsedCredit,
              adi: data.name,
              kalanBorc: parseFloat(data.remainingAmount),
              kalanTaksit: parseInt(data.installmentCount),
              ilkTaksitTarih: data.nextPaymentDate,
              odemeTakvim: odemeTakvim,
              hesapId: parseInt(data.accountId),
              hesapName:
                accounts.find((a) => a.id === parseInt(data.accountId))
                  ?.tanim || "Bilinmeyen Hesap",
              notlar: data.notes,
              guncellenmeTarihi: new Date().toISOString(),
            };

            setCredit(updatedCredit);
            sessionStorage.setItem(
              "selectedCredit",
              JSON.stringify(updatedCredit),
            );
            addToast("Kredi güncellendi.", "success");
            setModalState((prev) => ({ ...prev, update: false }));
            fetchPayments();
          } catch (err) {
            const errorMessage =
              err.response?.data?.Message || err.message || "Bilinmeyen hata";
            addToast(`Kredi güncellenemedi: ${errorMessage}`, "error");
          }
        }}
        credit={{
          id: credit.id,
          name: credit.adi,
          remainingAmount: credit.kalanBorc,
          installmentCount: credit.kalanTaksit,
          nextPaymentDate:
            credit.ilkTaksitTarihi || credit.kredi?.ilkTaksitTarih,
          paymentSchedule:
            credit.odemeTakvimText ||
            paymentScheduleMap[credit.kredi?.odemeTakvim] ||
            "Aylık",
          accountId: credit.hesapId,
          notes: credit.notlar || credit.kredi?.notlar || "",
        }}
        addToast={addToast}
        accounts={accounts}
      />
      <CModal
        visible={modalState.payment}
        onClose={() => setModalState((prev) => ({ ...prev, payment: false }))}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#F6A213", color: "white" }}>
          <CModalTitle>Taksit Tarihi Ekle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handlePaymentModal}>
            <DatePickerField
              label="Ödeme Tarihi"
              value={paymentDate}
              onChange={(date) => {
                setPaymentDate(date);
                setPaymentForm((prev) => ({
                  ...prev,
                  date: date ? date.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel>Hesap</CFormLabel>
            <CFormSelect
              value={paymentForm.hesapId}
              onChange={(e) =>
                setPaymentForm((prev) => ({ ...prev, hesapId: e.target.value }))
              }
              required
              className="mb-3"
            >
              <option value="">Hesap Seçin</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.tanim}
                </option>
              ))}
            </CFormSelect>
            <CFormLabel>Tutar</CFormLabel>
            <CFormInput
              type="number"
              name="amount"
              value={paymentForm.amount}
              onChange={(e) =>
                setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
              }
              required
              step="0.01"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="warning" style={{ color: "white" }} type="submit">
                Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() =>
                  setModalState((prev) => ({ ...prev, payment: false }))
                }
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
      <CModal
        visible={modalState.delete}
        onClose={() => setModalState((prev) => ({ ...prev, delete: false }))}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#dc3545", color: "#fff" }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            <strong>Dikkat!</strong> Kredi tanımı silinecektir. Bu kredi için
            daha önce ödeme yaptıysanız, ilgili hesap hareketleri
            silinmeyecektir. Bu işlemin geri dönüşü yoktur.
          </p>
          <p>Silme işlemini onaylıyor musunuz?</p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={handleDeleteModal}
          >
            Evet
          </CButton>
          <CButton
            color="secondary"
            onClick={() =>
              setModalState((prev) => ({ ...prev, delete: false }))
            }
          >
            Hayır
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default CreditDetail;
