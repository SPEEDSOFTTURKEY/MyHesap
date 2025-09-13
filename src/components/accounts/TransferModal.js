import React, { useEffect, useRef } from "react";
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
  CButton,
} from "@coreui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAccounts } from "../../context/AccountsContext";
import { useUsers } from "../../context/UsersContext";
import api from "../../api/api";
import dayjs from "dayjs";
import "../../scss/style.scss";

const API_BASE_URL = "https://localhost:44375/api";

const accountCategories = [
  { categoryId: 1, accountName: "Banka Hesapları", type: "bank" },
  { categoryId: 2, accountName: "Kasa Tanımları", type: "cash" },
  { categoryId: 3, accountName: "Kredi Kartları", type: "creditCard" },
  { categoryId: 4, accountName: "Pos Hesapları", type: "pos" },
  { categoryId: 5, accountName: "Şirket Ortakları Hesapları", type: "partner" },
  { categoryId: 6, accountName: "Veresiye Hesapları", type: "debt" },
];

const TransferModal = () => {
  const {
    visibleTransferModal,
    setVisibleTransferModal,
    transferDirection,
    transactionForm,
    setTransactionForm,
    setTransactions,
    value,
    setValue,
    isSubmitting,
    setIsSubmitting,
    selectedUser,
    setToast,
    editingTransaction,
    setEditingTransaction,
    rawTransactions,
    setRawTransactions,
    processedSubmissions,
    userId,
    setSelectedUser,
  } = useAccounts();
  const { users, setUsers, fetchUsers } = useUsers();

  const submitInProgress = useRef(false);

  useEffect(() => {
    if (!users.length) {
      console.log("Fetching users...");
      fetchUsers().catch((err) => {
        console.error("Fetch users error:", err);
        setToast({
          message: "Hesaplar yüklenirken hata oluştu.",
          color: "danger",
        });
      });
    }
  }, [users, fetchUsers]);

  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormattedNumberChange = (e) => {
    const input = e.target.value;
    const numericOnly = input.replace(/[^\d]/g, "");
    if (!numericOnly) {
      setTransactionForm((prev) => ({
        ...prev,
        rawAmount: "",
        formattedAmount: "",
      }));
      return;
    }
    let intPart = numericOnly.slice(0, -2) || "0";
    let decimalPart = numericOnly.slice(-2).padStart(2, "0");
    const rawValue = parseFloat(`${intPart}.${decimalPart}`);
    if (isNaN(rawValue) || rawValue <= 0) {
      setToast({
        message: "Geçerli bir tutar girin.",
        color: "danger",
      });
      return;
    }
    const formatted = `${parseInt(intPart, 10).toLocaleString("tr-TR")},${decimalPart}`;
    setTransactionForm((prev) => ({
      ...prev,
      rawAmount: rawValue.toString(),
      formattedAmount: formatted,
    }));
  };

  const fetchRelatedTransaction = async (
    senderId,
    recipientId,
    amount,
    transactionDate,
    isOutgoing,
    userId,
    hesapKategoriId
  ) => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${userId}/${recipientId}/${hesapKategoriId}`
      );
      const relatedTransaction = response.data.find(
        (t) =>
          t.hesapId === recipientId &&
          t.etkilenenHesapId === senderId &&
          parseFloat(t.tutar) === parseFloat(amount) &&
          dayjs(t.islemTarihi).isSame(dayjs(transactionDate), "second") &&
          t.islemTuruId === (isOutgoing ? 4 : 3)
      );
      return relatedTransaction || null;
    } catch (err) {
      console.error("Related transaction fetch error:", {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      return null;
    }
  };

  const createTransactionObject = async (e) => {
    e.preventDefault();
    if (isSubmitting || submitInProgress.current) return;
    submitInProgress.current = true;
    setIsSubmitting(true);

    if (!selectedUser) {
      setToast({
        message: "Lütfen önce bir kullanıcı seçin.",
        color: "danger",
      });
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }

    const submissionTimestamp = Date.now();
    if (processedSubmissions.current.has(submissionTimestamp)) {
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }
    setTransactionForm((prev) => ({ ...prev, submissionTimestamp }));

    const amount = parseFloat(transactionForm.rawAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: "Lütfen geçerli bir tutar girin.", color: "danger" });
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }

    let sender, recipient;
    if (transferDirection === "outgoing") {
      sender = selectedUser;
      recipient = users.find(
        (u) => u.accountNumber === transactionForm.recipientAccount
      );
    } else {
      sender = users.find(
        (u) => u.accountNumber === transactionForm.recipientAccount
      );
      recipient = selectedUser;
    }

    console.log("Sender:", sender);
    console.log("Recipient:", recipient);
    console.log("Amount:", amount);

    if (!sender || !recipient) {
      setToast({
        message: "Gönderen veya alıcı hesap bulunamadı.",
        color: "danger",
      });
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }

    if (sender.accountNumber === recipient.accountNumber) {
      setToast({ message: "Aynı hesaba transfer yapılamaz.", color: "danger" });
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }

    console.log("Sender Currency:", sender.currency);
    console.log("Recipient Currency:", recipient.currency);
    if (sender.currency !== recipient.currency) {
      setToast({
        message: "Hesaplar farklı para birimlerinde, transfer yapılamaz.",
        color: "danger",
      });
      setIsSubmitting(false);
      submitInProgress.current = false;
      return;
    }

    let senderTransactionObj = null;
    let recipientTransactionObj = null;

    try {
      // Fetch sender and recipient balances
      const [accountSenderResponse, accountRecipientResponse] =
        await Promise.all([
          api.get(`${API_BASE_URL}/Hesap/Hesap-get-by-Id/${sender.id}`),
          api.get(`${API_BASE_URL}/Hesap/Hesap-get-by-Id/${recipient.id}`),
        ]);
      console.log("Sender API Response:", accountSenderResponse.data);
      console.log("Recipient API Response:", accountRecipientResponse.data);

      // API yanıtının dizi olduğunu varsayıyoruz
      let senderBalance =
        parseFloat(accountSenderResponse.data[0]?.guncelBakiye) ||
        sender.balance ||
        0;
      let recipientBalance =
        parseFloat(accountRecipientResponse.data[0]?.guncelBakiye) ||
        recipient.balance ||
        0;

      console.log("Initial Sender Balance:", senderBalance);
      console.log("Initial Recipient Balance:", recipientBalance);

      let oldAmount = 0;
      let senderTransactionToRemove = null;
      let recipientTransactionToRemove = null;

      if (editingTransaction) {
        if (!editingTransaction.id) {
          setToast({ message: "Geçersiz işlem ID'si.", color: "danger" });
          setIsSubmitting(false);
          submitInProgress.current = false;
          return;
        }
        try {
          const senderTransactions = await api.get(
            `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${userId}/${sender.id}/${sender.hesapKategoriId}`
          );
          senderTransactionToRemove = senderTransactions.data.find(
            (t) => t.id === editingTransaction.id
          );
          if (!senderTransactionToRemove) {
            setToast({
              message: "Düzenlenecek gönderici işlemi bulunamadı.",
              color: "danger",
            });
            setIsSubmitting(false);
            submitInProgress.current = false;
            return;
          }

          oldAmount = parseFloat(senderTransactionToRemove.tutar) || 0;
          const isOutgoing = senderTransactionToRemove.islemTuruId === 3;
          if (isOutgoing) {
            senderBalance += oldAmount; // Reverse outgoing transfer
            recipientBalance -= oldAmount; // Reverse incoming transfer
          } else {
            senderBalance -= oldAmount; // Reverse incoming transfer
            recipientBalance += oldAmount; // Reverse outgoing transfer
          }

          console.log("Old Amount:", oldAmount);
          console.log("Adjusted Sender Balance:", senderBalance);
          console.log("Adjusted Recipient Balance:", recipientBalance);

          recipientTransactionToRemove = await fetchRelatedTransaction(
            sender.id,
            recipient.id,
            oldAmount,
            senderTransactionToRemove.islemTarihi,
            isOutgoing,
            userId,
            recipient.hesapKategoriId
          );
          if (!recipientTransactionToRemove) {
            setToast({
              message: "İlgili alıcı işlemi bulunamadı.",
              color: "danger",
            });
            setIsSubmitting(false);
            submitInProgress.current = false;
            return;
          }

          // Delete old transactions
          try {
            await Promise.all([
              api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${senderTransactionToRemove.id}`),
              api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${recipientTransactionToRemove.id}`),
            ]);
            console.log("Old transactions deleted successfully");
          } catch (deleteError) {
            console.error("Delete Transaction Error:", deleteError);
            setToast({
              message: "Eski işlemler silinirken hata oluştu.",
              color: "danger",
            });
            setIsSubmitting(false);
            submitInProgress.current = false;
            return;
          }
        } catch (err) {
          console.error("Eski işlem silme hatası:", {
            error: err.message,
            response: err.response?.data,
            status: err.response?.status,
          });
          setToast({
            message: "Eski işlemler silinirken hata oluştu.",
            color: "danger",
          });
          setIsSubmitting(false);
          submitInProgress.current = false;
          return;
        }
      }

      console.log("Final Sender Balance:", senderBalance);
      console.log("Final Recipient Balance:", recipientBalance);

      // Check sender balance
      if (amount > senderBalance) {
        setToast({ message: "Yetersiz bakiye.", color: "danger" });
        setIsSubmitting(false);
        submitInProgress.current = false;
        return;
      }

      // Calculate new balances
      const newSenderBalance = senderBalance - amount;
      const newRecipientBalance = recipientBalance + amount;

      // Validate transaction date
      const transactionDate = transactionForm.date
        ? dayjs(transactionForm.date, "DD.MM.YYYY").isValid()
          ? dayjs(transactionForm.date, "DD.MM.YYYY").toISOString()
          : new Date().toISOString()
        : new Date().toISOString();

      // Create new transaction objects
      senderTransactionObj = {
        id: editingTransaction ? editingTransaction.id : 0,
        kullanicilarId: userId,
        hesapId: sender.id,
        etkilenenHesapId: recipient.id,
        hesapKategoriId: sender.hesapKategoriId,
        islemTarihi: transactionDate,
        islemTuruId: 3,
        bilgi:
          transactionForm.description ||
          `Transfer - ${recipient.userName} (${recipient.accountNumber})`,
        aciklama: `${recipient.userName} hesabına transfer`,
        tutar: amount,
        borc: amount,
        alacak: 0,
        bakiye: newSenderBalance,
        eklenmeTarihi: editingTransaction
          ? senderTransactionToRemove?.eklenmeTarihi || new Date().toISOString()
          : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
      };

      recipientTransactionObj = {
        id:
          editingTransaction && recipientTransactionToRemove
            ? recipientTransactionToRemove.id
            : 0,
        kullanicilarId: userId,
        hesapId: recipient.id,
        etkilenenHesapId: sender.id,
        hesapKategoriId: recipient.hesapKategoriId,
        islemTarihi: transactionDate,
        islemTuruId: 4,
        bilgi:
          transactionForm.description ||
          `Transfer - ${sender.userName} (${sender.accountNumber})`,
        aciklama: `${sender.userName} hesabından transfer`,
        tutar: amount,
        borc: 0,
        alacak: amount,
        bakiye: newRecipientBalance,
        eklenmeTarihi: editingTransaction
          ? recipientTransactionToRemove?.eklenmeTarihi ||
            new Date().toISOString()
          : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
      };

      // Save new transactions
      const [senderResponse, recipientResponse] = await Promise.all([
        editingTransaction
          ? api.put(`${API_BASE_URL}/hesapHareket/hesapHareket-update`, senderTransactionObj)
          : api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, senderTransactionObj),
        editingTransaction
          ? api.put(`${API_BASE_URL}/hesapHareket/hesapHareket-update`, recipientTransactionObj)
          : api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, recipientTransactionObj),
      ]);

      // Update local state
      const senderTransaction = {
        id: senderResponse.data.id || Date.now(),
        date: transactionForm.date || dayjs().format("DD.MM.YYYY"),
        type: "Transfer Çıkış",
        userName: sender.userName,
        accountNumber: recipient.accountNumber,
        description: `${recipient.userName} hesabına transfer`,
        debit: `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        credit: "-",
        islemTarihi: transactionDate,
        islemTuruId: 3,
        tutar: amount,
        etkilenenHesapId: recipient.id,
        hesapId: sender.id,
      };

      const recipientTransaction = {
        id: recipientResponse.data.id || Date.now() + 1,
        date: transactionForm.date || dayjs().format("DD.MM.YYYY"),
        type: "Transfer Giriş",
        userName: recipient.userName,
        accountNumber: sender.accountNumber,
        description: `${sender.userName} hesabından transfer`,
        debit: "-",
        credit: `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        islemTarihi: transactionDate,
        islemTuruId: 4,
        tutar: amount,
        etkilenenHesapId: sender.id,
        hesapId: recipient.id,
      };

      let updatedRawTransactions = rawTransactions.filter(
        (t) =>
          t.id !== senderTransactionToRemove?.id &&
          t.id !== recipientTransactionToRemove?.id
      );
      updatedRawTransactions.push(senderTransaction, recipientTransaction);
      updatedRawTransactions.sort((a, b) =>
        dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1
      );

      setRawTransactions(updatedRawTransactions);
      setTransactions(
        updatedRawTransactions.filter((t) => t.hesapId === selectedUser?.id)
      );

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === sender.id
            ? { ...u, balance: newSenderBalance }
            : u.id === recipient.id
              ? { ...u, balance: newRecipientBalance }
              : u
        )
      );

      if (sender.id === selectedUser.id) {
        setSelectedUser({ ...sender, balance: newSenderBalance });
      } else if (recipient.id === selectedUser.id) {
        setSelectedUser({ ...recipient, balance: newRecipientBalance });
      }

      processedSubmissions.current.add(submissionTimestamp);
      setToast({
        message: editingTransaction
          ? "Transfer başarıyla güncellendi."
          : "Transfer başarıyla gerçekleştirildi.",
        color: "success",
      });
      setVisibleTransferModal(false);
      setEditingTransaction(null);
      setTransactionForm({
        rawAmount: "",
        formattedAmount: "",
        description: "",
        date: dayjs().format("DD.MM.YYYY"),
        recipientAccount: "",
        submissionTimestamp: null,
      });
    } catch (err) {
      console.error("Transfer error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        senderPayload: senderTransactionObj || "Not defined",
        recipientPayload: recipientTransactionObj || "Not defined",
      });
      setToast({
        message: `Transfer sırasında hata oluştu: ${err.response?.data?.message || err.message}`,
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
      submitInProgress.current = false;
    }
  };

  return (
    <CModal
      visible={visibleTransferModal}
      backdrop="static"
      keyboard={false}
      onClose={() => {
        setVisibleTransferModal(false);
        setEditingTransaction(null);
        setTransactionForm({
          id: "",
          rawAmount: "",
          formattedAmount: "",
          description: "",
          date: dayjs().format("DD.MM.YYYY"),
          recipientAccount: "",
          submissionTimestamp: null,
        });
      }}
    >
      <CModalHeader
        style={{
          backgroundColor: "var(--warning-color)",
          color: "var(--white-color)",
        }}
      >
        <CModalTitle>
          {transferDirection === "outgoing"
            ? "Bu hesaptan başka hesaba para aktar"
            : "Başka hesaptan bu hesaba para aktar"}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {users.length === 0 && <p>Hesaplar yükleniyor...</p>}
        <CForm onSubmit={createTransactionObject}>
          <CFormLabel
            htmlFor="date"
            className="block text-sm font-semibold mb-3"
          >
            İşlem Tarihi
          </CFormLabel>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={value}
              onChange={(newValue) => {
                setValue(newValue);
                setTransactionForm((prev) => ({
                  ...prev,
                  date: newValue ? newValue.format("DD.MM.YYYY") : "",
                }));
              }}
              format="DD.MM.YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "outlined",
                  size: "small",
                },
              }}
            />
          </LocalizationProvider>
          <CFormLabel htmlFor="amount" className="mt-3">
            Tutar
          </CFormLabel>
          <CFormInput
            type="text"
            id="amount"
            name="amount"
            value={transactionForm.formattedAmount}
            onChange={handleFormattedNumberChange}
            placeholder="0,00"
          />
          <CFormLabel htmlFor="description" className="mt-3">
            Açıklama
          </CFormLabel>
          <CFormInput
            type="text"
            name="description"
            value={transactionForm.description}
            onChange={handleTransactionChange}
          />
          <CFormLabel htmlFor="recipientAccount" className="mt-3">
            {transferDirection === "outgoing"
              ? "Alıcı Hesap"
              : "Gönderen Hesap"}
          </CFormLabel>
          <CFormSelect
            id="recipientAccount"
            name="recipientAccount"
            value={transactionForm.recipientAccount}
            onChange={handleTransactionChange}
          >
            <option value="">Hesap Seç</option>
            {accountCategories.map((category) => {
              const categoryUsers = users.filter(
                (user) =>
                  user.hesapKategoriId === category.categoryId &&
                  user.id !== selectedUser?.id
              );
              if (categoryUsers.length > 0) {
                return (
                  <optgroup
                    key={category.categoryId}
                    label={category.accountName}
                  >
                    {categoryUsers.map((user) => (
                      <option key={user.id} value={user.accountNumber}>
                        {user.userName || "İsim Yok"} -{" "}
                        {user.accountNumber || "-"} ({user.currency})
                      </option>
                    ))}
                  </optgroup>
                );
              }
              return null;
            })}
          </CFormSelect>
          <CModalFooter>
            <CButton
              color="primary"
              type="submit"
              disabled={isSubmitting || users.length === 0 || submitInProgress.current}
            >
              {isSubmitting
                ? "İşleniyor..."
                : editingTransaction
                  ? "Güncelle"
                  : "Transferi Gerçekleştir"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => {
                setVisibleTransferModal(false);
                setEditingTransaction(null);
                setTransactionForm({
                  id: "",
                  rawAmount: "",
                  formattedAmount: "",
                  description: "",
                  date: dayjs().format("DD.MM.YYYY"),
                  recipientAccount: "",
                  submissionTimestamp: null,
                });
              }}
            >
              İptal
            </CButton>
          </CModalFooter>
        </CForm>
      </CModalBody>
    </CModal>
  );
};

export default TransferModal;