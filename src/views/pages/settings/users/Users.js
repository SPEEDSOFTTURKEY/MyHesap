import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CRow,
  CCol,
  CToaster,
  CToast,
  CToastBody,
  CToastHeader,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilReload, cilUser } from "@coreui/icons"; // cilTrash kaldırıldı
import { useUser } from "../../../../context/UserContext";
import api from "../../../../api/api";
const API_BASE_URL = "https://speedsofttest.com/api";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const { user: currentUser } = useUser();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`${API_BASE_URL}/kullanicilar/kullanicilar-get-all`);
      console.log("API Response:", response.data);
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];
      setUsers(data);
      setError(null);
    } catch (err) {
      const errorMessage = err.response
        ? `Durum: ${err.response.status}, Mesaj: ${err.response.data?.message || err.message}`
        : err.message;
      setError("Kullanıcılar alınamadı: " + errorMessage);
      console.log("Error Details:", errorMessage);
      addToast("Kullanıcılar yüklenemedi", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    if (currentUser?.yetkiId !== 1) {
      addToast("Kullanıcı silme yetkiniz yok", "error");
      return;
    }
    const user = users.find((u) => u.id === id);
    if (!user) {
      addToast("Kullanıcı bulunamadı", "error");
      return;
    }
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete?.id) {
      addToast("Kullanıcı ID'si eksik", "error");
      setShowDeleteModal(false);
      setUserToDelete(null);
      return;
    }
    try {
      await api.delete(`${API_BASE_URL}/kullanicilar/kullanicilar-delete/${userToDelete.id}`);
      addToast("Kullanıcı başarıyla silindi");
      await fetchUsers();
    } catch (err) {
      const errorMessage = err.response
        ? err.response.data?.message || err.message
        : err.message;
      addToast(`Kullanıcı silinirken hata oluştu: ${errorMessage}`, "error");
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const addToast = (message, type = "success") => {
    const id = Date.now();
    const toast = (
      <CToast
        key={id}
        autohide={true}
        visible={true}
        delay={5000}
        className={
          type === "error" ? "bg-danger text-white" : "bg-success text-white"
        }
      >
        <CToastHeader closeButton>
          <strong className="me-auto">
            {type === "error" ? "Hata" : "Başarılı"}
          </strong>
        </CToastHeader>
        <CToastBody>{message}</CToastBody>
      </CToast>
    );
    setToasts((prevToasts) => [...prevToasts, toast]);
    return id;
  };

  useEffect(() => {
    fetchUsers();
    console.log("Users Data:", users);
  }, []);

  const handleRowClick = (user) => {
    if (currentUser?.yetkiId !== 1 && currentUser?.id !== user.id) {
      addToast("Başka kullanıcıyı görüntüleme/düzenleme yetkiniz yok", "error");
      return;
    }
    if (!user.id) {
      addToast("Kullanıcı ID'si bulunamadı", "error");
      console.error("Users - Invalid user ID:", user);
      return;
    }
    navigate(`/app/user-detail/${user.id}`, { state: { user } });
  };

  const handleNewUser = () => {
    if (currentUser?.yetkiId !== 1) {
      addToast("Yeni kullanıcı ekleme yetkiniz yok", "error");
      return;
    }
    navigate("/app/user-detail/new", { state: { user: null } });
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>
      <div className="d-flex gap-2 mb-3">
        {/* <CButton
          color="success"
          className="text-light"
          onClick={handleNewUser}
          disabled={currentUser?.yetkiId !== 1}
        >
          <CIcon icon={cilPlus} size="m" /> Yeni Kullanıcı Ekle
        </CButton> */}
        <CButton
          color="primary"
          className="text-light"
          onClick={fetchUsers}
          disabled={loading}
        >
          <CIcon icon={cilReload} size="m" /> Kullanıcıları Yenile
        </CButton>
      </div>

      {loading && (
        <CCard className="mb-3">
          <CCardBody>Yükleniyor...</CCardBody>
        </CCard>
      )}

      {error && (
        <CCard className="mt-3">
          <CCardHeader>Hata</CCardHeader>
          <CCardBody>
            <p>{error}</p>
            <CButton color="primary" onClick={fetchUsers}>
              Tekrar Dene
            </CButton>
          </CCardBody>
        </CCard>
      )}

      <CCard className="my-3">
        <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
            fontWeight: "bold",
          }}
          size="xl"
        >
          <div className="d-flex justify-content-between align-items-center w-100">
            <span>Kullanıcı Kartları</span>
            <div
              style={{
                backgroundColor: "#FFFFFF",
                color: "#2965A8",
                padding: "5px 10px",
                borderRadius: "4px",
                fontWeight: "bold",
                fontSize: "14px",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              Toplam Kullanıcı: {users.length}
            </div>
          </div>
        </CCardHeader>
        <CCardBody>
          <p>
            Bir kullanıcıya tıklayarak detaylarını görüntüleyebilir veya
            düzenleyebilirsiniz.
          </p>
          {users.length > 0 ? (
            <CRow>
              {users
                .filter(user => {
                  const aktifMi = Number(user?.aktiflikDurumu) === 1 || Number(user?.aktif) === 1;
                  const adiSoyadiVarMi = !!user?.adiSoyadi && user.adiSoyadi.trim().length > 0;
                  const emailVarMi = !!user?.email && user.email.trim().length > 0;
                  console.log("Filtreleme kontrolü:", { user, aktifMi, adiSoyadiVarMi, emailVarMi });
                  return aktifMi && adiSoyadiVarMi && emailVarMi;
                })
                .map((user, index) => {
                  const adiSoyadi = user.adiSoyadi.trim();
                  const email = user.email.trim();
                  const fotograf = user.fotograf?.trim();
                  console.log("📌 Filtre sonrası kart verisi:", user);

                  return (
                    <CCol md={4} key={user.id || index} className="mb-3">
                      <CCard
                        className="h-100 shadow-sm"
                        style={{
                          cursor: "pointer",
                          transition: "background-color 0.2s, transform 0.2s",
                        }}
                        onClick={() => handleRowClick(user)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f8f9fa";
                          e.currentTarget.style.transform = "scale(1.02)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "white";
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <CCardBody className="d-flex align-items-center">
                          <div
                            style={{
                              width: "60px",
                              height: "60px",
                              borderRadius: "50%",
                              overflow: "hidden",
                              marginRight: "15px",
                              backgroundColor: "#e9ecef",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {fotograf ? (
                              <img
                                src={fotograf}
                                alt="User Profile"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => (e.target.src = "")}
                              />
                            ) : (
                              <CIcon icon={cilUser} size="xl" />
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <h6 className="mb-0">{adiSoyadi}</h6>
                            <p className="mb-0 text-muted">{email}</p>
                          </div>
                        </CCardBody>
                      </CCard>
                    </CCol>
                  );
                })}
            </CRow>
          ) : (
            <p>Kullanıcı bulunamadı.</p>
          )}
        </CCardBody>
      </CCard>
      <CModal
        visible={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setUserToDelete(null);
        }}
        className="shadow-sm"
        backdrop="static"
      >
        <CModalHeader
          style={{
            backgroundColor: "#dc3545",
            color: "#FFFFFF",
            borderBottom: "2px solid #ffffff",
          }}
        >
          <CModalTitle>Silme Onayı</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Kullanıcı "
            <strong>{userToDelete?.adiSoyadi || "Bilinmeyen Kullanıcı"}</strong>
            " silinecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setUserToDelete(null);
            }}
          >
            İptal
          </CButton>
          <CButton
            color="danger"
            onClick={confirmDelete}
            className="text-white"
          >
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default Users;

