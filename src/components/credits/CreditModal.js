import { useState, useEffect } from "react";
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
import axios from "axios";
import dayjs from "dayjs";
import { TextField } from "@mui/material";
import DatePickerField from "./DatePickerField";

const API_BASE_URL = "https://speedsofttest.com/api";

const paymentScheduleMap = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  quadmonthly: 4,
  semiannually: 6,
  annually: 12,
};

const CreditModal = ({
  visible,
  onClose,
  addToast,
  credit = null,
  accounts = [], // Default to empty array
}) => {
  const [loading, setLoading] = useState(false);
  const [accountsList, setAccountsList] = useState(accounts);
  const [formData, setFormData] = useState({
    name: credit?.name || "",
    remainingAmount: credit?.remainingAmount || "",
    installmentCount: credit?.installmentCount || "",
    nextPaymentDate: credit?.nextPaymentDate || dayjs().format("YYYY-MM-DD"),
    paymentSchedule: credit?.paymentSchedule || "monthly",
    accountId: credit?.accountId || "",
    notes: credit?.notes || "",
    kullaniciId: 0, // Kullanıcı ID'si eklendi
  });
  const [dateValue, setDateValue] = useState(
    credit?.nextPaymentDate ? dayjs(credit.nextPaymentDate) : dayjs(),
  );

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
      setAccountsList(data.length ? data : accounts);
    } catch (err) {
      addToast("Hesaplar yüklenemedi: " + err.message, "error");
      setAccountsList(accounts); // Fallback to prop accounts
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      // Reset formData and dateValue when modal opens or credit changes
      setFormData({
        name: credit?.name || "",
        remainingAmount: credit?.remainingAmount || "",
        installmentCount: credit?.installmentCount || "",
        nextPaymentDate:
          credit?.nextPaymentDate || dayjs().format("YYYY-MM-DD"),
        paymentSchedule: credit?.paymentSchedule || "monthly",
        accountId: credit?.accountId || "",
        notes: credit?.notes || "",
        kullaniciId: getUserId(), // Kullanıcı ID'sini al
      });
      setDateValue(
        credit?.nextPaymentDate ? dayjs(credit.nextPaymentDate) : dayjs(),
      );
      fetchAccounts();
    }
  }, [visible, credit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) {
      addToast("Geçerli bir kullanıcı oturumu bulunamadı.", "error");
      return;
    }
    
    setLoading(true);
    try {
      if (
        !formData.name ||
        !formData.remainingAmount ||
        !formData.installmentCount ||
        !formData.accountId
      ) {
        throw new Error("Zorunlu alanları doldurun.");
      }
      if (parseFloat(formData.remainingAmount) <= 0) {
        throw new Error("Kalan borç tutarı pozitif olmalıdır.");
      }
      if (parseInt(formData.installmentCount) <= 0) {
        throw new Error("Taksit sayısı pozitif olmalıdır.");
      }
      if (parseInt(formData.installmentCount) > 144) {
        throw new Error("Maksimum 144 taksit girebilirsiniz.");
      }
      if (!dateValue || !dayjs(dateValue).isValid()) {
        throw new Error("Geçerli bir tarih seçin.");
      }

      const odemeTakvim =
        Object.keys(paymentScheduleMap).find(
          (key) => paymentScheduleMap[key] === formData.paymentSchedule,
        ) || 1;

      const creditData = {
        Id: credit?.id || 0, // Include ID for updates
        Adi: formData.name, // Include name field
        KalanBorc: parseFloat(formData.remainingAmount),
        KalanTaksit: parseInt(formData.installmentCount),
        IlkTaksitTarih: dateValue.format("YYYY-MM-DD"),
        OdemeTakvim: odemeTakvim,
        HesapId: parseInt(formData.accountId),
        Notlar: formData.notes,
        Durumu: 1, // Default to active
        kullaniciId: userId, // Kullanıcı ID'si eklendi
      };

      console.log("Kredi create/update payload:", creditData);

      let url;
      let method;
      if (credit?.id) {
        url = `${API_BASE_URL}/kredi/update/${credit.id}`;
        method = axios.put;
      } else {
        url = `${API_BASE_URL}/kredi/create`;
        method = axios.post;
      }

      const response = await method(url, creditData, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Kredi create/update API response (kredi/create/update):", response.data);

      addToast(
        response.data.Message ||
          (credit?.id
            ? "Kredi başarıyla güncellendi!"
            : "Kredi başarıyla oluşturuldu!"),
        "success",
      );
      handleClose();
    } catch (err) {
      console.error("Form submit hatası:", err);
      addToast(err.response?.data?.Message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      remainingAmount: "",
      installmentCount: "",
      nextPaymentDate: dayjs().format("YYYY-MM-DD"),
      paymentSchedule: "monthly",
      accountId: "",
      notes: "",
      kullaniciId: 0,
    });
    setDateValue(dayjs());
    onClose();
  };

  return (
    <CModal visible={visible} onClose={handleClose} backdrop="static">
      <CModalHeader style={{ backgroundColor: "#4394FF", color: "white" }}>
        <CModalTitle>
          {credit ? "Kredi Güncelle" : "Yeni Kredi Ekle"}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        <CForm onSubmit={handleSubmit}>
          <CFormLabel>Kredi Adı</CFormLabel>
          <CFormInput
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="mb-3"
          />
          <CFormLabel>Kalan Borç Tutarı</CFormLabel>
          <CFormInput
            type="number"
            name="remainingAmount"
            value={formData.remainingAmount}
            onChange={handleChange}
            required
            className="mb-3"
            step="0.01"
            min="0.01"
          />
          <CFormLabel>Kalan Taksit Sayısı</CFormLabel>
          <CFormSelect
            name="installmentCount"
            value={formData.installmentCount}
            onChange={handleChange}
            required
            className="mb-2"
          >
            <option value="">Seçiniz</option>
            {[...Array(144).keys()].map((i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </CFormSelect>
          <p className="text-danger mb-3">
            Maksimum 144 taksit girebilirsiniz.
          </p>
          <DatePickerField
            label="Sıradaki İlk Taksit Tarihi"
            value={dateValue}
            onChange={(newValue) => setDateValue(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                sx={{ input: { backgroundColor: "white", color: "black" } }}
              />
            )}
          />
          <CFormLabel>Ödeme Takvimi</CFormLabel>
          <CFormSelect
            name="paymentSchedule"
            value={formData.paymentSchedule}
            onChange={handleChange}
            className="mb-3"
          >
            <option value="monthly">Her Ay</option>
            <option value="bimonthly">2 Ayda Bir</option>
            <option value="quarterly">3 Ayda Bir</option>
            <option value="quadmonthly">4 Ayda Bir</option>
            <option value="semiannually">6 Ayda Bir</option>
            <option value="annually">Yılda Bir</option>
          </CFormSelect>
          <CFormLabel htmlFor="accountId" className="mt-3">
            Ödediğiniz Hesap
          </CFormLabel>
          <CFormSelect
            id="accountId"
            name="accountId"
            value={formData.accountId}
            onChange={handleChange}
            required
            className="mb-3"
            disabled={loading}
          >
            <option value="">Seçiniz</option>
            {accountsList.length > 0 ? (
              accountsList.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.tanim}{" "}
                  {account.hesapKategori?.adi
                    ? `- ${account.hesapKategori.adi}`
                    : ""}
                </option>
              ))
            ) : (
              <option value="">Hesaplar yükleniyor...</option>
            )}
          </CFormSelect>
          <CFormLabel>Notlar</CFormLabel>
          <CFormTextarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="mb-3"
          />
          <CModalFooter>
            <CButton
              style={{ backgroundColor: "#4394FF", color: "white" }}
              type="submit"
              disabled={loading}
            >
              Kaydet
            </CButton>
            <CButton color="secondary" onClick={handleClose}>
              Vazgeç
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default CreditModal;