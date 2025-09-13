import {
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
import { cilPen, cilTrash } from "@coreui/icons";
import { useState, useEffect } from "react";
import api from "../../api/api";
import CustomerModal from "./CustomerModal";
import ErrorBoundary from "../../views/pages/products/ErrorBoundary";

const API_BASE_URL = "https://localhost:44375/api";

const CustomerTable = ({ customers, onCustomerClick, fetchCustomers }) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Kullanıcı bilgilerini al
  useEffect(() => {
    // localStorage'dan kullanıcı bilgilerini al
    const userData = localStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setUserInfo(user);
      console.log("Giriş yapan kullanıcı bilgileri:", user);
    }
  }, []);

  const addToast = (message, type = "success") => {
    alert(message);
  };

  const handleDelete = async () => {
    if (!userInfo || !userInfo.id) {
      addToast("Kullanıcı bilgileri bulunamadı.", "error");
      return;
    }

    try {
      setLoading(true);
      // Müşteri ID'si ve kullanıcı ID'sini birlikte gönder
      await api.delete(`${API_BASE_URL}/musteri/musteri-delete/${selectedCustomerId}?kullaniciId=${userInfo.id}`);
      fetchCustomers();
      setShowDeleteModal(false);
      addToast("Müşteri başarıyla silindi.", "success");
    } catch (err) {
      console.error("Silme Hatası:", err);
      addToast(err.response?.data?.message || "Müşteri silinemedi.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CTable responsive hover>
        <CTableHead>
          <CTableRow>
            <CTableHeaderCell>Adı</CTableHeaderCell>
            <CTableHeaderCell>Telefon</CTableHeaderCell>
            <CTableHeaderCell>E-Posta</CTableHeaderCell>
            <CTableHeaderCell>Açık Bakiye</CTableHeaderCell>
            <CTableHeaderCell>Sınıflandırma</CTableHeaderCell>
            <CTableHeaderCell>İşlem</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {customers.map((customer) => (
            <CTableRow
              key={customer.id}
              onClick={() => onCustomerClick(customer)}
              className="customer-table-row"
              style={{ cursor: "pointer" }}
            >
              <CTableDataCell>{customer.name}</CTableDataCell>
              <CTableDataCell>{customer.phone || "Yok"}</CTableDataCell>
              <CTableDataCell>{customer.email || "Yok"}</CTableDataCell>
              <CTableDataCell>
                {(customer.openBalance || 0).toLocaleString("tr-TR")} TRY
              </CTableDataCell>
              <CTableDataCell>{customer.classification}</CTableDataCell>
              <CTableDataCell>
                <CButton
                  color="info"
                  size="sm"
                  style={{ color: "white", marginRight: "5px" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCustomer(customer);
                    setShowUpdateModal(true);
                  }}
                >
                  <CIcon icon={cilPen} />
                </CButton>
                <CButton
                  color="danger"
                  size="sm"
                  style={{ color: "white" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCustomerId(customer.id);
                    setShowDeleteModal(true);
                  }}
                >
                  <CIcon icon={cilTrash} />
                </CButton>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      >
        <CModalHeader style={{ backgroundColor: "#DC3545", color: "white" }}>
          <CModalTitle>Müşteriyi Sil</CModalTitle>
        </CModalHeader>
        <CModalBody>Silinmesini istediğinizden emin misiniz?</CModalBody>
        <CModalFooter>
          <CButton
            color="danger"
            style={{ color: "white" }}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Siliniyor..." : "Sil"}
          </CButton>
          <CButton
            color="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={loading}
          >
            İptal
          </CButton>
        </CModalFooter>
      </CModal>

      <ErrorBoundary>
        <CustomerModal
          visible={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={(data) => {
            fetchCustomers(data.id);
            setShowUpdateModal(false);
          }}
          customer={selectedCustomer}
          addToast={addToast}
        />
      </ErrorBoundary>
    </>
  );
};

export default CustomerTable;