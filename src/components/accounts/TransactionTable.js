import React, { useState } from "react";
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
  CForm,
  CFormInput,
  CAlert
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPen, cilTrash } from "@coreui/icons";

import { useAccounts } from "../../context/AccountsContext";
import api from "../../api/api";
import dayjs from "dayjs";
import "../../scss/style.scss";

const API_BASE_URL = "https://localhost:44375/api";

const TransactionTable = () => {
  const {
    transactions,
    showDeleteTransactionModal,
    setShowDeleteTransactionModal,
    transactionToDelete,
    setTransactionToDelete,
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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    Tutar: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchRelatedTransaction = async (
    hesapId,
    etkilenenHesapId,
    amount,
    islemTarihi,
    isOutgoing
  ) => {
    try {
      const response = await api.get(
        `${API_BASE_URL}/hesapHareket/hesapHareket-get-by-Id/${etkilenenHesapId}`
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
      });
      return null;
    }
  };

  const handleEditClick = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      Tutar: transaction.tutar || "",
    });
    setShowEditModal(true);
    setError("");
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;
    
    setLoading(true);
    setError("");

    try {
      // API'nin beklediği formata uygun veri hazırlıyoruz
      const updatedData = {
        Id: editingTransaction.id,
        KullanicilarId: userId,
        HesapId: editingTransaction.hesapId,
        HesapKategoriId: editingTransaction.hesapKategoriId,
        EtkilenenHesapId: editingTransaction.etkilenenHesapId,
        IslemTarihi: editingTransaction.islemTarihi,
        IslemTuruId: editingTransaction.islemTuruId,
        Bilgi: editingTransaction.bilgi,
        Aciklama: editingTransaction.aciklama,
        Borc: editingTransaction.borc,
        Alacak: editingTransaction.alacak,
        Tutar: parseFloat(formData.Tutar),
        Bakiye: editingTransaction.bakiye,
        GuncelleyenKullaniciId: userId
      };

      const response = await api.put(
        `${API_BASE_URL}/hesapHareket/hesapHareket-update`,
        updatedData
      );

      if (response.status === 200) {
        setToast({ message: "İşlem başarıyla güncellendi.", color: "success" });
        
        // Transfer işlemleri için karşı işlemi de güncelle
        if (editingTransaction.islemTuruId === 3 || editingTransaction.islemTuruId === 4) {
          const relatedTransaction = await fetchRelatedTransaction(
            editingTransaction.hesapId,
            editingTransaction.etkilenenHesapId,
            editingTransaction.tutar,
            editingTransaction.islemTarihi,
            editingTransaction.islemTuruId === 3
          );

          if (relatedTransaction) {
            const updatedRelatedData = {
              Id: relatedTransaction.id,
              KullanicilarId: userId,
              HesapId: relatedTransaction.hesapId,
              HesapKategoriId: relatedTransaction.hesapKategoriId,
              EtkilenenHesapId: relatedTransaction.etkilenenHesapId,
              IslemTarihi: relatedTransaction.islemTarihi,
              IslemTuruId: relatedTransaction.islemTuruId,
              Bilgi: relatedTransaction.bilgi,
              Aciklama: relatedTransaction.aciklama,
              Borc: relatedTransaction.borc,
              Alacak: relatedTransaction.alacak,
              Tutar: parseFloat(formData.Tutar),
              Bakiye: relatedTransaction.bakiye,
              GuncelleyenKullaniciId: userId
            };
            
            await api.put(
              `${API_BASE_URL}/hesapHareket/hesapHareket-update`,
              updatedRelatedData
            );
          }
        }

        // Verileri yeniden yükle
        await fetchTransactions(userId, selectedUser.id, selectedUser.hesapKategoriId);
        setShowEditModal(false);
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      setError("Güncelleme sırasında bir hata oluştu: " + (error.response?.data?.Message || error.message));
    } finally {
      setLoading(false);
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
          isOutgoingTransfer
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

        // Silme işlemi
        await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${transactionToDelete.id}?kullaniciId=${userId}`);
        await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${relatedTransaction.id}?kullaniciId=${userId}`);
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
        await api.delete(`${API_BASE_URL}/hesapHareket/hesapHareket-delete/${transactionToDelete.id}?kullaniciId=${userId}`);
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

  return (
    <>
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
                        onClick={() => handleEditClick(t)}
                      >
                        <CIcon icon={cilPen} />
                      </CButton>
                      
                      {/* Silme butonu - normal işlemler için */}
                      {(t.islemTuruId === 1 ||
                        t.islemTuruId === 2 ||
                        t.islemTuruId === 3 ||
                        t.islemTuruId === 4) && (
                        <CButton
                          color="danger"
                          size="sm"
                          style={{ color: "white" }}
                          onClick={() => {
                            setTransactionToDelete(t);
                            setShowDeleteTransactionModal(true);
                          }}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            <p>Henüz işlem bulunmamaktadır.</p>
          )}
        </CCardBody>

        {/* Silme Modal */}
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

        {/* Güncelleme Modal */}
        <CModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          className="shadow-sm"
          backdrop="static"
          size="lg"
        >
          <CModalHeader
            style={{
              backgroundColor: "var(--info-color)",
              color: "var(--white-color)",
            }}
          >
            <CModalTitle>İşlem Güncelle</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            
            <CForm>
              <div className="mb-3">
                <label className="form-label">Tutar</label>
                <CFormInput
                  type="number"
                  value={formData.Tutar}
                  onChange={(e) => setFormData({...formData, Tutar: e.target.value})}
                  placeholder="Tutar"
                  step="0.01"
                />
              </div>
            </CForm>
          </CModalBody>
          <CModalFooter>
            <CButton
              color="secondary"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              İptal
            </CButton>
            <CButton
              color="primary"
              onClick={handleUpdateTransaction}
              disabled={loading}
              className="text-white"
            >
              {loading ? "Güncelleniyor..." : "Güncelle"}
            </CButton>
          </CModalFooter>
        </CModal>
      </CCard>
    </>
  );
};

export default TransactionTable;