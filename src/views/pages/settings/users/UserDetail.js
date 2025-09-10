import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSwitch,
  CRow,
  CToast,
  CToastBody,
  CToaster,
  CFormSelect,
  CToastHeader,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from "@coreui/react";
import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import { cilSave, cilTrash, cilX } from "@coreui/icons";
import { useUser } from "../../../../context/UserContext";
import api from "../../../../api/api";
import { IMaskInput } from "react-imask";
const API_BASE_URL = "https://localhost:44375/api";

const UserDetail = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { id } = useParams();
  const { user: currentUser } = useUser();
  const [formData, setFormData] = useState({
    id: state?.user?.id || 0,
    adiSoyadi: state?.user?.adiSoyadi || "",
    email: state?.user?.email || "",
    telefon: state?.user?.telefon || "",
    aktiflikDurumu: state?.user?.aktiflikDurumu ?? 1,
    yetkiId: state?.user?.yetkiId || 0,
    sifre: "",
    lisansAnahtari: state?.user?.lisansAnahtari || "",
    eklenmeTarihi: state?.user?.eklenmeTarihi || new Date().toISOString(),
    guncellenmeTarihi:
      state?.user?.guncellenmeTarihi || new Date().toISOString(),
    altSayfaIds: state?.user?.altSayfaIds || [],
    fotograf: null,
  });
  const [toasts, setToasts] = useState([]);
  const toaster = useRef();
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    console.log("UserDetail - Current User:", currentUser);
    console.log("UserDetail - State User:", state?.user);
    if (id && id !== "new") {
      const fetchUserDetails = async () => {
        setLoading(true);
        try {
          const response = await api.get(
            `${API_BASE_URL}/kullanicilar/kullanicilar-get-by-Id/${id}`
          );
          const userData = response.data;
          console.log("Fetched User Data:", userData);
          setFormData({
            id: userData.id || 0,
            adiSoyadi: userData.adiSoyadi || "",
            email: userData.email || "",
            telefon: userData.telefon || "",
            aktiflikDurumu: userData.aktiflikDurumu ?? 1,
            yetkiId: userData.yetkiId || 0,
            sifre: "",
            lisansAnahtari: userData.lisansAnahtari || "",
            eklenmeTarihi: userData.eklenmeTarihi || new Date().toISOString(),
            guncellenmeTarihi:
              userData.guncellenmeTarihi || new Date().toISOString(),
            altSayfaIds: userData.altSayfaIds || [],
            fotograf: null,
          });
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            err.response?.data?.errors?.join(", ") ||
            err.message;
          console.error("Fetch User Error:", err, err.response?.data);
          addToast(`Kullanıcı bilgileri alınamadı: ${errorMessage}`, "error");
          navigate("/app/users");
        } finally {
          setLoading(false);
        }
      };
      fetchUserDetails();
    }
  }, [id, navigate, state]);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, fotograf: file }));
  };

  const handleToggleChange = () => {
    setFormData((prev) => ({
      ...prev,
      aktiflikDurumu: prev.aktiflikDurumu === 1 ? 0 : 1,
    }));
  };

  const handleAltSayfaChange = (e) => {
    const options = Array.from(e.target.selectedOptions).map((option) =>
      Number(option.value)
    );
    setFormData((prev) => ({ ...prev, altSayfaIds: options }));
  };

  const validateForm = () => {
    if (!formData.adiSoyadi.trim()) return "İsim ve Soyisim zorunludur";
    if (!formData.email.trim()) return "E-posta zorunludur";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      return "Geçerli bir e-posta adresi girin";
    if (!formData.id && !formData.sifre.trim()) return "Şifre zorunludur";
    if (formData.yetkiId === 0) return "Yetki Seviyesi seçilmelidir";
    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!currentUser || currentUser?.yetkiId !== 1) {
      addToast("Yeni kullanıcı ekleme yetkiniz yok", "error");
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      addToast(validationError, "error");
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("AdiSoyadi", formData.adiSoyadi);
      formDataPayload.append("Email", formData.email);
      formDataPayload.append("Telefon", formData.telefon || "");
      formDataPayload.append(
        "AktiflikDurumu",
        formData.aktiflikDurumu.toString()
      );
      formDataPayload.append("YetkiId", formData.yetkiId.toString());
      formDataPayload.append("Sifre", formData.sifre);
      formDataPayload.append("LisansAnahtari", formData.lisansAnahtari || "");
      formDataPayload.append("EklenmeTarihi", new Date().toISOString());
      formDataPayload.append("GuncellenmeTarihi", new Date().toISOString());
      if (formData.fotograf) {
        formDataPayload.append("Fotograf", formData.fotograf);
      }
      formData.altSayfaIds.forEach((id, index) => {
        formDataPayload.append(`AltSayfaIds[${index}]`, id.toString());
      });

      console.log("Register Payload:", Object.fromEntries(formDataPayload));
      const response = await api.post(
        `${API_BASE_URL}/kullanicilar/kullanicilar-create`,
        formDataPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Register Response:", response.data);
      addToast(response.data.message || "Kayıt başarılı");
      navigate("/app/users");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        err.message;
      console.error("Register Error:", err, err.response?.data);
      addToast(`Kayıt başarısız: ${errorMessage}`, "error");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (
      !currentUser ||
      (currentUser?.yetkiId !== 1 && currentUser?.id !== parseInt(id))
    ) {
      addToast("Başka kullanıcıyı düzenleme yetkiniz yok", "error");
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      addToast(validationError, "error");
      return;
    }

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("Id", formData.id.toString());
      formDataPayload.append("AdiSoyadi", formData.adiSoyadi);
      formDataPayload.append("Email", formData.email);
      formDataPayload.append("Telefon", formData.telefon || "");
      formDataPayload.append(
        "AktiflikDurumu",
        formData.aktiflikDurumu.toString()
      );
      formDataPayload.append("YetkiId", formData.yetkiId.toString());
      if (formData.sifre) formDataPayload.append("Sifre", formData.sifre);
      formDataPayload.append("LisansAnahtari", formData.lisansAnahtari || "");
      formDataPayload.append("EklenmeTarihi", formData.eklenmeTarihi);
      formDataPayload.append("GuncellenmeTarihi", new Date().toISOString());
      if (formData.fotograf)
        formDataPayload.append("Fotograf", formData.fotograf);
      formData.altSayfaIds.forEach((id, index) => {
        formDataPayload.append(`AltSayfaIds[${index}]`, id.toString());
      });

      console.log("Update Payload:", Object.fromEntries(formDataPayload));
      const response = await api.put(
        `${API_BASE_URL}/kullanicilar/kullanicilar-update`,
        formDataPayload,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log("Update Response:", response.data);
      addToast(response.data.message || "Kullanıcı başarıyla güncellendi");
      navigate("/app/users");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        err.message;
      console.error("Update Error:", err, err.response?.data);
      addToast(`Güncelleme başarısız: ${errorMessage}`, "error");
    }
  };

  const handleDelete = async () => {
    if (!currentUser || currentUser?.yetkiId !== 1) {
      addToast("Kullanıcı silme yetkiniz yok", "error");
      return;
    }
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    if (!id) {
      addToast("Kullanıcı ID'si eksik", "error");
      return;
    }
    try {
      const response = await api.delete(
        `${API_BASE_URL}/kullanicilar/kullanicilar-delete/${id}`
      );
      console.log("Delete Response:", response.data);
      addToast(response.data.message || "Kullanıcı başarıyla silindi");
      navigate("/app/users");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        err.message;
      console.error("Delete Error:", err, err.response?.data);
      addToast(`Silme başarısız: ${errorMessage}`, "error");
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const yetkiOptions = [
    { value: 0, label: "Seçiniz" },
    { value: 1, label: "Yönetici" },
    { value: 2, label: "Kullanıcı" },
    { value: 3, label: "Misafir" },
  ];

  const altSayfaOptions = [
    { value: 1, label: "Sayfa 1" },
    { value: 2, label: "Sayfa 2" },
    { value: 3, label: "Sayfa 3" },
  ];

  if (loading) {
    return (
      <CCard className="my-3">
        <CCardBody>Yükleniyor...</CCardBody>
      </CCard>
    );
  }

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toasts.map((toast) => toast)}
      </CToaster>

      <div className="d-flex gap-2 mb-3">
        <CButton
          type="submit"
          className="fs-6"
          style={{ width: "150px", color: "white", backgroundColor: "#1D9030" }}
          onClick={formData.id ? handleUpdate : handleRegister}
        >
          <CIcon icon={cilSave} /> Kaydet
        </CButton>
        {formData.id && (
          <CButton
            color="danger"
            className="fs-6"
            style={{ width: "150px", color: "white" }}
            onClick={handleDelete}
          >
            <CIcon icon={cilTrash} /> Sil
          </CButton>
        )}
        <CButton
          color="secondary"
          className="fs-6"
          style={{ width: "150px" }}
          onClick={() => navigate("/app/users")}
        >
          <CIcon icon={cilX} /> İptal
        </CButton>
      </div>
      <CCard className="my-3">
        {/* <CCardHeader
          style={{
            backgroundColor: "#2965A8",
            color: "#FFFFFF",
            fontSize: "large",
          }}
        >
          {formData.id
            ? `Kullanıcıyı Düzenle (ID: ${formData.id})`
            : "Yeni Kullanıcı Ekle"}
        </CCardHeader> */}
        <CCardBody>
          <CForm onSubmit={formData.id ? handleUpdate : handleRegister}>
            {/* <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fs-6">Kullanıcı ID</CFormLabel>
                <CFormInput
                  name="id"
                  value={formData.id || "Yeni Kullanıcı"}
                  disabled
                />
              </CCol>
            </CRow> */}
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fs-6">İsim ve Soyisim</CFormLabel>
                <CFormInput
                  name="adiSoyadi"
                  value={formData.adiSoyadi}
                  onChange={handleInputChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fs-6">E-posta</CFormLabel>
                <CFormInput
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fs-6">Cep Telefonu</CFormLabel>
                <IMaskInput
                  mask="(500) 000 00 00"
                  value={formData.telefon}
                  onAccept={(value) =>
                    handleInputChange({ target: { name: "telefon", value } })
                  }
                  placeholder="(5XX) XXX XX XX"
                  className="form-control mb-3"
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fs-6">
                  Şifre {formData.id ? "(Değiştirmek için doldurun)" : ""}
                </CFormLabel>
                <CFormInput
                  type="password"
                  name="sifre"
                  value={formData.sifre}
                  onChange={handleInputChange}
                  required={!formData.id}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fs-6">Lisans Anahtarı</CFormLabel>
                <CFormInput
                  name="lisansAnahtari"
                  value={formData.lisansAnahtari}
                  onChange={handleInputChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fs-6">Profil Fotoğrafı</CFormLabel>
                <CFormInput
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {formData.fotograf && (
                  <img
                    src={URL.createObjectURL(formData.fotograf)}
                    alt="Profil Önizleme"
                    style={{ maxWidth: "100px", marginTop: "10px" }}
                  />
                )}
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                {/* <CFormLabel className="fs-6">Yetki Seviyesi</CFormLabel>
                <CFormSelect
                  name="yetkiId"
                  value={formData.yetkiId}
                  onChange={handleInputChange}
                  required
                >
                  {yetkiOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect> */}
              </CCol>
              {/* <CCol md={6}>
                <CFormLabel className="fs-6">Alt Sayfalar</CFormLabel>
                <CFormSelect
                  multiple
                  name="altSayfaIds"
                  value={formData.altSayfaIds}
                  onChange={handleAltSayfaChange}
                >
                  {altSayfaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol> */}
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel className="fs-6">Aktif Durum</CFormLabel>
                <CFormSwitch
                  id="aktiflikDurumu"
                  checked={formData.aktiflikDurumu === 1}
                  onChange={handleToggleChange}
                />
              </CCol>
            </CRow>
          </CForm>
        </CCardBody>
      </CCard>

      <CModal
        visible={showDeleteModal}
        onClose={cancelDelete}
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
            Kullanıcı "<strong>{formData.adiSoyadi || "Bilinmeyen Kullanıcı"}</strong>" silinecek, emin misiniz? Bu işlem geri alınamaz.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={cancelDelete}>
            İptal
          </CButton>
          <CButton color="danger" className="text-white" onClick={confirmDelete}>
            Sil
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  );
};

export default UserDetail;