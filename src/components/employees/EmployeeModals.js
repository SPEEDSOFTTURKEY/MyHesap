import { useEffect, useState } from "react";
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CButton,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilWarning } from "@coreui/icons";
import dayjs from "dayjs";
import api from "../../api/api";
import DatePickerField from "./DatePickerField";

const API_BASE_URL = "https://speedsofttest.com/api";

const EmployeeModals = ({
  modalState,
  setModalState,
  employeeId,
  onSubmit,
  addToast,
}) => {
  const [accounts, setAccounts] = useState([]);
  const [expenseMainCategories, setExpenseMainCategories] = useState([]);
  const [expenseSubCategories, setExpenseSubCategories] = useState([]);
  const [accrualForm, setAccrualForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    amount: "",
    currency: "TRY",
    expenseMainCategoryId: "",
    expenseSubCategoryId: "",
    description: "",
  });
  const [paymentForm, setPaymentForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    accountId: "",
    amount: "",
    currency: "TRY",
    description: "",
  });
  const [advanceReturnForm, setAdvanceReturnForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    accountId: "",
    amount: "",
    currency: "TRY",
    description: "",
  });
  const [debtCreditForm, setDebtCreditForm] = useState({
    transactionType: "Alacak",
    date: dayjs().format("YYYY-MM-DD"),
    amount: "",
    currency: "TRY",
    description: "",
    expenseMainCategoryId: "",
    expenseSubCategoryId: "",
  });
  const [expenseForm, setExpenseForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    documentNumber: "",
    expenseMainCategoryId: "",
    expenseSubCategoryId: "",
    amount: "",
    vatRate: "",
    currency: "TRY",
    description: "",
  });
  const [dateValue, setDateValue] = useState(dayjs());
  const [paymentDateValue, setPaymentDateValue] = useState(dayjs());
  const [advanceReturnDateValue, setAdvanceReturnDateValue] = useState(dayjs());
  const [debtCreditDateValue, setDebtCreditDateValue] = useState(dayjs());
  const [expenseDateValue, setExpenseDateValue] = useState(dayjs());
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (
      loading ||
      (accounts.length > 0 &&
        expenseMainCategories.length > 0 &&
        expenseSubCategories.length > 0)
    )
      return;
    try {
      setLoading(true);

      if (!accounts.length) {
        const accountsResponse = await api.get(`${API_BASE_URL}/Hesap/hesap-get-all`, {
          headers: { accept: "*/*" },
        });
        const accountsData = Array.isArray(accountsResponse.data)
          ? accountsResponse.data.map((account) => ({
              id: account.id,
              userName: account.tanim,
              currency: account.paraBirimi,
              balance: account.guncelBakiye,
              accountNumber: account.hesapNo,
              labelColor: account.etiketRengi,
              spendingLimit: account.harcamaLimiti,
              type: account.hesapKategoriId,
            }))
          : [];
        setAccounts(accountsData);
      }

      if (!expenseMainCategories.length) {
        const mainCategoriesResponse = await api.get(
          `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
          { headers: { accept: "*/*" } }
        );
        const mainCategoriesData = Array.isArray(mainCategoriesResponse.data)
          ? mainCategoriesResponse.data
          : [];
        setExpenseMainCategories(mainCategoriesData);
      }

      if (!expenseSubCategories.length) {
        const subCategoriesResponse = await api.get(
          `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-get-all`,
          { headers: { accept: "*/*" } }
        );
        const subCategoriesData = Array.isArray(subCategoriesResponse.data)
          ? subCategoriesResponse.data
          : [];
        setExpenseSubCategories(subCategoriesData);
      }
    } catch (err) {
      console.error("Veri çekme hatası:", err, err.response?.data);
      addToast(
        "Hesaplar veya masraf kategorileri yüklenemedi: " +
          (err.response?.data?.message || err.message),
        "hata"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      modalState.payment ||
      modalState.advanceReturn ||
      modalState.accrual ||
      modalState.debtCredit ||
      modalState.expense
    ) {
      fetchData();
    }
  }, [
    modalState.payment,
    modalState.advanceReturn,
    modalState.accrual,
    modalState.debtCredit,
    modalState.expense,
  ]);

  const fetchCurrentBalance = async () => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/calisancari/calisancaricalisan-get-by-Id/${employeeId}`
      );
      const transactions = Array.isArray(response.data) ? response.data : [];
      const totalBalance = transactions.reduce((sum, transaction) => {
        const borc = transaction.borc || 0;
        const alacak = transaction.alacak || 0;
        return sum + (alacak - borc);
      }, 0);
      return totalBalance;
    } catch (err) {
      console.error("Bakiye alınamadı:", err);
      addToast("Bakiye kontrolü başarısız.", "hata");
      throw err;
    }
  };

  const handleAccrualChange = (e) => {
    const { name, value } = e.target;
    setAccrualForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "expenseMainCategoryId" ? { expenseSubCategoryId: "" } : {}),
    }));
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdvanceReturnChange = (e) => {
    const { name, value } = e.target;
    setAdvanceReturnForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDebtCreditChange = (e) => {
    const { name, value } = e.target;
    setDebtCreditForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "expenseMainCategoryId" ? { expenseSubCategoryId: "" } : {}),
    }));
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "expenseMainCategoryId" ? { expenseSubCategoryId: "" } : {}),
    }));
  };

  const handleAccrualSubmit = async (e) => {
    e.preventDefault();
    if (
      !accrualForm.amount ||
      !accrualForm.expenseMainCategoryId ||
      !accrualForm.expenseSubCategoryId
    ) {
      addToast("Tutar ve masraf kategorileri zorunlu.", "hata");
      return;
    }
    try {
      setLoading(true);
      const amount = parseFloat(accrualForm.amount);
      const currentBalance = await fetchCurrentBalance();
      const newBalance = currentBalance + amount;

      const transactionObj = {
        id: 0,
        tarih: new Date(accrualForm.date).toISOString(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        masrafAnaKategoriId: parseInt(accrualForm.expenseMainCategoryId),
        masrafAltKategoriId: parseInt(accrualForm.expenseSubCategoryId),
        calisanId: parseInt(employeeId),
        durumu: 0, // Endpoint şemasına uygun
        aciklama: accrualForm.description || "Maaş/Prim tahakkuku",
        borc: 0,
        alacak: amount,
        bakiye: newBalance,
      };

      await api.post(`${API_BASE_URL}/calisancari/calisancari-create`, transactionObj);

      addToast("Maaş tahakkuku kaydedildi", "başarılı");
      setModalState((prev) => ({ ...prev, accrual: false }));
      setAccrualForm({
        date: dayjs().format("YYYY-MM-DD"),
        amount: "",
        currency: "TRY",
        expenseMainCategoryId: "",
        expenseSubCategoryId: "",
        description: "",
      });
      setDateValue(dayjs());
      onSubmit(employeeId);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Tahakkuk hatası:", {
        message: errorMessage,
        status: err.response?.status,
        url: err.config?.url,
        data: err.config?.data,
      });
      addToast("Maaş tahakkuku kaydedilemedi: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentForm.accountId || !paymentForm.amount) {
      addToast("Hesap ve tutar zorunlu.", "hata");
      return;
    }
    try {
      setLoading(true);
      const amount = parseFloat(paymentForm.amount);
      const currentBalance = await fetchCurrentBalance();
      const newBalance = currentBalance - amount;

      const transactionObj = {
        id: 0,
        tarih: new Date(paymentForm.date).toISOString(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        masrafAnaKategoriId: 0,
        masrafAltKategoriId: 0,
        calisanId: parseInt(employeeId),
        durumu: 0, // Endpoint şemasına uygun
        aciklama: paymentForm.description || "Maaş/Prim/Avans ödemesi",
        borc: amount,
        alacak: 0,
        bakiye: newBalance,
      };

      await api.post(`${API_BASE_URL}/calisancari/calisancari-create`, transactionObj);

      const account = accounts.find(
        (a) => a.id === parseInt(paymentForm.accountId)
      );
      const hareketObj = {
        id: 0,
        kullanicilarId: parseInt(employeeId),
        hesapId: parseInt(paymentForm.accountId),
        etkilenenHesapId: 0,
        hesapKategoriId: account.type,
        islemTarihi: new Date(paymentForm.date).toISOString(),
        islemTuruId: 2,
        bilgi: paymentForm.description,
        aciklama: "Maaş/Prim/Avans ödemesi",
        borc: amount,
        alacak: 0,
        bakiye: account.balance - amount,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, hareketObj);

      addToast("Ödeme kaydedildi", "başarılı");
      setModalState((prev) => ({ ...prev, payment: false }));
      setPaymentForm({
        date: dayjs().format("YYYY-MM-DD"),
        accountId: "",
        amount: "",
        currency: "TRY",
        description: "",
      });
      setPaymentDateValue(dayjs());
      onSubmit(employeeId);
    } catch (err) {
      const status = err.response?.status;
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Ödeme hatası:", {
        message: errorMessage,
        status: status,
        url: err.config?.url,
        data: err.config?.data,
      });
      addToast(
        `Ödeme kaydedilemedi: ${status ? `Durum ${status}, ` : ""}${errorMessage}`,
        "hata"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceReturnSubmit = async (e) => {
    e.preventDefault();
    if (!advanceReturnForm.accountId || !advanceReturnForm.amount) {
      addToast("Hesap ve tutar zorunlu.", "hata");
      return;
    }
    try {
      setLoading(true);
      const amount = parseFloat(advanceReturnForm.amount);
      const currentBalance = await fetchCurrentBalance();
      const newBalance = currentBalance + amount;

      const transactionObj = {
        id: 0,
        tarih: new Date(advanceReturnForm.date).toISOString(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        masrafAnaKategoriId: 0,
        masrafAltKategoriId: 0,
        calisanId: parseInt(employeeId),
        durumu: 0, // Endpoint şemasına uygun
        aciklama: advanceReturnForm.description || "Avans iadesi",
        borc: 0,
        alacak: amount,
        bakiye: newBalance,
      };

      await api.post(`${API_BASE_URL}/calisancari/calisancari-create`, transactionObj);

      const account = accounts.find(
        (a) => a.id === parseInt(advanceReturnForm.accountId)
      );
      const hareketObj = {
        id: 0,
        kullanicilarId: parseInt(employeeId),
        hesapId: parseInt(advanceReturnForm.accountId),
        etkilenenHesapId: 0,
        hesapKategoriId: account.type,
        islemTarihi: new Date(advanceReturnForm.date).toISOString(),
        islemTuruId: 1,
        bilgi: advanceReturnForm.description,
        aciklama: "Avans iadesi",
        borc: 0,
        alacak: amount,
        bakiye: account.balance + amount,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, hareketObj);

      addToast("Avans iadesi kaydedildi", "başarılı");
      setModalState((prev) => ({ ...prev, advanceReturn: false }));
      setAdvanceReturnForm({
        date: dayjs().format("YYYY-MM-DD"),
        accountId: "",
        amount: "",
        currency: "TRY",
        description: "",
      });
      setAdvanceReturnDateValue(dayjs());
      onSubmit(employeeId);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Avans iadesi hatası:", {
        message: errorMessage,
        status: err.response?.status,
        url: err.config?.url,
        data: err.config?.data,
      });
      addToast("Avans iadesi kaydedilemedi: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

  const handleDebtCreditSubmit = async (e) => {
    e.preventDefault();
    if (!debtCreditForm.amount) {
      addToast("Tutar zorunlu.", "hata");
      return;
    }
    try {
      setLoading(true);
      const amount = parseFloat(debtCreditForm.amount);
      const isDebt = debtCreditForm.transactionType === "Borç";
      const currentBalance = await fetchCurrentBalance();
      const newBalance = isDebt
        ? currentBalance - amount
        : currentBalance + amount;

      const transactionObj = {
        id: 0,
        tarih: new Date(debtCreditForm.date).toISOString(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        masrafAnaKategoriId:
          parseInt(debtCreditForm.expenseMainCategoryId) || 0,
        masrafAltKategoriId: parseInt(debtCreditForm.expenseSubCategoryId) || 0,
        calisanId: parseInt(employeeId),
        durumu: 0, // Endpoint şemasına uygun
        aciklama: debtCreditForm.description || "Borç/Alacak fişi",
        borc: isDebt ? amount : 0,
        alacak: isDebt ? 0 : amount,
        bakiye: newBalance,
      };

      await api.post(`${API_BASE_URL}/calisancari/calisancari-create`, transactionObj);

      addToast("Borç/Alacak fişi kaydedildi", "başarılı");
      setModalState((prev) => ({ ...prev, debtCredit: false }));
      setDebtCreditForm({
        transactionType: "Alacak",
        date: dayjs().format("YYYY-MM-DD"),
        amount: "",
        currency: "TRY",
        description: "",
        expenseMainCategoryId: "",
        expenseSubCategoryId: "",
      });
      setDebtCreditDateValue(dayjs());
      onSubmit(employeeId);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Borç/Alacak hatası:", {
        message: errorMessage,
        status: err.response?.status,
        url: err.config?.url,
        data: err.config?.data,
      });
      addToast("Borç/Alacak fişi kaydedilemedi: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (
      !expenseForm.amount ||
      !expenseForm.expenseMainCategoryId ||
      !expenseForm.expenseSubCategoryId
    ) {
      addToast("Tutar ve masraf kategorileri zorunlu.", "hata");
      return;
    }
    try {
      setLoading(true);
      const amount = parseFloat(expenseForm.amount);
      const currentBalance = await fetchCurrentBalance();
      const newBalance = currentBalance + amount;

      const transactionObj = {
        id: 0,
        tarih: new Date(expenseForm.date).toISOString(),
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        masrafAnaKategoriId: parseInt(expenseForm.expenseMainCategoryId),
        masrafAltKategoriId: parseInt(expenseForm.expenseSubCategoryId),
        calisanId: parseInt(employeeId),
        durumu: 0, // Endpoint şemasına uygun
        aciklama:
          expenseForm.description ||
          `Masraf kaydı: ${expenseForm.documentNumber}`,
        borc: 0,
        alacak: amount,
        bakiye: newBalance,
        fisBelgeNo: expenseForm.documentNumber || "",
        kdvOrani: parseFloat(expenseForm.vatRate) || 0,
      };

      await api.post(`${API_BASE_URL}/calisancari/calisancari-create`, transactionObj);

      addToast("Masraf kaydı kaydedildi", "başarılı");
      setModalState((prev) => ({ ...prev, expense: false }));
      setExpenseForm({
        date: dayjs().format("YYYY-MM-DD"),
        documentNumber: "",
        expenseMainCategoryId: "",
        expenseSubCategoryId: "",
        amount: "",
        vatRate: "",
        currency: "TRY",
        description: "",
      });
      setExpenseDateValue(dayjs());
      onSubmit(employeeId);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      console.error("Masraf hatası:", {
        message: errorMessage,
        status: err.response?.status,
        url: err.config?.url,
        data: err.config?.data,
      });
      addToast("Masraf kaydı kaydedilemedi: " + errorMessage, "hata");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Maaş/Prim Tahakkuku Modalı */}
      <CModal
        visible={modalState.accrual}
        backdrop="static"
        keyboard={false}
        onClose={() => {
          setModalState((prev) => ({ ...prev, accrual: false }));
          setAccrualForm({
            date: dayjs().format("YYYY-MM-DD"),
            amount: "",
            currency: "TRY",
            expenseMainCategoryId: "",
            expenseSubCategoryId: "",
            description: "",
          });
          setDateValue(dayjs());
        }}
      >
        <CModalHeader>
          <CModalTitle>Maaş/Prim Tahakkuku Yap</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loading && <p>Veriler yükleniyor...</p>}
          <CForm onSubmit={handleAccrualSubmit}>
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              <p className="mb-0">
                'Hakedilen Net Maaş' alanına çalışanın hak ettiği net maaş/prim
                tutarını yazın. Kaydettiğinizde hem çalışan için alacak kaydı,
                hem de seçtiğiniz masraf kalemi için gider yazılacaktır.
                'Açıklama' alanına 'Şubat maaşı' vb. yazabilirsiniz.
              </p>
            </div>
            <p
              style={{
                fontWeight: "bold",
                color: "#dc3545",
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <CIcon icon={cilWarning} style={{ marginRight: "5px" }} />
              Bu işlem kasa ya da banka hesabınızı etkilemez, sadece çalışanı
              alacaklandırır. Bu işlemden sonra, ödeme yapmak için 'Ödeme Yap'
              seçeneğini kullanın.
            </p>
            <DatePickerField
              label="Hakediş Tarihi"
              value={dateValue}
              onChange={(newValue) => {
                setDateValue(newValue);
                setAccrualForm((prev) => ({
                  ...prev,
                  date: newValue ? newValue.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel htmlFor="amount">Hakedilen Net Maaş</CFormLabel>
            <div className="d-flex align-items-center mb-3">
              <CFormInput
                type="number"
                id="amount"
                name="amount"
                value={accrualForm.amount}
                onChange={handleAccrualChange}
                placeholder="0.00"
                required
                step="0.01"
                style={{ flex: 1, marginRight: "10px" }}
              />
              <CFormSelect
                name="currency"
                value={accrualForm.currency}
                onChange={handleAccrualChange}
                style={{ width: "100px" }}
                disabled={loading}
              >
                <option value="TRY">TL</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </CFormSelect>
            </div>
            <CFormLabel htmlFor="expenseMainCategoryId" className="mt-3">
              Masraf Ana Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseMainCategoryId"
              name="expenseMainCategoryId"
              value={accrualForm.expenseMainCategoryId}
              onChange={handleAccrualChange}
              required
              className="mb-3"
              disabled={loading}
            >
              <option value="">Seçiniz</option>
              {expenseMainCategories.length > 0 ? (
                expenseMainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.adi}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Ana kategoriler yüklenemedi
                </option>
              )}
            </CFormSelect>
            <CFormLabel htmlFor="expenseSubCategoryId" className="mt-3">
              Masraf Alt Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseSubCategoryId"
              name="expenseSubCategoryId"
              value={accrualForm.expenseSubCategoryId}
              onChange={handleAccrualChange}
              required
              className="mb-3"
              disabled={loading || !accrualForm.expenseMainCategoryId}
            >
              <option value="">Seçiniz</option>
              {expenseSubCategories
                .filter(
                  (sub) =>
                    sub.masrafAnaKategoriId?.toString() ===
                    accrualForm.expenseMainCategoryId
                )
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.adi}
                  </option>
                ))}
            </CFormSelect>
            <CFormLabel htmlFor="description">Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={accrualForm.description}
              onChange={handleAccrualChange}
              placeholder="Ör: Şubat maaşı"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={loading}>
                Maaş Tahakkuku Oluştur
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setModalState((prev) => ({ ...prev, accrual: false }));
                  setAccrualForm({
                    date: dayjs().format("YYYY-MM-DD"),
                    amount: "",
                    currency: "TRY",
                    expenseMainCategoryId: "",
                    expenseSubCategoryId: "",
                    description: "",
                  });
                  setDateValue(dayjs());
                }}
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Ödeme Yap Modalı */}
      <CModal
        visible={modalState.payment}
        backdrop="static"
        keyboard={true}
        onClose={() => {
          setModalState((prev) => ({ ...prev, payment: false }));
          setPaymentForm({
            date: dayjs().format("YYYY-MM-DD"),
            accountId: "",
            amount: "",
            currency: "TRY",
            description: "",
          });
          setPaymentDateValue(dayjs());
        }}
      >
        <CModalHeader>
          <CModalTitle>Ödeme Yap (Maaş/Prim/Avans)</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loading && <p>Hesaplar yükleniyor...</p>}
          <CForm onSubmit={handlePaymentSubmit}>
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              <p className="mb-0">
                Ödemeyi kaydetiğinizde sistem seçtiğiniz kasa/banka hesabından
                'Ödediğiniz Net Tutar' kadar miktarı çalışana borç
                yazdıracaktır.
              </p>
            </div>
            <p
              style={{
                fontWeight: "bold",
                color: "#dc3545",
                display: "flex",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <CIcon icon={cilWarning} style={{ marginRight: "5px" }} />
              Maaş ya da prim ödemesi yapmadan önce 'Maaş/Prim Tahakkuku Yap'
              seçeneği ile çalışanıınızı alacaklandırmayı ve şirketiniz için
              masraf oluşturmayı unutmayın.
            </p>
            <DatePickerField
              label="Ödeme Tarihi"
              value={paymentDateValue}
              onChange={(date) => {
                setPaymentDateValue(date);
                setPaymentForm((prev) => ({
                  ...prev,
                  date: date ? date.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel htmlFor="accountId">Hesap Seç</CFormLabel>
            <CFormSelect
              id="accountId"
              name="accountId"
              value={paymentForm.accountId}
              onChange={handlePaymentChange}
              required
              className="mb-3"
              disabled={loading}
            >
              <option value="">Seçiniz</option>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.userName} ({account.currency})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Hesap bulunamadı
                </option>
              )}
            </CFormSelect>
            <p className="mt-2 mb-3">
              <strong>Güncel bakiye: </strong>
              {paymentForm.accountId
                ? `${(
                    accounts.find(
                      (a) => a.id === parseInt(paymentForm.accountId)
                    )?.balance || 0
                  ).toLocaleString("tr-TR")} ${
                    accounts.find(
                      (a) => a.id === parseInt(paymentForm.accountId)
                    )?.currency || "TRY"
                  }`
                : "0.00 TRY"}
            </p>
            <CFormLabel htmlFor="paymentAmount">
              Ödediğiniz Net Tutar
            </CFormLabel>
            <div className="d-flex align-items-center mb-3">
              <CFormInput
                type="number"
                id="paymentAmount"
                name="amount"
                value={paymentForm.amount}
                onChange={handlePaymentChange}
                placeholder="0.00"
                required
                step="0.01"
                style={{ flex: 1, marginRight: "10px" }}
              />
              <CFormSelect
                name="currency"
                value={paymentForm.currency}
                onChange={handlePaymentChange}
                style={{ width: "100px" }}
                disabled={loading}
              >
                <option value="TRY">TL</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </CFormSelect>
            </div>
            <CFormLabel htmlFor="paymentDescription">Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={paymentForm.description}
              onChange={handlePaymentChange}
              placeholder="Ör: Maaş ödemesi"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={loading}>
                Ödemeyi Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setModalState((prev) => ({ ...prev, payment: false }));
                  setPaymentForm({
                    date: dayjs().format("YYYY-MM-DD"),
                    accountId: "",
                    amount: "",
                    currency: "TRY",
                    description: "",
                  });
                  setPaymentDateValue(dayjs());
                }}
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Avans İadesi Modalı */}
      <CModal
        visible={modalState.advanceReturn}
        backdrop="true"
        keyboard={true}
        onClose={() => {
          setModalState((prev) => ({ ...prev, advanceReturn: false }));
          setAdvanceReturnForm({
            date: dayjs().format("YYYY-MM-DD"),
            accountId: "",
            amount: "",
            currency: "TRY",
            description: "",
          });
          setAdvanceReturnDateValue(dayjs());
        }}
      >
        <CModalHeader>
          <CModalTitle>Avans İadesi Al</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loading && <p>Hesaplar yükleniyor...</p>}
          <CForm onSubmit={handleAdvanceReturnSubmit}>
            <DatePickerField
              label="İşlem Tarihi"
              value={advanceReturnDateValue}
              onChange={(date) => {
                setAdvanceReturnDateValue(date);
                setAdvanceReturnForm((prev) => ({
                  ...prev,
                  date: date ? date.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel htmlFor="advanceReturnAccountId">Hesap Seç</CFormLabel>
            <CFormSelect
              id="advanceReturnAccountId"
              name="accountId"
              value={advanceReturnForm.accountId}
              onChange={handleAdvanceReturnChange}
              required
              className="mb-3"
              disabled={loading}
            >
              <option value="">Seçiniz</option>
              {accounts.length > 0 ? (
                accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.userName} ({account.currency})
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Hesap bulunamadı
                </option>
              )}
            </CFormSelect>
            <CFormLabel htmlFor="advanceReturnAmount">İade Tutarı</CFormLabel>
            <div className="d-flex align-items-center mb-3">
              <CFormInput
                type="number"
                id="advanceReturnAmount"
                name="amount"
                value={advanceReturnForm.amount}
                onChange={handleAdvanceReturnChange}
                placeholder="0.00"
                required
                step="0.01"
                style={{ flex: 1, marginRight: "10px" }}
              />
              <CFormSelect
                name="currency"
                value={advanceReturnForm.currency}
                onChange={handleAdvanceReturnChange}
                style={{ width: "100px" }}
                disabled={loading}
              >
                <option value="TRY">TL</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </CFormSelect>
            </div>
            <CFormLabel htmlFor="advanceReturnDescription">Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={advanceReturnForm.description}
              onChange={handleAdvanceReturnChange}
              placeholder="Ör: Avans iadesi"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={loading}>
                Avans İadesi Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setModalState((prev) => ({ ...prev, advanceReturn: false }));
                  setAdvanceReturnForm({
                    date: dayjs().format("YYYY-MM-DD"),
                    accountId: "",
                    amount: "",
                    currency: "TRY",
                    description: "",
                  });
                  setAdvanceReturnDateValue(dayjs());
                }}
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Borç/Alacak Fişleri Modalı */}
      <CModal
        visible={modalState.debtCredit}
        backdrop="true"
        keyboard={true}
        onClose={() => {
          setModalState((prev) => ({ ...prev, debtCredit: false }));
          setDebtCreditForm({
            transactionType: "Alacak",
            date: dayjs().format("YYYY-MM-DD"),
            amount: "",
            currency: "TRY",
            description: "",
            expenseMainCategoryId: "",
            expenseSubCategoryId: "",
          });
          setDebtCreditDateValue(dayjs());
        }}
      >
        <CModalHeader>
          <CModalTitle>Borç/Alacak Fişleri</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleDebtCreditSubmit}>
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              <p className="mb-0">
                Herhangi bir ödeme, masraf, maaş ya da prim işlemi olmadan
                çalışanın bakiyesini değiştirmek için borç ya da alacak fişi
                kaydı oluşturabilirsiniz. Çalışanın güncel bakiyesi burada
                gireceğiniz tutar kadar değişecektir.
              </p>
            </div>
            <CFormLabel htmlFor="transactionType">İşlem Tipi</CFormLabel>
            <CFormSelect
              id="transactionType"
              name="transactionType"
              value={debtCreditForm.transactionType}
              onChange={handleDebtCreditChange}
              className="mb-3"
            >
              <option value="Alacak">Alacak Fişi</option>
              <option value="Borç">Borç Fişi</option>
            </CFormSelect>
            <p className="mb-3">
              {debtCreditForm.transactionType === "Alacak"
                ? "Çalışan alacaklanacak."
                : "Çalışan borçlanacak."}
            </p>
            <CFormLabel htmlFor="expenseMainCategoryId" className="mt-3">
              Masraf Ana Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseMainCategoryId"
              name="expenseMainCategoryId"
              value={debtCreditForm.expenseMainCategoryId}
              onChange={handleDebtCreditChange}
              className="mb-3"
              disabled={loading}
            >
              <option value="">Seçiniz (İsteğe bağlı)</option>
              {expenseMainCategories.length > 0 ? (
                expenseMainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.adi}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Ana kategoriler yüklenemedi
                </option>
              )}
            </CFormSelect>
            <CFormLabel htmlFor="expenseSubCategoryId" className="mt-3">
              Masraf Alt Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseSubCategoryId"
              name="expenseSubCategoryId"
              value={debtCreditForm.expenseSubCategoryId}
              onChange={handleDebtCreditChange}
              className="mb-3"
              disabled={loading || !debtCreditForm.expenseMainCategoryId}
            >
              <option value="">Seçiniz (İsteğe bağlı)</option>
              {expenseSubCategories
                .filter(
                  (sub) =>
                    sub.masrafAnaKategoriId?.toString() ===
                    debtCreditForm.expenseMainCategoryId
                )
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.adi}
                  </option>
                ))}
            </CFormSelect>
            <DatePickerField
              label="İşlem Tarihi"
              value={debtCreditDateValue}
              onChange={(date) => {
                setDebtCreditDateValue(date);
                setDebtCreditForm((prev) => ({
                  ...prev,
                  date: date ? date.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel htmlFor="debtCreditAmount">Tutar</CFormLabel>
            <div className="d-flex align-items-center mb-3">
              <CFormInput
                type="number"
                name="amount"
                id="debtCreditAmount"
                value={debtCreditForm.amount}
                onChange={handleDebtCreditChange}
                placeholder="0.00"
                required
                step="0.01"
                style={{ flex: 1, marginRight: "10px" }}
              />
              <CFormSelect
                name="currency"
                value={debtCreditForm.currency}
                onChange={handleDebtCreditChange}
                style={{ width: "100px" }}
                disabled={loading}
              >
                <option value="TRY">TL</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </CFormSelect>
            </div>
            <CFormLabel htmlFor="debtCreditDescription">Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={debtCreditForm.description}
              onChange={handleDebtCreditChange}
              placeholder="Ör: Borç/Alacak düzeltmesi"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={loading}>
                Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setModalState((prev) => ({ ...prev, debtCredit: false }));
                  setDebtCreditForm({
                    transactionType: "Alacak",
                    date: dayjs().format("YYYY-MM-DD"),
                    amount: "",
                    currency: "TRY",
                    description: "",
                    expenseMainCategoryId: "",
                    expenseSubCategoryId: "",
                  });
                  setDebtCreditDateValue(dayjs());
                }}
              >
                Vazgeç
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      {/* Masraf Girişi Modalı */}
      <CModal
        visible={modalState.expense}
        backdrop="true"
        keyboard={true}
        onClose={() => {
          setModalState((prev) => ({ ...prev, expense: false }));
          setExpenseForm({
            date: dayjs().format("YYYY-MM-DD"),
            documentNumber: "",
            expenseMainCategoryId: "",
            expenseSubCategoryId: "",
            amount: "",
            vatRate: "",
            currency: "TRY",
            description: "",
          });
          setExpenseDateValue(dayjs());
        }}
      >
        <CModalHeader>
          <CModalTitle>Masraf Girişi</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {loading && <p>Veriler yükleniyor...</p>}
          <CForm onSubmit={handleExpenseSubmit}>
            <div
              style={{
                backgroundColor: "#fff3cd",
                padding: "15px",
                borderRadius: "4px",
                marginBottom: "15px",
              }}
            >
              <p className="mb-0">
                Çalışanınızın size getirdiği masrafları buradan girebilirsiniz.
                Masraf kaydından sonra çalışan alacaklanır.
              </p>
            </div>
            <DatePickerField
              label="Masraf Tarihi"
              value={expenseDateValue}
              onChange={(date) => {
                setExpenseDateValue(date);
                setExpenseForm((prev) => ({
                  ...prev,
                  date: date ? date.format("YYYY-MM-DD") : "",
                }));
              }}
            />
            <CFormLabel htmlFor="documentNumber">Fiş/Belge No</CFormLabel>
            <CFormInput
              id="documentNumber"
              name="documentNumber"
              value={expenseForm.documentNumber}
              onChange={handleExpenseChange}
              placeholder="Ör: Fatura123"
              className="mb-3"
            />
            <CFormLabel htmlFor="expenseMainCategoryId">
              Masraf Ana Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseMainCategoryId"
              name="expenseMainCategoryId"
              value={expenseForm.expenseMainCategoryId}
              onChange={handleExpenseChange}
              required
              className="mb-3"
              disabled={loading}
            >
              <option value="">Seçiniz</option>
              {expenseMainCategories.length > 0 ? (
                expenseMainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.adi}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  Ana kategoriler yüklenemedi
                </option>
              )}
            </CFormSelect>
            <CFormLabel htmlFor="expenseSubCategoryId">
              Masraf Alt Kategorisi
            </CFormLabel>
            <CFormSelect
              id="expenseSubCategoryId"
              name="expenseSubCategoryId"
              value={expenseForm.expenseSubCategoryId}
              onChange={handleExpenseChange}
              required
              className="mb-3"
              disabled={loading || !expenseForm.expenseMainCategoryId}
            >
              <option value="">Seçiniz</option>
              {expenseSubCategories
                .filter(
                  (sub) =>
                    sub.masrafAnaKategoriId?.toString() ===
                    expenseForm.expenseMainCategoryId
                )
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.adi}
                  </option>
                ))}
            </CFormSelect>
            <CFormLabel htmlFor="amount">Tutar (KDV Dahil)</CFormLabel>
            <div className="d-flex align-items-center mb-3">
              <CFormInput
                type="number"
                id="amount"
                name="amount"
                value={expenseForm.amount}
                onChange={handleExpenseChange}
                placeholder="0.00"
                required
                step="0.01"
                style={{ flex: 1, marginRight: "10px" }}
              />
              <CFormSelect
                name="currency"
                value={expenseForm.currency}
                onChange={handleExpenseChange}
                style={{ width: "100px" }}
                disabled={loading}
              >
                <option value="TRY">TL</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </CFormSelect>
            </div>
            <CFormLabel htmlFor="vatRate">KDV Oranı (%)</CFormLabel>
            <CFormInput
              type="number"
              id="vatRate"
              name="vatRate"
              value={expenseForm.vatRate}
              onChange={handleExpenseChange}
              placeholder="Ör: 20"
              step="0.01"
              className="mb-3"
            />
            <CFormLabel htmlFor="description">Açıklama</CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={expenseForm.description}
              onChange={handleExpenseChange}
              placeholder="Ör: Seyahat masrafı"
              className="mb-3"
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={loading}>
                Masrafı Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setModalState((prev) => ({ ...prev, expense: false }));
                  setExpenseForm({
                    date: dayjs().format("YYYY-MM-DD"),
                    documentNumber: "",
                    expenseMainCategoryId: "",
                    expenseSubCategoryId: "",
                    amount: "",
                    vatRate: "",
                    currency: "TRY",
                    description: "",
                  });
                  setExpenseDateValue(dayjs());
                }}
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>
    </>
  );
};

export default EmployeeModals;
