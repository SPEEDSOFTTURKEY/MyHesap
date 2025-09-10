import { useState } from "react";
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
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormTextarea,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPrint, cilPencil, cilTrash } from "@coreui/icons";
import dayjs from "dayjs";
import api from "../../api/api";
import DatePickerField from "./DatePickerField";

const API_BASE_URL = "https://localhost:44375/api";

const EmployeeTable = ({
  transactions,
  loading,
  error,
  currency = "TRY",
  onPrint,
  addToast,
  onRefresh,
  expenseMainCategories,
  expenseSubCategories,
}) => {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [editForm, setEditForm] = useState({
    id: 0,
    tarih: dayjs(),
    masrafAnaKategoriId: "",
    masrafAltKategoriId: "",
    calisanId: 0,
    durumu: "1",
    aciklama: "",
    borc: "",
    alacak: "",
    bakiye: "",
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleEditClick = (transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      id: transaction.id,
      tarih: transaction.tarih ? dayjs(transaction.tarih) : dayjs(),
      masrafAnaKategoriId: transaction.masrafAnaKategoriId?.toString() || "",
      masrafAltKategoriId: transaction.masrafAltKategoriId?.toString() || "",
      calisanId: transaction.calisanId,
      durumu: transaction.durumu?.toString() || "1",
      aciklama: transaction.aciklama || "",
      borc: transaction.borc?.toString() || "",
      alacak: transaction.alacak?.toString() || "",
      bakiye: transaction.bakiye?.toString() || "",
    });
    setEditModalVisible(true);
  };

  const handleDeleteClick = (transaction) => {
    setSelectedTransaction(transaction);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction?.id) {
      addToast("Cari işlem ID'si eksik", "hata");
      return;
    }
    setDeleteLoading(true);
    try {
      await api.delete(
        `${API_BASE_URL}/calisancari/calisancari-delete/${selectedTransaction.id}`,
        {
          headers: { accept: "*/*" },
        }
      );
      addToast("Cari işlem başarıyla silindi", "başarılı");
      onRefresh(); // Tabloyu yenile
    } catch (err) {
      console.error("Cari işlem silinirken hata:", err);
      addToast(
        "Cari işlem silinemedi: " +
          (err.response?.data?.message || err.message),
        "hata"
      );
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
      setSelectedTransaction(null);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "masrafAnaKategoriId" ? { masrafAltKategoriId: "" } : {}),
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setDeleteLoading(true);
    try {
      const updatedTransaction = {
        id: editForm.id,
        tarih: editForm.tarih.format("YYYY-MM-DD"),
        eklenmeTarihi:
          selectedTransaction.eklenmeTarihi || dayjs().toISOString(),
        guncellenmeTarihi: dayjs().toISOString(),
        masrafAnaKategoriId: parseInt(editForm.masrafAnaKategoriId) || 0,
        masrafAltKategoriId: parseInt(editForm.masrafAltKategoriId) || 0,
        calisanId: parseInt(editForm.calisanId),
        durumu: parseInt(editForm.durumu),
        aciklama: editForm.aciklama,
        borc: parseFloat(editForm.borc) || 0,
        alacak: parseFloat(editForm.alacak) || 0,
        bakiye: parseFloat(editForm.bakiye) || 0,
      };

      await api.put(`${API_BASE_URL}/calisancari/calisancari-update`, updatedTransaction, {
        headers: { "Content-Type": "application/json", accept: "*/*" },
      });

      addToast("Cari işlem başarıyla güncellendi", "başarılı");
      setEditModalVisible(false);
      onRefresh(); // Tabloyu yenile
    } catch (err) {
      console.error("Cari işlem güncellenirken hata:", err);
      addToast(
        "Cari işlem güncellenemedi: " +
          (err.response?.data?.message || err.message),
        "hata"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Masraf kalemi adını oluştur
  const getMasrafKalemi = (transaction) => {
    if (!transaction.masrafAnaKategoriId && !transaction.masrafAltKategoriId) {
      return "-";
    }

    const mainCategory = expenseMainCategories.find(
      (cat) => cat.id === transaction.masrafAnaKategoriId
    );
    const subCategory = expenseSubCategories.find(
      (sub) => sub.id === transaction.masrafAltKategoriId
    );

    let masrafKalemi = "";
    if (mainCategory) {
      masrafKalemi += mainCategory.adi;
    }
    if (subCategory) {
      masrafKalemi += masrafKalemi ? ` - ${subCategory.adi}` : subCategory.adi;
    }

    return masrafKalemi || "-";
  };

  return (
    <>
      <CToaster placement="top-end" className="p-3">
        {error && (
          <CToast autohide={5000} visible={!!error} color="danger">
            <CToastHeader closeButton={{ label: "Kapat" }}>
              <strong className="me-auto">Hata</strong>
            </CToastHeader>
            <CToastBody>{error}</CToastBody>
          </CToast>
        )}
      </CToaster>
      <CCard className="mb-3">
        <CCardHeader
          className="p-3"
          style={{ backgroundColor: "#2965A8", color: "#ffffff" }}
        >
          <h5>Önceki Cari İşlemler</h5>
        </CCardHeader>
        <CCardBody>
          {loading && <p>Yükleniyor...</p>}
          {!loading && !error && transactions.length > 0 ? (
            <CTable responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Tarih</CTableHeaderCell>
                  <CTableHeaderCell>Masraf Kalemi</CTableHeaderCell>
                  <CTableHeaderCell>Açıklama</CTableHeaderCell>
                  <CTableHeaderCell>Borç</CTableHeaderCell>
                  <CTableHeaderCell>Alacak</CTableHeaderCell>
                  <CTableHeaderCell>Bakiye</CTableHeaderCell>
                  <CTableHeaderCell>İşlemler</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody className="my-2">
                {transactions.map((transaction) => (
                  <CTableRow key={transaction.id}>
                    <CTableDataCell>
                      {transaction.tarih
                        ? dayjs(transaction.tarih).format("DD.MM.YYYY")
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {getMasrafKalemi(transaction)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.aciklama || "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.borc
                        ? `${transaction.borc.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.alacak
                        ? `${transaction.alacak.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      {transaction.bakiye
                        ? `${transaction.bakiye.toLocaleString("tr-TR")} ${currency}`
                        : "-"}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        size="sm"
                        style={{ color: "white", marginBottom: "3px" }}
                        onClick={() =>
                          onPrint("Yazdırma işlemi başlatıldı", "başarılı")
                        }
                        className="me-2"
                        disabled={true}
                      >
                        <CIcon icon={cilPrint} />
                      </CButton>
                      <CButton
                        color="warning"
                        size="sm"
                        style={{ color: "white", marginBottom: "3px" }}
                        onClick={() => handleEditClick(transaction)}
                        className="me-2"
                        disabled={deleteLoading}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="danger"
                        size="sm"
                        style={{ color: "white" }}
                        onClick={() => handleDeleteClick(transaction)}
                        disabled={deleteLoading}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            !loading && !error && <p>Henüz işlem bulunmamaktadır.</p>
          )}
        </CCardBody>
      </CCard>

      <CModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        backdrop="static"
        keyboard={false}
      >
        <CModalHeader style={{ backgroundColor: "#2965A2", color: "white" }}>
          <CModalTitle>Cari İşlem Düzenle</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm onSubmit={handleEditSubmit}>
            <DatePickerField
              label="Tarih"
              value={editForm.tarih}
              onChange={(newValue) =>
                setEditForm((prev) => ({ ...prev, tarih: newValue }))
              }
            />
            <CFormLabel htmlFor="masrafAnaKategoriId" className="mt-3">
              Masraf Ana Kategorisi
            </CFormLabel>
            <CFormSelect
              id="masrafAnaKategoriId"
              name="masrafAnaKategoriId"
              value={editForm.masrafAnaKategoriId}
              onChange={handleEditFormChange}
              className="mb-3"
              disabled={deleteLoading}
            >
              <option value="">Seçiniz</option>
              {expenseMainCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.adi}
                </option>
              ))}
            </CFormSelect>
            <CFormLabel htmlFor="masrafAltKategoriId" className="mt-3">
              Masraf Alt Kategorisi
            </CFormLabel>
            <CFormSelect
              id="masrafAltKategoriId"
              name="masrafAltKategoriId"
              value={editForm.masrafAltKategoriId}
              onChange={handleEditFormChange}
              className="mb-3"
              disabled={deleteLoading || !editForm.masrafAnaKategoriId}
            >
              <option value="">Seçiniz</option>
              {expenseSubCategories
                .filter(
                  (sub) =>
                    sub.masrafAnaKategoriId?.toString() ===
                    editForm.masrafAnaKategoriId
                )
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.adi}
                  </option>
                ))}
            </CFormSelect>
            <CFormLabel htmlFor="durumu" className="mt-3">
              Durum
            </CFormLabel>
            <CFormSelect
              id="durumu"
              name="durumu"
              value={editForm.durumu}
              onChange={handleEditFormChange}
              className="mb-3"
              disabled={deleteLoading}
            >
              <option value="1">Aktif</option>
              <option value="0">Pasif</option>
            </CFormSelect>
            <CFormLabel htmlFor="aciklama" className="mt-3">
              Açıklama
            </CFormLabel>
            <CFormTextarea
              id="aciklama"
              name="aciklama"
              rows={3}
              value={editForm.aciklama}
              onChange={handleEditFormChange}
              className="mb-3"
              disabled={deleteLoading}
            />
            <CFormLabel htmlFor="borc" className="mt-3">
              Borç
            </CFormLabel>
            <CFormInput
              type="number"
              id="borc"
              name="borc"
              value={editForm.borc}
              onChange={handleEditFormChange}
              placeholder="0.00"
              step="0.01"
              className="mb-3"
              disabled={deleteLoading}
            />
            <CFormLabel htmlFor="alacak" className="mt-3">
              Alacak
            </CFormLabel>
            <CFormInput
              type="number"
              id="alacak"
              name="alacak"
              value={editForm.alacak}
              onChange={handleEditFormChange}
              placeholder="0.00"
              step="0.01"
              className="mb-3"
              disabled={deleteLoading}
            />
            <CFormLabel htmlFor="bakiye" className="mt-3">
              Bakiye
            </CFormLabel>
            <CFormInput
              type="number"
              id="bakiye"
              name="bakiye"
              value={editForm.bakiye}
              onChange={handleEditFormChange}
              placeholder="0.00"
              step="0.01"
              className="mb-3"
              disabled={deleteLoading}
            />
            <CModalFooter>
              <CButton color="primary" type="submit" disabled={deleteLoading}>
                Kaydet
              </CButton>
              <CButton
                color="secondary"
                onClick={() => setEditModalVisible(false)}
                disabled={deleteLoading}
              >
                İptal
              </CButton>
            </CModalFooter>
          </CForm>
        </CModalBody>
      </CModal>

      <CModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setSelectedTransaction(null);
        }}
        backdrop="static"
      >
        <CModalHeader style={{ backgroundColor: "#DC3545", color: "white" }}>
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Bu cari işlemi silmek istediğinize emin misiniz? Bu işlem geri
            alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            style={{ color: "white" }}
            onClick={() => {
              setDeleteModalVisible(false);
              setSelectedTransaction(null);
            }}
            disabled={deleteLoading}
          >
            Hayır
          </CButton>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={confirmDelete}
            disabled={deleteLoading}
          >
            Evet
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default EmployeeTable;
