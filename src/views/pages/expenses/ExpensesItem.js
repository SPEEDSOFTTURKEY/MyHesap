import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormInput,
  CFormSelect,
  CFormLabel,
  CSpinner,
  CForm,
  CToaster,
  CToast,
  CToastHeader,
  CToastBody,
} from "@coreui/react";
import { useNavigate } from "react-router-dom";
import CIcon from "@coreui/icons-react";
import { cilPlus, cilPencil } from "@coreui/icons";
import api from "../../../api/api";
const API_BASE_URL = "https://localhost:44375/api";

// CoreUI renk paleti (alt kategoriler için)
const coreuiColors = [
  "primary",
  "info",
  "success",
  "warning",
  "danger",
  "secondary",
  "light",
  "dark",
];

const ExpensesItem = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");
  const [formData, setFormData] = useState({
    adi: "",
    masrafAnaKategoriId: "",
    kullaniciId: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const toaster = useRef();

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

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-get-all`,
      );
      console.log("Ana Kategoriler API response (masrafAnaKategori-get-all):", data);
      setCategories(data);
    } catch (error) {
      console.error(
        "Ana kategoriler çekilirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Ana kategoriler yüklenirken hata oluştu.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubCategories = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(
        `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-get-all`,
      );
      console.log("Alt Kategoriler API response (masrafAltKategori-get-all):", data);
      setSubCategories(data);
    } catch (error) {
      console.error(
        "Alt kategoriler çekilirken hata:",
        error.response?.data || error.message,
      );
      setToast({
        message: "Alt kategoriler yüklenirken hata oluştu.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
  }, []);

  const checkDuplicateName = (name, type, currentId) => {
    if (type === "category") {
      return categories.some(
        (cat) =>
          cat.adi.toLowerCase() === name.toLowerCase() && cat.id !== currentId,
      );
    }
    return subCategories.some(
      (sub) =>
        sub.adi.toLowerCase() === name.toLowerCase() && sub.id !== currentId,
    );
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setModalType("category");
    setFormData({ 
      adi: category.adi, 
      masrafAnaKategoriId: "", 
      kullaniciId: getUserId() 
    });
    setShowModal(true);
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory);
    setModalType("subCategory");
    setFormData({
      adi: subCategory.adi,
      masrafAnaKategoriId: subCategory.masrafAnaKategoriId?.toString() || "",
      kullaniciId: getUserId(),
    });
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = getUserId();
    if (!userId) {
      setToast({
        message: "Geçerli bir kullanıcı oturumu bulunamadı.",
        color: "danger",
      });
      return;
    }
    
    setIsLoading(true);

    const currentId =
      modalType === "category" ? selectedCategory?.id : selectedSubCategory?.id;
    if (checkDuplicateName(formData.adi, modalType, currentId)) {
      setToast({
        message: `Bu isimde bir ${modalType === "category" ? "ana kategori" : "alt kategori"} zaten mevcut!`,
        color: "danger",
      });
      setIsLoading(false);
      return;
    }

    try {
      if (modalType === "category") {
        const payload = {
          id: selectedCategory?.id || 0,
          adi: formData.adi,
          eklenmeTarihi: new Date().toISOString(),
          guncellenmeTarihi: new Date().toISOString(),
          kullaniciId: userId,
        };
        console.log("Ana Kategori payload:", payload);
        
        if (selectedCategory?.id) {
          const response = await api.put(
            `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-update`,
            payload,
            {
              headers: { "Content-Type": "application/json", accept: "*/*" },
            },
          );
          console.log("Ana Kategori update API response:", response.data);
        } else {
          const response = await api.post(
            `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-create`,
            payload,
            {
              headers: { "Content-Type": "application/json", accept: "*/*" },
            },
          );
          console.log("Ana Kategori create API response:", response.data);
        }
        await fetchCategories();
        setToast({
          message: `${formData.adi} ana kategorisi başarıyla ${selectedCategory?.id ? "güncellendi" : "eklendi"}.`,
          color: "success",
        });
      } else {
        const payload = {
          id: selectedSubCategory?.id || 0,
          adi: formData.adi,
          masrafAnaKategoriId: parseInt(formData.masrafAnaKategoriId),
          eklenmeTarihi: new Date().toISOString(),
          guncellenmeTarihi: new Date().toISOString(),
          kullaniciId: userId,
        };
        console.log("Alt Kategori payload:", payload);
        
        if (selectedSubCategory?.id) {
          const response = await api.put(
            `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-update`,
            payload,
            {
              headers: { "Content-Type": "application/json", accept: "*/*" },
            },
          );
          console.log("Alt Kategori update API response:", response.data);
        } else {
          const response = await api.post(
            `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-create`,
            payload,
            {
              headers: { "Content-Type": "application/json", accept: "*/*" },
            },
          );
          console.log("Alt Kategori create API response:", response.data);
        }
        await fetchSubCategories();
        setToast({
          message: `${formData.adi} alt kategorisi başarıyla ${selectedSubCategory?.id ? "güncellendi" : "eklendi"}.`,
          color: "success",
        });
      }
      setShowModal(false);
      setFormData({ adi: "", masrafAnaKategoriId: "", kullaniciId: userId });
    } catch (error) {
      console.error(
        `${modalType} kaydedilirken hata:`,
        error.response?.data || error.message,
      );
      setToast({
        message: `${modalType === "category" ? "Ana kategori" : "Alt kategori"} kaydedilirken hata: ${error.response?.data?.message || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const userId = getUserId();
    if (!userId) {
      setToast({
        message: "Geçerli bir kullanıcı oturumu bulunamadı.",
        color: "danger",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      if (modalType === "category" && selectedCategory?.id) {
        console.log("Ana Kategori silme isteği: ID =", selectedCategory.id, "Kullanıcı ID =", userId);
        const response = await api.delete(
          `${API_BASE_URL}/masrafAnaKategori/masrafAnaKategori-delete/${selectedCategory.id}?kullaniciId=${userId}`,
          {
            headers: { accept: "*/*" },
          },
        );
        console.log("Ana Kategori delete API response:", response.data);
        await fetchCategories();
        setToast({
          message: `${selectedCategory.adi} ana kategorisi silindi.`,
          color: "success",
        });
      } else if (modalType === "subCategory" && selectedSubCategory?.id) {
        console.log("Alt Kategori silme isteği: ID =", selectedSubCategory.id, "Kullanıcı ID =", userId);
        const response = await api.delete(
          `${API_BASE_URL}/masrafAltKategori/masrafAltKategori-delete/${selectedSubCategory.id}?kullaniciId=${userId}`,
          {
            headers: { accept: "*/*" },
          },
        );
        console.log("Alt Kategori delete API response:", response.data);
        await fetchSubCategories();
        setToast({
          message: `${selectedSubCategory.adi} alt kategorisi silindi.`,
          color: "success",
        });
      }
      setShowModal(false);
    } catch (error) {
      console.error(
        `${modalType} silinirken hata:`,
        error.response?.data || error.message,
      );
      setToast({
        message: `${modalType === "category" ? "Ana kategori" : "Alt kategori"} silinirken hata: ${error.response?.data?.message || error.message}`,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CToaster ref={toaster} placement="top-end" className="p-3">
        {toast && (
          <CToast
            autohide={5000}
            visible={!!toast}
            color={toast.color}
            className="text-white shadow-lg"
            onClose={() => setToast(null)}
          >
            <CToastHeader closeButton={{ label: "Kapat" }}>
              <strong className="me-auto">Bildirim</strong>
            </CToastHeader>
            <CToastBody>{toast.message}</CToastBody>
          </CToast>
        )}
      </CToaster>
      {isLoading && <CSpinner color="primary" />}
      <style>
        {`
          @media (prefers-color-scheme: dark) {
            .category-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color-dark) !important;
            }
            .category-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .new-subcategory-button {
              background-color: #E88B22 !important;
              color: #FFFFFF !important;
              border: none !important;
            }
            .new-subcategory-button:hover {
              background-color: #EB9E3E !important;
            }
          }
          @media (prefers-color-scheme: light) {
            .category-card-body {
              background-color: var(--cui-light) !important;
              color: var(--cui-body-color) !important;
            }
            .category-header {
              background-color: #2965A8 !important;
              color: #FFFFFF !important;
            }
            .new-subcategory-button {
              background-color: #E88B22 !important;
              color: #333333 !important;
              border: none !important;
            }
            .new-subcategory-button:hover {
              background-color: #EB9E3E !important;
            }
          }
          .edit-button:hover {
            background-color: rgba(255, 255, 255, 0.2) !important;
          }
        `}
      </style>
      <div className="mb-3">
        <CButton
          color="danger"
          className="text-light mx-2"
          onClick={() => navigate("/app/new-expense")}
        >
          <CIcon icon={cilPlus} /> Yeni Masraf Gir
        </CButton>
        <CButton
          color="success"
          className="text-light"
          onClick={() => {
            setModalType("category");
            setSelectedCategory(null);
            setFormData({ 
              adi: "", 
              masrafAnaKategoriId: "", 
              kullaniciId: getUserId() 
            });
            setShowModal(true);
          }}
        >
          <CIcon icon={cilPlus} /> Yeni Ana Kategori Ekle
        </CButton>
        <CButton
          className="new-subcategory-button text-light mx-2"
          onClick={() => {
            setModalType("subCategory");
            setSelectedSubCategory(null);
            setFormData({
              adi: "",
              masrafAnaKategoriId: categories[0]?.id?.toString() || "",
              kullaniciId: getUserId(),
            });
            setShowModal(true);
          }}
          disabled={categories.length === 0}
        >
          <CIcon icon={cilPlus} /> Yeni Alt Kategori Ekle
        </CButton>
      </div>
      <CRow xs={{ gutter: 5 }}>
        {categories.map((category) => {
          const categorySubCategories = subCategories.filter(
            (sub) => sub.masrafAnaKategoriId === category.id,
          );
          return (
            <CCol sm={6} xl={6} xxl={6} key={category.id}>
              <CCard>
                <CCardHeader className="category-header">
                  {category.adi.toUpperCase()}
                  <CButton
                    color="transparent"
                    size="sm"
                    className="float-end p-0 edit-button"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <CIcon icon={cilPencil} size="sm" className="text-white" />
                  </CButton>
                </CCardHeader>
                <CCardBody className="category-card-body">
                  <div className="d-flex flex-wrap gap-2">
                    {categorySubCategories.map((subCategory, subIndex) => (
                      <CButton
                        key={subCategory.id}
                        color={coreuiColors[subIndex % coreuiColors.length]}
                        size="sm"
                        className="text-start px-2 py-1"
                        onClick={() => handleSubCategoryClick(subCategory)}
                      >
                        {subCategory.adi}
                      </CButton>
                    ))}
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          );
        })}
      </CRow>
      <CModal
        visible={showModal}
        backdrop="static"
        keyboard={false}
        onClose={() => setShowModal(false)}
      >
        <CModalHeader>
          <CModalTitle>
            {modalType === "category" ? "Ana Kategori" : "Alt Kategori"}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            {modalType === "subCategory" && (
              <div className="mb-3">
                <CFormLabel htmlFor="masrafAnaKategoriId">
                  Ana Kategori Seç
                </CFormLabel>
                <CFormSelect
                  id="masrafAnaKategoriId"
                  name="masrafAnaKategoriId"
                  value={formData.masrafAnaKategoriId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Seçiniz</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.adi}
                    </option>
                  ))}
                </CFormSelect>
              </div>
            )}
            <CFormLabel htmlFor="adi">
              {modalType === "category" ? "Kategori Adı" : "Alt Kategori Adı"}
            </CFormLabel>
            <CFormInput
              id="adi"
              name="adi"
              value={formData.adi}
              onChange={handleInputChange}
              placeholder={
                modalType === "category"
                  ? "Kategori adını girin"
                  : "Alt kategori adını girin"
              }
              required
            />
          </CModalBody>
          <CModalFooter>
            {(selectedCategory?.id || selectedSubCategory?.id) && (
              <CButton
                color="danger"
                style={{ color: "white" }}
                onClick={handleDelete}
                disabled={isLoading}
              >
                Sil
              </CButton>
            )}
            <CButton type="submit" color="primary" disabled={isLoading}>
              {isLoading ? <CSpinner size="sm" /> : "Kaydet"}
            </CButton>
            <CButton
              color="secondary"
              onClick={() => setShowModal(false)}
              disabled={isLoading}
            >
              İptal
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  );
};

export default ExpensesItem;