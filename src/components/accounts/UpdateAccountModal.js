import React, { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormTextarea,
  CButton,
} from '@coreui/react';
import { useAccounts } from '../../context/AccountsContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/api';

const API_BASE_URL = "https://speedsofttest.com/api";

const UpdateAccountModal = () => {
  const {
    modalVisible,
    setModalVisible,
    formData,
    setFormData,
    selectedUser,
    setSelectedUser,
    users,
    setUsers,
    setToast,
    userId,  // Context'ten al
  } = useAccounts();
  const navigate = useNavigate();
  // Silme ve pasif yapma modalları için state'ler
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  // Form değişikliklerini işleme
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveUpdate = async () => {
    // Boşluklu stringleri de yakalar
    if (!formData.userName?.trim() || !formData.accountNumber?.trim()) {
      setToast({
        message: 'Hesap Adı ve Hesap No zorunlu alanlardır.',
        color: 'danger',
      });
      return;
    }

    // Hesap numarası tekrar kontrolü
    if (
      users.some(
        (u) => u.accountNumber === formData.accountNumber && u.id !== selectedUser.id
      )
    ) {
      setToast({ message: 'Bu hesap numarası zaten kullanımda.', color: 'danger' });
      return;
    }

    // Varsayılanlar tanımlandı
    const updatedUser = {
      ...selectedUser,
      userName: formData.userName.trim(),
      accountNumber: formData.accountNumber.trim(),
      labelColor: formData.labelColor || '#cccccc',
      description: formData.description || '',
      spendingLimit: parseFloat(formData.spendingLimit) || 0,
      balance: parseFloat(formData.balance) || 0,
      currency: selectedUser.currency || 'TRY',
      transactions: selectedUser.transactions,
      type: selectedUser.type,
      hesapKategoriId: selectedUser.hesapKategoriId,
      kullaniciId: userId,
    };

    try {
      await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
        id: updatedUser.id,
        tanim: updatedUser.userName,
        hesapNo: updatedUser.accountNumber,
        guncelBakiye: updatedUser.balance,
        paraBirimi: updatedUser.currency,
        etiketRengi: updatedUser.labelColor,
        harcamaLimiti: updatedUser.spendingLimit,
        guncellenmeTarihi: new Date().toISOString(),
        hesapKategoriId: updatedUser.hesapKategoriId,
        durumu: selectedUser.durumu || 1,
        aktif: selectedUser.aktif || 1,
        eklenmeTarihi: selectedUser.eklenmeTarihi || new Date().toISOString(),
        kullaniciId: userId,  // Kullanıcı ID ekle (UPDATE için gerekli)
      });

      setSelectedUser(updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
      setToast({ message: 'Hesap başarıyla güncellendi.', color: 'success' });
      setModalVisible(false);
    } catch (err) {
      setToast({
        message:
          'Hesap güncellenirken hata oluştu: ' +
          (err.response?.data?.message || err.message),
        color: 'danger',
      });
    }
  };

  // Pasif yapma modalını aç
  const handleDeactivateAccount = () => {
    setShowDeactivateModal(true);
  };

  // Pasif yapma onayını işleme (toggle route kullan)
  const confirmDeactivateAccount = async () => {
    if (!selectedUser?.id || !userId) {
      setToast({
        message: 'Hesap ID\'si veya kullanıcı ID\'si eksik.',
        color: 'danger',
      });
      setShowDeactivateModal(false);
      return;
    }

    try {
      // Backend toggle route'u kullan: hesap-aktif/{id} (query string yok, session'dan al)
      await api.put(`${API_BASE_URL}/Hesap/hesap-aktif/${selectedUser.id}`);

      const updatedUser = {
        ...selectedUser,
        aktif: selectedUser.aktif === 1 ? 0 : 1,  // Toggle
      };

      setSelectedUser(updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === selectedUser.id ? updatedUser : u))
      );
      setToast({ 
        message: updatedUser.aktif === 1 ? `Hesap "${formData.userName}" aktifleştirildi.` : `Hesap "${formData.userName}" pasif yapıldı.`, 
        color: updatedUser.aktif === 1 ? 'success' : 'warning' 
      });
      setModalVisible(false);
      setShowDeactivateModal(false);
      navigate('/app/dashboard');
    } catch (err) {
      setToast({
        message:
          'Hesap pasif yapılırken hata oluştu: ' +
          (err.response?.data?.message || err.message),
        color: 'danger',
      });
      setShowDeactivateModal(false);
    }
  };

  // Silme modalını aç
  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  // Silme onayını işleme
  const confirmDeleteAccount = async () => {
    if (!selectedUser?.id || !userId) {
      setToast({
        message: 'Hesap ID\'si veya kullanıcı ID\'si eksik.',
        color: 'danger',
      });
      setShowDeleteModal(false);
      return;
    }
    try {
      // Query parametresi olarak kullaniciId ekle
      await api.delete(`${API_BASE_URL}/Hesap/hesap-delete/${selectedUser.id}?kullaniciId=${userId}`);
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== selectedUser.id));
      setSelectedUser(null);
      setToast({ message: 'Hesap silindi.', color: 'success' });
      setModalVisible(false);
      setShowDeleteModal(false);
      navigate('/app/dashboard');
    } catch (err) {
      setToast({
        message: 'Hesap silinirken hata oluştu: ' + (err.response?.data?.message || err.message),
        color: 'danger',
      });
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      {/* Ana güncelleme modalı */}
      <CModal
        visible={modalVisible}
        backdrop="static"
        keyboard={false}
        onClose={() => setModalVisible(false)}
        className="shadow-sm"
      >
        <CModalHeader style={{ backgroundColor: '#2965A8', color: '#FFFFFF' }}>
          <CModalTitle>Hesap Güncelle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CFormLabel htmlFor="userName">Hesap Adı</CFormLabel>
            <CFormInput name="userName" value={formData.userName} onChange={handleChange} />
            <CFormLabel htmlFor="accountNumber" className="mt-3">
              Hesap No
            </CFormLabel>
            <CFormInput
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
            />
            <CFormLabel htmlFor="balance" className="mt-3">
              Güncel Bakiye
            </CFormLabel>
            <CFormInput
              type="number"
              name="balance"
              value={formData.balance}
              onChange={handleChange}
            />
            <CFormLabel htmlFor="labelColor" className="mt-3">
              Etiket Rengi
            </CFormLabel>
            <CFormInput
              type="color"
              name="labelColor"
              value={formData.labelColor}
              onChange={handleChange}
            />
            <CFormLabel htmlFor="spendingLimit" className="mt-3">
              Harcama Limiti
            </CFormLabel>
            <CFormInput
              type="number"
              name="spendingLimit"
              value={formData.spendingLimit}
              onChange={handleChange}
            />
          </CForm>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-between">
          <div>
            <CButton
              color="warning"
              className="me-2"
              style={{ color: 'white' }}
              onClick={handleDeactivateAccount}
            >
              Pasif/Aktif Yap
            </CButton>
            <CButton
              color="danger"
              style={{ color: 'white' }}
              onClick={handleDeleteAccount}
            >
              Sil
            </CButton>
          </div>
          <CButton color="primary" onClick={handleSaveUpdate}>
            Kaydet
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Silme onayı modalı */}
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: '#dc3545', color: '#FFFFFF' }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Hesap "<strong>{formData?.userName || 'Bilinmeyen Hesap'}</strong>"
            silinecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDeleteAccount}
            className="text-white"
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Pasif yapma onayı modalı */}
      <CModal
        visible={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: '#F6A213', color: '#FFFFFF' }}>
          <CModalTitle>Pasif/Aktif Yapma Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Hesap "<strong>{formData?.userName || 'Bilinmeyen Hesap'}</strong>"
            {selectedUser?.aktif === 1 ? ' pasif ' : ' aktif '}yapılacak, emin misiniz?
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => setShowDeactivateModal(false)}
          >
            İptal
          </CButton>
          <CButton
            color="warning"
            onClick={confirmDeactivateAccount}
            className="text-white"
          >
            Onayla
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UpdateAccountModal;