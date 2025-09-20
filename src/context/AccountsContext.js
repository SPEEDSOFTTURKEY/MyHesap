import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useUsers } from "./UsersContext";
import api from "../api/api";
import dayjs from "dayjs";
import { useLocation } from "react-router-dom";

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

const accountCategories = [
  { categoryId: 1, accountName: "Banka Hesapları", type: "bank" },
  { categoryId: 2, accountName: "Kasa Tanımları", type: "cash" },
  { categoryId: 3, accountName: "Kredi Kartları", type: "creditCard" },
  { categoryId: 4, accountName: "Pos Hesapları", type: "pos" },
  { categoryId: 5, accountName: "Şirket Ortakları Hesapları", type: "partner" },
  { categoryId: 6, accountName: "Veresiye Hesapları", type: "debt" },
];

const AccountsContext = createContext();
const API_BASE_URL = "https://localhost:44375/api";

export const AccountsProvider = ({ children }) => {
  const location = useLocation();
  const { users, setUsers } = useUsers();
  const [userId, setUserId] = useState(() => location.state?.user?.id || getUserId());
  const [selectedUser, setSelectedUser] = useState(null);
  const [accounts, setAccounts] = useState(accountCategories);
  const [filteredAccounts, setFilteredAccounts] = useState(accounts);
  const [formData, setFormData] = useState({
    userName: "",
    accountNumber: "",
    balance: 0,
    currency: "TRY",
    labelColor: "#ccc",
    spendingLimit: "",
    type: "cash",
    description: "",
    kullaniciId: 0,
  });
  const [accountData, setAccountData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [transactionModalVisible, setTransactionModalVisible] = useState(false);
  const [visibleTransferModal, setVisibleTransferModal] = useState(false);
  const [transferDirection, setTransferDirection] = useState("");
  const [transactionType, setTransactionType] = useState("in");
  const [transactionForm, setTransactionForm] = useState({
    rawAmount: "",
    formattedAmount: "",
    description: "",
    date: dayjs().format("DD.MM.YYYY"),
    recipientAccount: "",
    submissionTimestamp: null,
    kullaniciId: 0,
  });
  const [rawTransactions, setRawTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [value, setValue] = useState(dayjs());
  const [toast, setToast] = useState(null);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toaster = useRef();
  const processedSubmissions = useRef(new Set());
  const [showDeleteTransactionModal, setShowDeleteTransactionModal] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [showCancelTransactionModal, setShowCancelTransactionModal] = useState(false);
  const [transactionToCancel, setTransactionToCancel] = useState(null);

  const transactionTypeMap = {
    1: "Para Girişi",
    2: "Para Çıkışı",
    3: "Transfer Çıkış",
    4: "Transfer Giriş",
    5:"İptal",
  };

  // localStorage değişikliklerini dinle ve userId'yi güncelle
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        const newUserId = getUserId();
        setUserId(newUserId);
        // Form ve transaction form'ları güncelle
        setFormData(prev => ({ ...prev, kullaniciId: newUserId }));
        setTransactionForm(prev => ({ ...prev, kullaniciId: newUserId }));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    // Initial check
    const initialUserId = getUserId();
    setUserId(initialUserId);
    setFormData(prev => ({ ...prev, kullaniciId: initialUserId }));
    setTransactionForm(prev => ({ ...prev, kullaniciId: initialUserId }));

    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getTextColor = (bgColor) => {
    if (!bgColor) return "#ffffff";
    const hex = bgColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness >= 128 ? "#000000" : "#ffffff";
  };

  const getCurrencySymbol = (currency) => {
    const symbols = { USD: "$", EUR: "€", GBP: "£", TRY: "₺" };
    return symbols[currency] || "₺";
  };

  const fetchRelatedTransaction = async (transaction, currentUserId = userId, fallbackHesapKategoriId = null) => {
    try {
      const { hesapId, etkilenenHesapId, tutar, islemTarihi, islemTuruId } = transaction;
      const amount = parseFloat(tutar) || 0;
      const isOutgoing = islemTuruId === 3;

      if (etkilenenHesapId) {
        const targetAccountResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${etkilenenHesapId}`);
        const targetAccount = targetAccountResponse.data;
        const response = await api.get(`${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${currentUserId}/${etkilenenHesapId}/${targetAccount.hesapKategoriId || fallbackHesapKategoriId || 1}`);
        const transactions = Array.isArray(response.data) ? response.data : [];
        const related = transactions.find((t) =>
          t.etkilenenHesapId === hesapId &&
          Math.abs(parseFloat(t.tutar) - amount) < 0.01 &&
          dayjs(t.islemTarihi).isSame(dayjs(islemTarihi), "second") &&
          t.islemTuruId === (isOutgoing ? 4 : 3)
        );
        if (related) {
          const recipientUser = {
            id: targetAccount.id,
            userName: targetAccount.tanim || "Bilinmeyen Hesap",
            accountNumber: targetAccount.hesapNo || "-",
            balance: parseFloat(targetAccount.guncelBakiye) || 0,
            currency: targetAccount.paraBirimi || "TRY",
            labelColor: targetAccount.etiketRengi || "#ccc",
            spendingLimit: targetAccount.harcamaLimiti || 0,
            type: accountCategories.find((cat) => cat.categoryId === targetAccount.hesapKategoriId)?.type || "cash",
            hesapKategoriId: targetAccount.hesapKategoriId || 1,
            kullaniciId: currentUserId,
          };
          setUsers((prevUsers) => {
            const userExists = prevUsers.some((u) => u.id === recipientUser.id);
            if (!userExists) return [...prevUsers, recipientUser];
            return prevUsers;
          });
          return { ...related, etkilenenHesapId: hesapId };
        }
      }

      console.warn("fetchRelatedTransaction: etkilenenHesapId eksik, tüm hesaplar taranıyor", { hesapId, etkilenenHesapId, amount, islemTarihi });
      const allAccountsResponse = await api.get(`${API_BASE_URL}/Hesap/hesap-get-all`);
      const allAccounts = Array.isArray(allAccountsResponse.data) ? allAccountsResponse.data : [allAccountsResponse.data];

      for (const account of allAccounts) {
        if (account.id === hesapId) continue;
        const response = await api.get(`${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${currentUserId}/${account.id}/${account.hesapKategoriId || fallbackHesapKategoriId || 1}`);
        const transactions = Array.isArray(response.data) ? response.data : [];
        const related = transactions.find((t) =>
          t.etkilenenHesapId === hesapId &&
          Math.abs(parseFloat(t.tutar) - amount) < 0.01 &&
          dayjs(t.islemTarihi).isSame(dayjs(islemTarihi), "second") &&
          t.islemTuruId === (isOutgoing ? 4 : 3)
        );
        if (related) {
          const recipientUser = {
            id: account.id,
            userName: account.tanim || "Bilinmeyen Hesap",
            accountNumber: account.hesapNo || "-",
            balance: parseFloat(account.guncelBakiye) || 0,
            currency: account.paraBirimi || "TRY",
            labelColor: account.etiketRengi || "#ccc",
            spendingLimit: account.harcamaLimiti || 0,
            type: accountCategories.find((cat) => cat.categoryId === account.hesapKategoriId)?.type || "cash",
            hesapKategoriId: account.hesapKategoriId || 1,
            kullaniciId: currentUserId,
          };
          setUsers((prevUsers) => {
            const userExists = prevUsers.some((u) => u.id === recipientUser.id);
            if (!userExists) return [...prevUsers, recipientUser];
            return prevUsers;
          });
          return { ...related, etkilenenHesapId: hesapId };
        }
      }

      console.warn("fetchRelatedTransaction: Karşı işlem bulunamadı", { hesapId, etkilenenHesapId, amount, islemTarihi });
      return null;
    } catch (err) {
      console.error("fetchRelatedTransaction error:", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
      setToast({ message: `Karşı işlem alınırken hata oluştu: ${err.message}`, color: "danger" });
      return null;
    }
  };

  const fetchTransactions = async (currentUserId = userId, hesapId, hesapKategoriId) => {
    if (!currentUserId || !hesapId || !hesapKategoriId) {
      setError("Geçersiz parametreler: userId, hesapId veya hesapKategoriId eksik.");
      return;
    }
    try {
      const response = await api.get(`${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${hesapId}`);
      console.log("API Response:", JSON.stringify(response.data, null, 2));
      const fetchedTransactions = Array.isArray(response.data) ? response.data : [];
      const formattedTransactions = await Promise.all(fetchedTransactions.map(async (t) => {
        let accountNumber = t.hesapId || "-";
        let userName = selectedUser?.userName || "Bilinmeyen Kullanıcı";

        if (t.islemTuruId === 3 || t.islemTuruId === 4) {
          let targetHesapId = t.etkilenenHesapId;
          let recipientUser = null;

          if (targetHesapId) {
            recipientUser = users.find((u) => u.id === targetHesapId);
            if (!recipientUser) {
              try {
                const recipientResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${targetHesapId}`);
                const data = recipientResponse.data;
                recipientUser = {
                  id: data.id,
                  userName: data.tanim || "Bilinmeyen Hesap",
                  accountNumber: data.hesapNo || "-",
                  balance: parseFloat(data.guncelBakiye) || 0,
                  currency: data.paraBirimi || "TRY",
                  labelColor: data.etiketRengi || "#ccc",
                  spendingLimit: data.harcamaLimiti || 0,
                  type: accountCategories.find((cat) => cat.categoryId === data.hesapKategoriId)?.type || "cash",
                  hesapKategoriId: data.hesapKategoriId || 1,
                  kullaniciId: currentUserId,
                };
                setUsers((prevUsers) => {
                  const userExists = prevUsers.some((u) => u.id === recipientUser.id);
                  if (!userExists) return [...prevUsers, recipientUser];
                  return prevUsers;
                });
              } catch (err) {
                console.error("fetchTransactions: Karşı hesap alınamadı", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
                accountNumber = "-";
                userName = "Bilinmeyen Kullanıcı";
              }
            }
            accountNumber = recipientUser?.accountNumber || "-";
            userName = recipientUser?.userName || "Bilinmeyen Kullanıcı";
          } else {
            const relatedTransaction = await fetchRelatedTransaction(t, currentUserId, hesapKategoriId);
            if (relatedTransaction) {
              targetHesapId = relatedTransaction.hesapId;
              t.etkilenenHesapId = targetHesapId;
              recipientUser = users.find((u) => u.id === targetHesapId);
              if (!recipientUser) {
                const recipientResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${targetHesapId}`);
                const data = recipientResponse.data;
                recipientUser = {
                  id: data.id,
                  userName: data.tanim || "Bilinmeyen Hesap",
                  accountNumber: data.hesapNo || "-",
                  balance: parseFloat(data.guncelBakiye) || 0,
                  currency: data.paraBirimi || "TRY",
                  labelColor: data.etiketRengi || "#ccc",
                  spendingLimit: data.harcamaLimiti || 0,
                  type: accountCategories.find((cat) => cat.categoryId === data.hesapKategoriId)?.type || "cash",
                  hesapKategoriId: data.hesapKategoriId || 1,
                  kullaniciId: currentUserId,
                };
                setUsers((prevUsers) => {
                  const userExists = prevUsers.some((u) => u.id === recipientUser.id);
                  if (!userExists) return [...prevUsers, recipientUser];
                  return prevUsers;
                });
              }
              accountNumber = recipientUser.accountNumber || "-";
              userName = recipientUser.userName || "Bilinmeyen Kullanıcı";
            } else {
              accountNumber = "-";
              userName = "Bilinmeyen Kullanıcı";
            }
          }
        } else {
          const currentUser = users.find((u) => u.id === t.hesapId);
          accountNumber = currentUser?.accountNumber || "-";
          userName = currentUser?.userName || "Bilinmeyen Kullanıcı";
        }

        return {
          id: t.id,
          date: t.islemTarihi ? dayjs(t.islemTarihi).format("DD.MM.YYYY") : "-",
          type: transactionTypeMap[t.islemTuruId] || "Bilinmeyen İşlem",
          userName,
          accountNumber,
          description: t.aciklama || "-",
          debit: t.borc ? `${t.borc.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-",
          credit: t.alacak ? `${t.alacak.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-",
          islemTarihi: t.islemTarihi,
          islemTuruId: t.islemTuruId,
          tutar: t.tutar || 0,
          etkilenenHesapId: t.etkilenenHesapId,
          hesapId: t.hesapId,
          kullaniciId: currentUserId,
        };
      }));
      setRawTransactions(formattedTransactions);
      setTransactions(formattedTransactions.filter((t) => t.hesapId === hesapId));
    } catch (err) {
      console.error("fetchTransactions error:", err);
      setToast({ message: `İşlemler yüklenirken hata oluştu: ${err.message}`, color: "danger" });
    }
  };

  const applyFilters = () => {
    try {
      let filtered = [...rawTransactions];

      if (filterPeriod !== "all") {
        const now = dayjs();
        let startDate;
        switch (filterPeriod) {
          case "today":
            startDate = now.startOf("day");
            break;
          case "last7days":
            startDate = now.subtract(7, "day").startOf("day");
            break;
          case "last30days":
            startDate = now.subtract(30, "day").startOf("day");
            break;
          case "last1year":
            startDate = now.subtract(1, "year").startOf("day");
            break;
          default:
            break;
        }
        filtered = filtered.filter((t) => {
          if (!t.islemTarihi) return false;
          const transactionDate = dayjs(t.islemTarihi);
          return transactionDate.isAfter(startDate) || transactionDate.isSame(startDate, "day");
        });
      }

      if (searchQuery && typeof searchQuery === "string") {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter((t) => {
          const fields = [t.userName, t.accountNumber, t.description, t.type];
          return fields.some((field) => {
            if (!field || typeof field !== "string") return false;
            return field.toLowerCase().includes(query);
          });
        });
      }

      filtered = filtered.sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1);
      setTransactions(filtered);
    } catch (error) {
      console.error("Filtreleme hatası:", error);
      setTransactions([]);
      setToast({ message: "Filtreleme sırasında hata oluştu.", color: "danger" });
    }
  };

  const calculateBalanceAdjustment = (currentBalance, transaction, amount, isDelete = false) => {
    const isOutgoingTransfer = transaction.islemTuruId === 3;
    const isIncomingTransfer = transaction.islemTuruId === 4;
    let adjustment = 0;
    if (transaction.islemTuruId === 1) {
      adjustment = isDelete ? amount : -amount;
    } else if (transaction.islemTuruId === 2) {
      adjustment = isDelete ? -amount : amount;
    } else if (isOutgoingTransfer) {
      adjustment = isDelete ? -amount : amount;
    } else if (isIncomingTransfer) {
      adjustment = isDelete ? amount : -amount;
    }
    return currentBalance + adjustment;
  };

  const updateAccountBalance = async (accountId, newBalance, accountData, currentUserId = userId) => {
    const updatePayload = {
      id: accountId,
      tanim: accountData.tanim,
      hesapNo: accountData.hesapNo,
      guncelBakiye: newBalance,
      paraBirimi: accountData.paraBirimi,
      etiketRengi: accountData.etiketRengi,
      harcamaLimiti: accountData.harcamaLimiti || 0,
      guncellenmeTarihi: new Date().toISOString(),
      hesapKategoriId: accountData.hesapKategoriId || 1,
      durumu: accountData.durumu || 1,
      aktif: accountData.aktif || 1,
      eklenmeTarihi: accountData.eklenmeTarihi || new Date().toISOString(),
      kullaniciId: currentUserId,
    };
    await api.put(`${API_BASE_URL}/Hesap/hesap-update`, updatePayload);
  };

  const updateLocalStates = (updatedTransactions, newSenderBalance, newRecipientBalance, senderId, recipientId, transaction, relatedTransaction = null) => {
    setRawTransactions(updatedTransactions);
    setTransactions(updatedTransactions.filter((t) => t.hesapId === selectedUser?.id));

    setUsers((prevUsers) =>
      prevUsers.map((u) =>
        u.id === senderId ? { ...u, balance: newSenderBalance, kullaniciId: userId } :
        u.id === recipientId && newRecipientBalance !== null ? { ...u, balance: newRecipientBalance, kullaniciId: userId } : u
      )
    );

    if (selectedUser?.id === senderId) {
      setSelectedUser((prev) => ({ ...prev, balance: newSenderBalance, kullaniciId: userId }));
    } else if (selectedUser?.id === recipientId && newRecipientBalance !== null) {
      setSelectedUser((prev) => ({ ...prev, balance: newRecipientBalance, kullaniciId: userId }));
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!transaction?.id || !transaction.hesapId) {
      setToast({ message: "Geçersiz işlem veya hesap ID'si.", color: "danger" });
      console.error("handleDeleteTransaction: Geçersiz transaction nesnesi", transaction);
      return;
    }

    const currentUserId = userId;
    const amount = parseFloat(transaction.tutar) || 0;
    const isOutgoingTransfer = transaction.islemTuruId === 3;
    const isIncomingTransfer = transaction.islemTuruId === 4;
    const isTransfer = isOutgoingTransfer || isIncomingTransfer;

    try {
      const senderResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transaction.hesapId}`);
      let senderBalance = parseFloat(senderResponse.data.guncelBakiye) || 0;
      let newSenderBalance = calculateBalanceAdjustment(senderBalance, transaction, amount, true);

      let newRecipientBalance = null;
      let relatedTransaction = null;
      let recipientAccount = null;
      if (isTransfer && transaction.etkilenenHesapId) {
        relatedTransaction = await fetchRelatedTransaction(transaction, currentUserId);
        if (!relatedTransaction) {
          setToast({ message: "İlgili transfer işlemi bulunamadı.", color: "danger" });
          console.warn("handleDeleteTransaction: Karşı işlem bulunamadı", transaction.etkilenenHesapId);
          return;
        }

        const recipientResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transaction.etkilenenHesapId}`);
        recipientAccount = recipientResponse.data;
        let recipientBalance = parseFloat(recipientAccount.guncelBakiye) || 0;
        newRecipientBalance = calculateBalanceAdjustment(recipientBalance, transaction, amount, true);
      }

      await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-deletee/${transaction.id}`);
      if (relatedTransaction) await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-deletee/${relatedTransaction.id}`);

      await updateAccountBalance(transaction.hesapId, newSenderBalance, senderResponse.data, currentUserId);
      if (isTransfer && recipientAccount) await updateAccountBalance(transaction.etkilenenHesapId, newRecipientBalance, recipientAccount, currentUserId);

      const updatedTransactions = rawTransactions.filter((t) => t.id !== transaction.id && t.id !== (relatedTransaction?.id || null));
      updateLocalStates(updatedTransactions, newSenderBalance, newRecipientBalance, transaction.hesapId, transaction.etkilenenHesapId, transaction, relatedTransaction);

      await fetchTransactions(currentUserId, selectedUser.id, selectedUser.hesapKategoriId);
      setToast({ message: "İşlem başarıyla silindi.", color: "success" });
    } catch (err) {
      console.error("handleDeleteTransaction error:", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
      setToast({ message: `İşlem silinirken hata oluştu: ${err.response?.data?.message || err.message}`, color: "danger" });
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete?.id || !transactionToDelete.hesapId) {
      setToast({ message: "İşlem ID'si veya hesap ID'si eksik.", color: "danger" });
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
      return;
    }

    const currentUserId = userId;
    const amount = parseFloat(transactionToDelete.tutar) || 0;
    const isOutgoingTransfer = transactionToDelete.islemTuruId === 3;
    const isIncomingTransfer = transactionToDelete.islemTuruId === 4;
    const isTransfer = isOutgoingTransfer || isIncomingTransfer;

    try {
      const senderResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transactionToDelete.hesapId}`);
      let senderBalance = parseFloat(senderResponse.data.guncelBakiye) || 0;
      let newSenderBalance = calculateBalanceAdjustment(senderBalance, transactionToDelete, amount, true);

      let newRecipientBalance = null;
      let relatedTransaction = null;
      let recipientAccount = null;
      if (isTransfer && transactionToDelete.etkilenenHesapId) {
        relatedTransaction = await fetchRelatedTransaction(transactionToDelete, currentUserId);
        if (!relatedTransaction) {
          setToast({ message: "İlgili transfer işlemi bulunamadı.", color: "danger" });
          console.warn("confirmDeleteTransaction: Karşı işlem bulunamadı", transactionToDelete.etkilenenHesapId);
          return;
        }
        const recipientResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transactionToDelete.etkilenenHesapId}`);
        recipientAccount = recipientResponse.data;
        let recipientBalance = parseFloat(recipientAccount.guncelBakiye) || 0;
        newRecipientBalance = calculateBalanceAdjustment(recipientBalance, transactionToDelete, amount, true);
      } else if (isTransfer && !transactionToDelete.etkilenenHesapId) {
        setToast({ message: "Transfer işlemi için karşı hesap ID'si eksik.", color: "danger" });
        console.warn("confirmDeleteTransaction: etkilenenHesapId eksik", transactionToDelete);
        return;
      }

      await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-deletee/${transactionToDelete.id}`);
      if (relatedTransaction) await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-deletee/${relatedTransaction.id}`);

      await updateAccountBalance(transactionToDelete.hesapId, newSenderBalance, senderResponse.data, currentUserId);
      if (isTransfer && recipientAccount) await updateAccountBalance(transactionToDelete.etkilenenHesapId, newRecipientBalance, recipientAccount, currentUserId);

      const updatedTransactions = rawTransactions
        .filter((t) => t.id !== transactionToDelete.id && t.id !== (relatedTransaction?.id || null))
        .sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1);
      updateLocalStates(updatedTransactions, newSenderBalance, newRecipientBalance, transactionToDelete.hesapId, transactionToDelete.etkilenenHesapId, transactionToDelete, relatedTransaction);

      await fetchTransactions(currentUserId, selectedUser.id, selectedUser.hesapKategoriId);
      setToast({ message: "İşlem başarıyla silindi.", color: "success" });
    } catch (err) {
      console.error("confirmDeleteTransaction error:", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
      setToast({ message: `İşlem silinirken hata oluştu: ${err.response?.data?.message || err.message}`, color: "danger" });
    } finally {
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
    }
  };

  const handleCancelTransaction = (transaction) => {
    if (transaction.islemTuruId !== 3 && transaction.islemTuruId !== 4) {
      setToast({ message: "Yalnızca transfer işlemleri iptal edilebilir.", color: "warning" });
      return;
    }
    setTransactionToCancel(transaction);
    setShowCancelTransactionModal(true);
  };

  const confirmCancelTransaction = async () => {
    if (!transactionToCancel || !transactionToCancel.id || !transactionToCancel.hesapId) {
      setToast({ message: "Geçersiz işlem veya hesap ID'si.", color: "danger" });
      console.error("confirmCancelTransaction: Geçersiz transactionToCancel nesnesi", transactionToCancel);
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
      return;
    }

    const currentUserId = userId;
    if (transactionToCancel.islemTuruId !== 3 && transactionToCancel.islemTuruId !== 4 || !transactionToCancel.etkilenenHesapId) {
      setToast({ message: "Yalnızca geçerli transfer işlemleri iptal edilebilir. Karşı hesap ID'si eksik.", color: "warning" });
      console.warn("confirmCancelTransaction: Desteklenmeyen işlem türü veya eksik etkilenenHesapId", transactionToCancel);
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
      return;
    }

    try {
      const response = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transactionToCancel.hesapId}`);
      console.log("Accounts;",transactionToCancel.hesapId);
      let currentBalance = parseFloat(response.data.guncelBakiye) || 0;
      const amount = parseFloat(transactionToCancel.tutar) || 0;

      let newBalance = calculateBalanceAdjustment(currentBalance, transactionToCancel, amount, false);
      let affectedAccountBalance = null;
      let affectedAccountResponse = null;
      let relatedTransaction = null;
      let reverseTransactionTypeId;
      let reverseDescription;

      if (transactionToCancel.islemTuruId === 3) {
        reverseTransactionTypeId = 4;
        reverseDescription = "Transfer Giriş (İptal)";
      } else {
        reverseTransactionTypeId = 3;
        reverseDescription = "Transfer Çıkış (İptal)";
      }

      relatedTransaction = await fetchRelatedTransaction(transactionToCancel, currentUserId);
      if (!relatedTransaction) {
        setToast({ message: "İlgili transfer işlemi bulunamadı.", color: "danger" });
        console.warn("confirmCancelTransaction: Karşı işlem bulunamadı", transactionToCancel.etkilenenHesapId);
        setShowCancelTransactionModal(false);
        setTransactionToCancel(null);
        return;
      }

      affectedAccountResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${transactionToCancel.etkilenenHesapId}?kullaniciId=${currentUserId}`);
      let affectedBalance = parseFloat(affectedAccountResponse.data.guncelBakiye);
      affectedAccountBalance = calculateBalanceAdjustment(affectedBalance, relatedTransaction, amount, false);

      const cancelTransactionObj = {
        id: 0,
        kullanicilarId: currentUserId,
        hesapId: transactionToCancel.hesapId,
        etkilenenHesapId: transactionToCancel.etkilenenHesapId,
        hesapKategoriId: transactionToCancel.hesapKategoriId || response.data.hesapKategoriId || 1,
        islemTarihi: new Date().toISOString(),
        islemTuruId: reverseTransactionTypeId,
        durumu: 1,
        bilgi: `İptal: ${transactionToCancel.bilgi || transactionToCancel.aciklama || "İptal işlemi"}`,
        aciklama: reverseDescription,
        tutar: amount,
        borc: reverseTransactionTypeId === 3 ? amount : 0,
        alacak: reverseTransactionTypeId === 4 ? amount : 0,
        bakiye: newBalance,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      const relatedCancelTransactionObj = {
        id: 0,
        kullanicilarId: currentUserId,
        hesapId: relatedTransaction.hesapId,
        etkilenenHesapId: relatedTransaction.etkilenenHesapId,
        hesapKategoriId: relatedTransaction.hesapKategoriId || affectedAccountResponse.data.hesapKategoriId || 1,
        islemTarihi: new Date().toISOString(),
        islemTuruId: relatedTransaction.islemTuruId === 3 ? 4 : 3,
        durumu: 1,
        bilgi: `İptal: ${relatedTransaction.bilgi || relatedTransaction.aciklama || "İptal işlemi"}`,
        aciklama: relatedTransaction.islemTuruId === 3 ? "Transfer Giriş (İptal)" : "Transfer Çıkış (İptal)",
        tutar: amount,
        borc: relatedTransaction.islemTuruId === 4 ? amount : 0,
        alacak: relatedTransaction.islemTuruId === 3 ? amount : 0,
        bakiye: affectedAccountBalance,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, cancelTransactionObj);
      await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, relatedCancelTransactionObj);

      await updateAccountBalance(transactionToCancel.hesapId, newBalance, response.data, currentUserId);
      if (affectedAccountResponse) await updateAccountBalance(transactionToCancel.etkilenenHesapId, affectedAccountBalance, affectedAccountResponse.data, currentUserId);

      const newTransaction = {
        id: Date.now(),
        date: dayjs().format("DD.MM.YYYY"),
        type: reverseDescription,
        userName: response.data.tanim,
        accountNumber: response.data.hesapNo,
        description: cancelTransactionObj.bilgi,
        debit: reverseTransactionTypeId === 3 ? amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-",
        credit: reverseTransactionTypeId === 4 ? amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-",
        islemTarihi: new Date().toISOString(),
        islemTuruId: reverseTransactionTypeId,
        tutar: amount,
        etkilenenHesapId: transactionToCancel.etkilenenHesapId,
        hesapId: transactionToCancel.hesapId,
        kullaniciId: currentUserId,
      };

      const relatedNewTransaction = {
        id: Date.now() + 1,
        date: dayjs().format("DD.MM.YYYY"),
        type: relatedCancelTransactionObj.aciklama,
        userName: affectedAccountResponse?.data.tanim || "Bilinmeyen Hesap",
        accountNumber: affectedAccountResponse?.data.hesapNo || "-",
        description: relatedCancelTransactionObj.bilgi,
        debit: relatedCancelTransactionObj.borc ? relatedCancelTransactionObj.borc.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-",
        credit: relatedCancelTransactionObj.alacak ? relatedCancelTransactionObj.alacak.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) : "-",
        islemTarihi: new Date().toISOString(),
        islemTuruId: relatedCancelTransactionObj.islemTuruId,
        tutar: amount,
        etkilenenHesapId: transactionToCancel.hesapId,
        hesapId: transactionToCancel.etkilenenHesapId,
        kullaniciId: currentUserId,
      };

      const updatedTransactions = [...rawTransactions, newTransaction, relatedNewTransaction].sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1);
      updateLocalStates(updatedTransactions, newBalance, affectedAccountBalance, transactionToCancel.hesapId, transactionToCancel.etkilenenHesapId, transactionToCancel);

      await fetchTransactions(currentUserId, selectedUser.id, selectedUser.hesapKategoriId);
      setToast({ message: "Transfer işlemi başarıyla iptal edildi.", color: "success" });
    } catch (err) {
      console.error("confirmCancelTransaction error:", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
      setToast({ message: `İşlem iptal edilirken hata oluştu: ${err.response?.data?.message || err.message}`, color: "danger" });
    } finally {
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
    }
  };

  const handleEditTransaction = async (transaction) => {
    if (!transaction || !transaction.id || !transaction.hesapId) {
      setToast({ message: "Geçersiz işlem veya hesap ID'si. İşlem verisi eksik.", color: "danger" });
      console.error("handleEditTransaction: Geçersiz transaction nesnesi", transaction);
      return;
    }

    const currentUserId = userId;
    setEditingTransaction(transaction);
    setIsSubmitting(false);

    const amount = parseFloat(transaction.tutar) || 0;
    if (amount <= 0) {
      setToast({ message: "Geçersiz tutar. Tutar sıfır veya negatif olamaz.", color: "danger" });
      console.warn("handleEditTransaction: Geçersiz tutar", transaction.tutar);
      return;
    }
    const formattedAmount = amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 });

    const debit = transaction.islemTuruId === 2 || transaction.islemTuruId === 3 ? amount : 0;
    const credit = transaction.islemTuruId === 1 || transaction.islemTuruId === 4 ? amount : 0;

    let recipientAccount = "";
    let recipientUser = null;

    if (transaction.islemTuruId === 3 || transaction.islemTuruId === 4) {
        let targetHesapId = transaction.etkilenenHesapId;

        if (!targetHesapId) {
          const relatedTransaction = await fetchRelatedTransaction(transaction, currentUserId, selectedUser?.hesapKategoriId);
          if (relatedTransaction) {
            targetHesapId = relatedTransaction.hesapId;
            transaction.etkilenenHesapId = targetHesapId;
            setEditingTransaction({ ...transaction, etkilenenHesapId: targetHesapId });
          } else {
            setToast({ message: "İlgili transfer işlemi bulunamadı. Lütfen işlemi kontrol edin.", color: "danger" });
            console.warn("handleEditTransaction: Karşı işlem bulunamadı", transaction);
            return;
          }
        }

        recipientUser = users.find((u) => u.id === targetHesapId);
        if (!recipientUser) {
          try {
            const response = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${targetHesapId}?kullaniciId=${currentUserId}`);
            const data = response.data;
            recipientUser = {
              id: data.id,
              userName: data.tanim || "Bilinmeyen Hesap",
              accountNumber: data.hesapNo || "-",
              balance: parseFloat(data.guncelBakiye) || 0,
              currency: data.paraBirimi || "TRY",
              labelColor: data.etiketRengi || "#ccc",
              spendingLimit: data.harcamaLimiti || 0,
              type: accountCategories.find((cat) => cat.categoryId === data.hesapKategoriId)?.type || "cash",
              hesapKategoriId: data.hesapKategoriId || 1,
              kullaniciId: currentUserId,
            };
            setUsers((prevUsers) => {
              const userExists = prevUsers.some((u) => u.id === recipientUser.id);
              if (!userExists) return [...prevUsers, recipientUser];
              return prevUsers;
            });
          } catch (err) {
            console.error("handleEditTransaction: Karşı hesap alınamadı", { message: err.message, response: err.response?.data, status: err.response?.status, url: err.config?.url });
            setToast({ message: `Karşı hesap alınamadı: ${err.response?.data?.message || err.message}`, color: "danger" });
            return;
          }
        }
        recipientAccount = recipientUser.accountNumber || "-";
      } else {
        recipientAccount = users.find((u) => u.id === transaction.hesapId)?.accountNumber || "-";
      }

      setTransactionForm({
        rawAmount: amount.toString(),
        formattedAmount,
        description: transaction.bilgi || transaction.aciklama || "",
        date: transaction.islemTarihi ? dayjs(transaction.islemTarihi).format("DD.MM.YYYY") : dayjs().format("DD.MM.YYYY"),
        recipientAccount,
        submissionTimestamp: null,
        kullaniciId: currentUserId,
      });

      setValue(transaction.islemTarihi ? dayjs(transaction.islemTarihi) : dayjs());

      if (transaction.islemTuruId === 1) {
        setTransactionType("in");
        setTransactionModalVisible(true);
        setVisibleTransferModal(false);
      } else if (transaction.islemTuruId === 2) {
        setTransactionType("out");
        setTransactionModalVisible(true);
        setVisibleTransferModal(false);
      } else if (transaction.islemTuruId === 3) {
        setTransferDirection("outgoing");
        setVisibleTransferModal(true);
        setTransactionModalVisible(false);
      } else if (transaction.islemTuruId === 4) {
        setTransferDirection("incoming");
        setVisibleTransferModal(true);
        setTransactionModalVisible(false);
      } else {
        setToast({ message: "Desteklenmeyen işlem türü. Yalnızca para girişi, çıkışı veya transfer işlemleri düzenlenebilir.", color: "danger" });
        console.error("handleEditTransaction: Desteklenmeyen işlem türü", transaction.islemTuruId);
        return;
      }

      console.log("handleEditTransaction: İşlem hazırlandı", {
        transactionId: transaction.id,
        tutar: amount,
        debit,
        credit,
        recipientAccount,
        islemTuruId: transaction.islemTuruId,
        etkilenenHesapId: transaction.etkilenenHesapId,
        recipientUser,
        kullaniciId: currentUserId,
      });
  };

  const createTransactionObject = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedUser) {
      setToast({ message: "Lütfen önce bir kullanıcı seçin.", color: "danger" });
      return;
    }

    const currentUserId = userId;
    setIsSubmitting(true);
    const submissionTimestamp = Date.now();
    if (processedSubmissions.current.has(submissionTimestamp)) return;

    try {
      const amount = parseFloat(transactionForm.rawAmount);
      if (isNaN(amount) || amount <= 0) {
        setToast({ message: "Lütfen geçerli bir tutar girin.", color: "danger" });
        return;
      }

      let sender, recipient;
      if (transferDirection === "outgoing") {
        sender = selectedUser;
        recipient = users.find((u) => u.accountNumber === transactionForm.recipientAccount);
      } else {
        sender = users.find((u) => u.accountNumber === transactionForm.recipientAccount);
        recipient = selectedUser;
      }

      if (!sender || !recipient) {
        setToast({ message: "Gönderen veya alıcı hesap bulunamadı.", color: "danger" });
        return;
      }

      if (sender.accountNumber === recipient.accountNumber) {
        setToast({ message: "Aynı hesaba transfer yapılamaz.", color: "danger" });
        return;
      }

      if (sender.currency !== recipient.currency) {
        setToast({ message: "Hesaplar farklı para birimlerinde, transfer yapılamaz.", color: "danger" });
        return;
      }

      const accountSenderResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${sender.id}?kullaniciId=${currentUserId}`);
      const accountRecipientResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${recipient.id}?kullaniciId=${currentUserId}`);
      let senderBalance = parseFloat(accountSenderResponse.data.guncelBakiye) || 0;
      let recipientBalance = parseFloat(accountRecipientResponse.data.guncelBakiye) || 0;

      let oldAmount = 0;
      let senderTransactionToRemove = null;
      let recipientTransactionToRemove = null;

      if (editingTransaction) {
        oldAmount = parseFloat(editingTransaction.tutar) || 0;
        const isOutgoing = editingTransaction.islemTuruId === 3;

        const senderTransactions = await api.get(`${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${currentUserId}/${sender.id}/${sender.hesapKategoriId}`);
        senderTransactionToRemove = senderTransactions.data.find((t) => t.id === editingTransaction.id);

        if (senderTransactionToRemove) {
          if (isOutgoing) {
            senderBalance += oldAmount;
            recipientBalance -= oldAmount;
          } else {
            senderBalance -= oldAmount;
            recipientBalance += oldAmount;
          }

          recipientTransactionToRemove = await fetchRelatedTransaction(editingTransaction, currentUserId, sender.hesapKategoriId);
          if (!recipientTransactionToRemove) {
            setToast({ message: "İlgili alıcı işlemi bulunamadı.", color: "danger" });
            return;
          }
        } else {
          setToast({ message: "Düzenlenecek işlem bulunamadı.", color: "danger" });
          return;
        }
      }

      if (amount > senderBalance) {
        setToast({ message: "Yetersiz bakiye.", color: "danger" });
        return;
      }

      const newSenderBalance = senderBalance - amount;
      const newRecipientBalance = recipientBalance + amount;

      const senderTransactionObj = {
        id: editingTransaction ? editingTransaction.id : 0,
        kullanicilarId: currentUserId,
        hesapId: sender.id,
        etkilenenHesapId: recipient.id,
        hesapKategoriId: sender.hesapKategoriId || 1,
        islemTarihi: new Date(transactionForm.date).toISOString(),
        islemTuruId: 3,
        durumu: 1,
        bilgi: transactionForm.description || "",
        aciklama: `Transfer - Alıcı: ${recipient.userName}`,
        borc: amount,
        alacak: 0,
        tutar: amount,
        bakiye: newSenderBalance,
        eklenmeTarihi: editingTransaction ? editingTransaction.eklenmeTarihi : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      const recipientTransactionObj = {
        id: recipientTransactionToRemove ? recipientTransactionToRemove.id : 0,
        kullanicilarId: currentUserId,
        hesapId: recipient.id,
        etkilenenHesapId: sender.id,
        hesapKategoriId: recipient.hesapKategoriId || 1,
        islemTarihi: new Date(transactionForm.date).toISOString(),
        islemTuruId: 4,
        durumu: 1,
        bilgi: transactionForm.description || "",
        aciklama: `Transfer - Gönderen: ${sender.userName}`,
        borc: 0,
        alacak: amount,
        tutar: amount,
        bakiye: newRecipientBalance,
        eklenmeTarihi: recipientTransactionToRemove ? recipientTransactionToRemove.eklenmeTarihi : new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      const senderResponse = editingTransaction
        ? await api.put(`${API_BASE_URL}/hesapHareket/hesapHareket-updatee`, senderTransactionObj)
        : await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, senderTransactionObj);
      const recipientResponse = recipientTransactionToRemove
        ? await api.put(`${API_BASE_URL}/hesapHareket/hesapHareket-updatee`, recipientTransactionObj)
        : await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, recipientTransactionObj);

      await updateAccountBalance(sender.id, newSenderBalance, accountSenderResponse.data, currentUserId);
      await updateAccountBalance(recipient.id, newRecipientBalance, accountRecipientResponse.data, currentUserId);

      const senderTransaction = {
        id: senderResponse.data.id || Date.now(),
        date: dayjs(transactionForm.date).format("DD.MM.YYYY"),
        type: "Transfer Çıkış",
        userName: sender.userName,
        accountNumber: recipient.accountNumber,
        description: `Transfer - Alıcı: ${recipient.userName}`,
        debit: `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        credit: "-",
        islemTarihi: new Date(transactionForm.date).toISOString(),
        islemTuruId: 3,
        tutar: amount,
        etkilenenHesapId: recipient.id,
        hesapId: sender.id,
        kullaniciId: currentUserId,
      };

      const recipientTransaction = {
        id: recipientResponse.data.id || Date.now() + 1,
        date: dayjs(transactionForm.date).format("DD.MM.YYYY"),
        type: "Transfer Giriş",
        userName: recipient.userName,
        accountNumber: sender.accountNumber,
        description: `Transfer - Gönderen: ${sender.userName}`,
        debit: "-",
        credit: `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        islemTarihi: new Date(transactionForm.date).toISOString(),
        islemTuruId: 4,
        tutar: amount,
        etkilenenHesapId: sender.id,
        hesapId: recipient.id,
        kullaniciId: currentUserId,
      };

      setRawTransactions((prev) => {
        let updated = prev.filter((t) => t.id !== senderTransactionObj.id && t.id !== recipientTransactionObj.id);
        updated.push(senderTransaction, recipientTransaction);
        return updated.sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1);
      });

      if (sender.id === selectedUser.id) {
        setSelectedUser({ ...sender, balance: newSenderBalance, kullaniciId: currentUserId });
        setTransactions((prev) =>
          prev.filter((t) => t.id !== senderTransactionObj.id).concat(senderTransaction).sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1)
        );
      } else if (recipient.id === selectedUser.id) {
        setSelectedUser({ ...recipient, balance: newRecipientBalance, kullaniciId: currentUserId });
        setTransactions((prev) =>
          prev.filter((t) => t.id !== recipientTransactionObj.id).concat(recipientTransaction).sort((a, b) => dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1)
        );
      }

      await fetchTransactions(currentUserId, recipient.id, recipient.hesapKategoriId);

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === sender.id ? { ...u, balance: newSenderBalance, kullaniciId: currentUserId } :
          u.id === recipient.id ? { ...u, balance: newRecipientBalance, kullaniciId: currentUserId } : u
        )
      );

      setToast({
        message: editingTransaction ? "Transfer işlemi başarıyla güncellendi." : "Transfer işlemi başarıyla gerçekleştirildi.",
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
        kullaniciId: currentUserId,
      });
    } catch (err) {
      console.error("Transfer güncelleme hatası:", err.response || err);
      setToast({ message: `Transfer güncellenirken hata oluştu: ${err.response?.data?.message || err.message}`, color: "danger" });
    } finally {
      setIsSubmitting(false);
    }
  };

const fetchAccount = async (accountId) => {  // accountId parametresi eklendi
  const currentUserId = userId;
  if (!accountId) {  // accountId kontrolü
    setError("Hesap ID bulunamadı.");
    return;
  }
  setLoading(true);
  try {
    const contextUser = users.find((u) => u.id === accountId);  // currentUserId yerine accountId
    if (contextUser) {
      setSelectedUser({ ...contextUser, kullaniciId: currentUserId });
      setFormData({
        userName: contextUser.userName || "",
        accountNumber: contextUser.accountNumber || "",
        balance: contextUser.balance || 0,
        currency: contextUser.currency || "TRY",
        labelColor: contextUser.labelColor || "#ccc",
        spendingLimit: contextUser.spendingLimit || "",
        type: contextUser.type || "cash",
        description: contextUser.description || "",
        kullaniciId: currentUserId,
      });
      setAccountData({
        id: contextUser.id,
        tanim: contextUser.userName,
        hesapNo: contextUser.accountNumber,
        guncelBakiye: contextUser.balance,
        paraBirimi: contextUser.currency,
        etiketRengi: contextUser.labelColor,
        harcamaLimiti: contextUser.spendingLimit,
        hesapKategoriId: contextUser.hesapKategoriId || 1,
        kullaniciId: currentUserId,
      });
      if (contextUser.id && contextUser.hesapKategoriId) {
        await fetchTransactions(currentUserId, contextUser.id, contextUser.hesapKategoriId);
      } else {
        setError("Hesap ID veya kategori ID eksik.");
      }
      setError(null);
      setLoading(false);
      return;
    }
    
    // API çağrısında accountId kullanılıyor
    // const response = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-byy-Id/${accountId}`);
    console.log("account", accountId);
    const data = response.data;
    const formattedUser = {
      id: data.id,
      userName: data.tanim?.trim() || "İsimsiz Hesap",
      accountNumber: data.hesapNo?.trim() || "",
      balance: data.guncelBakiye || 0,
      currency: data.paraBirimi || "TRY",
      labelColor: data.etiketRengi || "#ccc",
      spendingLimit: data.harcamaLimiti || 0,
      type: accountCategories.find((cat) => cat.categoryId === data.hesapKategoriId)?.type || "cash",
      hesapKategoriId: data.hesapKategoriId || 1,
      kullaniciId: currentUserId,
    };
    setSelectedUser({ ...formattedUser });
    setFormData({
      userName: data.tanim || "",
      accountNumber: data.hesapNo || "",
      balance: data.guncelBakiye || 0,
      currency: data.paraBirimi || "TRY",
      labelColor: data.etiketRengi || "#ccc",
      spendingLimit: data.harcamaLimiti || "",
      type: formattedUser.type,
      description: data.description || "",
      kullaniciId: currentUserId,
    });
    setAccountData({ ...data, kullaniciId: currentUserId });
    setUsers((prevUsers) => {
      const userExists = prevUsers.some((u) => u.id === data.id);
      if (!userExists && formattedUser.userName) return [...prevUsers, formattedUser];
      return prevUsers;
    });

    if (data.id && data.hesapKategoriId) {
      await fetchTransactions(currentUserId, data.id, data.hesapKategoriId);
    } else {
      setError("Hesap ID veya kategori ID eksik.");
    }
    setError(null);
  } catch (err) {
    setError("Hesap bilgileri alınamadı: " + (err.response?.data?.message || err.message));
  } finally {
    setLoading(false);
  }
};
  const createAccount = async (newAccountData) => {
    const currentUserId = getUserId();
    try {
      const payload = {
        tanim: newAccountData.userName,
        hesapNo: newAccountData.accountNumber,
        guncelBakiye: newAccountData.balance,
        paraBirimi: newAccountData.currency,
        etiketRengi: newAccountData.labelColor,
        harcamaLimiti: newAccountData.spendingLimit || 0,
        hesapKategoriId: accountCategories.find((cat) => cat.type === newAccountData.type)?.categoryId || 2,
        kullaniciId: currentUserId,  // Backend'e uyumlu: kullaniciId
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
        durumu: 1,
        aktif: 1,
      };

      const response = await api.post(`${API_BASE_URL}/Hesap/hesap-create`, payload);
      const createdAccount = response.data.data || response.data;  // CreatedAtAction'dan dönen Data

      const formattedAccount = {
        id: createdAccount.id,
        userName: createdAccount.tanim,
        accountNumber: createdAccount.hesapNo,
        balance: createdAccount.guncelBakiye,
        currency: createdAccount.paraBirimi,
        labelColor: createdAccount.etiketRengi,
        spendingLimit: createdAccount.harcamaLimiti,
        type: newAccountData.type,
        hesapKategoriId: createdAccount.hesapKategoriId,
        kullaniciId: currentUserId,
      };
      setUsers((prevUsers) => [...prevUsers, formattedAccount]);
    } catch (err) {
      throw new Error("Hesap oluşturma başarısız: " + (err.response?.data?.message || err.message));
    }
  };

 useEffect(() => {
  // Eğer belirli bir accountId varsa onu kullanın, yoksa userId'yi kullanın
  const targetAccountId = location.state?.accountId || userId;
  fetchAccount(targetAccountId);
  
  return () => {
    setTransactionForm({
      rawAmount: "",
      formattedAmount: "",
      description: "",
      date: dayjs().format("DD.MM.YYYY"),
      recipientAccount: "",
      submissionTimestamp: null,
      kullaniciId: userId,
    });
    setEditingTransaction(null);
    processedSubmissions.current.clear();
  };
}, [userId, location.state?.accountId]); // location.state?.accountId dependency eklendi

  useEffect(() => {
    if (modalVisible && selectedUser) {
      setFormData({
        userName: selectedUser.userName || "",
        accountNumber: selectedUser.accountNumber || "",
        balance: selectedUser.balance || 0,
        currency: selectedUser.currency || "TRY",
        labelColor: selectedUser.labelColor || "#ccc",
        spendingLimit: selectedUser.spendingLimit || "",
        type: selectedUser.type || "cash",
        description: selectedUser.description || "",
        kullaniciId: userId,
      });
    }
  }, [modalVisible, selectedUser]);

  useEffect(() => {
    try {
      const filtered = applyFilters(accounts, searchQuery);
      setFilteredAccounts(filtered);
    } catch (error) {
      console.error("Filtreleme sırasında hata:", error);
      setFilteredAccounts([]);
    }
    applyFilters();
  }, [filterPeriod, searchQuery, rawTransactions, accounts]);

  const contextValue = {
    accounts,
    setAccounts,
    selectedUser,
    setSelectedUser,
    formData,
    setFormData,
    accountData,
    setAccountData,
    loading,
    error,
    modalVisible,
    setModalVisible,
    transactionModalVisible,
    setTransactionModalVisible,
    visibleTransferModal,
    setVisibleTransferModal,
    transferDirection,
    setTransferDirection,
    transactionType,
    setTransactionType,
    transactionForm,
    setTransactionForm,
    transactions,
    rawTransactions,
    setRawTransactions,
    setTransactions,
    searchQuery,
    setSearchQuery,
    filterPeriod,
    setFilterPeriod,
    value,
    setValue,
    toast,
    setToast,
    editingTransaction,
    setEditingTransaction,
    isSubmitting,
    setIsSubmitting,
    toaster,
    processedSubmissions,
    users,
    setUsers,
    userId,
    getTextColor,
    getCurrencySymbol,
    fetchTransactions,
    applyFilters,
    handleDeleteTransaction,
    handleCancelTransaction,
    handleEditTransaction,
    showDeleteTransactionModal,
    setShowDeleteTransactionModal,
    transactionToDelete,
    setTransactionToDelete,
    confirmDeleteTransaction,
    showCancelTransactionModal,
    setShowCancelTransactionModal,
    transactionToCancel,
    setTransactionToCancel,
    confirmCancelTransaction,
    createAccount,
    createTransactionObject,
    fetchRelatedTransaction,
  };

  return (
    <AccountsContext.Provider value={contextValue}>
      {children}
    </AccountsContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountsContext);
  if (!context) {
    throw new Error("useAccounts must be used within an AccountsProvider");
  }
  return context;
};