import React from "react";
import {
  CCard,
  CCardHeader,
  CCardBody,
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
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPen, cilX, cilTrash } from "@coreui/icons";
import { useAccounts } from "../../context/AccountsContext";
import api from "../../api/api";
import dayjs from "dayjs";
import "../../scss/style.scss";

const API_BASE_URL = "https://localhost:44375/api";

const TransactionTable = () => {
  const {
    transactions,
    handleEditTransaction,
    handleCancelTransaction,
    handleDeleteTransaction,
    showDeleteTransactionModal,
    setShowDeleteTransactionModal,
    transactionToDelete,
    setTransactionToDelete,
    showCancelTransactionModal,
    setShowCancelTransactionModal,
    transactionToCancel,
    setTransactionToCancel,
    rawTransactions,
    setRawTransactions,
    setTransactions,
    selectedUser,
    setSelectedUser,
    users,
    setUsers,
    userId,
    setToast,
    fetchTransactions,
  } = useAccounts();

  const fetchRelatedTransaction = async (
    hesapId,
    etkilenenHesapId,
    amount,
    islemTarihi,
    isOutgoing,
    userId,
    hesapKategoriId
  ) => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${userId}/${etkilenenHesapId}/${hesapKategoriId}`
      );
      const transactions = Array.isArray(response.data) ? response.data : [];
      const related = transactions.find(
        (t) =>
          t.etkilenenHesapId === hesapId &&
          parseFloat(t.tutar) === parseFloat(amount) &&
          t.islemTarihi === islemTarihi &&
          t.islemTuruId === (isOutgoing ? 4 : 3)
      );
      if (!related) {
        console.warn("fetchRelatedTransaction: Karşı işlem bulunamadı", {
          hesapId,
          etkilenenHesapId,
          amount,
          islemTarihi,
        });
      }
      return related || null;
    } catch (err) {
      console.error("fetchRelatedTransaction error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });
      return null;
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete?.id || !transactionToDelete?.hesapId) {
      console.error("Invalid transaction or account ID:", transactionToDelete);
      setToast({
        message: "Geçersiz işlem veya hesap ID'si.",
        color: "danger",
      });
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
      return;
    }

    try {
      // Transaction ID ve User ID'yi logla
      console.log("Transaction ID:", transactionToDelete.id, "User ID:", userId);

      // HesapKategoriId'yi transactionToDelete'den al
      const hesapKategoriId = transactionToDelete.hesapKategoriId || (await api.get(`${API_BASE_URL}/Hesap/Hesap-get-by-Id/${transactionToDelete.hesapId}`)).data.hesapKategoriId || 1;
      console.log("Hesap Kategori ID:", hesapKategoriId);

      // Silme öncesi kontrol için doğru endpoint kullanımı
      const existsResponse = await api.get(
        `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${userId}/${transactionToDelete.hesapId}/${hesapKategoriId}`
      );
      console.log("Exists Response:", existsResponse.data); // Hata ayıklama için log
      if (!existsResponse.data || existsResponse.data.length === 0) {
        setToast({ message: "Silinecek işlem bulunamadı.", color: "danger" });
        setShowDeleteTransactionModal(false);
        setTransactionToDelete(null);
        return;
      }

      const amount = parseFloat(transactionToDelete.tutar) || 0;
      const isOutgoingTransfer = transactionToDelete.islemTuruId === 3;
      const isIncomingTransfer = transactionToDelete.islemTuruId === 4;
      const isTransfer = isOutgoingTransfer || isIncomingTransfer;

      const senderAccountResponse = await api.get(
        `${API_BASE_URL}/Hesap/Hesap-get-by-Id/${transactionToDelete.hesapId}`
      );
      const senderAccount = senderAccountResponse.data;
      let senderBalance = parseFloat(senderAccount.guncelBakiye) || 0;
      let newSenderBalance = senderBalance;
      let newRecipientBalance = null;
      let recipientAccount = null;
      let relatedTransaction = null;

      if (isTransfer) {
        if (!transactionToDelete.etkilenenHesapId) {
          setToast({
            message: "Transfer işlemi için karşı hesap ID'si eksik.",
            color: "danger",
          });
          console.warn("confirmDeleteTransaction: etkilenenHesapId eksik", transactionToDelete);
          setShowDeleteTransactionModal(false);
          setTransactionToDelete(null);
          return;
        }

        const recipientAccountResponse = await api.get(
          `${API_BASE_URL}/Hesap/Hesap-get-by-Id/${transactionToDelete.etkilenenHesapId}`
        );
        recipientAccount = recipientAccountResponse.data;
        let recipientBalance = parseFloat(recipientAccount.guncelBakiye) || 0;

        relatedTransaction = await fetchRelatedTransaction(
          transactionToDelete.hesapId,
          transactionToDelete.etkilenenHesapId,
          amount,
          transactionToDelete.islemTarihi,
          isOutgoingTransfer,
          userId,
          recipientAccount.hesapKategoriId
        );
        if (!relatedTransaction) {
          setToast({
            message: "İlgili transfer işlemi bulunamadı.",
            color: "danger",
          });
          console.warn("confirmDeleteTransaction: Karşı işlem bulunamadı", transactionToDelete.etkilenenHesapId);
          setShowDeleteTransactionModal(false);
          setTransactionToDelete(null);
          return;
        }

        if (isOutgoingTransfer) {
          newSenderBalance += amount;
          newRecipientBalance = recipientBalance - amount;
        } else {
          newSenderBalance -= amount;
          newRecipientBalance = recipientBalance + amount;
        }

        // Silme işlemi için yeniden deneme mekanizması
        const deleteTransaction = async (id) => {
          try {
            await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${id}`);
            console.log(`Transaction ${id} deleted successfully`);
            return true;
          } catch (err) {
            console.error(`Delete error for transaction ${id}:`, {
              error: err.message,
              response: err.response?.data,
              status: err.response?.status,
              url: err.config?.url,
            });
            return false;
          }
        };

        const maxRetries = 2;
        for (let i = 0; i < maxRetries; i++) {
          if (
            await deleteTransaction(transactionToDelete.id) &&
            await deleteTransaction(relatedTransaction.id)
          ) {
            break;
          }
          if (i < maxRetries - 1) {
            console.log(`Retrying delete operation... Attempt ${i + 1}`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 saniye bekle
          }
        }
      } else {
        if (transactionToDelete.islemTuruId === 1) {
          newSenderBalance -= amount;
        } else if (transactionToDelete.islemTuruId === 2) {
          newSenderBalance += amount;
        } else {
          setToast({
            message: "Yalnızca para girişi, çıkışı veya transfer işlemleri silinebilir.",
            color: "warning",
          });
          setShowDeleteTransactionModal(false);
          setTransactionToDelete(null);
          return;
        }

        // Silme işlemi
        await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${transactionToDelete.id}`);
      }

      // Bakiye güncellemesi
      await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
        id: transactionToDelete.hesapId,
        tanim: senderAccount.tanim,
        hesapNo: senderAccount.hesapNo,
        guncelBakiye: newSenderBalance,
        paraBirimi: senderAccount.paraBirimi,
        etiketRengi: senderAccount.etiketRengi,
        harcamaLimiti: senderAccount.harcamaLimiti || 0,
        guncellenmeTarihi: new Date().toISOString(),
        hesapKategoriId: senderAccount.hesapKategoriId || 1,
        durumu: senderAccount.durumu || 1,
        aktif: senderAccount.aktif || 1,
        eklenmeTarihi: senderAccount.eklenmeTarihi || new Date().toISOString(),
      });

      if (isTransfer && recipientAccount) {
        await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
          id: transactionToDelete.etkilenenHesapId,
          tanim: recipientAccount.tanim,
          hesapNo: recipientAccount.hesapNo,
          guncelBakiye: newRecipientBalance,
          paraBirimi: recipientAccount.paraBirimi,
          etiketRengi: recipientAccount.etiketRengi,
          harcamaLimiti: recipientAccount.harcamaLimiti || 0,
          guncellenmeTarihi: new Date().toISOString(),
          hesapKategoriId: recipientAccount.hesapKategoriId || 1,
          durumu: recipientAccount.durumu || 1,
          aktif: recipientAccount.aktif || 1,
        });
      }

      // Local state güncellemesi
      const updatedTransactions = rawTransactions
        .filter(
          (t) =>
            t.id !== transactionToDelete.id &&
            t.id !== (relatedTransaction?.id || null)
        )
        .sort((a, b) =>
          dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1
        );
      setRawTransactions(updatedTransactions);
      setTransactions(updatedTransactions.filter((t) => t.hesapId === selectedUser?.id));

      // Kullanıcı listesi ve seçili kullanıcı güncellemesi
      const updatedUsers = users.map((u) =>
        u.id === transactionToDelete.hesapId
          ? { ...u, balance: newSenderBalance }
          : u.id === transactionToDelete.etkilenenHesapId && newRecipientBalance !== null
            ? { ...u, balance: newRecipientBalance }
            : u
      );
      setUsers(updatedUsers);

      if (selectedUser?.id === transactionToDelete.hesapId) {
        setSelectedUser((prev) => ({ ...prev, balance: newSenderBalance }));
      } else if (isTransfer && selectedUser?.id === transactionToDelete.etkilenenHesapId) {
        setSelectedUser((prev) => ({ ...prev, balance: newRecipientBalance }));
      }

      await fetchTransactions(userId, selectedUser.id, selectedUser.hesapKategoriId);
      setToast({ message: "İşlem silindi.", color: "success" });
    } catch (error) {
      console.error("Silme hatası:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      setToast({
        message: "İşlem silme sırasında hata oluştu: " + (error.response?.data?.message || error.message),
        color: "danger",
      });
    } finally {
      setShowDeleteTransactionModal(false);
      setTransactionToDelete(null);
    }
  };

  const confirmCancelTransaction = async () => {
    if (
      !transactionToCancel ||
      !transactionToCancel.hesapId ||
      !transactionToCancel.id ||
      !transactionToCancel.etkilenenHesapId
    ) {
      console.error("Invalid transaction or account ID:", transactionToCancel);
      setToast({
        message: "Geçersiz işlem veya hesap ID'si.",
        color: "danger",
      });
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
      return;
    }

    if (transactionToCancel.islemTuruId !== 3 && transactionToCancel.islemTuruId !== 4) {
      setToast({
        message: "Yalnızca transfer işlemleri iptal edilebilir.",
        color: "warning",
      });
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
      return;
    }

    try {
      const amount = parseFloat(transactionToCancel.tutar) || 0;
      const isOutgoing = transactionToCancel.islemTuruId === 3;
      console.log("Fetching sender account");
      const senderGetResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-by-Id/${transactionToCancel.hesapId}`);
      console.log("Creating sender transaction");
      const senderAccount = senderGetResponse.data;
      let senderBalance = parseFloat(senderAccount.guncelBakiye) || 0;

      const recipientGetResponse = await api.get(`${API_BASE_URL}/Hesap/Hesap-get-by-Id/${transactionToCancel.etkilenenHesapId}`);
      const recipientAccount = recipientGetResponse.data;
      let recipientBalance = parseFloat(recipientAccount.guncelBakiye) || 0;

      const recipientTransaction = await fetchRelatedTransaction(
        transactionToCancel.hesapId,
        transactionToCancel.etkilenenHesapId,
        amount,
        transactionToCancel.islemTarihi,
        isOutgoing,
        userId,
        recipientAccount.hesapKategoriId
      );
      if (!recipientTransaction) {
        setToast({
          message: "İlgili alıcı işlemi bulunamadı.",
          color: "danger",
        });
        console.warn("confirmCancelTransaction: Karşı işlem bulunamadı", transactionToCancel.etkilenenHesapId);
        setShowCancelTransactionModal(false);
        setTransactionToCancel(null);
        return;
      }

      let newSenderBalance, newRecipientBalance;
      if (isOutgoing) {
        newSenderBalance = senderBalance + amount;
        newRecipientBalance = recipientBalance - amount;
      } else {
        newSenderBalance = senderBalance - amount;
        newRecipientBalance = recipientBalance + amount;
      }

      const senderCancelTransactionObj = {
        id: 0,
        kullanicilarId: userId,
        hesapId: transactionToCancel.hesapId,
        etkilenenHesapId: transactionToCancel.etkilenenHesapId,
        hesapKategoriId: senderAccount.hesapKategoriId || 1,
        islemTarihi: new Date().toISOString(),
        islemTuruId: isOutgoing ? 4 : 3,
        durumu: 1,
        bilgi: `İptal: ${transactionToCancel.bilgi || transactionToCancel.aciklama || "Transfer İptali"}`,
        aciklama: isOutgoing ? "Transfer Giriş (İptal)" : "Transfer Çıkış (İptal)",
        tutar: amount,
        borc: isOutgoing ? 0 : amount,
        alacak: isOutgoing ? amount : 0,
        bakiye: newSenderBalance,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      const recipientCancelTransactionObj = {
        id: 0,
        kullanicilarId: userId,
        hesapId: transactionToCancel.etkilenenHesapId,
        etkilenenHesapId: transactionToCancel.hesapId,
        hesapKategoriId: recipientAccount.hesapKategoriId || 1,
        islemTarihi: new Date().toISOString(),
        islemTuruId: isOutgoing ? 3 : 4,
        durumu: 1,
        bilgi: `İptal: ${recipientTransaction.bilgi || recipientTransaction.aciklama || "Transfer İptali"}`,
        aciklama: isOutgoing ? "Transfer Çıkış (İptal)" : "Transfer Giriş (İptal)",
        tutar: amount,
        borc: isOutgoing ? amount : 0,
        alacak: isOutgoing ? 0 : amount,
        bakiye: newRecipientBalance,
        eklenmeTarihi: new Date().toISOString(),
        guncellenmeTarihi: new Date().toISOString(),
      };

      const senderPostResponse = await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, senderCancelTransactionObj);
      const recipientPostResponse = await api.post(`${API_BASE_URL}/hesapHareket/hesapHareket-create`, recipientCancelTransactionObj);

      await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
        id: transactionToCancel.hesapId,
        tanim: senderAccount.tanim,
        hesapNo: senderAccount.hesapNo,
        guncelBakiye: newSenderBalance,
        paraBirimi: senderAccount.paraBirimi,
        etiketRengi: senderAccount.etiketRengi,
        harcamaLimiti: senderAccount.harcamaLimiti || 0,
        guncellenmeTarihi: new Date().toISOString(),
        hesapKategoriId: senderAccount.hesapKategoriId || 1,
        durumu: senderAccount.durumu || 1,
        aktif: senderAccount.aktif || 1,
        eklenmeTarihi: senderAccount.eklenmeTarihi || new Date().toISOString(),
      });

      await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
        id: transactionToCancel.etkilenenHesapId,
        tanim: recipientAccount.tanim,
        hesapNo: recipientAccount.hesapNo,
        guncelBakiye: newRecipientBalance,
        paraBirimi: recipientAccount.paraBirimi,
        etiketRengi: recipientAccount.etiketRengi,
        harcamaLimiti: recipientAccount.harcamaLimiti || 0,
        guncellenmeTarihi: new Date().toISOString(),
        hesapKategoriId: recipientAccount.hesapKategoriId || 1,
        durumu: recipientAccount.durumu || 1,
        aktif: recipientAccount.aktif || 1,
        eklenmeTarihi: recipientAccount.eklenmeTarihi || new Date().toISOString(),
      });

      const senderCancelTransaction = {
        id: senderPostResponse.data.id || Date.now(),
        date: dayjs().format("DD.MM.YYYY"),
        type: isOutgoing ? "Transfer Giriş (İptal)" : "Transfer Çıkış (İptal)",
        userName: senderAccount.tanim,
        accountNumber: recipientAccount.hesapNo,
        description: senderCancelTransactionObj.bilgi,
        debit: isOutgoing ? "-" : `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        credit: isOutgoing ? `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-",
        islemTarihi: new Date().toISOString(),
        islemTuruId: isOutgoing ? 4 : 3,
        tutar: amount,
        etkilenenHesapId: transactionToCancel.etkilenenHesapId,
        hesapId: transactionToCancel.hesapId,
        isCancelled: true,
      };

      const recipientCancelTransaction = {
        id: recipientPostResponse.data.id || Date.now() + 1,
        date: dayjs().format("DD.MM.YYYY"),
        type: isOutgoing ? "Transfer Çıkış (İptal)" : "Transfer Giriş (İptal)",
        userName: recipientAccount.tanim,
        accountNumber: senderAccount.hesapNo,
        description: recipientCancelTransactionObj.bilgi,
        debit: isOutgoing ? `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}` : "-",
        credit: isOutgoing ? "-" : `${amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}`,
        islemTarihi: new Date().toISOString(),
        islemTuruId: isOutgoing ? 3 : 4,
        tutar: amount,
        etkilenenHesapId: transactionToCancel.hesapId,
        hesapId: transactionToCancel.etkilenenHesapId,
        isCancelled: true,
      };

      const updatedTransactions = [
        ...rawTransactions,
        senderCancelTransaction,
        recipientCancelTransaction,
      ].sort((a, b) => (dayjs(b.islemTarihi).isAfter(dayjs(a.islemTarihi)) ? 1 : -1));

      setRawTransactions(updatedTransactions);
      setTransactions(updatedTransactions.filter((t) => t.hesapId === selectedUser?.id));

      const updatedUsers = users.map((u) =>
        u.id === transactionToCancel.hesapId
          ? { ...u, balance: newSenderBalance }
          : u.id === transactionToCancel.etkilenenHesapId
            ? { ...u, balance: newRecipientBalance }
            : u
      );
      setUsers(updatedUsers);

      if (selectedUser?.id === transactionToCancel.hesapId) {
        setSelectedUser((prev) => ({ ...prev, balance: newSenderBalance }));
      } else if (selectedUser?.id === transactionToCancel.etkilenenHesapId) {
        setSelectedUser((prev) => ({ ...prev, balance: newRecipientBalance }));
      }

      await fetchTransactions(userId, selectedUser.id, selectedUser.hesapKategoriId);

      setToast({
        message: "Transfer işlemi başarıyla iptal edildi.",
        color: "success",
      });
    } catch (err) {
      console.error("Cancel transaction error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
        transactionToCancel,
      });
      setToast({
        message: `İşlem iptal edilirken hata oluştu: ${err.response?.data?.message || err.message}`,
        color: "danger",
      });
    } finally {
      setShowCancelTransactionModal(false);
      setTransactionToCancel(null);
    }
  };

  return (
    <CCard className="mb-4">
      <CCardHeader
        className="p-3"
        style={{
          backgroundColor: "var(--primary-color)",
          color: "var(--white-color)",
        }}
      >
        <h5>İşlem Geçmişi</h5>
      </CCardHeader>
      <CCardBody>
        {transactions.length > 0 ? (
          <CTable responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Tarih</CTableHeaderCell>
                <CTableHeaderCell>İşlem</CTableHeaderCell>
                <CTableHeaderCell>Kullanıcı</CTableHeaderCell>
                <CTableHeaderCell>Hesap No</CTableHeaderCell>
                <CTableHeaderCell>Açıklama</CTableHeaderCell>
                <CTableHeaderCell>Borç</CTableHeaderCell>
                <CTableHeaderCell>Alacak</CTableHeaderCell>
                <CTableHeaderCell>İşlemler</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody className="my-2">
              {transactions.map((t, index) => (
                <CTableRow key={t.id || index}>
                  <CTableDataCell>{t.date || "-"}</CTableDataCell>
                  <CTableDataCell>{t.type || "-"}</CTableDataCell>
                  <CTableDataCell>{t.userName || "Bilinmiyor"}</CTableDataCell>
                  <CTableDataCell>{t.accountNumber || "-"}</CTableDataCell>
                  <CTableDataCell>{t.bilgi || t.description || "-"}</CTableDataCell>
                  <CTableDataCell>{t.debit || "-"}</CTableDataCell>
                  <CTableDataCell>{t.credit || "-"}</CTableDataCell>
                  <CTableDataCell>
                    <CButton
                      color="info"
                      size="sm"
                      className="me-2"
                      style={{ color: "white", marginBottom: "3px" }}
                      onClick={() => handleEditTransaction(t)}
                      disabled={t.isCancelled}
                    >
                      <CIcon icon={cilPen} />
                    </CButton>
                    <CButton
                      color="warning"
                      size="sm"
                      className="me-2"
                      style={{ color: "white", marginBottom: "3px" }}
                      onClick={() => handleCancelTransaction(t)}
                      disabled={
                        (t.islemTuruId !== 3 && t.islemTuruId !== 4) ||
                        t.isCancelled
                      }
                    >
                      <CIcon icon={cilX} />
                    </CButton>
                    <CButton
                      color="danger"
                      size="sm"
                      style={{ color: "white" }}
                      onClick={() => {
                        setTransactionToDelete(t);
                        setShowDeleteTransactionModal(true);
                      }}
                      disabled={
                        (t.islemTuruId !== 1 &&
                          t.islemTuruId !== 2 &&
                          t.islemTuruId !== 3 &&
                          t.islemTuruId !== 4) ||
                        t.isCancelled
                      }
                    >
                      <CIcon icon={cilTrash} />
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        ) : (
          <p>Henüz işlem bulunmamaktadır.</p>
        )}
      </CCardBody>

      <CModal
        visible={showDeleteTransactionModal}
        onClose={() => {
          setShowDeleteTransactionModal(false);
          setTransactionToDelete(null);
        }}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader
          style={{
            backgroundColor: "var(--danger-color)",
            color: "var(--white-color)",
          }}
        >
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            "<strong>{transactionToDelete?.description || "Bu işlem"}</strong>"
            tablodan kaldırılacak, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeleteTransactionModal(false);
              setTransactionToDelete(null);
            }}
          >
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDeleteTransaction}
            className="text-white"
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={showCancelTransactionModal}
        onClose={() => {
          setShowCancelTransactionModal(false);
          setTransactionToCancel(null);
        }}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader
          style={{
            backgroundColor: "var(--cancel-color)",
            color: "var(--white-color)",
          }}
        >
          <CModalTitle>İptal Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            "<strong>{transactionToCancel?.description || "Bu transfer"}</strong>"
            iptal edilecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowCancelTransactionModal(false);
              setTransactionToCancel(null);
            }}
          >
            İptal
          </CButton>
          <CButton
            color="warning"
            onClick={confirmCancelTransaction}
            className="text-white"
          >
            Onayla
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  );
};

export default TransactionTable;