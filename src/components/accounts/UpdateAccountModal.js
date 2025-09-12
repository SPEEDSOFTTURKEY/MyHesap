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
      balance: selectedUser.balance,
      currency: selectedUser.currency || 'TRY',
      transactions: selectedUser.transactions,
      type: selectedUser.type,
      hesapKategoriId: selectedUser.hesapKategoriId,
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

  // Pasif yapma onayını işleme
  const confirmDeactivateAccount = async () => {
    if (!selectedUser?.id) {
      setToast({
        message: 'Hesap ID\'si eksik.',
        color: 'danger',
      });
      setShowDeactivateModal(false);
      return;
    }

    try {
      await api.put(`${API_BASE_URL}/Hesap/hesap-update`, {
        id: selectedUser.id,
        tanim: selectedUser.userName,
        hesapNo: selectedUser.accountNumber,
        guncelBakiye: selectedUser.balance,
        paraBirimi: selectedUser.currency,
        etiketRengi: selectedUser.labelColor,
        harcamaLimiti: selectedUser.spendingLimit || 0,
        guncellenmeTarihi: new Date().toISOString(),
        hesapKategoriId: selectedUser.hesapKategoriId,
        durumu: 0, // Pasif durumu
        aktif: 0, // Pasif
        eklenmeTarihi: selectedUser.eklenmeTarihi || new Date().toISOString(),
      });

      const updatedUser = {
        ...selectedUser,
        durumu: 0,
        aktif: 0,
      };

      setSelectedUser(updatedUser);
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === selectedUser.id ? updatedUser : u))
      );
      setToast({ message: `Hesap "${formData.userName}" pasif yapıldı.`, color: 'warning' });
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
    if (!selectedUser?.id) {
      setToast({
        message: 'Hesap ID\'si eksik.',
        color: 'danger',
      });
      setShowDeleteModal(false);
      return;
    }
    try {
      await api.delete(`${API_BASE_URL}/Hesap/hesap-delete/${selectedUser.id}`);
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
            <CFormLabel htmlFor="description" className="mt-3">
              Açıklama
            </CFormLabel>
            <CFormTextarea
              name="description"
              rows={3}
              value={formData.description}
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
              Pasif Yap
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
          <CModalTitle>Pasif Yapma Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Hesap "<strong>{formData?.userName || 'Bilinmeyen Hesap'}</strong>"
            pasif yapılacak, emin misiniz?
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
            Pasif Yap
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UpdateAccountModal;