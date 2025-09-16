import React, { useState, useRef } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CButton,
} from "@coreui/react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAccounts } from "../../context/AccountsContext";
import api from "../../api/api";
import dayjs from "dayjs";
import "../../scss/style.scss";

const API_BASE_URL = "https://speedsofttest.com/api";

// CSS stili doğrudan bileşen içinde tanımlanıyor
const modalStyles = `
  .custom-modal .close {
    color: #FFFFFF !important;
    opacity: 1 !important;
  }
  .custom-modal .close:hover {
    color: #FFFFFF !important;
    opacity: 0.8 !important;
  }
`;

const TransactionModal = () => {
  const {
    transactionModalVisible,
    setTransactionModalVisible,
    transactionType,
    transactionForm,
    setTransactionForm,
    value,
    setValue,
    selectedUser,
    setSelectedUser,
    setToast,
    editingTransaction,
    setEditingTransaction,
    isSubmitting,
    setIsSubmitting,
    rawTransactions,
    setRawTransactions,
    processedSubmissions,
    userId,
    setUsers,
    setTransactions,
  } = useAccounts();

  // Form alanlarını günceller
  const handleTransactionChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  // Tutar alanını formatlar ve rawAmount'u günceller
  const handleFormattedNumberChange = (e) => {
    const input = e.target.value.replace(/[^\d,]/g, "");
    const numericOnly = input.replace(/,/g, "");
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
    const formatted = `${parseInt(intPart, 10).toLocaleString("tr-TR")},${decimalPart}`;
    setTransactionForm((prev) => ({
      ...prev,
      rawAmount: rawValue.toString(),
      formattedAmount: formatted,
    }));
  };

  const createTransactionObject = async (e) => {
    e.preventDefault();
    // 1. İşlem yürütülüyorsa veya kullanıcı seçilmemişse engeller
    if (isSubmitting) return;
    if (!selectedUser) {
      setToast({ message: "Lütfen bir kullanıcı seçin.", color: "danger" });
      return;
    }

    // 2. Çift gönderimi önlemek için zaman damgası kontrolü
    const submissionTimestamp = Date.now();
    if (processedSubmissions.current.has(submissionTimestamp)) return;
    setIsSubmitting(true);
    setTransactionForm((prev) => ({ ...prev, submissionTimestamp }));

    // 3. Tutarı kontrol eder
    const amount = parseFloat(transactionForm.rawAmount);
    if (isNaN(amount) || amount <= 0) {
      setToast({ message: "Lütfen geçerli bir tutar girin.", color: "danger" });
      setIsSubmitting(false);
      return;
    }

    // 4. İşlem türüne göre mantığı belirler (Para Girişi veya Çıkışı)
    const isDeposit = transactionType === "in";
    const isWithdrawal = transactionType === "out";
    if (!isDeposit && !isWithdrawal) {
      setToast({ message: "Geçersiz işlem türü.", color: "danger" });
      setIsSubmitting(false);
      return;
    }

    // 5. Mevcut bakiyeyi API'den alır
    let currentBalance;

    // ✅ ID kontrolü
    if (!selectedUser || !selectedUser.id) {
      setToast({ message: "Hesap seçilmedi veya geçersiz.", color: "danger" });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.get(
        `${API_BASE_URL}/Hesap/Hesap-get-by-Id/${selectedUser.id}`
      );
      console.log("TransactionModal;", selectedUser.id);
      console.log("API'den gelen yanıt:", response.data);

      // Dizi içinden ilk hesabın bakiyesini alıyoruz
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        setToast({ message: "Hesap bilgisi alınamadı.", color: "danger" });
        setIsSubmitting(false);
        return;
      }

      currentBalance = parseFloat(response.data[0].guncelBakiye) || 0;
    } catch (err) {
      console.error("Bakiye alma hatası:", err.response || err);
      setToast({ message: "Bakiye kontrolü başarısız.", color: "danger" });
      setIsSubmitting(false);
      return;
    }

    // 7. Düzenleme modunda eski işlemin etkisini geri alır
    let oldAmount = 0;
    let transactionToRemove = null;
    if (editingTransaction) {
      if (!editingTransaction.id) {
        setToast({ message: "Geçersiz işlem ID'si.", color: "danger" });
        setIsSubmitting(false);
        return;
      }
      try {
        const transactionResponse = await api.get(
          `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${selectedUser.id}`
        );
        transactionToRemove = transactionResponse.data.find(
          (t) => t.id === editingTransaction.id
        );
        if (transactionToRemove) {
          oldAmount = parseFloat(transactionToRemove.tutar) || 0;
          if (transactionToRemove.islemTuruId === 1) {
            currentBalance -= oldAmount; // Para Girişi'ni geri al
          } else if (transactionToRemove.islemTuruId === 2) {
            currentBalance += oldAmount; // Para Çıkışı'nı geri al
          } else {
            setToast({
              message:
                "Yalnızca Para Girişi veya Çıkışı işlemleri düzenlenebilir.",
              color: "danger",
            });
            setIsSubmitting(false);
            return;
          }
        } else {
          console.warn(`İşlem ID ${editingTransaction.id} bulunamadı`);
          setToast({
            message: "Düzenlenecek işlem bulunamadı.",
            color: "danger",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.error("İşlem alma hatası:", err.response || err);
        setToast({
          message: "İşlem detayları alınamadı.",
          color: "danger",
        });
        setIsSubmitting(false);
        return;
      }
    }
    // 1. Tarih kontrolü ve ISO formatına dönüştürme
    const transactionDate = transactionForm.date
      ? dayjs(transactionForm.date, "DD.MM.YYYY").isValid()
        ? dayjs(transactionForm.date, "DD.MM.YYYY").toISOString()
        : new Date().toISOString()
      : new Date().toISOString();

    // 2. İşlem nesnesini oluştur
    const transactionObj = {
      id: editingTransaction ? editingTransaction.id : 0,
      kullanicilarId: userId,
      hesapId: selectedUser.id,
      etkilenenHesapId: selectedUser.etkilenenHesapId ?? selectedUser.id,
      hesapKategoriId: selectedUser.hesapKategoriId || 1,
      islemTarihi: transactionDate,
      islemTuruId: isDeposit ? 1 : 2,
      bilgi: transactionForm.description || "",
      aciklama: transactionForm.description || (isDeposit ? "Para Girişi" : "Para Çıkışı"),
      tutar: amount,
      borc: isDeposit ? 0 : amount,
      alacak: isDeposit ? amount : 0,
      bakiye: 0, // İlk başta 0, API'den gelen veriye bağlı
      eklenmeTarihi: editingTransaction
        ? transactionToRemove?.eklenmeTarihi || new Date().toISOString()
        : new Date().toISOString(),
      guncellenmeTarihi: new Date().toISOString(),
      durumu: 1,
    };

    console.log("API'ye gönderilen işlem objesi:", transactionObj);
    setIsSubmitting(true); // Gönderim başladığında true yap

    try {
      let response;
      if (editingTransaction) {
        // Düzenleme modunda ise UPDATE yap
        response = await api.put(`${API_BASE_URL}/hesapHareket/hesapHareket-update`, transactionObj);
      } else {
        // Yeni işlem ise CREATE yap (para girişi veya çıkışı farketmez)
        response = await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, transactionObj);
      }

      // 4. API'den dönen ID'yi al
      const transactionId = editingTransaction
        ? editingTransaction.id
        : response.data.id || Date.now();

      // 5. Yerel state için yeni işlem kaydı oluştur
      const newTransaction = {
        id: transactionId,
        date: transactionForm.date || dayjs().format("DD.MM.YYYY"),
        type: isDeposit ? "Para Girişi" : "Para Çıkışı",
        description: transactionForm.description || (isDeposit ? "Para Girişi" : "Para Çıkışı"),
        debit: isDeposit ? "-" : `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        credit: isDeposit ? `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-",
        islemTarihi: transactionDate,
        islemTuruId: isDeposit ? 1 : 2,
        tutar: amount,
        etkilenenHesapId: selectedUser.etkilenenHesapId || selectedUser.id,
        hesapId: selectedUser.id,
        borc: isDeposit ? 0 : amount,
        alacak: isDeposit ? amount : 0,
        durumu: 1,
      };

      console.log("Yeni işlem:", newTransaction);

      // 6. Yerel state'i güncellemeden önce mevcut transaction'ları al
      let updatedTransactions = [...rawTransactions];

      // 7. Düzenleme modundaysa eski kaydı kaldır
      if (editingTransaction && transactionToRemove) {
        updatedTransactions = updatedTransactions.filter((t) => t.id !== editingTransaction.id);
      }

      // 8. Yeni işlemi ekle (sadece yeni işlemse veya düzenleme modundaysa)
      if (!editingTransaction || (editingTransaction && transactionToRemove)) {
        updatedTransactions.push(newTransaction);
      }

      // 9. Aktif durumdaki transaction'ları filtrele
      const activeTransactions = updatedTransactions.filter((t) => t.durumu === 1);

      // 10. Yeni bakiyeyi hesapla
      const totalCredit = activeTransactions.reduce((acc, t) => acc + (t.alacak || 0), 0);
      const totalDebit = activeTransactions.reduce((acc, t) => acc + (t.borc || 0), 0);
      const newBalance = totalCredit - totalDebit;

      console.log("Yeni bakiye:", newBalance);

      // 12. Yerel state'i güncelle
      updatedTransactions.sort((a, b) =>
        dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1
      );
      setRawTransactions(updatedTransactions);
      setTransactions(updatedTransactions.filter((t) => t.durumu === 1));

      // 15. Kullanıcı ve seçili kullanıcı bakiyelerini günceller
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === selectedUser.id ? { ...u, balance: newBalance } : u))
      );
      setSelectedUser((prev) => ({ ...prev, balance: newBalance }));

      // 16. Gönderim zaman damgasını kaydeder
      processedSubmissions.current.add(submissionTimestamp);

      // 17. Başarı mesajı gösterir
      setToast({
        message: editingTransaction
          ? `İşlem güncellendi: ${oldAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${selectedUser.currency} -> ${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${selectedUser.currency}`
          : "İşlem başarıyla eklendi!",
        color: "success",
      });

      // 18. Modal'ı kapatır ve formu sıfırlar
      setTransactionModalVisible(false);
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
      console.error("Transaction error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        payload: transactionObj,
      });
      setToast({
        message:
          "İşlem sırasında hata oluştu: " + (err.response?.data?.message || err.message),
        color: "danger",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{modalStyles}</style>
      <CModal
        visible={transactionModalVisible}
        backdrop="static"
        keyboard={false}
        onClose={() => {
          setTransactionModalVisible(false);
          setEditingTransaction(null);
          setTransactionForm({
            rawAmount: "",
            formattedAmount: "",
            description: "",
            date: dayjs().format("DD.MM.YYYY"),
            recipientAccount: "",
            submissionTimestamp: null,
          });
        }}
        className="custom-modal"
      >
        <CModalHeader
          style={{
            backgroundColor:
              transactionType === "in"
                ? "var(--income-color)"
                : "var(--outcome-color)",
            color: "white",
          }}
        >
          <CModalTitle>
            {transactionType === "in" ? "Para Girişi Ekle" : "Para Çıkışı Ekle"}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
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
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "İşleniyor..."
                  : editingTransaction
                    ? "Güncelle"
                    : "Ekle"}
              </CButton>
              <CButton
                color="secondary"
                onClick={() => {
                  setTransactionModalVisible(false);
                  setEditingTransaction(null);
                  setTransactionForm({
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
    </>
  );
};

export default TransactionModal;